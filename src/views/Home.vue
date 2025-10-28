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
        spark-color="#ff6b6b"
        :spark-size="10"
        :spark-radius="40"
        :spark-count="20"
        :duration="600"
        easing="ease-out"
        :extra-scale="1.2"
        class="interactive-area"
      ></ClickSpark>
    </div>
  </div>
</template>

<script setup lang="ts">
import Topnav from "../views/topnav/TopNav.vue";
import ClickSpark from "../components/ClickSpark.vue";
import Squares from "../components/gsap/Squares.vue";
</script>

<style scoped>
.bg {
  width: 100%;
  height: 100vh;
  position: relative;
}
</style>
