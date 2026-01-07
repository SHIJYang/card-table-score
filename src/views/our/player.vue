<template>
  <div class="game-wrapper">
    <Joystick />

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
    // 调用 BaseCharacter 暴露出来的 triggerAttack 方法
    // 它会自动播放 'attack' 动画，并在动画结束时自动切回 'idle'
    // (动画时长通常由 GLTF 文件决定，一般就是 1秒左右)
    playerRef.value.triggerAttack()
  }
}
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