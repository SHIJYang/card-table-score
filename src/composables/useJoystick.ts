// src/composables/useJoystick.ts
import { reactive } from 'vue'

// 创建一个全局单例状态
const joystickState = reactive({
  x: 0,
  y: 0,
  isActive: false
})

export function useJoystick() {
  const updateJoystick = (x: number, y: number, isActive: boolean) => {
    joystickState.x = x
    joystickState.y = y
    joystickState.isActive = isActive
  }

  return {
    joystickState,
    updateJoystick
  }
}