/**
 * 涂鸦过山车 —— 引擎
 *
 * 负责状态机（画线 → 待发车 → 骑行 → 完成）、手绘的指针事件、主循环、
 * 以及把 2D 侧视图 / 3D 第一人称 / 迷你地图 / 音效串联起来。
 * 界面文案与按钮交给 Vue 组件，这里只通过回调抛出状态。
 *
 * 参考玩法：https://rakugaki-coaster.pages.dev
 */
import {
  GROUND_PX,
  PX_PER_M,
  UNIT,
  buildControl,
  buildDepth,
  buildExt,
  buildTrack,
  decode,
  encode,
  plen,
} from './geometry'
import { HOLD, newRide, stepRideBy } from './ride'
import { Scene2D } from './scene2d'
import { Scene3D } from './scene3d'
import { AudioKit } from './audio'

export class CoasterEngine {
  constructor(opts = {}) {
    this.canvas = opts.canvas2d
    this.miniCanvas = opts.miniCanvas || null
    this.onState = opts.onState || (() => {})
    this.onToast = opts.onToast || (() => {})
    this.onFinish = opts.onFinish || (() => {})
    this.onShared = opts.onShared || (() => {})

    this.scene2d = new Scene2D(this.canvas)
    this.scene3d = new Scene3D(opts.canvas3d)
    this.audio = new AudioKit()

    this.W = 0
    this.H = 0
    this.DPR = 1
    this.view = { s: PX_PER_M, ox: 0, oy: 0 }
    this.baseView = null
    this.groundY = 0
    this.mode = 'draw' // draw | drawing | ready | ride | done | shared
    this.raw = []
    this.pid = null
    this.ctrl = null
    this.track = null
    this.ride = null
    this.code = ''
    this.codeKey = 't'
    this.fitted = false
    this.pov3d = false
    this.showMini = true
    this.showRails = true
    this.showPosts = true
    this.clickT = 0
    this.last = 0
    this.raf = 0
    this.destroyed = false
    this.timers = []

    this._onDown = (e) => this.handleDown(e)
    this._onMove = (e) => this.handleMove(e)
    this._onUp = (e) => this.handleUp(e)
    this.canvas.addEventListener('pointerdown', this._onDown)
    this.canvas.addEventListener('pointermove', this._onMove)
    this.canvas.addEventListener('pointerup', this._onUp)
    this.canvas.addEventListener('pointercancel', this._onUp)

    this.loop = this.loop.bind(this)
    this.resize()
    this.emit()
    this.raf = requestAnimationFrame(this.loop)
  }

  /* ---------- 尺寸 ---------- */
  resize() {
    // 量容器的尺寸：canvas 由 CSS 铺满，避免自己写死宽高后又量到自己
    const host = this.canvas.parentElement || this.canvas
    const rect = host.getBoundingClientRect()
    const W = Math.max(1, Math.round(rect.width))
    const H = Math.max(1, Math.round(rect.height))
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    this.W = W
    this.H = H
    this.DPR = dpr
    if (!this.track && this.mode !== 'drawing') {
      this.view = { s: PX_PER_M, ox: 0, oy: 0 }
      this.groundY = (H - GROUND_PX) / PX_PER_M
    } else if (this.track && (this.fitted || this.mode === 'shared')) {
      this.fitView()
      this.baseView = { ...this.view }
    }
    this.scene2d.resize(W, H, dpr, this)
    this.scene3d.resize(W, H)
  }

  toScreen(x, y) {
    return [x * this.view.s + this.view.ox, y * this.view.s + this.view.oy]
  }

  toWorld(e) {
    const r = this.canvas.getBoundingClientRect()
    return {
      x: (e.clientX - r.left - this.view.ox) / this.view.s,
      y: (e.clientY - r.top - this.view.oy) / this.view.s,
    }
  }

  /* ---------- 手绘 ---------- */
  handleDown(e) {
    if (this.mode !== 'draw' || this.pid !== null) return
    this.audio.init()
    this.pid = e.pointerId
    this.mode = 'drawing'
    try {
      this.canvas.setPointerCapture(this.pid)
    } catch (err) {
      /* ignore */
    }
    const p = this.toWorld(e)
    p.y = Math.min(p.y, this.groundY - 1.2)
    this.raw = [p]
    this.emit()
  }

  handleMove(e) {
    if (this.mode !== 'drawing' || e.pointerId !== this.pid) return
    const evs = e.getCoalescedEvents ? e.getCoalescedEvents() : [e]
    const list = evs && evs.length ? evs : [e]
    for (const ev of list) {
      const p = this.toWorld(ev)
      p.y = Math.min(p.y, this.groundY - 1.2)
      const l = this.raw[this.raw.length - 1]
      if (!l || Math.hypot(p.x - l.x, p.y - l.y) >= 0.2) this.raw.push(p)
    }
  }

  handleUp(e) {
    if (e.pointerId !== this.pid) return
    this.pid = null
    if (this.mode === 'drawing') this.finishDraw()
  }

  finishDraw() {
    if (this.raw.length < 3 || plen(this.raw) < 25) {
      this.onToast('太短啦，再画长一点～')
      this.resetDraw()
      return
    }
    const c = buildControl(this.raw, this.groundY)
    this.code = encode(c, this.groundY)
    this.codeKey = 't'
    this.loadCode(this.code, false, UNIT, c[0])
    this.baseView = { ...this.view }
    this.enterReady()
  }

  enterReady() {
    this.mode = 'ready'
    this.ride = newRide()
    this.prepare3D()
    this.scene2d.buildBackdrop(this)
    this.emit()
  }

  prepare3D() {
    this.later(() => {
      try {
        if (!this.track) return
        if (!this.scene3d.init()) return
        this.scene3d.resize(this.W, this.H)
        if (this.scene3d.track !== this.track) this.scene3d.build(this.track, this.groundY)
        this.scene3d.setShow({ rails: this.showRails, posts: this.showPosts })
      } catch (err) {
        console.warn('[coaster] 3D 场景构建失败', err)
      }
    }, 80)
  }

  /* ---------- 轨道 ---------- */
  loadCode(code, shared, unit = UNIT, origin = null) {
    const { pts, ground } = decode(code, unit)
    if (shared) {
      this.ctrl = pts
      this.groundY = ground
    } else {
      const o = origin || this.raw[0]
      const q0 = [Math.round(o.x * unit) / unit, Math.round(o.y * unit) / unit]
      this.ctrl = pts.map((p) => ({ x: p.x + q0[0], y: p.y + q0[1] }))
      this.groundY = ground + q0[1]
    }
    this.track = buildTrack(this.ctrl)
    buildExt(this.track, this.groundY)
    buildDepth(this.track)
    this.scene2d.railCache = null
    this.scene2d.layer = null
    this.scene2d.miniCache = null
    if (shared) this.fitView()
    this.scene2d.buildBackdrop(this)
  }

  fitView() {
    let minX = Infinity
    let maxX = -Infinity
    let minY = Infinity
    for (const p of this.ctrl) {
      minX = Math.min(minX, p.x)
      maxX = Math.max(maxX, p.x)
      minY = Math.min(minY, p.y)
    }
    if (this.track && this.track.extB) {
      // 给站台里等客的列车留点地方
      const e = this.track.extB
      const j = Math.min(e.xs.length - 1, 40)
      minX = Math.min(minX, e.xs[j] + 2)
      maxX = Math.max(maxX, e.xs[j] - 2)
      minY = Math.min(minY, e.ys[j])
    }
    minY -= 5
    minX -= 4
    maxX += 6
    const top = 76
    const bottom = this.H - GROUND_PX
    const s = Math.max(2, Math.min(16, Math.min((this.W - 24) / (maxX - minX), (bottom - top) / (this.groundY - minY))))
    this.view = { s, ox: this.W / 2 - (s * (minX + maxX)) / 2, oy: bottom - s * this.groundY }
    this.fitted = true
  }

  /* ---------- 骑行 ---------- */
  setView3d(on) {
    if (on && !this.scene3d.init()) {
      this.onToast('这台浏览器显示不了 3D，先用侧面视角带你飞一圈')
      on = false
    }
    if (on) this.scene3d.resize(this.W, this.H)
    this.pov3d = on
    this.emit()
  }

  startRide() {
    if (!this.track) return
    this.audio.init()
    if (this.baseView && !this.fitted) {
      this.view = { ...this.baseView }
      this.scene2d.buildBackdrop(this)
    } else if (this.fitted) {
      this.fitView()
      this.scene2d.buildBackdrop(this)
    }
    this.ride = newRide()
    this.ride.hold = HOLD
    this.mode = 'ride'
    this.setView3d(true)
    const rr = this.ride
    this.later(() => {
      if (this.ride === rr && this.mode === 'ride') this.audio.chime()
    }, 450)
    this.emit()
  }

  finishRide() {
    if (this.mode !== 'ride') return
    this.mode = 'done'
    this.audio.brake()
    this.later(() => {
      if (this.mode === 'done') {
        this.emit()
        this.onFinish(this.state())
      }
    }, 900)
  }

  /* ---------- 重置 / 分享 ---------- */
  resetDraw() {
    this.raw = []
    this.ctrl = null
    this.track = null
    this.ride = null
    this.fitted = false
    this.baseView = null
    this.pid = null
    this.view = { s: PX_PER_M, ox: 0, oy: 0 }
    this.groundY = (this.H - GROUND_PX) / PX_PER_M
    this.mode = 'draw'
    this.pov3d = false
    this.scene2d.reset()
    this.scene2d.buildBackdrop(this)
    try {
      this.scene3d.disposeScene()
    } catch (err) {
      /* ignore */
    }
    this.emit()
    if (window.location.hash) window.history.replaceState(null, '', window.location.pathname + window.location.search)
  }

  /** 从 #t=... 读一条别人画的轨道 */
  loadShared(hash) {
    const m = /(?:^#|&)([ct])=([A-Za-z0-9_-]+)/.exec(hash || '')
    if (!m) return false
    try {
      this.codeKey = m[1]
      this.code = m[2]
      this.loadCode(this.code, true, this.codeKey === 'c' ? 10 : UNIT)
      this.baseView = { ...this.view }
      this.scene2d.buildBackdrop(this)
      this.mode = 'shared'
      this.ride = newRide()
      this.prepare3D()
      this.emit()
      this.onShared(this.state())
      return true
    } catch (err) {
      this.resetDraw()
      return false
    }
  }

  shareUrl() {
    if (!this.code) return ''
    return `${window.location.origin}${window.location.pathname}#${this.codeKey}=${this.code}`
  }

  /* ---------- 显示开关 ---------- */
  setMini(on) {
    this.showMini = on
    this.emit()
  }

  setRails(on) {
    this.showRails = on
    this.scene3d.setShow({ rails: on, posts: this.showPosts })
    this.emit()
  }

  setPosts(on) {
    this.showPosts = on
    this.scene3d.setShow({ rails: this.showRails, posts: on })
    this.emit()
  }

  setSound(on) {
    this.audio.setEnabled(on)
    this.emit()
  }

  get soundOn() {
    return this.audio.enabled
  }

  /* ---------- 存图：1200×630 的明信片 ---------- */
  saveImage() {
    if (!this.track) return
    const w = 1200
    const h = 630
    const c = document.createElement('canvas')
    c.width = w
    c.height = h
    const g = c.getContext('2d')
    const sky = g.createLinearGradient(0, 0, 0, h)
    sky.addColorStop(0, '#7cc3ee')
    sky.addColorStop(1, '#eaf6fb')
    g.fillStyle = sky
    g.fillRect(0, 0, w, h)
    let minX = Infinity
    let maxX = -Infinity
    let minY = Infinity
    for (const p of this.ctrl) {
      minX = Math.min(minX, p.x)
      maxX = Math.max(maxX, p.x)
      minY = Math.min(minY, p.y)
    }
    const area = { x: 60, y: 130, w: 1080, h: 420 }
    const gy0 = Math.max(this.groundY, minY + 5)
    const sc = Math.min(area.w / (maxX - minX + 8), area.h / (gy0 - minY + 6))
    const ox = area.x + area.w / 2 - (sc * (minX + maxX)) / 2
    const oy = area.y + area.h - sc * gy0
    g.fillStyle = '#6fbb5f'
    g.fillRect(0, oy + sc * gy0, w, h)
    const t = this.track
    g.strokeStyle = 'rgba(110,125,138,.75)'
    g.lineWidth = Math.max(1, 0.18 * sc)
    g.beginPath()
    for (let i = 0; i < t.n; i += 16) {
      const x = ox + t.xs[i] * sc
      const y = oy + t.ys[i] * sc
      g.moveTo(x, y)
      g.lineTo(x, oy + sc * gy0)
    }
    g.stroke()
    g.strokeStyle = '#d6342c'
    g.lineWidth = Math.max(3, 0.5 * sc)
    g.lineJoin = g.lineCap = 'round'
    g.beginPath()
    for (let i = 0; i < t.n; i++) {
      const x = ox + t.xs[i] * sc
      const y = oy + t.ys[i] * sc
      if (i) g.lineTo(x, y)
      else g.moveTo(x, y)
    }
    g.stroke()
    const font = getComputedStyle(document.body).fontFamily
    g.fillStyle = '#14202b'
    g.font = `900 46px ${font}`
    g.fillText('涂鸦过山车', 60, 86)
    g.fillStyle = 'rgba(20,32,43,.6)'
    g.font = `700 22px ${font}`
    g.fillText(`一笔记画出来的过山车 · 全长 ${Math.round(t.len)} 米`, 62, 120)
    const a = document.createElement('a')
    a.href = c.toDataURL('image/png')
    a.download = '涂鸦过山车.png'
    document.body.appendChild(a)
    a.click()
    a.remove()
  }

  /* ---------- 状态与主循环 ---------- */
  state() {
    return {
      mode: this.mode,
      hasTrack: !!this.track,
      pov3d: this.pov3d,
      showMini: this.showMini,
      showRails: this.showRails,
      showPosts: this.showPosts,
      soundOn: this.audio.enabled,
      trackLen: this.track ? Math.round(this.track.len) : 0,
      shareUrl: this.shareUrl(),
    }
  }

  emit() {
    this.onState(this.state())
  }

  loop(now) {
    if (this.destroyed) return
    const dt = Math.min(0.05, (now - (this.last || now)) / 1000)
    this.last = now
    if (this.track) {
      if (this.mode === 'ride' && this.ride) {
        stepRideBy(this.ride, this.track, dt, () => this.audio.release())
        this.audio.wind(this.ride.ended ? 0 : this.ride.v)
        if (this.ride.lift) {
          this.clickT -= dt
          if (this.clickT <= 0) {
            this.audio.click()
            this.clickT = 0.12
          }
        }
        if (this.ride.ended) {
          this.audio.wind(0)
          this.finishRide()
        }
      } else {
        this.audio.wind(0)
      }
    }
    if (this.pov3d && this.track) {
      this.scene3d.render(this)
      if (this.showMini && this.miniCanvas) this.scene2d.renderMini(this, this.miniCanvas)
    } else {
      this.scene2d.render(this, dt)
    }
    this.raf = requestAnimationFrame(this.loop)
  }

  later(fn, ms) {
    const id = setTimeout(() => {
      this.timers = this.timers.filter((t) => t !== id)
      if (!this.destroyed) fn()
    }, ms)
    this.timers.push(id)
    return id
  }

  dispose() {
    this.destroyed = true
    cancelAnimationFrame(this.raf)
    this.timers.forEach((t) => clearTimeout(t))
    this.timers = []
    this.canvas.removeEventListener('pointerdown', this._onDown)
    this.canvas.removeEventListener('pointermove', this._onMove)
    this.canvas.removeEventListener('pointerup', this._onUp)
    this.canvas.removeEventListener('pointercancel', this._onUp)
    this.audio.dispose()
    this.scene3d.dispose()
  }
}
