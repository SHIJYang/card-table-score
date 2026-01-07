<template>
  <TresGroup>
    <TresPerspectiveCamera ref="cameraRef" :position="[0, 0, 120]" :fov="50" :near="0.1" :far="1000" />

    <OrbitControls ref="controlsRef" :enable-damping="true" :auto-rotate="autoRotate"
      :auto-rotate-speed="rotateSpeed" />

    <TresAmbientLight :intensity="0.2" />
    <TresSpotLight :position="[50, 100, 50]" :intensity="100" color="#ffddaa" />
    <Environment preset="sunset" :blur="0.06" background="true" />

    <Suspense>
      <EffectComposerPmndrs>
        <BloomPmndrs ref="bloomRef" :luminance-threshold="0.4" :luminance-smoothing="0.85" :intensity="1.5"
          :radius="0.4" :mipmap-blur="true" />
      </EffectComposerPmndrs>
    </Suspense>

    <TresGroup>
      <TresInstancedMesh ref="goldRef" :args="[null, null, CONFIG.counts.gold]">
        <TresSphereGeometry :args="[0.6, 16, 16]" />
        <TresMeshPhysicalMaterial :color="CONFIG.colors.gold" :metalness="1.0" :roughness="0.1" />
      </TresInstancedMesh>

      <TresInstancedMesh ref="silverRef" :args="[null, null, CONFIG.counts.silver]">
        <TresBoxGeometry :args="[0.8, 0.8, 0.8]" />
        <TresMeshPhysicalMaterial :color="CONFIG.colors.silver" :metalness="0.9" :roughness="0.2" />
      </TresInstancedMesh>

      <TresInstancedMesh ref="gemRef" :args="[null, null, CONFIG.counts.gem]">
        <TresOctahedronGeometry :args="[0.7, 0]" />
        <TresMeshPhysicalMaterial :color="CONFIG.colors.gem" :metalness="0.1" :roughness="0" :transmission="0.6"
          :thickness="1" />
      </TresInstancedMesh>

      <TresInstancedMesh ref="emeraldRef" :args="[null, null, CONFIG.counts.emerald]">
        <TresConeGeometry :args="[0.5, 1.0, 6]" />
        <TresMeshPhysicalMaterial :color="CONFIG.colors.emerald" :metalness="0.2" :roughness="0.1"
          :transmission="0.5" />
      </TresInstancedMesh>

      <TresGroup v-if="photoDataList.length > 0">
        <TresMesh v-for="(photo, index) in photoDataList" :key="photo.id" :ref="(el) => setPhotoRef(el, index)"
          :position="photo.pos" :rotation="photo.rot" :scale="[1, 1, 1]">
          <TresPlaneGeometry :args="[photo.w, photo.h]" />
          <TresMeshBasicMaterial :map="photo.texture" :side="THREE.DoubleSide" />
          <TresMesh :position="[0, 0, -0.05]">
            <TresBoxGeometry :args="[photo.w + 0.2, photo.h + 0.2, 0.05]" />
            <TresMeshStandardMaterial color="#ffd700" :roughness="0.2" />
          </TresMesh>
        </TresMesh>
      </TresGroup>
    </TresGroup>
  </TresGroup>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount, shallowRef } from 'vue';
import { useLoop } from '@tresjs/core';
import { OrbitControls, Environment } from '@tresjs/cientos';
// 修正导入：使用 Pmndrs 后缀的组件
import { EffectComposerPmndrs, BloomPmndrs } from '@tresjs/post-processing';
import { storeToRefs } from 'pinia';
import { useImageStore, useCameraStore } from '@/store';
import * as THREE from 'three';

// ========== 1. CameraRig Logic (Pure JS Class) ==========
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
  }

  update() {
    if (!this.isAnimating) return;
    const now = performance.now();
    let progress = (now - this.startTime) / this.duration;
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

// ========== 2. Setup & Refs ==========
const CONFIG = {
  treeHeight: 80, maxRadius: 35,
  counts: { gold: 600, silver: 600, gem: 400, emerald: 400 },
  colors: { gold: 0xffaa00, silver: 0xeeeeee, gem: 0xff0044, emerald: 0x00ff88 }
};
const STATE_KEYS = { TREE: 'tree', SCATTER: 'scatter', ZOOM: 'zoom' };

// Stores
const imageStore = useImageStore();
const { imageList } = storeToRefs(imageStore);
const cameraStore = useCameraStore();

// Tres Refs
const cameraRef = shallowRef(null);
const controlsRef = shallowRef(null);
const bloomRef = shallowRef(null);
const goldRef = shallowRef(null);
const silverRef = shallowRef(null);
const gemRef = shallowRef(null);
const emeraldRef = shallowRef(null);

// State
const currentState = ref(STATE_KEYS.TREE);
const autoRotate = ref(true);
const rotateSpeed = ref(2.0);
const photoDataList = ref([]);
const photoMeshRefs = [];

// Logic Data
const logicData = { gold: [], silver: [], gem: [], emerald: [] };
const dummy = new THREE.Object3D();
const textureLoader = new THREE.TextureLoader();
textureLoader.crossOrigin = 'Anonymous';

let rig = null;
let zoomTargetIndex = -1;

// ========== 3. Initialization ==========
const randomSpherePoint = (r) => {
  const u = Math.random(), v = Math.random();
  const theta = 2 * Math.PI * u, phi = Math.acos(2 * v - 1);
  return new THREE.Vector3(r * Math.sin(phi) * Math.cos(theta), r * Math.sin(phi) * Math.sin(theta), r * Math.cos(phi));
};

const initLogicData = (key, count) => {
  logicData[key] = [];
  for (let i = 0; i < count; i++) {
    const h = (Math.random() - 0.5) * CONFIG.treeHeight;
    const normH = (h + CONFIG.treeHeight / 2) / CONFIG.treeHeight;
    const rMax = CONFIG.maxRadius * (1 - normH);
    const r = Math.sqrt(Math.random()) * rMax;
    const theta = Math.random() * Math.PI * 2;
    const treePos = new THREE.Vector3(r * Math.cos(theta), h, r * Math.sin(theta));
    logicData[key].push({
      treePos,
      scatterPos: randomSpherePoint(50 + Math.random() * 30),
      currentPos: treePos.clone(),
      scale: 0.5 + Math.random() * 0.5,
      rotSpeed: { x: (Math.random() - 0.5) * 0.02, y: (Math.random() - 0.5) * 0.02 },
      rotation: new THREE.Euler(Math.random() * Math.PI, Math.random() * Math.PI, 0)
    });
  }
};

onMounted(() => {
  initLogicData('gold', CONFIG.counts.gold);
  initLogicData('silver', CONFIG.counts.silver);
  initLogicData('gem', CONFIG.counts.gem);
  initLogicData('emerald', CONFIG.counts.emerald);
  if (imageStore.fetchImages) imageStore.fetchImages();
});

// ========== 4. Photo Logic ==========
const loadedKeys = new Set();
const convertToProxyUrl = (url) => url && url.includes('free.picui.cn') ? url.replace('https://free.picui.cn', '/picui-proxy') : url;

const addPhoto = (url, key) => {
  if (loadedKeys.has(key)) return;
  const proxyUrl = convertToProxyUrl(url);
  textureLoader.load(proxyUrl, (tex) => {
    tex.colorSpace = THREE.SRGBColorSpace;
    loadedKeys.add(key);
    const img = tex.image;
    const ratio = img.width / img.height;
    const w = ratio >= 1 ? 4 : 4 * ratio;
    const h = ratio >= 1 ? 4 / ratio : 4;

    const h_pos = (Math.random() - 0.5) * CONFIG.treeHeight;
    const normH = (h_pos + CONFIG.treeHeight / 2) / CONFIG.treeHeight;
    const r = CONFIG.maxRadius * (1 - normH) * (1.1 + 0.3 * Math.random());
    const theta = Math.random() * Math.PI * 2;
    const treePos = new THREE.Vector3(r * Math.cos(theta), h_pos, r * Math.sin(theta));

    photoDataList.value.push({
      id: key, texture: tex, w, h,
      userData: {
        treePos: treePos,
        scatterPos: randomSpherePoint(60),
        baseRot: new THREE.Euler(0, Math.random() * Math.PI, 0)
      },
      pos: treePos.clone(),
      rot: new THREE.Euler(0, 0, 0)
    });
  });
};

watch(imageList, (newImages) => {
  newImages?.forEach(img => {
    const url = img.links?.url || img.url;
    const key = img.key || img.id;
    if (url && key) addPhoto(url, key);
  });
}, { deep: true, immediate: true });

const setPhotoRef = (el, index) => { if (el) photoMeshRefs[index] = el; };

// ========== 5. Interaction Logic ==========
const handleModeChange = (modeKey) => {
  if (!rig && cameraRef.value && controlsRef.value) {
    const ctrlInstance = controlsRef.value.instance || controlsRef.value;
    rig = new CameraRig(cameraRef.value, ctrlInstance);
  }
  if (currentState.value === modeKey && modeKey !== STATE_KEYS.ZOOM) return;

  if (modeKey === STATE_KEYS.ZOOM) {
    if (currentState.value !== STATE_KEYS.ZOOM) triggerZoom();
    return;
  }

  currentState.value = modeKey;
  if (rig) rig.isAnimating = false;
  const overviewPos = new THREE.Vector3(0, 0, 130);
  const centerTarget = new THREE.Vector3(0, 0, 0);

  if (modeKey === STATE_KEYS.TREE) {
    rig?.flyTo(overviewPos, centerTarget, 1500, () => { autoRotate.value = true; });
  } else if (modeKey === STATE_KEYS.SCATTER) {
    autoRotate.value = false;
    zoomTargetIndex = -1;
    rig?.flyTo(overviewPos, centerTarget, 1200);
  }
};

const triggerZoom = () => {
  if (photoMeshRefs.length === 0 || !cameraRef.value) return;
  currentState.value = STATE_KEYS.ZOOM;
  const camPos = cameraRef.value.position;
  let bestIdx = 0, minDist = Infinity;
  photoMeshRefs.forEach((mesh, idx) => {
    if (!mesh) return;
    const worldPos = new THREE.Vector3();
    mesh.getWorldPosition(worldPos);
    const dist = worldPos.distanceTo(camPos);
    if (dist < minDist) { minDist = dist; bestIdx = idx; }
  });
  zoomTargetIndex = bestIdx;
  const targetMesh = photoMeshRefs[bestIdx];
  const targetWorldPos = new THREE.Vector3();
  targetMesh.getWorldPosition(targetWorldPos);
  const vecFromCenter = targetWorldPos.clone().normalize();
  const targetCamPos = targetWorldPos.clone().add(vecFromCenter.multiplyScalar(20));
  rig?.flyTo(targetCamPos, targetWorldPos, 1000, () => {
    targetMesh.lookAt(cameraRef.value.position);
  });
};

watch(() => cameraStore.actionTrigger, (val) => {
  if (val?.type) handleModeChange(val.type);
});

// ========== 6. Render Loop (V5 Syntax) ==========
const { onBeforeRender } = useLoop();

onBeforeRender(({ delta, elapsed }) => {
  // A. CameraRig
  if (rig) rig.update();

  // B. Gestures: Rotate
  if (currentState.value === STATE_KEYS.SCATTER) {
    if (cameraStore.rotationFactor !== 0) {
      autoRotate.value = true;
      rotateSpeed.value = cameraStore.rotationFactor * 4.0;
    } else {
      rotateSpeed.value = 0;
    }
  }

  // C. Gestures: Vertical
  if (cameraRef.value && controlsRef.value && (!rig || !rig.isAnimating) && cameraStore.verticalFactor !== 0) {
    const cam = cameraRef.value;
    const ctrl = controlsRef.value.instance || controlsRef.value;
    if (ctrl && ctrl.target) {
      const newY = THREE.MathUtils.clamp(cam.position.y + cameraStore.verticalFactor * 2.0, -50, 150);
      cam.position.y = newY;
      cam.lookAt(ctrl.target);
    }
  }

  // D. Bloom Animation
  if (bloomRef.value) {
    const targetStrength = cameraStore.isMagicMode ? 4.5 : 1.5;
    const targetRadius = cameraStore.isMagicMode ? 1.0 : 0.4;

    // 兼容性检查：
    // BloomPmndrs 可能暴露 .pass，也可能直接暴露效果实例 (blendMode, intensity等)
    // 我们检查 value 是否有 intensity 属性，或者 value.pass 有
    const bloomObj = bloomRef.value.pass || bloomRef.value;

    if (bloomObj) {
      // 注意：pmndrs bloom 的 intensity 属性可能叫 'intensity' 或 'luminanceSmoothing' 等
      // 按照标准 BloomEffect，它是 intensity
      if (bloomObj.intensity !== undefined) {
        bloomObj.intensity = THREE.MathUtils.lerp(bloomObj.intensity, targetStrength, 0.1);
      }
      // 某些 Bloom 实现没有 radius 属性 (Kernel size 替代)，如果有则 lerp
      if (bloomObj.radius !== undefined) {
        // bloomObj.radius = THREE.MathUtils.lerp(bloomObj.radius, targetRadius, 0.1);
      }
    }
  }

  // E. Instances Animation
  const isTree = currentState.value === STATE_KEYS.TREE;
  const isZoom = currentState.value === STATE_KEYS.ZOOM;

  const updateInstances = (meshRef, data) => {
    if (!meshRef.value) return;
    const mesh = meshRef.value;
    let needsUpdate = false;
    for (let i = 0; i < data.length; i++) {
      const item = data[i];
      let target = isTree ? item.treePos : item.scatterPos;
      item.currentPos.lerp(target, 0.08);
      item.rotation.x += item.rotSpeed.x;
      item.rotation.y += item.rotSpeed.y;
      let s = item.scale;
      if (isZoom) s *= 0.1;
      dummy.position.copy(item.currentPos);
      dummy.rotation.copy(item.rotation);
      dummy.scale.setScalar(s);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
      needsUpdate = true;
    }
    if (needsUpdate) mesh.instanceMatrix.needsUpdate = true;
  };

  updateInstances(goldRef, logicData.gold);
  updateInstances(silverRef, logicData.silver);
  updateInstances(gemRef, logicData.gem);
  updateInstances(emeraldRef, logicData.emerald);

  // F. Photo Animation
  photoMeshRefs.forEach((mesh, idx) => {
    if (!mesh) return;
    const data = photoDataList.value[idx];
    if (!data) return;
    if (rig && rig.isAnimating && idx === zoomTargetIndex) {
      if (cameraRef.value) mesh.lookAt(cameraRef.value.position);
      return;
    }
    let targetPos, targetScale = 2.5;
    if (isZoom && idx === zoomTargetIndex) {
      targetPos = isTree ? data.userData.treePos : data.userData.scatterPos;
      targetScale = 4.0;
      if (cameraRef.value) mesh.lookAt(cameraRef.value.position);
    } else {
      targetPos = isTree ? data.userData.treePos : data.userData.scatterPos;
      targetScale = isTree ? 1.0 : 2.5;
      if (isTree) {
        mesh.rotation.copy(data.userData.baseRot);
        mesh.rotation.y += 0.005;
      } else {
        if (cameraRef.value) mesh.lookAt(cameraRef.value.position);
      }
      mesh.position.lerp(targetPos, 0.08);
    }
    if (isZoom && idx !== zoomTargetIndex) targetScale *= 0.2;
    const s = THREE.MathUtils.lerp(mesh.scale.x, targetScale, 0.08);
    mesh.scale.setScalar(s);
  });
});
</script>