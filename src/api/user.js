import { request } from '@/utils/request'

/**
 * 用户相关API
 */

// 用户登录
export const login = (data) => {
  return request.post('/user/login', data)
}

// 用户注册
export const register = (data) => {
  return request.post('/user/register', data)
}

// 获取用户信息
export const getUserInfo = () => {
  return request.get('/user/info')
}

// 更新用户信息
export const updateUserInfo = (data) => {
  return request.put('/user/info', data)
}

// 修改密码
export const changePassword = (data) => {
  return request.post('/user/password/change', data)
}

// 用户登出
export const logout = () => {
  return request.post('/user/logout')
}

// 获取用户统计信息
export const getUserStats = () => {
  return request.get('/user/stats')
}

// 上传头像
export const uploadAvatar = (file) => {
  const formData = new FormData()
  formData.append('avatar', file)
  return request.upload('/user/avatar', formData)
}
