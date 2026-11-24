/**
 * Sprite stacking — 正交视图来源与投影。
 *
 * 坐标约定：
 *   x → 宽度（左 → 右）
 *   y → 长度（后 → 前，前 = +y）
 *   z → 高度（地面 = 0）
 *
 * 视图约定（与 sprite-stacking 一致）：
 *   TOP   前向朝下
 *   SIDE  前向朝左
 *   FRONT 正视（左右按模型 x 轴排布，保证雕刻一致）
 *   BACK  背视（与 TOP 的 x 轴镜像）
 */

const hex = (h) => parseInt(h.slice(1), 16)

const tint = (c, f) => {
  const r = Math.min(255, Math.max(0, Math.round(((c >> 16) & 255) * f)))
  const g = Math.min(255, Math.max(0, Math.round(((c >> 8) & 255) * f)))
  const b = Math.min(255, Math.max(0, Math.round((c & 255) * f)))
  return (r << 16) | (g << 8) | b
}

function createGrid(W, L, H) {
  return { W, L, H, data: new Int32Array(W * L * H) }
}

function put(g, x, y, z, color) {
  if (x < 0 || y < 0 || z < 0 || x >= g.W || y >= g.L || z >= g.H) return
  g.data[(z * g.L + y) * g.W + x] = color
}

function fillBox(g, x0, x1, y0, y1, z0, z1, color) {
  const minX = Math.max(0, Math.min(x0, x1))
  const maxX = Math.min(g.W - 1, Math.max(x0, x1))
  const minY = Math.max(0, Math.min(y0, y1))
  const maxY = Math.min(g.L - 1, Math.max(y0, y1))
  const minZ = Math.max(0, Math.min(z0, z1))
  const maxZ = Math.min(g.H - 1, Math.max(z0, z1))
  for (let z = minZ; z <= maxZ; z++) {
    for (let y = minY; y <= maxY; y++) {
      for (let x = minX; x <= maxX; x++) g.data[(z * g.L + y) * g.W + x] = color
    }
  }
}

function fillCylinder(g, cx, cy, r, z0, z1, color) {
  const r2 = r * r
  const minZ = Math.max(0, z0)
  const maxZ = Math.min(g.H - 1, z1)
  for (let z = minZ; z <= maxZ; z++) {
    for (let y = 0; y < g.L; y++) {
      const dy = y - cy
      for (let x = 0; x < g.W; x++) {
        const dx = x - cx
        if (dx * dx + dy * dy <= r2) g.data[(z * g.L + y) * g.W + x] = color
      }
    }
  }
}

function fillEllipsoid(g, cx, cy, cz, rx, ry, rz, color) {
  const minX = Math.max(0, Math.floor(cx - rx))
  const maxX = Math.min(g.W - 1, Math.ceil(cx + rx))
  const minY = Math.max(0, Math.floor(cy - ry))
  const maxY = Math.min(g.L - 1, Math.ceil(cy + ry))
  const minZ = Math.max(0, Math.floor(cz - rz))
  const maxZ = Math.min(g.H - 1, Math.ceil(cz + rz))
  for (let z = minZ; z <= maxZ; z++) {
    const nz = (z - cz) / rz
    for (let y = minY; y <= maxY; y++) {
      const ny = (y - cy) / ry
      for (let x = minX; x <= maxX; x++) {
        const nx = (x - cx) / rx
        if (nx * nx + ny * ny + nz * nz <= 1) {
          g.data[(z * g.L + y) * g.W + x] = color
        }
      }
    }
  }
}

/** 给最靠前的表面（max y）上色 */
function paintFront(g, x0, x1, z0, z1, color) {
  for (let z = z0; z <= z1; z++) {
    for (let x = x0; x <= x1; x++) {
      for (let y = g.L - 1; y >= 0; y--) {
        const i = (z * g.L + y) * g.W + x
        if (g.data[i]) {
          g.data[i] = color
          break
        }
      }
    }
  }
}

/** 给最靠后的表面（min y）上色 */
function paintBack(g, x0, x1, z0, z1, color) {
  for (let z = z0; z <= z1; z++) {
    for (let x = x0; x <= x1; x++) {
      for (let y = 0; y < g.L; y++) {
        const i = (z * g.L + y) * g.W + x
        if (g.data[i]) {
          g.data[i] = color
          break
        }
      }
    }
  }
}

/** 给俯视表面（max z）上色 */
function paintTop(g, x, y, color) {
  if (x < 0 || y < 0 || x >= g.W || y >= g.L) return
  for (let z = g.H - 1; z >= 0; z--) {
    const i = (z * g.L + y) * g.W + x
    if (g.data[i]) {
      g.data[i] = color
      break
    }
  }
}

function recolorZ(g, z, color) {
  for (let y = 0; y < g.L; y++) {
    for (let x = 0; x < g.W; x++) {
      const i = (z * g.L + y) * g.W + x
      if (g.data[i]) g.data[i] = color
    }
  }
}

/* ------------------------------------------------------------------ */
/* 预设模型（高精细度重绘）                                              */
/* ------------------------------------------------------------------ */

function buildCar() {
  const g = createGrid(23, 40, 19)
  const C = {
    body: hex('#e05a4f'),
    dark: hex('#9e2d39'),
    light: hex('#f79688'),
    glass: hex('#6fd0f0'),
    glassHi: hex('#bceeff'),
    tyre: hex('#22242d'),
    tyreHi: hex('#373b47'),
    rim: hex('#cfd8e3'),
    rimDark: hex('#7b8794'),
    chrome: hex('#eef3f8'),
    lamp: hex('#ffe48f'),
    tail: hex('#ff5e52'),
    grille: hex('#2c303a'),
  }

  // 底盘与前后保险杠包围
  fillBox(g, 4, 18, 3, 36, 3, 4, C.dark)
  fillBox(g, 3, 19, 2, 37, 4, 5, C.dark)

  // 车身主体与渐进车头/车尾型面
  fillBox(g, 2, 20, 3, 36, 5, 10, C.body)
  fillBox(g, 3, 19, 2, 37, 5, 9, C.body)
  fillBox(g, 4, 18, 2, 37, 10, 10, C.body)

  // 侧裙与腰线高光
  fillBox(g, 2, 2, 7, 32, 5, 5, C.dark)
  fillBox(g, 20, 20, 7, 32, 5, 5, C.dark)
  fillBox(g, 2, 2, 4, 35, 10, 10, C.light)
  fillBox(g, 20, 20, 4, 35, 10, 10, C.light)

  // 前引擎盖与后备箱盖（带阶梯坡度）
  fillBox(g, 3, 19, 26, 36, 11, 11, C.body)
  fillBox(g, 4, 18, 28, 35, 12, 12, C.light)
  fillBox(g, 3, 19, 3, 11, 11, 11, C.body)
  fillBox(g, 4, 18, 4, 10, 12, 12, C.light)

  // 座舱与车顶弧线
  fillBox(g, 3, 19, 11, 25, 11, 15, C.glass)
  fillBox(g, 4, 18, 13, 23, 16, 16, C.body)
  fillBox(g, 5, 17, 14, 22, 17, 17, C.light)

  // A / B / C 柱与车门分缝
  fillBox(g, 2, 20, 11, 12, 11, 15, C.body) // C柱
  fillBox(g, 2, 20, 24, 25, 11, 15, C.body) // A柱
  fillBox(g, 2, 2, 17, 18, 11, 15, C.body)   // 左B柱
  fillBox(g, 20, 20, 17, 18, 11, 15, C.body) // 右B柱

  // 侧窗与玻璃高光
  fillBox(g, 2, 2, 13, 16, 12, 14, C.glass)
  fillBox(g, 20, 20, 13, 16, 12, 14, C.glass)
  fillBox(g, 2, 2, 19, 23, 12, 14, C.glass)
  fillBox(g, 20, 20, 19, 23, 12, 14, C.glass)
  put(g, 2, 21, 14, C.glassHi)
  put(g, 20, 21, 14, C.glassHi)

  // 车门缝隙与门把手
  fillBox(g, 2, 2, 18, 18, 6, 9, C.dark)
  fillBox(g, 20, 20, 18, 18, 6, 9, C.dark)
  put(g, 2, 16, 9, C.chrome)
  put(g, 2, 20, 9, C.chrome)
  put(g, 20, 16, 9, C.chrome)
  put(g, 20, 20, 9, C.chrome)

  // 四个轮拱与精细车轮（轮胎、胎面高光、轮毂、辐条）
  for (const y0 of [5, 25]) {
    for (const sideX of [0, 21]) {
      const rimX = sideX === 0 ? 0 : 22
      const tyreX1 = sideX === 0 ? 2 : 22
      fillBox(g, sideX, tyreX1, y0, y0 + 7, 0, 6, C.tyre)
      // 削去四角让车轮更圆润
      fillBox(g, sideX, tyreX1, y0, y0, 0, 0, 0)
      fillBox(g, sideX, tyreX1, y0 + 7, y0 + 7, 0, 0, 0)
      fillBox(g, sideX, tyreX1, y0, y0, 6, 6, 0)
      fillBox(g, sideX, tyreX1, y0 + 7, y0 + 7, 6, 6, 0)

      // 轮毂与中心螺帽
      fillBox(g, rimX, rimX, y0 + 2, y0 + 5, 2, 4, C.rimDark)
      fillBox(g, rimX, rimX, y0 + 3, y0 + 4, 2, 4, C.rim)
      put(g, rimX, y0 + 3, 3, C.chrome)
      put(g, sideX === 0 ? 2 : 20, y0 + 3, 4, C.tyreHi)
    }
  }

  // 前脸：进气格栅、镀铬饰条、左右大灯
  paintFront(g, 4, 18, 4, 4, C.chrome)
  paintFront(g, 6, 16, 5, 8, C.grille)
  paintFront(g, 7, 15, 7, 7, C.chrome)
  paintFront(g, 4, 7, 7, 9, C.lamp)
  paintFront(g, 15, 18, 7, 9, C.lamp)
  paintFront(g, 4, 5, 9, 9, C.chrome)
  paintFront(g, 17, 18, 9, 9, C.chrome)

  // 车尾：贯穿式尾灯带与双边排气管
  paintBack(g, 4, 7, 7, 9, C.tail)
  paintBack(g, 15, 18, 7, 9, C.tail)
  paintBack(g, 8, 14, 8, 8, C.tail)
  paintBack(g, 5, 6, 3, 3, C.chrome)
  paintBack(g, 16, 17, 3, 3, C.chrome)

  return g
}

function buildRobot() {
  const g = createGrid(21, 17, 37)
  const C = {
    metal: hex('#939dae'),
    metalDark: hex('#5e6775'),
    dark: hex('#343b48'),
    blue: hex('#4b8df8'),
    blueDark: hex('#2e63bd'),
    accent: hex('#ffd166'),
    glow: hex('#7bf1ff'),
    light: hex('#e2eaf3'),
  }

  // 脚部（底板、脚背、金色推进器饰件）
  fillBox(g, 4, 8, 2, 13, 0, 1, C.dark)
  fillBox(g, 12, 16, 2, 13, 0, 1, C.dark)
  fillBox(g, 5, 7, 5, 12, 2, 2, C.metal)
  fillBox(g, 13, 15, 5, 12, 2, 2, C.metal)
  fillBox(g, 5, 7, 11, 13, 1, 2, C.accent)
  fillBox(g, 13, 15, 11, 13, 1, 2, C.accent)

  // 小腿与膝关节装甲
  fillBox(g, 5, 8, 4, 10, 3, 11, C.metal)
  fillBox(g, 12, 15, 4, 10, 3, 11, C.metal)
  fillBox(g, 5, 8, 9, 11, 10, 12, C.blue)
  fillBox(g, 12, 15, 9, 11, 10, 12, C.blue)
  paintFront(g, 5, 8, 4, 9, C.dark)
  paintFront(g, 12, 15, 4, 9, C.dark)

  // 大腿与髋部
  fillBox(g, 5, 8, 5, 9, 12, 14, C.metalDark)
  fillBox(g, 12, 15, 5, 9, 12, 14, C.metalDark)
  fillBox(g, 5, 15, 4, 10, 14, 15, C.dark)

  // 躯干与胸甲分层
  fillBox(g, 5, 15, 4, 10, 16, 25, C.blue)
  fillBox(g, 6, 14, 3, 11, 17, 24, C.blue)
  paintFront(g, 6, 14, 17, 24, C.metal)
  paintFront(g, 7, 13, 19, 23, C.accent)
  paintFront(g, 9, 11, 20, 22, C.glow)
  // 腰部腹部细节
  paintFront(g, 7, 13, 16, 17, C.dark)
  put(g, 8, 11, 16, C.accent)
  put(g, 12, 11, 16, C.accent)

  // 肩甲与双臂（上臂、肘关节、前臂、机械手）
  for (const side of ['L', 'R']) {
    const x0 = side === 'L' ? 1 : 17
    const x1 = side === 'L' ? 3 : 19
    fillBox(g, x0, x1, 4, 9, 22, 25, C.blue)
    fillBox(g, x0, x1, 5, 8, 26, 26, C.light)
    fillBox(g, x0, x1, 5, 8, 17, 21, C.metal)
    fillBox(g, x0, x1, 5, 8, 15, 16, C.dark)
    fillBox(g, x0, x1, 5, 8, 11, 14, C.metalDark)
    fillBox(g, x0, x1, 5, 9, 9, 10, C.accent)
  }

  // 颈部
  fillBox(g, 8, 12, 6, 9, 26, 27, C.dark)

  // 头部与面罩、双目、头冠与天线
  fillBox(g, 6, 14, 5, 10, 28, 34, C.light)
  fillBox(g, 7, 13, 4, 11, 29, 33, C.light)
  // 头冠
  fillBox(g, 9, 11, 5, 10, 34, 34, C.blue)
  put(g, 10, 10, 34, C.accent)
  // 左右耳罩
  fillBox(g, 4, 5, 6, 9, 29, 32, C.blueDark)
  fillBox(g, 15, 16, 6, 9, 29, 32, C.blueDark)
  // 面部护罩与发光眼
  paintFront(g, 7, 13, 29, 32, C.dark)
  paintFront(g, 7, 9, 31, 31, C.glow)
  paintFront(g, 11, 13, 31, 31, C.glow)
  paintFront(g, 9, 11, 29, 29, C.accent)
  // 天线
  fillBox(g, 9, 11, 7, 8, 35, 35, C.dark)
  fillBox(g, 9, 11, 7, 8, 36, 36, C.glow)

  return g
}

function buildRocket() {
  const g = createGrid(21, 21, 39)
  const C = {
    white: hex('#f2f6fa'),
    shade: hex('#cfd8e3'),
    red: hex('#e0463c'),
    redDark: hex('#a82b24'),
    dark: hex('#2b303c'),
    glass: hex('#7ce0ff'),
    glassHi: hex('#d4f5ff'),
    flame: hex('#ff9e2c'),
    flameCore: hex('#fff099'),
  }

  // 主箭体圆柱
  fillCylinder(g, 10, 10, 7.2, 5, 27, C.white)
  // 整流罩锥形鼻锥
  for (let z = 28; z <= 38; z++) {
    const t = (z - 28) / 10
    const r = Math.max(0.7, 6.8 * (1 - t * 0.88))
    fillCylinder(g, 10, 10, r, z, z, z >= 35 ? C.red : C.white)
  }

  // 四向后掠尾翼（外缘带深红强化）
  fillBox(g, 0, 2, 8, 12, 0, 12, C.red)
  fillBox(g, 1, 3, 9, 11, 11, 14, C.red)
  fillBox(g, 0, 0, 8, 12, 0, 12, C.redDark)

  fillBox(g, 18, 20, 8, 12, 0, 12, C.red)
  fillBox(g, 17, 19, 9, 11, 11, 14, C.red)
  fillBox(g, 20, 20, 8, 12, 0, 12, C.redDark)

  fillBox(g, 8, 12, 0, 2, 0, 12, C.red)
  fillBox(g, 9, 11, 1, 3, 11, 14, C.red)
  fillBox(g, 8, 12, 0, 0, 0, 12, C.redDark)

  fillBox(g, 8, 12, 18, 20, 0, 12, C.red)
  fillBox(g, 9, 11, 17, 19, 11, 14, C.red)
  fillBox(g, 8, 12, 20, 20, 0, 12, C.redDark)

  // 引擎喷管与尾焰
  fillCylinder(g, 10, 10, 4.4, 2, 4, C.dark)
  fillCylinder(g, 10, 10, 3.2, 0, 1, C.flame)
  fillCylinder(g, 10, 10, 1.8, 0, 1, C.flameCore)

  // 装饰环带与纵向筋条
  recolorZ(g, 10, C.red)
  recolorZ(g, 11, C.redDark)
  recolorZ(g, 25, C.red)
  recolorZ(g, 26, C.redDark)
  fillBox(g, 10, 10, 2, 2, 6, 24, C.shade)
  fillBox(g, 10, 10, 18, 18, 6, 24, C.shade)

  // 圆框舷窗
  paintFront(g, 8, 12, 18, 22, C.glass)
  paintFront(g, 9, 11, 19, 21, C.glassHi)
  paintFront(g, 8, 12, 17, 17, C.dark)
  paintFront(g, 8, 12, 23, 23, C.dark)
  paintFront(g, 7, 7, 18, 22, C.dark)
  paintFront(g, 13, 13, 18, 22, C.dark)

  return g
}

function buildMushroom() {
  const g = createGrid(29, 29, 30)
  const C = {
    stem: hex('#f7e8c8'),
    stemShade: hex('#d8be92'),
    cap: hex('#e34f4f'),
    capLight: hex('#f27972'),
    capDark: hex('#a82f35'),
    spot: hex('#fff7e8'),
    wood: hex('#8a5838'),
    woodDark: hex('#5e3a22'),
    glass: hex('#7ce0ff'),
    glassHi: hex('#d4f5ff'),
    chimney: hex('#b7c2cf'),
    accent: hex('#ffd166'),
    grass: hex('#6fbf73'),
  }

  // 基座草坪与菌柄
  fillCylinder(g, 14, 14, 8.2, 0, 0, C.grass)
  fillCylinder(g, 14, 14, 6.6, 1, 12, C.stem)
  fillCylinder(g, 14, 14, 7.2, 1, 2, C.stemShade)

  // 饱满菌盖分层
  const layers = [
    { r: 8.4, z: 13, c: C.capDark },
    { r: 10.6, z: 14, c: C.cap },
    { r: 12.4, z: 15, c: C.cap },
    { r: 13.4, z: 16, c: C.cap },
    { r: 13.4, z: 17, c: C.capLight },
    { r: 12.2, z: 18, c: C.capLight },
    { r: 10.2, z: 19, c: C.capLight },
    { r: 7.4, z: 20, c: C.capLight },
    { r: 4.2, z: 21, c: C.capLight },
  ]
  for (const { r, z, c } of layers) {
    fillCylinder(g, 14, 14, r, z, z, c)
  }

  // 菌盖斑点（覆盖顶部与侧缘）
  const spots = [
    [7, 7, 3.2],
    [20, 8, 3.5],
    [9, 20, 3.2],
    [21, 19, 2.8],
    [14, 14, 3.8],
    [24, 14, 2.4],
    [5, 15, 2.4],
  ]
  for (const [sx, sy, r] of spots) {
    for (let y = 0; y < g.L; y++) {
      for (let x = 0; x < g.W; x++) {
        if ((x - sx) ** 2 + (y - sy) ** 2 <= r * r) paintTop(g, x, y, C.spot)
      }
    }
  }

  // 拱形木门、门框与门把手
  paintFront(g, 11, 16, 1, 7, C.wood)
  paintFront(g, 12, 15, 8, 8, C.wood)
  paintFront(g, 10, 10, 1, 7, C.woodDark)
  paintFront(g, 17, 17, 1, 7, C.woodDark)
  paintFront(g, 15, 15, 4, 4, C.accent)

  // 窗台与玻璃窗
  paintFront(g, 19, 22, 5, 9, C.woodDark)
  paintFront(g, 20, 21, 6, 8, C.glass)
  put(g, 20, 28, 8, C.glassHi)
  paintFront(g, 19, 22, 4, 4, C.wood)

  // 石砖烟囱与帽檐
  fillBox(g, 18, 21, 7, 10, 21, 26, C.chimney)
  fillBox(g, 17, 22, 6, 11, 27, 27, C.capDark)
  put(g, 19, 10, 23, C.stemShade)
  put(g, 21, 8, 25, C.stemShade)

  return g
}

function buildRandom() {
  const g = createGrid(23, 23, 32)
  const palettes = [
    { base: '#555f6e', a: '#e05a4f', b: '#f5a25d', c: '#ffe083', glow: '#7bf1ff' },
    { base: '#42566b', a: '#4f8ef7', b: '#7bf1ff', c: '#e2eaf3', glow: '#ffe083' },
    { base: '#635344', a: '#6fbf73', b: '#a8e6a3', c: '#f7e8c8', glow: '#ffd166' },
    { base: '#554566', a: '#b06ae0', b: '#f39fdc', c: '#ffe0f4', glow: '#7bf1ff' },
  ]
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)]
  const set = pick(palettes)
  const base = hex(set.base)
  const colors = [hex(set.a), hex(set.b), hex(set.c)]
  const glow = hex(set.glow)

  // 基座底座与阶梯台
  fillCylinder(g, 11, 11, 9.5, 0, 2, base)
  fillCylinder(g, 11, 11, 8.0, 3, 4, tint(base, 1.15))

  let z = 5
  let half = 7
  const steps = 4 + Math.floor(Math.random() * 2)
  for (let i = 0; i < steps && z < g.H - 5; i++) {
    const h = 3 + Math.floor(Math.random() * 3)
    const color = colors[i % colors.length]
    fillBox(g, 11 - half, 11 + half, 11 - half, 11 + half, z, z + h - 1, color)
    // 顶部边缘高光
    fillBox(g, 11 - half, 11 + half, 11 - half, 11 - half, z + h - 1, z + h - 1, tint(color, 1.2))

    if (Math.random() < 0.65) {
      const bx = 11 + half + 1
      const wingColor = colors[(i + 1) % colors.length]
      fillBox(g, bx, bx, 8, 14, z, z + 1, wingColor)
      fillBox(g, 22 - bx, 22 - bx, 8, 14, z, z + 1, wingColor)
      put(g, bx, 11, z + 1, glow)
      put(g, 22 - bx, 11, z + 1, glow)
    }

    z += h
    half = Math.max(3, half - 1)
  }

  // 顶部塔楼与发光核心
  fillBox(g, 8, 14, 8, 14, z, Math.min(g.H - 3, z + 3), colors[2])
  fillBox(g, 10, 12, 10, 12, Math.min(g.H - 2, z + 4), Math.min(g.H - 1, z + 6), colors[0])
  paintFront(g, 9, 13, 6, 8, glow)
  paintFront(g, 9, 13, 14, 16, glow)

  return g
}

export const PRESET_KEYS = ['car', 'robot', 'rocket', 'mushroom']

export const PRESETS = {
  car: { round: false, build: buildCar },
  robot: { round: false, build: buildRobot },
  rocket: { round: false, build: buildRocket },
  mushroom: { round: true, build: buildMushroom },
}

export function buildPreset(key) {
  const preset = PRESETS[key] || PRESETS.car
  return preset.build()
}

export function presetRound(key) {
  return PRESETS[key]?.round ?? false
}

export function buildRandomModel() {
  return buildRandom()
}

/* ------------------------------------------------------------------ */
/* 投影                                                                 */
/* ------------------------------------------------------------------ */

export function projectViews(g) {
  const { W, L, H, data } = g
  const top = new Int32Array(W * L)
  const side = new Int32Array(L * H)
  const front = new Int32Array(W * H)
  const back = new Int32Array(W * H)

  for (let y = 0; y < L; y++) {
    for (let x = 0; x < W; x++) {
      for (let z = H - 1; z >= 0; z--) {
        const c = data[(z * L + y) * W + x]
        if (c) {
          top[y * W + x] = c
          break
        }
      }
    }
  }

  for (let z = 0; z < H; z++) {
    const row = H - 1 - z
    for (let y = 0; y < L; y++) {
      for (let x = 0; x < W; x++) {
        const c = data[(z * L + y) * W + x]
        if (c) {
          // 侧视：从 -x 看，前(+y)在画面左侧
          side[row * L + (L - 1 - y)] = c
          break
        }
      }
    }
    for (let x = 0; x < W; x++) {
      for (let y = L - 1; y >= 0; y--) {
        const c = data[(z * L + y) * W + x]
        if (c) {
          front[row * W + x] = c
          break
        }
      }
      for (let y = 0; y < L; y++) {
        const c = data[(z * L + y) * W + x]
        if (c) {
          back[row * W + (W - 1 - x)] = c
          break
        }
      }
    }
  }

  // 简单的方向光：不同朝向的视图降低亮度，雕刻后的模型自带明暗面
  tintView(side, 0.9)
  tintView(front, 0.82)
  tintView(back, 0.72)

  return { W, L, H, top, side, front, back }
}

function tintView(arr, f) {
  for (let i = 0; i < arr.length; i++) {
    if (arr[i]) arr[i] = tint(arr[i], f)
  }
}

/* ------------------------------------------------------------------ */
/* 重采样                                                               */
/* ------------------------------------------------------------------ */

function scaleGrid(src, sw, sh, dw, dh) {
  const out = new Int32Array(dw * dh)
  for (let y = 0; y < dh; y++) {
    const sy = Math.min(sh - 1, Math.floor((y * sh) / dh))
    for (let x = 0; x < dw; x++) {
      const sx = Math.min(sw - 1, Math.floor((x * sw) / dw))
      out[y * dw + x] = src[sy * sw + sx]
    }
  }
  return out
}

export function resampleViews(views, targetH) {
  const H = Math.max(4, Math.round(targetH))
  if (H === views.H) return views
  const s = H / views.H
  const L = Math.max(4, Math.round(views.L * s))
  const W = Math.max(4, Math.round(views.W * s))
  return {
    W,
    L,
    H,
    top: scaleGrid(views.top, views.W, views.L, W, L),
    side: scaleGrid(views.side, views.L, views.H, L, H),
    front: scaleGrid(views.front, views.W, views.H, W, H),
    back: scaleGrid(views.back, views.W, views.H, W, H),
  }
}

export function countPalette(views) {
  const set = new Set()
  for (const arr of [views.top, views.side, views.front, views.back]) {
    for (let i = 0; i < arr.length; i++) if (arr[i]) set.add(arr[i])
  }
  return set.size
}