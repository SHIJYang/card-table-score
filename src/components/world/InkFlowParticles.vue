<template>
  <TresPoints>
    <TresBufferGeometry>
      <TresBufferAttribute ref="positionAttrRef" attach="attributes-position" :count="count" :array="positions"
        :item-size="3" :usage="THREE.DynamicDrawUsage" />
    </TresBufferGeometry>

    <TresPointsMaterial :color="0x000000" :alpha-map="circleTexture" :size="0.6" :opacity="0.5" transparent
      :size-attenuation="true" :depth-write="false" :blending="THREE.NormalBlending" />
  </TresPoints>
</template>

<script setup lang="ts">
import { shallowRef } from 'vue'
import { useLoop } from '@tresjs/core'
import * as THREE from 'three'

// --- 1. 纹理生成 (稳的代码不动它) ---
function createCircleTexture() {
  const size = 48;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext('2d')!; // 加上 ! 防止 TS 报错
  const center = size / 2;
  const gradient = context.createRadialGradient(center, center, 0, center, center, center);
  gradient.addColorStop(0.2, 'rgba(255,255,255,1)');
  gradient.addColorStop(1, 'rgba(255,255,255,0)');
  context.fillStyle = gradient;
  context.fillRect(0, 0, size, size);
  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}
const circleTexture = createCircleTexture();

// --- 2. 简化的 3D 噪声 ---
// 稍微加一点扭曲，防止直线运动
function getFlowVector(x: number, y: number, z: number, time: number) {
  const scale = 0.08
  // 简单的三角函数模拟涡流
  const vx = Math.sin(y * scale + time)
  const vy = Math.cos(x * scale * 0.5 + time) * 0.3 // Y轴运动弱一点
  const vz = Math.sin(x * scale + z * scale + time)
  return { x: vx, y: vy, z: vz }
}

// --- 3. 初始化数据 ---
const count = 900
const range = 50
const heightRange = 15

const positions = new Float32Array(count * 3)
const lives = new Float32Array(count)     // 当前寿命
const maxLives = new Float32Array(count)  // 总寿命 (死期)
const speeds = new Float32Array(count)    // 速度因子

// 重置粒子的函数 (防聚集的核心)
const respawn = (i: number) => {
  const i3 = i * 3
  // 随机出现在场景任意位置 (而不是回到原点)
  positions[i3] = (Math.random() - 0.5) * range
  positions[i3 + 1] = (Math.random() - 0.5) * heightRange + 6 // 高度 6~21
  positions[i3 + 2] = (Math.random() - 0.5) * range

  // 随机分配寿命 2~6秒
  lives[i] = 0
  maxLives[i] = 2 + Math.random() * 4
  speeds[i] = 0.5 + Math.random() * 0.5
}

// 初始化
for (let i = 0; i < count; i++) {
  respawn(i)
  // 预热：让大家的初始状态错开，不要一起死
  lives[i] = Math.random() * maxLives[i]
}

const positionAttrRef = shallowRef()
const { onBeforeRender } = useLoop()

// --- 4. 动画循环 ---
onBeforeRender(({ elapsed, delta }) => {
  if (!positionAttrRef.value) return

  const currentPositions = positionAttrRef.value.array
  // 限制 delta 防止切屏回来后粒子乱飞
  const dt = Math.min(delta, 0.1)
  const time = elapsed * 0.3

  for (let i = 0; i < count; i++) {
    const i3 = i * 3

    // 生命流逝
    lives[i] += dt

    // 💀 如果寿命到了，或者飞太远了 -> 强制重生
    // 这是解决"聚集"的最强手段
    if (lives[i] > maxLives[i]) {
      respawn(i)
    }

    let x = currentPositions[i3]
    let y = currentPositions[i3 + 1]
    let z = currentPositions[i3 + 2]

    // 计算流场力
    const flow = getFlowVector(x, y, z, time)

    // 应用移动
    x += flow.x * 3.0 * dt * speeds[i]
    y += flow.y * 1.0 * dt * speeds[i] // 稍微有点上下浮动
    z += flow.z * 3.0 * dt * speeds[i]

    // 边界检查 (双保险)
    const dist = x * x + z * z
    if (dist > (range * range) / 2 || y < 0 || y > 25) {
      respawn(i)
      x = positions[i3]
      y = positions[i3 + 1]
      z = positions[i3 + 2]
    }

    currentPositions[i3] = x
    currentPositions[i3 + 1] = y
    currentPositions[i3 + 2] = z
  }

  // 必须标记更新
  positionAttrRef.value.needsUpdate = true
})
</script>