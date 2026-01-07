<!-- 这是物理容器组件。它负责初始化物理世界和执行物理循环。所有需要物理效果的组件（角色、地面）都应该是它的子组件。 -->
<template>
  <TresGroup v-if="isLoaded">
    <slot />
  </TresGroup>
</template>
<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from 'vue'
import { useLoop } from '@tresjs/core'
import { useGamePhysics } from '../../composables/useGamePhysics'
import { useKeyboard } from '../../composables/useKeyboard'
const { initPhysics, stepPhysics, freePhysics, isLoaded } = useGamePhysics()
const { onBeforeRender } = useLoop()

// 每一帧更新物理世界
onBeforeRender(() => {
  stepPhysics()
})

onMounted(() => {
  initPhysics()
})

onUnmounted(() => {
  freePhysics()
})



const playerRef = ref()
const keys = useKeyboard()

// 简单的攻击测试：监听按键 J 攻击
watch(() => keys.space, (val) => {
  if (val && playerRef.value) {
    playerRef.value.triggerAttack()
  }
})
</script>
