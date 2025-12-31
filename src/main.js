import { createApp } from 'vue'
import { createPinia } from 'pinia'

import 'element-plus/theme-chalk/dark/css-vars.css'

// 引入全局样式
import './index.css'

import router from './router'
import App from './App.vue'


import { initTheme } from './theme/index.js'

import i18n from './plugins/i18n'
import Tres from '@tresjs/core'

// 创建应用
const app = createApp(App)

// 使用 Pinia（必须在 Mock 前）
const pinia = createPinia()
app.use(pinia)

app.use(Tres)



// 初始化主题
initTheme()

// 使用其他插件
app.use(router)

app.use(i18n)

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        console.log('✅ Service Worker registered with scope:', registration.scope)
      })
      .catch((error) => {
        console.warn('⚠️ Service Worker registration failed:', error)
      })
  })
}

// 挂载
app.mount('#app')