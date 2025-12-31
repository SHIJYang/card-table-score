/**
 * Pinia Store 统一导出
 * 
 * Store 模块化组织：
 * - modules/userstore.js - 用户管理（登录、注册、用户信息）
 * - modules/gamestore.js - 游戏管理（游戏列表、详情、收藏、历史）
 * - modules/setstore.js - 设置管理（主题、语言、音效等）
 * - modules/appstore.js - 应用状态（初始化、网络状态、缓存等）
 */

// 导出所有 Store


export { useSettingsStore } from './modules/setstore'
export { useAppStore } from './modules/appstore'
export { useImageStore } from './modules/picturestore'
export { useCameraStore } from './modules/cameraStore'
export { useCamerasStore } from './modules/cameraStore2'
// 为了向后兼容，也可以这样导入
// import * as stores from '@/store'
// const userStore = stores.useUserStore()
