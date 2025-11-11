import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import router from './router'
import App from './App.vue'
import request from './utils/request'
import setupMock from './mock'

// 初始化Mock数据（仅开发环境）
setupMock(request)

// 创建应用实例
const app = createApp(App)

// 使用插件
const pinia = createPinia()
app.use(pinia)
app.use(ElementPlus)
app.use(router)

// 挂载应用
app.mount('#app')
