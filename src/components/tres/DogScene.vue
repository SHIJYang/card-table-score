<template>
  <TresGroup ref="groupRef">

    <TresGroup ref="headRef" :position="[0, 0.6, 0.3]" @click.stop="triggerEarWiggle" @pointer-enter="onPointerEnter"
      @pointer-leave="onPointerLeave">
      <TresMesh>
        <TresSphereGeometry :args="[0.8, 32, 32]" />
        <TresMeshToonMaterial :color="dogConfig.color" />
      </TresMesh>
      <TresMesh>
        <TresSphereGeometry :args="[0.8 * dogConfig.outlineWidth, 32, 32]" />
        <TresMeshBasicMaterial :color="dogConfig.outlineColor" :side="THREE.BackSide" />
      </TresMesh>

      <TresGroup ref="leftEarRef" :position="[-0.6, 0.5, 0]" :rotation-z="0.5">
        <TresMesh>
          <TresSphereGeometry :args="[0.35, 32, 32]" />
          <TresMeshToonMaterial :color="dogConfig.color" />
        </TresMesh>
        <TresMesh>
          <TresSphereGeometry :args="[0.35 * dogConfig.outlineWidth, 32, 32]" />
          <TresMeshBasicMaterial :color="dogConfig.outlineColor" :side="THREE.BackSide" />
        </TresMesh>
      </TresGroup>
      <TresGroup ref="rightEarRef" :position="[0.6, 0.5, 0]" :rotation-z="-0.5">
        <TresMesh>
          <TresSphereGeometry :args="[0.35, 32, 32]" />
          <TresMeshToonMaterial :color="dogConfig.color" />
        </TresMesh>
        <TresMesh>
          <TresSphereGeometry :args="[0.35 * dogConfig.outlineWidth, 32, 32]" />
          <TresMeshBasicMaterial :color="dogConfig.outlineColor" :side="THREE.BackSide" />
        </TresMesh>
      </TresGroup>

      <TresMesh :position="[-0.25, 0.1, 0.75]">
        <TresSphereGeometry :args="[0.08, 16, 16]" />
        <TresMeshBasicMaterial color="black" />
      </TresMesh>
      <TresMesh :position="[0.25, 0.1, 0.75]">
        <TresSphereGeometry :args="[0.08, 16, 16]" />
        <TresMeshBasicMaterial color="black" />
      </TresMesh>
      <TresMesh :position="[0, 0, 0.8]">
        <TresSphereGeometry :args="[0.05, 16, 16]" />
        <TresMeshBasicMaterial color="black" />
      </TresMesh>
      <TresMesh :position="[-0.4, -0.1, 0.65]" :scale-z="0.5">
        <TresSphereGeometry :args="[0.08, 16, 16]" />
        <TresMeshBasicMaterial color="#ffb6c1" :transparent="true" :opacity="0.6" />
      </TresMesh>
      <TresMesh :position="[0.4, -0.1, 0.65]" :scale-z="0.5">
        <TresSphereGeometry :args="[0.08, 16, 16]" />
        <TresMeshBasicMaterial color="#ffb6c1" :transparent="true" :opacity="0.6" />
      </TresMesh>
    </TresGroup>

    <TresGroup :position="[0, -0.5, -0.2]" @click.stop="triggerJump" @pointer-enter="onPointerEnter"
      @pointer-leave="onPointerLeave">
      <TresMesh :scale="[0.9, 0.8, 1.3]">
        <TresSphereGeometry :args="[0.7, 32, 32]" />
        <TresMeshToonMaterial :color="dogConfig.color" />
      </TresMesh>
      <TresMesh :scale="[0.9, 0.8, 1.3]">
        <TresSphereGeometry :args="[0.7 * dogConfig.outlineWidth, 32, 32]" />
        <TresMeshBasicMaterial :color="dogConfig.outlineColor" :side="THREE.BackSide" />
      </TresMesh>
    </TresGroup>

    <TresGroup ref="tailRef" :position="[0, -0.2, -1.0]" @click.stop="triggerSpin" @pointer-enter="onPointerEnter"
      @pointer-leave="onPointerLeave">
      <TresGroup :rotation-x="-0.5">
        <TresMesh :position="[0, 0.3, 0]">
          <TresSphereGeometry :args="[0.2, 32, 32]" />
          <TresMeshToonMaterial :color="dogConfig.color" />
        </TresMesh>
        <TresMesh :position="[0, 0.3, 0]">
          <TresSphereGeometry :args="[0.2 * dogConfig.outlineWidth, 32, 32]" />
          <TresMeshBasicMaterial :color="dogConfig.outlineColor" :side="THREE.BackSide" />
        </TresMesh>
      </TresGroup>
    </TresGroup>

    <TresGroup :position="[-0.4, -1.1, 0.2]" @click.stop="triggerSpin">
      <TresMesh :scale-y="1.2">
        <TresSphereGeometry :args="[0.18, 32, 32]" />
        <TresMeshToonMaterial :color="dogConfig.color" />
      </TresMesh>
      <TresMesh :scale-y="1.2">
        <TresSphereGeometry :args="[0.18 * dogConfig.outlineWidth, 32, 32]" />
        <TresMeshBasicMaterial :color="dogConfig.outlineColor" :side="THREE.BackSide" />
      </TresMesh>
    </TresGroup>
    <TresGroup :position="[0.4, -1.1, 0.2]" @click.stop="triggerSpin">
      <TresMesh :scale-y="1.2">
        <TresSphereGeometry :args="[0.18, 32, 32]" />
        <TresMeshToonMaterial :color="dogConfig.color" />
      </TresMesh>
      <TresMesh :scale-y="1.2">
        <TresSphereGeometry :args="[0.18 * dogConfig.outlineWidth, 32, 32]" />
        <TresMeshBasicMaterial :color="dogConfig.outlineColor" :side="THREE.BackSide" />
      </TresMesh>
    </TresGroup>
    <TresGroup :position="[-0.45, -1.1, -0.7]" @click.stop="triggerSpin">
      <TresMesh :scale-y="1.2">
        <TresSphereGeometry :args="[0.2, 32, 32]" />
        <TresMeshToonMaterial :color="dogConfig.color" />
      </TresMesh>
      <TresMesh :scale-y="1.2">
        <TresSphereGeometry :args="[0.2 * dogConfig.outlineWidth, 32, 32]" />
        <TresMeshBasicMaterial :color="dogConfig.outlineColor" :side="THREE.BackSide" />
      </TresMesh>
    </TresGroup>
    <TresGroup :position="[0.45, -1.1, -0.7]" @click.stop="triggerSpin">
      <TresMesh :scale-y="1.2">
        <TresSphereGeometry :args="[0.2, 32, 32]" />
        <TresMeshToonMaterial :color="dogConfig.color" />
      </TresMesh>
      <TresMesh :scale-y="1.2">
        <TresSphereGeometry :args="[0.2 * dogConfig.outlineWidth, 32, 32]" />
        <TresMeshBasicMaterial :color="dogConfig.outlineColor" :side="THREE.BackSide" />
      </TresMesh>
    </TresGroup>

  </TresGroup>
</template>

<script setup>
import { shallowRef, ref } from 'vue'
import { useLoop } from '@tresjs/core'
import * as THREE from 'three'

const props = defineProps({
  color: {
    type: String,
    default: '#ffffff'
  }
})

const dogConfig = {
  get color() { return props.color },
  outlineColor: '#000000',
  outlineWidth: 1.04,
}

// 引用
const groupRef = shallowRef(null)
const headRef = shallowRef(null)
const tailRef = shallowRef(null)
const leftEarRef = shallowRef(null)
const rightEarRef = shallowRef(null)

// 状态
const isJumping = ref(false)
const isSpinning = ref(false)
const isWiggling = ref(false)

// 交互事件
const onPointerEnter = () => { document.body.style.cursor = 'pointer' }
const onPointerLeave = () => { document.body.style.cursor = 'auto' }

const triggerJump = () => {
  if (isJumping.value) return
  isJumping.value = true
  setTimeout(() => { isJumping.value = false }, 1000)
}

const triggerSpin = () => {
  if (isSpinning.value) return
  isSpinning.value = true
  setTimeout(() => { isSpinning.value = false }, 1500)
}

const triggerEarWiggle = () => {
  if (isWiggling.value) return
  isWiggling.value = true
  setTimeout(() => { isWiggling.value = false }, 800)
}

// 内部动画循环
const { onBeforeRender } = useLoop()

onBeforeRender(({ elapsed }) => {
  if (!groupRef.value || !headRef.value || !tailRef.value || !leftEarRef.value || !rightEarRef.value) return

  // 1. 基础呼吸 (保留原逻辑)
  // 注意：这里计算的 posY 是相对于父级容器的“局部坐标”。
  // 所以不管父级容器 (elf.vue 里的 companionRef) 飞到哪里，
  // 小狗依然会相对于容器中心进行呼吸浮动，不会冲突。
  let posY = Math.sin(elapsed * 2) * 0.05
  const breath = 1 + Math.sin(elapsed * 3) * 0.005

  let headRotZ = Math.sin(elapsed * 2) * 0.05
  let headRotY = Math.sin(elapsed * 1.5) * 0.05
  let tailSpeed = 12
  let tailAmp = 0.6

  // 2. 跳跃逻辑
  if (isJumping.value) {
    const jumpHeight = Math.abs(Math.sin(elapsed * 10)) * 0.5
    posY += jumpHeight
    groupRef.value.scale.set(breath, breath, breath)
  } else {
    groupRef.value.scale.set(breath, breath, breath)
  }

  // 3. 旋转逻辑
  // 这里的 rotation.y 也是局部的。
  // elf.vue 里让整体 lookAt 鼠标，而这里让小狗自转。
  // 两个旋转会叠加，形成“一边看着鼠标位置飞，一边自己转圈圈”的效果，非常有趣。
  if (isSpinning.value) {
    groupRef.value.rotation.y -= 0.1
    tailSpeed = 5
    tailAmp = 1.0
  } else {
    // 自动回正逻辑
    let r = groupRef.value.rotation.y % (Math.PI * 2)
    if (r > Math.PI) r -= Math.PI * 2
    else if (r < -Math.PI) r += Math.PI * 2
    groupRef.value.rotation.y = r
    groupRef.value.rotation.y = THREE.MathUtils.lerp(r, 0, 0.1)
  }

  // 4. 抖耳逻辑
  if (isWiggling.value) {
    const wiggle = Math.sin(elapsed * 30) * 0.2
    leftEarRef.value.rotation.z = 0.5 + wiggle
    rightEarRef.value.rotation.z = -0.5 - wiggle
    headRotZ += wiggle * 0.2
  } else {
    leftEarRef.value.rotation.z = 0.5
    rightEarRef.value.rotation.z = -0.5
  }

  groupRef.value.position.y = posY
  headRef.value.rotation.z = headRotZ
  headRef.value.rotation.y = headRotY
  tailRef.value.rotation.z = Math.cos(elapsed * tailSpeed) * tailAmp
})
</script>