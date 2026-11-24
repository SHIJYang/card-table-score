/**
 * 像素转台的环境氛围：昼夜天空、太阳/月亮、地面、雨雪天气。
 * 参考 sprite-stacking viewer 的 Day / Sunset / Night + Clear / Rain / Snow 设计，
 * 改成适合当前 2D canvas 软件渲染器的轻量实现。
 */

const TAU = Math.PI * 2

const clamp = (v, a, b) => (v < a ? a : v > b ? b : v)
const lerp = (a, b, t) => a + (b - a) * t

const rgb = (c) => `rgb(${Math.round(c[0])}, ${Math.round(c[1])}, ${Math.round(c[2])})`
const rgba = (c, a) => `rgba(${Math.round(c[0])}, ${Math.round(c[1])}, ${Math.round(c[2])}, ${a})`

const PALETTE = {
  day: {
    skyTop: [148, 199, 233],
    skyBottom: [237, 246, 250],
    groundTop: [196, 216, 196],
    groundBottom: [141, 173, 149],
    sun: [255, 242, 194],
    glow: [255, 224, 152],
    cloud: [255, 255, 255],
  },
  sunset: {
    skyTop: [95, 86, 140],
    skyBottom: [246, 184, 132],
    groundTop: [188, 154, 128],
    groundBottom: [116, 91, 82],
    sun: [255, 198, 122],
    glow: [255, 146, 86],
    cloud: [255, 208, 180],
  },
  night: {
    skyTop: [7, 12, 24],
    skyBottom: [24, 38, 62],
    groundTop: [30, 42, 56],
    groundBottom: [10, 16, 24],
    sun: [222, 234, 255],
    glow: [92, 128, 215],
    cloud: [76, 90, 120],
  },
}

function pick(key, wa, wb, wc) {
  const a = PALETTE.day[key]
  const b = PALETTE.sunset[key]
  const c = PALETTE.night[key]
  return [
    a[0] * wa + b[0] * wb + c[0] * wc,
    a[1] * wa + b[1] * wb + c[1] * wc,
    a[2] * wa + b[2] * wb + c[2] * wc,
  ]
}

/**
 * @param {number} timeOfDay 0=白天 50=黄昏 100=夜晚
 * @param {number} sunAngleDeg 太阳/月亮方位角
 * @param {'clear'|'rain'|'snow'} weather
 * @param {boolean} lighting
 */
export function getEnvTheme(timeOfDay, sunAngleDeg = 42, weather = 'clear', lighting = true) {
  const t = clamp(timeOfDay / 100, 0, 1)

  let dayW = Math.max(0, 1 - t * 2)
  let sunsetW = Math.max(0, 1 - Math.abs(t - 0.5) * 2.4)
  let nightW = Math.max(0, (t - 0.48) / 0.52)
  const sum = Math.max(0.001, dayW + sunsetW + nightW)
  dayW /= sum
  sunsetW /= sum
  nightW /= sum

  const rain = weather === 'rain'
  const snow = weather === 'snow'

  let skyTop = pick('skyTop', dayW, sunsetW, nightW)
  let skyBottom = pick('skyBottom', dayW, sunsetW, nightW)
  let groundTop = pick('groundTop', dayW, sunsetW, nightW)
  let groundBottom = pick('groundBottom', dayW, sunsetW, nightW)
  let cloud = pick('cloud', dayW, sunsetW, nightW)

  const sunColor = pick('sun', dayW, sunsetW, nightW)
  const sunGlow = pick('glow', dayW, sunsetW, nightW)

  if (rain) {
    skyTop = skyTop.map((v) => v * 0.7 + 18)
    skyBottom = skyBottom.map((v) => v * 0.74 + 20)
    groundTop = groundTop.map((v) => v * 0.72)
    groundBottom = groundBottom.map((v) => v * 0.7)
    cloud = cloud.map((v) => lerp(v, 106, 0.55))
  } else if (snow) {
    skyTop = skyTop.map((v) => lerp(v, 202, 0.34))
    skyBottom = skyBottom.map((v) => lerp(v, 236, 0.3))
    groundTop = groundTop.map((v) => lerp(v, 240, 0.72))
    groundBottom = groundBottom.map((v) => lerp(v, 218, 0.58))
    cloud = cloud.map((v) => lerp(v, 232, 0.45))
  }

  const starA = nightW * (rain || snow ? 0.08 : 0.9)

  const az = (sunAngleDeg * Math.PI) / 180
  const sunX = clamp(0.5 + Math.cos(az) * 0.36, 0.08, 0.92)
  const elev = t <= 0.5 ? lerp(0.9, 0.14, t * 2) : lerp(0.14, 0.52, (t - 0.5) * 2)
  const sunY = clamp(0.8 - elev * 0.62, 0.08, 0.74)
  const sunA = (rain || snow ? 0.28 : 1) * 0.95

  const shadowLen = Math.min(1.65, Math.max(0.28, (1 / Math.max(Math.tan(Math.asin(elev)), 0.35)) * 0.52))
  const shDx = -Math.cos(az) * shadowLen
  const shDy = -Math.sin(az) * shadowLen

  // 模型的环境色（source-atop 叠色）
  let tr = 0
  let tg = 0
  let tb = 0
  let ta = 0
  const addTint = (r, g, b, a) => {
    if (a <= 0.0001) return
    const next = ta + a
    tr = (tr * ta + r * a) / next
    tg = (tg * ta + g * a) / next
    tb = (tb * ta + b * a) / next
    ta = Math.min(0.55, next)
  }
  if (lighting) {
    addTint(255, 150, 80, sunsetW * 0.09)
    addTint(28, 46, 86, nightW * 0.34)
    if (rain) addTint(60, 82, 112, 0.1)
    if (snow) addTint(214, 232, 255, 0.07)
  }

  const fog = {
    color: rain || snow ? [170, 186, 202] : [125, 145, 170],
    alpha: nightW * 0.12 + (rain ? 0.16 : 0) + (snow ? 0.22 : 0),
  }

  const shadow = rain || snow
    ? [18, 24, 34, 80]
    : [16, 24, 38, Math.round(lerp(58, 110, nightW))]

  const glow = {
    color: nightW > 0.02 ? [255, 190, 110] : [255, 220, 150],
    alpha: nightW * 0.2 + sunsetW * 0.06,
  }

  return {
    t,
    dayW,
    sunsetW,
    nightW,
    rain,
    snow,
    skyTop,
    skyBottom,
    groundTop,
    groundBottom,
    cloud,
    sun: { x: sunX, y: sunY, color: sunColor, glow: sunGlow, alpha: sunA },
    starA,
    tint: { r: Math.round(tr), g: Math.round(tg), b: Math.round(tb), a: ta },
    az,
    fog,
    shadow,
    glow,
    shDx,
    shDy,
  }
}

const RAIN_COUNT = 110
const SNOW_COUNT = 96
const RIPPLE_COUNT = 14

export class WeatherSystem {
  constructor() {
    this.time = 0
    this.snowCover = 0
    this.wetness = 0

    let seed = 0x9e3779b9
    const rnd = () => {
      seed ^= seed << 13
      seed ^= seed >>> 17
      seed ^= seed << 5
      return (seed >>> 0) / 4294967296
    }

    this.rain = new Float32Array(RAIN_COUNT * 4)
    for (let i = 0; i < RAIN_COUNT; i++) {
      const b = i * 4
      this.rain[b] = rnd()
      this.rain[b + 1] = rnd()
      this.rain[b + 2] = 1.25 + rnd() * 0.85
      this.rain[b + 3] = 3 + ((rnd() * 4) | 0)
    }

    this.ripples = new Float32Array(RIPPLE_COUNT * 4)
    for (let i = 0; i < RIPPLE_COUNT; i++) {
      const b = i * 4
      this.ripples[b] = rnd()
      this.ripples[b + 1] = 0.3 + rnd() * 0.4
      this.ripples[b + 2] = rnd()
      this.ripples[b + 3] = 3 + ((rnd() * 3) | 0)
    }

    this.snow = new Float32Array(SNOW_COUNT * 4)
    for (let i = 0; i < SNOW_COUNT; i++) {
      const b = i * 4
      this.snow[b] = rnd()
      this.snow[b + 1] = rnd()
      this.snow[b + 2] = 0.14 + rnd() * 0.16
      this.snow[b + 3] = rnd() * TAU
    }

    this.stars = Array.from({ length: 46 }, () => ({
      x: rnd(),
      y: rnd() * 0.72,
      s: rnd() < 0.18 ? 2 : 1,
      p: rnd() * TAU,
    }))

    this.clouds = Array.from({ length: 4 }, () => ({
      x: rnd(),
      y: 0.14 + rnd() * 0.24,
      s: 0.75 + rnd() * 0.65,
      v: 0.004 + rnd() * 0.007,
      a: 0.22 + rnd() * 0.2,
    }))

    this.dots = Array.from({ length: 22 }, () => ({
      x: rnd(),
      y: rnd(),
      s: rnd() < 0.3 ? 2 : 1,
    }))
  }

  update(dt, weather) {
    dt = clamp(dt, 0, 0.05)
    this.time += dt

    const targetSnow = weather === 'snow' ? 1 : 0
    const targetWet = weather === 'rain' ? 1 : 0
    const snowSpeed = targetSnow > this.snowCover ? 0.5 : 1.9
    this.snowCover += (targetSnow - this.snowCover) * Math.min(1, dt * snowSpeed)
    this.wetness += (targetWet - this.wetness) * Math.min(1, dt * 2.5)
    if (Math.abs(targetSnow - this.snowCover) < 0.004) this.snowCover = targetSnow
    if (Math.abs(targetWet - this.wetness) < 0.004) this.wetness = targetWet

    if (weather === 'rain') {
      for (let i = 0; i < RAIN_COUNT; i++) {
        const b = i * 4
        this.rain[b] -= this.rain[b + 2] * 0.22 * dt
        this.rain[b + 1] += this.rain[b + 2] * dt
        if (this.rain[b + 1] > 1.05) {
          this.rain[b + 1] -= 1.1
          this.rain[b] = Math.random()
        }
        if (this.rain[b] < -0.05) this.rain[b] += 1.1
      }
      for (let i = 0; i < RIPPLE_COUNT; i++) {
        const b = i * 4
        this.ripples[b + 2] += dt * 1.35
        if (this.ripples[b + 2] >= 1) {
          this.ripples[b] = Math.random()
          this.ripples[b + 1] = 0.3 + Math.random() * 0.4
          this.ripples[b + 2] = 0
          this.ripples[b + 3] = 3 + ((Math.random() * 3) | 0)
        }
      }
    } else if (weather === 'snow') {
      for (let i = 0; i < SNOW_COUNT; i++) {
        const b = i * 4
        this.snow[b] += Math.sin(this.time * 1.4 + this.snow[b + 3]) * 0.045 * dt
        this.snow[b + 1] += this.snow[b + 2] * dt
        if (this.snow[b + 1] > 1.04) {
          this.snow[b + 1] -= 1.08
          this.snow[b] = Math.random()
        }
        if (this.snow[b] < 0) this.snow[b] += 1
        if (this.snow[b] > 1) this.snow[b] -= 1
      }
    }
  }

  drawSky(ctx, w, h, theme, groundY) {
    const skyH = Math.max(1, groundY)
    const sky = ctx.createLinearGradient(0, 0, 0, skyH)
    sky.addColorStop(0, rgb(theme.skyTop))
    sky.addColorStop(1, rgb(theme.skyBottom))
    ctx.fillStyle = sky
    ctx.fillRect(0, 0, w, skyH + 1)

    if (theme.starA > 0.01) {
      for (const s of this.stars) {
        const a = theme.starA * (0.55 + 0.45 * Math.sin(this.time * 2.2 + s.p))
        if (a <= 0.02) continue
        ctx.fillStyle = `rgba(255, 255, 255, ${a})`
        ctx.fillRect(Math.round(s.x * w), Math.round(s.y * skyH), s.s, s.s)
      }
    }

    this.drawClouds(ctx, w, skyH, theme)
    this.drawCelestial(ctx, w, skyH, theme)
  }

  drawCelestial(ctx, w, skyH, theme) {
    const x = theme.sun.x * w
    const y = theme.sun.y * skyH
    const radius = Math.max(6, Math.min(w, skyH) * 0.045)
    const glowR = radius * 4.5

    const glow = ctx.createRadialGradient(x, y, 0, x, y, glowR)
    glow.addColorStop(0, rgba(theme.sun.glow, 0.38 * theme.sun.alpha))
    glow.addColorStop(0.45, rgba(theme.sun.glow, 0.12 * theme.sun.alpha))
    glow.addColorStop(1, rgba(theme.sun.glow, 0))
    ctx.fillStyle = glow
    ctx.fillRect(x - glowR, y - glowR, glowR * 2, glowR * 2)

    const block = Math.max(2, Math.round(radius / 3))
    ctx.fillStyle = rgba(theme.sun.color, theme.sun.alpha)
    for (let yy = -radius; yy <= radius; yy += block) {
      for (let xx = -radius; xx <= radius; xx += block) {
        if (xx * xx + yy * yy <= radius * radius) {
          ctx.fillRect(Math.round(x + xx), Math.round(y + yy), block, block)
        }
      }
    }

    if (theme.nightW > 0.45) {
      ctx.fillStyle = rgba([182, 200, 230], 0.32 * theme.nightW)
      ctx.fillRect(Math.round(x - radius * 0.32), Math.round(y - radius * 0.22), block, block)
      ctx.fillRect(Math.round(x + radius * 0.18), Math.round(y + radius * 0.12), block, block)
    }
  }

  drawClouds(ctx, w, skyH, theme) {
    const weatherCloud = theme.rain || theme.snow ? 1.15 : 0.8
    const nightFade = 1 - theme.nightW * 0.45
    ctx.fillStyle = rgb(theme.cloud)
    for (const c of this.clouds) {
      const x = (((c.x + this.time * c.v) % 1.25) - 0.12) * w
      const y = c.y * skyH
      const s = Math.max(14, w * 0.045) * c.s
      ctx.globalAlpha = c.a * weatherCloud * nightFade
      ctx.fillRect(Math.round(x), Math.round(y), Math.round(s * 1.6), Math.round(s * 0.32))
      ctx.fillRect(Math.round(x + s * 0.18), Math.round(y - s * 0.22), Math.round(s * 0.9), Math.round(s * 0.34))
      ctx.fillRect(Math.round(x + s * 0.48), Math.round(y - s * 0.4), Math.round(s * 0.58), Math.round(s * 0.32))
      ctx.fillRect(Math.round(x + s * 0.8), Math.round(y - s * 0.1), Math.round(s * 0.56), Math.round(s * 0.28))
    }
    ctx.globalAlpha = 1
  }

  drawGround(ctx, w, h, theme, groundX, groundY, rx, ry) {
    const horizon = Math.max(0, groundY - ry * 0.9)
    const ground = ctx.createLinearGradient(0, horizon, 0, h)
    ground.addColorStop(0, rgb(theme.groundTop))
    ground.addColorStop(1, rgb(theme.groundBottom))
    ctx.fillStyle = ground
    ctx.fillRect(0, horizon, w, h - horizon)

    const platformY = groundY + ry * 0.06
    const platform = ctx.createLinearGradient(0, platformY - ry, 0, platformY + ry)
    const snow = theme.snowCover || 0
    const wet = theme.wetness || 0
    const top = theme.groundTop.map((v) => lerp(v, 244, snow * 0.68) * (1 - wet * 0.22))
    const bottom = theme.groundBottom.map((v) => lerp(v, 220, snow * 0.6) * (1 - wet * 0.28))
    platform.addColorStop(0, rgb(top))
    platform.addColorStop(1, rgb(bottom))

    ctx.beginPath()
    ctx.ellipse(groundX, platformY, rx, ry, 0, 0, TAU)
    ctx.fillStyle = platform
    ctx.fill()

    if (theme.glow.alpha > 0.01) {
      const glow = ctx.createRadialGradient(groundX, platformY, 0, groundX, platformY, rx * 1.1)
      glow.addColorStop(0, rgba(theme.glow.color, theme.glow.alpha))
      glow.addColorStop(1, rgba(theme.glow.color, 0))
      ctx.save()
      ctx.globalCompositeOperation = 'lighter'
      ctx.beginPath()
      ctx.ellipse(groundX, platformY, rx * 1.1, ry * 1.15, 0, 0, TAU)
      ctx.fillStyle = glow
      ctx.fill()
      ctx.restore()
    }

    if (wet > 0.02) {
      const sheen = ctx.createLinearGradient(0, platformY - ry, 0, platformY + ry)
      sheen.addColorStop(0, 'rgba(170, 200, 235, 0.2)')
      sheen.addColorStop(0.55, 'rgba(120, 150, 190, 0.06)')
      sheen.addColorStop(1, 'rgba(230, 240, 255, 0.02)')
      ctx.beginPath()
      ctx.ellipse(groundX, platformY, rx, ry, 0, 0, TAU)
      ctx.fillStyle = sheen
      ctx.fill()
    }

    ctx.strokeStyle = rgba(theme.groundBottom, 0.55)
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.ellipse(groundX, platformY, rx, ry, 0, 0, TAU)
    ctx.stroke()

    if (snow > 0.02) {
      ctx.fillStyle = `rgba(255, 255, 255, ${0.34 * snow})`
      for (const d of this.dots) {
        const px = groundX + (d.x - 0.5) * rx * 1.6
        const py = platformY + (d.y - 0.5) * ry * 1.6
        ctx.fillRect(Math.round(px), Math.round(py), d.s, d.s)
      }
    }
  }

  drawRipples(ctx, w, h, theme, groundX, groundY, rx, ry) {
    if ((theme.wetness || 0) < 0.03) return
    ctx.fillStyle = theme.nightW > 0.45 ? 'rgba(150, 195, 255, 0.36)' : 'rgba(120, 150, 190, 0.3)'
    for (let i = 0; i < RIPPLE_COUNT; i++) {
      const b = i * 4
      const age = this.ripples[b + 2]
      if (age <= 0.02) continue
      const px = groundX + (this.ripples[b] - 0.5) * rx * 1.55
      const py = groundY + (this.ripples[b + 1] - 0.5) * ry * 1.5 + ry * 0.18
      const r = Math.max(2, Math.round(age * this.ripples[b + 3] * 2))
      const rh = Math.max(1, Math.round(r * 0.55))
      ctx.fillRect(Math.round(px - r), Math.round(py), 2, 2)
      ctx.fillRect(Math.round(px + r), Math.round(py), 2, 2)
      ctx.fillRect(Math.round(px), Math.round(py - rh), 2, 2)
      ctx.fillRect(Math.round(px), Math.round(py + rh), 2, 2)
    }
  }

  drawOverlay(ctx, w, h, theme, scale) {
    const block = Math.max(1, Math.round(scale * 0.55))
    if (theme.rain) {
      ctx.fillStyle = theme.nightW > 0.45 ? 'rgba(160, 210, 255, 0.5)' : 'rgba(125, 155, 195, 0.46)'
      for (let i = 0; i < RAIN_COUNT; i++) {
        const b = i * 4
        const x = this.rain[b] * w
        const y = this.rain[b + 1] * h
        const len = this.rain[b + 3]
        for (let k = 0; k < len; k++) {
          ctx.fillRect(Math.round(x - k * block * 0.5), Math.round(y + k * block), block, block)
        }
      }
    } else if (theme.snow) {
      ctx.fillStyle = theme.nightW > 0.45 ? 'rgba(225, 240, 255, 0.85)' : 'rgba(255, 255, 255, 0.92)'
      for (let i = 0; i < SNOW_COUNT; i++) {
        const b = i * 4
        const x = this.snow[b] * w
        const y = this.snow[b + 1] * h
        const size = (i & 3) === 0 ? block * 2 : block
        ctx.fillRect(Math.round(x), Math.round(y), size, size)
      }
    }
  }

  drawFog(ctx, w, h, theme, groundY) {
    if (theme.fog.alpha <= 0.01) return
    const top = Math.max(0, groundY - 30)
    const fog = ctx.createLinearGradient(0, top, 0, h)
    fog.addColorStop(0, rgba(theme.fog.color, 0))
    fog.addColorStop(0.4, rgba(theme.fog.color, theme.fog.alpha * 0.6))
    fog.addColorStop(1, rgba(theme.fog.color, theme.fog.alpha))
    ctx.fillStyle = fog
    ctx.fillRect(0, top, w, h - top)
  }
}
