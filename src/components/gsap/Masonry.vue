<template>
  <div ref="containerRef" class="relative w-full transition-all duration-300 ease-out"
    :style="{ height: `${containerHeight}px` }">
    <div v-if="containerWidth === 0" class="absolute inset-0 flex justify-center items-center text-gray-400">
      初始化布局...
    </div>

    <div v-for="item in grid" :key="item.id" :data-key="item.id" class="masonry-item absolute box-border" :style="{
      width: `${item.w}px`,
      height: `${item.h}px`,
      transform: `translate(${item.x}px, ${item.y}px)`,
      zIndex: hoveredId === item.id ? 10 : 1, /* 悬停时层级最高，防止被遮挡 */
      transition: 'transform 0.3s ease-out'   /* 只有位置变化时才过渡，不用 opacity */
    }" @click="openUrl(item.url)" @mouseenter="hoveredId = item.id" @mouseleave="hoveredId = null">
      <div
        class="relative w-full h-full rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 bg-gray-100 group"
        :class="{ 'scale-[0.98]': scaleOnHover && hoveredId === item.id }">
        <img :src="item.img" class="w-full h-full object-cover block" decoding="async" referrerpolicy="no-referrer"
          alt="" />

        <div v-if="colorShiftOnHover"
          class="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
        </div>

        <div
          class="absolute bottom-0 left-0 w-full p-2 bg-gradient-to-t from-black/60 to-transparent text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none truncate">
          {{ item.title || '图片' }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick, useTemplateRef, watch } from 'vue';
import { gsap } from 'gsap';

interface Item {
  id: string;
  img: string;
  url: string;
  width: number;
  height: number;
  title?: string;
}

interface MasonryProps {
  items: Item[];
  scaleOnHover?: boolean;
  colorShiftOnHover?: boolean;
}

const props = withDefaults(defineProps<MasonryProps>(), {
  scaleOnHover: true,
  colorShiftOnHover: true
});

// --- 状态 ---
const hoveredId = ref<string | null>(null);
const hasAnimated = ref(false); // 确保只执行一次入场动画

// --- 响应式列数 ---
const useMedia = (queries: string[], values: number[], defaultValue: number) => {
  const get = () => {
    if (typeof window === 'undefined') return defaultValue;
    const index = queries.findIndex(q => window.matchMedia(q).matches);
    return index > -1 ? values[index] : defaultValue;
  };
  const value = ref<number>(get());
  const handler = () => (value.value = get());

  onMounted(() => {
    queries.forEach(q => window.matchMedia(q).addEventListener('change', handler));
    window.addEventListener('resize', handler);
  });
  onUnmounted(() => {
    queries.forEach(q => window.matchMedia(q).removeEventListener('change', handler));
    window.removeEventListener('resize', handler);
  });
  return value;
};

// 列数配置
const columns = useMedia(
  ['(min-width: 1600px)', '(min-width: 1200px)', '(min-width: 768px)', '(min-width: 480px)'],
  [5, 4, 3, 2],
  1
);

// --- 容器测量 ---
const containerRef = useTemplateRef<HTMLDivElement>('containerRef');
const containerWidth = ref(0);

const updateWidth = () => {
  if (containerRef.value && containerRef.value.clientWidth > 0) {
    containerWidth.value = containerRef.value.clientWidth;
  }
};

onMounted(() => {
  updateWidth();
  window.addEventListener('resize', updateWidth);
  const ro = new ResizeObserver(() => updateWidth());
  if (containerRef.value) ro.observe(containerRef.value);
  onUnmounted(() => {
    window.removeEventListener('resize', updateWidth);
    ro.disconnect();
  });
});

// --- 核心布局计算 ---
const gridData = computed(() => {
  const width = containerWidth.value;
  if (!width) return { items: [], maxHeight: 0 };

  const colCount = columns.value;
  const gap = 16;
  const columnWidth = (width - (colCount - 1) * gap) / colCount;
  const colHeights = new Array(colCount).fill(0);

  const layoutItems = props.items.map(item => {
    // 找最短列
    const minHeight = Math.min(...colHeights);
    const colIndex = colHeights.indexOf(minHeight);

    const x = colIndex * (columnWidth + gap);
    const y = minHeight;

    // 计算高度
    const rawW = Number(item.width) || 1000;
    const rawH = Number(item.height) || 1000;
    const renderHeight = Math.floor(columnWidth * (rawH / rawW));

    colHeights[colIndex] += renderHeight + gap;

    return { ...item, x, y, w: columnWidth, h: renderHeight };
  });

  return { items: layoutItems, maxHeight: Math.max(...colHeights) };
});

const grid = computed(() => gridData.value.items);
const containerHeight = computed(() => gridData.value.maxHeight);

const openUrl = (url: string) => { if (url) window.open(url, '_blank', 'noopener'); };

// --- 简单纯粹的入场动画 ---
watch(grid, (newItems) => {
  if (newItems.length === 0) return;

  // 如果已经动画过一次，后续的数据更新（如resize）就不再播放入场动画
  if (hasAnimated.value) return;

  nextTick(() => {
    const elements = containerRef.value?.querySelectorAll('.masonry-item');
    if (elements) {
      // 经典淡入效果，不涉及位移排序，性能最好
      gsap.fromTo(elements,
        {
          opacity: 0,
          y: 20 // 稍微向下偏移一点点
        },
        {
          opacity: 1,
          y: 0,
          duration: 0.6,
          stagger: 0.05, // 顺次显示
          ease: 'power2.out',
          onComplete: () => {
            // 动画结束后清除 GSAP 的内联样式，避免干扰 Vue 的布局
            gsap.set(elements, { clearProps: 'all' });
            hasAnimated.value = true;
          }
        }
      );
    }
  });
}, { once: true });
</script>