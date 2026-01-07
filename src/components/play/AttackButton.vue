<template>
  <div class="attack-btn" @touchstart.prevent="onAttack" @mousedown.prevent="onAttack">
    ⚔️
  </div>
</template>

<script setup lang="ts">
// 定义事件，通知父组件
const emit = defineEmits(['trigger'])

const onAttack = () => {
  // 震动反馈 (如果设备支持)
  if (navigator.vibrate) navigator.vibrate(50)
  emit('trigger')
}
</script>

<style scoped>
.attack-btn {
  position: absolute;
  bottom: 60px;
  /* 和摇杆位置对齐 */
  right: 60px;
  width: 80px;
  height: 80px;
  background: rgba(255, 50, 50, 0.6);
  /* 半透明红色 */
  border-radius: 50%;
  border: 4px solid rgba(255, 255, 255, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 32px;
  color: white;
  user-select: none;
  cursor: pointer;
  z-index: 1000;
  /* 确保在 Canvas 上层 */
  backdrop-filter: blur(4px);
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.3);
  transition: transform 0.1s;
  touch-action: none;
}

.attack-btn:active {
  background: rgba(255, 0, 0, 0.8);
  transform: scale(0.9);
}
</style>