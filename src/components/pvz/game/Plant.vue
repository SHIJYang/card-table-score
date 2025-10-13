<template>
  <span class="plant-emoji">{{ emoji }}</span>
</template>

<script setup>
import { computed } from "vue";
const props = defineProps({
  type: String,
  emoji: {
    type: String,
    default: "",
  },
});
const emojiMap = {
  sunflower: "🌻",
  peashooter: "🌱",
};
const emoji = computed(() => props.emoji || emojiMap[props.type] || "🌱");
</script>

<style scoped>
.plant-emoji {
  font-size: 32px;
  z-index: 2;
}
</style>
