/**
 * 涂鸦过山车 —— 行驶物理
 *
 * 固定步长积分（1/240 s），所以同一个分享码在任何人那里跑出来的轨迹都完全一样。
 * 列车沿轨道弧长前进：重力沿切线分量加速，空气阻力 + 滚动阻力减速；
 * 最低速度 VMIN 保证能爬上画歪的坡，终点前 14 米自动减速停车。
 */
import { sample } from './geometry'

export const G = 9.81
export const VMIN = 10 // 最低速度（米/秒）
export const V0 = 1.5 // 出站速度
export const DRAG = 0.0008 // 空气阻力系数
export const ROLL = 0.15 // 滚动阻力
export const SUB = 1 / 240 // 物理子步长
export const HOLD = 2.2 // 发车前在站台停留的秒数

export const CAR_GAP = 2.6 // 车厢间距（以车长为单位）
export const LEAD_OFF = 1.3 // 车头相对骑乘点的偏移

export function newRide() {
  return { s: 0, v: V0, t: 0, acc: 0, g: 1, lift: false, ended: false, riders: null, hold: 0, held: 0 }
}

/**
 * 按真实时间推进一帧。
 * @param {object} r 行驶状态
 * @param {object} track 轨道
 * @param {number} dt 本帧时长（秒）
 * @param {Function} [onRelease] 刹车松开的瞬间（用来放音效）
 */
export function stepRideBy(r, track, dt, onRelease) {
  if (r.hold > 0) {
    r.hold -= dt
    r.held += dt
    if (r.hold <= 0) {
      r.hold = 0
      r.acc = 0
      onRelease && onRelease()
    }
    return
  }
  r.acc += dt
  while (r.acc >= SUB && !r.ended) {
    const h = SUB
    r.acc -= h
    const p = sample(track, r.s)
    let at = G * p.ty - DRAG * r.v * r.v - ROLL
    r.v += at * h
    r.lift = false
    const vmin = Math.min(VMIN, V0 + r.t * 6) // 先慢慢溜出站，之后不低于 VMIN
    if (r.v < vmin) {
      r.v = vmin
      at = 0
      r.lift = p.ty < -0.15
    }
    const rem = track.len - r.s
    if (rem < 14) {
      const cap = Math.max(1.5, rem * 1.15)
      if (r.v > cap) {
        r.v = cap
        at = 0
      }
    }
    r.s += r.v * h
    r.t += h
    if (r.s >= track.len - 0.01) {
      r.s = track.len
      r.ended = true
    }
    // 乘客坐标系里的垂直 G（2D 里的小人会跟着这个值欢呼或尖叫）
    const ax = at * p.tx + r.v * r.v * p.kx
    const ay = at * p.ty + r.v * r.v * p.ky
    const ux = track.sigma * p.ty
    const uy = -track.sigma * p.tx
    const gz = (ax * ux + (ay - G) * uy) / G
    r.g += (gz - r.g) * Math.min(1, h / 0.06)
  }
}
