<template>
  <div class="layton-card-complete" :style="{ width: cardWidth, height: cardHeight }" @mouseleave="resetCard">
    <div class="layton-card-all">

      <div class="layton-card-front">
        <div class="layton-card-icon">
          <div class="layton-card-hat"></div>
        </div>
        <div class="layton-card-text">
          <p>PUZZLE</p>
        </div>
        <div class="layton-card-text">
          <p>{{ puzzleNumber }}</p>
        </div>
      </div>

      <div class="layton-card-back">
        <div class="layton-card-back-text">
          <slot name="question">
            <p>Default Question Text...</p>
          </slot>
        </div>
      </div>

      <div class="layton-card-result" :class="{ show: currentImage }">
        <img v-if="currentImage" :src="currentImage" alt="Result" />
      </div>

    </div>

    <div class="layton-card-select">
      <div v-for="option in ['A', 'B', 'C']" :key="option" class="layton-card-button"
        :class="{ active: selectedOption === option }" @click.stop="showImage(option)">
        <p>{{ option }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';

interface Props {
  puzzleNumber?: string | number;
  width?: string;  // 新增: 宽度
  height?: string; // 新增: 高度
  images: {
    A: string;
    B: string;
    C: string;
  };
}

// 设置默认宽高，保持原有比例
const props = withDefaults(defineProps<Props>(), {
  puzzleNumber: '???',
  width: '13.5em',
  height: '19em',
  images: () => ({ A: '', B: '', C: '' })
});

// 为了兼容传入数字或不带单位的字符串，简单的处理逻辑
const cardWidth = computed(() => props.width);
const cardHeight = computed(() => props.height);

const selectedOption = ref<string | null>(null);
const currentImage = ref<string>('');

const showImage = (option: string) => {
  const key = option as keyof typeof props.images;
  selectedOption.value = option;
  currentImage.value = props.images[key];
};

const resetCard = () => {
  // 鼠标移出时是否重置，根据需求开启
  selectedOption.value = null;
  currentImage.value = '';
};
</script>

<style scoped>
/* 根容器：接收动态宽高 */
.layton-card-complete {
  /* width/height 由行内样式控制 */
  transition: all 1s;
  perspective: 1000px;
  position: relative;
}

.layton-card-all {
  width: 100%;
  height: 100%;
  position: relative;
  transition: all 1s;
  transform-style: preserve-3d;
}

/* 核心样式：正面和背面 */
.layton-card-front,
.layton-card-back {
  width: 100%;
  height: 100%;
  background: #c9b28bff;
  position: absolute;
  top: 0;
  left: 0;
  z-index: 3;
  -webkit-backface-visibility: hidden;
  backface-visibility: hidden;
  display: flex;
  border: solid 0.5em #503c30ff;
  box-sizing: border-box;
  /* 确保边框计算在宽高内 */
  box-shadow: 0em 0em 2.5em rgba(0, 0, 0, 0.255);
  border-radius: 5px;
}

.layton-card-front {
  box-shadow:
    inset 0em 0em 4em #503c30ff,
    0em 0em 2.5em rgba(0, 0, 0, 0.255);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.layton-card-back {
  transform: rotateY(180deg);
  background-color: rgb(214, 204, 180);
  display: flex;
  justify-content: center;
  align-items: center;
}

/* 悬停翻转逻辑：卡片翻转180度并旋转90度(变成横向) */
.layton-card-complete:hover .layton-card-all {
  transform: rotateY(180deg) rotate(90deg);
}

/* 悬停时显示按钮 */
.layton-card-complete:hover .layton-card-button {
  opacity: 100%;
  margin-bottom: 0em;
}

/* --- 新增/修改：结果图片覆盖层 ---
  位于 layton-card-all 内部，这样它会参与 3D 旋转
*/
.layton-card-result {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 10;
  /* 比 front/back (z-index:3) 高，实现覆盖 */

  /* 初始隐藏 */
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.5s;

  transform: rotateY(180deg);


  display: flex;
  justify-content: center;
  align-items: center;
  background-color: rgb(214, 204, 180);
  /* 避免图片加载前透明 */
  border-radius: 5px;
  border: solid 0.5em #503c30ff;
  /* 保持边框风格一致 */
  box-sizing: border-box;
}

.layton-card-result.show {
  opacity: 1;
  pointer-events: auto;
}

.layton-card-result img {

  transform: rotate(90deg);

  object-fit: fit;
}


/* 图标和文字样式 */
.layton-card-icon {
  width: 5.75em;
  height: 5em;
  display: flex;
  justify-content: center;
  box-shadow: inset 0em -0.5em #503c30ff;
}

.layton-card-text p {
  color: #503c30ff;
  font-weight: bold;
  font-size: 25px;
  height: 1.05em;
  margin: 5px 0;
}

.layton-card-hat {
  width: 3.5em;
  height: 4.5em;
  background-color: #503c30ff;
  box-shadow: inset 0em -0.75em #a82507ff;
}

.layton-card-back-text {
  color: #503c30ff;
  font-size: 14px;
  /* 保持文字旋转以适应横向卡片 */
  transform: rotate(90deg);
  width: 100%;
  height: auto;
  text-align: center;
  line-height: 1.4;
}

/* 按钮区域 */
.layton-card-select {
  width: 100%;
  height: 2.5em;
  position: absolute;
  bottom: 0em;
  display: flex;
  justify-content: space-around;
  align-items: center;
  z-index: 20;
  /* 确保按钮在最上层，不被图片覆盖 */
  pointer-events: none;
}

.layton-card-button {
  width: 2.5em;
  height: 2.5em;
  background-color: #c9b28bff;
  border-radius: 50%;
  border: solid 0.15em #503c30ff;
  box-shadow: 0em 0.25em #503c30ff;
  opacity: 0%;
  transition: all 0.5s;
  margin-bottom: 2.5em;
  position: relative;
  z-index: 20;
  display: flex;
  justify-content: center;
  align-items: center;
  font-weight: bold;
  cursor: pointer;
  pointer-events: auto;
}

.layton-card-button p {
  font-size: 25px;
  margin: 0;
}

.layton-card-button:nth-child(1) {
  color: #943207ff;
}

.layton-card-button:nth-child(2) {
  color: #306f7dff;
}

.layton-card-button:nth-child(3) {
  color: #bd620aff;
}

.layton-card-button:hover {
  transform: scale(1.15);
  background-color: rgb(238, 228, 205);
}

.layton-card-button.active {
  background-color: #503c30ff !important;
  color: #c9b28bff !important;
  transform: scale(0.95);
  box-shadow: 0em 0.1em #2b201a;
  border-color: #503c30ff;
}
</style>