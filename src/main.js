import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'

// 1. 导入 vue-i18n 相关内容
import { createI18n } from 'vue-i18n' // 导入创建 i18n 实例的函数

// 2. 导入你的语言包 (你需要先创建这些文件)
// 假设你的语言包在 src/locales 目录下
import zhCN from './locales/zh-CN.json' // 示例：简体中文包
import enUS from './locales/en-US.json' // 示例：英文包
// ... 导入其他语言包

import router from './router'
import App from './App.vue'
import request from './utils/request'
import setupMock from './mock'

// 3. 定义你的消息对象
const messages = {
    'zh-CN': zhCN,
    'en-US': enUS,
    // ... 添加其他语言
}

// 4. 创建 i18n 实例
const i18n = createI18n({
    legacy: false, // 使用 Composition API 模式
    locale: 'zh-CN', // 设置默认语言 (可以从 localStorage/settingsStore 读取)
    fallbackLocale: 'en-US', // 设置回退语言
    messages, // 加载消息对象
})

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

// 5. 使用 i18n 插件 (必须在 app 创建之后，挂载之前)
app.use(i18n)

// 挂载应用
app.mount('#app')