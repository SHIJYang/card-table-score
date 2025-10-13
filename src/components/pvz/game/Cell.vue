<!-- src/components/game/Cell.vue -->
<template>
  <div class="cell" @click="$emit('click')">
    <slot name="plant" :plant="plant">
      <Plant v-if="plant" :type="plant.type" :emoji="plant.emoji" />
    </slot>
    <slot name="bullets" :bullets="bullets">
      <Bullet v-for="bullet in bullets" :key="bullet.id" :bullet="bullet" />
    </slot>
    <slot name="zombies" :zombies="zombies">
      <Zombie v-for="zombie in zombies" :key="zombie.id" :zombie="zombie" />
    </slot>
    <slot name="suns" :suns="suns">
      <span
        v-for="sun in suns"
        :key="sun.id"
        class="sun-token"
        :data-sun-id="sun.id"
        @click.stop="$emit('collect-sun', sun.id)"
        style="
          position: absolute;
          top: 10px;
          left: 10px;
          font-size: 22px;
          cursor: pointer;
          z-index: 10;
        "
        >☀️</span
      >
    </slot>
  </div>
</template>

<script setup>
import Plant from "./Plant.vue";
import Bullet from "./Bullet.vue";
import Zombie from "./Zombie.vue";
defineProps({
  plant: { type: Object, default: null },
  bullets: { type: Array, default: () => [] },
  zombies: { type: Array, default: () => [] },
  suns: { type: Array, default: () => [] },
});
defineEmits(["click", "collect-sun"]);
</script>
