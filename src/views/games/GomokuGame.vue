<template>
  <div class="gomoku-page">
    <el-main style="padding: 0">
      
       
          <div class="panel-header">
            <div class="title">⚫⚪ 五子棋大作战</div>
            <div class="turn-badge">
              <div class="mini-stone" :class="currentPlayer"></div>
              <span>{{ currentPlayer === 'black' ? '黑方' : '白方' }}回合</span>
            </div>
          </div>

          <div class="board-area">
            <div class="game-board">
              <div class="board-grid">
                <div v-for="row in 15" :key="row" class="board-row">
                  <div
                    v-for="col in 15"
                    :key="col"
                    class="board-cell"
                    :class="{
                      'last-move': lastMove && lastMove.row === row - 1 && lastMove.col === col - 1
                    }"
                    @click="placeStone(row - 1, col - 1)"
                  >
                    <transition name="pop">
                      <div
                        v-if="board[row - 1][col - 1] === 'black'"
                        class="stone black-stone"
                      ></div>
                      <div
                        v-else-if="board[row - 1][col - 1] === 'white'"
                        class="stone white-stone"
                      ></div>
                    </transition>
                  </div>
                </div>
              </div>
            </div>
            <div class="game-message" v-if="gameOver">
              🏆 {{ winner === 'black' ? '黑方获胜!' : '白方获胜!' }}
            </div>
          </div>

          <div class="panel-footer">
            <div class="stats-row">
              <div class="stat-item">
                <span class="val">{{ moveHistory.length }}</span>
                <span class="label">总步数</span>
              </div>
              <div class="stat-item">
                <span class="val black-text">{{ blackStones }}</span>
                <span class="label">黑子</span>
              </div>
              <div class="stat-item">
                <span class="val white-text">{{ whiteStones }}</span>
                <span class="label">白子</span>
              </div>
            </div>

            <div class="control-group">
              <button class="cartoon-btn primary-btn" @click="startNewGame">
                <el-icon><RefreshRight /></el-icon> 新游戏
              </button>
              <button class="cartoon-btn warning-btn" @click="undoMove" :disabled="moveHistory.length === 0 || gameOver">
                <el-icon><Back /></el-icon> 悔棋
              </button>
            </div>
          </div>
        
      
    </el-main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { ElMessage } from "element-plus";
import { RefreshRight, Back } from '@element-plus/icons-vue';

const board = ref(Array(15).fill().map(() => Array(15).fill("")));
const currentPlayer = ref("black");
const gameOver = ref(false);
const winner = ref("");
const moveHistory = ref([]);
const lastMove = ref(null);

const blackStones = computed(() => board.value.flat().filter((cell) => cell === "black").length);
const whiteStones = computed(() => board.value.flat().filter((cell) => cell === "white").length);

const startNewGame = () => {
  board.value = Array(15).fill().map(() => Array(15).fill(""));
  currentPlayer.value = "black";
  gameOver.value = false;
  winner.value = "";
  moveHistory.value = [];
  lastMove.value = null;
};

const undoMove = () => {
  if (moveHistory.value.length === 0 || gameOver.value) return;
  const last = moveHistory.value.pop();
  board.value[last.row][last.col] = "";
  if (moveHistory.value.length > 0) {
    const prev = moveHistory.value[moveHistory.value.length - 1];
    lastMove.value = { row: prev.row, col: prev.col };
  } else {
    lastMove.value = null;
  }
  currentPlayer.value = last.player;
  gameOver.value = false;
};

const placeStone = (row, col) => {
  if (gameOver.value || board.value[row][col] !== "") return;
  board.value[row][col] = currentPlayer.value;
  lastMove.value = { row, col };
  moveHistory.value.push({ player: currentPlayer.value, row, col, moveNumber: moveHistory.value.length + 1 });

  if (checkWin(row, col, currentPlayer.value)) {
    gameOver.value = true;
    winner.value = currentPlayer.value;
    ElMessage.success(`${currentPlayer.value === "black" ? "黑方" : "白方"}获胜！`);
    return;
  }
  currentPlayer.value = currentPlayer.value === "black" ? "white" : "black";
};

const checkWin = (row, col, player) => {
  const directions = [[0, 1], [1, 0], [1, 1], [1, -1]];
  for (const [dx, dy] of directions) {
    let count = 1;
    for (let i = 1; i <= 4; i++) {
      const r = row + dx * i, c = col + dy * i;
      if (r >= 0 && r < 15 && c >= 0 && c < 15 && board.value[r][c] === player) count++; else break;
    }
    for (let i = 1; i <= 4; i++) {
      const r = row - dx * i, c = col - dy * i;
      if (r >= 0 && r < 15 && c >= 0 && c < 15 && board.value[r][c] === player) count++; else break;
    }
    if (count >= 5) return true;
  }
  return false;
};

onMounted(() => {
  startNewGame();
});
</script>

<style scoped>
.gomoku-page {
  /* 棋盘配色（保留木质棋盘观感） */
  --board-bg: #eccc80;
  --board-line: #5d4037;
  --cell-size: 38px;

  font-family: 'Helvetica Neue', Helvetica, 'PingFang SC', sans-serif;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 2px dashed var(--border-color);
}
.title { font-size: 1.2rem; font-weight: 900; color: var(--text-color); }

.turn-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 14px;
  border-radius: 20px;
  border: 2px solid var(--border-color);
  background: var(--bg-primary);
  font-weight: bold;
  font-size: 0.95rem;
  color: var(--text-color);
}
.mini-stone { width: 14px; height: 14px; border-radius: 50%; flex-shrink: 0; }
.mini-stone.black { background: #000; border: 1px solid #666; }
.mini-stone.white { background: #fff; border: 1px solid #ccc; }

.board-area {
  display: flex;
  flex-direction: column;
  align-items: center;
 
}

.game-board {
  background-color: var(--board-bg);
  padding: calc(var(--cell-size) / 2);
  border-radius: 4px;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1), inset 0 0 20px rgba(93, 64, 55, 0.2);
  user-select: none;
  -webkit-user-select: none;
}

.board-grid {
  display: flex;
  flex-direction: column;
  border-top: 2px solid var(--board-line);
  border-left: 2px solid var(--board-line);
}

.board-row { display: flex; }

.board-cell {
  width: var(--cell-size);
  height: var(--cell-size);
  position: relative;
  cursor: pointer;
  border-right: 2px solid var(--board-line);
  border-bottom: 2px solid var(--board-line);
  box-sizing: border-box;
  touch-action: manipulation;
  -webkit-tap-highlight-color: transparent;
}

.stone {
  width: 85%;
  height: 85%;
  border-radius: 50%;
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 2;
  box-shadow: 1px 1px 2px rgba(0,0,0,0.3);
}

.black-stone { background: radial-gradient(circle at 35% 35%, #666, #000); }
.white-stone { background: radial-gradient(circle at 35% 35%, #fff, #ddd); }

.last-move::after {
  content: '';
  position: absolute;
  top: 50%; left: 50%;
  transform: translate(-50%, -50%);
  width: 20%; height: 20%;
  background: #f56c6c;
  border-radius: 50%;
  z-index: 3;
  box-shadow: 0 0 0 2px rgba(255,255,255,0.8);
}

.game-message {
  margin-top: 12px;
  font-weight: 900;
  font-size: 1.1rem;
  color: var(--success-color);
}

/* 页脚：对局数据 + 操作按钮，一条虚线与棋盘分隔 */
.panel-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  padding: 12px 16px;
  border-top: 2px dashed var(--border-color);
}

.stats-row { display: flex; gap: 18px; }
.stat-item { display: flex; flex-direction: column; align-items: center; min-width: 44px; }
.stat-item .val { font-size: 1.05rem; font-weight: 800; color: var(--text-color); }
.stat-item .val.black-text { color: #303133; }
.stat-item .val.white-text { color: #909399; }
.stat-item .label { font-size: 0.75rem; color: var(--text-color-secondary); }

.control-group { display: flex; gap: 10px; }

.cartoon-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 10px 18px;
  border: 2px solid var(--border-color);
  border-radius: 10px;
  font-size: 0.95rem;
  font-weight: bold;
  cursor: pointer;
  background: var(--bg-primary);
  color: var(--text-color);
  box-shadow: 3px 3px 0 var(--border-color);
  transition: all 0.1s;
  touch-action: manipulation;
  -webkit-tap-highlight-color: transparent;
}
.cartoon-btn:active { transform: translate(3px, 3px); box-shadow: none; }
.cartoon-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.primary-btn { background: var(--primary-color); color: #fff; }
.warning-btn { background: var(--warning-color); }

/* 动画 */
.pop-enter-active { animation: popIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
@keyframes popIn { from { transform: translate(-50%, -50%) scale(0); opacity: 0; } to { transform: translate(-50%, -50%) scale(1); opacity: 1; } }

/* 手机端：棋盘满屏最大（保持正方形），页脚纵向堆叠 */
@media (max-width: 600px) {
  .gomoku-page {
    /* 16 = 15格 + 棋盘半格内边距×2；8 = 网格边框 + 少量安全余量 */
    --cell-size: calc((100vw - 8px) / 16);
  }
  .gomoku-container { padding: 10px 8px; }
  .panel-header { padding: 10px 12px; }
  .title { font-size: 1.05rem; }
  .turn-badge { padding: 5px 10px; font-size: 0.85rem; }
  
  .game-board { border-radius: 0; }

  .panel-footer { flex-direction: column; align-items: stretch; }
  .stats-row { justify-content: space-around; }
  .control-group { flex-direction: row; }
  .control-group .cartoon-btn { flex: 1; justify-content: center; }
}
</style>
