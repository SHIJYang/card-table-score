<template>
  <div class="canvas-container">
    <div class="ui-overlay">
      <GestureRadio v-model="activeMode" :options="menuConfig" @update:model-value="handleMenuClick" />
    </div>
    <TresCanvas shadows :clear-alpha="0" window-size>

      <!-- <相机 :位置="[0, 0, 14]" :看着="[0, 0, 0]" /> -->
      <TresPerspectiveCamera :position="[0, 4, 16]" :look-at="[0, 2, 0]" />


      <!-- 禁止缩放,禁止平移-->
      <OrbitControls :enable-zoom="true" :enable-pan="false" />

      <!-- 基础照明:环境光 -->
      <TresAmbientLight :intensity="1.2" />

      <!-- 基础照明: 平行光 -->
      <TresDirectionalLight :position="[2, 5, 5]" :intensity="1" />

      <!-- <Stats /> -->




      <TresGroup :position="[1.5, 2, 0]" :rotation-y="-0.2" :scale="1.5">
        <LineDog cast-shadow />
      </TresGroup>
      <TresGroup :position="[-1.5, 0, 0]" :rotation-y="0.2" :scale="1">
        <Suspense>
          <DogModelLocal :action-name="currentAnimation" />

          <template #fallback>
            <TresMesh cast-shadow>
              <TresBoxGeometry />
              <TresMeshBasicMaterial color="red" wireframe />
            </TresMesh>
          </template>
        </Suspense>

      </TresGroup>





      <TresAxesHelper />
      <TresGridHelper />
    </TresCanvas>
  </div>
</template>
<script setup lang="ts">
import { ref } from 'vue'
// TresCanvas: 3D 画布组件，一切 3D 内容的容器
import { TresCanvas } from '@tresjs/core'

import { Stats } from '@tresjs/cientos'
import { OrbitControls } from '@tresjs/cientos'

import LineDog from '@/components/tres/DogScene.vue'
import DogModelLocal from '@/components/tres/DogModelLocal.vue'
import DogModelNetwork from '@/components/tres/DogModelNetwork.vue'
import GestureRadio from "../../components/GestureRadio.vue"
const currentAnimation = ref('skeleton-skeleton|idle')

// 切换动画的函数
const changeAnimation = (name: string) => {
  currentAnimation.value = name
}
const activeMode = ref('1');

// 菜单配置
const menuConfig = [
  { value: '1', rgb: 'rgb(255, 71, 87)', icon: '/icon/idle.svg' },
  { value: '2', rgb: 'rgb(215, 220, 98)', icon: '/icon/run.svg' },
  { value: '3', rgb: 'rgb(46, 213, 115)', icon: '/icon/attack.svg' },
  { value: '4', rgb: 'rgb(55, 66, 250)', icon: '/icon/spawn.svg' }
];


const handleMenuClick = (value) => {
  switch (value) {
    case '1':
      currentAnimation.value = 'skeleton-skeleton|idle';
      break;
    case '2':
      currentAnimation.value = 'skeleton-skeleton|run';
      break;
    case '3':
      currentAnimation.value = 'skeleton-skeleton|attack';
      break;
    case '4':
      currentAnimation.value = 'skeleton-skeleton|spawn';
      setTimeout(() => {
        activeMode.value = '1';
        currentAnimation.value = 'skeleton-skeleton|idle';
      }, 1400);
      break;
    default:
      console.warn('未知的操作类型:', value);
  }
};



</script>

<style scoped>
.canvas-container {
  background-color: var(--bgPrimary, #ffba6c);
  z-index: 0;
  touch-action: none;
}

.ui-overlay {
  position: absolute;
  bottom: 40px;
  /* 距离底部距离 */
  left: 50%;
  /* 水平居中 */
  transform: translateX(-50%);
  /* 修正居中偏移 */
  z-index: 200;
  /* 保证在画布之上，且比调试面板高 */

  /* 可选：添加背景模糊增加可读性 */
  /* backdrop-filter: blur(4px); */
  /* background: rgba(255, 255, 255, 0.1); */
  /* border-radius: 20px; */
  padding: 10px;
}
</style>