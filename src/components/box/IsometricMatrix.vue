<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps({
  // 矩阵维度：例如 4 代表 4x4x4
  count: {
    type: Number,
    default: 3
  },
  // 基础方块大小
  size: {
    type: Number,
    default: 50
  },
  hoverColor: {
    type: String,
    default: '#ef4149'
  },
  baseColor: {
    type: String,
    default: '#dcdcdc'
  },
  duration: {
    type: Number,
    default: 5
  }
});

// 计算样式变量
const containerStyle = computed(() => {
  const s = props.size;
  return {
    '--size': `${s}px`,
    '--depth': `${s * 0.8}px`,      // 侧面深度
    '--layer-gap': `${s * 1.2}px`,  // 层级Z轴间距
    '--grid-x': `${s * 1.4}px`,     // 列X轴间距
    '--grid-y': `${s * 1.2}px`,  // 这个在当前布局逻辑中用不到，垂直靠flex堆叠
    '--hover-color': props.hoverColor,
    '--base-color': props.baseColor,
    '--anim-duration': `${props.duration}s`
  };
});

// 计算每一层的偏移量 (Z轴/Layer)
// 为了让矩阵始终居中，我们需要从 -(n-1)/2 到 (n-1)/2 进行偏移
const getLayerStyle = (index: number) => {
  // index 从 0 开始
  // 比如 count=3, index: 0, 1, 2 -> offset: -1, 0, 1
  // 比如 count=4, index: 0, 1, 2, 3 -> offset: -1.5, -0.5, 0.5, 1.5
  const offset = index - (props.count - 1) / 2;
  return {
    // 越往后的层级 z-index 越高，防止遮挡错误
    zIndex: index + 1,
    // 利用 calc 在 style 中直接计算偏移
    translate: `calc(var(--layer-gap) * ${offset}) calc(var(--layer-gap) * ${offset})`
  };
};

// 计算每一列的偏移量 (X轴/Row)
const getColumnStyle = (index: number) => {
  // 这里的逻辑对应原 CSS 中的 --x 变量
  // 原逻辑：右边是-1，左边是1 (方向是反的，因为CSS中是 -70px * var(--x))
  // 我们保持中心偏移算法
  const offset = index - (props.count - 1) / 2;

  // 注意：原CSS中 x=1 在左边，x=-1 在右边。
  // 我们直接传变量给 CSS 处理即可
  return {
    '--x': -offset, // 取反以匹配视觉方向，或者调整CSS乘数
    '--y': 0 // 垂直方向由 span 堆叠决定，这里固定为 0
  };
};
</script>

<template>
  <div class="iso-container" :style="containerStyle">
    <div class="cube-matrix">
      <div class="cube" v-for="(z, zIndex) in count" :key="`z-${zIndex}`" :style="getLayerStyle(zIndex)">
        <div v-for="(x, xIndex) in count" :key="`x-${xIndex}`" :style="getColumnStyle(xIndex)">
          <span v-for="y in count" :key="`y-${y}`" :style="{ '--i': count - y + 1 }"></span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
@keyframes animate {
  0% {
    filter: hue-rotate(0deg);
  }

  100% {
    filter: hue-rotate(360deg);
  }
}

.iso-container {
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
  background: transparent;
  // 根据数量动态增加 padding，防止旋转时被切
  padding: calc(var(--size) * 6);
  box-sizing: border-box;
}

.cube-matrix {
  position: relative;
  top: calc(var(--size) * -2);
  transform: skewY(-20deg);
  animation: animate var(--anim-duration) linear infinite;

  .cube {
    position: relative;
    // z-index 和 translate 现在由行内样式(style)动态控制
    // 移除了原先写死的 &:nth-child(...) 逻辑

    div {
      position: absolute;
      display: flex;
      flex-direction: column;
      gap: calc(var(--size) * 0.6);

      // 核心定位逻辑：保持原CSS公式
      translate: calc(var(--grid-x) * var(--x)) calc(var(--grid-y) * var(--y));

      span {
        position: relative;
        display: inline-block;
        width: var(--size);
        height: var(--size);
        background: var(--base-color);
        z-index: calc(1 * var(--i)); // 由 v-for 里的 style 控制
        transition: 1.5s;

        &:hover {
          transition: 0s;
          background: var(--hover-color);
          filter: drop-shadow(0 0 30px var(--hover-color));

          &:before,
          &:after {
            transition: 0s;
            background: var(--hover-color);
          }
        }

        &:before {
          content: "";
          position: absolute;
          left: calc(var(--depth) * -1);
          width: var(--depth);
          height: 100%;
          background: #fff;
          transform-origin: right;
          transform: skewY(45deg);
          transition: 1.5s;
        }

        &:after {
          content: "";
          position: absolute;
          top: calc(var(--depth) * -1);
          left: 0px;
          width: 100%;
          height: var(--depth);
          background: #f2f2f2;
          transform-origin: bottom;
          transform: skewX(45deg);
          transition: 1.5s;
        }
      }
    }
  }
}
</style>

<!-- 1. count (数量/维度)作用：决定矩阵是几乘几乘几的结构。默认值：3 (即 3x3x3，共 27 个小方块)。效果：设为 2：就是一个简单的 $2 \times 2 \times 2$ 小立方体组（共 8 个）。设为 4：就是一个庞大的 $4 \times 4 \times 4$ 矩阵（共 64 个）。注意：数字越大，方块越多，浏览器渲染压力越大。建议不要超过 6 或 7。
 2. size (基础大小)作用：决定矩阵里每一个小方块的像素大小。默认值：50 (像素)。效果：间距会自动计算：你不需要管间距，改了这个值，整个矩阵会按比例放大或缩小。设为 20：变得很迷你，适合做图标或背景点缀。设为 80：变得巨大，适合做页面的主视觉图。
 3. hoverColor (悬停高亮色)作用：当鼠标摸到方块时，方块变成什么颜色（并发光）。默认值：'#ef4149' (一种偏红的颜色)。效果：这是互动反馈颜色。如果你网站是科技风，可以改成 荧光蓝 (#00FFFF)。如果你网站是暗黑风，可以改成 深紫 (#8A2BE2)。
 4. baseColor (基础底色)作用：当鼠标没碰到方块时，方块顶面的默认颜色。默认值：'#dcdcdc' (浅灰色)。效果：它决定了矩阵“静止”时的样子。通常保持浅灰或白色，这样后面的 RGB 跑马灯动画（hue-rotate）效果最明显。如果改成黑色，RGB 跑马灯效果会看不见（因为黑色没有色相）。
 5. duration (动画速度)作用：控制颜色变幻（Hue Rotate 滤镜）转一圈需要多少秒。默认值：5 (秒)。效果：数值越小，颜色闪烁越快（例如 1 秒会像迪斯科灯球）。数值越大，颜色变化越慢、越柔和（例如 20 秒就是慢慢的渐变）。 -->