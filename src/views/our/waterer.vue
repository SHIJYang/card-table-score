<template>
  <div class="game-wrapper">
    <svg style="display: none;">
      <filter id="noiseFilter">
        <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="3" stitchTiles="stitch" />
      </filter>
    </svg>
    <div class="paper-texture"></div>

    <Joystick />
    <AttackButton @trigger="handleAttack" />

    <div class="canvas-container">
      <TresCanvas window-resize shadows preset="realistic" clear-color="#fdfdfd">
        <TresAmbientLight :intensity="0.8" />
        <TresDirectionalLight :position="[10, 20, 10]" :intensity="1.5" cast-shadow :shadow-mapSize-width="2048"
          :shadow-mapSize-height="2048" />

        <Suspense>
          <PhysicsScene>

            <InkWater :width="200" :length="200" :target="playerRef" :is-moving="isPlayerMoving" />

            <InkFlowParticles />

            <BaseCharacter ref="playerRef" model-path="/models/skeleton/scene.gltf" :position="[0, 5, 0]"
              @update-pos="updatePlayerStatus" />

            <CameraFollow :target="playerRef" />

          </PhysicsScene>
        </Suspense>
      </TresCanvas>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { TresCanvas } from '@tresjs/core'
import * as THREE from 'three'

// 引入组件
import PhysicsScene from '../../components/world/PhysicsScene.vue'
import InkWater from '../../components/world/InkWater.vue'
import InkFlowParticles from '../../components/world/InkFlowParticles.vue'
import BaseCharacter from '../../components/player/BaseCharacter.vue'
import CameraFollow from '../../components/world/CameraFollow.vue'
import Joystick from '../../components/play/Joystick.vue'
import AttackButton from '../../components/play/AttackButton.vue'

// 状态管理
const playerRef = ref<any>(null)
const isPlayerMoving = ref(false)

// 处理角色状态更新
// 注意：虽然 BaseCharacter 发射了 (pos, moving)，但坐标我们不再需要存了
// InkWater 和 GameCamera 会直接读取 playerRef 内部的坐标
const updatePlayerStatus = (_pos: THREE.Vector3, moving: boolean) => {
  isPlayerMoving.value = moving
}

// 处理攻击点击
const handleAttack = () => {
  if (playerRef.value) {
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
  background-color: #fdfdfd;
  /* 宣纸白底 */

  /* 关键：禁用浏览器默认触摸行为（滚动、缩放），消除控制台警告并提升手感 */
  touch-action: none;
}

/* 纸张纹理叠加层 */
.paper-texture {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  /* 让点击穿透过去 */
  z-index: 100;
  opacity: 0.15;
  /* 纹理浓度，可微调 */
  background: #fff;
  filter: url(#noiseFilter);
  /* 调用 SVG 噪声 */
  mix-blend-mode: multiply;
  /* 正片叠底，让纹理“印”在画面上 */
}

.canvas-container {
  width: 100%;
  height: 100%;
  display: block;
}
</style>