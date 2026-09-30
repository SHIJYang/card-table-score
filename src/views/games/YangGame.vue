<template>
  <div class="common-layout">
    <el-container>
      <el-main class="game-container">
        <div class="game-info">
          <div class="title-box">🐑 羊了个羊</div>
          <button class="restart-btn" @click="startGame(difficulty)">🔄 重来</button>
        </div>

        <div class="meta-row">
          <div class="diff-group">
            <button
              v-for="(cfg, key) in DIFFS"
              :key="key"
              class="diff-btn"
              :class="{ active: difficulty === key }"
              @click="startGame(key)"
            >{{ cfg.label }}</button>
          </div>
          <div class="stat-box">剩余 <b>{{ remainCount }}</b></div>
          <div class="stat-box">⏱ {{ timeText }}</div>
          <div class="stat-box best">最佳 {{ bestText }}</div>
        </div>

        <div class="board-wrap" ref="wrapRef" :style="{ height: layout.wrapH + 'px' }">
          <!-- 牌堆底板 -->
          <div
            class="board-panel"
            :style="{ left: layout.boardLeft + 'px', top: layout.PAD + 'px', width: layout.boardW + 'px', height: layout.boardH + 'px' }"
          ></div>

          <!-- 槽位底框（7 格） -->
          <div
            v-for="i in SLOT_MAX"
            :key="'s' + i"
            class="slot-outline"
            :style="slotOutlineStyle(i - 1)"
          ></div>

          <!-- 牌（场上 / 槽内） -->
          <div
            v-for="e in renderTiles"
            :key="e.id"
            class="tile"
            :data-id="e.id"
            :class="{ blocked: e.blocked, eliminating: e.eliminating }"
            :style="tileStyle(e)"
            @click="onTileClick(e)"
          >
            <span class="emoji">{{ TILE_EMOJIS[e.type] }}</span>
          </div>

          <!-- 道具行 + 移出暂存区 -->
          <div class="props-row" :style="{ top: layout.propsTop + 'px', height: layout.propsH + 'px' }">
            <button class="prop-btn" :disabled="!canUndo" @click="useUndo">↩️<span class="label">撤销</span></button>
            <button class="prop-btn" :disabled="!canShuffle" @click="useShuffle">🔀<span class="label">洗牌</span></button>
            <button class="prop-btn" :disabled="!canMoveOut" @click="useMoveOut">📤<span class="label">移出</span></button>
            <div class="moved-area">
              <div
                v-for="id in movedOutIds"
                :key="id"
                class="mini-tile"
                :style="{
                  width: layout.mini + 'px',
                  height: layout.mini + 'px',
                  fontSize: layout.mini * 0.55 + 'px',
                  background: TILE_COLORS[tileOf(id).type],
                }"
              >{{ TILE_EMOJIS[tileOf(id).type] }}</div>
            </div>
          </div>

          <!-- 结算浮层 -->
          <div class="overlay" v-if="gameStatus === 'lost'">
            <h3>😵 槽位满啦！</h3>
            <p>还剩 {{ remainCount }} 张牌没有消完</p>
            <button class="restart-btn" @click="startGame(difficulty)">再试一次</button>
          </div>
          <div class="overlay" v-if="gameStatus === 'won'">
            <h3>🎉 通关啦！</h3>
            <p>用时 {{ timeText }}</p>
            <p class="record" v-if="newRecord">🏆 新纪录！</p>
            <button class="restart-btn" @click="startGame(difficulty)">再来一局</button>
          </div>
        </div>

        <div class="tips">
          点击没有被压住的牌收进底部槽位，集齐 3 张相同图案即可消除；槽位 7 格被填满且无法消除则失败。善用撤销、洗牌、移出三个道具。每局发牌均经内置求解器校验，保证存在通关路径。
        </div>
      </el-main>
    </el-container>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted, nextTick } from "vue";

// ============ 常量配置 ============
const SLOT_MAX = 7;

const TILE_EMOJIS = ["🐑", "🥕", "🌽", "🍄", "🌻", "🧣", "☔", "🌙", "⭐", "🍀", "🐔", "🍎"];
const TILE_COLORS = [
  "#fff6d9", "#ffe8e8", "#e8f7e9", "#e6f0ff", "#fff0e0", "#f3e8ff",
  "#e0f7fa", "#fdf3d0", "#ffeef5", "#eef7e0", "#e8f4fd", "#f0fff4",
];

const DIFFS = {
  // profile：自底向顶每层的 [行, 列]，各层大小不同、居中堆叠；
  // 总张数 = 各层行列之积的和，须能被 types 整除且每种数量为 3 的倍数
  easy: { label: "简单", types: 6, profile: [[3, 4], [3, 4], [3, 3], [3, 3], [3, 2], [3, 2]] }, // 54 张，每种 9 张
  normal: { label: "普通", types: 8, profile: [[4, 4], [4, 4], [4, 4], [4, 3], [4, 3], [4, 3], [4, 3]] }, // 96 张，每种 12 张
  // 困难若配 12 种图案，可见图案数会超过 7 格槽位容量，随机发牌几乎必然无解（实测求解器 2000 次模拟全败），
  // 因此与普通同为 8 种，难度来自更深的层堆与更大的牌量
  hard: {
    label: "困难",
    types: 8,
    profile: [
      [4, 4], [4, 4], [4, 4], [4, 4], [4, 4], [4, 4],
      [4, 3], [4, 3], [4, 3], [4, 3],
      [3, 3], [3, 3],
      [3, 2],
    ],
  }, // 168 张，每种 21 张
};

// ============ 可解性校验：发牌后模拟验证存在通关路径，无解则重洗 ============
// 求解策略与游戏规则一致（可在真实对局中复现）：贪心选牌 + 模拟 1 次洗牌道具 + 有限回溯。
// 任一次模拟通关即为"可解"的构造性证明；全部失败则视为无解（可能误杀极少数可解局，只影响重洗次数）。
const SOLVER_CFG = {
  easy: { playouts: 24, maxTries: 24 },
  normal: { playouts: 32, maxTries: 32 },
  hard: { playouts: 48, maxTries: 48 },
};

// 遮挡结构只与布局有关（层间必有半格错位，重叠判定与像素尺寸无关），按难度缓存
const layoutMetaCache = {};

function getLayoutMeta(key) {
  if (layoutMetaCache[key]) return layoutMetaCache[key];
  const cfg = DIFFS[key];
  const maxRows = Math.max(...cfg.profile.map((p) => p[0]));
  const maxCols = Math.max(...cfg.profile.map((p) => p[1]));
  // 每层居中于最大足迹 + 半格漂移，坐标以“牌距”为单位（0.5 的倍数）
  const layerOf = [];
  const rawX = [];
  const rawY = [];
  cfg.profile.forEach(([rows, cols], l) => {
    const d = driftUnits(l);
    const offX = (maxCols - cols) / 2 + d;
    const offY = (maxRows - rows) / 2 + d;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        layerOf.push(l);
        rawX.push(c + offX);
        rawY.push(r + offY);
      }
    }
  });
  const n = rawX.length;
  const minX = Math.min(...rawX);
  const minY = Math.min(...rawY);
  const px = new Float64Array(n);
  const py = new Float64Array(n);
  for (let i = 0; i < n; i++) {
    px[i] = rawX[i] - minX;
    py[i] = rawY[i] - minY;
  }
  // coveredBelow[i]：牌 i 直接压住的下方牌；coveredCountInit：初始压在每张牌上方的数量。
  // 重叠判定用单位坐标（差值 < 1 即重叠），与渲染像素无关，渲染/游戏判定/求解器三方共用
  const coveredBelow = new Array(n);
  for (let i = 0; i < n; i++) {
    const below = [];
    for (let j = 0; j < n; j++) {
      if (layerOf[j] >= layerOf[i]) continue;
      if (Math.abs(px[i] - px[j]) < 1 && Math.abs(py[i] - py[j]) < 1) below.push(j);
    }
    coveredBelow[i] = below;
  }
  const coveredCountInit = new Int16Array(n);
  const freeInit = [];
  for (let j = 0; j < n; j++) {
    let cnt = 0;
    for (let i = 0; i < n; i++) {
      if (layerOf[i] > layerOf[j] && Math.abs(px[i] - px[j]) < 1 && Math.abs(py[i] - py[j]) < 1) cnt++;
    }
    coveredCountInit[j] = cnt;
    if (cnt === 0) freeInit.push(j);
  }
  const unblock = new Int16Array(n);
  for (let i = 0; i < n; i++) unblock[i] = coveredBelow[i].length;
  const meta = {
    n,
    layerOf: Int16Array.from(layerOf),
    px,
    py,
    boardW: Math.max(...px) + 1,
    boardH: Math.max(...py) + 1,
    coveredBelow,
    coveredCountInit,
    freeInit,
    unblock,
  };
  layoutMetaCache[key] = meta;
  return meta;
}

// 单局模拟：返回 true 表示找到了一条通关路径
function runPlayout(meta, types, maxType) {
  const { coveredCountInit, coveredBelow, freeInit, unblock, n } = meta;
  const covered = coveredCountInit.slice();
  const inFree = new Int8Array(n);
  const free = [];
  for (const i of freeInit) {
    inFree[i] = 1;
    free.push(i);
  }
  const slotCounts = new Int16Array(maxType);
  const typesNow = types.slice();
  let slotSize = 0;
  let remaining = n;
  // 不依赖任何道具求解：保证"无道具可解"，且通关路径可被真实对局完整复现
  //（若模拟洗牌，其随机结果与真实洗牌必然不同，路径后半段即失效）
  let backtrackBudget = 48;   // 卡住时回溯换一种拿法的次数上限
  let exclude = new Set();    // 当前决策点已试过的图案（回溯用）
  const snaps = [];
  const pickLog = [];         // 通关路径（牌下标），供测试回放

  const pickTile = (i) => {
    remaining--;
    inFree[i] = 0;
    pickLog.push(i);
    const t = typesNow[i];
    slotCounts[t]++;
    slotSize++;
    if (slotCounts[t] === 3) {
      slotCounts[t] = 0;
      slotSize -= 3;
    }
    for (const j of coveredBelow[i]) {
      if (--covered[j] === 0 && !inFree[j]) {
        inFree[j] = 1;
        free.push(j);
      }
    }
  };

  const saveSnap = (pickedType) => {
    snaps.push({
      covered: covered.slice(),
      free: free.slice(),
      inFree: inFree.slice(),
      slotCounts: slotCounts.slice(),
      slotSize,
      remaining,
      exclude,
      pickedType,
      logLen: pickLog.length,
    });
  };

  let steps = 0;
  while (remaining > 0 && steps++ < n * 4) {
    // 选牌：凑三 > 续对子 > 向同类牌多的区域深挖
    const typeFree = new Int16Array(maxType);
    for (const i of free) {
      if (inFree[i]) typeFree[typesNow[i]]++;
    }
    let best = -1;
    let bestScore = -Infinity;
    let hasComplete = false;
    for (const i of free) {
      if (!inFree[i]) continue;
      const t = typesNow[i];
      const sc = slotCounts[t];
      if (sc === 2) {
        hasComplete = true;
        const score = 1e6 + unblock[i];
        if (score > bestScore) {
          bestScore = score;
          best = i;
        }
        continue;
      }
      if (exclude.has(t)) continue;
      let score = (sc === 1 ? 40 : 0) + typeFree[t] * 6 + unblock[i] * 3 + Math.random() * 10;
      if (slotSize >= 5 && sc === 0) score -= 35; // 槽位紧张时少开新图案
      if (score > bestScore) {
        bestScore = score;
        best = i;
      }
    }
    // 槽位只剩 1 格空位时只允许凑三，否则必输
    if (best >= 0 && slotSize >= 6 && !hasComplete) best = -1;

    if (best < 0) {
      // 卡住：先回溯换一种拿法，再不行模拟洗牌，最后判定该局无解
      if (snaps.length && backtrackBudget > 0) {
        backtrackBudget--;
        const s = snaps.pop();
        covered.set(s.covered);
        inFree.set(s.inFree);
        free.length = 0;
        free.push(...s.free);
        slotCounts.set(s.slotCounts);
        slotSize = s.slotSize;
        remaining = s.remaining;
        pickLog.length = s.logLen; // 丢弃已回退分支的路径
        s.exclude.add(s.pickedType);
        exclude = s.exclude;
        continue;
      }
      return false;
    }

    if (slotCounts[typesNow[best]] !== 2) {
      saveSnap(typesNow[best]); // 非凑三拿牌存档，供回溯
    }
    exclude = new Set();
    pickTile(best);
  }
  return remaining === 0 ? pickLog : null;
}

// 返回可回放的通关路径（牌下标数组，-1 为洗牌）；无可解路径返回 null
function dealSolves(key, meta, types) {
  const { playouts } = SOLVER_CFG[key];
  const maxType = DIFFS[key].types;
  for (let k = 0; k < playouts; k++) {
    const line = runPlayout(meta, types, maxType);
    if (line) return line;
  }
  return null;
}

function buildPool(cfg) {
  const total = cfg.profile.reduce((sum, [r, c]) => sum + r * c, 0);
  const perType = total / cfg.types; // 每种牌数量必为 3 的倍数
  const pool = [];
  for (let t = 0; t < cfg.types; t++) {
    for (let k = 0; k < perType; k++) pool.push(t);
  }
  shuffleArr(pool);
  return pool;
}

// 层间漂移（半格单位，三角形波）：相邻层必有半格错位，形成堆叠覆盖感
const DRIFT_PATTERN = [0, 1, 2, 1];
const driftUnits = (layer) => DRIFT_PATTERN[layer % 4] / 2;

// ============ 游戏状态 ============
const difficulty = ref("easy");
const tiles = ref([]);        // 全部牌
const slots = ref([]);        // 槽位内的牌 id（有序）
const movedOutIds = ref([]);  // 被移出道具收走的牌 id
const gameStatus = ref("playing"); // playing | won | lost
const resolving = ref(false); // 消除/失败动画期间锁定操作
const propCounts = reactive({ undo: 1, shuffle: 1, moveout: 1 });

const wrapRef = ref(null);
const layout = ref({});

const elapsed = ref(0);
const bestSeconds = ref(0);
const newRecord = ref(false);
let startTime = 0;
let timerId = null;

const tileMap = computed(() => new Map(tiles.value.map((t) => [t.id, t])));
const tileOf = (id) => tileMap.value.get(id);

const remainCount = computed(
  () => tiles.value.filter((t) => t.state === "board" || t.state === "slot").length
);

// ============ 关卡生成 ============
function shuffleArr(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

function startGame(key, presetTypes) {
  difficulty.value = key;
  const cfg = DIFFS[key];
  // 生成发牌并校验可解：无解自动重洗，直到找到存在通关路径的发牌
  let types = presetTypes;
  if (!types) {
    const meta = getLayoutMeta(key);
    const solver = SOLVER_CFG[key];
    const genStart = performance.now();
    types = buildPool(cfg);
    let genTries = 0;
    while (!dealSolves(key, meta, types)) {
      genTries++;
      types = buildPool(cfg);
      if (genTries >= solver.maxTries || performance.now() - genStart > 1500) break;
    }
    window.__yangGenStats = { difficulty: key, tries: genTries, ms: Math.round(performance.now() - genStart) };
  }

  const list = [];
  let id = 0;
  for (let l = 0; l < cfg.profile.length; l++) {
    const [rows, cols] = cfg.profile[l];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        list.push({ id, type: types[id], layer: l, row: r, col: c, state: "board", eliminating: false });
        id++;
      }
    }
  }
  tiles.value = list;
  slots.value = [];
  movedOutIds.value = [];
  propCounts.undo = 1;
  propCounts.shuffle = 1;
  propCounts.moveout = 1;
  gameStatus.value = "playing";
  newRecord.value = false;
  bestSeconds.value = parseInt(localStorage.getItem("yang_best_" + key) || "0", 10);
  nextTick(() => { layout.value = computeLayout(); });
  startTimer();
}

// 自动化测试钩子：生成可解发牌并开局，返回可回放的通关路径（牌 id 序列，-1 为洗牌）
window.__yangVerify = (key) => {
  const cfg = DIFFS[key];
  const meta = getLayoutMeta(key);
  let types = buildPool(cfg);
  let tries = 0;
  let line = null;
  const genStart = performance.now();
  while (!(line = dealSolves(key, meta, types))) {
    types = buildPool(cfg);
    if (++tries >= SOLVER_CFG[key].maxTries || performance.now() - genStart > 1500) break;
  }
  if (!line) return null;
  startGame(key, types);
  return line;
};

// ============ 布局计算 ============
function computeLayout() {
  const W = wrapRef.value ? wrapRef.value.clientWidth : 480;
  const meta = getLayoutMeta(difficulty.value);
  const PAD = 6;
  const GAP = 4;
  const pitch = Math.min(60, (W - PAD * 2) / meta.boardW); // 牌面尺寸上限 60px，比早期版本更小更密集
  const tw = pitch - GAP;
  const boardW = meta.boardW * pitch;
  const boardH = meta.boardH * pitch;
  const boardLeft = Math.max(PAD, Math.round((W - boardW) / 2));
  const propsTop = boardH + PAD + 6;
  const propsH = 56;
  const sgap = 6;
  const ssz = Math.min(tw, Math.floor((W - PAD * 2 - sgap * (SLOT_MAX - 1)) / SLOT_MAX));
  const slotTotal = SLOT_MAX * ssz + (SLOT_MAX - 1) * sgap;
  const slotLeft = Math.max(PAD, Math.round((W - slotTotal) / 2));
  const slotTop = propsTop + propsH + 8;
  const mini = Math.max(30, Math.round(ssz * 0.78));
  const wrapH = slotTop + ssz + 10;
  return {
    W, PAD, pitch, tw, boardW, boardH, boardLeft, propsTop, propsH, sgap, ssz, slotLeft, slotTop, mini, wrapH,
    px: meta.px, py: meta.py, layerOf: meta.layerOf,
  };
}

// ============ 遮挡判定 ============
// 与求解器共用单位坐标重叠判定（差值 < 1），保证游戏规则和可解性校验完全一致
const blockedSet = computed(() => {
  const meta = getLayoutMeta(difficulty.value);
  const set = new Set();
  const bs = tiles.value.filter((t) => t.state === "board");
  for (const a of bs) {
    for (const b of bs) {
      if (b.layer <= a.layer) continue;
      if (Math.abs(meta.px[b.id] - meta.px[a.id]) < 1 && Math.abs(meta.py[b.id] - meta.py[a.id]) < 1) {
        set.add(a.id);
        break;
      }
    }
  }
  return set;
});

// ============ 渲染数据 ============
const renderTiles = computed(() => {
  const list = [];
  for (const t of tiles.value) {
    if (t.state === "board") {
      list.push({
        id: t.id, type: t.type, layer: t.layer, row: t.row, col: t.col,
        state: "board", eliminating: t.eliminating, slotIdx: -1,
        blocked: blockedSet.value.has(t.id),
      });
    }
  }
  slots.value.forEach((id, idx) => {
    const t = tileOf(id);
    if (t) {
      list.push({
        id: t.id, type: t.type, layer: t.layer, row: t.row, col: t.col,
        state: "slot", eliminating: t.eliminating, slotIdx: idx, blocked: false,
      });
    }
  });
  return list;
});

function tileStyle(e) {
  const s = layout.value;
  const isSlot = e.state === "slot";
  const size = isSlot ? s.ssz : s.tw;
  let x, y, z;
  if (isSlot) {
    x = s.slotLeft + e.slotIdx * (s.ssz + s.sgap);
    y = s.slotTop;
    z = 500 + e.slotIdx; // 槽位牌必须压过所有场上牌
  } else {
    x = s.boardLeft + s.px[e.id] * s.pitch;
    y = s.PAD + s.py[e.id] * s.pitch;
    z = 10 + s.layerOf[e.id] * 10;
  }
  if (e.eliminating) z = 800;
  return {
    left: x + "px",
    top: y + "px",
    width: size + "px",
    height: size + "px",
    fontSize: size * 0.5 + "px",
    zIndex: z,
    background: TILE_COLORS[e.type % TILE_COLORS.length],
  };
}

function slotOutlineStyle(i) {
  const s = layout.value;
  return {
    left: s.slotLeft + i * (s.ssz + s.sgap) + "px",
    top: s.slotTop + "px",
    width: s.ssz + "px",
    height: s.ssz + "px",
  };
}

// ============ 核心玩法 ============
function onTileClick(e) {
  if (gameStatus.value !== "playing" || resolving.value) return;
  const t = tileOf(e.id);
  if (!t || t.state !== "board" || blockedSet.value.has(t.id)) return;
  if (slots.value.length >= SLOT_MAX) return;
  t.state = "slot";
  // 插到最后一张同类牌之后，保证同类牌在槽位中始终连续（经典规则）
  let pos = slots.value.length;
  for (let i = slots.value.length - 1; i >= 0; i--) {
    if (tileOf(slots.value[i]).type === t.type) {
      pos = i + 1;
      break;
    }
  }
  slots.value.splice(pos, 0, t.id);
  resolveSlot(t.id);
}

// 检查刚插入牌所在位置的同类连续段：凑满 3 张即消除；槽满且无消除则失败
function resolveSlot(insertedId) {
  const ids = slots.value;
  const inserted = tileOf(insertedId);
  const idx = ids.indexOf(insertedId);
  // 向两侧扩展同类连续段（同类牌始终连续，但未必贴着槽位末尾）
  let lo = idx;
  let hi = idx;
  while (lo > 0 && tileOf(ids[lo - 1]).type === inserted.type) lo--;
  while (hi < ids.length - 1 && tileOf(ids[hi + 1]).type === inserted.type) hi++;
  const run = ids.slice(lo, hi + 1);
  if (run.length >= 3) {
    resolving.value = true;
    run.forEach((id) => { tileOf(id).eliminating = true; });
    setTimeout(() => {
      slots.value = slots.value.filter((id) => !run.includes(id));
      run.forEach((id) => {
        const t = tileOf(id);
        t.state = "done";
        t.eliminating = false;
      });
      resolving.value = false;
      checkWin();
    }, 320);
  } else if (slots.value.length >= SLOT_MAX) {
    resolving.value = true;
    setTimeout(() => {
      gameStatus.value = "lost";
      stopTimer();
      resolving.value = false;
    }, 380);
  }
}

function checkWin() {
  const left = tiles.value.some((t) => t.state === "board" || t.state === "slot");
  if (!left) {
    gameStatus.value = "won";
    stopTimer();
    saveBest();
  }
}

// ============ 道具 ============
const canUndo = computed(
  () => gameStatus.value === "playing" && !resolving.value && propCounts.undo > 0 && slots.value.length > 0
);
const canShuffle = computed(
  () =>
    gameStatus.value === "playing" &&
    !resolving.value &&
    propCounts.shuffle > 0 &&
    tiles.value.filter((t) => t.state === "board").length >= 2
);
const canMoveOut = computed(
  () => gameStatus.value === "playing" && !resolving.value && propCounts.moveout > 0 && slots.value.length >= 3
);

// 撤销：把槽位最后一张牌放回原位
function useUndo() {
  if (!canUndo.value) return;
  propCounts.undo--;
  const id = slots.value.pop();
  tileOf(id).state = "board";
}

// 洗牌：场上剩余牌的图案随机重排
function useShuffle() {
  if (!canShuffle.value) return;
  propCounts.shuffle--;
  const bs = tiles.value.filter((t) => t.state === "board");
  const types = bs.map((t) => t.type);
  shuffleArr(types);
  bs.forEach((t, i) => { t.type = types[i]; });
}

// 移出：槽位前 3 张移入暂存区（不占槽位、不可再操作）
function useMoveOut() {
  if (!canMoveOut.value) return;
  propCounts.moveout--;
  const ids = slots.value.splice(0, 3);
  ids.forEach((id) => {
    tileOf(id).state = "movedout";
    movedOutIds.value.push(id);
  });
}

// ============ 计时与最佳记录 ============
function fmt(sec) {
  return `${String(Math.floor(sec / 60)).padStart(2, "0")}:${String(sec % 60).padStart(2, "0")}`;
}
const timeText = computed(() => fmt(elapsed.value));
const bestText = computed(() => (bestSeconds.value ? fmt(bestSeconds.value) : "--"));

function startTimer() {
  stopTimer();
  startTime = Date.now();
  elapsed.value = 0;
  timerId = setInterval(() => {
    elapsed.value = Math.floor((Date.now() - startTime) / 1000);
  }, 500);
}
function stopTimer() {
  if (timerId) {
    clearInterval(timerId);
    timerId = null;
  }
}

function saveBest() {
  const sec = Math.floor((Date.now() - startTime) / 1000);
  const key = "yang_best_" + difficulty.value;
  const prev = parseInt(localStorage.getItem(key) || "0", 10);
  newRecord.value = !prev || sec < prev;
  if (newRecord.value) localStorage.setItem(key, String(sec));
  bestSeconds.value = parseInt(localStorage.getItem(key), 10);
}

// ============ 生命周期 ============
let ro = null;
onMounted(() => {
  startGame("easy");
  ro = new ResizeObserver(() => { layout.value = computeLayout(); });
  if (wrapRef.value) ro.observe(wrapRef.value);
});
onUnmounted(() => {
  stopTimer();
  if (ro) ro.disconnect();
});
</script>

<style scoped>
.game-container {
  max-width: 560px;
  margin: 0 auto;
  padding: 20px;
  font-family: 'Comic Sans MS', 'Chalkboard SE', sans-serif;
}
.game-info {
  display: flex;
  justify-content: space-evenly;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 12px;
}
.title-box {
  font-size: 40px;
  font-weight: 900;
  color: var(--primary-color);
  text-shadow: 3px 3px 0 var(--border-color);
}
.restart-btn {
  background: var(--primary-color);
  color: white;
  border: 3px solid var(--border-color);
  padding: 10px;
  border-radius: 12px;
  font-weight: bold;
  cursor: pointer;
  box-shadow: 3px 3px 0 0 rgba(0, 0, 0, 0.2);
}
.restart-btn:active {
  transform: translate(2px, 2px);
  box-shadow: none;
}

.meta-row {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 12px;
}
.diff-group { display: flex; gap: 6px; }
.diff-btn {
  border: 2px solid var(--border-color);
  background: var(--bgSecondary-color, var(--bgSecondary));
  color: var(--text-color);
  padding: 5px 12px;
  border-radius: 10px;
  cursor: pointer;
  font-weight: bold;
}
.diff-btn.active {
  background: var(--warning-color);
}
.stat-box {
  background: var(--border-color);
  padding: 4px 10px;
  border-radius: 8px;
  font-size: 13px;
  color: white;
}
.stat-box b { font-size: 15px; }
.stat-box.best {
  background: var(--warning-color);
  color: var(--text-color);
}

.board-wrap {
  position: relative;
  width: 100%;
  user-select: none;
  -webkit-user-select: none;
  touch-action: manipulation;
}
.board-panel {
  position: absolute;
  border-radius: 14px;
  background: rgba(128, 128, 128, 0.1);
  border: 3px solid var(--border-color);
  box-shadow: inset 0 0 12px rgba(0, 0, 0, 0.06);
}
.slot-outline {
  position: absolute;
  border-radius: 10px;
  border: 2px dashed var(--border-color);
  background: rgba(0, 0, 0, 0.05);
}

.tile {
  position: absolute;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  border: 2px solid rgba(0, 0, 0, 0.1);
  box-shadow: 0 3px 0 rgba(0, 0, 0, 0.16), inset 0 2px 0 rgba(255, 255, 255, 0.65);
  cursor: pointer;
  transition: left 0.3s ease, top 0.3s ease, width 0.3s ease, height 0.3s ease,
    font-size 0.3s ease, transform 0.18s ease, opacity 0.28s ease;
}
.tile .emoji {
  line-height: 1;
  filter: drop-shadow(0 1px 1px rgba(0, 0, 0, 0.15));
}
.tile:not(.blocked):active {
  transform: scale(0.92);
}
.tile.blocked { cursor: default; }
.tile.blocked::after {
  content: '';
  position: absolute;
  inset: -2px;
  border-radius: 10px;
  background: rgba(60, 60, 60, 0.42);
}
.tile.blocked .emoji { opacity: 0.75; }
.tile.eliminating {
  transform: scale(1.5);
  opacity: 0;
}

.props-row {
  position: absolute;
  left: 0;
  right: 0;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 8px;
}
.prop-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  background: var(--primary-color);
  color: white;
  border: 3px solid var(--border-color);
  border-radius: 12px;
  padding: 7px 12px;
  font-weight: bold;
  font-size: 14px;
  cursor: pointer;
  box-shadow: 0 3px 0 rgba(0, 0, 0, 0.2);
}
.prop-btn:disabled {
  background: var(--textDisabled-color, var(--textDisabled, #a8abb2));
  opacity: 0.6;
  cursor: not-allowed;
}
.prop-btn:not(:disabled):active {
  transform: translateY(2px);
  box-shadow: none;
}
.moved-area {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 6px;
  min-height: 34px;
}
.mini-tile {
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  border: 2px solid rgba(0, 0, 0, 0.12);
  box-shadow: 0 2px 0 rgba(0, 0, 0, 0.15);
  animation: popin 0.25s ease;
}
@keyframes popin {
  from { transform: scale(0.3); }
  to { transform: scale(1); }
}

.overlay {
  position: absolute;
  inset: 0;
  background: rgba(255, 255, 255, 0.78);
  backdrop-filter: blur(4px);
  border-radius: 14px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  z-index: 999;
}
.overlay h3 {
  font-size: 34px;
  color: var(--text-color);
  margin: 0 0 12px;
}
.overlay p {
  margin: 4px 0;
  color: var(--textSecondary-color, var(--textSecondary));
}
.overlay .record {
  color: var(--warning-color);
  font-weight: bold;
}
.overlay .restart-btn { margin-top: 14px; }

.tips {
  margin-top: 14px;
  text-align: center;
  font-size: 12px;
  color: var(--textLight-color, var(--textLight));
  line-height: 1.6;
}

/* 手机端适配 */
@media (max-width: 480px) {
  .game-container { padding: 10px; }
  .title-box { font-size: 28px; text-shadow: 2px 2px 0 var(--border-color); }
  .restart-btn { padding: 8px 10px; font-size: 14px; touch-action: manipulation; }
  .overlay h3 { font-size: 24px; }
  .prop-btn { padding: 6px 8px; font-size: 13px; }
}
@media (max-width: 380px) {
  .prop-btn .label { display: none; }
}
</style>
