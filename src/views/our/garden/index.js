// 江南园林场景 - 引擎组装：渲染器/后期/昼夜/建筑/植物/天气/相机总调度
import * as THREE from 'three'
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js'
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js'

import { buildMaterials, windUniforms } from './materials'
import { SkySystem, buildEnvironment } from './sky'
import { DayNightSystem } from './daynight'
import { WorldCtx, clamp } from './util'
import { buildMainHall, buildPavilion, buildCorridor, buildBridge, buildWalls } from './structure'
import { buildFurnishings, lanternMesh } from './furniture'
import { buildPlants } from './plants'
import { buildTerrain, POND_POLY, POND } from './terrain'
import { makeRain, makeDrips, makeMist, makeIncense } from './weather'
import { CameraRig } from './controls'

export class GardenEngine {
  constructor(container) {
    this.container = container
    this.disposed = false
    this.clock = new THREE.Clock()
    this.time = 0

    // ---- 渲染器 ----
    const renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: 'high-performance' })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75))
    renderer.setSize(container.clientWidth, container.clientHeight)
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    container.appendChild(renderer.domElement)
    this.renderer = renderer

    // ---- 场景 ----
    const scene = new THREE.Scene()
    this.scene = scene

    // ---- 天空 / 昼夜 ----
    this.sky = new SkySystem(scene)
    this.daynight = new DayNightSystem(scene, this.sky, renderer)

    // ---- 材质 ----
    this.M = buildMaterials()

    // ---- 世界上下文（碰撞） ----
    this.ctx = new WorldCtx()

    // ---- 建筑 ----
    const hall = buildMainHall(this.ctx, this.M)
    scene.add(hall.group)
    const pavilion = buildPavilion(this.ctx, this.M)
    scene.add(pavilion.group)
    const corridor = buildCorridor(this.ctx, this.M)
    scene.add(corridor.group)
    scene.add(buildBridge(this.ctx, this.M))
    scene.add(buildWalls(this.ctx, this.M))

    // ---- 地形与水体 ----
    this.terrain = buildTerrain(this.ctx, this.M, scene)
    scene.add(this.terrain.group)

    // ---- 陈设 ----
    const fur = buildFurnishings(this.ctx, this.M)
    scene.add(fur.group)
    this.flames = fur.flames
    this.incense = makeIncense(fur.censers)
    this.incense.mat.uniforms.uMap.value = this.M.tex.smoke
    scene.add(this.incense.obj)

    // ---- 植物 ----
    const plants = buildPlants(this.ctx, this.M, POND_POLY)
    scene.add(plants.group)

    // ---- 天气 ----
    this.rain = makeRain(this.M)
    scene.add(this.rain.obj)
    this.drips = makeDrips([...hall.dripPts, ...pavilion.dripPts, ...corridor.dripPts])
    scene.add(this.drips.obj)
    this.mist = makeMist(this.M)
    scene.add(this.mist.obj)

    // ---- 灯笼与室内灯 ----
    this.hangLanterns(scene, hall, pavilion, corridor)
    this.placeInteriorLights()

    // ---- 相机 ----
    this.rig = new CameraRig(new THREE.PerspectiveCamera(52, container.clientWidth / container.clientHeight, 0.1, 400), renderer.domElement, this.ctx, POND_POLY)
    this.camera = this.rig.camera
    scene.add(this.camera)

    // ---- 后期 ----
    const size = new THREE.Vector2()
    renderer.getSize(size)
    const rt = new THREE.WebGLRenderTarget(size.x * renderer.getPixelRatio(), size.y * renderer.getPixelRatio(), { samples: 4, type: THREE.HalfFloatType })
    this.composer = new EffectComposer(renderer, rt)
    this.composer.addPass(new RenderPass(scene, this.camera))
    this.bloom = new UnrealBloomPass(size, 0.08, 0.4, 0.9)
    this.composer.addPass(this.bloom)
    this.composer.addPass(new OutputPass())

    // ---- 事件 ----
    this._onResize = () => {
      const w = container.clientWidth, h = container.clientHeight
      this.camera.aspect = w / h
      this.camera.updateProjectionMatrix()
      renderer.setSize(w, h)
      this.composer.setSize(w, h)
    }
    window.addEventListener('resize', this._onResize)

    this._animate()
    window.__THREE = THREE
    // 页面不可见时 rAF 会暂停：用低频定时器兜底保持画面活着
    this._lastRaf = performance.now()
    this._bgTimer = setInterval(() => {
      if (document.hidden && performance.now() - this._lastRaf > 900) {
        this._frame()
        this._lastRaf = performance.now()
      }
    }, 500)
  }

  hangLanterns(scene, hall, pavilion, corridor) {
    const slots = [
      ...[[-3.55, 2.9, -2.32], [3.55, 2.9, -2.32]].map(([x, y, z]) => ({ p: new THREE.Vector3(x, y, z), s: 1.7 })),
      ...corridor.lanternSlots.map((p) => ({ p, s: 1.15 })),
      ...pavilion.lanternSlots.map((p) => ({ p, s: 1.35 })),
    ]
    for (const s of slots) {
      const l = lanternMesh(this.M, s.s)
      l.position.copy(s.p)
      scene.add(l)
      // 部分灯笼挂点灯
      if (s.s > 1.3) {
        const light = this.daynight.addInteriorLight(0, s.s === 1.7 ? 7 : 2.5, 0xffb46e)
        light.position.copy(s.p).y -= 0.1
        light.distance = 8
      }
    }
  }

  placeInteriorLights() {
    const L = (x, y, z, day = 0.7, night, dist = 10) => {
      const l = this.daynight.addInteriorLight(day, night, 0xffd2a0)
      l.position.set(x, y, z)
      l.distance = dist
      return l
    }
    this.roomLights = [
      L(0, 3.0, -4.7, 4.0, 15),      // 堂屋
      L(-4.9, 2.5, -4.7, 2.6, 8),    // 书房
      L(4.6, 2.5, -4.6, 2.6, 8),     // 茶室
      L(-4.8, 2.2, -8.9, 1.8, 4.5),  // 卧房
      L(4.7, 2.2, -8.9, 1.8, 4.5),   // 藏书间
      L(0, 2.3, -9.0, 2.0, 5.5),     // 过厅
    ]
    // 窗纸/灯笼纸自发光
    this.daynight.addEmissive(this.M.paper, 0, 1.35)
    this.daynight.addEmissive(this.M.lanternGlow, 0, 2.6)
  }

  setDayNight(t) { this.daynight.setTarget(t) }
  get dayNight() { return this.daynight.target }
  setViewMode(m) { this.rig.setMode(m) }
  resetView() { this.rig.resetView() }
  get viewMode() { return this.rig.mode }

  _animate() {
    if (this.disposed) return
    this._raf = requestAnimationFrame(() => this._animate())
    this._lastRaf = performance.now()
    this._frame()
  }

  _frame() {
    if (this.disposed) return
    const dt = Math.min(0.05, this.clock.getDelta())
    this.time += dt

    windUniforms.uTime.value = this.time
    windUniforms.uWind.value = 0.5 + Math.sin(this.time * 0.23) * 0.25 + Math.sin(this.time * 0.07) * 0.2

    // 昼夜推进
    const t = this.daynight.update(dt, this.time)
    this.daynight.refreshEnv(this.renderer, () => buildEnvironment(this.renderer, this.sky), this.bloom)

    // 水面
    const w = this.terrain.water
    w.material.uniforms.time.value += dt * 0.55
    w.material.uniforms.sunDirection.value.copy(this.daynight.sun.position).normalize()
    w.material.uniforms.sunColor.value.setHex(0x7a8088).lerp(new THREE.Color(0x50648a), t)
    w.material.uniforms.waterColor.value.setHex(0x1f2f27).lerp(new THREE.Color(0x0c141c), t)
    w.material.uniforms.distortionScale.value = 2.4

    // 雨与雾
    this.rain.mat.uniforms.uTime.value = this.time
    this.rain.mat.uniforms.uOpacity.value = 0.5
    this.drips.update(dt, 0)
    this.mist.update(this.time, this.camera, t)
    this.incense.update(dt)

    // 烛焰闪烁（克制）
    for (let i = 0; i < this.flames.length; i++) {
      const f = this.flames[i]
      if (!f) continue
      const n = Math.sin(this.time * 9 + i * 2.1) * 0.5 + Math.sin(this.time * 23 + i) * 0.3
      f.material.opacity = 0.75 + n * 0.12
      f.scale.set(0.07 + n * 0.006, 0.12 + n * 0.014, 1)
    }
    // 室内灯光微微摇曳
    if (t > 0.05) {
      const fl = 1 + Math.sin(this.time * 7.3) * 0.03 + Math.sin(this.time * 13.7) * 0.02
      for (const l of this.daynight.interiorLights) l.light.intensity *= (t > 0.5 ? fl : 1)
    }

    // 锦鲤
    for (const k of this.terrain.koi) {
      const a = this.time * k.speed * 0.5 + k.phase
      const x = k.cx + Math.cos(a) * k.r
      const z = k.cz + Math.sin(a * 0.8) * k.r * 0.7
      k.obj.position.set(x, k.depth, z)
      k.obj.rotation.y = -a + Math.PI / 2 + Math.sin(a * 3) * 0.2
      k.obj.rotation.z = Math.sin(this.time * 4 + k.phase) * 0.15
    }

    this.rig.update(dt)
    this.composer.render()
  }

  dispose() {
    this.disposed = true
    cancelAnimationFrame(this._raf)
    clearInterval(this._bgTimer)
    window.removeEventListener('resize', this._onResize)
    this.rig.dispose()
    this.renderer.dispose()
    this.container.removeChild(this.renderer.domElement)
    this.scene.traverse((o) => {
      if (o.geometry) o.geometry.dispose()
    })
  }
}
