<template>
  <div class="photo-wall-wrapper">
    <el-empty v-if="items.length === 0 && !imageStore.loading.images" description="暂无照片数据" />

    <div v-if="items.length === 0 && imageStore.loading.images" class="loading-placeholder">
      <el-skeleton :rows="3" animated />
    </div>

    <div v-else class="waterfall-container" ref="containerRef">
      <div v-for="(item, index) in items" :key="item.id" class="waterfall-item opacity-0 translate-y-10">
        <el-card shadow="hover" :body-style="{ padding: '0px' }" class="photo-card" @mouseenter="onMouseEnter($event)"
          @mouseleave="onMouseLeave($event)">
          <div class="image-box" :style="{ aspectRatio: `${item.width} / ${item.height}` }">
            <el-image class="real-image" :src="item.url" :alt="item.title" loading="lazy" fit="cover"
              :preview-src-list="previewList" :initial-index="index" hide-on-click-modal preview-teleported>
              <template #placeholder>
                <div class="image-slot loading">
                  <el-icon class="is-loading">
                    <Loading />
                  </el-icon>
                </div>
              </template>
              <template #error>
                <div class="image-slot error">
                  <el-icon>
                    <Picture />
                  </el-icon>
                </div>
              </template>
            </el-image>

            <div class="card-overlay">
              <span class="text-truncate">{{ item.title }}</span>
            </div>
          </div>
        </el-card>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch, nextTick } from 'vue'
import { Picture, Loading } from '@element-plus/icons-vue'
import { useImageStore } from '@/store'
import gsap from 'gsap'

const imageStore = useImageStore()

// --- 数据处理 ---
const items = computed(() => {
  const list = imageStore.imageList || []
  return list.map(item => {
    const w = Number(item.width) || 200
    const h = Number(item.height) || 200
    return {
      id: item.key,
      img: item.links?.url,
      url: item.links?.url,
      width: w,
      height: h,
      title: item.origin_name || '未命名图片'
    }
  })
})

const previewList = computed(() => items.value.map(item => item.url))

// --- GSAP 动画逻辑 ---
watch(() => items.value.length, async (newLen) => {
  if (newLen > 0) {
    await nextTick()

    // 1. 入场流体动画
    gsap.killTweensOf(".waterfall-item")
    gsap.fromTo(".waterfall-item",
      { opacity: 0, y: 50, scale: 0.95 },
      {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: 0.8,
        stagger: { amount: 0.6, grid: "auto", from: "start" }, // 稍微加快一点
        ease: "power3.out",
        clearProps: "all"
      }
    )
  }
})

// 2. 悬停微交互
const onMouseEnter = (e) => {
  const card = e.currentTarget
  const img = card.querySelector('.real-image')
  const overlay = card.querySelector('.card-overlay')

  gsap.to(card, { y: -4, boxShadow: "0 8px 16px rgba(0,0,0,0.15)", duration: 0.3 })
  if (img) gsap.to(img, { scale: 1.05, duration: 0.4 })
  if (overlay) gsap.to(overlay, { opacity: 1, duration: 0.3 })
}

const onMouseLeave = (e) => {
  const card = e.currentTarget
  const img = card.querySelector('.real-image')
  const overlay = card.querySelector('.card-overlay')

  gsap.to(card, { y: 0, boxShadow: "0 0 0 rgba(0,0,0,0)", duration: 0.3 })
  if (img) gsap.to(img, { scale: 1, duration: 0.4 })
  if (overlay) gsap.to(overlay, { opacity: 0, duration: 0.3 })
}

onMounted(() => {
  if (items.value.length === 0) imageStore.fetchImages()
})

// 自动加载更多照片 - 递归加载所有页面
const loadAllImages = async () => {
  const { current_page, last_page } = imageStore.imagePagination || {}
  if (current_page < last_page) {
    const nextPage = current_page + 1
    await imageStore.fetchImagesForPage(nextPage)
    // 延迟后递归调用
    setTimeout(loadAllImages, 300)
  }
}

// 监听首次加载完成
watch(() => imageStore.loading?.images, async (loading, oldLoading) => {
  // 当从加载中变为非加载中，且是第一页数据加载完成
  if (oldLoading === true && loading === false) {
    const { current_page, last_page } = imageStore.imagePagination || {}
    if (current_page === 1 && last_page > 1) {
      setTimeout(loadAllImages, 500)
    }
  }
})
</script>

<style scoped>
.photo-wall-wrapper {
  width: 100%;
  height: 100%;
  --color: var(--borderLighter);
  background-color: var(--bgPrimary);
  background-image: linear-gradient(0deg, transparent 24%, var(--color) 25%, var(--color) 26%, transparent 27%, transparent 74%, var(--color) 75%, var(--color) 76%, transparent 77%, transparent),
    linear-gradient(90deg, transparent 24%, var(--color) 25%, var(--color) 26%, transparent 27%, transparent 74%, var(--color) 75%, var(--color) 76%, transparent 77%, transparent);
  background-size: 55px 55px;
}

/* 核心布局：纯 CSS 瀑布流 */
.waterfall-container {
  column-count: 6;
  /* 默认 6 列 */
  column-gap: 12px;
  /* 列间距 */
}

/* 每一项 */
.waterfall-item {
  break-inside: avoid;
  /* 防止被切断 */
  margin-bottom: 12px;
  /* 上下间距 */
  backface-visibility: hidden;
}

/* 卡片重置 */
.photo-card {
  border: none !important;
  border-radius: 8px !important;
  /* 稍微减小圆角，适合密集布局 */
  overflow: hidden;
  background-color: var(--el-bg-color);
  transition: none;
}

.image-box {
  width: 100%;
  position: relative;
  overflow: hidden;
  background-color: #f5f7fa;
}

.real-image {
  width: 100%;
  height: 100%;
  display: block;
}

/* 遮罩层 */
.card-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  padding: 6px 8px;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.7), transparent);
  color: #fff;
  font-size: 11px;
  opacity: 0;
  pointer-events: none;
}

.text-truncate {
  display: block;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.image-slot {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
  min-height: 100px;
  background: var(--el-fill-color-light);
  color: var(--el-text-color-secondary);
  font-size: 20px;
}

/* 🟢 响应式断点：强制保底 3 列 🟢 */

@media (max-width: 1400px) {
  .waterfall-container {
    column-count: 5;
  }
}

@media (max-width: 1024px) {
  .waterfall-container {
    column-count: 4;
  }
}

/* 768px 以下统一使用 3 列，无论多窄都是 3 列 */
@media (max-width: 768px) {
  .waterfall-container {
    column-count: 3;
    column-gap: 8px;

  }

  .waterfall-item {
    margin-bottom: 8px;
    /* 上下间距也调小 */
  }
}
</style>