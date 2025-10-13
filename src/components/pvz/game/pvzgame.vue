<template>
  <div class="game-container" @click="handleGlobalClick">
    <!-- 顶部 UI 区 -->
    <div class="ui-bar">
      <SunDisplay :sun="sun" />
      <div class="controls">
        <button @click="startGame" :disabled="isRunning">开始</button>
        <button @click="resetGame">重置</button>
      </div>
    </div>

    <!-- 植物商店 -->
    <PlantShop
      :registered-plants="registeredPlants"
      :selected-plant="selectedPlant"
      :plant-cooldowns="plantCooldowns"
      @select="selectPlant"
    />

    <!-- 草坪区域 -->
    <Lawn
      :grid="grid"
      :get-bullets-in-row="getBulletsInRow"
      :get-zombies-in-row="getZombiesInRow"
      :get-sun-tokens-in-row="getSunTokensInRow"
      :selected-plant="selectedPlant"
      @cell-click="placePlant"
      @collect-sun="collectSun"
    />

    <!-- 选择植物提示 -->
    <div v-if="!selectedPlant && isRunning && !gameOver" class="plant-tip">
      请选择要种植的植物
    </div>

    <!-- 游戏结束弹窗 -->
    <GameOverOverlay v-if="gameOver" :win="win" @restart="resetGame" />
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from "vue";
import SunDisplay from "../ui/SunDisplay.vue";
import PlantShop from "../ui/Plantshop.vue";
import Lawn from "./Lawn.vue";
import GameOverOverlay from "../ui/Gameover.vue";
import { useGameLogic } from "../../../composables/pvz/useGameLogic";

// 使用游戏逻辑组合函数
const {
  sun,
  selectedPlant,
  isRunning,
  gameOver,
  win,
  grid,
  getBulletsInRow,
  getZombiesInRow,
  getSunTokensInRow,
  startGame,
  resetGame,
  selectPlant,
  placePlant,
  registeredPlants,
  plantCooldowns,
  collectSun, // 新增：收集阳光方法
} = useGameLogic();

// 全局点击（用于收集阳光等）
const handleGlobalClick = (event) => {
  // 仅处理阳光点击
  if (event.target.classList.contains("sun-token")) {
    collectSun(event.target.dataset.sunId);
  }
  // ...可扩展其他全局点击逻辑...
};

// 生命周期：初始化游戏
onMounted(() => {
  resetGame();
});

// 安全清理（防止内存泄漏）
onUnmounted(() => {
  resetGame();
});
</script>

<style scoped>
.game-container {
  position: relative;
  min-height: 100vh;
  background: #e8f5e9;
  overflow: hidden;
  user-select: none;
}

.ui-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 20px;
  background: #689f38;
  color: white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.controls button {
  margin-left: 10px;
  padding: 6px 12px;
  border: none;
  border-radius: 4px;
  background: #4caf50;
  color: white;
  cursor: pointer;
}

.controls button:disabled {
  background: #bdbdbd;
  cursor: not-allowed;
}

.plant-tip {
  position: absolute;
  left: 50%;
  top: 90px;
  transform: translateX(-50%);
  background: rgba(255, 255, 255, 0.95);
  color: #388e3c;
  border-radius: 8px;
  padding: 10px 28px;
  font-size: 18px;
  font-weight: bold;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  z-index: 10;
  pointer-events: none;
}
</style>
