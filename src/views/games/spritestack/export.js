/**
 * 16 方向精灵表导出：绕 Y 轴每 22.5° 渲染一帧，拼成 4×4 透明 PNG。
 */

import { VoxelRasterizer, getLightingEnv } from './voxel'

/**
 * @param {object} model 带 volume 的堆叠模型
 * @param {object} opts { time, sun, squash, spacing, outline, shadow, lighting, snowCover, cellScale }
 * @returns {HTMLCanvasElement}
 */
export function buildSpriteSheet(model, opts = {}) {
  const volume = model.volume
  if (!volume) return null
  const env = getLightingEnv(opts.time ?? 12, opts.sun ?? 42)
  const raster = new VoxelRasterizer()
  const frames = []
  let cellW = 0
  let cellH = 0
  for (let i = 0; i < 16; i++) {
    const res = raster.rasterize({
      volume,
      angleDeg: i * 22.5,
      squash: opts.squash ?? 0.75,
      spacing: opts.spacing ?? 1,
      maxSlices: volume.n,
      shadow: false,
      outline: opts.outline !== false,
      lighting: opts.lighting !== false,
      snowCover: opts.snowCover ?? 0,
      env,
    })
    frames.push(res)
    cellW = Math.max(cellW, res.cw)
    cellH = Math.max(cellH, res.ch)
  }

  const cellScale = Math.max(1, Math.round(opts.cellScale ?? 3))
  const cols = 4
  const rows = 4
  const sheet = document.createElement('canvas')
  sheet.width = cellW * cellScale * cols
  sheet.height = cellH * cellScale * rows
  const ctx = sheet.getContext('2d')
  ctx.imageSmoothingEnabled = false
  ctx.clearRect(0, 0, sheet.width, sheet.height)

  frames.forEach((f, i) => {
    const col = i % cols
    const row = Math.floor(i / cols)
    const ox = col * cellW * cellScale + Math.round((cellW - f.cw) * 0.5) * cellScale
    const oy = row * cellH * cellScale + Math.round((cellH - f.ch) * 0.5) * cellScale
    ctx.drawImage(f.canvas, ox, oy, f.cw * cellScale, f.ch * cellScale)
  })

  return sheet
}

export function downloadCanvas(canvas, filename = 'sprite-sheet.png') {
  if (!canvas) return
  const url = canvas.toDataURL('image/png')
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
}
