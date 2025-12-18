<template>
  <div class="jewel-scene">
    <div ref="canvasRef" class="canvas-wrapper"></div>

    <transition name="fade">
      <div v-show="!uiHidden" class="ui-layer">
        <div class="top-left-panel">
          <div class="control-group glass-panel">
            <button 
              v-for="mode in modes" 
              :key="mode.key"
              @click="handleModeChange(mode.key)"
              :class="{ active: currentState === mode.key }"
              :title="mode.label"
            >
              {{ mode.icon }}
            </button>

            <div class="divider-v"></div>

            <button 
              @click="toggleCamera" 
              :class="{ active: cameraStore.isCameraOpen }" 
              title="开启摄像头/手势"
            >
              <span v-if="!cameraStore.isLoading">📷</span>
              <span v-else class="spinning">⌛</span>
            </button>
            
            <button @click="forceNextTheme" title="切换主题颜色">
              🎨
            </button>
          </div>
        </div>

        <div v-show="cameraStore.isCameraOpen" class="camera-widget">
          <video ref="videoRef" autoplay playsinline muted></video>
          <div class="gesture-feedback" :class="{ detected: cameraStore.isHandDetected }">
            {{ cameraStore.gesture.name }}
          </div>
        </div>
      </div>
    </transition>

    <transition name="pop">
      <div v-if="showLetter" class="letter-overlay" @click="showLetter=false">
        <div class="letter-paper">
          <h2>Dear You,</h2>
          <p class="letter-body">
            在这浩瀚星海中，<br>
            你是我眼中最亮的那颗星。<br>
            愿你的每一个愿望都能成真。<br>
            <br>
            Merry Christmas & Happy New Year!
          </p>
          <p class="hint">(点击任意处关闭)</p>
        </div>
      </div>
    </transition>

    <div v-if="isInitLoading" class="loading-screen">
      <div class="spinner"></div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch, computed } from 'vue';
import { storeToRefs } from 'pinia';
import { useCamerasStore } from '@/store';
import { useImageStore } from '@/store'; 
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

// ========== 1. CameraRig (保持运镜逻辑) ==========
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

// ========== 2. 配置与定义 ==========
const CONFIG = {
  treeHeight: 80,
  maxRadius: 35,
  counts: { gold: 600, silver: 600, gem: 400, emerald: 400 }
};

const THEMES = [
  { bg: 0x050505, gold: 0xffaa00, silver: 0xeeeeee, gem: 0xff0044, emerald: 0x00ff88 }, // 经典
  { bg: 0x000810, gold: 0x00ffff, silver: 0xffffff, gem: 0x0055ff, emerald: 0xaaddff }, // 冰雪
  { bg: 0x1a0510, gold: 0xff69b4, silver: 0xffb7c5, gem: 0x9900ff, emerald: 0xffffff }  // 芭比
];

const modes = [
  { key: 'tree', label: '聚合', icon: '🎄' },
  { key: 'scatter', label: '散开', icon: '🌌' },
  { key: 'zoom', label: '特写', icon: '🔭' }
];

const cameraStore = useCamerasStore();
const imageStore = useImageStore();
const { imageList } = storeToRefs(imageStore); // 获取图片列表

const canvasRef = ref(null);
const videoRef = ref(null);
const isInitLoading = ref(true);
const uiHidden = ref(false);
const showLetter = ref(false);
const currentState = ref('tree');
const currentThemeIndex = ref(0);

const ctx = {
  scene: null, camera: null, renderer: null, composer: null, controls: null,
  rig: null, mainGroup: null, 
  meshes: {}, materials: {},
  logicData: { gold: [], silver: [], gem: [], emerald: [] },
  photoMeshes: [], // 存储照片 Mesh
  loadedPhotoKeys: new Set(),
  textureLoader: new THREE.TextureLoader(),
  dummy: new THREE.Object3D()
};
let rafId = null;

// ========== 3. 生命周期 ==========
onMounted(async () => {
  initScene();
  // 触发图片加载
  if (imageStore.fetchImages) await imageStore.fetchImages();
});

onBeforeUnmount(() => {
  cancelAnimationFrame(rafId);
  cameraStore.stopCamera();
  window.removeEventListener('resize', onWindowResize);
  if (ctx.renderer) ctx.renderer.dispose();
});

// 监听图片列表更新，动态添加照片
watch(imageList, (newImages) => {
  if (newImages?.length) {
    newImages.forEach(imgData => {
      const key = imgData.key || imgData.id;
      const url = imgData.links?.url || imgData.url;
      if (url && key) addPhotoMesh(url, key);
    });
  }
}, { deep: true, immediate: true });

// 监听手势指令
watch(() => cameraStore.trigger.timestamp, () => {
  const t = cameraStore.trigger;
  if (t.mode && t.mode !== currentState.value) handleModeChange(t.mode);
  if (t.theme) forceNextTheme();
  if (t.letter) showLetter.value = true;
});

// ========== 4. 交互逻辑 ==========
const toggleCamera = () => {
  cameraStore.toggleCamera(videoRef.value);
};

const handleModeChange = (modeKey) => {
  if (currentState.value === modeKey && modeKey !== 'zoom') return;
  currentState.value = modeKey;

  if (ctx.rig) ctx.rig.isAnimating = false;

  const overviewPos = new THREE.Vector3(0, 0, 130);
  const centerTarget = new THREE.Vector3(0, 0, 0);

  if (modeKey === 'tree') {
    ctx.rig.flyTo(overviewPos, centerTarget, 1500, () => {
      ctx.controls.autoRotate = true;
      ctx.controls.autoRotateSpeed = 2.0;
    });
  } else if (modeKey === 'scatter') {
    ctx.controls.autoRotate = false;
    ctx.rig.flyTo(overviewPos, centerTarget, 1200);
  } else if (modeKey === 'zoom') {
    // 特写模式：如果照片，相机拉近看照片；没有照片则只拉近
    if (ctx.photoMeshes.length > 0) {
      // 随机选一张或者看第一张
      const targetPhoto = ctx.photoMeshes[Math.floor(Math.random() * ctx.photoMeshes.length)];
      const targetPos = targetPhoto.userData.scatterPos.clone().multiplyScalar(1.2); // 稍微往后一点
      // 确保z轴有距离
      targetPos.z += 20; 
      ctx.rig.flyTo(targetPos, targetPhoto.userData.scatterPos, 1000);
    } else {
      ctx.rig.flyTo(new THREE.Vector3(0, 10, 50), new THREE.Vector3(0, 10, 0), 1000);
    }
    ctx.controls.autoRotate = false;
  }
};

const forceNextTheme = () => {
  currentThemeIndex.value = (currentThemeIndex.value + 1) % THEMES.length;
  const theme = THEMES[currentThemeIndex.value];
  
  // 1. 场景颜色
  ctx.scene.background.setHex(theme.bg);
  ctx.scene.fog.color.setHex(theme.bg);
  
  // 2. 粒子材质颜色
  if (ctx.materials.gold) ctx.materials.gold.color.setHex(theme.gold);
  if (ctx.materials.silver) ctx.materials.silver.color.setHex(theme.silver);
  if (ctx.materials.gem) ctx.materials.gem.color.setHex(theme.gem);
  if (ctx.materials.emerald) ctx.materials.emerald.color.setHex(theme.emerald);

  // 3. 照片框颜色更新
  const frameColor = new THREE.Color(theme.gold); // 用主题的金色作为边框色
  ctx.photoMeshes.forEach(group => {
    if (group.children[1]) { // children[1] 是边框 Mesh
      group.children[1].material.color.copy(frameColor);
    }
  });
};

// ========== 5. Three.js 核心 ==========

// 辅助：处理跨域图片
const convertToProxyUrl = (url) => {
  if (!url) return '';
  const targetDomain = 'https://free.picui.cn';
  const proxyPrefix = '/picui-proxy';
  if (url.includes(targetDomain)) return url.replace(targetDomain, proxyPrefix);
  return url;
};

// 辅助：随机分布
const randomSpherePoint = (r) => {
  const u = Math.random(), v = Math.random();
  const theta = 2 * Math.PI * u, phi = Math.acos(2 * v - 1);
  return new THREE.Vector3(r * Math.sin(phi) * Math.cos(theta), r * Math.sin(phi) * Math.sin(theta), r * Math.cos(phi));
};

// 核心：添加照片
const addPhotoMesh = (url, key) => {
  if (ctx.loadedPhotoKeys.has(key)) return;
  const proxyUrl = convertToProxyUrl(url);

  ctx.textureLoader.load(proxyUrl, (tex) => {
    tex.colorSpace = THREE.SRGBColorSpace;
    ctx.loadedPhotoKeys.add(key);

    const img = tex.image;
    const ratio = img.width / img.height;
    const w = ratio >= 1 ? 5 : 5 * ratio;
    const h = ratio >= 1 ? 5 / ratio : 5;

    // 1. 照片平面
    const geometry = new THREE.PlaneGeometry(w, h);
    const material = new THREE.MeshBasicMaterial({ map: tex, side: THREE.DoubleSide });
    const photoMesh = new THREE.Mesh(geometry, material);

    // 2. 边框
    const frameGeo = new THREE.BoxGeometry(w + 0.3, h + 0.3, 0.2);
    const currentTheme = THEMES[currentThemeIndex.value];
    const frameMat = new THREE.MeshStandardMaterial({ color: currentTheme.gold, roughness: 0.3, metalness: 0.8 });
    const frameMesh = new THREE.Mesh(frameGeo, frameMat);
    frameMesh.position.z = -0.11;

    // 3. 组合
    const group = new THREE.Group();
    group.add(photoMesh);
    group.add(frameMesh);

    // 4. 计算位置 (树形态 vs 散开形态)
    const h_pos = (Math.random() - 0.5) * CONFIG.treeHeight;
    const normH = (h_pos + CONFIG.treeHeight/2) / CONFIG.treeHeight;
    const r = CONFIG.maxRadius * (1 - normH) * 1.2; // 稍微比树外面一点
    const theta = Math.random() * Math.PI * 2;
    
    const treePos = new THREE.Vector3(r * Math.cos(theta), h_pos, r * Math.sin(theta));
    const scatterPos = randomSpherePoint(60 + Math.random() * 20); // 散开得更远一点

    group.position.copy(treePos);
    group.lookAt(new THREE.Vector3(0, treePos.y, 0)); // 树模式面向中心或外侧

    // 存储元数据
    group.userData = {
      treePos,
      scatterPos,
      baseRot: group.rotation.clone(),
      velocity: new THREE.Vector3((Math.random()-0.5)*0.01, (Math.random()-0.5)*0.01, 0)
    };

    ctx.mainGroup.add(group);
    ctx.photoMeshes.push(group);
  });
};

const initScene = () => {
  const w = canvasRef.value.clientWidth;
  const h = canvasRef.value.clientHeight;
  
  ctx.scene = new THREE.Scene();
  const theme = THEMES[0];
  ctx.scene.background = new THREE.Color(theme.bg);
  ctx.scene.fog = new THREE.FogExp2(theme.bg, 0.002);
  
  ctx.camera = new THREE.PerspectiveCamera(50, w / h, 0.1, 1000);
  ctx.camera.position.set(0, 0, 130);
  
  ctx.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
  ctx.renderer.setSize(w, h);
  ctx.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
  ctx.renderer.toneMapping = THREE.ACESFilmicToneMapping;
  canvasRef.value.appendChild(ctx.renderer.domElement);
  
  ctx.controls = new OrbitControls(ctx.camera, ctx.renderer.domElement);
  ctx.controls.enableDamping = true;
  ctx.controls.autoRotate = true;
  ctx.controls.autoRotateSpeed = 2.0;
  
  ctx.rig = new CameraRig(ctx.camera, ctx.controls);
  ctx.textureLoader.crossOrigin = 'Anonymous';

  ctx.composer = new EffectComposer(ctx.renderer);
  ctx.composer.addPass(new RenderPass(ctx.scene, ctx.camera));
  ctx.composer.addPass(new UnrealBloomPass(new THREE.Vector2(w, h), 1.5, 0.4, 0.85));
  
  const pmrem = new THREE.PMREMGenerator(ctx.renderer);
  ctx.scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  
  ctx.scene.add(new THREE.AmbientLight(0xffffff, 0.2));
  const spot = new THREE.SpotLight(0xffddaa, 100);
  spot.position.set(50, 100, 50);
  ctx.scene.add(spot);
  
  ctx.mainGroup = new THREE.Group();
  ctx.scene.add(ctx.mainGroup);
  
  createParticles();
  window.addEventListener('resize', onWindowResize);
  isInitLoading.value = false;
  animate();
};

const createParticles = () => {
  const mats = {
    gold: new THREE.MeshPhysicalMaterial({ color: THEMES[0].gold, metalness: 1.0, roughness: 0.1 }),
    silver: new THREE.MeshPhysicalMaterial({ color: THEMES[0].silver, metalness: 0.9, roughness: 0.2 }),
    gem: new THREE.MeshPhysicalMaterial({ color: THEMES[0].gem, metalness: 0.1, roughness: 0, transmission: 0.6, thickness: 1 }),
    emerald: new THREE.MeshPhysicalMaterial({ color: THEMES[0].emerald, metalness: 0.2, roughness: 0.1, transmission: 0.5 })
  };
  ctx.materials = mats;

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
  rafId = requestAnimationFrame(animate);
  if (ctx.rig) ctx.rig.update();
  ctx.controls.update();

  const isTree = currentState.value === 'tree';
  const isScatter = currentState.value === 'scatter';
  const isZoom = currentState.value === 'zoom';

  // --- 手势控制的组旋转缩放 ---
  if (isScatter || isZoom) {
    // 星云/特写模式下，手势控制旋转和缩放
    ctx.mainGroup.rotation.y += 0.001 + (cameraStore.interaction.rotationFactor * 0.05);
    const targetScale = cameraStore.interaction.scaleFactor;
    ctx.mainGroup.scale.setScalar(ctx.mainGroup.scale.x + (targetScale - ctx.mainGroup.scale.x) * 0.1);
  } else {
    // 树模式：自动旋转，缩放归一
    ctx.mainGroup.rotation.y += 0.002;
    ctx.mainGroup.scale.setScalar(ctx.mainGroup.scale.x + (1.0 - ctx.mainGroup.scale.x) * 0.1);
  }

  // --- 更新普通粒子 (InstancedMesh) ---
  const updateMeshes = (key) => {
    const mesh = ctx.meshes[key];
    const data = ctx.logicData[key];
    if (!mesh) return;
    for (let i = 0; i < data.length; i++) {
      const item = data[i];
      let target = isTree ? item.treePos : item.scatterPos;
      
      item.currentPos.lerp(target, 0.08);
      item.rotation.x += item.rotSpeed.x;
      item.rotation.y += item.rotSpeed.y;
      
      let s = item.scale;
      // 特写模式下让粒子变小，避免遮挡照片
      if (isZoom) s *= 0.2; 

      ctx.dummy.position.copy(item.currentPos);
      ctx.dummy.rotation.copy(item.rotation);
      ctx.dummy.scale.setScalar(s);
      ctx.dummy.updateMatrix();
      mesh.setMatrixAt(i, ctx.dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
  };
  updateMeshes('gold'); updateMeshes('silver'); updateMeshes('gem'); updateMeshes('emerald');

  // --- 更新照片墙 (Group Mesh) ---
  ctx.photoMeshes.forEach(group => {
    let target = isTree ? group.userData.treePos : group.userData.scatterPos;
    let targetScale = isTree ? 0.0 : 1.0; // 树模式下照片隐藏(缩放到0)或者可以设为1显示在树上，这里设为0为了简洁
    // 如果想要树上也有照片，可以改为 targetScale = 0.5;
    
    // 散开模式 或 特写模式 显示照片
    if (isScatter || isZoom) targetScale = 1.0;
    
    // 位置插值
    group.position.lerp(target, 0.08);
    // 缩放插值
    const currentS = group.scale.x;
    const nextS = currentS + (targetScale - currentS) * 0.1;
    group.scale.setScalar(nextS);

    // 朝向控制
    if (isScatter || isZoom) {
        group.lookAt(ctx.camera.position); // 始终面向镜头
    } else {
        group.rotation.copy(group.userData.baseRot); // 恢复初始朝向
    }
  });

  ctx.composer.render();
};
</script>

<style scoped>
.jewel-scene { position: relative; width: 100vw; height: 100vh; background: #000; overflow: hidden; user-select: none; }
.canvas-wrapper { position: absolute; inset: 0; z-index: 0; }
.ui-layer { position: absolute; inset: 0; z-index: 10; pointer-events: none; }
.top-left-panel { position: absolute; top: 20px; left: 20px; pointer-events: auto; }

/* 按钮组样式 */
.glass-panel {
  background: rgba(20, 20, 20, 0.6);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 12px;
  padding: 8px;
  display: flex;
  gap: 8px;
  align-items: center;
}

.glass-panel button {
  background: transparent; 
  border: none; 
  color: #ccc;
  width: 40px; 
  height: 40px;
  border-radius: 8px; 
  cursor: pointer;
  display: flex; 
  align-items: center; 
  justify-content: center;
  transition: all 0.2s; 
  font-size: 1.2rem;
}
.glass-panel button:hover { background: rgba(255,255,255,0.1); color: #fff; transform: scale(1.1); }
.glass-panel button.active { background: rgba(212, 175, 55, 0.8); color: #000; box-shadow: 0 0 10px rgba(212,175,55,0.4); }

.divider-v { width: 1px; height: 24px; background: rgba(255,255,255,0.2); margin: 0 4px; }

/* 摄像头和弹窗样式 */
.camera-widget {
  position: absolute; bottom: 20px; right: 20px; width: 140px; height: 105px;
  border-radius: 10px; overflow: hidden; border: 2px solid rgba(255,255,255,0.2);
  background: #000; transform: scaleX(-1); pointer-events: auto;
}
.camera-widget video { width: 100%; height: 100%; object-fit: cover; opacity: 0.8; }
.gesture-feedback {
  position: absolute; bottom: 0; left: 0; width: 100%; text-align: center; color: #fff;
  font-size: 10px; background: rgba(0,0,0,0.5); padding: 2px; transform: scaleX(-1);
}
.gesture-feedback.detected { color: #00ff88; }

.letter-overlay {
  position: absolute; inset: 0; background: rgba(0,0,0,0.7); display: flex; align-items: center; justify-content: center; z-index: 100; backdrop-filter: blur(5px);
}
.letter-paper {
  background: #fffbf0; color: #4a3b2a; width: 80%; max-width: 400px; padding: 40px; border-radius: 4px; box-shadow: 0 0 30px rgba(255,215,0,0.3); text-align: center; font-family: serif;
}
.letter-body { font-size: 1.1rem; line-height: 1.8; margin: 20px 0; }
.hint { font-size: 0.8rem; color: #999; }

.fade-enter-active, .fade-leave-active { transition: opacity 0.5s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
.pop-enter-active { animation: popIn 0.4s; }
.pop-leave-active { transition: opacity 0.3s; opacity: 0; }
@keyframes popIn { from { opacity: 0; transform: scale(0.8); } to { opacity: 1; transform: scale(1); } }
.spinning { display: inline-block; animation: spin 1s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
.loading-screen { position: absolute; inset: 0; background: #000; display: flex; justify-content: center; align-items: center; z-index: 200; }
.spinner { width: 40px; height: 40px; border: 3px solid rgba(255,255,255,0.1); border-top-color: #d4af37; border-radius: 50%; animation: spin 1s linear infinite; }
</style>