<script setup>
  import { computed } from 'vue'
  
  const props = defineProps({
    // 尺寸，单位 px，默认 44
    size: {
      type: [Number, String],
      default: 44
    },
    // 主题颜色，默认蓝色
    color: {
      type: String,
      default: '#004dff'
    },
    // 动画速度，单位秒
    duration: {
      type: [Number, String],
      default: 2
    }
  })
  
  // 辅助函数：将 Hex 颜色转为带透明度的 RGBA (用于背景)
  const hexToRgba = (hex, alpha) => {
    let c = hex.substring(1).split('')
    if (c.length === 3) {
      c = [c[0], c[0], c[1], c[1], c[2], c[2]]
    }
    c = '0x' + c.join('')
    return 'rgba(' + [(c >> 16) & 255, (c >> 8) & 255, c & 255].join(',') + ',' + alpha + ')'
  }
  
  // 计算动态样式
  const styles = computed(() => {
    const sizeVal = typeof props.size === 'number' ? `${props.size}px` : props.size
    // 计算一半尺寸，用于 3D 偏移
    const halfSize = typeof props.size === 'number' ? `${props.size / 2}px` : `calc(${props.size} / 2)`
    
    // 尝试处理颜色：如果是 hex 则自动生成透明背景，否则直接使用原色
    const isHex = props.color.startsWith('#')
    const bgColor = isHex ? hexToRgba(props.color, 0.2) : props.color
  
    return {
      '--spinner-size': sizeVal,
      '--spinner-half-size': halfSize,
      '--spinner-color': props.color,
      '--spinner-bg': bgColor,
      '--spinner-duration': `${props.duration}s`
    }
  })
  </script>
  
  <template>
    <div class="cube-spinner-container" :style="styles">
      <div class="spinner">
        <div></div>
        <div></div>
        <div></div>
        <div></div>
        <div></div>
        <div></div>
      </div>
    </div>
  </template>
  
  <style scoped>
  .cube-spinner-container {
    display: inline-block;
  }
  
  .spinner {
    width: var(--spinner-size);
    height: var(--spinner-size);
    animation: spinner-anim var(--spinner-duration) infinite ease;
    transform-style: preserve-3d;
  }
  
  .spinner > div {
    background-color: var(--spinner-bg);
    height: 100%;
    position: absolute;
    width: 100%;
    border: 2px solid var(--spinner-color);
    box-sizing: border-box; /* 确保边框包含在尺寸内 */
  }
  
  /* 注意：这里将原本写死的 px 换成了 var(--spinner-half-size) 
     translateZ 的正负值逻辑必须保留
  */
  
  /* 面 1: 后 */
  .spinner div:nth-of-type(1) {
    transform: translateZ(calc(var(--spinner-half-size) * -1)) rotateY(180deg);
  }
  
  /* 面 2: 右 */
  .spinner div:nth-of-type(2) {
    transform: rotateY(-270deg) translateX(50%);
    transform-origin: top right;
  }
  
  /* 面 3: 左 */
  .spinner div:nth-of-type(3) {
    transform: rotateY(270deg) translateX(-50%);
    transform-origin: center left;
  }
  
  /* 面 4: 上 */
  .spinner div:nth-of-type(4) {
    transform: rotateX(90deg) translateY(-50%);
    transform-origin: top center;
  }
  
  /* 面 5: 下 */
  .spinner div:nth-of-type(5) {
    transform: rotateX(-90deg) translateY(50%);
    transform-origin: bottom center;
  }
  
  /* 面 6: 前 */
  .spinner div:nth-of-type(6) {
    transform: translateZ(var(--spinner-half-size));
  }
  
  @keyframes spinner-anim {
    0% {
      transform: rotate(45deg) rotateX(-25deg) rotateY(25deg);
    }
  
    50% {
      transform: rotate(45deg) rotateX(-385deg) rotateY(25deg);
    }
  
    100% {
      transform: rotate(45deg) rotateX(-385deg) rotateY(385deg);
    }
  }
  </style>


<!-- 引入组件：

JavaScript

import CubeSpinner from '@/components/CubeSpinner.vue'
调用示例：

HTML

<CubeSpinner />

<CubeSpinner :size="100" />

<CubeSpinner color="#ff0000" />

<CubeSpinner :size="60" color="#55aa00" :duration="1.5" /> -->