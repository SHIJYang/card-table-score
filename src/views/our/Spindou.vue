<template>
  <div class="app-container">
    <div class="game-layout">
      <!-- ==================== 左侧画板 ==================== -->
      <div class="board-section">
        <!-- 顶栏：视图 Tab + 烫豆开关 -->
        <div class="board-topbar">
          <div class="viewtabs">
            <button class="viewtab" :class="{ active: activeView === 'source' }" @click="switchView('source')">原图</button>
            <button class="viewtab" :class="{ active: activeView === 'pixel' }" @click="switchView('pixel')">转换图</button>
            <button class="viewtab" :class="{ active: activeView === 'grid' }" @click="switchView('grid')">拼豆图纸</button>
          </div>
          <button class="iron-toggle" :class="{ active: ironEnabled }" @click="toggleIron">🔥 模拟烫豆</button>
        </div>

        <!-- 视图区 -->
        <div class="grid-container">
          <!-- 原图 -->
          <div v-if="activeView === 'source'" class="source-view">
            <input ref="fileInputRef" type="file" accept="image/*" style="display: none" @change="onFileChange" />
            <div
              v-if="!sourceImageUrl"
              class="upload-placeholder"
              @click="triggerFileInput"
              @dragover.prevent
              @drop.prevent="onDrop"
            >
              <div class="upload-icon">🖼️</div>
              <div class="upload-title">点击或拖拽上传图片</div>
              <div class="upload-sub">支持 PNG / JPG，上传后自动转为拼豆图纸</div>
            </div>
            <template v-else>
              <img :src="sourceImageUrl" class="source-preview" alt="原图" />
              <div class="source-actions">
                <el-button size="small" @click="triggerFileInput">重新上传</el-button>
                <el-button size="small" type="primary" @click="convertSourceToBoard">重新转换</el-button>
              </div>
            </template>
          </div>

          <!-- 转换图 -->
          <div v-else-if="activeView === 'pixel'" class="pixel-view">
            <canvas ref="pixelPreviewCanvasRef" class="pixel-preview-canvas"></canvas>
          </div>

          <!-- 拼豆图纸 -->
          <div v-else class="grid-wrapper">
            <div class="grid-stack">
              <div class="pixel-grid" ref="gridElRef" :style="gridStyle">
                <template v-for="(row, r) in board" :key="r">
                  <div
                    v-for="(cell, c) in row"
                    :key="r + '-' + c"
                    class="pixel-cell"
                    :class="{ filled: cell !== null, highlight: highlightHex && cell === highlightHex }"
                    :style="{ backgroundColor: cell || '#f9f3ea' }"
                    :data-r="r"
                    :data-c="c"
                    @click="handleCellClick(r, c)"
                    @contextmenu.prevent="eraseCell(r, c)"
                    @mouseenter="handleDragPaint($event, r, c)"
                    @mousedown="startDragPaint(r, c)"
                    @touchstart="handleTouchStart($event, r, c)"
                    @touchmove="handleTouchMove"
                    @touchend="stopDragPaint"
                  />
                </template>
              </div>
              <canvas v-show="ironEnabled && !ironUsesGL" ref="ironCanvasRef" class="iron-canvas"></canvas>
              <canvas v-show="ironEnabled && ironUsesGL" ref="ironGLCanvasRef" class="iron-canvas"></canvas>
            </div>
          </div>
        </div>

        <!-- 烫豆控制条 -->
        <div v-if="ironEnabled" class="meltbar">
          <button class="melt-play" @click="togglePlay">{{ isPlaying ? '⏸' : '▶' }}</button>
          <input
            class="melt-range"
            type="range"
            min="0"
            max="100"
            step="1"
            v-model.number="ironProgress"
            @input="onMeltSliderInput"
          />
          <span class="melt-pct">{{ ironProgress }}%</span>
          <div class="melt-styles">
            <button
              v-for="s in ironStyleOptions"
              :key="s.key"
              class="melt-style-btn"
              :class="{ active: ironStyle === s.key }"
              @click="ironStyle = s.key"
            >{{ s.name }}</button>
          </div>
          <button class="melt-close" @click="toggleIron">✕</button>
        </div>

        <div class="board-footer">
          <span>🖱️ 左键绘制 | 右键擦除 | 按住拖动连续绘制</span>
          <span class="mobile-hint">📱 手指滑动连续绘制</span>
        </div>
      </div>

      <!-- ==================== 右侧调色板 ==================== -->
      <div class="palette-section">
        <div class="current-color">
          <div class="color-preview" :style="{ backgroundColor: currentColor || '#f9f3ea' }"></div>
          <div class="color-name">{{ currentColorName }}</div>
        </div>

        <!-- 工具选择器 -->
        <div class="tool-selector">
          <button
            v-for="t in toolOptions"
            :key="t.key"
            class="tool-btn"
            :class="{ active: activeTool === t.key }"
            @click="setTool(t.key)"
          >
            <span class="tool-icon">{{ t.icon }}</span>
            <span class="tool-label">{{ t.name }}</span>
          </button>
        </div>

        <!-- 尺寸选择 -->
        <div class="size-section">
          <div class="size-section-title">画板尺寸</div>
          <div class="size-grid">
            <div
              v-for="preset in sizePresets"
              :key="preset.size"
              class="size-card"
              :class="{ active: gridSize === preset.size }"
              :title="`${preset.size} × ${preset.size}（${preset.size * preset.size} 格）`"
              @click="applyPresetSize(preset.size)"
            >
              <div class="size-thumb"></div>
              <div class="size-card-meta">
                <span class="n">{{ preset.size }}×{{ preset.size }}</span>
                <span class="meta">{{ preset.size * preset.size }} 格</span>
              </div>
            </div>

            <div
              class="size-card cs-card"
              :class="{ active: !sizePresets.some(p => p.size === gridSize) }"
            >
              <div class="cs-in">
                <span class="cs-t">自定义</span>
                <div class="cs-field" :class="{ bad: customError }">
                  <input
                    v-model.number="customSize"
                    type="number"
                    inputmode="numeric"
                    :min="15"
                    :max="156"
                    placeholder="边长"
                    @input="customError = ''"
                    @keyup.enter="applyCustomSize"
                  />
                  <span class="cs-eq">×{{ customSize || 'N' }}</span>
                </div>
                <el-button size="small" type="primary" class="cs-go" @click="applyCustomSize">生成</el-button>
              </div>
              <div v-if="customError" class="cs-note">{{ customError }}</div>
            </div>
          </div>
        </div>

        <!-- 在用颜色 -->
        <div class="used-colors" v-if="usedColors.length">
          <div class="used-colors-title">在用颜色 · {{ usedColors.length }} 种</div>
          <div class="used-colors-grid">
            <div
              v-for="item in usedColors"
              :key="item.hex"
              class="used-color-card"
              :class="{ active: currentColor === item.hex }"
              :title="`${item.name} · ${item.count} 颗`"
              @click="selectColor({ hex: item.hex, name: item.name })"
            >
              <div class="used-color-swatch" :style="{ backgroundColor: item.hex }"></div>
              <div class="used-color-count">{{ item.count }}</div>
              <div class="used-color-bar"><i :style="{ width: item.ratio * 100 + '%', backgroundColor: item.hex }"></i></div>
            </div>
          </div>
        </div>

        <!-- 全部色号 -->
        <el-tabs v-model="activeCategory" class="color-categories">
          <el-tab-pane
            v-for="category in colorCategories"
            :key="category.key"
            :label="category.name"
            :name="category.key"
          >
            <div class="color-grid">
              <div
                v-for="(color, index) in getCategoryColors(category.key)"
                :key="index"
                class="color-swatch"
                :class="{ active: currentColor === color.hex }"
                :style="{ backgroundColor: color.hex }"
                @click="selectColor(color)"
                :title="color.name"
              ></div>
              <div
                v-if="category.key === 'basic'"
                class="color-swatch eraser-swatch"
                :class="{ active: currentColor === null }"
                @click="selectEraser"
                title="橡皮擦"
              >🧹</div>
            </div>
          </el-tab-pane>
        </el-tabs>

        <!-- 进度记录表 -->
        <div class="progress-section">
          <div class="progress-head">
            <span class="progress-title">拼豆进度记录表</span>
            <button class="progress-clear" @click="clearChecked">清空记录</button>
          </div>
          <div class="progress-bar-wrap">
            <div class="progress-bar"><i :style="{ width: progressPct + '%' }"></i></div>
            <div class="progress-meta">
              <span class="pct">{{ progressPct }}%</span>
              <span class="cnt">{{ checkedCount }} / {{ totalColors }} 种</span>
            </div>
          </div>
          <div v-if="!tipClosed" class="progress-tip">
            <span>勾选已完成的色号，进度会自动更新</span>
            <button class="tip-close" @click="closeTip">✕</button>
          </div>
          <div class="progress-tools">
            <label class="tri-check">
              <input
                type="checkbox"
                :checked="allChecked"
                :indeterminate.prop="someChecked"
                @change="toggleAllCheck"
              />
              <span>全选</span>
            </label>
            <div class="sort-switch">
              <button :class="{ active: sortKey === 'count' }" @click="sortKey = 'count'">用量</button>
              <button :class="{ active: sortKey === 'code' }" @click="sortKey = 'code'">色号</button>
            </div>
          </div>
          <div class="progress-list" v-if="sortedUsedColors.length">
            <div
              v-for="item in sortedUsedColors"
              :key="item.hex"
              class="progress-row"
              :class="{ checked: checkedColors.has(item.hex), highlighted: highlightHex === item.hex }"
            >
              <div class="progress-swatch" :style="{ backgroundColor: item.hex }" @click="toggleHighlight(item.hex)"></div>
              <div class="progress-name">
                <span class="pn">{{ item.name }}</span>
                <span class="pc">{{ item.count }} 颗</span>
              </div>
              <button class="progress-check" :class="{ on: checkedColors.has(item.hex) }" @click="toggleCheck(item.hex)">
                {{ checkedColors.has(item.hex) ? '✓' : '' }}
              </button>
            </div>
          </div>
          <div class="progress-empty" v-else>画点东西，这里就会显示用色进度</div>
        </div>

        <!-- 操作按钮 -->
        <div class="tool-buttons">
          <el-button type="danger" @click="clearBoard" round>🧽 清空画板</el-button>
          <el-button type="success" @click="fillAllCurrent" round>🪣 填充全部</el-button>
          <el-button type="primary" @click="openPoster" round>📸 导出海报</el-button>
        </div>

        <div class="quick-actions">
          <el-button size="small" @click="randomFill" plain>🎲 随机填充</el-button>
          <el-button size="small" @click="createCheckerboard" plain>🏁 棋盘格</el-button>
          <el-button size="small" @click="createBorder" plain>🖼️ 边框</el-button>
          <el-button size="small" @click="mirrorHorizontal" plain>↔️ 镜像</el-button>
        </div>
      </div>
    </div>

    <!-- ==================== 导出海报抽屉 ==================== -->
    <teleport to="body">
      <transition name="drawer">
        <div v-if="posterOpen" class="poster-overlay" @click.self="closePoster">
          <div class="poster-drawer">
            <div class="poster-header">
              <span class="poster-title">导出海报</span>
              <button class="poster-close" @click="closePoster">✕</button>
            </div>
            <div class="poster-body">
              <div class="poster-preview-wrap">
                <canvas ref="posterCanvasRef" class="poster-preview"></canvas>
              </div>
              <div class="poster-options">
                <div class="poster-opt-row">
                  <span class="opt-label">主图</span>
                  <div class="seg">
                    <button :class="{ active: posterMode === 'share' }" @click="posterMode = 'share'">分享图</button>
                    <button :class="{ active: posterMode === 'grid' }" @click="posterMode = 'grid'">格子图</button>
                  </div>
                </div>
                <div class="poster-opt-row">
                  <span class="opt-label">烫后</span>
                  <div class="seg">
                    <button :class="{ active: !posterIron }" @click="posterIron = false">关闭</button>
                    <button :class="{ active: posterIron }" @click="posterIron = true">开启</button>
                  </div>
                </div>
                <div class="poster-opt-row" v-if="posterIron">
                  <span class="opt-label">烫法</span>
                  <div class="seg seg-wrap">
                    <button
                      v-for="s in ironStyleOptions"
                      :key="s.key"
                      :class="{ active: posterIronStyle === s.key }"
                      @click="posterIronStyle = s.key"
                    >{{ s.name }}</button>
                  </div>
                </div>
                <div class="poster-opt-row">
                  <span class="opt-label">缩放</span>
                  <div class="seg">
                    <button v-for="s in [1, 1.5, 2, 3]" :key="s" :class="{ active: posterScale === s }" @click="posterScale = s">{{ s }}×</button>
                  </div>
                </div>
                <div class="poster-opt-row">
                  <span class="opt-label">背景</span>
                  <div class="bg-swatches">
                    <button
                      v-for="bg in posterBgPresets"
                      :key="bg"
                      class="bg-swatch"
                      :class="{ active: posterBg === bg, transparent: bg === 'transparent' }"
                      :style="bg === 'transparent' ? {} : { backgroundColor: bg }"
                      :title="bg === 'transparent' ? '透明' : bg"
                      @click="posterBg = bg"
                    ></button>
                  </div>
                </div>
                <div class="poster-opt-row">
                  <span class="opt-label">格式</span>
                  <div class="seg">
                    <button :class="{ active: posterFormat === 'png' }" @click="posterFormat = 'png'">PNG</button>
                    <button :class="{ active: posterFormat === 'jpeg' }" @click="posterFormat = 'jpeg'">JPG</button>
                    <button :class="{ active: posterFormat === 'webp' }" @click="posterFormat = 'webp'">WebP</button>
                  </div>
                </div>
              </div>
            </div>
            <div class="poster-footer">
              <el-button type="primary" size="large" :loading="posterDownloading" @click="downloadPoster">下载海报</el-button>
            </div>
          </div>
        </div>
      </transition>
    </teleport>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue';
import { beadColors } from '@/config/beadColors.js';
import { ElMessage, ElMessageBox } from 'element-plus';

/* ==================== 色板辅助 ==================== */
const getAllColors = () => {
  const all = [];
  Object.values(beadColors).forEach(arr => all.push(...arr));
  return all;
};
const getCategoryColors = (key) => beadColors[key] || [];

// 预计算色板 RGB（最近邻取色用）
const beadRgbList = (() => {
  const list = [];
  Object.values(beadColors).forEach(arr => {
    arr.forEach(c => {
      list.push({
        hex: c.hex,
        r: parseInt(c.hex.slice(1, 3), 16),
        g: parseInt(c.hex.slice(3, 5), 16),
        b: parseInt(c.hex.slice(5, 7), 16),
      });
    });
  });
  return list;
})();

let nearestColorCache = new Map();
function findNearestBeadColor(r, g, b) {
  const key = (r << 16) | (g << 8) | b;
  const cached = nearestColorCache.get(key);
  if (cached) return cached;
  let bestHex = null;
  let bestDist = Infinity;
  for (let i = 0; i < beadRgbList.length; i++) {
    const it = beadRgbList[i];
    const dr = r - it.r, dg = g - it.g, db = b - it.b;
    const d = dr * dr + dg * dg + db * db;
    if (d < bestDist) { bestDist = d; bestHex = it.hex; }
  }
  nearestColorCache.set(key, bestHex);
  return bestHex;
}

/* ==================== 网格基础 ==================== */
const gridSize = ref(16);
const cellSize = ref(32);
const sizePresets = [{ size: 16 }, { size: 29 }, { size: 52 }, { size: 78 }, { size: 104 }];
const customSize = ref(40);
const customError = ref('');
const board = ref([]);

const gridStyle = computed(() => ({
  gridTemplateColumns: `repeat(${gridSize.value}, var(--cell))`,
  gap: Math.max(1, Math.floor(cellSize.value / 16)) + 'px',
  '--cell': cellSize.value + 'px',
}));

const gridElRef = ref(null);

/* ==================== 颜色 ==================== */
const currentColor = ref('#FF8C42');
const activeCategory = ref('basic');
const colorCategories = [
  { key: 'basic', name: '基础色系' },
  { key: 'A', name: '暖黄橙色系' },
  { key: 'B', name: '绿色自然系' },
  { key: 'C', name: '蓝色青色系' },
  { key: 'D', name: '紫色蓝紫系' },
  { key: 'E', name: '粉色红色系' },
  { key: 'F', name: '红橙色系' },
  { key: 'G', name: '棕色大地系' },
  { key: 'H', name: '中性灰度系' },
  { key: 'M', name: '混合复古系' },
];

const currentColorName = computed(() => {
  if (currentColor.value === null) return '橡皮擦';
  const c = getAllColors().find(x => x.hex === currentColor.value);
  return c ? c.name : '自定义颜色';
});

/* ==================== 工具 ==================== */
const activeTool = ref('brush');
const lastTool = ref('brush');
const toolOptions = [
  { key: 'brush', name: '画笔', icon: '✎' },
  { key: 'eraser', name: '橡皮', icon: '🧹' },
  { key: 'fill', name: '填充', icon: '🪣' },
  { key: 'picker', name: '取色', icon: '💧' },
];

function setTool(key) {
  if (key === 'picker') {
    if (activeTool.value !== 'picker') lastTool.value = activeTool.value;
    activeTool.value = 'picker';
  } else {
    lastTool.value = key;
    activeTool.value = key;
  }
}

/* ==================== 拖动状态 ==================== */
const isDragging = ref(false);
const lastTouchIndex = ref(null);

/* ==================== 画板操作 ==================== */
const initBoard = (size) => {
  const s = size || gridSize.value;
  const nb = [];
  for (let r = 0; r < s; r++) nb.push(Array(s).fill(null));
  board.value = nb;
};

const resizeBoard = (newSize) => {
  const old = board.value;
  const oldSize = old.length;
  if (newSize === oldSize) return;
  const nb = [];
  for (let r = 0; r < newSize; r++) {
    const row = [];
    for (let c = 0; c < newSize; c++) {
      row.push(r < oldSize && c < oldSize && old[r] && old[r][c] ? old[r][c] : null);
    }
    nb.push(row);
  }
  board.value = nb;
  adjustCellSize(newSize);
};

const adjustCellSize = (size) => {
  const isMobile = window.innerWidth <= 640;
  const baseSize = isMobile ? 24 : 32;
  const containerWidth = Math.min(window.innerWidth, 1200) - (isMobile ? 40 : 360);
  const containerHeight = window.innerHeight * 0.75;
  const cellByWidth = Math.floor(containerWidth / size);
  const cellByHeight = Math.floor(containerHeight / size);
  const optimal = Math.min(cellByWidth, cellByHeight, baseSize);
  cellSize.value = Math.max(isMobile ? 4 : 6, Math.min(optimal, isMobile ? 24 : 40));
};

const selectColor = (color) => { currentColor.value = color.hex; };
const selectEraser = () => { currentColor.value = null; };

const applyPresetSize = (size) => {
  if (gridSize.value === size) return;
  gridSize.value = size;
  resizeBoard(size);
};

const applyCustomSize = () => {
  const n = Number(customSize.value);
  if (!Number.isInteger(n) || n < 15 || n > 156) {
    customError.value = '请输入 15–156 之间的整数';
    return;
  }
  customError.value = '';
  if (gridSize.value === n) return;
  gridSize.value = n;
  resizeBoard(n);
};

/* ==================== 单格操作 ==================== */
const paintCell = (r, c) => {
  if (!board.value[r] || board.value[r][c] === undefined) return;
  board.value[r][c] = currentColor.value;
};

const eraseCell = (r, c) => {
  if (!board.value[r] || board.value[r][c] === undefined) return;
  board.value[r][c] = null;
};

function floodFill(r, c) {
  const size = gridSize.value;
  const grid = board.value;
  const target = grid[r]?.[c];
  if (target === undefined) return;
  const fillColor = currentColor.value;
  if (target === fillColor) return;
  const nb = grid.map(row => [...row]);
  const stack = [[r, c]];
  const visited = new Uint8Array(size * size);
  while (stack.length) {
    const [cr, cc] = stack.pop();
    if (cr < 0 || cr >= size || cc < 0 || cc >= size) continue;
    const idx = cr * size + cc;
    if (visited[idx]) continue;
    if (nb[cr][cc] !== target) continue;
    visited[idx] = 1;
    nb[cr][cc] = fillColor;
    stack.push([cr - 1, cc], [cr + 1, cc], [cr, cc - 1], [cr, cc + 1]);
  }
  board.value = nb;
}

function pickColor(r, c) {
  const hex = board.value[r]?.[c];
  if (!hex) return;
  currentColor.value = hex;
  activeTool.value = lastTool.value;
}

function handleCellClick(r, c) {
  if (activeTool.value === 'fill') { floodFill(r, c); return; }
  if (activeTool.value === 'picker') { pickColor(r, c); return; }
  // brush / eraser 已在 mousedown / touchstart 处理
}

const startDragPaint = (r, c) => {
  if (activeTool.value === 'fill' || activeTool.value === 'picker') return;
  isDragging.value = true;
  if (activeTool.value === 'eraser') eraseCell(r, c);
  else paintCell(r, c);
  document.body.style.userSelect = 'none';
  document.body.style.webkitUserSelect = 'none';
};

const handleDragPaint = (event, r, c) => {
  if (!isDragging.value) return;
  if (activeTool.value !== 'brush' && activeTool.value !== 'eraser') return;
  if (event.buttons !== 1) return;
  if (activeTool.value === 'eraser') eraseCell(r, c);
  else paintCell(r, c);
};

const stopDragPaint = () => {
  isDragging.value = false;
  lastTouchIndex.value = null;
  document.body.style.userSelect = '';
  document.body.style.webkitUserSelect = '';
};

const handleTouchStart = (event, r, c) => {
  event.preventDefault();
  if (activeTool.value === 'fill') { floodFill(r, c); return; }
  if (activeTool.value === 'picker') { pickColor(r, c); return; }
  isDragging.value = true;
  if (activeTool.value === 'eraser') eraseCell(r, c);
  else paintCell(r, c);
  lastTouchIndex.value = r * gridSize.value + c;
};

const handleTouchMove = (event) => {
  if (!isDragging.value) return;
  if (activeTool.value !== 'brush' && activeTool.value !== 'eraser') return;
  event.preventDefault();
  const touch = event.touches[0];
  const element = document.elementFromPoint(touch.clientX, touch.clientY);
  const pixelCell = element?.closest('.pixel-cell');
  if (pixelCell) {
    const r = Number(pixelCell.dataset.r);
    const c = Number(pixelCell.dataset.c);
    const newIndex = r * gridSize.value + c;
    if (newIndex !== lastTouchIndex.value) {
      if (activeTool.value === 'eraser') eraseCell(r, c);
      else paintCell(r, c);
      lastTouchIndex.value = newIndex;
    }
  }
};

/* ==================== 快捷工具 ==================== */
const clearBoard = () => initBoard();

const fillAllCurrent = () => {
  const nb = [];
  for (let r = 0; r < gridSize.value; r++) nb.push(Array(gridSize.value).fill(currentColor.value));
  board.value = nb;
};

const randomFill = () => {
  const allColors = getAllColors();
  const nb = [];
  for (let r = 0; r < gridSize.value; r++) {
    const row = [];
    for (let c = 0; c < gridSize.value; c++) {
      const rc = allColors[Math.floor(Math.random() * allColors.length)];
      row.push(rc ? rc.hex : null);
    }
    nb.push(row);
  }
  board.value = nb;
};

const createCheckerboard = () => {
  const color1 = currentColor.value;
  const nb = [];
  for (let r = 0; r < gridSize.value; r++) {
    const row = [];
    for (let c = 0; c < gridSize.value; c++) row.push((r + c) % 2 === 0 ? color1 : null);
    nb.push(row);
  }
  board.value = nb;
};

const createBorder = () => {
  const nb = board.value.map(r => [...r]);
  const borderColor = currentColor.value;
  for (let r = 0; r < gridSize.value; r++) {
    for (let c = 0; c < gridSize.value; c++) {
      if (r === 0 || r === gridSize.value - 1 || c === 0 || c === gridSize.value - 1) nb[r][c] = borderColor;
    }
  }
  board.value = nb;
};

const mirrorHorizontal = () => {
  board.value = board.value.map(row => [...row].reverse());
};

/* ==================== P2 视图 / 图片上传 ==================== */
const activeView = ref('grid');
const sourceImageUrl = ref('');
const sourceImageEl = ref(null);
const fileInputRef = ref(null);
const pixelPreviewCanvasRef = ref(null);

function switchView(v) {
  activeView.value = v;
  if (v === 'pixel') nextTick(renderPixelPreview);
}

function triggerFileInput() { fileInputRef.value?.click(); }

function onFileChange(e) {
  const file = e.target.files?.[0];
  if (file) handleFileUpload(file);
  e.target.value = '';
}

function onDrop(e) {
  const file = e.dataTransfer?.files?.[0];
  if (file && file.type.startsWith('image/')) handleFileUpload(file);
}

async function handleFileUpload(file) {
  if (!file.type.startsWith('image/')) { ElMessage.warning('请上传图片文件'); return; }
  const hasContent = board.value.some(row => row.some(c => c !== null));
  if (hasContent) {
    try {
      await ElMessageBox.confirm('上传新图片将清空当前画板，是否继续？', '提示', {
        type: 'warning', confirmButtonText: '继续', cancelButtonText: '取消',
      });
    } catch { return; }
  }
  const reader = new FileReader();
  reader.onload = (ev) => {
    const url = ev.target.result;
    const img = new Image();
    img.onload = () => {
      sourceImageUrl.value = url;
      sourceImageEl.value = img;
      imageToPixelBoard(img);
      activeView.value = 'source';
      ElMessage.success('已转换为拼豆图纸');
    };
    img.onerror = () => ElMessage.error('图片加载失败');
    img.src = url;
  };
  reader.onerror = () => ElMessage.error('读取文件失败');
  reader.readAsDataURL(file);
}

function imageToPixelBoard(image) {
  const size = gridSize.value;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  const iw = image.naturalWidth || image.width;
  const ih = image.naturalHeight || image.height;
  // contain：整张照片完整放入画板（不裁剪），四周留白区域为透明格
  const scale = Math.min(size / iw, size / ih);
  const dw = iw * scale, dh = ih * scale;
  const dx = (size - dw) / 2, dy = (size - dh) / 2;
  ctx.drawImage(image, dx, dy, dw, dh);
  const data = ctx.getImageData(0, 0, size, size).data;
  const nb = [];
  nearestColorCache = new Map();
  for (let r = 0; r < size; r++) {
    const row = [];
    for (let c = 0; c < size; c++) {
      const idx = (r * size + c) * 4;
      const a = data[idx + 3];
      if (a < 32) { row.push(null); continue; }
      row.push(findNearestBeadColor(data[idx], data[idx + 1], data[idx + 2]));
    }
    nb.push(row);
  }
  board.value = nb;
}

function renderPixelPreview() {
  const cv = pixelPreviewCanvasRef.value;
  if (!cv) return;
  const size = gridSize.value;
  const cell = Math.max(2, Math.floor(600 / size));
  cv.width = size * cell;
  cv.height = size * cell;
  const ctx = cv.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = '#f9f3ea';
  ctx.fillRect(0, 0, cv.width, cv.height);
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const color = board.value[r][c];
      if (color) {
        ctx.fillStyle = color;
        ctx.fillRect(c * cell, r * cell, cell, cell);
      }
    }
  }
}

function convertSourceToBoard() {
  if (!sourceImageEl.value) return;
  imageToPixelBoard(sourceImageEl.value);
  ElMessage.success('已更新拼豆图纸');
}

/* ==================== P4 用色统计 ==================== */
const colorIndexMap = computed(() => {
  const map = new Map();
  Object.values(beadColors).forEach(arr => {
    arr.forEach(c => { if (!map.has(c.hex)) map.set(c.hex, c); });
  });
  return map;
});

const usedColors = computed(() => {
  const counter = new Map();
  let total = 0;
  for (const row of board.value) {
    for (const cell of row) {
      if (cell) { counter.set(cell, (counter.get(cell) || 0) + 1); total++; }
    }
  }
  const arr = [];
  counter.forEach((count, hex) => {
    const info = colorIndexMap.value.get(hex);
    arr.push({ hex, name: info ? info.name : '自定义色', count, ratio: total ? count / total : 0 });
  });
  arr.sort((a, b) => b.count - a.count);
  return arr;
});

/* ==================== P5 进度记录表 ==================== */
const checkedColors = ref(new Set());
const sortKey = ref('count');
const tipClosed = ref(localStorage.getItem('tipClosed') === '1');
const highlightHex = ref(null);

const totalColors = computed(() => usedColors.value.length);
const checkedCount = computed(() => {
  let n = 0;
  usedColors.value.forEach(it => { if (checkedColors.value.has(it.hex)) n++; });
  return n;
});
const progressPct = computed(() => totalColors.value ? Math.round(checkedCount.value / totalColors.value * 100) : 0);
const allChecked = computed(() => totalColors.value > 0 && checkedCount.value === totalColors.value);
const someChecked = computed(() => checkedCount.value > 0 && checkedCount.value < totalColors.value);

const sortedUsedColors = computed(() => {
  const arr = [...usedColors.value];
  if (sortKey.value === 'code') arr.sort((a, b) => a.name.localeCompare(b.name, 'zh'));
  else arr.sort((a, b) => b.count - a.count);
  return arr;
});

function toggleCheck(hex) {
  const s = new Set(checkedColors.value);
  if (s.has(hex)) s.delete(hex); else s.add(hex);
  checkedColors.value = s;
}

function toggleAllCheck() {
  if (allChecked.value || someChecked.value) {
    checkedColors.value = new Set();
  } else {
    checkedColors.value = new Set(usedColors.value.map(it => it.hex));
  }
}

function clearChecked() { checkedColors.value = new Set(); }

function closeTip() {
  tipClosed.value = true;
  localStorage.setItem('tipClosed', '1');
}

function toggleHighlight(hex) {
  highlightHex.value = highlightHex.value === hex ? null : hex;
  if (highlightHex.value) activeView.value = 'grid';
}

/* ==================== P6 模拟烫豆 ==================== */
const ironEnabled = ref(false);
const ironStyle = ref('smooth');
const ironProgress = ref(0);
const isPlaying = ref(false);
const ironCanvasRef = ref(null);
const ironGLCanvasRef = ref(null);
const ironGLAvail = ref(true); // WebGL2 质感层是否可用（毛巾 / 澡巾 / 细闪 / 粗闪）
let ironGLInstance = null;
const ironUsesGL = computed(() => ironStyle.value !== 'smooth' && ironGLAvail.value);
let playTimer = null;
let rafId = null;
let lastDrawnProgress = -1;
let lastDrawnStyle = '';

const ironStyleOptions = [
  { key: 'smooth', name: '无孔' },
  { key: 'towel', name: '毛巾' },
  { key: 'towel-coarse', name: '澡巾' },
  { key: 'glitter-coarse', name: '粗闪' },
  { key: 'glitter-fine', name: '细闪' },
];

function toggleIron() {
  if (!ironEnabled.value) activeView.value = 'grid';
  ironEnabled.value = !ironEnabled.value;
  if (ironEnabled.value) {
    ironProgress.value = 0;
    stopPlay();
    lastDrawnProgress = -1;
    lastDrawnStyle = '';
    nextTick(() => {
      requestAnimationFrame(() => {
        resizeIronCanvas();
        startIronRaf();
      });
    });
  } else {
    stopPlay();
    stopIronRaf();
  }
}

function resizeIronCanvas() {
  const cv = ironCanvasRef.value;
  const gridEl = gridElRef.value;
  if (!cv || !gridEl) return;
  const dpr = window.devicePixelRatio || 1;
  cv.width = Math.max(1, Math.round(gridEl.offsetWidth * dpr));
  cv.height = Math.max(1, Math.round(gridEl.offsetHeight * dpr));
}

function roundRect(ctx, x, y, w, h, r) {
  r = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

// ===== 圆豆几何（对齐捷风样例 ironCellPath）：m=0 是独立圆豆，m=1 与邻豆融成一片 =====
const IRON_HOLE = 0.14; // 中心孔半径占比，与捷风 uHole 一致
function beadPath(ctx, x, y, s, m, nf) {
  const cx = x + s / 2, cy = y + s / 2, R0 = 0.43;
  // 四条边各自外伸：与邻豆都在熔的边伸到格边(+0.075)相压；自由边只微外扩(+0.03)并拉直
  const ext = f => (R0 + (f > 0 ? (0.505 - R0) * f : (0.46 - R0) * m)) * s;
  const eE = ext(nf.E), eW = ext(nf.W), eS = ext(nf.S), eN = ext(nf.N);
  // 圆角：外凸角随熔化收到 0.16；只要一侧熔合，该角收成直角与邻豆接平
  const rad = (a, b) => (R0 - (R0 - 0.16) * m) * (1 - Math.max(a, b) / Math.max(m, 1e-6)) * s;
  const lim = (r, a, b) => Math.max(0, Math.min(r, a, b));
  const L = cx - eW, Rt = cx + eE, T = cy - eN, B = cy + eS;
  const w = Rt - L, h = B - T;
  const rNE = lim(rad(nf.N, nf.E), w / 2, h / 2), rSE = lim(rad(nf.S, nf.E), w / 2, h / 2),
        rSW = lim(rad(nf.S, nf.W), w / 2, h / 2), rNW = lim(rad(nf.N, nf.W), w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(L + rNW, T);
  ctx.lineTo(Rt - rNE, T); if (rNE) ctx.arcTo(Rt, T, Rt, T + rNE, rNE);
  ctx.lineTo(Rt, B - rSE); if (rSE) ctx.arcTo(Rt, B, Rt - rSE, B, rSE);
  ctx.lineTo(L + rSW, B); if (rSW) ctx.arcTo(L, B, L, B - rSW, rSW);
  ctx.lineTo(L, T + rNW); if (rNW) ctx.arcTo(L, T, L + rNW, T, rNW);
  ctx.closePath();
}
function beadNeighborMelt(mat, r, c, dr, dc) {
  const sz = mat.length, nr = r + dr, nc = c + dc;
  if (nr < 0 || nc < 0 || nr >= sz || nc >= sz) return 0;
  const v = mat[nr]?.[nc];
  return v > 0 ? v : 0;
}
function computeMeltMatrix() {
  const size = gridSize.value, total = size * size, prog = ironProgress.value;
  const mat = [];
  for (let r = 0; r < size; r++) {
    const row = [];
    for (let c = 0; c < size; c++) {
      if (!board.value[r]?.[c]) { row.push(-1); continue; }
      const idx = r * size + c;
      const threshold = (idx / total) * 85; // 熔化扫描：从左上角一格格推进
      const span = 15;
      row.push(Math.min(1, Math.max(0, (prog - threshold) / span)));
    }
    mat.push(row);
  }
  return mat;
}
// ===== 捷风样例同款烫法质感层（WebGL2 着色器移植自 iron-gl.js）=====
// 毛巾 / 澡巾 / 细闪 / 粗闪：逐像素算熔豆形状与高度场，叠烫布纹理后由高度差求法线打光。
// 澡巾 = 细密均匀小颗粒；毛巾 = 毛圈压出的一团团凸起绒面（凹缝压暗、凸顶泛白、全哑光）；
// 细闪 / 粗闪 = 豆料里的闪粒，平时几乎看不见，转到对着光的那几粒才闪；光源缓慢摆动。
// 「无孔」不走这里（canvas 圆豆画法）；着色器不可用时全部退回 canvas 平涂。
const IRON_GL_PAPER = [249, 243, 234]; // '#f9f3ea' 画布底色
// sh：着色器烫法编号（0 无孔 / 1 澡巾 / 2 毛巾 / 3 细闪与粗闪）；mat：漫反射底、漫反射、高光强度、高光锐度
const IRON_GL_STYLES = {
  towel: { sh: 2, mat: [0.60, 0.44, 0.03, 8], p: [0, 0.5, 0.5] },
  'towel-coarse': { sh: 1, mat: [0.56, 0.48, 0.07, 12], p: [0.5] }, // 澡巾
  'glitter-fine': { sh: 3, mat: [0.56, 0.46, 0.10, 26], p: [0], glit: [0.16, 0.45, 0.15, 140] },
  'glitter-coarse': { sh: 3, mat: [0.56, 0.46, 0.14, 18], p: [0], glit: [0.52, 0.55, 0.45, 70], glitFill: true },
};
// amp = 纹理强度，scale = 纹理尺度（格）。大板纹理调稀调弱，闪粒比例按 1/amp 放大补回
const IRON_GL_TIERS = [
  { side: 36, amp: 1, scale: 1 }, { side: 52, amp: 1, scale: 1 },
  { side: 78, amp: 0.9, scale: 1.1 }, { side: 104, amp: 0.8, scale: 1.3 },
  { side: 156, amp: 0.6, scale: 1.7 },
];
function ironGLTierFor(side) {
  let t = IRON_GL_TIERS[0];
  for (const x of IRON_GL_TIERS) if (side >= x.side) t = x;
  return t;
}
function ironGLitFor(cfg, tier) {
  if (!cfg.glit) return undefined;
  const g = [...cfg.glit];
  if (cfg.glitFill) g[1] = Math.min(0.95, g[1] / Math.max(tier.amp || 1, 0.3));
  return g;
}
function createIronGL(cv) {
  const gl = cv.getContext('webgl2', { antialias: false, premultipliedAlpha: false, preserveDrawingBuffer: true });
  if (!gl) return null;
  const sh = (t, src) => {
    const x = gl.createShader(t); gl.shaderSource(x, src); gl.compileShader(x);
    if (!gl.getShaderParameter(x, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(x));
    return x;
  };
  let prog;
  try {
    prog = gl.createProgram();
    gl.attachShader(prog, sh(gl.VERTEX_SHADER, `#version 300 es
in vec2 aP; void main(){ gl_Position = vec4(aP, 0., 1.); }`));
    gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, `#version 300 es
precision highp float;
out vec4 o;
uniform sampler2D uGrid; uniform vec2 uDims;
uniform float uProg, uMeltT;
uniform vec4 uView;   // ox, oy, 每格 CSS px, 镜像(0/1)
uniform vec3 uCanvas; // 画布高(CSS px), dpr, 标尺宽
uniform int uStyle; uniform vec3 uP; uniform vec2 uTex; // 烫法参数；纹理强度、纹理尺度
uniform vec4 uGlit;   // 细闪 / 粗闪：闪粒位边长（格）、有闪粒比例、不对光时的提亮程度、闪光锐度
uniform vec4 uMat; uniform vec3 uL; uniform vec3 uPaper;
uniform float uClear; // 1 = 透明底：空格透明、豆边按覆盖度出 alpha（海报导出用）
float h21(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
vec2 h22(vec2 p){ float n = h21(p); return vec2(n, h21(p + n + 17.1)); }
float vn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
  return mix(mix(h21(i), h21(i + vec2(1, 0)), f.x), mix(h21(i + vec2(0, 1)), h21(i + vec2(1, 1)), f.x), f.y); }
float fbm(vec2 p){ float s = 0., a = .5; for (int i = 0; i < 4; i++){ s += a * vn(p); p = p * 2.03 + vec2(1.7, 9.2); a *= .5; } return s; }
float hash12(vec2 p){ vec3 p3 = fract(vec3(p.xyx) * .1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
float occ(vec2 c){ if (c.x < 0. || c.y < 0. || c.x > uDims.x - 1. || c.y > uDims.y - 1.) return 0.; return step(.5, texelFetch(uGrid, ivec2(c), 0).a); }
/* 熔化扫描与 canvas 画法同口径：按格序号从左上推进 + 少量随机 */
float cellMelt(vec2 c){
  float idx = c.y * uDims.x + c.x;
  float st = idx / max(uDims.x * uDims.y - 1., 1.) * .85 + hash12(c) * .06;
  float m = clamp((uProg - st) / .15, 0., 1.);
  return m * m * (3. - 2. * m) * uMeltT;
}
/* 熔豆：未熔是带孔圆豆，熔化度升高时朝「有邻豆且双方都在熔」的方向铺满到格边、孔收缩闭合。返回 (覆盖度, 豆体高度, 本格熔化度) */
vec3 bead(vec2 g, float aa){
  vec2 c = floor(g), f = fract(g) - .5;
  if (occ(c) < .5) return vec3(0.);
  float M = cellMelt(c);
  vec2 nx = c + vec2(f.x > 0. ? 1. : -1., 0.), ny = c + vec2(0., f.y > 0. ? 1. : -1.);
  float fx = occ(nx) * min(M, cellMelt(nx)), fy = occ(ny) * min(M, cellMelt(ny));
  float ux = max(abs(f.x) - fx * .5, 0.), uy = max(abs(f.y) - fy * .5, 0.);
  float p = mix(2., 7., M), R = mix(.43, .5, M);
  float d = pow(pow(ux, p) + pow(uy, p), 1. / p);
  float cov = 1. - smoothstep(R - aa, R + aa * .3, d);
  float hole = .18 * pow(max(0., 1. - M / .62), .8);
  if (hole > .005) cov *= smoothstep(hole - aa, hole + aa, length(f));
  float dome = sqrt(max(0., 1. - (d / R) * (d / R)));
  float hb = .14 * smoothstep(R, R - .1, d) + .22 * (1. - .85 * M) * dome;
  return vec3(cov, hb, M);
}
float fiber(vec2 p){ // 毛巾：三组方向的拉长脊状噪声叠成毛圈
  float dens = mix(5., 14., uP.z), len = mix(1.4, 5., uP.x), s = 0.;
  for (int k = 0; k < 3; k++){
    float a = float(k) * 2.094 + .4; mat2 R = mat2(cos(a), -sin(a), sin(a), cos(a));
    vec2 q = R * p * dens; q.x /= len;
    s += pow(1. - abs(vn(q + float(k) * 13.) * 2. - 1.), 3.);
  }
  return s / 3.;
}
float towelBlob(vec2 p){ // 毛巾：毛圈压进豆面留下的一团团圆鼓凸起（每格约 3 团，大小不一）
  float b = .62 * vn(p * 3.4 + 5.1) + .38 * vn(p * 7.1 + 1.3);
  return smoothstep(.30, .80, b);
}
float texH(vec2 g){
  vec2 p = g / uTex.y;
  if (uStyle == 1) // 澡巾：没有纹路，豆面是一层细密均匀的小颗粒，整体平整工整
    return (.5 + 2.5 * uP.x) * (.016 * vn(p * 16.) + .007 * vn(p * 37.));
  if (uStyle == 2) return .11 * towelBlob(p) + .04 * fiber(p) - .05 * uP.y * fbm(p * .8); // 毛巾：一团团凸起 + 表面绒毛
  return .008 * fbm(p * 5.);
}
float H(vec2 g, float aa){ vec3 b = bead(g, aa); return b.x * b.y + uTex.x * texH(g) * b.x * smoothstep(0., .5, b.z); }
vec3 colAt(vec2 g){ ivec2 c = clamp(ivec2(floor(g)), ivec2(0), ivec2(uDims) - 1); return texelFetch(uGrid, c, 0).rgb; }
void main(){
  float dpr = uCanvas.y;
  vec2 css = vec2(gl_FragCoord.x / dpr, uCanvas.x - gl_FragCoord.y / dpr);
  if (css.x < uCanvas.z || css.y < uCanvas.z) discard;
  float s = uView.z;
  vec2 g = vec2((css.x - uView.x) / s, (css.y - uView.y) / s);
  if (uView.w > .5) g.x = uDims.x - g.x;
  if (g.x < 0. || g.y < 0. || g.x > uDims.x || g.y > uDims.y) discard;
  float aa = .9 / (s * dpr);
  vec3 b = bead(g, aa);
  if (b.x < .002){ o = uClear > .5 ? vec4(0.) : vec4(uPaper, 1.); return; }
  float e = max(aa * .6, .004);
  float h0 = H(g, aa), hx = H(g + vec2(e, 0), aa), hy = H(g + vec2(0, e), aa);
  float sx = uView.w > .5 ? -1. : 1.;
  vec3 n = normalize(vec3(-sx * (hx - h0) / e, (hy - h0) / e, 1.));
  vec3 L = normalize(uL), V = vec3(0., 0., 1.), Hh = normalize(L + V);
  float Mc = smoothstep(0., .5, b.z);
  vec3 alb = colAt(g);
  if (uStyle == 2){ // 毛巾：凹缝压暗、凸起顶上绒毛泛白
    float tb = towelBlob(g / uTex.y), Mt = Mc * min(uTex.x, 1.2);
    float k = mix(.14, .34, smoothstep(.95, .55, max(alb.r, max(alb.g, alb.b))));
    alb *= mix(1., 1. + k * (tb - .4), Mt);
    alb = mix(alb, min(alb * 1.6 + .06, vec3(1.)), (.10 + .35 * fiber(g / uTex.y) * tb) * Mt);
  }
  if (uStyle == 1) alb = alb * mix(1., .97 + .05 * vn(g / uTex.y * 16.), Mc);
  float ndl = max(dot(n, L), 0.);
  vec3 col = alb * (uMat.x + uMat.y * ndl) / (uMat.x + uMat.y * L.z) + uMat.z * pow(max(dot(n, Hh), 0.), uMat.w);
  if (uStyle == 3 && b.x > .5){ // 细闪 / 粗闪：闪粒平时几乎看不见，转到对着光的那几粒才闪
    float cs = max(uGlit.x, 1.6 / (s * dpr));
    vec2 q = mat2(.89, -.45, .45, .89) * g / cs, i = floor(q), f = fract(q) - .5 - (h22(i + 2.) - .5) * .5;
    if (h21(i + 3.1) < uGlit.y){
      vec2 rn = h22(i + 11.7); float a = rn.x * 6.283, t = sqrt(rn.y) * .9;
      vec3 fn = vec3(sin(t) * cos(a), sin(t) * sin(a), cos(t));
      vec3 fc = mix(vec3(1., .98, .94), .6 + .4 * cos(6.283 * (h21(i + 5.) + vec3(0., .33, .67))), uP.x);
      float sp = pow(max(dot(fn, Hh), 0.), uGlit.w), dot0 = 1. - smoothstep(.12, .3, length(f));
      col = mix(col, mix(col, fc, .35), uGlit.z * dot0 * uTex.x * Mc) + fc * sp * 2.4 * dot0 * uTex.x * Mc;
    }
  }
  o = uClear > .5 ? vec4(min(col, 1.), b.x) : vec4(mix(uPaper, min(col, 1.), b.x), 1.);
}`));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog));
  } catch (e) {
    console.warn('[烫豆] 着色器不可用，退回平面画法', e);
    return null;
  }
  gl.useProgram(prog);
  const U = {}; const u = n => U[n] || (U[n] = gl.getUniformLocation(prog, n));
  const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, 'aP'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  const tex = gl.createTexture();
  let dims = [1, 1];
  cv.addEventListener('webglcontextlost', e => e.preventDefault());
  /* board[r][c] 为 '#RRGGBB' 或空 */
  function setGrid(board) {
    const h = board.length, w = h ? board[0].length : 0, d = new Uint8Array(w * h * 4);
    for (let r = 0; r < h; r++) for (let c = 0; c < w; c++) {
      const hex = board[r][c]; if (!hex) continue;
      const n = parseInt(hex.slice(1), 16), k = (r * w + c) * 4;
      d[k] = (n >> 16) & 255; d[k + 1] = (n >> 8) & 255; d[k + 2] = n & 255; d[k + 3] = 255;
    }
    gl.bindTexture(gl.TEXTURE_2D, tex); gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, d);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    dims = [w, h];
  }
  /* o: { w, h(CSS px), dpr, s(每格 CSS px), progress(0..1), style, mat, melt, amp, scale, p, glit, time(秒), paper, clear } */
  function render(o) {
    const W = Math.round(o.w * o.dpr), Hd = Math.round(o.h * o.dpr);
    if (cv.width !== W || cv.height !== Hd) { cv.width = W; cv.height = Hd; }
    const pc = o.paper || [237, 233, 223];
    gl.viewport(0, 0, W, Hd);
    gl.clearColor(pc[0] / 255, pc[1] / 255, pc[2] / 255, o.clear ? 0 : 1);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.uniform2f(u('uDims'), dims[0], dims[1]);
    gl.uniform1f(u('uProg'), o.progress);
    gl.uniform1f(u('uMeltT'), o.melt ?? 1);
    gl.uniform4f(u('uView'), 0, 0, o.s, 0);
    gl.uniform3f(u('uCanvas'), o.h, o.dpr, 0);
    gl.uniform1i(u('uStyle'), o.style);
    const p = o.p || [];
    gl.uniform3f(u('uP'), p[0] ?? 0.5, p[1] ?? 0.5, p[2] ?? 0.5);
    gl.uniform2f(u('uTex'), o.amp, Math.max(o.scale, 0.2));
    const gq = o.glit || [0.3, 0.3, 0.2, 140];
    gl.uniform4f(u('uGlit'), gq[0], gq[1], gq[2], gq[3] ?? 140);
    gl.uniform4fv(u('uMat'), o.mat);
    const t = o.time || 0; // 光源缓慢摆动：闪片与毛面的明暗跟着变
    gl.uniform3f(u('uL'), -0.45 + 0.28 * Math.sin(t * 0.6), 0.6 + 0.22 * Math.sin(t * 0.43), 0.75);
    gl.uniform3f(u('uPaper'), pc[0] / 255, pc[1] / 255, pc[2] / 255);
    gl.uniform1f(u('uClear'), o.clear ? 1 : 0);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }
  return { setGrid, render, lastBoard: null };
}
/* 实时预览：整板交给 GL 质感层，逐帧渲染（光源摆动 + 闪粒） */
function renderIronGL(timeSec) {
  const cv = ironGLCanvasRef.value;
  if (!cv) return;
  if (!ironGLInstance) ironGLInstance = createIronGL(cv);
  if (!ironGLInstance) { ironGLAvail.value = false; lastDrawnProgress = -1; return; }
  const gridEl = gridElRef.value;
  if (!gridEl) return;
  const cfg = IRON_GL_STYLES[ironStyle.value];
  if (!cfg) return;
  const size = gridSize.value;
  if (ironGLInstance.lastBoard !== board.value) {
    ironGLInstance.setGrid(board.value);
    ironGLInstance.lastBoard = board.value;
  }
  const dpr = window.devicePixelRatio || 1;
  const wCss = gridEl.offsetWidth, hCss = gridEl.offsetHeight;
  const tier = ironGLTierFor(size);
  try {
    ironGLInstance.render({
      w: wCss, h: hCss, dpr, s: wCss / size,
      progress: ironProgress.value / 100, melt: 1,
      style: cfg.sh, mat: cfg.mat, amp: tier.amp, scale: tier.scale,
      p: cfg.p, glit: ironGLitFor(cfg, tier),
      time: timeSec, paper: IRON_GL_PAPER,
    });
  } catch (e) {
    console.warn('[烫豆] 质感层渲染失败，退回平面画法', e);
    ironGLAvail.value = false;
    lastDrawnProgress = -1;
  }
}

function drawIron(now) {
  const cv = ironCanvasRef.value;
  if (!cv) return;
  const dpr = window.devicePixelRatio || 1;
  const ctx = cv.getContext('2d');
  const W = cv.width / dpr, H = cv.height / dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, W, H);
  // 烫豆成品视角：画布底铺纸面，盖住底层网格，缝隙与中心孔都透出纸色（不再透出方块）
  ctx.fillStyle = '#f9f3ea';
  ctx.fillRect(0, 0, W, H);

  const size = gridSize.value;
  const step = W / size;                 // 实际每格间距，与 DOM 网格对齐
  const mat = computeMeltMatrix();

  // 收集所有有豆的格子（含 m=0：独立圆豆带孔；m=1：与邻豆融成一片）
  const items = [];
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const color = board.value[r]?.[c];
      if (!color) continue;
      const m = mat[r][c];
      const x = c * step, y = r * step;
      const nE = Math.min(m, beadNeighborMelt(mat, r, c, 0, 1));
      const nW = Math.min(m, beadNeighborMelt(mat, r, c, 0, -1));
      const nS = Math.min(m, beadNeighborMelt(mat, r, c, 1, 0));
      const nN = Math.min(m, beadNeighborMelt(mat, r, c, -1, 0));
      items.push({ x, y, s: step, color, m, nf: { E: nE, W: nW, S: nS, N: nN, m }, r, c });
    }
  }
  // 第一遍：所有豆体（m>0 描同色边补抗锯齿缝，几何重叠处不留纸色细线）
  items.forEach(it => {
    beadPath(ctx, it.x, it.y, it.s, it.m, it.nf);
    ctx.fillStyle = it.color; ctx.fill();
    if (it.m > 0) { ctx.strokeStyle = it.color; ctx.lineWidth = 1; ctx.stroke(); }
  });
  // 第二遍：本格内重铺本色盖住邻豆伸进来的描边，再画中心孔
  // （毛巾 / 澡巾 / 细闪 / 粗闪的质感由 GL 质感层负责；着色器不可用时所有烫法统一平涂）
  items.forEach(it => {
    const { x, y, s, color, m, nf } = it;
    const cx = x + s / 2, cy = y + s / 2;
    ctx.save();
    ctx.beginPath(); ctx.rect(x, y, s, s); ctx.clip();
    beadPath(ctx, x, y, s, m, nf); ctx.fillStyle = color; ctx.fill();
    ctx.restore();
    // 中心孔：透出纸面，随熔化 (1 - m^0.7) 收缩闭合
    const ri = IRON_HOLE * (1 - Math.pow(m, 0.7)) * s;
    if (ri > 0.4) {
      ctx.fillStyle = '#f9f3ea';
      ctx.beginPath(); ctx.arc(cx, cy, ri, 0, 7); ctx.fill();
    }
  });
}

function ironLoop(now) {
  if (ironUsesGL.value) {
    renderIronGL((now || performance.now()) / 1000); // 光源缓慢摆动 + 闪粒明暗，逐帧渲染
  } else if (ironProgress.value !== lastDrawnProgress || ironStyle.value !== lastDrawnStyle) {
    drawIron(now);
    lastDrawnProgress = ironProgress.value;
    lastDrawnStyle = ironStyle.value;
  }
  rafId = requestAnimationFrame(ironLoop);
}

function startIronRaf() {
  stopIronRaf();
  rafId = requestAnimationFrame(ironLoop);
}

function stopIronRaf() {
  if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
}

function startPlay() {
  if (isPlaying.value) return;
  if (ironProgress.value >= 100) ironProgress.value = 0;
  isPlaying.value = true;
  playTimer = setInterval(() => {
    ironProgress.value = Math.min(100, ironProgress.value + 2);
    if (ironProgress.value >= 100) stopPlay();
  }, 60);
}

function stopPlay() {
  isPlaying.value = false;
  if (playTimer) { clearInterval(playTimer); playTimer = null; }
}

function togglePlay() {
  if (isPlaying.value) stopPlay(); else startPlay();
}

function onMeltSliderInput() {
  stopPlay();
  lastDrawnProgress = -1;
}

/* ==================== P7 导出海报 ==================== */
const posterOpen = ref(false);
const posterMode = ref('share');
const posterIron = ref(false);
const posterIronStyle = ref('smooth');
const posterScale = ref(1);
const posterBg = ref('#f9f3ea');
const posterBgPresets = ['#f9f3ea', '#ffffff', '#000000', '#ffecd2', '#fbe9e7', 'transparent'];
const posterFormat = ref('png');
const posterCanvasRef = ref(null);
const posterDownloading = ref(false);

function openPoster() {
  posterOpen.value = true;
  nextTick(() => renderPoster());
}

function closePoster() { posterOpen.value = false; }

function drawPosterIron(ctx, x, y, s, color, r, c) {
  // 仅「无孔」走这里：完全熔合的平涂豆片（有纹理的烫法整板走 renderPosterIronGL）
  const size = gridSize.value;
  const occ = (rr, cc) => rr >= 0 && cc >= 0 && rr < size && cc < size && !!board.value[rr]?.[cc];
  const m = 1; // 导出终态：完全熔合
  const nf = {
    E: occ(r, c + 1) ? 1 : 0, W: occ(r, c - 1) ? 1 : 0,
    S: occ(r + 1, c) ? 1 : 0, N: occ(r - 1, c) ? 1 : 0, m
  };
  beadPath(ctx, x, y, s, m, nf);
  ctx.fillStyle = color; ctx.fill();
  ctx.strokeStyle = color; ctx.lineWidth = 1; ctx.stroke();
}

/* 海报导出：毛巾 / 澡巾 / 细闪 / 粗闪 整板交给捷风同款 GL 质感层（透明底，孔与缝隙透出海报底色） */
function renderPosterIronGL(ctx, ox, oy, size, cell) {
  const cv = ironGLCanvasRef.value;
  if (!cv) return false;
  if (!ironGLInstance) ironGLInstance = createIronGL(cv);
  if (!ironGLInstance) { ironGLAvail.value = false; return false; }
  const cfg = IRON_GL_STYLES[posterIronStyle.value];
  if (!cfg) return false;
  if (ironGLInstance.lastBoard !== board.value) {
    ironGLInstance.setGrid(board.value);
    ironGLInstance.lastBoard = board.value;
  }
  const scale = posterScale.value || 1;
  const boardPx = size * cell;
  const tier = ironGLTierFor(size);
  try {
    ironGLInstance.render({
      w: boardPx * scale, h: boardPx * scale, dpr: 1, s: cell * scale,
      progress: 1, melt: 1, style: cfg.sh, mat: cfg.mat,
      amp: tier.amp, scale: tier.scale, p: cfg.p, glit: ironGLitFor(cfg, tier),
      time: 1.3, paper: IRON_GL_PAPER, clear: true,
    });
  } catch (e) {
    console.warn('[海报] 质感层渲染失败，退回平面画法', e);
    ironGLAvail.value = false;
    return false;
  }
  ctx.drawImage(cv, ox, oy, boardPx, boardPx);
  return true;
}

function renderPoster() {
  const cv = posterCanvasRef.value;
  if (!cv) return;
  const size = gridSize.value;
  const cell = size <= 52 ? 16 : size <= 104 ? 10 : 8;
  const pad = size <= 40 ? 24 : 16;
  const infoH = posterMode.value === 'share' ? 100 : 40;
  const boardPx = size * cell;
  const baseW = boardPx + pad * 2;
  const baseH = boardPx + pad * 2 + infoH;
  const scale = posterScale.value;

  cv.width = Math.round(baseW * scale);
  cv.height = Math.round(baseH * scale);
  const ctx = cv.getContext('2d');
  ctx.setTransform(scale, 0, 0, scale, 0, 0);
  ctx.imageSmoothingEnabled = false;

  if (posterBg.value === 'transparent') {
    ctx.clearRect(0, 0, baseW, baseH);
  } else {
    ctx.fillStyle = posterBg.value;
    ctx.fillRect(0, 0, baseW, baseH);
  }

  const ox = pad, oy = pad;

  // 有纹理的烫法：整板交给 GL 质感层一次渲染（含融边与中心孔）
  const glDone = posterIron.value && posterIronStyle.value !== 'smooth'
    && renderPosterIronGL(ctx, ox, oy, size, cell);

  if (glDone) {
    if (posterMode.value === 'grid') {
      ctx.strokeStyle = 'rgba(0,0,0,0.18)';
      ctx.lineWidth = 0.5;
      for (let i = 0; i <= size; i++) {
        ctx.beginPath(); ctx.moveTo(ox + i * cell, oy); ctx.lineTo(ox + i * cell, oy + boardPx); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(ox, oy + i * cell); ctx.lineTo(ox + boardPx, oy + i * cell); ctx.stroke();
      }
    }
  } else {
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        const color = board.value[r][c];
        const x = ox + c * cell;
        const y = oy + r * cell;
        if (color) {
          if (posterIron.value) drawPosterIron(ctx, x, y, cell, color, r, c);
          else { ctx.fillStyle = color; ctx.fillRect(x, y, cell, cell); }
        }
        if (posterMode.value === 'grid') {
          ctx.strokeStyle = color ? 'rgba(0,0,0,0.18)' : 'rgba(150,120,80,0.18)';
          ctx.lineWidth = 0.5;
          ctx.strokeRect(x + 0.25, y + 0.25, cell - 0.5, cell - 0.5);
        }
      }
    }
  }

  if (posterMode.value === 'grid') {
    ctx.fillStyle = 'rgba(93,64,55,0.6)';
    ctx.font = '9px "PingFang SC", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const stepLabel = Math.max(1, Math.ceil(size / 20));
    for (let c = 0; c < size; c += stepLabel) {
      ctx.fillText(String(c + 1), ox + c * cell + cell / 2, oy - 8);
    }
    ctx.textAlign = 'right';
    for (let r = 0; r < size; r += stepLabel) {
      ctx.fillText(String(r + 1), ox - 6, oy + r * cell + cell / 2);
    }
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
  }

  if (posterMode.value === 'share') {
    const infoY = oy + boardPx + 22;
    ctx.fillStyle = '#5d4037';
    ctx.font = '600 16px "PingFang SC", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`拼豆像素画 · ${size}×${size}`, baseW / 2, infoY);
    const totalBeads = usedColors.value.reduce((s, it) => s + it.count, 0);
    ctx.font = '12px "PingFang SC", sans-serif';
    ctx.fillStyle = '#7b5e47';
    ctx.fillText(`共 ${totalBeads} 颗 · ${usedColors.value.length} 种颜色`, baseW / 2, infoY + 22);
    const legend = usedColors.value.slice(0, 12);
    if (legend.length) {
      const dotR = 5;
      const gapDot = 16;
      const totalW = legend.length * gapDot;
      let lx = (baseW - totalW) / 2 + gapDot / 2;
      const ly = infoY + 46;
      legend.forEach(it => {
        ctx.fillStyle = it.hex;
        ctx.beginPath();
        ctx.arc(lx, ly, dotR, 0, Math.PI * 2);
        ctx.fill();
        lx += gapDot;
      });
    }
    ctx.textAlign = 'left';
  }
}

watch([posterMode, posterIron, posterIronStyle, posterScale, posterBg], () => {
  if (posterOpen.value) renderPoster();
});

async function downloadPoster() {
  if (posterDownloading.value) return;
  renderPoster();
  await nextTick();
  const cv = posterCanvasRef.value;
  if (!cv) return;
  posterDownloading.value = true;
  try {
    let mime = 'image/png';
    let ext = 'png';
    if (posterFormat.value === 'jpeg') { mime = 'image/jpeg'; ext = 'jpg'; }
    else if (posterFormat.value === 'webp') { mime = 'image/webp'; ext = 'webp'; }

    let output = cv;
    if (mime !== 'image/png' && posterBg.value === 'transparent') {
      output = document.createElement('canvas');
      output.width = cv.width;
      output.height = cv.height;
      const octx = output.getContext('2d');
      octx.fillStyle = '#ffffff';
      octx.fillRect(0, 0, output.width, output.height);
      octx.drawImage(cv, 0, 0);
    }

    const blob = await new Promise(res => output.toBlob(res, mime, 0.92));
    if (!blob) { ElMessage.error('导出失败，请重试'); return; }
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `拼豆像素画-${gridSize.value}x${gridSize.value}.${ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 10000);
    ElMessage.success('已开始下载');
  } catch (e) {
    ElMessage.error('导出失败：' + (e.message || '未知错误'));
  } finally {
    posterDownloading.value = false;
  }
}

/* ==================== 快捷键 / 生命周期 ==================== */
function onKeydown(e) {
  const tag = (e.target?.tagName || '').toLowerCase();
  if (tag === 'input' || tag === 'textarea' || e.target?.isContentEditable) return;
  const k = e.key.toLowerCase();
  if (k === 'b') setTool('brush');
  else if (k === 'x') setTool('eraser');
  else if (k === 'g') setTool('fill');
  else if (k === 'i') setTool('picker');
}

function onBodyTouchMove(e) {
  if (isDragging.value) e.preventDefault();
}

const handleResize = () => {
  adjustCellSize(gridSize.value);
  if (ironEnabled.value) {
    nextTick(() => {
      resizeIronCanvas();
      lastDrawnProgress = -1;
    });
  }
};

watch([gridSize, cellSize], () => {
  if (ironEnabled.value) {
    nextTick(() => {
      resizeIronCanvas();
      lastDrawnProgress = -1;
    });
  }
});

onMounted(() => {
  initBoard();
  adjustCellSize(gridSize.value);
  window.addEventListener('resize', handleResize);
  window.addEventListener('mouseup', stopDragPaint);
  window.addEventListener('keydown', onKeydown);
  document.body.addEventListener('touchmove', onBodyTouchMove, { passive: false });
});

onUnmounted(() => {
  window.removeEventListener('resize', handleResize);
  window.removeEventListener('mouseup', stopDragPaint);
  window.removeEventListener('keydown', onKeydown);
  document.body.removeEventListener('touchmove', onBodyTouchMove);
  stopPlay();
  stopIronRaf();
  ironGLInstance = null;
});
</script>

<style scoped>
/* ============ 容器 ============ */
.app-container {
  --primary-bg: #fbe9e7;
  --secondary-bg: #ffecd2;
  --card-bg: rgba(255, 248, 245, 0.9);
  --board-bg: #ffffffdd;
  --grid-bg: #f5ede6;
  --grid-line: #e0ceb7;
  --text-primary: #5d4037;
  --text-secondary: #7b5e47;
  --shadow-sm: 0 2px 8px rgba(0, 0, 0, 0.1);
  --shadow-md: 0 4px 16px rgba(0, 0, 0, 0.12);
  --shadow-lg: 0 12px 32px rgba(0, 0, 0, 0.15);
  --border-radius: 24px;
  --transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  --accent: #FF8C42;

  background: linear-gradient(135deg, var(--primary-bg) 0%, var(--secondary-bg) 100%);
  font-family: 'Helvetica Neue', Helvetica, 'PingFang SC', 'Microsoft YaHei', sans-serif;
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding: 20px 16px 32px;
  box-sizing: border-box;
}

/* ============ 主布局 ============ */
.game-layout {
  display: grid;
  grid-template-columns: 1fr 320px;
  gap: 24px;
  align-items: start;
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
}

@media (min-width: 901px) and (max-width: 1100px) {
  .game-layout { grid-template-columns: 1fr 300px; }
}

@media (max-width: 900px) {
  .game-layout {
    grid-template-columns: 1fr;
    gap: 16px;
  }
  .palette-section {
    order: 2;
    position: static;
  }
}

@media (max-width: 640px) {
  .game-layout { gap: 12px; }
  .board-section { padding: 10px; }
  .palette-section { padding: 10px; overflow-y: auto; -webkit-overflow-scrolling: touch; }
}

@media (max-width: 480px) {
  .game-layout { gap: 8px; }
  .board-section { padding: 8px; }
  .palette-section { padding: 8px; }
}

/* ============ 左侧画板 ============ */
.board-section {
  background: var(--card-bg);
  backdrop-filter: blur(20px);
  border-radius: 10px;
  padding: 10px;
  box-shadow: var(--shadow-lg);
  border: 1px solid rgba(255, 255, 255, 0.6);
  min-width: 0;
}

.board-topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 10px;
  flex-wrap: wrap;
}

.viewtabs {
  display: inline-flex;
  background: #f5efe6;
  border-radius: 10px;
  padding: 3px;
  gap: 2px;
}

.viewtab {
  border: none;
  background: transparent;
  color: var(--text-secondary);
  font-size: 0.82rem;
  font-weight: 600;
  padding: 6px 14px;
  border-radius: 8px;
  cursor: pointer;
  transition: var(--transition);
  font-family: inherit;
}

.viewtab.active {
  background: #fff;
  color: var(--accent);
  box-shadow: var(--shadow-sm);
}

.iron-toggle {
  border: 1px solid #e0ceb7;
  background: #fffaf7;
  color: var(--text-primary);
  font-size: 0.82rem;
  font-weight: 600;
  padding: 7px 14px;
  border-radius: 10px;
  cursor: pointer;
  transition: var(--transition);
  font-family: inherit;
  white-space: nowrap;
}

.iron-toggle:hover { border-color: var(--accent); }
.iron-toggle.active {
  border-color: var(--accent);
  background: #fff3e8;
  color: var(--accent);
}

.grid-container {
  background: var(--board-bg);
  border-radius: 16px;
  padding: 6px;
  box-shadow: inset 0 2px 10px rgba(0, 0, 0, 0.05);
  min-height: 300px;
  display: flex;
  justify-content: center;
  align-items: center;
}

/* 原图视图 */
.source-view {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 10px;
}

.upload-placeholder {
  width: 100%;
  max-width: 460px;
  min-height: 240px;
  border: 2px dashed #d4b896;
  border-radius: 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  cursor: pointer;
  background: #fffaf7;
  transition: var(--transition);
}

.upload-placeholder:hover { border-color: var(--accent); background: #fff3e8; }
.upload-icon { font-size: 2.4rem; }
.upload-title { font-size: 0.95rem; font-weight: 600; color: var(--text-primary); }
.upload-sub { font-size: 0.75rem; color: var(--text-secondary); }

.source-preview {
  max-width: 100%;
  max-height: 55vh;
  object-fit: contain;
  border-radius: 12px;
  box-shadow: var(--shadow-md);
}

.source-actions { display: flex; gap: 8px; }

/* 转换图视图 */
.pixel-view {
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 10px;
}

.pixel-preview-canvas {
  max-width: 100%;
  max-height: 60vh;
  image-rendering: pixelated;
  border-radius: 10px;
  box-shadow: var(--shadow-md);
  background: #f9f3ea;
}

/* 图纸视图 */
.grid-wrapper {
  max-width: 100%;
  max-height: 70vh;
  overflow: auto;
  border-radius: 16px;
  background: var(--grid-bg);
  padding: 12px;
  box-shadow: inset 0 0 0 2px var(--grid-line);
  -webkit-overflow-scrolling: touch;
}

.grid-stack {
  position: relative;
  width: fit-content;
  margin: 0 auto;
}

.pixel-grid {
  display: grid;
  gap: 1px;
  width: fit-content;
  margin: 0 auto;
}

.pixel-cell {
  background-color: #f9f3ea;
  border-radius: 2px;
  cursor: pointer;
  transition: var(--transition);
  position: relative;
  width: var(--cell);
  height: var(--cell);
  aspect-ratio: 1;
  box-shadow: inset 0 0 0 1px rgba(150, 120, 80, 0.2);
}

.pixel-cell.highlight {
  box-shadow: inset 0 0 0 2px var(--accent), 0 0 5px rgba(255, 140, 66, 0.8);
  z-index: 2;
}

@media (max-width: 768px) {
  .pixel-cell { cursor: none; touch-action: none; }
  .pixel-cell:active { transform: scale(1.05); }
}

@media (min-width: 769px) {
  .pixel-cell:hover {
    transform: scale(1.15);
    box-shadow: 0 0 0 2px rgba(255, 140, 0, 0.8);
    z-index: 10;
  }
}

.pixel-cell.filled { box-shadow: inset 0 -2px 4px rgba(0, 0, 0, 0.2); }

/* 烫合覆盖层 */
.iron-canvas {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 5;
}

/* 烫豆控制条 */
.meltbar {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 10px;
  padding: 8px 12px;
  background: #fffaf7;
  border: 1px solid #e0ceb7;
  border-radius: 12px;
  flex-wrap: wrap;
}

.melt-play {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  border: none;
  background: var(--accent);
  color: #fff;
  font-size: 0.85rem;
  cursor: pointer;
  flex-shrink: 0;
}

.melt-range {
  flex: 1;
  min-width: 120px;
  accent-color: var(--accent);
  height: 4px;
}

.melt-pct {
  font-size: 0.78rem;
  font-weight: 700;
  color: var(--text-primary);
  min-width: 38px;
  text-align: right;
}

.melt-styles {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}

.melt-style-btn {
  border: 1px solid #e0ceb7;
  background: #fff;
  color: var(--text-secondary);
  font-size: 0.72rem;
  padding: 4px 8px;
  border-radius: 6px;
  cursor: pointer;
  transition: var(--transition);
  font-family: inherit;
}

.melt-style-btn.active {
  background: var(--accent);
  border-color: var(--accent);
  color: #fff;
}

.melt-close {
  border: none;
  background: transparent;
  color: var(--text-secondary);
  font-size: 0.9rem;
  cursor: pointer;
  padding: 4px;
}

.board-footer {
  margin-top: 10px;
  text-align: center;
  color: var(--text-secondary);
  font-size: 0.85rem;
}

.mobile-hint { display: none; font-size: 0.72rem; margin-left: 8px; }

@media (max-width: 640px) {
  .board-footer span:first-child { display: none; }
  .mobile-hint { display: inline-block; }
}

/* ============ 右侧调色板 ============ */
.palette-section {
  background: var(--card-bg);
  backdrop-filter: blur(20px);
  border-radius: 10px;
  padding: 10px;
  box-shadow: var(--shadow-lg);
  border: 1px solid rgba(255, 255, 255, 0.6);
  position: sticky;
  top: 20px;
}

@media (max-width: 900px) {
  .palette-section { position: relative; top: 0; }
}

/* 当前颜色 */
.current-color {
  display: flex;
  align-items: center;
  gap: 16px;
  background: #f5efe6;
  padding: 12px 16px;
  border-radius: 10px;
  margin-bottom: 12px;
  flex-wrap: wrap;
}

@media (max-width: 480px) {
  .current-color { gap: 8px; padding: 8px 12px; }
}

.color-preview {
  width: 48px;
  height: 48px;
  border-radius: 16px;
  border: 3px solid white;
  box-shadow: var(--shadow-md);
  transition: var(--transition);
}

@media (max-width: 480px) {
  .color-preview { width: 36px; height: 36px; border-radius: 12px; }
}

.color-name { font-weight: 600; color: var(--text-primary); font-size: 1rem; flex: 1; }

/* 工具选择器 */
.tool-selector {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 6px;
  margin-bottom: 14px;
}

.tool-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 8px 4px;
  border: 1px solid #e0ceb7;
  background: #fffaf7;
  border-radius: 10px;
  cursor: pointer;
  transition: var(--transition);
  font-family: inherit;
}

.tool-btn:hover { border-color: var(--accent); }
.tool-btn.active {
  border-color: var(--accent);
  background: #fff3e8;
  box-shadow: inset 0 0 0 1px var(--accent);
}

.tool-icon { font-size: 1.1rem; line-height: 1; }
.tool-label { font-size: 0.7rem; color: var(--text-primary); font-weight: 600; }

/* ============ 尺寸选择 ============ */
.size-section { margin-bottom: 16px; }

.size-section-title {
  font-weight: 600;
  color: var(--text-primary);
  font-size: 0.92rem;
  margin-bottom: 10px;
  letter-spacing: 0.04em;
}

.size-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
}

@media (max-width: 480px) {
  .size-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 6px; }
}

.size-card {
  position: relative;
  background: #fffaf7;
  border: 1px solid #e0ceb7;
  border-radius: 10px;
  padding: 8px 6px;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  transition: var(--transition);
  clip-path: polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 0 100%);
  min-width: 0;
}

.size-card:hover { border-color: var(--accent); transform: translateY(-1px); box-shadow: var(--shadow-sm); }
.size-card.active { border-color: var(--accent); box-shadow: inset 0 0 0 1px var(--accent), var(--shadow-sm); }

.size-thumb {
  width: 100%;
  aspect-ratio: 1;
  border-radius: 6px;
  background-color: #f5ede6;
  background-image: radial-gradient(circle, #d4b896 0.7px, transparent 0.8px);
  background-size: calc(100% / 12) calc(100% / 12);
}

.size-card-meta { display: flex; flex-direction: column; align-items: center; gap: 1px; line-height: 1.1; }
.size-card-meta .n {
  font-family: 'Helvetica Neue', Helvetica, 'PingFang SC', 'Microsoft YaHei', sans-serif;
  font-size: 0.82rem;
  font-weight: 700;
  color: var(--text-primary);
  letter-spacing: 0.02em;
}
.size-card-meta .meta { font-size: 0.68rem; color: var(--text-secondary); }

.cs-card { border-style: dashed; }
.cs-in { width: 100%; display: flex; flex-direction: column; gap: 6px; align-items: stretch; }
.cs-t { font-size: 0.82rem; font-weight: 700; color: var(--text-primary); text-align: center; }

.cs-field {
  display: flex;
  align-items: center;
  gap: 4px;
  background: #fff;
  border: 1px solid #e0ceb7;
  border-radius: 6px;
  padding: 0 6px;
}

.cs-field:focus-within { border-color: var(--accent); }
.cs-field.bad { border-color: #e05a5a; }

.cs-field input {
  flex: 1;
  width: 0;
  min-width: 0;
  border: none;
  outline: none;
  background: transparent;
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--text-primary);
  padding: 5px 0;
  -moz-appearance: textfield;
}

.cs-field input::-webkit-inner-spin-button,
.cs-field input::-webkit-outer-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

.cs-eq { font-size: 0.7rem; color: var(--text-secondary); white-space: nowrap; }
.cs-go { width: 100%; padding: 4px 0; font-size: 0.78rem; }
.cs-note {
  width: 100%;
  font-size: 0.68rem;
  color: #e05a5a;
  line-height: 1.3;
  text-align: center;
  margin-top: 2px;
}

/* ============ 在用颜色 ============ */
.used-colors { margin-bottom: 14px; }

.used-colors-title {
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 8px;
}

.used-colors-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(56px, 1fr));
  gap: 6px;
}

@media (max-width: 480px) {
  .used-colors-grid { grid-template-columns: repeat(auto-fill, minmax(48px, 1fr)); gap: 4px; }
}

.used-color-card {
  background: #fffaf7;
  border: 1px solid #e0ceb7;
  border-radius: 8px;
  padding: 5px;
  cursor: pointer;
  transition: var(--transition);
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.used-color-card:hover { border-color: var(--accent); }
.used-color-card.active { border-color: var(--accent); box-shadow: inset 0 0 0 1px var(--accent); }

.used-color-swatch {
  width: 100%;
  height: 20px;
  border-radius: 4px;
  box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.08);
}

.used-color-count {
  font-size: 0.7rem;
  font-weight: 700;
  color: var(--text-primary);
  text-align: center;
  line-height: 1;
}

.used-color-bar {
  height: 3px;
  background: #f0e6da;
  border-radius: 2px;
  overflow: hidden;
}

.used-color-bar i {
  display: block;
  height: 100%;
  border-radius: 2px;
  transition: width 0.3s ease;
}

/* ============ 色板 Tabs ============ */
.color-categories { margin: 0 0 12px; }
:deep(.el-tabs__content) { padding: 0; }

.color-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(42px, 1fr));
  gap: 6px;
  max-height: 240px;
  overflow-y: auto;
  padding-right: 4px;
}

@media (max-width: 640px) {
  .color-grid { grid-template-columns: repeat(auto-fill, minmax(38px, 1fr)); max-height: 200px; gap: 4px; }
}

@media (max-width: 480px) {
  .color-grid { grid-template-columns: repeat(auto-fill, minmax(32px, 1fr)); max-height: 160px; gap: 3px; }
}

.color-grid::-webkit-scrollbar { width: 4px; }
.color-grid::-webkit-scrollbar-thumb { background: #d4b896; border-radius: 2px; }

.color-swatch {
  aspect-ratio: 1;
  border-radius: 10px;
  cursor: pointer;
  transition: var(--transition);
  border: 2px solid transparent;
  margin: 2px;
  position: relative;
  box-shadow: var(--shadow-sm);
}

@media (max-width: 640px) { .color-swatch { border-radius: 8px; } }
@media (max-width: 480px) { .color-swatch { border-radius: 6px; } }

@media (min-width: 769px) {
  .color-swatch:hover { transform: translateY(-2px); box-shadow: var(--shadow-md); border-color: white; }
}

.color-swatch.active {
  border-color: var(--text-primary);
  box-shadow: 0 0 0 3px rgba(255, 180, 70, 0.6);
  transform: scale(1.1);
}

.eraser-swatch {
  background: repeating-conic-gradient(#e0e0e0 0% 25%, #ffffff 0% 50%) 50% / 12px 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
}

/* ============ 进度记录表 ============ */
.progress-section {
  background: #fbf4ec;
  border: 1px solid #eadfce;
  border-radius: 12px;
  padding: 12px;
  margin-bottom: 14px;
}

@media (max-width: 480px) { .progress-section { padding: 10px; } }

.progress-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.progress-title { font-size: 0.88rem; font-weight: 700; color: var(--text-primary); }

.progress-clear {
  border: none;
  background: transparent;
  color: #b07a4a;
  font-size: 0.72rem;
  cursor: pointer;
  padding: 2px 4px;
  font-family: inherit;
}

.progress-clear:hover { color: #e05a5a; }

.progress-bar-wrap { margin-bottom: 10px; }

.progress-bar {
  height: 10px;
  background: #eee3d4;
  border-radius: 6px;
  overflow: hidden;
  box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.08);
}

.progress-bar i {
  display: block;
  height: 100%;
  background: linear-gradient(90deg, #ffb070, var(--accent));
  border-radius: 6px;
  transition: width 0.3s ease;
}

.progress-meta {
  display: flex;
  justify-content: space-between;
  margin-top: 4px;
}

.progress-meta .pct { font-size: 0.78rem; font-weight: 700; color: var(--accent); }
.progress-meta .cnt { font-size: 0.72rem; color: var(--text-secondary); }

.progress-tip {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 6px;
  background: #fff5e9;
  border: 1px dashed #e7c9a5;
  border-radius: 8px;
  padding: 6px 8px;
  margin-bottom: 8px;
  font-size: 0.7rem;
  color: #8a6a4a;
}

.tip-close {
  border: none;
  background: transparent;
  color: #a98a68;
  cursor: pointer;
  font-size: 0.75rem;
  padding: 0 2px;
}

.progress-tools {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  gap: 6px;
}

.tri-check {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 0.75rem;
  color: var(--text-primary);
  cursor: pointer;
  user-select: none;
}

.tri-check input { accent-color: var(--accent); cursor: pointer; }

.sort-switch {
  display: inline-flex;
  background: #eee3d4;
  border-radius: 6px;
  padding: 2px;
  gap: 2px;
}

.sort-switch button {
  border: none;
  background: transparent;
  color: var(--text-secondary);
  font-size: 0.7rem;
  padding: 3px 8px;
  border-radius: 4px;
  cursor: pointer;
  transition: var(--transition);
  font-family: inherit;
}

.sort-switch button.active { background: #fff; color: var(--accent); font-weight: 600; }

.progress-list {
  max-height: 260px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding-right: 2px;
}

.progress-list::-webkit-scrollbar { width: 4px; }
.progress-list::-webkit-scrollbar-thumb { background: #d4b896; border-radius: 2px; }

.progress-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 5px 6px;
  border-radius: 8px;
  background: #fffaf7;
  border: 1px solid transparent;
  transition: var(--transition);
}

.progress-row.highlighted { border-color: var(--accent); background: #fff3e8; }
.progress-row.checked { opacity: 0.65; }
.progress-row.checked .progress-name .pn { text-decoration: line-through; }

.progress-swatch {
  width: 22px;
  height: 22px;
  border-radius: 6px;
  flex-shrink: 0;
  cursor: pointer;
  box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.08);
}

.progress-name {
  flex: 1;
  display: flex;
  flex-direction: column;
  line-height: 1.2;
  min-width: 0;
}

.progress-name .pn {
  font-size: 0.75rem;
  color: var(--text-primary);
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.progress-name .pc { font-size: 0.66rem; color: var(--text-secondary); }

.progress-check {
  width: 24px;
  height: 24px;
  border-radius: 6px;
  border: 1.5px solid #d4b896;
  background: #fff;
  color: #fff;
  font-size: 0.8rem;
  cursor: pointer;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: var(--transition);
  font-family: inherit;
}

.progress-check.on { background: var(--accent); border-color: var(--accent); }

.progress-empty {
  text-align: center;
  font-size: 0.72rem;
  color: #a98a68;
  padding: 12px 0;
}

/* ============ 操作按钮 ============ */
.tool-buttons {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 4px;
}

@media (max-width: 480px) { .tool-buttons { gap: 6px; } }

.quick-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  margin-top: 12px;
}

@media (max-width: 480px) {
  .quick-actions { gap: 6px; margin-top: 8px; }
  .quick-actions .el-button { font-size: 0.75rem; padding: 4px 8px; }
}

@media (max-width: 640px) {
  .el-button { min-height: 44px; font-size: 0.85rem; }
  .el-button--small { min-height: 36px; }
}

.el-button + .el-button { margin-left: 0; }

/* ============ 导出海报抽屉 ============ */
.poster-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: rgba(40, 24, 12, 0.55);
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding: 0;
}

.poster-drawer {
  width: 100%;
  max-width: 960px;
  max-height: 92vh;
  background: #fffaf7;
  border-radius: 20px 20px 0 0;
  box-shadow: 0 -10px 40px rgba(0, 0, 0, 0.25);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.poster-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 20px;
  border-bottom: 1px solid #f0e6da;
  flex-shrink: 0;
}

.poster-title { font-size: 1rem; font-weight: 700; color: var(--text-primary); }

.poster-close {
  border: none;
  background: transparent;
  font-size: 1.1rem;
  color: var(--text-secondary);
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 6px;
}

.poster-close:hover { background: #f5efe6; }

.poster-body {
  display: grid;
  grid-template-columns: 1fr 320px;
  gap: 18px;
  padding: 16px 20px;
  overflow-y: auto;
  flex: 1;
  min-height: 0;
}

.poster-preview-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 240px;
  background: repeating-conic-gradient(#f0eae4 0% 25%, #fffaf7 0% 50%) 50% / 18px 18px;
  border-radius: 12px;
  padding: 12px;
  overflow: hidden;
}

.poster-preview {
  max-width: 100%;
  max-height: 52vh;
  object-fit: contain;
  border-radius: 8px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
}

.poster-options {
  display: flex;
  flex-direction: column;
  gap: 12px;
  align-content: start;
}

.poster-opt-row {
  display: flex;
  align-items: flex-start;
  gap: 8px;
}

.opt-label {
  flex-shrink: 0;
  width: 40px;
  font-size: 0.78rem;
  font-weight: 600;
  color: var(--text-primary);
  padding-top: 5px;
}

.seg {
  display: inline-flex;
  flex-wrap: wrap;
  gap: 4px;
  background: #f5efe6;
  border-radius: 8px;
  padding: 3px;
}

.seg button {
  border: none;
  background: transparent;
  color: var(--text-secondary);
  font-size: 0.75rem;
  padding: 5px 10px;
  border-radius: 6px;
  cursor: pointer;
  transition: var(--transition);
  font-family: inherit;
  white-space: nowrap;
}

.seg button.active {
  background: #fff;
  color: var(--accent);
  font-weight: 600;
  box-shadow: var(--shadow-sm);
}

.bg-swatches { display: flex; flex-wrap: wrap; gap: 6px; padding-top: 2px; }

.bg-swatch {
  width: 26px;
  height: 26px;
  border-radius: 6px;
  border: 2px solid #e0ceb7;
  cursor: pointer;
  transition: var(--transition);
  padding: 0;
}

.bg-swatch.transparent {
  background: repeating-conic-gradient(#e0e0e0 0% 25%, #ffffff 0% 50%) 50% / 10px 10px;
}

.bg-swatch.active {
  border-color: var(--accent);
  box-shadow: 0 0 0 2px rgba(255, 140, 66, 0.35);
}

.poster-footer {
  padding: 12px 20px 16px;
  border-top: 1px solid #f0e6da;
  display: flex;
  justify-content: flex-end;
  flex-shrink: 0;
  background: #fffaf7;
}

/* 抽屉过渡 */
.drawer-enter-active,
.drawer-leave-active { transition: opacity 0.3s ease; }

.drawer-enter-active .poster-drawer,
.drawer-leave-active .poster-drawer { transition: transform 0.32s cubic-bezier(0.4, 0, 0.2, 1); }

.drawer-enter-from,
.drawer-leave-to { opacity: 0; }

.drawer-enter-from .poster-drawer,
.drawer-leave-to .poster-drawer { transform: translateY(100%); }

/* 海报抽屉移动端 */
@media (max-width: 640px) {
  .poster-body {
    grid-template-columns: 1fr;
    gap: 14px;
  }
}

@media (max-width: 480px) {
  .poster-drawer { max-height: 94vh; border-radius: 16px 16px 0 0; }
  .poster-body {
    gap: 12px;
    padding: 12px 14px;
  }
  .poster-preview-wrap { min-height: 180px; }
  .poster-preview { max-height: 34vh; }
  .poster-footer {
    position: sticky;
    bottom: 0;
    padding: 10px 14px calc(14px + env(safe-area-inset-bottom, 0px));
  }
  .poster-footer .el-button { width: 100%; }
}

/* ============ P8 新增区块紧凑化 ============ */
@media (max-width: 640px) {
  .viewtabs { padding: 2px; }
  .viewtab { padding: 5px 10px; font-size: 0.75rem; }
  .iron-toggle { padding: 6px 10px; font-size: 0.75rem; }
  .meltbar { gap: 8px; padding: 6px 8px; }
  .melt-play { width: 30px; height: 30px; }
  .melt-pct { font-size: 0.72rem; min-width: 32px; }
  .melt-style-btn { font-size: 0.68rem; padding: 3px 6px; }
  .progress-row { padding: 4px 5px; gap: 6px; }
  .progress-swatch { width: 20px; height: 20px; }
  .used-colors-grid { grid-template-columns: repeat(auto-fill, minmax(50px, 1fr)); }
}

@media (max-width: 480px) {
  .viewtab { padding: 4px 8px; font-size: 0.72rem; }
  .iron-toggle { padding: 5px 8px; font-size: 0.72rem; }
  .meltbar {
    position: sticky;
    bottom: 0;
    z-index: 8;
    border-radius: 10px;
    box-shadow: 0 -4px 12px rgba(0, 0, 0, 0.08);
    padding-bottom: calc(8px + env(safe-area-inset-bottom, 0px));
  }
  .melt-styles { width: 100%; justify-content: space-between; }
  .melt-style-btn { flex: 1; text-align: center; }
  .progress-title { font-size: 0.82rem; }
  .progress-meta .pct { font-size: 0.72rem; }
  .progress-meta .cnt { font-size: 0.68rem; }
  .progress-name .pn { font-size: 0.72rem; }
  .progress-name .pc { font-size: 0.64rem; }
}
</style>