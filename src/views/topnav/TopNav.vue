<template>
  <div class="top-nav-wrapper">
    <el-menu 
      mode="horizontal" 
      :default-active="activeIndex"
      :ellipsis="false"
      :background-color="'var(--bgPrimary)'"
      :text-color="'var(--text)'"
      :active-text-color="'var(--selectBg)'"
      router
      class="top-menu"
    >
      <!-- Logo菜单项 -->
      <el-menu-item index="/" class="logo-item">
        <img :src="logo" alt="Logo" class="logo" />
      </el-menu-item>
      
      <!-- 游戏菜单 -->
      <el-sub-menu index="games"
        popper-class="top-nav-submenu"
      >
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
      
      <!-- 我们的菜单 -->
      <el-sub-menu index="our"
        popper-class="top-nav-submenu"
      >
        <template #title>
          <span>{{ t('nav.our') }}</span>
        </template>
        <el-menu-item index="/our/tree">{{ t('nav.christmasTree') }}</el-menu-item>
        <el-menu-item index="/our/tree1">{{ t('nav.christmasTree') }}</el-menu-item>
      </el-sub-menu>
      
      <!-- 设置菜单 -->
      <el-sub-menu index="settings"
        popper-class="top-nav-submenu"
      >
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
.top-nav-wrapper {
  position: relative;
  z-index: 99;
  width: 100%;
}

.top-menu {
  width: 100%;
}

.logo-item {
  margin-right: auto;
  padding: 0 20px;
}

.logo {
  height: 40px;
  transition: transform 0.3s ease;
}

.logo:hover {
  transform: scale(1.05);
}

/* 子菜单样式优化 */
.top-nav-submenu {
  border-radius: 6px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .logo {
    height: 32px;
  }
  
  .logo-item {
    padding: 0 10px;
  }
}
</style>