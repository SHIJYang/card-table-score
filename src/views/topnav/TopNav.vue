<template>
  <el-menu mode="horizontal" :ellipsis="false" :popper-offset="3" router>
    <!-- Logo/Home -->
    <el-menu-item index="/">
      <el-icon :size="24">🏠</el-icon>
      <span style="margin-left: 8px; font-weight: 600">{{ $t('nav.home') }}</span>
    </el-menu-item>

    <!-- 游戏列表 -->
    <el-sub-menu index="games">
      <template #title>
        <el-icon><IconMenu /></el-icon>
        <span>{{ $t('nav.games') }}</span>
      </template>
      <el-menu-item index="/score">
        <el-icon>📊</el-icon>
        <span>{{ $t('nav.score') }}</span>
      </el-menu-item>
      <el-menu-item index="/gomoku">
        <el-icon>⚫</el-icon>
        <span>{{ $t('nav.gomoku') }}</span>
      </el-menu-item>
      <el-menu-item index="/shop">
        <el-icon>🛒</el-icon>
        <span>{{ $t('nav.shop') }}</span>
      </el-menu-item>
      <el-menu-item index="/snake">
        <el-icon>🐍</el-icon>
        <span>{{ $t('nav.snake') }}</span>
      </el-menu-item>
      <el-menu-item index="/2048">
        <el-icon>🎮</el-icon>
        <span>{{ $t('nav.2048') }}</span>
      </el-menu-item>
      <el-menu-item index="/try">
        <el-icon>🎯</el-icon>
        <span>{{ $t('nav.try') }}</span>
      </el-menu-item>
    </el-sub-menu>

    <!-- 设置菜单 -->
    <el-sub-menu index="settings">
      <template #title>
        <el-icon><Setting /></el-icon>
        <span>{{ $t('nav.settings') }}</span>
      </template>
      <el-menu-item index="/sets/picture">
        <el-icon><Setting /></el-icon>
        <span>{{ $t('nav.pictureSettings') }}</span>
      </el-menu-item>
      <el-menu-item index="/sets/habits">
        <el-icon><Setting /></el-icon>
        <span>{{ $t('nav.habits') }}</span>
      </el-menu-item>
      <el-menu-item index="/sets/GameHistory">
        <el-icon><Setting /></el-icon>
        <span>{{ $t('nav.gameHistory') }}</span>
      </el-menu-item>
    </el-sub-menu>
  </el-menu>
</template>

<script lang="ts" setup>
import { Menu as IconMenu, Setting } from "@element-plus/icons-vue";
// 不再需要 Document（未使用）
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

// 当前未使用
// import { useRouter, useRoute } from "vue-router";
// const route = useRoute();
// const router = useRouter();
</script>

<style scoped>
/* 若无特殊样式，可留空 */
</style>