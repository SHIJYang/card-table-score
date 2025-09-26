<template>
  <Layout>
    <div class="gomoku-game">
      <el-card class="game-card">
        <template #header>
          <div class="card-header">
            <h2>⚫⚪ 五子棋游戏</h2>
            <div class="game-controls">
              <el-button type="primary" @click="startNewGame">新游戏</el-button>
              <el-button type="warning" @click="resetGame">重新开始</el-button>
              <span class="current-player" :class="currentPlayer">
                当前回合: {{ currentPlayer === "black" ? "黑子" : "白子" }}
              </span>
              <span class="game-status">{{ gameStatus }}</span>
            </div>
          </div>
        </template>

        <div class="game-container">
          <div class="game-board-container">
            <div class="game-board" ref="gameBoard">
              <!-- 棋盘网格 -->
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
            <el-alert title="游戏规则" type="info" :closable="false">
              <p>黑白双方轮流在棋盘上放置棋子</p>
              <p>先在横、竖、斜方向连成五子者获胜</p>
              <p>黑子先行，点击棋盘交叉点放置棋子</p>
            </el-alert>

            <div class="move-history">
              <h4>落子记录</h4>
              <div class="history-list">
                <div
                  v-for="(move, index) in moveHistory"
                  :key="index"
                  class="history-item"
                  :class="move.player"
                >
                  <span
                    >第{{ index + 1 }}手:
                    {{ move.player === "black" ? "黑子" : "白子" }}</span
                  >
                  <span
                    >({{ String.fromCharCode(65 + move.col)
                    }}{{ move.row + 1 }})</span
                  >
                </div>
              </div>
            </div>

            <div class="game-stats">
              <h4>游戏统计</h4>
              <div class="stats-grid">
                <div class="stat-item">
                  <span class="label">总步数:</span>
                  <span class="value">{{ moveHistory.length }}</span>
                </div>
                <div class="stat-item">
                  <span class="label">黑子:</span>
                  <span class="value">{{ blackStones }}</span>
                </div>
                <div class="stat-item">
                  <span class="label">白子:</span>
                  <span class="value">{{ whiteStones }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </el-card>
    </div>
  </Layout>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { ElMessage } from "element-plus";
import Layout from "../../components/Layout.vue";

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
    return winner.value === "black" ? "黑方获胜！" : "白方获胜！";
  }
  return "游戏中";
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
  ElMessage.info("新游戏开始！黑子先行");
};

// 重置游戏
const resetGame = () => {
  resetBoard();
  ElMessage.info("游戏已重置");
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

.current-player {
  font-weight: bold;
  font-size: 16px;
  padding: 4px 12px;
  border-radius: 4px;
}

.current-player.black {
  background-color: #000;
  color: white;
}

.current-player.white {
  background-color: #fff;
  color: #000;
  border: 1px solid #ccc;
}

.game-status {
  font-weight: bold;
  color: var(--primary-color);
  font-size: 16px;
}

.game-container {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 24px;
  padding: 20px;
}

.game-board-container {
  display: flex;
  justify-content: center;
  align-items: center;
}

.game-board {
  background: #deb887;
  border: 2px solid #8b4513;
  border-radius: 4px;
  padding: 20px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

.board-grid {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.board-row {
  display: flex;
  gap: 0;
}

.board-cell {
  width: 30px;
  height: 30px;
  position: relative;
  cursor: pointer;
  border: 1px solid transparent;
  transition: all 0.2s ease;
}

.board-cell::before {
  content: "";
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  height: 1px;
  background: #8b4513;
  transform: translateY(-50%);
}

.board-cell::after {
  content: "";
  position: absolute;
  left: 50%;
  top: 0;
  bottom: 0;
  width: 1px;
  background: #8b4513;
  transform: translateX(-50%);
}

.board-cell:hover {
  background-color: rgba(139, 69, 19, 0.1);
}

.board-cell.has-stone {
  cursor: not-allowed;
}

.board-cell.last-move::before,
.board-cell.last-move::after {
  background: #ff0000;
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
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.black-stone {
  background: radial-gradient(circle at 30% 30%, #666, #000);
}

.white-stone {
  background: radial-gradient(circle at 30% 30%, #fff, #ccc);
  border: 1px solid #999;
}

.game-info {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.move-history {
  background: #f9f9f9;
  border-radius: 8px;
  padding: 16px;
}

.move-history h4 {
  margin: 0 0 12px 0;
  color: var(--text-color);
}

.history-list {
  max-height: 200px;
  overflow-y: auto;
}

.history-item {
  display: flex;
  justify-content: space-between;
  padding: 8px 12px;
  margin: 4px 0;
  border-radius: 4px;
  font-size: 14px;
}

.history-item.black {
  background: rgba(0, 0, 0, 0.1);
}

.history-item.white {
  background: rgba(255, 255, 255, 0.5);
  border: 1px solid #eee;
}

.game-stats {
  background: #f9f9f9;
  border-radius: 8px;
  padding: 16px;
}

.game-stats h4 {
  margin: 0 0 12px 0;
  color: var(--text-color);
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
  padding: 8px;
  background: white;
  border-radius: 4px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.stat-item .label {
  font-size: 12px;
  color: var(--text-color-secondary);
  margin-bottom: 4px;
}

.stat-item .value {
  font-size: 18px;
  font-weight: bold;
  color: var(--primary-color);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .game-container {
    grid-template-columns: 1fr;
    gap: 16px;
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

  .board-cell {
    width: 20px;
    height: 20px;
  }

  .stone {
    width: 18px;
    height: 18px;
  }
}

@media (max-width: 480px) {
  .board-cell {
    width: 16px;
    height: 16px;
  }

  .stone {
    width: 14px;
    height: 14px;
  }

  .stats-grid {
    grid-template-columns: 1fr;
    gap: 8px;
  }
}
</style>
