/**
 * 涂鸦过山车 —— 手绘侧视图（2D）
 *
 * 一幅「明信片」式的侧视角：天空、云、远坡、草地、红色轨道、站台、终点旗，
 * 还有三节车厢的小朋友。轨道按深度分块绘制，交叉处会自动断开前一段，
 * 于是重叠的地方看起来像真的从前面 / 后面穿过去。
 *
 * 同一个渲染器也负责画左上角的迷你地图。
 */
import { DS, trainPos, zAt } from './geometry'
import { CAR_GAP, LEAD_OFF } from './ride'

const CAR_COLORS = ['#ffc93c', '#3d9df2', '#2fbf8a']

// 每节车厢两位乘客，前排优先
const RIDERS = [
  { skin: '#f3c7a1', hair: '#2b2522', style: 0, shirt: '#ffffff', brave: 1 },
  { skin: '#e2a97e', hair: '#6b4024', style: 1, shirt: '#2f9e8f', brave: 1 },
  { skin: '#c98c5e', hair: '#1f1a17', style: 3, cap: '#e2453b', shirt: '#3a6fd8', brave: 0 },
  { skin: '#f6d2b5', hair: '#d9a441', style: 2, shirt: '#f08a2c', brave: 1 },
  { skin: '#8e5a3a', hair: '#1b1714', style: 0, shirt: '#7b5cd6', brave: 1 },
  { skin: '#efbf98', hair: '#a8452c', style: 1, shirt: '#e4507b', brave: 0 },
]

const clamp = (v, a, b) => Math.max(a, Math.min(b, v))

function mixHex(a, b, k) {
  const A = parseInt(a.slice(1), 16)
  const B = parseInt(b.slice(1), 16)
  const c = [16, 8, 0].map((sh) => Math.round(((A >> sh) & 255) * (1 - k) + ((B >> sh) & 255) * k))
  return `rgb(${c[0]},${c[1]},${c[2]})`
}

function tint(hex, k) {
  // k > 0 变亮，k < 0 变暗
  const n = parseInt(hex.slice(1), 16)
  const c = [n >> 16, (n >> 8) & 255, n & 255].map((v) => Math.round(k > 0 ? v + (255 - v) * k : v * (1 + k)))
  return `rgb(${c[0]},${c[1]},${c[2]})`
}

export class Scene2D {
  constructor(canvas) {
    this.cv = canvas
    this.ctx = canvas.getContext('2d')
    this.W = 0
    this.H = 0
    this.DPR = 1
    this.backdrop = null
    this.layer = null
    this.railCache = null
    this.miniCache = null
  }

  reset() {
    this.backdrop = null
    this.layer = null
    this.railCache = null
  }

  resize(W, H, DPR, eng) {
    this.W = W
    this.H = H
    this.DPR = DPR
    this.cv.width = Math.round(W * DPR)
    this.cv.height = Math.round(H * DPR)
    this.buildBackdrop(eng)
  }

  toScreen(eng, x, y) {
    const v = eng.view
    return [x * v.s + v.ox, y * v.s + v.oy]
  }

  carScale(eng) {
    return Math.max(1.8, 26 / (2.4 * eng.view.s))
  }

  /* ---------- 背景明信片 ---------- */
  buildBackdrop(eng) {
    if (!this.W || !this.H) return
    const c = document.createElement('canvas')
    c.width = Math.round(this.W * this.DPR)
    c.height = Math.round(this.H * this.DPR)
    const b = c.getContext('2d')
    b.scale(this.DPR, this.DPR)
    const W = this.W
    const H = this.H
    const sky = b.createLinearGradient(0, 0, 0, H)
    sky.addColorStop(0, '#7cc3ee')
    sky.addColorStop(0.7, '#cfeaf8')
    sky.addColorStop(1, '#eaf6fb')
    b.fillStyle = sky
    b.fillRect(0, 0, W, H)
    const sg = b.createRadialGradient(W * 0.82, H * 0.16, 0, W * 0.82, H * 0.16, 120)
    sg.addColorStop(0, 'rgba(255,250,220,.95)')
    sg.addColorStop(0.25, 'rgba(255,245,200,.6)')
    sg.addColorStop(1, 'rgba(255,245,200,0)')
    b.fillStyle = sg
    b.fillRect(0, 0, W, H)
    const cloud = (x, y, s) => {
      b.fillStyle = 'rgba(255,255,255,.85)'
      ;[
        [0, 0, 1],
        [0.9, -0.35, 0.8],
        [1.7, 0, 0.9],
        [0.8, 0.25, 0.9],
      ].forEach(([dx, dy, r]) => {
        b.beginPath()
        b.arc(x + dx * 30 * s, y + dy * 30 * s, 26 * r * s, 0, Math.PI * 2)
        b.fill()
      })
    }
    cloud(W * 0.12, H * 0.17, 0.9)
    cloud(W * 0.55, H * 0.1, 0.7)
    cloud(W * 0.82, H * 0.24, 0.55)
    const gy = eng.groundY * eng.view.s + eng.view.oy
    b.fillStyle = '#b6dcc4'
    b.beginPath()
    b.moveTo(0, gy)
    for (let x = 0; x <= W; x += 20) b.lineTo(x, gy - 40 - 26 * Math.sin(x / 140) - 14 * Math.sin(x / 53 + 1))
    b.lineTo(W, gy)
    b.closePath()
    b.fill()
    const gg = b.createLinearGradient(0, gy, 0, Math.max(gy + 1, H))
    gg.addColorStop(0, '#7dc36b')
    gg.addColorStop(1, '#4f9a45')
    b.fillStyle = gg
    b.fillRect(0, gy, W, Math.max(0, H - gy))
    b.fillStyle = 'rgba(0,0,0,.08)'
    b.fillRect(0, gy, W, 3)
    this.backdrop = c
    this.layer = null
  }

  /* ---------- 轨道渲染路径（含站台 / 缓冲延长段） ---------- */
  railPath(eng) {
    const t = eng.track
    const CAR = this.carScale(eng)
    const cache = this.railCache
    if (cache && cache.t === t && cache.CAR === CAR) return cache
    const nb = Math.min(t.extB.xs.length - 1, Math.ceil(((2 * CAR_GAP - LEAD_OFF + 1.6) * CAR) / DS))
    const ne = Math.min(t.extE.xs.length - 1, Math.ceil(((LEAD_OFF + 2) * CAR) / DS))
    const xs = []
    const ys = []
    const zs = []
    for (let i = nb; i >= 1; i--) {
      xs.push(t.extB.xs[i])
      ys.push(t.extB.ys[i])
      zs.push(t.zs[0])
    }
    const i0 = xs.length
    for (let i = 0; i < t.n; i++) {
      xs.push(t.xs[i])
      ys.push(t.ys[i])
      zs.push(t.zs[i])
    }
    const i1 = xs.length - 1
    for (let i = 1; i <= ne; i++) {
      xs.push(t.extE.xs[i])
      ys.push(t.extE.ys[i])
      zs.push(t.zs[t.n - 1])
    }
    const n = xs.length
    const tx = new Float32Array(n)
    const ty = new Float32Array(n)
    for (let i = 0; i < n; i++) {
      const a = Math.max(0, i - 1)
      const b = Math.min(n - 1, i + 1)
      const dx = xs[b] - xs[a]
      const dy = ys[b] - ys[a]
      const m = Math.hypot(dx, dy) || 1
      tx[i] = dx / m
      ty[i] = dy / m
    }
    // 拆成小段，从后往前画；越远的一段颜色越淡
    let zmin = Infinity
    let zmax = -Infinity
    for (const z of zs) {
      zmin = Math.min(zmin, z)
      zmax = Math.max(zmax, z)
    }
    const chunks = []
    const CH = 6
    for (let a = 0; a < n - 1; a += CH) {
      const b = Math.min(n - 1, a + CH)
      let z = 0
      for (let i = a; i <= b; i++) z += zs[i]
      z /= b - a + 1
      const fade = zmax - zmin > 1 ? ((zmax - z) / (zmax - zmin)) * 0.2 : 0
      chunks.push({
        a,
        b,
        z,
        s0: (a - i0) * DS,
        s1: (b - i0) * DS,
        rail: mixHex('#d6342c', '#c4e3f4', fade),
        tie: mixHex('#8b1e19', '#c4e3f4', fade),
        post: `rgba(110,125,138,${(0.55 * (1 - fade)).toFixed(2)})`,
      })
    }
    chunks.sort((p, q) => p.z - q.z)
    return (this.railCache = { t, CAR, xs, ys, zs, tx, ty, n, i0, i1, chunks })
  }

  /** part: 1 = 只挖缺口，2 = 只画轨道，3 = 两者 */
  drawChunk(eng, R, c, part = 3) {
    const ctx = this.ctx
    const s = eng.view.s
    const a = c.a
    const b = c.b
    const gy = eng.groundY * s + eng.view.oy
    const line = (off, i0, i1) => {
      ctx.beginPath()
      for (let i = i0; i <= i1; i++) {
        const [x, y] = this.toScreen(eng, R.xs[i] - R.ty[i] * off, R.ys[i] + R.tx[i] * off)
        if (i > i0) ctx.lineTo(x, y)
        else ctx.moveTo(x, y)
      }
      ctx.stroke()
    }
    ctx.lineJoin = 'round'
    ctx.lineCap = 'butt'
    if (part & 1) {
      // 在这段轨道经过的东西上挖一道缺口，避免看起来「糊」在一起
      ctx.globalCompositeOperation = 'destination-out'
      ctx.strokeStyle = '#000'
      ctx.lineWidth = Math.max(7, 1.25 * s)
      line(0, a, b)
      ctx.globalCompositeOperation = 'source-over'
    }
    if (!(part & 2)) return
    // 支柱
    ctx.lineWidth = Math.max(1, 0.18 * s)
    ctx.strokeStyle = c.post
    ctx.beginPath()
    for (let i = a; i < b; i++) {
      if ((((i - R.i0) % 24) + 24) % 24 === 0) {
        const [x, y] = this.toScreen(eng, R.xs[i], R.ys[i])
        if (y < gy - 4) {
          ctx.moveTo(x, y + 0.3 * s)
          ctx.lineTo(x, gy)
        }
      }
    }
    ctx.stroke()
    // 枕木
    ctx.lineWidth = Math.max(1, 0.14 * s)
    ctx.strokeStyle = c.tie
    ctx.beginPath()
    for (let i = a; i < b; i++) {
      if ((((i - R.i0) % 4) + 4) % 4 === 0) {
        const nx = -R.ty[i]
        const ny = R.tx[i]
        const [x, y] = this.toScreen(eng, R.xs[i], R.ys[i])
        ctx.moveTo(x + nx * 0.32 * s, y + ny * 0.32 * s)
        ctx.lineTo(x - nx * 0.32 * s, y - ny * 0.32 * s)
      }
    }
    ctx.stroke()
    // 两根钢轨（与相邻段重叠一个采样点，接缝就看不出来了）
    ctx.lineWidth = Math.max(2, 0.16 * s)
    ctx.strokeStyle = c.rail
    const a1 = Math.max(0, a - 1)
    const b1 = Math.min(R.n - 1, b + 1)
    line(0.3, a1, b1)
    line(-0.3, a1, b1)
  }

  drawStation(eng, R) {
    const ctx = this.ctx
    const s = eng.view.s
    const CAR = R.CAR
    const jEnd = R.i0
    let minX = Infinity
    let maxX = -Infinity
    let top = Infinity
    for (let j = 0; j <= jEnd; j++) {
      minX = Math.min(minX, R.xs[j])
      maxX = Math.max(maxX, R.xs[j])
      top = Math.min(top, R.ys[j])
    }
    const roofH = Math.max(3.6, 2.05 * CAR)
    const [rx0, ry] = this.toScreen(eng, minX - 0.4, top - roofH)
    const [rx1] = this.toScreen(eng, maxX + 0.4, 0)
    const post = (j) => {
      const [px, py] = this.toScreen(eng, R.xs[j], R.ys[j])
      ctx.fillRect(px - 0.12 * s, ry, 0.24 * s, Math.max(0, py - ry - 0.3 * s))
    }
    ctx.fillStyle = '#2d3e4f'
    post(0)
    post(jEnd)
    ctx.fillRect(rx0, ry, rx1 - rx0, 0.5 * s)
    ctx.fillStyle = '#f2b632'
    ctx.fillRect(rx0 - 0.2 * s, ry - 0.38 * s, rx1 - rx0 + 0.4 * s, 0.4 * s)
    ctx.fillStyle = 'rgba(255,255,255,.35)'
    ctx.fillRect(rx0 - 0.2 * s, ry - 0.38 * s, rx1 - rx0 + 0.4 * s, 0.1 * s)
    // 终点旗
    const [ex, ey] = this.toScreen(eng, R.xs[R.i1], R.ys[R.i1])
    ctx.fillStyle = '#2d3e4f'
    ctx.fillRect(ex - 0.1 * s, ey - 4 * s, 0.2 * s, 4 * s)
    const fs = 0.6 * s
    for (let r = 0; r < 2; r++) {
      for (let cc = 0; cc < 3; cc++) {
        ctx.fillStyle = (r + cc) % 2 ? '#fff' : '#14202b'
        ctx.fillRect(ex + 0.1 * s + cc * fs, ey - 4 * s + r * fs, fs, fs)
      }
    }
  }

  /** 整条轨道从后往前画进独立图层（只在视图变化时重画） */
  trackLayer(eng, R) {
    const o = this.layer
    if (
      o &&
      o.R === R &&
      o.s === eng.view.s &&
      o.ox === eng.view.ox &&
      o.oy === eng.view.oy &&
      o.w === this.cv.width &&
      o.h === this.cv.height
    ) {
      return o.c
    }
    const c = o ? o.c : document.createElement('canvas')
    c.width = this.cv.width
    c.height = this.cv.height
    const main = this.ctx
    this.ctx = c.getContext('2d')
    this.ctx.setTransform(this.DPR, 0, 0, this.DPR, 0, 0)
    const z0 = R.zs[R.i0]
    let station = false
    for (const ch of R.chunks) {
      if (!station && ch.z > z0 + 0.01) {
        this.drawStation(eng, R)
        station = true
      }
      this.drawChunk(eng, R, ch)
    }
    if (!station) this.drawStation(eng, R)
    this.ctx = main
    this.layer = { R, s: eng.view.s, ox: eng.view.ox, oy: eng.view.oy, w: this.cv.width, h: this.cv.height, c }
    return c
  }

  /** 从列车前面「穿过」的轨道段要压到列车之上重画一遍 */
  draw2D(eng, dt) {
    const R = this.railPath(eng)
    const CAR = R.CAR
    this.ctx.drawImage(this.trackLayer(eng, R), 0, 0, this.W, this.H)
    if (!eng.ride) return
    const lead = eng.ride.s + LEAD_OFF * CAR
    const s0 = lead - (2 * CAR_GAP + 1.7) * CAR - 1
    const s1 = lead + 1.8 * CAR + 1
    const zt = zAt(eng.track, Math.max(0, Math.min(eng.track.len, lead - CAR_GAP * CAR)))
    this.drawTrain(eng, dt)
    for (const c of R.chunks) if (c.z > zt + 0.5 && (c.s1 < s0 || c.s0 > s1)) this.drawChunk(eng, R, c, 2)
  }

  /* ---------- 列车 + 乘客（2D） ---------- */
  drawTrain(eng, dt) {
    const ctx = this.ctx
    const r = eng.ride
    if (!r) return
    const s = eng.view.s
    const CAR = this.carScale(eng)
    const now = performance.now() / 1000
    if (!r.riders) r.riders = RIDERS.map((p, i) => ({ a: 0, ph: i * 1.7 }))
    const moving = eng.mode === 'ride' && !r.ended
    const thrill = moving && r.t > 0.5 && (r.v > 13 || r.g < 0.45)
    const lean = moving ? clamp((r.g - 1) * 0.035, -0.06, 0.12) : 0 // G 值把大家往后压
    const lift = moving ? clamp((0.4 - r.g) * 0.06, 0, 0.09) : 0 // 失重时屁股离座
    const flow = moving ? Math.min(1, r.v / 26) : 0 // 头发被风吹起来
    const railTop = -(0.3 + Math.max(0.08, 1 / s)) / CAR
    const WR = 0.17
    const WY = railTop - WR
    const B = WY - 0.1

    const rrect = (x, y, w, h, rad) => {
      ctx.beginPath()
      if (ctx.roundRect) ctx.roundRect(x, y, w, h, rad)
      else ctx.rect(x, y, w, h)
    }
    const limb = (ax, ay, bx, by, cx, cy, sleeve, skin) => {
      ctx.lineCap = 'round'
      ctx.strokeStyle = sleeve
      ctx.lineWidth = 0.085
      ctx.beginPath()
      ctx.moveTo(ax, ay)
      ctx.lineTo(bx, by)
      ctx.stroke()
      ctx.strokeStyle = skin
      ctx.lineWidth = 0.068
      ctx.beginPath()
      ctx.moveTo(bx, by)
      ctx.lineTo(cx, cy)
      ctx.stroke()
      ctx.fillStyle = skin
      ctx.beginPath()
      ctx.arc(cx, cy, 0.048, 0, 7)
      ctx.fill()
    }

    for (let k = 2; k >= 0; k--) {
      const p = trainPos(eng.track, r.s + LEAD_OFF * CAR - k * CAR_GAP * CAR)
      const ux = eng.track.sigma * p.ty
      const uy = -eng.track.sigma * p.tx
      const [x, y] = this.toScreen(eng, p.x, p.y)
      const col = CAR_COLORS[k]
      const lead = k === 0
      ctx.save()
      ctx.setTransform(this.DPR * s * p.tx, this.DPR * s * p.ty, this.DPR * s * -ux, this.DPR * s * -uy, this.DPR * x, this.DPR * y)
      ctx.scale(CAR, CAR)
      // 局部坐标：+x 向前，-y 向上，1 = 一个车长
      ctx.fillStyle = '#26323d'
      if (k < 2) ctx.fillRect(-1.42, B + 0.02, 0.4, 0.07)
      rrect(-0.98, B - 0.02, 1.98, WY - B + 0.08, 0.05)
      ctx.fill()
      const rot = r.s / (WR * CAR)
      for (const wx of [-0.68, 0.68]) {
        ctx.fillStyle = '#1b232b'
        ctx.beginPath()
        ctx.arc(wx, WY, WR, 0, 7)
        ctx.fill()
        ctx.fillStyle = '#9aa7b3'
        ctx.beginPath()
        ctx.arc(wx, WY, WR * 0.52, 0, 7)
        ctx.fill()
        ctx.strokeStyle = '#1b232b'
        ctx.lineWidth = 0.03
        ctx.beginPath()
        for (let q = 0; q < 3; q++) {
          const a = rot + q * 2.094
          ctx.moveTo(wx, WY)
          ctx.lineTo(wx + Math.cos(a) * WR * 0.5, WY + Math.sin(a) * WR * 0.5)
        }
        ctx.stroke()
      }
      // 椅背（带头枕）
      for (const sx of [0.42, -0.5]) {
        ctx.fillStyle = '#2f3b47'
        rrect(sx - 0.37, B - 1.06, 0.17, 0.7, 0.07)
        ctx.fill()
        ctx.fillStyle = 'rgba(255,255,255,.12)'
        ctx.fillRect(sx - 0.35, B - 1.02, 0.04, 0.6)
      }
      // 乘客
      const people = []
      for (let j = 0; j < 2; j++) {
        const P = RIDERS[k * 2 + j]
        const st = r.riders[k * 2 + j]
        const sx = j === 0 ? 0.42 : -0.5
        const want = thrill ? (P.brave ? 1 : r.g < 0.2 ? 0.55 : 0) : 0
        st.a += (want - st.a) * Math.min(1, dt * (want > st.a ? 6 : 3))
        const a = st.a
        const wave = Math.sin(now * 8 + st.ph) * 0.05 * a
        const hx = sx - lean
        const hy = B - 1.15 - lift
        const HR = 0.2
        const shx = sx - lean * 0.6
        const shy = B - 0.88 - lift
        const arm = (dx) => {
          const ex = shx + dx + 0.16 + (0.1 - 0.16) * a
          const ey = shy + 0.18 + (-0.4 - 0.18) * a
          const hx2 = shx + dx + 0.3 + (0.17 + wave - 0.3) * a
          const hy2 = B - 0.6 + (B - 1.68 - lift - (B - 0.6)) * a
          return [shx + dx, shy, ex, ey, hx2, hy2]
        }
        people.push({ P, a, sx, hx, hy, HR, arm })
        // 远端手臂画在身体后面
        const fa = arm(-0.07)
        limb(...fa, tint(P.shirt, -0.25), tint(P.skin, -0.18))
        // 长头发从肩膀后面垂下来
        if (P.style === 1) {
          ctx.fillStyle = P.hair
          ctx.beginPath()
          ctx.moveTo(hx - HR * 0.1, hy - HR * 1.02)
          ctx.quadraticCurveTo(hx - HR * 1.35 - flow * 0.2, hy - HR * 0.6, hx - HR * 1.05 - flow * 0.42, hy + HR * 1.25 - flow * 0.35)
          ctx.lineTo(hx - HR * 0.25, hy + HR * 0.75)
          ctx.closePath()
          ctx.fill()
        }
        // 身体
        ctx.fillStyle = P.shirt
        rrect(sx - 0.2 - lean * 0.5, B - 0.98 - lift, 0.34, 0.62, 0.12)
        ctx.fill()
        ctx.fillStyle = 'rgba(0,0,0,.08)'
        ctx.fillRect(sx - 0.2 - lean * 0.5, B - 0.98 - lift, 0.08, 0.62)
        // 头
        ctx.fillStyle = P.skin
        ctx.beginPath()
        ctx.arc(hx, hy, HR, 0, 7)
        ctx.fill()
        // 头发
        ctx.fillStyle = P.hair
        if (P.style === 3) {
          // 棒球帽
          ctx.beginPath()
          ctx.arc(hx, hy + HR * 0.1, HR * 0.98, Math.PI * 0.7, Math.PI * 1.1)
          ctx.lineTo(hx - HR * 0.2, hy)
          ctx.fill()
          ctx.fillStyle = P.cap
          ctx.beginPath()
          ctx.arc(hx, hy - HR * 0.05, HR * 1.06, Math.PI, Math.PI * 2)
          ctx.closePath()
          ctx.fill()
          rrect(hx + HR * 0.55, hy - HR * 0.2, HR * 0.95, HR * 0.22, HR * 0.1)
          ctx.fill()
        } else {
          ctx.beginPath()
          ctx.arc(hx, hy, HR * 1.07, Math.PI * 0.78, Math.PI * 1.93)
          ctx.quadraticCurveTo(hx + HR * 0.15, hy - HR * 0.45, hx - HR * 0.3, hy + HR * 0.15)
          ctx.closePath()
          ctx.fill()
          if (P.style === 2) {
            // 马尾被风甩起来
            const tx = hx - HR * 1.7 - flow * 0.28
            const ty = hy - HR * 0.35 + (1 - flow) * HR * 1.1 - lift * 2
            ctx.beginPath()
            ctx.moveTo(hx - HR * 0.8, hy - HR * 0.75)
            ctx.quadraticCurveTo(hx - HR * 1.5, hy - HR * 0.9, tx, ty)
            ctx.quadraticCurveTo(hx - HR * 1.2, hy - HR * 0.1, hx - HR * 0.85, hy - HR * 0.25)
            ctx.fill()
          }
        }
        // 脸：眼睛、腮红，尖叫时张嘴
        ctx.fillStyle = '#1d2229'
        ctx.beginPath()
        ctx.arc(hx + HR * 0.52, hy - HR * 0.08, HR * 0.12, 0, 7)
        ctx.fill()
        ctx.fillStyle = 'rgba(255,110,110,.35)'
        ctx.beginPath()
        ctx.arc(hx + HR * 0.36, hy + HR * 0.34, HR * 0.2, 0, 7)
        ctx.fill()
        if (a > 0.45 || (moving && r.v > 20)) {
          ctx.fillStyle = '#7a2a22'
          ctx.beginPath()
          ctx.ellipse(hx + HR * 0.74, hy + HR * 0.42, HR * 0.13, HR * 0.2, 0, 0, 7)
          ctx.fill()
        }
      }
      // 车身：后面高、向前倾斜
      const top = B - 0.82
      const topAt = (xx) => B - 0.82 + ((xx + 1) / 1.95) * 0.2
      ctx.beginPath()
      ctx.moveTo(-1.12, B - 0.06)
      ctx.lineTo(-1.12, top + 0.12)
      ctx.quadraticCurveTo(-1.12, top, -0.98, top)
      if (lead) {
        ctx.lineTo(0.9, topAt(0.9))
        ctx.bezierCurveTo(1.4, topAt(0.9), 1.68, B - 0.32, 1.62, B - 0.1)
        ctx.quadraticCurveTo(1.58, B, 1.42, B)
      } else {
        ctx.lineTo(0.98, topAt(0.98))
        ctx.quadraticCurveTo(1.13, topAt(1), 1.13, topAt(1) + 0.16)
        ctx.lineTo(1.13, B - 0.06)
        ctx.quadraticCurveTo(1.13, B, 1.06, B)
      }
      ctx.lineTo(-1.06, B)
      ctx.quadraticCurveTo(-1.12, B, -1.12, B - 0.06)
      ctx.closePath()
      const gr = ctx.createLinearGradient(0, top, 0, B)
      gr.addColorStop(0, tint(col, 0.35))
      gr.addColorStop(0.55, col)
      gr.addColorStop(1, tint(col, -0.28))
      ctx.fillStyle = gr
      ctx.fill()
      ctx.save()
      ctx.clip()
      ctx.fillStyle = 'rgba(255,255,255,.9)'
      ctx.fillRect(-1.2, B - 0.36, 3, 0.07) // 拉花
      ctx.fillStyle = tint(col, -0.4)
      ctx.fillRect(-1.2, B - 0.1, 3, 0.1) // 裙边
      ctx.strokeStyle = 'rgba(255,255,255,.55)'
      ctx.lineWidth = 0.05
      ctx.beginPath()
      ctx.moveTo(-1.0, top + 0.03)
      ctx.lineTo(0.95, topAt(0.95) + 0.03)
      ctx.stroke() // 高光
      ctx.restore()
      ctx.strokeStyle = tint(col, -0.45)
      ctx.lineWidth = 0.03
      ctx.stroke()
      if (lead) {
        // 车头灯
        ctx.fillStyle = '#fff6c8'
        ctx.beginPath()
        ctx.arc(1.47, B - 0.2, 0.07, 0, 7)
        ctx.fill()
        ctx.strokeStyle = tint(col, -0.45)
        ctx.lineWidth = 0.025
        ctx.stroke()
      }
      // 压腿杠 + 近端手臂
      for (const q of people) {
        ctx.strokeStyle = '#2b3540'
        ctx.lineWidth = 0.06
        ctx.lineCap = 'round'
        const t0 = topAt(q.sx + 0.02)
        const t1 = topAt(q.sx + 0.34)
        ctx.beginPath()
        ctx.moveTo(q.sx + 0.02, t0 - 0.02)
        ctx.quadraticCurveTo(q.sx + 0.2, Math.min(t0, t1) - 0.16, q.sx + 0.34, t1 + 0.02)
        ctx.stroke()
        limb(...q.arm(0.05), q.P.shirt, q.P.skin)
      }
      ctx.restore()
    }
  }

  /* ---------- 每帧渲染 ---------- */
  render(eng, dt) {
    const ctx = this.ctx
    ctx.setTransform(this.DPR, 0, 0, this.DPR, 0, 0)
    if (this.backdrop) ctx.drawImage(this.backdrop, 0, 0, this.W, this.H)
    else {
      ctx.fillStyle = '#9fd4f2'
      ctx.fillRect(0, 0, this.W, this.H)
    }
    // 正在画的那一笔
    if (eng.mode === 'drawing' && eng.raw.length > 1) {
      ctx.lineWidth = 5
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      ctx.strokeStyle = '#d6342c'
      ctx.beginPath()
      eng.raw.forEach((p, i) => {
        const [x, y] = this.toScreen(eng, p.x, p.y)
        if (i) ctx.lineTo(x, y)
        else ctx.moveTo(x, y)
      })
      ctx.stroke()
      const [sx, sy] = this.toScreen(eng, eng.raw[0].x, eng.raw[0].y)
      ctx.fillStyle = '#14202b'
      ctx.beginPath()
      ctx.arc(sx, sy, 6, 0, 7)
      ctx.fill()
    }
    if (!eng.track) return
    this.draw2D(eng, dt)
  }

  /* ---------- 迷你地图：侧视全景 + 当前位置 ---------- */
  miniLayer(eng) {
    const t = eng.track
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const maxW = Math.round(Math.min(210, Math.max(120, this.W * 0.4)))
    const maxH = Math.round(Math.min(150, Math.max(90, this.H * 0.19)))
    const c0 = this.miniCache
    if (c0 && c0.t === t && c0.maxW === maxW && c0.maxH === maxH && c0.dpr === dpr) return c0
    let x0 = Infinity
    let x1 = -Infinity
    let y0 = Infinity
    let y1 = -Infinity
    for (let i = 0; i < t.n; i += 2) {
      x0 = Math.min(x0, t.xs[i])
      x1 = Math.max(x1, t.xs[i])
      y0 = Math.min(y0, t.ys[i])
      y1 = Math.max(y1, t.ys[i])
    }
    const bottom = Math.min(eng.groundY, y1 + Math.max(3, (y1 - y0) * 0.3))
    const pad = 11
    const sc = Math.min((maxW - 2 * pad) / Math.max(1, x1 - x0), (maxH - 2 * pad) / Math.max(1, bottom - y0))
    const cw = Math.max(64, Math.round((x1 - x0) * sc + 2 * pad))
    const ch = Math.max(48, Math.round((bottom - y0) * sc + 2 * pad))
    const ox = (cw - (x1 - x0) * sc) / 2 - x0 * sc
    const oy = pad - y0 * sc + (ch - 2 * pad - (bottom - y0) * sc) / 2
    const img = document.createElement('canvas')
    img.width = cw * dpr
    img.height = ch * dpr
    const g = img.getContext('2d')
    g.scale(dpr, dpr)
    const P = (i) => [ox + t.xs[i] * sc, oy + t.ys[i] * sc]
    if (eng.groundY <= bottom + 0.01) {
      g.fillStyle = 'rgba(79,154,69,.35)'
      g.fillRect(0, oy + eng.groundY * sc, cw, ch)
    }
    // 轨道从后往前画，交叉处和大视图读起来一致
    const chunks = []
    for (let a = 0; a < t.n - 1; a += 8) {
      const b = Math.min(t.n - 1, a + 8)
      chunks.push({ a, b, z: (t.zs[a] + t.zs[b]) / 2 })
    }
    chunks.sort((p, q) => p.z - q.z)
    g.lineJoin = 'round'
    for (const k of chunks) {
      for (const [col, w, cap] of [
        ['rgba(255,255,255,.95)', 4.6, 'butt'],
        ['#d6342c', 2.2, 'round'],
      ]) {
        g.strokeStyle = col
        g.lineWidth = w
        g.lineCap = cap
        g.beginPath()
        for (let i = k.a; i <= k.b; i++) {
          const [x, y] = P(i)
          if (i > k.a) g.lineTo(x, y)
          else g.moveTo(x, y)
        }
        g.stroke()
      }
    }
    // 站台与终点旗
    const [sx, sy] = P(0)
    g.fillStyle = '#2d3e4f'
    g.fillRect(sx - 4, sy - 7, 8, 2.5)
    const [ex, ey] = P(t.n - 1)
    g.fillRect(ex - 0.6, ey - 9, 1.2, 9)
    for (let r = 0; r < 2; r++) {
      for (let q = 0; q < 3; q++) {
        g.fillStyle = (r + q) % 2 ? '#fff' : '#14202b'
        g.fillRect(ex + 0.6 + q * 2, ey - 9 + r * 2, 2, 2)
      }
    }
    return (this.miniCache = { t, maxW, maxH, dpr, sc, ox, oy, cw, ch, img })
  }

  renderMini(eng, canvas) {
    if (!eng.track) return
    const M = this.miniLayer(eng)
    if (canvas.width !== M.cw * M.dpr || canvas.height !== M.ch * M.dpr) {
      canvas.width = M.cw * M.dpr
      canvas.height = M.ch * M.dpr
      canvas.style.width = M.cw + 'px'
      canvas.style.height = M.ch + 'px'
    }
    const g = canvas.getContext('2d')
    g.setTransform(M.dpr, 0, 0, M.dpr, 0, 0)
    g.clearRect(0, 0, M.cw, M.ch)
    g.drawImage(M.img, 0, 0, M.cw, M.ch)
    if (!eng.ride) return
    const s = Math.max(0, Math.min(eng.track.len, eng.ride.s))
    // 当前位置：脉冲圆点
    const f = Math.max(0, Math.min(eng.track.n - 1.001, s / DS))
    const i = Math.floor(f)
    const u = f - i
    const px = eng.track.xs[i] + (eng.track.xs[i + 1] - eng.track.xs[i]) * u
    const py = eng.track.ys[i] + (eng.track.ys[i + 1] - eng.track.ys[i]) * u
    const x = M.ox + px * M.sc
    const y = M.oy + py * M.sc
    const pulse = (Math.sin(performance.now() / 160) + 1) / 2
    g.fillStyle = `rgba(255,190,40,${(0.45 - pulse * 0.3).toFixed(2)})`
    g.beginPath()
    g.arc(x, y, 6 + pulse * 5, 0, 7)
    g.fill()
    g.fillStyle = '#ffc93c'
    g.strokeStyle = '#14202b'
    g.lineWidth = 1.6
    g.beginPath()
    g.arc(x, y, 4.6, 0, 7)
    g.fill()
    g.stroke()
  }
}
