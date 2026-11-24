/**
 * 体素体积 + 像素光栅器。
 * 参考 sprite_test/viewer.html：把视觉外壳切片转成带法线 / AO / 自发光 / 积雪掩码的体积，
 * 再用三档色阶（暗 / 中 / 亮）软件光栅化，得到硬边像素质感的 2.5D 堆叠。
 */

const clampByte = (v) => (v < 0 ? 0 : v > 255 ? 255 : v | 0)
const lerp = (a, b, t) => a + (b - a) * t
const packABGR = (r, g, b, a = 255) => (((a & 255) << 24) | ((b & 255) << 16) | ((g & 255) << 8) | (r & 255)) >>> 0

/** 时间 0=白天 50=黄昏 100=夜晚；太阳方位角 0..360 */
export function getLightingEnv(timeOfDay = 12, sunAngleDeg = 42) {
  const t = Math.max(0, Math.min(1, timeOfDay / 100))
  const sunsetW = Math.max(0, 1 - Math.abs(t - 0.5) * 2.4)
  const nightW = Math.max(0, (t - 0.48) / 0.52)
  const dayW = Math.max(0, 1 - t * 2)

  const elevDeg = t <= 0.5 ? lerp(58, 18, t * 2) : lerp(18, 40, (t - 0.5) * 2)
  const elev = (elevDeg * Math.PI) / 180
  const az = (sunAngleDeg * Math.PI) / 180
  const cosE = Math.cos(elev)
  const lx = Math.cos(az) * cosE
  const ly = Math.sin(az) * cosE
  const lz = Math.sin(elev)

  const shadowLen = Math.min(1.65, Math.max(0.28, (1 / Math.max(Math.tan(elev), 0.35)) * 0.52))
  const shDx = -Math.cos(az) * shadowLen
  const shDy = -Math.sin(az) * shadowLen

  let bgR, bgG, bgB
  if (t <= 0.5) {
    const u = t * 2
    bgR = Math.round(lerp(241, 236, u))
    bgG = Math.round(lerp(244, 218, u))
    bgB = Math.round(lerp(248, 204, u))
  } else {
    const u = (t - 0.5) * 2
    bgR = Math.round(lerp(236, 15, u))
    bgG = Math.round(lerp(218, 21, u))
    bgB = Math.round(lerp(204, 38, u))
  }

  const shR = Math.round(lerp(lerp(186, 156, sunsetW), 7, nightW))
  const shG = Math.round(lerp(lerp(198, 134, sunsetW), 10, nightW))
  const shB = Math.round(lerp(lerp(212, 146, sunsetW), 20, nightW))

  const olR = Math.round(lerp(24, 6, nightW))
  const olG = Math.round(lerp(28, 9, nightW))
  const olB = Math.round(lerp(36, 18, nightW))

  const shMulR = lerp(lerp(0.76, 0.62, sunsetW), 0.24, nightW)
  const shMulG = lerp(lerp(0.8, 0.58, sunsetW), 0.28, nightW)
  const shMulB = lerp(lerp(0.9, 0.78, sunsetW), 0.44, nightW)
  const midMulR = lerp(lerp(0.97, 1.0, sunsetW), 0.38, nightW)
  const midMulG = lerp(lerp(0.98, 0.86, sunsetW), 0.44, nightW)
  const midMulB = lerp(lerp(1.0, 0.82, sunsetW), 0.62, nightW)
  const litMulR = lerp(lerp(1.1, 1.24, sunsetW), 0.58, nightW)
  const litMulG = lerp(lerp(1.08, 1.04, sunsetW), 0.66, nightW)
  const litMulB = lerp(lerp(1.03, 0.84, sunsetW), 0.88, nightW)

  return {
    t,
    dayW,
    sunsetW,
    nightW,
    emisGlow: Math.max(0, Math.min(1, (t - 0.32) / 0.42)),
    lx,
    ly,
    lz,
    shDx,
    shDy,
    bgR,
    bgG,
    bgB,
    bgHex: `rgb(${bgR}, ${bgG}, ${bgB})`,
    shPacked: packABGR(shR, shG, shB),
    olPacked: packABGR(olR, olG, olB),
    shMulR,
    shMulG,
    shMulB,
    midMulR,
    midMulG,
    midMulB,
    litMulR,
    litMulG,
    litMulB,
  }
}

/**
 * 由 carveViews 的输出构建体素体积。
 * @param {{W:number,L:number,H:number,slices:Array}} shape
 */
export function buildVolume(shape) {
  const w = shape.W
  const h = shape.L
  const count = shape.H
  const area = w * h
  const total = count * area
  const occ = new Uint8Array(total)
  const rgb = new Uint8Array(total * 3)
  const rgb32 = new Uint32Array(total)
  const bounds = new Array(count)

  for (let z = 0; z < count; z++) {
    const sl = shape.slices[z]
    let minX = w
    let maxX = -1
    let minY = h
    let maxY = -1
    if (sl) {
      const base = z * area
      for (let y = 0; y < h; y++) {
        const row = y * w
        for (let x = 0; x < w; x++) {
          const c = sl.colors[row + x]
          if (!c) continue
          const idx = base + row + x
          occ[idx] = 1
          rgb[idx * 3] = c & 255
          rgb[idx * 3 + 1] = (c >> 8) & 255
          rgb[idx * 3 + 2] = (c >> 16) & 255
          rgb32[idx] = c >>> 0
          if (x < minX) minX = x
          if (x > maxX) maxX = x
          if (y < minY) minY = y
          if (y > maxY) maxY = y
        }
      }
    }
    bounds[z] =
      maxX >= minX
        ? { minX, maxX, minY, maxY, empty: false }
        : { minX: 0, maxX: 0, minY: 0, maxY: 0, empty: true }
  }

  return buildSurfaceData({ w, h, count, occ, rgb, rgb32, bounds })
}

function buildSurfaceData({ w, h, count, occ, rgb, rgb32, bounds }) {
  const area = w * h
  const total = count * area
  const normX = new Float32Array(total)
  const normY = new Float32Array(total)
  const normZ = new Float32Array(total)
  const ao = new Float32Array(total)
  const surfaceMask = new Uint8Array(total)
  const colorCounts = new Map()
  let surfCount = 0

  const at = (z, y, x) =>
    z >= 0 && z < count && y >= 0 && y < h && x >= 0 && x < w ? occ[z * area + y * w + x] : 0

  for (let z = 0; z < count; z++) {
    const b = bounds[z]
    if (b.empty) continue
    const zBase = z * area
    for (let y = b.minY; y <= b.maxY; y++) {
      const row = zBase + y * w
      for (let x = b.minX; x <= b.maxX; x++) {
        const idx = row + x
        if (!occ[idx]) continue

        const xp = at(z, y, x + 1)
        const xm = at(z, y, x - 1)
        const yp = at(z, y + 1, x)
        const ym = at(z, y - 1, x)
        const zp = at(z + 1, y, x)
        const zm = at(z - 1, y, x)

        if (!(xp && xm && yp && ym && zp && zm)) {
          surfaceMask[idx] = 1
          surfCount++
          const key = rgb32[idx]
          colorCounts.set(key, (colorCounts.get(key) || 0) + 1)
        }

        const gx =
          (xm - xp) * 2 +
          (at(z, y - 1, x - 1) - at(z, y - 1, x + 1)) +
          (at(z, y + 1, x - 1) - at(z, y + 1, x + 1)) +
          (at(z + 1, y, x - 1) - at(z + 1, y, x + 1)) +
          (at(z - 1, y, x - 1) - at(z - 1, y, x + 1))
        const gy =
          (ym - yp) * 2 +
          (at(z, y - 1, x - 1) - at(z, y + 1, x - 1)) +
          (at(z, y - 1, x + 1) - at(z, y + 1, x + 1)) +
          (at(z + 1, y - 1, x) - at(z + 1, y + 1, x)) +
          (at(z - 1, y - 1, x) - at(z - 1, y + 1, x))
        const gz =
          (zm - zp) * 2 +
          (at(z - 1, y, x - 1) - at(z + 1, y, x - 1)) +
          (at(z - 1, y, x + 1) - at(z + 1, y, x + 1)) +
          (at(z - 1, y - 1, x) - at(z + 1, y - 1, x)) +
          (at(z - 1, y + 1, x) - at(z + 1, y + 1, x))

        const mag = Math.hypot(gx, gy, gz)
        if (mag > 1e-4) {
          normX[idx] = gx / mag
          normY[idx] = gy / mag
          normZ[idx] = gz / mag
        } else {
          normZ[idx] = 1
        }

        const upperOcc =
          zp +
          at(z + 1, y - 1, x) +
          at(z + 1, y + 1, x) +
          at(z + 1, y, x - 1) +
          at(z + 1, y, x + 1)
        ao[idx] = 1 - upperOcc * 0.042
      }
    }
  }

  // 自发光：排除占比超过 14% 的主色，其余高亮高饱和像素视为霓虹 / 车灯
  const emis = new Uint8Array(total)
  const emissiveSeeds = []
  const dominant = new Set()
  if (surfCount > 0) {
    for (const [k, c] of colorCounts.entries()) {
      if (c / surfCount > 0.14) dominant.add(k)
    }
  }
  for (let z = 0; z < count; z++) {
    const b = bounds[z]
    if (b.empty) continue
    const zBase = z * area
    for (let y = b.minY; y <= b.maxY; y++) {
      const row = zBase + y * w
      for (let x = b.minX; x <= b.maxX; x++) {
        const idx = row + x
        if (!surfaceMask[idx] || dominant.has(rgb32[idx])) continue
        const r = rgb[idx * 3]
        const g = rgb[idx * 3 + 1]
        const bl = rgb[idx * 3 + 2]
        const luma = 0.299 * r + 0.587 * g + 0.114 * bl
        const maxC = r > g ? (r > bl ? r : bl) : g > bl ? g : bl
        const minC = r < g ? (r < bl ? r : bl) : g < bl ? g : bl
        const sat = (maxC - minC) / (maxC || 1)
        if ((luma >= 180 && (sat >= 0.3 || luma >= 232)) || (maxC >= 215 && sat >= 0.62 && luma >= 110)) {
          emis[idx] = 1
          emissiveSeeds.push({ x: x - w * 0.5, y: y - h * 0.5, z, r, g, b: bl })
        }
      }
    }
  }

  // 积雪：朝上的暴露面，用确定性哈希做出自然的厚薄差异（1..4）
  const snowMask = new Uint8Array(total)
  for (let z = 0; z < count; z++) {
    const b = bounds[z]
    if (b.empty) continue
    const zBase = z * area
    for (let y = b.minY; y <= b.maxY; y++) {
      const row = zBase + y * w
      for (let x = b.minX; x <= b.maxX; x++) {
        const idx = row + x
        if (!occ[idx] || emis[idx]) continue
        if (normZ[idx] > 0.42 && (z === count - 1 || !occ[idx + area])) {
          snowMask[idx] = 1 + ((x * 7 + y * 13 + z * 3) & 3)
        }
      }
    }
  }

  const lightPools = []
  if (emissiveSeeds.length > 0) {
    const step = Math.max(1, Math.floor(emissiveSeeds.length / 20))
    for (let i = 0; i < emissiveSeeds.length && lightPools.length < 20; i += step) {
      lightPools.push(emissiveSeeds[i])
    }
  }

  return {
    n: count,
    w,
    h,
    area,
    occ,
    rgb,
    rgb32,
    normX,
    normY,
    normZ,
    ao,
    emis,
    snowMask,
    bounds,
    lightPools,
  }
}

/** 供 Drive 玩具使用的连续地面投影 / 碎片数据 */
export function buildShatterParticles(volume, max = 2600) {
  const { w, h, area, occ, rgb32, emis } = volume
  const n = volume.n
  const list = []
  for (let z = 0; z < n; z++) {
    const b = volume.bounds[z]
    if (b.empty) continue
    const zBase = z * area
    for (let y = b.minY; y <= b.maxY; y++) {
      const row = zBase + y * w
      for (let x = b.minX; x <= b.maxX; x++) {
        const idx = row + x
        if (!occ[idx]) continue
        // 只取外壳体素，避免内部碎片过多
        const surface =
          !occ[idx - 1] || !occ[idx + 1] || !occ[idx - w] || !occ[idx + w] || x === 0 || x === w - 1
        if (!surface) continue
        list.push({ x: x - w * 0.5, y: y - h * 0.5, z, col: rgb32[idx], em: emis[idx] })
      }
    }
  }
  const countOut = Math.min(max, list.length)
  const step = Math.max(1, Math.ceil(list.length / countOut))
  const out = []
  for (let i = 0; i < list.length && out.length < countOut; i += step) out.push(list[i])
  return out
}

/**
 * 像素光栅器：自带 scratch canvas，可多实例（主视图 / 导出各一个）。
 */
export class VoxelRasterizer {
  constructor() {
    this.canvas = document.createElement('canvas')
    this.ctx = this.canvas.getContext('2d')
    this.imgData = null
    this.out32 = null
    this.out8 = null
    this.alpha = null
    this.emis = null
    this.shadow = null
    this.cw = 0
    this.ch = 0
    this._sb = [0, 0, 0, 0]
  }

  ensure(cw, ch) {
    if (this.cw === cw && this.ch === ch && this.imgData) return
    this.cw = cw
    this.ch = ch
    this.canvas.width = cw
    this.canvas.height = ch
    this.imgData = this.ctx.createImageData(cw, ch)
    this.out32 = new Uint32Array(this.imgData.data.buffer)
    this.out8 = this.imgData.data
    this.alpha = new Uint8Array(cw * ch)
    this.emis = new Uint8Array(cw * ch)
    this.shadow = new Uint8Array(cw * ch)
  }

  boundsFor(b, w, h, cx, yCenter, ca, sa, squash, cw, ch) {
    const x0 = b.minX - w * 0.5
    const x1 = b.maxX + 1 - w * 0.5
    const y0 = b.minY - h * 0.5
    const y1 = b.maxY + 1 - h * 0.5
    const c0x = x0 * ca - y0 * sa
    const c0y = (x0 * sa + y0 * ca) * squash
    const c1x = x1 * ca - y0 * sa
    const c1y = (x1 * sa + y0 * ca) * squash
    const c2x = x0 * ca - y1 * sa
    const c2y = (x0 * sa + y1 * ca) * squash
    const c3x = x1 * ca - y1 * sa
    const c3y = (x1 * sa + y1 * ca) * squash
    const sb = this._sb
    sb[0] = Math.max(0, Math.floor(cx + Math.min(c0x, c1x, c2x, c3x)) - 1)
    sb[1] = Math.min(cw - 1, Math.ceil(cx + Math.max(c0x, c1x, c2x, c3x)) + 1)
    sb[2] = Math.max(0, Math.floor(yCenter + Math.min(c0y, c1y, c2y, c3y)) - 1)
    sb[3] = Math.min(ch - 1, Math.ceil(yCenter + Math.max(c0y, c1y, c2y, c3y)) + 1)
  }

  /**
   * @returns {{canvas:HTMLCanvasElement,cw:number,ch:number,cx:number,baseY:number}}
   */
  rasterize(opts) {
    const vol = opts.volume
    if (!vol) return null
    const n = Math.min(vol.n, Math.max(1, opts.maxSlices || vol.n))
    const { w, h, area, occ, rgb, rgb32, normX, normY, normZ, ao, emis, snowMask, bounds, lightPools } = vol
    const env = opts.env || getLightingEnv()
    const squash = Math.max(0.25, Math.min(1, opts.squash ?? 0.75))
    const spacing = Math.max(0.25, opts.spacing ?? 1)
    const room = opts.room ?? spacing
    const shadow = opts.shadow !== false
    const outline = opts.outline !== false
    const lighting = opts.lighting !== false
    const snowCover = Math.max(0, Math.min(1, opts.snowCover ?? 0))

    const diag = Math.ceil(Math.hypot(w, h)) + 6
    const liftMax = Math.ceil((vol.n - 1) * Math.max(room, 1))
    const shadowPad = shadow ? Math.ceil(vol.n * 1.1) : 0
    const cw = opts.cwOverride || diag + 16 + shadowPad * 2
    const ch = opts.chOverride || Math.ceil(diag * squash) + liftMax + 20 + Math.ceil(shadowPad * squash)
    const cx = opts.cxOverride || cw >> 1
    const baseY = opts.baseYOverride || ch - Math.ceil((diag * squash) / 2) - 8 - Math.ceil(shadowPad * squash * 0.45)

    this.ensure(cw, ch)
    const out32 = this.out32
    const out8 = this.out8
    const alphaMask = this.alpha
    const emisMask = this.emis
    const shadowMask = this.shadow

    out32.fill(0)
    alphaMask.fill(0)
    emisMask.fill(0)

    const rad = ((opts.angleDeg || 0) * Math.PI) / 180
    const ca = Math.cos(rad)
    const sa = Math.sin(rad)
    const invSquash = 1 / Math.max(squash, 0.1)

    const objLx = env.lx * ca + env.ly * sa
    const objLy = -env.lx * sa + env.ly * ca
    const objLz = env.lz
    const shear = opts.shearPerSlice || null
    const leanX = opts.leanX || 0
    const invN = 1 / Math.max(1, n - 1)

    // 1. 逐层投影到地面的阴影
    if (shadow) {
      shadowMask.fill(0)
      const shStep = n > 44 ? 2 : 1
      for (let z = 0; z < n; z += shStep) {
        const b = bounds[z]
        if (b.empty) continue
        const zBase = z * area
        const sxOff = shear ? shear[z] : leanX * (z * invN)
        const scx = cx + sxOff + z * spacing * env.shDx * 0.38
        const scy = baseY + 1 + z * spacing * env.shDy * 0.38 * squash
        this.boundsFor(b, w, h, scx, scy, ca, sa, squash, cw, ch)
        const sb = this._sb
        const xMin = sb[0]
        const xMax = sb[1]
        const yMin = sb[2]
        const yMax = sb[3]
        if (xMin > xMax || yMin > yMax) continue
        for (let y = yMin; y <= yMax; y++) {
          const dy = (y - scy) * invSquash
          let sx = (xMin - scx) * ca + dy * sa + w * 0.5
          let sy = -(xMin - scx) * sa + dy * ca + h * 0.5
          let idx = y * cw + xMin
          for (let x = xMin; x <= xMax; x++, idx++, sx += ca, sy -= sa) {
            if (shadowMask[idx]) continue
            const ix = sx | 0
            const iy = sy | 0
            if (sx >= 0 && sy >= 0 && ix < w && iy < h && occ[zBase + iy * w + ix]) {
              shadowMask[idx] = 1
              out32[idx] = env.shPacked
            }
          }
        }
      }
    }

    // 2. 黄昏 / 夜晚的地面灯光池
    if (lighting && env.emisGlow > 0.04 && lightPools.length > 0) {
      const glow = env.emisGlow * 0.52
      const radPx = 10
      const radSq = radPx * radPx
      for (let i = 0; i < lightPools.length; i++) {
        const lp = lightPools[i]
        const gx = Math.round(cx + (lp.x * ca - lp.y * sa))
        const gy = Math.round(baseY + (lp.x * sa + lp.y * ca) * squash)
        const y0 = Math.max(0, gy - Math.ceil(radPx * squash))
        const y1 = Math.min(ch - 1, gy + Math.ceil(radPx * squash))
        const x0 = Math.max(0, gx - radPx)
        const x1 = Math.min(cw - 1, gx + radPx)
        for (let y = y0; y <= y1; y++) {
          const dy = (y - gy) * invSquash
          const dy2 = dy * dy
          for (let x = x0; x <= x1; x++) {
            const dx = x - gx
            const d2 = dx * dx + dy2
            if (d2 >= radSq) continue
            const f = d2 < radSq * 0.35 ? glow : glow * 0.45
            const p = (y * cw + x) * 4
            if (out8[p + 3] === 0) {
              out8[p] = clampByte(env.bgR + lp.r * f)
              out8[p + 1] = clampByte(env.bgG + lp.g * f)
              out8[p + 2] = clampByte(env.bgB + lp.b * f)
              out8[p + 3] = Math.round(Math.min(255, f * 260))
            } else {
              out8[p] = clampByte(out8[p] + lp.r * f)
              out8[p + 1] = clampByte(out8[p + 1] + lp.g * f)
              out8[p + 2] = clampByte(out8[p + 2] + lp.b * f)
            }
          }
        }
      }
    }

    // 3. 自下而上堆叠切片
    const snowLevel = snowCover * 4.2
    const hasSnow = snowLevel > 0.25
    const shR = env.shMulR
    const shG = env.shMulG
    const shB = env.shMulB
    const midR = env.midMulR
    const midG = env.midMulG
    const midB = env.midMulB
    const litR = env.litMulR
    const litG = env.litMulG
    const litB = env.litMulB
    const highlightZ = opts.highlight ?? -1

    for (let z = 0; z < n; z++) {
      const b = bounds[z]
      if (b.empty) continue
      const zBase = z * area
      const lift = Math.round(z * spacing)
      const sxOff = shear ? shear[z] : leanX * (z * invN)
      const sliceCx = cx + sxOff
      const yCenter = baseY - lift
      this.boundsFor(b, w, h, sliceCx, yCenter, ca, sa, squash, cw, ch)
      const sb = this._sb
      const xMin = sb[0]
      const xMax = sb[1]
      const yMin = sb[2]
      const yMax = sb[3]
      if (xMin > xMax || yMin > yMax) continue
      const isHighlight = z === highlightZ

      for (let y = yMin; y <= yMax; y++) {
        const dy = (y - yCenter) * invSquash
        let sx = (xMin - sliceCx) * ca + dy * sa + w * 0.5
        let sy = -(xMin - sliceCx) * sa + dy * ca + h * 0.5
        let idx = y * cw + xMin
        for (let x = xMin; x <= xMax; x++, idx++, sx += ca, sy -= sa) {
          if (sx < 0 || sy < 0) continue
          const ix = sx | 0
          const iy = sy | 0
          if (ix >= w || iy >= h) continue
          const vIdx = zBase + iy * w + ix
          if (!occ[vIdx]) continue

          alphaMask[idx] = 1
          const isSnow = hasSnow && snowMask[vIdx] > 0 && snowMask[vIdx] <= snowLevel

          if (!lighting && !isHighlight) {
            out32[idx] = isSnow ? 0xfff8f4ee : rgb32[vIdx]
            continue
          }

          if (emis[vIdx] && env.emisGlow > 0.05) {
            emisMask[idx] = 1
            const p3 = vIdx * 3
            const boost = 1 + env.emisGlow * 0.42
            const r = clampByte(rgb[p3] * boost + env.emisGlow * 28)
            const g = clampByte(rgb[p3 + 1] * boost + env.emisGlow * 24)
            const bl = clampByte(rgb[p3 + 2] * boost + env.emisGlow * 18)
            out32[idx] = (0xff000000 | (bl << 16) | (g << 8) | r) >>> 0
            continue
          }

          const ndotl = normX[vIdx] * objLx + normY[vIdx] * objLy + normZ[vIdx] * objLz
          const occAO = ao[vIdx]
          let mr, mg, mb
          if (ndotl > 0.36) {
            mr = litR * occAO
            mg = litG * occAO
            mb = litB * occAO
          } else if (ndotl > -0.14) {
            mr = midR * occAO
            mg = midG * occAO
            mb = midB * occAO
          } else {
            mr = shR * occAO
            mg = shG * occAO
            mb = shB * occAO
          }
          if (isHighlight) {
            mr *= 1.22
            mg *= 1.22
            mb *= 1.22
          }
          let br, bg, bb
          if (isSnow) {
            br = 238
            bg = 245
            bb = 255
          } else {
            const p3 = vIdx * 3
            br = rgb[p3]
            bg = rgb[p3 + 1]
            bb = rgb[p3 + 2]
          }
          const rr = Math.min(255, (br * mr) | 0)
          const gg = Math.min(255, (bg * mg) | 0)
          const bl = Math.min(255, (bb * mb) | 0)
          out32[idx] = (0xff000000 | (bl << 16) | (gg << 8) | rr) >>> 0
        }
      }
    }

    // 4. 1px 外描边
    if (outline) {
      const olPacked = env.olPacked
      for (let y = 1; y < ch - 1; y++) {
        let idx = y * cw + 1
        for (let x = 1; x < cw - 1; x++, idx++) {
          if (alphaMask[idx]) continue
          if (alphaMask[idx - 1] || alphaMask[idx + 1] || alphaMask[idx - cw] || alphaMask[idx + cw]) {
            out32[idx] = olPacked
          }
        }
      }
    }

    // 5. 自发光像素的 1px 辉光
    if (lighting && env.emisGlow > 0.12) {
      const haloA = env.emisGlow * 0.48
      for (let y = 1; y < ch - 1; y++) {
        let idx = y * cw + 1
        for (let x = 1; x < cw - 1; x++, idx++) {
          if (emisMask[idx]) continue
          let src = -1
          if (emisMask[idx - 1]) src = idx - 1
          else if (emisMask[idx + 1]) src = idx + 1
          else if (emisMask[idx - cw]) src = idx - cw
          else if (emisMask[idx + cw]) src = idx + cw
          if (src < 0) continue
          const sp = src * 4
          const dp = idx * 4
          if (out8[dp + 3] === 0) {
            out8[dp] = out8[sp]
            out8[dp + 1] = out8[sp + 1]
            out8[dp + 2] = out8[sp + 2]
            out8[dp + 3] = Math.round(haloA * 220)
          } else {
            out8[dp] = clampByte(out8[dp] + out8[sp] * haloA)
            out8[dp + 1] = clampByte(out8[dp + 1] + out8[sp + 1] * haloA)
            out8[dp + 2] = clampByte(out8[dp + 2] + out8[sp + 2] * haloA)
          }
        }
      }
    }

    this.ctx.putImageData(this.imgData, 0, 0)
    return { canvas: this.canvas, cw, ch, cx, baseY }
  }
}
