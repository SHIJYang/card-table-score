import { successResponse, errorResponse } from './index'

// 模拟用户数据
const mockUsers = [
  {
    id: 1,
    username: 'admin',
    password: '123456',
    name: '管理员',
    email: 'admin@example.com',
    avatar: 'https://i.pravatar.cc/150?img=1',
    role: 'admin',
    createTime: '2024-01-01 00:00:00',
  },
  {
    id: 2,
    username: 'user',
    password: '123456',
    name: '普通用户',
    email: 'user@example.com',
    avatar: 'https://i.pravatar.cc/150?img=2',
    role: 'user',
    createTime: '2024-01-02 00:00:00',
  },
]

// 模拟token
let currentToken = 'mock-token-' + Date.now()

/**
 * 用户相关Mock
 */
export function userMock(mock) {
  // 用户登录
  mock.onPost('/user/login').reply((config) => {
    try {
      const { username, password } = JSON.parse(config.data)
      
      const user = mockUsers.find(
        (u) => u.username === username && u.password === password
      )

      if (user) {
        currentToken = 'mock-token-' + Date.now()
        const { password: _, ...userInfo } = user
        return successResponse(
          {
            token: currentToken,
            userInfo,
          },
          '登录成功'
        )
      }

      return errorResponse('用户名或密码错误', 401)
    } catch (error) {
      console.error('登录 Mock 错误:', error)
      return errorResponse('登录请求处理失败', 500)
    }
  })

  // 用户注册
  mock.onPost('/user/register').reply((config) => {
    const data = JSON.parse(config.data)
    
    const existUser = mockUsers.find((u) => u.username === data.username)
    if (existUser) {
      return errorResponse('用户名已存在', 400)
    }

    const newUser = {
      id: mockUsers.length + 1,
      username: data.username,
      password: data.password,
      name: data.name || data.username,
      email: data.email || '',
      avatar: `https://i.pravatar.cc/150?img=${mockUsers.length + 1}`,
      role: 'user',
      createTime: new Date().toLocaleString(),
    }

    mockUsers.push(newUser)
    const { password, ...userInfo } = newUser

    return successResponse(
      {
        userInfo,
      },
      '注册成功'
    )
  })

  // 获取用户信息
  mock.onGet('/user/info').reply((config) => {
    const token = config.headers.Authorization?.replace('Bearer ', '')

    if (token !== currentToken) {
      return errorResponse('未授权', 401)
    }

    const user = mockUsers[0]
    const { password, ...userInfo } = user

    return successResponse(userInfo)
  })

  // 更新用户信息
  mock.onPut('/user/info').reply((config) => {
    const token = config.headers.Authorization?.replace('Bearer ', '')

    if (token !== currentToken) {
      return errorResponse('未授权', 401)
    }

    const data = JSON.parse(config.data)
    const user = mockUsers[0]
    
    Object.assign(user, data)
    const { password, ...userInfo } = user

    return successResponse(userInfo, '更新成功')
  })

  // 修改密码
  mock.onPost('/user/password/change').reply((config) => {
    const { oldPassword, newPassword } = JSON.parse(config.data)
    const user = mockUsers[0]

    if (user.password !== oldPassword) {
      return errorResponse('原密码错误', 400)
    }

    user.password = newPassword
    return successResponse(null, '密码修改成功')
  })

  // 用户登出
  mock.onPost('/user/logout').reply(() => {
    currentToken = ''
    return successResponse(null, '登出成功')
  })

  // 获取用户统计
  mock.onGet('/user/stats').reply(() => {
    return successResponse({
      totalPlayed: 156,
      totalScore: 98560,
      averageScore: 632,
      highestScore: 9999,
      totalPlayTime: 460800, // 128小时的秒数
      rank: 128,
      achievements: 45,
      friends: 89,
      topGames: [
        {
          gameName: '宝石消除',
          playCount: 45,
          bestScore: 9999,
          avgScore: 8500
        },
        {
          gameName: '太空射击',
          playCount: 38,
          bestScore: 8800,
          avgScore: 7200
        },
        {
          gameName: '迷宫探险',
          playCount: 32,
          bestScore: 7500,
          avgScore: 6800
        },
        {
          gameName: '数字华容道',
          playCount: 25,
          bestScore: 6500,
          avgScore: 5400
        },
        {
          gameName: '记忆翻牌',
          playCount: 16,
          bestScore: 5200,
          avgScore: 4500
        }
      ]
    })
  })

  // 上传头像
  mock.onPost('/user/avatar').reply(() => {
    const avatarUrl = `https://i.pravatar.cc/150?img=${Math.floor(Math.random() * 70)}`
    return successResponse(
      {
        url: avatarUrl,
      },
      '头像上传成功'
    )
  })
}
