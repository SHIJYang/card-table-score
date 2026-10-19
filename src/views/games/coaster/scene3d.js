/**
 * 涂鸦过山车 —— 第一人称骑行视图（three.js）
 *
 * 把手绘轨道立起来变成真正的 3D 钢轨：双轨 + 脊梁 + 枕木 + 支柱 + 站台，
 * 再加上草地、碎石小径、树、远山和雾。你坐在车头，相机挂在轨道坐标系上，
 * 所以翻圈的时候整个世界都会转过来。
 */
import * as THREE from 'three'
import { sample, zAt } from './geometry'

/* ---------- 向量小工具（数组形式，方便直接和帧数据配合） ---------- */
const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]]
const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]]
const mul = (a, k) => [a[0] * k, a[1] * k, a[2] * k]
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2]
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]
const norm = (a) => {
  const l = Math.hypot(a[0], a[1], a[2]) || 1
  return [a[0] / l, a[1] / l, a[2] / l]
}
const lerp3 = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]
const clamp = (v, a, b) => Math.max(a, Math.min(b, v))

const hex = (h) => [parseInt(h.slice(1, 3), 16) / 255, parseInt(h.slice(3, 5), 16) / 255, parseInt(h.slice(5, 7), 16) / 255]
const jit = (c, k) => {
  const f = 1 + (Math.random() * 2 - 1) * k
  return [c[0] * f, c[1] * f, c[2] * f]
}

const FOG = 0xcfeaf8
const SUN = norm([-0.45, 0.78, 0.42])

/** 逐三角形累积的网格构造器（位置 / 法线 / 顶点色） */
class Builder {
  constructor() {
    this.p = []
    this.n = []
    this.c = []
  }

  tri(a, b, c, col, nrm) {
    const N = nrm || norm(cross(sub(b, a), sub(c, a)))
    for (const v of [a, b, c]) {
      this.p.push(v[0], v[1], v[2])
      this.n.push(N[0], N[1], N[2])
      this.c.push(col[0], col[1], col[2])
    }
  }

  quad(a, b, c, d, col) {
    this.tri(a, b, c, col)
    this.tri(a, c, d, col)
  }

  /** X / Y / Z 是三个方向的半长向量 */
  box(center, X, Y, Z, col) {
    const p = (i, j, k) => add(add(add(center, mul(X, i)), mul(Y, j)), mul(Z, k))
    const faces = [
      [[1, -1, -1], [1, 1, -1], [1, 1, 1], [1, -1, 1]],
      [[-1, -1, 1], [-1, 1, 1], [-1, 1, -1], [-1, -1, -1]],
      [[-1, 1, -1], [-1, 1, 1], [1, 1, 1], [1, 1, -1]],
      [[-1, -1, 1], [-1, -1, -1], [1, -1, -1], [1, -1, 1]],
      [[-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1]],
      [[1, -1, -1], [-1, -1, -1], [-1, 1, -1], [1, 1, -1]],
    ]
    const flip = dot(cross(X, Y), Z) < 0
    for (const f of faces) {
      const v = f.map((t) => p(t[0], t[1], t[2]))
      if (flip) this.quad(v[3], v[2], v[1], v[0], col)
      else this.quad(v[0], v[1], v[2], v[3], col)
    }
  }

  geometry() {
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.p, 3))
    g.setAttribute('normal', new THREE.Float32BufferAttribute(this.n, 3))
    g.setAttribute('color', new THREE.Float32BufferAttribute(this.c, 3))
    g.computeBoundingSphere()
    return g
  }
}

/** 轨道坐标系：P 位置，T 切线，U 乘客头顶方向，B 侧向 */
function frames3D(track, groundY) {
  const step = Math.max(0.5, track.len / 1400)
  const n = Math.floor(track.len / step) + 1
  const P = []
  const T = []
  const U = []
  const B = []
  for (let i = 0; i < n; i++) {
    const s = Math.min(track.len, i * step)
    const p = sample(track, s)
    P.push([p.x, groundY - p.y, zAt(track, s)])
    U.push([track.sigma * p.ty, track.sigma * p.tx, 0])
  }
  for (let i = 0; i < n; i++) {
    const t = norm(sub(P[Math.min(n - 1, i + 1)], P[Math.max(0, i - 1)]))
    let u = U[i]
    u = norm(sub(u, mul(t, dot(u, t))))
    T.push(t)
    U[i] = u
    B.push(norm(cross(t, u)))
  }
  return { n, step, P, T, U, B }
}

export class Scene3D {
  constructor(canvas) {
    this.canvas = canvas
    this.renderer = null
    this.scene = null
    this.camera = null
    this.frames = null
    this.car = null
    this.railsGroup = null
    this.postsGroup = null
    this.track = null
    this.ready = false
    this.failed = false
  }

  /** 初始化 WebGL；不支持时返回 false，上层退化为侧视图 */
  init() {
    if (this.ready) return true
    if (this.failed) return false
    try {
      this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true, alpha: false })
      this.renderer.setClearColor(FOG, 1)
    } catch (e) {
      console.warn('[coaster] WebGL 不可用', e)
      this.failed = true
      return false
    }
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75))
    this.scene = new THREE.Scene()
    this.scene.background = makeSkyTexture()
    this.scene.fog = new THREE.FogExp2(FOG, 0.0026)
    this.camera = new THREE.PerspectiveCamera(68, 1, 0.1, 4000)

    const hemi = new THREE.HemisphereLight(0xdff1ff, 0x6a9a55, 1.15)
    this.scene.add(hemi)
    const sun = new THREE.DirectionalLight(0xfff3d6, 1.5)
    sun.position.set(SUN[0] * 120, SUN[1] * 120, SUN[2] * 120)
    this.scene.add(sun)
    const fill = new THREE.DirectionalLight(0xffffff, 0.35)
    fill.position.set(-SUN[0] * 80, 40, -SUN[2] * 80)
    this.scene.add(fill)
    this.ready = true
    return true
  }

  resize(w, h) {
    if (!this.ready || !w || !h) return
    this.renderer.setSize(w, h, false)
    this.camera.aspect = w / h
    this.camera.updateProjectionMatrix()
  }

  setShow({ rails = true, posts = true } = {}) {
    if (this.railsGroup) this.railsGroup.visible = rails
    if (this.postsGroup) this.postsGroup.visible = posts
  }

  /** 根据轨道生成所有静态几何 */
  build(track, groundY) {
    if (!this.init()) return
    this.disposeScene()
    const F = frames3D(track, groundY)
    this.frames = F
    this.track = track
    const { n, P, T, U, B } = F
    const scene = this.scene
    const RAIL = hex('#d6342c')
    const SPINE = hex('#9e2620')
    const TIE = hex('#6c7580')
    const STEEL = hex('#b3bdc7')

    /* 世界：草地 + 小径 + 树 + 远山 */
    const world = new Builder()
    let x0 = Infinity
    let x1 = -Infinity
    let z0 = Infinity
    let z1 = -Infinity
    for (const p of P) {
      x0 = Math.min(x0, p[0])
      x1 = Math.max(x1, p[0])
      z0 = Math.min(z0, p[2])
      z1 = Math.max(z1, p[2])
    }
    const cx = (x0 + x1) / 2
    const cz = (z0 + z1) / 2
    const R = Math.max(380, Math.max(x1 - x0, z1 - z0) / 2 + 260)

    // 草地（顶点色抖动，避免一大片死板的绿）
    const GN = 56
    const gs = (2 * R) / GN
    const GRASS = hex('#74a65a')
    const gcol = []
    for (let j = 0; j <= GN; j++) {
      for (let i = 0; i <= GN; i++) {
        const x = cx - R + i * gs
        const z = cz - R + j * gs
        // 平滑的起伏（不要随机噪点，否则一格一格的方块很明显）
        const v = 0.93 + 0.06 * Math.sin(x * 0.012 + Math.sin(z * 0.008) * 1.6) + 0.05 * Math.sin(z * 0.02 + x * 0.005)
        gcol.push([GRASS[0] * v, GRASS[1] * (v * 0.97 + 0.03), GRASS[2] * v])
      }
    }
    const up = [0, 1, 0]
    for (let j = 0; j < GN; j++) {
      for (let i = 0; i < GN; i++) {
        const x = cx - R + i * gs
        const z = cz - R + j * gs
        const k = j * (GN + 1) + i
        const a = [x, 0, z]
        const b = [x, 0, z + gs]
        const c = [x + gs, 0, z + gs]
        const d = [x + gs, 0, z]
        world.tri(a, b, c, gcol[k], up)
        world.tri(a, c, d, gcol[k + 1], up)
      }
    }
    // 轨道下方的碎石小径
    const PATH = hex('#c9b48a')
    for (let i = 0; i < n - 2; i += 2) {
      const a = P[i]
      const b = P[i + 2]
      const dx = b[0] - a[0]
      const dz = b[2] - a[2]
      const l = Math.hypot(dx, dz)
      if (l < 0.05) continue
      const sx = (-dz / l) * 1.6
      const sz = (dx / l) * 1.6
      const y = 0.04 + (i % 4) * 0.002
      world.quad(
        [a[0] + sx, y, a[2] + sz],
        [b[0] + sx, y, b[2] + sz],
        [b[0] - sx, y, b[2] - sz],
        [a[0] - sx, y, a[2] - sz],
        jit(PATH, 0.05),
        up
      )
    }
    // 树（离轨道远一点）
    const near = (x, z) => {
      for (let i = 0; i < n; i += 4) {
        const p = P[i]
        if ((p[0] - x) ** 2 + (p[2] - z) ** 2 < 49) return true
      }
      return false
    }
    let placed = 0
    for (let tries = 0; placed < 260 && tries < 3000; tries++) {
      const ang = Math.random() * Math.PI * 2
      const rr = Math.sqrt(Math.random()) * R * 0.92
      const x = cx + Math.cos(ang) * rr
      const z = cz + Math.sin(ang) * rr
      if (near(x, z)) continue
      placed++
      const h = 4 + Math.random() * 5
      const r = 1.5 + Math.random() * 1.4
      const col = jit(hex(Math.random() < 0.5 ? '#3f7d3a' : '#4f8f45'), 0.12)
      world.box([x, 0.9, z], [0.22, 0, 0], [0, 0.9, 0], [0, 0, 0.22], hex('#6b4a33'))
      const tip = [x, 1.6 + h, z]
      const S = 7
      for (let k = 0; k < S; k++) {
        const a1 = (k / S) * Math.PI * 2
        const a2 = ((k + 1) / S) * Math.PI * 2
        const p1 = [x + Math.cos(a1) * r, 1.4, z + Math.sin(a1) * r]
        const p2 = [x + Math.cos(a2) * r, 1.4, z + Math.sin(a2) * r]
        world.tri(p1, tip, p2, k % 2 ? col : mul(col, 0.9))
      }
    }
    // 地平线上的远山
    const MR = R * 2.1
    const MS = 64
    const hs = []
    for (let k = 0; k < MS; k++) hs.push(40 + 50 * Math.abs(Math.sin(k * 0.37)) + 40 * Math.random())
    for (let k = 0; k < MS; k++) {
      const a1 = (k / MS) * Math.PI * 2
      const a2 = ((k + 1) / MS) * Math.PI * 2
      const h1 = hs[k]
      const h2 = hs[(k + 1) % MS]
      const b1 = [cx + Math.cos(a1) * MR, -30, cz + Math.sin(a1) * MR]
      const b2 = [cx + Math.cos(a2) * MR, -30, cz + Math.sin(a2) * MR]
      const t1 = [b1[0], h1, b1[2]]
      const t2 = [b2[0], h2, b2[2]]
      world.quad(b1, b2, t2, t1, hex('#7f9fb6'))
    }
    const worldMesh = new THREE.Mesh(world.geometry(), vertexMat({ side: THREE.DoubleSide }))
    worldMesh.frustumCulled = false
    scene.add(worldMesh)
    this.worldMesh = worldMesh

    /* 轨道：双轨 + 脊梁 + 枕木 */
    const rails = new Builder()
    const tube = (off, r, sides, col) => {
      let prevRing = null
      for (let i = 0; i < n; i++) {
        const c = add(add(P[i], mul(B[i], off[0])), mul(U[i], off[1]))
        const ring = []
        for (let k = 0; k < sides; k++) {
          const a = (k / sides) * Math.PI * 2
          ring.push(add(c, add(mul(B[i], Math.cos(a) * r), mul(U[i], Math.sin(a) * r))))
        }
        if (prevRing) {
          for (let k = 0; k < sides; k++) {
            const k2 = (k + 1) % sides
            rails.quad(prevRing[k], ring[k], ring[k2], prevRing[k2], col)
          }
        }
        prevRing = ring
      }
    }
    tube([0.55, 0], 0.085, 6, RAIL)
    tube([-0.55, 0], 0.085, 6, RAIL)
    tube([0, -0.38], 0.15, 6, SPINE)
    for (let i = 0; i < n; i += 2) {
      rails.box(sub(P[i], mul(U[i], 0.18)), mul(T[i], 0.07), mul(U[i], 0.085), mul(B[i], 0.56), TIE)
    }
    // 站台顶棚 + 终点挡板
    {
      const p = P[0]
      const t = T[0]
      const u = U[0]
      const b = B[0]
      world.box(add(p, add(mul(u, 3.4), mul(t, -0.5))), mul(t, 4), mul(u, 0.14), mul(b, 2.4), hex('#f2b632'))
      for (const [dt, db] of [
        [-4, -2.2],
        [-4, 2.2],
        [3, -2.2],
        [3, 2.2],
      ]) {
        const q = add(p, add(mul(t, dt), mul(b, db)))
        const hy = q[1] / 2 + 1.7
        world.box([q[0], hy, q[2]], [0.12, 0, 0], [0, hy, 0], [0, 0, 0.12], hex('#2d3e4f'))
      }
      const fl = add(p, add(mul(b, 1.9), mul(u, -0.55)))
      world.box(fl, mul(t, 4), mul(u, 0.1), mul(b, 0.8), hex('#c9ced3'))
      const e = P[n - 1]
      const te = T[n - 1]
      rails.box(add(e, mul(te, 0.8)), mul(te, 0.12), mul(U[n - 1], 0.3), mul(B[n - 1], 0.68), hex('#ffcf3a'))
    }
    const railsMesh = new THREE.Mesh(rails.geometry(), vertexMat({ side: THREE.DoubleSide }))
    railsMesh.frustumCulled = false
    scene.add(railsMesh)
    this.railsGroup = railsMesh

    /* 支柱 */
    const posts = new Builder()
    for (let i = 4; i < n - 4; i += 14) {
      const p = sub(P[i], mul(U[i], 0.45))
      if (U[i][1] < 0.55 || p[1] < 1.3) continue
      posts.box([p[0], p[1] / 2, p[2]], [0.17, 0, 0], [0, p[1] / 2, 0], [0, 0, 0.17], STEEL)
      posts.box([p[0], 0.15, p[2]], [0.5, 0, 0], [0, 0.15, 0], [0, 0, 0.5], hex('#8d8a84'))
    }
    const postsMesh = new THREE.Mesh(posts.geometry(), vertexMat())
    postsMesh.frustumCulled = false
    postsMesh.visible = true
    scene.add(postsMesh)
    this.postsGroup = postsMesh

    /* 你坐着的车头（局部坐标：x 向前，y 向上，z 侧向）
       刻意做小一点：镜头就在座位上，太大就只剩一块挡板了 */
    const car = new Builder()
    const Y = hex('#ffcf3a')
    car.box([0, 0.24, 0], [0.64, 0, 0], [0, 0.19, 0], [0, 0, 0.44], Y) // 车身
    car.box([0.73, 0.2, 0], [0.13, 0, 0], [0, 0.13, 0], [0, 0, 0.37], mul(Y, 0.9)) // 车头
    car.box([0.81, 0.24, 0.24], [0.03, 0, 0], [0, 0.045, 0], [0, 0, 0.065], hex('#fff6d0')) // 车灯
    car.box([0.81, 0.24, -0.24], [0.03, 0, 0], [0, 0.045, 0], [0, 0, 0.065], hex('#fff6d0'))
    car.box([0, 0.43, 0.43], [0.64, 0, 0], [0, 0.035, 0], [0, 0, 0.025], mul(Y, 0.78)) // 侧沿
    car.box([0, 0.43, -0.43], [0.64, 0, 0], [0, 0.035, 0], [0, 0, 0.025], mul(Y, 0.78))
    car.box([0.39, 0.56, 0], [0.025, 0, 0], [0, 0.025, 0], [0, 0, 0.27], hex('#4a5560')) // 压腿杠
    car.box([0.39, 0.49, 0.26], [0.02, 0, 0], [0, 0.07, 0], [0, 0, 0.02], hex('#4a5560'))
    car.box([0.39, 0.49, -0.26], [0.02, 0, 0], [0, 0.07, 0], [0, 0, 0.02], hex('#4a5560'))
    const carMesh = new THREE.Mesh(car.geometry(), vertexMat())
    carMesh.frustumCulled = false
    scene.add(carMesh)
    this.car = carMesh
    this.setShow({ rails: true, posts: true })
  }

  /** 轨道坐标系上取插值帧 */
  camAt(s) {
    const F = this.frames
    if (!F) return null
    const f = clamp(s / F.step, 0, F.n - 1.001)
    const i = Math.floor(f)
    const u = f - i
    const j = Math.min(F.n - 1, i + 1)
    return {
      P: lerp3(F.P[i], F.P[j], u),
      T: norm(lerp3(F.T[i], F.T[j], u)),
      U: norm(lerp3(F.U[i], F.U[j], u)),
      B: norm(lerp3(F.B[i], F.B[j], u)),
    }
  }

  render(eng) {
    if (!this.ready || !this.frames || !this.track) return
    const len = this.track.len
    // 收尾时把镜头停在轨道末端前一点，免得整个人埋进缓冲挡板里
    const s = eng.ride ? clamp(eng.ride.s, 0, Math.max(0, len - 1.2)) : 0
    const v = eng.ride ? eng.ride.v : 0
    const c = this.camAt(s)
    const ahead = this.camAt(Math.min(len, s + 2))
    const tt = performance.now() / 1000
    const shake = v > 14 ? Math.min(0.035, (v - 14) * 0.0016) : 0
    const q = eng.ride && eng.mode === 'ride' ? clamp((eng.ride.held - 0.2) / 1.7, 0, 1) : 1
    const k = 1 - q * q * (3 - 2 * q) // 发车时从后上方推到第一人称
    const eye = add(
      add(add(c.P, mul(c.U, 1.35 + 1.15 * k + Math.sin(tt * 37) * shake)), mul(c.T, -0.45 - 3 * k)),
      mul(c.B, 0.8 * k + Math.sin(tt * 29) * shake)
    )
    let dir = norm(add(mul(c.T, 0.78), mul(norm(sub(add(ahead.P, mul(ahead.U, 1.4)), eye)), 0.22)))
    if (k > 0) {
      const target = norm(sub(add(c.P, add(mul(c.T, 10), mul(c.U, 0.3))), eye))
      dir = norm(add(mul(dir, 1 - k), mul(target, k)))
    }
    this.camera.position.set(eye[0], eye[1], eye[2])
    this.camera.up.set(c.U[0], c.U[1], c.U[2])
    this.camera.lookAt(eye[0] + dir[0], eye[1] + dir[1], eye[2] + dir[2])

    // 车头跟着轨道坐标系走
    if (this.car) {
      const m = new THREE.Matrix4()
      m.makeBasis(
        new THREE.Vector3(c.T[0], c.T[1], c.T[2]),
        new THREE.Vector3(c.U[0], c.U[1], c.U[2]),
        new THREE.Vector3(c.B[0], c.B[1], c.B[2])
      )
      this.car.position.set(c.P[0], c.P[1], c.P[2])
      this.car.quaternion.setFromRotationMatrix(m)
    }
    this.renderer.render(this.scene, this.camera)
  }

  disposeScene() {
    if (!this.scene) return
    for (const obj of [this.worldMesh, this.railsGroup, this.postsGroup, this.car]) {
      if (!obj) continue
      this.scene.remove(obj)
      obj.geometry?.dispose()
      obj.material?.dispose()
    }
    this.worldMesh = null
    this.railsGroup = null
    this.postsGroup = null
    this.car = null
    this.frames = null
    this.track = null
  }

  dispose() {
    this.disposeScene()
    if (this.scene?.background?.dispose) this.scene.background.dispose()
    this.renderer?.dispose()
    this.renderer = null
    this.ready = false
  }
}

/** 顶点色 + 朗伯材质，双面可选 */
function vertexMat(extra = {}) {
  return new THREE.MeshLambertMaterial({ vertexColors: true, ...extra })
}

/** 天顶 → 地平线的渐变贴图 */function makeSkyTexture() {
  const c = document.createElement('canvas')
  c.width = 4
  c.height = 256
  const g = c.getContext('2d')
  const grd = g.createLinearGradient(0, 0, 0, 256)
  grd.addColorStop(0, '#5fb4ea')
  grd.addColorStop(0.55, '#a9dcf5')
  grd.addColorStop(0.85, '#d8eefb')
  grd.addColorStop(1, '#eaf6fb')
  g.fillStyle = grd
  g.fillRect(0, 0, 4, 256)
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  return t
}
