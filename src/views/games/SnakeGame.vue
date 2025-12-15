<template>
  <div class="common-layout">
    <el-container>
      <el-main style="padding: 0">
        <el-card class="game-card">
          <template #header>
            <div class="card-header">
              <h2>🐛 贪吃蛇</h2>
              <div class="score-level">
                <span class="badge score">🍎 {{ score }}</span>
                <span class="badge level">⚡ Lv.{{ level }}</span>
              </div>
            </div>
          </template>

          <div class="game-container">
            <div class="game-board-wrapper">
              <div class="game-board" ref="gameBoardRef" id="game-board">
                <div v-for="y in gridRows" :key="`row-${y}`" class="grid-row">
                  <div
                    v-for="x in gridCols"
                    :key="`cell-${x}-${y}`"
                    class="grid-cell"
                    :class="{
                      'snake-segment': isSnakeSegment(x, y),
                      'snake-head': isSnakeHead(x, y),
                      food: isFood(x, y),
                    }"
                  ></div>
                </div>
              </div>
            </div>

            <div class="controls-area">
                <div class="mobile-controls" v-if="true"> <div class="control-row">
                    <button class="d-pad-btn up" @click="changeDirection('up')"><el-icon><ArrowUp /></el-icon></button>
                  </div>
                  <div class="control-row middle">
                    <button class="d-pad-btn left" @click="changeDirection('left')"><el-icon><ArrowLeft /></el-icon></button>
                    <button class="action-btn" @click="togglePause">
                        <el-icon><component :is="isPaused ? 'VideoPlay' : 'VideoPause'" /></el-icon>
                    </button>
                    <button class="d-pad-btn right" @click="changeDirection('right')"><el-icon><ArrowRight /></el-icon></button>
                  </div>
                  <div class="control-row">
                    <button class="d-pad-btn down" @click="changeDirection('down')"><el-icon><ArrowDown /></el-icon></button>
                  </div>
                </div>

                <div class="menu-buttons">
                    <el-button type="primary" size="large" class="cartoon-btn" @click="startGame" :disabled="isPlaying && !isPaused">
                        {{ isPlaying ? "游戏中" : "开始游戏" }}
                    </el-button>
                    <el-button type="warning" size="large" class="cartoon-btn" @click="resetGame">重置</el-button>
                </div>
            </div>
          </div>
        </el-card>
      </el-main>
    </el-container>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from "vue";
import { ElMessage } from "element-plus";
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight, VideoPause, VideoPlay } from "@element-plus/icons-vue";

const GRID_SIZE = 30; // 稍微调大格子
const gridCols = 30;
const gridRows = 30;

const isPlaying = ref(false);
const isPaused = ref(false);
const score = ref(0);
const level = ref(1);
const gameSpeed = ref(150);
let gameInterval = null;
let direction = "right";
let nextDirection = "right";
const snake = ref([{ x: 8, y: 5 }]);
const food = ref({ x: 15, y: 8 });

const isSnakeSegment = (x, y) => snake.value.some((s) => s.x === x && s.y === y);
const isSnakeHead = (x, y) => snake.value[0] && snake.value[0].x === x && snake.value[0].y === y;
const isFood = (x, y) => food.value.x === x && food.value.y === y;

const canChangeDirection = (dir) => {
  const opposites = { up: "down", down: "up", left: "right", right: "left" };
  return direction !== opposites[dir];
};
const changeDirection = (dir) => { if (canChangeDirection(dir)) nextDirection = dir; };

const startGame = () => {
  if (isPlaying.value && !isPaused.value) return;
  isPlaying.value = true; isPaused.value = false;
  score.value = 0; level.value = 1; gameSpeed.value = 150;
  snake.value = [{ x: 10, y: 10 }, { x: 9, y: 10 }, { x: 8, y: 10 }]; // 初始长度3
  direction = "right"; nextDirection = "right";
  generateFood();
  clearInterval(gameInterval);
  gameInterval = setInterval(gameLoop, gameSpeed.value);
};

const togglePause = () => {
    if(!isPlaying.value) return;
    isPaused.value = !isPaused.value;
    if(isPaused.value) clearInterval(gameInterval);
    else gameInterval = setInterval(gameLoop, gameSpeed.value);
};

const resetGame = () => {
    clearInterval(gameInterval); isPlaying.value = false; isPaused.value = false;
    snake.value = [{ x: 8, y: 5 }];
};

const generateFood = () => {
  let newFood;
  do {
    newFood = { x: Math.floor(Math.random() * gridCols) + 1, y: Math.floor(Math.random() * gridRows) + 1 };
  } while (isSnakeSegment(newFood.x, newFood.y));
  food.value = newFood;
};

const gameLoop = () => {
  direction = nextDirection;
  const head = { ...snake.value[0] };
  if (direction === "up") head.y--;
  else if (direction === "down") head.y++;
  else if (direction === "left") head.x--;
  else if (direction === "right") head.x++;

  if (head.x < 1 || head.x > gridCols || head.y < 1 || head.y > gridRows || isSnakeSegment(head.x, head.y)) {
    gameOver(); return;
  }

  snake.value.unshift(head);
  if (head.x === food.value.x && head.y === food.value.y) {
    score.value += 10;
    if (score.value % 50 === 0) {
        level.value++; gameSpeed.value = Math.max(50, gameSpeed.value - 10);
        clearInterval(gameInterval); gameInterval = setInterval(gameLoop, gameSpeed.value);
    }
    generateFood();
  } else {
    snake.value.pop();
  }
};

const gameOver = () => {
  isPlaying.value = false; clearInterval(gameInterval);
  ElMessage.error(`💥 游戏结束! 得分: ${score.value}`);
};

const handleKeyPress = (e) => {
    const map = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right' };
    if(map[e.key]) changeDirection(map[e.key]);
};
onMounted(() => window.addEventListener('keydown', handleKeyPress));
onUnmounted(() => { window.removeEventListener('keydown', handleKeyPress); clearInterval(gameInterval); });
</script>

<style scoped>
.game-card {
  border: 4px solid var(--border-color);
  background: var(--bg-secondary);
  border-radius: var(--border-radius);
  box-shadow: 8px 8px 0 0 rgba(0,0,0,0.2);
}
.card-header { display: flex; justify-content: space-between; align-items: center; }
.card-header h2 { font-weight: 900; color: var(--text-color); margin: 0; }

.badge {
    padding: 6px 12px; border-radius: 20px; font-weight: bold; border: 2px solid var(--border-color);
    margin-left: 8px; color: var(--text-color);
}
.score { background: var(--warning-color); }
.level { background: var(--info-color); color: white; }

.game-container {
    display: flex; flex-direction: column; align-items: center; gap: 20px;
    padding: 20px;
}
.game-board-wrapper {
    background: #A8E6CF; /* 复古绿 */
    border: 6px solid var(--text-color);
    border-radius: 12px;
    padding: 4px;
    box-shadow: inset 4px 4px 10px rgba(0,0,0,0.1);
}
.game-board {
    display: grid;
    /* aspect-ratio: 1; */
}
.grid-row { display: flex; }
.grid-cell { width: 12px; height: 12px; box-sizing: border-box; } /* 默认更小，适合手机 */
@media (min-width: 600px) { .grid-cell { width: 18px; height: 18px; } }

.snake-segment {
    background: var(--success-color);
    border-radius: 50%;
    transform: scale(0.9);
    border: 1px solid rgba(0,0,0,0.1);
}
.snake-head {
    background: var(--text-color); /* 深色头 */
    border-radius: 4px;
    transform: scale(1.1);
    position: relative;
    z-index: 2;
}
.food {
    background: var(--danger-color);
    border-radius: 50%;
    box-shadow: 0 0 5px var(--danger-color);
    animation: pulse 0.8s infinite alternate;
}
@keyframes pulse { from { transform: scale(0.8); } to { transform: scale(1.2); } }

.controls-area { display: flex; flex-direction: column; align-items: center; gap: 15px; }
.mobile-controls {
    background: var(--bg-primary); padding: 15px; border-radius: 50%;
    border: 4px solid var(--border-color);
    box-shadow: 4px 4px 0 0 rgba(0,0,0,0.2);
}
.control-row { display: flex; justify-content: center; gap: 10px; }
.middle { margin: 5px 0; }

.d-pad-btn, .action-btn {
    width: 45px; height: 45px; border-radius: 12px;
    border: 3px solid var(--border-color);
    background: white; font-size: 20px;
    cursor: pointer;
    box-shadow: 0 4px 0 var(--border-color);
    transition: all 0.1s;
    display: flex; align-items: center; justify-content: center;
}
.d-pad-btn:active, .action-btn:active {
    transform: translateY(4px); box-shadow: none;
}
.d-pad-btn { background: var(--selectBg); }
.action-btn { background: var(--primary-color); color: white; border-radius: 50%; }

.cartoon-btn {
    border: 3px solid var(--border-color) !important;
    font-weight: 900 !important;
    box-shadow: 3px 3px 0 0 var(--border-color) !important;
}
.cartoon-btn:active { transform: translate(3px, 3px); box-shadow: none !important; }
</style>