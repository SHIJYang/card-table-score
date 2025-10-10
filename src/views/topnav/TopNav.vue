<template>
  <el-col :span="12">
    <h5 class="mb-2">Default colors</h5>
    <el-menu
      default-active="1"
      class="el-menu-vertical-demo"
      @open="handleOpen"
      @close="handleClose"
      router
    >
      <el-menu-item index="/">
        <el-icon><icon-menu /></el-icon>
        <span>开始游戏</span>
      </el-menu-item>

      <el-menu-item index="/score">
        <el-icon><setting /></el-icon>
        <span>计分板</span>
      </el-menu-item>
      <el-menu-item index="/gomoku">
        <el-icon><setting /></el-icon>
        <span>五子棋</span>
      </el-menu-item>
      <el-menu-item index="/snake">
        <el-icon><setting /></el-icon>
        <span>贪吃蛇</span>
      </el-menu-item>
      <el-menu-item index="/try">
        <el-icon><setting /></el-icon>
        <span>Navigator 4</span>
      </el-menu-item>
    </el-menu>
  </el-col>
</template>

<script lang="ts" setup>
import {
  Document,
  Menu as IconMenu,
  Location,
  Setting,
} from "@element-plus/icons-vue";
import { useRouter, useRoute } from "vue-router";
const route = useRoute();
const router = useRouter();
const handleOpen = (key: string, keyPath: string[]) => {
  console.log(key, keyPath);
};
const handleClose = (key: string, keyPath: string[]) => {
  console.log(key, keyPath);
};
</script>
