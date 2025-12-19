<template>
  <div class="gesture-group">
    <label 
      v-for="item in options" 
      :key="item.value" 
      class="radio-item" 
      :style="{ '--hue': item.hue || 170 }"
    >
      <input 
        type="radio" 
        :name="name" 
        :value="item.value" 
        :checked="modelValue === item.value"
        @change="$emit('update:modelValue', item.value)"
      >
      <div class="button-body">
        <span class="shadow"></span>
        <span class="edge"></span>
        <span class="front">
          <span v-if="isSvg(item.icon)" v-html="item.icon" class="icon-wrap"></span>
          <span v-else class="text-wrap">{{ item.icon }}</span>
        </span>
        <div class="pop-layer">
          <span v-if="isSvg(item.icon)" v-html="item.icon"></span>
          <span v-else>{{ item.icon }}</span>
        </div>
      </div>
    </label>
  </div>
</template>

<script setup>
defineProps({
  modelValue: [String, Number],
  options: { type: Array, required: true }, // { value, icon, hue }
  name: { type: String, default: 'gesture-radio-group' }
});
defineEmits(['update:modelValue']);

const isSvg = (str) => typeof str === 'string' && str.includes('<svg');
</script>

<style scoped>
.gesture-group { display: flex; gap: 16px; flex-wrap: wrap; padding: 10px; }

.radio-item {
  --main-clr: hsl(var(--hue) 100% 50%);
  --edge-clr: hsl(var(--hue) 100% 30%);
  position: relative;
  cursor: pointer;
  user-select: none;
}

.radio-item input { position: absolute; opacity: 0; width: 0; height: 0; }

.button-body {
  position: relative;
  width: 50px;
  height: 50px;
  opacity: 0.4;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  filter: drop-shadow(0 0 8px hsl(var(--hue) 100% 40% / 0.3));
}

input:checked + .button-body {
  opacity: 1;
  filter: drop-shadow(0 0 20px hsl(var(--hue) 100% 40% / 0.7));
}

.shadow {
  position: absolute; top: 2px; left: 0; width: 100%; height: 100%;
  background: rgba(0,0,0,0.25); border-radius: 12px;
}

.edge {
  position: absolute; top: 0; left: 0; width: 100%; height: 100%;
  border-radius: 12px;
  background: linear-gradient(to left, hsl(var(--hue) 100% 15%), var(--edge-clr), hsl(var(--hue) 100% 15%));
}

.front {
  display: flex; align-items: center; justify-content: center;
  position: relative; width: 100%; height: 100%;
  background: var(--main-clr); border-radius: 12px;
  transform: translateY(-4px);
  box-shadow: inset 3px 3px 6px hsl(var(--hue) 100% 75%), inset -3px -3px 6px hsl(var(--hue) 100% 25%);
  transition: transform 0.2s;
}

.icon-wrap :deep(svg) { width: 24px; height: 24px; color: hsl(var(--hue) 100% 15%); display: block; }
.text-wrap { font-size: 20px; }

/* 交互 */
.radio-item:hover .front { transform: translateY(-6px); }
.radio-item:active .front { transform: translateY(-2px); }

/* 喷发动画 */
.pop-layer {
  position: absolute; top: 0; left: 50%; transform: translateX(-50%);
  width: 24px; height: 24px; opacity: 0; z-index: -1;
  color: var(--main-clr); pointer-events: none;
}
.pop-layer :deep(svg) { width: 100%; height: 100%; }

input:checked + .button-body .pop-layer { animation: fly 0.6s ease-out; }

@keyframes fly {
  0% { transform: translate(-50%, 0); opacity: 0.8; }
  50% { transform: translate(-50%, -45px); opacity: 0.4; }
  100% { transform: translate(-50%, -10px); opacity: 0; }
}
</style>

<!-- <GestureRadio 
      v-model="activeMode" 
      :options="menuConfig" 
    />

    <div class="status-board">
      <p>当前激活模式: <strong>{{ activeMode }}</strong></p>
      <div class="color-preview" :style="{ background: `hsl(${activeHue}, 100%, 50%)` }"></div>
    </div>

    // 选中的值
const activeMode = ref('tree');

// 配置数组：value 对应逻辑名，hue 对应 HSL 颜色，icon 支持 SVG 或 Emoji
const menuConfig = [
  { 
    value: 'tree', 
    hue: 145, 
    icon: `<svg viewBox="0 0 24 24"><path fill="currentColor" d="M11 20H6l1.1-2h3.9c.5 0 .9-.3 1-.8l2-9.2c.1-.5-.2-1-.7-1.1s-1 .2-1.1.7L10.7 15H8.3l1.5-7.1c.1-.5-.2-1-.7-1.1s-1 .2-1.1.7L6.2 15H3.8l1.8-8.5C5.9 5.2 7.1 4 8.5 4h7c1.4 0 2.6 1.2 2.8 2.5l1.7 8.5h-2.4l-1.5-7.1c-.1-.5-.6-.8-1.1-.7s-.8.6-.7 1.1l1.5 7.1h-2.4l-2 9.2c-.1.5-.6.8-1.1.7s-.8-.6-.7-1.1L13.7 15h-3.9l-1.1 2h5.3l-1.1 3z"/></svg>` 
  },
  { 
    value: 'scatter', 
    hue: 190, 
    icon: '✨' 
  },
  { 
    value: 'zoom', 
    hue: 280, 
    icon: `<svg viewBox="0 0 24 24"><path fill="currentColor" d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0016 9.5 6.5 6.5 0 109.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>` 
  },
  {
    value: 'theme',
    hue: 10,
    icon: '🎨'
  }
];

// 获取当前选中颜色的计算属性
const activeHue = computed(() => {
  return menuConfig.find(i => i.value === activeMode.value)?.hue || 0;
}); -->