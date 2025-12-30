  <template>
    <TresGroup ref="groupRef">
      
      <TresGroup ref="headRef" :position="[0, 0.6, 0.3]"> <TresMesh>
          <TresSphereGeometry :args="[0.8, 32, 32]" />
          <TresMeshToonMaterial :color="dogConfig.color" />
        </TresMesh>
        <TresMesh>
          <TresSphereGeometry :args="[0.8 * dogConfig.outlineWidth, 32, 32]" />
          <TresMeshBasicMaterial :color="dogConfig.outlineColor" :side="THREE.BackSide" />
        </TresMesh>
  
        <TresGroup :position="[-0.6, 0.5, 0]" :rotation-z="0.5">
          <TresMesh>
            <TresSphereGeometry :args="[0.35, 32, 32]" />
            <TresMeshToonMaterial :color="dogConfig.color" />
          </TresMesh>
          <TresMesh>
            <TresSphereGeometry :args="[0.35 * dogConfig.outlineWidth, 32, 32]" />
            <TresMeshBasicMaterial :color="dogConfig.outlineColor" :side="THREE.BackSide" />
          </TresMesh>
        </TresGroup>
  
        <TresGroup :position="[0.6, 0.5, 0]" :rotation-z="-0.5">
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
  
      <TresGroup :position="[0, -0.5, -0.2]"> <TresMesh :scale="[0.9, 0.8, 1.3]"> 
          <TresSphereGeometry :args="[0.7, 32, 32]" />
          <TresMeshToonMaterial :color="dogConfig.color" />
        </TresMesh>
        <TresMesh :scale="[0.9, 0.8, 1.3]">
          <TresSphereGeometry :args="[0.7 * dogConfig.outlineWidth, 32, 32]" />
          <TresMeshBasicMaterial :color="dogConfig.outlineColor" :side="THREE.BackSide" />
        </TresMesh>
      </TresGroup>
  
      <TresGroup ref="tailRef" :position="[0, -0.2, -1.0]">
        <TresGroup :rotation-x="-0.5"> <TresMesh :position="[0, 0.3, 0]"> <TresSphereGeometry :args="[0.2, 32, 32]" />
             <TresMeshToonMaterial :color="dogConfig.color" />
           </TresMesh>
           <TresMesh :position="[0, 0.3, 0]">
             <TresSphereGeometry :args="[0.2 * dogConfig.outlineWidth, 32, 32]" />
             <TresMeshBasicMaterial :color="dogConfig.outlineColor" :side="THREE.BackSide" />
           </TresMesh>
        </TresGroup>
      </TresGroup>
  
      <TresGroup :position="[-0.4, -1.1, 0.2]">
        <TresMesh :scale-y="1.2">
          <TresSphereGeometry :args="[0.18, 32, 32]" />
          <TresMeshToonMaterial :color="dogConfig.color" />
        </TresMesh>
        <TresMesh :scale-y="1.2">
          <TresSphereGeometry :args="[0.18 * dogConfig.outlineWidth, 32, 32]" />
          <TresMeshBasicMaterial :color="dogConfig.outlineColor" :side="THREE.BackSide" />
        </TresMesh>
      </TresGroup>
  
      <TresGroup :position="[0.4, -1.1, 0.2]">
        <TresMesh :scale-y="1.2">
          <TresSphereGeometry :args="[0.18, 32, 32]" />
          <TresMeshToonMaterial :color="dogConfig.color" />
        </TresMesh>
        <TresMesh :scale-y="1.2">
          <TresSphereGeometry :args="[0.18 * dogConfig.outlineWidth, 32, 32]" />
          <TresMeshBasicMaterial :color="dogConfig.outlineColor" :side="THREE.BackSide" />
        </TresMesh>
      </TresGroup>
  
      <TresGroup :position="[-0.45, -1.1, -0.7]">
        <TresMesh :scale-y="1.2">
          <TresSphereGeometry :args="[0.2, 32, 32]" />
          <TresMeshToonMaterial :color="dogConfig.color" />
        </TresMesh>
        <TresMesh :scale-y="1.2">
          <TresSphereGeometry :args="[0.2 * dogConfig.outlineWidth, 32, 32]" />
          <TresMeshBasicMaterial :color="dogConfig.outlineColor" :side="THREE.BackSide" />
        </TresMesh>
      </TresGroup>
  
      <TresGroup :position="[0.45, -1.1, -0.7]">
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
  // ==========================================
  // 1. 核心依赖引入
  // ==========================================
  import { shallowRef } from 'vue'          // Vue 的浅层引用
  import { useLoop } from '@tresjs/core'    // TresJS 的动画循环
  import * as THREE from 'three'            // Three.js 原生库
  const props = defineProps({
    color: {
      type: String,
      default: '#ffffff' // 默认白色
    }
  })


  const dogConfig = {
   
    outlineColor: '#000000',
    outlineWidth: 1.05,
  }
  
  // ==========================================
  // 3. 动画控制引用
  // ==========================================
  const groupRef = shallowRef(null) // 绑定全身
  const headRef = shallowRef(null)  // 绑定头部
  const tailRef = shallowRef(null)  // 绑定尾巴
  
  // ==========================================
  // 4. 动画循环逻辑
  // ==========================================
  const { onBeforeRender } = useLoop()
  
  onBeforeRender(({ elapsed }) => {
    // 安全检查
    if (!groupRef.value || !headRef.value || !tailRef.value) return
  
    // [动画A] 呼吸效果
    const breath = 1 + Math.sin(elapsed * 3) * 0.005
    groupRef.value.scale.set(breath, breath, breath)
  
    // [动画B] 悬浮律动
    groupRef.value.position.y = Math.sin(elapsed * 2) * 0.05
  
    // [动画C] 呆萌歪头 (慢速)
    headRef.value.rotation.z = Math.sin(elapsed * 2) * 0.05
    headRef.value.rotation.y = Math.sin(elapsed * 1.5) * 0.05
    
    // [动画D] 疯狂摇尾巴 (快速) -> 新增功能
    // 使用 Math.cos 生成左右摆动，乘以 0.6 控制摆动幅度
    tailRef.value.rotation.z = Math.cos(elapsed * 12) * 0.6
  })
</script>