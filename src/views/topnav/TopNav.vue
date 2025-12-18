<template>
  <div class="top-nav-wrapper">
    <el-menu 
      mode="horizontal" 
      :default-active="activeIndex"
      :ellipsis="false"
      router
      class="top-menu custom-menu"
    >
      <el-menu-item index="/" class="logo-item">
        <img :src="logo" alt="Logo" class="logo" />
        <span class="site-title is-mobile-hidden">LOVE GAMES</span>
      </el-menu-item>
      
      <div class="flex-grow" />
      
      <el-sub-menu index="games" popper-class="theme-popper">
        <template #title>
          <span>{{ t('nav.games') }}</span>
        </template>
        <el-menu-item index="/score">{{ t('nav.score') }}</el-menu-item>
        <el-menu-item index="/gomoku">{{ t('nav.gomoku') }}</el-menu-item>
        <el-menu-item index="/shop">{{ t('nav.shop') }}</el-menu-item>
        <el-menu-item index="/snake">{{ t('nav.snake') }}</el-menu-item>
        <el-menu-item index="/2048">{{ t('nav.2048') }}</el-menu-item>
        <el-menu-item index="/try">{{ t('nav.try') }}</el-menu-item>
      </el-sub-menu>
      
      <el-sub-menu index="our" popper-class="theme-popper">
        <template #title>
          <span>{{ t('nav.our') }}</span>
        </template>
        <el-menu-item index="/our/tree">{{ t('nav.christmasTree') }}</el-menu-item>
        <el-menu-item index="/our/trees">{{ t('nav.christmasTree') }}2</el-menu-item>
      </el-sub-menu>
      
      <el-sub-menu index="settings" popper-class="theme-popper">
        <template #title>
          <span>{{ t('nav.settings') }}</span>
        </template>
        <el-menu-item index="/sets/picture">{{ t('nav.pictureSettings') }}</el-menu-item>
        <el-menu-item index="/sets/habits">{{ t('nav.habits') }}</el-menu-item>
        <el-menu-item index="/sets/GameHistory">{{ t('nav.gameHistory') }}</el-menu-item>
      </el-sub-menu>
    </el-menu>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import logo from '../../assets/love-sign.svg'

const route = useRoute()
const { t } = useI18n()

// 计算当前激活的菜单项
const activeIndex = computed(() => route.path || '/')
</script>

<style scoped>
/* 核心容器 */
.top-nav-wrapper {
  position: sticky;
  top: 0;
  z-index: 99;
  width: 100%;
  padding: 0; /* 官网风格通常贴边 */
  background-color: transparent;
  /* 解决某些浏览器下的层级问题 */
  transform: translateZ(0);
}

/* 覆盖 Element 默认高度 */
.el-menu--horizontal {
  --el-menu-horizontal-height: 55px;
  border-bottom: none;
}

/* 菜单主体 */
.top-menu {
  width: 100%;
  padding: 0 40px; /* 内容左右留白 */
  
  /* 1. 背景处理：使用半透明背景 + 模糊，营造通透感 */
  background-color: color-mix(in srgb, var(--bgSecondary), transparent 15%);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  
  /* 2. 边框：仅底部有一条极淡的分割线 */
  border-bottom: 1px solid var(--borderLighter) !important;
  border-top: none;
  border-left: none;
  border-right: none;
  border-radius: 0;
  box-shadow: none; /* 去除阴影，保持扁平 */
  
  display: flex;
  align-items: center;
  transition: background-color 0.3s, border-color 0.3s;
}

/* 深色模式适配 */
:global([data-theme="dark"]) .top-menu {
  background-color: color-mix(in srgb, var(--bgSecondary), transparent 10%);
  border-bottom: 1px solid var(--border);
}

/* 卡通模式适配：加粗边框，纯色背景 */
:global([data-theme="cartoon"]) .top-menu {
  background-color: var(--bgSecondary);
  border-bottom: 3px solid var(--text);
  backdrop-filter: none;
}

/* Flex 占位 */
.flex-grow {
  flex-grow: 1;
}

/* Logo 区域 */
.logo-item {
  margin-right: 20px;
  padding: 0 !important;
  background: transparent !important;
  opacity: 1 !important;
}

.logo-item:hover {
  background: transparent !important;
}

.logo {
  height: 30px;
  vertical-align: middle;
}

.site-title {
  margin-left: 10px;
  font-weight: 700;
  font-size: 1.1rem;
  color: var(--text);
  letter-spacing: 0.5px;
  /* 取消之前的渐变文字，回归清晰 */
}

/* --- 菜单项深度样式覆盖 --- */

/* 1. 通用状态 */
:deep(.el-menu-item),
:deep(.el-sub-menu__title) {
  font-size: 14px;
  font-weight: 500;
  color: var(--text) !important;
  padding: 0 16px !important;
  margin: 0 4px; /* 稍微拉开一点间距 */
 
  background: transparent !important;
  transition: color 0.2s, border-color 0.2s;
  height: 55px !important;
  line-height: 55px !important;
  border-radius: 0; 
}

/* 2. 悬停状态 (Hover) - 仅文字变色 */
:deep(.el-menu-item:hover),
:deep(.el-sub-menu__title:hover) {
  color: var(--primary) !important;
  background-color: transparent !important;
}

/* 3. 激活状态 (Active) - 底部亮条 */
:deep(.el-menu-item.is-active) {
  color: var(--primary) !important;

  font-weight: 600;
  background-color: transparent !important;
}

/* 子菜单激活时，父级标题状态 */
:deep(.el-sub-menu.is-active .el-sub-menu__title) {
  color: var(--primary) !important;
  border-bottom: 2px solid var(--primary) !important;
}

/* 响应式适配 */
@media (max-width: 768px) {
  .top-menu {
    padding: 0 16px;
  }
  
  .site-title {
    display: none;
  }
  
  /* 移动端菜单项间距缩小 */
  :deep(.el-menu-item),
  :deep(.el-sub-menu__title) {
    padding: 0 10px !important;
    margin: 0;
  }
}
</style>