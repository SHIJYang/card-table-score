// 江南园林场景 - 昼夜氛围系统：连续过渡驱动天空/雾/光/自发光/后期
import * as THREE from 'three'
import { clamp, lerp, smoothstep } from './util'

const DAY = {
  fog: 0xa4afae, fogDensity: 0.0125,
  sun: 0xcdd5da, sunI: 1.9,
  hemiSky: 0xa8b6c2, hemiGnd: 0x5d6053, hemiI: 0.85,
  ambient: 0.1,
  envInt: 0.6,
  exposure: 1.05,
  bloom: 0.08,
  overcast: 0.85,
}
const NIGHT = {
  fog: 0x0d1420, fogDensity: 0.019,
  sun: 0x6d84ad, sunI: 1.0,
  hemiSky: 0x1c2b3a, hemiGnd: 0x070a0e, hemiI: 0.38,
  ambient: 0.03,
  envInt: 0.38,
  exposure: 1.0,
  bloom: 0.5,
  overcast: 0.55,
}

export class DayNightSystem {
  constructor(scene, sky, renderer) {
    this.scene = scene
    this.sky = sky
    this.renderer = renderer
    this.t = 0            // 当前 0=昼 1=夜
    this.target = 0
    this.speed = 0.22     // 每秒过渡量

    this.sun = new THREE.DirectionalLight(DAY.sun, DAY.sunI)
    this.sun.castShadow = true
    this.sun.shadow.mapSize.set(2048, 2048)
    const c = this.sun.shadow.camera
    c.left = -26; c.right = 26; c.top = 22; c.bottom = -18; c.near = 2; c.far = 90
    this.sun.shadow.bias = -0.0004
    this.sun.shadow.normalBias = 0.04
    this.sun.position.set(14, 22, 16)
    scene.add(this.sun)
    scene.add(this.sun.target)
    this.sun.target.position.set(0, 1, -4)

    this.hemi = new THREE.HemisphereLight(DAY.hemiSky, DAY.hemiGnd, DAY.hemiI)
    scene.add(this.hemi)
    this.amb = new THREE.AmbientLight(0xffffff, DAY.ambient)
    scene.add(this.amb)

    scene.fog = new THREE.FogExp2(DAY.fog, DAY.fogDensity)

    // 需要随昼夜变化的注册项
    this.interiorLights = []  // {light, day, night, color}
    this.emissives = []       // {mat, day, night}
    this.envDirty = true
    this._lastEnvT = -1
    this._envTex = null
  }

  addInteriorLight(day, night, color = 0xffa050) {
    const light = new THREE.PointLight(color, 0, 9, 2)
    this.interiorLights.push({ light, day, night, color })
    this.scene.add(light)
    return light
  }

  addEmissive(mat, day = 0, night = 1) {
    this.emissives.push({ mat, day, night })
  }

  setTarget(v) { this.target = clamp(v, 0, 1) }
  toggle() { this.setTarget(this.target > 0.5 ? 0 : 1) }

  update(dt, time) {
    // 平滑过渡（缓动）
    const diff = this.target - this.t
    if (Math.abs(diff) > 0.0004) {
      this.t += Math.sign(diff) * Math.min(Math.abs(diff), this.speed * dt * (0.35 + 0.65 * smoothstep(0, 1, 1 - Math.abs(diff))))
      this.envDirty = true
    }
    const t = this.t
    const dayF = 1 - t

    // 颜色/强度插值
    const fogC = new THREE.Color(DAY.fog).lerp(new THREE.Color(NIGHT.fog), t)
    this.scene.fog.color.copy(fogC)
    this.scene.fog.density = lerp(DAY.fogDensity, NIGHT.fogDensity, t)

    const sunC = new THREE.Color(DAY.sun).lerp(new THREE.Color(NIGHT.sun), t)
    this.sun.color.copy(sunC)
    this.sun.intensity = lerp(DAY.sunI, NIGHT.sunI, t)

    // 太阳/月亮方位同步给天空与阴影
    const sunEl = lerp(0.42, 0.55, t)
    const sunAz = lerp(0.9, -2.2, t)
    const dir = new THREE.Vector3(Math.cos(sunAz) * Math.cos(sunEl), Math.sin(sunEl), Math.sin(sunAz) * Math.cos(sunEl)).normalize()
    this.sun.position.copy(dir).multiplyScalar(40).add(this.sun.target.position)
    this.sky.uniforms.uSunDir.value.copy(dir)
    const moonDir = new THREE.Vector3(-Math.cos(1.1) * 0.7, 0.62, -Math.sin(1.1) * 0.7).normalize()
    this.sky.uniforms.uMoonDir.value.copy(moonDir)
    this.sky.uniforms.uOvercast.value = lerp(DAY.overcast, NIGHT.overcast, t)
    this.sky.update(t, time)

    this.hemi.color.set(DAY.hemiSky).lerp(new THREE.Color(NIGHT.hemiSky), t)
    this.hemi.groundColor.set(DAY.hemiGnd).lerp(new THREE.Color(NIGHT.hemiGnd), t)
    this.hemi.intensity = lerp(DAY.hemiI, NIGHT.hemiI, t)
    this.amb.intensity = lerp(DAY.ambient, NIGHT.ambient, t)
    this.scene.environmentIntensity = lerp(DAY.envInt, NIGHT.envInt, t)

    this.renderer.toneMappingExposure = lerp(DAY.exposure, NIGHT.exposure, t)

    // 室内灯与自发光
    for (const it of this.interiorLights) it.light.intensity = lerp(it.day, it.night, t)
    for (const em of this.emissives) em.mat.emissiveIntensity = lerp(em.day, em.night, t)

    // 烛焰在白天几乎不可见
    return t
  }

  // PMREM 环境贴图（过渡期间节流重建）
  refreshEnv(renderer, tex, bloomPass) {
    if (this.envDirty && Math.abs(this.t - this._lastEnvT) > 0.08) {
      this._lastEnvT = this.t
      if (this._envTex) this._envTex.dispose()
      this._envTex = tex()
      this.scene.environment = this._envTex
      this.envDirty = this.target !== this.t
    }
    if (bloomPass) bloomPass.strength = lerp(DAY.bloom, NIGHT.bloom, this.t)
  }
}
