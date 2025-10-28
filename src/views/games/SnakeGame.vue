<template>
  <div class="common-layout">
    <el-container>
      <el-header style="padding: 0"><Topnav /></el-header>

      <el-main style="padding: 0">
        <el-card class="game-card">
          <template #header>
            <div class="card-header">
              <h2>🐍 贪吃蛇</h2>
              <div class="score-level">
                <span class="score">得分: {{ score }}</span>
                <span class="level">等级: {{ level }}</span>
                <span v-if="highScore > 0" class="high-score"
                  >最高: {{ highScore }}</span
                >
              </div>
            </div>
          </template>

          <div class="game-container">
            <!-- 游戏面板 -->
            <div class="game-board-wrapper">
              <div class="game-board" ref="gameBoardRef" id="game-board">
                <div
                  v-for="y in gridRows"
                  :key="`row-${y}`"
                  class="grid-row"
                  :style="{ display: 'flex' }"
                >
                  <div
                    v-for="x in gridCols"
                    :key="`cell-${x}-${y}`"
                    class="grid-cell"
                    :class="{
                      'snake-segment': isSnakeSegment(x, y),
                      'snake-head': isSnakeHead(x, y),
                      food: isFood(x, y),
                      'border-cell': isBorderCell(x, y),
                    }"
                  ></div>
                </div>
              </div>
            </div>

            <!-- 控制按钮（移动端友好） -->
            <div class="mobile-controls" v-if="isMobile">
              <div class="control-row">
                <el-button
                  circle
                  @click="changeDirection('up')"
                  :disabled="!canChangeDirection('up')"
                >
                  <el-icon><ArrowUp /></el-icon>
                </el-button>
              </div>
              <div class="control-row">
                <el-button
                  circle
                  @click="changeDirection('left')"
                  :disabled="!canChangeDirection('left')"
                >
                  <el-icon><ArrowLeft /></el-icon>
                </el-button>
                <el-button circle @click="pauseGame" v-if="isPlaying">
                  <el-icon
                    ><VideoPause v-if="isPaused" /><VideoPlay v-else
                  /></el-icon>
                </el-button>
                <el-button
                  circle
                  @click="changeDirection('right')"
                  :disabled="!canChangeDirection('right')"
                >
                  <el-icon><ArrowRight /></el-icon>
                </el-button>
              </div>
              <div class="control-row">
                <el-button
                  circle
                  @click="changeDirection('down')"
                  :disabled="!canChangeDirection('down')"
                >
                  <el-icon><ArrowDown /></el-icon>
                </el-button>
              </div>
            </div>

            <!-- 游戏说明 -->
            <div class="game-info">
              <div class="action-buttons">
                <el-button
                  type="primary"
                  @click="startGame"
                  :disabled="isPlaying && !isPaused"
                  size="large"
                >
                  {{ isPlaying ? (isPaused ? "继续" : "游戏中") : "开始游戏" }}
                </el-button>
                <el-button type="warning" @click="resetGame" size="large"
                  >重新开始</el-button
                >
              </div>
              <el-alert
                title="玩法说明"
                type="info"
                :closable="false"
                class="info-alert"
              >
                <p>吃到食物得分，撞墙或自己则游戏结束</p>
                <p>每得 100 分升一级，速度加快</p>
                <p>PC：方向键控制；手机：点击方向按钮</p>
              </el-alert>
            </div>

            <!-- 操作按钮（通用） -->
          </div>
        </el-card>
      </el-main>
    </el-container>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from "vue";
import { ElMessage } from "element-plus";
import Topnav from "../topnav/TopNav.vue";
import {
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  VideoPause,
  VideoPlay,
} from "@element-plus/icons-vue";

// 游戏配置
const GRID_SIZE = 40; // 逻辑网格数（非像素）
const BOARD_CELLS = 40; // 40x40 网格

const gridCols = BOARD_CELLS;
const gridRows = BOARD_CELLS;

// 响应式判断是否为移动端
const isMobile = computed(() => window.innerWidth <= 768);

// 游戏状态
const isPlaying = ref(false);
const isPaused = ref(false);
const score = ref(0);
const level = ref(1);
const highScore = ref(0);
const gameBoardRef = ref(null);

const lastCollision = ref(null);

const gameSpeed = ref(150);
let gameInterval = null;
let direction = "right";
let nextDirection = "right";

const snake = ref([{ x: 8, y: 5 }]);
const food = ref({ x: 15, y: 8 });

// 判断是否为边界单元格
const isBorderCell = (x, y) => {
  return x === 0 || x === gridCols + 1 || y === 0 || y === gridRows + 1;
};

// 初始化最高分
onMounted(() => {
  const saved = localStorage.getItem("snakeHighScore");
  if (saved) highScore.value = parseInt(saved);
});

// 判断位置
const isSnakeSegment = (x, y) =>
  snake.value.some((s) => s.x === x && s.y === y);
const isSnakeHead = (x, y) => {
  const head = snake.value[0];
  return head && head.x === x && head.y === y;
};
const isFood = (x, y) => food.value.x === x && food.value.y === y;

// 方向变更辅助
const canChangeDirection = (dir) => {
  if (!isPlaying.value || isPaused.value) return false;
  const opposites = { up: "down", down: "up", left: "right", right: "left" };
  return direction !== opposites[dir];
};

const changeDirection = (dir) => {
  if (canChangeDirection(dir)) nextDirection = dir;
};

// 游戏控制
const startGame = () => {
  if (isPlaying.value && !isPaused.value) return;
  isPlaying.value = true;
  isPaused.value = false;
  score.value = 0;
  level.value = 1;
  gameSpeed.value = 150;
  direction = "right";
  nextDirection = "right";
  snake.value = [{ x: 8, y: 5 }];
  lastCollision.value = null;
  generateFood();
  clearInterval(gameInterval);
  gameInterval = setInterval(gameLoop, gameSpeed.value);
  ElMessage.success("游戏开始！");
};

const pauseGame = () => {
  if (!isPlaying.value) return;
  isPaused.value = !isPaused.value;
  if (isPaused.value) {
    clearInterval(gameInterval);
    ElMessage.info("已暂停");
  } else {
    gameInterval = setInterval(gameLoop, gameSpeed.value);
    ElMessage.success("继续游戏");
  }
};

const resetGame = () => {
  clearInterval(gameInterval);
  isPlaying.value = false;
  isPaused.value = false;
  startGame();
};

// 生成食物
const generateFood = () => {
  let newFood;
  let attempts = 0;
  do {
    newFood = {
      x: Math.floor(Math.random() * gridCols),
      y: Math.floor(Math.random() * gridRows),
    };
    attempts++;
    if (attempts > 400) return;
  } while (isSnakeSegment(newFood.x, newFood.y));
  food.value = newFood;
};

// 游戏循环
const gameLoop = () => {
  if (!isPlaying.value || isPaused.value) return;

  direction = nextDirection;
  const head = { ...snake.value[0] };

  switch (direction) {
    case "up":
      head.y--;
      break;
    case "down":
      head.y++;
      break;
    case "left":
      head.x--;
      break;
    case "right":
      head.x++;
      break;
  }

  const collisionResult = checkCollision(head);
  if (collisionResult) {
    lastCollision.value = collisionResult;
    gameOver();
    return;
  }

  snake.value.unshift(head);

  if (head.x === food.value.x && head.y === food.value.y) {
    score.value += 10;
    if (score.value % 100 === 0) {
      level.value++;
      gameSpeed.value = Math.max(50, gameSpeed.value - 10);
      clearInterval(gameInterval);
      gameInterval = setInterval(gameLoop, gameSpeed.value);
      ElMessage.info(`升级！速度加快`);
    }
    generateFood();
  } else {
    snake.value.pop();
  }
};

// 修复边界判定 - 这是关键修复！
const checkCollision = (head) => {
  // 检查墙壁碰撞 - 网格坐标从 0 到 gridCols-1 和 0 到 gridRows-1
  if (
    head.x < 1 ||
    head.x >= gridCols + 1 ||
    head.y < 1 ||
    head.y >= gridRows + 1
  ) {
    return `撞墙！位置: (${head.x}, ${head.y})，边界: X:0-${
      gridCols - 1
    }, Y:0-${gridRows - 1}`;
  }

  // 检查自身碰撞 (跳过头部)
  const bodyCollision = snake.value
    .slice(1)
    .some((s) => s.x === head.x && s.y === head.y);
  if (bodyCollision) {
    return `撞到自己身体！位置: (${head.x}, ${head.y})`;
  }

  return null;
};

const gameOver = () => {
  isPlaying.value = false;
  clearInterval(gameInterval);
  if (score.value > highScore.value) {
    highScore.value = score.value;
    localStorage.setItem("snakeHighScore", score.value.toString());
    ElMessage.success(`新纪录！得分: ${score.value}`);
  } else {
    ElMessage.error(`游戏结束！得分: ${score.value}`);
  }
};

// 键盘控制
const handleKeyPress = (e) => {
  if (e.key === " " || e.key === "Spacebar") {
    e.preventDefault();
    if (isPlaying.value) pauseGame();
    return;
  }

  if (!isPlaying.value || isPaused.value) return;

  const keyMap = {
    ArrowUp: "up",
    ArrowDown: "down",
    ArrowLeft: "left",
    ArrowRight: "right",
  };

  const dir = keyMap[e.key];
  if (dir && canChangeDirection(dir)) {
    nextDirection = dir;
  }
};

onMounted(() => {
  window.addEventListener("keydown", handleKeyPress);
});

onUnmounted(() => {
  window.removeEventListener("keydown", handleKeyPress);
  clearInterval(gameInterval);
});
</script>

<style scoped>
.game-card {
  margin: 0 auto;
  width: 95%;
  max-width: 1000px;
}

.card-header {
  display: flex;
  justify-content: space-around;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
}

.score-level {
  display: flex;
  gap: 12px;
  font-weight: bold;
  font-size: 15px;
  color: #333;
}

.game-container {
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

.game-board-wrapper {
  width: 95%;
  max-width: 600px;
  min-width: 300px;
  aspect-ratio: 1 / 1;
  background: #f0f0f0;
  border: 4px solid #333;
  overflow: hidden;
  position: relative;
}

.game-board {
  width: 100%;
  height: 100%;
  display: grid;
}
.game-info {
  display: flex;

  flex-direction: column;
  min-width: 250px;
}
.grid-cell {
  background-color: #fff;
  border-radius: 2px;
  height: 100%;
  width: 100%;
  transition: background-color 0.1s;
}

/* 边界单元格样式 */
.border-cell {
  background-color: #e0e0e0 !important;
  border: 1px solid #bdbdbd;
}

.snake-segment {
  background-color: #4caf50;
}

.snake-head {
  background-color: #2e7d32;
  position: relative;
}

.snake-head::after,
.snake-head::before {
  content: "";
  position: absolute;
  width: 25%;
  height: 25%;
  background: white;
  border-radius: 50%;
  top: 20%;
}

.snake-head::after {
  left: 20%;
}
.snake-head::before {
  right: 20%;
}

.food {
  background: radial-gradient(circle, #ff5722, #d84315);
  border-radius: 50%;
  animation: pulse 1s infinite alternate;
}

@keyframes pulse {
  to {
    transform: scale(1.15);
  }
}

/* 移动端控制按钮 */
.mobile-controls {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px; /* 增加垂直间距 */
  margin: 20px 0; /* 添加上下外边距 */
}

.control-row {
  display: flex;
  gap: 30px; /* 增加按钮之间的间距 */
  justify-content: center;
}

.mobile-controls .el-button {
  width: 70px; /* 增加按钮宽度 */
  height: 70px; /* 增加按钮高度 */
  font-size: 24px; /* 增加图标大小 */
  border: 2px solid #dcdfe6; /* 添加边框 */
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1); /* 添加阴影效果 */
  transition: all 0.3s ease; /* 添加过渡效果 */
}

.mobile-controls .el-button:active {
  transform: scale(0.95); /* 点击时的缩放效果 */
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.mobile-controls .el-button:not(:disabled):hover {
  background-color: #f5f7fa; /* 悬停效果 */
  border-color: #409eff;
}

/* 通用操作按钮 */
.action-buttons {
  display: flex;
  gap: 12px;
  justify-content: space-around;
  width: 100%;
  flex-wrap: wrap;
}

.info-alert {
  width: 100%;
  font-size: 14px;
  display: flex;
  gap: 12px;
}

/* 响应式：PC 隐藏虚拟按钮 */
@media (min-width: 769px) {
  .mobile-controls {
    display: none;
  }
}
</style>
