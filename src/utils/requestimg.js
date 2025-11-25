
import axios from 'axios'
import { ElMessage } from 'element-plus'

const API_TOKEN = '1931|vXMmh0tkYYrShG1S8yRpfN1aA7gfBplLYkQAXSSc'

// 创建 axios 实例
const request = axios.create({
    baseURL: 'https://picui.cn/api/v1',
    timeout: 10000,
    headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${API_TOKEN}`
    }
})

// 请求拦截器
request.interceptors.request.use(
    (config) => {
        // 添加时间戳防止缓存（仅对 GET 请求）
        if (config.method === 'get') {
            config.params = {
                ...config.params,
                _t: Date.now()
            }
        }

        return config
    },
    (error) => {
        return Promise.reject(error)
    }
)

// 响应拦截器 - 处理错误和速率限制
request.interceptors.response.use(
    (response) => {
        // 处理速率限制信息
        const limit = response.headers['x-ratelimit-limit']
        const remaining = response.headers['x-ratelimit-remaining']

        if (limit && remaining) {
            console.log(`速率限制: ${remaining}/${limit}`)

            // 如果剩余请求很少，显示警告
            if (remaining < 10) {
                ElMessage.warning(`API 请求即将达到限制，剩余 ${remaining} 次`)
            }
        }

        const { data } = response

        // 如果返回的数据有 status 字段且为 false，视为错误
        if (data && data.status === false) {
            ElMessage.error(data.message || '请求失败')
            return Promise.reject(new Error(data.message || '请求失败'))
        }

        return data
    },
    (error) => {
        const { response } = error

        if (response) {
            switch (response.status) {
                case 401:
                    ElMessage.error('Token 无效或已过期')
                    break
                case 403:
                    ElMessage.error('禁止访问')
                    break
                case 429:
                    ElMessage.error('请求过于频繁，请稍后重试')
                    break
                case 500:
                    ElMessage.error('服务器内部错误')
                    break
                default:
                    ElMessage.error(response.data?.message || `请求错误: ${response.status}`)
            }
        } else {
            ElMessage.error('网络连接失败，请检查网络设置')
        }

        return Promise.reject(error)
    }
)

export default request
