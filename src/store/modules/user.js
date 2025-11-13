import { defineStore } from 'pinia'
import * as userApi from '@/api/user'
import { ElMessage } from 'element-plus'

/**
 * 用户状态管理
 * 管理用户登录、用户信息、用户统计等
 */
export const useUserStore = defineStore('user', {
  state: () => ({
    userInfo: null,
    token: localStorage.getItem('token') || '',
    isLogin: false,
    userStats: null, // 用户统计信息
  }),

  getters: {
    // 获取用户名
    userName: (state) => state.userInfo?.name || '游客',
    // 获取用户头像
    userAvatar: (state) => state.userInfo?.avatar || '',
    // 获取用户邮箱
    userEmail: (state) => state.userInfo?.email || '',
    // 是否已登录
    hasLogin: (state) => !!state.token && state.isLogin,
    // 用户角色
    userRole: (state) => state.userInfo?.role || 'guest',
  },

  actions: {
    /**
     * 用户登录
     * @param {Object} loginForm - 登录表单 { username, password }
     * @returns {Promise<boolean>} - 是否登录成功
     */
    async login(loginForm) {
      try {
        const res = await userApi.login(loginForm)
        
        // 检查响应数据
        if (!res || !res.data) {
          throw new Error('登录响应数据格式错误')
        }
        
        // 保存token和用户信息
        this.token = res.data.token
        this.userInfo = res.data.userInfo
        this.isLogin = true
        localStorage.setItem('token', res.data.token)
        
        ElMessage.success(res.message || '登录成功')
        return true
      } catch (error) {
        console.error('登录失败:', error)
        const errorMsg = error.message || error.response?.data?.message || '登录失败'
        ElMessage.error(errorMsg)
        return false
      }
    },

    /**
     * 用户注册
     * @param {Object} registerForm - 注册表单 { username, password, email, name }
     * @returns {Promise<boolean>} - 是否注册成功
     */
    async register(registerForm) {
      try {
        const res = await userApi.register(registerForm)
        ElMessage.success('注册成功，请登录')
        return true
      } catch (error) {
        ElMessage.error('注册失败：' + (error.message || '未知错误'))
        return false
      }
    },

    /**
     * 获取用户信息
     * @returns {Promise<Object|null>} - 用户信息
     */
    async fetchUserInfo() {
      try {
        const res = await userApi.getUserInfo()
        this.userInfo = res.data
        this.isLogin = true
        return res.data
      } catch (error) {
        console.error('获取用户信息失败', error)
        return null
      }
    },

    /**
     * 更新用户信息
     * @param {Object} data - 要更新的用户信息
     * @returns {Promise<boolean>} - 是否更新成功
     */
    async updateUserInfo(data) {
      try {
        const res = await userApi.updateUserInfo(data)
        this.userInfo = { ...this.userInfo, ...res.data }
        ElMessage.success('更新成功')
        return true
      } catch (error) {
        ElMessage.error('更新失败')
        return false
      }
    },

    /**
     * 修改密码
     * @param {Object} passwordForm - { oldPassword, newPassword }
     * @returns {Promise<boolean>} - 是否修改成功
     */
    async changePassword(passwordForm) {
      try {
        await userApi.changePassword(passwordForm)
        ElMessage.success('密码修改成功，请重新登录')
        this.logout()
        return true
      } catch (error) {
        ElMessage.error('密码修改失败')
        return false
      }
    },

    /**
     * 获取用户统计信息
     * @returns {Promise<Object|null>} - 统计信息
     */
    async fetchUserStats() {
      try {
        const res = await userApi.getUserStats()
        this.userStats = res.data
        return res.data
      } catch (error) {
        console.error('获取用户统计失败', error)
        return null
      }
    },

    /**
     * 上传用户头像
     * @param {File} file - 图片文件
     * @returns {Promise<string|null>} - 头像URL
     */
    async uploadAvatar(file) {
      try {
        const res = await userApi.uploadAvatar(file)
        this.userInfo.avatar = res.data.url
        ElMessage.success('头像上传成功')
        return res.data.url
      } catch (error) {
        ElMessage.error('头像上传失败')
        return null
      }
    },

    /**
     * 用户登出
     */
    async logout() {
      try {
        await userApi.logout()
      } catch (error) {
        console.error('登出接口调用失败', error)
      } finally {
        // 无论接口是否成功，都清空本地状态
        this.userInfo = null
        this.token = ''
        this.isLogin = false
        this.userStats = null
        localStorage.removeItem('token')
        ElMessage.success('已退出登录')
      }
    },

    // 内部方法：设置token（用于特殊场景）
    setToken(token) {
      this.token = token
      localStorage.setItem('token', token)
    },

    // 内部方法：设置用户信息（用于特殊场景）
    setUserInfo(userInfo) {
      this.userInfo = userInfo
      this.isLogin = true
    },
  },
})
