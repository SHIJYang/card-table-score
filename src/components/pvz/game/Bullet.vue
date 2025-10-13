<template>
  <div
    class="bullet"
    :class="bullet.type"
    :style="{
      left: `${bullet.x}px`,
      top: '40%',
      transform: 'translate(0, -50%)',
    }"
  >
    {{ bullet.emoji }}
  </div>
</template>

<script setup>
defineProps({
  bullet: {
    type: Object,
    required: true,
  },
});
</script>

<style scoped>
.bullet {
  position: absolute;
  font-size: 20px;
  line-height: 1;
  transition: left 0.1s linear;
  z-index: 3;
}

.pea {
  color: #2ecc71;
}

.ice-pea {
  color: #3498db;
}
</style>
