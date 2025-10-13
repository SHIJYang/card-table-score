// src/composables/pvz/useGameLogic.js
import { ref, reactive, computed, onUnmounted } from 'vue'
import { useTimer } from './useTimer'

// === 植物/僵尸注册表（可动态扩展） ===
export const registeredPlants = reactive({
    sunflower: {
        displayName: '向日葵',
        cost: 50,
        emoji: '🌻',
        cooldown: 5000,
        onPlace: (row, col, ctx) => {
            const taskId = ctx.startPeriodicTask(() => {
                ctx.spawnSun({ row, col })
            }, 10000)
            return { taskId }
        },
        onRemove: (data, ctx) => {
            if (data?.taskId) ctx.stopPeriodicTask(data.taskId)
        }
    },
    peashooter: {
        displayName: '豌豆射手',
        cost: 100,
        emoji: '🌱',
        cooldown: 7500,
        onPlace: (row, col, ctx) => {
            const taskId = ctx.startPeriodicTask(() => {
                ctx.spawnBullet({ row, type: 'pea' })
            }, 1500)
            return { taskId }
        },
        onRemove: (data, ctx) => {
            if (data?.taskId) ctx.stopPeriodicTask(data.taskId)
        }
    }
})
export const registeredZombies = reactive({
    basic: {
        displayName: '普通僵尸',
        emoji: '🧟',
        hp: 3,
        speed: 1,
        reward: 0
    }
})

// 动态注册方法
export function registerPlant(type, config) {
    registeredPlants[type] = config
}
export function registerZombie(type, config) {
    registeredZombies[type] = config
}

const ROWS = 5
const COLS = 9
const LAWN_WIDTH = COLS * 80

export function useGameLogic() {
    const { startPeriodicTask, stopPeriodicTask, clearAllTasks } = useTimer()

    // === 状态 ===
    const sun = ref(50)
    const selectedPlant = ref(null)
    const isRunning = ref(false)
    const gameOver = ref(false)
    const win = ref(false)
    const plantCooldowns = reactive({})

    const grid = reactive(
        Array.from({ length: ROWS + 1 }, (_, i) =>
            Array.from({ length: COLS + 1 }, () => (i === 0 ? null : null))
        )
    )
    const bullets = reactive([])
    const zombies = reactive([])
    const sunTokens = reactive([])

    // === 事件钩子（可扩展）===
    const hooks = {
        onGameStart: [],
        onGameOver: [],
        onPlantPlaced: [],
        onZombieSpawned: [],
        onSunCollected: []
    }
    function on(event, fn) {
        if (hooks[event]) hooks[event].push(fn)
    }
    function emit(event, ...args) {
        if (hooks[event]) hooks[event].forEach(fn => fn(...args))
    }

    // === 上下文 ===
    const gameContext = {
        sun,
        grid,
        startPeriodicTask,
        stopPeriodicTask,
        spawnBullet,
        spawnZombie,
        spawnSun
    }

    // === 抽象生成函数，便于扩展 ===
    function spawnBullet({ row, type = 'pea' }) {
        bullets.push({
            id: Date.now() + Math.random(),
            row,
            x: 80,
            type,
            emoji: type === 'pea' ? '🟢' : '💥'
        })
    }
    function spawnZombie({ row, type = 'basic' }) {
        const config = registeredZombies[type]
        zombies.push({
            id: Date.now() + Math.random(),
            row,
            x: LAWN_WIDTH + 50,
            hp: config.hp,
            maxHp: config.hp,
            speed: config.speed,
            type,
            emoji: config.emoji,
            isDamaged: false
        })
        emit('onZombieSpawned', row, type)
    }
    function spawnSun({ row, col }) {
        const x = (col - 1) * 80 + 40
        const y = (row - 1) * 80 + 40
        sunTokens.push({
            id: Date.now() + Math.random(),
            x,
            y,
            value: 25,
            expiresAt: Date.now() + 10000
        })
    }

    // === 计算属性 ===
    const getBulletsInRow = computed(() => (row) => bullets.filter(b => b.row === row))
    const getZombiesInRow = computed(() => (row) => zombies.filter(z => z.row === row))
    const getSunTokensInRow = computed(() => (row) => {
        const yMin = (row - 1) * 80
        const yMax = row * 80
        return sunTokens.filter(s => s.y >= yMin && s.y < yMax)
    })

    // === 核心方法 ===
    const collectSun = (sunId) => {
        const idx = sunTokens.findIndex(s => s.id === sunId)
        if (idx !== -1) {
            sun.value += sunTokens[idx].value
            sunTokens.splice(idx, 1)
            emit('onSunCollected', sunId)
        }
    }

    const isPlantReady = (type) => {
        const lastUsed = plantCooldowns[type] || 0
        return Date.now() >= lastUsed
    }

    const startGame = () => {
        if (isRunning.value) return
        isRunning.value = true
        gameOver.value = false
        win.value = false
        emit('onGameStart')

        // 游戏主循环
        const gameLoopId = startPeriodicTask(() => {
            // 移除过期阳光
            for (let i = sunTokens.length - 1; i >= 0; i--) {
                if (Date.now() > sunTokens[i].expiresAt) {
                    sunTokens.splice(i, 1)
                }
            }

            // 子弹移动
            for (let i = bullets.length - 1; i >= 0; i--) {
                bullets[i].x += 8
                if (bullets[i].x > LAWN_WIDTH + 100) bullets.splice(i, 1)
            }

            // 僵尸移动
            for (const z of zombies) {
                z.x -= z.speed
                if (z.x < 0) {
                    gameOver.value = true
                    isRunning.value = false
                }
            }

            // 碰撞检测：子弹 vs 僵尸
            for (let i = bullets.length - 1; i >= 0; i--) {
                const b = bullets[i]
                for (const z of zombies) {
                    if (b.row === z.row && Math.abs(b.x - z.x) < 40) {
                        bullets.splice(i, 1)
                        z.hp--
                        z.isDamaged = true
                        setTimeout(() => z.isDamaged = false, 200)
                        if (z.hp <= 0) {
                            const idx = zombies.findIndex(_z => _z.id === z.id)
                            if (idx !== -1) zombies.splice(idx, 1)
                        }
                        break
                    }
                }
            }

            // 胜利条件：消灭所有僵尸且阳光≥300
            if (zombies.length === 0 && sun.value >= 300) {
                win.value = true
                gameOver.value = true
                isRunning.value = false
            }
        }, 100)

        // 僵尸生成
        const zombieSpawnerId = startPeriodicTask(() => {
            if (isRunning.value) {
                const row = Math.floor(Math.random() * ROWS) + 1
                gameContext.spawnZombie({ row })
            }
        }, 3000)

        // 清理函数
        onUnmounted(() => {
            stopPeriodicTask(gameLoopId)
            stopPeriodicTask(zombieSpawnerId)
        })
    }

    const resetGame = () => {
        clearAllTasks()
        sun.value = 50
        selectedPlant.value = null
        isRunning.value = false
        gameOver.value = false
        win.value = false

        // 清理植物
        for (let r = 1; r <= ROWS; r++) {
            for (let c = 1; c <= COLS; c++) {
                if (grid[r][c]) {
                    const plant = registeredPlants[grid[r][c].type]
                    plant?.onRemove?.(grid[r][c].instanceData, gameContext)
                    grid[r][c] = null
                }
            }
        }

        bullets.length = 0
        zombies.length = 0
        sunTokens.length = 0
        Object.keys(plantCooldowns).forEach(k => delete plantCooldowns[k])
    }

    const selectPlant = (type) => {
        if (!type) {
            selectedPlant.value = null
            return
        }
        if (sun.value < registeredPlants[type]?.cost) return
        if (!isPlantReady(type)) return
        selectedPlant.value = selectedPlant.value === type ? null : type
    }

    const placePlant = (row, col) => {
        if (!isRunning.value || !selectedPlant.value || grid[row][col]) return
        const type = selectedPlant.value
        const config = registeredPlants[type]
        if (!config || sun.value < config.cost || !isPlantReady(type)) return

        sun.value -= config.cost
        plantCooldowns[type] = Date.now() + config.cooldown
        const instanceData = config.onPlace?.(row, col, gameContext) || null
        grid[row][col] = { type, instanceData }
        selectedPlant.value = null
        emit('onPlantPlaced', row, col, type)
    }

    return {
        sun,
        selectedPlant,
        isRunning,
        gameOver,
        win,
        grid,
        plantCooldowns,
        getBulletsInRow,
        getZombiesInRow,
        getSunTokensInRow,
        startGame,
        resetGame,
        selectPlant,
        placePlant,
        collectSun,
        registeredPlants,
        registeredZombies,
        registerPlant,
        registerZombie,
        on // 事件订阅
    }
}