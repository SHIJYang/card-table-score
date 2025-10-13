<!-- src/components/ui/SunDisplay.vue -->
<template>
  <div class="sun-display">☀️ {{ sun }}</div>
</template>

<script setup>
defineProps({ sun: Number });
</script>
