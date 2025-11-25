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
    // ========== 状态 ==========
    const userProfile = ref(null)
    const imageList = ref([])
    const imagePagination = ref({ current_page: 1, last_page: 1, per_page: 20, total: 0 })
    const albumList = ref([])
    const albumPagination = ref({ current_page: 1, last_page: 1, per_page: 20, total: 0 })
    const loading = ref({
        profile: false,
        images: false,
        albums: false,
        upload: false,
        action: false // 用于删除等操作
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

    async function fetchImages(params = {}) {
        setLoading('images', true)
        try {
            const res = await getImageList(params)
            imageList.value = res.data?.data || []
            const meta = res.data?.meta || {}
            imagePagination.value = {
                current_page: meta.current_page ?? 1,
                last_page: meta.last_page ?? 1,
                per_page: meta.per_page ?? 20,
                total: meta.total ?? 0
            }
        } catch (err) {
            setError(err.response?.data?.message || '获取图片列表失败')
        } finally {
            setLoading('images', false)
        }
    }

    // 接收原始 File 对象 + 其他参数（如 permission, album_id 等）
    async function uploadImage(file, options = {}) {
        if (!file) throw new Error('未选择文件')
        if (isStorageFull.value) throw new Error('存储空间已满')

        setLoading('upload', true)
        clearError()

        try {
            const formData = new FormData()
            formData.append('file', file)

            // 添加其他字段
            if (options.permission !== undefined) {
                formData.append('permission', options.permission)
            }
            if (options.album_id) {
                formData.append('album_id', options.album_id)
            }
            if (options.expired_at) {
                formData.append('expired_at', options.expired_at)
            }

            const res = await apiUploadImage(formData)
            const newImage = res.data

            imageList.value.unshift({ ...newImage })

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
            // 保守更新存储用量
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

    // ========== 重置 ==========
    function reset() {
        userProfile.value = null
        imageList.value = []
        albumList.value = []
        error.value = null
        imagePagination.value = { current_page: 1, last_page: 1, per_page: 20, total: 0 }
        albumPagination.value = { current_page: 1, last_page: 1, per_page: 20, total: 0 }
        loading.value = {
            profile: false,
            images: false,
            albums: false,
            upload: false,
            action: false
        }
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

        // 计算属性
        isStorageFull,
        remainingStorage,

        // 方法
        fetchProfile,
        fetchImages,
        fetchAlbums,
        uploadImage,
        removeImage,
        removeAlbum,
        reset,
        clearError,

        // 纯状态设置（供测试或外部同步）
        setUserProfile: (profile) => { userProfile.value = profile ? { ...profile } : null },
        setImageList: (list) => { imageList.value = Array.isArray(list) ? [...list] : [] },
        setAlbumList: (list) => { albumList.value = Array.isArray(list) ? [...list] : [] }
    }
})