import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import 'element-plus/theme-chalk/dark/css-vars.css'
import router from './router'
import App from './App.vue'
import request from './utils/request'
import setupMock from './mock'

// 独立的 i18n 插件
import i18n from './plugins/i18n'

// 创建应用
const app = createApp(App)

// 使用 Pinia（必须在 Mock 前）
const pinia = createPinia()
app.use(pinia)

// 初始化 Mock
setupMock(request)

// 使用其他插件
app.use(ElementPlus)
app.use(router)
app.use(i18n) // ← 使用独立的 i18n

// 挂载
app.mount('#app')