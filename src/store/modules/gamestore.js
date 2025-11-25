// game.js (完整重构版 - otherstores 风格)
import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import * as gameApi from '@/api/game'
import { ElMessage } from 'element-plus'

// ========== 游戏注册表（常量）==========
export const GAME_REGISTRY = [
  {
    id: 'snake',
    name: '贪吃蛇',
    icon: 'snake-icon',
    category: 'classic',
    enabled: true,
    description: '经典贪吃蛇游戏',
    minPlayers: 1,
    maxPlayers: 1,
    tags: ['休闲', '经典']
  },
  {
    id: 'tetris',
    name: '俄罗斯方块',
    icon: 'tetris-icon',
    category: 'classic',
    enabled: true,
    description: '消除类经典游戏',
    minPlayers: 1,
    maxPlayers: 1,
    tags: ['益智', '经典']
  },
  {
    id: '2048',
    name: '2048',
    icon: '2048-icon',
    category: 'puzzle',
    enabled: true,
    description: '数字合并游戏',
    minPlayers: 1,
    maxPlayers: 1,
    tags: ['益智', '数字']
  },
  {
    id: 'memory',
    name: '记忆翻牌',
    icon: 'memory-icon',
    category: 'puzzle',
    enabled: false,
    description: '考验记忆力的配对游戏',
    minPlayers: 1,
    maxPlayers: 2,
    tags: ['记忆', '亲子']
  }
]

export const GAME_CATEGORIES = [
  { id: 'classic', name: '经典游戏' },
  { id: 'puzzle', name: '益智游戏' },
  { id: 'action', name: '动作游戏' },
  { id: 'multiplayer', name: '多人游戏' }
]

// ========== Store 定义 ==========
export const useGameStore = defineStore('game', () => {
  // ========== 状态 ==========
  const gameRegistry = ref([...GAME_REGISTRY])
  const categoryRegistry = ref([...GAME_CATEGORIES])
  const gameList = ref([])
  const gameListTotal = ref(0)
  const currentGame = ref(null)
  const gameHistory = ref([])
  const gameHistoryTotal = ref(0)
  const favoriteGames = ref(JSON.parse(localStorage.getItem('favoriteGames') || '[]'))
  const gameStats = ref({
    totalPlayed: 0,
    totalScore: 0,
    highestScore: 0
  })
  const categories = ref([])
  const hotGames = ref([])
  const recommendGames = ref([])
  const ranking = ref([])

  // ========== 计算属性 ==========
  const enabledGames = computed(() => gameRegistry.value.filter(g => g.enabled))

  const getGameById = computed(() => (gameId) => {
    return gameRegistry.value.find(g => g.id === gameId)
  })

  const getGamesByCategory = computed(() => (category) => {
    return gameRegistry.value.filter(g => g.category === category && g.enabled)
  })

  const categoriesWithCount = computed(() => {
    return categoryRegistry.value.map(cat => ({
      ...cat,
      count: gameRegistry.value.filter(g => g.category === cat.id && g.enabled).length
    }))
  })

  const gameOptions = computed(() => {
    return gameRegistry.value
      .filter(g => g.enabled)
      .map(g => ({ value: g.id, label: g.name, icon: g.icon }))
  })

  const isFavorite = computed(() => (gameId) => {
    return favoriteGames.value.includes(gameId)
  })

  const averageScore = computed(() => {
    return gameStats.value.totalPlayed > 0
      ? Math.round(gameStats.value.totalScore / gameStats.value.totalPlayed)
      : 0
  })

  const gameStatsMap = computed(() => {
    const map = {}
    gameHistory.value.forEach(record => {
      if (!map[record.gameId]) {
        map[record.gameId] = { playCount: 0, totalScore: 0, highestScore: 0 }
      }
      map[record.gameId].playCount += 1
      map[record.gameId].totalScore += record.score
      if (record.score > map[record.gameId].highestScore) {
        map[record.gameId].highestScore = record.score
      }
    })
    return map
  })

  const topGamesByPlayCount = computed(() => {
    return Object.entries(gameStatsMap.value)
      .map(([gameId, stats]) => ({
        gameId,
        ...stats,
        game: getGameById.value(gameId)
      }))
      .filter(item => item.game)
      .sort((a, b) => b.playCount - a.playCount)
      .slice(0, 5)
  })

  // ========== Actions ==========
  function registerGame(gameConfig) {
    const existingIndex = gameRegistry.value.findIndex(g => g.id === gameConfig.id)
    if (existingIndex >= 0) {
      gameRegistry.value[existingIndex] = { ...gameRegistry.value[existingIndex], ...gameConfig }
    } else {
      gameRegistry.value.push(gameConfig)
    }
  }

  function updateGameConfig(gameId, updates) {
    const game = gameRegistry.value.find(g => g.id === gameId)
    if (game) {
      Object.assign(game, updates)
    }
  }

  async function fetchGameList(params = {}) {
    try {
      const res = await gameApi.getGameList(params)
      gameList.value = res.data.list || []
      gameListTotal.value = res.data.total || 0
      return res.data
    } catch (error) {
      console.error('获取游戏列表失败:', error)
      ElMessage.error('获取游戏列表失败')
      return null
    }
  }

  async function toggleFavorite(gameId) {
    const isFav = favoriteGames.value.includes(gameId)
    try {
      if (isFav) {
        await gameApi.unfavoriteGame(gameId)
        favoriteGames.value = favoriteGames.value.filter(id => id !== gameId)
        ElMessage.success('已取消收藏')
      } else {
        await gameApi.favoriteGame(gameId)
        favoriteGames.value.push(gameId)
        ElMessage.success('收藏成功')
      }
      localStorage.setItem('favoriteGames', JSON.stringify(favoriteGames.value))
      return true
    } catch (error) {
      ElMessage.error('操作失败')
      return false
    }
  }

  async function fetchGameHistory(params = {}) {
    try {
      const res = await gameApi.getGameHistory(params)
      gameHistory.value = res.data.list || []
      gameHistoryTotal.value = res.data.total || 0
      return res.data
    } catch (error) {
      console.error('获取游戏记录失败:', error)
      ElMessage.error('获取游戏记录失败')
      return null
    }
  }

  async function submitGameRecord(recordData) {
    try {
      const res = await gameApi.submitGameRecord(recordData)
      // 更新本地统计
      gameStats.value.totalPlayed += 1
      gameStats.value.totalScore += recordData.score
      if (recordData.score > gameStats.value.highestScore) {
        gameStats.value.highestScore = recordData.score
      }
      ElMessage.success('成绩已提交')
      return res.data
    } catch (error) {
      ElMessage.error('提交成绩失败')
      return null
    }
  }

  async function fetchCategories() {
    try {
      const res = await gameApi.getCategories()
      categories.value = res.data || []
      return res.data
    } catch (error) {
      console.error('获取分类失败:', error)
      return []
    }
  }

  async function fetchHotGames() {
    try {
      const res = await gameApi.getHotGames()
      hotGames.value = res.data || []
      return res.data
    } catch (error) {
      console.error('获取热门游戏失败:', error)
      return []
    }
  }

  async function fetchRecommendGames() {
    try {
      const res = await gameApi.getRecommendGames()
      recommendGames.value = res.data || []
      return res.data
    } catch (error) {
      console.error('获取推荐游戏失败:', error)
      return []
    }
  }

  async function fetchRanking(params = {}) {
    try {
      const res = await gameApi.getRanking(params)
      ranking.value = res.data || []
      return res.data
    } catch (error) {
      console.error('获取排行榜失败:', error)
      return []
    }
  }

  function setCurrentGame(game) {
    currentGame.value = game
  }

  function clearCurrentGame() {
    currentGame.value = null
  }

  function resetGameStats() {
    gameStats.value = { totalPlayed: 0, totalScore: 0, highestScore: 0 }
    gameHistory.value = []
    gameHistoryTotal.value = 0
  }

  // ========== 返回所有状态、计算属性和方法 ==========
  return {
    // 状态
    gameRegistry,
    categoryRegistry,
    gameList,
    gameListTotal,
    currentGame,
    gameHistory,
    gameHistoryTotal,
    favoriteGames,
    gameStats,
    categories,
    hotGames,
    recommendGames,
    ranking,

    // 计算属性
    enabledGames,
    getGameById,
    getGamesByCategory,
    categoriesWithCount,
    gameOptions,
    isFavorite,
    averageScore,
    gameStatsMap,
    topGamesByPlayCount,

    // 方法
    registerGame,
    updateGameConfig,
    fetchGameList,
    toggleFavorite,
    fetchGameHistory,
    submitGameRecord,
    fetchCategories,
    fetchHotGames,
    fetchRecommendGames,
    fetchRanking,
    setCurrentGame,
    clearCurrentGame,
    resetGameStats
  }
})