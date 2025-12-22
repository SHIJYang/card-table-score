<script setup>
  /**
   * 3D Cube Loader Component (修复版)
   * 现在可以通过 hue 属性完美控制整体颜色
   */
  const props = defineProps({
    // 缩放比例
    scale: {
      type: Number,
      default: 1
    },
    // 色相 (0-360): 红色=0, 紫色=280, 青色(默认)=176
    hue: {
      type: Number,
      default: 176
    }
  })
  </script>
  
  <template>
    <div 
      class="cube-loader" 
      :style="{ 
        scale: scale, 
        '--h': hue, 
        '--s': '60%' 
      }"
    >
      <div class="cube-top"></div>
      <div class="cube-wrapper">
        <span style="--i:0" class="cube-span"></span>
        <span style="--i:1" class="cube-span"></span>
        <span style="--i:2" class="cube-span"></span>
        <span style="--i:3" class="cube-span"></span>
      </div>
    </div>
  </template>
  
  <style scoped>
  .cube-loader {
    position: relative;
    width: 75px;
    height: 75px;
    transform-style: preserve-3d;
    transform: rotateX(-30deg);
    animation: animate 4s linear infinite;
  }
  
  @keyframes animate {
    0% {
      transform: rotateX(-30deg) rotateY(0);
    }
    100% {
      transform: rotateX(-30deg) rotateY(360deg);
    }
  }
  
  .cube-loader .cube-wrapper {
    position: absolute;
    width: 100%;
    height: 100%;
    transform-style: preserve-3d;
  }
  
  .cube-loader .cube-wrapper .cube-span {
    position: absolute;
    width: 100%;
    height: 100%;
    /* 这里的 rotateY 计算保持不变 */
    transform: rotateY(calc(90deg * var(--i))) translateZ(37.5px);
    
   
    background: linear-gradient(
      to bottom,
      hsl(var(--h), var(--s), 25%) 0%,
      hsl(var(--h), var(--s), 32%) 5.5%,
      hsl(var(--h), var(--s), 37%) 12.1%,
      hsl(var(--h), var(--s), 40%) 19.6%,
      hsl(var(--h), var(--s), 44%) 27.9%,
      hsl(var(--h), var(--s), 46%) 36.6%,
      hsl(var(--h), var(--s), 49%) 45.6%,
      hsl(var(--h), var(--s), 51%) 54.6%,
      hsl(var(--h), var(--s), 53%) 63.4%,
      hsl(var(--h), var(--s), 54%) 71.7%,
      hsl(var(--h), var(--s), 55%) 79.4%,
      hsl(var(--h), var(--s), 56%) 86.2%,
      hsl(var(--h), var(--s), 57%) 91.9%,
      hsl(var(--h), var(--s), 58%) 100%
    );
  }
  
  .cube-top {
    position: absolute;
    width: 75px;
    height: 75px;
    /* 顶部使用较暗的颜色 */
    background: hsl(var(--h), var(--s), 15%);
    transform: rotateX(90deg) translateZ(37.5px);
    transform-style: preserve-3d;
  }
  
  /* 底部发光阴影 */
  .cube-top::before {
    content: '';
    position: absolute;
    width: 75px;
    height: 75px;
    /* 阴影使用标准亮度 */
    background: hsl(var(--h), var(--s), 40%);
    transform: translateZ(-90px);
    filter: blur(10px);
    opacity: 0.8;
    box-shadow: 
      0 0 10px #c7c7c7,
      0 0 20px hsl(var(--h), var(--s), 40%),
      0 0 30px #747474,
      0 0 40px hsl(var(--h), var(--s), 40%);
  }
  </style>