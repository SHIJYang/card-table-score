<template>
  <TresGroup ref="modelGroup" :scale="scale">
    <TresAmbientLight :intensity="2.0" />
    <TresDirectionalLight :position="[5, 5, 5]" :intensity="1.5" />
    <primitive v-if="model" :object="model" />
  </TresGroup>
</template>

<script setup lang="ts">
import { shallowRef } from 'vue'
import { useGLTF, useAnimations, useTexture } from '@tresjs/cientos'
import * as THREE from 'three'

const props = defineProps<{
  modelPath: string
  texturePath: string
  scale?: number
}>()

const emit = defineEmits(['loaded'])
const scale = props.scale || 1

console.log(`[子组件] 加载: ${props.modelPath}, ${props.texturePath}`)

// ===============================================
// 🛑 核心修复：添加 "as any" 解决红色波浪线报错
// ===============================================
// TypeScript 也就是在这里犯傻，我们强制告诉它：别管类型，我心里有数。
const [gltfResult, textureResult] = await Promise.all([
  useGLTF(props.modelPath, { draco: true }) as any,
  useTexture(props.texturePath) as any
])

// ===============================================
// 🛡️ 兼容逻辑：不管它返回的是 Ref 还是对象，统统拿下
// ===============================================
// 1. 获取 GLTF 数据
// 有些版本返回 { state: { value: ... } }，有些直接返回 ...
const gltfData = gltfResult.state?.value || gltfResult

// 2. 获取 Texture 数据
const textureRaw = textureResult.state?.value || textureResult
// 再次防御：有时候直接是 Texture，有时候是 { map: Texture }
const texture = (textureRaw?.isTexture ? textureRaw : textureRaw?.map) as THREE.Texture

const model = gltfData?.scene

// 3. 应用贴图
if (model) {
  if (texture) {
    texture.flipY = false
    texture.colorSpace = THREE.SRGBColorSpace

    model.traverse((child: any) => {
      if (child.isMesh && child.material) {
        // 克隆材质
        const newMat = Array.isArray(child.material)
          ? child.material[0].clone()
          : child.material.clone()

        newMat.map = texture
        newMat.color.set(0xffffff)
        newMat.roughness = 0.8
        newMat.needsUpdate = true

        child.material = newMat
      }
    })
    console.log('✅ 贴图应用成功')
  } else {
    // 如果这里打印了，说明路径还是有问题
    console.warn('⚠️ 贴图为空，请检查 public 目录下是否有该文件', props.texturePath)
  }
}

// 4. 处理动画
const rawAnimations = gltfData?.animations
if (rawAnimations && rawAnimations.length > 0) {
  // 必须用 shallowRef 包裹
  const animationsRef = shallowRef(rawAnimations)
  const { actions } = useAnimations(animationsRef, model)

  emit('loaded', actions)
  console.log('✅ 动画加载完成')
}

defineExpose({ model })
</script>