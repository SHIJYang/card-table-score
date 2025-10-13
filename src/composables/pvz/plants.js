import { reactive } from 'vue'
import { createBullet } from './bullets'

/**
 * 通用周期任务型植物工厂，支持扩展动作/状态/效果
 * 优化：仅在同行有僵尸时才射击，且子弹初始位置为植物格子右侧
 */
export function createPeriodicPlant({
    displayName,
    cost,
    emoji,
    cooldown,
    interval,
    bulletType,
    onInterval,
    actions = {},
    effects = {},
    initialState = {}
}) {
    return {
        displayName,
        cost,
        emoji,
        cooldown,
        actions,
        effects,
        initialState,
        onPlace: (row, col, ctx) => {
            if (bulletType) {
                const taskId = ctx.startPeriodicTask(() => {
                    const plant = ctx.grid[row][col]
                    if (!plant) return
                    // 检查同行是否有僵尸
                    const zombiesInRow = ctx.getZombiesInRow(row)
                    const plantRightX = (col) * 80 // 植物格子右侧
                    const hasZombieAhead = zombiesInRow.some(z => z.x > plantRightX)

                    if (hasZombieAhead) {
                        const bullet = createBullet({
                            row,
                            col,
                            type: bulletType,
                            plantType: plant.type,
                            x: plantRightX // 从植物格子右侧发射
                        })
                        ctx.spawnBullet(bullet)
                        ctx.emit('onPlantAttack', { plant, bullet })
                    }
                }, interval)
                return { taskId, ...initialState }
            }
            // 其他周期行为
            const taskId = ctx.startPeriodicTask(() => onInterval(row, col, ctx), interval)
            return { taskId, ...initialState }
        },
        onRemove: (data, ctx) => {
            if (data?.taskId) ctx.stopPeriodicTask(data.taskId)
        }
    }
}

// 植物注册表，支持丰富动作/状态/效果
export const registeredPlants = reactive({
    sunflower: createPeriodicPlant({
        displayName: '向日葵',
        cost: 50,
        emoji: '🌻',
        cooldown: 5000,
        interval: 10000,
        onInterval: (row, col, ctx) => ctx.spawnSun({ row, col }),
        actions: { produce: true },
        effects: {},
        initialState: { hp: 3 }
    }),
    peashooter: createPeriodicPlant({
        displayName: '豌豆射手',
        cost: 100,
        emoji: '🌱',
        cooldown: 7500,
        interval: 1500,
        bulletType: 'pea',
        actions: { attack: true },
        effects: {},
        initialState: { hp: 5 }
    }),
    icePeashooter: createPeriodicPlant({
        displayName: '冰豌豆射手',
        cost: 150,
        emoji: '❄️',
        cooldown: 9000,
        interval: 1800,
        bulletType: 'ice-pea',
        actions: { attack: true },
        effects: { slow: true },
        initialState: { hp: 5 }
    }),
    armorPeashooter: createPeriodicPlant({
        displayName: '穿甲豌豆射手',
        cost: 175,
        emoji: '🔸',
        cooldown: 12000,
        interval: 2000,
        bulletType: 'armor-piercing',
        actions: { attack: true },
        effects: { pierce: true },
        initialState: { hp: 5 }
    }),
    trackingPeashooter: createPeriodicPlant({
        displayName: '追踪豌豆射手',
        cost: 200,
        emoji: '🎯',
        cooldown: 15000,
        interval: 2200,
        bulletType: 'tracking',
        actions: { attack: true },
        effects: { tracking: true },
        initialState: { hp: 5 }
    })
    // 可扩展更多植物
})

export function registerPlant(type, config) {
    registeredPlants[type] = config
}
