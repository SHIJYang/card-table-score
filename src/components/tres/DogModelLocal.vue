<template>
  <TresGroup ref="modelGroup">
    <primitive v-if="state" :object="state.scene" />
  </TresGroup>
</template>

<script setup lang="ts">
import { watch } from 'vue'
import { useGLTF, useAnimations } from '@tresjs/cientos'
import gsap from 'gsap'
// 1. 定义 Props，让父组件告诉我们播放哪个动画
const props = defineProps<{
  actionName: string | 'skeleton-skeleton|run'
}>()

const path = '/models/skeleton/scene.gltf'

// 2. 加载模型
const { state } = await useGLTF(path, { draco: true })

console.log('加载完成了！', state)
console.log('动画列表:', state.value?.animations)


const animations = state.value?.animations
const model = state.value?.scene

// 3. 提取动画控制器
const { actions } = useAnimations(animations, model)

console.log('动画列表1:', animations)
console.log('动画列表2:', model)
console.log('动画列表3:', actions)


// 4. 核心逻辑：监听父组件传来的 actionName 变化
watch(
  () => props.actionName,
  (newActionName, oldActionName) => {
    // 4.1 找到新的动画动作
    const nextAction = actions[newActionName]
    const prevAction = actions[oldActionName || '']

    if (nextAction) {
      // --- 处理上一个动作 (如果存在) ---
      if (prevAction) {
        // 使用 GSAP 将旧动作的权重从当前值降到 0
        gsap.to(prevAction, {
          duration: 0.5, // 过渡时间
          weight: 0,     // 目标权重为 0
          ease: "power1.out", // GSAP 缓动效果
          onComplete: () => {
            prevAction.stop() // 权重归零后停止播放，节省资源
          }
        })
      }

      // --- 处理新动作 ---
      // 1. 先重置并开始播放，但在视觉上先设为不可见 (权重为0)
      nextAction.reset()
      nextAction.play()
      nextAction.weight = 0 // 初始权重设为0 (替代 fadeIn 的起始状态)

      // 2. 使用 GSAP 将新动作的权重从 0 升到 1
      gsap.to(nextAction, {
        duration: 0.5,
        weight: 1,
        ease: "power1.in",
        onUpdate: () => {
          // 在某些 Three.js 版本中，可能需要显式调用 setEffectiveWeight
          // nextAction.setEffectiveWeight(nextAction.weight)
        }
      })

      console.log(`切换动画: ${newActionName}`)
    } else {
      console.warn(`未找到动画: ${newActionName}`)
    }
  },
  { immediate: true }
)
</script>