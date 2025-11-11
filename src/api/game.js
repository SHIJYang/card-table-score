import { request } from '@/utils/request'

/**
 * 游戏相关API
 */

// 获取游戏列表
export const getGameList = (params) => {
  return request.get('/games', params)
}

// 获取游戏详情
export const getGameDetail = (id) => {
  return request.get(`/games/${id}`)
}

// 获取热门游戏
export const getHotGames = (params) => {
  return request.get('/games/hot', params)
}

// 获取推荐游戏
export const getRecommendGames = (params) => {
  return request.get('/games/recommend', params)
}

// 搜索游戏
export const searchGames = (keyword) => {
  return request.get('/games/search', { keyword })
}

// 收藏游戏
export const favoriteGame = (gameId) => {
  return request.post(`/games/${gameId}/favorite`)
}

// 取消收藏
export const unfavoriteGame = (gameId) => {
  return request.delete(`/games/${gameId}/favorite`)
}

// 获取游戏分类
export const getGameCategories = () => {
  return request.get('/games/categories')
}

// 根据分类获取游戏
export const getGamesByCategory = (categoryId, params) => {
  return request.get(`/games/category/${categoryId}`, params)
}

// 提交游戏分数
export const submitGameScore = (data) => {
  return request.post('/game/score', data)
}

// 获取游戏排行榜
export const getGameRanking = (gameId, params) => {
  return request.get(`/games/${gameId}/ranking`, params)
}

// 获取游戏历史记录
export const getGameHistory = (params) => {
  return request.get('/game/history', params)
}

// 删除游戏记录
export const deleteGameRecord = (recordId) => {
  return request.delete(`/game/history/${recordId}`)
}
