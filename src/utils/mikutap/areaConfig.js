/**
 * Mikutap区域配置模块
 * 定义区域与音频、视觉效果的映射关系
 */

// 网格配置
export const GRID_CONFIG = {
  COLS: 5,
  ROWS: 6,
  get TOTAL_AREAS() {
    return this.COLS * this.ROWS
  }
}

// 区域颜色数组 - 每个区域对应的独特颜色
export const AREA_COLORS = [
  '#FF0000', '#FF4500', '#FF8C00', '#FFD700', '#FFFF00',  // 红橙黄渐变
  '#ADFF2F', '#00FF00', '#00ff55ff', '#007bacea', '#01b0ebff',  // 绿青蓝渐变
  '#1E90FF', '#0000FF', '#8A2BE2', '#9400D3', '#FF00FF',  // 蓝紫粉渐变
  '#FF1493', '#FF69B4', '#DC143C', '#B22222', '#8B0000',  // 深粉红渐变
  '#FF6347', '#FF7F50', '#FFA07A', '#FFDAB9', '#FFE4B5',  // 暖色调渐变
  '#9898ffff', '#d46ed4ff', '#DDA0DD', '#fa5afaff', '#f762f2ff',  // 紫丁香渐变
]

// 区域音符数组 - 每个区域对应的音频频率（Hz）
export const AREA_NOTES = [
  262, 277, 294, 311, 330,   // C4, C#4, D4, D#4, E4
  349, 370, 392, 415, 440,   // F4, F#4, G4, G#4, A4
  466, 494, 523, 554, 587,   // A#4, B4, C5, C#5, D5
  622, 659, 698, 740, 784,   // D#5, E5, F5, F#5, G5
  831, 880, 932, 988, 1047,  // G#5, A5, A#5, B5, C6
  1109, 1175, 1245, 1319, 1397, // C#6, D6, D#6, E6, F6
]

// 区域效果数组 - 每个区域对应的视觉效果名称
export const AREA_EFFECTS = [
  'burst', 'spiral', 'wave', 'explosion', 'scatter',  // 爆发、螺旋、波浪、爆炸、散射
  'rain', 'flower', 'flash', 'firework', 'vortex',   // 雨滴、花朵、闪光、烟花、漩涡
  'meteor', 'bubble', 'lightning', 'snow', 'confetti', // 流星、气泡、闪电、雪花、彩纸
  'pixel', 'ring', 'starfall', 'pulse', 'tornado',   // 像素、圆环、星落、脉冲、龙卷风
  'diamond', 'hex', 'cross', 'triangle', 'circle',   // 钻石、六边形、十字、三角、圆形
  'square', 'line', 'dot', 'arc', 'spiral2',        // 方块、线条、点、弧线、双螺旋
]

// 区域配置对象 - 包含每个区域的完整配置
export const AREA_CONFIGS = AREA_COLORS.map((color, index) => ({
  index,
  color,
  note: AREA_NOTES[index % AREA_NOTES.length],
  effect: AREA_EFFECTS[index % AREA_EFFECTS.length],
  // 计算网格位置
  col: index % GRID_CONFIG.COLS,
  row: Math.floor(index / GRID_CONFIG.COLS),
}))

/**
 * 根据坐标获取区域索引
 * @param {number} x - x坐标
 * @param {number} y - y坐标
 * @returns {number} 区域索引
 */
export function getAreaIndex(x, y) {
  const cellW = window.innerWidth / GRID_CONFIG.COLS
  const cellH = window.innerHeight / GRID_CONFIG.ROWS
  const col = Math.min(Math.max(Math.floor(x / cellW), 0), GRID_CONFIG.COLS - 1)
  const row = Math.min(Math.max(Math.floor(y / cellH), 0), GRID_CONFIG.ROWS - 1)
  return row * GRID_CONFIG.COLS + col
}

/**
 * 根据区域索引获取配置
 * @param {number} index - 区域索引
 * @returns {Object|null}
 */
export function getAreaConfig(index) {
  if (index < 0 || index >= GRID_CONFIG.TOTAL_AREAS) {
    return null
  }
  return AREA_CONFIGS[index]
}

/**
 * 获取区域颜色
 * @param {number} index - 区域索引
 * @returns {string}
 */
export function getAreaColor(index) {
  return AREA_COLORS[index % AREA_COLORS.length]
}

/**
 * 获取区域音符频率
 * @param {number} index - 区域索引
 * @returns {number}
 */
export function getAreaNote(index) {
  return AREA_NOTES[index % AREA_NOTES.length]
}

/**
 * 获取区域效果名称
 * @param {number} index - 区域索引
 * @returns {string}
 */
export function getAreaEffect(index) {
  return AREA_EFFECTS[index % AREA_EFFECTS.length]
}

/**
 * 音效包类型枚举
 */
export const SoundPackType = {
  NONE: 'none',
  MIKUTAP_MAIN: 'mikutap_main',
  MIKUTAP_TRACK: 'mikutap_track',
  CUSTOM: 'custom'
}

/**
 * 音效包配置
 */
export const SOUND_PACK_CONFIGS = {
  [SoundPackType.NONE]: {
    name: '无',
    url: null,
    description: '使用默认合成音效'
  },
  [SoundPackType.MIKUTAP_MAIN]: {
    name: 'Mikutap主音效',
    url: '/mikutap/data/main/main.json',
    description: 'Mikutap主音效包'
  },
  [SoundPackType.MIKUTAP_TRACK]: {
    name: 'Mikutap轨道音效',
    url: '/mikutap/data/track/track.json',
    description: 'Mikutap轨道音效包'
  },
  [SoundPackType.CUSTOM]: {
    name: '自定义',
    url: null,
    description: '自定义音效包'
  }
}

/**
 * 获取音效包配置
 * @param {string} type - 音效包类型
 * @returns {Object|null}
 */
export function getSoundPackConfig(type) {
  return SOUND_PACK_CONFIGS[type] || null
}

/**
 * 获取所有音效包选项
 * @returns {Array<Object>}
 */
export function getAllSoundPackOptions() {
  return Object.entries(SOUND_PACK_CONFIGS).map(([type, config]) => ({
    type,
    ...config
  }))
}

export default {
  GRID_CONFIG,
  AREA_COLORS,
  AREA_NOTES,
  AREA_EFFECTS,
  AREA_CONFIGS,
  SoundPackType,
  SOUND_PACK_CONFIGS,
  getAreaIndex,
  getAreaConfig,
  getAreaColor,
  getAreaNote,
  getAreaEffect,
  getSoundPackConfig,
  getAllSoundPackOptions
}
