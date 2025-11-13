import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import router from './router'
import App from './App.vue'
import request from './utils/request'
import setupMock from './mock'

// 创建应用实例
const app = createApp(App)

// 创建并使用 Pinia（必须在 setupMock 之前）
const pinia = createPinia()
app.use(pinia)

// 初始化Mock数据（在 Pinia 之后）
setupMock(request)

// 使用其他插件
app.use(ElementPlus)
app.use(router)

// 挂载应用
app.mount('#app')
