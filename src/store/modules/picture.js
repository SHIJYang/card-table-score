// src/store/picture.js
import { defineStore } from 'pinia'

export const useImageStore = defineStore('image', {
    state: () => ({
        userProfile: null,
        imageList: [],
        imagePagination: {
            current_page: 1,
            last_page: 1,
            per_page: 20,
            total: 0
        },
        albumList: [],
        albumPagination: {
            current_page: 1,
            last_page: 1,
            per_page: 20,
            total: 0
        },
        strategyList: [],
        loading: {
            profile: false,
            images: false,
            albums: false,
            strategies: false,
            upload: false
        },
        error: null
    }),

    getters: {
        storageUsage: (state) => {
            if (!state.userProfile) return 0
            return (state.userProfile.size / state.userProfile.capacity) * 100
        },
        remainingStorage: (state) => {
            if (!state.userProfile) return 0
            return state.userProfile.capacity - state.userProfile.size
        },
        isStorageFull: (state) => {
            if (!state.userProfile) return false
            return state.userProfile.size >= state.userProfile.capacity
        }
    },

    actions: {
        // 用户资料相关
        setUserProfile(profile) {
            this.userProfile = profile
        },

        // 图片相关
        setImageList(images) {
            this.imageList = images
        },

        setImagePagination(pagination) {
            this.imagePagination = {
                current_page: pagination.current_page || 1,
                last_page: pagination.last_page || 1,
                per_page: pagination.per_page || 20,
                total: pagination.total || 0
            }
        },

        addImage(image) {
            this.imageList.unshift(image)
        },

        removeImage(key) {
            this.imageList = this.imageList.filter(img => img.key !== key)
        },

        removeImages(keys) {
            this.imageList = this.imageList.filter(img => !keys.includes(img.key))
        },

        // 相册相关
        setAlbumList(albums) {
            this.albumList = albums
        },

        setAlbumPagination(pagination) {
            this.albumPagination = {
                current_page: pagination.current_page || 1,
                last_page: pagination.last_page || 1,
                per_page: pagination.per_page || 20,
                total: pagination.total || 0
            }
        },

        removeAlbum(id) {
            this.albumList = this.albumList.filter(album => album.id !== id)
        },

        // 策略相关
        setStrategyList(strategies) {
            this.strategyList = strategies
        },

        // 加载状态管理
        setLoading(key, value) {
            if (this.loading.hasOwnProperty(key)) {
                this.loading[key] = value
            }
        },

        // 错误管理
        setError(error) {
            this.error = error
        },

        clearError() {
            this.error = null
        },

        // 重置状态
        reset() {
            this.userProfile = null
            this.imageList = []
            this.imagePagination = { current_page: 1, last_page: 1, per_page: 20, total: 0 }
            this.albumList = []
            this.albumPagination = { current_page: 1, last_page: 1, per_page: 20, total: 0 }
            this.strategyList = []
            this.error = null
        }
    }
})