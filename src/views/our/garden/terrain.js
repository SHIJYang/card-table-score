// 江南园林场景 - 地形：地面/池塘水体/湖石假山/庭院砖地/石径/远山/锦鲤
import * as THREE from 'three'
import { Water } from 'three/addons/objects/Water.js'
import { merge, boxGeo, cylGeo, rng, pointInPoly } from './util'

// 池塘轮廓（手绘不规则形）
export const POND_POLY = [
  [7.6, 5.4], [9.8, 4.2], [12.6, 3.8], [15.4, 4.2], [17.6, 5.6], [18.6, 8.2],
  [17.4, 10.6], [14.8, 11.0], [11.8, 11.3], [9.4, 10.9], [8.0, 9.6], [7.0, 7.8],
]

export const POND = { cx: 12.6, cz: 8.2, level: -0.26, depth: 1.5 }

// 太湖石：多个变形椭球合成
function taihuStone(R, size = 1) {
  const geos = []
  const n = R.i(3, 5)
  for (let i = 0; i < n; i++) {
    const g = new THREE.IcosahedronGeometry(R.f(0.4, 0.85) * size, 1)
    const pos = g.attributes.position
    for (let v = 0; v < pos.count; v++) {
      const x = pos.getX(v), y = pos.getY(v), z = pos.getZ(v)
      const d = 1 + Math.sin(x * 4.7 + y * 3.3 + z * 5.1 + R.f(9)) * 0.18 + Math.sin(y * 7.3 + x * 2.1) * 0.12
      pos.setXYZ(v, x * d * R.f(0.8, 1.15), y * d, z * d * R.f(0.8, 1.15))
    }
    g.computeVertexNormals()
    _q.setFromEuler(new THREE.Euler(R.f(-0.4, 0.4), R.f(Math.PI * 2), R.f(-0.4, 0.4)))
    _m4.compose(new THREE.Vector3(R.f(-0.3, 0.3) * size, R.f(0, 0.5) * size * i * 0.4, R.f(-0.3, 0.3) * size), _q, _s1)
    g.applyMatrix4(_m4)
    geos.push(g)
  }
  // 透洞感：嵌一个深色环
  return merge(geos)
}

const _up = new THREE.Vector3(0, 1, 0)
const _q = new THREE.Quaternion()
const _m4 = new THREE.Matrix4()
const _s1 = new THREE.Vector3(1, 1, 1)

export function buildTerrain(ctx, M, scene) {
  const G = new THREE.Group()
  const R = rng(300)
  const ret = {}

  // ===== 地面（平面地表 + 池塘凹坑） =====
  {
    const toShape = (poly, pathCls = THREE.Shape) => {
      const s = new pathCls()
      poly.forEach(([x, z], i) => (i === 0 ? s.moveTo(x, -z) : s.lineTo(x, -z)))
      s.closePath()
      return s
    }
    // 地表：矩形挖去池塘，y=0 平面、法线朝上
    const gshape = toShape([[-24, -18], [26, -18], [26, 16], [-24, 16]])
    gshape.holes.push(toShape(POND_POLY, THREE.Path))
    const g = new THREE.ShapeGeometry(gshape, 4)
    g.rotateX(-Math.PI / 2)
    const ground = new THREE.Mesh(g, M.ground)
    ground.receiveShadow = true
    G.add(ground)
    // 池坑：盆壁与盆底（顶缘 y=0，盆底 y=-1.5）
    const bshape = toShape(POND_POLY)
    const basin = new THREE.ExtrudeGeometry(bshape, { depth: POND.depth, bevelEnabled: false })
    basin.rotateX(Math.PI / 2)
    basin.computeVertexNormals()
    const basinMesh = new THREE.Mesh(basin, M.ground)
    basinMesh.receiveShadow = true
    G.add(basinMesh)
  }

  // ===== 水体（反射 Water） =====
  {
    // 用 (x, -z) 建 shape，rotateX(-PI/2) 后法线朝上、绕序正确，无需再翻转
    const shape = new THREE.Shape()
    POND_POLY.forEach(([x, z], i) => (i === 0 ? shape.moveTo(x, -z) : shape.lineTo(x, -z)))
    shape.closePath()
    const g = new THREE.ShapeGeometry(shape, 24)
    // UV 按世界尺度平铺（约 1.2m 一个波纹周期）
    const uv = g.attributes.uv
    for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) / 1.2, uv.getY(i) / 1.2)
    g.rotateX(-Math.PI / 2)
    const water = new Water(g, {
      textureWidth: 512,
      textureHeight: 512,
      waterNormals: M.tex.waterN,
      sunDirection: new THREE.Vector3(0.5, 0.8, 0.3),
      sunColor: 0xdddddd,
      waterColor: 0x1f2f27,
      distortionScale: 2.4,
      fog: true,
    })
    water.rotation.x = 0
    water.position.y = POND.level
    water.receiveShadow = false
    scene.add(water)
    ret.water = water
  }

  // ===== 池岸湖石圈 =====
  {
    const rockGeos = []
    for (let i = 0; i < POND_POLY.length; i++) {
      const [x1, z1] = POND_POLY[i], [x2, z2] = POND_POLY[(i + 1) % POND_POLY.length]
      const segs = Math.max(2, Math.round(Math.hypot(x2 - x1, z2 - z1) / 1.4))
      for (let s = 0; s < segs; s++) {
        const t = s / segs
        const x = x1 + (x2 - x1) * t + R.f(-0.25, 0.25), z = z1 + (z2 - z1) * t + R.f(-0.25, 0.25)
        const s0 = R.f(0.28, 0.62)
        const g = new THREE.IcosahedronGeometry(s0, 1)
        const pos = g.attributes.position
        for (let v = 0; v < pos.count; v++) {
          const d = 1 + Math.sin(pos.getX(v) * 6.3 + pos.getY(v) * 4.1 + i) * 0.22
          pos.setXYZ(v, pos.getX(v) * d, pos.getY(v) * d * 0.7, pos.getZ(v) * d)
        }
        g.computeVertexNormals()
        _q.setFromEuler(new THREE.Euler(R.f(-0.3, 0.3), R.f(Math.PI * 2), R.f(-0.3, 0.3)))
        _m4.compose(new THREE.Vector3(x, R.f(-0.2, 0.12), z), _q, _s1)
        g.applyMatrix4(_m4)
        rockGeos.push(g)
      }
    }
    const rocks = new THREE.Mesh(merge(rockGeos), M.rockMat)
    rocks.castShadow = true; rocks.receiveShadow = true
    G.add(rocks)
  }

  // ===== 假山（西北角）与点景石 =====
  {
    function rockery(cx, cz, size, n) {
      const geos = []
      for (let i = 0; i < n; i++) {
        const g = taihuStone(R, size * R.f(0.55, 1.0))
        _m4.compose(new THREE.Vector3(cx + R.f(-size, size) * 0.8, R.f(0, size * 1.1), cz + R.f(-size, size) * 0.7),
          _q.setFromEuler(new THREE.Euler(R.f(-0.25, 0.25), R.f(Math.PI * 2), R.f(-0.25, 0.25))), _s1)
        g.applyMatrix4(_m4)
        geos.push(g)
      }
      const m = new THREE.Mesh(merge(geos), M.rockMat)
      m.castShadow = true; m.receiveShadow = true
      G.add(m)
      ctx.wall(cx - size * 1.2, cz - size, cx + size * 1.2, cz + size, size * 1.6)
      return m
    }
    rockery(-14.4, -11.4, 1.5, 7)   // 主假山（配古松）
    rockery(-6.1, -12.2, 0.9, 4)    // 廊后小山
    rockery(17.8, -2.6, 0.8, 3)
    // 池畔点景石
    for (const [x, z, s] of [[6.3, 4.2, 0.55], [7.0, 12.3, 0.5], [-3.2, 10.6, 0.45], [19.4, 2.9, 0.6], [4.1, 10.4, 0.5], [10.4, 3.1, 0.4]]) {
      const m = new THREE.Mesh(taihuStone(R, s), M.rockMat)
      m.position.set(x, 0.05, z)
      m.rotation.y = R.f(Math.PI * 2)
      m.castShadow = true; m.receiveShadow = true
      G.add(m)
      ctx.wall(x - s, z - s, x + s, z + s, 1)
    }
  }

  // ===== 庭院青砖（实例化） =====
  {
    const bg = boxGeo(0.3, 0.05, 0.145, 1)
    const inst = new THREE.InstancedMesh(bg, M.brickMat, 2900)
    let idx = 0
    const rows = Math.floor(8.0 / 0.16)
    for (let r = 0; r < rows; r++) {
      const z = -1.55 + r * 0.16
      const off = (r % 2) * 0.16
      for (let c = 0; c < Math.floor(14.8 / 0.32); c++) {
        if (idx >= 2900) break
        const x = -7.4 + c * 0.32 + off
        if (z > -0.35 && Math.abs(x) < 1.85) continue // 台阶口留空
        _q.setFromEuler(new THREE.Euler(0, R.f(-0.02, 0.02), 0))
        _m4.compose(new THREE.Vector3(x, 0.026 + R.f(-0.006, 0.006), z), _q, _s1)
        inst.setMatrixAt(idx, _m4)
        const c2 = R.f(0.72, 1.02)
        inst.setColorAt(idx, new THREE.Color(c2 * 0.94, c2 * 0.96, c2))
        idx++
      }
    }
    inst.count = idx
    inst.receiveShadow = true
    inst.castShadow = false
    G.add(inst)
  }

  // ===== 石板小径（蜿蜒） =====
  {
    const paths = [
      // 台阶前向南，再折向东往桥/亭
      [[0, -0.2], [-0.6, 1.6], [0.2, 3.4], [1.6, 5.0], [3.4, 6.4], [4.2, 8.0], [4.6, 9.4]],
      [[1.6, 5.0], [5.6, 4.4], [8.4, 3.4], [11.2, 2.8]], // 向池北岸
      [[0, -0.2], [-2.2, 0.4], [-4.6, 0.2], [-7.0, -0.8], [-9.2, -1.8]], // 向西至月洞门
      [[9.8, 10.9], [12.2, 11.9], [14.6, 12.0]], // 桥北岸向东
    ]
    const slabGeos = []
    for (const path of paths) {
      for (let i = 0; i < path.length - 1; i++) {
        const [x1, z1] = path[i], [x2, z2] = path[i + 1]
        const len = Math.hypot(x2 - x1, z2 - z1)
        const n = Math.max(1, Math.round(len / 0.85))
        for (let s = 0; s <= n; s++) {
          const t = s / n
          const x = x1 + (x2 - x1) * t + R.f(-0.18, 0.18)
          const z = z1 + (z2 - z1) * t + R.f(-0.18, 0.18)
          const w = R.f(0.55, 0.8), d = R.f(0.5, 0.75)
          const g = boxGeo(w, 0.075, d, 0.5)
          _q.setFromEuler(new THREE.Euler(0, Math.atan2(z2 - z1, x2 - x1) + R.f(-0.35, 0.35), 0))
          _m4.compose(new THREE.Vector3(x, 0.038, z), _q, _s1)
          g.applyMatrix4(_m4)
          slabGeos.push(g)
        }
      }
    }
    const slabs = new THREE.Mesh(merge(slabGeos), M.stoneMat)
    slabs.receiveShadow = true; slabs.castShadow = false
    G.add(slabs)
  }

  // ===== 水洼 =====
  {
    const pudMat = new THREE.MeshPhysicalMaterial({
      map: M.tex.puddle, transparent: true, opacity: 0.85,
      roughness: 0.06, metalness: 0, normalMap: M.tex.waterN, normalScale: new THREE.Vector2(0.35, 0.35),
      envMapIntensity: 1.6, color: 0x889098,
    })
    const spots = [[-2.8, 1.2, 1.6], [3.8, 2.4, 1.3], [-5.2, 2.8, 1.8], [6.4, 0.6, 1.2], [-8.6, -1.4, 1.4], [1.2, 5.6, 1.1]]
    for (const [x, z, s] of spots) {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(s, s * 0.8), pudMat)
      m.rotation.x = -Math.PI / 2
      m.rotation.z = R.f(Math.PI * 2)
      m.position.set(x, 0.062, z)
      m.renderOrder = 2
      G.add(m)
    }
  }

  // ===== 锦鲤 =====
  {
    const koiGroup = new THREE.Group()
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0xd8642a, roughness: 0.4 })
    const whiteMat = new THREE.MeshStandardMaterial({ color: 0xe8e0d0, roughness: 0.4 })
    ret.koi = []
    for (let i = 0; i < 3; i++) {
      const fish = new THREE.Group()
      const body = new THREE.Mesh(new THREE.SphereGeometry(0.16, 10, 8), i === 1 ? whiteMat : bodyMat)
      body.scale.set(2.1, 0.75, 0.5)
      fish.add(body)
      const tail = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.3, 6), i === 1 ? whiteMat : bodyMat)
      tail.rotation.z = Math.PI / 2
      tail.position.x = -0.38
      tail.scale.set(1, 1, 0.35)
      fish.add(tail)
      const fin = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.18, 5), bodyMat)
      fin.position.set(0.12, 0.1, 0)
      fish.add(fin)
      koiGroup.add(fish)
      ret.koi.push({ obj: fish, phase: R.f(Math.PI * 2), r: R.f(1.6, 3.2), speed: R.f(0.1, 0.2), cx: 12.4, cz: 8.0, depth: R.f(-0.32, -0.2) })
    }
    G.add(koiGroup)
  }

  ret.group = G
  return ret
}
