// 江南园林场景 - 相机：微缩景观环绕 / 第一人称漫游（含碰撞与踏面）
import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { clamp, pointInPoly } from './util'

export class CameraRig {
  constructor(camera, dom, ctx, pondPoly) {
    this.camera = camera
    this.dom = dom
    this.ctx = ctx
    this.pondPoly = pondPoly
    this.mode = 'orbit'
    this.enabled = true

    // ---- 环绕 ----
    this.orbit = new OrbitControls(camera, dom)
    this.orbit.target.set(1, 0.8, -1.5)
    this.orbit.enableDamping = true
    this.orbit.dampingFactor = 0.06
    this.orbit.minDistance = 1.2
    this.orbit.maxDistance = 55
    this.orbit.enablePan = true
    this.orbit.screenSpacePanning = false
    this.orbit.panSpeed = 0.8
    this.orbit.maxPolarAngle = 1.52
    this.orbit.minPolarAngle = 0.15
    this.orbit.rotateSpeed = 0.55
    this.orbit.zoomSpeed = 0.8
    camera.position.set(24, 15, 21)

    // ---- 漫游 ----
    this.eye = 1.62
    this.pos = new THREE.Vector3(0, 0, 3.2)
    this.yaw = 0               // 面向北（朝堂屋，-z）
    this.pitch = -0.05
    this.vel = new THREE.Vector3()
    this.keys = {}
    this.walkPhase = 0
    this.locked = false
    this._onKey = (e) => {
      this.keys[e.code] = e.type === 'keydown'
    }
    window.addEventListener('keydown', this._onKey)
    window.addEventListener('keyup', this._onKey)
    this._onLock = () => { this.locked = document.pointerLockElement === dom }
    document.addEventListener('pointerlockchange', this._onLock)
    this._onMove = (e) => {
      if (!this.locked || this.mode !== 'fps') return
      this.yaw -= e.movementX * 0.0021
      this.pitch = clamp(this.pitch - e.movementY * 0.0021, -1.35, 1.35)
    }
    document.addEventListener('mousemove', this._onMove)
    this._onClick = () => {
      if (this.mode === 'fps' && !this.locked) dom.requestPointerLock?.()
    }
    dom.addEventListener('click', this._onClick)
  }

  setMode(m) {
    if (m === this.mode) return
    this.mode = m
    if (m === 'orbit') {
      document.exitPointerLock?.()
      this.orbit.enabled = true
      // 回到环绕视角（从当前_fps 位置平滑由外部处理，这里直接复位）
      this.camera.position.set(24, 15, 21)
      this.orbit.target.set(1, 0.8, -1.5)
      this.orbit.update()
    } else {
      this.orbit.enabled = false
      this.pos.set(0, 0, 3.2)
      this.yaw = 0
      this.pitch = -0.04
    }
  }
  toggleMode() { this.setMode(this.mode === 'orbit' ? 'fps' : 'orbit') }

  // 地面高度：平台/坡道/桥拱取最高有效值
  groundAt(x, z) {
    let h = 0
    for (const d of this.ctx.decks) {
      if (x >= d.x1 && x <= d.x2 && z >= d.z1 && z <= d.z2) h = Math.max(h, d.h)
    }
    for (const r of this.ctx.ramps) {
      if (x >= r.x1 && x <= r.x2 && z >= r.z1 && z <= r.z2) {
        let v
        if (r.axis === 'z') v = r.h1 + (r.h2 - r.h1) * (z - r.z1) / (r.z2 - r.z1)
        else v = r.h1 + (r.h2 - r.h1) * (x - r.x1) / (r.x2 - r.x1)
        h = Math.max(h, v)
      }
    }
    for (const b of (this.ctx.bridges || [])) {
      const dx = b.bx - b.ax, dz = b.bz - b.az
      const L2 = dx * dx + dz * dz
      const t = ((x - b.ax) * dx + (z - b.az) * dz) / L2
      if (t < -0.02 || t > 1.02) continue
      const px = b.ax + dx * t, pz = b.az + dz * t
      const dist = Math.hypot(x - px, z - pz)
      if (dist <= b.width) h = Math.max(h, b.h0 + Math.sin(Math.PI * clamp(t, 0, 1)) * b.hMax)
    }
    return h
  }

  blocked(x, z) {
    for (const w of this.ctx.walls) {
      if (x > w.x1 - 0.26 && x < w.x2 + 0.26 && z > w.z1 - 0.26 && z < w.z2 + 0.26) return true
    }
    // 水面：无踏面处不可入
    if (pointInPoly(x, z, this.pondPoly) && this.groundAt(x, z) < 0.2) return true
    return false
  }

  resetView() {
    this.camera.position.set(24, 15, 21)
    this.orbit.target.set(1, 0.8, -1.5)
    this.orbit.update()
  }

  update(dt) {
    if (this.mode === 'orbit') {
      this.orbit.update()
      const t = this.orbit.target
      t.x = clamp(t.x, -19, 20)
      t.y = clamp(t.y, 0, 10)
      t.z = clamp(t.z, -14, 12.5)
      return
    }
    // ---- FPS ----
    const k = this.keys
    const run = k['ShiftLeft'] || k['ShiftRight'] ? 1.85 : 1
    const speed = 2.3 * run
    let fx = 0, fz = 0
    if (k['KeyW'] || k['ArrowUp']) fz -= 1
    if (k['KeyS'] || k['ArrowDown']) fz += 1
    if (k['KeyA'] || k['ArrowLeft']) fx -= 1
    if (k['KeyD'] || k['ArrowRight']) fx += 1
    const sin = Math.sin(this.yaw), cos = Math.cos(this.yaw)
    // 相机前方（yaw=PI 朝 -z）
    const dirX = (-sin * -fz + cos * fx)
    const dirZ = (-cos * -fz - sin * fx)
    const len = Math.hypot(dirX, dirZ)
    const target = new THREE.Vector3()
    if (len > 0.01) {
      target.set(dirX / len * speed, 0, dirZ / len * speed)
    }
    this.vel.lerp(target, Math.min(1, dt * 10))
    const step = this.vel.clone().multiplyScalar(dt)
    // 分轴尝试
    const tryMove = (dx, dz) => {
      const nx = this.pos.x + dx, nz = this.pos.z + dz
      if (!this.blocked(nx, nz)) {
        this.pos.x = nx; this.pos.z = nz
        return true
      }
      return false
    }
    if (step.x) tryMove(step.x, 0)
    if (step.z) tryMove(0, step.z)
    // 高度（缓动上台阶）
    const gh = this.groundAt(this.pos.x, this.pos.z)
    this.pos.y += (gh - this.pos.y) * Math.min(1, dt * 10)
    // 行走微起伏
    const moving = this.vel.length() > 0.4
    if (moving) this.walkPhase += dt * this.vel.length() * 3.4
    const bob = moving ? Math.sin(this.walkPhase) * 0.028 : 0
    this.camera.position.set(this.pos.x, this.pos.y + this.eye + bob, this.pos.z)
    this.camera.rotation.set(0, 0, 0)
    this.camera.rotateY(this.yaw)
    this.camera.rotateX(this.pitch)
  }

  dispose() {
    window.removeEventListener('keydown', this._onKey)
    window.removeEventListener('keyup', this._onKey)
    document.removeEventListener('pointerlockchange', this._onLock)
    document.removeEventListener('mousemove', this._onMove)
    this.dom.removeEventListener('click', this._onClick)
    this.orbit.dispose()
  }
}
