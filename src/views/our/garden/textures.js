// 江南园林场景 - 程序化贴图（Canvas 生成 PBR 颜色/粗糙度/法线贴图）
import * as THREE from 'three'
import { rng } from './util'

function makeCanvas(w, h) {
  const c = document.createElement('canvas')
  c.width = w; c.height = h
  return [c, c.getContext('2d')]
}

function toTex(c, { srgb = true, repeat = [1, 1] } = {}) {
  const t = new THREE.CanvasTexture(c)
  t.wrapS = t.wrapT = THREE.RepeatWrapping
  t.repeat.set(repeat[0], repeat[1])
  t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace
  t.anisotropy = 8
  return t
}

// ---- 值噪声 ----
function noiseCtx(seed) {
  const r = rng(seed)
  const P = new Uint8Array(512)
  const perm = Array.from({ length: 256 }, (_, i) => i)
  for (let i = 255; i > 0; i--) { const j = Math.floor(r.r() * (i + 1));[perm[i], perm[j]] = [perm[j], perm[i]] }
  for (let i = 0; i < 512; i++) P[i] = perm[i & 255]
  const grid = new Float32Array(256 * 256)
  for (let i = 0; i < grid.length; i++) grid[i] = r.r()
  const val = (xi, yi) => grid[((yi & 255) << 8) | (xi & 255)]
  function noise2(x, y) {
    const xi = Math.floor(x), yi = Math.floor(y)
    const xf = x - xi, yf = y - yi
    const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf)
    const a = val(xi, yi), b = val(xi + 1, yi), c = val(xi, yi + 1), d = val(xi + 1, yi + 1)
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v
  }
  function fbm(x, y, oct = 4, lac = 2, gain = 0.5) {
    let s = 0, amp = 1, freq = 1, norm = 0
    for (let o = 0; o < oct; o++) { s += noise2(x * freq, y * freq) * amp; norm += amp; amp *= gain; freq *= lac }
    return s / norm
  }
  return { noise2, fbm, r }
}

// ============ 木纹（竖纹） ============
export function woodTexture({ seed = 3, base = [92, 58, 38], dark = [58, 33, 22], light = [122, 82, 54], rings = 14, size = 512 } = {}) {
  const [c, g] = makeCanvas(size, size)
  const n = noiseCtx(seed)
  const img = g.createImageData(size, size)
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const u = x / size, v = y / size
      const warp = n.fbm(u * 6, v * 1.2, 3) * 1.6
      const ring = Math.abs(Math.sin((v * rings + warp * 2.2 + n.fbm(u * 14, v * 3, 2)) * Math.PI))
      const grain = n.fbm(u * 90, v * 6, 2)
      const streak = n.fbm(u * 3 + 9, v * 40, 3)
      let t = ring * 0.55 + streak * 0.45
      t = Math.pow(t, 1.2 - grain * 0.5)
      const col = [0, 1, 2].map((i) => dark[i] + (light[i] - dark[i]) * t)
      const baseMix = 0.55
      const out = [0, 1, 2].map((i) => col[i] * (1 - baseMix) + (base[i]) * baseMix)
      const spec = (n.fbm(u * 5, v * 60, 2) - 0.5) * 26
      const i4 = (y * size + x) * 4
      img.data[i4] = out[0] + spec; img.data[i4 + 1] = out[1] + spec; img.data[i4 + 2] = out[2] + spec; img.data[i4 + 3] = 255
    }
  }
  g.putImageData(img, 0, 0)
  // 深色长节疤
  for (let k = 0; k < 5; k++) {
    const x = n.r.f(size), y0 = n.r.f(size), len = n.r.f(40, 150), w = n.r.f(2, 5)
    g.strokeStyle = `rgba(${dark[0]},${dark[1]},${dark[2]},0.35)`
    g.lineWidth = w
    g.beginPath(); g.moveTo(x, y0)
    g.bezierCurveTo(x + 8, y0 + len * 0.3, x - 8, y0 + len * 0.6, x + 3, y0 + len)
    g.stroke()
  }
  return toTex(c)
}

export function woodRough(seed = 3, size = 256) {
  const [c, g] = makeCanvas(size, size)
  const n = noiseCtx(seed + 7)
  const img = g.createImageData(size, size)
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const v = (0.42 + n.fbm(x / size * 8, y / size * 40, 3) * 0.35) * 255
    const i4 = (y * size + x) * 4
    img.data[i4] = img.data[i4 + 1] = img.data[i4 + 2] = v; img.data[i4 + 3] = 255
  }
  g.putImageData(img, 0, 0)
  return toTex(c, { srgb: false })
}

// ============ 粉墙（白灰） ============
export function plasterTexture(seed = 11, size = 512) {
  const [c, g] = makeCanvas(size, size)
  const n = noiseCtx(seed)
  const img = g.createImageData(size, size)
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const u = x / size, v = y / size
    const m = n.fbm(u * 8, v * 8, 4)
    const fine = n.fbm(u * 60, v * 60, 2)
    let lum = 226 + (m - 0.5) * 22 + (fine - 0.5) * 10
    // 微妙的黄斑（岁月）
    const stain = Math.max(0, n.fbm(u * 4 + 5, v * 4, 3) - 0.62) * 3
    const r = lum + stain * 14, gg = lum + stain * 6, b = lum - stain * 4
    const i4 = (y * size + x) * 4
    img.data[i4] = r; img.data[i4 + 1] = gg; img.data[i4 + 2] = b; img.data[i4 + 3] = 255
  }
  g.putImageData(img, 0, 0)
  // 抹灰刀痕（斜向细线）
  g.strokeStyle = 'rgba(190,186,175,0.16)'; g.lineWidth = 1
  for (let k = 0; k < 26; k++) {
    const y0 = n.r.f(size); g.beginPath(); g.moveTo(0, y0)
    g.bezierCurveTo(size * 0.3, y0 + n.r.f(-14, 14), size * 0.7, y0 + n.r.f(-14, 14), size, y0 + n.r.f(-8, 8)); g.stroke()
  }
  return toTex(c)
}

// ============ 黛瓦（屋顶） ============
export function roofTileTexture(seed = 21, size = 256) {
  const [c, g] = makeCanvas(size, size)
  const n = noiseCtx(seed)
  const img = g.createImageData(size, size)
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const u = x / size, v = y / size
    const m = n.fbm(u * 12, v * 12, 3)
    const moss = Math.max(0, n.fbm(u * 6 + 3, v * 6, 3) - 0.6) * 2.4
    let r = 48 + (m - 0.5) * 24 - moss * 24
    let gg = 52 + (m - 0.5) * 24 + moss * 10
    let b = 58 + (m - 0.5) * 24 - moss * 12
    const i4 = (y * size + x) * 4
    img.data[i4] = r; img.data[i4 + 1] = gg; img.data[i4 + 2] = b; img.data[i4 + 3] = 255
  }
  g.putImageData(img, 0, 0)
  return toTex(c)
}

// ============ 青砖（地面/墙基） ============
export function brickTexture(seed = 31, size = 512) {
  const [c, g] = makeCanvas(size, size)
  const n = noiseCtx(seed)
  const cols = 4, rows = 8, bw = size / cols, bh = size / rows
  g.fillStyle = '#3f4348'; g.fillRect(0, 0, size, size) // 灰浆
  for (let r = 0; r < rows; r++) {
    const off = (r % 2) * bw * 0.5
    for (let ci = -1; ci <= cols; ci++) {
      const x = ci * bw + off + 2, y = r * bh + 2, w = bw - 4, h = bh - 4
      const m = n.fbm((ci + 3) * 1.7, (r + 3) * 1.7, 3)
      const wear = n.fbm(ci * 5 + r, r * 5 + ci, 2)
      const base = 88 + (m - 0.5) * 30 - wear * 12
      g.fillStyle = `rgb(${base + 6},${base + 8},${base + 12})`
      g.fillRect(x, y, w, h)
      // 砖面麻点与边角磨圆暗色
      g.strokeStyle = `rgba(40,44,50,${0.25 + wear * 0.2})`; g.lineWidth = 1.5
      g.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1)
      for (let d = 0; d < 26; d++) {
        g.fillStyle = `rgba(30,33,38,${n.r.f(0.05, 0.22)})`
        g.fillRect(x + n.r.f(w), y + n.r.f(h), n.r.f(1, 3), n.r.f(1, 3))
      }
    }
  }
  return toTex(c)
}

// ============ 石板（台阶/路面） ============
export function stoneTexture(seed = 41, size = 512, tint = [128, 130, 132]) {
  const [c, g] = makeCanvas(size, size)
  const n = noiseCtx(seed)
  const img = g.createImageData(size, size)
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const u = x / size, v = y / size
    const m = n.fbm(u * 9, v * 9, 4)
    const sp = n.fbm(u * 80, v * 80, 2)
    const crack = Math.abs(n.fbm(u * 5 + 2, v * 5, 3) - 0.5)
    let dark = crack < 0.035 ? 0.82 : 1
    let r = (tint[0] + (m - 0.5) * 34 + (sp - 0.5) * 16) * dark
    let gg = (tint[1] + (m - 0.5) * 34 + (sp - 0.5) * 16) * dark
    let b = (tint[2] + (m - 0.5) * 32 + (sp - 0.5) * 16) * dark
    const i4 = (y * size + x) * 4
    img.data[i4] = r; img.data[i4 + 1] = gg; img.data[i4 + 2] = b; img.data[i4 + 3] = 255
  }
  g.putImageData(img, 0, 0)
  // 裂纹
  g.strokeStyle = 'rgba(52,54,58,0.5)'
  for (let k = 0; k < 7; k++) {
    let x = n.r.f(size), y = n.r.f(size)
    g.lineWidth = n.r.f(0.6, 1.6); g.beginPath(); g.moveTo(x, y)
    for (let s = 0; s < 6; s++) { x += n.r.f(-40, 40); y += n.r.f(-40, 40); g.lineTo(x, y) }
    g.stroke()
  }
  return toTex(c)
}

// ============ 湖石 ============
export function rockTexture(seed = 51, size = 512) {
  const [c, g] = makeCanvas(size, size)
  const n = noiseCtx(seed)
  const img = g.createImageData(size, size)
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const u = x / size, v = y / size
    const m = n.fbm(u * 7, v * 7, 5)
    const hole = Math.abs(n.fbm(u * 10 + 4, v * 10, 3) - 0.5)
    let lum = 108 + (m - 0.5) * 60 - (hole < 0.06 ? 30 : 0)
    const lich = Math.max(0, n.fbm(u * 14, v * 14 + 9, 2) - 0.68) * 3
    let r = lum + lich * 18, gg = lum + lich * 26, b = lum + lich * 8
    const i4 = (y * size + x) * 4
    img.data[i4] = r; img.data[i4 + 1] = gg; img.data[i4 + 2] = b; img.data[i4 + 3] = 255
  }
  g.putImageData(img, 0, 0)
  return toTex(c)
}

// ============ 地面泥土+苔藓 ============
export function groundTexture(seed = 61, size = 1024) {
  const [c, g] = makeCanvas(size, size)
  const n = noiseCtx(seed)
  const img = g.createImageData(size, size)
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const u = x / size, v = y / size
    const m = n.fbm(u * 10, v * 10, 5)
    const moss = smooth2(Math.max(0, n.fbm(u * 5 + 7, v * 5 + 2, 4) - 0.52) * 3)
    const grassy = smooth2(Math.max(0, n.fbm(u * 3 + 2, v * 3 + 8, 3) - 0.55) * 3.2)
    // 泥土基色
    let r = 74 + (m - 0.5) * 36, gg = 64 + (m - 0.5) * 30, b = 46 + (m - 0.5) * 22
    // 苔藓绿
    r = r * (1 - moss) + 74 * moss; gg = gg * (1 - moss) + 96 * moss; b = b * (1 - moss) + 52 * moss
    r = r * (1 - grassy) + 88 * grassy; gg = gg * (1 - grassy) + 104 * grassy; b = b * (1 - grassy) + 58 * grassy
    const sp = (n.fbm(u * 90, v * 90, 2) - 0.5) * 22
    const i4 = (y * size + x) * 4
    img.data[i4] = r + sp; img.data[i4 + 1] = gg + sp; img.data[i4 + 2] = b + sp * 0.6; img.data[i4 + 3] = 255
  }
  g.putImageData(img, 0, 0)
  return toTex(c, { repeat: [7, 7] })
}
function smooth2(t) { t = Math.min(1, t); return t * t * (3 - 2 * t) }

// ============ 水面法线（用于 Water 与湿地面涟漪） ============
export function waterNormalsTexture(size = 256) {
  const [c, g] = makeCanvas(size, size)
  const n = noiseCtx(77)
  const img = g.createImageData(size, size)
  const hAt = (x, y) => {
    let h = 0
    h += Math.sin(x * 0.11 + n.fbm(x * 0.02, y * 0.02, 2) * 6) * 0.5
    h += Math.sin(y * 0.13 + 1.7 + n.fbm(x * 0.015 + 4, y * 0.018, 2) * 5) * 0.4
    h += Math.sin((x + y) * 0.07 + 3.1) * 0.3
    h += n.fbm(x * 0.03, y * 0.03, 3) * 1.4
    return h
  }
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const e = 1.5
    const dx = hAt(x + e, y) - hAt(x - e, y)
    const dy = hAt(x, y + e) - hAt(x, y - e)
    let nx = -dx * 0.55, ny = -dy * 0.55, nz = 1
    const l = Math.hypot(nx, ny, nz); nx /= l; ny /= l; nz /= l
    const i4 = (y * size + x) * 4
    img.data[i4] = (nx * 0.5 + 0.5) * 255; img.data[i4 + 1] = (ny * 0.5 + 0.5) * 255; img.data[i4 + 2] = (nz * 0.5 + 0.5) * 255; img.data[i4 + 3] = 255
  }
  g.putImageData(img, 0, 0)
  return toTex(c, { srgb: false, repeat: [1, 1] })
}

// ============ 叶片贴图（带透明通道） ============
function leafBase(size = 128) { const [c, g] = makeCanvas(size, size); return [c, g] }

// 枫/杂树树冠贴图：方形内密布小叶簇，边缘不规则
export function canopyTexture({ seed = 81, hues = [[92, 112, 48], [72, 96, 40], [118, 128, 56]], size = 256, spread = 0.94 } = {}) {
  const [c, g] = leafBase(size)
  const n = noiseCtx(seed)
  const cx = size / 2, cy = size / 2
  for (let k = 0; k < 900; k++) {
    const a = n.r.f(Math.PI * 2), rad = Math.pow(n.r.r(), 0.5) * size * 0.48 * spread
    const x = cx + Math.cos(a) * rad, y = cy + Math.sin(a) * rad
    // 边缘噪声裁剪
    const edge = 1 - rad / (size * 0.48 * spread)
    if (n.fbm(x / size * 6, y / size * 6, 2) > 0.62 + edge * 0.2) continue
    const hue = n.r.pick(hues)
    const s = n.r.f(3, 9) * (0.6 + edge)
    g.fillStyle = `rgba(${hue[0] + n.r.f(-14, 18)},${hue[1] + n.r.f(-12, 14)},${hue[2] + n.r.f(-10, 12)},${n.r.f(0.5, 0.95)})`
    g.beginPath(); g.ellipse(x, y, s, s * n.r.f(0.5, 0.9), n.r.f(Math.PI), 0, Math.PI * 2); g.fill()
  }
  const t = toTex(c)
  t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping
  return t
}

// 松针簇
export function pineTexture({ seed = 82, dark = [42, 66, 40], size = 256 } = {}) {
  const [c, g] = leafBase(size)
  const n = noiseCtx(seed)
  const cx = size / 2
  for (let k = 0; k < 150; k++) {
    const a = n.r.f(Math.PI * 2), rad = Math.pow(n.r.r(), 0.6) * size * 0.46
    const x = cx + Math.cos(a) * rad, y = size / 2 + Math.sin(a) * rad
    g.strokeStyle = `rgba(${dark[0] + n.r.f(-8, 26)},${dark[1] + n.r.f(-6, 22)},${dark[2] + n.r.f(-6, 18)},${n.r.f(0.6, 1)})`
    g.lineWidth = n.r.f(0.8, 1.6)
    const dir = n.r.f(Math.PI * 2), len = n.r.f(8, 26)
    g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(dir) * len, y + Math.sin(dir) * len); g.stroke()
  }
  // 深色枝
  g.strokeStyle = 'rgba(46,36,26,0.9)'; g.lineWidth = 3
  g.beginPath(); g.moveTo(size * 0.2, size * 0.62); g.quadraticCurveTo(size * 0.5, size * 0.5, size * 0.82, size * 0.55); g.stroke()
  const t = toTex(c); t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping
  return t
}

// 竹叶（细长）
export function bambooLeafTexture({ seed = 83, size = 128 } = {}) {
  const [c, g] = leafBase(size)
  const n = noiseCtx(seed)
  const grad = g.createLinearGradient(0, 0, size, 0)
  grad.addColorStop(0, 'rgba(64,92,44,0.9)'); grad.addColorStop(1, 'rgba(96,128,58,0.85)')
  g.fillStyle = grad
  g.beginPath()
  g.moveTo(4, size * 0.5)
  g.quadraticCurveTo(size * 0.4, size * 0.2, size - 6, size * 0.5)
  g.quadraticCurveTo(size * 0.4, size * 0.8, 4, size * 0.5)
  g.fill()
  g.strokeStyle = 'rgba(52,76,36,0.7)'; g.lineWidth = 1.5
  g.beginPath(); g.moveTo(6, size * 0.5); g.lineTo(size - 8, size * 0.5); g.stroke()
  const t = toTex(c); t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping
  return t
}

// 柳条叶（披针形，密集）
export function willowTexture({ seed = 84, size = 256 } = {}) {
  const [c, g] = leafBase(size)
  const n = noiseCtx(seed)
  for (let k = 0; k < 46; k++) {
    const x0 = n.r.f(size), len = n.r.f(size * 0.4, size * 0.9), y0 = n.r.f(-10, 10)
    const sway = n.r.f(-26, 26)
    g.strokeStyle = `rgba(${n.r.i(88, 132)},${n.r.i(122, 158)},${n.r.i(56, 82)},${n.r.f(0.55, 0.95)})`
    g.lineWidth = n.r.f(2.4, 4.4)
    g.beginPath(); g.moveTo(x0, y0)
    g.quadraticCurveTo(x0 + sway * 0.4, y0 + len * 0.5, x0 + sway, y0 + len)
    g.stroke()
  }
  const t = toTex(c); t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping
  return t
}

// 梅花（含花）
export function plumTexture({ seed = 85, size = 256, bloom = true } = {}) {
  const [c, g] = leafBase(size)
  const n = noiseCtx(seed)
  for (let k = 0; k < 700; k++) {
    const a = n.r.f(Math.PI * 2), rad = Math.pow(n.r.r(), 0.5) * size * 0.47
    const x = size / 2 + Math.cos(a) * rad, y = size / 2 + Math.sin(a) * rad
    if (n.fbm(x / size * 5, y / size * 5, 2) > 0.66) continue
    g.fillStyle = `rgba(${n.r.i(52, 78)},${n.r.i(84, 108)},${n.r.i(44, 62)},${n.r.f(0.5, 0.9)})`
    g.beginPath(); g.ellipse(x, y, n.r.f(3, 7), n.r.f(2, 5), n.r.f(Math.PI), 0, Math.PI * 2); g.fill()
  }
  if (bloom) for (let k = 0; k < 26; k++) {
    const x = n.r.f(size * 0.15, size * 0.85), y = n.r.f(size * 0.15, size * 0.85)
    for (let p = 0; p < 5; p++) {
      const a = (p / 5) * Math.PI * 2 + n.r.f(0.3)
      g.fillStyle = `rgba(${n.r.i(226, 248)},${n.r.i(196, 220)},${n.r.i(206, 228)},0.95)`
      g.beginPath(); g.ellipse(x + Math.cos(a) * 4.6, y + Math.sin(a) * 4.6, 3.6, 3, a, 0, Math.PI * 2); g.fill()
    }
    g.fillStyle = 'rgba(180,120,60,0.9)'; g.beginPath(); g.arc(x, y, 1.8, 0, Math.PI * 2); g.fill()
  }
  const t = toTex(c); t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping
  return t
}

// 蕨叶
export function fernTexture({ seed = 86, size = 128 } = {}) {
  const [c, g] = leafBase(size)
  const n = noiseCtx(seed)
  g.strokeStyle = 'rgba(58,88,40,0.9)'
  g.lineWidth = 3
  g.beginPath(); g.moveTo(size * 0.5, size); g.quadraticCurveTo(size * 0.46, size * 0.5, size * 0.5, 6); g.stroke()
  for (let s = 0; s < 16; s++) {
    const t = s / 16, y = size - 8 - t * (size - 20)
    const len = (1 - Math.abs(t - 0.45) * 1.4) * size * 0.4 + 6
    g.strokeStyle = `rgba(${n.r.i(56, 92)},${n.r.i(92, 126)},${n.r.i(40, 62)},0.95)`
    g.lineWidth = 2
    g.beginPath(); g.moveTo(size * 0.5, y); g.lineTo(size * 0.5 - len, y - size * 0.05); g.stroke()
    g.beginPath(); g.moveTo(size * 0.5, y); g.lineTo(size * 0.5 + len, y - size * 0.05); g.stroke()
  }
  const t = toTex(c); t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping
  return t
}

// 草丛
export function grassTexture({ seed = 87, size = 128, hue = [116, 146, 76] } = {}) {
  const [c, g] = leafBase(size)
  const n = noiseCtx(seed)
  for (let k = 0; k < 26; k++) {
    const x0 = n.r.f(size), top = n.r.f(size * 0.1, size * 0.5), bend = n.r.f(-18, 18)
    g.strokeStyle = `rgba(${hue[0] + n.r.f(-24, 24)},${hue[1] + n.r.f(-20, 20)},${hue[2] + n.r.f(-16, 14)},${n.r.f(0.7, 1)})`
    g.lineWidth = n.r.f(2, 3.6)
    g.beginPath(); g.moveTo(x0, size); g.quadraticCurveTo(x0 + bend * 0.3, size * 0.55, x0 + bend, top); g.stroke()
  }
  const t = toTex(c); t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping
  return t
}

// 芭蕉叶（大叶）
export function bananaLeafTexture({ seed = 88, size = 256 } = {}) {
  const [c, g] = leafBase(size)
  const n = noiseCtx(seed)
  g.beginPath()
  g.moveTo(size * 0.5, size - 4)
  g.bezierCurveTo(size * 0.02, size * 0.72, size * 0.02, size * 0.3, size * 0.5, 4)
  g.bezierCurveTo(size * 0.98, size * 0.3, size * 0.98, size * 0.72, size * 0.5, size - 4)
  g.closePath()
  const grad = g.createLinearGradient(0, 0, 0, size)
  grad.addColorStop(0, 'rgba(84,116,52,1)'); grad.addColorStop(1, 'rgba(48,78,40,1)')
  g.fillStyle = grad; g.fill()
  g.save(); g.clip()
  g.strokeStyle = 'rgba(38,62,34,0.5)'; g.lineWidth = 1.4
  for (let i = 1; i < 22; i++) {
    const t = i / 22
    g.beginPath(); g.moveTo(size * 0.5, size); g.lineTo(t * size, 0); g.stroke()
  }
  g.restore()
  g.strokeStyle = 'rgba(40,66,36,0.95)'; g.lineWidth = 4
  g.beginPath(); g.moveTo(size * 0.5, size - 4); g.lineTo(size * 0.5, 6); g.stroke()
  // 破损裂口
  g.globalCompositeOperation = 'destination-out'
  for (let k = 0; k < 5; k++) {
    const y = n.r.f(size * 0.25, size * 0.8), side = n.r.sign(), x = size * 0.5 + side * size * n.r.f(0.2, 0.45)
    g.lineWidth = n.r.f(1.5, 3); g.beginPath(); g.moveTo(x, y); g.lineTo(x + side * 30, y + n.r.f(-6, 6)); g.stroke()
  }
  g.globalCompositeOperation = 'source-over'
  const t = toTex(c); t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping
  return t
}

// ============ 水墨画（中堂/横幅） ============
export function inkPaintingTexture({ seed = 91, w = 512, h = 768, mountains = true } = {}) {
  const [c, g] = makeCanvas(w, h)
  const n = noiseCtx(seed)
  g.fillStyle = '#efe8d8'; g.fillRect(0, 0, w, h)
  // 纸纤维
  for (let k = 0; k < 400; k++) {
    g.strokeStyle = `rgba(180,168,140,${n.r.f(0.03, 0.1)})`
    const x = n.r.f(w), y = n.r.f(h)
    g.beginPath(); g.moveTo(x, y); g.lineTo(x + n.r.f(-30, 30), y + n.r.f(-4, 4)); g.stroke()
  }
  const ink = (a) => `rgba(52,54,60,${a})`
  if (mountains) {
    // 远山
    for (let layer = 0; layer < 3; layer++) {
      const baseY = h * (0.42 + layer * 0.14)
      g.fillStyle = ink(0.16 + layer * 0.1)
      g.beginPath(); g.moveTo(0, baseY + 40)
      let x = 0
      while (x < w) {
        const peak = n.r.f(0.1, 0.34) * h * (1 - layer * 0.18)
        const step = n.r.f(w * 0.1, w * 0.3)
        g.quadraticCurveTo(x + step / 2, baseY - peak, x + step, baseY - n.r.f(-10, 30))
        x += step
      }
      g.lineTo(w, baseY + 60); g.lineTo(0, baseY + 60); g.closePath(); g.fill()
    }
    // 近处坡石+树
    g.fillStyle = ink(0.5)
    g.beginPath(); g.moveTo(0, h * 0.92)
    g.quadraticCurveTo(w * 0.3, h * 0.8, w * 0.55, h * 0.88)
    g.quadraticCurveTo(w * 0.8, h * 0.93, w, h * 0.86)
    g.lineTo(w, h); g.lineTo(0, h); g.closePath(); g.fill()
    g.strokeStyle = ink(0.75); g.lineWidth = 2
    for (let k = 0; k < 4; k++) {
      const x = w * (0.12 + k * 0.2), y = h * (0.86 + n.r.f(-0.03, 0.02))
      g.beginPath(); g.moveTo(x, y); g.lineTo(x + n.r.f(-4, 4), y - n.r.f(20, 40)); g.stroke()
      g.fillStyle = ink(0.4)
      for (let l = 0; l < 8; l++) g.fillRect(x + n.r.f(-14, 14), y - n.r.f(24, 46), n.r.f(3, 9), 1.6)
    }
    // 小舟
    g.strokeStyle = ink(0.7); g.lineWidth = 2
    const bx = w * 0.68, by = h * 0.7
    g.beginPath(); g.moveTo(bx - 14, by); g.quadraticCurveTo(bx, by + 6, bx + 14, by); g.stroke()
    g.beginPath(); g.moveTo(bx, by - 1); g.lineTo(bx, by - 12); g.moveTo(bx, by - 12); g.lineTo(bx + 7, by - 8); g.stroke()
  }
  // 题款与印章
  g.fillStyle = ink(0.85); g.font = `${Math.round(h * 0.045)}px "Kaiti", "STKaiti", serif`
  const chars = ['溪', '山', '清', '远']
  chars.forEach((ch, i) => g.fillText(ch, w * 0.84, h * 0.14 + i * h * 0.05))
  g.fillStyle = 'rgba(178,52,44,0.9)'
  g.fillRect(w * 0.845, h * 0.36, h * 0.036, h * 0.036)
  return toTex(c)
}

// ============ 屏风绢面 ============
export function screenTexture(seed = 92, w = 512, h = 256) {
  const [c, g] = makeCanvas(w, h)
  const n = noiseCtx(seed)
  g.fillStyle = '#d9cdb4'; g.fillRect(0, 0, w, h)
  for (let k = 0; k < 300; k++) {
    g.strokeStyle = `rgba(160,148,120,${n.r.f(0.04, 0.12)})`
    const x = n.r.f(w), y = n.r.f(h)
    g.beginPath(); g.moveTo(x, y); g.lineTo(x + n.r.f(-40, 40), y); g.stroke()
  }
  // 墨梅一枝
  g.strokeStyle = 'rgba(58,56,60,0.8)'
  g.lineWidth = 5
  g.beginPath(); g.moveTo(w * 0.12, h * 0.9); g.bezierCurveTo(w * 0.35, h * 0.6, w * 0.5, h * 0.55, w * 0.85, h * 0.2); g.stroke()
  g.lineWidth = 2.4
  g.beginPath(); g.moveTo(w * 0.5, h * 0.55); g.quadraticCurveTo(w * 0.6, h * 0.5, w * 0.68, h * 0.68); g.stroke()
  const n2 = noiseCtx(seed + 3)
  for (let k = 0; k < 10; k++) {
    const x = w * n2.r.f(0.2, 0.86), y = h * n2.r.f(0.18, 0.75)
    for (let p = 0; p < 5; p++) {
      const a = (p / 5) * Math.PI * 2
      g.fillStyle = `rgba(210,170,180,0.85)`
      g.beginPath(); g.ellipse(x + Math.cos(a) * 5, y + Math.sin(a) * 5, 4, 3.2, a, 0, Math.PI * 2); g.fill()
    }
    g.fillStyle = 'rgba(150,90,50,0.9)'; g.beginPath(); g.arc(x, y, 2, 0, Math.PI * 2); g.fill()
  }
  return toTex(c)
}

// ============ 灯笼纸 ============
export function lanternTexture(size = 128) {
  const [c, g] = makeCanvas(size, size)
  const n = noiseCtx(95)
  g.fillStyle = '#f4e2c0'; g.fillRect(0, 0, size, size)
  for (let k = 0; k < 200; k++) {
    g.strokeStyle = `rgba(200,170,120,${n.r.f(0.05, 0.15)})`
    const x = n.r.f(size), y = n.r.f(size)
    g.beginPath(); g.moveTo(x, y); g.lineTo(x + n.r.f(-16, 16), y + n.r.f(-16, 16)); g.stroke()
  }
  return toTex(c)
}

// ============ 雨丝 / 光斑 / 烟 sprites ============
export function streakTexture() {
  const [c, g] = makeCanvas(16, 64)
  const grad = g.createLinearGradient(0, 0, 0, 64)
  grad.addColorStop(0, 'rgba(200,215,230,0)')
  grad.addColorStop(0.5, 'rgba(210,225,240,0.55)')
  grad.addColorStop(1, 'rgba(200,215,230,0)')
  g.fillStyle = grad
  g.fillRect(6.5, 0, 3, 64)
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace
  return t
}

export function glowTexture() {
  const [c, g] = makeCanvas(128, 128)
  const grad = g.createRadialGradient(64, 64, 2, 64, 64, 64)
  grad.addColorStop(0, 'rgba(255,255,255,1)')
  grad.addColorStop(0.3, 'rgba(255,255,255,0.45)')
  grad.addColorStop(1, 'rgba(255,255,255,0)')
  g.fillStyle = grad; g.fillRect(0, 0, 128, 128)
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace
  return t
}

export function smokeTexture() {
  const [c, g] = makeCanvas(128, 128)
  const n = noiseCtx(97)
  const img = g.createImageData(128, 128)
  for (let y = 0; y < 128; y++) for (let x = 0; x < 128; x++) {
    const d = Math.hypot(x - 64, y - 64) / 64
    const a = Math.max(0, 1 - d) * Math.max(0, n.fbm(x / 28, y / 28, 3) - 0.35) * 1.6
    const i4 = (y * 128 + x) * 4
    img.data[i4] = img.data[i4 + 1] = img.data[i4 + 2] = 235; img.data[i4 + 3] = Math.min(255, a * 255)
  }
  g.putImageData(img, 0, 0)
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace
  return t
}

// 湿地积水泥泞斑块（贴在低洼处）
export function puddleTexture() {
  const [c, g] = makeCanvas(256, 256)
  const n = noiseCtx(99)
  const img = g.createImageData(256, 256)
  for (let y = 0; y < 256; y++) for (let x = 0; x < 256; x++) {
    const d = Math.hypot(x - 128, y - 128) / 128
    const m = n.fbm(x / 30, y / 30, 3)
    const a = Math.max(0, 1 - d) * smooth2(m * 1.8 - 0.3)
    const i4 = (y * 256 + x) * 4
    img.data[i4] = 190; img.data[i4 + 1] = 200; img.data[i4 + 2] = 205; img.data[i4 + 3] = a * 255
  }
  g.putImageData(img, 0, 0)
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace
  t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping
  return t
}
