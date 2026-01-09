<template>
  <TresPerspectiveCamera :position="[0, 15, 20]" :look-at="[0, 0, 0]" :fov="45" make-default />

  <OrbitControls ref="controlsRef" :enable-damping="true" :damping-factor="0.05" :min-distance="5" :max-distance="40"
    :max-polar-angle="Math.PI / 2 - 0.1" :enable-pan="false" />
</template>

<script setup lang="ts">
import { shallowRef } from 'vue'
import { useLoop } from '@tresjs/core'
import * as THREE from 'three'

// 🔥🔥🔥 核心修改：直接从 cientos 引入，不需要手动 extend 了 🔥🔥🔥
import { OrbitControls } from '@tresjs/cientos'

const props = defineProps<{
  target: any
}>()

const controlsRef = shallowRef()
const { onBeforeRender } = useLoop()
const targetPos = new THREE.Vector3()

onBeforeRender(() => {
  // Cientos 的 OrbitControls 组件内部也是把实例暴露在 .value.value 上
  // 但通常直接取 value 也能拿到部分属性，保险起见我们做个空值检查
  if (!controlsRef.value || !props.target || !props.target.characterGroupRef) return

  const character = props.target.characterGroupRef

  // 1. 获取人物位置
  targetPos.copy(character.position)
  targetPos.y += 2

  // 2. 更新控制器焦点
  // Cientos 的 OrbitControls 也是对 THREE.OrbitControls 的封装
  // 它的核心实例通常在 controlsRef.value.value 身上 (如果是 v-model 绑定)
  // 但作为组件 Ref，它直接暴露了底层的 object (即 Threejs 实例)
  if (controlsRef.value.value) {
    controlsRef.value.value.target.lerp(targetPos, 0.1)
    controlsRef.value.value.update()
  }
})
</script>