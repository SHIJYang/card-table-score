/**
 * 涂鸦过山车 —— 轨迹数学工具
 *
 * 参考 rakugaki-coaster 的思路：
 *   手绘折线 → 平滑（平滑方向而不是位置，保留圈数）→ Catmull-Rom 成轨 → 弧长重采样
 * 世界坐标以「米」为单位，手绘视图 10 像素 = 1 米。
 */

export const PX_PER_M = 10 // 手绘视图：10 像素 = 1 米
export const DS = 0.25 // 轨道弧长采样间隔（米）
export const GROUND_PX = 76 // 地面线距画布底部的像素
export const EXT_LEN = 30 // 站台 / 缓冲段轨道长度（米）
export const UNIT = 100 // 分享码单位：1 米 = 100 格（厘米）

/** 折线总长度 */
export function plen(pts) {
  let s = 0
  for (let i = 1; i < pts.length; i++) s += Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y)
  return s
}

/** 按固定步长重采样折线 */
export function resample(pts, step) {
  const out = [{ x: pts[0].x, y: pts[0].y }]
  let carry = 0
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1]
    const b = pts[i]
    const d = Math.hypot(b.x - a.x, b.y - a.y)
    if (d < 1e-9) continue
    let t = step - carry
    while (t <= d) {
      const k = t / d
      out.push({ x: a.x + (b.x - a.x) * k, y: a.y + (b.y - a.y) * k })
      t += step
    }
    carry = d - (t - step)
  }
  const l = pts[pts.length - 1]
  const e = out[out.length - 1]
  if (Math.hypot(l.x - e.x, l.y - e.y) > step * 0.3) out.push({ x: l.x, y: l.y })
  return out
}

/** 高斯模糊（边缘保持），sig 以采样点为单位 */
export function blur(arr, sig) {
  const R = Math.ceil(sig * 3)
  const w = []
  let ws = 0
  for (let j = -R; j <= R; j++) {
    const v = Math.exp((-j * j) / (2 * sig * sig))
    w.push(v)
    ws += v
  }
  const n = arr.length
  const out = new Array(n)
  for (let i = 0; i < n; i++) {
    let s = 0
    for (let j = -R; j <= R; j++) s += arr[Math.max(0, Math.min(n - 1, i + j))] * w[j + R]
    out[i] = s / ws
  }
  return out
}

export const SMOOTH_TURN = 2 // 方向平滑尺度（米）
export const SMOOTH_PULL = 6 // 位置回拉尺度（米）

/**
 * 把手绘线变成「可分享的控制点」。
 * 先抹掉像素抖动；然后对行进方向做高斯模糊 —— 手指的哆嗦消失了，
 * 但一个圈仍然是一样大的圈；最后用缓慢的回拉把形状拉回原来的位置。
 */
export function buildControl(pts, groundY) {
  const st = 0.25
  let p = resample(pts, st)
  p = p.map((a, i) => {
    if (i === 0 || i === p.length - 1) return { x: a.x, y: a.y }
    const k = Math.min(2, i, p.length - 1 - i)
    let x = 0
    let y = 0
    for (let j = i - k; j <= i + k; j++) {
      x += p[j].x
      y += p[j].y
    }
    return { x: x / (2 * k + 1), y: y / (2 * k + 1) }
  })
  const n = p.length
  const th = []
  const d = []
  for (let i = 0; i < n - 1; i++) {
    let a = Math.atan2(p[i + 1].y - p[i].y, p[i + 1].x - p[i].x)
    if (i) {
      while (a - th[i - 1] > Math.PI) a -= 2 * Math.PI
      while (a - th[i - 1] < -Math.PI) a += 2 * Math.PI
    }
    th.push(a)
    d.push(Math.hypot(p[i + 1].x - p[i].x, p[i + 1].y - p[i].y))
  }
  const ts = blur(th, SMOOTH_TURN / st)
  const q = [{ x: p[0].x, y: p[0].y }]
  for (let i = 0; i < n - 1; i++) q.push({ x: q[i].x + d[i] * Math.cos(ts[i]), y: q[i].y + d[i] * Math.sin(ts[i]) })
  const ex = blur(p.map((a, i) => a.x - q[i].x), SMOOTH_PULL / st)
  const ey = blur(p.map((a, i) => a.y - q[i].y), SMOOTH_PULL / st)
  const sm = q.map((a, i) => ({
    x: a.x + ex[i],
    y: Math.min(groundY - 1, a.y + ey[i]),
  }))
  // 每 1 米留一个控制点
  const out = [{ x: sm[0].x, y: sm[0].y }]
  let carry = 0
  for (let i = 1; i < sm.length; i++) {
    const a = sm[i - 1]
    const b = sm[i]
    const dd = Math.hypot(b.x - a.x, b.y - a.y)
    let t = 1 - carry
    while (t <= dd) {
      const k = t / dd
      out.push({ x: a.x + (b.x - a.x) * k, y: a.y + (b.y - a.y) * k })
      t += 1
    }
    carry = dd - (t - 1)
  }
  return out
}

/**
 * 控制点 → 轨道。Catmull-Rom 插值后按 25cm 弧长重采样，
 * 同时算出切线与曲率（曲率用来还原过山车里的推背感 / 失重感）。
 */
export function buildTrack(ctrl) {
  const dense = []
  const P = (i) => ctrl[Math.max(0, Math.min(ctrl.length - 1, i))]
  for (let i = 0; i < ctrl.length - 1; i++) {
    const p0 = P(i - 1)
    const p1 = P(i)
    const p2 = P(i + 1)
    const p3 = P(i + 2)
    for (let k = 0; k < 8; k++) {
      const t = k / 8
      const t2 = t * t
      const t3 = t2 * t
      dense.push({
        x:
          0.5 *
          (2 * p1.x +
            (-p0.x + p2.x) * t +
            (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 +
            (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3),
        y:
          0.5 *
          (2 * p1.y +
            (-p0.y + p2.y) * t +
            (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 +
            (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3),
      })
    }
  }
  dense.push({ ...ctrl[ctrl.length - 1] })
  // 等弧长重采样
  const xs = [dense[0].x]
  const ys = [dense[0].y]
  let carry = 0
  for (let i = 1; i < dense.length; i++) {
    const a = dense[i - 1]
    const b = dense[i]
    const d = Math.hypot(b.x - a.x, b.y - a.y)
    if (d < 1e-6) continue
    let t = DS - carry
    while (t <= d) {
      const k = t / d
      xs.push(a.x + (b.x - a.x) * k)
      ys.push(a.y + (b.y - a.y) * k)
      t += DS
    }
    carry = d - (t - DS)
  }
  const n = xs.length
  const tx = new Float32Array(n)
  const ty = new Float32Array(n)
  const kx = new Float32Array(n)
  const ky = new Float32Array(n)
  for (let i = 0; i < n; i++) {
    const a = Math.max(0, i - 1)
    const b = Math.min(n - 1, i + 1)
    const dx = xs[b] - xs[a]
    const dy = ys[b] - ys[a]
    const m = Math.hypot(dx, dy) || 1
    tx[i] = dx / m
    ty[i] = dy / m
    const k = 6
    const i0 = Math.max(0, i - k)
    const i1 = Math.min(n - 1, i + k)
    if (i - i0 === k && i1 - i === k) {
      kx[i] = (xs[i1] - 2 * xs[i] + xs[i0]) / ((k * DS) ** 2)
      ky[i] = (ys[i1] - 2 * ys[i] + ys[i0]) / ((k * DS) ** 2)
    }
  }
  // 曲率做一点平滑，否则手绘的抖动会被读成剧烈的 G 值尖刺
  const skx = new Float32Array(n)
  const sky = new Float32Array(n)
  for (let i = 0; i < n; i++) {
    let x = 0
    let y = 0
    let c2 = 0
    for (let j = Math.max(0, i - 5); j <= Math.min(n - 1, i + 5); j++) {
      x += kx[j]
      y += ky[j]
      c2++
    }
    skx[i] = x / c2
    sky[i] = y / c2
  }
  // 车厢挂在轨道的哪一侧：选一个让列车起步时是正的，之后固定（翻圈时自然倒过来）
  const sigma = -tx[0] > 0 ? -1 : 1
  return { xs, ys, tx, ty, kx: skx, ky: sky, n, len: (n - 1) * DS, sigma }
}

/** 在弧长 s 处采样轨道 */
export function sample(tr, s) {
  const f = Math.max(0, Math.min(tr.n - 1.001, s / DS))
  const i = Math.floor(f)
  const u = f - i
  const j = Math.min(tr.n - 1, i + 1)
  const lerp = (A) => A[i] + (A[j] - A[i]) * u
  let tx = lerp(tr.tx)
  let ty = lerp(tr.ty)
  const m = Math.hypot(tx, ty) || 1
  tx /= m
  ty /= m
  return { x: lerp(tr.xs), y: lerp(tr.ys), tx, ty, kx: lerp(tr.kx), ky: lerp(tr.ky) }
}

/**
 * 轨道两端延长：起点向后 30 米（列车在站台等客），终点向前 30 米（缓冲停车）。
 * 延长段会平滑地摆平到水平。
 */
export function buildExt(tr, groundY) {
  const mk = (x, y, dx, dy) => {
    const xs = [x]
    const ys = [y]
    const a0 = Math.atan2(dy, dx)
    let d = (dx >= 0 ? 0 : Math.PI) - a0
    while (d > Math.PI) d -= 2 * Math.PI
    while (d < -Math.PI) d += 2 * Math.PI
    for (let i = 1; i * DS <= EXT_LEN; i++) {
      const k = Math.min(1, (i * DS) / 4)
      const a = a0 + d * k * k * (3 - 2 * k)
      x += Math.cos(a) * DS
      y = Math.min(groundY - 0.8, y + Math.sin(a) * DS)
      xs.push(x)
      ys.push(y)
    }
    return { xs, ys }
  }
  tr.extB = mk(tr.xs[0], tr.ys[0], -tr.tx[0], -tr.ty[0])
  tr.extE = mk(tr.xs[tr.n - 1], tr.ys[tr.n - 1], tr.tx[tr.n - 1], tr.ty[tr.n - 1])
}

/** 轨道上的点，起点之前 / 终点之后走延长段 */
export function trainPos(tr, s) {
  if (s >= 0 && s <= tr.len) return sample(tr, s)
  const back = s < 0
  const e = back ? tr.extB : tr.extE
  const f = Math.min(e.xs.length - 1.001, (back ? -s : s - tr.len) / DS)
  const i = Math.floor(f)
  const u = f - i
  let tx = e.xs[i + 1] - e.xs[i]
  let ty = e.ys[i + 1] - e.ys[i]
  const m = Math.hypot(tx, ty) || 1
  tx /= m
  ty /= m
  if (back) {
    tx = -tx
    ty = -ty
  }
  return {
    x: e.xs[i] + (e.xs[i + 1] - e.xs[i]) * u,
    y: e.ys[i] + (e.ys[i + 1] - e.ys[i]) * u,
    tx,
    ty,
  }
}

/**
 * 轨道自我交叉 / 平行时，给互相重叠的两段不同的「深度」（3D 里就是横向错开），
 * 让它们一前一后地穿过去，而不是撞在一起。结果平滑、可复现。
 */
export function buildDepth(tr) {
  const D = 2.5
  const ZSEP = 3.2
  const SIG = 2.2
  const ITERS = 300
  const st = Math.round(1 / DS)
  const m = Math.floor((tr.n - 1) / st) + 1
  const px = new Float64Array(m)
  const py = new Float64Array(m)
  for (let k = 0; k < m; k++) {
    px[k] = tr.xs[k * st]
    py[k] = tr.ys[k * st]
  }
  const grid = new Map()
  const key = (i, j) => i * 100003 + j
  for (let k = 0; k < m; k++) {
    const g = key(Math.floor(px[k] / D), Math.floor(py[k] / D))
    if (!grid.has(g)) grid.set(g, [])
    grid.get(g).push(k)
  }
  const pairs = []
  for (let a = 0; a < m; a++) {
    const ci = Math.floor(px[a] / D)
    const cj = Math.floor(py[a] / D)
    for (let di = -1; di <= 1; di++) {
      for (let dj = -1; dj <= 1; dj++) {
        const arr = grid.get(key(ci + di, cj + dj))
        if (!arr) continue
        for (const b of arr) {
          if (b <= a) continue
          const d = Math.hypot(px[a] - px[b], py[a] - py[b])
          if (d < D && b - a > d * 1.8 + 3) pairs.push(a, b)
        }
      }
    }
  }
  const z = new Float64Array(m)
  if (pairs.length) {
    const R = Math.ceil(SIG * 3)
    const w = []
    let ws = 0
    for (let j = -R; j <= R; j++) {
      const v = Math.exp((-j * j) / (2 * SIG * SIG))
      w.push(v)
      ws += v
    }
    const dz = new Float64Array(m)
    const cnt = new Float64Array(m)
    const zs = new Float64Array(m)
    for (let it = 0; it < ITERS; it++) {
      dz.fill(0)
      cnt.fill(0)
      for (let q = 0; q < pairs.length; q += 2) {
        const a = pairs[q]
        const b = pairs[q + 1]
        const diff = z[b] - z[a]
        const def = ZSEP * 1.15 - Math.abs(diff)
        if (def > 0) {
          const sg = diff >= 0 ? 1 : -1
          dz[b] += (sg * def) / 2
          dz[a] -= (sg * def) / 2
          cnt[a]++
          cnt[b]++
        }
      }
      for (let k = 0; k < m; k++) if (cnt[k]) z[k] += dz[k] / cnt[k]
      for (let k = 0; k < m; k++) {
        let s = 0
        for (let j = -R; j <= R; j++) s += z[Math.max(0, Math.min(m - 1, k + j))] * w[j + R]
        zs[k] = s / ws
      }
      z.set(zs)
    }
    let mean = 0
    for (let k = 0; k < m; k++) mean += z[k]
    mean /= m
    for (let k = 0; k < m; k++) z[k] -= mean
  }
  tr.zs = new Float32Array(tr.n)
  for (let i = 0; i < tr.n; i++) {
    const f = Math.min(m - 1.001, i / st)
    const k = Math.floor(f)
    tr.zs[i] = m > 1 ? z[k] + (z[k + 1] - z[k]) * (f - k) : 0
  }
  return tr
}

/** 弧长 s 处的深度偏移 */
export function zAt(tr, s) {
  const f = Math.max(0, Math.min(tr.n - 1.001, s / DS))
  const i = Math.floor(f)
  return tr.zs[i] + (tr.zs[i + 1] - tr.zs[i]) * (f - i)
}

/* ---------- 分享码：首点 + 每米增量（厘米，int8），地面高度 int16 ---------- */

export function encode(ctrl, groundY) {
  const q = ctrl.map((p) => [Math.round(p.x * UNIT), Math.round(p.y * UNIT)])
  const bytes = new Uint8Array(2 + (q.length - 1) * 2)
  const gr = Math.max(-32768, Math.min(32767, Math.round(groundY * UNIT) - q[0][1]))
  bytes[0] = (gr >> 8) & 255
  bytes[1] = gr & 255
  for (let i = 1; i < q.length; i++) {
    bytes[2 + (i - 1) * 2] = Math.max(-127, Math.min(127, q[i][0] - q[i - 1][0])) & 255
    bytes[3 + (i - 1) * 2] = Math.max(-127, Math.min(127, q[i][1] - q[i - 1][1])) & 255
  }
  let s = ''
  bytes.forEach((b) => {
    s += String.fromCharCode(b)
  })
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

export function decode(str, unit = UNIT) {
  const b = atob(str.replace(/-/g, '+').replace(/_/g, '/'))
  const by = Uint8Array.from(b, (ch) => ch.charCodeAt(0))
  if (by.length < 8) throw new Error('分享码太短')
  let gr = (by[0] << 8) | by[1]
  if (gr > 32767) gr -= 65536
  const pts = [{ x: 0, y: 0 }]
  let x = 0
  let y = 0
  for (let i = 2; i + 1 < by.length; i += 2) {
    const dx = by[i] > 127 ? by[i] - 256 : by[i]
    const dy = by[i + 1] > 127 ? by[i + 1] - 256 : by[i + 1]
    x += dx
    y += dy
    pts.push({ x: x / unit, y: y / unit })
  }
  return { pts, ground: gr / unit }
}
