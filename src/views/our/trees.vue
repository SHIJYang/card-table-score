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

// ========== 1. CameraRig (运镜系统) ==========
// 封装相机平滑飞行动画，用于在不同视角间过渡
class CameraRig {
  constructor(camera, controls) {
    this.camera = camera;
    this.controls = controls;
    this.isAnimating = false;
    this.startTime = 0;
    this.duration = 0;
    this.onCompleteCallback = null;
    // 缓存起始/结束位置和目标点
    this.startPos = new THREE.Vector3();
    this.endPos = new THREE.Vector3();
    this.startTarget = new THREE.Vector3();
    this.endTarget = new THREE.Vector3();
  }

  // 启动飞行动画
  flyTo(targetPos, targetLookAt, duration = 1500, callback = null) {
    this.isAnimating = true;
    this.startTime = performance.now();
    this.duration = duration;
    this.onCompleteCallback = callback;

    // 记录当前状态作为起点
    this.startPos.copy(this.camera.position);
    this.startTarget.copy(this.controls.target);
    this.endPos.copy(targetPos);
    this.endTarget.copy(targetLookAt);

    // 动画期间禁用用户控制
    this.controls.enabled = false;
    this.controls.autoRotate = false;
  }

  // 每帧更新相机位置（使用缓动函数）
  update() {
    if (!this.isAnimating) return;

    const now = performance.now();
    const elapsed = now - this.startTime;
    let progress = elapsed / this.duration;

    if (progress >= 1) {
      // 动画结束
      progress = 1;
      this.isAnimating = false;
      this.controls.enabled = true; // 恢复控制
      this.camera.position.copy(this.endPos);
      this.controls.target.copy(this.endTarget);
      if (this.onCompleteCallback) this.onCompleteCallback();
    } else {
      // 使用三次缓动（ease-in-out 效果）
      const ease = 1 - Math.pow(1 - progress, 3);
      this.camera.position.lerpVectors(this.startPos, this.endPos, ease);
      this.controls.target.lerpVectors(this.startTarget, this.endTarget, ease);
    }
  }
}

// ========== 2. 配置与定义 ==========

// 树的基本参数
const CONFIG = {
  treeHeight: 80,   // 树高
  maxRadius: 35,    // 底部最大半径
  counts: {
    gold: 600,      // 金色球体数量
    silver: 600,    // 银色立方体
    gem: 400,       // 宝石（八面体）
    emerald: 400    // 绿锥（翡翠）
  }
};

const THEMES = [
  // 1. 经典 -> 糖果红绿 (像 M&M 豆)
  { bg: 0x2c0e0e, gold: 0xffd700, silver: 0xffffff, gem: 0xff3366, emerald: 0x00ff88 }, 
  
  // 2. 冰雪 -> 艾莎蓝 (更亮，更通透)
  { bg: 0x0a1a2f, gold: 0x4dd0e1, silver: 0xf0f8ff, gem: 0x00bfff, emerald: 0x80deea }, 
  
  // 3. 芭比 -> 梦幻粉 (高饱和粉色)
  { bg: 0x2d0a1e, gold: 0xff9ff3, silver: 0xffd1dc, gem: 0xff00d4, emerald: 0x81ecec }, 
  
  // 4. 赛博 -> 霓虹游戏 (高对比度)
  { bg: 0x0f0c29, gold: 0xfef160, silver: 0x76ff03, gem: 0xff005c, emerald: 0x00f2ff }, 
  
  // 5. 森系 -> 抹茶拿铁 (柔和的绿)
  { bg: 0x1a261a, gold: 0xf6e58d, silver: 0xdff9fb, gem: 0x6ab04c, emerald: 0xbadc58 }, 
  
  // 6. 复古 -> 焦糖布丁 (暖棕色调)
  { bg: 0x2d1e12, gold: 0xffaf40, silver: 0xffcccc, gem: 0xcd6133, emerald: 0xfffa65 }, 
  
  // 7. 暗黑 -> 酷黑塑料 (非纯黑，带灰蓝)
  { bg: 0x1e272e, gold: 0xd2dae2, silver: 0x808e9b, gem: 0x0fbcf9, emerald: 0x05c46b }, 
  
  // 8. 马卡龙 -> 甜心派对 (index.js 中的 cartoon 配色)
  { bg: 0x2c1620, gold: 0xffe66d, silver: 0xffffff, gem: 0xff6b6b, emerald: 0x4ecdc4 }, 
  
  // 9. 霓虹 -> 蒸汽波 (蓝紫渐变感)
  { bg: 0x190028, gold: 0xff00ff, silver: 0x00ffff, gem: 0xffcc00, emerald: 0xff99ff }, 
  
  // 10. 莫兰迪 -> 奶茶色 (低饱和舒适)
  { bg: 0x2f3640, gold: 0xdcdde1, silver: 0xf5f6fa, gem: 0x9c88ff, emerald: 0x4cd137 }, 
  
  // 11. 沙漠 -> 乐高黄 (明亮的橙黄)
  { bg: 0x2C2C2C, gold: 0xffbc00, silver: 0xf1f2f6, gem: 0xff5252, emerald: 0xffa502 }  
];
// 三种交互模式
const modes = [
  { key: 'tree', label: '聚合', icon: '🎄' },
  { key: 'scatter', label: '散开', icon: '🌌' },
  { key: 'zoom', label: '特写', icon: '🔭' }
];

// Pinia Store 引用
const cameraStore = useCamerasStore();
const imageStore = useImageStore();
const { imageList } = storeToRefs(imageStore);

// DOM 引用
const canvasRef = ref(null);
const videoRef = ref(null);

// 状态管理
const isInitLoading = ref(true); // 初始化加载中
const uiHidden = ref(false);     // 是否隐藏 UI
const showLetter = ref(false);   // 是否显示信件
const currentState = ref('tree'); // 当前模式
const currentThemeIndex = ref(0); // 当前主题索引

// Three.js 上下文对象（集中管理所有 3D 对象）
const ctx = {
  scene: null,
  camera: null,
  renderer: null,
  composer: null,
  controls: null,
  rig: null,           // 相机动画控制器
  mainGroup: null,     // 所有物体的父容器
  meshes: {},          // InstancedMesh 引用
  materials: {},       // 材质引用
  logicData: {         // 存储每个粒子的目标位置等逻辑数据
    gold: [], silver: [], gem: [], emerald: []
  },
  photoMeshes: [],     // 照片组列表
  loadedPhotoKeys: new Set(), // 防止重复加载
  textureLoader: new THREE.TextureLoader(),
  dummy: new THREE.Object3D(), // 用于 InstancedMesh 的临时变换对象

  // 聚焦模式专用变量
  focusIndex: -1,              // 当前聚焦的照片索引
  invMatrix: new THREE.Matrix4(), // mainGroup 的逆矩阵（用于世界坐标转局部坐标）
  targetVec: new THREE.Vector3()  // 临时向量
};

let rafId = null; // requestAnimationFrame ID

// ========== 3. 生命周期 ==========

onMounted(async () => {
  initScene(); // 初始化 Three.js 场景
  if (imageStore.fetchImages) await imageStore.fetchImages(); // 加载图片
});

onBeforeUnmount(() => {
  cancelAnimationFrame(rafId);
  cameraStore.stopCamera(); // 关闭摄像头
  window.removeEventListener('resize', onWindowResize);
  if (ctx.renderer) ctx.renderer.dispose();
});

// 监听图片列表变化，自动添加新照片
watch(imageList, (newImages) => {
  if (newImages?.length) {
    newImages.forEach(imgData => {
      const key = imgData.key || imgData.id;
      const url = imgData.links?.url || imgData.url;
      if (url && key) addPhotoMesh(url, key);
    });
  }
}, { deep: true, immediate: true });

// 监听手势指令（来自 cameraStore.trigger）
watch(() => cameraStore.trigger.timestamp, () => {
  const t = cameraStore.trigger;
  if (t.mode) {
    if (t.mode === 'zoom' || t.mode !== currentState.value) {
      handleModeChange(t.mode);
    }
  }
  if (t.theme) forceNextTheme();
  if (t.letter) showLetter.value = true;
});

// ========== 4. 交互逻辑 ==========

const toggleCamera = () => {
  cameraStore.toggleCamera(videoRef.value); // 切换摄像头状态
};

// 处理模式切换
const handleModeChange = (modeKey) => {
  if (currentState.value === modeKey && modeKey !== 'zoom') return;
  currentState.value = modeKey;
  if (ctx.rig) ctx.rig.isAnimating = false;

  const overviewPos = new THREE.Vector3(0, 0, 130);
  const centerTarget = new THREE.Vector3(0, 0, 0);

  if (modeKey === 'tree') {
    // 聚合：回到全景，开启自动旋转
    ctx.rig.flyTo(overviewPos, centerTarget, 1500, () => {
      ctx.controls.autoRotate = true;
      ctx.controls.autoRotateSpeed = 2.0;
    });
  } else if (modeKey === 'scatter') {
    // 散开：全景但停止旋转
    ctx.controls.autoRotate = false;
    ctx.rig.flyTo(overviewPos, centerTarget, 1200);
  } else if (modeKey === 'zoom') {
    // 特写：相机飞到正面，聚焦下一张照片
    if (ctx.photoMeshes.length > 0) {
      ctx.focusIndex = (ctx.focusIndex + 1) % ctx.photoMeshes.length;
    }
    const viewingPos = new THREE.Vector3(0, 0, 115);
    const viewingTarget = new THREE.Vector3(0, 0, 0);
    ctx.rig.flyTo(viewingPos, viewingTarget, 1000);
    ctx.controls.autoRotate = false;
  }
};

// 切换到下一个主题
const forceNextTheme = () => {
  currentThemeIndex.value = (currentThemeIndex.value + 1) % THEMES.length;
  const theme = THEMES[currentThemeIndex.value];
  // 更新背景和雾
  ctx.scene.background.setHex(theme.bg);
  ctx.scene.fog.color.setHex(theme.bg);
  // 更新四种粒子材质颜色
  Object.keys(ctx.materials).forEach(key => {
    if (ctx.materials[key]) ctx.materials[key].color.setHex(theme[key]);
  });
  // 更新照片边框颜色
  const frameColor = new THREE.Color(theme.gold);
  ctx.photoMeshes.forEach(group => {
    if (group.children[1]) group.children[1].material.color.copy(frameColor);
  });
};

// ========== 5. Three.js 核心 ==========

// 图片代理（绕过 CORS）
const convertToProxyUrl = (url) => {
  if (!url) return '';
  const targetDomain = 'https://free.picui.cn';
  const proxyPrefix = '/picui-proxy';
  if (url.includes(targetDomain)) return url.replace(targetDomain, proxyPrefix);
  return url;
};

// 在球面上生成随机点（用于散开模式）
const randomSpherePoint = (r) => {
  const u = Math.random(), v = Math.random();
  const theta = 2 * Math.PI * u, phi = Math.acos(2 * v - 1);
  return new THREE.Vector3(r * Math.sin(phi) * Math.cos(theta),
                           r * Math.sin(phi) * Math.sin(theta),
                           r * Math.cos(phi));
};

// 添加一张照片（带边框）
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

    // 创建照片平面
    const geometry = new THREE.PlaneGeometry(w, h);
    const material = new THREE.MeshBasicMaterial({ map: tex, side: THREE.DoubleSide });
    const photoMesh = new THREE.Mesh(geometry, material);

    // 创建边框（Box）
    const frameGeo = new THREE.BoxGeometry(w + 0.2, h + 0.2, 0.2);
    const currentTheme = THEMES[currentThemeIndex.value];
    const frameMat = new THREE.MeshStandardMaterial({
      color: currentTheme.gold,
      roughness: 0.3,
      metalness: 0.8
    });
    const frameMesh = new THREE.Mesh(frameGeo, frameMat);
    frameMesh.position.z = -0.11;

    // 组合照片+边框
    const group = new THREE.Group();
    group.add(photoMesh);
    group.add(frameMesh);

    // 计算初始位置（在树形分布上）
    const h_pos = (Math.random() - 0.5) * CONFIG.treeHeight;
    const normH = (h_pos + CONFIG.treeHeight / 2) / CONFIG.treeHeight;
    const r = CONFIG.maxRadius * (1 - normH) * 1.3;
    const theta = Math.random() * Math.PI * 2;
    const treePos = new THREE.Vector3(r * Math.cos(theta), h_pos, r * Math.sin(theta));

    // 散开位置（球面随机）
    const scatterPos = randomSpherePoint(60 + Math.random() * 20);

    group.position.copy(treePos);
    group.lookAt(new THREE.Vector3(0, treePos.y, 0)); // 朝向树干

    // 存储位置信息供后续动画使用
    group.userData = {
      treePos,
      scatterPos,
      baseRot: group.rotation.clone(),
      scatterRot: new THREE.Euler(Math.random() * Math.PI, Math.random() * Math.PI, 0)
    };

    ctx.mainGroup.add(group);
    ctx.photoMeshes.push(group);
  });
};

// 初始化 Three.js 场景
const initScene = () => {
  const w = canvasRef.value.clientWidth;
  const h = canvasRef.value.clientHeight;

  ctx.scene = new THREE.Scene();
  const theme = THEMES[0];
  ctx.scene.background = new THREE.Color(theme.bg);
  ctx.scene.fog = new THREE.FogExp2(theme.bg, 0.002); // 指数雾增强纵深感

  ctx.camera = new THREE.PerspectiveCamera(50, w / h, 0.1, 1000);
  ctx.camera.position.set(0, 0, 130);

  ctx.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
  ctx.renderer.setSize(w, h);
  ctx.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
  ctx.renderer.toneMapping = THREE.ACESFilmicToneMapping; // 电影级色调映射
  canvasRef.value.appendChild(ctx.renderer.domElement);

  ctx.controls = new OrbitControls(ctx.camera, ctx.renderer.domElement);
  ctx.controls.enableDamping = true;
  ctx.controls.autoRotate = true;
  ctx.controls.autoRotateSpeed = 2.0;


  ctx.rig = new CameraRig(ctx.camera, ctx.controls);


  ctx.textureLoader.crossOrigin = 'Anonymous';

  // 后期处理：添加泛光（Bloom）
  ctx.composer = new EffectComposer(ctx.renderer);
  ctx.composer.addPass(new RenderPass(ctx.scene, ctx.camera));
  ctx.composer.addPass(new UnrealBloomPass(new THREE.Vector2(w, h), 1.5, 0.4, 0.85));

  // 环境光（使用 RoomEnvironment 模拟室内光照）
  const pmrem = new THREE.PMREMGenerator(ctx.renderer);
  ctx.scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

  // 添加光源
  ctx.scene.add(new THREE.AmbientLight(0xffffff, 0.2));
  const spot = new THREE.SpotLight(0xffddaa, 100);
  spot.position.set(50, 100, 50);
  ctx.scene.add(spot);

  // 所有物体的父容器
  ctx.mainGroup = new THREE.Group();
  ctx.scene.add(ctx.mainGroup);

  createParticles(); // 创建粒子
  window.addEventListener('resize', onWindowResize);
  isInitLoading.value = false;
  animate(); // 启动渲染循环
};

// 创建四类粒子（使用 InstancedMesh 提升性能）
const createParticles = () => {
  const mats = {
    gold: new THREE.MeshPhysicalMaterial({ color: THEMES[0].gold, metalness: 1.0, roughness: 0.1 }),
    silver: new THREE.MeshPhysicalMaterial({ color: THEMES[0].silver, metalness: 0.9, roughness: 0.2 }),
    gem: new THREE.MeshPhysicalMaterial({ color: THEMES[0].gem, metalness: 0.1, roughness: 0, transmission: 0.6, thickness: 1 }), // 半透明宝石
    emerald: new THREE.MeshPhysicalMaterial({ color: THEMES[0].emerald, metalness: 0.2, roughness: 0.1, transmission: 0.5 })
  };
  ctx.materials = mats;

  const createSet = (key, geo, mat, count) => {
    const mesh = new THREE.InstancedMesh(geo, mat, count);
    ctx.mainGroup.add(mesh);
    ctx.meshes[key] = mesh;

    for (let i = 0; i < count; i++) {
      // 树形分布位置
      const h = (Math.random() - 0.5) * CONFIG.treeHeight;
      const normH = (h + CONFIG.treeHeight / 2) / CONFIG.treeHeight;
      const rMax = CONFIG.maxRadius * (1 - normH);
      const r = Math.sqrt(Math.random()) * rMax; // sqrt 保证底部密度更高
      const theta = Math.random() * Math.PI * 2;
      const treePos = new THREE.Vector3(r * Math.cos(theta), h, r * Math.sin(theta));

      // 散开位置
      const scatterPos = randomSpherePoint(50 + Math.random() * 30);

      ctx.logicData[key].push({
        treePos,
        scatterPos,
        currentPos: treePos.clone(),
        scale: 0.5 + Math.random() * 0.5,
        rotSpeed: { x: (Math.random() - 0.5) * 0.02, y: (Math.random() - 0.5) * 0.02 },
        rotation: new THREE.Euler(Math.random() * Math.PI, Math.random() * Math.PI, 0)
      });

      // 初始缩放为 0（后续动画展开）
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

// 窗口大小调整
const onWindowResize = () => {
  if (!canvasRef.value) return;
  const w = canvasRef.value.clientWidth;
  const h = canvasRef.value.clientHeight;
  ctx.camera.aspect = w / h;
  ctx.camera.updateProjectionMatrix();
  ctx.renderer.setSize(w, h);
  ctx.composer.setSize(w, h);
};

// 渲染循环
const animate = () => {
  rafId = requestAnimationFrame(animate);

  if (ctx.rig) ctx.rig.update(); // 更新相机动画
  ctx.controls.update(); // 更新轨道控制器

  const isTree = currentState.value === 'tree';
  const isScatter = currentState.value === 'scatter';
  const isZoom = currentState.value === 'zoom';

  // === 主组旋转/缩放（受手势影响）===
  if (isScatter || isZoom) {
    // 手势可控制旋转速度和缩放
    ctx.mainGroup.rotation.y += 0.001 + (cameraStore.interaction.rotationFactor * 0.05);
    if (isZoom) ctx.mainGroup.rotation.y *= 0.1; // 特写时减慢旋转
    const targetScale = cameraStore.interaction.scaleFactor;
    ctx.mainGroup.scale.setScalar(ctx.mainGroup.scale.x + (targetScale - ctx.mainGroup.scale.x) * 0.1);
  } else {
    ctx.mainGroup.rotation.y += 0.002;
    ctx.mainGroup.scale.setScalar(ctx.mainGroup.scale.x + (1.0 - ctx.mainGroup.scale.x) * 0.1);
  }

  // === 特写模式：计算逆矩阵（用于将世界坐标转为局部坐标）===
  if (isZoom) {
    ctx.invMatrix.copy(ctx.mainGroup.matrixWorld).invert();
  }

  // === 更新粒子位置 ===
  const updateMeshes = (key) => {
    const mesh = ctx.meshes[key];
    const data = ctx.logicData[key];
    if (!mesh) return;

    for (let i = 0; i < data.length; i++) {
      const item = data[i];
      let target = isTree ? item.treePos : item.scatterPos;

      // 平滑插值到目标位置
      item.currentPos.lerp(target, 0.08);
      item.rotation.x += item.rotSpeed.x;
      item.rotation.y += item.rotSpeed.y;

      let s = item.scale;
      if (isZoom) s *= 0.1; // 特写时粒子缩小

      ctx.dummy.position.copy(item.currentPos);
      ctx.dummy.rotation.copy(item.rotation);
      ctx.dummy.scale.setScalar(s);
      ctx.dummy.updateMatrix();
      mesh.setMatrixAt(i, ctx.dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
  };

  ['gold', 'silver', 'gem', 'emerald'].forEach(updateMeshes);

  // === 更新照片墙 ===
  ctx.photoMeshes.forEach((group, idx) => {
    let targetPos, targetScale, lookAtCam = false;

    if (isZoom && idx === ctx.focusIndex) {
      // 聚焦：飞到相机正前方（通过逆矩阵转换）
      ctx.targetVec.set(0, 0, ctx.camera.position.z - 20).applyMatrix4(ctx.invMatrix);
      targetPos = ctx.targetVec;
      targetScale = 2.0;
      lookAtCam = true;
    } else {
      if (isZoom) {
        // 非聚焦照片在特写模式下隐藏
        targetPos = group.userData.scatterPos;
        targetScale = 0;
      } else {
        targetPos = isTree ? group.userData.treePos : group.userData.scatterPos;
        targetScale = isTree ? 0 : 1.0;
        if (isScatter) targetScale = 1.0;
      }
      lookAtCam = (isScatter || isZoom);
    }

    // 位置和缩放插值
    group.position.lerp(targetPos, 0.1);
    const currentS = group.scale.x;
    const nextS = currentS + (targetScale - currentS) * 0.1;
    group.scale.setScalar(nextS);

    // 朝向控制
    if (lookAtCam || (isZoom && idx === ctx.focusIndex)) {
      group.lookAt(ctx.camera.position);
    } else {
      group.rotation.copy(group.userData.baseRot);
    }
  });

  ctx.composer.render(); // 使用后期处理渲染
};
</script>

<style scoped>
.jewel-scene { 
  position: relative; 
  width: 100vw; 
  height: calc(100vh - 60px); /* 修改这里 */
  background: #000; 
  overflow: hidden; 
  user-select: none; 
}
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
  position: absolute; 
  top: 20px;  /* 改为 top */
  right: 20px; 
  width: 140px; 
  height: 105px;
  border-radius: 10px; 
  overflow: hidden; 
  border: 2px solid rgba(255,255,255,0.2);
  background: #000; 
  transform: scaleX(-1); 
  pointer-events: auto;
  z-index: 20; /* 确保在最上层 */
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
  background: #fffbf0; color: #4a3b2a; width: 60%; max-width: 400px; padding: 40px; border-radius: 4px; box-shadow: 0 0 30px rgba(255,215,0,0.3); text-align: center; font-family: serif;
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