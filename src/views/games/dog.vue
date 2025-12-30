
  <template>
    <div class="canvas-container">
      
      <TresCanvas shadows clearAlpha window-size>
        
        <!-- <相机 :位置="[0, 0, 14]" :看着="[0, 0, 0]" /> -->
        <TresPerspectiveCamera :position="[0, 8, 16]" :look-at="[0, 6, 0]"/>


        <!-- 禁止缩放,禁止平移-->
        <OrbitControls :enable-zoom="false" :enable-pan="false" />

        <!-- 基础照明:环境光 -->
        <TresAmbientLight :intensity="1.2" />
       
        <!-- 基础照明: 平行光 -->
        <TresDirectionalLight :position="[2, 5, 5]" :intensity="1" />

        <TresGroup :position="[0, 1.3, 0]">
        <LineDog />
      </TresGroup>

      <TresGroup :position="[2, 1.5, -2]" :rotation-y="-0.5" :scale="1.5">
        <LineDog />
      </TresGroup>

      <TresGroup :position="[-2, 1.3, 0]" :rotation-y="1">
        <LineDog />
      </TresGroup>


        <TresAxesHelper />
        <TresGridHelper />
      </TresCanvas>
    </div>
  </template>
<script setup>

  // TresCanvas: 3D 画布组件，一切 3D 内容的容器
  import { TresCanvas } from '@tresjs/core'
  
  // OrbitControls: 轨道控制器
  // 允许用户用鼠标左键旋转、右键平移、滚轮缩放来查看场景
  import { OrbitControls } from '@tresjs/cientos'
  
  import LineDog from '@/components/tres/DogScene.vue' 
  import Tres from '@tresjs/core'
  console.log('Tres插件状态:', Tres)
  </script>
  
  <style scoped>
    .canvas-container {
    background-color: var(--bgPrimary, #ffba6c); 
    z-index: 0;
    }
    </style>