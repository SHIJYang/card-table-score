<template>
  <div class="glass-container" :style="{ '--total-items': options.length }">
    <label 
      v-for="(item, index) in options" 
      :key="item.value" 
      class="glass-item"
      :class="{ 'is-active': modelValue === item.value }"
    >
      <input 
        type="radio" 
        :name="name" 
        :value="item.value"
        :checked="modelValue === item.value"
        @change="$emit('update:modelValue', item.value)"
      >
      <span class="label-text">{{ item.label }}</span>
    </label>

    <div class="glass-glider" :style="gliderStyle"></div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  modelValue: [String, Number],
  options: {
    type: Array,
    required: true,
    // 格式: [{ label: 'Silver', value: 's', gradient: '...', shadow: '...' }]
  },
  name: {
    type: String,
    default: () => 'glass-group-' + Math.random().toString(36).substr(2, 9)
  }
});

defineEmits(['update:modelValue']);

// 计算滑块的样式位置和颜色
const gliderStyle = computed(() => {
  const index = props.options.findIndex(opt => opt.value === props.modelValue);
  const activeIndex = index === -1 ? 0 : index;
  const activeOption = props.options[activeIndex] || {};

  return {
    // 核心逻辑：移动自身宽度的 100% * index
    transform: `translateX(${activeIndex * 100}%)`,
    // 如果选项里传了 gradient 就用，没传就用默认的
    background: activeOption.gradient || 'linear-gradient(135deg, rgba(255,255,255,0.4), rgba(255,255,255,0.1))',
    boxShadow: activeOption.shadow || '0 4px 12px rgba(0,0,0,0.1)'
  };
});
</script>

<style scoped>
.glass-container {
  /* 基础容器样式 */
  --bg: rgba(255, 255, 255, 0.06);
  --text-inactive: #a0a0a0;
  --text-active: #ffffff;
  
  display: flex;
  position: relative;
  background: var(--bg);
  border-radius: 1rem;
  backdrop-filter: blur(12px);
  /* 容器内阴影 */
  box-shadow:
    inset 1px 1px 4px rgba(255, 255, 255, 0.1),
    inset -1px -1px 6px rgba(0, 0, 0, 0.3),
    0 4px 12px rgba(0, 0, 0, 0.15);
  overflow: hidden;
  width: fit-content;
  user-select: none;
}

.glass-item {
  /* 动态宽度：总宽度的 1/N */
  width: 100px; /* 默认最小宽度，可由外部覆盖 */
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.8rem 1.2rem;
  cursor: pointer;
  position: relative;
  z-index: 2; /* 确保文字在滑块之上 */
  transition: color 0.3s ease;
  color: var(--text-inactive);
}

.glass-item input {
  display: none;
}

.label-text {
  font-size: 14px;
  font-weight: 600;
  letter-spacing: 0.5px;
}

/* 选中状态文字高亮 */
.glass-item.is-active {
  color: var(--text-active);
  text-shadow: 0 1px 2px rgba(0,0,0,0.2);
}

/* 滑块样式 */
.glass-glider {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  /* 核心：滑块宽度由 CSS 变量自动计算 (100% / item数量) */
  width: calc(100% / var(--total-items));
  border-radius: 1rem;
  z-index: 1;
  pointer-events: none; /* 穿透点击 */
  
  /* 那个Q弹的动画效果 */
  transition:
    transform 0.5s cubic-bezier(0.37, 1.95, 0.66, 0.56),
    background 0.4s ease-in-out,
    box-shadow 0.4s ease-in-out;
}
</style>

<!-- <template>
  <div class="playground">
    <h2>Glass Segmented Control</h2>

    <GlassSegmentedControl 
      v-model="currentPlan" 
      :options="planOptions"
    />
    
    <div class="output">
      当前选择: <strong>{{ currentPlan }}</strong>
    </div>

    <div style="margin-top: 40px;">
      <GlassSegmentedControl 
        v-model="themeMode" 
        :options="simpleOptions"
      />
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import GlassSegmentedControl from './GlassSegmentedControl.vue';

const currentPlan = ref('gold');
const themeMode = ref('dark');

// 1. 复杂的配置（带自定义渐变和光效）
const planOptions = [
  { 
    label: 'Silver', 
    value: 'silver',
    // 银色效果
    gradient: 'linear-gradient(135deg, #c0c0c055, #e0e0e0)',
    shadow: '0 0 18px rgba(192, 192, 192, 0.5), 0 0 10px rgba(255, 255, 255, 0.4) inset'
  },
  { 
    label: 'Gold', 
    value: 'gold',
    // 金色效果
    gradient: 'linear-gradient(135deg, #ffd70055, #ffcc00)',
    shadow: '0 0 18px rgba(255, 215, 0, 0.5), 0 0 10px rgba(255, 235, 150, 0.4) inset'
  },
  { 
    label: 'Platinum', 
    value: 'platinum',
    // 铂金效果
    gradient: 'linear-gradient(135deg, #d0e7ff55, #a0d8ff)',
    shadow: '0 0 18px rgba(160, 216, 255, 0.5), 0 0 10px rgba(200, 240, 255, 0.4) inset'
  }
];

// 2. 简单的配置（使用组件默认样式或简单颜色）
const simpleOptions = [
  { label: 'Light', value: 'light', gradient: '#ffffff', shadow: '0 0 10px white' },
  { label: 'Dark', value: 'dark', gradient: '#222222', shadow: '0 0 10px black' }
];
</script>

<style>
.playground {
  min-height: 100vh;
  background: #1a1a1a; /* 深色背景更能体现毛玻璃效果 */
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: white;
  font-family: sans-serif;
}

.output {
  margin-top: 20px;
  font-size: 1.2rem;
  color: #888;
}

strong {
  color: #fff;
  text-transform: capitalize;
}
</style> -->