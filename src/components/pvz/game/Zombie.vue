<template>
  <span
    class="zombie"
    :class="{ damaged: zombie.isDamaged }"
    :style="{ left: zombie.x + 'px' }"
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
  position: absolute;
  top: 30px;
  font-size: 28px;
  transition: left 0.1s linear;
  z-index: 4;
}
.zombie.damaged {
  opacity: 0.6;
  filter: grayscale(0.7);
}
</style>
