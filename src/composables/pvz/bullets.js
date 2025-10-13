// 子弹类型注册表，支持不同功能子弹扩展
export const bulletTypes = {
    'pea': {
        emoji: '🟢',
        speed: 8,
        effect: null // 普通弹
    },
    'ice-pea': {
        emoji: '❄️',
        speed: 8,
        effect: 'slow' // 冰冻弹
    },
    'armor-piercing': {
        emoji: '🔸',
        speed: 10,
        effect: 'pierce' // 穿甲弹
    },
    'tracking': {
        emoji: '🎯',
        speed: 7,
        effect: 'tracking' // 追踪弹
    }
    // 可继续扩展更多类型
}

/**
 * 生成子弹对象
 * @param {Object} opts
 * @param {number} opts.row
 * @param {number} opts.col
 * @param {string} opts.type
 * @param {string} opts.plantType
 * @param {number} [opts.x] - 子弹初始x坐标，默认为col*80
 */
export function createBullet({ row, col, type, plantType, x }) {
    const bulletType = bulletTypes[type] || bulletTypes['pea']
    return {
        id: Date.now() + Math.random(),
        row,
        col,
        x: typeof x === 'number' ? x : col * 80,
        type,
        emoji: bulletType.emoji,
        speed: bulletType.speed,
        effect: bulletType.effect,
        plantRef: { row, col, type: plantType }
    }
}
