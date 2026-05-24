// stores/picture.js
import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import {
  uploadImage as apiUploadImage,
  getImageList,
  deleteImage,
  getAlbumList,
  deleteAlbum,
  getUserProfile
} from '@/api/picture'

export const useImageStore = defineStore('image', () => {
  // ========== 用户状态 ==========
  const userProfile = ref(null)

  // ========== 图片列表状态 ==========
  const imageList = ref([])
  const imagePagination = ref({
    current_page: 1,
    last_page: 1,
    per_page: 20,
    total: 0
  })

  // ========== 相册列表状态 ==========
  const albumList = ref([])
  const albumPagination = ref({
    current_page: 1,
    last_page: 1,
    per_page: 20,
    total: 0
  })

  // ========== UI 状态（原在组件中）==========
  const searchKeyword = ref('')
  const filterPermission = ref('')
  const filterAlbum = ref('')
  const sortOrder = ref('newest')
  const selectedImages = ref([])

  // ========== 加载与错误状态 ==========
  const loading = ref({
    profile: false,
    images: false,
    albums: false,
    upload: false,
    action: false
  })
  const error = ref(null)

  // ========== 计算属性 ==========
  const isStorageFull = computed(() => {
    if (!userProfile.value) return false
    return userProfile.value.size >= userProfile.value.capacity
  })

  const remainingStorage = computed(() => {
    if (!userProfile.value) return 0
    return Math.max(0, userProfile.value.capacity - userProfile.value.size)
  })

  const storageUsagePercent = computed(() => {
    const used = userProfile.value?.size || 0
    const total = userProfile.value?.capacity || 1
    return Math.round((used / total) * 100)
  })

  // ========== 🚀 新增：内存 LRU 缓存 ==========
  const imageCache = new Map()
  const MAX_CACHE = 300

  function getCached(page) {
    return imageCache.get(String(page))
  }

  function setCached(page, data) {
    const key = String(page)
    // LRU：删除最旧的
    if (imageCache.size >= MAX_CACHE) {
      const firstKey = imageCache.keys().next().value
      imageCache.delete(firstKey)
    }
    imageCache.set(key, data)
  }

  function clearCache() {
    imageCache.clear()
  }

  // ========== 🚀 新增：请求去重 Map ==========
  const pendingRequests = new Map()

  function dedupKey(params) {
    return JSON.stringify({ url: '/images', params })
  }

  async function dedupedFetch(key, fetcher) {
    // 相同 key 正在请求中 → 复用那个 Promise
    if (pendingRequests.has(key)) {
      return pendingRequests.get(key)
    }
    const promise = fetcher().finally(() => {
      pendingRequests.delete(key)
    })
    pendingRequests.set(key, promise)
    return promise
  }

  // ========== 🚀 新增：预加载计时器 ==========
  let preloadTimer = null

  function schedulePreload() {
    if (preloadTimer) clearTimeout(preloadTimer)
    preloadTimer = setTimeout(() => {
      const { current_page, last_page } = imagePagination.value
      if (current_page < last_page) {
        // 静默预加载下一页（不触发 loading 动画）
        const nextPage = current_page + 1
        // 用内部方法，不带 loading 状态
        _fetchPageSilent(nextPage)
      }
    }, 800)
  }

  async function _fetchPageSilent(page) {
    const cached = getCached(page)
    if (cached) return cached

    try {
      const params = {
        page,
        per_page: imagePagination.value.per_page,
        q: searchKeyword.value,
        permission: filterPermission.value,
        album_id: filterAlbum.value,
        order: sortOrder.value
      }
      const res = await dedupedFetch(dedupKey(params), () => getImageList(params))
      const responseData = res.data || {}
      const newItems = responseData.data || []

      // 缓存
      setCached(page, newItems)

      return { items: newItems, pagination: responseData }
    } catch {
      return null
    }
  }

  // ========== 工具方法 ==========
  function setLoading(key, value) {
    if (key in loading.value) loading.value[key] = Boolean(value)
  }

  function setError(msg) {
    error.value = msg || null
  }

  function clearError() {
    error.value = null
  }

  // ========== 用户 Profile ==========
  async function fetchProfile() {
    setLoading('profile', true)
    try {
      const res = await getUserProfile()
      userProfile.value = res.data ? { ...res.data } : null
    } catch (err) {
      setError(err.response?.data?.message || '获取用户信息失败')
    } finally {
      setLoading('profile', false)
    }
  }

  // ========== 图片 CRUD ==========
  async function fetchImages() {
    setLoading('images', true)
    try {
      const params = {
        page: imagePagination.value.current_page,
        per_page: imagePagination.value.per_page,
        q: searchKeyword.value,
        permission: filterPermission.value,
        album_id: filterAlbum.value,
        order: sortOrder.value
      }

      const dk = dedupKey(params)
      const res = await dedupedFetch(dk, () => getImageList(params))

      // API 返回结构: { status, message, data: { current_page, last_page, per_page, total, data: [...] } }
      const responseData = res.data || {}
      const newItems = responseData.data || []

      // ✅ 更新缓存
      setCached(imagePagination.value.current_page, newItems)

      imageList.value = newItems
      imagePagination.value = {
        current_page: responseData.current_page ?? 1,
        last_page: responseData.last_page ?? 1,
        per_page: responseData.per_page ?? 20,
        total: responseData.total ?? 0
      }

      // 🚀 触发预加载
      schedulePreload()
    } catch (err) {
      setError(err.response?.data?.message || '获取图片列表失败')
    } finally {
      setLoading('images', false)
    }
  }

  async function uploadImage(file, options = {}) {
    if (!file) throw new Error('未选择文件')
    if (isStorageFull.value) throw new Error('存储空间已满')
    setLoading('upload', true)
    clearError()
    try {
      const formData = new FormData()
      formData.append('file', file)
      if (options.permission !== undefined) formData.append('permission', options.permission)
      if (options.album_id) formData.append('album_id', options.album_id)
      if (options.expired_at) formData.append('expired_at', options.expired_at)

      const res = await apiUploadImage(formData)
      const newImage = res.data
      imageList.value.unshift({ ...newImage })

      // 缓存第一页也要更新
      const page1 = getCached(1)
      if (page1) {
        setCached(1, [{ ...newImage }, ...page1])
      }

      if (userProfile.value && typeof newImage.size === 'number') {
        userProfile.value.size += newImage.size
      } else {
        await fetchProfile()
      }
      return newImage
    } catch (err) {
      const msg = err.response?.data?.message || '上传失败'
      setError(msg)
      throw err
    } finally {
      setLoading('upload', false)
    }
  }

  async function removeImage(key) {
    if (!key) return
    setLoading('action', true)
    try {
      await deleteImage(key)
      imageList.value = imageList.value.filter(img => img.key !== key)
      selectedImages.value = selectedImages.value.filter(k => k !== key)

      // 清缓存 — 简单处理，全部失效
      clearCache()

      await fetchProfile()
    } catch (err) {
      setError(err.response?.data?.message || '删除失败')
      throw err
    } finally {
      setLoading('action', false)
    }
  }

  // ========== 相册 ==========
  async function fetchAlbums(page = 1, per_page = 20) {
    setLoading('albums', true)
    try {
      const res = await getAlbumList({ page, per_page })
      albumList.value = res.data?.data || []
      const meta = res.data?.meta || {}
      albumPagination.value = {
        current_page: meta.current_page ?? 1,
        last_page: meta.last_page ?? 1,
        per_page: meta.per_page ?? 20,
        total: meta.total ?? 0
      }
    } catch (err) {
      setError(err.response?.data?.message || '获取相册列表失败')
    } finally {
      setLoading('albums', false)
    }
  }

  async function removeAlbum(id) {
    if (!id) return
    setLoading('action', true)
    try {
      await deleteAlbum(id)
      albumList.value = albumList.value.filter(album => album.id !== id)
    } catch (err) {
      setError(err.response?.data?.message || '删除相册失败')
      throw err
    } finally {
      setLoading('action', false)
    }
  }

  // ========== 搜索与筛选 ==========
  function setSearchKeyword(val) {
    searchKeyword.value = val
    imagePagination.value.current_page = 1
    clearCache() // 搜索条件变了，缓存全失效
  }

  function setFilterPermission(val) {
    filterPermission.value = val
    imagePagination.value.current_page = 1
    clearCache()
  }

  function setFilterAlbum(val) {
    filterAlbum.value = val
    imagePagination.value.current_page = 1
    clearCache()
  }

  function setSortOrder(val) {
    sortOrder.value = val
    imagePagination.value.current_page = 1
    clearCache()
  }

  function toggleSelected(key) {
    const index = selectedImages.value.indexOf(key)
    if (index > -1) {
      selectedImages.value.splice(index, 1)
    } else {
      selectedImages.value.push(key)
    }
  }

  function clearSelection() {
    selectedImages.value = []
  }

  async function handleSearch() {
    await fetchImages()
  }

  async function handlePageChange(page) {
    imagePagination.value.current_page = page
    await fetchImages()
  }

  async function handleSizeChange(size) {
    imagePagination.value.per_page = size
    imagePagination.value.current_page = 1
    clearCache()
    await fetchImages()
  }

  // ========== 🚀 优化：加载指定页（追加模式，带缓存）==========
  async function fetchImagesForPage(page) {
    const { last_page } = imagePagination.value
    if (page > last_page) return

    setLoading('images', true)
    try {
      const result = await _fetchPageSilent(page)
      if (!result) return

      const newImages = result.items || []
      const responseData = result.pagination || {}

      // 追加到现有列表
      imageList.value.push(...newImages)

      // 更新分页信息
      imagePagination.value = {
        current_page: page,
        last_page: responseData.last_page ?? last_page,
        per_page: responseData.per_page ?? imagePagination.value.per_page,
        total: responseData.total ?? imagePagination.value.total
      }

      // 🚀 预加载下一页
      schedulePreload()
    } catch (err) {
      setError(err.response?.data?.message || '加载图片失败')
    } finally {
      setLoading('images', false)
    }
  }

  // ========== 返回缓存页数据（供组件读取，无需再请求）==========
  function getCachedPage(page) {
    return getCached(page) || []
  }

  // ========== 批量删除 ==========
  async function removeSelectedImages() {
    if (selectedImages.value.length === 0) return
    for (const key of [...selectedImages.value]) {
      await removeImage(key)
    }
    clearSelection()
  }

  // ========== 重置 ==========
  function reset() {
    userProfile.value = null
    imageList.value = []
    albumList.value = []
    error.value = null
    selectedImages.value = []
    searchKeyword.value = ''
    filterPermission.value = ''
    filterAlbum.value = ''
    sortOrder.value = 'newest'

    imagePagination.value = { current_page: 1, last_page: 1, per_page: 20, total: 0 }
    albumPagination.value = { current_page: 1, last_page: 1, per_page: 20, total: 0 }
    loading.value = { profile: false, images: false, albums: false, upload: false, action: false }
    clearCache()
  }

  // ========== 返回 ==========
  return {
    // 状态
    userProfile,
    imageList,
    imagePagination,
    albumList,
    albumPagination,
    loading,
    error,

    // UI 状态（原在组件）
    searchKeyword,
    filterPermission,
    filterAlbum,
    sortOrder,
    selectedImages,

    // 计算属性
    isStorageFull,
    remainingStorage,
    storageUsagePercent,

    // 方法
    fetchProfile,
    fetchImages,
    fetchImagesForPage,
    fetchAlbums,
    uploadImage,
    removeImage,
    removeAlbum,
    removeSelectedImages,

    // 搜索/筛选控制
    setSearchKeyword,
    setFilterPermission,
    setFilterAlbum,
    setSortOrder,
    handleSearch,
    handlePageChange,
    handleSizeChange,
    toggleSelected,
    clearSelection,

    // 工具
    reset,
    clearError,

    // 🚀 新增
    getCachedPage,
    clearCache,

    // 纯状态设置（供测试）
    setUserProfile: (profile) => { userProfile.value = profile ? { ...profile } : null },
    setImageList: (list) => { imageList.value = Array.isArray(list) ? [...list] : [] },
    setAlbumList: (list) => { albumList.value = Array.isArray(list) ? [...list] : [] }
  }
})
