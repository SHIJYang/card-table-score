<template>
  <div class="grand-tree-container">
    <div id="loader" v-if="isLoading" :class="{ 'fade-out': isFadingOut }">
      <div class="spinner"></div>
      <div class="loader-text">Loading Memories</div>
    </div>

    <div ref="canvasContainer" id="canvas-container"></div>

    <div id="ui-layer" :class="{ 'ui-hidden': isUiHidden }">
      <h1>Merry Christmas</h1>
      
      <div class="controls-wrapper">
        <div class="btn-group">
          <label class="upload-btn">
            Select Folder
            <input 
              type="file" 
              ref="folderInput" 
              webkitdirectory 
              directory 
              multiple 
              @change="handleImageUpload"
            >
          </label>
          
          <label class="upload-btn">
            Select Files
            <input 
              type="file" 
              ref="fileInput" 
              multiple 
              accept="image/*" 
              @change="handleImageUpload"
            >
          </label>
        </div>
        <div class="hint-text">Use "Select Folder" to load all photos at once</div>
        <div class="hint-text" style="opacity: 0.7; font-size: 8px;">Or put photos in "/images/"</div>
      </div>
    </div>

    <div id="webcam-wrapper" :class="{ 'ui-hidden': isUiHidden }">
      <video ref="webcamVideo" id="webcam" autoplay playsinline></video>
      <div id="debug-info">{{ debugText }}</div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, reactive } from 'vue';
import * as THREE from 'three';
// 注意：在标准 NPM 环境下，路径通常是 three/examples/jsm/...
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { FilesetResolver, HandLandmarker } from '@mediapipe/tasks-vision';

// --- Vue 响应式状态 ---
const isLoading = ref(true);
const isFadingOut = ref(false);
const isUiHidden = ref(false);
const debugText = ref('Initializing...');
const canvasContainer = ref(null);
const webcamVideo = ref(null);

// --- 核心全局变量 (非响应式，为了性能) ---
// 这些变量用于 3D 渲染循环，不需要 Vue 的响应式系统监听
let scene, camera, renderer, composer;
let mainGroup; 
let clock = new THREE.Clock();
let particleSystem = [];
let photoMeshGroup = new THREE.Group();
let handLandmarker;
let caneTexture; 
let snowSystem;
let animationFrameId;

// --- 配置常量 ---
const CONFIG = {
  colors: {
    bg: 0x050d1a,        // 深邃午夜蓝背景
    fog: 0x050d1a,       // 雾气颜色
    champagneGold: 0xffd966, // 香槟金
    deepGreen: 0x03180a,     // 深绿
    accentRed: 0x990000,     // 强调红
  },
  particles: {
    count: 1500,     // 装饰粒子数量
    dustCount: 2000, // 尘埃粒子数量
    snowCount: 1000, // 雪花数量
    treeHeight: 24,  // 树高
    treeRadius: 8    // 树底部半径
  },
  camera: { z: 50 },
  preload: {
    autoScanLocal: true, // 是否扫描本地默认图片
    scanCount: 20,       // 尝试扫描的数量
    images: [
      'https://images.unsplash.com/photo-1543589077-47d81606c1bf?q=80&w=600', 
      'https://images.unsplash.com/photo-1576919228236-a097c32a5cd4?q=80&w=600',
      'https://images.unsplash.com/photo-1512389142860-9c449e58a543?q=80&w=600', 
      'https://images.unsplash.com/photo-1482638588057-dce9509db949?q=80&w=600'
    ]
  }
};

// --- 交互状态 ---
const STATE = {
  mode: 'TREE', // 当前模式: TREE(树形), SCATTER(散开), FOCUS(聚焦)
  focusIndex: -1, 
  focusTarget: null, // 当前聚焦的 Three.js Mesh 对象
  hand: { detected: false, x: 0, y: 0 },
  rotation: { x: 0, y: 0 } 
};

// --- 生命周期钩子 ---

onMounted(async () => {
  await init();
  
  // 键盘事件监听：按 'H' 隐藏 UI
  window.addEventListener('keydown', handleKeydown);
  // 窗口大小调整
  window.addEventListener('resize', handleResize);
});

onUnmounted(() => {
  cancelAnimationFrame(animationFrameId);
  window.removeEventListener('keydown', handleKeydown);
  window.removeEventListener('resize', handleResize);
  
  // 清理 Three.js 资源
  if (renderer) renderer.dispose();
  if (scene) scene.clear();
});

// --- 初始化主函数 ---
async function init() {
  initThree();         // 初始化 Three.js 场景、相机、渲染器
  setupEnvironment();  // 设置环境贴图
  setupLights();       // 设置灯光
  createTextures();    // 创建程序化纹理 (如拐杖糖纹理)
  createParticles();   // 创建主要的装饰粒子 (球、方块、星星)
  createDust();        // 创建氛围尘埃
  createSnow();        // 创建雪花系统
  loadPredefinedImages(); // 加载预设图片
  setupPostProcessing();  // 设置后期处理 (辉光效果)
  
  await initMediaPipe(); // 初始化手势识别

  // 关闭加载动画
  isFadingOut.value = true;
  setTimeout(() => {
    isLoading.value = false;
  }, 800);

  animate(); // 开始动画循环
}

// --- 功能函数详解 ---

/**
 * 初始化 Three.js 基础组件
 */
function initThree() {
  if (!canvasContainer.value) return;

  scene = new THREE.Scene();
  scene.background = new THREE.Color(CONFIG.colors.bg);
  scene.fog = new THREE.FogExp2(CONFIG.colors.fog, 0.015);

  camera = new THREE.PerspectiveCamera(42, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.set(0, 2, CONFIG.camera.z);

  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.toneMapping = THREE.ReinhardToneMapping;
  renderer.toneMappingExposure = 2.2;
  
  canvasContainer.value.appendChild(renderer.domElement);

  mainGroup = new THREE.Group();
  scene.add(mainGroup);
}

/**
 * 设置环境光反射 (让金属材质更好看)
 */
function setupEnvironment() {
  const pmremGenerator = new THREE.PMREMGenerator(renderer);
  scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
}

/**
 * 设置场景灯光
 */
function setupLights() {
  const ambient = new THREE.AmbientLight(0xffffff, 0.6);
  scene.add(ambient);

  const innerLight = new THREE.PointLight(0xffaa00, 2, 20);
  innerLight.position.set(0, 5, 0);
  mainGroup.add(innerLight);

  const spotGold = new THREE.SpotLight(0xffcc66, 1200);
  spotGold.position.set(30, 40, 40);
  spotGold.angle = 0.5;
  spotGold.penumbra = 0.5;
  scene.add(spotGold);

  // 蓝色背光，营造月光氛围
  const spotBlue = new THREE.SpotLight(0x6688ff, 800);
  spotBlue.position.set(-30, 20, -30);
  scene.add(spotBlue);

  const fill = new THREE.DirectionalLight(0xffeebb, 0.8);
  fill.position.set(0, 0, 50);
  scene.add(fill);
}

/**
 * 设置后期处理 (Bloom/辉光效果)
 */
function setupPostProcessing() {
  const renderScene = new RenderPass(scene, camera);
  const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1.5, 0.4, 0.85);
  bloomPass.threshold = 0.65;
  bloomPass.strength = 0.5;
  bloomPass.radius = 0.4;

  composer = new EffectComposer(renderer);
  composer.addPass(renderScene);
  composer.addPass(bloomPass);
}

/**
 * 使用 Canvas API 动态生成拐杖糖的条纹纹理
 */
function createTextures() {
  const canvas = document.createElement('canvas');
  canvas.width = 128; canvas.height = 128;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0,0,128,128);
  ctx.fillStyle = '#880000';
  ctx.beginPath();
  for(let i=-128; i<256; i+=32) {
    ctx.moveTo(i, 0);
    ctx.lineTo(i+32, 128); ctx.lineTo(i+16, 128); ctx.lineTo(i-16, 0);
  }
  ctx.fill();
  caneTexture = new THREE.CanvasTexture(canvas);
  caneTexture.wrapS = THREE.RepeatWrapping;
  caneTexture.wrapT = THREE.RepeatWrapping;
  caneTexture.repeat.set(3, 3);
}

/**
 * 粒子类：控制每个独立的装饰物(球/照片)的行为
 */
class Particle {
  constructor(mesh, type, isDust = false) {
    this.mesh = mesh;
    this.type = type;
    this.isDust = isDust;
    
    this.posTree = new THREE.Vector3();    // 树形态的目标位置
    this.posScatter = new THREE.Vector3(); // 散开形态的目标位置
    this.baseScale = mesh.scale.x;
    
    const speedMult = (type === 'PHOTO') ? 0.3 : 2.0;
    this.spinSpeed = new THREE.Vector3(
      (Math.random() - 0.5) * speedMult,
      (Math.random() - 0.5) * speedMult,
      (Math.random() - 0.5) * speedMult
    );
    this.calculatePositions();
  }

  // 计算两种模式下的坐标
  calculatePositions() {
    if (this.type === 'PHOTO') {
      this.posTree.set(0, 0, 0); // 照片稍后统一排布
      const rScatter = 8 + Math.random()*12;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      this.posScatter.set(
        rScatter * Math.sin(phi) * Math.cos(theta),
        rScatter * Math.sin(phi) * Math.sin(theta),
        rScatter * Math.cos(phi)
      );
      return;
    }

    // 螺旋向上算法生成圣诞树形状
    const h = CONFIG.particles.treeHeight;
    const halfH = h / 2;
    let t = Math.random(); 
    t = Math.pow(t, 0.8); // 偏向树底部
    const y = (t * h) - halfH;
    
    let rMax = CONFIG.particles.treeRadius * (1.0 - t);
    if (rMax < 0.5) rMax = 0.5;

    const angle = t * 50 * Math.PI + Math.random() * Math.PI;
    const r = rMax * (0.8 + Math.random() * 0.4); 
    this.posTree.set(Math.cos(angle) * r, y, Math.sin(angle) * r);

    // 散开位置
    let rScatter = this.isDust ? (12 + Math.random()*20) : (8 + Math.random()*12);
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    this.posScatter.set(
      rScatter * Math.sin(phi) * Math.cos(theta),
      rScatter * Math.sin(phi) * Math.sin(theta),
      rScatter * Math.cos(phi)
    );
  }

  // 每帧更新粒子状态
  update(dt, mode, focusTargetMesh) {
    let target = this.posTree;
    if (mode === 'SCATTER') target = this.posScatter;
    else if (mode === 'FOCUS') {
      if (this.mesh === focusTargetMesh) {
        // 如果是当前聚焦的照片，移动到镜头前
        const desiredWorldPos = new THREE.Vector3(0, 2, 35);
        const invMatrix = new THREE.Matrix4().copy(mainGroup.matrixWorld).invert();
        target = desiredWorldPos.applyMatrix4(invMatrix);
      } else {
        target = this.posScatter;
      }
    }

    // 插值移动动画
    const lerpSpeed = (mode === 'FOCUS' && this.mesh === focusTargetMesh) ? 5.0 : 2.0; 
    this.mesh.position.lerp(target, lerpSpeed * dt);

    // 旋转逻辑
    if (mode === 'SCATTER') {
      this.mesh.rotation.x += this.spinSpeed.x * dt;
      this.mesh.rotation.y += this.spinSpeed.y * dt;
      this.mesh.rotation.z += this.spinSpeed.z * dt;
    } else if (mode === 'TREE') {
      if (this.type === 'PHOTO') {
        this.mesh.lookAt(0, this.mesh.position.y, 0);
        this.mesh.rotateY(Math.PI); // 照片面向外侧
      } else {
        // 复位旋转
        this.mesh.rotation.x = THREE.MathUtils.lerp(this.mesh.rotation.x, 0, dt);
        this.mesh.rotation.z = THREE.MathUtils.lerp(this.mesh.rotation.z, 0, dt);
        this.mesh.rotation.y += 0.5 * dt;
      }
    }
    
    if (mode === 'FOCUS' && this.mesh === focusTargetMesh) {
      this.mesh.lookAt(camera.position);
    }

    // 缩放逻辑 (聚焦时放大，树模式下隐藏尘埃)
    let s = this.baseScale;
    if (this.isDust) {
      s = this.baseScale * (0.8 + 0.4 * Math.sin(clock.elapsedTime * 4 + this.mesh.id));
      if (mode === 'TREE') s = 0; 
    } else if (mode === 'SCATTER' && this.type === 'PHOTO') {
      s = this.baseScale * 2.5;
    } else if (mode === 'FOCUS') {
      if (this.mesh === focusTargetMesh) s = 4.5;
      else s = this.baseScale * 0.8; 
    }
    
    this.mesh.scale.lerp(new THREE.Vector3(s,s,s), 4*dt);
  }
}

/**
 * 创建所有装饰粒子
 */
function createParticles() {
  const sphereGeo = new THREE.SphereGeometry(0.5, 32, 32);
  const boxGeo = new THREE.BoxGeometry(0.55, 0.55, 0.55); 
  // 拐杖糖几何体
  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, -0.5, 0), new THREE.Vector3(0, 0.3, 0),
    new THREE.Vector3(0.1, 0.5, 0), new THREE.Vector3(0.3, 0.4, 0)
  ]);
  const candyGeo = new THREE.TubeGeometry(curve, 16, 0.08, 8, false);

  // 材质
  const goldMat = new THREE.MeshStandardMaterial({
    color: CONFIG.colors.champagneGold,
    metalness: 1.0, roughness: 0.1,
    envMapIntensity: 2.0, emissive: 0x443300, emissiveIntensity: 0.3
  });
  const greenMat = new THREE.MeshStandardMaterial({
    color: CONFIG.colors.deepGreen,
    metalness: 0.2, roughness: 0.8,
    emissive: 0x002200, emissiveIntensity: 0.2 
  });
  const redMat = new THREE.MeshPhysicalMaterial({
    color: CONFIG.colors.accentRed,
    metalness: 0.3, roughness: 0.2, clearcoat: 1.0, emissive: 0x330000
  });
  const candyMat = new THREE.MeshStandardMaterial({ map: caneTexture, roughness: 0.4 });

  for (let i = 0; i < CONFIG.particles.count; i++) {
    const rand = Math.random();
    let mesh, type;
    
    if (rand < 0.40) { mesh = new THREE.Mesh(boxGeo, greenMat); type = 'BOX'; }
    else if (rand < 0.70) { mesh = new THREE.Mesh(boxGeo, goldMat); type = 'GOLD_BOX'; }
    else if (rand < 0.92) { mesh = new THREE.Mesh(sphereGeo, goldMat); type = 'GOLD_SPHERE'; }
    else if (rand < 0.97) { mesh = new THREE.Mesh(sphereGeo, redMat); type = 'RED'; }
    else { mesh = new THREE.Mesh(candyGeo, candyMat); type = 'CANE'; }

    const s = 0.4 + Math.random() * 0.5;
    mesh.scale.set(s,s,s);
    mesh.rotation.set(Math.random()*6, Math.random()*6, Math.random()*6);
    
    mainGroup.add(mesh);
    particleSystem.push(new Particle(mesh, type, false));
  }

  // 创建顶部的星星
  createStar();
  
  mainGroup.add(photoMeshGroup);
}

function createStar() {
  const starShape = new THREE.Shape();
  const points = 5;
  const outerRadius = 1.5;
  const innerRadius = 0.7;
  for (let i = 0; i < points * 2; i++) {
    const angle = (i * Math.PI) / points + Math.PI / 2;
    const r = (i % 2 === 0) ? outerRadius : innerRadius;
    const x = Math.cos(angle) * r;
    const y = Math.sin(angle) * r;
    if (i === 0) starShape.moveTo(x, y);
    else starShape.lineTo(x, y);
  }
  starShape.closePath();
  const starGeo = new THREE.ExtrudeGeometry(starShape, {
    depth: 0.4, bevelEnabled: true, bevelThickness: 0.1, bevelSize: 0.1, bevelSegments: 2
  });
  starGeo.center(); 
  const starMat = new THREE.MeshStandardMaterial({
    color: 0xffdd88, emissive: 0xffaa00, emissiveIntensity: 1.0,
    metalness: 1.0, roughness: 0
  });
  const star = new THREE.Mesh(starGeo, starMat);
  star.position.set(0, CONFIG.particles.treeHeight/2 + 1.2, 0);
  mainGroup.add(star);
}

function createDust() {
  const geo = new THREE.TetrahedronGeometry(0.08, 0);
  const mat = new THREE.MeshBasicMaterial({ color: 0xffeebb, transparent: true, opacity: 0.8 });
  for(let i=0; i<CONFIG.particles.dustCount; i++) {
     const mesh = new THREE.Mesh(geo, mat);
     mesh.scale.setScalar(0.5 + Math.random());
     mainGroup.add(mesh);
     particleSystem.push(new Particle(mesh, 'DUST', true));
  }
}

/**
 * 创建雪花系统
 */
function createSnow() {
  const geometry = new THREE.BufferGeometry();
  const vertices = [];
  const velocities = [];

  const canvas = document.createElement('canvas');
  canvas.width = 32; canvas.height = 32;
  const context = canvas.getContext('2d');
  context.fillStyle = 'white';
  context.beginPath();
  context.arc(16, 16, 16, 0, Math.PI * 2);
  context.fill();
  const snowTexture = new THREE.CanvasTexture(canvas);

  for (let i = 0; i < CONFIG.particles.snowCount; i++) {
    const x = THREE.MathUtils.randFloatSpread(100);
    const y = THREE.MathUtils.randFloatSpread(60);
    const z = THREE.MathUtils.randFloatSpread(60);
    vertices.push(x, y, z);
    velocities.push(Math.random() * 0.2 + 0.1, Math.random() * 0.05);
  }

  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setAttribute('userData', new THREE.Float32BufferAttribute(velocities, 2));
  
  const material = new THREE.PointsMaterial({
    color: 0xffffff, size: 0.4, map: snowTexture,
    transparent: true, opacity: 0.8,
    blending: THREE.AdditiveBlending, depthWrite: false
  });
  
  snowSystem = new THREE.Points(geometry, material);
  scene.add(snowSystem);
}

function updateSnow() {
  if (!snowSystem) return;
  const positions = snowSystem.geometry.attributes.position.array;
  const userData = snowSystem.geometry.attributes.userData.array;

  for (let i = 0; i < CONFIG.particles.snowCount; i++) {
    const fallSpeed = userData[i * 2];
    const swaySpeed = userData[i * 2 + 1];
    
    // Y轴下落
    positions[i * 3 + 1] -= fallSpeed;
    // X轴摇摆
    positions[i * 3] += Math.sin(clock.elapsedTime * 2 + i) * swaySpeed * 0.1;
    
    // 循环重置到顶部
    if (positions[i * 3 + 1] < -30) {
      positions[i * 3 + 1] = 30;
      positions[i * 3] = THREE.MathUtils.randFloatSpread(100);
      positions[i * 3 + 2] = THREE.MathUtils.randFloatSpread(60);
    }
  }
  snowSystem.geometry.attributes.position.needsUpdate = true;
}

/**
 * 加载预定义或本地的图片
 */
function loadPredefinedImages() {
  const loader = new THREE.TextureLoader();
  
  // 加载网络图片
  CONFIG.preload.images.forEach(url => {
    loader.load(url, (t) => { t.colorSpace = THREE.SRGBColorSpace; addPhotoToScene(t); });
  });

  // 尝试加载本地 public/images/ 文件夹下的图片 (1.jpg - 20.jpg)
  if (CONFIG.preload.autoScanLocal) {
    for (let i = 1; i <= CONFIG.preload.scanCount; i++) {
      // 假设图片在 public/images/ 目录下
      const pathJpg = `/images/${i}.jpg`;
      loader.load(pathJpg, 
        (t) => { t.colorSpace = THREE.SRGBColorSpace; addPhotoToScene(t); },
        undefined,
        (err) => { /* Ignore missing files */ }
      );
    }
  }
}

/**
 * 将图片创建为 3D Mesh 并添加到场景
 */
function addPhotoToScene(texture) {
  const frameGeo = new THREE.BoxGeometry(1.4, 1.4, 0.05);
  const frameMat = new THREE.MeshStandardMaterial({ color: CONFIG.colors.champagneGold, metalness: 1.0, roughness: 0.1 });
  const frame = new THREE.Mesh(frameGeo, frameMat);
  
  let width = 1.2;
  let height = 1.2;
  
  if (texture.image) {
    const aspect = texture.image.width / texture.image.height;
    if (aspect > 1) height = width / aspect;
    else width = height * aspect;
  }

  const photoGeo = new THREE.PlaneGeometry(width, height);
  const photoMat = new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide });
  const photo = new THREE.Mesh(photoGeo, photoMat);
  photo.position.z = 0.04;
  
  const group = new THREE.Group();
  group.add(frame);
  group.add(photo);
  
  frame.scale.set(width/1.2, height/1.2, 1);
  const s = 0.8;
  group.scale.set(s,s,s);
  
  photoMeshGroup.add(group);
  particleSystem.push(new Particle(group, 'PHOTO', false));
  updatePhotoLayout();
}

/**
 * 重新计算树上照片的分布 (螺旋排列)
 */
function updatePhotoLayout() {
  const photos = particleSystem.filter(p => p.type === 'PHOTO');
  const count = photos.length;
  if (count === 0) return;

  const h = CONFIG.particles.treeHeight * 0.9;
  const bottomY = -h/2;
  const stepY = h / count;
  const loops = 3;

  photos.forEach((p, i) => {
    const y = bottomY + stepY * i + stepY/2;
    const fullH = CONFIG.particles.treeHeight;
    const normalizedH = (y + fullH/2) / fullH; 

    let rMax = CONFIG.particles.treeRadius * (1.0 - normalizedH);
    if (rMax < 1.0) rMax = 1.0;
    
    const r = rMax + 3.0; // 悬浮在树枝外侧
    const angle = normalizedH * Math.PI * 2 * loops + (Math.PI/4); 

    p.posTree.set(Math.cos(angle) * r, y, Math.sin(angle) * r);
  });
}

// --- 事件处理 ---

function handleImageUpload(e) {
  const files = e.target.files;
  if(!files.length) return;
  
  Array.from(files).forEach(f => {
    if (!f.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      new THREE.TextureLoader().load(ev.target.result, (t) => {
        t.colorSpace = THREE.SRGBColorSpace;
        addPhotoToScene(t);
      });
    }
    reader.readAsDataURL(f);
  });
}

function handleResize() {
  if (!camera || !renderer) return;
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  composer.setSize(window.innerWidth, window.innerHeight);
}

function handleKeydown(e) {
  if (e.key.toLowerCase() === 'h') {
    isUiHidden.value = !isUiHidden.value;
  }
}

// --- MediaPipe 手势识别逻辑 ---

async function initMediaPipe() {
  if (!webcamVideo.value) return;
  
  const constraints = {
    video: {
      width: { ideal: 640 },
      height: { ideal: 480 },
      frameRate: { ideal: 30 }
    }
  };

  try {
    const vision = await FilesetResolver.forVisionTasks(
      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm"
    );
    handLandmarker = await HandLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath: `https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task`,
        delegate: "GPU"
      },
      runningMode: "VIDEO",
      numHands: 1
    });

    if (navigator.mediaDevices?.getUserMedia) {
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      webcamVideo.value.srcObject = stream;
      webcamVideo.value.addEventListener("loadeddata", predictWebcam);
      debugText.value = "Webcam active. Show hand.";
    }
  } catch(e) {
    console.warn("Webcam access error", e);
    debugText.value = "Camera error: " + e.message;
    // 隐藏摄像头UI
    const webcamWrapper = document.getElementById('webcam-wrapper');
    if(webcamWrapper) webcamWrapper.style.display = 'none';
  }
}

let lastVideoTime = -1;
async function predictWebcam() {
  if (!webcamVideo.value) return;
  
  if (webcamVideo.value.currentTime !== lastVideoTime) {
    lastVideoTime = webcamVideo.value.currentTime;
    if (handLandmarker) {
      const result = handLandmarker.detectForVideo(webcamVideo.value, performance.now());
      processGestures(result);
    }
  }
  // 注意：这里由 requestAnimationFrame(animate) 统一驱动循环，或者独立驱动皆可
  // 为了性能，我们让 animate 主循环来处理 3D，这里仅处理数据
  requestAnimationFrame(predictWebcam);
}

/**
 * 手势解析逻辑
 */
function processGestures(result) {
  if (result.landmarks && result.landmarks.length > 0) {
    STATE.hand.detected = true;
    const lm = result.landmarks[0];
    
    // 映射手掌中心坐标到 [-1, 1] 区间，用于旋转控制
    STATE.hand.x = (lm[9].x - 0.5) * 2; 
    STATE.hand.y = (lm[9].y - 0.5) * 2;

    const thumb = lm[4]; 
    const index = lm[8]; 
    const wrist = lm[0];
    const middleMCP = lm[9];

    // 1. 基准大小 (手腕到中指根部)
    const handSize = Math.hypot(middleMCP.x - wrist.x, middleMCP.y - wrist.y);
    if (handSize < 0.02) return;

    // 2. 五指张开程度
    const tips = [lm[8], lm[12], lm[16], lm[20]];
    let avgTipDist = 0;
    tips.forEach(t => avgTipDist += Math.hypot(t.x - wrist.x, t.y - wrist.y));
    avgTipDist /= 4;

    // 3. 捏合程度 (拇指与食指)
    const pinchDist = Math.hypot(thumb.x - index.x, thumb.y - index.y);

    const extensionRatio = avgTipDist / handSize;
    const pinchRatio = pinchDist / handSize;

    debugText.value = `Size: ${handSize.toFixed(2)} | Ext: ${extensionRatio.toFixed(2)} | Pinch: ${pinchRatio.toFixed(2)} | Mode: ${STATE.mode}`;

    // 4. 模式切换逻辑
    if (extensionRatio < 1.5) {
      // 握拳 -> 变成圣诞树
      STATE.mode = 'TREE';
      STATE.focusTarget = null;
    } else if (pinchRatio < 0.35) {
      // 捏合 -> 聚焦随机照片
      if (STATE.mode !== 'FOCUS') {
        STATE.mode = 'FOCUS';
        const photos = particleSystem.filter(p => p.type === 'PHOTO');
        if (photos.length) STATE.focusTarget = photos[Math.floor(Math.random()*photos.length)].mesh;
      }
    } else if (extensionRatio > 1.7) {
      // 张开 -> 散开照片
      STATE.mode = 'SCATTER';
      STATE.focusTarget = null;
    }
  } else {
    STATE.hand.detected = false;
    debugText.value = "No hand detected";
  }
}

// --- 动画循环 ---
function animate() {
  animationFrameId = requestAnimationFrame(animate);
  const dt = clock.getDelta();

  // 旋转逻辑：根据手势位置或自动旋转
  if (STATE.mode === 'SCATTER' && STATE.hand.detected) {
    const targetRotY = STATE.hand.x * Math.PI * 0.9;
    const targetRotX = STATE.hand.y * Math.PI * 0.25;
    STATE.rotation.y += (targetRotY - STATE.rotation.y) * 3.0 * dt;
    STATE.rotation.x += (targetRotX - STATE.rotation.x) * 3.0 * dt;
  } else {
    if(STATE.mode === 'TREE') {
      STATE.rotation.y += 0.3 * dt;
      STATE.rotation.x += (0 - STATE.rotation.x) * 2.0 * dt; // 回正 X 轴
    } else {
      STATE.rotation.y += 0.1 * dt;
    }
  }

  mainGroup.rotation.y = STATE.rotation.y;
  mainGroup.rotation.x = STATE.rotation.x;

  // 更新所有粒子
  particleSystem.forEach(p => p.update(dt, STATE.mode, STATE.focusTarget));
  
  // 更新雪花
  updateSnow();
  
  // 渲染
  if (composer) composer.render();
}
</script>

<style scoped>
/* 容器样式 */
.grand-tree-container {
  width: 100vw;
  height: 100vh;
  position: relative;
  overflow: hidden;
  background: radial-gradient(circle at center, #0f2027 0%, #203a43 50%, #2c5364 100%);
  background-color: #050d1a;
  font-family: 'Times New Roman', serif;
}

#canvas-container {
  width: 100%;
  height: 100%;
  position: absolute;
  top: 0;
  left: 0;
  z-index: 1;
}

/* UI Overlay */
#ui-layer {
  position: absolute;
  top: 0; left: 0; width: 100%; height: 100%;
  z-index: 10; pointer-events: none;
  display: flex; flex-direction: column; 
  align-items: center;
  padding-top: 40px;
  box-sizing: border-box;
  transition: opacity 0.5s ease;
}

.ui-hidden {
  opacity: 0 !important;
  pointer-events: none !important;
}

/* Loading */
#loader {
  position: absolute;
  top: 0; left: 0; width: 100%; height: 100%;
  background: #050d1a; z-index: 100;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  transition: opacity 0.8s ease-out;
}
.fade-out {
  opacity: 0;
}

.loader-text {
  color: #d4af37;
  font-size: 14px; letter-spacing: 4px; margin-top: 20px;
  text-transform: uppercase; font-weight: 100;
}
.spinner {
  width: 40px;
  height: 40px; border: 1px solid rgba(212, 175, 55, 0.2); 
  border-top: 1px solid #d4af37; border-radius: 50%; 
  animation: spin 1s linear infinite;
}
@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }

/* Typography */
h1 { 
  color: #fceea7;
  font-size: 56px; margin: 0; font-weight: 400; 
  letter-spacing: 6px; 
  text-shadow: 0 0 50px rgba(252, 238, 167, 0.6);
  background: linear-gradient(to bottom, #fff, #eebb66);
  -webkit-background-clip: text; -webkit-text-fill-color: transparent;
  font-family: 'Times New Roman', serif; /* Cinzel 需要额外引入字体，这里回退到 Times */
  opacity: 0.9;
  transition: opacity 0.5s ease;
}

/* Controls */
.controls-wrapper {
  position: absolute;
  top: 30px; right: 30px;        
  pointer-events: auto;
  display: flex; flex-direction: column; align-items: flex-end;
  gap: 10px;
  z-index: 20;
  transition: opacity 0.5s ease;
}

.btn-group {
  display: flex; gap: 10px;
}

.upload-btn {
  background: rgba(20, 20, 20, 0.6);
  border: 1px solid rgba(212, 175, 55, 0.4); 
  color: #d4af37; 
  padding: 10px 20px; 
  cursor: pointer; 
  text-transform: uppercase; 
  letter-spacing: 2px; 
  font-size: 10px;
  transition: all 0.4s;
  display: flex; align-items: center; justify-content: center;
  backdrop-filter: blur(5px);
  min-width: 120px;
}
.upload-btn:hover { 
  background: #d4af37;
  color: #000; 
  box-shadow: 0 0 20px rgba(212, 175, 55, 0.5);
}

.hint-text {
  color: rgba(212, 175, 55, 0.5);
  font-size: 9px;
  letter-spacing: 1px;
  text-transform: uppercase;
  text-align: right;
  margin-top: 5px;
}

input[type="file"] { display: none; }

/* Webcam feedback */
#webcam-wrapper {
  position: absolute;
  bottom: 30px; left: 30px;         
  width: 280px; height: 210px;
  border: 1px solid rgba(212, 175, 55, 0.5); 
  box-shadow: 0 0 20px rgba(0,0,0,0.9);
  border-radius: 4px;
  overflow: hidden; 
  opacity: 1;         
  pointer-events: none;
  z-index: 50;
  background: #000;
  transition: opacity 0.5s ease;
}

#webcam {
  width: 100%; height: 100%;
  object-fit: cover;
  transform: scaleX(-1); 
}

#debug-info {
  position: absolute;
  bottom: 5px; left: 5px;
  color: rgba(212, 175, 55, 0.8);
  font-size: 10px;
  font-family: monospace;
  background: rgba(0,0,0,0.5);
  padding: 2px 5px;
  pointer-events: none;
}
</style>