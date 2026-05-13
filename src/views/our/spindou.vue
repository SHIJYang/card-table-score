<template>
  <div class="app-container">
    <div class="game-layout">
      <div class="board-section">
        <div class="grid-container">
          <div class="grid-wrapper">
            <div class="pixel-grid" :style="gridStyle">
              <div v-for="(cell, index) in flatBoard" :key="index" class="pixel-cell" :class="{ filled: cell !== null }"
                :style="{
                  backgroundColor: cell || '#f9f3ea',
                  width: cellSize + 'px',
                  height: cellSize + 'px'
                }" @click="paintCell(index)" @contextmenu.prevent="eraseCell(index)"
                @mouseenter="handleDragPaint($event, index)" @mousedown="startDragPaint(index)"
                @touchstart="handleTouchStart($event, index)" @touchmove="handleTouchMove" @touchend="stopDragPaint">
              </div>
            </div>
          </div>
        </div>

        <div class="board-footer">
          <span>🖱️ 左键绘制 | 右键擦除 | 按住拖动连续绘制</span>
          <span class="mobile-hint">📱 手指滑动连续绘制</span>
        </div>
      </div>

      <div class="palette-section">
        <div class="current-color">
          <div class="color-preview" :style="{ backgroundColor: currentColor || '#f9f3ea' }"></div>
          <div class="color-name">
            {{ currentColorName }}
          </div>

          <div class="size-controls">
            <el-input-number v-model="gridSize" :min="8" :max="64" :step="8" size="small" @change="resizeBoard" />
          </div>
        </div>

        <el-tabs v-model="activeCategory" class="color-categories">
          <el-tab-pane v-for="category in colorCategories" :key="category.key" :label="category.name"
            :name="category.key">
            <div class="color-grid">
              <div v-for="(color, index) in getCategoryColors(category.key)" :key="index" class="color-swatch"
                :class="{ active: currentColor === color.hex }" :style="{ backgroundColor: color.hex }"
                @click="selectColor(color)" :title="color.name"></div>
              <div v-if="category.key === 'basic'" class="color-swatch eraser-swatch"
                :class="{ active: currentColor === null }" @click="selectEraser" title="橡皮擦">
                🧹
              </div>
            </div>
          </el-tab-pane>
        </el-tabs>

        <div class="tool-buttons">
          <el-button type="danger" @click="clearBoard" round>
            🧽 清空画板
          </el-button>
          <el-button type="success" @click="fillAllCurrent" round>
            🪣 填充全部
          </el-button>
          <el-button type="primary" @click="exportImage" round>
            📸 导出图片
          </el-button>
        </div>

        <div class="quick-actions">
          <el-button size="small" @click="randomFill" plain>
            🎲 随机填充
          </el-button>
          <el-button size="small" @click="createCheckerboard" plain>
            🏁 棋盘格
          </el-button>
          <el-button size="small" @click="createBorder" plain>
            🖼️ 边框
          </el-button>
          <el-button size="small" @click="mirrorHorizontal" plain>
            ↔️ 镜像
          </el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { beadColors } from '@/config/beadColors.js';

// 网格大小设置
const gridSize = ref(16);
const cellSize = ref(32);

// 画板数据
const board = ref([]);

// 当前颜色
const currentColor = ref('#FF8C42');
const currentColorName = computed(() => {
  if (currentColor.value === null) return '橡皮擦';
  const allColors = getAllColors();
  const color = allColors.find(c => c.hex === currentColor.value);
  return color ? color.name : '自定义颜色';
});

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
  { key: 'M', name: '混合复古系' }
];

// 拖动绘制状态
const isDragging = ref(false);
// 触摸设备最后位置
const lastTouchIndex = ref(null);

// 扁平化画板用于渲染
const flatBoard = computed(() => board.value.flat());

// 网格样式
const gridStyle = computed(() => ({
  gridTemplateColumns: `repeat(${gridSize.value}, ${cellSize.value}px)`,
  gap: Math.max(1, Math.floor(cellSize.value / 16)) + 'px'
}));

// 当前尺寸显示
const currentSize = computed(() => gridSize.value);

// 获取所有颜色
const getAllColors = () => {
  const allColors = [];
  Object.values(beadColors).forEach(categoryColors => {
    allColors.push(...categoryColors);
  });
  return allColors;
};

// 获取分类颜色
const getCategoryColors = (categoryKey) => {
  return beadColors[categoryKey] || [];
};

// 初始化画板
const initBoard = (size) => {
  const s = size || gridSize.value;
  const newBoard = [];
  for (let r = 0; r < s; r++) {
    const row = Array(s).fill(null);
    newBoard.push(row);
  }
  board.value = newBoard;
};

// 调整画板大小
const resizeBoard = (newSize) => {
  const oldSize = board.value.length;
  if (newSize === oldSize) return;

  const newBoard = [];
  for (let r = 0; r < newSize; r++) {
    const row = [];
    for (let c = 0; c < newSize; c++) {
      if (r < oldSize && c < oldSize && board.value[r] && board.value[r][c]) {
        row.push(board.value[r][c]);
      } else {
        row.push(null);
      }
    }
    newBoard.push(row);
  }
  board.value = newBoard;

  // 自动调整单元格大小
  adjustCellSize(newSize);
};

// 自适应单元格大小
const adjustCellSize = (size) => {
  const maxWidth = window.innerWidth * 0.9; // 手机端使用更大比例
  const maxHeight = window.innerHeight * 0.9;

  // 根据设备类型调整基准大小
  const isMobile = window.innerWidth <= 640;
  const baseSize = isMobile ? 24 : 32;

  const maxCellByWidth = Math.floor((maxWidth - 40) / size);
  const maxCellByHeight = Math.floor((maxHeight - 40) / size);
  const optimalSize = Math.min(maxCellByWidth, maxCellByHeight, baseSize);
  cellSize.value = Math.max(isMobile ? 6 : 8, Math.min(optimalSize, isMobile ? 24 : 40));
};

// 选择颜色
const selectColor = (color) => {
  currentColor.value = color.hex;
};

// 选择橡皮擦
const selectEraser = () => {
  currentColor.value = null;
};

// 根据索引获取行列
const getRowCol = (index) => {
  const row = Math.floor(index / gridSize.value);
  const col = index % gridSize.value;
  return { row, col };
};

// 绘制单元格
const paintCell = (index) => {
  if (index < 0 || index >= flatBoard.value.length) return;
  const { row, col } = getRowCol(index);
  const newBoard = board.value.map(r => [...r]);
  if (newBoard[row] && newBoard[row][col] !== undefined) {
    newBoard[row][col] = currentColor.value;
    board.value = newBoard;
  }
};

// 擦除单元格
const eraseCell = (index) => {
  if (index < 0 || index >= flatBoard.value.length) return;
  const { row, col } = getRowCol(index);
  const newBoard = board.value.map(r => [...r]);
  if (newBoard[row] && newBoard[row][col] !== undefined) {
    newBoard[row][col] = null;
    board.value = newBoard;
  }
};

// 开始拖动绘制
const startDragPaint = (index) => {
  isDragging.value = true;
  paintCell(index);
  document.body.style.userSelect = 'none';
  document.body.style.webkitUserSelect = 'none'; // iOS Safari
};

// 处理拖动绘制
const handleDragPaint = (event, index) => {
  if (isDragging.value && event.buttons === 1) {
    paintCell(index);
  }
};

// 停止拖动
const stopDragPaint = () => {
  isDragging.value = false;
  lastTouchIndex.value = null;
  document.body.style.userSelect = '';
  document.body.style.webkitUserSelect = '';
};

// 触摸开始处理
const handleTouchStart = (event, index) => {
  event.preventDefault();
  isDragging.value = true;
  paintCell(index);
  lastTouchIndex.value = index;
};

// 触摸移动处理
const handleTouchMove = (event) => {
  if (!isDragging.value) return;
  event.preventDefault();

  const touch = event.touches[0];
  const element = document.elementFromPoint(touch.clientX, touch.clientY);
  const pixelCell = element?.closest('.pixel-cell');

  if (pixelCell) {
    const allCells = document.querySelectorAll('.pixel-cell');
    const newIndex = Array.from(allCells).indexOf(pixelCell);
    if (newIndex !== -1 && newIndex !== lastTouchIndex.value) {
      paintCell(newIndex);
      lastTouchIndex.value = newIndex;
    }
  }
};

// 清空画板
const clearBoard = () => initBoard();

// 用当前颜色填充全部
const fillAllCurrent = () => {
  const newBoard = [];
  for (let r = 0; r < gridSize.value; r++) {
    newBoard.push(Array(gridSize.value).fill(currentColor.value));
  }
  board.value = newBoard;
};

// 随机填充
const randomFill = () => {
  const allColors = getAllColors();
  const newBoard = [];
  for (let r = 0; r < gridSize.value; r++) {
    const row = [];
    for (let c = 0; c < gridSize.value; c++) {
      const randomColor = allColors[Math.floor(Math.random() * allColors.length)];
      row.push(randomColor ? randomColor.hex : null);
    }
    newBoard.push(row);
  }
  board.value = newBoard;
};

// 创建棋盘格
const createCheckerboard = () => {
  const newBoard = [];
  const color1 = currentColor.value;
  const color2 = null;
  for (let r = 0; r < gridSize.value; r++) {
    const row = [];
    for (let c = 0; c < gridSize.value; c++) {
      row.push((r + c) % 2 === 0 ? color1 : color2);
    }
    newBoard.push(row);
  }
  board.value = newBoard;
};

// 创建边框
const createBorder = () => {
  const newBoard = board.value.map(r => [...r]);
  const borderColor = currentColor.value;
  for (let r = 0; r < gridSize.value; r++) {
    for (let c = 0; c < gridSize.value; c++) {
      if (r === 0 || r === gridSize.value - 1 || c === 0 || c === gridSize.value - 1) {
        newBoard[r][c] = borderColor;
      }
    }
  }
  board.value = newBoard;
};

// 水平镜像
const mirrorHorizontal = () => {
  board.value = board.value.map(row => [...row].reverse());
};

// 导出图片
const exportImage = () => {
  const scale = 2; // 导出放大倍数
  const canvas = document.createElement('canvas');
  canvas.width = gridSize.value * cellSize.value * scale;
  canvas.height = gridSize.value * cellSize.value * scale;
  const ctx = canvas.getContext('2d');

  // 背景
  ctx.fillStyle = '#f9f3ea';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // 绘制像素
  for (let r = 0; r < gridSize.value; r++) {
    for (let c = 0; c < gridSize.value; c++) {
      const color = board.value[r][c];
      if (color) {
        const x = c * cellSize.value * scale;
        const y = r * cellSize.value * scale;
        const size = cellSize.value * scale;
        const radius = Math.floor(size / 5);

        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + size - radius, y);
        ctx.quadraticCurveTo(x + size, y, x + size, y + radius);
        ctx.lineTo(x + size, y + size - radius);
        ctx.quadraticCurveTo(x + size, y + size, x + size - radius, y + size);
        ctx.lineTo(x + radius, y + size);
        ctx.quadraticCurveTo(x, y + size, x, y + size - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
        ctx.fill();

        // 添加阴影效果
        ctx.strokeStyle = 'rgba(0,0,0,0.1)';
        ctx.lineWidth = scale;
        ctx.stroke();
      }
    }
  }

  // 下载
  const link = document.createElement('a');
  link.download = `拼豆像素画-${gridSize.value}x${gridSize.value}-${new Date().getTime()}.png`;
  link.href = canvas.toDataURL('image/png');
  link.click();
};

// 窗口大小调整
const handleResize = () => {
  adjustCellSize(gridSize.value);
};

// 生命周期
onMounted(() => {
  initBoard();
  adjustCellSize(gridSize.value);
  window.addEventListener('resize', handleResize);
  window.addEventListener('mouseup', stopDragPaint);
  // 防止触摸时页面滚动
  document.body.addEventListener('touchmove', (e) => {
    if (isDragging.value) {
      e.preventDefault();
    }
  }, { passive: false });
});

onUnmounted(() => {
  window.removeEventListener('resize', handleResize);
  window.removeEventListener('mouseup', stopDragPaint);
});
</script>

<style scoped>
/* 将原生的 body 样式移到 wrapper 中，保持组件独立性 */
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

  background: linear-gradient(135deg, var(--primary-bg) 0%, var(--secondary-bg) 100%);
  font-family: 'Helvetica Neue', Helvetica, 'PingFang SC', 'Microsoft YaHei', sans-serif;
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;

  box-sizing: border-box;
}

.game-layout {
  display: grid;
  grid-template-columns: 1fr 320px;
  gap: 24px;
  align-items: start;
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
}

@media (max-width: 900px) {
  .game-layout {
    grid-template-columns: 1fr;
    gap: 20px;
  }

  .palette-section {
    order: -1;
    position: sticky;
    top: 0;
    z-index: 10;
  }
}

@media (max-width: 640px) {
  .game-layout {
    gap: 12px;
  }

  .board-section {
    padding: 12px;
  }

  .palette-section {
    padding: 12px;

    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
  }
}

@media (max-width: 480px) {
  .game-layout {
    gap: 8px;
  }

  .board-section {
    padding: 8px;
  }

  .palette-section {
    padding: 8px;
  }
}

/* 左侧画板区域 */
.board-section {
  background: var(--card-bg);
  backdrop-filter: blur(20px);
  border-radius: 10px;
  padding: 10px;
  box-shadow: var(--shadow-lg);
  border: 1px solid rgba(255, 255, 255, 0.6);
}

.board-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  flex-wrap: wrap;
  gap: 12px;
}

.board-title {
  font-weight: 700;
  font-size: 1.4rem;
  color: var(--text-primary);
  display: flex;
  align-items: center;
  gap: 8px;
}

.size-controls {
  display: flex;
  align-items: center;
  gap: 12px;
  background: #f5efe6;
  padding: 8px 16px;
  border-radius: 20px;
}

.grid-container {
  background: var(--board-bg);
  border-radius: 24px;
  padding: 5px;
  box-shadow: inset 0 2px 10px rgba(0, 0, 0, 0.05);
  min-height: 300px;
  display: flex;
  justify-content: center;
  align-items: center;
}

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
  aspect-ratio: 1;
  box-shadow: inset 0 0 0 1px rgba(150, 120, 80, 0.2);
}

/* 移动端触摸反馈优化 */
@media (max-width: 768px) {
  .pixel-cell {
    cursor: none;
    touch-action: none;
  }

  .pixel-cell:active {
    transform: scale(1.05);
  }
}

/* 桌面端悬停效果保留 */
@media (min-width: 769px) {
  .pixel-cell:hover {
    transform: scale(1.15);
    box-shadow: 0 0 0 2px rgba(255, 140, 0, 0.8);
    z-index: 10;
  }
}

.pixel-cell.filled {
  box-shadow: inset 0 -2px 4px rgba(0, 0, 0, 0.2);
}

.board-footer {
  margin-top: 12px;
  text-align: center;
  color: var(--text-secondary);
  font-size: 0.9rem;
}

.mobile-hint {
  display: none;
  font-size: 0.75rem;
  margin-left: 8px;
  color: var(--text-secondary);
}

@media (max-width: 640px) {
  .board-footer span:first-child {
    display: none;
  }

  .mobile-hint {
    display: inline-block;
  }
}

/* 右侧面板 */
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
  .palette-section {
    position: relative;
    top: 0;
  }
}

.current-color {
  display: flex;
  align-items: center;
  gap: 16px;
  background: #f5efe6;
  padding: 12px 16px;
  border-radius: 10px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

@media (max-width: 480px) {
  .current-color {
    gap: 8px;
    padding: 8px 12px;
    margin-bottom: 12px;
  }
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
  .color-preview {
    width: 36px;
    height: 36px;
    border-radius: 12px;
  }
}

.color-name {
  font-weight: 600;
  color: var(--text-primary);
  font-size: 1rem;
  flex: 1;
}

.color-categories {
  margin: 0;
}

:deep(.el-tabs__content) {
  padding: 0;
}

.color-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(42px, 1fr));
  gap: 6px;
  max-height: 300px;
  overflow-y: auto;
  padding-right: 4px;
}

@media (max-width: 640px) {
  .color-grid {
    grid-template-columns: repeat(auto-fill, minmax(38px, 1fr));
    max-height: 200px;
    gap: 4px;
  }
}

@media (max-width: 480px) {
  .color-grid {
    grid-template-columns: repeat(auto-fill, minmax(32px, 1fr));
    max-height: 160px;
    gap: 3px;
  }
}

.color-grid::-webkit-scrollbar {
  width: 4px;
}

.color-grid::-webkit-scrollbar-thumb {
  background: #d4b896;
  border-radius: 2px;
}

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

@media (max-width: 640px) {
  .color-swatch {
    border-radius: 8px;
  }
}

@media (max-width: 480px) {
  .color-swatch {
    border-radius: 6px;
  }
}

/* 桌面端悬停效果，移动端无悬停 */
@media (min-width: 769px) {
  .color-swatch:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-md);
    border-color: white;
  }
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

.tool-buttons {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 16px;
}

@media (max-width: 480px) {
  .tool-buttons {
    gap: 6px;
    margin-top: 12px;
  }
}

.quick-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  margin-top: 12px;
}

@media (max-width: 480px) {
  .quick-actions {
    gap: 6px;
    margin-top: 8px;
  }

  .quick-actions .el-button {
    font-size: 0.75rem;
    padding: 4px 8px;
  }
}

@media (max-width: 640px) {
  .size-controls .el-input-number {
    width: 100px;
  }
}

/* 按钮移动端优化 */
@media (max-width: 640px) {
  .el-button {
    min-height: 44px;
    font-size: 0.85rem;
  }

  .el-button--small {
    min-height: 36px;
  }
}

.el-button+.el-button {
  margin-left: 0px;
}
</style>