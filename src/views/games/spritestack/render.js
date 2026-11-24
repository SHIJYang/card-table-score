/**
 * Pixel-art slice renderer.
 * 先以 1 个美术像素为分辨率做软件光栅化，再整数倍放大绘制到页面 canvas，
 * 这样旋转时仍然是硬边像素质感（nearest-neighbour）。
 * 环境层（昼夜天空、地面、雨雪）参考 sprite-stacking viewer 的氛围系统。
 */

import { getEnvTheme } from './environment'

const TAU = Math.PI * 2

const pack = (r, g, b, a = 255) => (((a << 24) | (b << 16) | (g << 8) | r) >>> 0)

const OUTLINE = pack(27, 29, 40)

const lighten = (c) =>
  pack(
    Math.min(255, (c & 255) + 66),
    Math.min(255, ((c >> 8) & 255) + 66),
    Math.min(255, ((c >> 16) & 255) + 58),
    255
  )

export class StackRenderer {
  constructor() {
    this.canvas = document.createElement('canvas')
    this.ctx = this.canvas.getContext('2d')
    this.image = null
    this.out32 = null
    this.alpha = null
    this.cw = 0
    this.ch = 0
    this._box = [0, 0, 0, 0]
  }

  ensure(cw, ch) {
    if (this.cw === cw && this.ch === ch && this.image) return
    this.cw = cw
    this.ch = ch
    this.canvas.width = cw
    this.canvas.height = ch
    this.image = this.ctx.createImageData(cw, ch)
    this.out32 = new Uint32Array(this.image.data.buffer)
    this.alpha = new Uint8Array(cw * ch)
  }

  render(target, cssW, cssH, model, opts = {}) {
    if (!model || !model.slices || !cssW || !cssH) return null

    const { W, L, H } = model
    const squash = Math.max(0.25, Math.min(1, opts.squash ?? 0.75))
    const spacing = Math.max(0.25, opts.spacing ?? 1)
    const mode = opts.mode || 'turntable'
    const room = mode === 'explode' ? spacing * 2.4 : spacing
    const total = opts.maxSlices ? Math.min(H, Math.max(1, opts.maxSlices)) : H
    const highlight = opts.highlight ?? -1
    const zoom = Math.max(0.4, opts.zoom ?? 1)
    const angle = ((opts.angle ?? 0) * Math.PI) / 180
    const ca = Math.cos(angle)
    const sa = Math.sin(angle)

    const env = opts.env || {}
    const theme = getEnvTheme(env.time ?? 0, env.sun ?? 42, env.weather ?? 'clear', env.lighting !== false)
    const weather = opts.weather || null
    const snowCover = weather ? weather.snowCover : 0
    const wetness = weather ? weather.wetness : 0
    theme.snowCover = snowCover
    theme.wetness = wetness

    const diag = Math.ceil(Math.hypot(W, L)) + 6
    const liftMax = Math.ceil(Math.max(1, total - 1) * room)
    const cw = diag + 18
    const ch = Math.ceil(diag * squash) + liftMax + 16
    const cx = Math.floor(cw / 2)
    const baseY = ch - Math.ceil((diag * squash) / 2) - 8

    const fit = Math.min((cssW * 0.9) / cw, (cssH * 0.9) / ch)
    let scale = Math.floor(fit * zoom)
    if (scale < 1) scale = 1
    const dx = Math.round((cssW - cw * scale) / 2)
    const dy = Math.round((cssH - ch * scale) / 2 + 2)
    const groundX = dx + cx * scale
    const groundY = dy + baseY * scale
    const rx = Math.max(W, L) * 0.58 * scale
    const ry = rx * Math.max(0.16, squash * 0.42)

    this.ensure(cw, ch)
    this.out32.fill(0)
    this.alpha.fill(0)

    this.w = W
    this.h = L
    this.ca = ca
    this.sa = sa
    this.squash = squash
    this.cw = cw
    this.ch = ch

    // 地面投影：随太阳方位偏移，方向来自 viewer 的 shDx / shDy
    const shadowColor = pack(theme.shadow[0], theme.shadow[1], theme.shadow[2], theme.shadow[3])
    if (opts.shadow !== false && model.slices[0] && model.slices[0].maxX >= 0) {
      const shX = Math.round(3 + theme.shDx * 5)
      const shY = Math.round(3 + theme.shDy * 3)
      this.raster(model.slices[0], cx + shX, baseY + shY, shadowColor, false)
    }

    // 自下而上堆叠切片
    for (let z = 0; z < total; z++) {
      const slice = model.slices[z]
      if (!slice || slice.maxX < 0) continue
      const lift = Math.round(z * room)
      this.raster(slice, cx, baseY - lift, null, z === highlight)
    }

    // 只在整叠模型外缘描 1px 轮廓
    if (opts.outline !== false) {
      const a = this.alpha
      const out = this.out32
      for (let y = 1; y < ch - 1; y++) {
        let i = y * cw + 1
        for (let x = 1; x < cw - 1; x++, i++) {
          if (a[i]) continue
          if (a[i - 1] || a[i + 1] || a[i - cw] || a[i + cw]) out[i] = OUTLINE
        }
      }
    }

    // 雪帽：给每列最上方的模型像素覆一层白
    if (snowCover > 0.02) this.applySnowCap(snowCover)

    this.ctx.putImageData(this.image, 0, 0)

    // 环境色：只作用在模型像素上（source-atop）
    if (theme.tint.a > 0.005) {
      this.ctx.save()
      this.ctx.globalCompositeOperation = 'source-atop'
      this.ctx.fillStyle = `rgba(${theme.tint.r}, ${theme.tint.g}, ${theme.tint.b}, ${theme.tint.a})`
      this.ctx.fillRect(0, 0, cw, ch)
      this.ctx.restore()
    }

    // 太阳/月亮方向的环境光：朝光源的一侧提亮，背光一侧压暗
    if (env.lighting !== false) {
      const strength = theme.dayW * 0.07 + theme.sunsetW * 0.12 + theme.nightW * 0.08
      if (strength > 0.004) {
        const gx = Math.cos(theme.az)
        const gy = -Math.sin(theme.az)
        const rad = Math.max(cw, ch) * 0.7
        const grad = this.ctx.createLinearGradient(
          cx - gx * rad,
          ch * 0.5 - gy * rad,
          cx + gx * rad,
          ch * 0.5 + gy * rad
        )
        const lit = theme.nightW > 0.5 ? [185, 210, 255] : [255, 242, 205]
        grad.addColorStop(0, `rgba(12, 20, 38, ${strength * 1.2})`)
        grad.addColorStop(0.5, 'rgba(0, 0, 0, 0)')
        grad.addColorStop(1, `rgba(${lit[0]}, ${lit[1]}, ${lit[2]}, ${strength})`)
        this.ctx.save()
        this.ctx.globalCompositeOperation = 'source-atop'
        this.ctx.fillStyle = grad
        this.ctx.fillRect(0, 0, cw, ch)
        this.ctx.restore()
      }
    }

    // 天空与地面
    if (weather) {
      weather.drawSky(target, cssW, cssH, theme, groundY)
      weather.drawGround(target, cssW, cssH, theme, groundX, groundY, rx, ry)
    } else {
      target.fillStyle = `rgb(${Math.round(theme.skyTop[0])}, ${Math.round(theme.skyTop[1])}, ${Math.round(theme.skyTop[2])})`
      target.fillRect(0, 0, cssW, cssH)
    }

    // 雨天湿地倒影
    if (wetness > 0.04) {
      target.save()
      target.beginPath()
      target.ellipse(groundX, groundY + ry * 0.7, rx * 0.92, ry * 0.9, 0, 0, TAU)
      target.clip()
      target.globalAlpha = Math.min(0.22, wetness * 0.18)
      target.translate(0, groundY * 2)
      target.scale(1, -1)
      target.imageSmoothingEnabled = false
      target.drawImage(this.canvas, dx, dy, cw * scale, ch * scale)
      target.restore()
    }

    // 雨滴涟漪
    if (weather) weather.drawRipples(target, cssW, cssH, theme, groundX, groundY, rx, ry)

    target.imageSmoothingEnabled = false
    target.drawImage(this.canvas, dx, dy, cw * scale, ch * scale)

    // 前景天气与雾
    if (weather) {
      weather.drawFog(target, cssW, cssH, theme, groundY)
      weather.drawOverlay(target, cssW, cssH, theme, scale)
    }

    return { scale, cw, ch, dx, dy, groundX, groundY }
  }

  /** 屏幕空间雪帽：每列最上方的模型像素向白色混合 */
  applySnowCap(amount) {
    const data = this.image.data
    const cw = this.cw
    const ch = this.ch
    const alpha = this.alpha
    const cap = 1 + Math.round(amount * 2.2)
    const strength = 0.3 + amount * 0.55

    for (let x = 1; x < cw - 1; x++) {
      let top = -1
      for (let y = 1; y < ch - 1; y++) {
        if (alpha[y * cw + x]) {
          top = y
          break
        }
      }
      if (top < 0) continue
      for (let k = 0; k < cap; k++) {
        const i = (top + k) * cw + x
        if (i >= alpha.length || !alpha[i]) continue
        const p = i * 4
        const a = strength * (1 - (k / cap) * 0.45)
        data[p] = data[p] + (255 - data[p]) * a
        data[p + 1] = data[p + 1] + (255 - data[p + 1]) * a
        data[p + 2] = data[p + 2] + (255 - data[p + 2]) * a
      }
    }
  }

  /** 逆变换采样：屏幕像素 → 切片美术像素 */
  raster(slice, cx, yCenter, override, highlight) {
    const { w, h, ca, sa, squash, cw, ch, out32, alpha } = this
    if (slice.maxX < 0) return

    const x0 = slice.minX - w * 0.5
    const x1 = slice.maxX + 1 - w * 0.5
    const y0 = slice.minY - h * 0.5
    const y1 = slice.maxY + 1 - h * 0.5

    const c0x = x0 * ca - y0 * sa
    const c0y = (x0 * sa + y0 * ca) * squash
    const c1x = x1 * ca - y0 * sa
    const c1y = (x1 * sa + y0 * ca) * squash
    const c2x = x0 * ca - y1 * sa
    const c2y = (x0 * sa + y1 * ca) * squash
    const c3x = x1 * ca - y1 * sa
    const c3y = (x1 * sa + y1 * ca) * squash

    const bxMin = Math.min(c0x, c1x, c2x, c3x)
    const bxMax = Math.max(c0x, c1x, c2x, c3x)
    const byMin = Math.min(c0y, c1y, c2y, c3y)
    const byMax = Math.max(c0y, c1y, c2y, c3y)

    const xMin = Math.max(0, Math.floor(cx + bxMin) - 1)
    const xMax = Math.min(cw - 1, Math.ceil(cx + bxMax) + 1)
    const yMin = Math.max(0, Math.floor(yCenter + byMin) - 1)
    const yMax = Math.min(ch - 1, Math.ceil(yCenter + byMax) + 1)
    if (xMin > xMax || yMin > yMax) return

    for (let y = yMin; y <= yMax; y++) {
      const dy = (y - yCenter) / squash
      let sx = (xMin - cx) * ca + dy * sa + w * 0.5
      let sy = -(xMin - cx) * sa + dy * ca + h * 0.5
      let idx = y * cw + xMin
      for (let x = xMin; x <= xMax; x++, idx++, sx += ca, sy -= sa) {
        if (sx < 0 || sy < 0) continue
        const ix = sx | 0
        const iy = sy | 0
        if (ix >= w || iy >= h) continue
        const c = slice.colors[iy * w + ix]
        if (!c) continue
        out32[idx] = override || (highlight ? lighten(c) : c)
        if (!override) alpha[idx] = 1
      }
    }
  }
}
