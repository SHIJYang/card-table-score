/**
 * 粒子类视觉效果
 * 包含各种粒子系统效果
 */

// 导入GSAP
import { gsap } from 'gsap'

/**
 * 烟花效果 - 增强版
 * @param {Array} particles - 粒子数组
 * @param {Array} ripples - 涟漪数组
 * @param {string} color - 颜色
 */
export function effectFirework(particles, ripples, color) {
  console.log('[动画效果] 开始执行烟花效果，颜色:', color)
  const cx = window.innerWidth / 2
  const cy = window.innerHeight / 2
  
  // 中心涟漪 - 增强效果
  for (let i = 0; i < 3; i++) {
    ripples.push({
      x: cx, y: cy,
      radius: 10 + i * 15,
      speed: 6 + i * 2,
      color,
      alpha: 1 - i * 0.2,
      lineWidth: 8 - i * 2
    })
  }
  
  // 主爆炸粒子 - 增加数量和大小
  for (let i = 0; i < 50; i++) {
    const angle = (Math.PI * 2 / 50) * i + Math.random() * 0.3
    const speed = 5 + Math.random() * 8
    particles.push({
      x: cx, y: cy,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      size: 4 + Math.random() * 6,
      color,
      life: 2 + Math.random() * 1
    })
  }
  
  // 二次爆炸粒子 - 增加数量和大小
  for (let i = 0; i < 25; i++) {
    const angle = (Math.PI * 2 / 25) * i + Math.random() * 0.2
    const speed = 3 + Math.random() * 4
    particles.push({
      x: cx + Math.cos(angle) * 60,
      y: cy + Math.sin(angle) * 60,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      size: 5 + Math.random() * 5,
      color,
      life: 1.5 + Math.random() * 0.5
    })
  }
  
  // 三次小爆炸粒子 - 新增
  for (let i = 0; i < 20; i++) {
    const angle = (Math.PI * 2 / 20) * i + Math.random() * 0.4
    const speed = 2 + Math.random() * 3
    particles.push({
      x: cx + Math.cos(angle) * 100,
      y: cy + Math.sin(angle) * 100,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      size: 3 + Math.random() * 4,
      color,
      life: 1 + Math.random() * 0.5
    })
  }
  
  console.log('[动画效果] 烟花效果执行完成，创建了3个涟漪和95个粒子')
}

/**
 * 气泡效果 - 重新设计
 * @param {Array} shapes - 形状数组
 * @param {Array} particles - 粒子数组
 * @param {string} color - 颜色
 */
export function effectBubble(shapes, particles, color) {
  console.log('[动画效果] 开始执行气泡效果，颜色:', color)
  const cx = window.innerWidth / 2
  const cy = window.innerHeight / 2
  const bubbleCount = 25
  
  for (let i = 0; i < bubbleCount; i++) {
    // 随机参数
    const angle = Math.random() * Math.PI * 2
    const dist = 20 + Math.random() * 100
    const size = 5 + Math.random() * 12
    const speed = 0.5 + Math.random() * 2
    const randomness = (Math.random() - 0.5) * 0.5
    
    // 创建气泡
    shapes.push({
      type: 'circle',
      x: cx + Math.cos(angle) * dist,
      y: cy + Math.sin(angle) * dist,
      vx: Math.cos(angle) * speed * 0.5 + randomness,
      vy: Math.sin(angle) * speed * 0.5 - (1 + Math.random() * 1.5),
      size,
      rotation: 0,
      rotationSpeed: (Math.random() - 0.5) * 0.03,
      scale: 0.5 + Math.random() * 0.5,
      color,
      life: 3 + Math.random() * 2,
      alpha: 0.4 + Math.random() * 0.4,
      fill: Math.random() > 0.3,
      lineWidth: 1 + Math.random() * 2,
      // 额外的动画参数
      initialSize: size,
      sizeGrowth: 0.02 + Math.random() * 0.03,
      alphaFade: 0.005 + Math.random() * 0.005
    })
  }
  
  // 添加一些小粒子作为气泡的轨迹
  for (let i = 0; i < 15; i++) {
    particles.push({
      x: cx + (Math.random() - 0.5) * 100,
      y: cy + (Math.random() - 0.5) * 100,
      vx: (Math.random() - 0.5) * 2,
      vy: -1 - Math.random() * 3,
      size: 1 + Math.random() * 2,
      color,
      life: 1 + Math.random() * 1
    })
  }
  
  console.log('[动画效果] 气泡效果执行完成，创建了', bubbleCount, '个气泡和15个轨迹粒子')
}

/**
 * 雪花效果
 * @param {Array} shapes - 形状数组
 * @param {string} color - 颜色
 */
export function effectSnow(shapes, color) {
  console.log('[动画效果] 开始执行雪花效果，颜色:', color)
  const cx = window.innerWidth / 2
  const cy = window.innerHeight / 2
  
  for (let i = 0; i < 20; i++) {
    const x = cx + (Math.random() - 0.5) * 300
    const y = cy - 100 - Math.random() * 100
    
    shapes.push({
      type: 'star',
      x, y,
      vx: (Math.random() - 0.5) * 1,
      vy: (Math.random() - 0.5) * 1,
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
  console.log('[动画效果] 雪花效果执行完成，创建了20个雪花')
}

/**
 * 彩纸效果
 * @param {Array} shapes - 形状数组
 * @param {string} color - 颜色
 */
export function effectConfetti(shapes, color) {
  console.log('[动画效果] 开始执行彩纸效果，颜色:', color)
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
  console.log('[动画效果] 彩纸效果执行完成，创建了25个彩纸')
}

/**
 * 像素效果
 * @param {Array} shapes - 形状数组
 * @param {string} color - 颜色
 */
export function effectPixel(shapes, color) {
  console.log('[动画效果] 开始执行像素效果，颜色:', color)
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
  console.log('[动画效果] 像素效果执行完成，创建了30个像素')
}

/**
 * 星落效果
 * @param {Array} shapes - 形状数组
 * @param {Array} particles - 粒子数组
 * @param {string} color - 颜色
 */
export function effectStarfall(shapes, particles, color) {
  console.log('[动画效果] 开始执行星落效果，颜色:', color)
  const cx = window.innerWidth / 2
  const cy = window.innerHeight / 2
  
  // 创建星星
  for (let i = 0; i < 15; i++) {
    const angle = (Math.PI * 2 / 15) * i
    const dist = 50 + Math.random() * 100
    
    shapes.push({
      type: 'star',
      x: cx + Math.cos(angle) * dist,
      y: cy + Math.sin(angle) * dist,
      vx: Math.cos(angle + Math.PI / 2) * 3,
      vy: Math.sin(angle + Math.PI / 2) * 3,
      size: 15 + Math.random() * 12, // 增大星星尺寸
      rotation: angle,
      rotationSpeed: 0.1,
      scale: 1,
      color,
      life: 1.5, // 延长生命周期
      alpha: 1,
      fill: true,
      lineWidth: 2
    })
  }
  
  console.log('[动画效果] 星落效果执行完成，创建了15个大型星星')
}

/**
 * 闪电效果
 * @param {Array} shapes - 形状数组
 * @param {string} color - 颜色
 */
/**
 * 菱形爆发 - 从中心向外爆发的菱形
 * @param {Array} shapes - 形状数组
 * @param {string} color - 颜色
 */
export function effectLightning(shapes, color) {
  console.log('[动画效果] 开始执行菱形爆发效果，颜色:', color)
  const cx = window.innerWidth / 2
  const cy = window.innerHeight / 2
  
  for (let i = 0; i < 25; i++) {
    const angle = (Math.PI * 2 / 25) * i
    const dist = 25 + i * 6
    const size = 10 + Math.random() * 12
    const speed = 3 + Math.random() * 2
    
    shapes.push({
      type: 'diamond',
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
      fill: Math.random() > 0.5,
      lineWidth: 2 + Math.random() * 2
    })
  }
  console.log('[动画效果] 菱形爆发效果执行完成，创建了25个菱形')
}

/**
 * 使用GSAP实现的流畅粒子效果
 * @param {Array} particles - 粒子数组
 * @param {Array} shapes - 形状数组
 * @param {string} color - 颜色
 */
export function effectGSAP(particles, shapes, color) {
  console.log('[动画效果] 开始执行GSAP流畅动画效果，颜色:', color)
  const cx = window.innerWidth / 2
  const cy = window.innerHeight / 2
  
  // 创建主时间线
  const mainTimeline = gsap.timeline()
  
  // 1. 中心爆炸效果
  for (let i = 0; i < 20; i++) {
    const angle = (Math.PI * 2 / 20) * i
    const distance = 100 + Math.random() * 150
    
    const particle = {
      x: cx, y: cy,
      vx: 0, vy: 0,
      size: 3 + Math.random() * 5,
      color,
      life: 1.5,
      alpha: 1
    }
    
    particles.push(particle)
    
    // 使用GSAP动画
    gsap.to(particle, {
      x: cx + Math.cos(angle) * distance,
      y: cy + Math.sin(angle) * distance,
      alpha: 0,
      size: 0,
      duration: 1.5,
      ease: 'power2.out',
      onComplete: () => {
        // 移除粒子
        const index = particles.indexOf(particle)
        if (index > -1) {
          particles.splice(index, 1)
        }
      }
    })
  }
  
  // 2. 形状动画
  for (let i = 0; i < 15; i++) {
    const types = ['circle', 'star', 'rect']
    const shape = {
      type: types[Math.floor(Math.random() * types.length)],
      x: cx,
      y: cy,
      vx: 0, vy: 0,
      size: 10 + Math.random() * 15,
      rotation: 0,
      rotationSpeed: 0,
      scale: 0,
      color,
      life: 2,
      alpha: 1,
      fill: Math.random() > 0.5,
      lineWidth: 2
    }
    
    shapes.push(shape)
    
    // 使用GSAP动画
    gsap.timeline()
      .to(shape, {
        scale: 1,
        duration: 0.3,
        ease: 'back.out(1.7)'
      })
      .to(shape, {
        x: cx + (Math.random() - 0.5) * 300,
        y: cy + (Math.random() - 0.5) * 300,
        rotation: Math.PI * 2 * (Math.random() > 0.5 ? 1 : -1),
        alpha: 0,
        duration: 1.7,
        ease: 'power2.out',
        onComplete: () => {
          // 移形状
          const index = shapes.indexOf(shape)
          if (index > -1) {
            shapes.splice(index, 1)
          }
        }
      })
  }
  
  // 3. 脉冲效果
  for (let i = 0; i < 3; i++) {
    const ripple = {
      type: 'circle',
      x: cx,
      y: cy,
      vx: 0, vy: 0,
      size: 10,
      rotation: 0,
      rotationSpeed: 0,
      scale: 1,
      color,
      life: 1.5,
      alpha: 1,
      fill: false,
      lineWidth: 3
    }
    
    shapes.push(ripple)
    
    // 使用GSAP动画
    gsap.to(ripple, {
      size: 200 + i * 100,
      alpha: 0,
      lineWidth: 0,
      duration: 1.5,
      delay: i * 0.2,
      ease: 'power2.out',
      onComplete: () => {
        // 移形状
        const index = shapes.indexOf(ripple)
        if (index > -1) {
          shapes.splice(index, 1)
        }
      }
    })
  }
  console.log('[动画效果] GSAP流畅动画效果执行完成，创建了20个粒子、15个形状和3个脉冲')
}
