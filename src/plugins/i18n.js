// src/plugins/i18n.js
import { createI18n } from 'vue-i18n'
import zhCN from '@/locales/zh-CN.json'
import enUS from '@/locales/en-US.json'

// 语言包
const messages = {
  'zh-CN': zhCN,
  'en-US': enUS
  // 可继续添加其他语言，如 'ja-JP': jaJP
}

// 从 localStorage 或默认值获取初始语言
const savedLocale = localStorage.getItem('language') || 'zh-CN'

// 创建 i18n 实例
const i18n = createI18n({
  legacy: false, // 使用 Composition API 模式
  globalInjection: true, // 允许在模板中直接使用 $t()
  locale: savedLocale,
  fallbackLocale: 'en-US',
  messages
})

export default i18n