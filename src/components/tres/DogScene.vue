<template>
  <TresGroup ref="groupRef">

    <TresGroup ref="headRef" :position="[0, 0.6, 0.3]" @click.stop="triggerEarWiggle" @pointer-enter="onPointerEnter"
      @pointer-leave="onPointerLeave">
      <TresMesh>
        <TresSphereGeometry :args="[0.8, 32, 32]" />
        <TresMeshToonMaterial :color="dogConfig.color" />
      </TresMesh>
      <TresMesh>
        <TresSphereGeometry :args="[0.8 * dogConfig.outlineWidth, 32, 32]" />
        <TresMeshBasicMaterial :color="dogConfig.outlineColor" :side="THREE.BackSide" />
      </TresMesh>

      <TresGroup ref="leftEarRef" :position="[-0.6, 0.5, 0]" :rotation-z="0.5">
        <TresMesh>
          <TresSphereGeometry :args="[0.35, 32, 32]" />
          <TresMeshToonMaterial :color="dogConfig.color" />
        </TresMesh>
        <TresMesh>
          <TresSphereGeometry :args="[0.35 * dogConfig.outlineWidth, 32, 32]" />
          <TresMeshBasicMaterial :color="dogConfig.outlineColor" :side="THREE.BackSide" />
        </TresMesh>
      </TresGroup>

      <TresGroup ref="rightEarRef" :position="[0.6, 0.5, 0]" :rotation-z="-0.5">
        <TresMesh>
          <TresSphereGeometry :args="[0.35, 32, 32]" />
          <TresMeshToonMaterial :color="dogConfig.color" />
        </TresMesh>
        <TresMesh>
          <TresSphereGeometry :args="[0.35 * dogConfig.outlineWidth, 32, 32]" />
          <TresMeshBasicMaterial :color="dogConfig.outlineColor" :side="THREE.BackSide" />
        </TresMesh>
      </TresGroup>

      <TresMesh :position="[-0.25, 0.1, 0.75]">
        <TresSphereGeometry :args="[0.08, 16, 16]" />
        <TresMeshBasicMaterial color="black" />
      </TresMesh>
      <TresMesh :position="[0.25, 0.1, 0.75]">
        <TresSphereGeometry :args="[0.08, 16, 16]" />
        <TresMeshBasicMaterial color="black" />
      </TresMesh>
      <TresMesh :position="[0, 0, 0.8]">
        <TresSphereGeometry :args="[0.05, 16, 16]" />
        <TresMeshBasicMaterial color="black" />
      </TresMesh>

      <TresMesh :position="[-0.4, -0.1, 0.65]" :scale-z="0.5">
        <TresSphereGeometry :args="[0.08, 16, 16]" />
        <TresMeshBasicMaterial color="#ffb6c1" :transparent="true" :opacity="0.6" />
      </TresMesh>
      <TresMesh :position="[0.4, -0.1, 0.65]" :scale-z="0.5">
        <TresSphereGeometry :args="[0.08, 16, 16]" />
        <TresMeshBasicMaterial color="#ffb6c1" :transparent="true" :opacity="0.6" />
      </TresMesh>
    </TresGroup>

    <TresGroup :position="[0, -0.5, -0.2]" @click.stop="triggerJump" @pointer-enter="onPointerEnter"
      @pointer-leave="onPointerLeave">
      <TresMesh :scale="[0.9, 0.8, 1.3]">
        <TresSphereGeometry :args="[0.7, 32, 32]" />
        <TresMeshToonMaterial :color="dogConfig.color" />
      </TresMesh>
      <TresMesh :scale="[0.9, 0.8, 1.3]">
        <TresSphereGeometry :args="[0.7 * dogConfig.outlineWidth, 32, 32]" />
        <TresMeshBasicMaterial :color="dogConfig.outlineColor" :side="THREE.BackSide" />
      </TresMesh>
    </TresGroup>

    <TresGroup ref="tailRef" :position="[0, -0.2, -1.0]" @click.stop="triggerSpin" @pointer-enter="onPointerEnter"
      @pointer-leave="onPointerLeave">
      <TresGroup :rotation-x="-0.5">
        <TresMesh :position="[0, 0.3, 0]">
          <TresSphereGeometry :args="[0.2, 32, 32]" />
          <TresMeshToonMaterial :color="dogConfig.color" />
        </TresMesh>
        <TresMesh :position="[0, 0.3, 0]">
          <TresSphereGeometry :args="[0.2 * dogConfig.outlineWidth, 32, 32]" />
          <TresMeshBasicMaterial :color="dogConfig.outlineColor" :side="THREE.BackSide" />
        </TresMesh>
      </TresGroup>
    </TresGroup>

    <TresGroup :position="[-0.4, -1.1, 0.2]" @click.stop="triggerSpin">
      <TresMesh :scale-y="1.2">
        <TresSphereGeometry :args="[0.18, 32, 32]" />
        <TresMeshToonMaterial :color="dogConfig.color" />
      </TresMesh>
      <TresMesh :scale-y="1.2">
        <TresSphereGeometry :args="[0.18 * dogConfig.outlineWidth, 32, 32]" />
        <TresMeshBasicMaterial :color="dogConfig.outlineColor" :side="THREE.BackSide" />
      </TresMesh>
    </TresGroup>

    <TresGroup :position="[0.4, -1.1, 0.2]" @click.stop="triggerSpin">
      <TresMesh :scale-y="1.2">
        <TresSphereGeometry :args="[0.18, 32, 32]" />
        <TresMeshToonMaterial :color="dogConfig.color" />
      </TresMesh>
      <TresMesh :scale-y="1.2">
        <TresSphereGeometry :args="[0.18 * dogConfig.outlineWidth, 32, 32]" />
        <TresMeshBasicMaterial :color="dogConfig.outlineColor" :side="THREE.BackSide" />
      </TresMesh>
    </TresGroup>

    <TresGroup :position="[-0.45, -1.1, -0.7]" @click.stop="triggerSpin">
      <TresMesh :scale-y="1.2">
        <TresSphereGeometry :args="[0.2, 32, 32]" />
        <TresMeshToonMaterial :color="dogConfig.color" />
      </TresMesh>
      <TresMesh :scale-y="1.2">
        <TresSphereGeometry :args="[0.2 * dogConfig.outlineWidth, 32, 32]" />
        <TresMeshBasicMaterial :color="dogConfig.outlineColor" :side="THREE.BackSide" />
      </TresMesh>
    </TresGroup>

    <TresGroup :position="[0.45, -1.1, -0.7]" @click.stop="triggerSpin">
      <TresMesh :scale-y="1.2">
        <TresSphereGeometry :args="[0.2, 32, 32]" />
        <TresMeshToonMaterial :color="dogConfig.color" />
      </TresMesh>
      <TresMesh :scale-y="1.2">
        <TresSphereGeometry :args="[0.2 * dogConfig.outlineWidth, 32, 32]" />
        <TresMeshBasicMaterial :color="dogConfig.outlineColor" :side="THREE.BackSide" />
      </TresMesh>
    </TresGroup>

  </TresGroup>
</template>

<script setup>
import { shallowRef, ref } from 'vue'
import { useLoop } from '@tresjs/core'
import * as THREE from 'three'


// 接收外部传入的颜色 props
const props = defineProps({
  color: {
    type: String,
    default: '#ffffff'
  }
})

// 配置项：由于 color 可能会变，这里使用 getter 或者直接用 props
const dogConfig = {
  get color() { return props.color }, // 动态获取 props 颜色
  outlineColor: '#000000',
  outlineWidth: 1.04,
}

// ==========================================
// 1. 绑定实例 Refs
// ==========================================
const groupRef = shallowRef(null)    // 全身
const headRef = shallowRef(null)     // 头部
const tailRef = shallowRef(null)     // 尾巴
const leftEarRef = shallowRef(null)  // 左耳 (新增)
const rightEarRef = shallowRef(null) // 右耳 (新增)

// ==========================================
// 2. 交互状态管理
// ==========================================
const isJumping = ref(false)   // 是否正在跳跃
const jumpStartTime = ref(0)   // 跳跃开始时间

const isSpinning = ref(false)  // 是否正在旋转
const spinStartTime = ref(0)   // 旋转开始时间

const isWiggling = ref(false)  // 是否正在抖耳朵
const wiggleStartTime = ref(0) // 抖动开始时间

// ==========================================
// 3. 事件处理函数
// ==========================================

// 鼠标移入：改变光标样式
const onPointerEnter = () => {
  document.body.style.cursor = 'pointer'
}
// 鼠标移出：恢复光标
const onPointerLeave = () => {
  document.body.style.cursor = 'auto'
}

// 动作 1: 触发跳跃
const triggerJump = () => {
  if (isJumping.value) return // 防止连点
  isJumping.value = true
  // 我们不需要在这里获取时间，在 render loop 里获取 elapsed 即可，
  // 但为了简单控制持续时间，我们记录当前 loop 的时间点会更复杂，
  // 这里简化处理：用一个简单的计时器重置状态
  setTimeout(() => { isJumping.value = false }, 1000) // 1秒后结束跳跃
}

// 动作 2: 触发旋转 (追尾巴)
const triggerSpin = () => {
  if (isSpinning.value) return
  isSpinning.value = true
  setTimeout(() => { isSpinning.value = false }, 1500) // 1.5秒后结束旋转
}

// 动作 3: 触发耳朵抖动
const triggerEarWiggle = () => {
  if (isWiggling.value) return
  isWiggling.value = true
  setTimeout(() => { isWiggling.value = false }, 800) // 0.8秒后结束
}

// ==========================================
// 4. 动画主循环
// ==========================================
const { onBeforeRender } = useLoop()

onBeforeRender(({ elapsed }) => {
  // 安全检查：确保所有组件都已渲染
  if (!groupRef.value || !headRef.value || !tailRef.value || !leftEarRef.value || !rightEarRef.value) return

  // --- [基础状态: 呼吸与悬浮] ---
  const breath = 1 + Math.sin(elapsed * 3) * 0.005

  // 基础悬浮 Y 轴位置
  let posY = Math.sin(elapsed * 2) * 0.05

  // 基础头部摆动
  let headRotZ = Math.sin(elapsed * 2) * 0.05
  let headRotY = Math.sin(elapsed * 1.5) * 0.05

  // 基础尾巴摆动 (正常速度)
  let tailSpeed = 12
  let tailAmp = 0.6

  // --- [动作叠加: 跳跃] ---
  if (isJumping.value) {
    // 使用绝对值 sin 制造跳跃感 (弹跳速度加快)
    // elapsed * 10 产生快速波形，Math.abs 让波形全在 0 以上
    const jumpHeight = Math.abs(Math.sin(elapsed * 10)) * 0.5
    posY += jumpHeight // 在基础悬浮上叠加跳跃高度

    // 跳跃时稍微拉伸身体
    groupRef.value.scale.set(breath, breath, breath)
  } else {
    groupRef.value.scale.set(breath, breath, breath)
  }

  // --- [动作叠加: 旋转] ---
  if (isSpinning.value) {
    // 快速自转
    groupRef.value.rotation.y -= 0.1
    // 旋转时尾巴摇得更快
    tailSpeed = 5
    tailAmp = 1.0
  } else {
    // === 修复后的复位逻辑 ===

    // 1. 角度标准化：利用取余 (%) 把比如 -1000 的角度变成 -3.14 到 3.14 之间
    // 这样小狗就不需要“倒车”转几十圈才能回去，而是走最近的路
    let r = groupRef.value.rotation.y % (Math.PI * 2)

    // 2. 确保走“最近路径”
    // 如果角度超过 180度 (PI)，就让它算作负的 (比如 270度 = -90度)
    if (r > Math.PI) r -= Math.PI * 2
    else if (r < -Math.PI) r += Math.PI * 2

    // 3. 更新当前角度为标准化后的角度 (视觉上看不出变化，因为 360度 = 0度)
    groupRef.value.rotation.y = r

    // 4. 使用 Lerp (线性插值) 平滑归零
    // 参数说明: (当前值, 目标值0, 速度0.1)
    // 0.1 代表每帧移动 10% 的距离，数值越大回正越快
    groupRef.value.rotation.y = THREE.MathUtils.lerp(r, 0, 0.1)
  }

  // --- [动作叠加: 抖耳朵] ---
  if (isWiggling.value) {
    // 快速高频摆动
    const wiggle = Math.sin(elapsed * 30) * 0.2
    leftEarRef.value.rotation.z = 0.5 + wiggle  // 初始角度 + 抖动
    rightEarRef.value.rotation.z = -0.5 - wiggle

    // 抖耳朵时头也会跟着一点点晃
    headRotZ += wiggle * 0.2
  } else {
    // 复位耳朵
    leftEarRef.value.rotation.z = 0.5
    rightEarRef.value.rotation.z = -0.5
  }

  // --- [应用最终计算结果] ---

  // 应用位置 (基础悬浮 + 跳跃)
  groupRef.value.position.y = posY

  // 应用头部旋转
  headRef.value.rotation.z = headRotZ
  headRef.value.rotation.y = headRotY

  // 应用尾巴动画 (正常或加速)
  tailRef.value.rotation.z = Math.cos(elapsed * tailSpeed) * tailAmp
})
</script>