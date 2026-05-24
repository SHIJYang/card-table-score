<template>
  <div class="top-nav-wrapper">
    <el-menu mode="horizontal" :default-active="activeIndex" :ellipsis="false" router class="top-menu custom-menu">
      <el-menu-item index="/" class="logo-item">
        <CubeSpinner :size="20" color="#55aa00" :duration="3" />
      </el-menu-item>

      <div class="flex-grow" />

      <!-- 游戏子菜单 → el-dropdown （点击后自动收起） -->
      <el-dropdown trigger="click" popper-class="theme-popper" @command="handleCommand">
        <div class="nav-dropdown-trigger">
          <span>{{ t('nav.games') }}</span>
          <el-icon class="el-icon--right"><ArrowDown /></el-icon>
        </div>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item command="/score">{{ t('nav.score') }}</el-dropdown-item>
            <el-dropdown-item command="/gomoku">{{ t('nav.gomoku') }}</el-dropdown-item>
            <el-dropdown-item command="/shop">{{ t('nav.shop') }}</el-dropdown-item>
            <el-dropdown-item command="/snake">{{ t('nav.snake') }}</el-dropdown-item>
            <el-dropdown-item command="/2048">{{ t('nav.2048') }}</el-dropdown-item>
            <el-dropdown-item command="/try">{{ t('nav.try') }}</el-dropdown-item>
            <el-dropdown-item command="/trees">{{ t('nav.christmasTree') }}</el-dropdown-item>
            <el-dropdown-item command="/people">{{ t('nav.people') }}</el-dropdown-item>
            <el-dropdown-item command="/player">{{ t('nav.player') }}</el-dropdown-item>
            <el-dropdown-item command="/music">{{ t('nav.music') }}</el-dropdown-item>
            <el-dropdown-item command="/live">{{ t('nav.live') }}</el-dropdown-item>
            <el-dropdown-item command="/spindou">{{ t('nav.spindou') }}</el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>

      <!-- 设置子菜单 → el-dropdown -->
      <el-dropdown trigger="click" popper-class="theme-popper" @command="handleCommand">
        <div class="nav-dropdown-trigger">
          <span>{{ t('nav.settings') }}</span>
          <el-icon class="el-icon--right"><ArrowDown /></el-icon>
        </div>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item command="/sets/picture">{{ t('nav.pictureSettings') }}</el-dropdown-item>
            <el-dropdown-item command="/sets/habits">{{ t('nav.habits') }}</el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>

      <el-menu-item index="">
        <ThemeSwitch v-model="settingsStore.theme" />
      </el-menu-item>
    </el-menu>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { ArrowDown } from '@element-plus/icons-vue'
import CubeSpinner from '@/components/box/CubeSpinner.vue'
import { useSettingsStore } from '@/store'
import ThemeSwitch from '@/components/ThemeSwitch.vue'

const router = useRouter()
const route = useRoute()
const { t } = useI18n()
const settingsStore = useSettingsStore()

const activeIndex = computed(() => route.path || '/')

// el-dropdown 选中后导航 + 自动收起（由 el-dropdown 自身处理）
function handleCommand(path) {
  router.push(path)
}
</script>

<style scoped>
.top-nav-wrapper {
  position: sticky;
  top: 0;
  z-index: 99;
  width: 100%;
  padding: 0;
  background-color: transparent;
  transform: translateZ(0);
}

.el-menu--horizontal {
  --el-menu-horizontal-height: 55px;
  border-bottom: none;
}

/* 导航主体 */
.top-menu {
  width: 100%;
  padding: 0 20px;
  background-color: color-mix(in srgb, var(--bgSecondary), transparent 15%);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border-bottom: 1px solid var(--borderLighter) !important;
  display: flex;
  align-items: center;
  transition: background-color 0.3s, border-color 0.3s;
}

.flex-grow {
  flex-grow: 1;
}

.logo-item {
  width: 55px;
  padding: 0 !important;
  background: transparent !important;
  opacity: 1 !important;
}

.logo-item:hover {
  background: transparent !important;
}

/* el-dropdown 触发器样式（模拟 el-menu-item 外观） */
.nav-dropdown-trigger {
  display: flex;
  align-items: center;
  height: 55px;
  padding: 0 20px;
  cursor: pointer;
  color: var(--text);
  font-size: 14px;
  transition: color 0.2s;
  user-select: none;
}

.nav-dropdown-trigger:hover {
  color: var(--primary) !important;
}

:deep(.el-dropdown-menu__item) {
  color: var(--text);
}

:deep(.el-dropdown-menu__item:hover) {
  color: var(--primary);
  background-color: color-mix(in srgb, var(--primary), transparent 90%);
}
</style>
