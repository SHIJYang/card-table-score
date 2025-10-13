// src/composables/pvz/useGameLogic.js
import { ref, reactive, computed, onUnmounted } from 'vue'
import { useTimer } from './useTimer'
import { registeredPlants, registerPlant } from './plants'
import { registeredZombies, registerZombie } from './zombies'
import { createEventBus } from './events'
import { createBullet, bulletTypes } from './bullets'

const ROWS = 5
const COLS = 9
const LAWN_WIDTH = COLS * 80

/**
 * 植物大战僵尸主游戏逻辑
 * 负责所有状态管理、事件钩子、核心行为
 * 植物与僵尸通过注册表和事件配对，便于扩展新类型
 */
export function useGameLogic() {
    // 定时任务管理，返回定时器相关方法
    const { startPeriodicTask, stopPeriodicTask, clearAllTasks } = useTimer()
    // 事件总线，提供 on/emit 事件订阅与触发
    const { on, emit } = createEventBus()

    // --- 游戏状态 ---
    // 阳光数
    const sun = ref(500)
    // 当前选中的植物类型
    const selectedPlant = ref(null)
    // 游戏是否进行中
    const isRunning = ref(false)
    // 游戏是否结束
    const gameOver = ref(false)
    // 是否胜利
    const win = ref(false)
    // 植物冷却时间戳
    const plantCooldowns = reactive({})

    // --- 网格与动态元素 ---
    // grid[row][col] 存储植物实例
    const grid = reactive(
        Array.from({ length: ROWS + 1 }, (_, i) =>
            Array.from({ length: COLS + 1 }, () => (i === 0 ? null : null))
        )
    )
    // 子弹对象数组
    const bullets = reactive([])
    // 僵尸对象数组
    const zombies = reactive([])
    // 阳光token对象数组
    const sunTokens = reactive([])

    // --- 游戏上下文（供植物/僵尸/子弹行为调用）---
    const gameContext = {
        sun,
        grid,
        startPeriodicTask,
        stopPeriodicTask,
        spawnBullet: (bullet) => {
            bullets.push(bullet)
        },
        spawnZombie,
        spawnSun,
        emit,
        getZombiesInRow: (row) => zombies.filter(z => z.row === row) // 提供给植物判断同行僵尸
    }

    /**
     * 生成僵尸（绑定在行上）
     * @param {Object} opts
     * @param {number} opts.row - 行号
     * @param {string} opts.type - 僵尸类型
     * 原理：在指定行的最右侧生成一个僵尸对象，加入 zombies 数组
     */
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
            isDamaged: false,
            ...config.initialState // 支持僵尸初始状态
        })
        emit('onZombieSpawned', row, type)
    }

    /**
     * 生成阳光token
     * @param {Object} opts
     * @param {number} opts.row
     * @param {number} opts.col
     * 原理：在指定格子中心生成阳光token，加入 sunTokens 数组
     */
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
        emit('onSunProduced', { row, col })
    }

    // --- 计算属性 ---
    /**
     * 获取某行的所有子弹
     * @param {number} row
     * @returns {Array}
     * 原理：过滤 bullets 数组，返回指定行的子弹
     */
    const getBulletsInRow = computed(() => (row) => bullets.filter(b => b.row === row))
    /**
     * 获取某行的所有僵尸
     * @param {number} row
     * @returns {Array}
     */
    const getZombiesInRow = computed(() => (row) => zombies.filter(z => z.row === row))
    /**
     * 获取某行的所有阳光token
     * @param {number} row
     * @returns {Array}
     */
    const getSunTokensInRow = computed(() => (row) => {
        const yMin = (row - 1) * 80
        const yMax = row * 80
        return sunTokens.filter(s => s.y >= yMin && s.y < yMax)
    })

    /**
     * 收集阳光
     * @param {string|number} sunId
     * 原理：找到对应id的阳光token，增加阳光数并移除token
     */
    const collectSun = (sunId) => {
        const idx = sunTokens.findIndex(s => s.id === sunId)
        if (idx !== -1) {
            sun.value += sunTokens[idx].value
            sunTokens.splice(idx, 1)
            emit('onSunCollected', sunId)
        }
    }

    /**
     * 判断植物是否冷却完毕
     * @param {string} type
     * @returns {boolean}
     * 原理：比较当前时间与冷却时间戳
     */
    const isPlantReady = (type) => {
        const lastUsed = plantCooldowns[type] || 0
        return Date.now() >= lastUsed
    }

    /**
     * 启动游戏，包含主循环、僵尸生成、冷却刷新等
     * 原理：定时推进游戏状态，处理移动、碰撞、胜负判定
     */
    const startGame = () => {
        if (isRunning.value) return
        isRunning.value = true
        gameOver.value = false
        win.value = false
        emit('onGameStart')

        // 主循环：推进所有动态元素
        const gameLoopId = startPeriodicTask(() => {
            // 移除过期阳光
            for (let i = sunTokens.length - 1; i >= 0; i--) {
                if (Date.now() > sunTokens[i].expiresAt) {
                    sunTokens.splice(i, 1)
                }
            }
            // 子弹移动和碰撞检测
            for (let i = bullets.length - 1; i >= 0; i--) {
                const bullet = bullets[i]
                const bulletType = bulletTypes[bullet.type] || bulletTypes['pea']

                // 移动子弹
                bullet.x += bulletType.speed

                // 检查是否超出边界
                if (bullet.x > LAWN_WIDTH + 100) {
                    bullets.splice(i, 1)
                    continue
                }

                // 检查碰撞
                const zombiesInRow = zombies.filter(z => z.row === bullet.row)
                for (const zombie of zombiesInRow) {
                    if (Math.abs(bullet.x - zombie.x) < 30) {
                        bullets.splice(i, 1)
                        zombie.hp--
                        zombie.isDamaged = true
                        setTimeout(() => zombie.isDamaged = false, 200)
                        emit('onZombieHit', { zombie, bullet })

                        if (zombie.hp <= 0) {
                            const idx = zombies.findIndex(z => z.id === zombie.id)
                            if (idx !== -1) {
                                zombies.splice(idx, 1)
                                emit('onZombieKilled', zombie)
                            }
                        }
                        break
                    }
                }
            }
            // 僵尸移动
            for (const z of zombies) {
                z.x -= z.speed
                if (z.x < 0) {
                    gameOver.value = true
                    isRunning.value = false
                    emit('onGameOver', false)
                }
            }
            // 胜利条件
            if (zombies.length === 0 && sun.value >= 3000) {
                win.value = true
                gameOver.value = true
                isRunning.value = false
                emit('onGameOver', true)
            }
        }, 100)

        // 僵尸生成定时器（每9秒一只，随机行）
        const zombieSpawnerId = startPeriodicTask(() => {
            if (isRunning.value) {
                const row = Math.floor(Math.random() * ROWS) + 1
                spawnZombie({ row })
            }
        }, 9000)

        // 冷却倒计时刷新（每秒触发响应式更新）
        cooldownTimerId = startPeriodicTask(() => {
            Object.keys(plantCooldowns).forEach(type => {
                if (plantCooldowns[type]) {
                    plantCooldowns[type] = plantCooldowns[type]
                }
            })
        }, 1000)

        // 组件卸载时清理所有定时器
        onUnmounted(() => {
            stopPeriodicTask(gameLoopId)
            stopPeriodicTask(zombieSpawnerId)
            if (cooldownTimerId) stopPeriodicTask(cooldownTimerId)
        })
    }

    /**
     * 重置游戏，清空所有状态
     * 原理：停止所有定时器，清空所有动态元素和状态
     */
    const resetGame = () => {
        clearAllTasks()
        sun.value = 500
        selectedPlant.value = null
        isRunning.value = false
        gameOver.value = false
        win.value = false
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
        emit('onGameReset')
    }

    /**
     * 选择植物
     * @param {string} type
     * 原理：切换当前选中的植物类型，需满足阳光和冷却条件
     */
    const selectPlant = (type) => {
        if (!type) {
            selectedPlant.value = null
            return
        }
        if (sun.value < registeredPlants[type]?.cost) return
        if (!isPlantReady(type)) return
        selectedPlant.value = selectedPlant.value === type ? null : type
    }

    /**
     * 放置植物
     * @param {number} row
     * @param {number} col
     * 原理：在指定格子放置植物，扣除阳光并设置冷却，调用植物的 onPlace
     */
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

    // 导出所有状态、行为、注册表、事件
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
        on // 事件订阅，便于配对和扩展
    }
}