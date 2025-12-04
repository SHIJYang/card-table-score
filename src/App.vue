<template>
  <div id="app">
    <Topnav />
    <div class="page-content">
      <router-view />
    </div>
  </div>
</template>

<script setup>
import { watch } from 'vue'
import { useSettingsStore } from '@/store'
import { useI18n } from 'vue-i18n'
import Topnav from './views/topnav/TopNav.vue'
import { applyTheme, themes } from './theme/index.js'
const settingsStore = useSettingsStore()
const { locale } = useI18n()

// 语言切换
watch(
  () => settingsStore.language,
  (newLang) => {
    locale.value = newLang
    document.documentElement.lang = newLang
  },
  { immediate: true }
)

// 主题切换 - 只保留一个主题监听，并移除Element Plus的暗黑模式切换
watch(
  () => settingsStore.theme,
  (themeName) => {
    // 只应用自定义主题，不再处理Element Plus的暗黑模式
    const theme = themes[themeName] || themes.light
    applyTheme(theme)
  },
  { immediate: true }
)
</script>

<style>
/* 全局样式保持不变 */
#app {
  min-height: 100vh;
  width: 100vw;
  font-family:
    -apple-system,
    BlinkMacSystemFont,
    "Segoe UI",
    "PingFang SC",
    "Hiragino Sans GB",
    "Microsoft YaHei",
    "Helvetica Neue",
    Helvetica,
    Arial,
    sans-serif,
    "Apple Color Emoji",
    "Segoe UI Emoji";
  background: linear-gradient(
    135deg,
    var(--bgPrimary-color) 0%,
    var(--bgSecondary-color) 100%
  );
  display: flex;
  flex-direction: column;
}

.page-content {
  flex: 1;
  overflow: auto;
}

/* 自定义滚动条 */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}
::-webkit-scrollbar-track {
  background: var(--bgSecondary-color);
  border-radius: 4px;
}
::-webkit-scrollbar-thumb {
  background: var(--border-color);
  border-radius: 4px;
}
::-webkit-scrollbar-thumb:hover {
  background: var(--textSecondary-color);
}
</style>