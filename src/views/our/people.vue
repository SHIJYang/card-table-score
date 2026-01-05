<template>
  <div class="canvas-container">

    <div class="model-selector">
      <label>选择角色：</label>
      <select v-model="currentModelId" @change="handleModelChange">
        <option v-for="m in modelList" :key="m.id" :value="m.id">
          {{ m.name }}
        </option>
      </select>
    </div>

    <div class="action-panel">
      <h3>动作列表 ({{ animationList.length }})</h3>
      <div class="scroll-area">
        <button v-for="item in animationList" :key="item.key" :class="{ active: currentAnimation === item.key }"
          @click="switchAnimation(item.key)">
          {{ item.label }}
        </button>
      </div>
    </div>

    <TresCanvas shadows :clear-alpha="0" window-size output-color-space="srgb">
      <TresPerspectiveCamera :position="[0, 5, 12]" :look-at="[0, 2, 0]" />
      <Suspense>
        <Environment preset="city" :blur="1" background />
      </Suspense>

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

// 引入我们新建的配置文件
import { modelList, actionNameMap } from '../../config/modelConfig'

// --- 状态管理 ---
const currentModelId = ref(modelList[0].id) // 默认选中第一个
const animationList = ref<{ key: string, label: string }[]>([])
const modelActions = ref<any>(null)
const currentAnimation = ref('')

// 计算当前选中的配置对象
const currentModelConfig = computed(() => {
  return modelList.find(m => m.id === currentModelId.value) || modelList[0]
})

// --- 事件处理 ---

const handleModelChange = () => {
  console.log('切换模型中...')
  // 清空动作列表，防止残留
  animationList.value = []
  modelActions.value = null
}

const onModelLoaded = (actionsFromChild: any) => {
  console.log('[父组件] 模型加载完毕，处理动作列表...');
  modelActions.value = actionsFromChild;

  // 1. 生成动作列表 (带翻译)
  const keys = Object.keys(actionsFromChild);
  animationList.value = keys.map(key => ({
    key: key,
    label: actionNameMap[key] || key // 查字典，查不到显示原名
  })).sort();

  // 2. 自动播放第一个动作 (通常是 Idle)
  const idle = keys.find(k => k.includes('Idle')) || keys[0];
  if (idle) switchAnimation(idle);
}

// 动画播放逻辑
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
    currentAnimation.value = name;
  }
}
</script>

<style scoped>
.canvas-container {
  width: 100vw;
  height: 100vh;
  position: relative;
  background: #ffba6c;
}

/* 左上角下拉框 */
.model-selector {
  position: absolute;
  top: 20px;
  left: 20px;
  z-index: 200;
  background: white;
  padding: 10px;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

/* 右侧面板 */
.action-panel {
  position: absolute;
  top: 20px;
  right: 20px;
  z-index: 200;
  width: 120px;
  max-height: 80vh;
  background: rgba(255, 255, 255, 0.9);
  padding: 10px;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
}

.scroll-area {
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.scroll-area button {
  padding: 8px;
  border: 1px solid #ddd;
  background: #fff;
  cursor: pointer;
  text-align: left;
  border-radius: 4px;
}

.scroll-area button.active {
  background: #409eff;
  color: white;
  border-color: #409eff;
}
</style>