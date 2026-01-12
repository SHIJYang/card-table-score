<!-- 这是一个独立的波纹对象。它出生时记录了坐标，然后自己播放扩散动画，结束后通知父组件销毁自己 -->

<template>
  <TresMesh :rotation-x="-Math.PI / 2" :position="[position.x, 0.03, position.z]" :render-order="2">
    <TresPlaneGeometry :args="[4, 4, 32, 32]" />
    <TresShaderMaterial ref="materialRef" v-bind="shader" transparent :depth-write="false"
      :blending="THREE.NormalBlending" :side="THREE.DoubleSide" />
  </TresMesh>
</template>

<script setup lang="ts">
import { useLoop } from '@tresjs/core'
import { shallowRef, onUnmounted } from 'vue'
import * as THREE from 'three'

const props = defineProps<{
  position: { x: number, z: number }, // 波纹生成的绝对坐标
  id: number // 唯一标识符，用于销毁
}>()

const emit = defineEmits(['expire'])

const materialRef = shallowRef()
const lifeTime = 3.0 // 波纹存活时间 (秒)
let age = 0

// --- 单个波纹的 Shader ---
const shader = {
  uniforms: {
    uAge: { value: 0 },         // 当前年龄
    uLifeTime: { value: lifeTime }, // 总寿命
    uColor: { value: new THREE.Color('#111111') }
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform float uAge;
    uniform float uLifeTime;
    uniform vec3 uColor;
    varying vec2 vUv;

    // 简单的噪声函数
    float random(vec2 st) { return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123); }
    float noise(vec2 st) {
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
      // 归一化生命周期 (0.0 -> 1.0)
      float progress = uAge / uLifeTime;
      
      // 以中心为原点 (0.5, 0.5)
      float dist = distance(vUv, vec2(0.5));

      // 1. 动态扩散半径
      // 半径随时间从 0.0 变大到 0.5
      float currentRadius = progress * 0.45;

      // 2. 扭曲边缘 (墨韵)
      float noiseVal = noise(vUv * 10.0 + uAge);
      float distortedDist = dist - noiseVal * 0.05;

      // 3. 绘制圆环
      // 只有在 currentRadius 附近的像素才显示
      float width = 0.05; // 线条宽度
      float ring = smoothstep(currentRadius, currentRadius - 0.01, distortedDist) 
                 - smoothstep(currentRadius - width, currentRadius - width - 0.01, distortedDist);

      // 4. 透明度衰减
      // 随着时间推移，整体越来越淡
      float fade = 1.0 - progress; // 线性淡出
      
      // 边缘羽化
      float alpha = ring * fade * 0.8;

      if (alpha < 0.01) discard; // 优化性能

      gl_FragColor = vec4(uColor, alpha);
    }
  `
}

const { onBeforeRender } = useLoop()

onBeforeRender(({ delta }) => {
  if (!materialRef.value) return

  age += delta
  materialRef.value.uniforms.uAge.value = age

  // 如果寿命到了，通知父组件销毁我
  if (age >= lifeTime) {
    emit('expire', props.id)
  }
})
</script>