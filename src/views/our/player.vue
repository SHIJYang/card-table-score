<template>
  <div class="game-wrapper">
    <Joystick />
    <div class="ui-overlay">
      <GestureRadio v-model="activeMode" :options="menuConfig" @update:model-value="handleMenuClick" />
    </div>
    <AttackButton @trigger="handleAttack" />

    <div class="canvas-container">
      <TresCanvas window-resize shadows preset="realistic" clear-color="#111">
        <TresPerspectiveCamera :position="[0, 8, 12]" :look-at="[0, 0, 0]" />

        <TresAmbientLight :intensity="1" />
        <TresDirectionalLight :position="[10, 10, 10]" :intensity="2" cast-shadow />

        <Suspense>
          <PhysicsScene>
            <LevelGround :width="100" :length="100" color="#44aa44" />

            <BaseCharacter ref="playerRef" model-path="/models/skeleton/scene.gltf" :position="[0, 5, 0]" />

            <CameraFollow :target="playerRef" />

          </PhysicsScene>
        </Suspense>

        <TresGridHelper :args="[100, 100]" />
      </TresCanvas>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { TresCanvas } from '@tresjs/core'
import PhysicsScene from '../../components/world/PhysicsScene.vue'
import LevelGround from '../../components/world/LevelGround.vue'
import BaseCharacter from '../../components/player/BaseCharacter.vue'
import Joystick from '../../components/play/Joystick.vue'
import CameraFollow from '../../components/world/CameraFollow.vue'
import AttackButton from '../../components/play/AttackButton.vue' // 👈 引入按钮

// 获取人物组件的引用
const playerRef = ref<any>(null)

// 处理攻击逻辑
const handleAttack = () => {
  if (playerRef.value) {
    
    playerRef.value.triggerAttack()
  }
}
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
.game-wrapper {
  position: absolute;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  background-color: #111;
}

.canvas-container {
  width: 100%;
  height: 100%;
  display: block;
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

<style>
html,
body {
  margin: 0;
  padding: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
}
</style>