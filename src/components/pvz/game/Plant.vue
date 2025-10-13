<template>
  <span class="plant-emoji">{{ emoji }}</span>
</template>

<script setup>
import { computed } from "vue";
import { registeredPlants } from "../../../composables/pvz/plants";
const props = defineProps({
  type: String,
  emoji: {
    type: String,
    default: "",
  },
});
const emoji = computed(
  () =>
    props.emoji || (props.type && registeredPlants[props.type]?.emoji) || "🌱"
);
</script>

<style scoped>
.plant-emoji {
  font-size: 32px;
  z-index: 2;
}
</style>
