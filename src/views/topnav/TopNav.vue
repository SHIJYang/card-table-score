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

    <!-- 我们的 -->
    <el-sub-menu index="our">
      <template #title>
       
        <span>我们</span>
      </template>
      <el-menu-item index="/our/tree">
        <el-icon>🎄</el-icon>
        <span>圣诞树</span>
      </el-menu-item>
    </el-sub-menu>

    <!-- 设置菜单 -->
    <el-sub-menu index="settings">
      <template #title>
        <el-icon><Setting /></el-icon>
        
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
import { Menu as IconMenu, Setting, User } from "@element-plus/icons-vue";
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
</script>

<style scoped>

/* 导航项基础样式 - 增加优先级并明确颜色 */
:deep(.el-menu-item),
:deep(.el-sub-menu__title) {
  color: var(--text-color, var(--el-text-color-primary)) ; /* 使用具体的白色值 */
  height: 60px !important;
  line-height: 60px !important;
  font-size: 15px;
  
}

/* 悬停状态样式 - 增加优先级 */
:deep(.el-menu-item:hover),
:deep(.el-sub-menu__title:hover) {
  background-color: var(--el-bg-color-hover) !important;
  color: var(--text-color, var(--el-text-color-primary));
  opacity: 1 !important;
}

/* 激活状态样式 - 增加优先级 */
:deep(.el-menu-item.is-active),
:deep(.el-sub-menu__title.is-active) {
  background-color:  var(--el-bg-color-hover) !important;
  color: var(--primary-color, var(--el-color-primary)) !important;
  font-weight: 600;
}

/* 修复可能的Element Plus覆盖样式 */
:deep(.el-menu-item span),
:deep(.el-sub-menu__title span) {
  color: inherit !important;
}

/* 下拉菜单样式 */
:deep(.el-sub-menu__popper) {
  background: var(--bgPrimary-color, var(--el-bg-color)) !important;
  border: 1px solid var(--border-color, var(--el-border-color)) !important;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1) !important;
}

/* 下拉菜单项样式 */
:deep(.el-sub-menu__popper .el-menu-item),
:deep(.el-sub-menu__popper .el-sub-menu__title) {
  color: var(--text-color, var(--el-text-color-primary)) !important;
  height: 40px !important;
  line-height: 40px !important;
}

/* 下拉菜单悬停状态 */
:deep(.el-sub-menu__popper .el-menu-item:hover),
:deep(.el-sub-menu__popper .el-sub-menu__title:hover) {
  background-color: var(--el-bg-color-hover) !important;
  color: var(--text-color, var(--el-text-color-primary)) !important;
}

/* 下拉菜单激活状态 */
:deep(.el-sub-menu__popper .el-menu-item.is-active) {
  background-color: var(--el-bg-color-hover) !important;
  color: var(--primary-color, var(--el-color-primary)) !important;
}
</style>