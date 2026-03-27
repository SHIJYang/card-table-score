/**
 * 爆发类视觉效果
 * 包含各种从中心向外扩散的效果
 */

/**
 * 圆形扩散 - 从中心向外扩散的圆环
 * @param {Array} ripples - 涟漪数组
 * @param {Array} particles - 粒子数组
 * @param {string} color - 颜色
 */
export function effectBurst(ripples, particles, color) {
  console.log('[动画效果] 开始执行圆形扩散效果，颜色:', color)
  const cx = window.innerWidth / 2
  const cy = window.innerHeight / 2
  
  // 创建多层涟漪
  for (let i = 0; i < 5; i++) {
    ripples.push({
      x: cx, y: cy,
      radius: 10 + i * 30,
      speed: 4 + i * 1.5,
      color,
      alpha: 0.9 - i * 0.15,
      lineWidth: 8 - i
    })
  }
  
  // 创建放射状粒子
  for (let i = 0; i < 12; i++) {
    const angle = (Math.PI * 2 / 12) * i
    particles.push({
      x: cx, y: cy,
      vx: Math.cos(angle) * 5,
      vy: Math.sin(angle) * 5,
      size: 4 + Math.random() * 3,
      color,
      life: 1
    })
  }
  console.log('[动画效果] 圆形扩散效果执行完成，创建了5个涟漪和12个粒子')
}

/**
 * 爆炸效果 - 从中心爆发的三角形
 * @param {Array} shapes - 形状数组
 * @param {string} color - 颜色
 */
export function effectExplosion(shapes, color) {
  console.log('[动画效果] 开始执行爆炸效果，颜色:', color)
  const cx = window.innerWidth / 2
  const cy = window.innerHeight / 2
  
  for (let i = 0; i < 10; i++) {
    const angle = (Math.PI * 2 / 10) * i
    shapes.push({
      type: 'triangle',
      x: cx, y: cy,
      vx: Math.cos(angle) * 7,
      vy: Math.sin(angle) * 7,
      size: 15 + Math.random() * 20,
      rotation: angle,
      rotationSpeed: (Math.random() - 0.5) * 0.3,
      scale: 1,
      color,
      life: 1,
      alpha: 1,
      fill: i % 2 === 0,
      lineWidth: 4
    })
  }
  console.log('[动画效果] 爆炸效果执行完成，创建了10个三角形')
}

/**
 * 散射效果 - 随机位置出现的圆点
 * @param {Array} ripples - 涟漪数组
 * @param {Array} particles - 粒子数组
 * @param {string} color - 颜色
 */
export function effectScatter(ripples, particles, color) {
  console.log('[动画效果] 开始执行散射效果，颜色:', color)
  for (let i = 0; i < 20; i++) {
    const x = Math.random() * window.innerWidth
    const y = Math.random() * window.innerHeight
    
    ripples.push({
      x, y,
      radius: 5,
      speed: 3 + Math.random() * 2,
      color,
      alpha: 0.8,
      lineWidth: 4
    })
    
    particles.push({
      x, y,
      vx: (Math.random() - 0.5) * 3,
      vy: (Math.random() - 0.5) * 3,
      size: 3 + Math.random() * 4,
      color,
      life: 0.8
    })
  }
  console.log('[动画效果] 散射效果执行完成，创建了20个涟漪和20个粒子')
}

/**
 * 菱形爆发 - 从中心爆发的菱形
 * @param {Array} shapes - 形状数组
 * @param {string} color - 颜色
 */
export function effectDiamond(shapes, color) {
  console.log('[动画效果] 开始执行菱形爆发效果，颜色:', color)
  const cx = window.innerWidth / 2
  const cy = window.innerHeight / 2
  
  for (let i = 0; i < 8; i++) {
    const angle = (Math.PI * 2 / 8) * i + Math.PI / 8
    shapes.push({
      type: 'diamond',
      x: cx, y: cy,
      vx: Math.cos(angle) * 6,
      vy: Math.sin(angle) * 6,
      size: 15 + Math.random() * 12,
      rotation: angle,
      rotationSpeed: (Math.random() - 0.5) * 0.2,
      scale: 1,
      color,
      life: 1.1,
      alpha: 1,
      fill: Math.random() > 0.5,
      lineWidth: 4
    })
  }
  console.log('[动画效果] 菱形爆发效果执行完成，创建了8个菱形')
}

/**
 * 十字爆发 - 从中心爆发的十字
 * @param {Array} shapes - 形状数组
 * @param {string} color - 颜色
 */
export function effectCross(shapes, color) {
  console.log('[动画效果] 开始执行十字爆发效果，颜色:', color)
  const cx = window.innerWidth / 2
  const cy = window.innerHeight / 2
  
  for (let i = 0; i < 8; i++) {
    const angle = (Math.PI * 2 / 8) * i
    shapes.push({
      type: 'cross',
      x: cx, y: cy,
      vx: Math.cos(angle) * 5,
      vy: Math.sin(angle) * 5,
      size: 15 + Math.random() * 10,
      rotation: angle,
      rotationSpeed: (Math.random() - 0.5) * 0.15,
      scale: 1,
      color,
      life: 1,
      alpha: 1,
      fill: false,
      lineWidth: 5
    })
  }
  console.log('[动画效果] 十字爆发效果执行完成，创建了8个十字')
}

/**
 * 方块爆发 - 从中心爆发的方块
 * @param {Array} shapes - 形状数组
 * @param {string} color - 颜色
 */
export function effectSquare(shapes, color) {
  console.log('[动画效果] 开始执行方块爆发效果，颜色:', color)
  const cx = window.innerWidth / 2
  const cy = window.innerHeight / 2
  
  for (let i = 0; i < 10; i++) {
    const angle = (Math.PI * 2 / 10) * i
    shapes.push({
      type: 'rect',
      x: cx, y: cy,
      vx: Math.cos(angle) * 5,
      vy: Math.sin(angle) * 5,
      size: 12 + Math.random() * 10,
      rotation: angle,
      rotationSpeed: (Math.random() - 0.5) * 0.2,
      scale: 1,
      color,
      life: 1,
      alpha: 1,
      fill: i % 2 === 0,
      lineWidth: 4
    })
  }
  console.log('[动画效果] 方块爆发效果执行完成，创建了10个方块')
}

/**
 * 点阵爆发 - 从中心爆发的点
 * @param {Array} particles - 粒子数组
 * @param {string} color - 颜色
 */
export function effectDot(particles, color) {
  console.log('[动画效果] 开始执行点阵爆发效果，颜色:', color)
  const cx = window.innerWidth / 2
  const cy = window.innerHeight / 2
  
  for (let i = 0; i < 20; i++) {
    const angle = Math.random() * Math.PI * 2
    const speed = 3 + Math.random() * 4
    particles.push({
      x: cx, y: cy,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      size: 3 + Math.random() * 5,
      color,
      life: 1
    })
  }
  console.log('[动画效果] 点阵爆发效果执行完成，创建了20个粒子')
}
