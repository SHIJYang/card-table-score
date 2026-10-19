/**
 * 涂鸦过山车 —— 第一人称骑行视图（three.js）
 * 彻底拆材质组 + 真实 PBR 贴图 + HDR 环境反射 + 真实阴影
 */
import * as THREE from 'three'
import { HDRLoader } from 'three/examples/jsm/loaders/HDRLoader.js'
import { sample, zAt } from './geometry'

/* ---------- 向量小工具 ---------- */
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
const _col = new THREE.Color()
// 顶点色要的是线性空间的值，直接把 #rrggbb 塞进去会偏白（树叶变成薄荷绿）
const hex = (h) => {
  _col.set(h)
  return [_col.r, _col.g, _col.b]
}

const FOG = 0xdde9f1
const SUN = norm([-0.45, 0.78, 0.42])

/** 地面贴图的染色：贴图本身偏土黄，乘一个浅绿把它往草地拉（越接近白越原色） */
const GROUND_TINT = 0xb2d894

/**
 * 地面贴图（可平铺的草地/泥土表面图）。每个槽位会按顺序试几个文件名，
 * 命中第一个就用；全都没有就退回顶点色草地，不会报错也不会黑屏。
 * 一张图铺 12 米（见 build() 里地面 UV 的除数）。
 */
const GROUND_TEX = {
  map: ['/textures/grass_ground_diff_2k.jpg', '/textures/ground_grass_diff_2k.jpg'],
  normal: ['/textures/grass_ground_nor_gl_2k.jpg', '/textures/ground_grass_nor_gl_2k.jpg'],
  rough: [
    '/textures/grass_ground_rough_2k.jpg',
    '/textures/grass_ground_arm_2k.jpg',
    '/textures/ground_grass_rough_2k.jpg',
    '/textures/ground_grass_arm_2k.jpg',
  ],
}

/**
 * 草丛图集里那一丛完整草的 UV 范围（图上像素坐标 340,1470 - 800,1760，2048² 图集）
 * —— 现在草地改用真正的地表贴图了，草丛面片已经去掉，这个常量留着备用。
 */
const GRASS_CELL = {
  u0: 340 / 2048,
  u1: 800 / 2048,
  v0: 1 - 1760 / 2048,
  v1: 1 - 1470 / 2048,
}

/* =====================================================================
 * Builder：位置 / 法线 / UV / 顶点色，逐三角形累积
 * ===================================================================== */
class Builder {
  constructor() {
    this.p = []
    this.n = []
    this.uv = []
    this.c = []
    this.hasColor = false
  }

  tri(a, b, c, col, nrm, uvs) {
    const N = nrm || norm(cross(sub(b, a), sub(c, a)))
    const U = uvs || [[0, 0], [0, 0], [0, 0]]
    const verts = [a, b, c]
    // col 既可以是整块一个颜色，也可以是三个顶点各自的颜色（地面起伏的深浅用它）
    const per = Array.isArray(col) && Array.isArray(col[0]) ? col : null
    for (let i = 0; i < 3; i++) {
      const v = verts[i]
      this.p.push(v[0], v[1], v[2])
      this.n.push(N[0], N[1], N[2])
      this.uv.push(U[i][0], U[i][1])
      const cc = per ? per[i] : col
      if (cc) {
        this.c.push(cc[0], cc[1], cc[2])
        this.hasColor = true
      }
    }
  }

  quad(a, b, c, d, col, uvs) {
    const U = uvs || [[0, 0], [1, 0], [1, 1], [0, 1]]
    this.tri(a, b, c, col, null, [U[0], U[1], U[2]])
    this.tri(a, c, d, col, null, [U[0], U[2], U[3]])
  }

  box(center, X, Y, Z, col, tile = 1) {
    const p = (i, j, k) => add(add(add(center, mul(X, i)), mul(Y, j)), mul(Z, k))
    const faces = [
      { idx: [[1, -1, -1], [1, 1, -1], [1, 1, 1], [1, -1, 1]], u: 2, v: 1 },
      { idx: [[-1, -1, 1], [-1, 1, 1], [-1, 1, -1], [-1, -1, -1]], u: 2, v: 1 },
      { idx: [[-1, 1, -1], [-1, 1, 1], [1, 1, 1], [1, 1, -1]], u: 0, v: 2 },
      { idx: [[-1, -1, 1], [-1, -1, -1], [1, -1, -1], [1, -1, 1]], u: 0, v: 2 },
      { idx: [[-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1]], u: 0, v: 1 },
      { idx: [[1, -1, -1], [-1, -1, -1], [-1, 1, -1], [1, 1, -1]], u: 0, v: 1 },
    ]
    const flip = dot(cross(X, Y), Z) < 0
    for (const f of faces) {
      const v = f.idx.map((t) => p(t[0], t[1], t[2]))
      const corners = [[0, 0], [0, 1], [1, 1], [1, 0]]
      const uvs = corners.map(([cu, cv]) => [cu * tile, cv * tile])
      if (flip) this.quad(v[3], v[2], v[1], v[0], col, [uvs[3], uvs[2], uvs[1], uvs[0]])
      else this.quad(v[0], v[1], v[2], v[3], col, uvs)
    }
  }

  geometry() {
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.p, 3))
    g.setAttribute('normal', new THREE.Float32BufferAttribute(this.n, 3))
    g.setAttribute('uv', new THREE.Float32BufferAttribute(this.uv, 2))
    if (this.hasColor) g.setAttribute('color', new THREE.Float32BufferAttribute(this.c, 3))
    g.computeBoundingSphere()
    return g
  }
}

/* =====================================================================
 * 天空贴图兜底（如果 HDR 加载失败或还在加载中，用它防黑屏）
 * ===================================================================== */
function makeSkyTexture() {
  const c = document.createElement('canvas')
  c.width = 4
  c.height = 256
  const g = c.getContext('2d')
  const grd = g.createLinearGradient(0, 0, 0, 256)
  grd.addColorStop(0, '#5fb4ea')
  grd.addColorStop(0.55, '#a9dcf5')
  grd.addColorStop(0.85, '#d8eefb')
  grd.addColorStop(1, '#cfeaf8')
  g.fillStyle = grd
  g.fillRect(0, 0, 4, 256)
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  return t
}

/* =====================================================================
 * 轨道坐标系
 * ===================================================================== */
function frames3D(track, groundY) {
  const step = Math.max(0.5, track.len / 1400)
  const n = Math.floor(track.len / step) + 1
  const P = [], T = [], U = [], B = []
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

/* =====================================================================
 * Scene3D
 * ===================================================================== */
export class Scene3D {
  constructor(canvas) {
    this.canvas = canvas
    this.renderer = null
    this.scene = null
    this.camera = null
    this.frames = null
    this.car = null
    this.groups = {}
    this.track = null
    this.ready = false
    this.failed = false
  }

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
    
    // 开启阴影和真实色调映射
    this.renderer.shadowMap.enabled = true
    this.renderer.shadowMap.type = THREE.PCFShadowMap
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping
    this.renderer.toneMappingExposure = 1.1
    this.renderer.outputColorSpace = THREE.SRGBColorSpace

    this.scene = new THREE.Scene()
    this.scene.background = makeSkyTexture()
    this.scene.fog = new THREE.FogExp2(FOG, 0.0015)
    this.camera = new THREE.PerspectiveCamera(68, 1, 0.1, 4000)

    // 光照：半球光弱化，太阳光强化并投射阴影
    const hemi = new THREE.HemisphereLight(0xdff1ff, 0x6a9a55, 0.9)
    this.scene.add(hemi)

    const sun = new THREE.DirectionalLight(0xfff3d6, 3.0)
    sun.position.set(SUN[0] * 120, SUN[1] * 120, SUN[2] * 120)
    sun.castShadow = true
    sun.shadow.mapSize.set(2048, 2048)
    sun.shadow.camera.left = -150
    sun.shadow.camera.right = 150
    sun.shadow.camera.top = 150
    sun.shadow.camera.bottom = -150
    sun.shadow.camera.near = 1
    sun.shadow.camera.far = 400
    sun.shadow.bias = -0.0005
    sun.shadow.normalBias = 0.03
    this.scene.add(sun)
    // 平行光的 target 默认不在场景里，不挂进去它的矩阵就不会更新，阴影会投在原点
    this.scene.add(sun.target)
    this.sun = sun

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
    if (this.groups.rails) this.groups.rails.visible = rails
    if (this.groups.posts) this.groups.posts.visible = posts
  }

  /* ---------- 材质加载（核心） ---------- */
  buildMaterials() {
    if (this.mats) return // 避免重复加载

    const texLoader = new THREE.TextureLoader()
    
    // 辅助函数：统一设置颜色、平铺和抗锯齿
    const setupTex = (path, isColor = false, rx = 1, ry = 1) => {
      const tex = texLoader.load(path)
      tex.wrapS = tex.wrapT = THREE.RepeatWrapping
      if (isColor) tex.colorSpace = THREE.SRGBColorSpace
      tex.repeat.set(rx, ry)
      tex.anisotropy = this.renderer.capabilities.getMaxAnisotropy()
      return tex
    }

    // 1. 钢轨 (金属板贴图 + 材质染成红色，仓库里没有 rusty_painted_metal 那几个文件)
    const rDiff = setupTex('/textures/metal_plate_02_diff_2k.jpg', true, 1, 1)
    const rNor = setupTex('/textures/metal_plate_02_nor_gl_2k.jpg', false, 1, 1)
    const rArm = setupTex('/textures/metal_plate_02_arm_2k.jpg', false, 1, 1)

    // 3. 石头小径
    const sDiff = setupTex('/textures/stone_tiles_03_diff_2k.jpg', true, 1, 3)
    const sNor = setupTex('/textures/stone_tiles_03_nor_gl_2k.jpg', false, 1, 3)
    const sArm = setupTex('/textures/stone_tiles_03_arm_2k.jpg', false, 1, 3)

    // 4. 木头枕木
    const wDiff = setupTex('/textures/wooden_floor_02_diff_2k.jpg', true, 1, 1)
    const wNor = setupTex('/textures/wooden_floor_02_nor_gl_2k.jpg', false, 1, 1)
    const wArm = setupTex('/textures/wooden_floor_02_arm_2k.jpg', false, 1, 1)

    this.mats = {
      // 草地：顶点色（见 build 里按世界坐标铺的绿色起伏）
      ground: new THREE.MeshStandardMaterial({
        vertexColors: true,
        roughness: 1.0, metalness: 0.0, envMapIntensity: 0.4,
      }),
      rail: new THREE.MeshStandardMaterial({
        map: rDiff, normalMap: rNor, roughnessMap: rArm, metalnessMap: rArm,
        color: 0xd6342c,
        roughness: 1.0, metalness: 1.0,
      }),
      spine: new THREE.MeshStandardMaterial({ color: 0x9e2620, roughness: 0.5, metalness: 0.6 }),
      tie: new THREE.MeshStandardMaterial({
        map: wDiff, normalMap: wNor, roughnessMap: wArm, metalnessMap: wArm,
        roughness: 1.0, metalness: 1.0,
      }),
      steel: new THREE.MeshStandardMaterial({ color: 0xb3bdc7, roughness: 0.4, metalness: 0.92 }),
      concrete: new THREE.MeshStandardMaterial({ color: 0x8d8a84, roughness: 0.95, metalness: 0.0 }),
      treeTrunk: new THREE.MeshStandardMaterial({ color: 0x6b4a33, roughness: 0.95 }),
      foliage: new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.85, side: THREE.DoubleSide }),
      // 远山用不受光照影响的材质：要不然每片山体法线不同，会出现一条条竖着的折面
      mountain: new THREE.MeshBasicMaterial({ vertexColors: true, fog: true, side: THREE.DoubleSide }),
      path: new THREE.MeshStandardMaterial({
        map: sDiff, normalMap: sNor, roughnessMap: sArm,
        roughness: 1.0, metalness: 0.0, envMapIntensity: 0.5, side: THREE.DoubleSide
      }),
      platform: new THREE.MeshStandardMaterial({ color: 0xf2b632, roughness: 0.6, metalness: 0.1 }),
      platformPost: new THREE.MeshStandardMaterial({ color: 0x6d7784, roughness: 0.55, metalness: 0.45 }),
      platformFloor: new THREE.MeshStandardMaterial({ color: 0x9a958c, roughness: 0.9, metalness: 0.05 }),
      buffer: new THREE.MeshStandardMaterial({ color: 0xffcf3a, roughness: 0.5, metalness: 0.3 }),
      carBody: new THREE.MeshStandardMaterial({ color: 0xffcf3a, roughness: 0.35, metalness: 0.35 }),
      carDark: new THREE.MeshStandardMaterial({ color: 0x4a5560, roughness: 0.4, metalness: 0.7 }),
      carLight: new THREE.MeshStandardMaterial({ color: 0xfff6d0, roughness: 0.2, emissive: 0xfff0b0, emissiveIntensity: 0.6 }),
    }

    // === HDR：既做环境反射，也直接当天空背景（之前只做反射，天空是渐变兜底）===
    const hdrLoader = new HDRLoader()
    hdrLoader.load('/textures/sunflowers_puresky_2k.hdr', (texture) => {
      if (!this.scene) return
      texture.mapping = THREE.EquirectangularReflectionMapping
      this.scene.environment = texture
      this.scene.environmentIntensity = 0.9
      this.scene.background = texture // 天空用这张 HDR（加载完前用渐变贴图兜底）
      this.scene.backgroundIntensity = 1.0
      this.scene.backgroundBlurriness = 0.0
    })

    // === 地面贴图（可选，放进去就自动生效）===
    this.loadGroundMaps(texLoader)
  }

  /**
   * 地面贴图：把「可平铺」的草地/泥土表面贴图按下面的文件名丢进 public/textures/，
   * 刷新就生效；缺图时地面继续用顶点色，不会报错也不会黑屏。
   * 注意：不要用 grass_medium_01 那种草丛图集（黑底 alpha 卡片），铺开会是一片黑。
   */
  loadGroundMaps(texLoader) {
    const mat = this.mats.ground
    const aniso = this.renderer.capabilities.getMaxAnisotropy()
    const prep = (t, srgb) => {
      t.wrapS = t.wrapT = THREE.RepeatWrapping
      t.repeat.set(1, 1)
      t.anisotropy = aniso
      if (srgb) t.colorSpace = THREE.SRGBColorSpace
    }
    const alive = () => this.mats && this.mats.ground === mat
    // 依次尝试几个候选文件名，第一个成功的生效
    const tryLoad = (paths, onOk) => {
      if (!paths.length) return
      texLoader.load(paths[0], onOk, undefined, () => tryLoad(paths.slice(1), onOk))
    }

    tryLoad(GROUND_TEX.map, (t) => {
      if (!alive()) return
      prep(t, true)
      mat.map = t
      mat.vertexColors = false // 有贴图就用贴图的颜色，顶点色会把它压暗
      mat.color.set(GROUND_TINT) // 贴图偏土黄，往绿色拉一点，不然整片像沙漠
      mat.needsUpdate = true
    })

    tryLoad(GROUND_TEX.normal, (t) => {
      if (!alive()) return
      prep(t, false)
      mat.normalMap = t
      mat.normalScale.set(0.9, 0.9)
      mat.needsUpdate = true
    })

    // 粗糙度：PolyHaven 有的包只给 _arm_2k（ARM 的 G 通道就是粗糙度，能直接用）
    tryLoad(GROUND_TEX.rough, (t) => {
      if (!alive()) return
      prep(t, false)
      mat.roughnessMap = t
      mat.needsUpdate = true
    })
  }

  /** 根据轨道生成所有静态几何 */
  build(track, groundY) {
    if (!this.init()) return
    this.disposeScene()
    this.buildMaterials()

    const F = frames3D(track, groundY)
    this.frames = F
    this.track = track
    const { n, P, T, U, B } = F
    const scene = this.scene

    // 世界包围盒
    let x0 = Infinity, x1 = -Infinity, z0 = Infinity, z1 = -Infinity
    for (const p of P) {
      x0 = Math.min(x0, p[0]); x1 = Math.max(x1, p[0])
      z0 = Math.min(z0, p[2]); z1 = Math.max(z1, p[2])
    }
    const cx = (x0 + x1) / 2
    const cz = (z0 + z1) / 2
    const R = Math.max(380, Math.max(x1 - x0, z1 - z0) / 2 + 260)

    /* ---------- 地面（草地） ---------- */
    const ground = new Builder()
    const GN = 64
    // 地面铺到远山外一点点就够：铺太远的话最外圈会被雾洗成一条发白的「透明带」，
    // 而地面边缘又正好被远山挡住。
    const RG = R * 1.15
    const gs = (2 * RG) / GN
    const up = [0, 1, 0]
    const GRASS = hex('#74a65a')
    const gcol = []
    for (let j = 0; j <= GN; j++) {
      for (let i = 0; i <= GN; i++) {
        const x = cx - RG + i * gs
        const z = cz - RG + j * gs
        // 平滑起伏的深浅（不要随机噪点，否则一格一格的方块很明显）
        const v = 0.94 + 0.05 * Math.sin(x * 0.012 + Math.sin(z * 0.008) * 1.6) + 0.04 * Math.sin(z * 0.02 + x * 0.005)
        gcol.push([GRASS[0] * v, GRASS[1] * (v * 0.97 + 0.03), GRASS[2] * v])
      }
    }
    for (let j = 0; j < GN; j++) {
      for (let i = 0; i < GN; i++) {
        const x = cx - RG + i * gs
        const z = cz - RG + j * gs
        const k = j * (GN + 1) + i
        const a = [x, 0, z]
        const b = [x, 0, z + gs]
        const c = [x + gs, 0, z + gs]
        const d = [x + gs, 0, z]
        const uvs = [
          [x / 12, z / 12], [x / 12, (z + gs) / 12],
          [(x + gs) / 12, (z + gs) / 12], [(x + gs) / 12, z / 12],
        ]
        ground.tri(a, b, c, [gcol[k], gcol[k + GN + 1], gcol[k + GN + 2]], up, [uvs[0], uvs[1], uvs[2]])
        ground.tri(a, c, d, [gcol[k], gcol[k + GN + 2], gcol[k + 1]], up, [uvs[0], uvs[2], uvs[3]])
      }
    }
    const groundMesh = new THREE.Mesh(ground.geometry(), this.mats.ground)
    groundMesh.receiveShadow = true
    groundMesh.frustumCulled = false
    scene.add(groundMesh)
    this.groups.ground = groundMesh

    /* ---------- 碎石小径 ---------- */
    const pathB = new Builder()
    for (let i = 0; i < n - 2; i += 2) {
      const a = P[i]
      const b = P[i + 2]
      const dx = b[0] - a[0]
      const dz = b[2] - a[2]
      const l = Math.hypot(dx, dz)
      if (l < 0.05) continue
      // 铺得比轨道宽一点，从上面才看得见这条石板路
      const sx = (-dz / l) * 3.2
      const sz = (dx / l) * 3.2
      const y = 0.04 + (i % 4) * 0.002
      // 注意 quad 的签名是 (a, b, c, d, 颜色, uv)，别把法线当成 uv 传进去
      pathB.quad(
        [a[0] + sx, y, a[2] + sz],
        [b[0] + sx, y, b[2] + sz],
        [b[0] - sx, y, b[2] - sz],
        [a[0] - sx, y, a[2] - sz],
        null,
        [[0, 0], [1, 0], [1, 1], [0, 1]]
      )
    }
    const pathMesh = new THREE.Mesh(pathB.geometry(), this.mats.path)
    pathMesh.receiveShadow = true
    pathMesh.frustumCulled = false
    scene.add(pathMesh)
    this.groups.path = pathMesh

    /* ---------- 树 ---------- */
    const trunkB = new Builder()
    const foliageB = new Builder()
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
      const col = hex(Math.random() < 0.5 ? '#3f7d3a' : '#4f8f45')
      const j = 0.9 + Math.random() * 0.2
      const fc = [col[0] * j, col[1] * j, col[2] * j]
      trunkB.box([x, 0.9, z], [0.22, 0, 0], [0, 0.9, 0], [0, 0, 0.22], null, 1)
      const tip = [x, 1.6 + h, z]
      const S = 7
      for (let k = 0; k < S; k++) {
        const a1 = (k / S) * Math.PI * 2
        const a2 = ((k + 1) / S) * Math.PI * 2
        const p1 = [x + Math.cos(a1) * r, 1.4, z + Math.sin(a1) * r]
        const p2 = [x + Math.cos(a2) * r, 1.4, z + Math.sin(a2) * r]
        const shade = k % 2 ? fc : mul(fc, 0.9)
        foliageB.tri(p1, tip, p2, shade, null, [[0, 0], [0.5, 1], [1, 0]])
      }
    }
    const trunkMesh = new THREE.Mesh(trunkB.geometry(), this.mats.treeTrunk)
    trunkMesh.castShadow = true
    trunkMesh.frustumCulled = false
    scene.add(trunkMesh)
    this.groups.trunks = trunkMesh

    const foliageMesh = new THREE.Mesh(foliageB.geometry(), this.mats.foliage)
    foliageMesh.castShadow = true
    foliageMesh.frustumCulled = false
    scene.add(foliageMesh)
    this.groups.foliage = foliageMesh

    /* ---------- 远山（两层：近处草丘 + 远处雾山） ---------- */
    const mountainB = new Builder()
    // 山脚统一扎到 -40，这样山体把地面边缘完全挡住，水平线上不会有缝
    const addRidge = (radius, hBase, hVar, seed, colHex) => {
      const MS = 72
      const hs = []
      for (let k = 0; k < MS; k++) hs.push(hBase + hVar * Math.abs(Math.sin(k * 0.37 + seed)) + hVar * 0.45 * Math.random())
      const col = hex(colHex)
      for (let k = 0; k < MS; k++) {
        const a1 = (k / MS) * Math.PI * 2
        const a2 = ((k + 1) / MS) * Math.PI * 2
        const b1 = [cx + Math.cos(a1) * radius, -40, cz + Math.sin(a1) * radius]
        const b2 = [cx + Math.cos(a2) * radius, -40, cz + Math.sin(a2) * radius]
        const t1 = [b1[0], hs[k], b1[2]]
        const t2 = [b2[0], hs[(k + 1) % MS], b2[2]]
        mountainB.quad(b1, b2, t2, t1, col, [[0, 0], [1, 0], [1, 1], [0, 1]])
      }
    }
    addRidge(R * 0.72, 8, 18, 0, '#9ec57f') // 近处草地上的小丘
    addRidge(R * 1.12, 22, 34, 2.3, '#8fabc0') // 远处的雾山（正好压在地面边缘上）
    const mountainMesh = new THREE.Mesh(mountainB.geometry(), this.mats.mountain)
    mountainMesh.frustumCulled = false
    scene.add(mountainMesh)
    this.groups.mountains = mountainMesh

    /* ---------- 轨道与组件 ---------- */
    const railB = new Builder()
    const spineB = new Builder()
    const tube = (builder, off, r, sides, uScale) => {
      let prevRing = null
      let prevV = 0
      let dist = 0
      for (let i = 0; i < n; i++) {
        if (i > 0) dist += Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1], P[i][2] - P[i - 1][2])
        const c = add(add(P[i], mul(B[i], off[0])), mul(U[i], off[1]))
        const ring = []
        for (let k = 0; k < sides; k++) {
          const a = (k / sides) * Math.PI * 2
          ring.push(add(c, add(mul(B[i], Math.cos(a) * r), mul(U[i], Math.sin(a) * r))))
        }
        const v = dist / uScale
        if (prevRing) {
          for (let k = 0; k < sides; k++) {
            const k2 = (k + 1) % sides
            const u1 = k / sides
            const u2 = (k + 1) / sides
            builder.quad(prevRing[k], ring[k], ring[k2], prevRing[k2], null, [[u1, prevV], [u1, v], [u2, v], [u2, prevV]])
          }
        }
        prevRing = ring
        prevV = v
      }
    }
    tube(railB, [0.55, 0], 0.085, 6, 6)
    tube(railB, [-0.55, 0], 0.085, 6, 6)
    tube(spineB, [0, -0.38], 0.15, 6, 3)

    /* 枕木 */
    const tieB = new Builder()
    for (let i = 0; i < n; i += 2) {
      tieB.box(sub(P[i], mul(U[i], 0.18)), mul(T[i], 0.07), mul(U[i], 0.085), mul(B[i], 0.56), null, 1)
    }

    /* 站台 + 终点挡板 */
    const platB = new Builder()
    const platPostB = new Builder()
    const platFloorB = new Builder()
    const bufferB = new Builder()
    {
      const p = P[0], t = T[0], u = U[0], b = B[0]
      // 顶棚抬高、收窄一点：不然发车时整个视野上方都是这块黄色
      platB.box(add(p, add(mul(u, 4.8), mul(t, -0.5))), mul(t, 3.4), mul(u, 0.11), mul(b, 1.9), null, 4)
      // 只留车尾那对柱子：前面那对正好戳在第一人称镜头前，变成两根灰斜杠
      for (const [dt, db] of [[-4, -2.2], [-4, 2.2]]) {
        const q = add(p, add(mul(t, dt), mul(b, db)))
        // 柱子要顶到顶棚（顶棚在轨道上方 4.8 米）
        const hy = (q[1] + 4.8) / 2
        platPostB.box([q[0], hy, q[2]], [0.09, 0, 0], [0, hy, 0], [0, 0, 0.09], null, 1)
      }
      // 站台地面挪远一点、压低一点，免得发车时一大块白板挡在画面右下角
      const fl = add(p, add(mul(b, 2.6), mul(u, -0.95)))
      platFloorB.box(fl, mul(t, 3.4), mul(u, 0.12), mul(b, 0.95), null, 4)
      const e = P[n - 1]
      const te = T[n - 1]
      bufferB.box(add(e, mul(te, 0.8)), mul(te, 0.12), mul(U[n - 1], 0.3), mul(B[n - 1], 0.68), null, 1)
    }

    const addMesh = (builder, mat, key, opts = {}) => {
      const m = new THREE.Mesh(builder.geometry(), mat)
      m.frustumCulled = false
      if (opts.cast) m.castShadow = true
      if (opts.recv) m.receiveShadow = true
      scene.add(m)
      this.groups[key] = m
    }

    addMesh(railB, this.mats.rail, 'rails', { cast: true, recv: true })
    addMesh(spineB, this.mats.spine, 'spine', { cast: true })
    addMesh(tieB, this.mats.tie, 'ties', { cast: true, recv: true })
    addMesh(platB, this.mats.platform, 'platform', { cast: true, recv: true })
    addMesh(platPostB, this.mats.platformPost, 'platformPosts', { cast: true })
    addMesh(platFloorB, this.mats.platformFloor, 'platformFloor', { recv: true })
    addMesh(bufferB, this.mats.buffer, 'buffer', { cast: true })

    /* ---------- 支柱 ---------- */
    const postB = new Builder()
    const baseB = new Builder()
    for (let i = 4; i < n - 4; i += 14) {
      const p = sub(P[i], mul(U[i], 0.45))
      if (U[i][1] < 0.55 || p[1] < 1.3) continue
      postB.box([p[0], p[1] / 2, p[2]], [0.17, 0, 0], [0, p[1] / 2, 0], [0, 0, 0.17], null, 1)
      baseB.box([p[0], 0.15, p[2]], [0.5, 0, 0], [0, 0.15, 0], [0, 0, 0.5], null, 1)
    }
    addMesh(postB, this.mats.steel, 'posts', { cast: true })
    addMesh(baseB, this.mats.concrete, 'postBases', { recv: true })

    /* ---------- 车头 ---------- */
    const carBodyB = new Builder()
    const carDarkB = new Builder()
    const carLightB = new Builder()
    carBodyB.box([0, 0.24, 0], [0.64, 0, 0], [0, 0.19, 0], [0, 0, 0.44], null, 1)
    carBodyB.box([0.73, 0.2, 0], [0.13, 0, 0], [0, 0.13, 0], [0, 0, 0.37], null, 1)
    carBodyB.box([0, 0.43, 0.43], [0.64, 0, 0], [0, 0.035, 0], [0, 0, 0.025], null, 1)
    carBodyB.box([0, 0.43, -0.43], [0.64, 0, 0], [0, 0.035, 0], [0, 0, 0.025], null, 1)
    carDarkB.box([0.39, 0.56, 0], [0.025, 0, 0], [0, 0.025, 0], [0, 0, 0.27], null, 1)
    carDarkB.box([0.39, 0.49, 0.26], [0.02, 0, 0], [0, 0.07, 0], [0, 0, 0.02], null, 1)
    carDarkB.box([0.39, 0.49, -0.26], [0.02, 0, 0], [0, 0.07, 0], [0, 0, 0.02], null, 1)
    carLightB.box([0.81, 0.24, 0.24], [0.03, 0, 0], [0, 0.045, 0], [0, 0, 0.065], null, 1)
    carLightB.box([0.81, 0.24, -0.24], [0.03, 0, 0], [0, 0.045, 0], [0, 0, 0.065], null, 1)

    const carGroup = new THREE.Group()
    for (const [bld, mat] of [[carBodyB, this.mats.carBody], [carDarkB, this.mats.carDark], [carLightB, this.mats.carLight]]) {
      const m = new THREE.Mesh(bld.geometry(), mat)
      m.frustumCulled = false
      m.receiveShadow = true
      carGroup.add(m)
    }
    carGroup.frustumCulled = false
    scene.add(carGroup)
    this.car = carGroup
    this.setShow({ rails: true, posts: true })

    // 阴影范围贴着轨道走（铺满整个世界的话 2K 阴影图会糊成一片）
    let yMax = 0
    for (const p of P) yMax = Math.max(yMax, p[1])
    const sd = Math.max(45, Math.max(x1 - x0, z1 - z0, yMax) / 2 + 25)
    this.sun.target.position.set(cx, 0, cz)
    this.sun.target.updateMatrixWorld()
    this.sun.position.set(cx + SUN[0] * 260, SUN[1] * 260, cz + SUN[2] * 260)
    const sc = this.sun.shadow.camera
    sc.left = -sd
    sc.right = sd
    sc.top = sd
    sc.bottom = -sd
    sc.near = 70
    sc.far = 520
    sc.updateProjectionMatrix()
  }

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
    const s = eng.ride ? clamp(eng.ride.s, 0, Math.max(0, len - 1.2)) : 0
    const v = eng.ride ? eng.ride.v : 0
    const c = this.camAt(s)
    const ahead = this.camAt(Math.min(len, s + 2))
    const tt = performance.now() / 1000
    const shake = v > 14 ? Math.min(0.035, (v - 14) * 0.0016) : 0
    const q = eng.ride && eng.mode === 'ride' ? clamp((eng.ride.held - 0.2) / 1.7, 0, 1) : 1
    const k = 1 - q * q * (3 - 2 * q)
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
    for (const key of Object.keys(this.groups)) {
      const obj = this.groups[key]
      if (!obj) continue
      this.scene.remove(obj)
      obj.traverse?.((o) => { o.geometry?.dispose() })
    }
    if (this.car) {
      this.scene.remove(this.car)
      this.car.traverse((o) => o.geometry?.dispose())
    }
    this.groups = {}
    this.car = null
    this.frames = null
    this.track = null
  }

  dispose() {
    this.disposeScene()
    if (this.mats) {
      for (const m of Object.values(this.mats)) {
        m.dispose?.()
        if (m.map) m.map.dispose()
        if (m.normalMap) m.normalMap.dispose()
        if (m.roughnessMap) m.roughnessMap.dispose()
        if (m.metalnessMap) m.metalnessMap.dispose()
      }
      this.mats = null
    }
    if (this.scene?.background?.dispose) this.scene.background.dispose()
    this.scene?.environment?.dispose?.()
    this.renderer?.dispose()
    this.renderer = null
    this.ready = false
  }
}