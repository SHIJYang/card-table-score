/**
 * 效果注册表
 * 统一管理所有视觉效果的注册和调用
 */

import * as burstEffects from './effects/burstEffects.js'
import * as motionEffects from './effects/motionEffects.js'
import * as patternEffects from './effects/patternEffects.js'
import * as particleEffects from './effects/particleEffects.js'

// 效果注册表
const effectRegistry = new Map()

// 效果分类
export const EffectCategories = {
  BURST: 'burst',
  MOTION: 'motion',
  PATTERN: 'pattern',
  PARTICLE: 'particle'
}

/**
 * 注册效果
 * @param {string} name - 效果名称
 * @param {Function} effectFn - 效果函数
 * @param {string} category - 效果分类
 * @param {Object} metadata - 元数据
 */
export function registerEffect(name, effectFn, category = 'general', metadata = {}) {
  effectRegistry.set(name, {
    fn: effectFn,
    category,
    metadata
  })
}

/**
 * 获取效果
 * @param {string} name - 效果名称
 * @returns {Function|null}
 */
export function getEffect(name) {
  const effect = effectRegistry.get(name)
  return effect ? effect.fn : null
}

/**
 * 检查效果是否存在
 * @param {string} name - 效果名称
 * @returns {boolean}
 */
export function hasEffect(name) {
  return effectRegistry.has(name)
}

/**
 * 获取所有效果名称
 * @returns {Array<string>}
 */
export function getAllEffectNames() {
  return Array.from(effectRegistry.keys())
}

/**
 * 按分类获取效果
 * @param {string} category - 效果分类
 * @returns {Array<string>}
 */
export function getEffectsByCategory(category) {
  return Array.from(effectRegistry.entries())
    .filter(([_, info]) => info.category === category)
    .map(([name, _]) => name)
}

/**
 * 执行效果
 * @param {string} name - 效果名称
 * @param {Object} context - 效果上下文
 * @param {string} color - 颜色
 */
export function executeEffect(name, context, color) {
  const effect = effectRegistry.get(name)
  if (!effect) {
    console.warn(`[EffectRegistry] 效果不存在: ${name}`)
    return false
  }

  try {
    const { shapes, particles, ripples, texts } = context
    
    // 根据效果函数的参数签名调用
    const fn = effect.fn
    const paramCount = fn.length
    
    if (paramCount === 2) {
      // 简单效果: (targetArray, color)
      const nameLower = name.toLowerCase()
      if (nameLower.includes('burst') || nameLower.includes('scatter') || nameLower.includes('pulse')) {
        fn(ripples, particles, color)
      } else if (nameLower.includes('dot')) {
        fn(particles, color)
      } else {
        fn(shapes, color)
      }
    } else if (paramCount === 3) {
      // 复合效果: (array1, array2, color)
      const nameLower = name.toLowerCase()
      if (nameLower.includes('firework') || nameLower.includes('starfall') || nameLower.includes('bubble') || nameLower.includes('gsap')) {
        fn(shapes, particles, color)
      } else {
        fn(ripples, particles, color)
      }
    } else {
      // 默认调用
      fn(shapes, particles, ripples, texts, color)
    }
    
    return true
  } catch (error) {
    console.error(`[EffectRegistry] 执行效果失败: ${name}`, error)
    return false
  }
}

// 初始化注册所有效果
function initializeRegistry() {
  // 爆发类效果
  registerEffect('burst', burstEffects.effectBurst, EffectCategories.BURST, { description: '圆形扩散' })
  registerEffect('explosion', burstEffects.effectExplosion, EffectCategories.BURST, { description: '三角形爆发' })
  registerEffect('scatter', burstEffects.effectScatter, EffectCategories.BURST, { description: '随机圆点' })
  registerEffect('diamond', burstEffects.effectDiamond, EffectCategories.BURST, { description: '菱形爆发' })
  registerEffect('cross', burstEffects.effectCross, EffectCategories.BURST, { description: '十字爆发' })
  registerEffect('square', burstEffects.effectSquare, EffectCategories.BURST, { description: '方块爆发' })
  registerEffect('dot', burstEffects.effectDot, EffectCategories.BURST, { description: '三角形爆发' })

  // 运动类效果
  registerEffect('spiral', motionEffects.effectSpiral, EffectCategories.MOTION, { description: '弹跳方块' })
  registerEffect('wave', motionEffects.effectWave, EffectCategories.MOTION, { description: '六边形旋转' })
  registerEffect('rain', motionEffects.effectRain, EffectCategories.MOTION, { description: '放射圆环' })
  registerEffect('meteor', motionEffects.effectMeteor, EffectCategories.MOTION, { description: '旋转星形' })
  registerEffect('vortex', motionEffects.effectVortex, EffectCategories.MOTION, { description: '漩涡' })
  registerEffect('tornado', motionEffects.effectTornado, EffectCategories.MOTION, { description: '螺旋扩散' })
  registerEffect('pulse', motionEffects.effectPulse, EffectCategories.MOTION, { description: '脉冲' })
  registerEffect('spiral2', motionEffects.effectSpiral2, EffectCategories.MOTION, { description: '双螺旋' })

  // 图案类效果
  registerEffect('flower', patternEffects.effectFlower, EffectCategories.PATTERN, { description: '花朵图案' })
  registerEffect('hex', patternEffects.effectHex, EffectCategories.PATTERN, { description: '六边形阵列' })
  registerEffect('triangle', patternEffects.effectTriangle, EffectCategories.PATTERN, { description: '三角形阵列' })
  registerEffect('circle', patternEffects.effectCircle, EffectCategories.PATTERN, { description: '圆环阵列' })
  registerEffect('line', patternEffects.effectLine, EffectCategories.PATTERN, { description: '线条爆发' })
  registerEffect('arc', patternEffects.effectArc, EffectCategories.PATTERN, { description: '弧线扩散' })
  registerEffect('ring', patternEffects.effectRing, EffectCategories.PATTERN, { description: '圆环' })
  registerEffect('flash', patternEffects.effectFlash, EffectCategories.PATTERN, { description: '放射线' })

  // 粒子类效果
  registerEffect('firework', particleEffects.effectFirework, EffectCategories.PARTICLE, { description: '烟花' })
  registerEffect('bubble', particleEffects.effectBubble, EffectCategories.PARTICLE, { description: '气泡' })
  registerEffect('snow', particleEffects.effectSnow, EffectCategories.PARTICLE, { description: '雪花' })
  registerEffect('confetti', particleEffects.effectConfetti, EffectCategories.PARTICLE, { description: '彩纸' })
  registerEffect('pixel', particleEffects.effectPixel, EffectCategories.PARTICLE, { description: '像素' })
  registerEffect('starfall', particleEffects.effectStarfall, EffectCategories.PARTICLE, { description: '星落' })
  registerEffect('lightning', particleEffects.effectLightning, EffectCategories.PARTICLE, { description: '菱形爆发' })
  registerEffect('gsap', particleEffects.effectGSAP, EffectCategories.PARTICLE, { description: 'GSAP流畅动画' })

  console.log(`[EffectRegistry] 已注册 ${effectRegistry.size} 个视觉效果`)
}

// 自动初始化
initializeRegistry()

export default effectRegistry
