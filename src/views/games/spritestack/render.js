/**
 * Pixel-art slice renderer.
 * 先以 1 个美术像素为分辨率做软件光栅化，再整数倍放大绘制到页面 canvas，
 * 这样旋转时仍然是硬边像素质感（nearest-neighbour）。
 * 体素着色来自 voxel.js：三档光照 / AO / 自发光 / 积雪；环境天空与天气来自 environment.js。
 */

import { getEnvTheme } from './environment'
import { buildVolume, getLightingEnv, VoxelRasterizer } from './voxel'
import { drawScenePlatform, drawSceneProp, drawSceneProps } from './scene'

const TAU = Math.PI * 2
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v)
const lerp = (a, b, t) => a + (b - a) * t
const rgb = (c) => `rgb(${Math.round(c[0])}, ${Math.round(c[1])}, ${Math.round(c[2])})`

// 驾驶世界的无限平铺道具（每 96 美术像素一格）
const DRIVE_TILE = 96
const DRIVE_TILES = {
  street: [
    { key: 'lamp', x: 18, y: -26 },
    { key: 'kiosk', x: 64, y: -28 },
    { key: 'bollard', x: 42, y: 26 },
    { key: 'lamp', x: 80, y: 28 },
  ],
  meadow: [
    { key: 'pine', x: 16, y: 18 },
    { key: 'pine', x: 70, y: 26 },
    { key: 'rock', x: 44, y: 64 },
    { key: 'meadowLamp', x: 78, y: 72 },
  ],
}

export class StackRenderer {
  constructor() {
    this.rasterizer = new VoxelRasterizer()
  }

  render(target, cssW, cssH, model, opts = {}) {
    if (!model || !model.slices || !cssW || !cssH) return null
    if (!model.volume) model.volume = buildVolume(model)

    const { W, L } = model
    const squash = Math.max(0.25, Math.min(1, opts.squash ?? 0.75))
    const mode = opts.mode || 'turntable'
    const toy = opts.toy || 'wind'
    const isPlay = mode === 'play'
    const isDrive = isPlay && toy === 'drive'
    const isWind = isPlay && toy === 'wind'
    const isShatter = isPlay && toy === 'shatter'
    const isScene = mode === 'scene'
    const scene = opts.scene || 'street'

    if (isShatter && opts.shatter && opts.shatter.phase !== 'idle') {
      return this.drawShatter(target, cssW, cssH, model, opts)
    }

    let spacing = Math.max(0.25, opts.spacing ?? 1)
    if (isDrive && opts.drive) spacing = Math.max(0.4, spacing + opts.drive.bounce * 0.25)
    const room = mode === 'explode' ? Math.max(spacing, 2.6) : spacing
    const total = opts.maxSlices ? Math.min(model.H, Math.max(1, opts.maxSlices)) : model.H
    const highlight = opts.highlight ?? -1
    const zoom = Math.max(0.4, opts.zoom ?? 1)
    const angle = opts.angle ?? 0

    const env = opts.env || {}
    const theme = getEnvTheme(env.time ?? 0, env.sun ?? 42, env.weather ?? 'clear', env.lighting !== false)
    const weather = opts.weather || null
    const snowCover = weather ? weather.snowCover : 0
    const wetness = weather ? weather.wetness : 0
    theme.snowCover = snowCover
    theme.wetness = wetness

    const lit = getLightingEnv(env.time ?? 0, env.sun ?? 42)

    // 风吹：越靠上摆幅越大
    let shear = null
    if (isWind && opts.windPhase !== undefined) {
      const gust = 2.6 + 1.4 * Math.sin(opts.windPhase * 0.7)
      const denom = Math.max(1, total - 1)
      shear = new Float32Array(total)
      for (let z = 0; z < total; z++) {
        const hFrac = z / denom
        shear[z] = Math.sin(opts.windPhase * 2.8 - z * 0.14) * gust * Math.pow(hFrac, 1.6)
      }
    }

    const buf = this.rasterizer.rasterize({
      volume: model.volume,
      angleDeg: angle,
      squash,
      spacing,
      room,
      maxSlices: total,
      shadow: opts.shadow !== false,
      outline: opts.outline !== false,
      lighting: env.lighting !== false,
      snowCover,
      env: lit,
      highlight,
      shearPerSlice: shear,
      leanX: isDrive && opts.drive ? opts.drive.lean : 0,
    })
    if (!buf) return null

    const { cw, ch } = buf
    const fit = Math.min((cssW * 0.92) / cw, (cssH * 0.92) / ch)
    let scale = Math.floor(fit * zoom)
    if (scale < 1) scale = 1
    const dx = Math.round((cssW - cw * scale) / 2)
    const dy = Math.round((cssH - ch * scale) / 2 + 2)
    const groundX = dx + buf.cx * scale
    const groundY = dy + buf.baseY * scale
    const spread = isScene ? Math.max(W, L, 74) : Math.max(W, L)
    const rx = spread * 0.95 * scale
    const ry = rx * (isScene ? 0.34 : Math.max(0.16, squash * 0.42))

    if (isDrive && opts.drive) {
      this.drawDriveGround(target, cssW, cssH, lit, theme, opts.drive, scene, scale, squash, snowCover, wetness)
      this.drawDriveSkids(target, lit, opts.drive, scale, squash, groundX, groundY)
      if (wetness > 0.04) {
        target.save()
        target.globalAlpha = Math.min(0.2, wetness * 0.16)
        target.translate(0, groundY * 2)
        target.scale(1, -1)
        target.imageSmoothingEnabled = false
        target.drawImage(buf.canvas, dx, dy, cw * scale, ch * scale)
        target.restore()
      }
      this.drawDriveProps(target, {
        scene,
        theme: lit,
        scale,
        squash,
        snowCover,
        cssW,
        cssH,
        drive: opts.drive,
        groundX,
        groundY,
        layer: 'back',
      })
    } else if (weather) {
      weather.drawSky(target, cssW, cssH, theme, groundY)
      if (isScene) {
        drawScenePlatform(target, { scene, theme: lit, scale, cx: groundX, cy: groundY, rx, ry })
      } else {
        weather.drawGround(target, cssW, cssH, theme, groundX, groundY, rx, ry)
      }
    } else {
      target.fillStyle = lit.bgHex
      target.fillRect(0, 0, cssW, cssH)
    }

    // 雨天湿地倒影
    if (wetness > 0.04 && !isDrive) {
      target.save()
      target.beginPath()
      target.ellipse(groundX, groundY + ry * 0.7, rx * 0.92, ry * 0.9, 0, 0, TAU)
      target.clip()
      target.globalAlpha = Math.min(0.22, wetness * 0.18)
      target.translate(0, groundY * 2)
      target.scale(1, -1)
      target.imageSmoothingEnabled = false
      target.drawImage(buf.canvas, dx, dy, cw * scale, ch * scale)
      target.restore()
    }

    if (weather && !isDrive) weather.drawRipples(target, cssW, cssH, theme, groundX, groundY, rx, ry)

    target.imageSmoothingEnabled = false

    if (isScene) {
      drawSceneProps(target, {
        scene,
        theme: lit,
        scale,
        groundX,
        groundY,
        squash,
        snowCover,
        layer: 'back',
      })
    }

    target.drawImage(buf.canvas, dx, dy, cw * scale, ch * scale)

    if (isScene) {
      drawSceneProps(target, {
        scene,
        theme: lit,
        scale,
        groundX,
        groundY,
        squash,
        snowCover,
        layer: 'front',
      })
    }

    if (isDrive && opts.drive) {
      this.drawDriveProps(target, {
        scene,
        theme: lit,
        scale,
        squash,
        snowCover,
        cssW,
        cssH,
        drive: opts.drive,
        groundX,
        groundY,
        layer: 'front',
      })
      this.drawDriveEffects(target, lit, opts.drive, scene, scale, squash, groundX, groundY, snowCover)
    }

    if (isWind && opts.windPhase !== undefined) {
      const streakCol = lit.nightW > 0.45 ? 'rgba(180, 205, 255, 0.24)' : 'rgba(100, 116, 139, 0.26)'
      target.fillStyle = streakCol
      for (let i = 0; i < 6; i++) {
        const wx = ((opts.windPhase * (55 + i * 13) + i * 73) % (cssW + 40)) - 20
        const wy = Math.round(((i + 0.5) / 6) * cssH)
        const wpx = (4 + (i % 3) * 2) * scale
        target.fillRect(Math.round(wx / scale) * scale, Math.round(wy / scale) * scale, wpx, scale)
      }
    }

    if (weather && !isDrive) {
      weather.drawFog(target, cssW, cssH, theme, groundY)
      weather.drawOverlay(target, cssW, cssH, theme, scale)
    }

    return { scale, cw, ch, dx, dy, groundX, groundY, cx: buf.cx, baseY: buf.baseY }
  }

  drawDriveSkids(target, lit, drive, scale, squash, groundX, groundY) {
    if (!drive.skids || drive.skids.length === 0) return
    const sz = Math.max(2, Math.round(2 * scale))
    target.fillStyle = lit.nightW > 0.45 ? 'rgba(4, 6, 12, 0.7)' : 'rgba(30, 36, 46, 0.35)'
    for (const s of drive.skids) {
      const x = Math.round(groundX + (s.x - drive.x) * scale)
      const y = Math.round(groundY + (s.y - drive.y) * squash * scale)
      target.fillRect(x, y, sz, sz)
    }
  }

  drawDriveProps(target, opts) {
    const { scene, theme, scale, squash, snowCover, cssW, cssH, drive, groundX, groundY, layer } = opts
    const tiles = DRIVE_TILES[scene] || DRIVE_TILES.street
    const baseTx = Math.floor(drive.x / DRIVE_TILE)
    const baseTy = Math.floor(drive.y / DRIVE_TILE)
    const items = []
    const margin = 70 * scale
    for (let ty = baseTy - 2; ty <= baseTy + 2; ty++) {
      for (let tx = baseTx - 2; tx <= baseTx + 2; tx++) {
        for (const p of tiles) {
          const wx = tx * DRIVE_TILE + p.x
          const wy = ty * DRIVE_TILE + p.y
          const dY = wy - drive.y
          if ((layer === 'back') !== dY < 0) continue
          const ox = groundX + (wx - drive.x) * scale
          const oy = groundY + dY * squash * scale
          if (ox < -margin || ox > cssW + margin || oy < -margin || oy > cssH + margin) continue
          items.push({ key: p.key, ox, oy, dY })
        }
      }
    }
    items.sort((a, b) => a.dY - b.dY)
    for (const it of items) {
      drawSceneProp(target, {
        key: it.key,
        scale,
        ox: it.ox,
        oy: it.oy,
        theme,
        squash,
        snowCover,
      })
    }
  }

  drawDriveGround(target, cssW, cssH, lit, theme, drive, scene, scale, squash, snowCover, wetness) {
    const night = lit.nightW
    const isStreet = scene !== 'meadow'
    let base = isStreet ? [86, 92, 106] : [116, 166, 98]
    if (wetness > 0) base = base.map((v, i) => v * (1 - wetness * (i === 2 ? 0.14 : 0.24)))
    if (snowCover > 0) base = base.map((v, i) => lerp(v, [236, 242, 250][i], snowCover * 0.7))
    base = base.map((v, i) => lerp(v, [24, 30, 44][i], night))
    target.fillStyle = rgb(base)
    target.fillRect(0, 0, cssW, cssH)

    const step = Math.round((isStreet ? 28 : 24) * scale)
    if (step > 4) {
      const ox = ((-drive.x * scale) % step + step) % step
      const oy = ((-drive.y * scale) % step + step) % step
      target.fillStyle = isStreet
        ? night > 0.45
          ? 'rgba(255, 214, 120, 0.14)'
          : 'rgba(255, 244, 180, 0.2)'
        : night > 0.45
          ? 'rgba(150, 190, 255, 0.12)'
          : 'rgba(255, 255, 255, 0.15)'
      const lw = Math.max(1, Math.round(scale * 0.7))
      for (let x = ox; x < cssW; x += step) target.fillRect(Math.round(x), 0, lw, cssH)
      for (let y = oy; y < cssH; y += step) target.fillRect(0, Math.round(y), cssW, lw)
    }
  }

  drawDriveEffects(target, lit, drive, scene, scale, squash, groundX, groundY, snowCover) {
    // 夜间车头灯
    if (lit.emisGlow > 0.1) {
      const fx = Math.cos(drive.heading)
      const fy = Math.sin(drive.heading)
      const rx = -fy
      const ry = fx
      for (const side of [-5, 5]) {
        for (let d = 14; d <= 48; d += 6) {
          const tBeam = (d - 14) / 34
          const alpha = lit.emisGlow * 0.32 * (1 - tBeam * 0.72)
          target.fillStyle = `rgba(255, 242, 182, ${alpha.toFixed(2)})`
          const spread = 2 + d * 0.14
          const hx = groundX + (fx * d + rx * side) * scale
          const hy = groundY + (fy * d + ry * side) * squash * scale
          const wPx = Math.max(1, Math.round(spread * 1.6)) * scale
          const hPx = Math.max(1, Math.round(spread * 1.0 * squash)) * scale
          target.fillRect(Math.round(hx - wPx / 2), Math.round(hy - hPx / 2), wPx, hPx)
        }
      }
    }

    // 尾气 / 漂移烟
    for (const p of drive.puffs) {
      const px = Math.round(groundX + (p.x - drive.x) * scale)
      const py = Math.round(groundY + ((p.y - drive.y) * squash - p.z) * scale)
      const sz = (p.life > 0.5 ? 3 : 2) * scale
      target.fillStyle =
        lit.nightW > 0.45
          ? `rgba(170, 185, 220, ${(p.life * 0.45).toFixed(2)})`
          : `rgba(110, 120, 136, ${(p.life * 0.5).toFixed(2)})`
      target.fillRect(px, py, sz, sz)
    }
  }

  drawShatter(target, cssW, cssH, model, opts) {
    const vol = model.volume
    const toy = opts.shatter
    const env = opts.env || {}
    const lit = getLightingEnv(env.time ?? 0, env.sun ?? 42)
    const squash = Math.max(0.25, Math.min(1, opts.squash ?? 0.75))
    const aw = Math.max(140, Math.ceil(Math.hypot(vol.w, vol.h) * 2.6))
    const ah = Math.max(120, Math.ceil(Math.hypot(vol.w, vol.h) * squash * 2.0) + vol.n * 2 + 36)
    const scale = Math.max(1, Math.floor(Math.min(cssW / aw, cssH / ah)))
    const dx = Math.round((cssW - aw * scale) / 2)
    const dy = Math.round((cssH - ah * scale) / 2)

    const theme = getEnvTheme(env.time ?? 0, env.sun ?? 42, env.weather ?? 'clear', env.lighting !== false)
    const weather = opts.weather || null
    theme.snowCover = weather ? weather.snowCover : 0
    theme.wetness = weather ? weather.wetness : 0

    const cx = aw >> 1
    const baseY = Math.round(ah * 0.66)
    const s = scale
    const groundX = dx + cx * s
    const groundY = dy + baseY * s

    if (weather) {
      const rx = Math.max(vol.w, vol.h, 80) * 0.95 * s
      const ry = rx * 0.34
      weather.drawSky(target, cssW, cssH, theme, groundY)
      weather.drawGround(target, cssW, cssH, theme, groundX, groundY, rx, ry)
      weather.drawRipples(target, cssW, cssH, theme, groundX, groundY, rx, ry)
    } else {
      target.fillStyle = lit.bgHex
      target.fillRect(0, 0, cssW, cssH)
    }
    target.imageSmoothingEnabled = false

    const toRgb = (c) => `rgb(${c & 255}, ${(c >> 8) & 255}, ${(c >> 16) & 255})`

    if (opts.shadow !== false) {
      target.fillStyle = `rgba(${lit.shPacked & 255}, ${(lit.shPacked >> 8) & 255}, ${(lit.shPacked >> 16) & 255}, 0.55)`
      for (let i = 0; i < toy.count; i++) {
        const gx = Math.round(cx + toy.px[i] + toy.pz[i] * lit.shDx * 0.38)
        const gy = Math.round(baseY + (toy.py[i] + toy.pz[i] * lit.shDy) * squash)
        target.fillRect(dx + gx * s, dy + gy * s, s, s)
      }
    }

    for (let i = 0; i < toy.count; i++) {
      const vx = Math.round(cx + toy.px[i])
      const vy = Math.round(baseY + toy.py[i] * squash - toy.pz[i])
      target.fillStyle = toRgb(toy.col[i])
      target.fillRect(dx + vx * s, dy + vy * s, 2 * s, 2 * s)
    }

    if (weather) {
      weather.drawFog(target, cssW, cssH, theme, groundY)
      weather.drawOverlay(target, cssW, cssH, theme, s)
    }

    return { scale, cw: aw, ch: ah, dx, dy, groundX, groundY, cx, baseY }
  }
}
