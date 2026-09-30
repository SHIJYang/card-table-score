<template>
  <div class="punigo-page">
    <el-main style="padding: 0">
      <div class="panel-header">
        <div class="title">🙂 表情围棋 · Punigo</div>
        <div class="turn-badge">
          <template v-if="!gameOver">
            <div class="mini-stone" :class="currentPlayer === BLACK ? 'black' : 'white'"></div>
            <span v-if="aiThinking">AI 思考中…</span>
            <span v-else>{{ currentPlayer === BLACK ? '黑方' : '白方' }}回合</span>
          </template>
          <template v-else>🏁 对局结束</template>
        </div>
      </div>

      <div class="settings-bar">
        <div class="seg-group">
          <span class="seg-label">棋盘</span>
          <button
            v-for="n in [5, 7, 9]"
            :key="n"
            class="seg-btn"
            :class="{ active: boardSize === n }"
            @click="changeSize(n)"
          >{{ n }}路</button>
        </div>
        <div class="seg-group">
          <span class="seg-label">执子</span>
          <button class="seg-btn" :class="{ active: playerColor === BLACK }" @click="setColor(BLACK)">执黑</button>
          <button class="seg-btn" :class="{ active: playerColor === WHITE }" @click="setColor(WHITE)">执白</button>
        </div>
        <div class="seg-group">
          <span class="seg-label">表情</span>
          <button class="seg-btn" :class="{ active: showFaces }" @click="showFaces = !showFaces">
            {{ showFaces ? '开' : '关' }}
          </button>
        </div>
      </div>

      <div class="board-area">
        <div class="game-board">
          <!-- 视觉层：只负责画线（9条线，外圈右/下不画多余的线） -->
          <div class="board-grid" :style="gridStyle">
            <template v-for="(row, r) in board" :key="r">
              <div
                v-for="(cell, c) in row"
                :key="c"
                class="board-cell"
                :class="{ 'edge-r': c === boardSize - 1, 'edge-b': r === boardSize - 1 }"
              >
                <span v-if="isStar(r, c)" class="star-point"></span>
              </div>
            </template>
          </div>

          <!-- 交互层：每个格子中心对准一个交叉点，点击判定以交叉点为中心（四周各半格） -->
          <div class="click-layer" :style="gridStyle">
            <template v-for="(row, r) in board" :key="r">
              <div
                v-for="(cell, c) in row"
                :key="c"
                class="click-cell"
                :class="{ 'no-drop': !isPlayerTurn }"
                @click="onCellClick(r, c)"
                @mouseenter="hoverCell = { r, c }"
                @mouseleave="hoverCell = null"
              >
                <div
                  v-if="cell === 0 && showGhost(r, c)"
                  class="stone ghost"
                  :class="playerColor === BLACK ? 'black-stone' : 'white-stone'"
                ></div>

                <transition name="pop">
                  <div
                    v-if="cell !== 0"
                    class="stone"
                    :class="[cell === BLACK ? 'black-stone' : 'white-stone', { atari: inAtari(r, c) }]"
                  >
                    <span v-if="showFaces" class="face">{{ faceEmoji(r, c) }}</span>
                    <span v-if="isLastMove(r, c)" class="last-mark" :class="cell === BLACK ? 'on-black' : 'on-white'"></span>
                  </div>
                </transition>
              </div>
            </template>
          </div>

          <transition name="fade">
            <div v-if="captureFx" :key="captureFx.key" class="capture-fx" :class="captureFx.by === BLACK ? 'by-black' : 'by-white'">
              提子 ×{{ captureFx.count }}
            </div>
          </transition>

          <transition name="fade">
            <div v-if="gameOver" class="result-overlay">
              <div class="result-card">
                <div class="result-title">{{ resultText }}</div>
                <div class="result-score">
                  <span>⚫ 黑 {{ counts.black }}</span>
                  <i>vs</i>
                  <span>⚪ 白 {{ counts.white }}</span>
                </div>
                <button class="cartoon-btn primary-btn" @click="startNewGame">再来一局</button>
              </div>
            </div>
          </transition>
        </div>

        <div class="hint-line">💡 棋子的表情代表“气”的数量：😄 3口气以上 · 😐 2口气 · 😰 只剩1口气，快被吃啦！</div>
      </div>

      <div class="panel-footer">
        <div class="stats-row">
          <div class="stat-item">
            <span class="val black-text">{{ counts.black }}</span>
            <span class="label">黑子</span>
          </div>
          <div class="stat-item">
            <span class="val white-text">{{ counts.white }}</span>
            <span class="label">白子</span>
          </div>
          <div class="stat-item">
            <span class="val">{{ blackCaptured }}</span>
            <span class="label">黑提子</span>
          </div>
          <div class="stat-item">
            <span class="val">{{ whiteCaptured }}</span>
            <span class="label">白提子</span>
          </div>
          <div class="stat-item">
            <span class="val">{{ moveCount }}</span>
            <span class="label">手数</span>
          </div>
        </div>

        <div class="control-group">
          <button class="cartoon-btn primary-btn" @click="startNewGame">
            <el-icon><RefreshRight /></el-icon> 新对局
          </button>
          <button class="cartoon-btn warning-btn" :disabled="!canUndo" @click="undo">
            <el-icon><Back /></el-icon> 悔棋
          </button>
          <button class="cartoon-btn" :disabled="!isPlayerTurn || gameOver" @click="playerPass">
            <el-icon><VideoPause /></el-icon> 停一手
          </button>
        </div>
      </div>

      <div class="rules-panel">
        <button class="rules-toggle" @click="rulesOpen = !rulesOpen">
          📖 4条基本规则 {{ rulesOpen ? '▲' : '▼' }}
        </button>
        <transition name="slide">
          <ol v-if="rulesOpen" class="rules-list">
            <li><b>轮流落子：</b>黑先白后，棋子落在交叉点上，落子后不能移动。</li>
            <li><b>无气提子：</b>与棋子直线相连的空点叫“气”，一组棋子的气被堵光就会被提走。</li>
            <li><b>禁重复局面：</b>不能落子后立刻还原对方上一手之前的局面（打劫规则）。</li>
            <li><b>数子定胜负：</b>双方连续停一手则对局结束，棋盘上子多的一方获胜。</li>
          </ol>
        </transition>
      </div>
    </el-main>
  </div>
</template>

<script setup>
import { ref, computed } from "vue";
import { ElMessage } from "element-plus";
import { RefreshRight, Back, VideoPause } from '@element-plus/icons-vue';

const EMPTY = 0, BLACK = 1, WHITE = 2;

const boardSize = ref(9);
const board = ref(createBoard(9));
const currentPlayer = ref(BLACK);
const playerColor = ref(BLACK);
const gameOver = ref(false);
const showFaces = ref(true);
const rulesOpen = ref(false);
const aiThinking = ref(false);
const hoverCell = ref(null);
const lastMove = ref(null);
const moveCount = ref(0);
const blackCaptured = ref(0); // 黑方提走的白子数
const whiteCaptured = ref(0); // 白方提走的黑子数
const passCount = ref(0);
const captureFx = ref(null);
const resultText = ref("");

// 快照：{ board, current, passCount, blackCaptured, whiteCaptured, moveCount, lastMove, str }
const history = ref([]);
// 禁重复局面：出现过的所有局面（局面序列化字符串）
let koHistory = new Set();

let aiTimer = null;
let fxTimer = null;

const gridStyle = computed(() => ({
  gridTemplateColumns: `repeat(${boardSize.value}, 1fr)`,
  gridTemplateRows: `repeat(${boardSize.value}, 1fr)`,
}));

const counts = computed(() => {
  let black = 0, white = 0;
  for (const row of board.value) for (const c of row) {
    if (c === BLACK) black++;
    else if (c === WHITE) white++;
  }
  return { black, white };
});

const isPlayerTurn = computed(() => !gameOver.value && !aiThinking.value && currentPlayer.value === playerColor.value);
const canUndo = computed(() => history.value.length > 0 && !aiThinking.value && !gameOver.value);

function createBoard(n) {
  return Array.from({ length: n }, () => Array(n).fill(EMPTY));
}

/* ---------------- 围棋规则引擎 ---------------- */

function inBounds(r, c) {
  return r >= 0 && r < boardSize.value && c >= 0 && c < boardSize.value;
}

function neighbors(r, c) {
  return [[r - 1, c], [r + 1, c], [r, c - 1], [r, c + 1]].filter(([nr, nc]) => inBounds(nr, nc));
}

// 求一组连通同色棋子及其气
function groupInfo(bd, r, c) {
  const color = bd[r][c];
  const stones = [];
  const libs = new Set();
  const seen = new Set([r + ',' + c]);
  const stack = [[r, c]];
  while (stack.length) {
    const [cr, cc] = stack.pop();
    stones.push([cr, cc]);
    for (const [nr, nc] of neighbors(cr, cc)) {
      const v = bd[nr][nc];
      if (v === EMPTY) libs.add(nr + ',' + nc);
      else if (v === color && !seen.has(nr + ',' + nc)) {
        seen.add(nr + ',' + nc);
        stack.push([nr, nc]);
      }
    }
  }
  return { stones, libs };
}

function serialize(bd) {
  return bd.map(row => row.join('')).join('|');
}

// 试下一手：返回 { ok, board, captured, str, reason }
function tryPlay(bd, r, c, color) {
  if (bd[r][c] !== EMPTY) return { ok: false, reason: '这里已经有棋子了' };
  const nb = bd.map(row => row.slice());
  nb[r][c] = color;

  // 提走无气的对方棋子
  let captured = 0;
  const opp = color === BLACK ? WHITE : BLACK;
  const checked = new Set();
  for (const [nr, nc] of neighbors(r, c)) {
    if (nb[nr][nc] !== opp || checked.has(nr + ',' + nc)) continue;
    const g = groupInfo(nb, nr, nc);
    g.stones.forEach(([sr, sc]) => checked.add(sr + ',' + sc));
    if (g.libs.size === 0) {
      g.stones.forEach(([sr, sc]) => { nb[sr][sc] = EMPTY; });
      captured += g.stones.length;
    }
  }

  // 禁自杀
  if (captured === 0 && groupInfo(nb, r, c).libs.size === 0) {
    return { ok: false, reason: '这里没有气，不能自杀哦' };
  }

  const str = serialize(nb);
  if (koHistory.has(str)) return { ok: false, reason: '不能马上提回来（禁重复局面）' };
  return { ok: true, board: nb, captured, str };
}

function commitMove(res, color, pos) {
  history.value.push(snapshot());
  board.value = res.board;
  koHistory.add(res.str);
  if (color === BLACK) blackCaptured.value += res.captured;
  else whiteCaptured.value += res.captured;
  if (res.captured > 0) showCaptureFx(res.captured, color);
  passCount.value = 0;
  moveCount.value++;
  lastMove.value = pos;
  currentPlayer.value = 3 - color; // 落子后换行棋方
}

/* ---------------- 表情与标记 ---------------- */

const faceMap = computed(() => {
  const faces = {};
  const ataris = {};
  const bd = board.value;
  const seen = new Set();
  for (let r = 0; r < bd.length; r++) {
    for (let c = 0; c < bd.length; c++) {
      if (bd[r][c] === EMPTY || seen.has(r + ',' + c)) continue;
      const g = groupInfo(bd, r, c);
      g.stones.forEach(([sr, sc]) => {
        seen.add(sr + ',' + sc);
        const n = g.libs.size;
        faces[sr + ',' + sc] = n >= 3 ? '😄' : n === 2 ? '😐' : '😰';
        ataris[sr + ',' + sc] = n === 1;
      });
    }
  }
  return { faces, ataris };
});

function faceEmoji(r, c) { return faceMap.value.faces[r + ',' + c] || ''; }
function inAtari(r, c) { return !!faceMap.value.ataris[r + ',' + c]; }

const starPoints = computed(() => {
  const n = boardSize.value;
  const pts = new Set();
  const add = (r, c) => pts.add(r + ',' + c);
  if (n === 9) {
    [[2, 2], [2, 6], [6, 2], [6, 6], [4, 4]].forEach(([r, c]) => add(r, c));
  } else if (n === 7) {
    [[2, 2], [2, 4], [4, 2], [4, 4], [3, 3]].forEach(([r, c]) => add(r, c));
  } else {
    add(2, 2);
  }
  return pts;
});

function isStar(r, c) { return starPoints.value.has(r + ',' + c); }
function isLastMove(r, c) { return lastMove.value && lastMove.value.r === r && lastMove.value.c === c; }

function showGhost(r, c) {
  return isPlayerTurn.value && hoverCell.value && hoverCell.value.r === r && hoverCell.value.c === c;
}

/* ---------------- 对局流程 ---------------- */

function snapshot() {
  return {
    board: board.value.map(row => row.slice()),
    current: currentPlayer.value,
    passCount: passCount.value,
    blackCaptured: blackCaptured.value,
    whiteCaptured: whiteCaptured.value,
    moveCount: moveCount.value,
    lastMove: lastMove.value ? { ...lastMove.value } : null,
    str: serialize(board.value),
  };
}

function restore(s) {
  board.value = s.board.map(row => row.slice());
  currentPlayer.value = s.current;
  passCount.value = s.passCount;
  blackCaptured.value = s.blackCaptured;
  whiteCaptured.value = s.whiteCaptured;
  moveCount.value = s.moveCount;
  lastMove.value = s.lastMove;
  gameOver.value = false;
  resultText.value = "";
}

function startNewGame() {
  clearTimeout(aiTimer);
  board.value = createBoard(boardSize.value);
  currentPlayer.value = BLACK;
  gameOver.value = false;
  resultText.value = "";
  aiThinking.value = false;
  history.value = [];
  koHistory = new Set([serialize(board.value)]);
  passCount.value = 0;
  blackCaptured.value = 0;
  whiteCaptured.value = 0;
  moveCount.value = 0;
  lastMove.value = null;
  hoverCell.value = null;
  captureFx.value = null;
  if (playerColor.value !== BLACK) scheduleAiMove();
}

function changeSize(n) {
  if (boardSize.value === n) return;
  boardSize.value = n;
  startNewGame();
}

function setColor(color) {
  if (playerColor.value === color) return;
  playerColor.value = color;
  startNewGame();
}

function onCellClick(r, c) {
  if (!isPlayerTurn.value || board.value[r][c] !== EMPTY) return;
  const res = tryPlay(board.value, r, c, playerColor.value);
  if (!res.ok) {
    ElMessage.warning(res.reason);
    return;
  }
  commitMove(res, playerColor.value, { r, c });
  scheduleAiMove();
}

function playerPass() {
  if (!isPlayerTurn.value) return;
  history.value.push(snapshot());
  passCount.value++;
  moveCount.value++;
  lastMove.value = null;
  if (passCount.value >= 2) { endGame(); return; }
  currentPlayer.value = 3 - playerColor.value;
  ElMessage.info('你停了一手，轮到 AI…');
  scheduleAiMove();
}

function undo() {
  if (!canUndo.value) return;
  // 一直回退到轮到玩家落子的局面（通常撤销 AI + 玩家各一手）
  restore(history.value.pop());
  while (history.value.length > 0 && currentPlayer.value !== playerColor.value) {
    restore(history.value.pop());
  }
  koHistory = new Set(history.value.map(h => h.str));
  koHistory.add(serialize(board.value));
  clearTimeout(aiTimer);
  aiThinking.value = false;
}

function endGame() {
  gameOver.value = true;
  const { black, white } = counts.value;
  if (black > white) resultText.value = '🏆 黑方获胜！';
  else if (white > black) resultText.value = '🏆 白方获胜！';
  else resultText.value = '🤝 平局！';
}

/* ---------------- 简单启发式 AI ---------------- */

function scheduleAiMove() {
  if (gameOver.value) return;
  aiThinking.value = true;
  aiTimer = setTimeout(aiMove, 450);
}

function aiMove() {
  const ai = playerColor.value === BLACK ? WHITE : BLACK;
  const n = boardSize.value;
  const bd = board.value;
  const earlyGame = moveCount.value < n;

  // 玩家刚停一手且 AI 领先 → 也停一手，直接数子结束
  const { black, white } = counts.value;
  const aiLead = (ai === BLACK ? black - white : white - black);
  if (passCount.value >= 1 && aiLead > 0) {
    finishAiTurn(null);
    return;
  }

  let best = null;
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      if (bd[r][c] !== EMPTY) continue;
      const res = tryPlay(bd, r, c, ai);
      if (!res.ok) continue;

      const g = groupInfo(res.board, r, c);
      let s = res.captured * 24;

      // 别自投罗网
      if (g.libs.size === 1) s -= res.captured > 0 ? 10 : 32;

      // 打吃对方（把对方逼到1口气），且自己安全
      const opp = ai === BLACK ? WHITE : BLACK;
      const checked = new Set();
      for (const [nr, nc] of neighbors(r, c)) {
        if (res.board[nr][nc] !== opp || checked.has(nr + ',' + nc)) continue;
        const og = groupInfo(res.board, nr, nc);
        og.stones.forEach(([sr, sc]) => checked.add(sr + ',' + sc));
        if (og.libs.size === 1) s += g.libs.size >= 2 ? 11 : 4;
      }

      // 救自己只剩1口气的棋子
      for (const [nr, nc] of neighbors(r, c)) {
        if (bd[nr][nc] !== ai) continue;
        const og = groupInfo(bd, nr, nc);
        if (og.libs.size === 1 && g.libs.size >= 2) s += 17;
      }

      s += Math.min(g.libs.size, 4) * 3;

      // 别填自己的眼
      const ownNb = neighbors(r, c).filter(([nr, nc]) => bd[nr][nc] === ai).length;
      if (ownNb === neighbors(r, c).length && g.libs.size <= 2) s -= 45;

      // 开局别贴边
      const edge = Math.min(r, c, n - 1 - r, n - 1 - c);
      if (earlyGame) s += edge === 0 ? -6 : edge === 1 ? -1 : 2;
      else s += edge === 0 ? -2 : 0;

      // 轻微 prefer 靠子下棋
      s += ownNb * 1.5;
      const oppNb = neighbors(r, c).filter(([nr, nc]) => bd[nr][nc] !== EMPTY && bd[nr][nc] !== ai).length;
      s += oppNb * 1.2;

      s += Math.random() * 3;
      if (!best || s > best.s) best = { r, c, s };
    }
  }

  // 实在没有像样的点就停一手
  if (!best || (best.s < -20 && passCount.value >= 1)) finishAiTurn(null);
  else finishAiTurn(best);
}

function finishAiTurn(move) {
  aiThinking.value = false;
  const ai = currentPlayer.value;
  if (!move) {
    history.value.push(snapshot());
    passCount.value++;
    moveCount.value++;
    lastMove.value = null;
    ElMessage.info('AI 停了一手');
    if (passCount.value >= 2) { endGame(); return; }
    currentPlayer.value = 3 - ai;
    return;
  }
  const res = tryPlay(board.value, move.r, move.c, ai);
  if (!res.ok) return; // 理论上不会发生
  commitMove(res, ai, move);
}

function showCaptureFx(count, byColor) {
  captureFx.value = { count, by: byColor, key: Date.now() };
  clearTimeout(fxTimer);
  fxTimer = setTimeout(() => { captureFx.value = null; }, 1300);
}

startNewGame();
</script>

<style scoped>
.punigo-page {
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

/* 设置栏：棋盘大小 / 执子 / 表情开关 */
.settings-bar {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 10px 22px;
  padding: 12px 16px;
}
.seg-group { display: inline-flex; align-items: center; gap: 6px; }
.seg-label { font-size: 0.85rem; font-weight: bold; color: var(--text-color-secondary); }
.seg-btn {
  padding: 6px 12px;
  border: 2px solid var(--border-color);
  border-radius: 10px;
  background: var(--bg-primary);
  color: var(--text-color);
  font-size: 0.85rem;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.15s;
  touch-action: manipulation;
  -webkit-tap-highlight-color: transparent;
}
.seg-btn:hover:not(.active) { color: var(--primary-color); border-color: var(--primary-color); }
.seg-btn.active { background: var(--primary-color); border-color: var(--primary-color); color: #fff; box-shadow: 2px 2px 0 var(--border-color); }

.board-area {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.game-board {
  /* 总宽 = 10个格宽（9格棋盘 + 两侧半格内边距），保证任何棋盘都不超屏 */
  --cell: min(46px, calc((100vw - 70px) / 10));
  --line: 1.5px;
  --line-color: #7a5c3d;
  position: relative;
  background: linear-gradient(135deg, #f0d49a, #e3bd77);
  border-radius: 6px;
  padding: calc(var(--cell) / 2);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15), inset 0 0 24px rgba(146, 104, 56, 0.25);
  user-select: none;
  -webkit-user-select: none;
}

.board-grid {
  display: grid;
  /* 父容器是 flex 子项宽度不定，必须显式给宽，1fr 网格列才不会塌缩 */
  width: calc(var(--cell) * 9);
  border-top: var(--line) solid var(--line-color);
  border-left: var(--line) solid var(--line-color);
}

.board-cell {
  position: relative;
  aspect-ratio: 1;
  border-right: 1px solid var(--line-color);
  border-bottom: 1px solid var(--line-color);
  box-sizing: border-box;
}
/* 最后一列/行的右边线、下边线是多余的（N个交叉点只需要N条线） */
.board-cell.edge-r { border-right: none; }
.board-cell.edge-b { border-bottom: none; }

.star-point {
  position: absolute;
  top: 0;
  left: 0;
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--line-color);
  transform: translate(-50%, -50%);
  pointer-events: none;
}

/* 交互层：盖在棋盘上，格子中心 = 交叉点，点击热区向四周各延伸半格 */
.click-layer {
  position: absolute;
  top: var(--line);
  left: var(--line);
  width: calc(var(--cell) * 9);
  height: calc(var(--cell) * 9);
  display: grid;
  z-index: 3;
}
.click-cell {
  position: relative;
  cursor: pointer;
  touch-action: manipulation;
  -webkit-tap-highlight-color: transparent;
}
.click-cell.no-drop { cursor: default; }

/* 棋子落在交叉点上（交互层格子的中心） */
.stone {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 88%;
  height: 88%;
  border-radius: 50%;
  transform: translate(-50%, -50%);
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
}
.black-stone { background: radial-gradient(circle at 35% 32%, #5a5a5a, #101010 65%); box-shadow: 1px 2px 3px rgba(0, 0, 0, 0.4); }
.white-stone { background: radial-gradient(circle at 35% 32%, #ffffff, #d9d9d9 70%); box-shadow: 1px 2px 3px rgba(0, 0, 0, 0.3); }

.stone.ghost { opacity: 0.4; }

.face {
  font-size: calc(var(--cell) * 0.5);
  line-height: 1;
  font-family: 'Apple Color Emoji', 'Segoe UI Emoji', 'Noto Color Emoji', sans-serif;
  filter: drop-shadow(0 1px 1px rgba(0, 0, 0, 0.45));
}

.stone.atari { animation: atariPulse 0.9s ease-in-out infinite; }
@keyframes atariPulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(245, 108, 108, 0), 1px 2px 3px rgba(0, 0, 0, 0.35); }
  50% { box-shadow: 0 0 0 3.5px rgba(245, 108, 108, 0.75), 1px 2px 3px rgba(0, 0, 0, 0.35); }
}

.last-mark {
  position: absolute;
  top: 18%;
  right: 18%;
  width: 22%;
  height: 22%;
  border-radius: 50%;
}
.last-mark.on-black { background: #f56c6c; box-shadow: 0 0 0 1.5px rgba(255, 255, 255, 0.8); }
.last-mark.on-white { background: #f56c6c; box-shadow: 0 0 0 1.5px rgba(120, 120, 120, 0.6); }

.capture-fx {
  position: absolute;
  top: 12px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 6;
  padding: 4px 14px;
  border-radius: 16px;
  font-weight: 900;
  font-size: 0.9rem;
  pointer-events: none;
  background: rgba(255, 255, 255, 0.92);
  border: 2px solid var(--border-color);
  color: var(--text-color);
  box-shadow: 2px 2px 0 rgba(0, 0, 0, 0.15);
}
.capture-fx.by-white { background: rgba(50, 50, 50, 0.92); color: #fff; }

.result-overlay {
  position: absolute;
  inset: 0;
  z-index: 8;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 248, 235, 0.72);
  backdrop-filter: blur(2px);
  border-radius: 6px;
}
.result-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
  padding: 22px 30px;
  border: 2px solid var(--border-color);
  border-radius: 14px;
  background: var(--bg-primary);
  box-shadow: 4px 4px 0 var(--border-color);
}
.result-title { font-size: 1.25rem; font-weight: 900; color: var(--text-color); }
.result-score { display: flex; align-items: center; gap: 12px; font-weight: bold; color: var(--text-color); }
.result-score i { font-style: normal; color: var(--text-color-secondary); font-size: 0.85rem; }

.hint-line {
  margin-top: 10px;
  font-size: 0.82rem;
  color: var(--text-color-secondary);
  text-align: center;
  padding: 0 12px;
}

.panel-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  padding: 12px 16px;
  border-top: 2px dashed var(--border-color);
}
.stats-row { display: flex; gap: 16px; }
.stat-item { display: flex; flex-direction: column; align-items: center; min-width: 42px; }
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

.rules-panel {
  max-width: 640px;
  margin: 0 auto 24px;
  padding: 0 16px;
}
.rules-toggle {
  width: 100%;
  padding: 10px 14px;
  border: 2px dashed var(--border-color);
  border-radius: 10px;
  background: var(--bg-primary);
  color: var(--text-color);
  font-weight: bold;
  font-size: 0.95rem;
  cursor: pointer;
  text-align: center;
}
.rules-list {
  margin: 10px 0 0;
  padding: 12px 12px 12px 32px;
  border: 2px solid var(--border-color);
  border-radius: 10px;
  background: var(--bg-primary);
  color: var(--text-color);
  line-height: 1.8;
  font-size: 0.9rem;
}
.rules-list b { color: var(--primary-color); }

/* 动画 */
.pop-enter-active { animation: popIn 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.4); }
@keyframes popIn { from { opacity: 0; } to { opacity: 1; } }

.fade-enter-active, .fade-leave-active { transition: opacity 0.25s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

.slide-enter-active { transition: all 0.2s ease; }
.slide-enter-from { opacity: 0; transform: translateY(-6px); }

/* 手机端 */
@media (max-width: 600px) {
  .panel-header { padding: 10px 12px; }
  .title { font-size: 1.05rem; }
  .settings-bar { gap: 8px 14px; padding: 10px 10px; }
  .seg-btn { padding: 5px 10px; font-size: 0.8rem; }
  .game-board { --cell: min(40px, calc((100vw - 30px) / 10)); }
  .panel-footer { flex-direction: column; align-items: stretch; }
  .stats-row { justify-content: space-around; }
  .control-group .cartoon-btn { flex: 1; justify-content: center; }
}
</style>
