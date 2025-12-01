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

watch(
  () => settingsStore.language,
  (newLang) => {
    locale.value = newLang
    document.documentElement.lang = newLang
  },
  { immediate: true }
)

watch(
  () => settingsStore.theme,
  (themeName) => {
    const theme = themes[themeName] || themes.light
    applyTheme(theme) // 👈 直接应用主题对象
  },
  { immediate: true } // 挂载时立即执行一次
)
watch(
  () => settingsStore.theme,
  (themeName) => {
    // 1. 应用自定义主题
    applyTheme(themes[themeName] || themes.light)
    
    // 2. 同步 Element Plus 暗色
    if (themeName === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  },
  { immediate: true }
)
</script>

<style>
#app {
  min-height: 100vh;
  width: 100vw;
  /* 使用系统默认中文字体栈，无需加载外部字体 */
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
  background: #f1f1f1;
  border-radius: 4px;
}
::-webkit-scrollbar-thumb {
  background: #c0c4cc;
  border-radius: 4px;
}
::-webkit-scrollbar-thumb:hover {
  background: #909399;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}
</style>