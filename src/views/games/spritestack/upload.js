/**
 * 自定义正交视图上传：
 * 读取本地图片 → 去背景 / 裁边 → 按 SIDE 高度统一重采样成
 * TOP(L×W) / SIDE(H×L) / FRONT(H×W) / BACK(H×W) 四张雕刻输入。
 */

const MAX_SOURCE = 420
const BG_TOLERANCE = 28
const ALPHA_THRESHOLD = 128

const clamp = (v, a, b) => (v < a ? a : v > b ? b : v)

export function loadImageFile(file) {
  return new Promise((resolve, reject) => {
    if (!file || (file.type && !file.type.startsWith('image/'))) {
      reject(new Error('not-an-image'))
      return
    }
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve(img)
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('decode-failed'))
    }
    img.src = url
  })
}

/**
 * 把图片转成「像素颜色数组 + 裁切后的尺寸」。
 * 透明背景直接采用 alpha；纯色背景则从边缘泛洪去除。
 */
export function extractViewSource(img) {
  const iw = img.naturalWidth || img.width
  const ih = img.naturalHeight || img.height
  if (!iw || !ih) throw new Error('empty-image')

  const scale = Math.min(1, MAX_SOURCE / Math.max(iw, ih))
  const w = Math.max(1, Math.round(iw * scale))
  const h = Math.max(1, Math.round(ih * scale))

  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  ctx.imageSmoothingEnabled = true
  ctx.drawImage(img, 0, 0, w, h)
  const data = ctx.getImageData(0, 0, w, h).data

  return extractSourceFromPixels(data, w, h)
}

/**
 * 纯函数版本：便于单测，不依赖 canvas。
 * @param {Uint8ClampedArray|Uint8Array|number[]} data RGBA
 */
export function extractSourceFromPixels(data, w, h) {
  if (!w || !h || !data || data.length < w * h * 4) throw new Error('empty-image')

  let transparent = 0
  for (let p = 3; p < data.length; p += 4) {
    if (data[p] < 250) transparent++
  }

  const mask = new Uint8Array(w * h)

  if (transparent > w * h * 0.01) {
    for (let i = 0; i < mask.length; i++) {
      mask[i] = data[i * 4 + 3] >= ALPHA_THRESHOLD ? 1 : 0
    }
  } else {
    // 四角中位色作为背景色
    const corners = [
      [0, 0],
      [w - 1, 0],
      [0, h - 1],
      [w - 1, h - 1],
    ].map(([x, y]) => {
      const p = (y * w + x) * 4
      return [data[p], data[p + 1], data[p + 2]]
    })
    const median = (k) => {
      const v = corners.map((c) => c[k]).sort((a, b) => a - b)
      return Math.round((v[1] + v[2]) / 2)
    }
    const bgR = median(0)
    const bgG = median(1)
    const bgB = median(2)

    const isBgColor = (i) => {
      const p = i * 4
      return (
        Math.abs(data[p] - bgR) <= BG_TOLERANCE &&
        Math.abs(data[p + 1] - bgG) <= BG_TOLERANCE &&
        Math.abs(data[p + 2] - bgB) <= BG_TOLERANCE
      )
    }

    const bgMask = new Uint8Array(w * h)
    const queue = new Int32Array(w * h)
    let head = 0
    let tail = 0
    const push = (x, y) => {
      const i = y * w + x
      if (bgMask[i] || !isBgColor(i)) return
      bgMask[i] = 1
      queue[tail++] = i
    }

    for (let x = 0; x < w; x++) {
      push(x, 0)
      push(x, h - 1)
    }
    for (let y = 0; y < h; y++) {
      push(0, y)
      push(w - 1, y)
    }
    while (head < tail) {
      const i = queue[head++]
      const x = i % w
      const y = (i / w) | 0
      if (x > 0) push(x - 1, y)
      if (x + 1 < w) push(x + 1, y)
      if (y > 0) push(x, y - 1)
      if (y + 1 < h) push(x, y + 1)
    }

    for (let i = 0; i < mask.length; i++) mask[i] = bgMask[i] ? 0 : 1
  }

  // 裁掉四周空白
  let minX = w
  let minY = h
  let maxX = -1
  let maxY = -1
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (!mask[y * w + x]) continue
      if (x < minX) minX = x
      if (x > maxX) maxX = x
      if (y < minY) minY = y
      if (y > maxY) maxY = y
    }
  }
  if (maxX < minX || maxY < minY) throw new Error('no-foreground')

  const bw = maxX - minX + 1
  const bh = maxY - minY + 1
  const colors = new Int32Array(bw * bh)
  for (let y = 0; y < bh; y++) {
    for (let x = 0; x < bw; x++) {
      const src = (minY + y) * w + (minX + x)
      if (!mask[src]) continue
      const p = src * 4
      colors[y * bw + x] = (data[p] << 16) | (data[p + 1] << 8) | data[p + 2]
    }
  }

  return { w: bw, h: bh, colors }
}

function resampleSource(source, dw, dh) {
  const colors = new Int32Array(dw * dh)
  for (let y = 0; y < dh; y++) {
    const sy = Math.min(source.h - 1, Math.floor((y * source.h) / dh))
    for (let x = 0; x < dw; x++) {
      const sx = Math.min(source.w - 1, Math.floor((x * source.w) / dw))
      colors[y * dw + x] = source.colors[sy * source.w + sx]
    }
  }
  return colors
}

/**
 * 依据四张图的比例，统一到同一套像素网格。
 * SIDE 的高度决定切片数，TOP 的宽高决定长度/宽度。
 */
export function buildViewsFromSources(sources) {
  const { top, side, front, back } = sources
  if (!top || !side || !front || !back) return null

  const H = clamp(side.h > 48 ? 36 : side.h, 8, 48)
  const L = clamp(Math.round((H * side.w) / side.h), 4, 80)
  const W = clamp(Math.round((L * top.w) / top.h), 4, 80)

  return {
    W,
    L,
    H,
    top: resampleSource(top, W, L),
    side: resampleSource(side, L, H),
    front: resampleSource(front, W, H),
    back: resampleSource(back, W, H),
  }
}
