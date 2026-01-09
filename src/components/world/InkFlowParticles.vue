<template>
  <TresPoints>
    <TresBufferGeometry>
      <TresBufferAttribute ref="attributeRef" attach="attributes-position" :count="count" :array="positions"
        :item-size="3" :usage="THREE.DynamicDrawUsage" />
    </TresBufferGeometry>

    <TresPointsMaterial :color="0x000000" :alpha-map="circleTexture" :size="0.25" :opacity="0.8" transparent
      :size-attenuation="true" :depth-write="false" />
  </TresPoints>
</template>

<script setup lang="ts">
import { shallowRef } from 'vue'
import { useLoop } from '@tresjs/core'
import * as THREE from 'three'

// --- 新增：动态生成圆形渐变纹理 ---
// 这能让粒子边缘柔和，看起来像宣纸上晕开的墨点
function createCircleTexture() {
  const size = 64; // 纹理分辨率
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext('2d')!;

  // 创建径向渐变：中心白 -> 边缘透明
  const center = size / 2;
  const gradient = context.createRadialGradient(center, center, 0, center, center, center);
  gradient.addColorStop(0.1, 'rgba(255,255,255,1)');   // 中心实心
  gradient.addColorStop(0.5, 'rgba(255,255,255,0.5)'); // 中间过渡
  gradient.addColorStop(1, 'rgba(255,255,255,0)');     // 边缘透明

  context.fillStyle = gradient;
  context.fillRect(0, 0, size, size);

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

const circleTexture = createCircleTexture();

// --- 以下流场逻辑保持不变 ---
function pseudoNoise3D(x: number, y: number, z: number) {
  return Math.sin(x) * Math.cos(y) * Math.sin(z + x * 0.5);
}

const count = 1500
const range = 40
const positions = new Float32Array(count * 3)
const origins = new Float32Array(count * 3)
const speeds = new Float32Array(count)

for (let i = 0; i < count; i++) {
  const i3 = i * 3
  const x = (Math.random() - 0.5) * range
  const y = (Math.random() - 0.5) * 12 + 6
  const z = (Math.random() - 0.5) * range
  positions[i3] = x; positions[i3 + 1] = y; positions[i3 + 2] = z;
  origins[i3] = x; origins[i3 + 1] = y; origins[i3 + 2] = z;
  speeds[i] = 0.2 + Math.random() * 0.5
}

const attributeRef = shallowRef()
const { onBeforeRender } = useLoop()

onBeforeRender(({ elapsed }) => {
  if (!attributeRef.value) return
  const currentPositions = attributeRef.value.array
  const time = elapsed * 0.15 // 稍微减慢速度，让墨点漂浮更稳重

  for (let i = 0; i < count; i++) {
    const i3 = i * 3
    let x = currentPositions[i3]
    let y = currentPositions[i3 + 1]
    let z = currentPositions[i3 + 2]

    const noiseX = pseudoNoise3D(x * 0.08, y * 0.08, time)
    const noiseY = pseudoNoise3D(x * 0.08 + 100, z * 0.08, time)
    const noiseZ = pseudoNoise3D(z * 0.08, y * 0.08 + 100, time)

    x += Math.cos(noiseX * Math.PI) * 0.04 * speeds[i]
    y += Math.sin(noiseY * Math.PI) * 0.015 * speeds[i]
    z += Math.sin(noiseZ * Math.PI) * 0.04 * speeds[i]

    const dist = Math.sqrt(x * x + z * z)
    if (dist > range / 1.5 || y < 0 || y > 18) {
      x = origins[i3] + (Math.random() - 0.5) * 5
      y = origins[i3 + 1] + (Math.random() - 0.5) * 5
      z = origins[i3 + 2] + (Math.random() - 0.5) * 5
    }
    currentPositions[i3] = x; currentPositions[i3 + 1] = y; currentPositions[i3 + 2] = z;
  }
  attributeRef.value.needsUpdate = true
})
</script>