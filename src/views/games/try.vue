<template>
  <div class="common-layout">
    <el-container>
      <el-header>Header</el-header>
      <el-container>
        <el-aside width="200px">
          <topnav />
        </el-aside>
        <el-main> 点击游戏开始 </el-main>
      </el-container>
    </el-container>
  </div>
</template>

<script setup>
import Topnav from "../topnav/TopNav.vue";
</script>

<style scoped></style>
