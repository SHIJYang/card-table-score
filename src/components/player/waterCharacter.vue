<script setup lang="ts">
import { shallowRef, ref, watch, onUnmounted, type PropType, toRaw } from 'vue'
import { useLoop } from '@tresjs/core'
import { useGLTF, useAnimations } from '@tresjs/cientos'
import * as THREE from 'three'
import { useGamePhysics } from '../../composables/useGamePhysics'
import { useKeyboard } from '../../composables/useKeyboard'
import { useJoystick } from '../../composables/useJoystick'

// 1. 参数定义
const props = defineProps({
  modelPath: { type: String, required: true },
  position: { type: Array as unknown as PropType<number[]>, default: () => [0, 5, 0] },
  speed: { type: Number, default: 5 },
  runSpeed: { type: Number, default: 10 }
})

// 🔥 新增：定义事件，向父组件汇报位置，用于水墨 Shader 计算
const emit = defineEmits(['update-pos'])

// 2. 状态定义
const characterGroupRef = shallowRef()
const isModelLoaded = ref(false)
const modelScene = shallowRef<THREE.Object3D | null>(null)
const isSpawning = ref(true)
const isAttacking = ref(false)

// 动画变量
const animNames = { idle: 'idle', run: 'run', attack: 'attack', spawn: 'spawn' }
const actions = shallowRef<any>({})
const mixer = shallowRef<THREE.AnimationMixer | null>(null)

const triggerAttack = () => {
  if (isSpawning.value || isAttacking.value) return
  isAttacking.value = true
  playAnim(animNames.attack, false)
}

defineExpose({
  characterGroupRef,
  triggerAttack
})

// --- 3. 引入组合式函数 ---
const { world, RAPIER } = useGamePhysics()
const keys = useKeyboard()
const { joystickState } = useJoystick()

// --- 4. 动画播放逻辑 ---
let currentAction: any = null

const playAnim = (nameKey: string, loop = true) => {
  const acts = actions.value
  if (!acts || Object.keys(acts).length === 0 || !mixer.value) return

  const actionKey = Object.keys(acts).find((k: string) => k.toLowerCase().includes(nameKey))
  if (!actionKey) return

  const newAnim = acts[actionKey]
  if (currentAction === newAnim) return

  if (loop) {
    newAnim.setLoop(THREE.LoopRepeat, Infinity)
    newAnim.clampWhenFinished = false
  } else {
    newAnim.setLoop(THREE.LoopOnce, 1)
    newAnim.clampWhenFinished = true
  }

  newAnim.reset().fadeIn(0.2).play()
  if (currentAction) currentAction.fadeOut(0.2)
  currentAction = newAnim

  if (!loop) {
    const onFinished = (e: any) => {
      if (e.action === newAnim) {
        mixer.value?.removeEventListener('finished', onFinished)
        if (nameKey === animNames.spawn) isSpawning.value = false
        if (nameKey === animNames.attack) isAttacking.value = false
        playAnim(animNames.idle)
      }
    }
    mixer.value.addEventListener('finished', onFinished)
  }
}

// --- 5. 异步加载模型 (Top-Level Await) ---
try {
  const result = await useGLTF(props.modelPath) as any

  let finalScene: any = null
  let finalAnimations: any[] = []

  if (result.scene) {
    finalScene = result.scene
    finalAnimations = result.animations
  } else if (result.state && result.state.value) {
    const raw = toRaw(result.state.value)
    finalScene = raw.scene || raw.nodes?.Scene
    finalAnimations = raw.animations
  } else if (result.value) {
    const raw = toRaw(result.value)
    finalScene = raw.scene || raw.nodes?.Scene
    finalAnimations = raw.animations
  }

  if (finalScene) {


    modelScene.value = finalScene
    isModelLoaded.value = true

    if (finalAnimations && finalAnimations.length > 0) {
      const animsRef = shallowRef(finalAnimations)
      const { actions: newActions, mixer: newMixer } = useAnimations(animsRef, finalScene) as any

      actions.value = newActions
      mixer.value = newMixer.value

      playAnim(animNames.spawn, false)
    }
  } else {
    console.error('❌ 模型解包失败，未找到 Scene 对象', result)
  }
} catch (e) {
  console.error('❌ 模型加载失败:', e)
}

// --- 6. 物理初始化 ---
let characterBody: any = null
let characterController: any = null
const moveDir = new THREE.Vector3()
const tempMovement = { x: 0, y: 0, z: 0 }

const initPhysics = () => {
  if (!world.value || characterBody) return

  const [x, y, z] = props.position

  const bodyDesc = RAPIER.RigidBodyDesc.kinematicPositionBased().setTranslation(x, y, z)
  characterBody = world.value.createRigidBody(bodyDesc)

  const colliderDesc = RAPIER.ColliderDesc.capsule(0.5, 0.3).setTranslation(0, 0.8, 0)
  world.value.createCollider(colliderDesc, characterBody)

  characterController = world.value.createCharacterController(0.1)
  characterController.enableAutostep(0.7, 0.3, true)
  characterController.enableSnapToGround(0.5)

  if (isModelLoaded.value && !isSpawning.value) {
    playAnim(animNames.idle)
  }
}

watch(world, (val) => {
  if (val) initPhysics()
}, { immediate: true })

// --- 7. 渲染循环 ---
const { onBeforeRender } = useLoop()

onBeforeRender(({ delta }) => {
  if (!characterBody || !characterController || !characterGroupRef.value) return

  moveDir.set(0, 0, 0)
  const canMove = !isSpawning.value && !isAttacking.value

  // 输入处理
  if (canMove) {
    if (keys.w) moveDir.z -= 1
    if (keys.s) moveDir.z += 1
    if (keys.a) moveDir.x -= 1
    if (keys.d) moveDir.x += 1
    if (joystickState.isActive) {
      moveDir.x += joystickState.x
      moveDir.z += joystickState.y
    }
  }

  // 移动逻辑
  const isMoving = moveDir.lengthSq() > 0.01 && canMove

  if (isMoving) {
    moveDir.normalize()
    const targetAngle = Math.atan2(moveDir.x, moveDir.z)
    let angleDiff = targetAngle - characterGroupRef.value.rotation.y
    while (angleDiff > Math.PI) angleDiff -= Math.PI * 2
    while (angleDiff < -Math.PI) angleDiff += Math.PI * 2
    characterGroupRef.value.rotation.y += angleDiff * 0.15

    const actualSpeed = (keys.shift ? props.runSpeed : props.speed) * delta
    tempMovement.x = moveDir.x * actualSpeed
    tempMovement.z = moveDir.z * actualSpeed

    playAnim(animNames.run)
  } else {
    tempMovement.x = 0
    tempMovement.z = 0
    if (!isSpawning.value && !isAttacking.value) playAnim(animNames.idle)
  }

  // 重力
  tempMovement.y = -9.81 * delta

  // 物理计算
  characterController.computeColliderMovement(
    characterBody.collider(0),
    tempMovement,
    RAPIER.QueryFilterFlags.EXCLUDE_DYNAMIC,
    null,
    characterBody
  )

  const corrected = characterController.computedMovement()
  const currentPos = characterBody.translation()

  const nextPos = {
    x: currentPos.x + corrected.x,
    y: currentPos.y + corrected.y,
    z: currentPos.z + corrected.z
  }

  characterBody.setNextKinematicTranslation(nextPos)
  characterGroupRef.value.position.set(nextPos.x, nextPos.y, nextPos.z)

  // 掉落重置
  if (nextPos.y < -20) {
    const [rx, ry, rz] = props.position
    characterBody.setNextKinematicTranslation({ x: rx, y: ry, z: rz })
  }

  // 🔥 向父组件发送当前位置和移动状态，用于驱动水墨 Shader
  emit('update-pos', new THREE.Vector3(nextPos.x, nextPos.y, nextPos.z), isMoving)
})

onUnmounted(() => {
  if (world.value && characterBody) {
    world.value.removeRigidBody(characterBody)
    world.value.removeCharacterController(characterController)
  }
})
</script>

<template>
  <TresGroup ref="characterGroupRef">
    <primitive v-if="isModelLoaded && modelScene" :object="modelScene" :position="[0, 0, 0]" />
    <TresMesh v-else :position="[0, 1, 0]">
      <TresBoxGeometry :args="[1, 2, 1]" />
      <TresMeshBasicMaterial color="black" />
    </TresMesh>
  </TresGroup>
</template>