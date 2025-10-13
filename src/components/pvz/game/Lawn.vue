<!-- src/components/game/Lawn.vue -->
<template>
  <div class="lawn">
    <div v-for="row in rows" :key="row" class="lawn-row">
      <slot name="row" :row="row">
        <Cell
          v-for="col in cols"
          :key="col"
          :plant="grid[row][col]"
          :bullets="getBulletsInRow(row)"
          :zombies="getZombiesInRow(row)"
          @click="() => $emit('cell-click', row, col)"
        />
      </slot>
    </div>
    <div
      v-for="sunToken in allSunTokens"
      :key="sunToken.id"
      class="sun-token"
      :data-sun-id="sunToken.id"
      :style="{ left: sunToken.x + 'px', top: sunToken.y + 'px' }"
      @click.stop="$emit('collect-sun', sunToken.id)"
    >
      ☀️ {{ sunToken.value }}
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";
import Cell from "./Cell.vue";

const props = defineProps({
  grid: Array,
  getBulletsInRow: Function,
  getZombiesInRow: Function,
  getSunTokensInRow: {
    type: Function,
    default: () => () => [],
  },
  rows: {
    type: Number,
    default: 5,
  },
  cols: {
    type: Number,
    default: 9,
  },
});

const allSunTokens = computed(() => {
  const tokens = [];
  if (typeof props.getSunTokensInRow === "function") {
    for (let row = 1; row <= props.rows; row++) {
      const arr = props.getSunTokensInRow(row);
      if (Array.isArray(arr)) {
        tokens.push(...arr);
      }
    }
  }
  return tokens;
});
</script>
