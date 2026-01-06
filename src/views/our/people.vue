<template>
  <div class="canvas-container">

    <div class="control-panel">


      <div class="control-item">
        <span class="label">当前角色</span>
        <el-select v-model="currentModelId" @change="handleModelChange" placeholder="请选择角色" size="default">
          <el-option v-for="m in modelList" :key="m.id" :label="m.name" :value="m.id" />
        </el-select>
      </div>

      <div class="control-item">
        <span class="label">播放动作</span>
        <el-select v-model="currentAnimation" @change="handleActionChange" placeholder="请选择动作"
          :disabled="animationList.length === 0" no-data-text="加载中或无动作" filterable size="default">
          <el-option v-for="item in animationList" :key="item.key" :label="item.label" :value="item.key" />
        </el-select>
      </div>

      <div class="status-text" v-if="animationList.length === 0">
        <small>模型加载中...</small>
      </div>
    </div>

    <TresCanvas shadows :clear-alpha="0" window-size output-color-space="srgb">

      <TresPerspectiveCamera :position="[0, 6, 16]" :look-at="[0, 4, 0]" />

      <!-- <Suspense>
        <Environment preset="city" :blur="1" background />
      </Suspense> -->
      <OrbitControls :enable-zoom="false" :enable-pan="false" />
      <TresAmbientLight :intensity="1.2" />
      <TresGroup :position="[0, 0, 0]" :rotation-y="-0.2">
        <Suspense>
          <smallpeople :key="currentModelId" :model-path="currentModelConfig.modelPath"
            :texture-path="currentModelConfig.texturePath" :scale="currentModelConfig.scale" @loaded="onModelLoaded" />

          <template #fallback>
            <TresMesh :position="[0, 2, 0]">
              <TresBoxGeometry :args="[1, 1, 1]" />
              <TresMeshStandardMaterial color="orange" wireframe />
            </TresMesh>
          </template>
        </Suspense>
      </TresGroup>

    </TresCanvas>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { TresCanvas } from '@tresjs/core'
import { Environment } from '@tresjs/cientos'
import smallpeople from "../../components/tres/smallpeople.vue"
import { OrbitControls } from '@tresjs/cientos'
import { modelList, actionNameMap } from '../../config/modelConfig'

// --- 状态管理 ---
const currentModelId = ref(modelList[0].id)
const animationList = ref<{ key: string, label: string }[]>([])
const modelActions = ref<any>(null)
const currentAnimation = ref('') // 绑定动作下拉框的值

// 计算当前配置
const currentModelConfig = computed(() => {
  return modelList.find(m => m.id === currentModelId.value) || modelList[0]
})

// --- 事件处理 ---

// 1. 切换模型
const handleModelChange = () => {
  console.log('切换模型中...')
  animationList.value = []
  modelActions.value = null
  currentAnimation.value = '' // 清空当前动作选值
}

// 2. 切换动作 (下拉框触发)
const handleActionChange = (val: string) => {
  switchAnimation(val)
}

// 3. 模型加载完毕回调
const onModelLoaded = (actionsFromChild: any) => {
  console.log('[父组件] 模型加载完毕');
  modelActions.value = actionsFromChild;

  // 生成列表
  const keys = Object.keys(actionsFromChild);
  animationList.value = keys.map(key => ({
    key: key,
    label: actionNameMap[key] || key
  })).sort();

  // 自动播放 Idle
  const idle = keys.find(k => k.includes('Idle')) || keys[0];
  if (idle) {
    switchAnimation(idle);
  }
}

// 核心动画逻辑
let lastActionName = ''
const switchAnimation = (name: string) => {
  if (!modelActions.value) return;

  const actions = modelActions.value;
  const next = actions[name];
  const prev = actions[lastActionName];

  if (next) {
    if (prev && name !== lastActionName) prev.fadeOut(0.3);
    next.reset().fadeIn(0.3).play();

    lastActionName = name;
    currentAnimation.value = name; // 关键：更新下拉框的显示
  }
}
</script>

<style scoped>
.canvas-container {
  width: 100vw;
  height: 100vh;
  position: relative;
  background: var(--bgPrimary, #ffba6c);
  /* 保持你的背景色 */
  overflow: hidden;
}

/* 统一控制面板样式 */
.control-panel {
  position: absolute;
  top: 24px;
  left: 24px;
  z-index: 200;

  /* 固定宽度，整齐 */
  background: rgba(255, 255, 255, 0.85);
  /* 半透明背景 */
  backdrop-filter: blur(10px);
  /* 磨砂玻璃效果 */
  padding: 8px;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  gap: 16px;
  transition: all 0.3s ease;
}

.control-panel:hover {
  background: rgba(255, 255, 255, 0.95);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
}

.panel-title {
  margin: 0 0 4px 0;
  font-size: 18px;
  color: #333;
  font-weight: 600;
}

.control-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.control-item .label {
  font-size: 14px;
  color: #666;
  font-weight: 500;
}

/* 强制覆盖 el-select 样式让它占满容器 */
.control-item :deep(.el-select) {
  width: 100%;
}

.status-text {
  text-align: center;
  color: #999;
  font-style: italic;
}
</style>