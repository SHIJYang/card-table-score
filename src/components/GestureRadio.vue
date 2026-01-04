<template>
  <div class="gesture-container">
    <label 
      v-for="item in options" 
      :key="item.value" 
      class="radio-label" 
      :style="{ '--base-color': item.rgb }"
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
          
          <img v-else-if="isImg(item.icon)" :src="item.icon" class="icon-img" alt="icon" />
          
          <span v-else class="text-wrap">{{ item.icon }}</span>
        </span>
        
        <div class="pop-layer">
          <span v-if="isSvg(item.icon)" v-html="item.icon"></span>
          <img v-else-if="isImg(item.icon)" :src="item.icon" style="width:100%; height:100%; object-fit:contain;" />
          <span v-else>{{ item.icon }}</span>
        </div>
      </div>
    </label>
  </div>
</template>

<script setup>
defineProps({
  modelValue: [String, Number],
  options: { type: Array, required: true },
  name: { type: String, default: 'gesture-radio-group' }
});
defineEmits(['update:modelValue']);

// 判定逻辑
const isSvg = (str) => typeof str === 'string' && str.trim().startsWith('<svg');
// 宽松判定：只要包含点(.)或者斜杠(/)就认为是图片路径
const isImg = (str) => typeof str === 'string' && (/\.(png|jpg|jpeg|svg|webp|gif|ico)$/i.test(str) || str.includes('/'));
</script>

<style scoped>
/* 容器布局 */
.gesture-container {
  display: flex;
  gap: 16px;
  padding: 10px;
  justify-content: center;
}

.radio-label {
  position: relative;
  cursor: pointer;
  user-select: none;
  /* 颜色计算逻辑 */
  --main-color: var(--base-color);
  --shadow-color: color-mix(in srgb, var(--base-color), black 40%);
  --highlight-color: color-mix(in srgb, var(--base-color), white 60%);
  --edge-dark: color-mix(in srgb, var(--base-color), black 68%);
  --edge-light: color-mix(in srgb, var(--base-color), black 36%);
}

/* 隐藏原生 Radio */
.radio-label input { position: absolute; opacity: 0; width: 0; height: 0; }

/* 按钮主体 */
.button-body {
  position: relative;
  width: 50px;
  height: 50px;
  background: transparent;
  border-radius: 12px;
  opacity: 0.5;
  transition: opacity 0.3s ease, filter 0.3s ease;
  box-shadow: 0px 0px 20px -5px var(--shadow-color);
}

input:checked + .button-body {
  opacity: 1;
  filter: drop-shadow(0 0 10px var(--main-color));
}

.shadow {
  position: absolute; top: 0; left: 0; width: 100%; height: 100%;
  border-radius: 12px;
  background: rgba(0, 0, 0, 0.25);
  transform: translateY(2px);
  transition: transform 0.6s cubic-bezier(.3, .7, .4, 1);
}

.edge {
  position: absolute; top: 0; left: 0; width: 100%; height: 100%;
  border-radius: 12px;
  background: linear-gradient(to left, var(--edge-dark) 0%, var(--edge-light) 8%, var(--edge-light) 92%, var(--edge-dark) 100%);
}

.front {
  display: flex; align-items: center; justify-content: center;
  position: relative; width: 100%; height: 100%;
  border-radius: 12px;
  background: var(--main-color);
  color: white;
  transform: translateY(-4px);
  box-shadow: inset 3px 3px 6px var(--shadow-color), inset -3px -3px 6px var(--highlight-color);
  transition: transform 0.6s cubic-bezier(.3, .7, .4, 1);
}

/* SVG 图标样式 */
.icon-wrap :deep(svg) {
  width: 26px; height: 26px; display: block; fill: currentColor; color: var(--edge-dark);
}

/* 【关键】图片图标样式 */
.icon-img {
  width: 28px;
  height: 28px;
  object-fit: contain;
  /* 给图片加一点暗色投影，防止在亮色背景看不清 */
  filter: drop-shadow(0 2px 3px rgba(0,0,0,0.2)); 
}

.text-wrap {
  font-size: 22px; line-height: 1; text-shadow: 0 2px 0 rgba(0,0,0,0.1);
}

/* 交互动画 */
.radio-label:hover .front { transform: translateY(-6px); transition: transform 0.25s cubic-bezier(.3, .7, .4, 1.5); }
.radio-label:hover .shadow { transform: translateY(4px); transition: transform 0.25s cubic-bezier(.3, .7, .4, 1.5); }
.radio-label:active .front { transform: translateY(-1px); transition: transform 0.05s; }
.radio-label:active .shadow { transform: translateY(1px); transition: transform 0.05s; }

/* Pop 动画 */
.pop-layer {
  position: absolute; top: 0; left: 50%; transform: translate(-50%, 0);
  width: 24px; height: 24px; z-index: -1; opacity: 0; pointer-events: none; color: var(--main-color);
}
.pop-layer :deep(svg) { width: 100%; height: 100%; fill: currentColor; }
input:checked + .button-body .pop-layer { animation: fly-up 0.5s ease-in-out; }
@keyframes fly-up {
  0% { transform: translate(-50%, 0); opacity: 0.6; }
  50% { transform: translate(-50%, -40px); opacity: 0.8; }
  100% { transform: translate(-50%, 0); opacity: 0; }
}
</style>
