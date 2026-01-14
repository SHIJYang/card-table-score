<template>
  <div ref="containerRef" class="tres-bg-container" style="touch-action: none; pointer-events: none;">
    <TresCanvas alpha shadows :clear-alpha="0" window-size>

      <TresPerspectiveCamera ref="cameraRef" :position="[0, 0, 12]" :look-at="[0, 0, 0]" />

      <TresAmbientLight :intensity="1.2" />
      <TresDirectionalLight :position="[2, 5, 5]" :intensity="1" />

      <TresMesh ref="floorRef" name="floor" :position="[0, 0, 0]" :scale="[100, 100, 1]" :visible="false">
        <TresPlaneGeometry />
        <TresMeshBasicMaterial :transparent="true" :opacity="0" :depth-write="false" />
      </TresMesh>

      <TresGroup ref="moveGroupRef" :position="[1.5, -2, 0]" :scale="[0.5, 0.5, 0.5]">
        <TresGroup ref="companionRef">
          <LineDog :color="isFocused ? '#ffffff' : '#999999'" />
        </TresGroup>
      </TresGroup>

    </TresCanvas>
  </div>
</template>

<script setup lang="ts">
import { shallowRef, ref, onMounted, onUnmounted } from 'vue'
import { TresCanvas } from '@tresjs/core'
import * as THREE from 'three'
import LineDog from '../tres/DogScene.vue'

// --- 引用 ---
const containerRef = shallowRef<HTMLElement>()
const cameraRef = shallowRef()
const floorRef = shallowRef()
const moveGroupRef = shallowRef() // 包含位置
const companionRef = shallowRef() // 包含旋转(头部)

// --- 状态 ---
const isDragging = ref(false)
const isFocused = ref(false)

// --- 核心工具 ---
const raycaster = new THREE.Raycaster()
const mouse = new THREE.Vector2()
const planeNormal = new THREE.Vector3(0, 0, 1) // 地板法线
const plane = new THREE.Plane(planeNormal, 0)  // 数学平面，用于计算拖拽交点

// --- 事件处理逻辑 ---

const updatePointerEvents = (forceEnable: boolean) => {
  if (!containerRef.value) return
  // 如果在拖拽中，或者鼠标悬停在狗狗身上，开启交互(auto)
  // 否则关闭交互(none)，让点击穿透到底层网页
  containerRef.value.style.pointerEvents = forceEnable ? 'auto' : 'none'
  document.body.style.cursor = forceEnable ? (isDragging.value ? 'grabbing' : 'grab') : 'auto'
}

const onWindowMouseMove = (event: MouseEvent) => {
  if (!cameraRef.value || !moveGroupRef.value || !companionRef.value) return

  // 1. 归一化鼠标坐标 (-1 到 +1)
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1

  // 2. 更新射线
  raycaster.setFromCamera(mouse, cameraRef.value)

  // --- A. 头部跟随逻辑 (始终生效) ---
  // 计算射线与 Z=0 平面的交点，让狗头看向那里
  const target = new THREE.Vector3()
  raycaster.ray.intersectPlane(plane, target)
  // 修正：我们需要基于狗狗当前的位置来计算看向的目标
  // 这里简化为：看向鼠标在 Z=0 平面上的投影点
  // 为了让它看远一点，Z 设置为正值
  const lookTarget = new THREE.Vector3(target.x, target.y, 10)
  companionRef.value.lookAt(lookTarget)

  // --- B. 拖拽逻辑 ---
  if (isDragging.value) {
    // 拖拽模式：强制更新位置
    moveGroupRef.value.position.set(target.x, target.y, 0)
    return // 拖拽中不需要进行悬停检测
  }

  // --- C. 悬停检测 (智能穿透核心) ---
  // 检测射线是否击中狗狗模型
  // 注意：需要递归检测 (true)，因为 moveGroup 内部有很多子 Mesh
  const intersects = raycaster.intersectObject(moveGroupRef.value, true)

  if (intersects.length > 0) {
    isFocused.value = true
    updatePointerEvents(true) // 鼠标在狗身上 -> 阻挡点击，允许交互
  } else {
    isFocused.value = false
    updatePointerEvents(false) // 鼠标在空地 -> 允许穿透
  }
}

const onWindowMouseDown = () => {
  // 如果当前是 focused 状态（说明鼠标在狗身上），则开始拖拽
  if (isFocused.value) {
    isDragging.value = true
    updatePointerEvents(true) // 锁死交互状态
  }
}

const onWindowMouseUp = () => {
  isDragging.value = false
  // 松开后，立刻重新检测一次悬停状态，决定是否允许穿透
  // 这里简单处理：如果松开时还在狗身上，保持 auto，否则 none
  // 由于 mousemove 会持续触发，这里只需重置状态即可
  if (!isFocused.value) {
    updatePointerEvents(false)
  }
}

// --- 生命周期绑定 ---
onMounted(() => {
  window.addEventListener('mousemove', onWindowMouseMove)
  window.addEventListener('mousedown', onWindowMouseDown)
  window.addEventListener('mouseup', onWindowMouseUp)
})

onUnmounted(() => {
  window.removeEventListener('mousemove', onWindowMouseMove)
  window.removeEventListener('mousedown', onWindowMouseDown)
  window.removeEventListener('mouseup', onWindowMouseUp)
})
</script>

<style scoped>
.tres-bg-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: 9999;
  background-color: transparent;
  overflow: hidden;
  /* 关键：默认不响应鼠标，由 JS 动态开启 */
  pointer-events: none;
}
</style>