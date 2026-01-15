<template>
  <div ref="containerRef" class="tres-bg-container">
    <TresCanvas alpha shadows :clear-alpha="0" window-size>

      <TresPerspectiveCamera ref="cameraRef" :position="[0, 0, 12]" :look-at="[0, 0, 0]" />
      <TresAmbientLight :intensity="1.2" />
      <TresDirectionalLight :position="[2, 5, 5]" :intensity="1" />

      <TresMesh ref="floorRef" :position="[0, 0, 0]" :scale="[100, 100, 1]" :visible="false">
        <TresPlaneGeometry />
        <TresMeshBasicMaterial :transparent="true" :opacity="0" :depth-write="false" />
      </TresMesh>

      <TresGroup ref="moveGroupRef" :position="[1.5, -2.5, 0]" :scale="[0.5, 0.5, 0.5]">
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
const moveGroupRef = shallowRef()
const companionRef = shallowRef()

// --- 状态 ---
const isDragging = ref(false)
const isFocused = ref(false)

// --- 工具 ---
const raycaster = new THREE.Raycaster()
// 🔧 关键修复：设置线条检测阈值，让鼠标更容易“摸”到细线
raycaster.params.Line.threshold = 5

const mouse = new THREE.Vector2()
const dragPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0)

// --- 交互切换逻辑 ---
const updatePointerEvents = (enable: boolean) => {
  if (!containerRef.value) return
  const newState = enable ? 'auto' : 'none'
  // 只有状态改变时才操作 DOM，提升性能
  if (containerRef.value.style.pointerEvents !== newState) {
    containerRef.value.style.pointerEvents = newState
  }
  document.body.style.cursor = enable ? (isDragging.value ? 'grabbing' : 'grab') : 'auto'
}

const onWindowMouseMove = (event: MouseEvent) => {
  if (!cameraRef.value || !moveGroupRef.value || !companionRef.value) return

  // 1. 归一化鼠标
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1

  // 2. 射线检测
  raycaster.setFromCamera(mouse, cameraRef.value)

  // 3. 计算平面交点 (用于拖拽和视线跟随)
  const target = new THREE.Vector3()
  raycaster.ray.intersectPlane(dragPlane, target)

  // A. 拖拽模式：锁定交互，直接移动
  if (isDragging.value) {
    moveGroupRef.value.position.set(target.x, target.y, 0)
    companionRef.value.lookAt(target.x, target.y, 10)
    return
  }

  // B. 悬停检测
  // 只检测狗狗 (moveGroupRef)，如果检测到说明鼠标在线条上
  const intersects = raycaster.intersectObject(moveGroupRef.value, true)

  if (intersects.length > 0) {
    // 摸到狗 -> 阻挡点击 (auto)
    if (!isFocused.value) {
      isFocused.value = true
      updatePointerEvents(true)
    }
    companionRef.value.lookAt(target.x, target.y, 10)
  } else {
    // 没摸到 -> 允许穿透 (none)
    if (isFocused.value) {
      isFocused.value = false
      updatePointerEvents(false)
    }
    // 没摸到也稍微看向鼠标
    companionRef.value.lookAt(target.x, target.y, 10)
  }
}

const onWindowMouseDown = (event: MouseEvent) => {
  // 只有悬停在狗上时，点击才生效
  if (isFocused.value) {
    isDragging.value = true
    updatePointerEvents(true)
    event.stopPropagation() // 阻止冒泡，防止点到下面的网页
  }
}

const onWindowMouseUp = () => {
  isDragging.value = false
  // 松开鼠标后，如果已经不在狗身上了，恢复穿透
  if (!isFocused.value) {
    updatePointerEvents(false)
  }
}

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
  overflow: hidden;
  background-color: transparent;
  touch-action: none;

  /* 默认：允许鼠标穿透 */
  pointer-events: none;
}

/* 🔥🔥 核心修复 🔥🔥
  强制内部的 Canvas 继承父级的 pointer-events 属性。
  如果父级是 none，Canvas 也是 none（穿透）。
  如果父级是 auto，Canvas 也是 auto（阻挡）。
  没有这行代码，Canvas 可能会自作主张挡住所有点击。
*/
.tres-bg-container :deep(canvas) {
  pointer-events: inherit !important;
}
</style>