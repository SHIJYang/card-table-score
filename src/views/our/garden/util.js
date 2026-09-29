// 江南园林场景 - 通用工具：确定性随机、几何变换与合并、世界尺度 UV
import * as THREE from 'three'
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js'

export function mulberry32(seed) {
  let a = seed >>> 0
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// 带种子的随机器：f() 均匀 [0,1)，f(a,b) 区间，i() 整数，pick() 选取
export function rng(seed = 1) {
  const r = mulberry32(seed)
  const f = (a = 1, b) => (b === undefined ? r() * a : a + r() * (b - a))
  return {
    r, f,
    i: (a, b) => Math.floor(f(a, b + 1)),
    pick: (arr) => arr[Math.floor(r() * arr.length)],
    sign: () => (r() < 0.5 ? -1 : 1),
  }
}

const _m = new THREE.Matrix4()
const _e = new THREE.Euler()
const _q = new THREE.Quaternion()
const _p = new THREE.Vector3()
const _s = new THREE.Vector3()

export function xform(geo, p = [0, 0, 0], r = [0, 0, 0], s = 1) {
  const g = geo.clone()
  if (typeof s === 'number') s = [s, s, s]
  _e.set(r[0], r[1], r[2]); _q.setFromEuler(_e)
  _p.set(p[0], p[1], p[2]); _s.set(s[0], s[1], s[2])
  _m.compose(_p, _q, _s)
  g.applyMatrix4(_m)
  return g
}

// parts: 每项为 geometry 或 [geo, px,py,pz, rx,ry,rz, sx,sy,sz]
export function merge(parts) {
  const geos = parts.map((it) => {
    if (Array.isArray(it)) return xform(it[0], [it[1], it[2], it[3]], [it[4] || 0, it[5] || 0, it[6] || 0], it[7] === undefined ? 1 : it[7])
    return it
  })
  // mergeGeometries 要求索引属性一致：存在非索引几何时统一转非索引
  let prepared = geos
  if (geos.some((g) => !g.index)) {
    prepared = geos.map((g) => (g.index ? g.toNonIndexed() : g))
  }
  const out = mergeGeometries(prepared, false)
  geos.forEach((g) => g.dispose())
  prepared.forEach((g) => { if (!geos.includes(g)) g.dispose() })
  return out
}

// BoxGeometry 的 uv 是每面 0..1，按世界尺寸缩放，保证贴图密度一致
export function scaleBoxUV(g, w, h, d, s = 0.5) {
  // 面顺序: px, nx, py, ny, pz, nz
  const dims = [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]]
  const uv = g.attributes.uv
  for (let f = 0; f < 6; f++) {
    const [a, b] = dims[f]
    for (let v = 0; v < 4; v++) {
      const i = f * 4 + v
      uv.setXY(i, uv.getX(i) * a * s, uv.getY(i) * b * s)
    }
  }
  return g
}

export function boxGeo(w, h, d, uvScale = 0.5) {
  return scaleBoxUV(new THREE.BoxGeometry(w, h, d), w, h, d, uvScale)
}

// 圆柱侧面 uv 按周长缩放
export function cylGeo(rt, rb, h, seg = 12, uvScale = 0.5, capped = true) {
  const g = new THREE.CylinderGeometry(rt, rb, h, seg, 1, !capped)
  const uv = g.attributes.uv
  const circ = Math.PI * (rt + rb)
  for (let i = 0; i < uv.count; i++) {
    if (!capped && true) uv.setXY(i, uv.getX(i) * circ * uvScale, uv.getY(i) * h * uvScale)
    else if (uv.getY(i) >= 0.999 || uv.getY(i) <= 0.001) { /* cap 保持 */ }
  }
  return g
}

export function clamp(v, a, b) { return Math.max(a, Math.min(b, v)) }
export function lerp(a, b, t) { return a + (b - a) * t }
export function smoothstep(a, b, t) { const x = clamp((t - a) / (b - a), 0, 1); return x * x * (3 - 2 * x) }

// 由两个轴向（局部 X、局部 Y）构造正交基四元数
const _bx = new THREE.Vector3()
const _by = new THREE.Vector3()
const _bz = new THREE.Vector3()
const _bm = new THREE.Matrix4()
export function basisQuat(xAxis, yAxis) {
  _bx.set(xAxis[0], xAxis[1], xAxis[2]).normalize()
  _by.set(yAxis[0], yAxis[1], yAxis[2]).normalize()
  _bz.crossVectors(_bx, _by).normalize()
  _by.crossVectors(_bz, _bx).normalize()
  _bm.makeBasis(_bx, _by, _bz)
  return new THREE.Quaternion().setFromRotationMatrix(_bm)
}

// 点是否在多边形内（俯视, x/z）
export function pointInPoly(x, z, poly) {
  let inside = false
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i][0], zi = poly[i][1], xj = poly[j][0], zj = poly[j][1]
    if ((zi > z) !== (zj > z) && x < ((xj - xi) * (z - zi)) / (zj - zi) + xi) inside = !inside
  }
  return inside
}

// 世界上下文：碰撞盒 / 平台面 / 阻挡区
export class WorldCtx {
  constructor() {
    this.walls = []    // {x1,z1,x2,z2,h} 阻挡盒（含家具）
    this.decks = []    // {x1,z1,x2,z2,h} 可站立平台
    this.ramps = []    // {x1,z1,x2,z2,axis:'x'|'z',from,to,h1,h2} 坡道/台阶
    this.blocks = []   // {poly} 不可进入区域（水面）
    this.emitters = [] // 檐口滴水点 {x,y,z}
  }
  wall(x1, z1, x2, z2, h = 2.6) { this.walls.push({ x1: Math.min(x1, x2), z1: Math.min(z1, z2), x2: Math.max(x1, x2), z2: Math.max(z1, z2), h }) }
  deck(x1, z1, x2, z2, h) { this.decks.push({ x1: Math.min(x1, x2), z1: Math.min(z1, z2), x2: Math.max(x1, x2), z2: Math.max(z1, z2), h }) }
  ramp(x1, z1, x2, z2, axis, h1, h2) { this.ramps.push({ x1: Math.min(x1, x2), z1: Math.min(z1, z2), x2: Math.max(x1, x2), z2: Math.max(z1, z2), axis, h1, h2 }) }
  block(poly) { this.blocks.push(poly) }
}

// 材质辅助：给一批 mesh 共用材质
export function mesh(geo, mat, cast = true, recv = true) {
  const m = new THREE.Mesh(geo, mat)
  m.castShadow = cast; m.receiveShadow = recv
  return m
}
