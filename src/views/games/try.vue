<template>
  <div class="common-layout">
    <el-container>
      <el-header style="padding: 0"><topnav /></el-header>

      <el-main class="error404">
        <FuzzyText
          text="404"
          :font-size="180"
          font-weight="900"
          color="#8c8c8c"
          :enable-hover="true"
          :base-intensity="0.2"
          :hover-intensity="0.8"
        />
        <FuzzyText
          text="error"
          :font-size="80"
          font-weight="900"
          color="#8c8c8c"
          :enable-hover="true"
          :base-intensity="0.2"
          :hover-intensity="0.8"
        />
      </el-main>
    </el-container>
  </div>
</template>

<script setup>
import Topnav from "../topnav/TopNav.vue";
import FuzzyText from "../../components/gsap/FuzzyText.vue";
</script>

<style scoped>
.error404 {
  height: calc(80vh - 60px);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 20px;
}
</style>
