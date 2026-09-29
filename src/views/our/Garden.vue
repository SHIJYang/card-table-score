<template>
  <div class="garden-page">
    <div ref="canvasRef" class="garden-canvas"></div>

    <!-- 标题 -->
    <div class="g-title">
      <div class="g-title-main">芥子园</div>
      <div class="g-title-sub">江南 · 宋明宅园</div>
      <div class="g-seal">写</div>
    </div>

    <!-- 控制面板 -->
    <div class="g-panel">
      <button class="g-btn" :class="{ active: isNight }" @click="toggleDay" title="昼夜切换（N）">
        <span class="g-btn-icon">{{ isNight ? '☾' : '☀' }}</span>
        <span class="g-btn-label">{{ isNight ? '夜' : '昼' }}</span>
      </button>
      <div class="g-divider"></div>
      <button class="g-btn" :class="{ active: mode === 'fps' }" @click="toggleView" title="切换视角（V）">
        <span class="g-btn-icon">{{ mode === 'fps' ? '🚶' : '⛰' }}</span>
        <span class="g-btn-label">{{ mode === 'fps' ? '漫游' : '环览' }}</span>
      </button>
      <div class="g-divider"></div>
      <button class="g-btn" @click="resetView" title="重置视角">
        <span class="g-btn-icon">⌂</span>
        <span class="g-btn-label">复位</span>
      </button>
    </div>

    <!-- 操作提示 -->
    <div class="g-hint">
      <template v-if="mode === 'orbit'">拖拽旋转 · 滚轮推拉 · <b>N</b> 昼夜 · <b>V</b> 入园漫游</template>
      <template v-else><b>WASD</b> 移动 · <b>Shift</b> 疾行 · 鼠标环视 · <b>V</b> 归位</template>
    </div>

    <!-- 入园提示 -->
    <transition name="fade">
      <div v-if="mode === 'fps' && !locked" class="g-enter-tip" @click="requestLock">点击入园 · ESC 退出漫游</div>
    </transition>

    <!-- 载入 -->
    <transition name="inkfade">
      <div v-if="loading" class="g-loading">
        <div class="g-loading-char">園</div>
        <div class="g-loading-text">造园中 …</div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { GardenEngine } from './garden'

const canvasRef = ref(null)
const loading = ref(true)
const isNight = ref(false)
const mode = ref('orbit')
const locked = ref(false)

let engine = null
let onKey, onLockChange

onMounted(() => {
  // 等一帧让载入页先渲染
  try {
    engine = new GardenEngine(canvasRef.value)
    window.__garden = engine
    setTimeout(() => { loading.value = false }, 350)
  } catch (err) {
    console.error('[garden] init failed', err)
    window.__gardenError = String(err && err.stack || err)
    loading.value = false
  }
  onKey = (e) => {
    if (e.code === 'KeyN') toggleDay()
    if (e.code === 'KeyV') toggleView()
  }
  window.addEventListener('keydown', onKey)
  onLockChange = () => { locked.value = !!document.pointerLockElement }
  document.addEventListener('pointerlockchange', onLockChange)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKey)
  document.removeEventListener('pointerlockchange', onLockChange)
  document.exitPointerLock?.()
  engine?.dispose()
  engine = null
})

function toggleDay() {
  isNight.value = !isNight.value
  engine?.setDayNight(isNight.value ? 1 : 0)
}
function toggleView() {
  if (!engine) return
  mode.value = mode.value === 'orbit' ? 'fps' : 'orbit'
  engine.setViewMode(mode.value)
  if (mode.value === 'orbit') locked.value = false
}
function requestLock() {
  engine?.renderer.domElement.requestPointerLock?.()
}
function resetView() {
  engine?.resetView()
}
</script>

<style scoped lang="scss">
.garden-page {
  position: relative;
  height: calc(100vh - 55px); /* 避开顶部 55px 导航栏 */
  width: 100%;
  overflow: hidden;
  background: #0b0e12;
  font-family: 'Kaiti SC', 'KaiTi', 'STKaiti', 'Noto Serif SC', serif;
  user-select: none;
}
.garden-canvas {
  position: absolute;
  inset: 0;
  :deep(canvas) { display: block; }
}

.g-title {
  position: absolute;
  top: 26px;
  left: 30px;
  color: #e9e4d8;
  text-shadow: 0 1px 8px rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  gap: 12px;
  pointer-events: none;
}
.g-title-main {
  font-size: 34px;
  letter-spacing: 10px;
  font-weight: 600;
}
.g-title-sub {
  font-size: 13px;
  letter-spacing: 4px;
  opacity: 0.75;
  border-left: 1px solid rgba(233, 228, 216, 0.35);
  padding-left: 12px;
}
.g-seal {
  width: 30px;
  height: 30px;
  background: #9e3b33;
  color: #f2e8dc;
  font-size: 18px;
  display: grid;
  place-items: center;
  border-radius: 4px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.4);
}

.g-panel {
  position: absolute;
  top: 26px;
  right: 30px;
  display: flex;
  align-items: center;
  gap: 10px;
  background: rgba(12, 15, 18, 0.55);
  border: 1px solid rgba(233, 228, 216, 0.16);
  border-radius: 10px;
  padding: 8px 12px;
  backdrop-filter: blur(8px);
}
.g-btn {
  display: flex;
  align-items: center;
  gap: 7px;
  background: transparent;
  border: 1px solid rgba(233, 228, 216, 0.22);
  color: #d8d2c4;
  border-radius: 8px;
  padding: 6px 12px;
  font-family: inherit;
  font-size: 14px;
  letter-spacing: 2px;
  cursor: pointer;
  transition: all 0.25s;
  &:hover { background: rgba(233, 228, 216, 0.12); }
  &.active {
    background: rgba(158, 59, 51, 0.35);
    border-color: rgba(200, 110, 90, 0.6);
    color: #f5ead9;
  }
}
.g-btn-icon { font-size: 15px; }
.g-divider { width: 1px; height: 20px; background: rgba(233, 228, 216, 0.18); }

.g-hint {
  position: absolute;
  bottom: 22px;
  left: 50%;
  transform: translateX(-50%);
  color: rgba(233, 228, 216, 0.62);
  font-size: 13px;
  letter-spacing: 2px;
  text-shadow: 0 1px 4px rgba(0, 0, 0, 0.6);
  pointer-events: none;
  b { color: rgba(245, 234, 217, 0.9); }
}

.g-enter-tip {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  color: rgba(233, 228, 216, 0.85);
  font-size: 17px;
  letter-spacing: 6px;
  background: rgba(5, 8, 12, 0.25);
  cursor: pointer;
  text-shadow: 0 1px 10px rgba(0, 0, 0, 0.8);
}

.g-loading {
  position: absolute;
  inset: 0;
  background: radial-gradient(ellipse at center, #171c22 0%, #0b0e12 70%);
  display: grid;
  place-items: center;
  align-content: center;
  gap: 18px;
}
.g-loading-char {
  font-size: 92px;
  color: #ddd6c6;
  opacity: 0.9;
  animation: breathe 2.2s ease-in-out infinite;
}
.g-loading-text {
  color: rgba(221, 214, 198, 0.6);
  font-size: 15px;
  letter-spacing: 6px;
}
@keyframes breathe {
  0%, 100% { opacity: 0.55; transform: scale(0.98); }
  50% { opacity: 1; transform: scale(1.02); }
}

.fade-enter-active, .fade-leave-active { transition: opacity 0.4s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
.inkfade-leave-active { transition: opacity 1.1s ease; }
.inkfade-leave-to { opacity: 0; }
</style>
