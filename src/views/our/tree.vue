<template>
  <div class="christmas-container">
    <div ref="canvasContainer" class="canvas-container"></div>
    <video ref="videoElement" class="hidden-video" playsinline muted></video>

    <div class="ui-layer">

      <div class="status-bar">
        <div class="status-item">
          <span class="status-dot" :class="{ active: isGestureMode && isModelReady }"></span>
          {{ statusText }}
        </div>
      </div>

      <div class="control-panel">
        <div class="panel-section">
          <div class="section-title">模式控制</div>
          <div class="gesture-switch-row">
            <span>👋 手势识别</span>
            <el-switch
              v-model="isGestureMode"
              :loading="isLoadingModel"
              @change="toggleGestureControl"
              style="--el-switch-on-color: #0B5345;"
            />
          </div>
          <div class="hint-text" v-if="!isGestureMode">开启后使用摄像头控制</div>
        </div>

        <el-divider style="margin: 15px 0; border-color: rgba(255,255,255,0.1);" />

        <div class="panel-section">
          <div class="section-title">状态切换</div>
          <div class="btn-group">
            <el-button color="#0B5345" :plain="viewState !== 'closed'" @click="manualTransition('closed')">
              🎄 合拢
            </el-button>
            <el-button color="#0B5345" :plain="viewState !== 'open'" @click="manualTransition('open')">
              ✨ 散开
            </el-button>
          </div>
          <el-button
            class="grab-btn"
            color="#922B21"
            :disabled="false"
            @click="manualTransition('photo')"
          >
            🖼️ 抓取照片
          </el-button>
        </div>

        <el-divider style="margin: 15px 0; border-color: rgba(255,255,255,0.1);" />

        <div class="panel-section">
          <div class="section-title">视角旋转</div>
          <el-slider
            v-model="manualRotation"
            :min="0" :max="100"
            :show-tooltip="false"
            @input="handleSliderChange"
          />
        </div>
      </div>

      <!-- 移除图片库展示区域 -->

      <transition name="fade">
        <div class="guide-panel" v-if="isGestureMode && isModelReady">
          <div class="guide-item">✊ 握拳：合拢</div>
          <div class="guide-item">🖐️ 张开：散开</div>
          <div class="guide-item">👋 移动：旋转</div>
          <div class="guide-item">👌 捏合：抓取</div>
        </div>
      </transition>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed, watch } from 'vue'
import * as THREE from 'three'
import { gsap } from 'gsap'
import { EffectComposer, RenderPass, EffectPass, BloomEffect, SMAAEffect, ToneMappingEffect, VignetteEffect } from 'postprocessing'
import { FilesetResolver, HandLandmarker } from '@mediapipe/tasks-vision'
import { UploadFilled } from '@element-plus/icons-vue'
import { useImageStore } from '@/store'

// 保留基本功能，移除图片库相关状态和监听

// --- State Variables ---
const viewState = ref('closed') // 'closed', 'open', 'photo'
const isGestureMode = ref(false)
const isLoadingModel = ref(false)
const isModelReady = ref(false)
const statusText = ref('场景已就绪，等待指令')
const manualRotation = ref(50)
const isLoadingImages = ref(false)
const imagesLoaded = ref(false)
const imageStore = useImageStore()

// --- Three.js Core ---
let scene, camera, renderer, composer
let treeGroup = new THREE.Group()
let decorationGroup = new THREE.Group() // 存储圣诞树装饰元素
let photoPlanes = [] // 存储 THREE.js 中的照片平面对象
let activePhoto = null
let animationId = null
const canvasContainer = ref(null)
// 点击交互相关
const raycaster = new THREE.Raycaster()
const mouse = new THREE.Vector2()
// 视角控制相关
let isDragging = false
let previousMousePosition = { x: 0, y: 0 }
let currentRotation = { x: 0, y: 0 }

// --- MediaPipe Core ---
const videoElement = ref(null)
let handLandmarker = null
let lastVideoTime = -1
let stream = null

// --- Lifecycle ---
onMounted(async () => {
  initThree()
  createEnvironment()
  createTreeElements()
  await loadImagesFromStore()
  animate()
})

onUnmounted(() => {
  cancelAnimationFrame(animationId)
  stopWebcam()
  if (renderer && renderer.domElement) {
    renderer.domElement.removeEventListener('click', handleClick)
    renderer.domElement.removeEventListener('mousemove', onMouseMove)
    renderer.dispose()
  }
  if (handLandmarker) handLandmarker.close()
  window.removeEventListener('resize', onWindowResize)
})

// ----------------------------------------------------------------------
// 1. Logic Control: Gesture Switch & Manual Control
// ----------------------------------------------------------------------

async function toggleGestureControl(val) {
  if (val) {
    if (!handLandmarker) {
      isLoadingModel.value = true
      statusText.value = "正在下载 AI 模型..."
      try {
        await initMediaPipe()
        statusText.value = "摄像头已启动，请展示手势"
      } catch (e) {
        console.error("MediaPipe Init Error:", e)
        statusText.value = "模型加载失败，请重试"
        isGestureMode.value = false
      } finally {
        isLoadingModel.value = false
      }
    } else {
      startWebcam()
    }
  } else {
    stopWebcam()
    statusText.value = "已切换至手动控制"
  }
}

function stopWebcam() {
  if (stream) {
    stream.getTracks().forEach(track => track.stop())
    stream = null
  }
  if (videoElement.value) {
    videoElement.value.pause()
    videoElement.value.srcObject = null
  }
}

async function startWebcam() {
  try {
    stream = await navigator.mediaDevices.getUserMedia({ video: true })
    videoElement.value.srcObject = stream
    videoElement.value.addEventListener('loadeddata', () => {
      videoElement.value.play()
      isModelReady.value = true
    }, { once: true }) // Ensure listener is added only once
  } catch (err) {
    console.error("Webcam Error:", err)
    statusText.value = "无法访问摄像头"
    isGestureMode.value = false
  }
}

// Initialize MediaPipe (Lazy Load)
async function initMediaPipe() {
  const vision = await FilesetResolver.forVisionTasks(
    'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.8/wasm' // Use stable version
  )
  // IMPORTANT: Use createFromOptions for newer versions
  handLandmarker = await HandLandmarker.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath: `https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task`,
      // delegate: 'GPU' // Optional
    },
    runningMode: 'VIDEO',
    numHands: 1
  })
  await startWebcam()
}

function manualTransition(state) {
  transitionTo(state)
}

function handleSliderChange(val) {
  const targetRot = (val - 50) / 50 * Math.PI
  gsap.to(treeGroup.rotation, {
    y: -targetRot,
    duration: 0.5
  })
}

// ----------------------------------------------------------------------
// 2. Animation & Gesture Loop
// ----------------------------------------------------------------------

function animate() {
  animationId = requestAnimationFrame(animate)

  // 手势检测优化：添加节流处理
  if (isGestureMode.value && isModelReady.value && handLandmarker) {
    predictWebcam()
  }

  // 粒子系统动画：为星空背景中的粒子添加独立运动
  try {
    scene.children.forEach(obj => {
      if (obj.type === 'Points' && obj.userData.animate && obj.geometry) {
        try {
          const positions = obj.geometry.attributes?.position?.array
          const velocities = obj.geometry.attributes?.velocity?.array
          const originalPositions = obj.userData.originalPositions
          
          if (velocities && originalPositions && positions) {
            // 为每个粒子应用独立运动
            for (let i = 0; i < positions.length; i += 3) {
              // 应用速度
              positions[i] += velocities[i]
              positions[i+1] += velocities[i+1]
              positions[i+2] += velocities[i+2]
              
              // 计算粒子到原点的距离
              const distance = Math.sqrt(
                positions[i] * positions[i] + 
                positions[i+1] * positions[i+1] + 
                positions[i+2] * positions[i+2]
              )
              
              // 如果粒子移动太远，重置到原始位置附近
              const maxDistance = 120 // 最大允许距离
              if (distance > maxDistance) {
                // 重置到原始位置附近的随机位置
                const resetFactor = 0.9 + Math.random() * 0.2
                positions[i] = originalPositions[i] * resetFactor
                positions[i+1] = originalPositions[i+1] * resetFactor
                positions[i+2] = originalPositions[i+2] * resetFactor
                
                // 重新随机化速度
                velocities[i] = (Math.random() - 0.5) * 0.005
                velocities[i+1] = (Math.random() - 0.5) * 0.005
                velocities[i+2] = (Math.random() - 0.5) * 0.005
              }
            }
            
            // 通知Three.js位置属性已更新
            if (obj.geometry.attributes?.position) {
              obj.geometry.attributes.position.needsUpdate = true
            }
          }
          
          // 为粒子系统添加整体旋转，增强动态效果
          obj.rotation.y += 0.0002
        } catch (particleError) {
          console.warn('粒子更新失败:', particleError)
        }
      }
    })
  } catch (error) {
    console.error('粒子系统动画失败:', error)
  }

  // 动画效果优化：根据设备性能调整动画强度
  if (viewState.value === 'open' && !activePhoto) {
    const now = Date.now() * 0.001
    treeGroup.children.forEach((child, i) => {
      // 为照片添加额外的动画效果
      if (child.userData && child.material && child.material.map) {
        child.position.y += Math.sin(now + i) * 0.004
        child.rotation.z += Math.sin(now + i * 0.5) * 0.002
      } else {
        child.position.y += Math.sin(now + i) * 0.002
      }
    })
  }

  // 性能优化：根据场景复杂度调整渲染策略
  if (composer) {
    composer.render()
  }
}

// 鼠标移动事件处理
function onMouseMove(event) {
  // 计算鼠标在规范化设备坐标中的位置
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1
  
  // 如果正在拖拽，旋转视角
  if (isDragging) {
    const deltaMove = {
      x: event.clientX - previousMousePosition.x,
      y: event.clientY - previousMousePosition.y
    }
    
    // 调整旋转速度
    const rotateSpeed = 0.005
    currentRotation.x += deltaMove.y * rotateSpeed
    currentRotation.y += deltaMove.x * rotateSpeed
    
    // 限制垂直旋转角度
    currentRotation.x = Math.max(-Math.PI/2, Math.min(Math.PI/2, currentRotation.x))
    
    // 应用旋转到树组
    treeGroup.rotation.x = currentRotation.x
    treeGroup.rotation.y = currentRotation.y
    
    // 更新滑块位置
    manualRotation.value = 50 + (currentRotation.y / Math.PI) * 50
    
    // 保存当前鼠标位置
    previousMousePosition = {
      x: event.clientX,
      y: event.clientY
    }
    
    renderer.domElement.style.cursor = 'grabbing'
    return
  }
  
  // 更新射线投射器
  raycaster.setFromCamera(mouse, camera)
  
  // 检测是否悬停在照片上
  const intersects = raycaster.intersectObjects(photoPlanes)
  if (intersects.length > 0) {
    renderer.domElement.style.cursor = 'pointer'
    } else {
      renderer.domElement.style.cursor = 'default'
    }
}

// 鼠标按下事件处理
function onMouseDown(event) {
  // 开始拖拽状态
  isDragging = true
  previousMousePosition = {
    x: event.clientX,
    y: event.clientY
  }
  renderer.domElement.style.cursor = 'grabbing'
}

// 鼠标释放事件处理
function onMouseUp(event) {
  isDragging = false
  renderer.domElement.style.cursor = 'default'
}

// 鼠标离开画布事件处理
function onMouseLeave(event) {
  isDragging = false
  renderer.domElement.style.cursor = 'default'
}

// 检测点击的对象
function detectClickedObject(event) {
  // 计算鼠标在规范化设备坐标中的位置
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1
  
  // 更新射线投射器
  raycaster.setFromCamera(mouse, camera)
  
  // 检测与照片的交互
  const intersects = raycaster.intersectObjects(photoPlanes)
  if (intersects.length > 0) {
    return intersects[0].object
  }
  
  // 检测与场景背景的交互
  const backgroundIntersects = raycaster.intersectObjects([scene])
  if (backgroundIntersects.length > 0) {
    return 'background'
  }
  
  return null
}

// 点击事件处理
function handleClick(event) {
  if (isGestureMode.value || isDragging) return // 手势模式或拖拽状态下禁用点击
  
  const clicked = detectClickedObject(event)
  
  if (clicked === 'background') {
    // 点击背景时，在不同状态间切换
    if (viewState.value === 'closed') {
      transitionTo('open')
      statusText.value = '场景已打开'
    } else if (viewState.value === 'open') {
      transitionTo('closed')
      statusText.value = '场景已关闭'
    } else if (viewState.value === 'photo') {
      // 从照片模式返回到打开模式
      transitionTo('open')
      statusText.value = '返回场景'
    }
  } else if (clicked && clicked.userData && clicked.userData.isPhoto) {
    // 确保只处理照片对象
    if (viewState.value === 'closed' || viewState.value === 'open') {
      // 从闭合或打开模式切换到照片模式
      activePhoto = clicked
      transitionTo('photo')
      statusText.value = `展示图片: ${clicked.userData.name || '未知'}`
    } else if (viewState.value === 'photo') {
      // 照片模式下点击其他照片，切换显示的照片
      if (clicked !== activePhoto) {
        activePhoto = clicked
        transitionTo('photo')
        statusText.value = `展示图片: ${clicked.userData.name || '未知'}`
      }
    }
  }
}

function predictWebcam() {
  let startTimeMs = performance.now()
  if (lastVideoTime === undefined || videoElement.value.currentTime !== lastVideoTime) { // Check for undefined initially
    lastVideoTime = videoElement.value.currentTime
    // Ensure handLandmarker is ready before calling detectForVideo
    if (handLandmarker) {
       const results = handLandmarker.detectForVideo(videoElement.value, startTimeMs)

       if (results.landmarks && results.landmarks.length > 0) {
         analyzeGesture(results.landmarks[0])
       }
    }
  }
}

// 手势历史记录，用于平滑识别
const gestureHistory = ref([])
const historySize = 8 // 历史记录大小
let lastGestureTime = 0
const gestureDebounceTime = 200 // 手势防抖时间（毫秒）
let lastGestureType = '' // 记录上一次识别的手势类型

function analyzeGesture(lm) {
  // 防抖控制，避免过于频繁的手势切换
  const now = Date.now()
  if (now - lastGestureTime < gestureDebounceTime) return
  
  // 获取手指尖端和关节点
  const tips = [8, 12, 16, 20] // 手指尖
  const mids = [6, 10, 14, 18] // 手指中间关节
  const bases = [5, 9, 13, 17] // 手指根部关节
  const thumbTip = 4
  const thumbMid = 3
  const thumbBase = 2
  const indexTip = 8
  const palmCenter = lm[0] // 手掌中心点
  
  // 计算手指伸展度和握拳检测（更加精确的算法）
  let fingersExtended = 0
  let fingerExtensionRatios = []
  
  // 分析每个手指的状态
  tips.forEach((tip, index) => {
    const mid = mids[index]
    const base = bases[index]
    
    // 计算手指长度
    const tipToMid = Math.sqrt(
      Math.pow(lm[tip].x - lm[mid].x, 2) + 
      Math.pow(lm[tip].y - lm[mid].y, 2) +
      Math.pow(lm[tip].z - lm[mid].z, 2)
    )
    
    const midToBase = Math.sqrt(
      Math.pow(lm[mid].x - lm[base].x, 2) + 
      Math.pow(lm[mid].y - lm[base].y, 2) +
      Math.pow(lm[mid].z - lm[base].z, 2)
    )
    
    // 计算手指伸展比例
    const extensionRatio = tipToMid / (midToBase + 0.001)
    fingerExtensionRatios.push(extensionRatio)
    
    // 判断手指是否伸展（阈值更加合理）
    if (lm[tip].y < lm[base].y) {
      fingersExtended++
    }
  })
  
  // 单独分析拇指状态
  const thumbTipToMid = Math.sqrt(
    Math.pow(lm[thumbTip].x - lm[thumbMid].x, 2) + 
    Math.pow(lm[thumbTip].y - lm[thumbMid].y, 2) +
    Math.pow(lm[thumbTip].z - lm[thumbMid].z, 2)
  )
  
  const thumbMidToBase = Math.sqrt(
    Math.pow(lm[thumbMid].x - lm[thumbBase].x, 2) + 
    Math.pow(lm[thumbMid].y - lm[thumbBase].y, 2) +
    Math.pow(lm[thumbMid].z - lm[thumbBase].z, 2)
  )
  
  const thumbExtensionRatio = thumbTipToMid / (thumbMidToBase + 0.001)
  const isThumbExtended = lm[thumbTip].x < lm[thumbBase].x // 拇指向外伸展
  
  // 更准确的握拳检测：所有手指都弯曲
  const isFist = tips.every(tip => lm[tip].y > lm[tip - 2].y) && 
                !isThumbExtended &&
                fingerExtensionRatios.every(ratio => ratio < 0.8)
  
  // 计算指尖到手掌中心的平均距离
   const tipToPalmDistance = tips.reduce((sum, tip) => {
     return sum + Math.sqrt(
       Math.pow(lm[tip].x - palmCenter.x, 2) +
       Math.pow(lm[tip].y - palmCenter.y, 2)
     )
   }, 0) / tips.length
   
   // 更准确的张开手掌检测：所有手指都伸展
   const isOpen = fingersExtended >= 3 && 
                 isThumbExtended &&
                 fingerExtensionRatios.every(ratio => ratio > 1.0) &&
                 tipToPalmDistance > 0.12 // 手指远离手掌中心
  
  // 更精确的捏合（抓取）动作检测
  const d = Math.sqrt(
    Math.pow(lm[thumbTip].x - lm[indexTip].x, 2) + 
    Math.pow(lm[thumbTip].y - lm[indexTip].y, 2) +
    Math.pow(lm[thumbTip].z - lm[indexTip].z, 2)
  )
  
  // 抓取动作不仅是捏合，还需要其他手指部分弯曲
  const isPinch = d < 0.04 // 缩小阈值，要求更接近
  const fingersPartiallyClosed = fingersExtended <= 2 && 
                                 !isFist && 
                                 fingerExtensionRatios.some(ratio => ratio < 1.0)
  
  const isGrabbing = isPinch && fingersPartiallyClosed
  
  // 计算手势置信度
  let gestureConfidence = 0
  let currentGesture = ''
  
  if (isFist) {
    gestureConfidence = 1.0 - (fingerExtensionRatios.reduce((a, b) => a + b, 0) / fingerExtensionRatios.length)
    currentGesture = 'fist'
  } else if (isOpen) {
    gestureConfidence = fingerExtensionRatios.reduce((a, b) => a + b, 0) / fingerExtensionRatios.length * 0.8
    currentGesture = 'open'
  } else if (isGrabbing) {
    gestureConfidence = (1.0 - d / 0.04) * 0.9
    currentGesture = 'grab'
  }
  
  // 添加到手势历史记录
  gestureHistory.value.push({
    type: currentGesture,
    confidence: gestureConfidence,
    timestamp: now
  })
  
  // 保持历史记录大小
  if (gestureHistory.value.length > historySize) {
    gestureHistory.value.shift()
  }
  
  // 分析历史手势，找出最一致的手势
  const gestureCounts = {}
  const gestureConfidences = {}
  
  gestureHistory.value.forEach(gesture => {
    if (gesture.type) {
      gestureCounts[gesture.type] = (gestureCounts[gesture.type] || 0) + 1
      gestureConfidences[gesture.type] = (gestureConfidences[gesture.type] || 0) + gesture.confidence
    }
  })
  
  // 找出最频繁且平均置信度最高的手势
  let mostFrequentGesture = ''
  let maxCount = 0
  let maxConfidence = 0
  
  Object.keys(gestureCounts).forEach(gesture => {
    const avgConfidence = gestureConfidences[gesture] / gestureCounts[gesture]
    if (gestureCounts[gesture] > maxCount || 
        (gestureCounts[gesture] === maxCount && avgConfidence > maxConfidence)) {
      maxCount = gestureCounts[gesture]
      maxConfidence = avgConfidence
      mostFrequentGesture = gesture
    }
  })
  
  // 只有当手势出现足够频繁且置信度足够高时才触发状态切换
  if (maxCount >= historySize * 0.6 && maxConfidence > 0.7 && mostFrequentGesture !== lastGestureType) {
    lastGestureTime = now
    lastGestureType = mostFrequentGesture
    
    // 执行相应的状态切换
    if (mostFrequentGesture === 'fist') {
      transitionTo('closed')
      console.log('检测到握拳动作，进入合拢态')
    } else if (mostFrequentGesture === 'open') {
      transitionTo('open')
      console.log('检测到张开手掌动作，进入散开态')
    } else if (mostFrequentGesture === 'grab') {
      transitionTo('photo')
      console.log('检测到抓取动作，进入照片放大态')
    }
  }
  
  // 手旋转逻辑优化（仅在散开态有效）
  if (viewState.value === 'open' && !activePhoto) {
    const handX = lm[0].x
    const handY = lm[0].y
    
    // 使用更平滑的旋转算法，添加Y轴旋转（上下倾斜）
    const rotateYSpeed = (handX - 0.5) * 0.03 // 减小速度，使旋转更平滑
    const rotateXSpeed = (handY - 0.5) * 0.02 // 添加上下旋转
    
    treeGroup.rotation.y -= rotateYSpeed
    treeGroup.rotation.x -= rotateXSpeed
    
    // 限制旋转角度范围，避免过度旋转
    treeGroup.rotation.x = Math.max(-Math.PI/6, Math.min(Math.PI/6, treeGroup.rotation.x))
    
    // 更新手动旋转滑块
    manualRotation.value = Math.max(0, Math.min(100, ((-treeGroup.rotation.y / Math.PI) * 50) + 50))
  }
}

// ----------------------------------------------------------------------
// 3. Scene Transition Logic (Core Animation)
// ----------------------------------------------------------------------
async function loadImagesFromStore() {
  // 使用防抖技术，避免短时间内重复加载
  if (isLoadingImages.value) return
  
  isLoadingImages.value = true
  statusText.value = "正在加载图片..."
  
  try {
    // 使用picturestore加载图片
    await imageStore.fetchImages()
    
    if (imageStore.imageList && imageStore.imageList.length > 0) {
      createPhotoPlanes()
      statusText.value = `已加载 ${imageStore.imageList.length} 张照片`
    } else {
      statusText.value = "暂无可用照片，请先上传"
      // 显示友好的占位符照片
      createPlaceholderPhotos()
    }
  } catch (error) {
    console.error("加载图片失败:", error)
    statusText.value = "加载图片失败，请重试"
    // 出错时显示占位符
    createPlaceholderPhotos()
  } finally {
    isLoadingImages.value = false
    imagesLoaded.value = true
  }
}

// 创建占位符照片，当没有真实照片时显示
function createPlaceholderPhotos() {
  // 清理现有的照片平面
  photoPlanes.forEach(plane => {
    if (plane.material.map) {
      plane.material.map.dispose()
    }
    plane.material.dispose()
    plane.geometry.dispose()
    treeGroup.remove(plane)
  })
  photoPlanes = []
  
  // 创建一些漂亮的占位符照片
  const placeholderImages = [
    { name: '圣诞快乐', color: '#D4AF37' },
    { name: '节日快乐', color: '#922B21' },
    { name: '温馨时光', color: '#0B5345' }
  ]
  
  placeholderImages.forEach((placeholder, index) => {
    const canvas = document.createElement('canvas')
    canvas.width = 800
    canvas.height = 600
    const ctx = canvas.getContext('2d')
    
    if (ctx) {
      // 背景渐变
      const gradient = ctx.createLinearGradient(0, 0, 800, 600)
      gradient.addColorStop(0, placeholder.color)
      gradient.addColorStop(1, shadeColor(placeholder.color, -30))
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, 800, 600)
      
      // 绘制文字
      ctx.fillStyle = 'white'
      ctx.font = 'bold 60px Arial'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(placeholder.name, 400, 300)
      ctx.fillText('🎄', 400, 220)
    }
    
    const texture = new THREE.CanvasTexture(canvas)
    createPhotoPlane(texture, placeholder.name, index, true)
  })
}

// 创建圣诞树装饰效果
function createChristmasDecorations() {
  // 清理现有的装饰元素
  decorationGroup.clear()
  
  // 装饰颜色列表
  const decorationColors = [
    0xFF0000, // 红色
    0x00FF00, // 绿色
    0xFFD700, // 金色
    0x0000FF, // 蓝色
    0xFF00FF  // 粉色
  ]
  
  // 生成装饰球
  const decorationCount = 50 // 装饰球数量
  
  for (let i = 0; i < decorationCount; i++) {
    // 使用黄金螺旋算法分布装饰球
    const y = 1 - (i / (decorationCount - 1)) * 2 // y从1到-1
    const radius = Math.sqrt(1 - y * y) // 半径在单位球上的投影
    
    const theta = Math.PI * 2 * i * 0.618033988749895 // 黄金比例
    
    const x = Math.cos(theta) * radius
    const z = Math.sin(theta) * radius
    
    // 调整位置，使装饰球更加自然分布
    const distance = 3 + Math.random() * 1.5 // 距离中心的距离
    const position = new THREE.Vector3(x, y, z).multiplyScalar(distance)
    
    // 确保装饰物在合适的位置，不与照片重叠
    if (position.y > -2) {
      // 随机选择装饰颜色
      const color = decorationColors[Math.floor(Math.random() * decorationColors.length)]
      
      // 创建装饰球几何体
      const geometry = new THREE.SphereGeometry(
        0.1 + Math.random() * 0.05, // 随机大小
        16, // 分段数
        16  // 环数
      )
      
      // 创建材质，设置发光效果
      const material = new THREE.MeshPhongMaterial({
        color: color,
        emissive: color,
        emissiveIntensity: 0.5,
        shininess: 100,
        specular: 0xFFFFFF
      })
      
      // 创建装饰球网格
      const decoration = new THREE.Mesh(geometry, material)
      decoration.position.copy(position)
      
      // 添加到装饰组
      decorationGroup.add(decoration)
      
      // 添加小动画，使装饰球轻微摆动
      gsap.to(decoration.position, {
        x: position.x + (Math.random() - 0.5) * 0.1,
        y: position.y + (Math.random() - 0.5) * 0.1,
        z: position.z + (Math.random() - 0.5) * 0.1,
        duration: 2 + Math.random() * 2,
        repeat: -1,
        yoyo: true,
        ease: "power2.inOut"
      })
    }
  }
  
  // 添加星星树顶装饰
  addTreeTopper()
}

// 添加圣诞树顶星星
function addTreeTopper() {
  // 创建星星几何体
  const geometry = new THREE.SphereGeometry(0.2, 32, 32)
  
  // 创建发光材质
  const material = new THREE.MeshPhongMaterial({
    color: 0xFFD700, // 金色
    emissive: 0xFFD700,
    emissiveIntensity: 1.5,
    shininess: 150,
    specular: 0xFFFFFF,
    transparent: true,
    opacity: 0.9
  })
  
  // 创建星星
  const treeTopper = new THREE.Mesh(geometry, material)
  treeTopper.position.set(0, 5.2, 0) // 放置在树顶
  
  // 添加到装饰组
  decorationGroup.add(treeTopper)
  
  // 添加脉动发光效果
  gsap.fromTo(treeTopper.material, 
    { emissiveIntensity: 1.5, opacity: 0.9 },
    {
      emissiveIntensity: 2.5,
      opacity: 1,
      duration: 1.75,
      repeat: -1,
      yoyo: true,
      ease: "power2.inOut"
    }
  )
}

// 调整颜色亮度的辅助函数
function shadeColor(color, percent) {
  let R = parseInt(color.substring(1, 3), 16);
  let G = parseInt(color.substring(3, 5), 16);
  let B = parseInt(color.substring(5, 7), 16);

  R = Math.floor(R * (100 + percent) / 100);
  G = Math.floor(G * (100 + percent) / 100);
  B = Math.floor(B * (100 + percent) / 100);

  R = (R < 255) ? R : 255;
  G = (G < 255) ? G : 255;
  B = (B < 255) ? B : 255;

  R = Math.round(R);
  G = Math.round(G);
  B = Math.round(B);

  const RR = ((R.toString(16).length === 1) ? "0" + R.toString(16) : R.toString(16));
  const GG = ((G.toString(16).length === 1) ? "0" + G.toString(16) : G.toString(16));
  const BB = ((B.toString(16).length === 1) ? "0" + B.toString(16) : B.toString(16));

  return "#" + RR + GG + BB;
}

// 创建单个照片平面的函数，便于重用
function createPhotoPlane(texture, name, index, isPlaceholder = false) {
  // 安全检查
  if (!texture) {
    console.warn('创建照片平面失败：缺少纹理', { name, index })
    return null
  }
  // 使用黄金螺旋算法计算位置，优化照片环绕分布 - 优化粒子视觉效果
  const totalElements = Math.max(15, Math.min(imageStore.imageList?.length || 20, 20)) // 限制总数为20
  // 优化黄金螺旋参数，使分布更加美观自然
  const phi = Math.acos(-1 + (2 * index) / totalElements)
  const theta = Math.sqrt(totalElements * Math.PI) * phi * 1.5 // 增加旋转密度，使分布更均匀，树形更丰满
  
  // 调整照片在树上的分布，创造更有层次感的高度分布
  const height = 0.2 + 4.5 * (phi / Math.PI) // 优化高度范围，增加底部空间，使树形更自然
  
  // 优化材质设置，提升视觉效果，使照片显示更清晰、颜色更鲜艳
  const material = new THREE.MeshStandardMaterial({
    map: texture,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 1,
    // 根据位置调整材质参数，增加层次感
    metalness: isPlaceholder ? 0.6 : (0.2 + height * 0.04),  // 降低金属感，让照片更真实
    roughness: isPlaceholder ? 0.3 : (0.6 - height * 0.04),  // 适当降低粗糙度，提高清晰度
    emissive: isPlaceholder ? '#FFD700' : 0x151525, // 增强发光效果
    emissiveIntensity: isPlaceholder ? 0.5 : (0.15 + height * 0.03), // 增加发光强度，使照片更明亮
    envMapIntensity: 0.3 // 优化环境映射效果
  })
  
  // 添加圆角效果的平面几何体，并根据位置调整大小 - 优化尺寸比例
  // 优化大小变化，使视觉更平衡
  const sizeFactor = 0.7 + (1 - height/5) * 0.15 // 略微增大基础大小，保留更多细节
  // 调整尺寸，优化粒子效果，使照片更清晰可见
  const geometry = new THREE.PlaneGeometry(0.9 * sizeFactor, 0.68 * sizeFactor, 16, 16)
  const plane = new THREE.Mesh(geometry, material)
  
  // 启用阴影投射和接收
  plane.castShadow = true
  plane.receiveShadow = true
  // 优化半径计算，创建更自然的树形分布，使树更饱满
  const radius = 3.5 * Math.sin(phi) * (1 - 0.25 * (height) / 5.5) // 增加基础半径，使树形更饱满
  
  // 计算树位置 - 确保照片均匀环绕分布
  const treePos = new THREE.Vector3(
    radius * Math.cos(theta),
    height,
    radius * Math.sin(theta)
  )
  
  // 确保位置不重叠，添加微小的随机偏移，创造更自然的分布
  const randomOffset = new THREE.Vector3(
    (Math.random() - 0.5) * 0.25,
    (Math.random() - 0.5) * 0.15,
    (Math.random() - 0.5) * 0.25
  )
  
  // 散开位置 - 创建更有层次感的三维空间
  const scatterPos = new THREE.Vector3(
    treePos.x + (Math.random() - 0.5) * 12,
    treePos.y + (Math.random() - 0.5) * 8,
    treePos.z + (Math.random() - 0.5) * 12
  )
  
  // 设置初始旋转，确保图片朝向更合理 - 优化为更自然的分布
  const treeRot = new THREE.Euler(
    Math.random() * 0.4 - 0.2, // 略微增加倾斜范围，使分布更自然
    theta + Math.PI/2 + (Math.random() - 0.5) * 0.3, // 添加随机性，避免过度规律
    Math.random() * 0.4 - 0.2 // 略微增加旋转范围
  );
  
  const scatterRot = new THREE.Euler(
    Math.random() * Math.PI * 2,
    Math.random() * Math.PI * 2,
    Math.random() * Math.PI * 2
  )
  
  plane.userData = {
    name: name || `照片 ${index + 1}`,
    treePos: treePos,
    treeRot: treeRot,
    scatterPos: scatterPos,
    scatterRot: scatterRot,
    isPlaceholder: isPlaceholder,
    isPhoto: true
  }
  
  // 优化随机偏移量，使照片分布更自然且不重叠
  const offsetX = (Math.random() - 0.5) * 0.15
  const offsetY = (Math.random() - 0.5) * 0.15
  const offsetZ = (Math.random() - 0.5) * 0.15
  
  plane.position.set(
    plane.userData.treePos.x + offsetX + randomOffset.x,
    plane.userData.treePos.y + offsetY + randomOffset.y,
    plane.userData.treePos.z + offsetZ + randomOffset.z
  )
  plane.rotation.copy(plane.userData.treeRot)
  
  // 为所有照片添加微妙的呼吸动画，增强生命力
  const delay = Math.random() * 2
  gsap.fromTo(plane.material, 
    { opacity: 1 },
    {
      opacity: 0.95,
      duration: (4 + Math.random() * 2) / 2,
      repeat: -1,
      delay: delay,
      yoyo: true,
      ease: "power2.inOut"
    }
  )
  
  gsap.fromTo(plane.scale, 
    { x: 1, y: 1, z: 1 },
    {
      x: 1.03,
      y: 1.03,
      z: 1.03,
      duration: (5 + Math.random() * 3) / 2,
      repeat: -1,
      delay: delay + 0.5,
      yoyo: true,
      ease: "power2.inOut"
    }
  )
  
  // 添加轻微的初始缩放变化，增加层次感
  const scaleFactor = 0.9 + Math.random() * 0.2
  plane.scale.set(scaleFactor, scaleFactor, scaleFactor)
  
  // 为占位符添加更明显的呼吸动画，使其更容易识别
  if (isPlaceholder) {
    gsap.fromTo(plane.material, 
      { opacity: 0.9 },
      {
        opacity: 1,
        duration: 1.25,
        repeat: -1,
        yoyo: true,
        ease: "power2.inOut"
      }
    )
    
    gsap.fromTo(plane.material, 
      { emissiveIntensity: 0.3 },
      {
        emissiveIntensity: 0.5,
        duration: 1.75,
        repeat: -1,
        yoyo: true,
        ease: "power2.inOut"
      }
    )
  }
  
  treeGroup.add(plane)
  photoPlanes.push(plane)
}

function createPhotoPlanes() {
  // 清理现有的照片平面
  photoPlanes.forEach(plane => {
    if (plane.material && plane.material.map) {
      plane.material.map.dispose()
    }
    if (plane.material) {
      plane.material.dispose()
    }
    if (plane.geometry) {
      plane.geometry.dispose()
    }
    treeGroup.remove(plane)
  })
  photoPlanes = []

  // 安全检查imageStore
  if (!imageStore || !imageStore.imageList || !Array.isArray(imageStore.imageList)) {
    console.warn('图片存储不可用或为空，创建占位符照片')
    createPlaceholderPhotos()
    return
  }

  // 创建新的照片平面 - 使用picturestore中的图片数据
  const maxImages = Math.min(imageStore.imageList.length, 20) // 限制最大图片数量，避免过多粒子
  
  if (maxImages === 0) {
    console.warn('没有可用的图片，创建占位符照片')
    createPlaceholderPhotos()
    return
  }
  
  // 跟踪加载状态
  let loadedCount = 0
  let failedCount = 0
  
  imageStore.imageList.slice(0, maxImages).forEach((imageData, index) => {
    // 安全检查图片数据
    if (!imageData) {
      console.warn(`图片数据无效 (索引: ${index})`)
      createFallbackPhotoPlane(index)
      failedCount++
      return
    }
    
    // 使用picturestore中的图片信息
    const imageName = imageData.name || imageData.filename || `照片 ${index + 1}`
    const imageUrl = imageData.links.url 
    
    // 如果没有URL，创建占位符
    if (!imageUrl) {
      console.warn(`图片URL不可用: ${imageName}`,imageData)
      createFallbackPhotoPlane(index, imageName)
      failedCount++
      return
    }
    
    // 加载图片纹理，优化照片显示效果
    const textureLoader = new THREE.TextureLoader()
    textureLoader.crossOrigin = 'anonymous' // 解决跨域问题
    
    const texture = textureLoader.load(
      imageUrl,
      (loadedTexture) => { 
        loadedCount++
        console.log(`图片加载成功 ${loadedCount}/${maxImages}: ${imageName}`)
        
        // 确保纹理正确更新
        loadedTexture.needsUpdate = true
        
        // 确保纹理尺寸有效
        if (loadedTexture.image && loadedTexture.image.width > 0 && loadedTexture.image.height > 0) {
          // 纹理有效，继续处理
        } else {
          console.warn(`图片纹理尺寸无效: ${imageName}`)
          createFallbackPhotoPlane(index, imageName)
          failedCount++
        }
      },
      undefined,
      (err) => {
        failedCount++
        console.error(`图片加载失败 ${failedCount}/${maxImages}: ${imageName}`, err)
        // 如果图片加载失败，创建一个更美观的Canvas纹理
        createFallbackPhotoPlane(index, imageName)
      }
    )
    
    // 优化纹理设置，确保照片显示更清晰、更鲜艳
    texture.minFilter = THREE.LinearMipmapLinearFilter
    texture.magFilter = THREE.LinearFilter
    texture.anisotropy = Math.max(1, renderer.capabilities.getMaxAnisotropy() / 2) // 调整各向异性级别
    
    // 设置纹理颜色编码，确保颜色正确显示
    texture.encoding = THREE.sRGBEncoding
    texture.colorSpace = THREE.SRGBColorSpace // 现代Three.js版本使用colorSpace
    
    // 预乘透明度，确保透明图片显示正确
    texture.premultiplyAlpha = true
    
    // 确保纹理正确更新
    texture.needsUpdate = true
    
    // 为纹理添加超时处理
    const timeoutId = setTimeout(() => {
      if (!texture.image || !texture.image.complete) {
        console.warn(`图片加载超时: ${imageName}`)
        // 尝试中断加载并创建占位符
        if (texture.source && texture.source.data && texture.source.data.src) {
          texture.source.data.src = '' // 尝试取消加载
        }
        createFallbackPhotoPlane(index, imageName)
      }
    }, 10000) // 10秒超时
    
    // 清理定时器
    texture.onLoad = () => {
      clearTimeout(timeoutId)
      if (texture.image && texture.image.complete) {
        loadedCount++
        console.log(`图片加载完成: ${imageName}`)
      }
    }
    
    createPhotoPlane(texture, imageName, index, false)
  })
  
  // 添加加载状态更新
  setTimeout(() => {
    if (loadedCount + failedCount === 0) {
      statusText.value = '正在加载图片...'
    } else if (failedCount === maxImages) {
      statusText.value = '所有图片加载失败，显示占位符'
    } else if (failedCount > 0) {
      statusText.value = `加载完成: ${loadedCount}张成功, ${failedCount}张失败`
    } else {
      statusText.value = `所有图片(${loadedCount}张)加载成功`
    }
  }, 100)
}

// 创建备用照片平面
function createFallbackPhotoPlane(index, name = '加载失败') {
  const canvas = document.createElement('canvas')
  canvas.width = 800 // 更大的尺寸以提高清晰度
  canvas.height = 600
  const ctx = canvas.getContext('2d')
  
  if (ctx) {
    // 使用渐变色背景，使占位符更美观
    const gradient = ctx.createLinearGradient(0, 0, 800, 600)
    const colors = [
      ['#D4AF37', '#C08C00'], // 金色系
      ['#922B21', '#7B241C'], // 红色系
      ['#0B5345', '#0A493D'], // 绿色系
      ['#154360', '#113A52']  // 蓝色系
    ]
    const colorPair = colors[index % colors.length]
    gradient.addColorStop(0, colorPair[0])
    gradient.addColorStop(1, colorPair[1])
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, 800, 600)
    
    // 绘制更清晰的图标和文字
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)'
    ctx.font = 'bold 80px Arial'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('📸', 400, 250)
    
    ctx.font = 'bold 40px Arial'
    ctx.fillText(name, 400, 330)
    
    ctx.font = '24px Arial'
    ctx.fillText('图片加载失败', 400, 380)
  }
  
  const fallbackTexture = new THREE.CanvasTexture(canvas)
  fallbackTexture.minFilter = THREE.LinearMipmapLinearFilter
  fallbackTexture.magFilter = THREE.LinearFilter
  fallbackTexture.encoding = THREE.sRGBEncoding
  fallbackTexture.needsUpdate = true
  
  const plane = createPhotoPlane(fallbackTexture, name, index, true)
  if (plane) {
    plane.userData.isFailed = true // 标记为失败的图片
  }
}

function transitionTo(newState) {
  // 添加动画锁，防止频繁切换导致的动画冲突
  if (viewState.value === newState && newState !== 'photo') return
  
  // 停止当前所有正在进行的动画
  gsap.killTweensOf(treeGroup.children, { properties: ['position', 'rotation', 'scale', 'opacity'] })
  
  // 退出照片模式的处理
  if (viewState.value === 'photo' && newState !== 'photo' && activePhoto) {
    // 其他元素先静止，等待照片返回
    const otherElements = treeGroup.children.filter(child => child !== activePhoto)
    
    // 照片返回动画，使用弹性缓动效果
    gsap.to(activePhoto.position, {
      x: activePhoto.userData.scatterPos.x,
      y: activePhoto.userData.scatterPos.y,
      z: activePhoto.userData.scatterPos.z,
      duration: 1.2,
      ease: "elastic.out(1, 0.5)",
      onComplete: () => {
        activePhoto = null
      }
    })
    
    gsap.to(activePhoto.scale, {
      x: 1,
      y: 1,
      z: 1,
      duration: 1.2,
      ease: "elastic.out(1, 0.5)"
    })
  }

  viewState.value = newState

  if (newState === 'closed') {
    statusText.value = "合拢态"
    
    // 为合拢状态添加更丰富的动画效果
    treeGroup.children.forEach((child, index) => {
      // 确保child和userData存在
      if (!child || !child.userData) return;
      
      // 安全检查treePos和treeRot属性
      if (child.userData.treePos && child.userData.treeRot) {
        // 计算基于位置的延迟，使顶部元素先动，形成瀑布效果
        const heightFactor = Math.max(0, (child.userData.treePos.y + 3) / 7)
        const delay = 0.08 * heightFactor + index * 0.0015
        
        // 计算目标位置时添加微小的抖动，避免完美对齐的机械感
        const targetPos = {
          x: child.userData.treePos.x + (Math.random() - 0.5) * 0.1,
          y: child.userData.treePos.y + (Math.random() - 0.5) * 0.1,
          z: child.userData.treePos.z + (Math.random() - 0.5) * 0.1
        }
        
        // 位置动画 - 使用更强的缓动效果
        gsap.to(child.position, {
          ...targetPos,
          duration: 1.2,
          delay: delay,
          ease: "power3.out"
        })
        
        // 旋转动画 - 更自然的过渡
        gsap.to(child.rotation, {
          ...child.userData.treeRot,
          duration: 1.0,
          delay: delay + 0.1,
          ease: "power3.out"
        })
        
        // 添加缩放动画，增强合拢感
        gsap.to(child.scale, {
          x: 0.95 + Math.random() * 0.1, // 略微缩小，创造紧凑感
          y: 0.95 + Math.random() * 0.1,
          z: 0.95 + Math.random() * 0.1,
          duration: 0.8,
          delay: delay + 0.2,
          ease: "power2.inOut"
        })
        
        // 添加透明度闪烁效果，模拟能量聚合
        if (Math.random() > 0.3 && child.material) { // 确保材质存在
          gsap.fromTo(child.material, 
            { opacity: 1 },
            {
              opacity: 0.85,
              duration: 0.25,
              delay: delay + 0.3,
              ease: "power2.in",
              repeat: 1,
              yoyo: true
            }
          )
        }
        
        // 为发光材质添加能量脉冲效果
        if (child.material && typeof child.material.emissiveIntensity === 'number' && child.material.emissiveIntensity > 0.1) {
          gsap.fromTo(child.material, 
            { emissiveIntensity: child.material.emissiveIntensity },
            {
              emissiveIntensity: child.material.emissiveIntensity * 1.3,
              duration: 0.35,
              delay: delay + 0.2,
              ease: "power2.inOut",
              repeat: 1,
              yoyo: true
            }
          )
        }
      }
    })
    
    // 树整体旋转回到中心位置 - 使用弹性效果
    gsap.to(treeGroup.rotation, {
      x: 0, 
      y: 0,
      duration: 1.8,
      ease: "elastic.out(1, 0.3)"
    })
    
    manualRotation.value = 50
    
    // 添加全局粒子效果（简化版）
    // 可以在将来实现真正的粒子系统
    setTimeout(() => {
      treeGroup.children.forEach((child, index) => {
        if (Math.random() > 0.7) { // 30%的元素有额外的强调效果
          gsap.to(child.scale, {
            x: child.scale.x * 1.05,
            y: child.scale.y * 1.05,
            z: child.scale.z * 1.05,
            duration: 0.3,
            yoyo: true,
            repeat: 1,
            ease: "power2.inOut"
          })
        }
      })
    }, 800)

  } else if (newState === 'open') {
    statusText.value = "散开态"
    
    // 优化散开动画，创建更自然流畅的效果
    treeGroup.children.forEach((child, index) => {
      // 确保child和userData存在
      if (!child || !child.userData) return;
      
      // 安全检查scatterPos和scatterRot属性
      if (child.userData.scatterPos && child.userData.scatterRot) {
        // 基于元素位置计算延迟，创造更自然的波扩散效果
        const distance = child.position.length()
        const delay = 0.002 * index + Math.random() * 0.1
        
        // 计算目标位置时添加微小的随机性，避免完美规律
        const targetPos = {
          x: child.userData.scatterPos.x + (Math.random() - 0.5) * 0.3,
          y: child.userData.scatterPos.y + (Math.random() - 0.5) * 0.3,
          z: child.userData.scatterPos.z + (Math.random() - 0.5) * 0.3
        }
        
        // 创建更流畅的散开路径，先加速后减速
        gsap.to(child.position, {
          ...targetPos,
          duration: 2.0,
          delay: delay,
          ease: "power3.out"
        })
        
        // 旋转动画更加平滑
        gsap.to(child.rotation, {
          ...child.userData.scatterRot,
          duration: 1.6,
          delay: delay + 0.1,
          ease: "power3.out"
        })
        
        // 添加缩放动画，增强散开感
        gsap.to(child.scale, {
          x: 1.05 + Math.random() * 0.1,
          y: 1.05 + Math.random() * 0.1,
          z: 1.05 + Math.random() * 0.1,
          duration: 1.0,
          delay: delay + 0.3,
          ease: "power2.out"
        })
        
        // 添加透明度呼吸效果
        gsap.fromTo(child.material, 
          { opacity: 1 },
          {
            opacity: 0.95,
            duration: 0.4,
            delay: delay + 0.5,
            ease: "power2.out",
            repeat: 1,
            yoyo: true
          }
        )
      }
    })
    
    // 树整体轻微旋转，增加动态感
    gsap.to(treeGroup.rotation, {
      x: (Math.random() - 0.5) * 0.1,
      y: (Math.random() - 0.5) * 0.1,
      duration: 2.5,
      ease: "power2.out"
    })

  } else if (newState === 'photo') {
    
    if (photoPlanes.length > 0) {
      // 如果有活跃照片，先归位并恢复其他元素 - 优化过渡效果
      if (activePhoto) {
        gsap.to(activePhoto.position, {
          x: activePhoto.userData.scatterPos.x,
          y: activePhoto.userData.scatterPos.y,
          z: activePhoto.userData.scatterPos.z,
          duration: 0.8,
          ease: "power3.inOut"
        })
        gsap.to(activePhoto.scale, { 
          x: 1, 
          y: 1, 
          z: 1, 
          duration: 0.8,
          ease: "power3.inOut"
        })
        // 恢复材质属性，确保所有修改的属性都正确重置
        if (activePhoto.material && activePhoto.userData.originalMaterial) {
          gsap.to(activePhoto.material, {
            opacity: activePhoto.userData.originalMaterial.opacity || 1,
            emissiveIntensity: activePhoto.userData.originalMaterial.emissiveIntensity || 0.1,
            metalness: activePhoto.userData.originalMaterial.metalness || 0.3,
            roughness: activePhoto.userData.originalMaterial.roughness || 0.7,
            duration: 0.5,
            ease: "power2.inOut"
          })
          // 恢复toneMapped设置
          activePhoto.material.toneMapped = activePhoto.userData.originalMaterial.toneMapped !== undefined ? activePhoto.userData.originalMaterial.toneMapped : true
        } else if (activePhoto.material) {
          gsap.to(activePhoto.material, {
            opacity: 1,
            duration: 0.5
          })
        }
      }
      
      statusText.value = "照片展示"
      
      // 只在没有指定照片时随机选择
      if (!activePhoto || !photoPlanes.includes(activePhoto)) {
        const randomIndex = Math.floor(Math.random() * photoPlanes.length);
        activePhoto = photoPlanes[randomIndex];
      }
      
      // 让其他元素后退和变暗 - 更自然的效果
      const otherElements = treeGroup.children.filter(child => child !== activePhoto)
      otherElements.forEach((element, index) => {
        // 基于距离计算动画参数，创造层次感
        const distance = element.position.distanceTo(activePhoto.position)
        const depthOffset = Math.min(1.2, 0.3 + distance * 0.1)
        const duration = 1.0 + Math.random() * 0.2
        const delay = index * 0.002 + Math.random() * 0.1
        
        // 沿视线方向后退
        const direction = new THREE.Vector3().subVectors(
          element.position,
          camera.position
        ).normalize()
        
        gsap.to(element.position, {
          x: element.position.x - direction.x * depthOffset,
          y: element.position.y - direction.y * depthOffset,
          z: element.position.z - direction.z * depthOffset,
          duration: duration,
          delay: delay,
          ease: "power3.inOut"
        })
        
        // 轻微缩小其他元素
        gsap.to(element.scale, {
          x: element.scale.x * 0.85,
          y: element.scale.y * 0.85,
          z: element.scale.z * 0.85,
          duration: duration * 0.8,
          delay: delay + 0.1,
          ease: "power2.inOut"
        })
        
        // 如果元素有材质，降低亮度和不透明度
        if (element.material) {
          gsap.to(element.material, {
            opacity: 0.65,
            duration: duration * 0.8,
            delay: delay + 0.2,
            ease: "power2.inOut"
          })
          // 降低发光强度
          if (element.material.emissiveIntensity) {
            gsap.to(element.material, {
              emissiveIntensity: element.material.emissiveIntensity * 0.3,
              duration: duration * 0.8,
              delay: delay + 0.2
            })
          }
        }
      })
      
      // 为选中的照片添加突出效果
      if (activePhoto) {
        // 计算相机前方的理想展示位置
        const targetPosition = new THREE.Vector3()
        camera.getWorldDirection(targetPosition)
        targetPosition.multiplyScalar(-2.5)
        targetPosition.add(camera.position)
        
        // 平滑移动到展示位置
        gsap.to(activePhoto.position, {
          x: targetPosition.x,
          y: targetPosition.y + 0.2, // 略微抬高，更醒目
          z: targetPosition.z,
          duration: 1.2,
          ease: "power3.out"
        })
        
        // 放大效果
        gsap.to(activePhoto.scale, {
          x: 1.8,
          y: 1.8,
          z: 1.8,
          duration: 1.2,
          ease: "power3.out"
        })
        
        // 旋转以正面朝向相机
        const lookAtVector = new THREE.Vector3()
        camera.getWorldPosition(lookAtVector)
        activePhoto.lookAt(lookAtVector)
        
        // 微调旋转，避免完全正面的呆板效果
        const finalRotation = new THREE.Euler(
          activePhoto.rotation.x + (Math.random() - 0.5) * 0.1,
          activePhoto.rotation.y,
          activePhoto.rotation.z + (Math.random() - 0.5) * 0.1
        )
        
        gsap.to(activePhoto.rotation, {
          x: finalRotation.x,
          y: finalRotation.y,
          z: finalRotation.z,
          duration: 1.0,
          ease: "power3.out"
        })
        
        // 增强材质效果，使其更突出，解决照片颜色偏暗问题
        if (activePhoto.material) {
          // 保存原始材质属性
          activePhoto.userData.originalMaterial = {
            opacity: activePhoto.material.opacity,
            emissiveIntensity: activePhoto.material.emissiveIntensity,
            metalness: activePhoto.material.metalness,
            roughness: activePhoto.material.roughness,
            toneMapped: activePhoto.material.toneMapped
          }
          
          // 调整发光强度、金属感和粗糙度，使照片更明亮鲜艳
          gsap.to(activePhoto.material, {
            opacity: 1,
            emissiveIntensity: activePhoto.material.emissiveIntensity * 2.2, // 大幅增加发光强度
            metalness: Math.min(0.7, activePhoto.material.metalness + 0.1), // 略微增加金属感
            roughness: Math.max(0.2, activePhoto.material.roughness - 0.2), // 降低粗糙度，增加反射
            duration: 0.8,
            ease: "power2.out"
          })
          
          // 确保照片在高曝光环境下正确显示
          activePhoto.material.toneMapped = true
          
          // 添加轻微的呼吸动画，增强生命力
          gsap.to(activePhoto.material, {
            opacity: [1, 0.99, 1],
            emissiveIntensity: [activePhoto.material.emissiveIntensity * 2.2, activePhoto.material.emissiveIntensity * 2.3, activePhoto.material.emissiveIntensity * 2.2],
            duration: 3,
            repeat: -1,
            ease: "power2.inOut"
          })
        }
      }
      
      // No duplicate animation code needed here
      
      statusText.value = `展示图片: ${activePhoto.userData.name || '未知'}`;
    } else {
      statusText.value = "请先添加照片"
      viewState.value = 'open'
    }
  }
}

// ----------------------------------------------------------------------
// 4. Three.js Initialization & Helpers
// ----------------------------------------------------------------------
function initThree() {
  scene = new THREE.Scene()
  scene.background = new THREE.Color('#050510')
  scene.fog = new THREE.FogExp2('#050510', 0.02)
  camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000)
  camera.position.set(0, 0, 12)
  // 增强渲染质量，提升电影感，优化颜色显示
  renderer = new THREE.WebGLRenderer({ 
    antialias: true, // 启用抗锯齿
    powerPreference: "high-performance",
    alpha: true, // 启用alpha通道
    stencil: false, // 禁用模板缓冲区以提高性能
    precision: "highp" // 使用高精度
  })
  renderer.setSize(window.innerWidth, window.innerHeight)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.toneMapping = THREE.ACESFilmicToneMapping // 电影级色调映射
  renderer.toneMappingExposure = 1.5 // 增加曝光，使颜色更明亮鲜艳
  renderer.shadowMap.enabled = true // 启用阴影映射
  renderer.shadowMap.type = THREE.PCFSoftShadowMap // 使用软阴影
  
  // 设置输出编码，确保颜色正确显示
  renderer.outputEncoding = THREE.sRGBEncoding
  
  canvasContainer.value.appendChild(renderer.domElement)
  
  // 添加点击事件监听
  renderer.domElement.addEventListener('click', handleClick)
  renderer.domElement.addEventListener('mousemove', onMouseMove)
  // 添加鼠标拖拽相关事件监听
  renderer.domElement.addEventListener('mousedown', onMouseDown)
  renderer.domElement.addEventListener('mouseup', onMouseUp)
  renderer.domElement.addEventListener('mouseleave', onMouseLeave)
  
  // 添加装饰组到场景
  treeGroup.add(decorationGroup)
  
  // 创建圣诞树装饰效果
  createChristmasDecorations()

  // 调整光照以增强主色系效果，使颜色更鲜艳自然
  scene.add(new THREE.AmbientLight(0x2a2a3e, 0.4)) // 提高环境光强度，使整体更明亮
  
  // 主光源，使用更自然的白色光，确保颜色正确显示
  const mainLight = new THREE.DirectionalLight(0xffffff, 2.0);
  mainLight.position.set(3, 10, 5);
  mainLight.castShadow = true;
  mainLight.shadow.mapSize.width = 2048;
  mainLight.shadow.mapSize.height = 2048;
  scene.add(mainLight)
  
  // 金色点光源，增强温暖效果
  const goldSpot = new THREE.PointLight('#FFD700', 7, 25); 
  goldSpot.position.set(-4, 3, 4);
  goldSpot.intensity = 7;
  scene.add(goldSpot)
  
  // 优化红色点光源，使用更鲜艳的红色
  const redSpot = new THREE.PointLight('#FF4444', 5, 20); 
  redSpot.position.set(4, -1, 3);
  redSpot.intensity = 5;
  scene.add(redSpot)
  
  // 添加一个明亮的蓝色补光，平衡色彩
  const blueSpot = new THREE.PointLight('#4444FF', 3, 15);
  blueSpot.position.set(0, 4, -4);
  scene.add(blueSpot)

  // 加强电影感辉光与光晕效果，优化颜色显示
  composer = new EffectComposer(renderer)
  composer.addPass(new RenderPass(scene, camera))
  
  // 优化bloom效果，避免过度辉光导致颜色失真
  const bloomEffect = new BloomEffect({
    intensity: 1.8,          // 略微降低辉光强度，避免颜色失真
    luminanceThreshold: 0.15, // 调整阈值，平衡辉光效果
    luminanceSmoothing: 0.3,  // 平滑过渡
    mipmapBlur: true         // 启用高质量模糊
  })
  
  // 优化暗角效果，避免过于暗淡
  const vignetteEffect = new VignetteEffect({
    darkness: 0.4,  // 降低暗角强度，使画面更明亮
    offset: 0.6     // 调整暗角偏移
  })
  
  // 添加色调映射效果
  const toneMappingEffect = new ToneMappingEffect({
    resolutionScale: 1.0
  })
  
  // 组合所有效果
  composer.addPass(new EffectPass(
    camera, 
    bloomEffect, 
    vignetteEffect,
    toneMappingEffect,
    new SMAAEffect()
  ))

  window.addEventListener('resize', onWindowResize)
}

function createEnvironment() {
  try {
    // 创建更密集、更有层次感的星空背景，增强高级感
    const geo = new THREE.BufferGeometry()
    const positions = new Float32Array(3000 * 3)
    const colors = new Float32Array(3000 * 3)
  
  for(let i=0; i<3000; i++) {
    // 生成均匀分布的星星位置
    const i3 = i * 3
    const distance = 40 + Math.random() * 60
    const theta = Math.random() * Math.PI * 2
    const phi = Math.random() * Math.PI
    
    positions[i3] = distance * Math.sin(phi) * Math.cos(theta)
    positions[i3+1] = distance * Math.sin(phi) * Math.sin(theta)
    positions[i3+2] = distance * Math.cos(phi)
    
    // 改进星星颜色分布，避免颜色异常，增加自然感和多样化
    const colorType = Math.random()
    let r, g, b
    
    // 根据随机类型生成不同范围的颜色，保持整体和谐
    if (colorType < 0.4) {
      // 暖色调星光 (偏金黄)
      r = 0.9 + Math.random() * 0.1
      g = 0.7 + Math.random() * 0.3
      b = 0.4 + Math.random() * 0.3
    } else if (colorType < 0.7) {
      // 中性白色星光
      const whiteBrightness = 0.8 + Math.random() * 0.2
      r = whiteBrightness
      g = whiteBrightness * (0.9 + Math.random() * 0.1)
      b = whiteBrightness * (0.8 + Math.random() * 0.2)
    } else {
      // 冷色调星光 (偏蓝白)
      r = 0.7 + Math.random() * 0.3
      g = 0.8 + Math.random() * 0.2
      b = 0.9 + Math.random() * 0.1
    }
    
    // 应用整体亮度调整，确保星星足够明亮且不会过暗
    const finalBrightness = 0.8 + Math.random() * 0.2
    colors[i3] = r * finalBrightness
    colors[i3+1] = g * finalBrightness
    colors[i3+2] = b * finalBrightness
  }
  
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3))
  
  // 为每个粒子创建独立的运动数据
  const velocities = new Float32Array(3000 * 3)
  const originalPositions = positions.slice() // 保存原始位置用于复位
  
  // 初始化每个粒子的速度
  for(let i=0; i<3000; i++) {
    const i3 = i * 3
    // 随机微小速度，使粒子有独立运动
    velocities[i3] = (Math.random() - 0.5) * 0.005
    velocities[i3+1] = (Math.random() - 0.5) * 0.005
    velocities[i3+2] = (Math.random() - 0.5) * 0.005
  }
  
  geo.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3))
  
  // 减小粒子大小，提升视觉效果
  const material = new THREE.PointsMaterial({
    size: 0.04, // 减小粒子大小
    vertexColors: true,
    transparent: true,
    opacity: 0.9, // 稍微提高透明度使效果更自然
    sizeAttenuation: true
  })
  
  const stars = new THREE.Points(geo, material)
  scene.add(stars)
  
  // 添加整体旋转
  stars.rotation.y = 0.2
  stars.userData.animate = true
  stars.userData.originalPositions = originalPositions
  
  // 为单个粒子添加独立的闪烁动画
  for(let i=0; i<3000; i++) {
    const delay = Math.random() * 2
    const duration = 2 + Math.random() * 3
    
    // 为每个粒子创建独立的透明度动画
    gsap.fromTo(
      { opacity: Math.random() * 0.4 + 0.5 },
      { opacity: Math.random() * 0.5 + 0.8 },
      {
        duration: duration,
        repeat: -1,
          yoyo: true,
        delay: delay,
        onUpdate: function() {
          // 这种方法不直接支持单个粒子透明度控制
          // 我们将在动画循环中处理粒子运动
        }
      }
    )
  }
  
  // 为整体添加缓慢的闪烁效果
  gsap.fromTo(material, 
    { opacity: 0.9 },
    {
      opacity: 1,
      duration: 4 + Math.random() * 3,
      repeat: -1,
      yoyo: true
    }
  )
  } catch (error) {
    console.error('创建粒子系统失败:', error)
  }
}

function createTreeElements() {
  scene.add(treeGroup)
  
  // 添加装饰组到场景
  treeGroup.add(decorationGroup)
  
  // 创建圣诞树装饰效果
  createChristmasDecorations()
  
  // 移除树干，直接从树顶开始创建装饰元素，形成更轻盈的视觉效果
  
  // 优化主色系：哑光绿+金属金+圣诞红色
  const materials = [
    new THREE.MeshStandardMaterial({ 
      color: '#0B5345', // 哑光绿
      roughness: 0.8, // 增加哑光感
      metalness: 0.1
    }),
    new THREE.MeshStandardMaterial({ 
      color: '#D4AF37', // 金属金
      roughness: 0.1, 
      metalness: 0.9, 
      emissive: '#FFE7BA', 
      emissiveIntensity: 0.3 // 增强金色辉光
    }),
    new THREE.MeshStandardMaterial({ 
      color: '#922B21', // 圣诞红色
      roughness: 0.2,
      metalness: 0.3,
      emissive: '#C33',
      emissiveIntensity: 0.15 // 添加微弱的红色辉光
    })
  ]
  
  // 使用黄金分割螺旋算法分配装饰位置，使分布更均匀美观
  const totalElements = 300
  
  // 定义不同几何形状的比例和类型
  const elementTypes = [
    { type: 'sphere', count: 150, material: 0 }, // 绿色球体为主
    { type: 'sphere', count: 60, material: 1 },   // 金色球体
    { type: 'sphere', count: 45, material: 2 },   // 红色球体
    { type: 'box', count: 25, material: 1 },      // 金色立方体
    { type: 'cylinder', count: 20, material: 2 }  // 红色糖果棒
  ]
  
  let elementIndex = 0
  
  // 创建不同类型的装饰元素
  elementTypes.forEach(type => {
    for (let i = 0; i < type.count; i++) {
      let geometry, sizeFactor
      
      // 根据类型创建几何体，并优化大小变化
      if (type.type === 'sphere') {
        sizeFactor = 0.15 + Math.random() * 0.15
        geometry = new THREE.SphereGeometry(sizeFactor, 20, 20)
      } else if (type.type === 'box') {
        sizeFactor = 0.2 + Math.random() * 0.15
        geometry = new THREE.BoxGeometry(sizeFactor, sizeFactor, sizeFactor)
      } else if (type.type === 'cylinder') { // 糖果棒
        sizeFactor = 0.4 + Math.random() * 0.2
        geometry = new THREE.CylinderGeometry(0.04, 0.04, sizeFactor, 6)
      }
      
      const mesh = new THREE.Mesh(geometry, materials[type.material])
      mesh.castShadow = true
      mesh.receiveShadow = true
      
      // 使用黄金螺旋算法计算位置，形成漂亮的锥形树形状
      const phi = Math.acos(-1 + (2 * elementIndex) / totalElements)
      const theta = Math.sqrt(totalElements * Math.PI) * phi
      
      // 调整高度和半径，形成更优雅的圣诞树形状（无树干版本）
      const height = 0 + 5 * (phi / Math.PI) // 高度从0开始，范围0-5
      const radius = 3.0 * Math.sin(phi) * (1 - 0.5 * (height) / 5) // 调整半径比例，使树顶更尖
      
      // 计算树位置
      const treePos = new THREE.Vector3(
        radius * Math.cos(theta),
        height,
        radius * Math.sin(theta)
      )
      
      // 散开位置：创建更有层次感的三维空间
      const scatterPos = new THREE.Vector3(
        treePos.x + (Math.random() - 0.5) * 10,
        treePos.y + (Math.random() - 0.5) * 6,
        treePos.z + (Math.random() - 0.5) * 10
      )
      
      // 树位置的旋转更有方向感
      const treeRot = new THREE.Euler(
        Math.random() * 0.3,
        theta,
        Math.random() * 0.3
      )
      
      // 散开位置的旋转更加随机和动态
      const scatterRot = new THREE.Euler(
        Math.random() * Math.PI * 2,
        Math.random() * Math.PI * 2,
        Math.random() * Math.PI * 2
      )
      
      // 为糖果棒添加特殊处理，使其总是垂直于树表面
      if (type.type === 'cylinder') {
        // 计算从树中心指向装饰的向量
        const normalVector = new THREE.Vector3(treePos.x, 0, treePos.z).normalize()
        
        // 糖果棒的旋转应使其垂直于树表面
        treeRot.y = Math.atan2(normalVector.z, normalVector.x)
        treeRot.z = Math.PI / 2
      }
      
      // 存储初始位置和旋转
      mesh.userData = {
        treePos,
        treeRot,
        scatterPos,
        scatterRot,
        type: type.type
      }
      
      // 初始位置为树位置
      mesh.position.copy(treePos)
      mesh.rotation.copy(treeRot)
      
      // 添加微妙的随机缩放
      const scale = 0.8 + Math.random() * 0.4
      mesh.scale.set(scale, scale, scale)
      
      treeGroup.add(mesh)
      elementIndex++
    }
  })
  
  // 优化树顶星星，增强金色辉光效果
  const starMaterial = new THREE.MeshStandardMaterial({
    color: '#D4AF37', // 金属金色
    emissive: '#FFDE59', // 更明亮的金色辉光
    emissiveIntensity: 1.5, // 增强辉光强度
    roughness: 0.1,
    metalness: 0.9
  })
  const star = new THREE.Mesh(new THREE.OctahedronGeometry(0.4, 0), starMaterial)
  
  // 添加星星闪烁动画
  gsap.fromTo(starMaterial, 
    { emissiveIntensity: 1.5 },
    {
      emissiveIntensity: 2,
      duration: 2,
      repeat: -1,
      yoyo: true
    }
  )
  star.position.set(0, 6, 0) // 提高星星位置使其处于树顶
  star.userData = { 
    treePos: new THREE.Vector3(0, 6, 0), 
    scatterPos: new THREE.Vector3(0, 7, 0), 
    treeRot: new THREE.Euler(0, 0, 0), 
    scatterRot: new THREE.Euler(Math.PI, 0, 0) 
  }
  treeGroup.add(star)
}

// Removed handleImageUpload function

// 优化窗口大小调整性能
let resizeTimeout
function onWindowResize() {
  clearTimeout(resizeTimeout)
  resizeTimeout = setTimeout(() => {
    const container = canvasContainer.value
    if (container) {
      const { clientWidth, clientHeight } = container
      camera.aspect = clientWidth / clientHeight
      camera.updateProjectionMatrix()
      renderer.setSize(clientWidth, clientHeight)
      composer.setSize(clientWidth, clientHeight)
    }
  }, 100)
}
</script>

<style scoped>
.christmas-container {
  position: relative;
  width: 100vw; height: 100vh;
  overflow: hidden; background-color: #050510;
  font-family: system-ui, -apple-system, sans-serif;
}
.canvas-container { width: 100%; height: 100%; }
.hidden-video { position: absolute; width: 1px; height: 1px; opacity: 0; pointer-events: none; }

.ui-layer {
  position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none;
}

/* Status Bar */
.status-bar {
  position: absolute; top: 20px; left: 50%; transform: translateX(-50%);
  z-index: 100;
}
.status-item {
  background: rgba(11, 83, 69, 0.85); color: #F7DC6F;
  padding: 8px 20px; border-radius: 20px;
  backdrop-filter: blur(10px); border: 1px solid rgba(247, 220, 111, 0.3);
  font-size: 14px; display: flex; align-items: center; gap: 8px;
  box-shadow: 0 4px 15px rgba(0,0,0,0.3);
}
.status-dot { width: 8px; height: 8px; border-radius: 50%; background: #666; transition: 0.3s; }
.status-dot.active { background: #00ff00; box-shadow: 0 0 8px #00ff00; }

/* Left Control Panel */
.control-panel {
  position: absolute; left: 20px; bottom: 20px; width: 220px;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(15px);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  padding: 20px;
  pointer-events: auto;
  color: #fff;
  z-index: 100;
}
.section-title { font-size: 12px; color: #aaa; margin-bottom: 10px; text-transform: uppercase; letter-spacing: 1px; }
.gesture-switch-row { display: flex; justify-content: space-between; align-items: center; font-size: 14px; }
.hint-text { font-size: 11px; color: #666; margin-top: 5px; }

.btn-group { display: flex; gap: 8px; margin-bottom: 10px; }
.btn-group .el-button { flex: 1; }
.grab-btn { width: 100%; }

/* Gallery Area (Minimal Styling) */
.gallery-area {
  position: absolute;
  right: 20px;
  top: 80px; /* Below control panel */
  width: 250px; /* Adjust width */
  max-height: calc(100vh - 120px); /* Limit height */
  overflow-y: auto; /* Scroll if needed */
  background: rgba(0, 0, 0, 0.5);
  padding: 10px;
  pointer-events: auto; /* Allow interaction */
  border: 1px solid #444;
  border-radius: 5px;
}
.gallery-area h3 {
  margin-top: 0;
  margin-bottom: 10px;
  color: white;
  font-size: 16px;
}
.image-container {
  margin-bottom: 10px;
  border: 1px solid #666;
  border-radius: 4px;
  overflow: hidden;
}
.image-preview {
  width: 100%;
  height: auto; /* Maintain aspect ratio */
  display: block;
}
.image-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 80px; /* Set a fixed height for placeholder */
  background-color: #333;
  color: #aaa;
  font-size: 12px;
}

/* Guide Panel */
.guide-panel {
  position: absolute; bottom: 30px; left: 50%; transform: translateX(-50%);
  background: rgba(0,0,0,0.7); padding: 15px 30px; border-radius: 30px;
  display: flex; gap: 20px; pointer-events: none;
  z-index: 100;
}
.guide-item { color: #ddd; font-size: 13px; }
.fade-enter-active, .fade-leave-active { transition: opacity 0.5s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>