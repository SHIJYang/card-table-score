<!-- src/components/ui/GameOverOverlay.vue -->
<template>
  <div class="game-over-overlay">
    <h2>{{ win ? "🎉 胜利！" : "💀 失败！" }}</h2>
    <button @click="$emit('restart')">再试一次</button>
  </div>
</template>

<script setup>
defineProps({ win: Boolean });
defineEmits(["restart"]);
</script>

<style scoped>
.game-over-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.85);
  color: white;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  font-size: 2rem;
}

.game-over-overlay button {
  margin-top: 20px;
  padding: 10px 20px;
  font-size: 1.1rem;
  background: #4caf50;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
}
</style>
