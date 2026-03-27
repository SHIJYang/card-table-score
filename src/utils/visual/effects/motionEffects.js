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
  console.log('[动画效果] 开始执行弹跳方块效果，颜色:', color)
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
  console.log('[动画效果] 弹跳方块效果执行完成，创建了8个方块')
}

/**
 * 六边形旋转 - 从中心向外旋转的六边形
 * @param {Array} shapes - 形状数组
 * @param {string} color - 颜色
 */
export function effectWave(shapes, color) {
  console.log('[动画效果] 开始执行六边形旋转效果，颜色:', color)
  const cx = window.innerWidth / 2
  const cy = window.innerHeight / 2
  
  for (let i = 0; i < 18; i++) {
    const angle = (Math.PI * 2 / 18) * i
    const dist = 25 + i * 7
    const size = 12 + Math.random() * 10
    const speed = 2 + Math.random() * 2
    
    shapes.push({
      type: 'hexagon',
      x: cx + Math.cos(angle) * dist,
      y: cy + Math.sin(angle) * dist,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      size,
      rotation: angle,
      rotationSpeed: (Math.random() - 0.5) * 0.12,
      scale: 0.7 + Math.random() * 0.6,
      color,
      life: 2 + Math.random() * 1,
      alpha: 0.6 + Math.random() * 0.4,
      fill: Math.random() > 0.5,
      lineWidth: 2 + Math.random() * 2
    })
  }
  console.log('[动画效果] 六边形旋转效果执行完成，创建了18个六边形')
}

/**
 * 放射圆环 - 从中心向外扩散的圆环
 * @param {Array} shapes - 形状数组
 * @param {string} color - 颜色
 */
export function effectRain(shapes, color) {
  console.log('[动画效果] 开始执行放射圆环效果，颜色:', color)
  const cx = window.innerWidth / 2
  const cy = window.innerHeight / 2
  
  for (let i = 0; i < 20; i++) {
    const angle = (Math.PI * 2 / 20) * i
    const dist = 20 + i * 5
    const size = 8 + Math.random() * 10
    const speed = 2 + Math.random() * 2
    
    shapes.push({
      type: 'circle',
      x: cx + Math.cos(angle) * dist,
      y: cy + Math.sin(angle) * dist,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      size,
      rotation: 0,
      rotationSpeed: 0,
      scale: 0.7 + Math.random() * 0.6,
      color,
      life: 2 + Math.random() * 1,
      alpha: 0.6 + Math.random() * 0.4,
      fill: Math.random() > 0.5,
      lineWidth: 2 + Math.random() * 2
    })
  }
  console.log('[动画效果] 放射圆环效果执行完成，创建了20个圆形')
}

/**
 * 旋转星形效果 - 从中心向外旋转扩散
 * @param {Array} shapes - 形状数组
 * @param {string} color - 颜色
 */
export function effectMeteor(shapes, color) {
  console.log('[动画效果] 开始执行旋转星形效果，颜色:', color)
  const cx = window.innerWidth / 2
  const cy = window.innerHeight / 2
  
  for (let i = 0; i < 20; i++) {
    const angle = (Math.PI * 2 / 20) * i
    const dist = 30 + i * 6
    const size = 10 + Math.random() * 8
    const speed = 2 + Math.random() * 2
    
    shapes.push({
      type: 'star',
      x: cx + Math.cos(angle) * dist,
      y: cy + Math.sin(angle) * dist,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      size,
      rotation: angle,
      rotationSpeed: (Math.random() - 0.5) * 0.15,
      scale: 0.8 + Math.random() * 0.4,
      color,
      life: 2 + Math.random() * 1,
      alpha: 0.7 + Math.random() * 0.3,
      fill: Math.random() > 0.4,
      lineWidth: 2 + Math.random() * 2
    })
  }
  console.log('[动画效果] 旋转星形效果执行完成，创建了20个星形')
}

/**
 * 漩涡效果 - 整体旋转的+图案
 * @param {Array} shapes - 形状数组
 * @param {string} color - 颜色
 */
export function effectVortex(shapes, color) {
  console.log('[动画效果] 开始执行漩涡效果，颜色:', color)
  const cx = window.innerWidth / 2
  const cy = window.innerHeight / 2
  const baseOrbitSpeed = 0.05
  
  // 随机选择起始角度（0 到 2π）
  const startAngle = Math.random() * Math.PI * 2
  
  for (let i = 0; i < 20; i++) {
    // 螺旋角度：从随机起始角度开始，向外螺旋
    const angle = startAngle + (Math.PI * 2 / 20) * i
    const dist = 30 + i * 8
    
    // 计算当前位置
    const x = cx + Math.cos(angle) * dist
    const y = cy + Math.sin(angle) * dist
    
    // 计算切向速度，确保平滑的圆周运动
    // 速度方向垂直于径向方向，大小与距离成正比
    const speedMagnitude = baseOrbitSpeed * dist
    const vx = -Math.sin(angle) * speedMagnitude
    const vy = Math.cos(angle) * speedMagnitude
    
    const randomSize = 15 + Math.random() * 25
    const randomAlpha = 0.7 + Math.random() * 0.3
    const randomLineWidth = 4 + Math.random() * 6
    
    shapes.push({
      type: 'cross',
      x: x,
      y: y,
      vx: vx,
      vy: vy,
      size: randomSize,
      rotation: 0,
      rotationSpeed: 0,
      scale: 1,
      color: color,
      life: 2,
      alpha: randomAlpha,
      fill: false,
      lineWidth: randomLineWidth
    })
  }
  console.log('[动画效果] 漩涡效果执行完成，创建了20个随机加大号的+，起始角度:', startAngle)
}

/**
 * 螺旋扩散效果 - 从中心向外螺旋扩散
 * @param {Array} shapes - 形状数组
 * @param {string} color - 颜色
 */
export function effectTornado(shapes, color) {
  console.log('[动画效果] 开始执行螺旋扩散效果，颜色:', color)
  const cx = window.innerWidth / 2
  const cy = window.innerHeight / 2
  const shapeTypes = ['circle', 'triangle', 'diamond', 'rect']
  
  for (let i = 0; i < 30; i++) {
    const angle = (Math.PI * 6 / 30) * i
    const dist = 15 + i * 8
    const shapeType = shapeTypes[i % shapeTypes.length]
    const size = 8 + Math.random() * 12
    
    shapes.push({
      type: shapeType,
      x: cx + Math.cos(angle) * dist,
      y: cy + Math.sin(angle) * dist,
      vx: Math.cos(angle + Math.PI / 4) * (3 + Math.random() * 2),
      vy: Math.sin(angle + Math.PI / 4) * (3 + Math.random() * 2),
      size,
      rotation: angle,
      rotationSpeed: (Math.random() - 0.5) * 0.2,
      scale: 0.8 + Math.random() * 0.4,
      color,
      life: 2 + Math.random() * 1,
      alpha: 0.6 + Math.random() * 0.4,
      fill: Math.random() > 0.5,
      lineWidth: 2 + Math.random() * 2
    })
  }
  console.log('[动画效果] 螺旋扩散效果执行完成，创建了30个形状')
}

/**
 * 脉冲效果
 * @param {Array} ripples - 涟漪数组
 * @param {string} color - 颜色
 */
export function effectPulse(ripples, color) {
  console.log('[动画效果] 开始执行脉冲效果，颜色:', color)
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
  console.log('[动画效果] 脉冲效果执行完成，创建了4个涟漪')
}

/**
 * 双螺旋 - 双螺旋形状
 * @param {Array} shapes - 形状数组
 * @param {string} color - 颜色
 */
export function effectSpiral2(shapes, color) {
  console.log('[动画效果] 开始执行双螺旋效果，颜色:', color)
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
  console.log('[动画效果] 双螺旋效果执行完成，创建了50个圆形')
}
