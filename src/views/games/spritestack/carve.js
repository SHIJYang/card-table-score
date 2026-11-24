/**
 * Visual-hull carving: four orthographic views → horizontal slice stack.
 * 与 sprite-stacking 的 views_to_slices.py 同一思路：
 *   每一层取 TOP / SIDE / FRONT / BACK 四个剪影的交集，
 *   再按“最近的可见面”给体素取色，最后得到自下而上的切片条带。
 */

const pack = (c) =>
  ((0xff << 24) | ((c & 255) << 16) | (((c >> 8) & 255) << 8) | ((c >> 16) & 255)) >>> 0

const clamp = (v, a, b) => (v < a ? a : v > b ? b : v)

const mul = (c, f) => {
  const r = Math.min(255, Math.round(((c >> 16) & 255) * f))
  const g = Math.min(255, Math.round(((c >> 8) & 255) * f))
  const b = Math.min(255, Math.round((c & 255) * f))
  return (r << 16) | (g << 8) | b
}

/**
 * @param {{W:number,L:number,H:number,top:Int32Array,side:Int32Array,front:Int32Array,back:Int32Array}} views
 * @param {{shade?:number, round?:boolean}} options
 * @returns {{W:number,L:number,H:number,slices:Array}}
 */
export function carveViews(views, options = {}) {
  const shade = options.shade ?? 0.18
  const round = !!options.round
  const { W, L, H, top, side, front, back } = views
  const area = W * L
  const occ = new Uint8Array(area * H)
  const spans = new Array(H)

  // 1. 四个剪影求交，得到体素占用
  for (let z = 0; z < H; z++) {
    const row = H - 1 - z
    const along = new Uint8Array(L)
    let y0 = L
    let y1 = -1
    const sideBase = row * L
    for (let y = 0; y < L; y++) {
      if (side[sideBase + (L - 1 - y)]) {
        along[y] = 1
        if (y < y0) y0 = y
        if (y > y1) y1 = y
      }
    }

    const across = new Uint8Array(W)
    let x0 = W
    let x1 = -1
    const fbBase = row * W
    for (let x = 0; x < W; x++) {
      const f = front[fbBase + x]
      const b = back[fbBase + (W - 1 - x)]
      if (f || b) {
        across[x] = 1
        if (x < x0) x0 = x
        if (x > x1) x1 = x
      }
    }

    const base = z * area
    for (let y = 0; y < L; y++) {
      if (!along[y]) continue
      const rowBase = base + y * W
      const topBase = y * W
      for (let x = 0; x < W; x++) {
        if (top[topBase + x] && across[x]) occ[rowBase + x] = 1
      }
    }

    // 圆角车削：把每一层裁进 SIDE/FRONT 跨度描述的椭圆
    if (round && y1 >= y0 && x1 >= x0) {
      let gap = false
      for (let y = y0; y <= y1; y++) if (!along[y]) gap = true
      for (let x = x0; x <= x1; x++) if (!across[x]) gap = true
      if (!gap) {
        const cy = (y0 + y1) / 2
        const ry = (y1 - y0) / 2 + 0.5
        const cx = (x0 + x1) / 2
        const rx = (x1 - x0) / 2 + 0.5
        for (let y = y0; y <= y1; y++) {
          const dy = (y - cy) / ry
          for (let x = x0; x <= x1; x++) {
            const dx = (x - cx) / rx
            if (dx * dx + dy * dy >= 1) occ[base + y * W + x] = 0
          }
        }
      }
    }

    spans[z] = { y0, y1, x0, x1, row, sideBase, fbBase }
  }

  // 2. 自上而下取色
  const slices = new Array(H)
  for (let z = 0; z < H; z++) {
    slices[z] = {
      colors: new Uint32Array(area),
      minX: W,
      maxX: -1,
      minY: L,
      maxY: -1,
    }
  }

  const covered = new Uint8Array(area)
  const dist = new Uint16Array(area)
  const face = new Uint8Array(area)
  const nearAbove = new Uint8Array(area)

  for (let z = H - 1; z >= 0; z--) {
    const base = z * area
    const o = occ.subarray(base, base + area)
    const sp = spans[z]

    let any = false
    for (let i = 0; i < area; i++) if (o[i]) any = true
    if (!any) continue

    const above = covered.slice()
    for (let i = 0; i < area; i++) if (o[i]) covered[i] = 1

    const slice = slices[z]
    const aboveSlice = z + 1 < H ? slices[z + 1] : null

    // 到四个方向空区的距离，最近的一侧决定当前体素显示哪个面
    dist.fill(65535)
    face.fill(0)

    for (let y = 0; y < L; y++) {
      const row = y * W
      let last = -1
      for (let x = 0; x < W; x++) {
        const i = row + x
        if (!o[i]) last = x
        else {
          const d = x - last
          if (d < dist[i]) {
            dist[i] = d
            face[i] = 0
          }
        }
      }
      last = W
      for (let x = W - 1; x >= 0; x--) {
        const i = row + x
        if (!o[i]) last = x
        else {
          const d = last - x
          if (d < dist[i]) {
            dist[i] = d
            face[i] = 1
          }
        }
      }
    }

    for (let x = 0; x < W; x++) {
      let last = -1
      for (let y = 0; y < L; y++) {
        const i = y * W + x
        if (!o[i]) last = y
        else {
          const d = y - last
          if (d < dist[i]) {
            dist[i] = d
            face[i] = 2
          }
        }
      }
      last = L
      for (let y = L - 1; y >= 0; y--) {
        const i = y * W + x
        if (!o[i]) last = y
        else {
          const d = last - y
          if (d < dist[i]) {
            dist[i] = d
            face[i] = 3
          }
        }
      }
    }

    // 上方 5×5 范围内有遮挡 → 认为是台阶侧壁
    nearAbove.fill(0)
    for (let y = 0; y < L; y++) {
      for (let x = 0; x < W; x++) {
        if (!above[y * W + x]) continue
        for (let dy = -2; dy <= 2; dy++) {
          const yy = y + dy
          if (yy < 0 || yy >= L) continue
          for (let dx = -2; dx <= 2; dx++) {
            const xx = x + dx
            if (xx < 0 || xx >= W) continue
            nearAbove[yy * W + xx] = 1
          }
        }
      }
    }

    const shadeBase = 1 - shade * 0.4

    for (let y = 0; y < L; y++) {
      const row = y * W
      for (let x = 0; x < W; x++) {
        const i = row + x
        if (!o[i]) continue

        const isSteep = !above[i] && dist[i] <= 2 && nearAbove[i]
        const useTop = !above[i] && !isSteep
        let color = 0

        if (useTop) {
          color = top[i]
        } else {
          const f = face[i]
          if (f < 2) {
            color = side[sp.sideBase + (L - 1 - clamp(y, sp.y0, sp.y1))]
          } else if (f === 2) {
            color = back[sp.fbBase + (W - 1 - clamp(x, sp.x0, sp.x1))]
          } else {
            color = front[sp.fbBase + clamp(x, sp.x0, sp.x1)]
          }
        }

        if (!color) color = top[i]
        if (!color) color = 0x8a94a6

        let packed
        if (above[i] && dist[i] > 2 && aboveSlice) {
          const aboveColor = aboveSlice.colors[i]
          packed = aboveColor || pack(color)
        } else {
          packed = pack(color)
        }

        if (shade && dist[i] <= 2 && (above[i] || isSteep)) {
          const r = packed & 255
          const g = (packed >> 8) & 255
          const b = (packed >> 16) & 255
          const f = shadeBase - shade * (1 - z / Math.max(1, H - 1))
          packed =
            ((0xff << 24) | (Math.min(255, Math.round(b * f)) << 16) | (Math.min(255, Math.round(g * f)) << 8) | Math.min(255, Math.round(r * f))) >>> 0
        }

        slice.colors[i] = packed
        if (x < slice.minX) slice.minX = x
        if (x > slice.maxX) slice.maxX = x
        if (y < slice.minY) slice.minY = y
        if (y > slice.maxY) slice.maxY = y
      }
    }
  }

  return { W, L, H, slices }
}
