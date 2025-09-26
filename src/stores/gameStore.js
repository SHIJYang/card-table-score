import { defineStore } from 'pinia'

export const useGameStore = defineStore('game', {
    state: () => ({
        // 当前选中的游戏
        currentGame: '',
        // 游戏列表
        games: [
            {
                id: 'snake',
                name: '贪吃蛇',
                description: '经典的贪吃蛇游戏，挑战你的反应速度',
                icon: '🐍',
                path: '/snake'
            },
            {
                id: 'gomoku',
                name: '五子棋',
                description: '传统的五子棋游戏，考验你的策略思维',
                icon: '⚫⚪',
                path: '/gomoku'
            },
            {
                id: 'score',
                name: '牌桌计分',
                description: '多人游戏的计分系统，记录分数变化',
                icon: '🎲',
                path: '/score'
            }
        ],
        // 游戏历史记录
        gameHistory: []
    }),

    getters: {
        // 获取当前游戏信息
        currentGameInfo: (state) => {
            return state.games.find(game => game.id === state.currentGame) || null
        },
        // 获取游戏总数
        totalGames: (state) => state.games.length,
        // 获取最近玩过的游戏
        recentGames: (state) => {
            return state.gameHistory
                .slice(-3)
                .reverse()
                .map(history => state.games.find(game => game.id === history.gameId))
                .filter(Boolean)
        }
    },

    actions: {
        // 设置当前游戏
        setCurrentGame(gameId) {
            this.currentGame = gameId

            // 记录游戏历史
            if (gameId) {
                this.recordGameHistory(gameId)
            }

            // 保存到本地存储
            this.saveToLocalStorage()
        },

        // 记录游戏历史
        recordGameHistory(gameId) {
            const historyEntry = {
                gameId,
                timestamp: new Date().toISOString(),
                playedAt: new Date().toLocaleString()
            }

            this.gameHistory.push(historyEntry)

            // 只保留最近10条记录
            if (this.gameHistory.length > 10) {
                this.gameHistory = this.gameHistory.slice(-10)
            }
        },

        // 添加新游戏
        addGame(game) {
            if (!this.games.find(g => g.id === game.id)) {
                this.games.push(game)
                this.saveToLocalStorage()
            }
        },

        // 从本地存储加载数据
        loadFromLocalStorage() {
            try {
                const saved = localStorage.getItem('gameStore')
                if (saved) {
                    const data = JSON.parse(saved)
                    this.currentGame = data.currentGame || ''
                    this.gameHistory = data.gameHistory || []
                }
            } catch (error) {
                console.error('加载游戏数据失败:', error)
            }
        },

        // 保存到本地存储
        saveToLocalStorage() {
            try {
                const data = {
                    currentGame: this.currentGame,
                    gameHistory: this.gameHistory
                }
                localStorage.setItem('gameStore', JSON.stringify(data))
            } catch (error) {
                console.error('保存游戏数据失败:', error)
            }
        },

        // 初始化store
        initialize() {
            this.loadFromLocalStorage()
        }
    }
})
