<script setup lang="ts">
import { useTres, useLoop } from '@tresjs/core'
import * as THREE from 'three'

const props = defineProps<{
  target: any // 接收人物的 Ref
}>()

const { camera } = useTres()
const { onBeforeRender } = useLoop()

// 配置参数
const offset = new THREE.Vector3(0, 8, 12)
const lookAtOffset = new THREE.Vector3(0, 2, 0)
const smoothSpeed = 5

// 临时变量
const targetPos = new THREE.Vector3()
const desiredPos = new THREE.Vector3()
const lookTarget = new THREE.Vector3()

onBeforeRender(({ delta }) => {
  // 1. 基础检查：如果没有相机或没有目标对象，直接等待，不报错
  if (!camera.value || !props.target) return


  const character = props.target.characterGroupRef

  if (!character || !character.position) {
    // 还没准备好，静默等待...
    return
  }



  // 获取人物位置
  targetPos.copy(character.position)

  // 计算相机目标位置
  desiredPos.copy(targetPos).add(offset)

  // 平滑移动
  camera.value.position.lerp(desiredPos, delta * smoothSpeed)

  // 始终注视人物
  lookTarget.copy(targetPos).add(lookAtOffset)
  camera.value.lookAt(lookTarget)
})
</script>

<template>
  <slot />
</template>