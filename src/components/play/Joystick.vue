<script setup lang="ts">
import { ref } from 'vue'
import { useJoystick } from '../../composables/useJoystick'

// 引入共享状态
const { updateJoystick } = useJoystick()

const stickRef = ref<HTMLElement | null>(null)
const baseRef = ref<HTMLElement | null>(null)
let touchId: number | null = null
const maxRadius = 40

const handleStart = (e: TouchEvent) => {
  e.preventDefault()
  const touch = e.changedTouches[0]
  touchId = touch.identifier
  updateStick(touch.clientX, touch.clientY)
}

const handleMove = (e: TouchEvent) => {
  e.preventDefault()
  if (touchId === null) return
  const touch = Array.from(e.changedTouches).find(t => t.identifier === touchId)
  if (touch) updateStick(touch.clientX, touch.clientY)
}

const handleEnd = (e: TouchEvent) => {
  e.preventDefault()
  const touch = Array.from(e.changedTouches).find(t => t.identifier === touchId)
  if (touch) {
    touchId = null
    if (stickRef.value) stickRef.value.style.transform = `translate(0px, 0px)`
    // 归零
    updateJoystick(0, 0, false)
  }
}

const updateStick = (clientX: number, clientY: number) => {
  if (!baseRef.value || !stickRef.value) return

  const rect = baseRef.value.getBoundingClientRect()
  const centerX = rect.left + rect.width / 2
  const centerY = rect.top + rect.height / 2

  let x = clientX - centerX
  let y = clientY - centerY

  const distance = Math.sqrt(x * x + y * y)
  if (distance > maxRadius) {
    const ratio = maxRadius / distance
    x *= ratio
    y *= ratio
  }

  stickRef.value.style.transform = `translate(${x}px, ${y}px)`

  // 写入全局状态
  // 注意：摇杆的 Y 轴通常是向上为负，但在 3D 移动中我们需要向下（向后）为正，这里保持原始值，在 players 里处理
  updateJoystick(x / maxRadius, y / maxRadius, true)
}
</script>

<template>
  <div class="joystick-zone">
    <div ref="baseRef" class="joystick-base" @touchstart="handleStart" @touchmove="handleMove" @touchend="handleEnd"
      @touchcancel="handleEnd">
      <div ref="stickRef" class="joystick-stick"></div>
    </div>
  </div>
</template>

<style scoped>
.joystick-zone {
  position: absolute;
  bottom: 50px;
  left: 50px;
  width: 120px;
  height: 120px;
  z-index: 9999;
  user-select: none;
  touch-action: none;
}

.joystick-base {
  width: 100%;
  height: 100%;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  backdrop-filter: blur(4px);
  border: 2px solid rgba(255, 255, 255, 0.3);
}

.joystick-stick {
  width: 50px;
  height: 50px;
  background: rgba(255, 255, 255, 0.8);
  border-radius: 50%;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.3);
  pointer-events: none;
}
</style>