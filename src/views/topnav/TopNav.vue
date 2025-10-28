<template>
  <el-menu
    class="el-menu-demo"
    mode="horizontal"
    :ellipsis="false"
    :popper-offset="3"
    router
    style="display: flex; align-items: center; width: 100%"
  >
    <el-menu-item index="/">
      <span><el-icon>🐍</el-icon></span>
    </el-menu-item>
    <view
      style="
        flex: 1;
        display: flex;
        justify-content: center;
        align-items: center;
        min-width: 150px;
      "
    >
      <TextPressure
        text="SHIJY GAME"
        :flex="true"
        :alpha="true"
        :stroke="true"
        :width="true"
        :weight="true"
        :italic="true"
        text-color="#8c8c8c"
        stroke-color="#27FF64"
        :min-font-size="36"
    /></view>
    <el-sub-menu index="">
      <template #title>游戏列表</template>
      <el-menu-item index="/score">
        <el-icon><setting /></el-icon>
        <span>分数</span>
      </el-menu-item>
      <el-menu-item index="/gomoku">
        <el-icon><setting /></el-icon>
        <span>五子棋</span>
      </el-menu-item>
      <el-menu-item index="/snake">
        <el-icon>🐍</el-icon>
        <span>贪吃蛇</span>
      </el-menu-item>
      <el-menu-item index="/try">
        <el-icon><setting /></el-icon>
        <span>404</span>
      </el-menu-item>
    </el-sub-menu>
  </el-menu>
</template>

<script lang="ts" setup>
import {
  Document,
  Menu as IconMenu,
  Location,
  Setting,
  Check,
  Close,
} from "@element-plus/icons-vue";
import { ref } from "vue";
import { useRouter, useRoute } from "vue-router";

import TextPressure from "../../components/gsap/TextPressure.vue";
import GlitchText from "../../components/gsap/GlitchText.vue";
const route = useRoute();
const router = useRouter();
const isCollapse = ref(true);
const handleOpen = (key: string, keyPath: string[]) => {
  console.log(key, keyPath);
};
const handleClose = (key: string, keyPath: string[]) => {
  console.log(key, keyPath);
};
</script>

<style>
.el-menu--horizontal > .el-menu-item:nth-child(1) {
  margin-right: auto;
}
el-header {
  padding: 0;
  --el-header-padding: 0;
}
</style>
