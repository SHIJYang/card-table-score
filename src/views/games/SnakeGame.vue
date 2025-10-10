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
                  <span class="score">得分: {{ score }}</span>
                  <span class="level">等级: {{ level }}</span>
                </div>
              </div>
            </template>

            <div class="game-container">
              <div class="game-board" ref="gameBoard">
                <!-- 蛇和食物通过CSS绘制 -->
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
                  </div>
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
// 游戏状态
const isPlaying = ref(false);
const score = ref(0);
const level = ref(1);
const gameBoard = ref(null);

// 游戏参数
const gridSize = 20;
const gameSpeed = ref(150); // 初始速度
let gameInterval = null;
let direction = "right";
let nextDirection = "right";

// 蛇和食物的位置
const snake = ref([{ x: 10, y: 10 }]);
const food = ref({ x: 15, y: 15 });

// 开始游戏
const startGame = () => {
  if (isPlaying.value) return;

  isPlaying.value = true;
  score.value = 0;
  level.value = 1;
  gameSpeed.value = 150;
  direction = "right";
  nextDirection = "right";
  snake.value = [{ x: 10, y: 10 }];
  generateFood();

  gameInterval = setInterval(gameLoop, gameSpeed.value);
  ElMessage.success("游戏开始！使用方向键控制");
};

// 重置游戏
const resetGame = () => {
  clearInterval(gameInterval);
  isPlaying.value = false;
  startGame();
};

// 生成食物
const generateFood = () => {
  let newFood;
  do {
    newFood = {
      x: Math.floor(
        Math.random() * (gameBoard.value?.clientWidth / gridSize || 30)
      ),
      y: Math.floor(
        Math.random() * (gameBoard.value?.clientHeight / gridSize || 30)
      ),
    };
  } while (
    snake.value.some(
      (segment) => segment.x === newFood.x && segment.y === newFood.y
    )
  );

  food.value = newFood;
};

// 游戏主循环
const gameLoop = () => {
  if (!isPlaying.value) return;

  direction = nextDirection;

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
    score.value += 10;
    if (score.value % 100 === 0) {
      level.value++;
      gameSpeed.value = Math.max(50, gameSpeed.value - 10);
      clearInterval(gameInterval);
      gameInterval = setInterval(gameLoop, gameSpeed.value);
      ElMessage.info(`升级到 ${level.value} 级！速度加快`);
    }
    generateFood();
  } else {
    snake.value.pop();
  }

  // 更新游戏画面
  updateGameBoard();
};

// 检查碰撞
const checkCollision = (head) => {
  // 检查墙壁碰撞
  const boardWidth = Math.floor(
    (gameBoard.value?.clientWidth || 600) / gridSize
  );
  const boardHeight = Math.floor(
    (gameBoard.value?.clientHeight || 400) / gridSize
  );

  if (
    head.x < 0 ||
    head.x >= boardWidth ||
    head.y < 0 ||
    head.y >= boardHeight
  ) {
    return true;
  }

  // 检查自身碰撞
  return snake.value.some(
    (segment) => segment.x === head.x && segment.y === head.y
  );
};

// 游戏结束
const gameOver = () => {
  isPlaying.value = false;
  clearInterval(gameInterval);
  ElMessage.error(`游戏结束！最终得分: ${score.value}`);
};

// 更新游戏画面
const updateGameBoard = () => {
  if (!gameBoard.value) return;

  const board = gameBoard.value;
  board.innerHTML = "";

  // 绘制蛇
  snake.value.forEach((segment, index) => {
    const snakeSegment = document.createElement("div");
    snakeSegment.className = `snake-segment ${index === 0 ? "snake-head" : ""}`;
    snakeSegment.style.left = `${segment.x * gridSize}px`;
    snakeSegment.style.top = `${segment.y * gridSize}px`;
    board.appendChild(snakeSegment);
  });

  // 绘制食物
  const foodElement = document.createElement("div");
  foodElement.className = "food";
  foodElement.style.left = `${food.value.x * gridSize}px`;
  foodElement.style.top = `${food.value.y * gridSize}px`;
  board.appendChild(foodElement);
};

// 键盘控制
const handleKeyPress = (event) => {
  if (!isPlaying.value) return;

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
  // 初始化游戏画面
  setTimeout(() => {
    updateGameBoard();
  }, 100);
});

onUnmounted(() => {
  window.removeEventListener("keydown", handleKeyPress);
  clearInterval(gameInterval);
});
</script>

<style scoped>
.snake-game {
  width: 100%;
  max-width: 800px;
  margin: 0 auto;
}

.game-card {
  border-radius: var(--border-radius);
  box-shadow: var(--box-shadow);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
}

.card-header h2 {
  margin: 0;
  color: var(--text-color);
  font-size: 24px;
}

.game-controls {
  display: flex;
  align-items: center;
  gap: 16px;
}

.score,
.level {
  font-weight: bold;
  font-size: 16px;
  color: var(--primary-color);
}

.game-container {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 24px;
  padding: 20px;
}

.game-board {
  width: 100%;
  height: 400px;
  background: #f0f0f0;
  border: 2px solid #ddd;
  border-radius: 8px;
  position: relative;
  overflow: hidden;
}

.snake-segment {
  position: absolute;
  width: 18px;
  height: 18px;
  background: var(--success-color);
  border-radius: 3px;
  transition: all 0.1s ease;
}

.snake-head {
  background: var(--primary-color);
  border-radius: 5px;
}

.food {
  position: absolute;
  width: 16px;
  height: 16px;
  background: var(--danger-color);
  border-radius: 50%;
  animation: pulse 1s infinite;
}

@keyframes pulse {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.2);
  }
  100% {
    transform: scale(1);
  }
}

.game-info {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.controls-info h4 {
  margin: 0 0 12px 0;
  color: var(--text-color);
}

.key-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
  max-width: 120px;
}

.key-item {
  width: 40px;
  height: 40px;
  background: var(--primary-color);
  color: white;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 16px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .game-container {
    grid-template-columns: 1fr;
    gap: 16px;
  }

  .game-board {
    height: 300px;
  }

  .card-header {
    flex-direction: column;
    gap: 12px;
    text-align: center;
  }

  .game-controls {
    justify-content: center;
    flex-wrap: wrap;
  }
}

@media (max-width: 480px) {
  .game-board {
    height: 250px;
  }

  .snake-segment {
    width: 14px;
    height: 14px;
  }

  .food {
    width: 12px;
    height: 12px;
  }
}
</style>
