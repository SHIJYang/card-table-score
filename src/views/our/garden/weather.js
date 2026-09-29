// 江南园林场景 - 天气氛围：细雨 / 檐滴 / 轻雾 / 炉烟
import * as THREE from 'three'
import { rng } from './util'

// ===== 雨丝 =====
export function makeRain(M) {
  const W = 64, H = 24, D = 56
  const COUNT = 3400
  const pos = new Float32Array(COUNT * 3)
  const spd = new Float32Array(COUNT)
  const R = rng(9)
  for (let i = 0; i < COUNT; i++) {
    pos[i * 3] = R.f(-W / 2, W / 2)
    pos[i * 3 + 1] = R.f(0, H)
    pos[i * 3 + 2] = R.f(-2 - D / 2, -2 + D / 2)
    spd[i] = R.f(13, 19)
  }
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3))
  g.setAttribute('aSpeed', new THREE.BufferAttribute(spd, 1))
  const mat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false,
    uniforms: { uTime: { value: 0 }, uH: { value: H }, uMap: { value: M.tex.streak }, uOpacity: { value: 0.6 } },
    vertexShader: /* glsl */`
      attribute float aSpeed;
      uniform float uTime; uniform float uH;
      varying float vY;
      void main() {
        vec3 p = position;
        float y = mod(p.y - uTime * aSpeed, uH);
        p.y = y;
        p.x += (uH - y) * 0.045;
        vY = y / uH;
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_Position = projectionMatrix * mv;
        gl_PointSize = (52.0 * aSpeed / 16.0) / -mv.z * 2.6;
      }`,
    fragmentShader: /* glsl */`
      uniform sampler2D uMap; uniform float uOpacity;
      varying float vY;
      void main() {
        vec4 c = texture2D(uMap, gl_PointCoord);
        gl_FragColor = vec4(c.rgb, c.a * uOpacity * (0.35 + 0.65 * vY));
      }`,
  })
  const pts = new THREE.Points(g, mat)
  pts.position.set(0, 0, -2)
  pts.frustumCulled = false
  return { obj: pts, mat }
}

// ===== 檐口滴水（CPU 粒子池） =====
export function makeDrips(emitters) {
  const MAX = 90
  const g = new THREE.BufferGeometry()
  const pos = new Float32Array(MAX * 3)
  for (let i = 0; i < MAX; i++) pos[i * 3 + 1] = -50
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3))
  const mat = new THREE.PointsMaterial({ color: 0xcfe0e8, size: 0.05, transparent: true, opacity: 0.7, depthWrite: false })
  const pts = new THREE.Points(g, mat)
  pts.frustumCulled = false
  const drops = Array.from({ length: MAX }, () => ({ live: false, x: 0, y: 0, z: 0, vy: 0 }))
  const R = rng(10)
  let spawnAcc = 0
  function update(dt, groundY = 0) {
    spawnAcc += dt * 26
    while (spawnAcc > 1) {
      spawnAcc -= 1
      const d = drops.find((d) => !d.live)
      if (d && emitters.length) {
        const e = emitters[Math.floor(R.r() * emitters.length)]
        d.live = true
        d.x = e.x + R.f(-0.03, 0.03)
        d.y = e.y
        d.z = e.z + R.f(-0.03, 0.03)
        d.vy = R.f(-0.4, -0.1)
      }
    }
    for (let i = 0; i < MAX; i++) {
      const d = drops[i]
      if (!d.live) continue
      d.vy -= dt * 7.5
      d.y += d.vy * dt
      if (d.y < groundY - 0.1) {
        d.live = false
        pos[i * 3 + 1] = -50
        continue
      }
      pos[i * 3] = d.x; pos[i * 3 + 1] = d.y; pos[i * 3 + 2] = d.z
    }
    g.attributes.position.needsUpdate = true
  }
  return { obj: pts, update }
}

// ===== 轻雾（水汽 billboard，贴地低矮） =====
export function makeMist(M) {
  const R = rng(11)
  const spots = [
    [10.5, 8.0, 6.5, 0.09], [14.0, 6.8, 7.5, 0.07], [8.4, 10.2, 6.0, 0.08],
    [4.8, 3.6, 6.0, 0.04], [-8.5, -2.5, 7.0, 0.05],
    [-14.0, -10.5, 6.5, 0.07], [12.5, -5.5, 6.5, 0.04], [15.5, 9.5, 6.0, 0.06],
    [-15.5, 4.0, 7.0, 0.06], [7.2, 6.8, 5.5, 0.07],
  ]
  const group = new THREE.Group()
  const items = []
  const NIGHT_MIST = new THREE.Color(0x232e3a)
  for (const [x, z, s, op] of spots) {
    const m = new THREE.Mesh(
      new THREE.PlaneGeometry(s, s * 0.3),
      new THREE.MeshBasicMaterial({ map: M.tex.smoke, transparent: true, opacity: op, depthWrite: false, color: 0xdfe6ea })
    )
    m.position.set(x, R.f(0.35, 0.75), z)
    m.renderOrder = 5
    group.add(m)
    items.push({ m, base: op, phase: R.f(Math.PI * 2), speed: R.f(0.04, 0.1) })
  }
  function update(t, camera, night = 0) {
    for (const it of items) {
      it.m.rotation.y = Math.atan2(camera.position.x - it.m.position.x, camera.position.z - it.m.position.z)
      it.m.material.color.setHex(0xdfe6ea).lerp(NIGHT_MIST, night)
      it.m.material.opacity = it.base * (0.72 + 0.28 * Math.sin(t * 0.3 + it.phase))
      it.m.position.x += Math.sin(t * it.speed + it.phase) * 0.001
    }
  }
  return { obj: group, update }
}

// ===== 炉烟 =====
export function makeIncense(censers) {
  const perCenser = 26
  const total = censers.length * perCenser
  const pos = new Float32Array(total * 3)
  const aux = new Float32Array(total * 2) // age, seed
  for (let i = 0; i < total; i++) {
    aux[i * 2] = Math.random() * 8      // age
    aux[i * 2 + 1] = Math.random() * 10 // seed
    pos[i * 3 + 1] = 999
  }
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3))
  g.setAttribute('aAux', new THREE.BufferAttribute(aux, 2))
  const mat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false,
    uniforms: { uMap: { value: null }, uOpacity: { value: 0.35 } },
    vertexShader: /* glsl */`
      attribute vec2 aAux;
      varying float vFade;
      uniform float uOpacity;
      void main() {
        vec3 p = position;
        float age = aAux.x;
        p.x += sin(age * 1.8 + aAux.y) * age * 0.035;
        p.z += cos(age * 1.4 + aAux.y * 2.0) * age * 0.03;
        p.y = aAux.y * 0.0 + p.y;
        vFade = clamp(1.0 - age / 8.0, 0.0, 1.0);
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_Position = projectionMatrix * mv;
        gl_PointSize = (10.0 + age * 9.0) / -mv.z * 3.0;
      }`,
    fragmentShader: /* glsl */`
      uniform sampler2D uMap; uniform float uOpacity;
      varying float vFade;
      void main() {
        float a = texture2D(uMap, gl_PointCoord).a;
        gl_FragColor = vec4(vec3(0.92, 0.92, 0.9), a * vFade * uOpacity * 0.4);
      }`,
  })
  const pts = new THREE.Points(g, mat)
  pts.frustumCulled = false
  const items = []
  const R = rng(12)
  for (let c = 0; c < censers.length; c++) {
    for (let k = 0; k < perCenser; k++) {
      const i = c * perCenser + k
      items.push({ i, c: censers[c], age: R.f(0, 8), seed: aux[i * 2 + 1] })
    }
  }
  function update(dt) {
    for (const it of items) {
      it.age += dt * 0.9
      if (it.age > 8) {
        it.age = 0
        pos[it.i * 3] = it.c.x + (Math.random() - 0.5) * 0.04
        pos[it.i * 3 + 1] = it.c.y
        pos[it.i * 3 + 2] = it.c.z + (Math.random() - 0.5) * 0.04
      }
      pos[it.i * 3 + 1] = it.c.y + it.age * 0.16
      aux[it.i * 2] = it.age
    }
    g.attributes.position.needsUpdate = true
    g.attributes.aAux.needsUpdate = true
  }
  return { obj: pts, mat, update }
}
