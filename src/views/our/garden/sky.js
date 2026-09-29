// 江南园林场景 - 程序化天空穹顶（昼夜混合、星空、月亮）+ PMREM 环境贴图
import * as THREE from 'three'

const skyVert = /* glsl */`
varying vec3 vDir;
void main() {
  vDir = normalize(position);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`

const skyFrag = /* glsl */`
varying vec3 vDir;
uniform float uNight;          // 0 白昼 -> 1 深夜
uniform vec3 uDayTop, uDayHor, uNightTop, uNightHor;
uniform vec3 uSunDir, uMoonDir;
uniform float uOvercast;       // 阴雨云量
uniform float uTime;

float hash(vec3 p){ p = fract(p*0.3183099+vec3(0.1,0.2,0.3)); p*=17.0; return fract(p.x*p.y*p.z*(p.x+p.y+p.z)); }

void main() {
  vec3 dir = normalize(vDir);
  float h = clamp(dir.y, -0.05, 1.0);

  // 昼夜两组底色插值
  vec3 dayCol = mix(uDayHor, uDayTop, pow(max(h, 0.0), 0.62));
  vec3 nightCol = mix(uNightHor, uNightTop, pow(max(h, 0.0), 0.55));
  vec3 col = mix(dayCol, nightCol, uNight);

  // 太阳（阴天弱化成亮斑）
  float sd = max(dot(dir, normalize(uSunDir)), 0.0);
  float sunGlow = pow(sd, 12.0) * 0.5 + pow(sd, 90.0) * 1.2;
  col += vec3(1.0, 0.92, 0.8) * sunGlow * (1.0 - uNight) * (1.0 - uOvercast * 0.85);

  // 月亮与晕
  float md = max(dot(dir, normalize(uMoonDir)), 0.0);
  float moonDisc = smoothstep(0.9993, 0.99965, md);
  float moonHalo = pow(md, 220.0) * 0.5 + pow(md, 28.0) * 0.12;
  col += vec3(0.92, 0.96, 1.0) * (moonDisc * 3.4 + moonHalo) * uNight;

  // 星空（夜）
  if (uNight > 0.01 && dir.y > 0.0) {
    vec3 sp = floor(dir * 220.0);
    float star = hash(sp);
    float tw = 0.75 + 0.25 * sin(uTime * 2.0 + star * 40.0);
    float s = smoothstep(0.9975, 1.0, star) * tw * uNight * (1.0 - uOvercast * 0.6);
    col += vec3(0.85, 0.9, 1.0) * s * 2.4 * smoothstep(0.0, 0.25, dir.y);
  }

  // 低层云带（细雨阴天，多层噪声近似）
  float cl = 0.0;
  float a1 = sin(dir.x * 4.0 + uTime * 0.02) * sin(dir.z * 3.0 - uTime * 0.014) * 0.5 + 0.5;
  float a2 = sin(dir.x * 9.0 - uTime * 0.03 + 2.0) * sin(dir.z * 7.0 + 1.0) * 0.5 + 0.5;
  cl = a1 * 0.6 + a2 * 0.4;
  cl = smoothstep(0.35, 0.9, cl) * smoothstep(0.0, 0.3, dir.y);
  vec3 cloudDay = mix(vec3(0.52, 0.56, 0.60), vec3(0.86, 0.88, 0.90), cl);
  vec3 cloudNight = mix(vec3(0.05, 0.07, 0.10), vec3(0.12, 0.15, 0.19), cl);
  col = mix(col, mix(cloudDay, cloudNight, uNight), cl * uOvercast * 0.85);

  gl_FragColor = vec4(col, 1.0);
}
`

export class SkySystem {
  constructor(scene) {
    this.uniforms = {
      uNight: { value: 0 },
      uDayTop: { value: new THREE.Color(0x55738e) },
      uDayHor: { value: new THREE.Color(0x9dadab) },
      uNightTop: { value: new THREE.Color(0x060a14) },
      uNightHor: { value: new THREE.Color(0x1c2735) },
      uSunDir: { value: new THREE.Vector3(0.4, 0.5, 0.6) },
      uMoonDir: { value: new THREE.Vector3(-0.4, 0.6, -0.3) },
      uOvercast: { value: 0.85 },
      uTime: { value: 0 },
    }
    const geo = new THREE.SphereGeometry(300, 32, 20)
    const mat = new THREE.ShaderMaterial({
      vertexShader: skyVert, fragmentShader: skyFrag,
      uniforms: this.uniforms, side: THREE.BackSide, depthWrite: false, fog: false,
    })
    this.dome = new THREE.Mesh(geo, mat)
    this.dome.frustumCulled = false
    scene.add(this.dome)

    // 用于 PMREM 的小型环境场景
    this.envScene = new THREE.Scene()
    this.envDome = new THREE.Mesh(geo.clone(), mat.clone())
    this.envDome.material.uniforms = this.uniforms // 共享 uniforms
    this.envScene.add(this.envDome)
    // 环境场景里给一点地面反照率
    const gnd = new THREE.Mesh(
      new THREE.SphereGeometry(290, 16, 8, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2),
      new THREE.MeshBasicMaterial({ color: 0x4a4c46 })
    )
    this.envScene.add(gnd)
  }

  update(t, time) {
    this.uniforms.uNight.value = t
    this.uniforms.uTime.value = time
  }
}

export function buildEnvironment(renderer, skySystem) {
  const pmrem = new THREE.PMREMGenerator(renderer)
  const rt = pmrem.fromScene(skySystem.envScene, 0.04)
  const tex = rt.texture
  pmrem.dispose()
  return tex
}
