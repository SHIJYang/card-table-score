<template>
  <div class="common-layout">
    <el-container>
      <el-main style="padding: 0">
        <el-card class="game-card">
          <template #header>
            <div class="card-header">
              <h2>⚫⚪ 五子棋大作战</h2>
              <div class="game-controls">
                <el-button type="primary" @click="startNewGame" size="large" class="cartoon-btn">新游戏</el-button>
                <el-button type="warning" @click="resetGame" size="large" class="cartoon-btn">重置</el-button>
                <div class="status-badge" :class="currentPlayer">
                  当前: {{ currentPlayer === "black" ? "黑方" : "白方" }}
                </div>
                <span class="game-status">{{ gameStatus }}</span>
              </div>
            </div>
          </template>

          <div class="game-container">
            <div class="game-board-container">
              <div class="game-board" ref="gameBoard">
                <div class="board-grid">
                  <div v-for="row in 15" :key="row" class="board-row">
                    <div
                      v-for="col in 15"
                      :key="col"
                      class="board-cell"
                      :class="{
                        'has-stone': board[row - 1][col - 1] !== '',
                        'last-move':
                          lastMove &&
                          lastMove.row === row - 1 &&
                          lastMove.col === col - 1,
                      }"
                      @click="placeStone(row - 1, col - 1)"
                    >
                      <div
                        v-if="board[row - 1][col - 1] === 'black'"
                        class="stone black-stone"
                      ></div>
                      <div
                        v-else-if="board[row - 1][col - 1] === 'white'"
                        class="stone white-stone"
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div class="game-info">
              <el-alert title="游戏规则" type="info" :closable="false" class="cartoon-alert">
                <template #default>
                  <p>1. 黑白轮流落子</p>
                  <p>2. 五子连线获胜</p>
                  <p>3. 黑方先行</p>
                </template>
              </el-alert>

              <div class="move-history">
                <h4>📜 落子记录</h4>
                <div class="history-list">
                  <div
                    v-for="(move, index) in moveHistory"
                    :key="index"
                    class="history-item"
                    :class="move.player"
                  >
                    <span class="step-num">#{{ index + 1 }}</span>
                    <span>{{ move.player === "black" ? "黑" : "白" }}</span>
                    <span class="coord">({{ String.fromCharCode(65 + move.col) }}{{ move.row + 1 }})</span>
                  </div>
                </div>
              </div>

              <div class="game-stats">
                <h4>📊 统计</h4>
                <div class="stats-grid">
                  <div class="stat-item">
                    <span class="label">步数</span>
                    <span class="value">{{ moveHistory.length }}</span>
                  </div>
                  <div class="stat-item">
                    <span class="label">黑子</span>
                    <span class="value black-count">{{ blackStones }}</span>
                  </div>
                  <div class="stat-item">
                    <span class="label">白子</span>
                    <span class="value white-count">{{ whiteStones }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </el-card>
      </el-main>
    </el-container>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { ElMessage } from "element-plus";

// 游戏状态
const gameBoard = ref(null);
const board = ref(
  Array(15)
    .fill()
    .map(() => Array(15).fill(""))
);
const currentPlayer = ref("black");
const gameOver = ref(false);
const winner = ref("");
const moveHistory = ref([]);
const lastMove = ref(null);

// 计算属性
const gameStatus = computed(() => {
  if (gameOver.value) {
    return winner.value === "black" ? "🏆 黑方获胜！" : "🏆 白方获胜！";
  }
  return "⚔️ 激战中";
});

const blackStones = computed(() => {
  return board.value.flat().filter((cell) => cell === "black").length;
});

const whiteStones = computed(() => {
  return board.value.flat().filter((cell) => cell === "white").length;
});

// 开始新游戏
const startNewGame = () => {
  resetBoard();
};

// 重置游戏
const resetGame = () => {
  resetBoard();
};

// 重置棋盘
const resetBoard = () => {
  board.value = Array(15)
    .fill()
    .map(() => Array(15).fill(""));
  currentPlayer.value = "black";
  gameOver.value = false;
  winner.value = "";
  moveHistory.value = [];
  lastMove.value = null;
};

// 放置棋子
const placeStone = (row, col) => {
  if (gameOver.value || board.value[row][col] !== "") {
    return;
  }

  // 放置棋子
  board.value[row][col] = currentPlayer.value;
  lastMove.value = { row, col };

  // 记录历史
  moveHistory.value.push({
    player: currentPlayer.value,
    row,
    col,
    moveNumber: moveHistory.value.length + 1,
  });

  // 检查胜负
  if (checkWin(row, col, currentPlayer.value)) {
    gameOver.value = true;
    winner.value = currentPlayer.value;
    ElMessage.success(
      `${currentPlayer.value === "black" ? "黑方" : "白方"}获胜！`
    );
    return;
  }

  // 切换玩家
  currentPlayer.value = currentPlayer.value === "black" ? "white" : "black";
};

// 检查是否获胜
const checkWin = (row, col, player) => {
  const directions = [
    [0, 1], // 水平
    [1, 0], // 垂直
    [1, 1], // 右下对角线
    [1, -1], // 左下对角线
  ];

  for (const [dx, dy] of directions) {
    let count = 1;

    // 正向检查
    for (let i = 1; i <= 4; i++) {
      const newRow = row + dx * i;
      const newCol = col + dy * i;
      if (
        newRow >= 0 &&
        newRow < 15 &&
        newCol >= 0 &&
        newCol < 15 &&
        board.value[newRow][newCol] === player
      ) {
        count++;
      } else {
        break;
      }
    }

    // 反向检查
    for (let i = 1; i <= 4; i++) {
      const newRow = row - dx * i;
      const newCol = col - dy * i;
      if (
        newRow >= 0 &&
        newRow < 15 &&
        newCol >= 0 &&
        newCol < 15 &&
        board.value[newRow][newCol] === player
      ) {
        count++;
      } else {
        break;
      }
    }

    if (count >= 5) {
      return true;
    }
  }

  return false;
};

// 组件挂载时初始化
onMounted(() => {
  startNewGame();
});
</script>

<style scoped>
.gomoku-game {
  width: 100%;
  max-width: 1000px;
  margin: 0 auto;
}

.game-card {
  border-radius: var(--border-radius);
  border: 2px solid var(--border-color);
  box-shadow: var(--box-shadow);
  background: var(--bg-secondary);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0px 5px;
}

.card-header h2 {
  margin: 0;
  color: var(--text-color);
  font-size: 24px;
  text-shadow: 2px 2px 0px rgba(0,0,0,0.1);
}

.game-controls {
  display: flex;
  align-items: center;
  gap: 16px;
}

.status-badge {
  font-weight: bold;
  font-size: 16px;
  padding: 6px 16px;
  border-radius: 20px;
  border: 2px solid var(--border-color);
  box-shadow: 2px 2px 0px 0px var(--border-color);
}

.status-badge.black {
  background-color: var(--text-color);
  color: var(--bg-primary);
}

.status-badge.white {
  background-color: var(--bg-primary);
  color: var(--text-color);
}

.game-status {
  font-weight: 800;
  color: var(--primary-color);
  font-size: 18px;
  text-shadow: 1px 1px 0px var(--border-color);
}

.game-container {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 24px;
}

.game-board-container {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
  padding: 10px;
}

.game-board {
  background: #FDCB6E; /* 亮黄色木纹感 */
  border: 4px solid var(--border-color);
  border-radius: var(--border-radius);
  padding: 10px;
  box-shadow: 8px 8px 0px 0px rgba(0,0,0,0.2);
}

.board-grid {
  display: flex;
  flex-direction: column;
  background-color: transparent;
}

.board-row {
  display: flex;
}

.board-cell {
  width: 32px;
  height: 32px;
  position: relative;
  cursor: pointer;
}

/* 棋盘线 */
.board-cell::before {
  content: "";
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  height: 2px;
  background: var(--text-color);
  opacity: 0.6;
  transform: translateY(-50%);
}

.board-cell::after {
  content: "";
  position: absolute;
  left: 50%;
  top: 0;
  bottom: 0;
  width: 2px;
  background: var(--text-color);
  opacity: 0.6;
  transform: translateX(-50%);
}

.board-cell:hover::before, 
.board-cell:hover::after {
    opacity: 1;
    background: var(--primary-color);
}

.stone {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 2;
  border: 2px solid var(--border-color);
  box-shadow: 2px 2px 0px 0px rgba(0,0,0,0.2);
}

/* 黑子 - 像巧克力豆 */
.black-stone {
  background: #2d3436;
}
.black-stone::after {
    content: '';
    position: absolute;
    top: 5px;
    left: 5px;
    width: 8px;
    height: 4px;
    border-radius: 50%;
    background: rgba(255,255,255,0.4);
    transform: rotate(-45deg);
}

/* 白子 - 像牛奶糖 */
.white-stone {
  background: #ffffff;
}
.white-stone::after {
    content: '';
    position: absolute;
    top: 5px;
    left: 5px;
    width: 8px;
    height: 4px;
    border-radius: 50%;
    background: rgba(255,255,255,0.9);
    transform: rotate(-45deg);
}

/* 最新一步的标记 */
.board-cell.last-move .stone {
    box-shadow: 0 0 0 3px var(--danger-color);
}

.game-info {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.cartoon-alert {
    border: 2px solid var(--info-color);
    border-radius: var(--border-radius);
    background: var(--bg-primary);
}

.move-history {
  background: var(--bg-secondary);
  border-radius: var(--border-radius);
  padding: 16px;
  border: 2px solid var(--border-color);
  box-shadow: var(--box-shadow);
}

.history-list {
  max-height: 200px;
  overflow-y: auto;
}

.history-item {
  display: flex;
  justify-content: space-between;
  padding: 8px 12px;
  margin: 6px 0;
  border-radius: 8px;
  font-size: 14px;
  font-weight: bold;
  border: 1px solid var(--border-color);
}

.history-item.black {
  background: #dfe6e9;
  color: var(--text-color);
}

.history-item.white {
  background: #ffffff;
  color: var(--text-color);
}

.game-stats {
  background: var(--bg-secondary);
  border-radius: var(--border-radius);
  padding: 16px;
  border: 2px solid var(--border-color);
  box-shadow: var(--box-shadow);
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 10px;
  background: var(--bg-primary);
  border-radius: var(--border-radius);
  border: 2px solid var(--border-color);
  transition: transform 0.2s;
}

.stat-item:hover {
  transform: translateY(-4px);
  box-shadow: 2px 4px 0px 0px var(--border-color);
}

.stat-item .label {
  font-size: 12px;
  font-weight: bold;
  color: var(--text-color-secondary);
  margin-bottom: 4px;
}

.stat-item .value {
  font-size: 20px;
  font-weight: 900;
}

.cartoon-btn {
    border: 2px solid var(--border-color);
    box-shadow: 3px 3px 0px 0px var(--border-color);
    transition: all 0.1s;
}
.cartoon-btn:active {
    transform: translate(2px, 2px);
    box-shadow: 1px 1px 0px 0px var(--border-color);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .game-container {
    grid-template-columns: 1fr;
    gap: 16px;
  }
  .board-cell {
    width: 22px;
    height: 22px;
  }
  .stone {
    width: 18px;
    height: 18px;
  }
}
</style>