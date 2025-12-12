<template>
  <div class="jewel-container">
    <div ref="canvasContainer" class="canvas-wrapper"></div>

    <div class="ui-layer" :class="{ 'hide-ui': uiHidden }">
      <h1 class="title">Jewel Christmas</h1>
      
      <div class="status-bar">
        <span class="status-dot" :class="currentState"></span>
        {{ statusText }}
      </div>

      <div class="control-panel">
        <button 
          @click="setMode('tree')" 
          :class="{ active: currentState === 'tree' }"
          title="聚合模式"
        >
          🎄 聚合
        </button>
        <button 
          @click="setMode('scatter')" 
          :class="{ active: currentState === 'scatter' }"
          title="星云模式"
        >
          ✨ 散开
        </button>
        <button 
          @click="triggerZoom" 
          :class="{ active: currentState === 'zoom' }"
          :disabled="photoMeshes.length === 0"
          title="抓取照片"
        >
          🖼️ 抓取
        </button>
      </div>

      <div class="data-control">
        <div class="info-text" v-if="loading.images">正在从云端获取相册数据...</div>
        
        <button class="action-btn" @click="handleRefresh" :disabled="loading.images">
          🔄 刷新相册 ({{ imageList.length }})
        </button>
      </div>

      <div v-if="enableMediaPipe" class="camera-preview" :class="{ active: isHandDetected }">
        <video ref="videoElement" autoplay playsinline muted></video>
        <canvas ref="skeletonCanvas"></canvas>
      </div>

      <button class="fullscreen-toggle" @click="toggleUI">
        {{ uiHidden ? '👁️' : '🙈' }}
      </button>
    </div>

    <div v-if="isInitLoading" class="loading-screen">
      <div class="loading-text">CRAFTING JEWELS...</div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch } from 'vue';
import { storeToRefs } from 'pinia';

import { useImageStore } from '@/store'; 
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

// ========== 配置开关 ==========
const enableMediaPipe = ref(false); // 默认关闭手势识别

// ========== Store 初始化 ==========
const imageStore = useImageStore();
const { imageList, loading } = storeToRefs(imageStore);

// ========== 响应式状态 ==========
const canvasContainer = ref(null);
const videoElement = ref(null);
const skeletonCanvas = ref(null);

const isInitLoading = ref(true);
const uiHidden = ref(false);
const statusText = ref('系统初始化...');
const isHandDetected = ref(false);

const STATE = { TREE: 'tree', SCATTER: 'scatter', ZOOM: 'zoom' };
const currentState = ref(STATE.TREE);

// ========== Three.js 核心变量 ==========
let scene, camera, renderer, composer, controls;
let mainGroup, dustSystem, star;
let animationId;
let time = 0;
const textureLoader = new THREE.TextureLoader();
textureLoader.crossOrigin = 'Anonymous'; // 关键：允许跨域加载纹理

// 场景对象管理
const meshes = {}; 
const logicData = { gold: [], silver: [], gem: [], emerald: [], dust: [] };
const photoMeshes = []; // 3D照片数组
const loadedKeys = new Set(); // 去重集合，防止重复添加同一张图
let zoomTargetIndex = -1;
const dummy = new THREE.Object3D(); 

// 几何配置
const CONFIG = {
  goldCount: 600, silverCount: 600, gemCount: 400, emeraldCount: 400, dustCount: 1200,
  treeHeight: 75, maxRadius: 30
};

// MediaPipe 变量
let handLandmarker = null;

// ========== 交互逻辑 ==========

const setMode = (mode) => {
  currentState.value = mode;
  if (mode === STATE.TREE) {
    statusText.value = "聚合形态 - 自动旋转";
    controls.autoRotate = true;
    controls.autoRotateSpeed = 2.0;
    zoomTargetIndex = -1;
  } else if (mode === STATE.SCATTER) {
    statusText.value = "星云形态 - 可触摸互动";
    controls.autoRotate = false;
    zoomTargetIndex = -1;
  }
};

const triggerZoom = () => {
  if (photoMeshes.length === 0) {
    alert("场景中暂无照片");
    return;
  }
  // 智能选择：寻找距离相机最近的照片
  let minDist = Infinity;
  let bestIdx = 0;
  const camPos = camera.position;
  const worldPos = new THREE.Vector3();

  photoMeshes.forEach((mesh, idx) => {
    mesh.getWorldPosition(worldPos);
    const d = worldPos.distanceTo(camPos);
    if (d < minDist) {
      minDist = d;
      bestIdx = idx;
    }
  });

  zoomTargetIndex = bestIdx;
  currentState.value = STATE.ZOOM;
  statusText.value = "照片特写";
  controls.autoRotate = false;
};

const toggleUI = () => uiHidden.value = !uiHidden.value;
const handleRefresh = () => imageStore.fetchImages();

// ========== Three.js 场景构建 ==========

const initThree = () => {
  if (!canvasContainer.value) return;
  const width = canvasContainer.value.clientWidth;
  const height = canvasContainer.value.clientHeight;

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x020202);

  camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
  camera.position.set(0, 0, 110);

  renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  canvasContainer.value.appendChild(renderer.domElement);

  // 控制器
  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.autoRotate = true;
  controls.autoRotateSpeed = 2.0;
  controls.enablePan = false;
  controls.minDistance = 20;
  controls.maxDistance = 200;

  // 环境光照
  const pmremGenerator = new THREE.PMREMGenerator(renderer);
  scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.add(new THREE.AmbientLight(0xffffff, 0.3));
  const spotLight = new THREE.SpotLight(0xffddaa, 80);
  spotLight.position.set(30, 60, 50);
  scene.add(spotLight);
  scene.add(new THREE.PointLight(0xaaddff, 40, 100));

  // 后处理
  const renderScene = new RenderPass(scene, camera);
  const bloomPass = new UnrealBloomPass(new THREE.Vector2(width, height), 1.5, 0.4, 0.85);
  bloomPass.threshold = 0.4;
  bloomPass.strength = 0.6;
  bloomPass.radius = 0.5;
  composer = new EffectComposer(renderer);
  composer.addPass(renderScene);
  composer.addPass(bloomPass);

  mainGroup = new THREE.Group();
  scene.add(mainGroup);

  createObjects();
  
  window.addEventListener('resize', onWindowResize);
  isInitLoading.value = false;
  statusText.value = "就绪 - 欢迎进入圣诞珠宝世界";
};

// 创建基础装饰物
const createObjects = () => {
  const mats = {
    gold: new THREE.MeshPhysicalMaterial({ color: 0xffaa00, metalness: 1.0, roughness: 0.15, emissive: 0xaa5500, emissiveIntensity: 0.1 }),
    silver: new THREE.MeshPhysicalMaterial({ color: 0xeeeeee, metalness: 0.9, roughness: 0.2, emissive: 0x222222, emissiveIntensity: 0.1 }),
    gem: new THREE.MeshPhysicalMaterial({ color: 0xff0044, metalness: 0.1, roughness: 0.0, transmission: 0.5, thickness: 1.0, emissive: 0x440011, emissiveIntensity: 0.3 }),
    emerald: new THREE.MeshPhysicalMaterial({ color: 0x00aa55, metalness: 0.2, roughness: 0.1, transmission: 0.4, thickness: 1.5, emissive: 0x002211, emissiveIntensity: 0.2 })
  };

  const createInstanced = (geo, mat, count, arr) => {
    const mesh = new THREE.InstancedMesh(geo, mat, count);
    mainGroup.add(mesh);
    for(let i=0; i<count; i++) {
      const h = Math.random() * CONFIG.treeHeight - CONFIG.treeHeight/2;
      const normH = (h + CONFIG.treeHeight/2) / CONFIG.treeHeight;
      const rMax = CONFIG.maxRadius * (1 - normH);
      const r = Math.sqrt(Math.random()) * rMax;
      const theta = Math.random() * Math.PI * 2;
      
      arr.push({
        treePos: new THREE.Vector3(r * Math.cos(theta), h, r * Math.sin(theta)),
        scatterPos: randomSpherePoint(40 + Math.random()*40),
        currentPos: new THREE.Vector3(r * Math.cos(theta), h, r * Math.sin(theta)),
        scale: 0.6 + Math.random() * 0.8,
        rotSpeed: { x: Math.random()*0.03, y: Math.random()*0.03 },
        rotation: new THREE.Euler(Math.random()*Math.PI, Math.random()*Math.PI, 0)
      });
    }
    return mesh;
  };

  meshes.gold = createInstanced(new THREE.SphereGeometry(0.7, 16, 16), mats.gold, CONFIG.goldCount, logicData.gold);
  meshes.silver = createInstanced(new THREE.BoxGeometry(0.9, 0.9, 0.9), mats.silver, CONFIG.silverCount, logicData.silver);
  meshes.gem = createInstanced(new THREE.OctahedronGeometry(0.8, 0), mats.gem, CONFIG.gemCount, logicData.gem);
  meshes.emerald = createInstanced(new THREE.ConeGeometry(0.5, 1.2, 8), mats.emerald, CONFIG.emeraldCount, logicData.emerald);

  // 粒子系统
  const dustGeo = new THREE.BufferGeometry();
  const dustPos = [];
  for(let i=0; i<CONFIG.dustCount; i++) {
    const h = Math.random() * CONFIG.treeHeight - CONFIG.treeHeight/2;
    const r = Math.random() * CONFIG.maxRadius * (1 - (h + CONFIG.treeHeight/2)/CONFIG.treeHeight) + 2; 
    const theta = Math.random() * Math.PI * 2;
    dustPos.push(r*Math.cos(theta), h, r*Math.sin(theta));
    logicData.dust.push({
      treePos: new THREE.Vector3(r*Math.cos(theta), h, r*Math.sin(theta)),
      scatterPos: randomSpherePoint(60),
      currentPos: new THREE.Vector3(r*Math.cos(theta), h, r*Math.sin(theta))
    });
  }
  dustGeo.setAttribute('position', new THREE.Float32BufferAttribute(dustPos, 3));
  dustSystem = new THREE.Points(dustGeo, new THREE.PointsMaterial({ color: 0xffffee, size: 0.6, transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending, depthWrite: false }));
  mainGroup.add(dustSystem);

  // 树顶星
  star = new THREE.Mesh(
    new THREE.OctahedronGeometry(3.0, 0), 
    new THREE.MeshPhysicalMaterial({ color: 0xffffff, emissive: 0xffffee, emissiveIntensity: 1 })
  );
  star.userData = { treePos: new THREE.Vector3(0, CONFIG.treeHeight/2 + 2, 0), scatterPos: new THREE.Vector3(0, 60, 0) };
  mainGroup.add(star);
};

const randomSpherePoint = (r) => {
  const u = Math.random(), v = Math.random();
  const theta = 2 * Math.PI * u, phi = Math.acos(2 * v - 1);
  return new THREE.Vector3(r * Math.sin(phi) * Math.cos(theta), r * Math.sin(phi) * Math.sin(theta), r * Math.cos(phi));
};

// ========== 图片加载逻辑 ==========

const addPhotoMeshFromUrl = (url, key) => {
  if (loadedKeys.has(key)) return; 

  textureLoader.load(
    url, 
    (tex) => {
      tex.colorSpace = THREE.SRGBColorSpace;
      loadedKeys.add(key);

      const img = tex.image;
      let w = 4, h = 4;
      if(img.width && img.height) {
        if(img.width > img.height) h = 4 * (img.height/img.width); 
        else w = 4 * (img.width/img.height);
      }

      const mesh = new THREE.Mesh(
        new THREE.PlaneGeometry(w, h),
        new THREE.MeshBasicMaterial({ map: tex, side: THREE.DoubleSide })
      );
      
      const frame = new THREE.Mesh(new THREE.BoxGeometry(w+0.2, h+0.2, 0.1), new THREE.MeshPhysicalMaterial({color:0xffd700, roughness:0.2, metalness:1}));
      frame.position.z = -0.06;
      mesh.add(frame);

      // 计算分布位置
      const h_pos = (Math.random() - 0.5) * CONFIG.treeHeight;
      const normH = (h_pos + CONFIG.treeHeight/2) / CONFIG.treeHeight;
      const r = CONFIG.maxRadius * (1 - normH) * (0.3 + 0.6 * Math.sqrt(Math.random()));
      const theta = Math.random() * Math.PI * 2;
      
      mesh.userData = {
        treePos: new THREE.Vector3(r * Math.cos(theta), h_pos, r * Math.sin(theta)),
        scatterPos: randomSpherePoint(50),
        baseRot: new THREE.Euler(0, Math.random()*Math.PI, 0)
      };
      mesh.position.copy(mesh.userData.treePos);
      
      photoMeshes.push(mesh);
      mainGroup.add(mesh);
    },
    undefined,
    (err) => { console.warn(`图片加载失败:`, err); }
  );
};

// 监听 Store 变化，自动将新图片添加到 3D 场景
watch(imageList, (newImages) => {
  if (newImages && newImages.length > 0) {
    newImages.forEach(imgData => {
      // 兼容性处理：根据你的 API 返回，key 可能是 id，url 可能是 url 或 path
      const key = imgData.key || imgData.id || Math.random().toString();
      const url = imgData.url || imgData.path;

      if (url && key) {
        addPhotoMeshFromUrl(url, key);
      }
    });
  }
}, { deep: true, immediate: true });

// ========== 动画循环 ==========

const animate = () => {
  animationId = requestAnimationFrame(animate);
  time += 0.01;
  controls.update();

  const updateMesh = (mesh, data) => {
    for (let i = 0; i < data.length; i++) {
      const item = data[i];
      let target = currentState.value === STATE.TREE ? item.treePos : item.scatterPos;
      if (currentState.value === STATE.ZOOM) target = item.scatterPos;

      if (currentState.value !== STATE.TREE) item.currentPos.y += Math.sin(time + i) * 0.005;

      item.currentPos.lerp(target, 0.08);
      item.rotation.x += item.rotSpeed.x;
      item.rotation.y += item.rotSpeed.y;

      let s = item.scale;
      if (currentState.value === STATE.ZOOM) s = item.scale * 0.6;

      dummy.position.copy(item.currentPos);
      dummy.rotation.copy(item.rotation);
      dummy.scale.setScalar(s);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
  };

  updateMesh(meshes.gold, logicData.gold);
  updateMesh(meshes.silver, logicData.silver);
  updateMesh(meshes.gem, logicData.gem);
  updateMesh(meshes.emerald, logicData.emerald);

  photoMeshes.forEach((mesh, idx) => {
    let targetPos, targetScale = 2.0;
    
    if (currentState.value === STATE.SCATTER) {
      targetScale = 4.0;
      mesh.lookAt(camera.position);
    }

    if (currentState.value === STATE.ZOOM && idx === zoomTargetIndex) {
      const offset = new THREE.Vector3(0, 0, -30);
      offset.applyQuaternion(camera.quaternion);
      targetPos = camera.position.clone().add(offset);
      
      targetScale = 5.0;
      mesh.lookAt(camera.position);
      mesh.position.lerp(targetPos, 0.1);
    } else {
      targetPos = currentState.value === STATE.TREE ? mesh.userData.treePos : mesh.userData.scatterPos;
      if (currentState.value === STATE.TREE) {
        mesh.rotation.copy(mesh.userData.baseRot);
        mesh.rotation.y += 0.01;
      }
      mesh.position.lerp(targetPos, 0.1);
    }
    mesh.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.1);
  });

  const dustPositions = dustSystem.geometry.attributes.position.array;
  for(let i=0; i<logicData.dust.length; i++) {
    const item = logicData.dust[i];
    let target = currentState.value === STATE.TREE ? item.treePos : item.scatterPos;
    
    if (currentState.value !== STATE.TREE) {
      item.currentPos.lerp(target, 0.05);
    } else {
      item.currentPos.y += 0.05;
      if(item.currentPos.y > CONFIG.treeHeight/2) item.currentPos.y = -CONFIG.treeHeight/2;
      const rCurr = Math.sqrt(item.currentPos.x**2 + item.currentPos.z**2);
      if(rCurr > CONFIG.maxRadius) { item.currentPos.x *= 0.95; item.currentPos.z *= 0.95; }
    }
    dustPositions[i*3] = item.currentPos.x;
    dustPositions[i*3+1] = item.currentPos.y;
    dustPositions[i*3+2] = item.currentPos.z;
  }
  dustSystem.geometry.attributes.position.needsUpdate = true;

  const starTarget = currentState.value === STATE.TREE ? star.userData.treePos : star.userData.scatterPos;
  star.position.lerp(starTarget, 0.05);
  star.rotation.y += 0.01;

  composer.render();
};

const onWindowResize = () => {
  if (!canvasContainer.value) return;
  const w = canvasContainer.value.clientWidth;
  const h = canvasContainer.value.clientHeight;
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h);
  composer.setSize(w, h);
};

// ========== MediaPipe 逻辑 (默认不执行) ==========
const setupMediaPipe = async () => {
  if (!enableMediaPipe.value) return;
  
  try {
    const { FilesetResolver, HandLandmarker } = await import('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/+esm');
    const vision = await FilesetResolver.forVisionTasks("https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm");
    handLandmarker = await HandLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath: `https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task`,
        delegate: "GPU"
      },
      runningMode: "VIDEO", numHands: 1
    });

    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if(videoElement.value) {
        videoElement.value.srcObject = stream;
        videoElement.value.addEventListener("loadeddata", () => {
             // 简单的循环
             const loop = () => {
                 if(!videoElement.value) return;
                 // 识别逻辑省略
                 requestAnimationFrame(loop);
             }
             loop();
        });
      }
    }
  } catch (err) {
    console.warn("MediaPipe skipped:", err);
  }
};

// ========== 生命周期 ==========

onMounted(async () => {
  initThree();
  animate();
  
  if(enableMediaPipe.value) {
    setupMediaPipe();
  }

  // 加载初始数据
  try {
    // 确保 store 已初始化
    if (imageStore.fetchImages) {
        await imageStore.fetchImages();
    }
  } catch(e) {
    console.error(e);
    statusText.value = "获取云端图片失败";
  }
});

onBeforeUnmount(() => {
  cancelAnimationFrame(animationId);
  window.removeEventListener('resize', onWindowResize);
  
  if (scene) {
    scene.traverse((child) => {
      if (child.isMesh) {
        child.geometry.dispose();
        if (child.material.map) child.material.map.dispose();
        child.material.dispose();
      }
    });
  }
  if (renderer) renderer.dispose();
  if (composer) composer.dispose();
});
</script>

<style scoped>
.jewel-container {
  position: relative;
  width: 100vw;
  height: 100vh;
  background: #000;
  overflow: hidden;
  font-family: 'Helvetica Neue', Arial, sans-serif;
}

.canvas-wrapper {
  width: 100%;
  height: 100%;
}

.ui-layer {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  transition: opacity 0.5s;
}

.hide-ui { opacity: 0; pointer-events: none; }

.title {
  position: absolute;
  top: 30px;
  left: 30px;
  margin: 0;
  font-weight: 200;
  letter-spacing: 4px;
  text-transform: uppercase;
  font-size: 2rem;
  background: linear-gradient(to right, #fff, #d4af37, #fff);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.status-bar {
  position: absolute;
  top: 80px;
  left: 30px;
  color: #fff;
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  gap: 10px;
}

.status-dot { width: 10px; height: 10px; border-radius: 50%; background: #666; }
.status-dot.tree { background: #00ff88; box-shadow: 0 0 10px #00ff88; }
.status-dot.scatter { background: #00aaff; box-shadow: 0 0 10px #00aaff; }
.status-dot.zoom { background: #ffd700; box-shadow: 0 0 10px #ffd700; }

.control-panel {
  position: absolute;
  bottom: 40px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 15px;
  pointer-events: auto;
  background: rgba(20, 20, 20, 0.8);
  padding: 10px 20px;
  border-radius: 30px;
  border: 1px solid rgba(212, 175, 55, 0.3);
  backdrop-filter: blur(10px);
}

.control-panel button {
  background: transparent;
  border: 1px solid rgba(255,255,255,0.2);
  color: #ccc;
  padding: 8px 16px;
  border-radius: 20px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.3s;
}
.control-panel button:hover { background: rgba(255,255,255,0.1); color: #fff; }
.control-panel button.active { background: #d4af37; color: #000; border-color: #d4af37; font-weight: bold; }
.control-panel button:disabled { opacity: 0.3; cursor: not-allowed; }

/* Data Control Section */
.data-control {
  position: absolute;
  bottom: 110px;
  left: 50%;
  transform: translateX(-50%);
  pointer-events: auto;
  text-align: center;
}
.info-text { font-size: 0.8rem; color: #888; margin-bottom: 5px; }

.action-btn {
  background: rgba(50,50,50,0.8);
  border: 1px solid #555;
  color: #eee;
  padding: 8px 16px;
  border-radius: 20px;
  cursor: pointer;
  font-size: 0.8rem;
  transition: 0.3s;
}
.action-btn:hover:not(:disabled) { background: #fff; color: #000; }
.action-btn:disabled { opacity: 0.5; cursor: wait; }

.camera-preview {
  position: absolute; top: 20px; right: 20px;
  width: 120px; height: 90px;
  border: 2px solid rgba(255,255,255,0.2);
  opacity: 0.3; transform: scaleX(-1);
}
.camera-preview.active { opacity: 0.8; border-color: #00ff88; }

.fullscreen-toggle {
  position: absolute;
  top: 30px; right: 30px;
  background: rgba(0,0,0,0.5);
  color: #d4af37; border: 1px solid #d4af37;
  width: 40px; height: 40px; border-radius: 50%;
  cursor: pointer; pointer-events: auto;
  display: flex; align-items: center; justify-content: center;
}

.loading-screen {
  position: absolute; top: 0; left: 0; width: 100%; height: 100%;
  background: #000;
  display: flex; align-items: center; justify-content: center;
  z-index: 99;
}
.loading-text {
  color: #d4af37; font-size: 1.2rem; letter-spacing: 3px;
  animation: pulse 1.5s infinite;
}
@keyframes pulse { 0% { opacity: 0.5; } 50% { opacity: 1; } 100% { opacity: 0.5; } }

@media (max-width: 600px) {
  .title { font-size: 1.5rem; }
  .control-panel { width: 90%; justify-content: space-between; gap: 5px; }
}
</style>