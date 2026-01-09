<template>
  <TresGroup>
    <TresMesh :position="[0, -5, 0]" :visible="false">
      <TresBoxGeometry :args="[props.width, 10, props.length]" />
      <TresMeshBasicMaterial color="red" />
    </TresMesh>

    <TresMesh :rotation-x="-Math.PI / 2" :position="[0, 0.02, 0]" :render-order="1" receive-shadow>
      <TresPlaneGeometry :args="[props.width, props.length, 128, 128]" />

      <TresShaderMaterial ref="materialRef" v-bind="shader" transparent :side="THREE.DoubleSide" :depth-write="false"
        :blending="THREE.NormalBlending" />
    </TresMesh>
  </TresGroup>
</template>

<script setup lang="ts">
import { onMounted, shallowRef, ref } from 'vue'
import { useLoop } from '@tresjs/core'
import * as THREE from 'three'
import { useGamePhysics } from '../../composables/useGamePhysics'

const props = defineProps({
  width: { type: Number, default: 100 },
  length: { type: Number, default: 100 },
  playerPos: { type: Object, default: () => new THREE.Vector3() },
  isMoving: { type: Boolean, default: false }
})

// --- 物理初始化 ---
const { world, RAPIER } = useGamePhysics()
onMounted(() => {
  if (!world.value) return
  const groundBody = world.value.createRigidBody(RAPIER.RigidBodyDesc.fixed())
  const colliderDesc = RAPIER.ColliderDesc.cuboid(props.width / 2, 5.0, props.length / 2).setTranslation(0, -5, 0)
  world.value.createCollider(colliderDesc, groundBody)
})

// --- Shader 定义 ---
const shader = {
  uniforms: {
    uTime: { value: 0 },
    uPlayerPos: { value: new THREE.Vector2(0, 0) },
    uMoving: { value: 0.0 },
    uInkColor: { value: new THREE.Color('#111111') } // 纯黑墨色
  },
  vertexShader: `
    varying vec2 vUv;
    varying vec3 vWorldPos;
    void main() {
      vUv = uv;
      vec4 worldPosition = modelMatrix * vec4(position, 1.0);
      vWorldPos = worldPosition.xyz;
      gl_Position = projectionMatrix * viewMatrix * worldPosition;
    }
  `,
  fragmentShader: `
    uniform float uTime;
    uniform vec2 uPlayerPos;
    uniform float uMoving;
    uniform vec3 uInkColor;
    varying vec2 vUv;
    varying vec3 vWorldPos;

    // 伪随机噪声
    float random (in vec2 st) {
        return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
    }
    float noise (in vec2 st) {
        vec2 i = floor(st);
        vec2 f = fract(st);
        float a = random(i);
        float b = random(i + vec2(1.0, 0.0));
        float c = random(i + vec2(0.0, 1.0));
        float d = random(i + vec2(1.0, 1.0));
        vec2 u = f * f * (3.0 - 2.0 * f);
        return mix(a, b, u.x) + (c - a)* u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
    }

    void main() {
      float dist = distance(vWorldPos.xz, uPlayerPos);
      
      // 动态参数：根据移动状态改变波纹频率和速度
      // 跑动时：频率高(密)，速度快；静止时：频率低(疏)，速度慢
      float freq = mix(1.5, 3.0, uMoving); 
      float speed = mix(2.0, 6.0, uMoving);

      // 1. 扭曲距离场：让圆不那么圆，像水墨自然晕开
      float distortedDist = dist - noise(vWorldPos.xz * 0.4 + uTime * 0.1) * 1.2;

      // 2. 正弦波纹 calculation
      // sin(...) 产生 -1 到 1 的波
      float ripple = sin(distortedDist * freq - uTime * speed);

      // 3. 墨迹切割
      // smoothstep 把正弦波切成细细的线条
      // 0.95 -> 1.0 意味着只保留波峰最尖端的一点点，形成锐利的墨线
      float inkLine = smoothstep(0.92, 1.0, ripple);

      // 4. 距离衰减 (Vignette)
      // 离人越远，墨迹越淡，超过 20 米彻底消失
      float mask = clamp(1.0 - dist / 20.0, 0.0, 1.0);
      inkLine *= mask;

      // 5. 脚底墨团 (Puddle)
      // 脚底始终有一团淡淡的墨晕，不随波纹闪烁
      float puddle = smoothstep(2.5, 0.0, dist) * 0.4;

      // 6. 合并墨量
      // 跑动时波纹更明显(uMoving权重高)
      float totalAlpha = max(inkLine * (0.2 + uMoving * 0.8), puddle);

      // 7. 最终输出
      // RGB 是墨色，Alpha 是计算出的墨量
      // 这样没有波纹的地方就是完全透明的，不会遮挡背景
      gl_FragColor = vec4(uInkColor, totalAlpha);
    }
  `
}

// 🔥 获取材质实例的引用
const materialRef = shallowRef()
const { onBeforeRender } = useLoop()
const smoothMove = ref(0)

onBeforeRender(({ elapsed }) => {
  // 🔥 修复不跟随的核心：
  // 必须直接修改 materialRef.value.uniforms，而不是上面的 shader 对象
  if (materialRef.value) {
    const uniforms = materialRef.value.uniforms

    uniforms.uTime.value = elapsed

    // 直接把 props 里的 Vector3 坐标塞进去
    uniforms.uPlayerPos.value.set(props.playerPos.x, props.playerPos.z)

    // 平滑过渡移动状态
    const targetMove = props.isMoving ? 1.0 : 0.0
    smoothMove.value += (targetMove - smoothMove.value) * 0.1
    uniforms.uMoving.value = smoothMove.value
  }
})
</script>