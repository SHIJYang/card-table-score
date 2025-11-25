// app.js (重构版)
import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

export const useAppStore = defineStore('app', () => {
  // ========== 状态 ==========
  const initialized = ref(false)
  const online = ref(navigator.onLine)
  const pageVisible = ref(!document.hidden)
  const cachedViews = ref([])
  const breadcrumbs = ref([])
  const errors = ref([])
  const device = ref({
    isMobile: /Mobile|Android|iPhone/i.test(navigator.userAgent),
    isTablet: /iPad|Tablet/i.test(navigator.userAgent),
    isDesktop: !/Mobile|Android|iPhone|iPad|Tablet/i.test(navigator.userAgent),
  })

  // ========== 计算属性 ==========
  const isInitialized = computed(() => initialized.value)
  const isOnline = computed(() => online.value)
  const isPageVisible = computed(() => pageVisible.value)
  const getCachedViews = computed(() => cachedViews.value)
  const isMobile = computed(() => device.value.isMobile)
  const isTablet = computed(() => device.value.isTablet)
  const isDesktop = computed(() => device.value.isDesktop)

  // ========== Actions ==========
  async function init() {
    if (initialized.value) return
    window.addEventListener('online', () => online.value = true)
    window.addEventListener('offline', () => online.value = false)
    document.addEventListener('visibilitychange', () => pageVisible.value = !document.hidden)
    initialized.value = true
  }

  function setOnlineStatus(status) { online.value = status }
  function setPageVisible(visible) { pageVisible.value = visible }

  function addCachedView(view) {
    if (!cachedViews.value.some(v => v.path === view.path)) {
      cachedViews.value.push(view)
    }
  }

  function removeCachedView(view) {
    const index = cachedViews.value.findIndex(v => v.path === view.path)
    if (index > -1) cachedViews.value.splice(index, 1)
  }

  function clearCachedViews() { cachedViews.value = [] }
  function setBreadcrumbs(bcs) { breadcrumbs.value = bcs }
  function addError(err) { errors.value.push({ ...err, timestamp: Date.now() }) }
  function clearErrors() { errors.value = [] }

  // ========== 返回 ==========
  return {
    // 状态
    initialized, online, pageVisible, cachedViews, breadcrumbs, errors, device,
    // 计算属性
    isInitialized, isOnline, isPageVisible, getCachedViews,
    isMobile, isTablet, isDesktop,
    // 方法
    init, setOnlineStatus, setPageVisible, addCachedView, removeCachedView,
    clearCachedViews, setBreadcrumbs, addError, clearErrors
  }
})