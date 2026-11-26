/**
 * 玩具模式：驾驶（Drive）/ 风吹（Wind）/ 碎裂（Shatter）。
 * Drive 维护俯视平面上的速度与朝向；Shatter 维护粒子位置并从外壳体素重建。
 */

import { buildShatterParticles } from './voxel'

const lerp = (a, b, t) => a + (b - a) * t

export class DriveToy {
  constructor() {
    this.reset()
  }

  reset() {
    this.x = 0
    this.y = 0
    this.vx = 0
    this.vy = 0
    this.heading = -Math.PI / 2
    this.lean = 0
    this.bounce = 0
    this.bounceVel = 0
    this.speed = 0
    this.drifting = false
    this.puffs = []
    this.skids = []
    this._puffT = 0
  }

  get angleDeg() {
    return (((this.heading * 180) / Math.PI - 90) % 360 + 360) % 360
  }

  update(dt, keys = {}) {
    const maxSpeed = 78
    const accel = 135
    const brakeForce = 185
    const throttle = (keys.up ? 1 : 0) - (keys.down ? 1 : 0)
    const steerIn = (keys.right ? 1 : 0) - (keys.left ? 1 : 0)

    const fx = Math.cos(this.heading)
    const fy = Math.sin(this.heading)
    const rx = -fy
    const ry = fx

    let fwd = this.vx * fx + this.vy * fy
    let lat = this.vx * rx + this.vy * ry

    if (throttle !== 0) {
      const braking = Math.sign(throttle) !== Math.sign(fwd) && Math.abs(fwd) > 4
      fwd += throttle * (braking ? brakeForce : accel) * dt
    } else {
      fwd *= Math.exp(-2.8 * dt)
    }
    fwd = Math.max(-maxSpeed * 0.48, Math.min(maxSpeed, fwd))

    const speedNorm = Math.min(1, Math.abs(fwd) / 36)
    const turnRate = (keys.brake ? 4.3 : 3.2) * (fwd >= -2 ? 1 : -1)
    this.heading += steerIn * turnRate * speedNorm * dt

    const grip = keys.brake ? 2.1 : 8.5
    lat *= Math.exp(-grip * dt)

    const nfx = Math.cos(this.heading)
    const nfy = Math.sin(this.heading)
    const nrx = -nfy
    const nry = nfx
    this.vx = nfx * fwd + nrx * lat
    this.vy = nfy * fwd + nry * lat
    this.x += this.vx * dt
    this.y += this.vy * dt
    this.speed = Math.hypot(this.vx, this.vy)
    this.drifting = (keys.brake && Math.abs(fwd) > 16) || Math.abs(lat) > 14

    const targetLean = -steerIn * speedNorm * (keys.brake ? 2.8 : 1.6)
    this.lean += (targetLean - this.lean) * Math.min(1, dt * 12)
    if (Math.abs(throttle) > 0 && Math.abs(fwd) < 25) this.bounceVel += 0.9 * dt
    this.bounceVel += (-this.bounce * 38 - this.bounceVel * 7) * dt
    this.bounce += this.bounceVel * dt

    // 漂移胎痕
    if (this.drifting) {
      for (const sgn of [-1, 1]) {
        this.skids.push({
          x: this.x - nfx * 6 + nrx * 5 * sgn,
          y: this.y - nfy * 6 + nry * 5 * sgn,
          life: 1,
        })
      }
      if (this.skids.length > 360) this.skids.splice(0, this.skids.length - 360)
    }
    for (const s of this.skids) s.life -= dt * 0.25
    if (this.skids.length) this.skids = this.skids.filter((s) => s.life > 0)

    // 尾气 / 漂移烟
    this._puffT -= dt
    if ((this.speed > 10 || this.drifting) && this._puffT <= 0) {
      this._puffT = this.drifting ? 0.05 : 0.11
      this.puffs.push({
        x: this.x - nfx * 9 + (Math.random() - 0.5) * 3,
        y: this.y - nfy * 9 + (Math.random() - 0.5) * 3,
        z: 2 + Math.random() * 2,
        vx: -nfx * 6 + (Math.random() - 0.5) * 8,
        vy: -nfy * 6 + (Math.random() - 0.5) * 8,
        life: 1,
      })
      if (this.puffs.length > 60) this.puffs.shift()
    }
    for (const p of this.puffs) {
      p.x += p.vx * dt
      p.y += p.vy * dt
      p.z += 10 * dt
      p.life = Math.max(0, p.life - dt * 1.45)
    }
    this.puffs = this.puffs.filter((p) => p.life > 0)
  }
}

export class ShatterToy {
  constructor() {
    this.phase = 'idle'
    this.t = 0
    this.count = 0
    this.list = []
    this.hx = null
    this.hy = null
    this.hz = null
    this.col = null
    this.em = null
    this.px = null
    this.py = null
    this.pz = null
    this.vx = null
    this.vy = null
    this.vz = null
    this.sx = null
    this.sy = null
    this.sz = null
  }

  setVolume(volume) {
    const list = buildShatterParticles(volume, 2600)
    this.list = list
    const n = list.length
    this.count = n
    this.hx = new Float32Array(n)
    this.hy = new Float32Array(n)
    this.hz = new Float32Array(n)
    this.col = new Uint32Array(n)
    this.em = new Uint8Array(n)
    this.px = new Float32Array(n)
    this.py = new Float32Array(n)
    this.pz = new Float32Array(n)
    this.vx = new Float32Array(n)
    this.vy = new Float32Array(n)
    this.vz = new Float32Array(n)
    this.sx = new Float32Array(n)
    this.sy = new Float32Array(n)
    this.sz = new Float32Array(n)
    for (let i = 0; i < n; i++) {
      const v = list[i]
      this.hx[i] = v.x
      this.hy[i] = v.y
      this.hz[i] = v.z
      this.col[i] = v.col
      this.em[i] = v.em
    }
    this.phase = 'idle'
    this.t = 0
  }

  trigger(angleDeg, spacing = 1) {
    if (this.count === 0) return
    const rad = (angleDeg * Math.PI) / 180
    const ca = Math.cos(rad)
    const sa = Math.sin(rad)

    if (this.phase === 'idle') {
      this.phase = 'burst'
      this.t = 0
      for (let i = 0; i < this.count; i++) {
        const rx = this.hx[i] * ca - this.hy[i] * sa
        const ry = this.hx[i] * sa + this.hy[i] * ca
        const rz = this.hz[i] * spacing
        this.px[i] = rx
        this.py[i] = ry
        this.pz[i] = rz
        const dist = Math.hypot(rx, ry) + 0.5
        const burst = 34 + Math.random() * 58
        this.vx[i] = (rx / dist) * burst + (Math.random() - 0.5) * 32
        this.vy[i] = (ry / dist) * burst + (Math.random() - 0.5) * 32
        this.vz[i] = 40 + Math.random() * 68 + rz * 1.4
      }
    } else if (this.phase === 'burst') {
      this.phase = 'rebuild'
      this.t = 0
      for (let i = 0; i < this.count; i++) {
        this.sx[i] = this.px[i]
        this.sy[i] = this.py[i]
        this.sz[i] = this.pz[i]
      }
    } else {
      // 重组中再次触发：从当前位置重新炸开
      this.phase = 'burst'
      this.t = 0
      for (let i = 0; i < this.count; i++) {
        const rx = this.px[i]
        const ry = this.py[i]
        const dist = Math.hypot(rx, ry) + 0.5
        const burst = 40 + Math.random() * 60
        this.vx[i] = (rx / dist) * burst + (Math.random() - 0.5) * 34
        this.vy[i] = (ry / dist) * burst + (Math.random() - 0.5) * 34
        this.vz[i] = 46 + Math.random() * 70
      }
    }
  }

  update(dt, angleDeg, spacing = 1, maxZ = 1) {
    if (this.phase === 'burst') {
      this.t += dt
      const g = 210
      for (let i = 0; i < this.count; i++) {
        this.vz[i] -= g * dt
        this.px[i] += this.vx[i] * dt
        this.py[i] += this.vy[i] * dt
        this.pz[i] += this.vz[i] * dt
        if (this.pz[i] < 0) {
          this.pz[i] = 0
          this.vz[i] = -this.vz[i] * 0.44
          this.vx[i] *= 0.72
          this.vy[i] *= 0.72
          if (Math.abs(this.vz[i]) < 6) this.vz[i] = 0
        }
      }
    } else if (this.phase === 'rebuild') {
      this.t += dt * 1.55
      const rad = (angleDeg * Math.PI) / 180
      const ca = Math.cos(rad)
      const sa = Math.sin(rad)
      const denom = Math.max(1, maxZ)
      let done = true
      for (let i = 0; i < this.count; i++) {
        const zFrac = this.hz[i] / denom
        const u = Math.max(0, Math.min(1, (this.t - zFrac * 0.35) / 0.65))
        if (u < 1) done = false
        const e = 1 - Math.pow(1 - u, 3)
        this.px[i] = lerp(this.sx[i], this.hx[i] * ca - this.hy[i] * sa, e)
        this.py[i] = lerp(this.sy[i], this.hx[i] * sa + this.hy[i] * ca, e)
        this.pz[i] = lerp(this.sz[i], this.hz[i] * spacing, e)
      }
      if (done) this.phase = 'idle'
    }
  }
}
