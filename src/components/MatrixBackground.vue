<template>
  <div class="matrix-container" ref="containerRef" :style="matrixStyle">
    <span 
      v-for="(char, index) in displayChars" 
      :key="index"
      :style="{ animationDelay: getRandomDelay() }"
    >
      {{ char }}
    </span>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';

import { useSettingsStore } from '@/store'; 

const settingsStore = useSettingsStore();
const containerRef = ref<HTMLElement | null>(null);
const cellCount = ref(0);

// 百家姓数据源
const surnames = "赵钱孙李周吴郑王冯陈褚卫蒋沈韩杨朱秦尤许何吕施张孔曹严华金魏陶姜戚谢邹喻柏水窦章云苏潘葛奚范彭郎鲁韦昌马苗凤花方俞任袁柳酆鲍史唐费廉岑薛雷贺倪汤滕殷罗毕郝邬安常乐于时傅皮卞齐康伍余元卜顾孟平黄和穆萧尹姚邵湛汪祁毛禹狄米贝明臧计伏成戴谈宋茅庞熊纪舒屈项祝董梁杜阮蓝闵席季麻强贾路娄危江童颜郭梅盛林刁钟徐邱骆高夏蔡田樊胡凌霍虞万支柯昝管卢莫经房裘缪干解应宗丁宣邓郁单杭洪包诸左石崔吉钮龚";

// 根据计算出的 cellCount 生成对应数量的字符数组
const displayChars = computed(() => {
  if (cellCount.value === 0) return [];
  const result: string[] = [];
  const len = surnames.length;
  for (let i = 0; i < cellCount.value; i++) {
    result.push(surnames[i % len]);
  }
  return result;
});

// 随机生成动画延迟，让闪烁更自然
const getRandomDelay = () => {
  return `${Math.random() * 5}s`;
};

// 计算所需数量的核心逻辑
const calculateCells = () => {
  if (!containerRef.value) return;

  const width = containerRef.value.offsetWidth;
  const height = containerRef.value.offsetHeight;
  
  // 对应 CSS 中的 grid 尺寸
  const cellSize = 40; 
  
  const cols = Math.ceil(width / cellSize);
  const rows = Math.ceil(height / cellSize);
  
  // 计算总数
  cellCount.value = cols * rows; 
};

// 监听容器大小变化
let resizeObserver: ResizeObserver | null = null;

onMounted(() => {
  calculateCells();
  if (containerRef.value) {
    resizeObserver = new ResizeObserver(() => {
      calculateCells();
    });
    resizeObserver.observe(containerRef.value);
  }
});

onUnmounted(() => {
  if (resizeObserver) {
    resizeObserver.disconnect();
  }
});

// --- 核心：根据 Store 动态计算样式 ---
const matrixStyle = computed(() => {
  // 获取当前主题，如果未定义则回退到 'light'
  const theme = settingsStore.theme || 'light';

  // 基础默认值
  const style: Record<string, string | number> = {
    opacity: 0.3,
    fontFamily: '"Courier New", "Microsoft YaHei", monospace',
    '--color-1': '#409eff',
    '--color-2': '#67c23a',
    '--color-3': '#e6a23c',
    '--matrix-text-idle': 'rgba(144, 147, 153, 0.3)' // 默认闲置颜色
  };

  if (theme === 'light') {
    // 浅色模式：极淡，防止干扰，清新配色
    style.opacity = 0.3;
    style['--color-1'] = '#409eff'; // 蓝
    style['--color-2'] = '#67c23a'; // 绿
    style['--color-3'] = '#e6a23c'; // 橙
  } 
  else if (theme === 'dark') {
    // 深色模式：赛博朋克风，高对比
    style.opacity = 0.5;
    style['--color-1'] = '#409eff'; // 蓝
    style['--color-2'] = '#00ffff'; // 青
    style['--color-3'] = '#bd34fe'; // 霓虹紫
  }
  else if (theme === 'cartoon') {
    // 卡通模式：圆体字，糖果色
    style.opacity = 0.5;
    style.fontFamily = '"Varela Round", "YouYuan", "幼圆", sans-serif';
    style['--color-1'] = '#FF6B6B'; // 粉红
    style['--color-2'] = '#FFE66D'; // 亮黄
    style['--color-3'] = '#4ECDC4'; // 薄荷绿
  }
  else if (theme === 'custom') {
    // 自定义(紫罗兰)：优雅紫色系
    style.opacity = 0.25;
    style['--color-1'] = '#9b59b6'; // 紫
    style['--color-2'] = '#e74c3c'; // 红
    style['--color-3'] = '#f1c40f'; // 金
  }

  return style;
});
</script>

<style scoped>
.matrix-container {
  /* 背景色跟随 CSS 变量 (index.js 注入的) */
  background-color: var(--bgPrimary-color);
  width: 100%;
  height: 100%;
  position: absolute;
  top: 0;
  left: 0;
  z-index: 0;
  overflow: hidden;
  
  /* Grid 布局 */
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(40px, 1fr));
  grid-auto-rows: 40px;
  
  /* 字体设置 (基础回退，具体由 :style 控制) */
  font-size: 20px;
  justify-content: center;
  align-content: center;
  
  /* 平滑过渡 */
  transition: background-color 0.3s ease, opacity 0.3s ease;

  /* 默认变量占位 */
  --matrix-text-idle: var(--textDisabled-color);
  --color-1: var(--primary-color);
  --color-2: var(--primary-color);
  --color-3: var(--primary-color);
}

/* 字符基础样式 */
.matrix-container > span {
  display: flex;
  align-items: center;
  justify-content: center;
  user-select: none;
  line-height: 1;
  
  /* 初始颜色 */
  color: var(--matrix-text-idle);
  opacity: 0.1; /* 默认非常淡 */
  
  transition: color 0.5s, text-shadow 0.5s, transform 0.3s;
  
  /* 默认为颜色1 */
  --active-color: var(--color-1);
}

/* --- 颜色分配逻辑 (利用 3n 规律交错分配) --- */
.matrix-container > span:nth-child(3n+1) { --active-color: var(--color-1); }
.matrix-container > span:nth-child(3n+2) { --active-color: var(--color-2); }
.matrix-container > span:nth-child(3n+3) { --active-color: var(--color-3); }


/* --- 呼吸动画逻辑 (保持原本的随机分布) --- */
.matrix-container > span:nth-child(19n + 2) { animation: theme-pulse 3.5s ease-in-out infinite 0.2s; }
.matrix-container > span:nth-child(29n + 1) { animation: theme-pulse 4.1s ease-in-out infinite 0.7s; }
.matrix-container > span:nth-child(11n)     { animation: theme-pulse 2.9s ease-in-out infinite 1.1s; }
.matrix-container > span:nth-child(37n + 10){ animation: theme-pulse 5.3s ease-in-out infinite 1.5s; }
.matrix-container > span:nth-child(41n + 1) { animation: theme-pulse 3.9s ease-in-out infinite 0.4s; }
.matrix-container > span:nth-child(17n + 9) { animation: theme-pulse 2.8s ease-in-out infinite 0.9s; }
.matrix-container > span:nth-child(23n + 18){ animation: theme-pulse 4.3s ease-in-out infinite 1.3s; }
.matrix-container > span:nth-child(31n + 4) { animation: theme-pulse 5.6s ease-in-out infinite 0.1s; }
.matrix-container > span:nth-child(43n + 20){ animation: theme-pulse 3.6s ease-in-out infinite 1.8s; }
.matrix-container > span:nth-child(13n + 6) { animation: theme-pulse 3.2s ease-in-out infinite 1.2s; }
.matrix-container > span:nth-child(53n + 5) { animation: theme-pulse 4.9s ease-in-out infinite 0.5s; }
.matrix-container > span:nth-child(47n + 15){ animation: theme-pulse 5.9s ease-in-out infinite 1s; }

/* 动画定义：读取当前分配到的 --active-color */
@keyframes theme-pulse {
  0%, 100% {
    color: var(--matrix-text-idle);
    opacity: 0.1;
    text-shadow: none;
    transform: scale(1);
  }
  30% {
    color: var(--active-color); /* 变亮 */
    opacity: 0.7;
    text-shadow: 0 0 5px var(--active-color);
  }
  50% {
    color: var(--active-color); /* 高亮 */
    opacity: 1;
    text-shadow: 
      0 0 10px var(--active-color), 
      0 0 20px var(--active-color);
    transform: scale(1.15); 
  }
  70% {
    /* 强光回落，变白增加闪烁感 */
    color: #fff; 
    opacity: 0.8;
    text-shadow: 0 0 10px #fff;
  }
}
</style>