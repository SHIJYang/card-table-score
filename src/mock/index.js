/**
 * Mock数据拦截器
 * 用于开发环境模拟API响应
 */

import axios from 'axios'
import MockAdapter from 'axios-mock-adapter'
import { userMock } from './user'
import { gameMock } from './game'

// 判断是否启用Mock
const MOCK_ENABLED = import.meta.env.VITE_MOCK_ENABLED === 'true'

/**
 * 初始化Mock
 * @param {AxiosInstance} instance - axios实例
 */
export function setupMock(instance) {
  if (!MOCK_ENABLED) {
    console.log('Mock数据已禁用')
    return
  }

  console.log('Mock数据已启用')

  // 创建Mock适配器
  const mock = new MockAdapter(instance, { delayResponse: 300 })

  // 注册用户相关Mock
  userMock(mock)

  // 注册游戏相关Mock
  gameMock(mock)

  // 其他未匹配的请求通过
  mock.onAny().passThrough()
}

/**
 * 生成成功响应
 */
export const successResponse = (data = null, message = '操作成功') => {
  return [
    200,
    {
      code: 200,
      message,
      data,
      timestamp: Date.now(),
    },
  ]
}

/**
 * 生成错误响应
 */
export const errorResponse = (message = '操作失败', code = 500) => {
  return [
    200,
    {
      code,
      message,
      data: null,
      timestamp: Date.now(),
    },
  ]
}

/**
 * 生成分页数据
 */
export const paginationData = (list, page = 1, pageSize = 10) => {
  const start = (page - 1) * pageSize
  const end = start + pageSize
  const data = list.slice(start, end)

  return {
    list: data,
    total: list.length,
    page: Number(page),
    pageSize: Number(pageSize),
    totalPages: Math.ceil(list.length / pageSize),
  }
}

export default setupMock
