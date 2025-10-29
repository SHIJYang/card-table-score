<template>
  <div class="common-layout">
    <topnav />

    <div class="main">
      <el-card style="width: 80%; height: 200px"
        ><CircularGallery
          :items="[
            {
              image: 'https://picsum.photos/800/600?random=1',
              text: 'Beautiful Nature',
            },
            {
              image: 'https://picsum.photos/800/600?random=2',
              text: 'City Life',
            },
            {
              image: 'https://picsum.photos/800/600?random=3',
              text: 'Ocean Views',
            },
          ]"
          :bend="0"
          text-color="#afafaf"
          :border-radius="0.05"
          font="bold 30px Arial"
          :scroll-speed="5"
          :scroll-ease="0.05"
          class="canvas"
      /></el-card>
      <div>
        <ShinyText
          text="Just some shiny text!"
          :disabled="false"
          :speed="3"
          class-name="your-custom-class"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import Topnav from "../views/topnav/TopNav.vue";

import CircularGallery from "../components/gsap/CircularGallery.vue";
import ShinyText from "../components/gsap/ShinyText.vue";
</script>

<style scoped>
.main {
  width: 100%;

  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: 20px;
}
</style>
