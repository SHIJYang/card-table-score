<template>
  <div class="common-layout">
    <el-container>
      <el-header>Header</el-header>
      <el-container>
        <el-aside width="auto">
          <topnav />
        </el-aside>
        <el-main style="padding: 0"> 点击游戏开始 </el-main>
      </el-container>
    </el-container>
  </div>
</template>

<script setup>
import Topnav from "../views/topnav/TopNav.vue";
</script>

<style scoped></style>
