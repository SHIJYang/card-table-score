<template>
  <div class="jewel-scene">
    <TresCanvas window-size clear-color="#050505" power-preference="high-performance"
      :tone-mapping="THREE.ACESFilmicToneMapping" :pixel-ratio="pixelRatio">
      <Suspense>
        <TreeExperience />
      </Suspense>
    </TresCanvas>

    <transition name="fade">
      <div v-show="!uiHidden" class="ui-layer">
        <div class="top-left-panel">
          <div class="control-group glass-panel vertical">
            <button v-for="mode in modes" :key="mode.key" @click="handleUIAction(mode.key)"
              :class="{ active: cameraStore.actionTrigger?.type === mode.key }" :disabled="mode.disabled"
              :title="mode.desc">
              <span class="icon">{{ mode.icon }}</span>
            </button>

            <button @click="toggleCameraHandler" :class="{ active: cameraStore.isCameraOpen }"
              :disabled="cameraStore.isLoading" title="开启摄像头">
              <span class="icon" v-if="!cameraStore.isLoading">📷</span>
              <span class="icon spinning" v-else>⌛</span>
            </button>

            <button @click="toggleUI" title="隐藏界面">
              <span class="icon">👁️</span>
            </button>
          </div>
        </div>

        <div v-show="cameraStore.isCameraOpen" class="camera-widget" :class="{ active: cameraStore.isHandDetected }">
          <video ref="videoRef" autoplay playsinline muted></video>
          <div class="overlay-feedback">
            <svg v-if="cameraStore.gesture.progress > 0" class="progress-ring" width="40" height="40">
              <circle class="progress-ring__circle" stroke="white" stroke-width="3" fill="transparent" r="16" cx="20"
                cy="20" :style="{ strokeDashoffset: strokeDashoffset }" />
            </svg>
            <div class="status-text">
              <span v-if="!cameraStore.isHandDetected" class="blink">SEARCHING</span>
              <span v-else class="gesture-name">{{ cameraStore.gesture.current }}</span>
            </div>
          </div>
        </div>
      </div>
    </transition>

    <button v-if="uiHidden" class="wakeup-btn" @click="toggleUI">🍔 MENU</button>
  </div>
</template>

<script setup>
import { ref, computed, watch, onBeforeUnmount } from 'vue';
import { TresCanvas } from '@tresjs/core';
import * as THREE from 'three';
import { useCameraStore, useImageStore } from '@/store';
import { storeToRefs } from 'pinia';
import TreeExperience from './TreeExperience.vue';

// 1. 初始化 Store
const cameraStore = useCameraStore();
const imageStore = useImageStore();
const { imageList, imagePagination } = storeToRefs(imageStore);

// 加载更多相关计算属性
const canLoadMore = computed(() => {
  const { current_page, last_page } = imagePagination.value || {}
  return current_page < last_page
})

// 自动加载更多照片 - 监听图片列表变化，加载完成后自动追加
watch(imageList, async (newList, oldList) => {
  // 如果当前不在加载中，且还有更多数据，且列表有变化
  if (!imageStore.loading?.images && canLoadMore.value && newList?.length > 0) {
    // 延迟一点再加载，避免频繁请求
    await new Promise(resolve => setTimeout(resolve, 500))
    if (imageStore.loadMoreImages) {
      await imageStore.loadMoreImages()
    }
  }
}, { immediate: false })

// 2. 核心修复：在 JS 中获取 pixelRatio，并在模板中引用
// 限制最大为 2.0，既保证清晰度又防止高分屏手机过热
const pixelRatio = Math.min(window.devicePixelRatio, 2.0);

// 3. UI 状态
const videoRef = ref(null);
const uiHidden = ref(false);

const STATE_KEYS = { TREE: 'tree', SCATTER: 'scatter', ZOOM: 'zoom' };

const modes = computed(() => [
  { key: STATE_KEYS.TREE, label: '聚合', icon: '✊', desc: '握拳', disabled: false },
  { key: STATE_KEYS.SCATTER, label: '散开', icon: '🖐️', desc: '五指张开', disabled: false },
  { key: STATE_KEYS.ZOOM, label: '特写', icon: '👌', desc: '抓取/捏合', disabled: (imageList.value || []).length === 0 }
]);

const strokeDashoffset = computed(() => {
  const circumference = 2 * Math.PI * 16;
  return circumference - (cameraStore.gesture.progress / 100) * circumference;
});

// 4. 核心修复：直接修改 Store 状态，而不是调用不存在的 Action
const handleUIAction = (key) => {
  // 手动构建动作对象，模拟 cameraStore 内部的触发逻辑
  cameraStore.actionTrigger = { type: key, timestamp: Date.now() };
};

const toggleUI = () => uiHidden.value = !uiHidden.value;
const toggleCameraHandler = () => cameraStore.toggleCamera(videoRef.value);

onBeforeUnmount(() => {
  cameraStore.stopCamera();
});
</script>

<style scoped>
/* 保持原有样式不变 */
.jewel-scene {
  position: relative;
  width: 100vw;
  height: calc(100vh - 60px);
  background: #000;
  overflow: hidden;
  font-family: 'Helvetica Neue', Arial, sans-serif;
  user-select: none;
}

.ui-layer {
  position: absolute;
  inset: 0;
  z-index: 10;
  pointer-events: none;
}

.top-left-panel {
  position: absolute;
  top: 10px;
  left: 10px;
  pointer-events: auto;
}

.glass-panel {
  background: rgba(20, 20, 20, 0.75);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 16px;
  padding: 10px;
  display: flex;
  gap: 8px;
}

.glass-panel button {
  background: transparent;
  border: none;
  color: #ccc;
  width: 40px;
  height: 40px;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  font-size: 1.2rem;
}

.glass-panel button:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
}

.glass-panel button.active {
  background: rgba(212, 175, 55, 0.8);
  color: #000;
}

.glass-panel button:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.camera-widget {
  position: absolute;
  top: 10px;
  right: 20px;
  width: 110px;
  height: 82px;
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(0, 0, 0, 0.8);
  pointer-events: auto;
  opacity: 0.4;
  transition: all 0.3s;
  transform-origin: top right;
}

.camera-widget:hover,
.camera-widget.active {
  opacity: 1;
  border-color: rgba(212, 175, 55, 0.5);
}

.camera-widget video {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transform: scaleX(-1);
  opacity: 0.8;
}

.overlay-feedback {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  pointer-events: none;
}

.status-text {
  position: absolute;
  bottom: 4px;
  width: 100%;
  text-align: center;
  font-size: 9px;
  font-weight: 600;
  letter-spacing: 1px;
  color: #ccc;
  text-shadow: 0 1px 2px #000;
}

.gesture-name {
  color: #d4af37;
}

.blink {
  animation: blink 1.5s infinite;
}

.progress-ring {
  transform: rotate(-90deg);
}

.progress-ring__circle {
  transition: stroke-dashoffset 0.1s linear;
  stroke: #d4af37;
  stroke-dasharray: 100 100;
}

.wakeup-btn {
  position: absolute;
  top: 10px;
  right: 20px;
  background: rgba(0, 0, 0, 0.8);
  border: 1px solid #d4af37;
  color: #d4af37;
  padding: 8px 16px;
  border-radius: 20px;
  cursor: pointer;
  z-index: 20;
}

@keyframes blink {

  0%,
  100% {
    opacity: 1;
  }

  50% {
    opacity: 0.5;
  }
}

.spinning {
  animation: spin 1s linear infinite;
  display: inline-block;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>