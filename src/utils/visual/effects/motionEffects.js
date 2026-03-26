/**
 * 运动类视觉效果
 * 包含各种动态移动的效果
 */

/**
 * 弹跳方块 - 多个方块从中心弹出
 * @param {Array} shapes - 形状数组
 * @param {string} color - 颜色
 */
export function effectSpiral(shapes, color) {
  const cx = window.innerWidth / 2
  const cy = window.innerHeight / 2
  
  for (let i = 0; i < 8; i++) {
    const angle = (Math.PI * 2 / 8) * i + Math.PI / 8
    shapes.push({
      type: 'rect',
      x: cx, y: cy,
      vx: Math.cos(angle) * 6,
      vy: Math.sin(angle) * 6,
      size: 20 + Math.random() * 15,
      rotation: angle,
      rotationSpeed: (Math.random() - 0.5) * 0.2,
      scale: 1,
      color,
      life: 1.2,
      alpha: 1,
      fill: Math.random() > 0.5,
      lineWidth: 4
    })
  }
}

/**
 * 横向扫描线 - 从左到右的扫描效果
 * @param {Array} shapes - 形状数组
 * @param {string} color - 颜色
 */
export function effectWave(shapes, color) {
  const cy = window.innerHeight / 2
  
  for (let i = 0; i < 8; i++) {
    shapes.push({
      type: 'line',
      x: -100,
      y: cy + (i - 4) * 60,
      vx: 8 + i * 0.5,
      vy: 0,
      size: window.innerWidth / 2,
      rotation: 0,
      rotationSpeed: 0,
      scale: 1,
      color,
      life: 1.5,
      alpha: 0.8 - i * 0.08,
      fill: false,
      lineWidth: 6 - i * 0.5
    })
  }
}

/**
 * 垂直下落 - 从顶部下落的形状
 * @param {Array} shapes - 形状数组
 * @param {string} color - 颜色
 */
export function effectRain(shapes, color) {
  for (let i = 0; i < 15; i++) {
    const x = Math.random() * window.innerWidth
    shapes.push({
      type: 'rect',
      x, y: -50,
      vx: 0,
      vy: 6 + Math.random() * 4,
      size: 10 + Math.random() * 15,
      rotation: 0,
      rotationSpeed: (Math.random() - 0.5) * 0.1,
      scale: 0.8 + Math.random() * 0.4,
      color,
      life: 2,
      alpha: 1,
      fill: Math.random() > 0.5,
      lineWidth: 3
    })
  }
}

/**
 * 流星效果
 * @param {Array} shapes - 形状数组
 * @param {string} color - 颜色
 */
export function effectMeteor(shapes, color) {
  const cx = window.innerWidth / 2
  const cy = window.innerHeight / 2
  
  for (let i = 0; i < 12; i++) {
    const angle = Math.PI / 4 + (Math.random() - 0.5) * 0.5
    const speed = 8 + Math.random() * 4
    shapes.push({
      type: 'line',
      x: cx + (Math.random() - 0.5) * 200,
      y: cy + (Math.random() - 0.5) * 200,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      size: 30 + Math.random() * 20,
      rotation: angle,
      rotationSpeed: 0,
      scale: 1,
      color,
      life: 1,
      alpha: 0.9,
      fill: false,
      lineWidth: 3
    })
  }
}

/**
 * 漩涡效果
 * @param {Array} shapes - 形状数组
 * @param {string} color - 颜色
 */
export function effectVortex(shapes, color) {
  const cx = window.innerWidth / 2
  const cy = window.innerHeight / 2
  
  for (let i = 0; i < 20; i++) {
    const angle = (Math.PI * 2 / 20) * i
    const dist = 30 + i * 8
    shapes.push({
      type: 'circle',
      x: cx + Math.cos(angle) * dist,
      y: cy + Math.sin(angle) * dist,
      vx: Math.cos(angle + Math.PI / 2) * 2,
      vy: Math.sin(angle + Math.PI / 2) * 2,
      size: 5 + i * 0.3,
      rotation: 0,
      rotationSpeed: 0.1 * (i % 2 === 0 ? 1 : -1),
      scale: 1,
      color,
      life: 1.5,
      alpha: 1 - i * 0.04,
      fill: true,
      lineWidth: 2
    })
  }
}

/**
 * 龙卷风效果
 * @param {Array} shapes - 形状数组
 * @param {string} color - 颜色
 */
export function effectTornado(shapes, color) {
  const cx = window.innerWidth / 2
  const cy = window.innerHeight / 2
  
  for (let i = 0; i < 25; i++) {
    const angle = (Math.PI * 4 / 25) * i
    const dist = 20 + i * 6
    const yOffset = (i - 12) * 15
    shapes.push({
      type: 'rect',
      x: cx + Math.cos(angle) * dist,
      y: cy + yOffset,
      vx: Math.cos(angle + Math.PI / 2) * 1.5,
      vy: -2,
      size: 8 + i * 0.4,
      rotation: angle,
      rotationSpeed: 0.15,
      scale: 1,
      color,
      life: 1.2,
      alpha: 1 - i * 0.03,
      fill: i % 3 === 0,
      lineWidth: 3
    })
  }
}

/**
 * 脉冲效果
 * @param {Array} ripples - 涟漪数组
 * @param {string} color - 颜色
 */
export function effectPulse(ripples, color) {
  const cx = window.innerWidth / 2
  const cy = window.innerHeight / 2
  
  for (let i = 0; i < 4; i++) {
    ripples.push({
      x: cx, y: cy,
      radius: 20 + i * 40,
      speed: 6 + i * 2,
      color,
      alpha: 0.7 - i * 0.15,
      lineWidth: 10 - i * 2
    })
  }
}

/**
 * 双螺旋 - 双螺旋形状
 * @param {Array} shapes - 形状数组
 * @param {string} color - 颜色
 */
export function effectSpiral2(shapes, color) {
  const cx = window.innerWidth / 2
  const cy = window.innerHeight / 2
  
  for (let i = 0; i < 25; i++) {
    const angle = (Math.PI * 5 / 25) * i
    const dist = 20 + i * 7
    
    // 第一个螺旋
    shapes.push({
      type: 'circle',
      x: cx + Math.cos(angle) * dist,
      y: cy + Math.sin(angle) * dist,
      vx: Math.cos(angle + Math.PI / 2) * 1.5,
      vy: Math.sin(angle + Math.PI / 2) * 1.5,
      size: 4 + i * 0.3,
      rotation: 0,
      rotationSpeed: 0.12,
      scale: 1,
      color,
      life: 1.2,
      alpha: 1,
      fill: true,
      lineWidth: 3
    })
    
    // 第二个螺旋（反向）
    shapes.push({
      type: 'circle',
      x: cx + Math.cos(angle + Math.PI) * dist,
      y: cy + Math.sin(angle + Math.PI) * dist,
      vx: Math.cos(angle + Math.PI / 2) * 1.5,
      vy: Math.sin(angle + Math.PI / 2) * 1.5,
      size: 4 + i * 0.3,
      rotation: 0,
      rotationSpeed: -0.12,
      scale: 1,
      color,
      life: 1.2,
      alpha: 1,
      fill: true,
      lineWidth: 3
    })
  }
}
