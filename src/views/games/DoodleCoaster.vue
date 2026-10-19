<template>
  <div class="coaster-page" :class="[`mode-${state.mode}`, { pov: state.pov3d }]">
    <!-- 手绘侧视图 -->
    <canvas ref="cv2d" class="layer layer-2d"></canvas>
    <!-- 第一人称 3D -->
    <canvas ref="cv3d" class="layer layer-3d" :class="{ on: state.pov3d }"></canvas>
    <!-- 迷你地图 -->
    <canvas v-show="state.pov3d && state.showMini" ref="cvMini" class="minimap"></canvas>

    <!-- 顶部工具条 -->
    <div class="hud">
      <div class="brand"><i></i><span>涂鸦过山车</span></div>
      <button v-if="state.hasTrack" class="hb" title="重新画" @click="reset">↺</button>
      <button
        v-if="state.pov3d"
        class="hb tog"
        :class="{ off: !state.showRails }"
        title="显示 / 隐藏轨道"
        @click="toggleRails"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
          <path d="M8 3v18M16 3v18M8 7.5h8M8 12h8M8 16.5h8" />
        </svg>
      </button>
      <button
        v-if="state.pov3d"
        class="hb tog"
        :class="{ off: !state.showPosts }"
        title="显示 / 隐藏支柱"
        @click="togglePosts"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M3 7c5-4 13-4 18 0M7.5 5.2V20M16.5 5.2V20M4 20.5h16" />
        </svg>
      </button>
      <button
        v-if="state.pov3d"
        class="hb tog"
        :class="{ off: !state.showMini }"
        title="显示 / 隐藏迷你地图"
        @click="toggleMini"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" stroke-linecap="round">
          <path d="M3 6.5l5.5-2.5 7 2.5L21 4v13.5L15.5 20l-7-2.5L3 20z" />
          <path d="M8.5 4v13.5M15.5 6.5V20" />
        </svg>
      </button>
      <button class="hb sound" :title="state.soundOn ? '关闭音效' : '打开音效'" @click="toggleSound">
        {{ state.soundOn ? '🔈' : '🔇' }}
      </button>
    </div>

    <!-- 开场提示 -->
    <transition name="fade">
      <div v-if="!state.hasTrack" class="hint">
        <h1>一笔画出<br />你的过山车</h1>
        <p>画一条线，它就会变成一条真的轨道。</p>
        <svg class="pen" viewBox="0 0 150 60">
          <path
            d="M5 50 C25 50 30 8 52 8 C72 8 66 38 54 38 C40 38 46 16 66 16 C86 16 92 50 108 50 C122 50 128 28 145 28"
            fill="none"
            stroke="#d6342c"
            stroke-width="4"
            stroke-linecap="round"
          />
        </svg>
      </div>
    </transition>

    <!-- 画完了：可以出发 -->
    <transition name="fade">
      <div v-if="state.mode === 'ready'" class="startbar">
        <div class="readymsg">轨道铺好了！点「出发」开始这一趟 · 全长 {{ state.trackLen }} 米</div>
        <div class="row">
          <button class="btn" @click="reset">重新画</button>
          <button class="btn red go" @click="start">▶ 出发</button>
        </div>
      </div>
    </transition>

    <!-- 别人分享的轨道 -->
    <transition name="fade">
      <div v-if="state.mode === 'shared'" class="ov">
        <div class="card">
          <p class="kick">涂鸦过山车</p>
          <h2 class="name">有人画了一条过山车</h2>
          <div class="metrics">
            <div><b>{{ state.trackLen }}</b><span>米全长</span></div>
            <div><b>{{ state.pov3d ? '3D' : '侧面' }}</b><span>骑行视角</span></div>
          </div>
          <div class="btns">
            <button class="btn red wide" @click="start">🎢 坐上去</button>
            <button class="btn wide" @click="reset">我也画一条</button>
          </div>
        </div>
      </div>
    </transition>

    <!-- 回到站台 -->
    <transition name="fade">
      <div v-if="showResult" class="ov">
        <div class="card">
          <p class="kick">涂鸦过山车</p>
          <h2 class="name">安全回到站台！</h2>
          <div class="metrics">
            <div><b>{{ state.trackLen }}</b><span>米全长</span></div>
            <div><b>1</b><span>趟已乘坐</span></div>
          </div>
          <div class="btns">
            <button class="btn red wide" @click="copyLink">🔗 复制分享链接（朋友也能坐）</button>
            <button class="btn pri" @click="start">再坐一次</button>
            <button class="btn" @click="reset">重新画</button>
            <button class="btn wide" @click="save">保存图片</button>
          </div>
          <p class="small">手绘一条线 · 轨道自动铺成 · 第一人称冲下去</p>
        </div>
      </div>
    </transition>

    <!-- 提示 -->
    <transition name="fade">
      <div v-if="toast" class="toast">{{ toast }}</div>
    </transition>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onBeforeUnmount, watch } from 'vue'
import { CoasterEngine } from './coaster'

const cv2d = ref(null)
const cv3d = ref(null)
const cvMini = ref(null)

const state = reactive({
  mode: 'draw',
  hasTrack: false,
  pov3d: false,
  showMini: true,
  showRails: true,
  showPosts: true,
  soundOn: true,
  trackLen: 0,
  shareUrl: '',
})

const showResult = ref(false)
const toast = ref('')
let toastTimer = 0
let engine = null
let ro = null

function flash(msg) {
  toast.value = msg
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => {
    toast.value = ''
  }, 1800)
}

onMounted(() => {
  engine = new CoasterEngine({
    canvas2d: cv2d.value,
    canvas3d: cv3d.value,
    miniCanvas: cvMini.value,
    onState: (s) => Object.assign(state, s),
    onToast: flash,
    onFinish: () => {
      showResult.value = true
    },
    onShared: () => {
      showResult.value = false
    },
  })
  // 打开带 #t=… 的链接时直接载入别人画的轨道
  if (window.location.hash) engine.loadShared(window.location.hash)
  window.__coaster = engine

  ro = new ResizeObserver(() => engine && engine.resize())
  if (cv2d.value?.parentElement) ro.observe(cv2d.value.parentElement)
  window.addEventListener('keydown', onKey)
  window.addEventListener('hashchange', onHashChange)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKey)
  window.removeEventListener('hashchange', onHashChange)
  ro?.disconnect()
  ro = null
  engine?.dispose()
  engine = null
  window.__coaster = null
  clearTimeout(toastTimer)
})

// 进入新的乘坐 / 重新画时收起结果卡
watch(
  () => state.mode,
  (m) => {
    if (m === 'ride' || m === 'ready' || m === 'draw') showResult.value = false
  }
)

function onKey(e) {
  if (state.mode !== 'ready') return
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault()
    start()
  }
}

// 同一页面里换了 #t=… 链接（粘贴 / 后退）也重载轨道
function onHashChange() {
  if (!engine) return
  if (window.location.hash) {
    showResult.value = false
    engine.loadShared(window.location.hash)
  }
}

function start() {
  engine?.startRide()
}

function reset() {
  showResult.value = false
  engine?.resetDraw()
}

function save() {
  engine?.saveImage()
}

function toggleMini() {
  engine?.setMini(!state.showMini)
}

function toggleRails() {
  engine?.setRails(!state.showRails)
}

function togglePosts() {
  engine?.setPosts(!state.showPosts)
}

function toggleSound() {
  engine?.setSound(!state.soundOn)
}

async function copyLink() {
  const url = engine?.shareUrl() || state.shareUrl
  if (!url) return
  try {
    await navigator.clipboard.writeText(url)
    flash('分享链接已复制，发给朋友也能坐这趟')
    return
  } catch (e) {
    /* 退回到手动选中 */
  }
  try {
    const ta = document.createElement('textarea')
    ta.value = url
    ta.style.position = 'fixed'
    ta.style.opacity = '0'
    document.body.appendChild(ta)
    ta.select()
    document.execCommand('copy')
    ta.remove()
    flash('分享链接已复制，发给朋友也能坐这趟')
  } catch (e) {
    flash('复制失败，手动复制地址栏里的链接吧')
  }
}
</script>

<style scoped lang="scss">
.coaster-page {
  position: relative;
  height: calc(100vh - 55px);
  min-height: 420px;
  width: 100%;
  overflow: hidden;
  background: #9fd4f2;
  color: #14202b;
  font-family: var(--sans, system-ui, -apple-system, 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', sans-serif);
  user-select: none;
  -webkit-user-select: none;
  touch-action: none;
  overscroll-behavior: none;

  .layer {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    display: block;
    touch-action: none;
  }
  .layer-2d {
    cursor: crosshair;
    z-index: 0;
  }
  .layer-3d {
    z-index: 1;
    pointer-events: none;
    opacity: 0;
    visibility: hidden;
    transition: opacity 0.7s ease, visibility 0s linear 0.7s;
    &.on {
      opacity: 1;
      visibility: visible;
      transition: opacity 0.7s ease;
    }
  }

  /* 画完 / 骑行中不需要十字光标 */
  &.mode-ready .layer-2d,
  &.mode-ride .layer-2d,
  &.mode-done .layer-2d,
  &.mode-shared .layer-2d {
    cursor: default;
  }
}

/* ---------- 顶部工具条 ---------- */
.hud {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  z-index: 8;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 14px;
  pointer-events: none;
}
.brand {
  display: flex;
  align-items: center;
  gap: 7px;
  margin-right: auto;
  font-weight: 900;
  font-size: 17px;
  letter-spacing: -0.01em;
  white-space: nowrap;
  color: #14202b;
  i {
    display: inline-block;
    width: 22px;
    height: 14px;
    border-radius: 7px;
    border: 3px solid #d6342c;
    border-bottom-color: transparent;
    transform: rotate(-12deg);
  }
}
.pov .brand {
  visibility: hidden;
}
.hb {
  pointer-events: auto;
  appearance: none;
  border: 0;
  height: 40px;
  min-width: 40px;
  padding: 0 13px;
  border-radius: 20px;
  background: rgba(20, 32, 43, 0.82);
  color: #fff;
  font-size: 15px;
  font-weight: 800;
  line-height: 1;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  position: relative;
  transition: background 0.25s, color 0.25s;
  svg {
    width: 22px;
    height: 22px;
    display: block;
  }
  &:hover {
    background: rgba(20, 32, 43, 0.95);
  }
  &.tog {
    padding: 0;
  }
  &.off {
    background: rgba(20, 32, 43, 0.45);
    color: rgba(255, 255, 255, 0.75);
    &::after {
      content: '';
      position: absolute;
      left: 9px;
      right: 9px;
      top: 50%;
      height: 2.5px;
      margin-top: -1px;
      border-radius: 2px;
      background: #ff7a6e;
      transform: rotate(-45deg);
    }
  }
}
.sound {
  font-size: 17px;
}

/* ---------- 迷你地图 ---------- */
.minimap {
  position: absolute;
  left: 12px;
  top: 62px;
  z-index: 8;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.72);
  box-shadow: 0 6px 20px rgba(0, 30, 60, 0.25);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  pointer-events: none;
}

/* ---------- 开场提示 ---------- */
.hint {
  position: absolute;
  left: 50%;
  top: 42%;
  transform: translate(-50%, -50%);
  z-index: 4;
  width: min(94vw, 520px);
  text-align: center;
  pointer-events: none;

  h1 {
    margin: 0;
    font-size: clamp(24px, 6.6vw, 40px);
    line-height: 1.15;
    font-weight: 900;
    letter-spacing: -0.02em;
    text-shadow: 0 2px 0 rgba(255, 255, 255, 0.6);
  }
  p {
    margin: 12px 0 0;
    font-size: 15px;
    font-weight: 700;
    line-height: 1.5;
    opacity: 0.7;
  }
  .pen {
    display: block;
    margin: 14px auto 0;
    width: 150px;
    height: 56px;
    path {
      stroke-dasharray: 420;
      stroke-dashoffset: 420;
      animation: draw 2.4s ease-in-out infinite;
    }
  }
}
@keyframes draw {
  60%,
  100% {
    stroke-dashoffset: 0;
  }
}

/* ---------- 出发条 ---------- */
.startbar {
  position: absolute;
  left: 50%;
  bottom: 16px;
  transform: translateX(-50%);
  z-index: 8;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  width: min(420px, calc(100vw - 24px));

  .readymsg {
    max-width: 100%;
    padding: 8px 14px;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.88);
    box-shadow: 0 4px 14px rgba(0, 40, 80, 0.12);
    font-size: 14px;
    font-weight: 800;
    line-height: 1.3;
    text-align: center;
  }
  .row {
    display: flex;
    gap: 10px;
    width: 100%;
  }
  .btn {
    flex: 1;
    padding: 17px 10px;
    font-size: 16px;
    box-shadow: 0 6px 16px rgba(0, 30, 60, 0.15);
  }
  .go {
    flex: 1.7;
    font-size: 20px;
    letter-spacing: 0.04em;
    animation: pulse 1.3s ease-in-out infinite;
  }
}
@keyframes pulse {
  50% {
    transform: scale(1.045);
    box-shadow: 0 10px 26px rgba(214, 52, 44, 0.45);
  }
}

/* ---------- 卡片 ---------- */
.ov {
  position: absolute;
  inset: 0;
  z-index: 20;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding: 16px 12px 18px;
  background: linear-gradient(rgba(20, 32, 43, 0) 40%, rgba(20, 32, 43, 0.35));
  overflow: auto;
  touch-action: pan-y;
}
.card {
  width: min(440px, 100%);
  padding: 18px 18px 14px;
  border-radius: 22px;
  background: #fff;
  box-shadow: 0 20px 60px rgba(0, 30, 60, 0.35);
  animation: up 0.45s cubic-bezier(0.2, 0.9, 0.25, 1.1);
}
@keyframes up {
  from {
    transform: translateY(40px);
    opacity: 0;
  }
}
.kick {
  margin: 4px 0 7px;
  font-size: 11.5px;
  font-weight: 800;
  letter-spacing: 0.14em;
  color: #d6342c;
}
.name {
  margin: 0 0 14px;
  font-size: 25px;
  line-height: 1.2;
  font-weight: 900;
  letter-spacing: -0.02em;
}
.metrics {
  display: flex;
  gap: 10px;
  margin-bottom: 14px;
  div {
    flex: 1;
    padding: 10px 12px;
    border-radius: 14px;
    background: #f3f7fa;
    display: flex;
    align-items: baseline;
    gap: 6px;
  }
  b {
    font-size: 20px;
    font-weight: 900;
  }
  span {
    font-size: 12px;
    opacity: 0.55;
    font-weight: 700;
  }
}
.btns {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}
.btn {
  appearance: none;
  border: 0;
  display: block;
  padding: 15px 10px;
  border-radius: 14px;
  background: #eef3f7;
  color: #14202b;
  font-family: inherit;
  font-size: 15px;
  font-weight: 800;
  line-height: 1;
  text-align: center;
  cursor: pointer;
  transition: filter 0.2s, transform 0.12s;
  &:hover {
    filter: brightness(0.96);
  }
  &:active {
    transform: scale(0.985);
  }
  &.pri {
    background: #14202b;
    color: #fff;
  }
  &.red {
    background: #d6342c;
    color: #fff;
  }
  &.wide {
    grid-column: 1 / 3;
  }
}
.small {
  margin: 12px 0 0;
  text-align: center;
  font-size: 12px;
  line-height: 1.7;
  opacity: 0.5;
}

/* ---------- 提示条 ---------- */
.toast {
  position: absolute;
  left: 50%;
  top: 62px;
  transform: translate(-50%, -8px);
  z-index: 30;
  max-width: calc(100vw - 32px);
  padding: 10px 16px;
  border-radius: 12px;
  background: #14202b;
  color: #fff;
  font-size: 14px;
  font-weight: 700;
  line-height: 1.4;
  width: max-content;
  pointer-events: none;
}
.toast.in,
.fade-enter-active .toast {
  transform: translate(-50%, 0);
}

/* ---------- 过渡 ---------- */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

@media (max-height: 700px) {
  .card {
    padding: 14px 14px 12px;
  }
  .name {
    font-size: 22px;
    margin-bottom: 12px;
  }
  .btn {
    padding: 13px 10px;
  }
}
@media (max-width: 440px) {
  .hint h1 {
    letter-spacing: -0.02em;
  }
  .brand span {
    display: none;
  }
}
</style>
