import { successResponse, paginationData } from './index'
// 从store导入游戏注册表，保持一致性
import { GAME_REGISTRY, GAME_CATEGORIES } from '@/store/modules/game'

// 基于注册表生成完整的模拟游戏数据
const mockGames = GAME_REGISTRY.filter(g => g.enabled).map((game, index) => ({
  ...game,
  // 添加mock特有的字段
  image: `https://picsum.photos/400/300?random=${game.id}`,
  icon: game.icon, // 使用注册表的icon（Emoji）
  players: Math.floor(Math.random() * 20000) + 5000,
  rating: (Math.random() * 1 + 4).toFixed(1),
  playCount: Math.floor(Math.random() * 200000) + 50000,
  favoriteCount: Math.floor(Math.random() * 15000) + 3000,
  createTime: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  updateTime: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
}))

// 游戏分类（使用注册表的分类，添加动态计数）
const mockCategories = GAME_CATEGORIES.map(category => ({
  ...category,
  count: GAME_REGISTRY.filter(g => g.category === category.id && g.enabled).length,
}))

// 生成随机游戏记录
const generateGameHistory = () => {
  const history = []
  const now = Date.now()
  
  for (let i = 0; i < 100; i++) {
    const game = mockGames[Math.floor(Math.random() * mockGames.length)]
    const randomDays = Math.floor(Math.random() * 90) // 过去90天内
    const playDate = new Date(now - randomDays * 24 * 60 * 60 * 1000)
    
    history.push({
      id: i + 1,
      gameId: game.id,
      gameName: game.name,
      gameIcon: game.icon,
      score: Math.floor(Math.random() * 10000) + 1000,
      playTime: Math.floor(Math.random() * 3600) + 60, // 60秒到1小时
      ranking: Math.floor(Math.random() * 100) + 1,
      playDate: playDate.toISOString(),
      createTime: playDate.toLocaleString(),
    })
  }
  
  // 按时间倒序排序
  return history.sort((a, b) => new Date(b.playDate) - new Date(a.playDate))
}

// 游戏记录
const mockGameHistory = generateGameHistory()

/**
 * 游戏相关Mock
 */
export function gameMock(mock) {
  // 获取游戏列表
  mock.onGet('/games').reply((config) => {
    const { page = 1, pageSize = 10, category } = config.params

    let games = [...mockGames]
    if (category) {
      games = games.filter((g) => g.category === category)
    }

    return successResponse(paginationData(games, page, pageSize))
  })

  // 获取游戏详情
  mock.onGet(/\/games\/\d+/).reply((config) => {
    const id = Number(config.url.match(/\/games\/(\d+)/)[1])
    const game = mockGames.find((g) => g.id === id)

    if (game) {
      return successResponse(game)
    }

    return successResponse(null, '游戏不存在')
  })

  // 获取热门游戏
  mock.onGet('/games/hot').reply((config) => {
    const { limit = 6 } = config.params
    const hotGames = [...mockGames]
      .sort((a, b) => b.players - a.players)
      .slice(0, limit)

    return successResponse(hotGames)
  })

  // 获取推荐游戏
  mock.onGet('/games/recommend').reply((config) => {
    const { limit = 4 } = config.params
    const recommendGames = [...mockGames]
      .sort((a, b) => b.rating - a.rating)
      .slice(0, limit)

    return successResponse(recommendGames)
  })

  // 搜索游戏
  mock.onGet('/games/search').reply((config) => {
    const { keyword } = config.params
    const results = mockGames.filter(
      (g) =>
        g.name.includes(keyword) ||
        g.description.includes(keyword) ||
        g.tags.some((tag) => tag.includes(keyword))
    )

    return successResponse(results)
  })

  // 收藏游戏
  mock.onPost(/\/games\/\d+\/favorite/).reply((config) => {
    const id = Number(config.url.match(/\/games\/(\d+)\/favorite/)[1])
    const game = mockGames.find((g) => g.id === id)

    if (game) {
      game.favoriteCount++
      return successResponse(null, '收藏成功')
    }

    return successResponse(null, '游戏不存在')
  })

  // 取消收藏
  mock.onDelete(/\/games\/\d+\/favorite/).reply((config) => {
    const id = Number(config.url.match(/\/games\/(\d+)\/favorite/)[1])
    const game = mockGames.find((g) => g.id === id)

    if (game) {
      game.favoriteCount--
      return successResponse(null, '取消收藏成功')
    }

    return successResponse(null, '游戏不存在')
  })

  // 获取游戏分类
  mock.onGet('/games/categories').reply(() => {
    return successResponse(mockCategories)
  })

  // 根据分类获取游戏
  mock.onGet(/\/games\/category\/\w+/).reply((config) => {
    const categoryId = config.url.match(/\/games\/category\/(\w+)/)[1]
    const { page = 1, pageSize = 10 } = config.params

    const games = mockGames.filter((g) => g.category === categoryId)

    return successResponse(paginationData(games, page, pageSize))
  })

  // 提交游戏分数
  mock.onPost('/game/score').reply((config) => {
    const data = JSON.parse(config.data)
    const record = {
      id: mockGameHistory.length + 1,
      gameId: data.gameId,
      gameName: mockGames.find((g) => g.id === data.gameId)?.name || '',
      score: data.score,
      playTime: data.playTime || 0,
      createTime: new Date().toLocaleString(),
    }

    mockGameHistory.unshift(record)

    return successResponse(record, '成绩提交成功')
  })

  // 获取游戏排行榜
  mock.onGet(/\/games\/\d+\/ranking/).reply((config) => {
    const { page = 1, pageSize = 10 } = config.params

    // 生成模拟排行榜数据
    const ranking = Array.from({ length: 50 }, (_, i) => ({
      rank: i + 1,
      userId: i + 1,
      username: `玩家${i + 1}`,
      avatar: `https://i.pravatar.cc/50?img=${i + 1}`,
      score: 10000 - i * 100,
      playTime: Math.floor(Math.random() * 3600),
      createTime: new Date(Date.now() - Math.random() * 86400000 * 7).toLocaleString(),
    }))

    return successResponse(paginationData(ranking, page, pageSize))
  })

  // 获取游戏历史记录
  mock.onGet('/game/history').reply((config) => {
    const { page = 1, pageSize = 10 } = config.params
    return successResponse(paginationData(mockGameHistory, page, pageSize))
  })

  // 删除游戏记录
  mock.onDelete(/\/game\/history\/\d+/).reply((config) => {
    const id = Number(config.url.match(/\/game\/history\/(\d+)/)[1])
    const index = mockGameHistory.findIndex((r) => r.id === id)

    if (index > -1) {
      mockGameHistory.splice(index, 1)
      return successResponse(null, '删除成功')
    }

    return successResponse(null, '记录不存在')
  })
}
