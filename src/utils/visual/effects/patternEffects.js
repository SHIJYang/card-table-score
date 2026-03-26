/**
 * 图案类视觉效果
 * 包含各种几何图案和对称效果
 */

/**
 * 花朵图案 - 旋转的花朵形状
 * @param {Array} shapes - 形状数组
 * @param {string} color - 颜色
 */
export function effectFlower(shapes, color) {
  const cx = window.innerWidth / 2
  const cy = window.innerHeight / 2
  
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI * 2 / 6) * i
    for (let j = 0; j < 3; j++) {
      const dist = 30 + j * 40
      shapes.push({
        type: 'circle',
        x: cx + Math.cos(angle) * dist,
        y: cy + Math.sin(angle) * dist,
        vx: Math.cos(angle) * (3 - j),
        vy: Math.sin(angle) * (3 - j),
        size: 15 - j * 3,
        rotation: 0,
        rotationSpeed: 0.1,
        scale: 1,
        color,
        life: 1.2,
        alpha: 1 - j * 0.2,
        fill: true,
        lineWidth: 3
      })
    }
  }
}

/**
 * 六边形阵列 - 六边形网格
 * @param {Array} shapes - 形状数组
 * @param {string} color - 颜色
 */
export function effectHex(shapes, color) {
  const cx = window.innerWidth / 2
  const cy = window.innerHeight / 2
  
  for (let ring = 0; ring < 3; ring++) {
    const count = 6 + ring * 6
    const radius = 40 + ring * 50
    
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 / count) * i
      shapes.push({
        type: 'hexagon',
        x: cx + Math.cos(angle) * radius,
        y: cy + Math.sin(angle) * radius,
        vx: Math.cos(angle) * 2,
        vy: Math.sin(angle) * 2,
        size: 15 + ring * 5,
        rotation: angle,
        rotationSpeed: (Math.random() - 0.5) * 0.1,
        scale: 1,
        color,
        life: 1,
        alpha: 1 - ring * 0.2,
        fill: ring % 2 === 0,
        lineWidth: 3
      })
    }
  }
}

/**
 * 三角形阵列 - 三角形环绕
 * @param {Array} shapes - 形状数组
 * @param {string} color - 颜色
 */
export function effectTriangle(shapes, color) {
  const cx = window.innerWidth / 2
  const cy = window.innerHeight / 2
  
  for (let ring = 0; ring < 3; ring++) {
    const count = 6 + ring * 3
    const radius = 50 + ring * 60
    
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 / count) * i
      shapes.push({
        type: 'triangle',
        x: cx + Math.cos(angle) * radius,
        y: cy + Math.sin(angle) * radius,
        vx: Math.cos(angle) * 2,
        vy: Math.sin(angle) * 2,
        size: 12 + ring * 4,
        rotation: angle,
        rotationSpeed: 0.15,
        scale: 1,
        color,
        life: 1,
        alpha: 1 - ring * 0.2,
        fill: ring % 2 === 0,
        lineWidth: 3
      })
    }
  }
}

/**
 * 圆环阵列 - 多层圆环
 * @param {Array} shapes - 形状数组
 * @param {string} color - 颜色
 */
export function effectCircle(shapes, color) {
  const cx = window.innerWidth / 2
  const cy = window.innerHeight / 2
  
  for (let ring = 0; ring < 4; ring++) {
    const count = 8 + ring * 4
    const radius = 50 + ring * 50
    
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 / count) * i
      shapes.push({
        type: 'circle',
        x: cx + Math.cos(angle) * radius,
        y: cy + Math.sin(angle) * radius,
        vx: Math.cos(angle) * 1.5,
        vy: Math.sin(angle) * 1.5,
        size: 8 + ring * 3,
        rotation: 0,
        rotationSpeed: 0.1,
        scale: 1,
        color,
        life: 1,
        alpha: 1 - ring * 0.15,
        fill: ring % 2 === 0,
        lineWidth: 3
      })
    }
  }
}

/**
 * 线条爆发 - 从中心爆发的线条
 * @param {Array} shapes - 形状数组
 * @param {string} color - 颜色
 */
export function effectLine(shapes, color) {
  const cx = window.innerWidth / 2
  const cy = window.innerHeight / 2
  
  for (let i = 0; i < 10; i++) {
    const angle = (Math.PI * 2 / 10) * i
    shapes.push({
      type: 'line',
      x: cx, y: cy,
      vx: Math.cos(angle) * 3,
      vy: Math.sin(angle) * 3,
      size: 40 + Math.random() * 30,
      rotation: angle,
      rotationSpeed: 0,
      scale: 1,
      color,
      life: 0.9,
      alpha: 1,
      fill: false,
      lineWidth: 5
    })
  }
}

/**
 * 弧线扩散 - 扩散的弧线
 * @param {Array} shapes - 形状数组
 * @param {string} color - 颜色
 */
export function effectArc(shapes, color) {
  const cx = window.innerWidth / 2
  const cy = window.innerHeight / 2
  
  for (let i = 0; i < 8; i++) {
    const startAngle = (Math.PI * 2 / 8) * i
    shapes.push({
      type: 'arc',
      x: cx, y: cy,
      vx: 0, vy: 0,
      size: 30 + i * 25,
      rotation: startAngle,
      rotationSpeed: 0.05 * (i % 2 === 0 ? 1 : -1),
      scale: 1,
      color,
      life: 1.2,
      alpha: 1 - i * 0.1,
      fill: false,
      lineWidth: 5 - i * 0.4
    })
  }
}

/**
 * 圆环效果
 * @param {Array} shapes - 形状数组
 * @param {string} color - 颜色
 */
export function effectRing(shapes, color) {
  const cx = window.innerWidth / 2
  const cy = window.innerHeight / 2
  
  for (let i = 0; i < 5; i++) {
    shapes.push({
      type: 'ring',
      x: cx, y: cy,
      vx: 0, vy: 0,
      size: 20 + i * 30,
      rotation: 0,
      rotationSpeed: (Math.random() - 0.5) * 0.1,
      scale: 1,
      color,
      life: 1,
      alpha: 0.9 - i * 0.15,
      fill: false,
      lineWidth: 4
    })
  }
}

/**
 * 放射线 - 从中心向外的放射线条
 * @param {Array} shapes - 形状数组
 * @param {string} color - 颜色
 */
export function effectFlash(shapes, color) {
  const cx = window.innerWidth / 2
  const cy = window.innerHeight / 2
  
  for (let i = 0; i < 12; i++) {
    const angle = (Math.PI * 2 / 12) * i
    shapes.push({
      type: 'line',
      x: cx, y: cy,
      vx: Math.cos(angle) * 4,
      vy: Math.sin(angle) * 4,
      size: 60 + Math.random() * 40,
      rotation: angle,
      rotationSpeed: 0,
      scale: 1,
      color,
      life: 0.6,
      alpha: 1,
      fill: false,
      lineWidth: 3
    })
  }
}
