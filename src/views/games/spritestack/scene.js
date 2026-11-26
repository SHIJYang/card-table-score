/**
 * 立体场景（霓虹街道 / 草甸岛）的像素道具。
 * 道具用 1 美术像素为单位的矩形拼出，按深度排序，分「主角背后 / 主角前面」两层绘制。
 */

const lerp = (a, b, t) => a + (b - a) * t

const mix = (a, b, t) => [
  a[0] + (b[0] - a[0]) * t,
  a[1] + (b[1] - a[1]) * t,
  a[2] + (b[2] - a[2]) * t,
]

const rgb = (c) => `rgb(${Math.round(c[0])}, ${Math.round(c[1])}, ${Math.round(c[2])})`
const rgba = (c, a) => `rgba(${Math.round(c[0])}, ${Math.round(c[1])}, ${Math.round(c[2])}, ${a})`

function makeColors(theme) {
  const n = theme.nightW
  const s = theme.sunsetW
  return {
    pole: rgb(mix(mix([70, 78, 92], [120, 84, 82], s), [26, 32, 48], n)),
    metal: rgb(mix(mix([138, 150, 168], [196, 148, 120], s), [52, 62, 84], n)),
    trunk: rgb(mix(mix([96, 70, 52], [112, 72, 52], s), [40, 32, 30], n)),
    pine: rgb(mix(mix([54, 122, 78], [96, 118, 70], s), [22, 46, 40], n)),
    pineDark: rgb(mix(mix([38, 92, 62], [72, 88, 54], s), [16, 34, 30], n)),
    rock: rgb(mix(mix([136, 140, 148], [160, 132, 118], s), [58, 62, 76], n)),
    kiosk: rgb(mix(mix([214, 196, 168], [226, 170, 132], s), [58, 58, 78], n)),
    roof: rgb(mix(mix([196, 84, 84], [212, 104, 76], s), [58, 36, 48], n)),
    neon: rgb(mix([255, 96, 170], [255, 150, 96], n > 0.4 ? 0.15 : 0.45)),
    warm: rgb(mix([255, 226, 150], [255, 196, 110], n > 0.4 ? 0.85 : 0.1)),
    snow: rgb(mix([248, 250, 255], [240, 246, 255], n * 0.4)),
  }
}

const PROPS = {
  street: [
    { key: 'lamp', x: -36, y: -18 },
    { key: 'kiosk', x: 30, y: -22 },
    { key: 'lamp', x: 38, y: 12 },
    { key: 'bollard', x: -18, y: 12 },
    { key: 'bollard', x: 16, y: 14 },
  ],
  meadow: [
    { key: 'pine', x: -32, y: -24 },
    { key: 'pine', x: 28, y: -20 },
    { key: 'pine', x: -6, y: -36 },
    { key: 'rock', x: -18, y: 12 },
    { key: 'meadowLamp', x: 30, y: 14 },
  ],
}

function drawLamp(ctx, s, ox, oy, c, glow) {
  const r = (x, y, w, h, col) => {
    ctx.fillStyle = col
    ctx.fillRect(Math.round(ox + x * s), Math.round(oy + y * s), Math.max(1, Math.round(w * s)), Math.max(1, Math.round(h * s)))
  }
  r(-1, -28, 2, 28, c.pole)
  r(-4, -2, 8, 2, c.metal)
  r(-4, -32, 9, 5, c.metal)
  r(-3, -31, 7, 3, glow > 0.05 ? c.neon : c.metal)
  if (glow > 0.05) r(-2, -30, 5, 1, c.warm)
}

function drawBollard(ctx, s, ox, oy, c) {
  const r = (x, y, w, h, col) => {
    ctx.fillStyle = col
    ctx.fillRect(Math.round(ox + x * s), Math.round(oy + y * s), Math.max(1, Math.round(w * s)), Math.max(1, Math.round(h * s)))
  }
  r(-2, -7, 4, 7, c.metal)
  r(-2, -8, 4, 2, c.pole)
}

function drawKiosk(ctx, s, ox, oy, c, glow, snow) {
  const r = (x, y, w, h, col) => {
    ctx.fillStyle = col
    ctx.fillRect(Math.round(ox + x * s), Math.round(oy + y * s), Math.max(1, Math.round(w * s)), Math.max(1, Math.round(h * s)))
  }
  r(-10, -16, 20, 16, c.kiosk)
  r(-12, -21, 24, 5, c.roof)
  r(-9, -20, 7, 4, c.warm)
  r(2, -20, 7, 4, c.neon)
  // 橱窗
  r(-7, -12, 14, 8, glow > 0.05 ? c.warm : c.metal)
  r(-1, -12, 2, 8, c.kiosk)
  if (snow > 0.4) r(-12, -23, 24, 2, c.snow)
}

function drawPine(ctx, s, ox, oy, c, snow) {
  const r = (x, y, w, h, col) => {
    ctx.fillStyle = col
    ctx.fillRect(Math.round(ox + x * s), Math.round(oy + y * s), Math.max(1, Math.round(w * s)), Math.max(1, Math.round(h * s)))
  }
  r(-1, -5, 3, 5, c.trunk)
  r(-8, -10, 17, 6, c.pineDark)
  r(-6, -16, 13, 6, c.pine)
  r(-4, -21, 9, 5, c.pine)
  r(-1, -25, 3, 4, c.pine)
  if (snow > 0.3) {
    r(-7, -11, 15, 1, c.snow)
    r(-5, -17, 11, 1, c.snow)
    r(-3, -22, 7, 1, c.snow)
    r(-1, -26, 3, 1, c.snow)
  }
}

function drawRock(ctx, s, ox, oy, c, snow) {
  const r = (x, y, w, h, col) => {
    ctx.fillStyle = col
    ctx.fillRect(Math.round(ox + x * s), Math.round(oy + y * s), Math.max(1, Math.round(w * s)), Math.max(1, Math.round(h * s)))
  }
  r(-6, -7, 12, 7, c.rock)
  r(-4, -9, 8, 3, c.rock)
  r(-7, -3, 14, 3, c.rock)
  if (snow > 0.3) r(-4, -10, 8, 1, c.snow)
}

function drawMeadowLamp(ctx, s, ox, oy, c, glow) {
  const r = (x, y, w, h, col) => {
    ctx.fillStyle = col
    ctx.fillRect(Math.round(ox + x * s), Math.round(oy + y * s), Math.max(1, Math.round(w * s)), Math.max(1, Math.round(h * s)))
  }
  r(-1, -18, 2, 18, c.pole)
  r(-3, -22, 7, 4, c.metal)
  r(-2, -21, 5, 2, glow > 0.05 ? c.warm : c.metal)
}

const DRAWERS = {
  lamp: drawLamp,
  bollard: drawBollard,
  kiosk: drawKiosk,
  pine: drawPine,
  rock: drawRock,
  meadowLamp: drawMeadowLamp,
}

/**
 * 立体场景的像素底座：椭圆平台 + 厚度侧壁 + 棋盘纹理。
 */
export function drawScenePlatform(target, opts) {
  const { scene = 'street', theme, scale, cx, cy, rx, ry, snowCover = 0, wetness = 0 } = opts
  const night = theme.nightW
  const sunset = theme.sunsetW
  const mixC = (a, b, c) => [lerp(lerp(a[0], b[0], sunset), c[0], night), lerp(lerp(a[1], b[1], sunset), c[1], night), lerp(lerp(a[2], b[2], sunset), c[2], night)]

  let top =
    scene === 'meadow'
      ? mixC([104, 160, 96], [124, 128, 76], [34, 54, 48])
      : mixC([72, 78, 92], [82, 72, 78], [26, 30, 44])
  if (wetness > 0.05) top = top.map((v, i) => v * (1 - wetness * (i === 2 ? 0.16 : 0.28)))
  if (snowCover > 0.05) top = top.map((v, i) => lerp(v, [238, 244, 252][i], snowCover * 0.62))
  const edge = top.map((v) => v * 0.6)
  const thickness = Math.max(2, Math.round(7 * scale))

  // 侧壁厚度
  target.fillStyle = rgb(edge)
  target.beginPath()
  target.ellipse(cx, cy + thickness, rx, ry, 0, 0, Math.PI * 2)
  target.fill()

  // 平台顶面
  target.fillStyle = rgb(top)
  target.beginPath()
  target.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2)
  target.fill()

  target.save()
  target.beginPath()
  target.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2)
  target.clip()

  // 棋盘像素纹理
  const cell = Math.max(4, Math.round(5 * scale))
  target.fillStyle = 'rgba(255, 255, 255, 0.045)'
  for (let y = cy - ry; y < cy + ry; y += cell) {
    for (let x = cx - rx; x < cx + rx; x += cell) {
      const gx = Math.floor((x - cx) / cell)
      const gy = Math.floor((y - cy) / cell)
      if (((gx + gy) & 1) === 0) target.fillRect(Math.round(x), Math.round(y), cell, cell)
    }
  }

  // 雨天湿面反光 / 积雪覆盖
  if (wetness > 0.05) {
    target.fillStyle = `rgba(190, 214, 255, ${(wetness * 0.14).toFixed(2)})`
    const band = Math.max(6, Math.round(10 * scale))
    for (let y = cy - ry; y < cy + ry; y += band * 2) {
      target.fillRect(Math.round(cx - rx), Math.round(y), Math.round(rx * 2), band)
    }
  }
  if (snowCover > 0.2) {
    const step = Math.max(8, Math.round(9 * scale))
    target.fillStyle = `rgba(248, 251, 255, ${Math.min(0.85, snowCover).toFixed(2)})`
    for (let y = cy - ry; y < cy + ry; y += step) {
      for (let x = cx - rx; x < cx + rx; x += step) {
        const gx = Math.round(x / step)
        const gy = Math.round(y / step)
        if (((gx * 11 + gy * 17) & 3) !== 0) continue
        target.fillRect(
          Math.round(x),
          Math.round(y),
          Math.max(2, Math.round(3 * scale)),
          Math.max(2, Math.round(2 * scale))
        )
      }
    }
  }

  if (scene === 'street') {
    // 中央虚线车道
    const dash = 9 * scale
    const gap = 7 * scale
    const h = Math.max(2, Math.round(2 * scale))
    target.fillStyle = night > 0.45 ? 'rgba(255, 224, 120, 0.55)' : 'rgba(255, 244, 190, 0.62)'
    for (let x = cx - rx; x < cx + rx; x += dash + gap) {
      target.fillRect(Math.round(x), Math.round(cy - h / 2), Math.round(dash), h)
    }
  } else {
    // 草丛点缀（确定性分布）
    const step = Math.max(10, Math.round(12 * scale))
    target.fillStyle = night > 0.45 ? 'rgba(40, 74, 66, 0.55)' : 'rgba(46, 108, 58, 0.5)'
    for (let y = cy - ry; y < cy + ry; y += step) {
      for (let x = cx - rx; x < cx + rx; x += step) {
        const gx = Math.round(x / step)
        const gy = Math.round(y / step)
        if (((gx * 7 + gy * 13) & 3) !== 0) continue
        target.fillRect(Math.round(x + ((gx * 5) % step)), Math.round(y + ((gy * 3) % step)), Math.max(2, Math.round(2 * scale)), Math.max(2, Math.round(2 * scale)))
      }
    }
  }
  target.restore()

  // 边缘高光
  target.strokeStyle = night > 0.45 ? 'rgba(150, 180, 230, 0.18)' : 'rgba(255, 255, 255, 0.22)'
  target.lineWidth = Math.max(1, Math.round(scale * 0.6))
  target.beginPath()
  target.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2)
  target.stroke()
}

/**
 * 绘制单个像素道具，基点为 (ox, oy) 的地面接触点。
 */
export function drawSceneProp(target, opts) {
  const { key, scale, ox, oy, theme, squash = 0.75, snowCover = 0 } = opts
  const c = makeColors(theme)
  const glow = theme.emisGlow ?? 0
  const s = scale

  // 地面接触阴影
  target.fillStyle = rgba([20, 24, 34], 0.16 + theme.nightW * 0.12)
  target.beginPath()
  target.ellipse(ox, oy + 1, 10 * s, 3.6 * s * Math.max(0.5, squash), 0, 0, Math.PI * 2)
  target.fill()

  // 夜间灯光在地面的光晕
  if (glow > 0.05 && (key === 'lamp' || key === 'meadowLamp' || key === 'kiosk')) {
    target.fillStyle = rgba([255, 214, 140], glow * 0.16)
    target.beginPath()
    target.ellipse(ox, oy + 2, 16 * s, 5 * s * Math.max(0.5, squash), 0, 0, Math.PI * 2)
    target.fill()
  }

  const draw = DRAWERS[key]
  if (draw) draw(target, s, ox, oy, c, glow, snowCover)
}

/**
 * @param {CanvasRenderingContext2D} target
 * @param {object} opts { scene, theme, scale, groundX, groundY, squash, snowCover, layer }
 */
export function drawSceneProps(target, opts) {
  const { scene = 'street', theme, scale, groundX, groundY, squash = 0.75, snowCover = 0, layer = 'back' } = opts
  const list = PROPS[scene] || PROPS.street

  for (const p of list) {
    const isBack = p.y < 0
    if ((layer === 'back') !== isBack) continue
    drawSceneProp(target, {
      key: p.key,
      scale,
      ox: groundX + p.x * scale,
      oy: groundY + p.y * squash * scale,
      theme,
      squash,
      snowCover,
    })
  }
}
