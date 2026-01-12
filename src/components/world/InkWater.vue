<template>
  <TresGroup>
    <TresMesh :position="[0, -5, 0]" :visible="false">
      <TresBoxGeometry :args="[props.width, 10, props.length]" />
      <TresMeshBasicMaterial color="red" />
    </TresMesh>

    <InkRipple v-for="ripple in ripples" :key="ripple.id" :id="ripple.id" :position="{ x: ripple.x, z: ripple.z }"
      @expire="removeRipple" />
  </TresGroup>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { useLoop } from '@tresjs/core'
import * as THREE from 'three'
import { useGamePhysics } from '../../composables/useGamePhysics'
// 引入刚才新建的组件
import InkRipple from './InkRipple.vue'

const props = defineProps({
  width: { type: Number, default: 100 },
  length: { type: Number, default: 100 },
  target: { type: Object, default: null } // 接收人物 Ref
})

// --- 物理初始化 (不变) ---
const { world, RAPIER } = useGamePhysics()
onMounted(() => {
  if (!world.value) return
  const groundBody = world.value.createRigidBody(RAPIER.RigidBodyDesc.fixed())
  const colliderDesc = RAPIER.ColliderDesc.cuboid(props.width / 2, 5.0, props.length / 2).setTranslation(0, -5, 0)
  world.value.createCollider(colliderDesc, groundBody)
})

// --- 波纹生成逻辑 ---
interface RippleData {
  id: number
  x: number
  z: number
}

const ripples = ref<RippleData[]>([])
const lastStepPos = new THREE.Vector3(0, -999, 0) // 上一次生成波纹的位置
const currentPos = new THREE.Vector3()
const stepThreshold = 0.8 // 步幅阈值：每走 0.8 米生成一个波纹
let uniqueIdCounter = 0

// 移除过期的波纹
const removeRipple = (id: number) => {
  ripples.value = ripples.value.filter(r => r.id !== id)
}

const { onBeforeRender } = useLoop()

onBeforeRender(() => {
  if (!props.target || !props.target.characterGroupRef) return

  // 1. 获取当前人物位置
  const charGroup = props.target.characterGroupRef
  currentPos.copy(charGroup.position)

  // 2. 初始化：如果是第一次运行，先记录位置
  if (lastStepPos.y === -999) {
    lastStepPos.copy(currentPos)
    return
  }

  // 3. 计算与上一次波纹点的距离
  // 这里忽略 Y 轴，只看水平移动距离
  const distSq = (currentPos.x - lastStepPos.x) ** 2 + (currentPos.z - lastStepPos.z) ** 2

  // 4. 判断是否该生成新波纹
  if (distSq > stepThreshold * stepThreshold) {
    // 生成波纹
    ripples.value.push({
      id: uniqueIdCounter++,
      x: currentPos.x,
      z: currentPos.z
    })

    // 更新"上一次位置"
    lastStepPos.copy(currentPos)
  }
})
</script>