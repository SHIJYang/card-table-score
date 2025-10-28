<template>
  <div class="common-layout">
    <topnav />

    <div class="bg">
      <!-- <Squares
        direction="diagonal"
        :speed="0.5"
        :squareSize="20"
        borderColor="#999"
        hoverFillColor="#222"
        style="height: 100%; width: 100%"
      /> -->

      <ClickSpark
        :spark-color="randomSparkParams.sparkColor"
        :spark-size="randomSparkParams.sparkSize"
        :spark-radius="randomSparkParams.sparkRadius"
        :spark-count="randomSparkParams.sparkCount"
        :duration="randomSparkParams.duration"
        easing="ease-out"
        :extra-scale="randomSparkParams.extraScale"
        class="interactive-area"
      ></ClickSpark>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import Topnav from "../views/topnav/TopNav.vue";
import ClickSpark from "../components/ClickSpark.vue";
import Squares from "../components/gsap/Squares.vue";
const hue = Math.floor(Math.random() * 360); // 0-360度任意色调
const saturation = Math.floor(Math.random() * 40) + 60; // 60%-100%饱和度
const lightness = Math.floor(Math.random() * 20) + 40; // 40%-60%亮度
const randomSparkParams = computed(() => ({
  // 随机颜色（全色系）
  sparkColor: `hsl(${hue}, ${saturation}%, ${lightness}%)`,

  // 火花大小：5~30之间随机（整数）
  sparkSize: Math.floor(Math.random() * 26) + 5,
  // 火花半径：20~30之间随机（整数）
  sparkRadius: Math.floor(Math.random() * 41) + 10,
  // 火花数量：8~15之间随机（整数）
  sparkCount: Math.floor(Math.random() * 17) + 4,
  // 持续时间：500~700ms之间随机（整数）
  duration: Math.floor(Math.random() * 801) + 200,
  // 额外缩放：1.0~1.5之间随机（保留1位小数）
  extraScale: Number((Math.random() * 1.5 + 0.5).toFixed(1)),
}));
</script>

<style scoped>
.bg {
  width: 100%;
  height: 100vh;
  position: relative;
}
</style>
