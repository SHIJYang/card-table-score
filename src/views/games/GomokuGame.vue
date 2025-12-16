<template>
  <div class="common-layout gomoku-page">
    <el-container>
      <el-main style="padding: 20px;">
        <div class="game-wrapper">
          
          <div class="board-section">
            <el-card class="game-card" :body-style="{ padding: '0px' }">
              <template #header>
                <div class="card-header">
                  <div class="title-box">
                    <span class="icon">⚫⚪</span>
                    <h2>五子棋大作战</h2>
                  </div>
                  <div class="mobile-status is-mobile">
                    {{ currentPlayer === 'black' ? '黑方' : '白方' }}回合
                  </div>
                </div>
              </template>

              <div class="game-board-container">
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
              </div>
            </el-card>
          </div>

          <div class="sidebar-section">
            <el-card class="game-card info-card">
              <div class="turn-indicator" :class="currentPlayer">
                 <span class="turn-label">当前执子</span>
                 <div class="turn-badge">
                   <div class="mini-stone" :class="currentPlayer"></div>
                   <span>{{ currentPlayer === 'black' ? '黑方' : '白方' }}</span>
                 </div>
              </div>

              <div class="game-message" v-if="gameOver">
                 {{ winner === 'black' ? '🏆 黑方获胜!' : '🏆 白方获胜!' }}
              </div>
              <div class="game-message playing" v-else>
                 正在思考中...
              </div>

              <div class="control-group">
                <button class="cartoon-btn primary-btn" @click="startNewGame">
                  <el-icon><RefreshRight /></el-icon> 新游戏
                </button>
                <button class="cartoon-btn warning-btn" @click="undoMove" :disabled="moveHistory.length === 0 || gameOver">
                  <el-icon><Back /></el-icon> 悔棋
                </button>
              </div>
            </el-card>

            <el-card class="game-card stats-card">
              <div class="card-title">对局数据</div>
              <div class="stats-row">
                <div class="stat-box">
                  <div class="stat-val">{{ moveHistory.length }}</div>
                  <div class="stat-label">总步数</div>
                </div>
                <div class="stat-box">
                  <div class="stat-val black-text">{{ blackStones }}</div>
                  <div class="stat-label">黑子</div>
                </div>
                <div class="stat-box">
                  <div class="stat-val white-text">{{ whiteStones }}</div>
                  <div class="stat-label">白子</div>
                </div>
              </div>
            </el-card>
          </div>

        </div>
      </el-main>
    </el-container>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { ElMessage } from "element-plus";
import { RefreshRight, Back } from '@element-plus/icons-vue';

// --- 游戏逻辑部分保持不变 ---
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
  /* PC端默认变量 */
  --board-bg: #eccc80;
  --board-line: #5d4037; 
  --cell-size: 38px;  /* PC端固定大小 */
  --stone-size: 30px; /* PC端棋子大小 */
  --bg-color: #f5f7fa;
  --primary-color: #409eff;
  
  min-height: 100vh;
  background-color: var(--bg-color);
  font-family: 'Helvetica Neue', Helvetica, 'PingFang SC', sans-serif;
  overflow-x: hidden; /* 防止横向滚动条 */
}

.main-container {
  padding: 20px;
}

.game-wrapper {
  display: flex;
  justify-content: center;
  align-items: flex-start;
  gap: 30px;
  max-width: 1200px;
  margin: 0 auto;
}

/* --- 左侧棋盘 --- */
.board-section {
  flex: 0 0 auto;
  z-index: 10;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  background-color: #fff;
  border-bottom: 2px dashed #eee;
}

.title-box {
  display: flex;
  align-items: center;
  gap: 10px;
}
.title-box h2 {
  margin: 0;
  font-size: 1.25rem;
  color: #333;
}

.game-board-container {
  padding: 20px;
  background: #fffcf5;
  display: flex;
  justify-content: center;
}

.game-board {
  background-color: var(--board-bg);
  padding: calc(var(--cell-size) / 2); /* 动态内边距 */
  border-radius: 4px;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1), inset 0 0 20px rgba(93, 64, 55, 0.2);
}

.board-grid {
  display: flex;
  flex-direction: column;
  border-top: 2px solid var(--board-line);
  border-left: 2px solid var(--board-line);
}

.board-row {
  display: flex;
}

.board-cell {
  width: var(--cell-size);
  height: var(--cell-size);
  position: relative;
  cursor: pointer;
  border-right: 2px solid var(--board-line);
  border-bottom: 2px solid var(--board-line);
  box-sizing: border-box;
}

.star-point {
  width: 20%; /* 相对大小 */
  height: 20%;
  max-width: 8px;
  max-height: 8px;
  background-color: var(--board-line);
  border-radius: 50%;
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 1;
}

.stone {
  width: 85%; /* 棋子占比 */
  height: 85%;
  border-radius: 50%;
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%); /* 居中 */
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

/* --- 右侧侧边栏 --- */
.sidebar-section {
  width: 280px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.game-card {
  border-radius: 12px;
  border: 1px solid #e4e7ed;

  background: #fff;
  overflow: hidden;
}

.info-card { padding: 20px; text-align: center; }

.turn-indicator { margin-bottom: 15px; }
.turn-label { display: block; font-size: 0.9rem; color: #909399; margin-bottom: 8px; }
.turn-badge {
  display: inline-flex; align-items: center; gap: 8px;
  padding: 8px 20px; border-radius: 20px; font-weight: bold; font-size: 1.1rem;
}
.mini-stone { width: 14px; height: 14px; border-radius: 50%; }
.mini-stone.black { background: #000; border: 1px solid #666; }
.mini-stone.white { background: #fff; border: 1px solid #ccc; }

.game-message { height: 24px; margin-bottom: 20px; font-weight: bold; font-size: 1rem; }
.game-message.playing { color: #409eff; }

.control-group { display: flex; flex-direction: column; gap: 12px; }

.cartoon-btn {
  width: 100%; padding: 12px; border: none; border-radius: 8px;
  font-size: 1rem; cursor: pointer; display: flex; align-items: center; justify-content: center;
  gap: 8px; transition: all 0.1s;
}
.primary-btn { background-color: #409eff; color: white; box-shadow: 0 4px 0 #2b7bc7; }
.warning-btn { background-color: #fdf6ec; color: #e6a23c; border: 1px solid #fcead2; box-shadow: 0 4px 0 #ecdac1; }
.cartoon-btn:active { transform: translateY(4px); box-shadow: none; }
.cartoon-btn:disabled { opacity: 0.6; cursor: not-allowed; transform: none; box-shadow: none; background: #f5f7fa; color: #c0c4cc; }

.stats-card { padding: 16px; }
.stats-row { display: flex; justify-content: space-around; }
.stat-box { text-align: center; }
.stat-val { font-size: 1.2rem; font-weight: 800; color: #303133; }
.stat-label { font-size: 0.75rem; color: #909399; }

/* 动画 */
.pop-enter-active { animation: popIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
@keyframes popIn { from { transform: translate(-50%, -50%) scale(0); opacity: 0; } to { transform: translate(-50%, -50%) scale(1); opacity: 1; } }

/* 默认隐藏移动端元素 */
.is-mobile { display: none; }

/* --- 响应式核心修复 (Max Width 768px) --- */
@media (max-width: 768px) {
  /* 1. 重新定义 CSS 变量 */
  .gomoku-page {
    /* (屏幕宽度 - 左右Padding总量) / 15个格子 */
    --cell-size: calc((100vw - 32px) / 17);
  }

  /* 2. 布局改为纵向 */
  .main-container { padding: 10px 0; }
  .game-wrapper {
    flex-direction: column;
    align-items: center;
    gap: 15px;
  }

  /* 3. 棋盘容器优化 */
  .board-section {
    width: 100%;
    display: flex;
    justify-content: center;
  }
  .board-card {
    width: 100%;
    border-radius: 0; /* 移动端去掉圆角，贴边 */
    border-left: none;
    border-right: none;
  }
  .game-board-container {
    padding: 10px 5px; /* 减少外围留白 */
  }

  /* 4. 控制栏移到底部，变成横条 */
  .sidebar-section {
    width: 100%;
    padding: 0 10px;
    flex-direction: row;
    align-items: stretch;
  }
  .info-card {
    flex: 1;
    padding: 10px;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  /* 5. 移动端特定的显隐控制 */
  .mobile-hidden { display: none !important; }
  .is-mobile { display: block; }

  /* 6. 移动端按钮组调整为横向 */
  .control-group {
    flex-direction: row;
    width: auto;
    gap: 10px;
  }
  .cartoon-btn {
    padding: 8px 16px;
    width: auto;
    font-size: 0.9rem;
  }
  .btn-text { display: none; } /* 按钮只显示图标以节省空间 */
  
  /* 7. 移动端头部状态 */
  .mobile-status {
    font-size: 0.9rem;
    font-weight: bold;
  }
  .status-black { color: #333; }
  .status-white { color: #999; }
}
</style>