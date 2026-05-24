<template>
  <div
    ref="elRef"
    class="pic-image"
    :class="{
      loaded: isLoaded,
      error: hasError,
      'in-view': isInView,
    }"
  >
    <!-- 骨架占位（加载完成前显示） -->
    <div v-if="!isLoaded && !hasError" class="skeleton" />

    <!-- 模糊缩略图（thumbnail_url 占位过渡） -->
    <img
      v-if="thumbnail && !isLoaded"
      :src="thumbnail"
      class="blur-thumb"
      @load="thumbLoaded = true"
      alt=""
    />

    <!-- 原图（IntersectionObserver 懒加载） -->
    <img
      v-if="isInView"
      :src="actualSrc"
      :alt="alt"
      class="full-img"
      :class="{ 'thumb-ready': thumbLoaded }"
      @load="onFullLoad"
      @error="onFullError"
    />

    <!-- 加载失败占位 -->
    <div v-if="hasError" class="error-placeholder">
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
        <circle cx="8.5" cy="8.5" r="1.5"/>
        <polyline points="21 15 16 10 5 21"/>
      </svg>
      <span>加载失败</span>
    </div>

    <!-- 过渡遮罩 -->
    <div v-if="!isLoaded && !hasError" class="reveal-mask" />
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'

const props = defineProps({
  src: { type: String, default: '' },
  thumbnail: { type: String, default: '' },
  alt: { type: String, default: '' },
  /** @deprecated 由父容器决定尺寸，组件自动撑满 */
  width: { type: Number, default: 0 },
  height: { type: Number, default: 0 },
  aspectRatio: { type: String, default: '' },
  /** 首屏图片不懒加载，立即请求 */
  priority: { type: Boolean, default: false },
  /** 自定义占位背景色 */
  placeholderBg: { type: String, default: '#f0f0f0' },
})

const emit = defineEmits(['load', 'error'])

const elRef = ref(null)
const isInView = ref(props.priority)
const isLoaded = ref(false)
const hasError = ref(false)
const thumbLoaded = ref(false)

// 解码 thumbnail_url（如果缩略图也是 PicUI 图片链接）
const actualSrc = computed(() => {
  return props.src || ''
})

// IntersectionObserver 懒加载
let observer = null

function setupObserver() {
  if (props.priority || !elRef.value) return
  observer = new IntersectionObserver(
    ([entry]) => {
      if (entry.isIntersecting) {
        isInView.value = true
        if (observer) observer.disconnect()
      }
    },
    { rootMargin: '200px 0px' } // 提前 200px 开始加载
  )
  observer.observe(elRef.value)
}

function onFullLoad() {
  isLoaded.value = true
  emit('load')
}

function onFullError() {
  hasError.value = true
  emit('error')
}

onMounted(() => {
  setupObserver()
})

onUnmounted(() => {
  if (observer) observer.disconnect()
})
</script>

<style scoped>
.pic-image {
  position: absolute;
  inset: 0;
  overflow: hidden;
  background: v-bind(placeholderBg);
  border-radius: inherit;
}

/* 骨架屏闪烁 */
.skeleton {
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, #f0f0f0 0%, #e8e8e8 50%, #f0f0f0 100%);
  background-size: 200% 100%;
  animation: shimmer 1.2s ease-in-out infinite;
  z-index: 1;
}
@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

/* 模糊缩略图 */
.blur-thumb {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  filter: blur(16px) brightness(0.9);
  transform: scale(1.15);
  opacity: 0;
  transition: opacity 0.4s ease;
  z-index: 2;
}
.blur-thumb.thumb-loaded {
  opacity: 1;
}

/* 原图 */
.full-img {
  position: relative;
  width: 100%;
  height: 100%;
  object-fit: cover;
  opacity: 0;
  transition: opacity 0.35s ease;
  z-index: 3;
}
.full-img.thumb-ready {
  opacity: 1;
}

/* 变化过渡遮罩（可选） */
.reveal-mask {
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, transparent 30%, rgba(255,255,255,0.08) 50%, transparent 70%);
  background-size: 200% 200%;
  animation: maskSweep 1.5s ease-in-out infinite;
  z-index: 4;
  pointer-events: none;
}
@keyframes maskSweep {
  0% { background-position: 200% 200%; }
  100% { background-position: -200% -200%; }
}

/* 错误占位 */
.error-placeholder {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  color: #bbb;
  font-size: 12px;
  background: #fafafa;
  z-index: 5;
}

/* 加载完成时隐藏滤镜层 */
.pic-image.loaded .skeleton,
.pic-image.loaded .blur-thumb,
.pic-image.loaded .reveal-mask {
  display: none;
}
.pic-image.loaded .full-img {
  opacity: 1;
}
</style>
