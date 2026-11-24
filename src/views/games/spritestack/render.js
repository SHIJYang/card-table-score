/**
 * Pixel-art slice renderer.
 * 先以 1 个美术像素为分辨率做软件光栅化，再整数倍放大绘制到页面 canvas，
 * 这样旋转时仍然是硬边像素质感（nearest-neighbour）。
 */

const pack = (r, g, b, a = 255) => (((a << 24) | (b << 16) | (g << 8) | r) >>> 0)

const OUTLINE = pack(27, 29, 40)
const SHADOW = pack(20, 28, 42, 70)

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

    const diag = Math.ceil(Math.hypot(W, L)) + 6
    const liftMax = Math.ceil(Math.max(1, total - 1) * room)
    const cw = diag + 18
    const ch = Math.ceil(diag * squash) + liftMax + 16
    const cx = Math.floor(cw / 2)
    const baseY = ch - Math.ceil((diag * squash) / 2) - 8

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

    // 地面投影
    if (opts.shadow !== false && model.slices[0] && model.slices[0].maxX >= 0) {
      this.raster(model.slices[0], cx + 3, baseY + 3, SHADOW, false)
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

    this.ctx.putImageData(this.image, 0, 0)

    const fit = Math.min((cssW * 0.9) / cw, (cssH * 0.9) / ch)
    let scale = Math.floor(fit * zoom)
    if (scale < 1) scale = 1
    const dx = Math.round((cssW - cw * scale) / 2)
    const dy = Math.round((cssH - ch * scale) / 2 + 2)

    // 转台椭圆（UI 装饰，绘制在模型下方）
    const groundX = dx + cx * scale
    const groundY = dy + baseY * scale
    const rx = Math.max(W, L) * 0.58 * scale
    const ry = rx * Math.max(0.16, squash * 0.42)
    target.save()
    target.lineWidth = 1
    target.strokeStyle = 'rgba(120, 165, 185, 0.28)'
    target.beginPath()
    target.ellipse(groundX, groundY, rx, ry, 0, 0, Math.PI * 2)
    target.stroke()
    target.strokeStyle = 'rgba(120, 165, 185, 0.14)'
    target.beginPath()
    target.ellipse(groundX, groundY, rx * 0.7, ry * 0.7, 0, 0, Math.PI * 2)
    target.stroke()
    target.restore()

    target.imageSmoothingEnabled = false
    target.drawImage(this.canvas, dx, dy, cw * scale, ch * scale)

    return { scale, cw, ch, dx, dy }
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
