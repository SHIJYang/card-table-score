/**
 * 粒子类视觉效果
 * 包含各种粒子系统效果
 */

/**
 * 烟花效果
 * @param {Array} particles - 粒子数组
 * @param {Array} ripples - 涟漪数组
 * @param {string} color - 颜色
 */
export function effectFirework(particles, ripples, color) {
  const cx = window.innerWidth / 2
  const cy = window.innerHeight / 2
  
  // 中心涟漪
  ripples.push({
    x: cx, y: cy,
    radius: 10,
    speed: 5,
    color,
    alpha: 1,
    lineWidth: 6
  })
  
  // 爆炸粒子
  for (let i = 0; i < 30; i++) {
    const angle = (Math.PI * 2 / 30) * i + Math.random() * 0.2
    const speed = 4 + Math.random() * 6
    particles.push({
      x: cx, y: cy,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      size: 2 + Math.random() * 4,
      color,
      life: 1.2
    })
  }
  
  // 二次爆炸粒子
  for (let i = 0; i < 15; i++) {
    const angle = (Math.PI * 2 / 15) * i
    const speed = 2 + Math.random() * 3
    particles.push({
      x: cx + Math.cos(angle) * 50,
      y: cy + Math.sin(angle) * 50,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      size: 3 + Math.random() * 3,
      color,
      life: 0.8
    })
  }
}

/**
 * 气泡效果
 * @param {Array} shapes - 形状数组
 * @param {Array} particles - 粒子数组
 * @param {string} color - 颜色
 */
export function effectBubble(shapes, particles, color) {
  const cx = window.innerWidth / 2
  const cy = window.innerHeight / 2
  
  for (let i = 0; i < 15; i++) {
    const angle = (Math.PI * 2 / 15) * i
    const dist = 30 + Math.random() * 80
    const size = 8 + Math.random() * 15
    
    shapes.push({
      type: 'circle',
      x: cx + Math.cos(angle) * dist,
      y: cy + Math.sin(angle) * dist,
      vx: (Math.random() - 0.5) * 1,
      vy: -1 - Math.random() * 2,
      size,
      rotation: 0,
      rotationSpeed: (Math.random() - 0.5) * 0.05,
      scale: 1,
      color,
      life: 2,
      alpha: 0.7,
      fill: false,
      lineWidth: 2
    })
  }
}

/**
 * 雪花效果
 * @param {Array} shapes - 形状数组
 * @param {string} color - 颜色
 */
export function effectSnow(shapes, color) {
  const cx = window.innerWidth / 2
  const cy = window.innerHeight / 2
  
  for (let i = 0; i < 20; i++) {
    const x = cx + (Math.random() - 0.5) * 300
    const y = cy - 100 - Math.random() * 100
    
    shapes.push({
      type: 'star',
      x, y,
      vx: (Math.random() - 0.5) * 1,
      vy: 1 + Math.random() * 2,
      size: 3 + Math.random() * 5,
      rotation: Math.random() * Math.PI,
      rotationSpeed: (Math.random() - 0.5) * 0.1,
      scale: 1,
      color,
      life: 2.5,
      alpha: 0.8,
      fill: true,
      lineWidth: 2
    })
  }
}

/**
 * 彩纸效果
 * @param {Array} shapes - 形状数组
 * @param {string} color - 颜色
 */
export function effectConfetti(shapes, color) {
  const cx = window.innerWidth / 2
  const cy = window.innerHeight / 2
  
  for (let i = 0; i < 25; i++) {
    const angle = (Math.PI * 2 / 25) * i + Math.random() * 0.3
    const speed = 3 + Math.random() * 5
    const types = ['rect', 'triangle', 'circle']
    
    shapes.push({
      type: types[Math.floor(Math.random() * types.length)],
      x: cx, y: cy,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed + 2,
      size: 5 + Math.random() * 8,
      rotation: Math.random() * Math.PI,
      rotationSpeed: (Math.random() - 0.5) * 0.3,
      scale: 1,
      color,
      life: 1.5,
      alpha: 1,
      fill: Math.random() > 0.3,
      lineWidth: 2
    })
  }
}

/**
 * 像素效果
 * @param {Array} shapes - 形状数组
 * @param {string} color - 颜色
 */
export function effectPixel(shapes, color) {
  const cx = window.innerWidth / 2
  const cy = window.innerHeight / 2
  
  for (let i = 0; i < 30; i++) {
    const gridX = Math.floor(Math.random() * 10) - 5
    const gridY = Math.floor(Math.random() * 10) - 5
    const size = 12
    
    shapes.push({
      type: 'rect',
      x: cx + gridX * size * 1.5,
      y: cy + gridY * size * 1.5,
      vx: (Math.random() - 0.5) * 2,
      vy: (Math.random() - 0.5) * 2,
      size: size / 2,
      rotation: 0,
      rotationSpeed: 0,
      scale: 1,
      color,
      life: 0.8,
      alpha: 1,
      fill: true,
      lineWidth: 1
    })
  }
}

/**
 * 星落效果
 * @param {Array} shapes - 形状数组
 * @param {Array} particles - 粒子数组
 * @param {string} color - 颜色
 */
export function effectStarfall(shapes, particles, color) {
  const cx = window.innerWidth / 2
  const cy = window.innerHeight / 2
  
  // 创建星星
  for (let i = 0; i < 12; i++) {
    const angle = (Math.PI * 2 / 12) * i
    const dist = 50 + Math.random() * 100
    
    shapes.push({
      type: 'star',
      x: cx + Math.cos(angle) * dist,
      y: cy + Math.sin(angle) * dist,
      vx: Math.cos(angle + Math.PI / 2) * 3,
      vy: Math.sin(angle + Math.PI / 2) * 3 + 2,
      size: 6 + Math.random() * 8,
      rotation: angle,
      rotationSpeed: 0.1,
      scale: 1,
      color,
      life: 1.2,
      alpha: 1,
      fill: true,
      lineWidth: 2
    })
  }
  
  // 尾迹粒子
  for (let i = 0; i < 20; i++) {
    const angle = Math.random() * Math.PI * 2
    const speed = 2 + Math.random() * 4
    particles.push({
      x: cx, y: cy,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed + 3,
      size: 2 + Math.random() * 3,
      color,
      life: 0.6
    })
  }
}

/**
 * 闪电效果
 * @param {Array} shapes - 形状数组
 * @param {string} color - 颜色
 */
export function effectLightning(shapes, color) {
  const cx = window.innerWidth / 2
  const cy = window.innerHeight / 2
  
  // 创建闪电分支
  for (let branch = 0; branch < 3; branch++) {
    let x = cx
    let y = cy
    const angle = -Math.PI / 2 + (Math.random() - 0.5) * 0.5
    
    for (let i = 0; i < 8; i++) {
      const nextX = x + Math.cos(angle + (Math.random() - 0.5) * 0.8) * 40
      const nextY = y + Math.sin(angle + (Math.random() - 0.5) * 0.8) * 40
      
      shapes.push({
        type: 'line',
        x, y,
        vx: 0, vy: 0,
        size: Math.sqrt((nextX - x) ** 2 + (nextY - y) ** 2),
        rotation: Math.atan2(nextY - y, nextX - x),
        rotationSpeed: 0,
        scale: 1,
        color,
        life: 0.3,
        alpha: 1,
        fill: false,
        lineWidth: 3 + Math.random() * 2
      })
      
      x = nextX
      y = nextY
    }
  }
}
