<template>
  <div class="common-layout">
    <el-container>
      <el-main class="game-container">
        <div class="game-info">
          <h1>2048</h1>
          <div class="score-panel">
            <div>分数: {{ score }}</div>
            <div>最高分: {{ highScore }}</div>
            <button @click="resetGame">重新开始</button>
          </div>
        </div>

        <div
          class="game-board"
          tabindex="0"
          ref="boardRef"
          @touchstart="handleTouchStart"
          @touchmove="handleTouchMove"
          @touchend="handleTouchEnd"
        >
          <div class="grid-cell" v-for="(row, rowIdx) in grid" :key="rowIdx">
            <div
              class="cell"
              v-for="(val, colIdx) in row"
              :key="colIdx"
              :class="[
                val ? 'cell-' + val : '',
                { 'cell-moved': movedCells.has(`${rowIdx},${colIdx}`) },
                { 'cell-merged': mergedCells.has(`${rowIdx},${colIdx}`) },
              ]"
            >
              <span class="cell-number">{{ val || "" }}</span>
            </div>
          </div>

          <!-- 游戏结束遮罩 -->
          <div class="game-over" v-if="isGameOver">
            <p>游戏结束!</p>
            <p>最终得分: {{ score }}</p>
            <button @click="resetGame">再来一局</button>
          </div>

          <!-- 胜利提示 -->
          <div class="game-win" v-if="isWin && !isGameOver">
            <p>恭喜你赢了!</p>
            <p>当前得分: {{ score }}</p>
            <button @click="continueGame">继续游戏</button>
            <button @click="resetGame">再来一局</button>
          </div>
        </div>
      </el-main>
    </el-container>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from "vue";

// 游戏状态
const grid = ref([]);
const score = ref(0);
const highScore = ref(0);
const isGameOver = ref(false);
const isWin = ref(false);
const movedCells = ref(new Set());
const mergedCells = ref(new Set());
const boardRef = ref(null);

// 触摸相关状态
const touchStartX = ref(0);
const touchStartY = ref(0);
const touchEndX = ref(0);
const touchEndY = ref(0);

// 初始化游戏
const initGame = () => {
  // 创建4x4空网格
  grid.value = Array(4)
    .fill()
    .map(() => Array(4).fill(0));
  score.value = 0;
  isGameOver.value = false;
  isWin.value = false;
  movedCells.value.clear();
  mergedCells.value.clear();

  // 随机生成两个初始数字
  generateRandomNumber();
  generateRandomNumber();

  // 读取最高分
  const savedHighScore = localStorage.getItem("2048_highScore");
  if (savedHighScore) {
    highScore.value = parseInt(savedHighScore);
  }
};

// 随机生成数字(90%概率2，10%概率4)
const generateRandomNumber = () => {
  const emptyCells = [];

  // 收集空单元格
  grid.value.forEach((row, rowIdx) => {
    row.forEach((val, colIdx) => {
      if (val === 0) {
        emptyCells.push({ rowIdx, colIdx });
      }
    });
  });

  if (emptyCells.length === 0) return false;

  // 随机选择一个空单元格
  const { rowIdx, colIdx } =
    emptyCells[Math.floor(Math.random() * emptyCells.length)];
  grid.value[rowIdx][colIdx] = Math.random() < 0.9 ? 2 : 4;
  return true;
};

// 处理移动逻辑
const move = (direction) => {
  let moved = false;
  movedCells.value.clear();
  mergedCells.value.clear();
  // 深拷贝当前网格用于比较
  const originalGrid = JSON.parse(JSON.stringify(grid.value));

  switch (direction) {
    case "up":
      for (let col = 0; col < 4; col++) {
        // 先处理移动，再处理合并
        // 移动
        for (let row = 1; row < 4; row++) {
          if (grid.value[row][col] !== 0) {
            let newRow = row;
            while (newRow > 0 && grid.value[newRow - 1][col] === 0) {
              grid.value[newRow - 1][col] = grid.value[newRow][col];
              grid.value[newRow][col] = 0;
              newRow--;
              moved = true;
            }
          }
        }
        // 合并
        for (let row = 1; row < 4; row++) {
          if (
            grid.value[row][col] !== 0 &&
            grid.value[row][col] === grid.value[row - 1][col]
          ) {
            grid.value[row - 1][col] *= 2;
            score.value += grid.value[row - 1][col];
            grid.value[row][col] = 0;
            moved = true;
            mergedCells.value.add(`${row - 1},${col}`);
          }
        }
        // 再次移动，处理合并后产生的空位
        for (let row = 1; row < 4; row++) {
          if (grid.value[row][col] !== 0) {
            let newRow = row;
            while (newRow > 0 && grid.value[newRow - 1][col] === 0) {
              grid.value[newRow - 1][col] = grid.value[newRow][col];
              grid.value[newRow][col] = 0;
              newRow--;
              moved = true;
            }
          }
        }
      }
      break;

    case "down":
      for (let col = 0; col < 4; col++) {
        // 移动
        for (let row = 2; row >= 0; row--) {
          if (grid.value[row][col] !== 0) {
            let newRow = row;
            while (newRow < 3 && grid.value[newRow + 1][col] === 0) {
              grid.value[newRow + 1][col] = grid.value[newRow][col];
              grid.value[newRow][col] = 0;
              newRow++;
              moved = true;
            }
          }
        }
        // 合并
        for (let row = 2; row >= 0; row--) {
          if (
            grid.value[row][col] !== 0 &&
            grid.value[row][col] === grid.value[row + 1][col]
          ) {
            grid.value[row + 1][col] *= 2;
            score.value += grid.value[row + 1][col];
            grid.value[row][col] = 0;
            moved = true;
            mergedCells.value.add(`${row + 1},${col}`);
          }
        }
        // 再次移动
        for (let row = 2; row >= 0; row--) {
          if (grid.value[row][col] !== 0) {
            let newRow = row;
            while (newRow < 3 && grid.value[newRow + 1][col] === 0) {
              grid.value[newRow + 1][col] = grid.value[newRow][col];
              grid.value[newRow][col] = 0;
              newRow++;
              moved = true;
            }
          }
        }
      }
      break;

    case "left":
      for (let row = 0; row < 4; row++) {
        // 移动
        for (let col = 1; col < 4; col++) {
          if (grid.value[row][col] !== 0) {
            let newCol = col;
            while (newCol > 0 && grid.value[row][newCol - 1] === 0) {
              grid.value[row][newCol - 1] = grid.value[row][newCol];
              grid.value[row][newCol] = 0;
              newCol--;
              moved = true;
            }
          }
        }
        // 合并
        for (let col = 1; col < 4; col++) {
          if (
            grid.value[row][col] !== 0 &&
            grid.value[row][col] === grid.value[row][col - 1]
          ) {
            grid.value[row][col - 1] *= 2;
            score.value += grid.value[row][col - 1];
            grid.value[row][col] = 0;
            moved = true;
            mergedCells.value.add(`${row},${col - 1}`);
          }
        }
        // 再次移动
        for (let col = 1; col < 4; col++) {
          if (grid.value[row][col] !== 0) {
            let newCol = col;
            while (newCol > 0 && grid.value[row][newCol - 1] === 0) {
              grid.value[row][newCol - 1] = grid.value[row][newCol];
              grid.value[row][newCol] = 0;
              newCol--;
              moved = true;
            }
          }
        }
      }
      break;

    case "right":
      for (let row = 0; row < 4; row++) {
        // 移动
        for (let col = 2; col >= 0; col--) {
          if (grid.value[row][col] !== 0) {
            let newCol = col;
            while (newCol < 3 && grid.value[row][newCol + 1] === 0) {
              grid.value[row][newCol + 1] = grid.value[row][newCol];
              grid.value[row][newCol] = 0;
              newCol++;
              moved = true;
            }
          }
        }
        // 合并
        for (let col = 2; col >= 0; col--) {
          if (
            grid.value[row][col] !== 0 &&
            grid.value[row][col] === grid.value[row][col + 1]
          ) {
            grid.value[row][col + 1] *= 2;
            score.value += grid.value[row][col + 1];
            grid.value[row][col] = 0;
            moved = true;
            mergedCells.value.add(`${row},${col + 1}`);
          }
        }
        // 再次移动
        for (let col = 2; col >= 0; col--) {
          if (grid.value[row][col] !== 0) {
            let newCol = col;
            while (newCol < 3 && grid.value[row][newCol + 1] === 0) {
              grid.value[row][newCol + 1] = grid.value[row][newCol];
              grid.value[row][newCol] = 0;
              newCol++;
              moved = true;
            }
          }
        }
      }
      break;
  }

  // 记录移动的单元格
  if (moved) {
    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 4; j++) {
        if (originalGrid[i][j] !== grid.value[i][j] && grid.value[i][j] !== 0) {
          movedCells.value.add(`${i},${j}`);
        }
      }
    }
  }

  return moved;
};

// 处理键盘事件
const handleKeyDown = (e) => {
  if (isGameOver.value) return;

  let moved = false;
  switch (e.key) {
    case "ArrowUp":
      moved = move("up");
      e.preventDefault();
      break;
    case "ArrowDown":
      moved = move("down");
      e.preventDefault();
      break;
    case "ArrowLeft":
      moved = move("left");
      e.preventDefault();
      break;
    case "ArrowRight":
      moved = move("right");
      e.preventDefault();
      break;
  }

  if (moved) {
    setTimeout(afterMove, 100); // 等待动画完成
  }
};

// 移动后操作
const afterMove = () => {
  if (movedCells.value.size > 0) {
    // 生成新数字
    const canGenerate = generateRandomNumber();

    // 检查是否获胜
    checkWin();

    // 检查游戏是否结束
    if (!canGenerate && !hasPossibleMoves()) {
      isGameOver.value = true;
      // 更新最高分
      if (score.value > highScore.value) {
        highScore.value = score.value;
        localStorage.setItem("2048_highScore", highScore.value.toString());
      }
    }
  }
};

// 检查是否获胜(出现2048)
const checkWin = () => {
  for (let i = 0; i < 4; i++) {
    for (let j = 0; j < 4; j++) {
      if (grid.value[i][j] >= 2048) {
        isWin.value = true;
        // 更新最高分
        if (score.value > highScore.value) {
          highScore.value = score.value;
          localStorage.setItem("2048_highScore", highScore.value.toString());
        }
        return;
      }
    }
  }
};

// 检查是否还有可能的移动
const hasPossibleMoves = () => {
  // 首先检查是否有空格子
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 4; col++) {
      if (grid.value[row][col] === 0) {
        return true; // 有空格子，游戏可以继续
      }
    }
  }

  // 如果没有空格子，检查是否有相邻相同的数字
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 4; col++) {
      const val = grid.value[row][col];

      // 检查右侧相邻
      if (col < 3 && grid.value[row][col + 1] === val) {
        return true;
      }
      // 检查下方相邻
      if (row < 3 && grid.value[row + 1][col] === val) {
        return true;
      }
      // 检查左侧相邻
      if (col > 0 && grid.value[row][col - 1] === val) {
        return true;
      }
      // 检查上方相邻
      if (row > 0 && grid.value[row - 1][col] === val) {
        return true;
      }
    }
  }

  return false; // 没有空格子且没有相邻相同数字，游戏结束
};

// 重新开始游戏
const resetGame = () => {
  initGame();
};

// 继续游戏（关闭胜利提示）
const continueGame = () => {
  isWin.value = false;
};

// 触摸事件处理
const handleTouchStart = (e) => {
  touchStartX.value = e.touches[0].clientX;
  touchStartY.value = e.touches[0].clientY;
};

const handleTouchMove = (e) => {
  e.preventDefault(); // 防止页面滚动
};

const handleTouchEnd = (e) => {
  if (isGameOver.value) return;

  touchEndX.value = e.changedTouches[0].clientX;
  touchEndY.value = e.changedTouches[0].clientY;

  const diffX = touchEndX.value - touchStartX.value;
  const diffY = touchEndY.value - touchStartY.value;
  const minSwipeDistance = 30; // 最小滑动距离

  // 判断滑动方向
  if (Math.abs(diffX) > Math.abs(diffY)) {
    // 水平滑动
    if (Math.abs(diffX) > minSwipeDistance) {
      if (diffX > 0) {
        move("right");
      } else {
        move("left");
      }
      setTimeout(afterMove, 100);
    }
  } else {
    // 垂直滑动
    if (Math.abs(diffY) > minSwipeDistance) {
      if (diffY > 0) {
        move("down");
      } else {
        move("up");
      }
      setTimeout(afterMove, 100);
    }
  }
};

// 监听分数变化，更新最高分
watch(score, (newVal) => {
  if (newVal > highScore.value) {
    highScore.value = newVal;
    localStorage.setItem("2048_highScore", highScore.value.toString());
  }
});

// 初始化
onMounted(() => {
  initGame();
  // 聚焦棋盘以接收键盘事件
  boardRef.value.focus();
  // 全局监听键盘事件
  window.addEventListener("keydown", handleKeyDown);
});

// 组件卸载时移除事件监听
onUnmounted(() => {
  window.removeEventListener("keydown", handleKeyDown);
});
</script>

<style scoped>
.game-container {
  font-family: Arial, sans-serif;
  max-width: 400px;
  margin: 0 auto;
  padding: 20px;
}

.game-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  color: var(--text-color-secondary);
}

.game-info h1 {
  margin: 0;
  font-size: 40px;
}

.score-panel {
  text-align: right;
}

.score-panel div {
  font-size: 1.2rem;
  margin-bottom: 10px;
  background-color: var(--selectBg);
  color: var(--text-color);
  padding: 5px 10px;
  border-radius: var(--border-radius);
  border: 1px solid var(--border-color);
}

button {
  background-color: var(--primary-color);
  color: white;
  border: 1px solid var(--border-color);
  padding: 8px 16px;
  border-radius: var(--border-radius);
  cursor: pointer;
  font-size: 1rem;
  transition: all var(--transition-duration);
}

button:hover {
  background-color: var(--primary-color-dark-2);
  transform: translateY(-1px);
  box-shadow: var(--box-shadow-hover);
}

.game-board {
  background-color: var(--selectBg);
  border-radius: var(--border-radius);
  padding: 10px;
  position: relative;
  outline: none;
  touch-action: manipulation;
  border: 2px solid var(--border-color);
}

.grid-cell {
  display: flex;
  margin-bottom: 10px;
}

.grid-cell:last-child {
  margin-bottom: 0;
}

.cell {
  width: 80px;
  height: 80px;
  margin-right: 10px;
  background-color: var(--bg-secondary);
  border-radius: var(--border-radius);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  transition: all var(--transition-duration) ease;
  border: 1px solid var(--border-color);
}

.cell:last-child {
  margin-right: 0;
}

/* 修复数字显示位置 */
.cell-number {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  font-size: 24px;
  font-weight: bold;
  line-height: 1;
  /* 确保文字垂直居中 */
  position: relative;
  top: 0;
  left: 0;
}

/* 数字方块颜色 */
.cell-2 {
  background-color: var(--decoration-colors-gold-light, #eee4da);
  color: var(--text-color);
}
.cell-4 {
  background-color: var(--decoration-colors-gold-medium, #ede0c8);
  color: var(--text-color);
}
.cell-8 {
  background-color: var(--decoration-colors-blue-light, #f2b179);
  color: white;
}
.cell-16 {
  background-color: var(--decoration-colors-blue-medium, #f59563);
  color: white;
}
.cell-32 {
  background-color: var(--decoration-colors-blue-dark, #f67c5f);
  color: white;
}
.cell-64 {
  background-color: var(--decoration-colors-red-light, #f65e3b);
  color: white;
}
.cell-128 {
  background-color: var(--decoration-colors-red-medium, #edcf72);
  color: white;
  font-size: 20px;
}
.cell-256 {
  background-color: var(--primary-color, #edcc61);
  color: white;
  font-size: 20px;
}
.cell-512 {
  background-color: var(--primary-color-light-3, #edc850);
  color: white;
  font-size: 20px;
}
.cell-1024 {
  background-color: var(--success-color, #edc53f);
  color: white;
  font-size: 16px;
}
.cell-2048 {
  background-color: var(--warning-color, #edc22e);
  color: white;
  font-size: 16px;
}

/* 动画效果 */
.cell-moved {
  animation: move 0.2s ease;
}

.cell-merged {
  animation: merge 0.3s ease;
}

@keyframes move {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
  100% {
    transform: scale(1);
  }
}

@keyframes merge {
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

/* 游戏结束和胜利遮罩 */
.game-over,
.game-win {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.7);
  border-radius: var(--border-radius);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  z-index: 10;
  border: 2px solid var(--border-color);
}

.game-over p,
.game-win p {
  margin: 10px 0;
  font-size: 1.5rem;
  color: #776e65;
  font-weight: bold;
}

.game-win {
  background-color: rgba(103, 194, 58, 0.7);
}

/* 响应式调整 - 重点修复手机端数字显示问题 */
@media (max-width: 420px) {
  .game-container {
    padding: 10px;
  }

  .cell {
    width: calc(25% - 8px);
    height: 0;
    padding-bottom: calc(25% - 8px);
    margin-right: 8px;
    position: relative;
  }

  .cell-number {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 100%;
    height: auto;
    font-size: 18px;
    display: flex;
    align-items: center;
    justify-content: center;
    line-height: 1;
  }

  /* 针对不同数字大小调整字体大小 */
  .cell-128 .cell-number,
  .cell-256 .cell-number,
  .cell-512 .cell-number {
    font-size: 16px;
  }

  .cell-1024 .cell-number,
  .cell-2048 .cell-number {
    font-size: 14px;
  }

  /* 游戏信息区域在手机端的调整 */
  .game-info {
    flex-direction: column;
    gap: 15px;
    text-align: center;
  }

  .game-info h1 {
    font-size: 32px;
  }

  .score-panel {
    text-align: center;
  }

  .score-panel div {
    font-size: 1rem;
    padding: 8px 12px;
    margin-bottom: 8px;
  }

  button {
    padding: 10px 20px;
    font-size: 0.9rem;
  }
}

/* 针对小屏幕手机的额外优化 */
@media (max-width: 360px) {
  .game-container {
    padding: 8px;
  }

  .cell-number {
    font-size: 16px;
  }

  .cell-128 .cell-number,
  .cell-256 .cell-number,
  .cell-512 .cell-number {
    font-size: 14px;
  }

  .cell-1024 .cell-number,
  .cell-2048 .cell-number {
    font-size: 12px;
  }

  .game-info h1 {
    font-size: 28px;
  }
}

/* 针对横屏模式的优化 */
@media (max-height: 500px) and (orientation: landscape) {
  .game-container {
    padding: 10px;
    max-width: 100%;
  }

  .game-info {
    flex-direction: row;
    margin-bottom: 15px;
  }

  .cell {
    width: 60px;
    height: 60px;
  }

  .cell-number {
    font-size: 18px;
  }
}
</style>
