// 江南园林场景 - 建筑结构：三开间厅堂（抬梁式/彻上明造）+ 水榭 + 游廊 + 石桥 + 围墙月洞门
import * as THREE from 'three'
import { merge, boxGeo, cylGeo, rng, basisQuat } from './util'

// ---------- 主厅坐标常量（米） ----------
export const HALL = {
  bayX: [-6.3, -2.1, 2.1, 6.3],
  frontZ: -2.6, midZ: -6.8, rearZ: -10.8,
  colTop: 3.87, ridgeY: 5.95, eavePurlinY: 3.96,
  platTop: 0.45, floorTop: 0.48,
  plat: { x1: -7.8, x2: 7.8, z1: -12.2, z2: -1.7 },
}

const _up = new THREE.Vector3(0, 1, 0)
const _q = new THREE.Quaternion()
const _m4 = new THREE.Matrix4()
const _s1 = new THREE.Vector3(1, 1, 1)

// ---------- 棂格构件 ----------
function doorLeaf(w, h, skirt = 0.82) {
  const parts = []
  const t = 0.05
  const latticeH = h - skirt - 0.1
  parts.push([boxGeo(t, h, t, 0.4), -w / 2 + t / 2, h / 2, 0])
  parts.push([boxGeo(t, h, t, 0.4), w / 2 - t / 2, h / 2, 0])
  parts.push([boxGeo(w - t * 2, t, t, 0.4), 0, h - t / 2, 0])
  parts.push([boxGeo(w - t * 2, t, t, 0.4), 0, skirt + t / 2, 0])
  parts.push([boxGeo(w - t * 2, t, t, 0.4), 0, skirt - t / 2, 0])
  parts.push([boxGeo(w - t * 2, 0.06, t, 0.4), 0, 0.03, 0])
  const n = Math.max(4, Math.round((w - 0.12) / 0.085))
  for (let i = 1; i < n; i++) {
    const x = -w / 2 + t + ((w - t * 2) * i) / n
    parts.push([boxGeo(0.024, latticeH - t, 0.022), x, skirt + t + (latticeH - t) / 2, 0])
  }
  const rows = Math.max(2, Math.round(latticeH / 0.3))
  for (let i = 1; i < rows; i++) {
    const y = skirt + t + ((latticeH - t) * i) / rows
    parts.push([boxGeo(w - t * 2, 0.022, 0.022), 0, y, 0])
  }
  parts.push([boxGeo(w - t * 2 + 0.03, skirt - t, 0.026), 0, skirt / 2, 0.012])
  return merge(parts)
}

function latticeWindow(w, h) {
  const parts = []
  const f = 0.07
  parts.push([boxGeo(w, f, f, 0.4), 0, -h / 2 + f / 2, 0])
  parts.push([boxGeo(w, f, f, 0.4), 0, h / 2 - f / 2, 0])
  parts.push([boxGeo(f, h, f, 0.4), -w / 2 + f / 2, 0, 0])
  parts.push([boxGeo(f, h, f, 0.4), w / 2 - f / 2, 0, 0])
  const nx = Math.max(2, Math.round((w - f) / 0.14)), ny = Math.max(2, Math.round((h - f) / 0.14))
  for (let i = 1; i < nx; i++) parts.push([boxGeo(0.03, h - f, 0.03), -w / 2 + f + ((w - f) * i) / nx, 0, 0])
  for (let i = 1; i < ny; i++) parts.push([boxGeo(w - f, 0.03, 0.03), 0, -h / 2 + f + ((h - f) * i) / ny, 0])
  return merge(parts)
}

// 菱格漏窗
function leakWindow(w, h) {
  const parts = [
    [boxGeo(w, 0.09, 0.09, 0.4), 0, -h / 2 + 0.045, 0],
    [boxGeo(w, 0.09, 0.09, 0.4), 0, h / 2 - 0.045, 0],
    [boxGeo(0.09, h, 0.09, 0.4), -w / 2 + 0.045, 0, 0],
    [boxGeo(0.09, h, 0.09, 0.4), w / 2 - 0.045, 0, 0],
  ]
  const ang = 0.72
  const diag = Math.hypot(w, h) * 0.82
  const n = Math.ceil(w / 0.17)
  for (let i = -n; i <= n; i++) {
    const x = i * 0.17
    for (const s of [1, -1]) {
      parts.push([boxGeo(0.04, diag, 0.04, 0.4), x * s, 0, 0, 0, 0, s * ang])
    }
  }
  return merge(parts)
}

// 直棂窗（木条竖密）
function barWindow(w, h) {
  const parts = [
    [boxGeo(w, 0.08, 0.08, 0.4), 0, -h / 2 + 0.04, 0],
    [boxGeo(w, 0.08, 0.08, 0.4), 0, h / 2 - 0.04, 0],
    [boxGeo(0.08, h, 0.08, 0.4), -w / 2 + 0.04, 0, 0],
    [boxGeo(0.08, h, 0.08, 0.4), w / 2 - 0.04, 0, 0],
  ]
  const n = Math.round((w - 0.16) / 0.07)
  for (let i = 1; i < n; i++) parts.push([boxGeo(0.028, h - 0.16, 0.028), -w / 2 + 0.08 + ((w - 0.16) * i) / n, 0, 0])
  return merge(parts)
}

// 山墙轮廓 Shape（在 z-y 平面定义后旋转到 x 平面）
function gableWallGeo(zFront, zRear, yBase, yEaveF, yApex, thick, R) {
  const s = new THREE.Shape()
  s.moveTo(zFront, yBase)
  s.lineTo(zFront, yEaveF)
  s.lineTo((zFront + zRear) / 2, yApex)
  s.lineTo(zRear, yEaveF)
  s.lineTo(zRear, yBase)
  s.closePath()
  // 山墙尖内做一个简单起伏
  const g = new THREE.ExtrudeGeometry(s, { depth: thick, bevelEnabled: false })
  g.rotateY(-Math.PI / 2) // shape x->z 映射：extrude 沿 +x
  return g
}

// ============ 主体厅堂 ============
export function buildMainHall(ctx, M, R = rng(5)) {
  const G = new THREE.Group()
  const { bayX, frontZ, midZ, rearZ, colTop, ridgeY, eavePurlinY, platTop } = HALL
  const parts = {}
  const put = (k, geo) => { (parts[k] = parts[k] || []).push(geo) }
  const dripPts = []
  const paperPanes = []

  // ===== 台基 + 台阶 =====
  {
    const p = HALL.plat
    put('stoneWarm', boxGeo(p.x2 - p.x1, platTop, p.z2 - p.z1, 0.28).translate(0, platTop / 2 - 0.001, (p.z1 + p.z2) / 2))
    for (let i = 0; i < 3; i++) {
      const w = 3.4 + i * 0.3, hh = platTop / 3, d = 0.44
      put('stoneWarm', boxGeo(w, hh, d).translate(0, platTop - hh / 2 - i * hh, p.z2 + 0.22 + i * d))
    }
    ctx.deck(p.x1, p.z1, p.x2, p.z2, HALL.floorTop)
    ctx.ramp(-1.8, -0.35, 1.8, p.z2 + 1.45, 'z', 0, HALL.floorTop)
    ctx.wall(p.x1 - 8, p.z1 - 0.4, p.x2 + 8, p.z1, platTop) // 台基挡墙（防止从侧后穿入）
  }

  // ===== 室内方砖地面（实例化） =====
  {
    const tileG = boxGeo(0.44, 0.055, 0.44, 1.4)
    const inst = new THREE.InstancedMesh(tileG, M.floorTile, 34 * 23)
    let idx = 0
    for (let iz = 0; iz < 23; iz++) for (let ix = 0; ix < 34; ix++) {
      const x = -7.45 + ix * 0.46, z = -11.85 + iz * 0.46
      _m4.compose(new THREE.Vector3(x + R.f(-0.006, 0.006), platTop + 0.028, z + R.f(-0.006, 0.006)),
        _q.setFromEuler(new THREE.Euler(0, R.f(-0.015, 0.015), 0)), _s1)
      inst.setMatrixAt(idx, _m4)
      const c = 0.82 + R.f(-0.1, 0.14)
      inst.setColorAt(idx, new THREE.Color(c * 0.96, c * 0.97, c))
      idx++
    }
    inst.count = idx
    inst.receiveShadow = true
    inst.castShadow = false
    G.add(inst)
  }

  // ===== 柱与柱础 =====
  for (const x of bayX) for (const z of [frontZ, midZ, rearZ]) {
    const r = z === midZ ? 0.2 : 0.165
    const h = colTop - platTop - 0.14
    put('column', cylGeo(r, r * 1.1, h, 12, 0.35).translate(x, platTop + 0.14 + h / 2, z))
    put('stoneMat', cylGeo(r + 0.08, r + 0.1, 0.14, 12, 0.4).translate(x, platTop + 0.07, z))
  }

  // ===== 枋（每条柱线沿 x 通长） =====
  for (const z of [frontZ, midZ, rearZ]) {
    put('beam', boxGeo(13.1, 0.3, 0.24, 0.35).translate(0, colTop - 0.15, z))
  }
  // 穿枋（山面联系，沿 z）
  for (const x of [bayX[0], bayX[3]]) {
    for (const [za, zb] of [[frontZ, midZ], [midZ, rearZ]]) {
      put('beam', boxGeo(0.2, 0.28, Math.abs(zb - za), 0.35).translate(x, colTop - 0.56, (za + zb) / 2))
    }
  }
  // ===== 每榀大梁 + 瓜柱 =====
  for (const x of bayX) {
    for (const [za, zb] of [[frontZ, midZ], [midZ, rearZ]]) {
      put('beam', boxGeo(0.3, 0.36, Math.abs(zb - za) + 0.56, 0.3).translate(x, colTop + 0.18, (za + zb) / 2))
    }
    const gH = ridgeY - (colTop + 0.36) + 0.2
    put('beam', boxGeo(0.22, gH, 0.22).translate(x, (colTop + 0.36 + ridgeY + 0.2) / 2, midZ))
    for (const zz of [(frontZ + midZ) / 2, (midZ + rearZ) / 2]) {
      const jinTop = (eavePurlinY + ridgeY) / 2 + 0.1
      const hJ = jinTop - (colTop + 0.36)
      put('beam', boxGeo(0.17, hJ, 0.17).translate(x, (colTop + 0.36 + jinTop) / 2, zz))
    }
  }
  // ===== 檩 =====
  for (const z of [frontZ, (frontZ + midZ) / 2, midZ, (midZ + rearZ) / 2, rearZ]) {
    const y = z === midZ ? ridgeY : (z === frontZ || z === rearZ ? eavePurlinY : (eavePurlinY + ridgeY) / 2)
    put('rafter', cylGeo(0.09, 0.09, 13.05, 8, 0.3).rotateZ(Math.PI / 2).translate(0, y, z))
  }

  // ===== 屋面：椽 + 望板 + 板瓦槽 + 筒瓦垄 + 滴水 =====
  const tileMatrices = []
  const dripTiles = []
  const eaveOver = 0.62
  const run = Math.abs(midZ - frontZ)
  const rise = ridgeY - eavePurlinY
  const ang = Math.atan2(rise, run) // ~25.3°
  for (const sgn of [1, -1]) {
    const tipZ = sgn === 1 ? frontZ + eaveOver : rearZ - eaveOver
    const ridgeZ = midZ
    const runFull = Math.abs(tipZ - ridgeZ)
    const len = Math.hypot(runFull, rise) + 0.1
    const dirDown = new THREE.Vector3(0, -Math.sin(ang), sgn * Math.cos(ang))
    const nrm = new THREE.Vector3(0, Math.cos(ang), sgn * Math.sin(ang))
    _q.setFromUnitVectors(_up, dirDown)
    // 椽
    const nR = Math.round(13.0 / 0.235)
    for (let i = 0; i <= nR; i++) {
      const x = -6.5 + (13.0 * i) / nR
      const g = boxGeo(0.065, len, 0.09)
      const yAt = (z) => (ridgeY + 0.09) - Math.abs(z - ridgeZ) * Math.tan(ang)
      const cz = (ridgeZ + tipZ) / 2
      _m4.compose(new THREE.Vector3(x, yAt(cz) + 0.045, cz), _q, _s1)
      g.applyMatrix4(_m4)
      put('rafter', g)
    }
    // 望板
    {
      const g = boxGeo(13.05, len, 0.04, 0.3)
      const cz = (ridgeZ + tipZ) / 2
      const yAt = (z) => (ridgeY + 0.09) - Math.abs(z - ridgeZ) * Math.tan(ang)
      _m4.compose(new THREE.Vector3(0, yAt(cz) + 0.045 + 0.065, cz), _q, _s1)
      g.applyMatrix4(_m4)
      put('board', g)
    }
    // 板瓦底槽
    {
      const g = boxGeo(13.05, len, 0.05, 0.3)
      const cz = (ridgeZ + tipZ) / 2
      const yAt = (z) => (ridgeY + 0.09) - Math.abs(z - ridgeZ) * Math.tan(ang)
      _m4.compose(new THREE.Vector3(0, yAt(cz) + 0.045 + 0.105, cz), _q, _s1)
      g.applyMatrix4(_m4)
      put('board2', g)
    }
    // 筒瓦垄（加宽近相连，经典筒瓦垄密度；下沉贴合望板）
    const nRuns = 72
    for (let i = 0; i <= nRuns; i++) {
      const x = -6.55 + (13.1 * i) / nRuns
      const cz = (ridgeZ + tipZ) / 2 - sgn * 0.063
      const yAt = (z) => (ridgeY + 0.09) - Math.abs(z - ridgeZ) * Math.tan(ang)
      const c = new THREE.Vector3(x, 0, cz)
      c.y = yAt(cz) + 0.045 + 0.105 + 0.05
      _m4.compose(c, _q, _s1)
      tileMatrices.push(_m4.clone())
      // 滴水瓦
      const tipY = yAt(tipZ) + 0.13
      dripTiles.push({ p: new THREE.Vector3(x, tipY, tipZ), ry: sgn === 1 ? 0 : Math.PI })
      if (i % 4 === 2) dripPts.push(new THREE.Vector3(x, tipY - 0.16, tipZ + sgn * 0.06))
    }
    // 封檐板（檐口收边）
    {
      const tipZ = sgn === 1 ? frontZ + eaveOver : rearZ - eaveOver
      const yAt = (z) => (ridgeY + 0.09) - Math.abs(z - ridgeZ) * Math.tan(ang)
      const fascia = boxGeo(13.4, 0.15, 0.05, 0.4)
      fascia.translate(0, yAt(tipZ) + 0.06, tipZ + sgn * 0.02)
      put('doorPanel', fascia)
    }
  }
  // 筒瓦实例网格
  {
    const spanLen = Math.hypot(run + eaveOver, rise)
    const tileG = new THREE.CylinderGeometry(0.075, 0.084, spanLen + 0.14, 7, 1, true)
    const inst = new THREE.InstancedMesh(tileG, M.roofTile, tileMatrices.length)
    tileMatrices.forEach((m, i) => inst.setMatrixAt(i, m))
    inst.castShadow = true; inst.receiveShadow = true
    G.add(inst)
    // 滴水瓦
    const dg = merge([
      [boxGeo(0.15, 0.1, 0.2), 0, 0, 0],
      [boxGeo(0.13, 0.12, 0.03), 0, -0.09, 0.1],
    ])
    const inst2 = new THREE.InstancedMesh(dg, M.ridge, dripTiles.length)
    dripTiles.forEach((d, i) => {
      _m4.compose(d.p, _q.setFromEuler(new THREE.Euler(0, d.ry, 0)), _s1)
      inst2.setMatrixAt(i, _m4)
    })
    inst2.castShadow = true
    G.add(inst2)
  }
  // 正脊 + 吻
  put('ridge', boxGeo(13.15, 0.26, 0.24, 0.3).translate(0, ridgeY + 0.28, midZ))
  for (const sx of [-1, 1]) {
    put('ridge', boxGeo(0.34, 0.5, 0.2).translate(sx * 6.45, ridgeY + 0.42, midZ))
    put('ridge', boxGeo(0.18, 0.3, 0.18).translate(sx * 6.45, ridgeY + 0.78, midZ))
  }

  // ===== 山墙（硬山，粉墙 + 砖裙）=====
  for (const sx of [-1, 1]) {
    const g = gableWallGeo(frontZ - 0.15, rearZ + 0.15, platTop, eavePurlinY - 0.1, ridgeY + 0.1, 0.5, R)
    g.translate(sx * 6.55, 0, 0)
    put('plasterWall', g)
    // 博风板
    for (const sgn of [1, -1]) {
      const tipZ = sgn === 1 ? frontZ - 0.1 : rearZ + 0.1
      const len = Math.hypot(Math.abs(midZ - tipZ), rise) + 0.35
      const dirDown = new THREE.Vector3(0, -Math.sin(ang), sgn * Math.cos(ang))
      _q.setFromUnitVectors(_up, dirDown)
      const g2 = boxGeo(0.06, len, 0.34, 0.4)
      const cz = (midZ + tipZ) / 2
      const yAt = (z) => (ridgeY + 0.1) - Math.abs(z - midZ) * Math.tan(ang)
      _m4.compose(new THREE.Vector3(sx * 6.82, yAt(cz) + 0.1, cz), _q, _s1)
      g2.applyMatrix4(_m4)
      put('doorPanel', g2)
    }
  }
  // ===== 后墙（砖裙 + 粉墙 + 直棂窗）=====
  {
    put('brickMat', boxGeo(13.1, 1.0, 0.34, 0.55).translate(0, platTop + 0.5, rearZ - 0.05))
    put('plasterWall', boxGeo(13.1, colTop - 1.0 - platTop, 0.3, 0.35).translate(0, platTop + 1.0 + (colTop - 1.0 - platTop) / 2, rearZ - 0.05))
    for (const wx of [-4.2, 4.2]) {
      const win = barWindow(1.05, 1.15)
      win.translate(wx, platTop + 1.85, rearZ - 0.18)
      put('lattice', win)
      paperPanes.push({ x: wx, y: platTop + 1.85, z: rearZ + 0.02, w: 0.95, h: 1.05, ry: 0 })
      ctx.wall(wx - 0.65, rearZ - 0.35, wx + 0.65, rearZ + 0.25, 3.4)
    }
  }
  // 后墙到山墙的整墙碰撞
  ctx.wall(-6.85, rearZ - 0.4, 6.85, rearZ + 0.3, 3.6)

  // ===== 山墙窗（书房/茶室/卧房/藏书间）=====
  const gableWins = [
    { sx: -1, z: -4.5, y: platTop + 1.9, room: 'study' },
    { sx: -1, z: -8.9, y: platTop + 1.85, room: 'bed' },
    { sx: 1, z: -4.5, y: platTop + 1.9, room: 'tea' },
    { sx: 1, z: -8.9, y: platTop + 1.85, room: 'lib' },
  ]
  for (const w of gableWins) {
    const win = latticeWindow(1.25, 1.25)
    win.rotateY(Math.PI / 2)
    win.translate(w.sx * 6.78, w.y, w.z)
    put('lattice', win)
    paperPanes.push({ x: w.sx * 6.6, y: w.y, z: w.z, w: 1.1, h: 1.1, ry: Math.PI / 2 })
  }

  // ===== 内隔断（板壁 + 门洞 + 上部横披） =====
  function partitionX(x, z1, z2, doorZ, doorW = 0.98) {
    const segs = []
    const dz1 = doorZ - doorW / 2, dz2 = doorZ + doorW / 2
    if (z1 > dz2) segs.push([z1, dz2])  // 门洞靠前侧
    if (dz1 > z2) segs.push([dz1, z2])  // 门洞靠后侧
    for (const [a, b] of segs) {
      put('doorPanel', boxGeo(0.1, 3.0, Math.abs(b - a), 0.3).translate(x, platTop + 1.5, (a + b) / 2))
    }
    // 门洞上横披
    put('doorPanel', boxGeo(0.1, 0.55, doorW, 0.3).translate(x, platTop + 3.27, doorZ))
    // 门框
    put('lattice', boxGeo(0.14, 3.0, 0.09).translate(x, platTop + 1.5, dz1))
    put('lattice', boxGeo(0.14, 3.0, 0.09).translate(x, platTop + 1.5, dz2))
    ctx.wall(x - 0.12, Math.min(z1, dz2), x + 0.12, Math.max(z1, dz2), 3.2)
    ctx.wall(x - 0.12, Math.min(dz1, z2), x + 0.12, Math.max(dz1, z2), 3.2)
  }
  function partitionZ(z, x1, x2, doorX = null, doorW = 1.5) {
    const segs = []
    if (doorX == null) segs.push([x1, x2])
    else {
      const dx1 = doorX - doorW / 2, dx2 = doorX + doorW / 2
      if (x1 < dx1) segs.push([x1, dx1])
      if (dx2 < x2) segs.push([dx2, x2])
      put('lattice', boxGeo(doorW, 0.5, 0.09).translate(doorX, platTop + 3.2, z))
      put('lattice', boxGeo(0.1, 2.95, 0.09).translate(dx1, platTop + 1.48, z))
      put('lattice', boxGeo(0.1, 2.95, 0.09).translate(dx2, platTop + 1.48, z))
    }
    for (const [a, b] of segs) {
      put('doorPanel', boxGeo(b - a, 3.0, 0.1, 0.3).translate((a + b) / 2, platTop + 1.5, z))
    }
    if (doorX == null) ctx.wall(x1, z - 0.12, x2, z + 0.12, 3.2)
    else {
      ctx.wall(x1, z - 0.12, doorX - doorW / 2, z + 0.12, 3.2)
      ctx.wall(doorX + doorW / 2, z - 0.12, x2, z + 0.12, 3.2)
    }
  }
  // 西隔断：书房|明间，卧房|过厅
  partitionX(-2.1, frontZ, midZ, -4.35, 1.0)
  partitionX(-2.1, midZ, rearZ, -8.55, 0.98)
  // 东隔断：明间|茶室，过厅|藏书间
  partitionX(2.1, frontZ, midZ, -4.35, 1.0)
  partitionX(2.1, midZ, rearZ, -8.55, 0.98)
  // 横向：明间|过厅（中央屏门，中间敞开）
  partitionZ(midZ, -2.1, 2.1, 1.3, 1.4)
  // 横向：书房|卧房、茶室|藏书间（无门）
  partitionZ(midZ, -6.3, -2.1)
  partitionZ(midZ, 2.1, 6.3)

  // ===== 前檐门窗：明间通高隔扇，次间矮墙 + 槛窗（半墙半窗） =====
  {
    const leafW = 0.64, leafH = 2.6, y0 = platTop
    const zF = frontZ
    // —— 明间：六扇隔扇，中间四扇外开 ——
    {
      const x1 = bayX[1], x2 = bayX[2]
      const w = x2 - x1 - 0.3
      const n = Math.round(w / leafW)
      const lw = w / n
      for (let i = 0; i < n; i++) {
        const cx = x1 + 0.15 + lw * (i + 0.5)
        const leaf = doorLeaf(lw, leafH)
        const m = new THREE.Mesh(leaf, M.lattice)
        m.castShadow = true; m.receiveShadow = true
        const open = i >= 1 && i <= 4
        if (open) {
          const hingeX = cx + lw / 2 * (i < n / 2 ? 1 : -1)
          const ang2 = (i < n / 2 ? -1 : 1) * R.f(1.35, 1.6)
          const pivot = new THREE.Group()
          pivot.position.set(hingeX, y0, zF)
          m.position.set(hingeX > cx ? -lw / 2 + 0.025 : lw / 2 - 0.025, 0, 0)
          m.rotation.y = ang2
          pivot.add(m)
          G.add(pivot)
        } else {
          m.position.set(cx, y0, zF)
          G.add(m)
          ctx.wall(cx - lw / 2, zF - 0.1, cx + lw / 2, zF + 0.1, 2.6)
        }
      }
      // 门槛石（门口收边，消除门扇悬空感）
      put('stoneWarm', boxGeo(w + 0.2, 0.09, 0.3, 0.5).translate(x1 + 0.15 + w / 2, y0 + 0.045, zF))
      // 上横披（固定棂条带 + 衬纸）
      const tw = w
      const transom = []
      const tn = Math.round(tw / 0.09)
      for (let i = 1; i < tn; i++) transom.push([boxGeo(0.026, 0.52, 0.024), x1 + 0.15 + (tw * i) / tn, 0, 0])
      transom.push([boxGeo(tw, 0.05, 0.05), 0, 0.26, 0])
      transom.push([boxGeo(tw, 0.05, 0.05), 0, -0.26, 0])
      const tm = merge(transom)
      tm.translate(x1 + 0.15 + tw / 2, y0 + 2.85, zF)
      put('lattice', tm)
      paperPanes.push({ x: x1 + 0.15 + tw / 2, y: y0 + 2.85, z: zF - 0.05, w: tw - 0.1, h: 0.46, ry: 0 })
    }
    // —— 次间（书房/茶室）：矮墙 + 双槛窗 ——
    for (const b of [{ x1: bayX[0], x2: bayX[1] }, { x1: bayX[2], x2: bayX[3] }]) {
      const w = b.x2 - b.x1 - 0.3
      const cxm = b.x1 + 0.15 + w / 2
      // 矮墙（青砖裙）+ 石压顶
      const par = boxGeo(w, 0.92, 0.14, 0.55)
      par.translate(cxm, y0 + 0.46, zF)
      put('brickMat', par)
      const cap = boxGeo(w + 0.08, 0.06, 0.22, 0.5)
      cap.translate(cxm, y0 + 0.95, zF)
      put('stoneWarm', cap)
      ctx.wall(cxm - w / 2, zF - 0.08, cxm + w / 2, zF + 0.08, 1.0)
      // 两扇方格槛窗 + 中立柱
      const winW = (w - 0.34) / 2
      const winY = y0 + 1.72
      for (const s of [-1, 1]) {
        const wx = cxm + s * (winW / 2 + 0.17)
        const win = latticeWindow(winW, 1.42)
        win.translate(wx, winY, zF)
        put('lattice', win)
        paperPanes.push({ x: wx, y: winY, z: zF - 0.05, w: winW - 0.18, h: 1.3, ry: 0 })
      }
      put('lattice', boxGeo(0.1, 1.42, 0.1).translate(cxm, winY, zF))
    }
  }

  // 汇合为网格
  const matMap = {
    column: M.column, beam: M.beam, rafter: M.rafter, board: M.board,
    board2: M.ridge, stoneWarm: M.stoneWarmMat, stoneMat: M.stoneMat,
    plasterWall: M.plasterWall, brickMat: M.brickMat, lattice: M.lattice,
    doorPanel: M.doorPanel, ridge: M.ridge,
  }
  for (const [k, geos] of Object.entries(parts)) {
    if (!geos.length) continue
    const g = merge(geos)
    const m = new THREE.Mesh(g, matMap[k])
    m.castShadow = true; m.receiveShadow = true
    G.add(m)
  }

  // 窗纸
  for (const p of paperPanes) {
    const pg = new THREE.PlaneGeometry(p.w, p.h)
    const mesh = new THREE.Mesh(pg, M.paper)
    mesh.position.set(p.x, p.y, p.z)
    mesh.rotation.y = p.ry
    mesh.castShadow = false; mesh.receiveShadow = false
    G.add(mesh)
  }

  return { group: G, dripPts }
}

// ============ 水榭（六角亭） ============
export function buildPavilion(ctx, M, R = rng(15)) {
  const G = new THREE.Group()
  const cx = 15.2, cz = 4.8, r = 2.42, floorY = 0.5
  const cols = []
  for (let i = 0; i < 6; i++) {
    const a = Math.PI / 6 + (i * Math.PI) / 3
    cols.push([cx + Math.cos(a) * r, cz + Math.sin(a) * r])
  }
  const parts = {}
  const put = (k, geo) => { (parts[k] = parts[k] || []).push(geo) }
  // 石柱础（水中）
  for (const [x, z] of cols) {
    put('stoneMat', boxGeo(0.5, 1.6, 0.5, 0.3).translate(x, floorY - 0.8, z))
    const h = 2.55
    put('column', cylGeo(0.13, 0.145, h, 10, 0.35).translate(x, floorY + h / 2, z))
  }
  // 地面（六角木板）
  const floorG = new THREE.CylinderGeometry(r + 0.5, r + 0.5, 0.12, 6)
  floorG.translate(cx, floorY - 0.06, cz)
  put('plank', floorG)
  // 檐枋六角环
  for (let i = 0; i < 6; i++) {
    const a1 = Math.PI / 6 + (i * Math.PI) / 3, a2 = Math.PI / 6 + ((i + 1) * Math.PI) / 3
    const x1 = cx + Math.cos(a1) * r, z1 = cz + Math.sin(a1) * r
    const x2 = cx + Math.cos(a2) * r, z2 = cz + Math.sin(a2) * r
    const mx = (x1 + x2) / 2, mz = (z1 + z2) / 2
    const len = Math.hypot(x2 - x1, z2 - z1) + 0.3
    put('beam', boxGeo(len, 0.22, 0.16, 0.35).rotateY(-Math.atan2(z2 - z1, x2 - x1)).translate(mx, floorY + 2.66, mz))
  }
  // 攒尖顶：六坡
  const eaveR = r + 0.85, eaveY = floorY + 2.85, apexY = floorY + 4.35
  const tileMats = []
  for (let i = 0; i < 6; i++) {
    const a1 = Math.PI / 6 + (i * Math.PI) / 3, a2 = Math.PI / 6 + ((i + 1) * Math.PI) / 3
    const ex1 = cx + Math.cos(a1) * eaveR, ez1 = cz + Math.sin(a1) * eaveR
    const ex2 = cx + Math.cos(a2) * eaveR, ez2 = cz + Math.sin(a2) * eaveR
    const mx = (ex1 + ex2) / 2, mz = (ez1 + ez2) / 2
    // 局部 X 沿檐边，局部 Y 沿坡向下（宝顶->檐口）
    const tangent = [ex2 - ex1, 0, ez2 - ez1]
    const slope = [mx - cx, eaveY - apexY, mz - cz]
    const q = basisQuat(tangent, slope)
    const slopeLen = Math.hypot(mx - cx, eaveY - apexY, mz - cz)
    const faceW = Math.hypot(ex2 - ex1, ez2 - ez1)
    const cc = [(mx + cx) / 2, (eaveY + apexY) / 2, (mz + cz) / 2]
    // 坡面板
    {
      const g = boxGeo(faceW + 0.25, slopeLen + 0.18, 0.05, 0.3)
      g.applyMatrix4(_m4.compose(new THREE.Vector3(...cc), q, _s1))
      put('board2', g)
    }
    // 椽
    const nR = Math.max(2, Math.round(faceW / 0.24))
    for (let k = 0; k <= nR; k++) {
      const off = (k / nR - 0.5) * faceW
      const g2 = boxGeo(0.055, slopeLen, 0.075)
      _m4.compose(new THREE.Vector3(...cc), q, _s1)
      const offV = new THREE.Vector3(tangent[0], 0, tangent[2]).normalize().multiplyScalar(off)
      _m4.setPosition(cc[0] + offV.x, cc[1], cc[2] + offV.z)
      g2.applyMatrix4(_m4)
      put('rafter', g2)
    }
    // 筒瓦
    const nRuns = Math.max(3, Math.round(faceW / 0.19))
    for (let k = 0; k <= nRuns; k++) {
      const off = (k / nRuns - 0.5) * faceW
      const offV = new THREE.Vector3(tangent[0], 0, tangent[2]).normalize().multiplyScalar(off)
      const c = new THREE.Vector3(cc[0] + offV.x, cc[1] + 0.1, cc[2] + offV.z)
      _m4.compose(c, q, _s1)
      tileMats.push(_m4.clone())
      if (k === 0 || k === nRuns) {
        put('ridge', boxGeo(0.2, 0.08, 0.26).translate(c.x, c.y - slopeLen / 2 + 0.06, c.z))
      }
    }
    // 垂脊（角脊）
    const gq = basisQuat(tangent, [ex1 - cx, eaveY - apexY, ez1 - cz])
    const gLen = Math.hypot(ex1 - cx, eaveY - apexY, ez1 - cz)
    const g3 = boxGeo(0.12, gLen + 0.2, 0.14)
    _m4.compose(new THREE.Vector3((ex1 + cx) / 2, (eaveY + apexY) / 2 + 0.05, (ez1 + cz) / 2), gq, _s1)
    g3.applyMatrix4(_m4)
    put('ridge', g3)
  }
  {
    const tileG = new THREE.CylinderGeometry(0.068, 0.076, Math.hypot(eaveR, eaveY - apexY) + 0.1, 6, 1, true)
    const inst = new THREE.InstancedMesh(tileG, M.roofTile, tileMats.length)
    tileMats.forEach((m, i) => inst.setMatrixAt(i, m))
    inst.castShadow = true; inst.receiveShadow = true
    G.add(inst)
  }
  // 宝顶
  const fin = merge([
    [cylGeo(0.16, 0.2, 0.18, 10), 0, 0, 0],
    [cylGeo(0.09, 0.13, 0.3, 8), 0, 0.22, 0],
    [cylGeo(0.05, 0.07, 0.16, 8), 0, 0.42, 0],
  ])
  fin.translate(cx, apexY + 0.35, cz)
  put('ridge', fin)
  // 美人靠（南侧与西侧：低栏 + 弯靠背）
  const railSides = [[4, 5], [5, 0]] // 西南面开敞接游廊
  for (const [i1, i2] of railSides) {
    const [x1, z1] = cols[i1], [x2, z2] = cols[i2]
    const mx = (x1 + x2) / 2, mz = (z1 + z2) / 2
    const len = Math.hypot(x2 - x1, z2 - z1)
    const rotY = -Math.atan2(z2 - z1, x2 - x1)
    const rail = merge([
      [boxGeo(len, 0.08, 0.1), 0, 0.42, 0],
      [boxGeo(len, 0.1, 0.12), 0, 0.12, 0.02],
      [boxGeo(len, 0.05, 0.3), 0, 0.28, 0.08],
      [boxGeo(0.08, 0.42, 0.14), -len / 2 + 0.06, 0.21, 0],
      [boxGeo(0.08, 0.42, 0.14), len / 2 - 0.06, 0.21, 0],
    ])
    rail.rotateY(rotY).translate(mx, floorY, mz)
    put('doorPanel', rail)
  }
  const matMap = { column: M.column, beam: M.beam, rafter: M.rafter, board2: M.ridge, stoneMat: M.stoneMat, plank: M.plank, ridge: M.ridge, doorPanel: M.doorPanel }
  for (const [k, geos] of Object.entries(parts)) {
    const m = new THREE.Mesh(merge(geos), matMap[k])
    m.castShadow = true; m.receiveShadow = true
    G.add(m)
  }
  ctx.deck(cx - r - 0.4, cz - r - 0.4, cx + r + 0.4, cz + r + 0.4, floorY + 0.02)
  // 亭内栏杆碰撞（三面）
  for (const [i1, i2] of railSides) {
    const [x1, z1] = cols[i1], [x2, z2] = cols[i2]
    const mx = (x1 + x2) / 2 + (cx - (x1 + x2) / 2) * 0.3
    const mz = (z1 + z2) / 2 + (cz - (z1 + z2) / 2) * 0.3
    ctx.wall(mx - 0.85, mz - 0.5, mx + 0.85, mz + 0.5, 0.8)
  }
  const lanternSlots = [new THREE.Vector3(cols[1][0], floorY + 2.4, cols[1][1]), new THREE.Vector3(cols[2][0], floorY + 2.4, cols[2][1])]
  const dripPts = cols.map(([x, z]) => new THREE.Vector3(x, floorY + 2.62, z))
  return { group: G, lanternSlots, dripPts }
}

// ============ 游廊（L 形） ============
export function buildCorridor(ctx, M, R = rng(25)) {
  const G = new THREE.Group()
  const parts = {}
  const put = (k, geo) => { (parts[k] = parts[k] || []).push(geo) }
  const floorY = 0.48
  const dripPts = []
  const lanternSlots = []

  function leg(x1, z1, x2, z2, w, slopeDir) {
    // 柱
    const len = Math.hypot(x2 - x1, z2 - z1)
    const dirX = (x2 - x1) / len, dirZ = (z2 - z1) / len
    const perpX = -dirZ, perpZ = dirX
    const nCol = Math.max(2, Math.round(len / 1.9))
    for (let i = 0; i <= nCol; i++) {
      const t = i / nCol
      const bx = x1 + (x2 - x1) * t, bz = z1 + (z2 - z1) * t
      for (const s of [-1, 1]) {
        const cx2 = bx + perpX * s * (w / 2), cz2 = bz + perpZ * s * (w / 2)
        put('column', cylGeo(0.085, 0.095, 2.42, 8, 0.35).translate(cx2, floorY + 1.21, cz2))
        put('stoneMat', cylGeo(0.13, 0.15, 0.1, 8).translate(cx2, floorY + 0.05, cz2))
      }
      if (i % 2 === 0) lanternSlots.push(new THREE.Vector3(bx, floorY + 2.05, bz))
      dripPts.push(new THREE.Vector3(bx + perpX * (w / 2 + 0.25) * (slopeDir[0] ? 1 : -1), floorY + 2.0, bz + perpZ * (w / 2 + 0.25) * (slopeDir[0] ? 1 : -1)))
    }
    // 地板
    const fl = boxGeo(len + 0.3, 0.08, w, 0.5)
    fl.rotateY(-Math.atan2(z2 - z1, x2 - x1))
    fl.translate((x1 + x2) / 2, floorY - 0.04, (z1 + z2) / 2)
    put('plank', fl)
    ctx.deck(Math.min(x1, x2) - (dirX ? 0.2 : w / 2), Math.min(z1, z2) - (dirX ? w / 2 : 0.2), Math.max(x1, x2) + (dirX ? 0.2 : w / 2), Math.max(z1, z2) + (dirX ? w / 2 : 0.2), floorY + 0.01)
    // 檐枋
    for (const s of [-1, 1]) {
      const fx = (x1 + x2) / 2 + perpX * s * (w / 2), fz = (z1 + z2) / 2 + perpZ * s * (w / 2)
      const g = boxGeo(len + 0.2, 0.16, 0.12, 0.35)
      g.rotateY(-Math.atan2(z2 - z1, x2 - x1))
      g.translate(fx, floorY + 2.5, fz)
      put('beam', g)
    }
    // 单坡屋顶：高侧 slopeSide(+1) 低侧对侧
    const hiS = slopeDir[0] ? slopeDir[1] : -slopeDir[1]
    const hiY = floorY + 2.85, loY = floorY + 2.28
    const hiX = (x1 + x2) / 2 + perpX * hiS * (w / 2 + 0.28)
    const hiZ = (z1 + z2) / 2 + perpZ * hiS * (w / 2 + 0.28)
    const loX = (x1 + x2) / 2 - perpX * hiS * (w / 2 + 0.34)
    const loZ = (z1 + z2) / 2 - perpZ * hiS * (w / 2 + 0.34)
    const rd = new THREE.Vector3(loX - hiX, loY - hiY, loZ - hiZ)
    const rlen = rd.length()
    // 局部 X 沿廊身方向，局部 Y 沿坡向
    const u = [dirX, 0, dirZ]
    const q = basisQuat(u, [rd.x, rd.y, rd.z])
    // 望板+瓦槽
    const rg = boxGeo(len + 0.5, rlen + 0.1, 0.05, 0.3)
    _m4.compose(new THREE.Vector3((hiX + loX) / 2, (hiY + loY) / 2 + 0.03, (hiZ + loZ) / 2), q, _s1)
    rg.applyMatrix4(_m4)
    put('board2', rg)
    // 筒瓦
    const nRuns = Math.round((len + 0.5) / 0.19)
    const inst = new THREE.InstancedMesh(
      new THREE.CylinderGeometry(0.062, 0.07, rlen + 0.1, 6, 1, true), M.roofTile, nRuns + 1)
    for (let i = 0; i <= nRuns; i++) {
      const off = (i / nRuns - 0.5) * (len + 0.5)
      const c = new THREE.Vector3((hiX + loX) / 2, (hiY + loY) / 2 + 0.1, (hiZ + loZ) / 2)
      c.x += dirX * off; c.z += dirZ * off
      _m4.compose(c, q, _s1)
      inst.setMatrixAt(i, _m4)
    }
    inst.castShadow = true
    G.add(inst)
    // 坐凳栏杆（两侧，两端留口）
    for (const s of [-1, 1]) {
      const railLen = Math.max(0.5, len - 3.0)
      const fx = (x1 + x2) / 2 + dirX * 0 + perpX * s * (w / 2 - 0.02), fz = (z1 + z2) / 2 + perpZ * s * (w / 2 - 0.02)
      const g = boxGeo(railLen, 0.34, 0.12, 0.4)
      g.rotateY(-Math.atan2(z2 - z1, x2 - x1))
      g.translate(fx, floorY + 0.2, fz)
      put('doorPanel', g)
      const hx = Math.abs(perpX) * 0.1 + Math.abs(dirX) * railLen / 2
      const hz = Math.abs(perpZ) * 0.1 + Math.abs(dirZ) * railLen / 2
      ctx.wall(fx - hx, fz - hz, fx + hx, fz + hz, 0.9)
    }
  }

  leg(7.55, -4.2, 14.0, -4.2, 1.6, [0, 1])  // 东西向：坡向低侧南？hiS=1 -> 高侧 perp*1
  leg(14.0, -4.2, 14.0, 3.3, 1.6, [1, 0])   // 南北向

  const matMap = { column: M.column, beam: M.beam, stoneMat: M.stoneMat, plank: M.plank, board2: M.ridge, doorPanel: M.doorPanel }
  for (const [k, geos] of Object.entries(parts)) {
    const m = new THREE.Mesh(merge(geos), matMap[k])
    m.castShadow = true; m.receiveShadow = true
    G.add(m)
  }
  return { group: G, dripPts, lanternSlots }
}

// ============ 石拱桥 ============
export function buildBridge(ctx, M, R = rng(35)) {
  const G = new THREE.Group()
  const A = new THREE.Vector3(5.4, 0, 8.6), B = new THREE.Vector3(9.0, 0, 11.0)
  const width = 1.55, n = 10, hMax = 0.78
  const dir = B.clone().sub(A); const len = dir.length(); dir.normalize()
  const perp = new THREE.Vector3(-dir.z, 0, dir.x)
  const arch = (t) => 0.1 + Math.sin(Math.PI * t) * hMax
  const slope = (t) => Math.PI * hMax * Math.cos(Math.PI * t) / len
  const parts = []
  for (let i = 0; i < n; i++) {
    const t1 = i / n, t2 = (i + 1) / n
    const y1 = arch(t1), y2 = arch(t2)
    const segLen = len / n + 0.06
    const g = boxGeo(segLen, 0.14, width, 0.45)
    const mid = new THREE.Vector3().lerpVectors(A, B, (t1 + t2) / 2)
    mid.y = (y1 + y2) / 2
    g.rotateZ(Math.atan2(y2 - y1, len / n))
    _q.setFromEuler(new THREE.Euler(0, -Math.atan2(dir.z, dir.x), Math.atan2(y2 - y1, len / n)))
    _m4.compose(mid, _q, _s1)
    g.applyMatrix4(_m4)
    parts.push(g)
  }
  // 栏板 + 望柱
  for (const s of [-1, 1]) {
    for (let i = 0; i <= 4; i++) {
      const t = i / 4
      const p = new THREE.Vector3().lerpVectors(A, B, t)
      p.y = arch(t) + 0.3
      p.addScaledVector(perp, s * (width / 2 + 0.05))
      parts.push(boxGeo(0.18, 0.62, 0.2, 0.4).translate(p.x, p.y, p.z))
      if (i < 4) {
        const q = new THREE.Vector3().lerpVectors(A, B, t + 1 / 8)
        q.y = arch(t + 1 / 8) + 0.5
        q.addScaledVector(perp, s * (width / 2 + 0.05))
        parts.push(boxGeo(len / 4 - 0.1, 0.1, 0.08, 0.4).rotateY(-Math.atan2(dir.z, dir.x)).translate(q.x, q.y, q.z))
      }
    }
  }
  // 桥端石
  for (const e of [A, B]) {
    parts.push(boxGeo(1.0, 0.28, width + 0.6, 0.4).translate(e.x, 0.12, e.z))
  }
  const m = new THREE.Mesh(merge(parts), M.stoneMat)
  m.castShadow = true; m.receiveShadow = true
  G.add(m)
  ctx.bridges = ctx.bridges || []
  ctx.bridges.push({ ax: A.x, az: A.z, bx: B.x, bz: B.z, width: width * 0.75, h0: arch(0) + 0.1, hMax })
  // 栏杆仅为视觉；落水由水面阻挡兜底
  return G
}

// ============ 围墙 + 月洞门 ============
export function buildWalls(ctx, M, R = rng(45)) {
  const G = new THREE.Group()
  const parts = {}
  const put = (k, geo) => { (parts[k] = parts[k] || []).push(geo) }
  const H = 2.55, T = 0.42

  // 一段带漏窗的墙（沿 x 或 z）：返回并注册碰撞
  function wallRun(ax1, az1, ax2, az2, openings = []) {
    const horiz = Math.abs(ax2 - ax1) > Math.abs(az2 - az1)
    const putSeg = (a, b) => {
      const len = b - a
      if (len <= 0.01) return
      const mid = (a + b) / 2
      let g
      if (horiz) {
        g = boxGeo(len, H, T, 0.3).translate(mid, H / 2, az1)
      } else {
        g = boxGeo(T, H, len, 0.3).translate(ax1, H / 2, mid)
      }
      put('plasterWall', g)
      // 墙帽
      let cap
      if (horiz) cap = boxGeo(len + 0.1, 0.12, T + 0.3, 0.3).translate(mid, H + 0.05, az1)
      else cap = boxGeo(T + 0.3, 0.12, len + 0.1, 0.3).translate(ax1, H + 0.05, mid)
      put('ridge', cap)
      if (horiz) ctx.wall(Math.min(ax1, ax2) + Math.min(a, b) - Math.min(ax1, ax2), az1 - T / 2, 0, 0, 0) // placeholder
    }
    // 依 openings 生成段
    const lo = horiz ? Math.min(ax1, ax2) : Math.min(az1, az2)
    const hi = horiz ? Math.max(ax1, ax2) : Math.max(az1, az2)
    let cur = lo
    const gaps = openings.slice().sort((a, b) => a.c - b.c)
    for (const o of gaps) {
      const a = o.c - o.w / 2, b = o.c + o.w / 2
      if (horiz) { putSegXY(cur, a) } else { putSegZ(cur, a) }
      // 窗下/上墙
      if (horiz) {
        put('plasterWall', boxGeo(o.w, o.y - o.h / 2, T, 0.3).translate(o.c, (o.y - o.h / 2) / 2, az1))
        put('plasterWall', boxGeo(o.w, H - o.y - o.h / 2, T, 0.3).translate(o.c, o.y + o.h / 2 + (H - o.y - o.h / 2) / 2, az1))
        let cap = boxGeo(o.w + 0.1, 0.12, T + 0.3, 0.3).translate(o.c, H + 0.05, az1)
        put('ridge', cap)
        ctx.wall(a, az1 - T / 2, b, az1 + T / 2, 0.6)
      } else {
        put('plasterWall', boxGeo(T, o.y - o.h / 2, o.w, 0.3).translate(ax1, (o.y - o.h / 2) / 2, o.c))
        put('plasterWall', boxGeo(T, H - o.y - o.h / 2, o.w, 0.3).translate(ax1, o.y + o.h / 2 + (H - o.y - o.h / 2) / 2, o.c))
        let cap = boxGeo(T + 0.3, 0.12, o.w + 0.1, 0.3).translate(ax1, H + 0.05, o.c)
        put('ridge', cap)
        ctx.wall(ax1 - T / 2, a, ax1 + T / 2, b, 0.6)
      }
      cur = b
    }
    function putSegXY(a, b) {
      if (b - a <= 0.01) return
      put('plasterWall', boxGeo(b - a, H, T, 0.3).translate((a + b) / 2, H / 2, az1))
      put('ridge', boxGeo(b - a + 0.1, 0.12, T + 0.3, 0.3).translate((a + b) / 2, H + 0.05, az1))
      ctx.wall(a, az1 - T / 2, b, az1 + T / 2, H)
    }
    function putSegZ(a, b) {
      if (b - a <= 0.01) return
      put('plasterWall', boxGeo(T, H, b - a, 0.3).translate(ax1, H / 2, (a + b) / 2))
      put('ridge', boxGeo(T + 0.3, 0.12, b - a + 0.1, 0.3).translate(ax1, H + 0.05, (a + b) / 2))
      ctx.wall(ax1 - T / 2, a, ax1 + T / 2, b, H)
    }
    if (horiz) putSegXY(cur, hi); else putSegZ(cur, hi)
  }

  // 周边四墙（南墙留门楼开口）
  wallRun(-19.5, -14.8, 20.5, -14.8)                                   // 北
  wallRun(-19.5, 13.0, -4.0, 13.0, [{ c: -9.0, w: 1.5, y: 1.6, h: 1.0 }])   // 南西
  wallRun(0.5, 13.0, 20.5, 13.0, [{ c: 12, w: 1.5, y: 1.6, h: 1.0 }])       // 南东
  wallRun(-19.5, -14.8, -19.5, 13.0, [{ c: -4.0, w: 1.4, y: 1.55, h: 1.1 }, { c: 4.5, w: 1.4, y: 1.55, h: 1.1 }]) // 西
  wallRun(20.5, -14.8, 20.5, 13.0, [{ c: -2.0, w: 1.4, y: 1.55, h: 1.1 }, { c: 7.0, w: 1.4, y: 1.55, h: 1.1 }])   // 东
  // 南墙门楼开口段之间的门（关闭木门）
  put('doorPanel', boxGeo(4.0, 2.3, 0.1, 0.3).translate(-1.75, 1.15, 13.0))
  // 门楼小顶
  put('ridge', boxGeo(5.6, 0.14, 1.6, 0.3).translate(-1.75, 2.62, 13.0))
  put('ridge', boxGeo(5.2, 0.3, 0.3).translate(-1.75, 2.78, 13.0))
  ctx.wall(-4.0, 12.75, 0.5, 13.25, 2.5)

  // 月洞门内墙（西院隔墙 x=-10，z -13.2..3.5）
  {
    const shape = new THREE.Shape()
    shape.moveTo(-13.2, 0); shape.lineTo(3.5, 0); shape.lineTo(3.5, H); shape.lineTo(-13.2, H); shape.closePath()
    const hole = new THREE.Path()
    hole.absarc(-3.5, 1.32, 1.18, 0, Math.PI * 2, true)
    shape.holes.push(hole)
    const g = new THREE.ExtrudeGeometry(shape, { depth: T, bevelEnabled: false })
    g.rotateY(Math.PI / 2)  // shape 的 x -> 世界 z
    g.translate(-10 + T / 2, 0, 0)
    // 注：rotateY 后 extrude 沿 -x；校正
    put('plasterWall', g)
    // 月洞门砖框
    const ring = new THREE.Mesh(new THREE.TorusGeometry(1.22, 0.09, 8, 40), M.stoneMat)
    ring.rotation.y = Math.PI / 2
    ring.position.set(-10, 1.32, -3.5)
    ring.castShadow = true
    G.add(ring)
    // 墙帽（两段）
    put('ridge', boxGeo(T + 0.3, 0.12, 16.9, 0.3).translate(-10, H + 0.05, -4.85))
    put('ridge', boxGeo(T + 0.3, 0.12, 16.9, 0.3).translate(-10, H + 0.05, -4.85))
    ctx.wall(-10 - T / 2, -13.2, -10 + T / 2, -4.7, H)
    ctx.wall(-10 - T / 2, -2.3, -10 + T / 2, 3.5, H)
  }

  const matMap = { plasterWall: M.plasterWall, ridge: M.ridge, doorPanel: M.doorPanel }
  for (const [k, geos] of Object.entries(parts)) {
    const m = new THREE.Mesh(merge(geos), matMap[k])
    m.castShadow = true; m.receiveShadow = true
    G.add(m)
  }
  return G
}
