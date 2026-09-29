// 江南园林场景 - 室内陈设（宋明家具 + 灯具烛台 + 挂画屏风）
import * as THREE from 'three'
import { merge, boxGeo, cylGeo, rng } from './util'

const platTop = 0.45

// ---------- 单件家具构建器（返回按材质分组几何） ----------
function tableRect(w, d, h, { stretcher = true } = {}) {
  const t = 0.055
  const parts = { furniture: [], furnitureDark: [] }
  const F = parts.furniture, D = parts.furnitureDark
  F.push([boxGeo(w, 0.055, d, 0.7), 0, h, 0])
  // 腿（内收）
  const lx = w / 2 - t * 1.2, lz = d / 2 - t * 1.2
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    F.push([boxGeo(t, h - 0.03, t, 0.7), sx * lx, (h - 0.03) / 2, sz * lz])
  }
  // 牙板
  D.push([boxGeo(w - t * 2, 0.09, 0.028), 0, h - 0.12, d / 2 - t])
  D.push([boxGeo(w - t * 2, 0.09, 0.028), 0, h - 0.12, -d / 2 + t])
  D.push([boxGeo(0.028, 0.09, d - t * 2), w / 2 - t, h - 0.12, 0])
  D.push([boxGeo(0.028, 0.09, d - t * 2), -w / 2 + t, h - 0.12, 0])
  if (stretcher) {
    D.push([boxGeo(w - t * 2.4, 0.045, 0.045), 0, 0.14, 0])
    D.push([boxGeo(0.045, 0.045, d - t * 2.4), 0, 0.14, 0])
  }
  return parts
}

// 官帽椅（近似：座面+搭脑+背板+扶手）
function officialChair() {
  const parts = { furniture: [], furnitureDark: [] }
  const F = parts.furniture, D = parts.furnitureDark
  const sw = 0.56, sd = 0.5, sh = 0.5
  F.push([boxGeo(sw, 0.05, sd, 0.7), 0, sh, 0])
  const t = 0.05, lx = sw / 2 - t, lz = sd / 2 - t
  const legH = sh
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    const front = sz < 0
    F.push([boxGeo(t, front ? legH : legH + 0.52, t, 0.7), sx * lx, (front ? legH : legH + 0.52) / 2, sz * lz])
  }
  // 后腿延伸 + 搭脑（弓形）
  D.push([boxGeo(sw - t, 0.05, 0.05), 0, legH + 0.68, -lz])
  D.push([boxGeo(sw - t * 3, 0.045, 0.045), 0, legH + 0.6, -lz])
  // 背板两块（微倾）
  for (let i = 0; i < 2; i++) {
    D.push([boxGeo(sw - t * 2.4, 0.16, 0.03), 0, legH + 0.18 + i * 0.2, -lz + 0.01, -0.12, 0, 0])
  }
  // 联帮枋 + 扶手
  for (const sx of [-1, 1]) {
    D.push([boxGeo(0.035, 0.035, 0.36), sx * (lx - 0.04), legH + 0.16, lz / 2 - 0.02])
    D.push([boxGeo(0.04, 0.05, 0.3), sx * (lx - 0.03), legH + 0.22, lz / 2 - 0.05, -0.25, 0, 0])
  }
  D.push([boxGeo(sw - t * 1.6, 0.05, 0.05), 0, sh - 0.06, -lz])
  D.push([boxGeo(sw - t * 1.6, 0.05, 0.05), 0, sh - 0.06, lz])
  D.push([boxGeo(sw - t * 1.6, 0.045, 0.045), 0, 0.16, 0])
  return parts
}

// 书格（多层开放书架 + 书）
function bookshelf(w = 1.5, h = 2.15, d = 0.4, R) {
  const parts = { furniture: [], furnitureDark: [], scrollPaper: [] }
  const F = parts.furniture, D = parts.furnitureDark, S = parts.scrollPaper
  const t = 0.05
  F.push([boxGeo(w, t, d, 0.6), 0, h - t / 2, 0])
  F.push([boxGeo(w, 0.06, d, 0.6), 0, 0.03, 0])
  for (const sx of [-1, 1]) F.push([boxGeo(t, h, d, 0.6), sx * (w / 2 - t / 2), h / 2, 0])
  F.push([boxGeo(w, h, 0.025), 0, h / 2, -d / 2 + 0.012])
  const nShelf = 4
  for (let i = 1; i <= nShelf; i++) {
    const y = (h * i) / (nShelf + 0.35)
    F.push([boxGeo(w - t * 2, 0.035, d - 0.04, 0.6), 0, y, 0])
    // 书/卷册
    let x = -w / 2 + t + 0.05
    while (x < w / 2 - t - 0.08) {
      if (R.r() < 0.82) {
        const bw = R.f(0.05, 0.1), bh = R.f(0.22, 0.32)
        if (R.r() < 0.72) {
          D.push([boxGeo(bw, bh, d * R.f(0.5, 0.72)), x + bw / 2, y + 0.018 + bh / 2, R.f(-0.03, 0.03)])
        } else {
          // 平放堆叠
          const n2 = R.i(2, 4)
          for (let k = 0; k < n2; k++) {
            D.push([boxGeo(R.f(0.22, 0.3), 0.035, d * 0.55), x + 0.14, y + 0.02 + k * 0.037, 0, 0, R.f(-0.08, 0.08), 0])
          }
          x += 0.26
          continue
        }
        x += bw + 0.012
      } else {
        // 卷轴
        S.push([cylGeo(0.032, 0.032, R.f(0.3, 0.42), 8).rotateZ(Math.PI / 2), x + 0.12, y + 0.05, 0])
        x += 0.24
      }
    }
  }
  return parts
}

// 架子床
function canopyBed(R) {
  const parts = { furniture: [], furnitureDark: [], curtain: [], silk: [] }
  const F = parts.furniture, D = parts.furnitureDark, C = parts.curtain, SI = parts.silk
  const L = 2.15, Wd = 1.42, H0 = 0.42, postH = 1.95
  // 床座
  F.push([boxGeo(L, 0.24, Wd, 0.5), 0, H0 - 0.12, 0])
  F.push([boxGeo(L - 0.1, 0.05, Wd - 0.1, 0.5), 0, H0 + 0.005, 0])
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    F.push([boxGeo(0.09, H0 - 0.1, 0.09), sx * (L / 2 - 0.08), (H0 - 0.1) / 2, sz * (Wd / 2 - 0.08)])
  }
  SI.push([boxGeo(L - 0.2, 0.1, Wd - 0.2), 0, H0 + 0.08, 0]) // 褥
  SI.push([boxGeo(0.55, 0.09, Wd - 0.24), -L / 2 + 0.42, H0 + 0.13, 0]) // 枕
  // 四柱 + 顶
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    F.push([boxGeo(0.075, postH, 0.075), sx * (L / 2 - 0.05), H0 + postH / 2, sz * (Wd / 2 - 0.05)])
  }
  F.push([boxGeo(L, 0.07, Wd, 0.5), 0, H0 + postH, 0])
  // 三面围子（镂空小人字纹简化：横竖条）
  for (const sx of [-1, 1]) {
    const zg = merge([
      [boxGeo(0.045, 0.85, 0.05), 0, 0.55, 0],
      ...Array.from({ length: 7 }, (_, i) => [boxGeo(0.03, 0.85, 0.026), 0, 0.55, (i / 6 - 0.5) * (Wd - 0.4)]),
      ...Array.from({ length: 5 }, (_, i) => [boxGeo(0.028, 0.03, Wd - 0.4), 0, 0.22 + i * 0.14, 0]),
    ])
    zg.translate(sx * (L / 2 - 0.03), H0, 0)
    F.push(zg)
  }
  const zgBack = merge([
    [boxGeo(0.05, 0.85, 0.045), 0, 0.55, 0],
    ...Array.from({ length: 9 }, (_, i) => [boxGeo(0.03, 0.85, 0.026), (i / 8 - 0.5) * (L - 0.4), 0.55, 0]),
    ...Array.from({ length: 5 }, (_, i) => [boxGeo(L - 0.4, 0.03, 0.028), 0, 0.22 + i * 0.14, 0]),
  ])
  zgBack.translate(0, H0, -Wd / 2 + 0.03)
  F.push(zgBack)
  // 帐幔（两侧半透明纱）
  for (const sx of [-1, 1]) {
    const cg = new THREE.PlaneGeometry(Wd * 0.96, postH * 0.72)
    cg.rotateY(Math.PI / 2)
    cg.translate(sx * (L / 2 - 0.09), H0 + postH * 0.36 + 0.05, 0)
    // 简单波浪
    const pos = cg.attributes.position
    for (let i = 0; i < pos.count; i++) {
      const z = pos.getZ(i), y = pos.getY(i)
      pos.setX(i, pos.getX(i) + Math.sin(z * 9) * 0.035)
      pos.setZ(i, z + Math.sin(y * 5 + z * 4) * 0.02)
    }
    cg.computeVertexNormals()
    C.push(cg)
  }
  return parts
}

// 衣架（丁字形）
function clothesRack() {
  const parts = { furniture: [], furnitureDark: [] }
  const F = parts.furniture, D = parts.furnitureDark
  F.push([boxGeo(0.62, 0.06, 0.3, 0.6), 0, 0.03, 0])
  F.push([cylGeo(0.032, 0.04, 1.62, 8), 0, 0.84, 0])
  D.push([boxGeo(1.3, 0.05, 0.05, 0.6), 0, 1.62, 0, 0, 0, 0])
  D.push([cylGeo(0.02, 0.02, 1.3, 6).rotateZ(Math.PI / 2), 0, 1.68, 0])
  // 挂的两件衣（布色块）
  D.push([boxGeo(0.4, 0.7, 0.06), -0.3, 1.24, 0])
  D.push([boxGeo(0.34, 0.6, 0.06), 0.28, 1.3, 0.01])
  return parts
}

// 屏风（三扇）
function foldingScreen(M, R) {
  const G = new THREE.Group()
  const silkMat = new THREE.MeshStandardMaterial({ map: M.tex.screen, roughness: 0.85, side: THREE.DoubleSide })
  for (let i = -1; i <= 1; i++) {
    const panel = new THREE.Group()
    const w = 1.0, h = 1.95, t = 0.045
    const frame = merge([
      [boxGeo(w, 0.07, t), 0, h / 2 - 0.035, 0],
      [boxGeo(w, 0.07, t), 0, -h / 2 + 0.035, 0],
      [boxGeo(0.07, h, t), -w / 2 + 0.035, 0, 0],
      [boxGeo(0.07, h, t), w / 2 - 0.035, 0, 0],
      [boxGeo(w - 0.14, h - 0.2, 0.02), 0, 0, -0.008],
    ])
    const fm = new THREE.Mesh(frame, M.furnitureDark)
    fm.castShadow = true; fm.receiveShadow = true
    panel.add(fm)
    const silk = new THREE.Mesh(new THREE.PlaneGeometry(w - 0.16, h - 0.24), silkMat)
    silk.position.z = 0.012
    silk.rotation.x = Math.PI // 正面朝向调整
    silk.receiveShadow = true
    panel.add(silk)
    panel.rotation.y = i * 0.5
    panel.position.x = i * Math.cos(0.5) * (w - 0.06)
    panel.position.z = -Math.abs(i) * Math.sin(0.5) * (w - 0.06) * 0 + (i !== 0 ? Math.sin(i * 0.5) * 0 : 0)
    G.add(panel)
    // 屏风座
    const base = new THREE.Mesh(boxGeo(w - 0.1, 0.09, 0.3), M.furnitureDark)
    base.position.set(panel.position.x + Math.sin(i * 0.5) * 0, 0.045, 0)
    base.castShadow = true
    G.add(base)
  }
  return G
}

// 香炉（铜）三足双耳
export function censer(scale = 1) {
  const prof = []
  for (let i = 0; i <= 10; i++) {
    const t = i / 10
    prof.push(new THREE.Vector2((0.11 + Math.sin(t * Math.PI) * 0.075) * scale, t * 0.16 * scale))
  }
  const body = new THREE.LatheGeometry(prof, 18)
  const parts = [
    body,
    ...[-1, 1].map((s) => new THREE.TorusGeometry(0.045 * scale, 0.012 * scale, 6, 12, Math.PI).translate(s * 0.1 * scale, 0.15 * scale, 0).rotateY(Math.PI / 2)),
    ...[[1, 0], [-0.5, 0.866], [-0.5, -0.866]].map(([a, b]) => cylGeo(0.014 * scale, 0.02 * scale, 0.05 * scale, 6).translate(a * 0.08 * scale, -0.02 * scale, b * 0.08 * scale)),
  ]
  return merge(parts)
}

// 花瓶 + 折枝花
function vaseWithFlower(R) {
  const G = new THREE.Group()
  const prof = []
  const pts = [[0.02, 0], [0.07, 0.02], [0.1, 0.09], [0.09, 0.16], [0.05, 0.24], [0.04, 0.3], [0.055, 0.34], [0.05, 0.36]]
  for (const [r, y] of pts) prof.push(new THREE.Vector2(r, y))
  const body = new THREE.Mesh(new THREE.LatheGeometry(prof, 16), new THREE.MeshStandardMaterial({ color: 0xdfe6e2, roughness: 0.15, metalness: 0.05 }))
  body.castShadow = true
  G.add(body)
  const petals = new THREE.Group()
  const mat = new THREE.MeshStandardMaterial({ color: 0xe8c8b8, roughness: 0.6, side: THREE.DoubleSide })
  const stemMat = new THREE.MeshStandardMaterial({ color: 0x5a6b3c, roughness: 0.8 })
  for (let b = 0; b < 3; b++) {
    const stem = new THREE.Mesh(cylGeo(0.006, 0.009, R.f(0.28, 0.45), 5), stemMat)
    stem.position.set(R.f(-0.03, 0.03), 0.36 + 0.14, R.f(-0.03, 0.03))
    stem.rotation.set(R.f(-0.25, 0.25), 0, R.f(-0.3, 0.3))
    petals.add(stem)
    for (let p = 0; p < 5; p++) {
      const leaf = new THREE.Mesh(new THREE.CircleGeometry(0.028, 6), mat)
      const a = (p / 5) * Math.PI * 2
      leaf.position.set(stem.position.x + Math.cos(a) * 0.03, stem.position.y + R.f(0, 0.05), stem.position.z + Math.sin(a) * 0.03)
      leaf.rotation.set(R.f(-0.5, 0.5), R.f(0, Math.PI), R.f(-0.5, 0.5))
      petals.add(leaf)
    }
  }
  G.add(petals)
  return G
}

// 挂画（立轴/横幅）
function hangingScroll(w, h, tex) {
  const G = new THREE.Group()
  const g = merge([
    [new THREE.PlaneGeometry(w, h), 0, 0, 0.005],
    [boxGeo(w + 0.04, 0.03, 0.03), 0, h / 2, 0],
    [cylGeo(0.018, 0.018, w + 0.08, 8).rotateZ(Math.PI / 2), 0, -h / 2 - 0.01, 0],
    [cylGeo(0.012, 0.012, 0.05, 6).rotateZ(Math.PI / 2), -(w / 2 + 0.04), -h / 2 - 0.01, 0],
    [cylGeo(0.012, 0.012, 0.05, 6).rotateZ(Math.PI / 2), (w / 2 + 0.04), -h / 2 - 0.01, 0],
  ])
  const m = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ map: tex, roughness: 0.9 }))
  m.castShadow = true; m.receiveShadow = true
  G.add(m)
  return G
}

// 灯台（落地，挑杆挂小灯笼）
function lampStand() {
  const G = new THREE.Group()
  const dark = new THREE.MeshStandardMaterial({ map: null, color: 0x3d2c1e, roughness: 0.55 })
  const g = merge([
    [cylGeo(0.16, 0.2, 0.05, 12), 0, 0.025, 0],
    [cylGeo(0.022, 0.028, 1.5, 8), 0, 0.78, 0],
    [cylGeo(0.016, 0.016, 0.42, 6).rotateZ(Math.PI / 2), 0.19, 1.5, 0],
    [boxGeo(0.05, 0.05, 0.05), 0.38, 1.47, 0],
  ])
  const m = new THREE.Mesh(g, dark)
  m.castShadow = true
  G.add(m)
  return G
}

// 小灯笼（挂杆端）
export function lanternMesh(M, scale = 1) {
  const G = new THREE.Group()
  const prof = []
  for (let i = 0; i <= 12; i++) {
    const t = i / 12
    prof.push(new THREE.Vector2((0.045 + Math.sin(t * Math.PI) * 0.075) * scale, t * 0.24 * scale))
  }
  const body = new THREE.Mesh(new THREE.LatheGeometry(prof, 14), M.lanternGlow)
  body.castShadow = false
  G.add(body)
  const caps = new THREE.Mesh(merge([
    cylGeo(0.055 * scale, 0.05 * scale, 0.028 * scale, 10),
    [cylGeo(0.05 * scale, 0.055 * scale, 0.028 * scale, 10), 0, 0.24 * scale, 0],
  ]), M.furnitureDark)
  G.add(caps)
  // 流苏
  const tas = new THREE.Mesh(cylGeo(0.008 * scale, 0.02 * scale, 0.09 * scale, 6), new THREE.MeshStandardMaterial({ color: 0xa33b32, roughness: 0.9 }))
  tas.position.y = -0.06 * scale
  G.add(tas)
  return G
}

// 烛台（带火焰光晕）
function candleStick(M, h = 0.16) {
  const G = new THREE.Group()
  const g = merge([
    [cylGeo(0.05, 0.07, 0.015, 10), 0, 0.008, 0],
    [cylGeo(0.008, 0.012, h, 6), 0, h / 2, 0],
    [cylGeo(0.03, 0.02, 0.012, 8), 0, h, 0],
  ])
  const m = new THREE.Mesh(g, M.bronze)
  m.castShadow = true
  G.add(m)
  const candle = new THREE.Mesh(cylGeo(0.014, 0.016, 0.09, 6), M.candle)
  candle.position.y = h + 0.045
  G.add(candle)
  const flame = new THREE.Sprite(new THREE.SpriteMaterial({ map: M.tex.glow, color: 0xffb050, transparent: true, opacity: 0.85, depthWrite: false }))
  flame.scale.set(0.07, 0.12, 1)
  flame.position.y = h + 0.12
  G.add(flame)
  return G
}

// 茶具
function teaSet(M) {
  const G = new THREE.Group()
  const potProf = [[0.001, 0], [0.045, 0.005], [0.055, 0.04], [0.04, 0.075], [0.02, 0.09], [0.024, 0.098]].map(([r, y]) => new THREE.Vector2(r, y))
  const pot = new THREE.Mesh(new THREE.LatheGeometry(potProf, 14), new THREE.MeshStandardMaterial({ color: 0x6d4a33, roughness: 0.35 }))
  pot.position.set(0, 0, 0)
  pot.castShadow = true
  G.add(pot)
  const spout = new THREE.Mesh(cylGeo(0.008, 0.012, 0.07, 6), pot.material)
  spout.rotation.z = 0.9
  spout.position.set(0.06, 0.05, 0)
  G.add(spout)
  const handle = new THREE.Mesh(new THREE.TorusGeometry(0.035, 0.008, 6, 12, Math.PI), pot.material)
  handle.position.set(-0.045, 0.05, 0)
  handle.rotation.z = Math.PI / 2
  G.add(handle)
  const cupMat = new THREE.MeshStandardMaterial({ color: 0xe9e4d5, roughness: 0.3 })
  for (let i = 0; i < 4; i++) {
    const cup = new THREE.Mesh(cylGeo(0.024, 0.017, 0.03, 10), cupMat)
    cup.position.set((i % 2 ? 1 : -1) * 0.11, 0, (i < 2 ? 1 : -1) * 0.1)
    cup.castShadow = true
    G.add(cup)
  }
  const tray = new THREE.Mesh(boxGeo(0.36, 0.02, 0.3), M.furnitureDark)
  tray.position.y = -0.005
  tray.receiveShadow = true
  G.add(tray)
  return G
}

// 文房（笔筒/砚/书函/镇纸）
function scholarItems(M, R) {
  const G = new THREE.Group()
  const holder = new THREE.Mesh(cylGeo(0.045, 0.05, 0.1, 10), M.bronze)
  holder.position.set(-0.28, 0.05, 0.05)
  holder.castShadow = true
  G.add(holder)
  for (let i = 0; i < 5; i++) {
    const brush = new THREE.Mesh(cylGeo(0.004, 0.004, 0.24, 5), new THREE.MeshStandardMaterial({ color: i % 2 ? 0x9a5a30 : 0x2f2a24, roughness: 0.7 }))
    brush.position.set(-0.28 + R.f(-0.02, 0.02), 0.16, 0.05 + R.f(-0.02, 0.02))
    brush.rotation.set(R.f(-0.15, 0.15), 0, R.f(-0.12, 0.12))
    G.add(brush)
  }
  const inkstone = new THREE.Mesh(merge([
    [boxGeo(0.16, 0.03, 0.11, 1), 0, 0.015, 0],
    [boxGeo(0.1, 0.015, 0.06, 1), 0, 0.036, -0.015],
  ]), new THREE.MeshStandardMaterial({ color: 0x2c2c30, roughness: 0.25 }))
  inkstone.position.set(0.05, 0, -0.06)
  inkstone.castShadow = true
  G.add(inkstone)
  const books = new THREE.Mesh(merge([
    [boxGeo(0.2, 0.04, 0.14, 1), 0, 0.02, 0],
    [boxGeo(0.18, 0.035, 0.13, 1), 0.01, 0.055, 0.005, 0, 0.06, 0],
    [boxGeo(0.17, 0.03, 0.125, 1), -0.01, 0.085, -0.005, 0, -0.04, 0],
  ]), M.furnitureDark)
  books.position.set(0.28, 0, 0.08)
  books.castShadow = true
  G.add(books)
  const zhizhen = new THREE.Mesh(boxGeo(0.035, 0.02, 0.2), M.bronze)
  zhizhen.position.set(0.02, 0.01, 0.16)
  G.add(zhizhen)
  return G
}

// 古琴 + 琴几
function qinWithTable(M) {
  const G = new THREE.Group()
  const t = new THREE.Mesh(merge([
    [boxGeo(0.9, 0.05, 0.36, 0.6), 0, 0.56, 0],
    [boxGeo(0.05, 0.54, 0.05), -0.38, 0.27, 0],
    [boxGeo(0.05, 0.54, 0.05), 0.38, 0.27, 0],
    [boxGeo(0.7, 0.04, 0.04), 0, 0.1, 0],
  ]), M.furniture)
  t.castShadow = true; t.receiveShadow = true
  G.add(t)
  const qin = new THREE.Mesh(merge([
    [boxGeo(1.16, 0.055, 0.19, 0.8), 0, 0.62, 0],
    [boxGeo(0.16, 0.06, 0.15, 0.8), -0.5, 0.62, 0, 0, 0, 0],
  ]), new THREE.MeshStandardMaterial({ color: 0x3a2a20, roughness: 0.35 }))
  qin.castShadow = true
  G.add(qin)
  const strMat = new THREE.MeshStandardMaterial({ color: 0xd8cfae, roughness: 0.5 })
  for (let i = 0; i < 7; i++) {
    const s = new THREE.Mesh(boxGeo(1.05, 0.003, 0.003), strMat)
    s.position.set(0.02, 0.652, -0.06 + i * 0.02)
    G.add(s)
  }
  return G
}

// ============ 全屋陈设 ============
export function buildFurnishings(ctx, M) {
  const R = rng(77)
  const G = new THREE.Group()
  const flames = []   // 火焰光晕（引擎做闪烁）
  const censers = []  // 香炉位置（引擎做烟）
  const lampSlots = [] // 灯台位置（挂小灯笼）

  const addParts = (parts, px, pz, rotY = 0, py = platTop) => {
    const sub = new THREE.Group()
    for (const [k, geos] of Object.entries(parts)) {
      if (!geos || !geos.length) continue
      const mats = { furniture: M.furniture, furnitureDark: M.furnitureDark, curtain: M.curtain, silk: M.silk, scrollPaper: M.scrollPaper }
      const m = new THREE.Mesh(merge(geos), mats[k])
      m.castShadow = true; m.receiveShadow = true
      sub.add(m)
    }
    sub.position.set(px, py, pz)
    sub.rotation.y = rotY
    G.add(sub)
    return sub
  }
  const addObj = (obj, px, pz, rotY = 0, py = platTop) => {
    obj.position.set(px, py, pz)
    obj.rotation.y = rotY
    G.add(obj)
    return obj
  }
  const collider = (x1, z1, x2, z2, h = 1) => ctx.wall(x1, z1, x2, z2, h)

  // ===== 明间堂屋 =====
  {
    // 翘头条案（靠屏门西侧，东留行走口）
    const a = tableRect(1.7, 0.42, 0.86)
    a.furniture.push([boxGeo(0.08, 0.05, 0.42), -0.85, 0.89, 0], [boxGeo(0.08, 0.05, 0.42), 0.85, 0.89, 0])
    addParts(a, -1.05, -6.5)
    collider(-1.95, -6.72, -0.15, -6.28, 1)
    // 香炉 + 烛台 + 花瓶于案上
    addObj(new THREE.Mesh(censer(1.15), M.bronze), -1.05, -6.5, 0, platTop + 0.89)
    censers.push(new THREE.Vector3(-1.05, platTop + 1.05, -6.5))
    const cs = addObj(candleStick(M), -1.73, -6.5, 0, platTop + 0.885)
    flames.push(cs.children[2])
    const cs2 = addObj(candleStick(M), -0.37, -6.5, 0, platTop + 0.885)
    flames.push(cs2.children[2])
    addObj(vaseWithFlower(R), -0.7, -6.52, 0, platTop + 0.885)
    // 中堂挂画（立轴）
    addObj(hangingScroll(0.92, 1.7, M.tex.paintingV), -1.05, -6.62, 0, platTop + 2.62)
    // 八仙桌
    addParts(tableRect(1.02, 1.02, 0.82), 0, -4.6)
    collider(-0.56, -5.16, 0.56, -4.04, 1)
    // 官帽椅 x3（两侧+南端，北侧留入户通道）
    for (const [cx2, cz2, rot] of [[-0.88, -4.6, Math.PI / 2], [0.88, -4.6, -Math.PI / 2], [0, -5.5, 0]]) {
      addParts(officialChair(), cx2, cz2, rot)
      collider(cx2 - 0.28, cz2 - 0.28, cx2 + 0.28, cz2 + 0.28, 0.9)
    }
    // 茶壶于八仙桌
    addObj(teaSet(M), 0, -4.6, 0.4, platTop + 0.85)
    // 香几 + 小炉（西南角）
    addParts(tableRect(0.4, 0.4, 0.78, { stretcher: false }), 2.62, -6.12)
    addObj(new THREE.Mesh(censer(0.8), M.bronze), 2.62, -6.12, 0, platTop + 0.8)
    censers.push(new THREE.Vector3(2.62, platTop + 0.9, -6.12))
    collider(2.4, -6.34, 2.84, -5.9, 0.9)
  }

  // ===== 书房（西北间） =====
  {
    // 书案（面西窗）
    addParts(tableRect(1.35, 0.62, 0.8), -5.55, -4.55, Math.PI / 2)
    collider(-5.95, -5.3, -5.15, -3.8, 1)
    addParts(officialChair(), -4.85, -4.55, -Math.PI / 2)
    collider(-5.15, -4.85, -4.55, -4.25, 0.9)
    addObj(scholarItems(M, R), -5.55, -4.55, Math.PI / 2, platTop + 0.83)
    // 书格（靠东隔断）
    addParts(bookshelf(1.55, 2.15, 0.42, R), -2.5, -5.85, -Math.PI / 2)
    collider(-2.72, -6.65, -2.28, -5.05, 2.2)
    // 琴几与琴（南窗附近）
    addObj(qinWithTable(M), -4.35, -3.0, Math.PI / 2)
    collider(-4.85, -3.4, -3.85, -2.6, 0.7)
    // 横幅挂画
    addObj(hangingScroll(1.15, 0.62, M.tex.paintingH), -2.22, -3.6, -Math.PI / 2, platTop + 2.0)
    // 灯台
    addObj(lampStand(), -5.85, -6.25, 0.5)
    lampSlots.push(new THREE.Vector3(-5.85 + 0.38, platTop + 1.42, -6.25))
    flames.push(addObj(candleStick(M, 0.1), -5.85, -6.25, 0, platTop + 0.06).children[2])
  }

  // ===== 茶室（东北间） =====
  {
    addParts(tableRect(0.95, 0.95, 0.74), 4.25, -4.35)
    collider(3.7, -4.9, 4.8, -3.8, 1)
    addObj(teaSet(M), 4.25, -4.35, 0.3, platTop + 0.77)
    for (const [cx2, cz2, rot] of [[3.45, -4.35, Math.PI / 2], [5.05, -4.35, -Math.PI / 2], [4.25, -3.55, Math.PI], [4.25, -5.15, 0]]) {
      addParts(officialChair(), cx2, cz2, rot)
      collider(cx2 - 0.3, cz2 - 0.3, cx2 + 0.3, cz2 + 0.3, 0.9)
    }
    // 茶柜
    const cab = merge([
      [boxGeo(1.05, 1.7, 0.48, 0.5), 0, 0.85, 0],
      [boxGeo(0.44, 0.62, 0.02), -0.26, 1.25, 0.245],
      [boxGeo(0.44, 0.62, 0.02), 0.26, 1.25, 0.245],
      [boxGeo(0.44, 0.62, 0.02), -0.26, 0.52, 0.245],
      [boxGeo(0.44, 0.62, 0.02), 0.26, 0.52, 0.245],
      [cylGeo(0.012, 0.012, 0.1, 6).rotateZ(Math.PI / 2), 0, 1.25, 0.26],
      [cylGeo(0.012, 0.012, 0.1, 6).rotateZ(Math.PI / 2), 0, 0.52, 0.26],
    ])
    addObj(new THREE.Mesh(cab, M.furniture), 5.9, -3.2, -Math.PI / 2)
    collider(5.6, -3.75, 6.25, -2.65, 1.8)
    addObj(vaseWithFlower(R), 2.55, -3.05, 0, platTop)
    addParts(tableRect(0.4, 0.4, 0.82, { stretcher: false }), 2.55, -3.05)
    collider(2.32, -3.28, 2.78, -2.82, 0.9)
    addObj(lampStand(), 5.85, -6.2, -0.6)
    lampSlots.push(new THREE.Vector3(5.85 - 0.38, platTop + 1.42, -6.2))
  }

  // ===== 卧房（西南后间） =====
  {
    addParts(canopyBed(R), -5.0, -8.9, 0)
    collider(-6.15, -9.65, -3.85, -8.15, 2.2)
    addParts(clothesRack(), -2.85, -10.25, 0.3)
    collider(-3.2, -10.55, -2.5, -9.95, 1.8)
    // 妆台
    addParts(tableRect(0.85, 0.5, 0.78), -2.6, -9.7, Math.PI / 2)
    collider(-2.9, -10.15, -2.3, -9.25, 1)
    addObj(lampStand(), -5.9, -10.3, 0.9)
    lampSlots.push(new THREE.Vector3(-5.9 + 0.38, platTop + 1.42, -10.3))
    // 小屏风
    addObj(foldingScreen(M, R), -3.3, -10.35, 0.12)
  }

  // ===== 藏书间（东南后间） =====
  {
    addParts(bookshelf(1.45, 2.05, 0.4, R), 5.95, -7.55, Math.PI / 2)
    collider(5.7, -8.3, 6.25, -6.8, 2.1)
    addParts(bookshelf(1.45, 2.05, 0.4, R), 5.95, -10.05, Math.PI / 2)
    collider(5.7, -10.8, 6.25, -9.3, 2.1)
    // 罗汉榻
    const couch = merge([
      [boxGeo(1.85, 0.34, 0.92, 0.5), 0, 0.3, 0],
      [boxGeo(1.75, 0.06, 0.82, 0.5), 0, 0.5, 0],
      [boxGeo(1.85, 0.5, 0.08, 0.4), 0, 0.55, -0.42],
      [boxGeo(0.08, 0.5, 0.92, 0.4), -0.885, 0.55, 0],
      [boxGeo(0.08, 0.5, 0.92, 0.4), 0.885, 0.55, 0],
      [boxGeo(0.5, 0.1, 0.5), -0.5, 0.58, -0.1],
    ])
    addObj(new THREE.Mesh(couch, M.furniture), 3.55, -9.9, 0.1)
    collider(2.6, -10.4, 4.5, -9.4, 0.9)
    // 卷轴架（矮）
    const rollRack = merge([
      [boxGeo(1.1, 0.05, 0.4, 0.6), 0, 0.55, 0],
      [boxGeo(0.06, 0.55, 0.06), -0.5, 0.28, 0], [boxGeo(0.06, 0.55, 0.06), 0.5, 0.28, 0],
      ...Array.from({ length: 6 }, (_, i) => [cylGeo(0.035, 0.035, 0.95, 7).rotateZ(Math.PI / 2), 0, 0.62 + i * 0.085, 0]),
    ])
    addObj(new THREE.Mesh(rollRack, M.furniture), 2.55, -7.25, Math.PI / 2)
    collider(2.3, -7.85, 2.8, -6.65, 1)
  }

  // ===== 过厅（明间之后） =====
  {
    addParts(tableRect(1.3, 0.4, 0.84), 0, -10.45)
    collider(-0.7, -10.67, 0.7, -10.23, 1)
    addObj(vaseWithFlower(R), -0.3, -10.45, 0, platTop + 0.87)
    addObj(new THREE.Mesh(censer(0.7), M.bronze), 0.35, -10.45, 0, platTop + 0.87)
    censers.push(new THREE.Vector3(0.35, platTop + 0.95, -10.45))
    addObj(hangingScroll(0.62, 1.35, M.tex.paintingV), 0, -10.58, 0, platTop + 2.45)
  }

  return { group: G, flames, censers, lampSlots }
}
