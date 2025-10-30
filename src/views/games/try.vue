<template>
  <div class="common-layout">
    <el-container>
      <el-header style="padding: 0"><topnav /></el-header>

      <el-main class="error404">
        <FuzzyText
          text="404"
          :font-size="180"
          font-weight="800"
          color="#8c8c8c"
          :enable-hover="true"
          :base-intensity="0.2"
          :hover-intensity="0.8"
        />
        <FuzzyText
          text="error"
          :font-size="80"
          font-weight="800"
          color="#8c8c8c"
          :enable-hover="true"
          :base-intensity="0.2"
          :hover-intensity="0.8"
        />
      </el-main>
    </el-container>
  </div>
</template>
<!-- <TiltedCard
        image-src="https://picsum.photos/800/600?random=3"
        alt-text="Sample image"
        caption-text="Hover to see tooltip"
        container-height="200px"
        container-width="200px"
        image-height="200px"
        image-width="200px"
        :rotate-amplitude="19"
        :scale-on-hover="1.1"
        :show-mobile-warning="true"
        :show-tooltip="true"
        :display-overlay-content="false"
      >
        <template #overlay>
          <div class="overlay-content">Your overlay content here</div>
        </template>
      </TiltedCard> -->
<!-- <Squares
        direction="diagonal"
        :speed="0.5"
        :squareSize="20"
        borderColor="#999"
        hoverFillColor="#222"
        style="height: 100%; width: 100%"
      /> -->

<!-- <ClickSpark
        spark-color="#0dffb7"
        :spark-size="10"
        :spark-radius="40"
        :spark-count="20"
        :duration="600"
        easing="ease-out"
        :extra-scale="1.2"
        class="interactive-area"
      ></ClickSpark> -->
<!-- <ShinyText
          text="Just some shiny text!"
          :disabled="false"
          :speed="3"
          class-name="your-custom-class"
        /> -->
<script setup>
import Topnav from "../topnav/TopNav.vue";
import FuzzyText from "../../components/gsap/FuzzyText.vue";
import ClickSpark from "../../components/ClickSpark.vue";
import Squares from "../../components/gsap/Squares.vue";
import TiltedCard from "../../components/gsap/TiltedCard.vue";
import ShinyText from "../../components/gsap/ShinyText.vue";
</script>

<style scoped>
.error404 {
  height: calc(80vh - 60px);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 20px;
  padding: 0;
}
</style>
