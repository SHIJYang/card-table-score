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
  const r = Math.min(255, Math.round(((c >> 16) & 255) * f))
  const g = Math.min(255, Math.round(((c >> 8) & 255) * f))
  const b = Math.min(255, Math.round((c & 255) * f))
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
  for (let z = z0; z <= z1; z++) {
    for (let y = y0; y <= y1; y++) {
      for (let x = x0; x <= x1; x++) put(g, x, y, z, color)
    }
  }
}

function fillCylinder(g, cx, cy, r, z0, z1, color) {
  const r2 = r * r
  for (let z = z0; z <= z1; z++) {
    for (let y = 0; y < g.L; y++) {
      for (let x = 0; x < g.W; x++) {
        const dx = x - cx
        const dy = y - cy
        if (dx * dx + dy * dy <= r2) put(g, x, y, z, color)
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
/* 预设模型                                                             */
/* ------------------------------------------------------------------ */

function buildCar() {
  const g = createGrid(15, 26, 13)
  const C = {
    body: hex('#e05a4f'),
    dark: hex('#a8333f'),
    light: hex('#f58b7c'),
    glass: hex('#6fc8e8'),
    tyre: hex('#24252e'),
    rim: hex('#c8d2dc'),
    chrome: hex('#e8edf2'),
    lamp: hex('#ffe083'),
    tail: hex('#ff6b5e'),
  }

  // 底盘
  fillBox(g, 2, 12, 2, 23, 2, 3, C.dark)
  // 车身
  fillBox(g, 1, 13, 2, 23, 3, 7, C.body)
  // 侧腰线
  fillBox(g, 1, 1, 3, 22, 7, 7, C.light)
  fillBox(g, 13, 13, 3, 22, 7, 7, C.light)
  // 引擎盖 / 后备箱
  fillBox(g, 2, 12, 17, 23, 8, 8, C.light)
  fillBox(g, 2, 12, 2, 6, 8, 8, C.light)
  // 座舱
  fillBox(g, 1, 13, 7, 16, 8, 10, C.glass)
  fillBox(g, 1, 13, 7, 16, 11, 11, C.body)
  // A / C 柱
  fillBox(g, 1, 13, 7, 7, 8, 11, C.body)
  fillBox(g, 1, 13, 16, 16, 8, 11, C.body)
  // 车顶
  fillBox(g, 3, 11, 9, 14, 11, 11, C.light)
  // 侧面车窗
  fillBox(g, 1, 1, 8, 15, 9, 10, C.glass)
  fillBox(g, 13, 13, 8, 15, 9, 10, C.glass)
  // 车门缝隙
  fillBox(g, 1, 1, 11, 11, 4, 6, C.dark)
  fillBox(g, 13, 13, 11, 11, 4, 6, C.dark)

  // 车轮
  for (const y of [3, 16]) {
    fillBox(g, 0, 1, y, y + 4, 0, 4, C.tyre)
    fillBox(g, 13, 14, y, y + 4, 0, 4, C.tyre)
    fillBox(g, 0, 0, y + 1, y + 3, 1, 3, C.rim)
    fillBox(g, 14, 14, y + 1, y + 3, 1, 3, C.rim)
  }

  // 前脸
  paintFront(g, 2, 12, 3, 3, C.chrome)
  paintFront(g, 3, 4, 5, 6, C.lamp)
  paintFront(g, 10, 11, 5, 6, C.lamp)
  paintFront(g, 5, 9, 4, 5, C.dark)
  // 尾灯
  paintBack(g, 3, 4, 5, 6, C.tail)
  paintBack(g, 10, 11, 5, 6, C.tail)

  return g
}

function buildRobot() {
  const g = createGrid(13, 11, 25)
  const C = {
    metal: hex('#8a94a6'),
    dark: hex('#3b4252'),
    blue: hex('#4f8ef7'),
    accent: hex('#ffd166'),
    glow: hex('#7bf1ff'),
    light: hex('#d8e2ee'),
  }

  // 脚
  fillBox(g, 3, 5, 2, 8, 0, 1, C.dark)
  fillBox(g, 7, 9, 2, 8, 0, 1, C.dark)
  fillBox(g, 3, 5, 7, 8, 1, 1, C.accent)
  fillBox(g, 7, 9, 7, 8, 1, 1, C.accent)
  // 腿
  fillBox(g, 4, 5, 3, 6, 2, 7, C.metal)
  fillBox(g, 7, 8, 3, 6, 2, 7, C.metal)
  paintFront(g, 4, 5, 3, 6, C.dark)
  paintFront(g, 7, 8, 3, 6, C.dark)
  // 胯
  fillBox(g, 3, 9, 3, 6, 8, 9, C.dark)
  // 躯干
  fillBox(g, 3, 9, 2, 6, 9, 16, C.blue)
  paintFront(g, 4, 8, 11, 15, C.metal)
  paintFront(g, 5, 7, 12, 14, C.accent)
  paintFront(g, 6, 6, 13, 13, C.glow)
  // 手臂
  fillBox(g, 1, 2, 3, 5, 8, 14, C.metal)
  fillBox(g, 10, 11, 3, 5, 8, 14, C.metal)
  fillBox(g, 1, 2, 3, 5, 15, 16, C.blue)
  fillBox(g, 10, 11, 3, 5, 15, 16, C.blue)
  fillBox(g, 1, 2, 3, 5, 7, 7, C.accent)
  fillBox(g, 10, 11, 3, 5, 7, 7, C.accent)
  // 肩 / 颈
  fillBox(g, 4, 8, 3, 5, 16, 16, C.dark)
  fillBox(g, 5, 7, 4, 5, 17, 17, C.dark)
  // 头
  fillBox(g, 4, 8, 3, 6, 18, 22, C.light)
  paintFront(g, 5, 7, 19, 21, C.dark)
  paintFront(g, 5, 5, 20, 20, C.glow)
  paintFront(g, 7, 7, 20, 20, C.glow)
  fillBox(g, 3, 3, 4, 5, 19, 21, C.blue)
  fillBox(g, 9, 9, 4, 5, 19, 21, C.blue)
  // 天线
  fillBox(g, 6, 7, 4, 5, 23, 23, C.dark)
  fillBox(g, 6, 7, 4, 5, 24, 24, C.glow)

  return g
}

function buildRocket() {
  const g = createGrid(13, 13, 26)
  const C = {
    white: hex('#eef2f7'),
    red: hex('#e2483f'),
    dark: hex('#2c313d'),
    glass: hex('#7fdcff'),
    flame: hex('#ffb347'),
  }

  fillCylinder(g, 6, 6, 4.7, 3, 18, C.white)
  for (let z = 19; z <= 25; z++) {
    const r = Math.max(0.6, 4.2 * (1 - (z - 19) / 7))
    fillCylinder(g, 6, 6, r, z, z, z >= 23 ? C.red : C.white)
  }
  // 尾翼
  fillBox(g, 0, 1, 5, 7, 0, 8, C.red)
  fillBox(g, 11, 12, 5, 7, 0, 8, C.red)
  fillBox(g, 5, 7, 0, 1, 0, 8, C.red)
  fillBox(g, 5, 7, 11, 12, 0, 8, C.red)
  // 引擎与火焰
  fillBox(g, 4, 8, 4, 8, 0, 2, C.dark)
  fillBox(g, 5, 7, 5, 7, 0, 0, C.flame)
  // 环带
  recolorZ(g, 7, C.red)
  recolorZ(g, 17, C.red)
  // 舷窗
  paintFront(g, 5, 7, 12, 15, C.glass)
  paintFront(g, 5, 5, 11, 16, C.dark)
  paintFront(g, 7, 7, 11, 16, C.dark)
  paintFront(g, 6, 6, 11, 11, C.dark)
  paintFront(g, 6, 6, 16, 16, C.dark)

  return g
}

function buildMushroom() {
  const g = createGrid(19, 19, 20)
  const C = {
    stem: hex('#f4e5c1'),
    stemShade: hex('#d9c39a'),
    cap: hex('#e05252'),
    capDark: hex('#b03838'),
    spot: hex('#fbf3e4'),
    wood: hex('#8a5a3b'),
    glass: hex('#79d4f2'),
    chimney: hex('#b9c3cf'),
    accent: hex('#ffd166'),
  }

  // 菌柄
  fillCylinder(g, 9, 9, 4.4, 0, 8, C.stem)
  // 菌盖
  const radii = [5.5, 7, 8.2, 8.8, 8.8, 8, 6.5, 4.5, 2.5]
  radii.forEach((r, i) => fillCylinder(g, 9, 9, r, 9 + i, 9 + i, C.cap))
  fillCylinder(g, 9, 9, 8.8, 9, 9, C.capDark)

  // 菌盖上的白点
  const spots = [
    [4, 4, 2.2],
    [13, 5, 2.4],
    [6, 13, 2.2],
    [14, 12, 1.8],
    [9, 9, 2.6],
    [16, 9, 1.5],
  ]
  for (const [sx, sy, r] of spots) {
    for (let y = 0; y < g.L; y++) {
      for (let x = 0; x < g.W; x++) {
        if ((x - sx) ** 2 + (y - sy) ** 2 <= r * r) paintTop(g, x, y, C.spot)
      }
    }
  }

  // 门与窗
  paintFront(g, 7, 10, 0, 4, C.wood)
  paintFront(g, 8, 9, 5, 5, C.wood)
  paintFront(g, 10, 10, 2, 2, C.accent)
  paintFront(g, 12, 14, 3, 6, C.wood)
  paintFront(g, 13, 13, 4, 5, C.glass)

  // 烟囱
  fillBox(g, 12, 14, 5, 7, 15, 17, C.chimney)
  fillBox(g, 12, 14, 5, 7, 18, 18, C.capDark)

  return g
}

function buildRandom() {
  const g = createGrid(15, 15, 22)
  const palettes = [
    { base: '#5b6472', a: '#e05a4f', b: '#f5a25d', c: '#ffe083', glow: '#7bf1ff' },
    { base: '#465a6e', a: '#4f8ef7', b: '#7bf1ff', c: '#d8e2ee', glow: '#ffe083' },
    { base: '#6b5a4a', a: '#6fbf73', b: '#a8e6a3', c: '#f4e5c1', glow: '#ffd166' },
    { base: '#5a4a6b', a: '#b06ae0', b: '#f39fdc', c: '#ffe0f4', glow: '#7bf1ff' },
  ]
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)]
  const set = pick(palettes)
  const base = hex(set.base)
  const colors = [hex(set.a), hex(set.b), hex(set.c)]

  fillCylinder(g, 7, 7, 6, 0, 2, base)

  let z = 3
  let half = 5
  const steps = 3 + Math.floor(Math.random() * 3)
  for (let i = 0; i < steps && z < g.H - 3; i++) {
    const h = 2 + Math.floor(Math.random() * 4)
    const color = colors[i % colors.length]
    fillBox(g, 7 - half, 7 + half, 7 - half, 7 + half, z, z + h - 1, color)

    if (Math.random() < 0.55) {
      const bx = 7 + half + 1
      fillBox(g, bx, bx, 5, 9, z, z + 1, colors[(i + 1) % colors.length])
      fillBox(g, 14 - bx, 14 - bx, 5, 9, z, z + 1, colors[(i + 1) % colors.length])
    }
    z += h
    half = Math.max(2, half - 1)
  }

  fillBox(g, 5, 9, 5, 9, z, Math.min(g.H - 1, z + 2), colors[2])
  paintFront(g, 6, 8, 4, 5, hex(set.glow))
  paintFront(g, 6, 8, 10, 11, hex(set.glow))
  fillBox(g, 6, 7, 6, 7, Math.min(g.H - 1, z + 3), Math.min(g.H - 1, z + 3), colors[0])

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
