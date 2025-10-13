<template>
  <span class="bullet" :style="{ left: bullet.x + 'px' }">{{
    bullet.emoji
  }}</span>
</template>

<script setup>
const props = defineProps({
  bullet: Object,
});
</script>

<style scoped>
.bullet {
  position: absolute;
  top: 30px;
  font-size: 24px;
  transition: left 0.1s linear;
  z-index: 3;
}
</style>
