import axios from 'axios'
import { ElMessage, ElLoading } from 'element-plus'
import { useUserStore } from '@/store'

// 创建axios实例
const service = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api', // API基础路径
  timeout: 15000, // 请求超时时间
  headers: {
    'Content-Type': 'application/json;charset=UTF-8',
  },
})

// 加载实例
let loadingInstance = null

// 请求拦截器
service.interceptors.request.use(
  (config) => {
    // 显示加载动画（可选）
    if (config.loading !== false) {
      loadingInstance = ElLoading.service({
        lock: true,
        text: '加载中...',
        background: 'rgba(0, 0, 0, 0.7)',
      })
    }

    // 获取token - 优先从 localStorage 获取，避免 Pinia 未初始化的问题
    const token = localStorage.getItem('token')

    // 添加token到请求头
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`
    }

    // 添加时间戳防止缓存
    if (config.method === 'get') {
      config.params = {
        ...config.params,
        _t: Date.now(),
      }
    }

    return config
  },
  (error) => {
    console.error('请求错误:', error)
    return Promise.reject(error)
  }
)

// 响应拦截器
service.interceptors.response.use(
  (response) => {
    // 关闭加载动画
    loadingInstance?.close()

    const res = response.data

    // 根据自定义错误码判断请求是否成功
    if (res.code !== 200 && res.code !== 0) {
      // token过期或无效
      if (res.code === 401 || res.code === 403) {
        // 清除本地token
        localStorage.removeItem('token')
        // 尝试获取 userStore 并登出
        try {
          const userStore = useUserStore()
          userStore.logout()
        } catch (e) {
          console.warn('无法访问 userStore:', e)
        }
        // 可以跳转到登录页
        // window.location.href = '/login'
      }

      // 错误提示 - 不在这里显示，让业务层处理
      // ElMessage.error(res.message || '请求失败')

      return Promise.reject(new Error(res.message || '请求失败'))
    }

    return res
  },
  (error) => {
    // 关闭加载动画
    loadingInstance?.close()

    console.error('响应错误:', error)

    let message = '网络错误'

    if (error.response) {
      switch (error.response.status) {
        case 400:
          message = '请求参数错误'
          break
        case 401:
          message = '未授权，请重新登录'
          // 清除本地token
          localStorage.removeItem('token')
          try {
            const userStore = useUserStore()
            userStore.logout()
          } catch (e) {
            console.warn('无法访问 userStore:', e)
          }
          break
        case 403:
          message = '拒绝访问'
          break
        case 404:
          message = '请求地址不存在'
          break
        case 500:
          message = '服务器内部错误'
          break
        case 502:
          message = '网关错误'
          break
        case 503:
          message = '服务不可用'
          break
        case 504:
          message = '网关超时'
          break
        default:
          message = `连接错误${error.response.status}`
      }
    } else if (error.code === 'ECONNABORTED') {
      message = '请求超时'
    } else if (error.message.includes('Network Error')) {
      message = '网络连接异常'
    }

    // 不在拦截器中显示错误，让业务层处理
    // ElMessage.error(message)
    return Promise.reject(error)
  }
)

/**
 * 封装的请求方法
 */
export const request = {
  /**
   * GET请求
   * @param {string} url - 请求地址
   * @param {object} params - 请求参数
   * @param {object} config - 额外配置
   */
  get(url, params = {}, config = {}) {
    return service({
      method: 'get',
      url,
      params,
      ...config,
    })
  },

  /**
   * POST请求
   * @param {string} url - 请求地址
   * @param {object} data - 请求数据
   * @param {object} config - 额外配置
   */
  post(url, data = {}, config = {}) {
    return service({
      method: 'post',
      url,
      data,
      ...config,
    })
  },

  /**
   * PUT请求
   * @param {string} url - 请求地址
   * @param {object} data - 请求数据
   * @param {object} config - 额外配置
   */
  put(url, data = {}, config = {}) {
    return service({
      method: 'put',
      url,
      data,
      ...config,
    })
  },

  /**
   * DELETE请求
   * @param {string} url - 请求地址
   * @param {object} params - 请求参数
   * @param {object} config - 额外配置
   */
  delete(url, params = {}, config = {}) {
    return service({
      method: 'delete',
      url,
      params,
      ...config,
    })
  },

  /**
   * 上传文件
   * @param {string} url - 请求地址
   * @param {FormData} data - 表单数据
   * @param {object} config - 额外配置
   */
  upload(url, data, config = {}) {
    return service({
      method: 'post',
      url,
      data,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      ...config,
    })
  },
}

export default service
