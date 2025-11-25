// user.js (重构版)
import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import * as userApi from '@/api/user'
import { ElMessage } from 'element-plus'

export const useUserStore = defineStore('user', () => {
  // ========== 状态 ==========
  const userInfo = ref(null)
  const token = ref(localStorage.getItem('token') || '')
  const isLogin = ref(false)
  const userStats = ref(null)

  // ========== 计算属性 ==========
  const userName = computed(() => userInfo.value?.name || '游客')
  const userAvatar = computed(() => userInfo.value?.avatar || '')
  const userEmail = computed(() => userInfo.value?.email || '')
  const hasLogin = computed(() => !!token.value && isLogin.value)
  const userRole = computed(() => userInfo.value?.role || 'guest')

  // ========== Actions ==========
  async function login(loginForm) {
    try {
      const res = await userApi.login(loginForm)
      if (!res || !res.data) throw new Error('登录响应数据格式错误')
      token.value = res.data.token
      userInfo.value = res.data.userInfo
      isLogin.value = true
      localStorage.setItem('token', res.data.token)
      ElMessage.success(res.message || '登录成功')
      return true
    } catch (error) {
      console.error('登录失败:', error)
      const errorMsg = error.message || error.response?.data?.message || '登录失败'
      ElMessage.error(errorMsg)
      return false
    }
  }

  async function register(registerForm) {
    try {
      await userApi.register(registerForm)
      ElMessage.success('注册成功，请登录')
      return true
    } catch (error) {
      ElMessage.error('注册失败：' + (error.message || '未知错误'))
      return false
    }
  }

  async function fetchUserInfo() {
    try {
      const res = await userApi.getUserInfo()
      userInfo.value = res.data
      isLogin.value = true
      return res.data
    } catch (error) {
      console.error('获取用户信息失败', error)
      return null
    }
  }

  async function updateUserInfo(data) {
    try {
      const res = await userApi.updateUserInfo(data)
      userInfo.value = { ...userInfo.value, ...res.data }
      ElMessage.success('更新成功')
      return true
    } catch (error) {
      ElMessage.error('更新失败')
      return false
    }
  }

  async function changePassword(passwordForm) {
    try {
      await userApi.changePassword(passwordForm)
      ElMessage.success('密码修改成功，请重新登录')
      logout()
      return true
    } catch (error) {
      ElMessage.error('密码修改失败')
      return false
    }
  }

  async function fetchUserStats() {
    try {
      const res = await userApi.getUserStats()
      userStats.value = res.data
      return res.data
    } catch (error) {
      console.error('获取用户统计失败', error)
      return null
    }
  }

  async function uploadAvatar(file) {
    try {
      const res = await userApi.uploadAvatar(file)
      userInfo.value.avatar = res.data.url
      ElMessage.success('头像上传成功')
      return res.data.url
    } catch (error) {
      ElMessage.error('头像上传失败')
      return null
    }
  }

  async function logout() {
    try {
      await userApi.logout()
    } catch (error) {
      console.error('登出接口调用失败', error)
    } finally {
      userInfo.value = null
      token.value = ''
      isLogin.value = false
      userStats.value = null
      localStorage.removeItem('token')
      ElMessage.success('已退出登录')
    }
  }

  function setToken(newToken) {
    token.value = newToken
    localStorage.setItem('token', newToken)
  }

  function setUserInfo(info) {
    userInfo.value = info
    isLogin.value = true
  }

  // ========== 返回 ==========
  return {
    // 状态
    userInfo,
    token,
    isLogin,
    userStats,
    // 计算属性
    userName,
    userAvatar,
    userEmail,
    hasLogin,
    userRole,
    // 方法
    login,
    register,
    fetchUserInfo,
    updateUserInfo,
    changePassword,
    fetchUserStats,
    uploadAvatar,
    logout,
    setToken,
    setUserInfo,
  }
})