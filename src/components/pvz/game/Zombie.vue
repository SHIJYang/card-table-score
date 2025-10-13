<template>
  <span
    class="zombie"
    :class="{ damaged: zombie.isDamaged }"
    :style="{ left: zombie.x + 'px', top: '30px', position: 'absolute' }"
    >{{ zombie.emoji }}</span
  >
</template>

<script setup>
const props = defineProps({
  zombie: Object,
});
</script>

<style scoped>
.zombie {
  font-size: 28px;
  transition: left 0.1s linear;
  z-index: 4;
  pointer-events: none;
}
.zombie.damaged {
  opacity: 0.6;
  filter: grayscale(0.7);
}
</style>
