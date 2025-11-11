import { defineStore } from 'pinia'

/**
 * 应用全局状态管理
 * 管理应用运行时状态、缓存、全局配置等
 */
export const useAppStore = defineStore('app', {
  state: () => ({
    // 应用初始化状态
    initialized: false,
    // 网络状态
    online: navigator.onLine,
    // 页面可见性
    pageVisible: !document.hidden,
    // 路由缓存列表
    cachedViews: [],
    // 面包屑导航
    breadcrumbs: [],
    // 全局错误
    errors: [],
    // 设备信息
    device: {
      isMobile: /Mobile|Android|iPhone/i.test(navigator.userAgent),
      isTablet: /iPad|Tablet/i.test(navigator.userAgent),
      isDesktop: !/Mobile|Android|iPhone|iPad|Tablet/i.test(navigator.userAgent),
    },
  }),

  getters: {
    // 是否已初始化
    isInitialized: (state) => state.initialized,
    // 是否在线
    isOnline: (state) => state.online,
    // 页面是否可见
    isPageVisible: (state) => state.pageVisible,
    // 获取缓存的视图
    getCachedViews: (state) => state.cachedViews,
    // 是否移动设备
    isMobile: (state) => state.device.isMobile,
    // 是否平板
    isTablet: (state) => state.device.isTablet,
    // 是否桌面
    isDesktop: (state) => state.device.isDesktop,
  },

  actions: {
    /**
     * 初始化应用
     */
    async init() {
      if (this.initialized) return

      // 监听网络状态
      window.addEventListener('online', () => {
        this.online = true
      })
      window.addEventListener('offline', () => {
        this.online = false
      })

      // 监听页面可见性
      document.addEventListener('visibilitychange', () => {
        this.pageVisible = !document.hidden
      })

      this.initialized = true
    },

    /**
     * 设置网络状态
     * @param {Boolean} status - 网络状态
     */
    setOnlineStatus(status) {
      this.online = status
    },

    /**
     * 设置页面可见性
     * @param {Boolean} visible - 是否可见
     */
    setPageVisible(visible) {
      this.pageVisible = visible
    },

    /**
     * 添加缓存视图
     * @param {Object} view - 视图对象
     */
    addCachedView(view) {
      if (this.cachedViews.some(v => v.path === view.path)) return
      this.cachedViews.push(view)
    },

    /**
     * 删除缓存视图
     * @param {Object} view - 视图对象
     */
    removeCachedView(view) {
      const index = this.cachedViews.findIndex(v => v.path === view.path)
      if (index > -1) {
        this.cachedViews.splice(index, 1)
      }
    },

    /**
     * 清空所有缓存视图
     */
    clearCachedViews() {
      this.cachedViews = []
    },

    /**
     * 设置面包屑
     * @param {Array} breadcrumbs - 面包屑数组
     */
    setBreadcrumbs(breadcrumbs) {
      this.breadcrumbs = breadcrumbs
    },

    /**
     * 添加错误
     * @param {Object} error - 错误对象
     */
    addError(error) {
      this.errors.push({
        ...error,
        timestamp: Date.now(),
      })
    },

    /**
     * 清空错误
     */
    clearErrors() {
      this.errors = []
    },
  },
})
