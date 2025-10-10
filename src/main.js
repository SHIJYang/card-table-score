import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import router from './router'
import App from './App.vue'

// 创建应用实例
const app = createApp(App)

// 使用插件
const pinia = createPinia()
app.use(pinia)
app.use(ElementPlus)
app.use(router)

// 初始化store




// 挂载应用
app.mount('#app')
