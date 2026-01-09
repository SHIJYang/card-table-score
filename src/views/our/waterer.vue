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
        <TresDirectionalLight :position="[10, 20, 10]" :intensity="1.5" cast-shadow />

        <Suspense>
          <PhysicsScene>
            <InkWater :width="200" :length="200" :player-pos="playerPos" :is-moving="isPlayerMoving" />

            <InkFlowParticles />

            <BaseCharacter ref="playerRef" model-path="/models/skeleton/scene.gltf" :position="[0, 5, 0]"
              @update-pos="updatePlayerPos" />

            <GameCamera :target="playerRef" />

          </PhysicsScene>
        </Suspense>
      </TresCanvas>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { TresCanvas } from '@tresjs/core'
import { OrbitControls } from '@tresjs/cientos'
import * as THREE from 'three'
import PhysicsScene from '../../components/world/PhysicsScene.vue'
import InkWater from '../../components/world/InkWater.vue'
import InkFlowParticles from '../../components/world/InkFlowParticles.vue'
import BaseCharacter from '../../components/player/BaseCharacter.vue'
import GameCamera from '../../components/world/GameCamera.vue'
import Joystick from '../../components/play/Joystick.vue'
import AttackButton from '../../components/play/AttackButton.vue'

const playerRef = ref<any>(null)
const playerPos = ref(new THREE.Vector3(0, 0, 0))
const isPlayerMoving = ref(false)

const updatePlayerPos = (pos: THREE.Vector3, moving: boolean) => {
  playerPos.value.copy(pos)
  isPlayerMoving.value = moving
}

const handleAttack = () => {
  if (playerRef.value) playerRef.value.triggerAttack()
}
</script>

<style scoped>
/* 样式保持不变 */
.game-wrapper {
  position: absolute;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  background-color: #fdfdfd;
  touch-action: none;
}

.paper-texture {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 100;
  opacity: 0.15;
  background: #fff;
  filter: url(#noiseFilter);
  mix-blend-mode: multiply;
}

.canvas-container {
  width: 100%;
  height: 100%;
  display: block;
}
</style>