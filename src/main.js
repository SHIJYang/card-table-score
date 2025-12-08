import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
// 重新引入Element Plus的默认样式
import 'element-plus/dist/index.css'
// 保留暗黑模式支持
import 'element-plus/theme-chalk/dark/css-vars.css'
import router from './router'
import App from './App.vue'
import request from './utils/request'
import setupMock from './mock'
import { initTheme } from './theme/index.js'

// 独立的 i18n 插件
import i18n from './plugins/i18n'

// 创建应用
const app = createApp(App)

// 使用 Pinia（必须在 Mock 前）
const pinia = createPinia()
app.use(pinia)

// 初始化 Mock
setupMock(request)

// 初始化主题
initTheme()

// 使用其他插件
app.use(ElementPlus)
app.use(router)
app.use(i18n)

// 在文件末尾、挂载应用前添加
import './assets/custom-element-theme.css'

// 挂载
app.mount('#app')