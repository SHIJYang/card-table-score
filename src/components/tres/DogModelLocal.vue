<template>
  <TresGroup ref="modelGroup">
    <primitive v-if="state" :object="state.scene" />
  </TresGroup>
</template>

<script setup lang="ts">
import { shallowRef, watch } from 'vue'
import { useGLTF, useAnimations } from '@tresjs/cientos'
import { Group } from 'three'

const path = '/models/skeleton/scene.gltf'


// 1. 必须解构出 animations
const { state } = useGLTF(path, { draco: true })

const currentAction = ref()
console.log('可用动画列表1:', state)
// console.log('可用动画列表3:', animations)
console.log('可用动画列表4:', state.animations)



watch(state, (newActions) => {
  console.log('加载完成了！', newActions)
  console.log('动画列表:', newActions.animations)

  // 在这里初始化动画

  const animations = computed(() => state.value?.animations || [])
  const model = computed(() => state?.value?.scene)
  const { actions } = useAnimations(animations, model)




})






</script>