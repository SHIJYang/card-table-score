<template>
  <div class="common-layout">
    <el-container>
      <el-header>Header</el-header>
      <el-container>
        <el-aside width="200px">
          <topnav />
        </el-aside>
        <el-main>
          <el-card class="game-card">
            <template #header>
              <div class="card-header">
                <h2>🐍 贪吃蛇游戏</h2>
                <div class="game-controls">
                  <el-button
                    type="primary"
                    @click="startGame"
                    :disabled="isPlaying"
                  >
                    {{ isPlaying ? "游戏中" : "开始游戏" }}
                  </el-button>
                  <el-button type="warning" @click="resetGame"
                    >重新开始</el-button
                  >
                  <el-button type="info" @click="pauseGame" v-if="isPlaying">
                    {{ isPaused ? "继续游戏" : "暂停游戏" }}
                  </el-button>
                  <span class="score">得分: {{ score }}</span>
                  <span class="level">等级: {{ level }}</span>
                </div>
              </div>
            </template>

            <div class="game-container">
              <div class="game-board-wrapper">
                <div class="game-board" ref="gameBoardRef" id="game-board">
                  <!-- 游戏网格 -->
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

              <div class="game-info">
                <el-alert title="游戏说明" type="info" :closable="false">
                  <p>使用键盘方向键控制蛇的移动</p>
                  <p>吃到食物得分，碰到墙壁或自己游戏结束</p>
                  <p>每得10分升一级，速度加快</p>
                </el-alert>

                <div class="controls-info">
                  <h4>控制键:</h4>
                  <div class="key-grid">
                    <div class="key-item">↑</div>
                    <div class="key-item">↓</div>
                    <div class="key-item">←</div>
                    <div class="key-item">→</div>
                    <div class="key-item">空格</div>
                    <div class="key-desc">上</div>
                    <div class="key-desc">下</div>
                    <div class="key-desc">左</div>
                    <div class="key-desc">右</div>
                    <div class="key-desc">暂停/继续</div>
                  </div>
                </div>

                <!-- 添加游戏记录显示 -->
                <div class="game-record" v-if="highScore > 0">
                  <h4>最高记录: {{ highScore }}</h4>
                </div>
              </div>
            </div>
          </el-card>
        </el-main>
      </el-container>
    </el-container>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from "vue";
import { ElMessage } from "element-plus";
import Topnav from "../topnav/TopNav.vue";

// 游戏参数
const GRID_SIZE = 40; // 网格大小（像素）
const BOARD_WIDTH = 600; // 游戏板宽度
const BOARD_HEIGHT = 600; // 游戏板高度

// 计算网格行列数
const gridCols = Math.floor(BOARD_WIDTH / GRID_SIZE);
const gridRows = Math.floor(BOARD_HEIGHT / GRID_SIZE);

// 游戏状态
const isPlaying = ref(false); // 游戏是否正在进行
const isPaused = ref(false); // 游戏是否暂停
const score = ref(0); // 当前得分
const level = ref(1); // 当前等级
const highScore = ref(0); // 最高分记录
const gameBoardRef = ref(null); // 游戏画板引用

// 游戏参数
const gameSpeed = ref(150); // 初始速度
let gameInterval = null; // 游戏循环定时器
let direction = "right"; // 当前移动方向
let nextDirection = "right"; // 下一个移动方向

// 蛇和食物的位置
const snake = ref([{ x: 8, y: 5 }]); // 蛇身体数组，初始位置
const food = ref({ x: 15, y: 8 }); // 食物位置

// 初始化游戏 - 从本地存储加载最高分
onMounted(() => {
  const savedHighScore = localStorage.getItem("snakeHighScore");
  if (savedHighScore) {
    highScore.value = parseInt(savedHighScore);
  }
});

// 检查某个坐标是否是蛇身
const isSnakeSegment = (x, y) => {
  return snake.value.some((segment) => segment.x === x && segment.y === y);
};

// 检查某个坐标是否是蛇头
const isSnakeHead = (x, y) => {
  const head = snake.value[0];
  return head.x === x && head.y === y;
};

// 检查某个坐标是否是食物
const isFood = (x, y) => {
  return food.value.x === x && food.value.y === y;
};

// 开始游戏
const startGame = () => {
  if (isPlaying.value) return;

  isPlaying.value = true;
  isPaused.value = false;
  score.value = 0;
  level.value = 1;
  gameSpeed.value = 150;
  direction = "right";
  nextDirection = "right";
  snake.value = [{ x: 8, y: 5 }]; // 重置蛇的位置
  generateFood(); // 生成新食物

  // 设置游戏循环
  gameInterval = setInterval(gameLoop, gameSpeed.value);
  ElMessage.success("游戏开始！使用方向键控制");
};

// 暂停/继续游戏
const pauseGame = () => {
  if (!isPlaying.value) return;

  isPaused.value = !isPaused.value;

  if (isPaused.value) {
    clearInterval(gameInterval);
    ElMessage.info("游戏已暂停");
  } else {
    gameInterval = setInterval(gameLoop, gameSpeed.value);
    ElMessage.success("游戏继续");
  }
};

// 重置游戏
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
  const maxAttempts = 100; // 防止无限循环

  do {
    // 随机生成食物位置，确保在游戏区域内
    newFood = {
      x: Math.floor(Math.random() * gridCols),
      y: Math.floor(Math.random() * gridRows),
    };
    attempts++;

    // 如果尝试次数过多，说明可能没有空位了
    if (attempts > maxAttempts) {
      console.warn("无法生成食物，游戏区域已满");
      return;
    }
  } while (
    // 确保食物不会生成在蛇身上
    snake.value.some(
      (segment) => segment.x === newFood.x && segment.y === newFood.y
    )
  );

  food.value = newFood;
};

// 游戏主循环
const gameLoop = () => {
  if (!isPlaying.value || isPaused.value) return;

  direction = nextDirection; // 更新方向

  // 移动蛇头
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

  // 检查碰撞
  if (checkCollision(head)) {
    gameOver();
    return;
  }

  // 移动蛇身
  snake.value.unshift(head);

  // 检查是否吃到食物
  if (head.x === food.value.x && head.y === food.value.y) {
    score.value += 10; // 吃到食物得分

    // 每得100分升一级，速度加快
    if (score.value % 100 === 0) {
      level.value++;
      gameSpeed.value = Math.max(50, gameSpeed.value - 10); // 速度加快，但最低50ms
      clearInterval(gameInterval);
      gameInterval = setInterval(gameLoop, gameSpeed.value);
      ElMessage.info(`升级到 ${level.value} 级！速度加快`);
    }
    generateFood(); // 生成新食物
  } else {
    // 如果没有吃到食物，移除蛇尾
    snake.value.pop();
  }
};

// 检查碰撞
const checkCollision = (head) => {
  // 检查墙壁碰撞
  if (head.x < 0 || head.x >= gridCols || head.y < 0 || head.y >= gridRows) {
    return true; // 碰到墙壁
  }

  // 检查自身碰撞 - 跳过蛇头检查
  return snake.value
    .slice(1)
    .some((segment) => segment.x === head.x && segment.y === head.y);
};

// 游戏结束
const gameOver = () => {
  isPlaying.value = false;
  clearInterval(gameInterval);

  // 更新最高分记录
  if (score.value > highScore.value) {
    highScore.value = score.value;
    localStorage.setItem("snakeHighScore", score.value.toString());
    ElMessage.success(`新纪录！最终得分: ${score.value}`);
  } else {
    ElMessage.error(`游戏结束！最终得分: ${score.value}`);
  }
};

// 键盘控制
const handleKeyPress = (event) => {
  // 空格键控制暂停/继续
  if (event.key === " " || event.key === "Spacebar") {
    event.preventDefault(); // 防止页面滚动
    if (isPlaying.value) {
      pauseGame();
    }
    return;
  }

  if (!isPlaying.value || isPaused.value) return;

  // 方向键控制蛇的移动
  switch (event.key) {
    case "ArrowUp":
      if (direction !== "down") nextDirection = "up";
      break;
    case "ArrowDown":
      if (direction !== "up") nextDirection = "down";
      break;
    case "ArrowLeft":
      if (direction !== "right") nextDirection = "left";
      break;
    case "ArrowRight":
      if (direction !== "left") nextDirection = "right";
      break;
  }
};

// 组件挂载和卸载
onMounted(() => {
  window.addEventListener("keydown", handleKeyPress);

  // 确保DOM渲染完成后再调整尺寸
  setTimeout(() => {
    const board = document.getElementById("game-board");
    if (board) {
      board.style.width = `${BOARD_WIDTH}px`;
      board.style.height = `${BOARD_HEIGHT}px`;
    }
  }, 100);
});

onUnmounted(() => {
  window.removeEventListener("keydown", handleKeyPress);
  clearInterval(gameInterval);
});
</script>

<style scoped>
.game-card {
  max-width: 900px;
  margin: 0 auto;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
}

.game-controls {
  display: flex;
  align-items: center;
  gap: 15px;
  flex-wrap: wrap;
}

.score,
.level {
  font-weight: bold;
  font-size: 16px;
}

.game-container {
  display: flex;
  gap: 20px;
  flex-direction: row;
}

.game-board-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #f0f0f0;
  border: 2px solid #333;
  padding: 10px;
  border-radius: 8px;
}

.game-board {
  display: grid;
  grid-template-columns: repeat(v-bind(gridCols), 1fr);
  grid-template-rows: repeat(v-bind(gridRows), 1fr);
  gap: 2px;
  background-color: #ccc;
  position: relative;
  border: 1px solid #999;
  border-radius: 4px;
}

.grid-cell {
  aspect-ratio: 1;
  background-color: #fff;
  border-radius: 5px;
  transition: background-color 0.1s ease;
}

.snake-segment {
  background-color: #4caf50;
  border-radius: 6px;
  box-shadow: inset 0 0 3px rgba(0, 0, 0, 0.3);
}

.snake-head {
  background-color: #2e7d32;
  border-radius: 8px;
  position: relative;
  box-shadow: inset 0 0 5px rgba(0, 0, 0, 0.4);
}

.snake-head::after {
  content: "";
  position: absolute;
  width: 8px;
  height: 8px;
  background-color: #fff;
  border-radius: 50%;
  top: 6px;
  left: 6px;
  box-shadow: 2px 2px 0 #fff;
}

.snake-head::before {
  content: "";
  position: absolute;
  width: 8px;
  height: 8px;
  background-color: #fff;
  border-radius: 50%;
  top: 6px;
  right: 6px;
  box-shadow: -2px 2px 0 #fff;
}

.food {
  background: radial-gradient(circle, #ff5722, #d84315);
  border-radius: 50%;
  animation: pulse 1s infinite alternate;
  box-shadow: 0 0 8px rgba(255, 87, 34, 0.8);
}

@keyframes pulse {
  from {
    transform: scale(0.8);
    box-shadow: 0 0 8px rgba(255, 87, 34, 0.8);
  }
  to {
    transform: scale(1.2);
    box-shadow: 0 0 15px rgba(255, 87, 34, 1);
  }
}

.game-info {
  flex: 1;
  min-width: 250px;
}

.controls-info {
  margin-top: 20px;
}

.key-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 10px;
  margin-top: 10px;
}

.key-item {
  background-color: #e0e0e0;
  border: 1px solid #999;
  border-radius: 4px;
  padding: 10px;
  text-align: center;
  font-weight: bold;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.key-desc {
  text-align: center;
  padding: 8px;
  font-size: 12px;
  color: #666;
}

.game-record {
  margin-top: 15px;
  padding: 10px;
  background-color: #f5f5f5;
  border-radius: 4px;
  text-align: center;
  font-weight: bold;
  color: #2196f3;
  border: 1px solid #bbdefb;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .game-container {
    flex-direction: column;
  }

  .game-board-wrapper {
    width: 100%;
    overflow-x: auto;
  }

  .card-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }

  .game-board {
    transform: scale(0.8);
    transform-origin: top left;
  }
}
</style>
