<template>
  <!-- Mikutap容器：全屏沉浸式体验的主容器 -->
  <div class="mikutap-container">
    <!-- 主画布：用于绘制所有视觉效果 -->
    <canvas ref="canvasRef" class="main-canvas" />
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

// 画布引用：用于访问DOM中的canvas元素
const canvasRef = ref(null)
// canvas元素和2D绘图上下文
let canvas, ctx
// 动画帧ID：用于取消动画循环
let animationId
// 形状数组：存储所有动态绘制的几何形状
let shapes = []
// 粒子数组：存储所有粒子效果
let particles = []
// 涟漪数组：存储所有涟漪效果
let ripples = []
// 文本数组：存储所有浮动文本
let texts = []
// 最后触发的区域索引：防止同一区域重复触发
let lastAreaIndex = -1

// 背景颜色：青绿色，营造清新的视觉效果
const BG_COLOR = '#8cc'

// 网格列数：将画布分为5列
const COLS = 5
// 网格行数：将画布分为6行
const ROWS = 6
// 总区域数：5列×6行=30个独立区域
const TOTAL_AREAS = COLS * ROWS

// 区域颜色数组：每个区域对应的独特颜色，覆盖整个色轮
const AREA_COLORS = [
  '#FF0000', '#FF4500', '#FF8C00', '#FFD700', '#FFFF00',  // 红橙黄渐变
  '#ADFF2F', '#00FF00', '#00FA9A', '#00CED1', '#00BFFF',  // 绿青蓝渐变
  '#1E90FF', '#0000FF', '#8A2BE2', '#9400D3', '#FF00FF',  // 蓝紫粉渐变
  '#FF1493', '#FF69B4', '#DC143C', '#B22222', '#8B0000',  // 深粉红渐变
  '#FF6347', '#FF7F50', '#FFA07A', '#FFDAB9', '#FFE4B5',  // 暖色调渐变
  '#E6E6FA', '#D8BFD8', '#DDA0DD', '#EE82EE', '#DA70D6',  // 紫丁香渐变
]

// 区域音符数组：每个区域对应的音频频率（Hz），构成和谐的音阶
const AREA_NOTES = [
  262, 277, 294, 311, 330,   // C4, C#4, D4, D#4, E4
  349, 370, 392, 415, 440,   // F4, F#4, G4, G#4, A4
  466, 494, 523, 554, 587,   // A#4, B4, C5, C#5, D5
  622, 659, 698, 740, 784,   // D#5, E5, F5, F#5, G5
  831, 880, 932, 988, 1047,  // G#5, A5, A#5, B5, C6
  1109, 1175, 1245, 1319, 1397, // C#6, D6, D#6, E6, F6
]

// 区域效果数组：每个区域对应的独特视觉效果名称
const AREA_EFFECTS = [
  'burst', 'spiral', 'wave', 'explosion', 'scatter',  // 爆发、螺旋、波浪、爆炸、散射
  'rain', 'flower', 'flash', 'firework', 'vortex',   // 雨滴、花朵、闪光、烟花、漩涡
  'meteor', 'bubble', 'lightning', 'snow', 'confetti', // 流星、气泡、闪电、雪花、彩纸
  'pixel', 'ring', 'starfall', 'pulse', 'tornado',   // 像素、圆环、星落、脉冲、龙卷风
  'diamond', 'hex', 'cross', 'triangle', 'circle',   // 钻石、六边形、十字、三角、圆形
  'square', 'line', 'dot', 'arc', 'spiral2',        // 方块、线条、点、弧线、双螺旋
]

// 音频上下文：用于Web Audio API的核心对象
let audioContext
// 主音量增益节点：控制整体音量
let masterGain

/**
 * 初始化音频系统
 * 创建音频上下文和主音量节点，确保音频系统只初始化一次
 */
function initAudio() {
  if (!audioContext) {
    // 创建音频上下文，兼容不同浏览器
    audioContext = new (window.AudioContext || window.webkitAudioContext)()
    // 创建主音量增益节点
    masterGain = audioContext.createGain()
    // 设置主音量为0.4，避免音量过大
    masterGain.gain.value = 0.4
    // 连接到音频输出设备
    masterGain.connect(audioContext.destination)
  }
}

/**
 * 播放指定区域的音效
 * @param {number} noteIndex - 区域索引，用于选择对应的音符
 */
function playSound(noteIndex) {
  if (!audioContext) return
  // 如果音频上下文被暂停，恢复它
  if (audioContext.state === 'suspended') {
    audioContext.resume()
  }

  // 获取对应区域的音符频率
  const freq = AREA_NOTES[noteIndex % TOTAL_AREAS]
  const now = audioContext.currentTime

  // 创建第一个振荡器（正弦波主音）
  const osc = audioContext.createOscillator()
  const gain = audioContext.createGain()
  const filter = audioContext.createBiquadFilter()

  // 配置正弦波振荡器
  osc.type = 'sine'
  osc.frequency.setValueAtTime(freq, now)

  // 配置低通滤波器，过滤高频杂音
  filter.type = 'lowpass'
  filter.frequency.setValueAtTime(2000, now)

  // 配置音量包络：快速上升后缓慢衰减
  gain.gain.setValueAtTime(0, now)
  gain.gain.linearRampToValueAtTime(0.3, now + 0.01)
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4)

  // 连接音频节点链
  osc.connect(filter)
  filter.connect(gain)
  gain.connect(masterGain)

  // 启动和停止振荡器
  osc.start(now)
  osc.stop(now + 0.5)

  // 创建第二个振荡器（三角波泛音，增加音色丰富度）
  const osc2 = audioContext.createOscillator()
  const gain2 = audioContext.createGain()
  // 三角波，频率是主音的2倍（高八度）
  osc2.type = 'triangle'
  osc2.frequency.setValueAtTime(freq * 2, now)
  // 配置音量包络：快速上升后快速衰减
  gain2.gain.setValueAtTime(0, now)
  gain2.gain.linearRampToValueAtTime(0.12, now + 0.01)
  gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.25)
  // 连接到主音量节点
  osc2.connect(gain2)
  gain2.connect(masterGain)
  // 启动和停止第二个振荡器
  osc2.start(now)
  osc2.stop(now + 0.35)
}

/**
 * 初始化画布
 * 获取canvas元素和2D绘图上下文，调整画布尺寸并启动动画循环
 */
function initCanvas() {
  // 获取canvas DOM元素
  canvas = canvasRef.value
  // 获取2D绘图上下文，用于绘制所有视觉效果
  ctx = canvas.getContext('2d')
  // 调整画布尺寸以适配窗口
  resizeCanvas()
  // 启动动画循环
  animate()
}

/**
 * 调整画布尺寸
 * 根据窗口大小和设备像素比调整画布，确保高清显示
 */
function resizeCanvas() {
  // 获取设备像素比，用于高清屏幕适配
  const dpr = window.devicePixelRatio || 1
  // 设置画布的实际像素尺寸（内部）
  canvas.width = window.innerWidth * dpr
  canvas.height = window.innerHeight * dpr
  // 设置画布的CSS显示尺寸
  canvas.style.width = window.innerWidth + 'px'
  canvas.style.height = window.innerHeight + 'px'
  // 缩放绘图上下文，匹配设备像素比
  ctx.scale(dpr, dpr)
}

/**
 * 主动画循环函数
 * 每帧清除画布并更新所有视觉效果
 */
function animate() {
  // 填充背景色，清除上一帧的内容
  ctx.fillStyle = BG_COLOR
  ctx.fillRect(0, 0, window.innerWidth, window.innerHeight)

  // 按顺序更新所有视觉效果（从底层到上层）
  updateRipples()    // 更新涟漪效果
  updateShapes()     // 更新几何形状
  updateParticles()  // 更新粒子效果
  updateTexts()      // 更新浮动文本

  // 请求下一帧动画，形成循环
  animationId = requestAnimationFrame(animate)
}

/**
 * 更新和绘制涟漪效果
 * 过滤掉透明度为0的涟漪，更新剩余涟漪的状态并绘制
 */
function updateRipples() {
  // 使用filter方法过滤并更新涟漪
  ripples = ripples.filter(r => {
    // 增大涟漪半径
    r.radius += r.speed * 0.6
    // 降低透明度
    r.alpha -= 0.008
    // 如果透明度为0，移除该涟漪
    if (r.alpha <= 0) return false

    // 保存当前绘图状态
    ctx.save()
    // 设置透明度
    ctx.globalAlpha = r.alpha
    // 设置描边颜色
    ctx.strokeStyle = r.color
    // 设置线宽（加粗1.5倍）
    ctx.lineWidth = r.lineWidth * 1.5
    // 开始绘制圆形
    ctx.beginPath()
    ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2)
    // 描边
    ctx.stroke()
    // 恢复之前的绘图状态
    ctx.restore()
    // 保留该涟漪
    return true
  })
}

/**
 * 更新和绘制所有几何形状
 * 更新形状的位置、旋转、缩放等属性，并根据类型绘制不同的形状
 */
function updateShapes() {
  shapes = shapes.filter(s => {
    // 减少生命值
    s.life -= 0.006
    // 缩小尺寸
    s.scale *= 0.988
    // 增加旋转角度
    s.rotation += s.rotationSpeed
    // 更新位置（应用速度）
    s.x += s.vx
    s.y += s.vy
    // 速度衰减（模拟摩擦力）
    s.vx *= 0.985
    s.vy *= 0.985

    // 如果生命值耗尽或尺寸太小，移除该形状
    if (s.life <= 0 || s.scale < 0.01) return false

    // 保存绘图状态
    ctx.save()
    // 设置透明度
    ctx.globalAlpha = s.life * s.alpha
    // 移动坐标系到形状中心
    ctx.translate(s.x, s.y)
    // 旋转坐标系
    ctx.rotate(s.rotation)
    // 缩放坐标系
    ctx.scale(s.scale, s.scale)

    // 设置填充或描边样式
    if (s.fill) {
      ctx.fillStyle = s.color
    } else {
      ctx.strokeStyle = s.color
      // 线宽加倍，让效果更明显
      ctx.lineWidth = (s.lineWidth || 3) * 2
    }

    const size = s.size

    switch (s.type) {
      case 'circle':
        ctx.beginPath()
        ctx.arc(0, 0, size, 0, Math.PI * 2)
        s.fill ? ctx.fill() : ctx.stroke()
        break
      case 'rect':
        s.fill ? ctx.fillRect(-size, -size, size * 2, size * 2) : ctx.strokeRect(-size, -size, size * 2, size * 2)
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
        ctx.lineWidth = s.lineWidth || 4
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
        ctx.lineWidth = s.lineWidth || 6
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

    ctx.restore()
    return true
  })
}

/**
 * 绘制五角星
 * @param {CanvasRenderingContext2D} ctx - 绘图上下文
 * @param {number} cx - 中心点x坐标
 * @param {number} cy - 中心点y坐标
 * @param {number} spikes - 角的数量
 * @param {number} outer - 外圆半径
 * @param {number} inner - 内圆半径
 * @param {boolean} fill - 是否填充
 */
function drawStar(ctx, cx, cy, spikes, outer, inner, fill) {
  // 起始角度（指向正上方）
  let rot = -Math.PI / 2
  // 每个角的角度间隔
  const step = Math.PI / spikes
  // 开始绘制路径
  ctx.beginPath()
  // 交替连接外圆和内圆上的点
  for (let i = 0; i < spikes * 2; i++) {
    const r = i % 2 === 0 ? outer : inner
    const x = cx + Math.cos(rot) * r
    const y = cy + Math.sin(rot) * r
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
    rot += step
  }
  // 闭合路径
  ctx.closePath()
  // 填充或描边
  fill ? ctx.fill() : ctx.stroke()
}

/**
 * 更新和绘制粒子效果
 * 更新粒子的位置、速度、大小等属性，并绘制为圆形
 */
function updateParticles() {
  particles = particles.filter(p => {
    // 更新位置
    p.x += p.vx * 0.7
    p.y += p.vy * 0.7
    // 应用重力（y方向加速度）
    p.vy += 0.08
    // 速度衰减
    p.vx *= 0.995
    p.vy *= 0.995
    // 减少生命值
    p.life -= 0.008
    // 缩小尺寸
    p.size *= 0.985

    // 如果生命值耗尽或尺寸太小，移除该粒子
    if (p.life <= 0 || p.size < 0.5) return false

    // 保存绘图状态
    ctx.save()
    // 设置透明度
    ctx.globalAlpha = p.life
    // 设置填充颜色
    ctx.fillStyle = p.color
    // 绘制圆形粒子
    ctx.beginPath()
    ctx.arc(p.x, p.y, p.size * 1.5, 0, Math.PI * 2)
    ctx.fill()
    // 恢复绘图状态
    ctx.restore()
    return true
  })
}

/**
 * 更新和绘制浮动文本
 * 文本向上漂浮、逐渐变大并淡出
 */
function updateTexts() {
  texts = texts.filter(t => {
    // 向上移动
    t.y -= 1
    // 减少生命值
    t.life -= 0.008
    // 逐渐变大
    t.scale *= 1.003

    // 如果生命值耗尽，移除该文本
    if (t.life <= 0) return false

    // 保存绘图状态
    ctx.save()
    // 设置透明度
    ctx.globalAlpha = t.life
    // 设置字体
    ctx.font = `bold ${Math.round(t.size * t.scale)}px Arial, sans-serif`
    // 设置颜色
    ctx.fillStyle = t.color
    // 文本居中对齐
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    // 绘制文本
    ctx.fillText(t.char, t.x, t.y)
    // 恢复绘图状态
    ctx.restore()
    return true
  })
}

/**
 * 根据坐标获取区域索引
 * 将画布分为COLS列×ROWS行的网格，返回坐标所在网格的索引
 * @param {number} x - x坐标
 * @param {number} y - y坐标
 * @returns {number} 区域索引（0到TOTAL_AREAS-1）
 */
function getAreaIndex(x, y) {
  // 计算每个单元格的宽度
  const cellW = window.innerWidth / COLS
  // 计算每个单元格的高度
  const cellH = window.innerHeight / ROWS
  // 计算列索引，限制在有效范围内
  const col = Math.min(Math.max(Math.floor(x / cellW), 0), COLS - 1)
  // 计算行索引，限制在有效范围内
  const row = Math.min(Math.max(Math.floor(y / cellH), 0), ROWS - 1)
  // 返回一维索引
  return row * COLS + col
}

/**
 * 触发指定区域的视觉和音频效果
 * @param {number} areaIndex - 区域索引
 * @param {number} x - 触发点x坐标
 * @param {number} y - 触发点y坐标
 */
function trigger(areaIndex, x, y) {
  // 初始化音频系统
  initAudio()

  // 获取该区域对应的颜色
  const color = AREA_COLORS[areaIndex % AREA_COLORS.length]
  // 获取该区域对应的效果名称
  const effect = AREA_EFFECTS[areaIndex % AREA_EFFECTS.length]

  // 播放该区域的音效
  playSound(areaIndex)

  // 根据效果名称调用对应的效果函数
  switch (effect) {
    case 'burst': effectBurst(color); break
    case 'spiral': effectSpiral(color); break
    case 'wave': effectWave(color); break
    case 'explosion': effectExplosion(color); break
    case 'scatter': effectScatter(color); break
    case 'rain': effectRain(color); break
    case 'flower': effectFlower(color); break
    case 'flash': effectFlash(color); break
    case 'firework': effectFirework(color); break
    case 'vortex': effectVortex(color); break
    case 'meteor': effectMeteor(color); break
    case 'bubble': effectBubble(color); break
    case 'lightning': effectLightning(color); break
    case 'snow': effectSnow(color); break
    case 'confetti': effectConfetti(color); break
    case 'pixel': effectPixel(color); break
    case 'ring': effectRing(color); break
    case 'starfall': effectStarfall(color); break
    case 'pulse': effectPulse(color); break
    case 'tornado': effectTornado(color); break
    case 'diamond': effectDiamond(color); break
    case 'hex': effectHex(color); break
    case 'cross': effectCross(color); break
    case 'triangle': effectTriangle(color); break
    case 'circle': effectCircle(color); break
    case 'square': effectSquare(color); break
    case 'line': effectLine(color); break
    case 'dot': effectDot(color); break
    case 'arc': effectArc(color); break
    case 'spiral2': effectSpiral2(color); break
  }
}

// 区域0: 圆形扩散 - 从中心向外扩散的圆环
function effectBurst(color) {
  const cx = window.innerWidth / 2
  const cy = window.innerHeight / 2
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
}

// 区域1: 弹跳方块 - 多个方块从中心弹出
function effectSpiral(color) {
  const cx = window.innerWidth / 2
  const cy = window.innerHeight / 2
  for (let i = 0; i < 8; i++) {
    const angle = (Math.PI * 2 / 8) * i + Math.PI / 8
    shapes.push({
      type: 'rect',
      x: cx,
      y: cy,
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

// 区域2: 横向扫描线 - 从左到右的扫描效果
function effectWave(color) {
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

// 区域3: 三角形爆发 - 从中心爆发的三角形
function effectExplosion(color) {
  const cx = window.innerWidth / 2
  const cy = window.innerHeight / 2
  for (let i = 0; i < 10; i++) {
    const angle = (Math.PI * 2 / 10) * i
    shapes.push({
      type: 'triangle',
      x: cx,
      y: cy,
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
}

// 区域4: 随机圆点 - 随机位置出现的圆点
function effectScatter(color) {
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
}

// 区域5: 垂直下落 - 从顶部下落的形状
function effectRain(color) {
  for (let i = 0; i < 15; i++) {
    const x = Math.random() * window.innerWidth
    shapes.push({
      type: 'rect',
      x,
      y: -50,
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

// 区域6: 花朵图案 - 旋转的花朵形状
function effectFlower(color) {
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

// 区域7: 放射线 - 从中心向外的放射线条
function effectFlash(color) {
  const cx = window.innerWidth / 2
  const cy = window.innerHeight / 2
  for (let i = 0; i < 12; i++) {
    const angle = (Math.PI * 2 / 12) * i
    shapes.push({
      type: 'line',
      x: cx,
      y: cy,
      vx: Math.cos(angle) * 2,
      vy: Math.sin(angle) * 2,
      size: 60 + Math.random() * 40,
      rotation: angle,
      rotationSpeed: 0,
      scale: 1,
      color,
      life: 0.8,
      alpha: 1,
      fill: false,
      lineWidth: 5 + Math.random() * 3
    })
  }
}

// 区域8: 粒子爆发 - 大量粒子从中心爆发
function effectFirework(color) {
  const cx = window.innerWidth / 2
  const cy = window.innerHeight / 2
  for (let i = 0; i < 30; i++) {
    const angle = Math.random() * Math.PI * 2
    const speed = 3 + Math.random() * 5
    particles.push({
      x: cx,
      y: cy,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      size: 2 + Math.random() * 4,
      color,
      life: 1
    })
  }
}

// 区域9: 螺旋线 - 螺旋形状的图案
function effectVortex(color) {
  const cx = window.innerWidth / 2
  const cy = window.innerHeight / 2
  for (let i = 0; i < 20; i++) {
    const angle = (Math.PI * 4 / 20) * i
    const dist = 20 + i * 10
    shapes.push({
      type: 'circle',
      x: cx + Math.cos(angle) * dist,
      y: cy + Math.sin(angle) * dist,
      vx: Math.cos(angle + Math.PI / 2) * 2,
      vy: Math.sin(angle + Math.PI / 2) * 2,
      size: 6 + i * 0.5,
      rotation: 0,
      rotationSpeed: 0.15,
      scale: 1,
      color,
      life: 1.2,
      alpha: 1,
      fill: true,
      lineWidth: 3
    })
  }
}

// 区域10: 斜向下落 - 斜向右下角下落的形状
function effectMeteor(color) {
  for (let i = 0; i < 12; i++) {
    const x = Math.random() * window.innerWidth * 0.5
    shapes.push({
      type: 'circle',
      x,
      y: -50,
      vx: 4 + Math.random() * 2,
      vy: 3 + Math.random() * 2,
      size: 8 + Math.random() * 12,
      rotation: 0,
      rotationSpeed: (Math.random() - 0.5) * 0.2,
      scale: 1,
      color,
      life: 1.8,
      alpha: 1,
      fill: false,
      lineWidth: 5
    })
  }
}

// 区域11: 上升气泡 - 从底部上升的圆形
function effectBubble(color) {
  for (let i = 0; i < 12; i++) {
    const x = Math.random() * window.innerWidth
    shapes.push({
      type: 'circle',
      x,
      y: window.innerHeight + 50,
      vx: (Math.random() - 0.5) * 2,
      vy: -3 - Math.random() * 3,
      size: 12 + Math.random() * 20,
      rotation: 0,
      rotationSpeed: (Math.random() - 0.5) * 0.1,
      scale: 0.8 + Math.random() * 0.4,
      color,
      life: 2.5,
      alpha: 0.7,
      fill: false,
      lineWidth: 4
    })
  }
}

// 区域12: 垂直线条 - 从上到下的垂直线
function effectLightning(color) {
  const cx = window.innerWidth / 2
  for (let i = 0; i < 6; i++) {
    const x = cx + (i - 3) * 80
    shapes.push({
      type: 'line',
      x,
      y: -50,
      vx: 0,
      vy: 8 + Math.random() * 4,
      size: window.innerHeight / 2,
      rotation: Math.PI / 2,
      rotationSpeed: 0,
      scale: 1,
      color,
      life: 1.2,
      alpha: 0.9,
      fill: false,
      lineWidth: 6
    })
  }
}

// 区域13: 旋转星星 - 旋转的五角星
function effectSnow(color) {
  const cx = window.innerWidth / 2
  const cy = window.innerHeight / 2
  for (let i = 0; i < 8; i++) {
    const angle = (Math.PI * 2 / 8) * i
    const dist = 50 + i * 30
    shapes.push({
      type: 'star',
      x: cx + Math.cos(angle) * dist,
      y: cy + Math.sin(angle) * dist,
      vx: Math.cos(angle) * 2,
      vy: Math.sin(angle) * 2,
      size: 12 + Math.random() * 8,
      rotation: angle,
      rotationSpeed: 0.2,
      scale: 1,
      color,
      life: 1.2,
      alpha: 1,
      fill: i % 2 === 0,
      lineWidth: 3
    })
  }
}

// 区域14: 飘落方块 - 飘落的矩形
function effectConfetti(color) {
  for (let i = 0; i < 20; i++) {
    shapes.push({
      type: 'rect',
      x: Math.random() * window.innerWidth,
      y: -30,
      vx: (Math.random() - 0.5) * 3,
      vy: 3 + Math.random() * 3,
      size: 8 + Math.random() * 12,
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.2,
      scale: 0.6 + Math.random() * 0.4,
      color,
      life: 2,
      alpha: 1,
      fill: Math.random() > 0.5,
      lineWidth: 3
    })
  }
}

// 区域15: 闪烁点 - 随机位置的闪烁点
function effectPixel(color) {
  for (let i = 0; i < 30; i++) {
    const x = Math.random() * window.innerWidth
    const y = Math.random() * window.innerHeight
    particles.push({
      x, y,
      vx: 0,
      vy: 0,
      size: 4 + Math.random() * 6,
      color,
      life: 0.6 + Math.random() * 0.4
    })
    ripples.push({
      x, y,
      radius: 3,
      speed: 2,
      color,
      alpha: 0.6,
      lineWidth: 3
    })
  }
}

// 区域16: 同心圆 - 从中心扩散的圆环
function effectRing(color) {
  const cx = window.innerWidth / 2
  const cy = window.innerHeight / 2
  for (let i = 0; i < 6; i++) {
    ripples.push({
      x: cx,
      y: cy,
      radius: 20 + i * 35,
      speed: 3 + i,
      color,
      alpha: 0.9 - i * 0.12,
      lineWidth: 7 - i
    })
  }
}

// 区域17: 星星爆发 - 从中心爆发的星星
function effectStarfall(color) {
  const cx = window.innerWidth / 2
  const cy = window.innerHeight / 2
  for (let i = 0; i < 10; i++) {
    const angle = (Math.PI * 2 / 10) * i
    shapes.push({
      type: 'star',
      x: cx,
      y: cy,
      vx: Math.cos(angle) * 5,
      vy: Math.sin(angle) * 5,
      size: 12 + Math.random() * 10,
      rotation: angle,
      rotationSpeed: (Math.random() - 0.5) * 0.25,
      scale: 1,
      color,
      life: 1,
      alpha: 1,
      fill: true,
      lineWidth: 3
    })
  }
}

// 区域18: 脉冲波 - 中心脉冲波
function effectPulse(color) {
  const cx = window.innerWidth / 2
  const cy = window.innerHeight / 2
  for (let i = 0; i < 8; i++) {
    ripples.push({
      x: cx,
      y: cy,
      radius: 10 + i * 25,
      speed: 6 + i * 1.5,
      color,
      alpha: 1 - i * 0.1,
      lineWidth: 5 - i * 0.4
    })
  }
}

// 区域19: 螺旋上升 - 螺旋上升的圆点
function effectTornado(color) {
  const cx = window.innerWidth / 2
  const cy = window.innerHeight / 2
  for (let i = 0; i < 25; i++) {
    const angle = (Math.PI * 4 / 25) * i
    const dist = 30 + i * 8
    shapes.push({
      type: 'circle',
      x: cx + Math.cos(angle) * dist,
      y: cy + Math.sin(angle) * dist,
      vx: Math.cos(angle + Math.PI / 2) * 1.5,
      vy: Math.sin(angle + Math.PI / 2) * 1.5,
      size: 5 + i * 0.4,
      rotation: 0,
      rotationSpeed: 0.15,
      scale: 1,
      color,
      life: 1.3,
      alpha: 1,
      fill: true,
      lineWidth: 3
    })
  }
}

// 区域20: 菱形爆发 - 从中心爆发的菱形
function effectDiamond(color) {
  const cx = window.innerWidth / 2
  const cy = window.innerHeight / 2
  for (let i = 0; i < 8; i++) {
    const angle = (Math.PI * 2 / 8) * i + Math.PI / 8
    shapes.push({
      type: 'diamond',
      x: cx,
      y: cy,
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
}

// 区域21: 六边形阵列 - 六边形网格
function effectHex(color) {
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

// 区域22: 十字爆发 - 从中心爆发的十字
function effectCross(color) {
  const cx = window.innerWidth / 2
  const cy = window.innerHeight / 2
  for (let i = 0; i < 8; i++) {
    const angle = (Math.PI * 2 / 8) * i
    shapes.push({
      type: 'cross',
      x: cx,
      y: cy,
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
}

// 区域23: 三角形阵列 - 三角形环绕
function effectTriangle(color) {
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

// 区域24: 圆环阵列 - 多层圆环
function effectCircle(color) {
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

// 区域25: 方块爆发 - 从中心爆发的方块
function effectSquare(color) {
  const cx = window.innerWidth / 2
  const cy = window.innerHeight / 2
  for (let i = 0; i < 10; i++) {
    const angle = (Math.PI * 2 / 10) * i
    shapes.push({
      type: 'rect',
      x: cx,
      y: cy,
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
}

// 区域26: 线条爆发 - 从中心爆发的线条
function effectLine(color) {
  const cx = window.innerWidth / 2
  const cy = window.innerHeight / 2
  for (let i = 0; i < 10; i++) {
    const angle = (Math.PI * 2 / 10) * i
    shapes.push({
      type: 'line',
      x: cx,
      y: cy,
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

// 区域27: 点阵爆发 - 从中心爆发的点
function effectDot(color) {
  const cx = window.innerWidth / 2
  const cy = window.innerHeight / 2
  for (let i = 0; i < 20; i++) {
    const angle = Math.random() * Math.PI * 2
    const speed = 3 + Math.random() * 4
    particles.push({
      x: cx,
      y: cy,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      size: 3 + Math.random() * 5,
      color,
      life: 1
    })
  }
}

// 区域28: 弧线扩散 - 扩散的弧线
function effectArc(color) {
  const cx = window.innerWidth / 2
  const cy = window.innerHeight / 2
  for (let i = 0; i < 8; i++) {
    const startAngle = (Math.PI * 2 / 8) * i
    shapes.push({
      type: 'arc',
      x: cx,
      y: cy,
      vx: 0,
      vy: 0,
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

// 区域29: 双螺旋 - 双螺旋形状
function effectSpiral2(color) {
  const cx = window.innerWidth / 2
  const cy = window.innerHeight / 2
  for (let i = 0; i < 25; i++) {
    const angle = (Math.PI * 5 / 25) * i
    const dist = 20 + i * 7
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

/**
 * 处理鼠标按下事件
 * @param {MouseEvent} e - 鼠标事件对象
 */
function handleMouseDown(e) {
  e.preventDefault()
  // 获取鼠标位置所在的区域索引
  const areaIndex = getAreaIndex(e.clientX, e.clientY)
  // 更新最后触发的区域索引
  lastAreaIndex = areaIndex
  // 触发该区域的效果
  trigger(areaIndex, e.clientX, e.clientY)
}

/**
 * 处理鼠标移动事件
 * @param {MouseEvent} e - 鼠标事件对象
 */
function handleMouseMove(e) {
  // 获取鼠标位置所在的区域索引
  const areaIndex = getAreaIndex(e.clientX, e.clientY)
  // 只有在进入新区域时才触发效果，避免重复触发
  if (areaIndex !== lastAreaIndex) {
    lastAreaIndex = areaIndex
    trigger(areaIndex, e.clientX, e.clientY)
  }
}

/**
 * 处理鼠标释放事件
 */
function handleMouseUp() {}

/**
 * 处理触摸开始事件
 * @param {TouchEvent} e - 触摸事件对象
 */
function handleTouchStart(e) {
  e.preventDefault()
  // 处理所有触摸点
  for (let i = 0; i < e.touches.length; i++) {
    const areaIndex = getAreaIndex(e.touches[i].clientX, e.touches[i].clientY)
    lastAreaIndex = areaIndex
    trigger(areaIndex, e.touches[i].clientX, e.touches[i].clientY)
  }
}

/**
 * 处理触摸移动事件
 * @param {TouchEvent} e - 触摸事件对象
 */
function handleTouchMove(e) {
  e.preventDefault()
  // 处理所有触摸点
  for (let i = 0; i < e.touches.length; i++) {
    const areaIndex = getAreaIndex(e.touches[i].clientX, e.touches[i].clientY)
    // 只有在进入新区域时才触发效果
    if (areaIndex !== lastAreaIndex) {
      lastAreaIndex = areaIndex
      trigger(areaIndex, e.touches[i].clientX, e.touches[i].clientY)
    }
  }
}

/**
 * 处理触摸结束事件
 * @param {TouchEvent} e - 触摸事件对象
 */
function handleTouchEnd(e) {
  e.preventDefault()
}

/**
 * 处理键盘按下事件
 * @param {KeyboardEvent} e - 键盘事件对象
 */
function handleKeyDown(e) {
  // 忽略重复按键
  if (e.repeat) return
  // 随机生成一个位置
  const x = Math.random() * window.innerWidth
  const y = Math.random() * window.innerHeight
  // 获取该随机位置的区域索引
  const areaIndex = getAreaIndex(x, y)
  lastAreaIndex = areaIndex
  // 触发该区域的效果
  trigger(areaIndex, x, y)
}

/**
 * 组件挂载时执行
 * 初始化画布并添加所有事件监听器
 */
onMounted(() => {
  // 初始化画布
  initCanvas()
  // 监听窗口大小变化事件
  window.addEventListener('resize', resizeCanvas)
  // 监听鼠标事件
  window.addEventListener('mousedown', handleMouseDown)
  window.addEventListener('mousemove', handleMouseMove)
  window.addEventListener('mouseup', handleMouseUp)
  // 监听触摸事件
  window.addEventListener('touchstart', handleTouchStart, { passive: false })
  window.addEventListener('touchmove', handleTouchMove, { passive: false })
  window.addEventListener('touchend', handleTouchEnd, { passive: false })
  // 监听键盘事件
  window.addEventListener('keydown', handleKeyDown)
})

/**
 * 组件卸载时执行
 * 清理动画帧和移除所有事件监听器，防止内存泄漏
 */
onUnmounted(() => {
  // 取消动画循环
  if (animationId) cancelAnimationFrame(animationId)
  // 移除所有事件监听器
  window.removeEventListener('resize', resizeCanvas)
  window.removeEventListener('mousedown', handleMouseDown)
  window.removeEventListener('mousemove', handleMouseMove)
  window.removeEventListener('mouseup', handleMouseUp)
  window.removeEventListener('touchstart', handleTouchStart)
  window.removeEventListener('touchmove', handleTouchMove)
  window.removeEventListener('touchend', handleTouchEnd)
  window.removeEventListener('keydown', handleKeyDown)
})
</script>

<style scoped>
.mikutap-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: #8cc;
  overflow: hidden;
  touch-action: none;
}

.main-canvas {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  cursor: crosshair;
}
</style>
