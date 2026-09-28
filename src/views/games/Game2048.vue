<template>
  <div class="common-layout">
    <el-container>
      <el-main class="game-container">
        <div class="game-info">
          <div class="title-box">2048</div>
          <button class="restart-btn" @click="resetGame">🔄 重来</button>
          <div class="score-panel">
            <div class="score-box">
                <span class="label">分数</span>
                <span class="val">{{ score }}</span>
            </div>
            <div class="score-box best">
                <span class="label">最佳</span>
                <span class="val">{{ highScore }}</span>
            </div>
          </div>
          
        </div>

        <div class="game-board-outer">
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

            <div class="overlay game-over" v-if="isGameOver">
                <h3>😭 游戏结束!</h3>
                <p>得分: {{ score }}</p>
                <button class="restart-btn" @click="resetGame">再试一次</button>
            </div>
            <div class="overlay game-win" v-if="isWin && !isGameOver">
                <h3>🎉 赢啦!</h3>
                <button class="restart-btn" @click="continueGame">继续</button>
            </div>
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
  max-width: 450px; margin: 0 auto; padding: 20px;
  font-family: 'Comic Sans MS', 'Chalkboard SE', sans-serif;
}
.game-info {
  display: flex;
    justify-content: space-evenly;
    margin-bottom: 20px;
    align-items: center;
    flex-wrap: wrap;
}
.title-box {
    font-size: 48px; font-weight: 900; color: var(--primary-color);
    text-shadow: 3px 3px 0 var(--border-color);
}
.score-panel { display: flex; gap: 10px; }
.score-box {
    background: var(--border-color); padding: 5px 15px; border-radius: 8px;
    display: flex; flex-direction: column; align-items: center; min-width: 60px;
}
.score-box .label { font-size: 10px; color: #ccc; text-transform: uppercase; }
.score-box .val { font-size: 20px; font-weight: bold; color: white; }
.score-box.best { background: var(--warning-color); border: 2px solid var(--border-color); }
.score-box.best .val { color: var(--text-color); }

.restart-btn {
    background: var(--primary-color); color: white; border: 3px solid var(--border-color);
    padding: 10px; border-radius: 12px; font-weight: bold; cursor: pointer;
    box-shadow: 3px 3px 0 0 rgba(0,0,0,0.2);
}
.restart-btn:active { transform: translate(2px, 2px); box-shadow: none; }

.game-board-outer {
    background: #bbada0; padding: 10px; border-radius: 12px;
    border: 4px solid var(--border-color);
    box-shadow: 6px 6px 0 rgba(0,0,0,0.2);
    position: relative;
}
.game-board { outline: none; touch-action: none; user-select: none; -webkit-user-select: none; }
.grid-cell { display: flex; gap: 10px; margin-bottom: 10px; }
.grid-cell:last-child { margin-bottom: 0; }

.cell {
    width: 25%; aspect-ratio: 1; background: rgba(238, 228, 218, 0.35);
    border-radius: 8px; display: flex; align-items: center; justify-content: center;
    font-size: 28px; font-weight: bold; color: var(--text-color);
    position: relative; transition: all 0.1s ease-in-out;
}
.cell-number { z-index: 2; }

/* 糖果色方块配置 */
.cell-2 { background: #eee4da; border: 2px solid #ccc; }
.cell-4 { background: #ede0c8; border: 2px solid #ddd; }
.cell-8 { background: #f2b179; color: white; border: 2px solid #e67e22; }
.cell-16 { background: #f59563; color: white; border: 2px solid #d35400; }
.cell-32 { background: #f67c5f; color: white; border: 2px solid #c0392b; }
.cell-64 { background: #f65e3b; color: white; border: 2px solid #c0392b; }
.cell-128 { background: #edcf72; font-size: 24px; box-shadow: 0 0 10px #f1c40f; }
.cell-256 { background: #edcc61; font-size: 24px; box-shadow: 0 0 10px #f1c40f; }
.cell-512 { background: #edc850; font-size: 24px; }
.cell-1024 { background: #edc53f; font-size: 20px; }
.cell-2048 { background: #edc22e; font-size: 20px; border: 2px solid gold; }

.cell-moved { animation: pop 0.2s; }
.cell-merged { animation: pop 0.2s; z-index: 5; }
@keyframes pop { 0% { transform: scale(0.5); } 50% { transform: scale(1.1); } 100% { transform: scale(1); } }

.overlay {
    position: absolute; top: 0; left: 0; right: 0; bottom: 0;
    background: rgba(255, 255, 255, 0.7); display: flex; flex-direction: column;
    justify-content: center; align-items: center; z-index: 10;
    backdrop-filter: blur(4px); border-radius: 8px;
}
.overlay h3 { font-size: 40px; color: var(--text-color); margin: 0 0 20px 0; }

/* 手机端适配：压缩标题与间距，数字字号随格子收缩 */
@media (max-width: 480px) {
  .game-container { padding: 10px; }
  .game-info { margin-bottom: 12px; gap: 8px; }
  .title-box { font-size: 30px; text-shadow: 2px 2px 0 var(--border-color); }
  .score-box { min-width: 52px; padding: 4px 10px; }
  .score-box .val { font-size: 16px; }
  .restart-btn { padding: 8px 10px; font-size: 14px; touch-action: manipulation; }
  .game-board-outer { padding: 6px; border-width: 3px; box-shadow: 4px 4px 0 rgba(0,0,0,0.2); }
  .grid-cell { gap: 6px; margin-bottom: 6px; }
  .cell { border-radius: 6px; font-size: 22px; }
  .cell-128, .cell-256, .cell-512 { font-size: 18px; }
  .cell-1024, .cell-2048 { font-size: 15px; }
  .overlay h3 { font-size: 26px; margin-bottom: 12px; }
}
</style>