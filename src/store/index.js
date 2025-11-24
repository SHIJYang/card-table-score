/**
 * Pinia Store 统一导出
 * 
 * Store 模块化组织：
 * - modules/user.js - 用户管理（登录、注册、用户信息）
 * - modules/game.js - 游戏管理（游戏列表、详情、收藏、历史）
 * - modules/settings.js - 设置管理（主题、语言、音效等）
 * - modules/app.js - 应用状态（初始化、网络状态、缓存等）
 */

// 导出所有 Store
export { useUserStore } from './modules/user'
export { useGameStore } from './modules/game'
export { useSettingsStore } from './modules/settings'
export { useAppStore } from './modules/app'
export { useImageStore } from './modules/picture'
// 为了向后兼容，也可以这样导入
// import * as stores from '@/store'
// const userStore = stores.useUserStore()
