// src/composables/useKeyboard.ts
import { reactive, onMounted, onUnmounted } from 'vue'

export function useKeyboard() {
  // 响应式对象，记录按键状态
  const keys = reactive({
    w: false,
    a: false,
    s: false,
    d: false,
    shift: false,
    space: false,
  })

  // 键位映射表：无论大小写，都映射到统一的 key
  const keyMap: Record<string, keyof typeof keys> = {
    w: 'w', W: 'w', ArrowUp: 'w',
    s: 's', S: 's', ArrowDown: 's',
    a: 'a', A: 'a', ArrowLeft: 'a',
    d: 'd', D: 'd', ArrowRight: 'd',
    shift: 'shift', Shift: 'shift',
    ' ': 'space',
  }

  const handleKey = (e: KeyboardEvent, isDown: boolean) => {
    if (keyMap[e.key]) {
      keys[keyMap[e.key]] = isDown
    }
  }

  const onDown = (e: KeyboardEvent) => handleKey(e, true)
  const onUp = (e: KeyboardEvent) => handleKey(e, false)

  onMounted(() => {
    window.addEventListener('keydown', onDown)
    window.addEventListener('keyup', onUp)
  })

  onUnmounted(() => {
    window.removeEventListener('keydown', onDown)
    window.removeEventListener('keyup', onUp)
  })

  return keys
}