<template>
  
    
      
        
            <div class="card-header">
              <h2 class="game-title">🐛 贪吃蛇</h2>
              <div class="score-level">
                <span class="badge score">🍎 {{ score }}</span>
                <span class="badge level">⚡ Lv.{{ level }}</span>
              </div>
            </div>
          

          <div class="game-container">
            <div
              class="game-board-wrapper"
              @touchstart.passive="handleTouchStart"
              @touchend.passive="handleTouchEnd"
            >
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
                <div class="d-pad-container"> 
                  <div class="control-row">
                    <button class="d-pad-btn up" @click="changeDirection('up')">
                      <el-icon><ArrowUp /></el-icon>
                    </button>
                  </div>
                  <div class="control-row middle">
                    <button class="d-pad-btn left" @click="changeDirection('left')">
                      <el-icon><ArrowLeft /></el-icon>
                    </button>
                    <button class="action-btn" @click="togglePause">
                        <el-icon><component :is="isPaused ? 'VideoPlay' : 'VideoPause'" /></el-icon>
                    </button>
                    <button class="d-pad-btn right" @click="changeDirection('right')">
                      <el-icon><ArrowRight /></el-icon>
                    </button>
                  </div>
                  <div class="control-row">
                    <button class="d-pad-btn down" @click="changeDirection('down')">
                      <el-icon><ArrowDown /></el-icon>
                    </button>
                  </div>
                </div>

                <div class="menu-buttons">
                    <el-button type="primary" size="large" class="cartoon-btn big-btn" @click="startGame" :disabled="isPlaying && !isPaused">
                        {{ isPlaying ? "游戏中..." : "开始游戏" }}
                    </el-button>
                    <el-button type="warning" size="large" class="cartoon-btn big-btn" @click="resetGame">重置</el-button>
                </div>
            </div>
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

// 手机端：在棋盘上滑动即可转向
let touchStartX = 0, touchStartY = 0;
const handleTouchStart = (e) => {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
};
const handleTouchEnd = (e) => {
    const dx = e.changedTouches[0].clientX - touchStartX;
    const dy = e.changedTouches[0].clientY - touchStartY;
    const minSwipeDistance = 24;
    if (Math.abs(dx) < minSwipeDistance && Math.abs(dy) < minSwipeDistance) return;
    if (Math.abs(dx) > Math.abs(dy)) changeDirection(dx > 0 ? 'right' : 'left');
    else changeDirection(dy > 0 ? 'down' : 'up');
};
onMounted(() => window.addEventListener('keydown', handleKeyPress));
onUnmounted(() => { window.removeEventListener('keydown', handleKeyPress); clearInterval(gameInterval); });
</script>

<style scoped>
  /* 容器调整 */
  .game-card {
    width: 100%;
    max-width: 600px;
    border: 4px solid var(--border-color);
    background: var(--bg-secondary);
    border-radius: var(--border-radius); /* 假设你有这个变量，如果没有请用 12px */
    box-shadow: 8px 8px 0 0 rgba(0,0,0,0.15);
    margin: 10px;
  }
  
  .card-header { display: flex; justify-content: space-between; align-items: center;margin: 20px; }
  .card-header h2 { font-weight: 900; color: var(--text-color); margin: 0; text-shadow: 2px 2px 0 var(--border-color); }
  
  .badge {
      padding: 6px 12px; border-radius: 20px; font-weight: bold; border: 2px solid var(--border-color);
      margin-left: 8px; color: var(--text-color);
  }
  .score { background: var(--warning-color); }
  .level { background: var(--info-color); color: white; }
  
  .game-container {
      display: flex; flex-direction: column; align-items: center; gap: 20px;
      padding: 10px 0 20px 0;
  }
  
  /* 棋盘样式 */
  .game-board-wrapper {
      background: #A8E6CF; /* 保持你原来的复古绿 */
      border: 5px solid var(--text-color);
      border-radius: 8px;
      padding: 4px;
      box-shadow: inset 4px 4px 10px rgba(0,0,0,0.1);
      /* 手机端在棋盘上滑动转向，不触发页面滚动/下拉刷新 */
      touch-action: none;
      user-select: none;
      -webkit-user-select: none;
  }
  .game-board {
      display: flex; 
      flex-direction: column;
  }
  .grid-row { display: flex; }
  
  .grid-cell { 
      /* 手机端适配：格子随屏幕宽度收缩，30格 + 边框留白后正好占满一屏 */
      width: min(calc((100vw - 64px) / 30), 11px); 
      height: min(calc((100vw - 64px) / 30), 11px); 
      box-sizing: border-box; 
      /* 关键：添加极淡的边框实现网格可视，不使用新变量 */
      border: 1px solid rgba(0, 0, 0, 0.05); 
  }
  
  /* 桌面端放大 */
  @media (min-width: 600px) { 
      .grid-cell { width: 16px; height: 16px; } 
  }
  
  /* 蛇身与食物 - 使用你原本的变量 */
  .snake-segment {
      background: var(--success-color);
      border-radius: 2px;
      border: 1px solid rgba(0,0,0,0.2);
      /* 消除网格线干扰，让蛇身看起来是连续的 */
      border-color: transparent; 
  }
  .snake-head {
      background: var(--text-color);
      border-radius: 4px;
      transform: scale(1.1);
      z-index: 2;
      box-shadow: 0 0 5px rgba(0,0,0,0.3);
  }
  .food {
      background: var(--danger-color);
      border-radius: 50%;
      box-shadow: 0 0 5px var(--danger-color);
      animation: pulse 0.8s infinite alternate;
      transform: scale(0.9);
  }
  @keyframes pulse { from { transform: scale(0.8); } to { transform: scale(1.1); } }
  
  /* 控制区优化 */
  .controls-area { display: flex; flex-direction: column; align-items: center; gap: 15px;  }
  
  .mobile-controls {
      background: var(--bg-primary); 
      padding: 15px; 
      border-radius: 50%;
      border: 4px solid var(--border-color);
      box-shadow: 6px 6px 0 0 rgba(0,0,0,0.2);
  }
  
  .control-row { display: flex; justify-content: center; gap: 10px; }
  .middle { margin: 5px 0; align-items: center; }
  
  /* 按钮放大优化 */
  .d-pad-btn {
      width: 60px; /* 放大到 60px */
      height: 60px; 
      border-radius: 12px;
      border: 3px solid var(--border-color);
      background: white; 
      font-size: 24px; /* 图标放大 */
      color: var(--text-color);
      cursor: pointer;
      box-shadow: 0 5px 0 var(--border-color); /* 增加厚度 */
      transition: all 0.1s;
      display: flex; align-items: center; justify-content: center;
      touch-action: manipulation; /* 防止快速连点触发双击缩放 */
      -webkit-tap-highlight-color: transparent;
  }
  
  .action-btn {
      width: 50px; /* 稍微小一点，区分功能 */
      height: 50px; 
      border-radius: 50%;
      border: 3px solid var(--border-color);
      background: var(--primary-color); 
      color: white; 
      font-size: 24px;
      cursor: pointer;
      box-shadow: 0 4px 0 var(--border-color); /* 使用 border-color 作为阴影以保持统一 */
      display: flex; align-items: center; justify-content: center;
  }
  
  .d-pad-btn:active, .action-btn:active {
      transform: translateY(4px); 
      box-shadow: none;
  }
  
  .menu-buttons {
      display: flex; gap: 15px; margin-top: 5px;
  }
  
  .cartoon-btn {
      border: 3px solid var(--border-color) !important;
      font-weight: 900 !important;
      box-shadow: 4px 4px 0 0 var(--border-color) !important;
      padding: 20px 30px !important; /* 增加点击区域 */
  }
  .cartoon-btn:active { transform: translate(4px, 4px); box-shadow: none !important; }
  </style>