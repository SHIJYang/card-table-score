<template>
  <div class="canvas-container">

    <TresCanvas shadows :clear-alpha="0" window-size>

      <!-- <相机 :位置="[0, 0, 14]" :看着="[0, 0, 0]" /> -->
      <TresPerspectiveCamera :position="[0, 8, 16]" :look-at="[0, 6, 0]" />


      <!-- 禁止缩放,禁止平移-->
      <OrbitControls :enable-zoom="true" :enable-pan="false" />

      <!-- 基础照明:环境光 -->
      <TresAmbientLight :intensity="1.2" />

      <!-- 基础照明: 平行光 -->
      <TresDirectionalLight :position="[2, 5, 5]" :intensity="1" />

      <!-- <TresGroup :position="[0, 0, 0]" :rotation-y="-0.2">
        <LineDog />
      </TresGroup> -->

      <TresGroup :position="[1.5, 1.2, 0]" :rotation-y="-0.2" :scale="1.5">
        <LineDog />
      </TresGroup>


      <Suspense>
        <DogModelLocal />

        <template #fallback>
          <TresMesh>
            <TresBoxGeometry />
            <TresMeshBasicMaterial color="red" wireframe />
          </TresMesh>
        </template>
      </Suspense>





      <!-- <Suspense :position="[-2, 0, 0]" :rotation-y="-0.2">
        <DogModelNetwork />

        <template #fallback>
          <TresMesh>
            <TresBoxGeometry />
            <TresMeshBasicMaterial color="red" wireframe />
          </TresMesh>
        </template>
</Suspense> -->


      <!-- <TresAxesHelper />
        <TresGridHelper /> -->
    </TresCanvas>
  </div>
</template>
<script setup>

// TresCanvas: 3D 画布组件，一切 3D 内容的容器
import { TresCanvas } from '@tresjs/core'


import { OrbitControls } from '@tresjs/cientos'

import LineDog from '@/components/tres/DogScene.vue'
import DogModelLocal from '@/components/tres/DogModelLocal.vue'
import DogModelNetwork from '@/components/tres/DogModelNetwork.vue'

</script>

<style scoped>
.canvas-container {
  background-color: var(--bgPrimary, #ffba6c);
  z-index: 0;
  touch-action: none;
}
</style>