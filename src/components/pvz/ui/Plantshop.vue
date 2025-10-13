<!-- src/components/ui/PlantShop.vue -->
<template>
  <div class="shop">
    <div
      v-for="plantType in Object.keys(registeredPlants)"
      :key="plantType"
      class="plant-card"
      :class="{
        selected: selectedPlant === plantType,
        disabled: !canUse(plantType),
      }"
      @click="selectPlant(plantType)"
    >
      <slot name="plant-emoji" :plant="registeredPlants[plantType]">
        <div class="plant-emoji">{{ registeredPlants[plantType].emoji }}</div>
      </slot>
      <div class="plant-info">
        {{ registeredPlants[plantType].displayName }}<br />
        <span class="cost">{{ registeredPlants[plantType].cost }}</span>
        <div v-if="registeredPlants[plantType].desc" class="desc">
          {{ registeredPlants[plantType].desc }}
        </div>
      </div>
      <div v-if="!isReady(plantType)" class="cooldown-overlay">
        {{
          Math.max(
            1,
            Math.ceil((plantCooldowns[plantType] - Date.now()) / 1000)
          )
        }}s
      </div>
    </div>
    <div class="plant-card cancel" @click="selectPlant(null)">取消</div>
  </div>
</template>

<script setup>
import { computed } from "vue";
const props = defineProps({
  registeredPlants: {
    type: Object,
    required: true,
  },
  selectedPlant: String,
  plantCooldowns: {
    type: Object,
    required: true,
  },
});
const emit = defineEmits(["select"]);

const selectPlant = (type) => emit("select", type);

const isReady = (type) => {
  const cooldown = props.plantCooldowns[type];
  return !cooldown || Date.now() >= cooldown;
};

const canUse = (type) => {
  const plant = props.registeredPlants[type];
  return plant && isReady(type);
};
</script>

<style scoped>
.plant-card {
  position: relative;
  width: 70px;
  height: 90px;
  border: 2px solid #ccc;
  border-radius: 8px;
  background: white;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.2s;
}

.plant-card:hover:not(.disabled) {
  transform: translateY(-2px);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
}

.plant-card.selected {
  border-color: #ff9800;
  background: #fff8e1;
}

.plant-card.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.plant-emoji {
  font-size: 24px;
  margin-bottom: 4px;
}

.cost {
  color: #ff9800;
  font-weight: bold;
}

.cooldown-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.6);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: bold;
  border-radius: 8px;
}

.cancel {
  background: #f5f5f5;
  font-size: 14px;
}

.desc {
  color: #888;
  font-size: 11px;
  margin-top: 2px;
}
</style>
