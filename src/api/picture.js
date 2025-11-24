import request from '@/utils/requestimg'

/**
 * 图片相关API
 */

// 生成临时上传 Token
export const generateUploadTokens = (data) => {
    return request.post('/images/tokens', data)
}

// 上传图片
export const uploadImage = (data, config) => {
    return request.post('/upload', data, {
        headers: {
            'Content-Type': 'multipart/form-data',
            ...config?.headers
        },
        ...config
    })
}

// 获取图片列表
export const getImageList = (params) => {
    return request.get('/images', params)
}

// 删除图片
export const deleteImage = (key) => {
    return request.delete(`/images/${key}`)
}

/**
 * 相册相关API
 */

// 获取相册列表
export const getAlbumList = (params) => {
    return request.get('/albums', params)
}

// 删除相册
export const deleteAlbum = (id) => {
    return request.delete(`/albums/${id}`)
}

/**
 * 策略相关API
 */

// 获取策略列表
export const getStrategyList = (params) => {
    return request.get('/strategies', params)
}

/**
 * 用户相关API
 */

// 获取用户信息
export const getUserProfile = () => {
    return request.get('/profile')
}
