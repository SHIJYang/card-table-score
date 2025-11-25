<template>
  <el-menu mode="horizontal" :ellipsis="false" :popper-offset="3" router>
    <!-- Logo/Home -->
    <el-menu-item index="/">
      <el-icon :size="24">🏠</el-icon>
      <span style="margin-left: 8px; font-weight: 600">首页</span>
    </el-menu-item>

    <!-- 中间标题 -->
    <view
      style="
        flex: 1;
        display: flex;
        justify-content: center;
        align-items: center;
        min-width: 140px;
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
        text-color="#409EFF"
        stroke-color="#67C23A"
        :stroke-width="1"
        :min-font-size="36"
    /></view>

    <!-- 游戏列表 -->
    <el-sub-menu index="games">
      <template #title>
        <el-icon><IconMenu /></el-icon>
        <span>游戏</span>
      </template>
      <el-menu-item index="/score">
        <el-icon>📊</el-icon>
        <span>分数系统</span>
      </el-menu-item>
      <el-menu-item index="/gomoku">
        <el-icon>⚫</el-icon>
        <span>五子棋</span>
      </el-menu-item>
      <el-menu-item index="/shop">
        <el-icon>🛒</el-icon>
        <span>商店</span>
      </el-menu-item>
      <el-menu-item index="/snake">
        <el-icon>🐍</el-icon>
        <span>贪吃蛇</span>
      </el-menu-item>
      <el-menu-item index="/2048">
        <el-icon>🎮</el-icon>
        <span>2048</span>
      </el-menu-item>
      <el-menu-item index="/try">
        <el-icon>🎯</el-icon>
        <span>试玩</span>
      </el-menu-item>
    </el-sub-menu>

    <!-- 设置菜单 -->

    <el-sub-menu index="settings">
      <template #title>
        <el-icon><Setting /></el-icon>
      </template>
      <el-menu-item index="/sets/picture">
        <el-icon><Setting /></el-icon>
        <span>图片设置</span>
      </el-menu-item>
      <el-menu-item index="/sets/habits">
        <el-icon><Setting /></el-icon>
        <span>设置</span>
      </el-menu-item>
      <el-menu-item index="/sets/GameHistory">
        <el-icon><Setting /></el-icon>
        <span>游戏记录</span>
      </el-menu-item>
      <el-menu-item index="/sets/Statistics">
        <el-icon><Setting /></el-icon>
        <span>数据统计</span>
      </el-menu-item>
    </el-sub-menu>
  </el-menu>
</template>

<script lang="ts" setup>
import { Document, Menu as IconMenu, Setting } from "@element-plus/icons-vue";
import { ref } from "vue";
import { useRouter, useRoute } from "vue-router";

import TextPressure from "../../components/gsap/TextPressure.vue";

const route = useRoute();
const router = useRouter();
</script>

<style scoped></style>
