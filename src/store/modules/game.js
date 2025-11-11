import { defineStore } from 'pinia'
import * as gameApi from '@/api/game'
import { ElMessage } from 'element-plus'

/**
 * 游戏注册表 - 集中管理所有游戏配置
 * 添加新游戏时，只需在这里添加配置即可
 */
export const GAME_REGISTRY = [
  {
    id: 1,
    name: '迷宫探险',
    icon: '🧩',
    category: 'puzzle',
    categoryName: '益智游戏',
    description: '在复杂的迷宫中寻找出路，考验你的方向感和决策能力',
    difficulty: 'medium',
    tags: ['单人', '益智', '冒险'],
    // 游戏路由（可选）
    route: '/game/maze',
    // 游戏组件（可选）
    component: 'MazeGame',
    // 是否启用
    enabled: true,
  },
  {
    id: 2,
    name: '数字华容道',
    icon: '🔢',
    category: 'puzzle',
    categoryName: '益智游戏',
    description: '经典的数字滑动拼图游戏，挑战你的逻辑思维',
    difficulty: 'easy',
    tags: ['单人', '益智', '经典'],
    route: '/game/number-puzzle',
    component: 'NumberPuzzleGame',
    enabled: true,
  },
  {
    id: 3,
    name: '宝石消除',
    icon: '💎',
    category: 'casual',
    categoryName: '休闲游戏',
    description: '绚丽多彩的消除类游戏，让你欲罢不能',
    difficulty: 'easy',
    tags: ['单人', '休闲', '消除'],
    route: '/game/gem-match',
    component: 'GemMatchGame',
    enabled: true,
  },
  {
    id: 4,
    name: '太空射击',
    icon: '🚀',
    category: 'action',
    categoryName: '动作游戏',
    description: '刺激的太空战斗体验，成为银河系的英雄',
    difficulty: 'hard',
    tags: ['单人', '动作', '射击'],
    route: '/game/space-shooter',
    component: 'SpaceShooterGame',
    enabled: true,
  },
  {
    id: 5,
    name: '记忆翻牌',
    icon: '🃏',
    category: 'puzzle',
    categoryName: '益智游戏',
    description: '挑战你的记忆力极限，找出所有匹配的卡牌',
    difficulty: 'medium',
    tags: ['单人', '益智', '记忆'],
    route: '/game/memory-cards',
    component: 'MemoryCardsGame',
    enabled: true,
  },
  {
    id: 6,
    name: '拼图大师',
    icon: '🖼️',
    category: 'puzzle',
    categoryName: '益智游戏',
    description: '完成精美的图片拼图，享受成就感',
    difficulty: 'easy',
    tags: ['单人', '益智', '拼图'],
    route: '/game/jigsaw',
    component: 'JigsawGame',
    enabled: true,
  },
]

/**
 * 游戏分类配置
 */
export const GAME_CATEGORIES = [
  {
    id: 'puzzle',
    name: '益智游戏',
    icon: '🧩',
    description: '锻炼大脑思维',
  },
  {
    id: 'action',
    name: '动作游戏',
    icon: '⚔️',
    description: '刺激冒险体验',
  },
  {
    id: 'casual',
    name: '休闲游戏',
    icon: '🎮',
    description: '放松身心娱乐',
  },
  {
    id: 'strategy',
    name: '策略游戏',
    icon: '🎯',
    description: '考验智慧谋略',
  },
]

/**
 * 游戏状态管理
 * 管理游戏列表、游戏详情、游戏历史、收藏等
 */
export const useGameStore = defineStore('game', {
  state: () => ({
    // 游戏注册表（本地配置）
    gameRegistry: GAME_REGISTRY,
    // 游戏分类（本地配置）
    categoryRegistry: GAME_CATEGORIES,
    // 游戏列表（来自服务器）
    gameList: [],
    gameListTotal: 0,
    // 当前游戏
    currentGame: null,
    // 游戏历史记录
    gameHistory: [],
    gameHistoryTotal: 0,
    // 收藏的游戏ID列表
    favoriteGames: JSON.parse(localStorage.getItem('favoriteGames') || '[]'),
    // 游戏统计
    gameStats: {
      totalPlayed: 0,
      totalScore: 0,
      highestScore: 0,
    },
    // 游戏分类（来自服务器）
    categories: [],
    // 热门游戏
    hotGames: [],
    // 推荐游戏
    recommendGames: [],
    // 游戏排行榜
    ranking: [],
  }),

  getters: {
    // ========== 游戏配置相关 ==========
    
    /**
     * 获取所有已启用的游戏
     */
    enabledGames: (state) => state.gameRegistry.filter(g => g.enabled),
    
    /**
     * 根据ID获取游戏配置
     * @param {Number} gameId - 游戏ID
     * @returns {Object|undefined} - 游戏配置对象
     */
    getGameById: (state) => (gameId) => {
      return state.gameRegistry.find(g => g.id === gameId)
    },
    
    /**
     * 根据分类获取游戏列表
     * @param {String} category - 分类ID
     * @returns {Array} - 游戏列表
     */
    getGamesByCategory: (state) => (category) => {
      return state.gameRegistry.filter(g => g.category === category && g.enabled)
    },
    
    /**
     * 获取所有游戏分类及每个分类的游戏数量
     */
    categoriesWithCount: (state) => {
      return state.categoryRegistry.map(category => ({
        ...category,
        count: state.gameRegistry.filter(g => g.category === category.id && g.enabled).length,
      }))
    },
    
    /**
     * 获取游戏选项列表（用于下拉框等）
     */
    gameOptions: (state) => {
      return state.gameRegistry
        .filter(g => g.enabled)
        .map(g => ({
          value: g.id,
          label: g.name,
          icon: g.icon,
        }))
    },
    
    // ========== 原有getters ==========
    
    // 获取收藏游戏列表
    getFavoriteGames: (state) => state.favoriteGames,
    // 获取游戏历史
    getGameHistory: (state) => state.gameHistory,
    // 获取平均分数
    averageScore: (state) => {
      return state.gameStats.totalPlayed > 0
        ? Math.round(state.gameStats.totalScore / state.gameStats.totalPlayed)
        : 0
    },
    // 检查游戏是否已收藏
    isFavorite: (state) => (gameId) => state.favoriteGames.includes(gameId),
    // 获取游戏总数
    totalGames: (state) => state.gameListTotal,
    
    // ========== 统计相关 ==========
    
    /**
     * 获取每个游戏的统计数据
     */
    gameStatsMap: (state) => {
      const statsMap = {}
      
      state.gameRegistry.forEach(game => {
        const records = state.gameHistory.filter(h => h.gameId === game.id)
        
        if (records.length > 0) {
          const scores = records.map(r => r.score)
          const totalScore = scores.reduce((sum, s) => sum + s, 0)
          const totalTime = records.reduce((sum, r) => sum + (r.playTime || 0), 0)
          
          statsMap[game.id] = {
            gameId: game.id,
            gameName: game.name,
            gameIcon: game.icon,
            playCount: records.length,
            bestScore: Math.max(...scores),
            avgScore: Math.round(totalScore / records.length),
            totalScore: totalScore,
            totalTime: totalTime,
            lastPlayDate: records[0]?.playDate, // 假设记录已按时间排序
          }
        } else {
          statsMap[game.id] = {
            gameId: game.id,
            gameName: game.name,
            gameIcon: game.icon,
            playCount: 0,
            bestScore: 0,
            avgScore: 0,
            totalScore: 0,
            totalTime: 0,
            lastPlayDate: null,
          }
        }
      })
      
      return statsMap
    },
    
    /**
     * 获取Top游戏排行（按游玩次数）
     */
    topGamesByPlayCount: (state, getters) => (limit = 5) => {
      return Object.values(getters.gameStatsMap)
        .filter(s => s.playCount > 0)
        .sort((a, b) => b.playCount - a.playCount)
        .slice(0, limit)
    },
  },

  actions: {
    // ========== 游戏注册管理 ==========
    
    /**
     * 注册新游戏
     * @param {Object} gameConfig - 游戏配置对象
     * @returns {Boolean} - 是否注册成功
     */
    registerGame(gameConfig) {
      // 检查游戏ID是否已存在
      const exists = this.gameRegistry.some(g => g.id === gameConfig.id)
      if (exists) {
        console.warn(`游戏ID ${gameConfig.id} 已存在`)
        return false
      }
      
      // 添加默认值
      const defaultConfig = {
        enabled: true,
        difficulty: 'medium',
        tags: [],
        category: 'casual',
        categoryName: '休闲游戏',
        icon: '🎮',
      }
      
      const newGame = { ...defaultConfig, ...gameConfig }
      
      // 验证必填字段
      if (!newGame.id || !newGame.name) {
        console.error('游戏ID和名称是必填项')
        return false
      }
      
      this.gameRegistry.push(newGame)
      ElMessage.success(`游戏 "${newGame.name}" 注册成功！`)
      return true
    },
    
    /**
     * 批量注册游戏
     * @param {Array} gameConfigs - 游戏配置数组
     * @returns {Number} - 成功注册的数量
     */
    registerGames(gameConfigs) {
      let successCount = 0
      gameConfigs.forEach(config => {
        if (this.registerGame(config)) {
          successCount++
        }
      })
      return successCount
    },
    
    /**
     * 更新游戏配置
     * @param {Number} gameId - 游戏ID
     * @param {Object} updates - 更新的字段
     * @returns {Boolean} - 是否更新成功
     */
    updateGameConfig(gameId, updates) {
      const index = this.gameRegistry.findIndex(g => g.id === gameId)
      if (index === -1) {
        console.error(`游戏ID ${gameId} 不存在`)
        return false
      }
      
      this.gameRegistry[index] = { ...this.gameRegistry[index], ...updates }
      return true
    },
    
    /**
     * 启用/禁用游戏
     * @param {Number} gameId - 游戏ID
     * @param {Boolean} enabled - 是否启用
     */
    toggleGameEnabled(gameId, enabled) {
      return this.updateGameConfig(gameId, { enabled })
    },
    
    /**
     * 移除游戏（慎用）
     * @param {Number} gameId - 游戏ID
     * @returns {Boolean} - 是否移除成功
     */
    removeGame(gameId) {
      const index = this.gameRegistry.findIndex(g => g.id === gameId)
      if (index === -1) {
        return false
      }
      
      this.gameRegistry.splice(index, 1)
      ElMessage.warning(`游戏已移除`)
      return true
    },
    
    // ========== 原有actions ==========
    
    /**
     * 获取游戏列表
     * @param {Object} params - { page, pageSize, category }
     * @returns {Promise<Array>} - 游戏列表
     */
    async fetchGameList(params = { page: 1, pageSize: 10 }) {
      try {
        const res = await gameApi.getGameList(params)
        this.gameList = res.data.list
        this.gameListTotal = res.data.total
        return res.data.list
      } catch (error) {
        console.error('获取游戏列表失败', error)
        return []
      }
    },

    /**
     * 获取游戏详情
     * @param {Number} gameId - 游戏ID
     * @returns {Promise<Object|null>} - 游戏详情
     */
    async fetchGameDetail(gameId) {
      try {
        const res = await gameApi.getGameDetail(gameId)
        this.currentGame = res.data
        return res.data
      } catch (error) {
        console.error('获取游戏详情失败', error)
        return null
      }
    },

    /**
     * 获取热门游戏
     * @param {Number} limit - 数量限制
     * @returns {Promise<Array>} - 热门游戏列表
     */
    async fetchHotGames(limit = 6) {
      try {
        const res = await gameApi.getHotGames({ limit })
        this.hotGames = res.data
        return res.data
      } catch (error) {
        console.error('获取热门游戏失败', error)
        return []
      }
    },

    /**
     * 获取推荐游戏
     * @param {Number} limit - 数量限制
     * @returns {Promise<Array>} - 推荐游戏列表
     */
    async fetchRecommendGames(limit = 4) {
      try {
        const res = await gameApi.getRecommendGames({ limit })
        this.recommendGames = res.data
        return res.data
      } catch (error) {
        console.error('获取推荐游戏失败', error)
        return []
      }
    },

    /**
     * 搜索游戏
     * @param {String} keyword - 搜索关键词
     * @returns {Promise<Array>} - 搜索结果
     */
    async searchGames(keyword) {
      try {
        const res = await gameApi.searchGames(keyword)
        return res.data
      } catch (error) {
        console.error('搜索游戏失败', error)
        return []
      }
    },

    /**
     * 收藏/取消收藏游戏
     * @param {Number} gameId - 游戏ID
     * @returns {Promise<boolean>} - 操作是否成功
     */
    async toggleFavorite(gameId) {
      const isFav = this.favoriteGames.includes(gameId)
      
      try {
        if (isFav) {
          await gameApi.unfavoriteGame(gameId)
          this.favoriteGames = this.favoriteGames.filter(id => id !== gameId)
          ElMessage.success('已取消收藏')
        } else {
          await gameApi.favoriteGame(gameId)
          this.favoriteGames.push(gameId)
          ElMessage.success('收藏成功')
        }
        
        // 保存到本地存储
        localStorage.setItem('favoriteGames', JSON.stringify(this.favoriteGames))
        return true
      } catch (error) {
        ElMessage.error('操作失败')
        return false
      }
    },

    /**
     * 获取游戏分类
     * @returns {Promise<Array>} - 分类列表
     */
    async fetchCategories() {
      try {
        const res = await gameApi.getGameCategories()
        this.categories = res.data
        return res.data
      } catch (error) {
        console.error('获取游戏分类失败', error)
        return []
      }
    },

    /**
     * 根据分类获取游戏
     * @param {String} categoryId - 分类ID
     * @param {Object} params - { page, pageSize }
     * @returns {Promise<Array>} - 游戏列表
     */
    async fetchGamesByCategory(categoryId, params = { page: 1, pageSize: 10 }) {
      try {
        const res = await gameApi.getGamesByCategory(categoryId, params)
        return res.data.list
      } catch (error) {
        console.error('获取分类游戏失败', error)
        return []
      }
    },

    /**
     * 提交游戏分数
     * @param {Object} scoreData - { gameId, score, playTime }
     * @returns {Promise<boolean>} - 是否提交成功
     */
    async submitScore(scoreData) {
      try {
        const res = await gameApi.submitGameScore(scoreData)
        
        // 更新本地统计
        this.gameStats.totalPlayed++
        this.gameStats.totalScore += scoreData.score
        if (scoreData.score > this.gameStats.highestScore) {
          this.gameStats.highestScore = scoreData.score
        }
        
        // 添加到历史记录
        this.gameHistory.unshift(res.data)
        
        ElMessage.success('分数提交成功')
        return true
      } catch (error) {
        ElMessage.error('分数提交失败')
        return false
      }
    },

    /**
     * 获取游戏排行榜
     * @param {Number} gameId - 游戏ID
     * @param {Object} params - { page, pageSize }
     * @returns {Promise<Array>} - 排行榜数据
     */
    async fetchRanking(gameId, params = { page: 1, pageSize: 10 }) {
      try {
        const res = await gameApi.getGameRanking(gameId, params)
        this.ranking = res.data.list
        return res.data.list
      } catch (error) {
        console.error('获取排行榜失败', error)
        return []
      }
    },

    /**
     * 获取游戏历史记录
     * @param {Object} params - { page, pageSize }
     * @returns {Promise<Array>} - 历史记录
     */
    async fetchGameHistory(params = { page: 1, pageSize: 10 }) {
      try {
        const res = await gameApi.getGameHistory(params)
        this.gameHistory = res.data.list
        this.gameHistoryTotal = res.data.total
        return res.data.list
      } catch (error) {
        console.error('获取游戏历史失败', error)
        return []
      }
    },

    /**
     * 删除游戏记录
     * @param {Number} recordId - 记录ID
     * @returns {Promise<boolean>} - 是否删除成功
     */
    async deleteGameRecord(recordId) {
      try {
        await gameApi.deleteGameRecord(recordId)
        this.gameHistory = this.gameHistory.filter(item => item.id !== recordId)
        ElMessage.success('删除成功')
        return true
      } catch (error) {
        ElMessage.error('删除失败')
        return false
      }
    },

    // 内部方法：设置当前游戏
    setCurrentGame(game) {
      this.currentGame = game
    },

    // 内部方法：本地添加游戏记录（不调用API）
    addGameHistoryLocal(record) {
      this.gameHistory.unshift(record)
      this.gameStats.totalPlayed++
      this.gameStats.totalScore += record.score
      if (record.score > this.gameStats.highestScore) {
        this.gameStats.highestScore = record.score
      }
    },

    // 清空历史记录
    clearHistory() {
      this.gameHistory = []
      this.gameHistoryTotal = 0
    },
  },
})
