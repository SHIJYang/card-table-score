<!-- 这是地面组件。它只负责创建地面的视觉模型和静态物理碰撞体 -->
<template>
  <TresMesh :position="[0, -5, 0]" receive-shadow>
    <TresBoxGeometry :args="[props.width, 10, props.length]" />
    <TresMeshStandardMaterial :color="color" :opacity="0.5" transparent />
  </TresMesh>
</template>
<script setup lang="ts">
import { onMounted } from 'vue'
import { useGamePhysics } from '../../composables/useGamePhysics'

// Props 允许你以后传入不同的地面大小
const props = defineProps({
  width: { type: Number, default: 100 },
  length: { type: Number, default: 100 },
  color: { type: String, default: '#44aa44' }
})

const { world, RAPIER } = useGamePhysics()

onMounted(() => {
  if (!world.value) return

  // 创建刚体 (Fixed = 静态)
  const groundBodyDesc = RAPIER.RigidBodyDesc.fixed()
  const groundBody = world.value.createRigidBody(groundBodyDesc)

  // 创建碰撞体 (Cuboid 参数是半长)
  const colliderDesc = RAPIER.ColliderDesc.cuboid(props.width / 2, 5.0, props.length / 2)
    .setTranslation(0, -5, 0) // 向下偏移，让表面在 y=0

  world.value.createCollider(colliderDesc, groundBody)
})
</script>
