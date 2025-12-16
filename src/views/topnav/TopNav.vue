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
      
      <div class="flex-grow" /> <el-sub-menu index="games" popper-class="theme-popper">
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
  padding: 10px 20px;
  box-sizing: border-box;
  background-color: transparent;
}

/* 菜单主体 */
.top-menu {
  /* 1. 默认通用设置 */
  --el-menu-bg-color: var(--bgPrimary);
  --el-menu-text-color: var(--text);
  --el-menu-hover-bg-color: var(--el-color-primary-light-9);
  --el-menu-active-color: var(--primary);
  
  border-bottom: none !important;
  border-radius: var(--borderRadius);
  border: 2px solid var(--border);
  box-shadow: var(--boxShadow);
  padding: 0 10px;
  transition: all var(--transitionDuration, 0.3s);
}

/* 2. 针对深色主题 (Dark) 的微调 */
:global([data-theme="dark"]) .top-menu {
  --el-menu-hover-bg-color: var(--bgSecondary);
  --el-menu-active-color: var(--primary); 
}

/* 3. 针对卡通主题 (Cartoon) 的微调 */
:global([data-theme="cartoon"]) .top-menu {
  --el-menu-hover-bg-color: var(--selectBg);
  --el-menu-text-color: var(--text); 
}

/* Flex 占位符 */
.flex-grow {
  flex-grow: 1;
}

/* Logo 区域 */
.logo-item {
  margin-right: 0;
  padding: 0 10px;
  background-color: transparent !important;
}

.logo {
  height: 40px;
  transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.site-title {
  margin-left: 10px;
  font-weight: 900;
  font-size: 1.2rem;
  color: var(--text);
  letter-spacing: 1px;
}

/* 交互动效 */
.logo-item:hover .logo {
  transform: scale(1.2) rotate(-5deg);
}

/* 深度选择器覆盖 Element Plus 内部样式 */
:deep(.el-menu-item),
:deep(.el-sub-menu__title) {
  border-radius: var(--borderRadius);
  margin: 5px 2px;
  height: 50px !important;
  line-height: 50px !important;
  border-bottom: none !important;
  transition: all 0.2s;
}

/* 激活状态：自定义胶囊样式 */
:deep(.el-menu-item.is-active) {
  

  font-weight: bold;
  transform: translateY(-2px);

  border: 1px solid var(--border);
}

:deep(.el-sub-menu.is-active .el-sub-menu__title) {
  color: var(--primary) !important;
  font-weight: bold;
}

/* 悬停状态 */
:deep(.el-menu-item:not(.is-active):hover),
:deep(.el-sub-menu__title:hover) {
  background-color: var(--el-menu-hover-bg-color) !important;
  color: var(--primary) !important;
}

/* 响应式 */
@media (max-width: 768px) {
  .top-nav-wrapper {
    padding: 0;
  }
  .top-menu {
    border-radius: 0;
    border: none;
    border-bottom: 2px solid var(--border);
  }
  .site-title {
    display: none;
  }
}
</style>