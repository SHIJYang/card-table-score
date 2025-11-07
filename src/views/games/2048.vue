<template>
  <div class="common-layout">
    <el-container>
      <el-header style="padding: 0"><topnav /></el-header>

      <el-main class="game-container">
        <div class="game-info">
          <h1>2048</h1>
          <div class="score-panel">
            <div>分数: {{ score }}</div>
            <button @click="resetGame">重新开始</button>
          </div>
        </div>

        <div
          class="game-board"
          @keydown="handleKeyDown"
          @keyup="afterMove"
          tabindex="0"
          ref="boardRef"
        >
          <div class="grid-cell" v-for="(row, rowIdx) in grid" :key="rowIdx">
            <div
              class="cell"
              v-for="(val, colIdx) in row"
              :key="colIdx"
              :class="[
                'cell-' + val,
                { 'cell-moved': movedCells.has(`${rowIdx},${colIdx}`) },
              ]"
            >
              {{ val || "" }}
            </div>
          </div>
        </div>

        <div class="game-over" v-if="isGameOver">
          <p>游戏结束!</p>
          <p>最终得分: {{ score }}</p>
          <button @click="resetGame">再来一局</button>
        </div>
      </el-main>
    </el-container>
  </div>
</template>

<script setup>
import Topnav from "../topnav/TopNav.vue";
import FuzzyText from "../../components/gsap/FuzzyText.vue";
import { ref, onMounted, reactive } from "vue";

// 游戏状态
const grid = ref([]);
const score = ref(0);
const isGameOver = ref(false);
const movedCells = ref(new Set());
const boardRef = ref(null);

// 初始化游戏
const initGame = () => {
  // 创建4x4空网格
  grid.value = Array(4)
    .fill()
    .map(() => Array(4).fill(0));
  score.value = 0;
  isGameOver.value = false;

  // 随机生成两个初始数字
  generateRandomNumber();
  generateRandomNumber();
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

  switch (direction) {
    case "up":
      for (let col = 0; col < 4; col++) {
        for (let row = 1; row < 4; row++) {
          if (grid.value[row][col] !== 0) {
            let newRow = row;
            // 移动到最上方
            while (newRow > 0 && grid.value[newRow - 1][col] === 0) {
              grid.value[newRow - 1][col] = grid.value[newRow][col];
              grid.value[newRow][col] = 0;
              newRow--;
              moved = true;
              movedCells.value.add(`${newRow},${col}`);
            }
            // 合并相同数字
            if (
              newRow > 0 &&
              grid.value[newRow - 1][col] === grid.value[newRow][col]
            ) {
              grid.value[newRow - 1][col] *= 2;
              score.value += grid.value[newRow - 1][col];
              grid.value[newRow][col] = 0;
              moved = true;
              movedCells.value.add(`${newRow - 1},${col}`);
            }
          }
        }
      }
      break;

    case "down":
      for (let col = 0; col < 4; col++) {
        for (let row = 2; row >= 0; row--) {
          if (grid.value[row][col] !== 0) {
            let newRow = row;
            while (newRow < 3 && grid.value[newRow + 1][col] === 0) {
              grid.value[newRow + 1][col] = grid.value[newRow][col];
              grid.value[newRow][col] = 0;
              newRow++;
              moved = true;
              movedCells.value.add(`${newRow},${col}`);
            }
            if (
              newRow < 3 &&
              grid.value[newRow + 1][col] === grid.value[newRow][col]
            ) {
              grid.value[newRow + 1][col] *= 2;
              score.value += grid.value[newRow + 1][col];
              grid.value[newRow][col] = 0;
              moved = true;
              movedCells.value.add(`${newRow + 1},${col}`);
            }
          }
        }
      }
      break;

    case "left":
      for (let row = 0; row < 4; row++) {
        for (let col = 1; col < 4; col++) {
          if (grid.value[row][col] !== 0) {
            let newCol = col;
            while (newCol > 0 && grid.value[row][newCol - 1] === 0) {
              grid.value[row][newCol - 1] = grid.value[row][newCol];
              grid.value[row][newCol] = 0;
              newCol--;
              moved = true;
              movedCells.value.add(`${row},${newCol}`);
            }
            if (
              newCol > 0 &&
              grid.value[row][newCol - 1] === grid.value[row][newCol]
            ) {
              grid.value[row][newCol - 1] *= 2;
              score.value += grid.value[row][newCol - 1];
              grid.value[row][newCol] = 0;
              moved = true;
              movedCells.value.add(`${row},${newCol - 1}`);
            }
          }
        }
      }
      break;

    case "right":
      for (let row = 0; row < 4; row++) {
        for (let col = 2; col >= 0; col--) {
          if (grid.value[row][col] !== 0) {
            let newCol = col;
            while (newCol < 3 && grid.value[row][newCol + 1] === 0) {
              grid.value[row][newCol + 1] = grid.value[row][newCol];
              grid.value[row][newCol] = 0;
              newCol++;
              moved = true;
              movedCells.value.add(`${row},${newCol}`);
            }
            if (
              newCol < 3 &&
              grid.value[row][newCol + 1] === grid.value[row][newCol]
            ) {
              grid.value[row][newCol + 1] *= 2;
              score.value += grid.value[row][newCol + 1];
              grid.value[row][newCol] = 0;
              moved = true;
              movedCells.value.add(`${row},${newCol + 1}`);
            }
          }
        }
      }
      break;
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
};

// 移动后操作
const afterMove = () => {
  if (movedCells.value.size > 0) {
    // 生成新数字
    const canGenerate = generateRandomNumber();
    // 检查游戏是否结束
    if (!canGenerate && !hasPossibleMoves()) {
      isGameOver.value = true;
    }
  }
};

// 检查是否还有可能的移动
const hasPossibleMoves = () => {
  // 检查是否有相邻相同的数字
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 4; col++) {
      const val = grid.value[row][col];
      if (
        (col < 3 && grid.value[row][col + 1] === val) ||
        (row < 3 && grid.value[row + 1][col] === val)
      ) {
        return true;
      }
    }
  }
  return false;
};

// 重新开始游戏
const resetGame = () => {
  initGame();
};

// 初始化
onMounted(() => {
  initGame();
  // 聚焦棋盘以接收键盘事件
  boardRef.value.focus();
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
}

.score-panel {
  text-align: right;
}

.score-panel div {
  font-size: 1.2rem;
  margin-bottom: 10px;
}

button {
  background-color: #8f7a66;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
}

.game-board {
  background-color: #bbada0;
  border-radius: 6px;
  padding: 10px;
  position: relative;
  outline: none;
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
  background-color: #cdc1b4;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  font-weight: bold;
  transition: all 0.2s ease;
}

.cell:last-child {
  margin-right: 0;
}

/* 数字方块颜色 */
.cell-2 {
  background-color: #eee4da;
  color: #776e65;
}
.cell-4 {
  background-color: #ede0c8;
  color: #776e65;
}
.cell-8 {
  background-color: #f2b179;
  color: #f9f6f2;
}
.cell-16 {
  background-color: #f59563;
  color: #f9f6f2;
}
.cell-32 {
  background-color: #f67c5f;
  color: #f9f6f2;
}
.cell-64 {
  background-color: #f65e3b;
  color: #f9f6f2;
}
.cell-128 {
  background-color: #edcf72;
  color: #f9f6f2;
}
.cell-256 {
  background-color: #edcc61;
  color: #f9f6f2;
}
.cell-512 {
  background-color: #edc850;
  color: #f9f6f2;
}
.cell-1024 {
  background-color: #edc53f;
  color: #f9f6f2;
}
.cell-2048 {
  background-color: #edc22e;
  color: #f9f6f2;
}

/* 移动动画 */
.cell-moved {
  animation: scale 0.2s ease;
}

@keyframes scale {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.1);
  }
  100% {
    transform: scale(1);
  }
}

.game-over {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background-color: rgba(238, 228, 218, 0.9);
  padding: 20px;
  border-radius: 6px;
  text-align: center;
}

.game-over p {
  margin: 10px 0;
  font-size: 1.2rem;
}
</style>
