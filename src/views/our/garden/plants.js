// 江南园林场景 - 植物系统：乔木/灌木/竹/芭蕉/水生/地被（程序化 + 风摆）
import * as THREE from 'three'
import { merge, boxGeo, cylGeo, rng, clamp, pointInPoly } from './util'

// 带风摆属性的叶片卡片
function leafCard(w, h, segs = 2) {
  const g = new THREE.PlaneGeometry(w, h, 1, segs)
  const pos = g.attributes.position
  const a = new Float32Array(pos.count)
  for (let i = 0; i < pos.count; i++) a[i] = clamp(pos.getY(i) / h + 0.5, 0, 1)
  g.setAttribute('aWing', new THREE.BufferAttribute(a, 1))
  return g
}

// 为普通几何补零风摆属性（供 applyWind 材质使用）
function zeroWing(g) {
  g.setAttribute('aWing', new THREE.BufferAttribute(new Float32Array(g.attributes.position.count), 1))
  return g
}

// 沿折线生成变径树干管
function tubeAlong(pts, r0, r1, radial = 7) {
  const geos = []
  const curve = new THREE.CatmullRomCurve3(pts)
  const n = Math.max(6, pts.length * 3)
  let prev = curve.getPoint(0)
  const up = new THREE.Vector3(0, 1, 0)
  for (let i = 1; i <= n; i++) {
    const t = i / n
    const p = curve.getPoint(t)
    const r = r0 + (r1 - r0) * t
    const dir = p.clone().sub(prev)
    const len = dir.length()
    if (len < 1e-4) continue
    const g = new THREE.CylinderGeometry(r, r * 1.08, len * 1.12, radial, 1)
    _q.setFromUnitVectors(up, dir.normalize())
    _m4.compose(prev.clone().addScaledVector(dir, len * 0.5), _q, _s1)
    g.applyMatrix4(_m4)
    geos.push(g)
    prev = p
  }
  return merge(geos)
}

const _up = new THREE.Vector3(0, 1, 0)
const _q = new THREE.Quaternion()
const _m4 = new THREE.Matrix4()
const _s1 = new THREE.Vector3(1, 1, 1)

// ---------- 树种 ----------
function pineTree(R) {
  const g = new THREE.Group()
  const lean = R.f(-0.16, 0.16)
  const H = R.f(4.6, 6.2)
  const pts = [new THREE.Vector3(0, 0, 0)]
  let p = new THREE.Vector3(0, 0, 0), dir = new THREE.Vector3(lean, 1, lean * 0.7).normalize()
  for (let i = 0; i < 7; i++) {
    p = p.clone().addScaledVector(dir, H / 7)
    dir.applyAxisAngle(_up, R.f(-0.5, 0.5)).lerp(new THREE.Vector3(lean, 1, lean * 0.7).normalize(), 0.5).normalize()
    pts.push(p.clone())
  }
  const trunk = new THREE.Mesh(tubeAlong(pts, 0.19, 0.05, 8), null)
  const barkG = trunk.geometry
  const branchGeos = []
  const leafGeos = []
  const nBr = R.i(4, 5)
  for (let b = 0; b < nBr; b++) {
    const t = 0.3 + (b / nBr) * 0.6
    const base = curvePoint(pts, t)
    const bdir = new THREE.Vector3(R.f(-1, 1), R.f(0.15, 0.5), R.f(-1, 1)).normalize()
    const bpts = [base.clone()]
    let bp = base.clone(), bd = bdir.clone()
    for (let s = 0; s < 3; s++) {
      bp = bp.clone().addScaledVector(bd, R.f(0.5, 0.9) * (1 - t * 0.4))
      bd.y -= 0.18
      bd.normalize()
      bpts.push(bp.clone())
    }
    branchGeos.push(tubeAlong(bpts, 0.07 * (1 - t * 0.5), 0.02, 6))
    // 枝端松针簇
    const tip = bpts[bpts.length - 1]
    for (let c = 0; c < 6; c++) {
      const card = leafCard(R.f(1.3, 2.1), R.f(0.55, 0.85), 1)
      card.rotateX(-Math.PI / 2 + R.f(-0.55, 0.35))
      card.rotateY(R.f(Math.PI * 2))
      card.translate(tip.x + R.f(-0.35, 0.35), tip.y - R.f(0, 0.3), tip.z + R.f(-0.35, 0.35))
      leafGeos.push(card)
    }
    // 中部也补一簇
    const mid = bpts[1]
    for (let c = 0; c < 2; c++) {
      const card2 = leafCard(R.f(0.9, 1.5), 0.55, 1)
      card2.rotateX(-Math.PI / 2 + R.f(-0.4, 0.4))
      card2.rotateY(R.f(Math.PI * 2))
      card2.translate(mid.x, mid.y - 0.1, mid.z)
      leafGeos.push(card2)
    }
  }
  // 顶簇
  const top = pts[pts.length - 1]
  for (let c = 0; c < 5; c++) {
    const card = leafCard(R.f(1.1, 1.7), 0.65, 1)
    card.rotateX(-Math.PI / 2 + R.f(-0.45, 0.4))
    card.rotateY(R.f(Math.PI * 2))
    card.translate(top.x + R.f(-0.3, 0.3), top.y + R.f(0, 0.25), top.z + R.f(-0.3, 0.3))
    leafGeos.push(card)
  }
  const bark = new THREE.Mesh(merge([barkG, ...branchGeos]), null)
  const leaves = new THREE.Mesh(merge(leafGeos), null)
  return { bark, leaves, H }
}

function broadTree(R, leafMatKey, spread = 1, trunkR = 0.17) {
  const H = R.f(3.6, 5.2) * spread
  const pts = [new THREE.Vector3(0, 0, 0)]
  let p = new THREE.Vector3(), dir = new THREE.Vector3(R.f(-0.1, 0.1), 1, R.f(-0.1, 0.1)).normalize()
  for (let i = 0; i < 6; i++) {
    p = p.clone().addScaledVector(dir, H / 6)
    dir.applyAxisAngle(_up, R.f(-0.6, 0.6)).normalize()
    pts.push(p.clone())
  }
  const branchGeos = [tubeAlong(pts, trunkR, 0.045, 8)]
  const leafGeos = []
  const nCard = R.i(7, 10)
  for (let i = 0; i < nCard; i++) {
    const t = R.f(0.45, 1.0)
    const center = curvePoint(pts, t)
    const off = new THREE.Vector3(R.f(-1, 1), R.f(0.2, 0.9), R.f(-1, 1)).normalize().multiplyScalar(R.f(0.3, 1.3) * spread)
    const size = R.f(1.4, 2.4) * spread
    const card = leafCard(size, size * R.f(0.5, 0.8), 2)
    card.rotateX(R.f(-0.5, 0.35))
    card.rotateY(R.f(Math.PI * 2))
    card.translate(center.x + off.x, center.y + off.y, center.z + off.z)
    leafGeos.push(card)
  }
  const bark = new THREE.Mesh(merge(branchGeos), null)
  const leaves = new THREE.Mesh(merge(leafGeos), null)
  return { bark, leaves, H }
}

function plumTree(R) {
  const H = R.f(2.8, 3.8)
  const pts = [new THREE.Vector3(0, 0, 0)]
  let p = new THREE.Vector3(), dir = new THREE.Vector3(R.f(0.25, 0.5) * R.sign(), 1, R.f(-0.2, 0.2)).normalize()
  for (let i = 0; i < 5; i++) {
    p = p.clone().addScaledVector(dir, H / 5)
    dir.applyAxisAngle(_up, R.f(-0.9, 0.9)).normalize()
    pts.push(p.clone())
  }
  const branchGeos = [tubeAlong(pts, 0.13, 0.035, 7)]
  const leafGeos = []
  for (let b = 0; b < 3; b++) {
    const t = R.f(0.4, 0.8)
    const base = curvePoint(pts, t)
    const bpts = [base.clone()]
    let bp = base.clone()
    const bd = new THREE.Vector3(R.f(-1, 1), R.f(0.3, 0.8), R.f(-1, 1)).normalize()
    bp = bp.clone().addScaledVector(bd, R.f(0.8, 1.3))
    bpts.push(bp)
    branchGeos.push(tubeAlong(bpts, 0.05, 0.02, 5))
  }
  const nCard = R.i(6, 9)
  for (let i = 0; i < nCard; i++) {
    const t = R.f(0.5, 1.0)
    const center = curvePoint(pts, t)
    const off = new THREE.Vector3(R.f(-1, 1), R.f(0.1, 0.7), R.f(-1, 1)).normalize().multiplyScalar(R.f(0.2, 0.9))
    const size = R.f(1.0, 1.8)
    const card = leafCard(size, size * R.f(0.45, 0.7), 2)
    card.rotateX(R.f(-0.5, 0.4))
    card.rotateY(R.f(Math.PI * 2))
    card.translate(center.x + off.x, center.y + off.y, center.z + off.z)
    leafGeos.push(card)
  }
  const bark = new THREE.Mesh(merge(branchGeos), null)
  const leaves = new THREE.Mesh(merge(leafGeos), null)
  return { bark, leaves, H }
}

function willowTree(R) {
  const H = R.f(4.5, 5.5)
  const pts = [new THREE.Vector3(0, 0, 0)]
  let p = new THREE.Vector3(), dir = new THREE.Vector3(R.f(-0.2, 0.2), 1, R.f(-0.2, 0.2)).normalize()
  for (let i = 0; i < 5; i++) {
    p = p.clone().addScaledVector(dir, H / 5)
    dir.applyAxisAngle(_up, R.f(-0.5, 0.5)).normalize()
    pts.push(p.clone())
  }
  const branchGeos = [tubeAlong(pts, 0.2, 0.06, 8)]
  const leafGeos = []
  const nBr = R.i(7, 9)
  for (let b = 0; b < nBr; b++) {
    const t = R.f(0.55, 0.95)
    const base = curvePoint(pts, t)
    const bd = new THREE.Vector3(R.f(-1, 1), R.f(0.1, 0.5), R.f(-1, 1)).normalize()
    const out = R.f(1.2, 2.2)
    const tip = base.clone().addScaledVector(bd, out)
    tip.y = base.y - out * R.f(0.5, 0.9)
    branchGeos.push(tubeAlong([base.clone(), base.clone().lerp(tip, 0.4).add(new THREE.Vector3(0, 0.2, 0)), tip], 0.045, 0.015, 5))
    // 垂帘叶条
    for (let s = 0; s < 5; s++) {
      const at = base.clone().lerp(tip, R.f(0.25, 0.85))
      const h = R.f(1.8, 3.0)
      const card = leafCard(R.f(0.35, 0.6), h, 3)
      card.rotateY(R.f(Math.PI * 2))
      card.rotateX(R.f(-0.06, 0.06))
      card.translate(at.x, at.y - h * 0.42, at.z)
      leafGeos.push(card)
    }
  }
  const bark = new THREE.Mesh(merge(branchGeos), null)
  const leaves = new THREE.Mesh(merge(leafGeos), null)
  return { bark, leaves, H }
}

function bananaPlant(R) {
  const H = R.f(1.9, 2.7)
  const bark = new THREE.Mesh(
    merge([
      cylGeo(0.07, 0.1, H * 0.55, 8, 0.5).translate(0, H * 0.27, 0),
    ]), null)
  const leafGeos = []
  const n = R.i(6, 8)
  for (let i = 0; i < n; i++) {
    const card = leafCard(R.f(1.4, 2.0), R.f(0.5, 0.7), 4)
    const a = (i / n) * Math.PI * 2 + R.f(-0.3, 0.3)
    const droop = R.f(0.25, 0.65) // 叶尖下垂
    card.rotateX(-Math.PI / 2 - droop)
    card.rotateY(a)
    card.translate(Math.cos(a) * 0.15, H * R.f(0.5, 0.62), Math.sin(a) * 0.15)
    leafGeos.push(card)
  }
  const leaves = new THREE.Mesh(merge(leafGeos), null)
  return { bark, leaves, H }
}

function curvePoint(pts, t) {
  const curve = new THREE.CatmullRomCurve3(pts)
  return curve.getPoint(t)
}

// ---------- 主构建 ----------
export function buildPlants(ctx, M, pondPoly, R0 = 400) {
  const G = new THREE.Group()
  const R = rng(R0)
  const depthMats = {}
  const depthFor = (mat) => {
    if (!depthMats[mat.uuid]) {
      depthMats[mat.uuid] = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, map: mat.map, alphaTest: 0.5 })
    }
    return depthMats[mat.uuid]
  }

  const placeTree = (proto, x, z, { s = 1, rotY = null, sink = 0 } = {}) => {
    const g = new THREE.Group()
    const bark = new THREE.Mesh(proto.bark.geometry, proto.barkMat)
    const leaves = new THREE.Mesh(proto.leaves.geometry, proto.leafMat)
    leaves.customDepthMaterial = depthFor(proto.leafMat)
    bark.castShadow = true; bark.receiveShadow = true
    leaves.castShadow = true
    g.add(bark, leaves)
    g.position.set(x, -sink, z)
    g.rotation.y = rotY === null ? R.f(Math.PI * 2) : rotY
    g.scale.setScalar(s)
    G.add(g)
    return g
  }

  const protos = {}
  function makeProto(key, buildFn, barkMat, leafMat, count = 3) {
    protos[key] = []
    for (let i = 0; i < count; i++) {
      const t = buildFn(R)
      t.barkMat = barkMat; t.leafMat = leafMat
      protos[key].push(t)
    }
  }
  makeProto('pine', pineTree, M.barkPine, M.pine, 3)
  makeProto('maple', (R) => broadTree(R, 'red', 1), M.bark, M.leafCanopyRed, 3)
  makeProto('green', (R) => broadTree(R, 'green', 0.9), M.bark, M.leafCanopy, 3)
  makeProto('plum', plumTree, M.bark, M.leafPlum, 3)
  makeProto('willow', willowTree, M.bark, M.willow, 2)
  makeProto('banana', bananaPlant, M.barkBanana, M.banana, 3)

  const put = (key, x, z, opt) => placeTree(R.pick(protos[key]), x, z, opt)

  // ===== 布局 =====
  put('pine', -14.6, -11.6, { s: 1.25 })          // 假山古松
  put('pine', -16.5, 7.5, { s: 1.0 })
  put('green', -16.8, -6.0, { s: 0.9 })
  put('maple', -7.6, 3.2, { s: 1.0 })
  put('maple', -5.6, 5.8, { s: 0.8 })
  put('green', 16.6, -11.6, { s: 1.05 })
  put('green', 17.8, 11.0, { s: 0.85 })
  put('plum', 5.9, -0.5, { s: 1.0, rotY: 2.4 })   // 堂前斜梅
  put('plum', -11.6, 5.2, { s: 0.9 })
  put('willow', 6.6, 11.6, { s: 1.0, rotY: 1.2 }) // 池畔垂柳
  put('willow', 17.9, 2.4, { s: 0.9 })
  put('banana', -7.7, -5.1, { s: 1.05 })          // 书房窗外听雨芭蕉
  put('banana', -7.4, -3.5, { s: 0.85 })
  put('banana', 2.6, 6.1, { s: 0.9 })
  put('green', -17.5, 11.0, { s: 0.9 })
  put('green', 18.9, -8.0, { s: 0.8 })

  // 碰撞：乔木树干
  for (const [x, z] of [[-14.6, -11.6], [-16.5, 7.5], [-7.6, 3.2], [-5.6, 5.8], [5.9, -0.5], [-11.6, 5.2], [6.6, 11.6], [17.9, 2.4], [-7.7, -5.1], [2.6, 6.1]]) {
    ctx.wall(x - 0.35, z - 0.35, x + 0.35, z + 0.35, 2)
  }

  // ===== 竹丛（实例化） =====
  {
    const culmG = new THREE.CylinderGeometry(0.024, 0.036, 1, 6, 1)
    culmG.translate(0, 0.5, 0)
    const spots = [[-12.2, -8.2, 26], [-13.0, -2.0, 20], [-12.4, 1.8, 16], [-9.2, -13.2, 18], [2.6, -13.6, 14], [10.5, -13.4, 16], [18.6, -4.5, 12], [-17.0, 2.2, 12]]
    const total = spots.reduce((a, s) => a + s[2], 0)
    const culms = new THREE.InstancedMesh(culmG, M.bambooCulm, total)
    // 叶片：交叉双面
    const leafGeo = leafCard(0.62, 0.1, 1)
    const leafGeo2 = leafCard(0.5, 0.09, 1)
    leafGeo2.rotateY(Math.PI / 2)
    const leafPair = merge([leafGeo, leafGeo2])
    const leaves = new THREE.InstancedMesh(leafPair, M.bamboo, total * 9)
    let ci = 0, li = 0
    for (const [bx, bz, n] of spots) {
      for (let i = 0; i < n; i++) {
        const x = bx + R.f(-1.3, 1.3), z = bz + R.f(-1.3, 1.3)
        const h = R.f(3.4, 6.0)
        const lean = R.f(-0.06, 0.06)
        _q.setFromEuler(new THREE.Euler(lean, R.f(Math.PI * 2), R.f(-0.06, 0.06)))
        _m4.compose(new THREE.Vector3(x, 0, z), _q, new THREE.Vector3(1, h, 1))
        culms.setMatrixAt(ci, _m4)
        const tint = R.f(0.75, 1.1)
        culms.setColorAt(ci, new THREE.Color(tint * 0.72, tint * 0.82, tint * 0.5))
        ci++
        const nLeaf = 9
        for (let l = 0; l < nLeaf; l++) {
          const ly = h * R.f(0.55, 1.0)
          _q.setFromEuler(new THREE.Euler(R.f(-0.3, 0.2), R.f(Math.PI * 2), R.f(-0.35, 0.35)))
          _m4.compose(new THREE.Vector3(x + R.f(-0.12, 0.12), ly, z + R.f(-0.12, 0.12)), _q, new THREE.Vector3(R.f(0.9, 1.8), 1, 1))
          leaves.setMatrixAt(li, _m4)
          li++
        }
      }
    }
    culms.count = ci; leaves.count = li
    culms.castShadow = true; culms.receiveShadow = true
    leaves.castShadow = true
    leaves.customDepthMaterial = depthFor(M.bamboo)
    G.add(culms, leaves)
    // 撞盒
    for (const [bx, bz] of spots) ctx.wall(bx - 1.05, bz - 1.05, bx + 1.05, bz + 1.05, 2.5)
  }

  // ===== 灌木（低矮叶团） =====
  {
    const shrubGeos = []
    const spots = [[-4.6, 2.4], [-3.6, 2.2], [4.3, 1.2], [6.9, 2.6], [-8.9, 1.3], [-9.4, 1.8], [11.8, -2.6], [8.4, -1.6], [-12.0, 8.4], [-6.4, -12.6], [7.4, -12.8], [18.9, 12.3], [-1.9, 9.8], [-16.2, -9.6], [18.2, 6.2], [9.2, 3.2]]
    for (const [bx, bz] of spots) {
      const nC = R.i(3, 5)
      for (let i = 0; i < nC; i++) {
        const s = R.f(0.55, 1.0)
        const card = leafCard(s * 1.4, s * 0.9, 2)
        card.rotateX(R.f(-0.4, 0.2))
        card.rotateY(R.f(Math.PI * 2))
        card.translate(bx + R.f(-0.4, 0.4), s * 0.45, bz + R.f(-0.4, 0.4))
        shrubGeos.push(card)
      }
      ctx.wall(bx - 0.5, bz - 0.5, bx + 0.5, bz + 0.5, 1)
    }
    const shrub = new THREE.Mesh(merge(shrubGeos), M.leafCanopy)
    shrub.customDepthMaterial = depthFor(M.leafCanopy)
    shrub.castShadow = true
    G.add(shrub)
  }

  // ===== 草丛 / 蕨 / 苔 =====
  {
    const grassG = leafCard(0.52, 0.42, 2)
    const grassG2 = leafCard(0.46, 0.38, 2)
    grassG2.rotateY(Math.PI / 2)
    const grassPair = merge([grassG, grassG2])
    const N = 900
    const grass = new THREE.InstancedMesh(grassPair, M.grass, N)
    let gi = 0
    let guard = 0
    while (gi < N && guard++ < N * 12) {
      const x = R.f(-19, 20), z = R.f(-14.4, 12.6)
      if (pointInPoly(x, z, pondPoly)) continue
      if (x > -7.6 && x < 7.6 && z > -12.0 && z < -1.8) continue // 台基
      if (x > -7.2 && x < 7.2 && z > -1.4 && z < 6.6) continue   // 庭院砖地
      if (Math.abs(x + 10) < 0.6) continue                        // 内墙
      _q.setFromEuler(new THREE.Euler(0, R.f(Math.PI * 2), 0))
      _m4.compose(new THREE.Vector3(x, 0.02, z), _q, new THREE.Vector3(R.f(0.7, 1.6), R.f(0.6, 1.5), 1))
      grass.setMatrixAt(gi, _m4)
      const tint = R.f(0.7, 1.15)
      grass.setColorAt(gi, new THREE.Color(tint * 0.8, tint, tint * 0.72))
      gi++
    }
    grass.count = gi
    grass.castShadow = false; grass.receiveShadow = true
    grass.customDepthMaterial = depthFor(M.grass)
    G.add(grass)

    // 蕨（墙根/石畔）
    const fernG = leafCard(0.55, 0.42, 2)
    const fernG2 = leafCard(0.5, 0.4, 2)
    fernG2.rotateY(Math.PI / 2)
    const fernPair = merge([fernG, fernG2])
    const ferns = new THREE.InstancedMesh(fernPair, M.fern, 70)
    const fernSpots = [[-18.6, -13.0], [-18.4, -8.5], [-18.6, 0.5], [-18.5, 5.5], [-8.9, -12.9], [-4.4, -12.9], [0.6, -12.9], [5.8, -12.8], [13.4, -12.8], [19.8, -12.9], [19.8, -6.0], [19.8, 2.2], [19.8, 9.0], [12.6, 12.2], [4.0, 12.3], [-2.0, 12.2], [-6.8, 12.3], [-13.9, 12.3], [-16.6, 12.4], [-13.9, -12.6], [11.2, -3.0], [16.2, -3.4]]
    for (let i = 0; i < 70; i++) {
      const s = R.pick(fernSpots)
      _q.setFromEuler(new THREE.Euler(0, R.f(Math.PI * 2), 0))
      _m4.compose(new THREE.Vector3(s[0] + R.f(-0.5, 0.5), 0.02, s[1] + R.f(-0.4, 0.4)), _q, new THREE.Vector3(R.f(0.8, 1.7), R.f(0.7, 1.6), 1))
      ferns.setMatrixAt(i, _m4)
    }
    ferns.castShadow = false
    G.add(ferns)
  }

  // ===== 荷叶与荷花（池面） =====
  {
    const padG = new THREE.CircleGeometry(0.3, 14, 0.5, 5.4)
    padG.rotateX(-Math.PI / 2)
    const a = new Float32Array(padG.attributes.position.count)
    padG.setAttribute('aWing', new THREE.BufferAttribute(a, 1))
    const cx0 = 12.6, cz0 = 8.4
    const pads = new THREE.InstancedMesh(padG, M.lotusPad, 46)
    for (let i = 0; i < 46; i++) {
      const x = cx0 + R.f(-2.8, 2.2), z = cz0 + R.f(-2.2, 2.0)
      _q.setFromEuler(new THREE.Euler(R.f(-0.06, 0.06), R.f(Math.PI * 2), R.f(-0.06, 0.06)))
      _m4.compose(new THREE.Vector3(x, -0.24 + R.f(-0.02, 0.03), z), _q, new THREE.Vector3(R.f(0.5, 1.25), 1, R.f(0.5, 1.25)))
      pads.setMatrixAt(i, _m4)
      const tint = R.f(0.75, 1.1)
      pads.setColorAt(i, new THREE.Color(tint * 0.75, tint * 0.95, tint * 0.6))
    }
    pads.castShadow = false
    G.add(pads)
    // 花
    const flowerG = new THREE.Group()
    const petalMat = M.lotusFlower
    for (let f = 0; f < 6; f++) {
      const fl = new THREE.Group()
      for (let p = 0; p < 8; p++) {
        const pl = new THREE.Mesh(zeroWing(new THREE.PlaneGeometry(0.1, 0.22, 1, 2)), petalMat)
        const a = (p / 8) * Math.PI * 2
        pl.position.set(Math.cos(a) * 0.06, 0.08, Math.sin(a) * 0.06)
        pl.rotation.set(-1.05 - (p % 2) * 0.25, -a, 0)
        fl.add(pl)
      }
      const core = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.04, 0.05, 8), new THREE.MeshStandardMaterial({ color: 0xe8c25a, roughness: 0.7 }))
      core.position.y = 0.06
      fl.add(core)
      const x = cx0 + R.f(-2.4, 1.8), z = cz0 + R.f(-1.8, 1.6)
      fl.position.set(x, -0.2, z)
      fl.scale.setScalar(R.f(0.6, 1.0))
      G.add(fl)
    }
  }

  // ===== 岸边菖蒲/芦苇 =====
  {
    const reedG = leafCard(0.16, 1.3, 3)
    const reedG2 = leafCard(0.14, 1.1, 3)
    reedG2.rotateY(Math.PI / 2.2)
    const reedPair = merge([reedG, reedG2])
    const reeds = new THREE.InstancedMesh(reedPair, M.grassDry, 130)
    let ri = 0
    // 沿池缘取点
    for (let i = 0; i < pondPoly.length && ri < 130; i++) {
      const [px, pz] = pondPoly[i]
      const nx = pondPoly[(i + 1) % pondPoly.length]
      const segs = 4
      for (let s = 0; s < segs && ri < 130; s++) {
        if (R.r() < 0.35) continue
        const t = s / segs
        const x = px + (nx[0] - px) * t, z = pz + (nx[1] - pz) * t
        const n = R.i(1, 3)
        for (let k = 0; k < n && ri < 130; k++) {
          _q.setFromEuler(new THREE.Euler(R.f(-0.1, 0.1), R.f(Math.PI * 2), R.f(-0.1, 0.1)))
          _m4.compose(new THREE.Vector3(x + R.f(-0.3, 0.3), -0.15, z + R.f(-0.3, 0.3)), _q, new THREE.Vector3(1, R.f(0.6, 1.3), 1))
          reeds.setMatrixAt(ri, _m4)
          ri++
        }
      }
    }
    reeds.count = ri
    reeds.castShadow = false
    G.add(reeds)
  }

  // ===== 爬墙藤 =====
  {
    const vines = []
    const spots = [
      { x: -19.25, z: -9.5, ry: Math.PI / 2, h: 3.2 }, { x: -19.25, z: 9.0, ry: Math.PI / 2, h: 2.6 },
      { x: 20.25, z: 2.0, ry: -Math.PI / 2, h: 3.4 }, { x: -9.0, z: 12.75, ry: 0, h: 2.8 },
    ]
    for (const s of spots) {
      const card = leafCard(R.f(1.0, 1.3), s.h, 6)
      card.rotateY(s.ry)
      card.translate(s.x, s.h * 0.48, s.z)
      vines.push(card)
    }
    const vine = new THREE.Mesh(merge(vines), M.leafCanopy)
    vine.customDepthMaterial = depthFor(M.leafCanopy)
    vine.castShadow = false
    G.add(vine)
  }

  return { group: G }
}
