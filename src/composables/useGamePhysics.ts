// src/composables/useGamePhysics.ts
import { shallowRef } from 'vue'
import * as RAPIER from '@dimforge/rapier3d-compat' 

const world = shallowRef<RAPIER.World | null>(null)
const isLoaded = shallowRef(false)
// 1. 在外部定义变量，但不要立即 new
let eventQueue: RAPIER.EventQueue | null = null 

export function useGamePhysics() {
  
  const initPhysics = async () => {
    if (world.value) return 

    await RAPIER.init() // 等待 WASM 加载完成
    
    // 2. 初始化完成后，再创建 EventQueue
    eventQueue = new RAPIER.EventQueue(true)
    
    world.value = new RAPIER.World({ x: 0.0, y: -9.81, z: 0.0 })
    isLoaded.value = true
  }

  const stepPhysics = () => {
    // 3. 确保 world 和 eventQueue 都存在
    if (world.value && eventQueue) {
      world.value.step(eventQueue)
    }
  }

  const freePhysics = () => {
    if (world.value) {
      world.value.free()
      if (eventQueue) eventQueue.free() // 记得清理 eventQueue
      world.value = null
      eventQueue = null
      isLoaded.value = false
    }
  }

  return {
    RAPIER,
    world,
    isLoaded,
    initPhysics,
    stepPhysics,
    freePhysics
  }
}