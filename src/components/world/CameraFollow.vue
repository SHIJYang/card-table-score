<template>
  <OrbitControls ref="controlsRef" make-default :enable-damping="true" :damping-factor="0.05" :min-distance="5"
    :max-distance="25" :max-polar-angle="Math.PI / 2 - 0.1" :enable-pan="false" />
</template>

<script setup lang="ts">
import { shallowRef } from 'vue'
import { useLoop } from '@tresjs/core'
import { OrbitControls } from '@tresjs/cientos' // 确保安装了 @tresjs/cientos
import * as THREE from 'three'

const props = defineProps<{
  target: any // 接收人物组件的 Ref
}>()

// 获取控制器实例引用
const controlsRef = shallowRef()
const { onBeforeRender } = useLoop()

// 临时变量，避免在循环中重复创建对象导致 GC
const targetPos = new THREE.Vector3()

onBeforeRender(() => {
  // 1. 安全检查
  if (!controlsRef.value || !props.target || !props.target.characterGroupRef) return

  const character = props.target.characterGroupRef

  // 2. 获取人物当前坐标
  targetPos.copy(character.position)

  // 3. 调整高度偏移 (LookAt Offset)
  // 我们不希望相机盯着人物的脚底板看，而是盯着胸口或头部
  targetPos.y += 2.0

  // 4. 核心逻辑：更新控制器的焦点 (Target)
  // 只要修改了 target，OrbitControls 就会自动计算相机应该在哪里
  // 它会保持你刚才手动旋转后的角度和距离，只是把中心点平移到了新的人物位置

  // controlsRef.value.value 是底层的 ThreeJS OrbitControls 实例
  if (controlsRef.value.value) {
    // 平滑插值：让焦点慢慢追上人物，而不是生硬地瞬移 (可选)
    // 如果想要完全紧跟，直接 copy 即可： controlsRef.value.value.target.copy(targetPos)
    controlsRef.value.value.target.lerp(targetPos, 0.2)

    // 必须调用 update() 才能生效（如果开启了 damping）
    controlsRef.value.value.update()
  }
})
</script>