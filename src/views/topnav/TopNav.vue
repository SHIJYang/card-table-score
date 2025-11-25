<template>
  <el-menu
    class="el-menu-demo"
    mode="horizontal"
    :ellipsis="false"
    :popper-offset="3"
    router
    style="display: flex; align-items: center; width: 100%"
  >
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
        <span>游戏列表</span>
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

    <!-- 示例页面 -->
    <el-sub-menu index="examples">
      <template #title>
        <el-icon><Document /></el-icon>
        <span>示例</span>
      </template>
      <el-menu-item index="/examples/quickstart">
        <el-icon>⚡</el-icon>
        <span>快速开始</span>
      </el-menu-item>
      <el-menu-item index="/examples/store">
        <el-icon>📦</el-icon>
        <span>Store示例</span>
      </el-menu-item>
      <el-menu-item index="/examples/api">
        <el-icon>🔌</el-icon>
        <span>API示例</span>
      </el-menu-item>
    </el-sub-menu>

    <!-- 设置菜单 -->
    <el-sub-menu index="">
      <template #title>
        <el-icon><Setting /></el-icon>
        <span>设置</span>
      </template>

      <el-menu-item index="/sets/picture">
        <el-icon><Setting /></el-icon>
        <span>图片设置</span>
      </el-menu-item>
      <el-menu-item index="/sets/habits">
        <el-icon><Setting /></el-icon>
        <span>图片设置</span>
      </el-menu-item>
      <el-menu-item index="/sets/GameHistory">
        <el-icon><Setting /></el-icon>
        <span>图片设置</span>
      </el-menu-item>
      <el-menu-item index="/sets/Statistics">
        <el-icon><Setting /></el-icon>
        <span>基础设置</span>
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

<style scoped>
.el-menu-demo {
  --el-menu-item-height: 60px;
  --el-menu-horizontal-height: 60px;
}

.el-menu-demo :deep(.el-menu-item) {
  font-weight: 500;
  transition: all 0.3s ease;
}

.el-menu-demo :deep(.el-menu-item:hover) {
  background-color: rgba(64, 158, 255, 0.1) !important;
}

.el-menu-demo :deep(.el-sub-menu__title) {
  font-weight: 500;
}

.el-menu-demo :deep(.el-sub-menu__title:hover) {
  background-color: rgba(64, 158, 255, 0.1) !important;
}

/* Logo 区域 */
.el-menu--horizontal > .el-menu-item:nth-child(1) {
  margin-right: 20px;
  font-size: 16px;
}

/* 用户头像 */
:deep(.el-avatar) {
  cursor: pointer;
  transition: all 0.3s ease;
}

:deep(.el-avatar:hover) {
  transform: scale(1.05);
}

/* 子菜单图标对齐 */
:deep(.el-menu-item .el-icon) {
  margin-right: 8px;
  font-size: 18px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .el-menu-demo span {
    display: none;
  }

  .el-menu-demo :deep(.el-sub-menu__title span) {
    display: none;
  }
}
</style>
