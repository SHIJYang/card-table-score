<template>
  <!-- Mikutap容器：全屏沉浸式体验的主容器 -->
  <div class="mikutap-container">
    <!-- 主画布：用于绘制所有视觉效果 -->
    <canvas ref="canvasRef" class="main-canvas" />
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { getMikutapCore, getAreaIndex, getAreaConfig } from '@/utils/mikutap/index.js'
import { getAudioEngine } from '@/utils/audio/audioEngine.js'

// 画布引用
const canvasRef = ref(null)
let canvas, ctx
let animationId

// 视觉元素数组
let shapes = []
let particles = []
let ripples = []
let texts = []

// 最后触发的区域索引
let lastAreaIndex = -1

// 背景颜色
const BG_COLOR = 'rgb(235, 248, 248)'

// 获取Mikutap核心实例
const mikutapCore = getMikutapCore()
const audioEngine = getAudioEngine()

/**
 * 初始化画布
 */
function initCanvas() {
  canvas = canvasRef.value
  ctx = canvas.getContext('2d')
  resizeCanvas()
  animate()
}

/**
 * 调整画布尺寸
 */
function resizeCanvas() {
  const dpr = window.devicePixelRatio || 1
  canvas.width = window.innerWidth * dpr
  canvas.height = window.innerHeight * dpr
  canvas.style.width = window.innerWidth + 'px'
  canvas.style.height = window.innerHeight + 'px'
  ctx.scale(dpr, dpr)
}

/**
 * 主动画循环
 */
function animate() {
  // 使用半透明青色背景创建拖尾效果
  ctx.fillStyle = 'rgba(136, 204, 204, 0.15)'
  ctx.fillRect(0, 0, window.innerWidth, window.innerHeight)

  updateRipples()
  updateShapes()
  updateParticles()
  updateTexts()

  animationId = requestAnimationFrame(animate)
}

/**
 * 更新和绘制涟漪效果
 */
function updateRipples() {
  ripples = ripples.filter(r => {
    r.radius += r.speed * 0.6
    r.alpha -= 0.008
    if (r.alpha <= 0) return false

    ctx.save()
    ctx.globalAlpha = r.alpha
    ctx.strokeStyle = r.color
    // 加粗线条
    ctx.lineWidth = r.lineWidth * 2
    ctx.lineCap = 'round'
    ctx.beginPath()
    ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2)
    ctx.stroke()
    ctx.restore()
    return true
  })
}

/**
 * 更新和绘制几何形状
 */
function updateShapes() {
  shapes = shapes.filter(s => {
    s.life -= 0.006
    s.scale *= 0.988
    s.rotation += s.rotationSpeed
    s.x += s.vx
    s.y += s.vy
    s.vx *= 0.985
    s.vy *= 0.985

    // 处理气泡的大小增长和透明度变化
    if (s.type === 'circle' && s.sizeGrowth && s.alphaFade) {
      s.size += s.sizeGrowth * s.size
      s.alpha -= s.alphaFade
    }

    if (s.life <= 0 || s.scale < 0.01 || s.alpha <= 0) return false

    ctx.save()
    ctx.globalAlpha = s.life * (s.alpha || 1)
    ctx.translate(s.x, s.y)
    ctx.rotate(s.rotation)
    ctx.scale(s.scale, s.scale)

    if (s.fill) {
      ctx.fillStyle = s.color
    } else {
      ctx.strokeStyle = s.color
      // 加粗线条
      ctx.lineWidth = (s.lineWidth || 3) * 2.5
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
    }

    // 处理波浪效果
    if (s.type === 'line' && s.waveAmplitude && s.waveFrequency) {
      // 更新波浪相位
      s.wavePhase = (s.wavePhase || 0) + 0.1
      
      // 绘制波浪线
      ctx.beginPath()
      const segments = 20
      const segmentLength = (s.size * 2) / segments
      
      for (let i = 0; i <= segments; i++) {
        const x = -s.size + (i * segmentLength)
        const y = Math.sin(x * s.waveFrequency + s.wavePhase) * s.waveAmplitude
        
        if (i === 0) {
          ctx.moveTo(x, y)
        } else {
          ctx.lineTo(x, y)
        }
      }
      
      ctx.stroke()
    } else {
      // 绘制普通形状
      drawShape(ctx, s)
    }

    ctx.restore()
    return true
  })
}

/**
 * 绘制单个形状
 */
function drawShape(ctx, s) {
  const size = s.size

  switch (s.type) {
    case 'circle':
      ctx.beginPath()
      ctx.arc(0, 0, size, 0, Math.PI * 2)
      s.fill ? ctx.fill() : ctx.stroke()
      break
    case 'rect':
      if (s.fill) {
        ctx.fillRect(-size, -size, size * 2, size * 2)
      } else {
        ctx.strokeRect(-size, -size, size * 2, size * 2)
      }
      break
    case 'triangle':
      ctx.beginPath()
      ctx.moveTo(0, -size)
      ctx.lineTo(size * 0.866, size * 0.5)
      ctx.lineTo(-size * 0.866, size * 0.5)
      ctx.closePath()
      s.fill ? ctx.fill() : ctx.stroke()
      break
    case 'star':
      drawStar(ctx, 0, 0, 5, size, size * 0.4, s.fill)
      break
    case 'cross':
      ctx.lineWidth = (s.lineWidth || 4) * 2
      ctx.beginPath()
      ctx.moveTo(-size, 0)
      ctx.lineTo(size, 0)
      ctx.moveTo(0, -size)
      ctx.lineTo(0, size)
      ctx.stroke()
      break
    case 'ring':
      ctx.beginPath()
      ctx.arc(0, 0, size, 0, Math.PI * 2)
      ctx.stroke()
      ctx.beginPath()
      ctx.arc(0, 0, size * 0.5, 0, Math.PI * 2)
      ctx.stroke()
      break
    case 'diamond':
      ctx.beginPath()
      ctx.moveTo(0, -size)
      ctx.lineTo(size * 0.6, 0)
      ctx.lineTo(0, size)
      ctx.lineTo(-size * 0.6, 0)
      ctx.closePath()
      s.fill ? ctx.fill() : ctx.stroke()
      break
    case 'hexagon':
      ctx.beginPath()
      for (let i = 0; i < 6; i++) {
        const a = (Math.PI / 3) * i - Math.PI / 2
        const px = Math.cos(a) * size
        const py = Math.sin(a) * size
        i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py)
      }
      ctx.closePath()
      s.fill ? ctx.fill() : ctx.stroke()
      break
    case 'line':
      ctx.lineWidth = (s.lineWidth || 6) * 2
      ctx.beginPath()
      ctx.moveTo(-size, 0)
      ctx.lineTo(size, 0)
      ctx.stroke()
      break
    case 'dot':
      ctx.beginPath()
      ctx.arc(0, 0, size * 0.3, 0, Math.PI * 2)
      ctx.fill()
      break
    case 'arc':
      ctx.beginPath()
      ctx.arc(0, 0, size, 0, Math.PI)
      ctx.stroke()
      break
  }
}

/**
 * 绘制五角星
 */
function drawStar(ctx, cx, cy, spikes, outer, inner, fill) {
  let rot = -Math.PI / 2
  const step = Math.PI / spikes
  ctx.beginPath()
  for (let i = 0; i < spikes * 2; i++) {
    const r = i % 2 === 0 ? outer : inner
    const x = cx + Math.cos(rot) * r
    const y = cy + Math.sin(rot) * r
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
    rot += step
  }
  ctx.closePath()
  fill ? ctx.fill() : ctx.stroke()
}

/**
 * 更新和绘制粒子效果
 */
function updateParticles() {
  particles = particles.filter(p => {
    p.x += p.vx * 0.7
    p.y += p.vy * 0.7
    p.vy += 0.08
    p.vx *= 0.995
    p.vy *= 0.995
    p.life -= 0.008
    p.size *= 0.985

    if (p.life <= 0 || p.size < 0.5) return false

    ctx.save()
    ctx.globalAlpha = p.life
    ctx.fillStyle = p.color
    ctx.beginPath()
    ctx.arc(p.x, p.y, p.size * 1.8, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
    return true
  })
}

/**
 * 更新和绘制浮动文本
 */
function updateTexts() {
  texts = texts.filter(t => {
    t.y -= 1
    t.life -= 0.008
    t.scale *= 1.003

    if (t.life <= 0) return false

    ctx.save()
    ctx.globalAlpha = t.life
    ctx.font = `bold ${Math.round(t.size * t.scale)}px Arial, sans-serif`
    ctx.fillStyle = t.color
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(t.char, t.x, t.y)
    ctx.restore()
    return true
  })
}

/**
 * 触发区域效果
 */
function trigger(areaIndex, x, y) {
  const config = getAreaConfig(areaIndex)
  if (!config) return

  // 初始化音频
  audioEngine.init()
  audioEngine.resume()

  // 播放音效
  mikutapCore.playSound(areaIndex)

  // 执行视觉效果
  const { effect, color } = config
  executeVisualEffect(effect, color)
}

/**
 * 执行视觉效果（动态导入）
 */
async function executeVisualEffect(effectName, color) {
  // 动态导入效果注册表
  const { getEffect } = await import('@/utils/visual/effectRegistry.js')
  const effectFn = getEffect(effectName)
  
  if (!effectFn) {
    console.warn('[ExecuteVisualEffect] 效果不存在:', effectName)
    return
  }
  
  // 直接操作数组，确保修改生效
  const paramCount = effectFn.length
  if (paramCount === 2) {
    // 简单效果: (targetArray, color)
    const nameLower = effectName.toLowerCase()
    if (nameLower.includes('burst') || nameLower.includes('scatter') || nameLower.includes('pulse')) {
      effectFn(ripples, color)
    } else if (nameLower.includes('dot')) {
      effectFn(particles, color)
    } else {
      effectFn(shapes, color)
    }
  } else if (paramCount === 3) {
    // 复合效果: (array1, array2, color)
    const nameLower = effectName.toLowerCase()
    if (nameLower.includes('firework')) {
      effectFn(particles, ripples, color)
    } else if (nameLower.includes('starfall') || nameLower.includes('bubble')) {
      effectFn(shapes, particles, color)
    } else {
      effectFn(ripples, particles, color)
    }
  } else {
    // 默认调用
    effectFn(shapes, particles, ripples, texts, color)
  }
}

// 事件处理函数
function handleMouseDown(e) {
  e.preventDefault()
  // 恢复音频上下文（处理浏览器自动播放策略）
  audioEngine.resume()
  const rect = canvas.getBoundingClientRect()
  const x = e.clientX - rect.left
  const y = e.clientY - rect.top
  const areaIndex = getAreaIndex(x, y)
  lastAreaIndex = areaIndex
  trigger(areaIndex, x, y)
}

function handleMouseMove(e) {
  // 恢复音频上下文（处理浏览器自动播放策略）
  audioEngine.resume()
  const rect = canvas.getBoundingClientRect()
  const x = e.clientX - rect.left
  const y = e.clientY - rect.top
  const areaIndex = getAreaIndex(x, y)
  if (areaIndex !== lastAreaIndex) {
    lastAreaIndex = areaIndex
    trigger(areaIndex, x, y)
  }
}

function handleMouseUp() {}

function handleTouchStart(e) {
  e.preventDefault()
  // 恢复音频上下文（处理浏览器自动播放策略）
  audioEngine.resume()
  const rect = canvas.getBoundingClientRect()
  for (let i = 0; i < e.touches.length; i++) {
    const x = e.touches[i].clientX - rect.left
    const y = e.touches[i].clientY - rect.top
    const areaIndex = getAreaIndex(x, y)
    lastAreaIndex = areaIndex
    trigger(areaIndex, x, y)
  }
}

function handleTouchMove(e) {
  e.preventDefault()
  // 恢复音频上下文（处理浏览器自动播放策略）
  audioEngine.resume()
  const rect = canvas.getBoundingClientRect()
  for (let i = 0; i < e.touches.length; i++) {
    const x = e.touches[i].clientX - rect.left
    const y = e.touches[i].clientY - rect.top
    const areaIndex = getAreaIndex(x, y)
    if (areaIndex !== lastAreaIndex) {
      lastAreaIndex = areaIndex
      trigger(areaIndex, x, y)
    }
  }
}

function handleTouchEnd(e) {
  e.preventDefault()
}

function handleKeyDown(e) {
  if (e.repeat) return
  // 恢复音频上下文（处理浏览器自动播放策略）
  audioEngine.resume()
  const x = Math.random() * window.innerWidth
  const y = Math.random() * window.innerHeight
  const areaIndex = getAreaIndex(x, y)
  lastAreaIndex = areaIndex
  trigger(areaIndex, x, y)
}

/**
 * 组件挂载
 */
onMounted(() => {
  // 初始化画布
  initCanvas()

  // 设置视觉上下文
  mikutapCore.setVisualContext({ shapes, particles, ripples, texts })

  // 加载默认音效包 - 使用动态导入
  const loadDefaultSoundPack = async () => {
    try {
      // 使用动态导入加载本地 JSON 文件
      const soundPackModule = await import('@/assets/Mikutap.json')
      const soundPackData = soundPackModule.default || soundPackModule
      
      // 直接加载数据到 soundPackManager
      const success = await mikutapCore.soundPackManager.loadMikutapPackData(soundPackData)
      
      if (success) {
        console.log('[Music] 音效包加载成功')
        mikutapCore.currentSoundPack = 'mikutap_main'
      } else {
        console.log('[Music] 音效包加载失败，使用默认合成音效')
      }
    } catch (err) {
      console.log('[Music] 音效包加载出错，使用默认合成音效:', err.message)
    }
  }
  
  loadDefaultSoundPack()

  // 添加事件监听
  window.addEventListener('resize', resizeCanvas)
  canvas.addEventListener('mousedown', handleMouseDown)
  canvas.addEventListener('mousemove', handleMouseMove)
  canvas.addEventListener('mouseup', handleMouseUp)
  canvas.addEventListener('touchstart', handleTouchStart, { passive: false })
  canvas.addEventListener('touchmove', handleTouchMove, { passive: false })
  canvas.addEventListener('touchend', handleTouchEnd, { passive: false })
  window.addEventListener('keydown', handleKeyDown)
})

/**
 * 组件卸载
 */
onUnmounted(() => {
  if (animationId) cancelAnimationFrame(animationId)
  
  window.removeEventListener('resize', resizeCanvas)
  canvas.removeEventListener('mousedown', handleMouseDown)
  canvas.removeEventListener('mousemove', handleMouseMove)
  canvas.removeEventListener('mouseup', handleMouseUp)
  canvas.removeEventListener('touchstart', handleTouchStart)
  canvas.removeEventListener('touchmove', handleTouchMove)
  canvas.removeEventListener('touchend', handleTouchEnd)
  window.removeEventListener('keydown', handleKeyDown)
})
</script>

<style scoped>
.mikutap-container {
  position: fixed;

  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgb(235, 248, 248);
  overflow: hidden;
  touch-action: none;
}

.main-canvas {
  position: absolute;

  left: 0;
  width: 100%;
  height: 100%;
  cursor: crosshair;
}
</style>
