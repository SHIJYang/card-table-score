<template>
  <primitive 
    ref="modelRef" 
    :object="scene" 
    :position="[0, -1, 0]" 
    :scale="[1, 1, 1]"
    @click.stop="triggerAction"
    @pointer-enter="onPointerEnter"
    @pointer-leave="onPointerLeave"
  />
</template>

<script setup>
import { ref, shallowRef, watchEffect } from 'vue'
import { useLoop } from '@tresjs/core'
import { useGLTF } from '@tresjs/cientos'
import * as THREE from 'three'

// ==========================================
// 1. 加载网络模型
// ==========================================
// 这里使用 await，因此父组件必须使用 <Suspense> 包裹此组件
// 示例模型：一个低多边形的狗 (你可以替换成你自己的 URL)
const modelUrl = 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Fox/glTF-Binary/Fox.glb' 
// 注意：上面的 URL 只是示例（是个狐狸），建议替换成真实的狗模型 URL

const { scene, nodes, materials } = await useGLTF(modelUrl)

// ==========================================
// 2. 引用与状态
// ==========================================
const modelRef = shallowRef(null) // 整个模型的引用
const headBone = shallowRef(null) // 头部骨骼/节点引用 (用于摇头)

// 交互状态
const isJumping = ref(false)   // 跳跃状态
const isSpinning = ref(false)  // 旋转状态
const isWiggling = ref(false)  // 抖动状态

// ==========================================
// 3. 模型处理 (查找骨骼/修改材质)
// ==========================================
watchEffect(() => {
  if (scene) {
    // 开启阴影
    scene.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true
        child.receiveShadow = true
        // 如果你想修改模型颜色，可以在这里操作 material
        // if (child.material) child.material.color.set('#ff9900') 
      }
    })

    // --- 查找特定部位 ---
    // 3D模型不像几何体那样直接有 ref。我们需要通过名字在场景图中查找。
    // 你需要在 Blender 等软件中查看你的模型骨骼名称 (比如 'Head', 'Neck', 'Ear_L')
    // 下面是一个通用的查找示例：
    headBone.value = scene.getObjectByName('head') || scene.getObjectByName('Head') || scene.getObjectByName('neck')
  }
})

// ==========================================
// 4. 事件交互
// ==========================================

const onPointerEnter = () => { document.body.style.cursor = 'pointer' }
const onPointerLeave = () => { document.body.style.cursor = 'auto' }

// 统一的触发逻辑：这里做一个随机动作演示
const triggerAction = () => {
  // 简单的逻辑：如果没在动，随机触发 跳跃 或 旋转
  if (isJumping.value || isSpinning.value) return
  
  const random = Math.random()
  if (random > 0.5) triggerJump()
  else triggerSpin()
}

const triggerJump = () => {
  isJumping.value = true
  setTimeout(() => { isJumping.value = false }, 1000)
}

const triggerSpin = () => {
  isSpinning.value = true
  setTimeout(() => { isSpinning.value = false }, 1500)
}

// ==========================================
// 5. 动画主循环 (复刻你的原始物理逻辑)
// ==========================================
const { onBeforeRender } = useLoop()

onBeforeRender(({ elapsed }) => {
  if (!modelRef.value) return

  // --- [基础状态: 呼吸与悬浮] ---
  const breath = 1 + Math.sin(elapsed * 3) * 0.02 // 呼吸幅度稍微调小，以免模型变形太严重
  let posY = -1 + Math.sin(elapsed * 2) * 0.05    // 基础 Y 轴 (假设地面在 -1)

  // --- [动作叠加: 跳跃] ---
  if (isJumping.value) {
    const jumpHeight = Math.abs(Math.sin(elapsed * 10)) * 1.5 // 跳得更高
    posY += jumpHeight
    // 跳跃时的挤压拉伸
    modelRef.value.scale.set(breath * 0.9, breath * 1.1, breath * 0.9)
  } else {
    modelRef.value.scale.set(breath, breath, breath)
  }

  // --- [动作叠加: 旋转] ---
  if (isSpinning.value) {
    modelRef.value.rotation.y -= 0.15 // 快速旋转
  } else {
    // 平滑复位逻辑 (和你原来的一样)
    let r = modelRef.value.rotation.y % (Math.PI * 2)
    if (r > Math.PI) r -= Math.PI * 2
    else if (r < -Math.PI) r += Math.PI * 2
    modelRef.value.rotation.y = r
    modelRef.value.rotation.y = THREE.MathUtils.lerp(r, 0, 0.1)
  }

  // --- [动作叠加: 头部/耳朵 简单的程序化动画] ---
  // 如果找到了头部节点，我们可以让它看镜头或者晃动
  if (headBone.value) {
    // 简单的摆头
    headBone.value.rotation.z = Math.sin(elapsed * 1.5) * 0.1
    headBone.value.rotation.x = Math.sin(elapsed * 1) * 0.1
  }

  // 应用位置
  modelRef.value.position.y = posY
})
</script>