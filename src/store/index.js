/**
 * Pinia Store 统一导出
 *
 * Store 模块化组织：
 * - modules/setstore.js - 设置管理（主题、语言、音效等）
 * - modules/appstore.js - 应用状态（初始化、网络状态、缓存等）
 * - modules/picturestore.js - 图片管理（图床列表、上传等）
 * - modules/cameraStore2.js - 摄像头手势识别（MediaPipe，trees 页使用）
 */

// 导出所有 Store
export { useSettingsStore } from './modules/setstore'
export { useAppStore } from './modules/appstore'
export { useImageStore } from './modules/picturestore'
export { useCamerasStore } from './modules/cameraStore2'
