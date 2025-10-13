<template>
  <div class="common-layout">
    <el-container>
      <el-header>Header</el-header>
      <el-container>
        <el-aside width="auto">
          <topnav />
        </el-aside>
        <el-main style="padding: 0"> <pvzgame /> </el-main>
      </el-container>
    </el-container>
  </div>
</template>

<script setup>
import Topnav from "../../topnav/TopNav.vue";
import pvzgame from "../../../components/pvz/game/pvzgame.vue";
</script>
<style>
@import "../../../assets/pvz/styles/base.css";
@import "../../../assets/pvz/styles/ui.css";
@import "../../../assets/pvz/styles/game.css";
</style>

<style scoped></style>
