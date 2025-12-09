<template>
  <div class="christmas-container">
    <div ref="canvasContainer" class="canvas-container" @mousedown="onMouseDown" @mouseup="onMouseUp" @mousemove="onMouseMove"></div>
    
    <video ref="videoElement" class="webcam-display" playsinline muted></video>

    <div class="ui-layer">
      
      <div class="status-bar">
        <div class="status-item">
          <span class="status-dot" :class="{ active: isGestureMode && isModelReady }"></span>
          {{ statusText }}
        </div>
        <div class="status-item" v-if="imageStore.loading.images">
          加载图片中...
        </div>
      </div>

      <div class="control-panel">
        <div class="panel-section">
        
          <div class="gesture-switch-row">
            <span>👋 手势识别</span>
            <el-switch 
              v-model="isGestureMode" 
              :loading="isLoadingModel"
              @change="toggleGestureControl"
              style="--el-switch-on-color: #0B5345;"
            />
          </div>
          <div class="hint-text" v-if="!isGestureMode">未开启手势时可使用鼠标拖拽旋转</div>
        </div>

        <el-divider style="margin: 5px 0; border-color: rgba(255,255,255,0.1);" />

        <div class="panel-section">
          
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
            :disabled="photos.length === 0" 
            @click="manualTransition('photo')"
          >
            🖼️ 抓取照片
          </el-button>
        </div>
      </div>

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
import { ref, onMounted, onUnmounted } from 'vue'
import * as THREE from 'three'
import { gsap } from 'gsap'
import { EffectComposer, RenderPass, EffectPass, BloomEffect, SMAAEffect } from 'postprocessing'
import { FilesetResolver, HandLandmarker } from '@mediapipe/tasks-vision'
import { UploadFilled } from '@element-plus/icons-vue'
import { useImageStore } from '@/store' 
import { ElMessage } from 'element-plus'

// --- Pinia Store ---
const imageStore = useImageStore()

// --- 状态变量 ---
const viewState = ref('closed') // 'closed', 'open', 'photo'
const isGestureMode = ref(false)
const isLoadingModel = ref(false)
const isModelReady = ref(false)
const statusText = ref('场景已就绪，等待指令')

// --- Three.js 核心 ---
let scene, camera, renderer, composer
let treeGroup = new THREE.Group()
let photos = [] 
let activePhoto = null
let animationId = null
const canvasContainer = ref(null)

// --- MediaPipe 核心 ---
const videoElement = ref(null)
let handLandmarker = null
let lastVideoTime = -1
let stream = null

// --- 交互变量 ---
let isDragging = false
let previousMousePosition = { x: 0, y: 0 }
const ROTATE_SPEED = 0.005
const PROXY_DOMAIN = 'https://free.picui.cn'
const PROXY_PATH = '/picui'
let textureLoader = null 

// --- 生命周期 ---
onMounted(async () => {
  textureLoader = new THREE.TextureLoader()
  textureLoader.setCrossOrigin('anonymous') 

  initThree()
  createEnvironment()
  createTreeElements()
  animate()
  
  await loadImagesFromStore()
  
  window.addEventListener('resize', onWindowResize)
})

onUnmounted(() => {
  cancelAnimationFrame(animationId)
  stopWebcam()
  if (renderer) renderer.dispose()
  if (handLandmarker) handLandmarker.close()
  window.removeEventListener('resize', onWindowResize)
  scene.traverse((object) => {
    if (object.geometry) object.geometry.dispose();
    if (object.material) {
      const materials = Array.isArray(object.material) ? object.material : [object.material];
      materials.forEach(m => {
          m.map?.dispose(); 
          m.dispose(); 
      });
    }
  });
})

// --- 图片加载和场景管理函数 (保持不变) ---

function clearPhotosFromScene() {
    photos.forEach(mesh => {
        treeGroup.remove(mesh)
        if (mesh.material) {
            const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
            materials.forEach(m => {
                m.map?.dispose() 
                m.dispose() 
            })
        }
        mesh.geometry.dispose()
    })
    photos = []
}

function addPhotoToScene(imgData) {
    const originalUrl = imgData.links?.url || imgData.links?.thumbnail_url
    if (!originalUrl) {
        console.warn('图片数据中缺少有效的 URL:', imgData)
        return
    }
    
   let finalUrl = originalUrl
   if (import.meta.env.DEV) { 
        // ❌ 修正：replace 必须传入两个参数
        finalUrl = originalUrl.replace(PROXY_DOMAIN, PROXY_PATH) 
        console.log(`[DEV MODE] 使用代理 URL: ${finalUrl}`)
    } else {
        // ✅ 生产环境 (或未配置代理时): 直接使用完整的 HTTPS URL
        // 注意：这要求 PROXY_DOMAIN 必须已配置 CORS 头部
        finalUrl = originalUrl
        console.log(`[PROD MODE] 使用完整 URL: ${finalUrl}`)
    }
    const width = imgData.width || 1024
    const height = imgData.height || 768
    console.log(finalUrl)
    textureLoader.load(finalUrl, 
        (texture) => {
            texture.colorSpace = THREE.SRGBColorSpace
            
            const aspect = width / height
            const baseSize = 1.5
            const geo = new THREE.PlaneGeometry(baseSize * aspect, baseSize)
            const mat = new THREE.MeshBasicMaterial({ 
                map: texture, 
                side: THREE.DoubleSide,
                transparent: true,
            })
            
            const mesh = new THREE.Mesh(geo, mat)
            
            const r = Math.random() * 2 + 1 
            const theta = Math.random() * Math.PI * 2 
            const y = (Math.random() - 0.5) * 6 
            
            mesh.userData = {
                isPhoto: true,
                treePos: new THREE.Vector3(Math.cos(theta)*r, y, Math.sin(theta)*r),
                treeRot: new THREE.Euler(0, -theta, 0),
                scatterPos: new THREE.Vector3((Math.random()-0.5)*12, (Math.random()-0.5)*10, (Math.random()-0.5)*5),
                scatterRot: new THREE.Euler(Math.random(), Math.random(), 0),
                originalScale: new THREE.Vector3(1, 1, 1)
            }
            
            const initialPos = viewState.value === 'closed' ? mesh.userData.treePos : mesh.userData.scatterPos
            const initialRot = viewState.value === 'closed' ? mesh.userData.treeRot : mesh.userData.scatterRot
            mesh.position.copy(initialPos)
            mesh.rotation.copy(initialRot)
            
            treeGroup.add(mesh)
            photos.push(mesh)
            statusText.value = `已加载 ${photos.length} 张照片`
        },
        undefined,
        (err) => {
            console.error('加载图片纹理失败，CORS/代理问题:', finalUrl, err)
            ElMessage.error(`加载图片失败: ${imgData.origin_name || '未知文件'}`)
        }
    )
}

async function loadImagesFromStore() {
    clearPhotosFromScene() 
    
    try {
        await imageStore.fetchImages() 

        if (imageStore.imageList.length === 0) {
            statusText.value = "Store 中无图片数据"
            ElMessage.warning('Pinia Store 中图片列表为空。')
            return
        }

        imageStore.imageList.forEach(imgData => {
            addPhotoToScene(imgData)
        })
        
        ElMessage.success(`成功加载 ${imageStore.imageList.length} 张图片。`)
        if (photos.length > 0) {
            transitionTo('open')
        }

    } catch (error) {
        console.error('加载图片列表失败:', error)
        ElMessage.error(`加载图片列表失败: ${imageStore.error || '网络错误'}`)
    }
}

// ------------------------------------
// --- THREE.JS / 鼠标交互 (保持不变)
// ------------------------------------

function onMouseDown(event) {
    if (isGestureMode.value) return
    isDragging = true
    previousMousePosition = { x: event.clientX, y: event.clientY }

    const pointer = new THREE.Vector2();
    pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
    pointer.y = - (event.clientY / window.innerHeight) * 2 + 1;
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(pointer, camera);
    const intersects = raycaster.intersectObjects(photos);

    if (intersects.length > 0 && viewState.value === 'open') {
        const hitPhoto = intersects[0].object;
        activePhoto = hitPhoto;
        transitionTo('photo');
    }
}

function onMouseUp() {
    isDragging = false
}

function onMouseMove(event) {
    if (!isDragging || isGestureMode.value) return
    
    const deltaX = event.clientX - previousMousePosition.x
    const deltaY = event.clientY - previousMousePosition.y 

    // 360 度旋转
    treeGroup.rotation.y += deltaX * ROTATE_SPEED 
    treeGroup.rotation.x += deltaY * ROTATE_SPEED 
    
    previousMousePosition = { x: event.clientX, y: event.clientY }
}

// ------------------------------------
// --- MEDIA PIPE / 手势交互 
// ------------------------------------

// 切换手势模式
async function toggleGestureControl(val) {
    if (val) {
      if (!handLandmarker) {
        isLoadingModel.value = true
        statusText.value = "正在下载 AI 模型..."
        try {
          await initMediaPipe()
          statusText.value = "模型加载成功，尝试启动摄像头..."
        } catch (e) {
          console.error("模型加载或初始化失败:", e)
          statusText.value = "模型加载失败，请重试"
          isGestureMode.value = false
          ElMessage.error("手势模型加载或初始化失败。")
        } finally {
          isLoadingModel.value = false
        }
      } else {
        // 模型已加载，直接启动摄像头并开始预测
        await startWebcam()
      }
    } else {
      stopWebcam()
      statusText.value = "已切换至手动控制"
      isModelReady.value = false 
    }
}

// 手势预测循环
function predictWebcam() {
    if (!isGestureMode.value) return; 

    let startTimeMs = performance.now()
    if (videoElement.value && videoElement.value.readyState === videoElement.value.HAVE_ENOUGH_DATA) {
      if (videoElement.value.currentTime !== lastVideoTime) {
        lastVideoTime = videoElement.value.currentTime
        // MediaPipe 检测
        const results = handLandmarker.detectForVideo(videoElement.value, startTimeMs)
        
        if (results.landmarks && results.landmarks.length > 0) {
          analyzeGesture(results.landmarks[0])
        }
      }
    }
    // 自动循环调用
    requestAnimationFrame(predictWebcam);
}

// 分析手势逻辑 (保持不变)
function analyzeGesture(lm) {
    const tips = [8, 12, 16, 20] 
    const thumbTip = 4
    const indexTip = 8
    const base = 0 

    const isFist = tips.every(tip => lm[tip].y > lm[tip - 2].y)
    const isAllOpen = tips.every(tip => lm[tip].y < lm[tip - 2].y) && (lm[indexTip].y < lm[base].y - 0.1)

    const d = Math.sqrt(Math.pow(lm[thumbTip].x - lm[indexTip].x, 2) + Math.pow(lm[thumbTip].y - lm[indexTip].y, 2))
    const isPinch = d < 0.04

    if (isFist) {
        transitionTo('closed')
    } else if (isPinch) {
        transitionTo('photo')
    } else if (isAllOpen) {
        transitionTo('open')
    }

    if (viewState.value === 'open' && !activePhoto) {
        const handX = lm[base].x 
        const rotateSpeed = (handX - 0.5) * 0.05 
        treeGroup.rotation.y -= rotateSpeed 
    }
}

// 停止摄像头
function stopWebcam() {
    if (stream) {
        stream.getTracks().forEach(track => track.stop());
        stream = null;
    }
    // 停止时将 <video> 元素隐藏
    if (videoElement.value) {
        videoElement.value.style.display = 'none';
        videoElement.value.srcObject = null;
    }
    isModelReady.value = false;
    // 注意：这里我们不关闭 handLandmarker，因为它可能被重复使用
    // if (handLandmarker) { handLandmarker.close(); handLandmarker = null; } 
}


// 启动摄像头
async function startWebcam() {
    if (!navigator.mediaDevices || !handLandmarker) return;

    try {
        const localStream = await navigator.mediaDevices.getUserMedia({ 
            video: true 
        });
        stream = localStream; // 保存 stream 引用以便停止

        // 1. 将视频流分配给 <video> 元素
        videoElement.value.srcObject = stream;
        
        // 2. 核心：将 <video> 元素设置为可见
        videoElement.value.style.display = 'block'; 
        
        // 确保视频加载并开始播放
        await new Promise((resolve, reject) => {
            const video = videoElement.value;
            if (!video) return reject(new Error("Video element is null."));
            
            video.onloadeddata = () => {
              video.play().then(resolve).catch(err => reject(new Error("Video playback failed: " + err)));
            };
            if (video.readyState >= video.HAVE_ENOUGH_DATA) {
                 video.play().then(resolve).catch(err => reject(new Error("Video playback failed: " + err)));
            }
            setTimeout(() => reject(new Error("Video data loading timeout.")), 5000); 
        });

        // 3. 更新状态并开始推理
        isModelReady.value = true;
        statusText.value = "摄像头就绪，正在识别手势...";
        requestAnimationFrame(predictWebcam); 

    } catch (err) {
        console.error('无法启动摄像头:', err);
        ElMessage.error(`无法访问摄像头：${err.message || '请确保设备连接且已授权。'}`);
        // 如果失败，自动关闭手势模式
        isGestureMode.value = false;
    }
}

// 初始化 MediaPipe
async function initMediaPipe() {
    try {
        const vision = await FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm'
        )
        handLandmarker = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: `https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task`,
            delegate: 'GPU'
          },
          runningMode: 'VIDEO',
          numHands: 1
        })
        // 成功加载模型后，尝试启动摄像头
        await startWebcam() 
    } catch (e) {
        console.error("MediaPipe 模型加载失败", e)
        throw new Error("MediaPipe initialization failed.")
    }
}

function onWindowResize() {
  camera.aspect = window.innerWidth/window.innerHeight; camera.updateProjectionMatrix()
  renderer.setSize(window.innerWidth, window.innerHeight); composer.setSize(window.innerWidth, window.innerHeight)
}


function manualTransition(state) {
  transitionTo(state)
}

function animate() {
  animationId = requestAnimationFrame(animate)

  if (viewState.value === 'open' && !activePhoto) {
    // 轻微的浮动动画
    treeGroup.children.forEach((child, i) => {
      child.position.y += Math.sin(Date.now() * 0.001 + i) * 0.002
    })
  }

  composer.render()
}

function transitionTo(newState) {
  if (viewState.value === newState && newState !== 'photo') return

  if (viewState.value === 'photo' && newState !== 'photo' && activePhoto) {
    gsap.to(activePhoto.position, { ...activePhoto.userData.scatterPos, duration: 1 })
    gsap.to(activePhoto.rotation, { ...activePhoto.userData.scatterRot, duration: 1 })
    gsap.to(activePhoto.scale, { x: 1, y: 1, z: 1, duration: 1 })
    activePhoto = null
  }

  viewState.value = newState

  if (newState === 'closed') {
    statusText.value = "合拢态"
    treeGroup.children.forEach(child => {
      if (child.userData.treePos) {
        gsap.to(child.position, { ...child.userData.treePos, duration: 1.5, ease: "power2.inOut" })
        gsap.to(child.rotation, { ...child.userData.treeRot, duration: 1.5 })
      }
    })
    gsap.to(treeGroup.rotation, { x: 0, y: 0, duration: 1.5 })

  } else if (newState === 'open') {
    statusText.value = "散开态"
    treeGroup.children.forEach(child => {
      if (child.userData.scatterPos) {
        gsap.to(child.position, { ...child.userData.scatterPos, duration: 2, ease: "power3.out" })
        gsap.to(child.rotation, { ...child.userData.scatterRot, duration: 2 })
      }
    })

  } else if (newState === 'photo') {
    if (photos.length > 0) {
      statusText.value = "照片展示"
      if (!activePhoto) activePhoto = photos[Math.floor(Math.random() * photos.length)]
      
      gsap.to(activePhoto.position, { x: 0, y: 0, z: 8, duration: 1 })
      gsap.to(activePhoto.rotation, { x: 0, y: -treeGroup.rotation.y, z: 0, duration: 1 }) 
      gsap.to(activePhoto.scale, { x: 3, y: 3, z: 3, duration: 1 })
    } else {
      statusText.value = "请先从 Store 加载照片"
      viewState.value = 'open'
    }
  }
}

// ------------------------------------
// --- THREE.JS 初始化 (集成粒子美化)
// ------------------------------------

function initThree() {
  scene = new THREE.Scene()
  scene.background = new THREE.Color('#050510')
  scene.fog = new THREE.FogExp2('#050510', 0.02)
  camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000)
  camera.position.set(0, 0, 12)
  renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: "high-performance" })
  renderer.setSize(window.innerWidth, window.innerHeight)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.2
  canvasContainer.value.appendChild(renderer.domElement)
  
  // 灯光
  scene.add(new THREE.AmbientLight(0xffffff, 0.2))
  const mainLight = new THREE.DirectionalLight(0xfff0dd, 1.5); mainLight.position.set(5, 10, 7); scene.add(mainLight)
  const goldSpot = new THREE.PointLight('#F7DC6F', 5, 20); goldSpot.position.set(-5, 2, 5); scene.add(goldSpot)
  const redSpot = new THREE.PointLight('#922B21', 5, 20); redSpot.position.set(5, -2, 5); scene.add(redSpot)

  // 后处理 (调整 Bloom 强度和阈值)
  composer = new EffectComposer(renderer)
  composer.addPass(new RenderPass(scene, camera))
  composer.addPass(new EffectPass(camera, 
    new BloomEffect({ 
      intensity: 2.0, 
      luminanceThreshold: 0.1, 
      mipmapBlur: true 
    }), 
    new SMAAEffect()
  ))
}

// 粒子位置和材质调整，实现空间填充和发光特效
function createEnvironment() {
  const particleCount = 4000; 
  const boxSize = 60; 

  const geo = new THREE.BufferGeometry()
  const arr = new Float32Array(particleCount * 3)

  // 粒子位置：均匀分布在以原点为中心的立方体空间内
  for(let i=0; i<particleCount * 3; i++) {
    arr[i] = (Math.random() - 0.5) * boxSize
  }
  
  geo.setAttribute('position', new THREE.BufferAttribute(arr, 3))
  
  // 粒子材质：使用更亮的颜色和 AdditiveBlending 增强发光
  const particleMaterial = new THREE.PointsMaterial({ 
    size: 0.08, 
    color: '#FFFFE0', 
    transparent: true, 
    opacity: 0.8,
    blending: THREE.AdditiveBlending, 
    depthWrite: false 
  });
  
  scene.add(new THREE.Points(geo, particleMaterial));
}

function createTreeElements() {
  scene.add(treeGroup)
  const geometries = [new THREE.SphereGeometry(0.15, 16, 16), new THREE.BoxGeometry(0.2, 0.2, 0.2), new THREE.CylinderGeometry(0.02, 0.02, 0.4, 8)]
  const materials = [
    new THREE.MeshStandardMaterial({ color: '#0B5345', roughness: 0.7 }),
    new THREE.MeshStandardMaterial({ color: '#F7DC6F', roughness: 0.2, metalness: 0.9, emissive: '#F7DC6F', emissiveIntensity: 0.2 }),
    new THREE.MeshStandardMaterial({ color: '#922B21', roughness: 0.3 })
  ]
  for (let i = 0; i < 300; i++) {
    const progress = i / 300, angle = i * 0.5
    const r = (1 - progress) * 3.5
    const mesh = new THREE.Mesh(geometries[Math.floor(Math.random()*3)], materials[Math.floor(Math.random()*3)])
    mesh.userData = {
      treePos: new THREE.Vector3(Math.cos(angle)*r, (progress*8)-4, Math.sin(angle)*r),
      treeRot: new THREE.Euler(Math.random(), Math.random(), Math.random()),
      scatterPos: new THREE.Vector3((Math.random()-0.5)*15, (Math.random()-0.5)*15, (Math.random()-0.5)*10),
      scatterRot: new THREE.Euler(Math.random()*Math.PI, Math.random()*Math.PI, 0)
    }
    mesh.position.copy(mesh.userData.treePos); mesh.rotation.copy(mesh.userData.treeRot)
    const s = 0.5 + Math.random(); mesh.scale.set(s,s,s)
    treeGroup.add(mesh)
  }
  // 树顶星
  const star = new THREE.Mesh(new THREE.OctahedronGeometry(0.4, 0), new THREE.MeshStandardMaterial({ color: '#F7DC6F', emissive: '#F7DC6F', emissiveIntensity: 1 }))
  star.position.set(0, 4.5, 0)
  star.userData = { treePos: new THREE.Vector3(0,4.5,0), scatterPos: new THREE.Vector3(0,5,0), treeRot: new THREE.Euler(0,0,0), scatterRot: new THREE.Euler(Math.PI,0,0) }
  treeGroup.add(star)
}
</script>

<style scoped>

/* ================================================= */
/* 整体布局和 Three.js 容器 */
/* ================================================= */

.christmas-container {
  position: relative;
  width: 100vw; height: 100vh;
  overflow: hidden;
  background-color: #03030A;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  color: #fff;
}

.canvas-container { width: 100%; height: 100%; }

/* 
  ================================================= 
  📸 核心修改: 摄像头显示样式 
  ================================================= 
*/
.webcam-display {
    /* 默认隐藏，等待 JS 切换为 display: block */
    display: none; 
    
    /* 定位到右上角 */
    position: absolute;
    top: 20px;
    right: 20px;
    
    /* 尺寸和外观 */
    width: 200px; 
    height: 150px;
    border-radius: 12px;
    border: 3px solid #0B5345; /* 圣诞绿边框 */
    /* 镜像翻转，让用户看到自己像照镜子一样 */
    transform: scaleX(-1); 
    box-shadow: 0 0 10px rgba(0,0,0,0.5), 0 0 20px #0B5345;
    z-index: 100; 
    object-fit: cover; 
}


.ui-layer {
  position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none;
}


/* ================================================= */
/* 状态栏 (Status Bar) */
/* ================================================= */

@keyframes pulse {
    0% { box-shadow: 0 0 5px rgba(247, 220, 111, 0.5); }
    50% { box-shadow: 0 0 15px rgba(247, 220, 111, 0.8), 0 0 20px rgba(247, 220, 111, 0.2); }
    100% { box-shadow: 0 0 5px rgba(247, 220, 111, 0.5); }
}

.status-bar {
  position: absolute; top: 20px; left: 50%; transform: translateX(-50%);
  display: flex; gap: 10px; z-index: 10;
}

.status-item {
  background: rgba(11, 83, 69, 0.7);
  color: #F7DC6F;
  padding: 8px 20px; border-radius: 20px;
  backdrop-filter: blur(8px);
  border: 1px solid rgba(247, 220, 111, 0.3);
  font-size: 14px; display: flex; align-items: center; gap: 8px;
  box-shadow: 0 4px 10px rgba(0,0,0,0.4);
  animation: pulse 4s infinite ease-in-out;
}

.status-dot { width: 8px; height: 8px; border-radius: 50%; background: #666; transition: 0.3s; }

.status-dot.active {
    background: #00ff00;
    box-shadow: 0 0 8px #00ff00, 0 0 15px rgba(0, 255, 0, 0.5);
}


/* ================================================= */
/* 控制面板 (Control Panel) */
/* ================================================= */

.control-panel {
  position: absolute;
  left: 20px;
  top: 50px;
  background: rgba(0, 0, 0, 0.3); /* 添加背景使其更清晰 */
  border: 1px solid rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(15px);
  border-radius: 12px;
  padding: 15px;
  pointer-events: auto;
  color: #fff;
  box-shadow: 0 10px 30px rgba(0,0,0,0.5);
}

.gesture-switch-row { display: flex; justify-content: space-between; align-items: center; font-size: 15px; }

.hint-text { font-size: 11px; color: #999; margin-top: 5px; font-style: italic; }

.panel-section { margin-bottom: 10px; }


.btn-group { display: flex; gap: 8px; margin-bottom: 10px; }

.btn-group .el-button { flex: 1; border-radius: 8px; transition: all 0.3s; }

.btn-group .el-button:hover { transform: translateY(-2px); }

.grab-btn {
    width: 100%;
    border-radius: 8px;
    transition: all 0.3s;
    margin-bottom: 0px !important; 
}

.grab-btn:hover { box-shadow: 0 0 15px rgba(146, 43, 33, 0.8); }


.guide-panel {
  position: absolute; bottom: 30px; left: 50%; transform: translateX(-50%);
  background: rgba(0,0,0,0.5);
  border: 1px solid rgba(255, 255, 255, 0.1);
  padding: 15px 30px; border-radius: 30px;
  display: flex; gap: 30px; pointer-events: none;
  backdrop-filter: blur(5px);
  z-index: 10;
}

.guide-item { color: #fff; font-size: 14px; font-weight: 500; }

.fade-enter-active, .fade-leave-active { transition: opacity 0.5s; }

.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>