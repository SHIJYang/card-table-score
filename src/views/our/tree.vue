<template>
  <div class="jewel-scene">
    <div ref="canvasRef" class="canvas-wrapper"></div>

    <transition name="fade">
      <div v-show="!uiHidden" class="ui-layer">
        <div class="top-left-panel">
          <div class="control-group glass-panel vertical">
            <button 
              v-for="mode in modes" 
              :key="mode.key"
              @click="handleModeChange(mode.key)" 
              :class="{ active: currentState === mode.key }"
              :disabled="mode.disabled"
              :title="mode.desc"
            >
              <span class="icon">{{ mode.icon }}</span>
              </button>

            <div class="divider-h"></div>

            <button 
              @click="toggleCamera" 
              :class="{ active: enableMediaPipe }"
              title="开启摄像头进行手势互动"
            >
              <span class="icon">📷</span>
            </button>

            <button @click="handleRefresh" :disabled="loading.images" title="重新获取相册数据">
              <span class="icon" :class="{ spinning: loading.images }">🔄</span>
            </button>
          </div>
        </div>

        <div v-show="enableMediaPipe" class="camera-widget" :class="{ active: isHandDetected }">
          <video ref="videoRef" autoplay playsinline muted></video>
          
          <div class="overlay-feedback">
            <svg v-if="gestureState.progress > 0" class="progress-ring" width="40" height="40">
               <circle class="progress-ring__circle" stroke="white" stroke-width="3" fill="transparent" r="16" cx="20" cy="20"
                 :style="{ strokeDashoffset: strokeDashoffset }" />
            </svg>
            
            <div class="status-text">
              <span v-if="!isHandDetected" class="blink">SEARCHING</span>
              <span v-else class="gesture-name">{{ gestureState.lastGesture }}</span>
            </div>
          </div>
        </div>

        <button class="toggle-btn top-right" @click="toggleUI" title="隐藏界面">
          👁️
        </button>
      </div>
    </transition>

    <button v-if="uiHidden" class="wakeup-btn" @click="toggleUI">
      🍔 MENU
    </button>

    <transition name="fade">
      <div v-if="isInitLoading" class="loading-screen">
        <div class="loader-content">
          <div class="spinner"></div>
          <div class="loading-text">CRAFTING SCENE...</div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch, computed } from 'vue';
import { storeToRefs } from 'pinia';
import { useImageStore } from '@/store'; 
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

// ========== 1. CameraRig (保持不变) ==========
class CameraRig {
  constructor(camera, controls) {
    this.camera = camera;
    this.controls = controls;
    this.isAnimating = false;
    this.startTime = 0;
    this.duration = 0;
    this.onCompleteCallback = null;
    this.startPos = new THREE.Vector3();
    this.endPos = new THREE.Vector3();
    this.startTarget = new THREE.Vector3();
    this.endTarget = new THREE.Vector3();
  }

  flyTo(targetPos, targetLookAt, duration = 1500, callback = null) {
    this.isAnimating = true;
    this.startTime = performance.now();
    this.duration = duration;
    this.onCompleteCallback = callback;

    this.startPos.copy(this.camera.position);
    this.startTarget.copy(this.controls.target);
    this.endPos.copy(targetPos);
    this.endTarget.copy(targetLookAt);

    this.controls.enabled = false;
    this.controls.autoRotate = false;
  }

  update() {
    if (!this.isAnimating) return;
    const now = performance.now();
    const elapsed = now - this.startTime;
    let progress = elapsed / this.duration;

    if (progress >= 1) {
      progress = 1;
      this.isAnimating = false;
      this.controls.enabled = true;
      this.camera.position.copy(this.endPos);
      this.controls.target.copy(this.endTarget);
      if (this.onCompleteCallback) this.onCompleteCallback();
    } else {
      const ease = 1 - Math.pow(1 - progress, 3);
      this.camera.position.lerpVectors(this.startPos, this.endPos, ease);
      this.controls.target.lerpVectors(this.startTarget, this.endTarget, ease);
    }
  }
}

// ========== 2. 配置与状态 ==========
const CONFIG = {
  treeHeight: 80,
  maxRadius: 35,
  counts: { gold: 600, silver: 600, gem: 400, emerald: 400, dust: 1500 },
  colors: { bg: 0x050505, gold: 0xffaa00, silver: 0xeeeeee, gem: 0xff0044, emerald: 0x00ff88 }
};

const STATE_KEYS = { TREE: 'tree', SCATTER: 'scatter', ZOOM: 'zoom' };

const imageStore = useImageStore();
const { imageList, loading } = storeToRefs(imageStore);

const canvasRef = ref(null);
const videoRef = ref(null);

const isInitLoading = ref(true);
const uiHidden = ref(false);
const currentState = ref(STATE_KEYS.TREE);
const enableMediaPipe = ref(false);
const isHandDetected = ref(false);
const photoCount = ref(0);

// 优化后的手势状态
const gestureState = ref({
  currentGesture: 'NONE', // 最终确认的手势
  lastGesture: 'NONE',    // 当前帧检测到的手势
  progress: 0,            // 0 - 100，触发进度
  lockCounter: 0,         // 锁定计数
});

// 计算环形进度条的 stroke-dashoffset (周长 ≈ 100)
const strokeDashoffset = computed(() => {
  const circumference = 2 * Math.PI * 16; // r=16
  return circumference - (gestureState.value.progress / 100) * circumference;
});

const ctx = {
  scene: null, camera: null, renderer: null, composer: null, controls: null,
  rig: null, mainGroup: null, meshes: {},
  logicData: { gold: [], silver: [], gem: [], emerald: [], dust: [] },
  dummy: new THREE.Object3D(),
  textureLoader: new THREE.TextureLoader()
};

let photoMeshes = []; 
const loadedKeys = new Set();
let zoomTargetIndex = -1;
let handLandmarker = null;
let lastVideoTime = -1;
let rafId = null;

const modes = computed(() => [
  { key: STATE_KEYS.TREE, label: '聚合', icon: '✊', desc: '握拳', disabled: false },
  { key: STATE_KEYS.SCATTER, label: '散开', icon: '🖐️', desc: '五指张开', disabled: false },
  { key: STATE_KEYS.ZOOM, label: '特写', icon: '👌', desc: '抓取/捏合', disabled: photoCount.value === 0 }
]);

// ========== 3. 交互逻辑 ==========
const handleModeChange = (modeKey) => {
  if (currentState.value === modeKey && modeKey !== STATE_KEYS.ZOOM) return;
  
  if (modeKey === STATE_KEYS.ZOOM) {
    if(currentState.value !== STATE_KEYS.ZOOM) triggerZoom();
    return;
  }
  
  currentState.value = modeKey;
  if (ctx.rig) ctx.rig.isAnimating = false; 

  const overviewPos = new THREE.Vector3(0, 0, 130);
  const centerTarget = new THREE.Vector3(0, 0, 0);

  if (modeKey === STATE_KEYS.TREE) {
    ctx.rig.flyTo(overviewPos, centerTarget, 1500, () => { 
      ctx.controls.autoRotate = true; 
      ctx.controls.autoRotateSpeed = 2.0;
    });
  } else if (modeKey === STATE_KEYS.SCATTER) {
    ctx.controls.autoRotate = false;
    zoomTargetIndex = -1;
    ctx.rig.flyTo(overviewPos, centerTarget, 1200);
  }
};

const triggerZoom = () => {
  if (photoMeshes.length === 0) return;

  currentState.value = STATE_KEYS.ZOOM;
  
  const camPos = ctx.camera.position;
  let bestIdx = 0;
  let minDist = Infinity;

  photoMeshes.forEach((mesh, idx) => {
    const worldPos = new THREE.Vector3();
    mesh.getWorldPosition(worldPos);
    const dist = worldPos.distanceTo(camPos);
    if (dist < minDist) {
      minDist = dist;
      bestIdx = idx;
    }
  });

  zoomTargetIndex = bestIdx;
  const targetMesh = photoMeshes[bestIdx];
  const targetWorldPos = new THREE.Vector3();
  targetMesh.getWorldPosition(targetWorldPos);

  const vecFromCenter = targetWorldPos.clone().normalize();
  const targetCamPos = targetWorldPos.clone().add(vecFromCenter.multiplyScalar(20));

  ctx.rig.flyTo(targetCamPos, targetWorldPos, 1000, () => {
    targetMesh.lookAt(ctx.camera.position);
  });
};

const toggleCamera = () => {
  enableMediaPipe.value = !enableMediaPipe.value;
  if(enableMediaPipe.value) {
    setupMediaPipe();
  } else {
    isHandDetected.value = false;
    if(videoRef.value && videoRef.value.srcObject) {
      const tracks = videoRef.value.srcObject.getTracks();
      tracks.forEach(track => track.stop());
      videoRef.value.srcObject = null;
    }
  }
};

const toggleUI = () => uiHidden.value = !uiHidden.value;
const handleRefresh = () => imageStore.fetchImages();

// ========== 4. MediaPipe 手势逻辑 (优化版) ==========

const setupMediaPipe = async () => {
  try {
    const { FilesetResolver, HandLandmarker } = await import('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/+esm');
    const vision = await FilesetResolver.forVisionTasks("https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm");
    
    handLandmarker = await HandLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath: `https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task`,
        delegate: "GPU"
      },
      runningMode: "VIDEO",
      numHands: 1
    });

    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: 320, height: 240, frameRate: { ideal: 30 } } 
      });
      if(videoRef.value) {
        videoRef.value.srcObject = stream;
        videoRef.value.addEventListener("loadeddata", () => {
           predictWebcam();
        });
      }
    }
  } catch (err) {
    console.error(err);
    alert("无法启动摄像头");
    enableMediaPipe.value = false;
  }
};

const calcDist = (p1, p2) => Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2) + Math.pow(p1.z - p2.z, 2));

const analyzeGesture = (landmarks) => {
  const wrist = landmarks[0];
  const thumbTip = landmarks[4];
  const indexTip = landmarks[8];
  
  const tips = [landmarks[8], landmarks[12], landmarks[16], landmarks[20]]; 

  // 1. 抓取 (Pinch)
  const pinchDist = calcDist(thumbTip, indexTip);
  if (pinchDist < 0.05) return 'GRAB';

  // 2. 张开/握拳
  let totalDist = 0;
  tips.forEach(tip => totalDist += calcDist(tip, wrist));
  const avgDist = totalDist / 4;

  if (avgDist < 0.28) return 'FIST';
  if (avgDist > 0.35) return 'OPEN';

  return 'UNKNOWN';
};

const predictWebcam = async () => {
  if (!videoRef.value || !enableMediaPipe.value) return;
  rafId = requestAnimationFrame(predictWebcam);

  if (videoRef.value.currentTime === lastVideoTime) return;
  lastVideoTime = videoRef.value.currentTime;

  if (handLandmarker) {
    const startTimeMs = performance.now();
    const results = handLandmarker.detectForVideo(videoRef.value, startTimeMs);

    if (results.landmarks && results.landmarks.length > 0) {
      isHandDetected.value = true;
      const landmarks = results.landmarks[0];
      const gesture = analyzeGesture(landmarks);
      
      gestureState.value.lastGesture = gesture;

      // --- 核心优化：确认进度条逻辑 ---
      // 如果当前手势不是 UNKNOWN 且不是当前模式的手势 (防止重复触发)
      // 特殊情况：GRAB 随时可以触发
      let targetMode = null;
      if (gesture === 'FIST') targetMode = STATE_KEYS.TREE;
      if (gesture === 'OPEN') targetMode = STATE_KEYS.SCATTER;
      if (gesture === 'GRAB') targetMode = STATE_KEYS.ZOOM;

      const isSameAsCurrent = targetMode === currentState.value && gesture !== 'GRAB';

      if (targetMode && !isSameAsCurrent) {
         // 累加进度 (速度可调)
         gestureState.value.progress = Math.min(gestureState.value.progress + 4, 100);
      } else {
         // 快速衰减
         gestureState.value.progress = Math.max(gestureState.value.progress - 10, 0);
      }

      // 触发切换
      if (gestureState.value.progress >= 100) {
        if (targetMode) handleModeChange(targetMode);
        gestureState.value.progress = 0; // 重置
      }

      // --- 旋转控制 (无延迟，直接响应) ---
      if (currentState.value === STATE_KEYS.SCATTER && gesture === 'OPEN') {
        const wristX = landmarks[0].x; 
        if (wristX < 0.4) {
          ctx.controls.autoRotate = true;
          ctx.controls.autoRotateSpeed = (0.4 - wristX) * 20.0; 
        } else if (wristX > 0.6) {
          ctx.controls.autoRotate = true;
          ctx.controls.autoRotateSpeed = (0.6 - wristX) * 20.0; 
        } else {
          ctx.controls.autoRotateSpeed = 0;
        }
      }
    } else {
      isHandDetected.value = false;
      gestureState.value.progress = 0;
    }
  }
};

// ========== 5. Three.js Scene (保持不变，省略重复代码) ==========

const initScene = () => {
  if (!canvasRef.value) return;
  const w = canvasRef.value.clientWidth;
  const h = canvasRef.value.clientHeight;
  
  ctx.scene = new THREE.Scene();
  ctx.scene.background = new THREE.Color(CONFIG.colors.bg);
  ctx.scene.fog = new THREE.FogExp2(CONFIG.colors.bg, 0.002);
  
  ctx.camera = new THREE.PerspectiveCamera(50, w / h, 0.1, 1000);
  ctx.camera.position.set(0, 0, 120);
  
  ctx.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
  ctx.renderer.setSize(w, h);
  ctx.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
  ctx.renderer.toneMapping = THREE.ACESFilmicToneMapping;
  canvasRef.value.appendChild(ctx.renderer.domElement);
  
  ctx.controls = new OrbitControls(ctx.camera, ctx.renderer.domElement);
  ctx.controls.enableDamping = true;
  ctx.controls.autoRotate = true;
  
  ctx.rig = new CameraRig(ctx.camera, ctx.controls);
  
  const renderScene = new RenderPass(ctx.scene, ctx.camera);
  const bloomPass = new UnrealBloomPass(new THREE.Vector2(w, h), 1.5, 0.4, 0.85);
  ctx.composer = new EffectComposer(ctx.renderer);
  ctx.composer.addPass(renderScene);
  ctx.composer.addPass(bloomPass);
  
  const pmremGenerator = new THREE.PMREMGenerator(ctx.renderer);
  ctx.scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
  ctx.scene.add(new THREE.AmbientLight(0xffffff, 0.2));
  const spotLight = new THREE.SpotLight(0xffddaa, 100);
  spotLight.position.set(50, 100, 50);
  ctx.scene.add(spotLight);
  
  ctx.mainGroup = new THREE.Group();
  ctx.scene.add(ctx.mainGroup);
  ctx.textureLoader.crossOrigin = 'Anonymous';
  
  createDecorations();
  window.addEventListener('resize', onWindowResize);
  animate();
  isInitLoading.value = false;
};

const createDecorations = () => {
  const mats = {
    gold: new THREE.MeshPhysicalMaterial({ color: CONFIG.colors.gold, metalness: 1.0, roughness: 0.1 }),
    silver: new THREE.MeshPhysicalMaterial({ color: CONFIG.colors.silver, metalness: 0.9, roughness: 0.2 }),
    gem: new THREE.MeshPhysicalMaterial({ color: CONFIG.colors.gem, metalness: 0.1, roughness: 0, transmission: 0.6, thickness: 1 }),
    emerald: new THREE.MeshPhysicalMaterial({ color: CONFIG.colors.emerald, metalness: 0.2, roughness: 0.1, transmission: 0.5 })
  };

  const createSet = (key, geo, mat, count) => {
    const mesh = new THREE.InstancedMesh(geo, mat, count);
    ctx.mainGroup.add(mesh);
    ctx.meshes[key] = mesh;

    for(let i=0; i<count; i++) {
      const h = (Math.random() - 0.5) * CONFIG.treeHeight;
      const normH = (h + CONFIG.treeHeight/2) / CONFIG.treeHeight;
      const rMax = CONFIG.maxRadius * (1 - normH);
      const r = Math.sqrt(Math.random()) * rMax;
      const theta = Math.random() * Math.PI * 2;
      const treePos = new THREE.Vector3(r * Math.cos(theta), h, r * Math.sin(theta));
      const scatterPos = randomSpherePoint(50 + Math.random() * 30);
      
      ctx.logicData[key].push({
        treePos, scatterPos,
        currentPos: treePos.clone(),
        scale: 0.5 + Math.random() * 0.5,
        rotSpeed: { x: (Math.random()-0.5)*0.02, y: (Math.random()-0.5)*0.02 },
        rotation: new THREE.Euler(Math.random()*Math.PI, Math.random()*Math.PI, 0)
      });

      ctx.dummy.position.copy(treePos);
      ctx.dummy.scale.setScalar(0); 
      ctx.dummy.updateMatrix();
      mesh.setMatrixAt(i, ctx.dummy.matrix);
    }
  };

  createSet('gold', new THREE.SphereGeometry(0.6, 16, 16), mats.gold, CONFIG.counts.gold);
  createSet('silver', new THREE.BoxGeometry(0.8, 0.8, 0.8), mats.silver, CONFIG.counts.silver);
  createSet('gem', new THREE.OctahedronGeometry(0.7, 0), mats.gem, CONFIG.counts.gem);
  createSet('emerald', new THREE.ConeGeometry(0.5, 1.0, 6), mats.emerald, CONFIG.counts.emerald);
};

const randomSpherePoint = (r) => {
  const u = Math.random(), v = Math.random();
  const theta = 2 * Math.PI * u, phi = Math.acos(2 * v - 1);
  return new THREE.Vector3(r * Math.sin(phi) * Math.cos(theta), r * Math.sin(phi) * Math.sin(theta), r * Math.cos(phi));
};

const convertToProxyUrl = (url) => {
  if (!url) return '';
  const targetDomain = 'https://free.picui.cn';
  const proxyPrefix = '/picui-proxy';
  if (url.includes(targetDomain)) return url.replace(targetDomain, proxyPrefix);
  return url;
};

const addPhotoMesh = (url, key) => {
  if (loadedKeys.has(key)) return;
  const proxyUrl = convertToProxyUrl(url);
  
  ctx.textureLoader.load(proxyUrl, (tex) => {
    tex.colorSpace = THREE.SRGBColorSpace;
    loadedKeys.add(key);
    const img = tex.image;
    const ratio = img.width / img.height;
    const w = ratio >= 1 ? 4 : 4 * ratio;
    const h = ratio >= 1 ? 4 / ratio : 4;
    const geometry = new THREE.PlaneGeometry(w, h);
    const material = new THREE.MeshBasicMaterial({ map: tex, side: THREE.DoubleSide });
    const mesh = new THREE.Mesh(geometry, material);
    const frame = new THREE.Mesh(
      new THREE.BoxGeometry(w + 0.2, h + 0.2, 0.05),
      new THREE.MeshStandardMaterial({ color: 0xffd700, roughness: 0.3 })
    );
    frame.position.z = -0.05;
    mesh.add(frame);
    
    const h_pos = (Math.random() - 0.5) * CONFIG.treeHeight;
    const normH = (h_pos + CONFIG.treeHeight/2) / CONFIG.treeHeight;
    const r = CONFIG.maxRadius * (1 - normH) * (1.1 + 0.3 * Math.random());
    const theta = Math.random() * Math.PI * 2;

    mesh.userData = {
      treePos: new THREE.Vector3(r * Math.cos(theta), h_pos, r * Math.sin(theta)),
      scatterPos: randomSpherePoint(60),
      baseRot: new THREE.Euler(0, Math.random() * Math.PI, 0)
    };
    
    mesh.position.copy(mesh.userData.treePos);
    mesh.rotation.copy(mesh.userData.baseRot);
    
    photoMeshes.push(mesh);
    ctx.mainGroup.add(mesh);
    photoCount.value = photoMeshes.length;
  });
};

watch(imageList, (newImages) => {
  if (newImages?.length) {
    newImages.forEach(imgData => {
      const key = imgData.key || imgData.id;
      const url = imgData.links?.url || imgData.url;
      if (url && key) addPhotoMesh(url, key);
    });
  }
}, { deep: true, immediate: true });

const onWindowResize = () => {
  if (!canvasRef.value) return;
  const w = canvasRef.value.clientWidth;
  const h = canvasRef.value.clientHeight;
  ctx.camera.aspect = w / h;
  ctx.camera.updateProjectionMatrix();
  ctx.renderer.setSize(w, h);
  ctx.composer.setSize(w, h);
};

const animate = () => {
  requestAnimationFrame(animate);
  
  if (ctx.rig) ctx.rig.update();
  ctx.controls.update();

  const isTree = currentState.value === STATE_KEYS.TREE;
  const isZoom = currentState.value === STATE_KEYS.ZOOM;

  const updateDecorations = (mesh, data) => {
    if(!mesh) return;
    let needsUpdate = false;
    for (let i = 0; i < data.length; i++) {
      const item = data[i];
      let target = isTree ? item.treePos : item.scatterPos;
      
      item.currentPos.lerp(target, 0.08);
      item.rotation.x += item.rotSpeed.x;
      item.rotation.y += item.rotSpeed.y;

      let s = item.scale;
      if (isZoom) s *= 0.1; 
      
      ctx.dummy.position.copy(item.currentPos);
      ctx.dummy.rotation.copy(item.rotation);
      ctx.dummy.scale.setScalar(s);
      ctx.dummy.updateMatrix();
      mesh.setMatrixAt(i, ctx.dummy.matrix);
      needsUpdate = true;
    }
    if(needsUpdate) mesh.instanceMatrix.needsUpdate = true;
  };

  updateDecorations(ctx.meshes.gold, ctx.logicData.gold);
  updateDecorations(ctx.meshes.silver, ctx.logicData.silver);
  updateDecorations(ctx.meshes.gem, ctx.logicData.gem);
  updateDecorations(ctx.meshes.emerald, ctx.logicData.emerald);

  photoMeshes.forEach((mesh, idx) => {
    if (ctx.rig && ctx.rig.isAnimating && idx === zoomTargetIndex) {
      mesh.lookAt(ctx.camera.position); 
      return; 
    }

    let targetPos, targetScale = 2.5;

    if (isZoom && idx === zoomTargetIndex) {
      targetPos = isTree ? mesh.userData.treePos : mesh.userData.scatterPos;
      targetScale = 4.0;
      mesh.lookAt(ctx.camera.position);
    } else {
      targetPos = isTree ? mesh.userData.treePos : mesh.userData.scatterPos;
      targetScale = isTree ? 1.0 : 2.5;
      
      if (isTree) {
        mesh.rotation.copy(mesh.userData.baseRot);
        mesh.rotation.y += 0.005;
      } else {
        mesh.lookAt(ctx.camera.position);
      }
      mesh.position.lerp(targetPos, 0.08);
    }
    
    if (isZoom && idx !== zoomTargetIndex) targetScale *= 0.2; 
    const s = THREE.MathUtils.lerp(mesh.scale.x, targetScale, 0.08);
    mesh.scale.setScalar(s);
  });

  ctx.composer.render();
};

onMounted(() => {
  initScene();
  if (imageStore.fetchImages) imageStore.fetchImages();
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', onWindowResize);
  cancelAnimationFrame(rafId);
  if (ctx.renderer) ctx.renderer.dispose();
});
</script>

<style scoped>
.jewel-scene {
  position: relative;
  width: 100vw; height: 100vh;
  background: #000; overflow: hidden;
  font-family: 'Helvetica Neue', Arial, sans-serif;
  user-select: none;
}
.canvas-wrapper {
  position: absolute; top: 0; left: 0;
  width: 100%; height: 100%; z-index: 0;
}
.ui-layer {
  position: absolute; inset: 0; z-index: 10; pointer-events: none;
}
.top-left-panel {
  position: absolute; top: 30px; left: 30px; pointer-events: auto;
}
.glass-panel {
  background: rgba(20, 20, 20, 0.75);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 16px; padding: 10px;
  display: flex; flex-direction: column; gap: 8px;
}
.glass-panel button {
  background: transparent; border: none; color: #ccc;
  width: 40px; height: 40px;
  border-radius: 8px; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  transition: all 0.2s; font-size: 1.2rem;
}
.glass-panel button:hover { background: rgba(255,255,255,0.1); color: #fff; }
.glass-panel button.active { background: rgba(212, 175, 55, 0.8); color: #000; }
.glass-panel button:disabled { opacity: 0.3; cursor: not-allowed; }
.divider-h { height: 1px; background: rgba(255,255,255,0.1); margin: 4px 0; }

/* 优化后的摄像头小窗 */
.camera-widget {
  position: absolute; top: 30px; right: 80px; width: 110px; height: 82px;
  border-radius: 12px; overflow: hidden;
  border: 1px solid rgba(255,255,255,0.1);
  background: rgba(0,0,0,0.8); pointer-events: auto; 
  opacity: 0.4; transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  transform-origin: top right;
}
.camera-widget:hover, .camera-widget.active { opacity: 1; border-color: rgba(212, 175, 55, 0.5); box-shadow: 0 4px 20px rgba(0,0,0,0.5); }
.camera-widget video { width: 100%; height: 100%; object-fit: cover; transform: scaleX(-1); opacity: 0.8; }

/* 反馈层 */
.overlay-feedback {
  position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center;
  pointer-events: none;
}
.status-text {
  position: absolute; bottom: 4px; width: 100%; text-align: center;
  font-size: 9px; font-weight: 600; letter-spacing: 1px;
  text-shadow: 0 1px 2px #000; color: #ccc;
}
.gesture-name { color: #d4af37; }
.blink { animation: blink 1.5s infinite; }

/* 环形进度条 */
.progress-ring { transform: rotate(-90deg); }
.progress-ring__circle {
  transition: stroke-dashoffset 0.1s linear;
  stroke: #d4af37;
  stroke-dasharray: 100 100; /* 周长约100 */
}

.toggle-btn {
  position: absolute; top: 30px; right: 30px;
  width: 40px; height: 40px; border-radius: 50%;
  background: rgba(20,20,20,0.6); border: 1px solid rgba(255,255,255,0.2);
  color: #d4af37; cursor: pointer; pointer-events: auto;
  display: flex; align-items: center; justify-content: center;
}
.wakeup-btn {
  position: absolute; top: 20px; right: 20px;
  background: rgba(0,0,0,0.8); border: 1px solid #d4af37; color: #d4af37;
  padding: 8px 16px; border-radius: 20px; cursor: pointer; z-index: 20;
}
.loading-screen {
  position: absolute; inset: 0; background: #000;
  display: flex; align-items: center; justify-content: center; z-index: 100;
}
.spinner {
  width: 40px; height: 40px; border: 3px solid rgba(255,255,255,0.1);
  border-top-color: #d4af37; border-radius: 50%;
  animation: spin 1s infinite linear; margin: 0 auto 15px;
}
.loading-text { color: #d4af37; letter-spacing: 2px; font-size: 0.8rem; }
@keyframes spin { to { transform: rotate(360deg); } }
@keyframes blink { 0%,100% { opacity: 1; } 50% { opacity: 0.5; } }
.spinning { animation: spin 1s linear infinite; display: inline-block; }
</style>