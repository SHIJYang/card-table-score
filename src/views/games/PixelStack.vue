<template>
  <div class="ps-page">
    <header class="ps-head">
      <div class="ps-heading">
        <span class="ps-badge">SPRITE STACK</span>
        <h1>{{ t('pixelStack.title') }}</h1>
        <p>{{ t('pixelStack.subtitle') }}</p>
      </div>
      <div class="ps-head-actions">
        <el-button class="ps-btn" @click="randomize">
          <el-icon><MagicStick /></el-icon>
          <span>{{ t('pixelStack.random') }}</span>
        </el-button>
        <el-button class="ps-btn" type="primary" @click="rebuild">
          <el-icon><Refresh /></el-icon>
          <span>{{ t('pixelStack.regenerate') }}</span>
        </el-button>
      </div>
    </header>

    <div class="ps-body">
      <!-- 四张正交视图 -->
      <section class="ps-panel ps-views">
        <div class="ps-panel-head">
          <h2>{{ t('pixelStack.views') }}</h2>
          <span class="ps-panel-sub">{{ t('pixelStack.viewsHint') }}</span>
        </div>

        <div class="ps-view-grid">
          <figure
            v-for="card in viewCards"
            :key="card.key"
            class="ps-view-card"
            :class="{ 'is-custom': card.custom }"
          >
            <figcaption>
              <span class="ps-view-label">
                {{ card.label }}
                <em v-if="card.custom" class="ps-custom-tag">{{ t('pixelStack.customTag') }}</em>
              </span>
              <span class="ps-view-dims">{{ card.w }}×{{ card.h }}</span>
            </figcaption>
            <div class="ps-view-canvas">
              <canvas :ref="(el) => setViewRef(card.key, el)"></canvas>
            </div>
            <div class="ps-view-foot">
              <span class="ps-view-note">{{ card.note }}</span>
              <label class="ps-upload-btn">
                {{ card.custom ? t('pixelStack.replaceImage') : t('pixelStack.uploadImage') }}
                <input
                  type="file"
                  class="ps-file"
                  accept="image/png,image/jpeg,image/webp,image/gif"
                  :data-slot="card.key"
                  :aria-label="`${card.label} ${t('pixelStack.uploadImage')}`"
                  @change="onFilePicked($event, card.key)"
                />
              </label>
            </div>
          </figure>
        </div>

        <div
          class="ps-upload-bar"
          :class="{ ready: customReady, error: !!uploadError }"
        >
          <span>{{ uploadStatusText }}</span>
          <button
            v-if="uploadedCount"
            type="button"
            class="ps-clear-btn"
            @click="clearUploads"
          >
            {{ t('pixelStack.clearUploads') }}
          </button>
        </div>

        <p class="ps-note">{{ t('pixelStack.sourceNote') }}</p>
        <p v-if="customReady" class="ps-note ps-tip">{{ t('pixelStack.uploadTip') }}</p>
      </section>

      <!-- 3D 转台 -->
      <section ref="stageRef" class="ps-panel ps-stage">
        <canvas
          ref="canvasRef"
          class="ps-canvas"
          @pointerdown="onPointerDown"
          @pointermove="onPointerMove"
          @pointerup="onPointerUp"
          @pointercancel="onPointerUp"
          @wheel.prevent="onWheel"
        ></canvas>

        <div class="ps-stage-top">
          <span class="ps-chip">{{ t(`pixelStack.modes.${ui.mode}`) }}</span>
          <span class="ps-readout">{{ displayAngle }}°</span>
        </div>

        <div class="ps-stage-hint">
          <span>{{ t('pixelStack.dragHint') }}</span>
        </div>
      </section>

      <!-- 控制台 -->
      <aside class="ps-panel ps-controls">
        <div class="ps-panel-head">
          <h2>{{ t('pixelStack.controls') }}</h2>
        </div>

        <div class="ps-group">
          <span class="ps-label">{{ t('pixelStack.model') }}</span>
          <el-select v-model="modelKey" class="ps-full" @change="onPresetChange">
            <el-option
              v-for="key in presetKeys"
              :key="key"
              :label="t(`pixelStack.models.${key}`)"
              :value="key"
            />
            <el-option :label="t('pixelStack.models.random')" value="random" />
            <el-option
              :label="t('pixelStack.models.custom')"
              value="custom"
              :disabled="!customReady"
            />
          </el-select>
        </div>

        <div class="ps-group">
          <div class="ps-label-row">
            <span class="ps-label">{{ t('pixelStack.sliceCount') }}</span>
            <span class="ps-value">{{ sliceCount }}<em>{{ t('pixelStack.native', { n: nativeH }) }}</em></span>
          </div>
          <el-slider v-model="sliceCount" :min="8" :max="48" :step="1" @change="recarve" />
        </div>

        <div class="ps-group">
          <div class="ps-label-row">
            <span class="ps-label">{{ t('pixelStack.squash') }}</span>
            <span class="ps-value">{{ ui.squash.toFixed(2) }}</span>
          </div>
          <el-slider v-model="ui.squash" :min="0.5" :max="1" :step="0.01" @input="invalidate" />
        </div>

        <div class="ps-group">
          <div class="ps-label-row">
            <span class="ps-label">{{ t('pixelStack.spacing') }}</span>
            <span class="ps-value">{{ ui.spacing.toFixed(2) }}</span>
          </div>
          <el-slider v-model="ui.spacing" :min="0.6" :max="2.5" :step="0.05" @input="invalidate" />
        </div>

        <div class="ps-group">
          <span class="ps-label">{{ t('pixelStack.mode') }}</span>
          <el-radio-group v-model="ui.mode" class="ps-modes" size="small" @change="onModeChange">
            <el-radio-button value="turntable">{{ t('pixelStack.modes.turntable') }}</el-radio-button>
            <el-radio-button value="scan">{{ t('pixelStack.modes.scan') }}</el-radio-button>
            <el-radio-button value="explode">{{ t('pixelStack.modes.explode') }}</el-radio-button>
          </el-radio-group>
        </div>

        <div class="ps-switch-grid">
          <label class="ps-switch">
            <span>{{ t('pixelStack.autoRotate') }}</span>
            <el-switch v-model="ui.autoRotate" size="small" />
          </label>
          <label class="ps-switch">
            <span>{{ t('pixelStack.outline') }}</span>
            <el-switch v-model="ui.outline" size="small" @change="invalidate" />
          </label>
          <label class="ps-switch">
            <span>{{ t('pixelStack.shadow') }}</span>
            <el-switch v-model="ui.shadow" size="small" @change="invalidate" />
          </label>
          <label class="ps-switch">
            <span>{{ t('pixelStack.round') }}</span>
            <el-switch v-model="ui.round" size="small" @change="recarve" />
          </label>
        </div>

        <div class="ps-env">
          <div class="ps-env-head">{{ t('pixelStack.environment') }}</div>

          <div class="ps-group">
            <div class="ps-label-row">
              <span class="ps-label">{{ t('pixelStack.timeOfDay') }}</span>
              <span class="ps-value">{{ envPhaseLabel }}</span>
            </div>
            <el-slider v-model="env.time" :min="0" :max="100" :step="1" @input="invalidate" />
          </div>

          <div class="ps-group">
            <div class="ps-label-row">
              <span class="ps-label">{{ t('pixelStack.sunAngle') }}</span>
              <span class="ps-value">{{ env.sun }}°</span>
            </div>
            <el-slider v-model="env.sun" :min="0" :max="360" :step="1" @input="invalidate" />
          </div>

          <div class="ps-group">
            <span class="ps-label">{{ t('pixelStack.weather') }}</span>
            <el-radio-group v-model="env.weather" class="ps-modes" size="small" @change="onEnvChange">
              <el-radio-button value="clear">{{ t('pixelStack.weatherClear') }}</el-radio-button>
              <el-radio-button value="rain">{{ t('pixelStack.weatherRain') }}</el-radio-button>
              <el-radio-button value="snow">{{ t('pixelStack.weatherSnow') }}</el-radio-button>
            </el-radio-group>
          </div>

          <label class="ps-switch ps-switch-wide">
            <span>{{ t('pixelStack.lighting') }}</span>
            <el-switch v-model="env.lighting" size="small" @change="invalidate" />
          </label>
        </div>

        <el-button class="ps-reset" @click="resetView">{{ t('pixelStack.resetView') }}</el-button>

        <div class="ps-stats">
          <div>
            <span>{{ t('pixelStack.layers') }}</span>
            <b>{{ shapeRef ? shapeRef.H : 0 }}</b>
          </div>
          <div>
            <span>{{ t('pixelStack.dims') }}</span>
            <b>{{ shapeRef ? `${shapeRef.W}×${shapeRef.L}` : '—' }}</b>
          </div>
          <div>
            <span>{{ t('pixelStack.colors') }}</span>
            <b>{{ stats.colors }}</b>
          </div>
        </div>
      </aside>
    </div>
  </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, shallowReactive, shallowRef } from 'vue'
import { useI18n } from 'vue-i18n'
import { MagicStick, Refresh } from '@element-plus/icons-vue'
import {
  PRESET_KEYS,
  buildPreset,
  buildRandomModel,
  countPalette,
  presetRound,
  projectViews,
  resampleViews,
} from './spritestack/models'
import { carveViews } from './spritestack/carve'
import { StackRenderer } from './spritestack/render'
import { WeatherSystem } from './spritestack/environment'
import { buildViewsFromSources, extractViewSource, loadImageFile } from './spritestack/upload'

const { t } = useI18n()

const presetKeys = PRESET_KEYS

const canvasRef = ref(null)
const stageRef = ref(null)

const modelKey = ref('car')
const sliceCount = ref(13)
const nativeH = ref(13)
const viewsRef = shallowRef(null)
const shapeRef = shallowRef(null)
const stats = reactive({ colors: 0 })

const ui = reactive({
  squash: 0.75,
  spacing: 1.0,
  round: false,
  outline: true,
  shadow: true,
  autoRotate: false,
  mode: 'turntable',
  zoom: 1,
})

const env = reactive({
  time: 12,
  sun: 42,
  lighting: true,
  weather: 'clear',
})

const envPhaseLabel = computed(() => {
  if (env.time < 25) return t('pixelStack.phaseDay')
  if (env.time < 72) return t('pixelStack.phaseSunset')
  return t('pixelStack.phaseNight')
})

const weatherSys = new WeatherSystem()

const angle = ref(-28)
const displayAngle = ref(332)

let baseViews = null
let renderer = null
let needRender = true
let raf = 0
let lastTs = 0
let dragging = false
let lastX = 0
let velocity = 0
let scanT = 0
let ro = null

const viewEls = {}
function setViewRef(key, el) {
  if (el) viewEls[key] = el
}

const SLOTS = ['top', 'side', 'front', 'back']
const uploaded = shallowReactive({ top: null, side: null, front: null, back: null })
const uploadError = ref('')
const customReady = computed(() => SLOTS.every((key) => !!uploaded[key]))
const uploadedCount = computed(() => SLOTS.filter((key) => !!uploaded[key]).length)
const uploadStatusText = computed(() => {
  if (uploadError.value) return uploadError.value
  if (customReady.value) return t('pixelStack.uploadReady')
  if (uploadedCount.value) return t('pixelStack.uploadProgress', { n: uploadedCount.value })
  return t('pixelStack.uploadHint')
})

let lastPresetKey = 'car'

const viewCards = computed(() => {
  const v = viewsRef.value
  if (!v) return []
  return [
    { key: 'top', label: t('pixelStack.viewTop'), note: '前 ↓', w: v.W, h: v.L, custom: !!uploaded.top },
    { key: 'side', label: t('pixelStack.viewSide'), note: '前 ←', w: v.L, h: v.H, custom: !!uploaded.side },
    { key: 'front', label: t('pixelStack.viewFront'), note: 'FRONT', w: v.W, h: v.H, custom: !!uploaded.front },
    { key: 'back', label: t('pixelStack.viewBack'), note: 'BACK', w: v.W, h: v.H, custom: !!uploaded.back },
  ]
})

function clearUploadedSources() {
  for (const key of SLOTS) uploaded[key] = null
  uploadError.value = ''
}

function loadModel(key) {
  clearUploadedSources()
  const grid = key === 'random' ? buildRandomModel() : buildPreset(key)
  baseViews = projectViews(grid)
  modelKey.value = key
  lastPresetKey = key
  ui.round = key === 'random' ? false : presetRound(key)
  nativeH.value = baseViews.H
  sliceCount.value = baseViews.H
  recarve()
}

function recarve() {
  if (!baseViews) return
  const views = resampleViews(baseViews, sliceCount.value)
  viewsRef.value = views
  shapeRef.value = carveViews(views, { shade: 0.18, round: ui.round })
  stats.colors = countPalette(views)
  needRender = true
  nextTick(drawThumbs)
}

function rebuild() {
  if (!baseViews) loadModel('car')
  else recarve()
}

function randomize() {
  loadModel('random')
}

function onPresetChange(key) {
  if (key === 'custom') {
    if (customReady.value) applyCustom()
    return
  }
  loadModel(key)
}

function onFilePicked(e, key) {
  const input = e.target
  const file = input && input.files ? input.files[0] : null
  if (input) input.value = ''
  if (!file) return
  handleUpload(key, file)
}

async function handleUpload(key, file) {
  try {
    const img = await loadImageFile(file)
    const source = extractViewSource(img)
    uploaded[key] = source
    uploadError.value = ''
    if (customReady.value) applyCustom()
  } catch (err) {
    uploadError.value = t('pixelStack.uploadError')
  }
}

function applyCustom() {
  const views = buildViewsFromSources(uploaded)
  if (!views) return
  baseViews = views
  nativeH.value = views.H
  sliceCount.value = views.H
  ui.round = false
  modelKey.value = 'custom'
  recarve()
}

function clearUploads() {
  const fallback = modelKey.value === 'custom' ? lastPresetKey : modelKey.value
  loadModel(fallback === 'custom' ? 'car' : fallback)
}

function invalidate() {
  needRender = true
}

function onEnvChange() {
  needRender = true
}

function onModeChange(mode) {
  if (mode === 'scan') scanT = 0
  needRender = true
}

function resetView() {
  angle.value = -28
  ui.zoom = 1
  velocity = 0
  needRender = true
}

function drawThumbs() {
  const v = viewsRef.value
  if (!v) return
  const sources = { top: v.top, side: v.side, front: v.front, back: v.back }
  const sizes = {
    top: [v.W, v.L],
    side: [v.L, v.H],
    front: [v.W, v.H],
    back: [v.W, v.H],
  }
  for (const key of Object.keys(sources)) {
    const canvas = viewEls[key]
    if (!canvas) continue
    const [w, h] = sizes[key]
    const zoom = Math.max(1, Math.min(9, Math.floor(Math.min(104 / w, 82 / h))))
    const tmp = document.createElement('canvas')
    tmp.width = w
    tmp.height = h
    const tctx = tmp.getContext('2d')
    const img = tctx.createImageData(w, h)
    const data = img.data
    const src = sources[key]
    for (let i = 0; i < src.length; i++) {
      const c = src[i]
      if (!c) continue
      const p = i * 4
      data[p] = (c >> 16) & 255
      data[p + 1] = (c >> 8) & 255
      data[p + 2] = c & 255
      data[p + 3] = 255
    }
    tctx.putImageData(img, 0, 0)

    canvas.width = w * zoom
    canvas.height = h * zoom
    const ctx = canvas.getContext('2d')
    ctx.imageSmoothingEnabled = false
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.drawImage(tmp, 0, 0, canvas.width, canvas.height)
  }
}

function resizeCanvas() {
  const canvas = canvasRef.value
  if (!canvas) return
  const dpr = Math.min(2, window.devicePixelRatio || 1)
  const w = canvas.clientWidth
  const h = canvas.clientHeight
  if (!w || !h) return
  const bw = Math.round(w * dpr)
  const bh = Math.round(h * dpr)
  if (canvas.width !== bw || canvas.height !== bh) {
    canvas.width = bw
    canvas.height = bh
  }
  const ctx = canvas.getContext('2d')
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  needRender = true
}

function draw() {
  const canvas = canvasRef.value
  const shape = shapeRef.value
  if (!canvas || !shape || !renderer) return
  const w = canvas.clientWidth
  const h = canvas.clientHeight
  if (!w || !h) return
  const ctx = canvas.getContext('2d')
  ctx.clearRect(0, 0, w, h)

  let maxSlices = shape.H
  let highlight = -1
  if (ui.mode === 'scan') {
    const p = (scanT / 3.8) % 1
    const z = Math.min(shape.H - 1, Math.floor(p * shape.H))
    maxSlices = z + 1
    highlight = z
  }

  renderer.render(ctx, w, h, shape, {
    squash: ui.squash,
    spacing: ui.spacing,
    angle: angle.value,
    zoom: ui.zoom,
    outline: ui.outline,
    shadow: ui.shadow,
    mode: ui.mode,
    maxSlices,
    highlight,
    env,
    weather: weatherSys,
  })

  const deg = Math.round(((angle.value % 360) + 360) % 360)
  if (deg !== displayAngle.value) displayAngle.value = deg
}

function tick(ts) {
  if (!lastTs) lastTs = ts
  const dt = Math.min(0.05, (ts - lastTs) / 1000)
  lastTs = ts

  weatherSys.update(dt, env.weather)

  let active = env.weather !== 'clear' || weatherSys.snowCover > 0.004 || weatherSys.wetness > 0.004
  if (ui.autoRotate && !dragging) {
    angle.value += 20 * dt
    active = true
  }
  if (!dragging && Math.abs(velocity) > 1) {
    angle.value += velocity * dt
    velocity *= Math.exp(-3.2 * dt)
    active = true
  }
  if (ui.mode === 'scan') {
    scanT += dt
    active = true
  }

  if (active || needRender) {
    draw()
    needRender = false
  }
  raf = requestAnimationFrame(tick)
}

function onPointerDown(e) {
  if (e.button !== undefined && e.button !== 0) return
  dragging = true
  lastX = e.clientX
  velocity = 0
  const canvas = canvasRef.value
  if (canvas && canvas.setPointerCapture) canvas.setPointerCapture(e.pointerId)
  needRender = true
}

function onPointerMove(e) {
  if (!dragging) return
  const dx = e.clientX - lastX
  lastX = e.clientX
  angle.value += dx * 0.7
  velocity = Math.max(-600, Math.min(600, dx * 30))
  needRender = true
}

function onPointerUp(e) {
  dragging = false
  const canvas = canvasRef.value
  if (canvas && canvas.releasePointerCapture && e.pointerId !== undefined) {
    try {
      canvas.releasePointerCapture(e.pointerId)
    } catch (err) {
      /* 指针已释放 */
    }
  }
}

function onWheel(e) {
  const factor = e.deltaY > 0 ? 0.9 : 1.1
  ui.zoom = Math.max(0.5, Math.min(3, ui.zoom * factor))
  needRender = true
}

onMounted(() => {
  renderer = new StackRenderer()
  loadModel('car')
  nextTick(() => {
    resizeCanvas()
    drawThumbs()
  })
  ro = new ResizeObserver(() => resizeCanvas())
  if (stageRef.value) ro.observe(stageRef.value)
  raf = requestAnimationFrame(tick)
})

onBeforeUnmount(() => {
  cancelAnimationFrame(raf)
  if (ro) ro.disconnect()
  ro = null
  renderer = null
})
</script>

<style scoped>
.ps-page {
  min-height: calc(100vh - 55px);
  padding: 22px clamp(12px, 2.2vw, 28px) 30px;
  color: var(--text-color);
  background-color: var(--bgPrimary-color);
  background-image: radial-gradient(
    circle at 1px 1px,
    color-mix(in srgb, var(--text-color) 8%, transparent) 1px,
    transparent 0
  );
  background-size: 22px 22px;
}

/* ---------- 头部 ---------- */
.ps-head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 18px;
  margin: 0 auto 18px;
  max-width: 1560px;
}

.ps-heading h1 {
  margin: 6px 0 4px;
  font-size: clamp(22px, 2.6vw, 32px);
  font-weight: 900;
  letter-spacing: -0.02em;
  line-height: 1.15;
}

.ps-heading p {
  margin: 0;
  font-size: 13px;
  line-height: 1.6;
  color: var(--textLight-color);
}

.ps-badge {
  display: inline-block;
  padding: 3px 9px;
  border-radius: 999px;
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.16em;
  color: var(--primary-color);
  background: color-mix(in srgb, var(--primary-color) 12%, transparent);
  border: 1px solid color-mix(in srgb, var(--primary-color) 26%, transparent);
}

.ps-head-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.ps-btn span {
  margin-left: 4px;
}

/* ---------- 三栏布局 ---------- */
.ps-body {
  display: grid;
  grid-template-columns: minmax(220px, 264px) minmax(0, 1fr) minmax(248px, 304px);
  gap: 16px;
  align-items: start;
  max-width: 1560px;
  margin: 0 auto;
}

.ps-panel {
  background: var(--bgSecondary-color);
  border: 1px solid var(--border-color);
  border-radius: 14px;
  box-shadow: var(--boxShadow);
  padding: 14px;
}

.ps-panel-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 12px;
}

.ps-panel-head h2 {
  margin: 0;
  font-size: 13px;
  font-weight: 800;
  letter-spacing: 0.06em;
}

.ps-panel-sub {
  font-size: 10px;
  color: var(--textLight-color);
  letter-spacing: 0.02em;
  text-align: right;
}

/* ---------- 正交视图 ---------- */
.ps-view-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}

.ps-view-card {
  margin: 0;
  padding: 8px;
  border-radius: 10px;
  background: color-mix(in srgb, var(--text-color) 4%, transparent);
  border: 1px solid color-mix(in srgb, var(--text-color) 8%, transparent);
  display: flex;
  flex-direction: column;
  gap: 5px;
  min-width: 0;
}

.ps-view-card figcaption {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 4px;
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
}

.ps-view-label {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.08em;
  color: var(--textSecondary-color);
}

.ps-view-dims {
  font-size: 9px;
  color: var(--textLight-color);
}

.ps-view-canvas {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 78px;
  border-radius: 6px;
  background-color: color-mix(in srgb, var(--text-color) 5%, transparent);
  background-image:
    linear-gradient(45deg, color-mix(in srgb, var(--text-color) 7%, transparent) 25%, transparent 25%),
    linear-gradient(-45deg, color-mix(in srgb, var(--text-color) 7%, transparent) 25%, transparent 25%),
    linear-gradient(45deg, transparent 75%, color-mix(in srgb, var(--text-color) 7%, transparent) 75%),
    linear-gradient(-45deg, transparent 75%, color-mix(in srgb, var(--text-color) 7%, transparent) 75%);
  background-size: 12px 12px;
  background-position: 0 0, 0 6px, 6px -6px, -6px 0;
  overflow: hidden;
}

.ps-view-canvas canvas {
  display: block;
  max-width: 100%;
  height: auto;
  image-rendering: pixelated;
}

.ps-view-note {
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 9px;
  color: var(--textLight-color);
  letter-spacing: 0.05em;
}

.ps-view-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
  min-height: 18px;
}

.ps-upload-btn {
  position: relative;
  display: inline-flex;
  align-items: center;
  flex: none;
  padding: 2px 7px;
  border: 1px solid color-mix(in srgb, var(--text-color) 16%, transparent);
  border-radius: 6px;
  background: transparent;
  color: var(--textSecondary-color);
  font-family: inherit;
  font-size: 9.5px;
  line-height: 1.4;
  cursor: pointer;
  transition: color 0.2s, border-color 0.2s, background 0.2s;
}

.ps-upload-btn:hover {
  color: var(--primary-color);
  border-color: color-mix(in srgb, var(--primary-color) 48%, transparent);
  background: color-mix(in srgb, var(--primary-color) 7%, transparent);
}

.ps-view-card.is-custom {
  border-color: color-mix(in srgb, var(--primary-color) 42%, transparent);
  background: color-mix(in srgb, var(--primary-color) 5%, transparent);
}

.ps-custom-tag {
  display: inline-block;
  margin-left: 3px;
  padding: 1px 3px;
  border-radius: 3px;
  font-style: normal;
  font-size: 8px;
  font-weight: 700;
  letter-spacing: 0;
  color: var(--primary-color);
  background: color-mix(in srgb, var(--primary-color) 12%, transparent);
}

.ps-file {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
  font-size: 0;
  cursor: pointer;
}

.ps-upload-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-top: 10px;
  padding: 7px 9px;
  border-radius: 8px;
  border: 1px dashed color-mix(in srgb, var(--text-color) 16%, transparent);
  background: color-mix(in srgb, var(--text-color) 3%, transparent);
  font-size: 10.5px;
  line-height: 1.5;
  color: var(--textLight-color);
}

.ps-upload-bar.ready {
  color: var(--textSecondary-color);
  border-color: color-mix(in srgb, var(--primary-color) 45%, transparent);
  background: color-mix(in srgb, var(--primary-color) 7%, transparent);
}

.ps-upload-bar.error {
  color: var(--danger-color);
  border-color: color-mix(in srgb, var(--danger-color) 45%, transparent);
  background: color-mix(in srgb, var(--danger-color) 6%, transparent);
}

.ps-clear-btn {
  flex: none;
  padding: 0 2px;
  border: 0;
  background: transparent;
  color: var(--primary-color);
  font-family: inherit;
  font-size: 10.5px;
  cursor: pointer;
}

.ps-clear-btn:hover {
  text-decoration: underline;
}

.ps-note {
  margin: 12px 0 0;
  font-size: 11px;
  line-height: 1.7;
  color: var(--textLight-color);
}

.ps-tip {
  margin-top: 6px;
  color: var(--warning-color);
}

/* ---------- 转台 ---------- */
.ps-stage {
  position: relative;
  height: clamp(440px, 64vh, 760px);
  padding: 0;
  overflow: hidden;
  background:
    radial-gradient(
      ellipse at 50% 18%,
      color-mix(in srgb, var(--primary-color) 14%, transparent),
      transparent 62%
    ),
    color-mix(in srgb, var(--text-color) 6%, var(--bgSecondary-color));
}

.ps-stage::before {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
  background-image:
    linear-gradient(to right, color-mix(in srgb, var(--text-color) 6%, transparent) 1px, transparent 1px),
    linear-gradient(to bottom, color-mix(in srgb, var(--text-color) 6%, transparent) 1px, transparent 1px);
  background-size: 34px 34px;
  mask-image: radial-gradient(ellipse at 50% 45%, #000 30%, transparent 78%);
  -webkit-mask-image: radial-gradient(ellipse at 50% 45%, #000 30%, transparent 78%);
}

.ps-canvas {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  display: block;
  cursor: grab;
  touch-action: none;
}

.ps-canvas:active {
  cursor: grabbing;
}

.ps-stage-top {
  position: absolute;
  top: 14px;
  left: 14px;
  right: 14px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  pointer-events: none;
}

.ps-chip {
  padding: 4px 10px;
  border-radius: 999px;
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 10px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--textSecondary-color);
  background: color-mix(in srgb, var(--bgSecondary-color) 82%, transparent);
  border: 1px solid var(--border-color);
  backdrop-filter: blur(4px);
}

.ps-readout {
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 12px;
  font-weight: 700;
  color: var(--textSecondary-color);
  background: color-mix(in srgb, var(--bgSecondary-color) 82%, transparent);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 3px 8px;
  backdrop-filter: blur(4px);
}

.ps-stage-hint {
  position: absolute;
  left: 50%;
  bottom: 12px;
  transform: translateX(-50%);
  padding: 5px 12px;
  border-radius: 999px;
  font-size: 11px;
  color: var(--textLight-color);
  background: color-mix(in srgb, var(--bgSecondary-color) 78%, transparent);
  border: 1px solid color-mix(in srgb, var(--border-color) 70%, transparent);
  white-space: nowrap;
  pointer-events: none;
}

/* ---------- 控制台 ---------- */
.ps-controls {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.ps-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.ps-label {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.04em;
  color: var(--textSecondary-color);
}

.ps-label-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.ps-value {
  display: flex;
  align-items: baseline;
  gap: 6px;
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 11px;
  font-weight: 700;
  color: var(--text-color);
}

.ps-value em {
  font-style: normal;
  font-size: 9px;
  font-weight: 400;
  color: var(--textLight-color);
}

.ps-full {
  width: 100%;
}

.ps-modes {
  width: 100%;
  display: flex;
}

.ps-modes :deep(.el-radio-button) {
  flex: 1;
}

.ps-modes :deep(.el-radio-button__inner) {
  width: 100%;
  padding: 6px 4px;
  font-size: 11px;
}

.ps-switch-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px 12px;
  padding: 10px 0 2px;
  border-top: 1px solid var(--borderLighter-color);
}

.ps-switch {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 8px;
  font-size: 11px;
  color: var(--textSecondary-color);
  cursor: pointer;
}

.ps-switch-wide {
  justify-content: space-between;
}

.ps-env {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding-top: 12px;
  border-top: 1px dashed var(--border-color);
}

.ps-env-head {
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--textLight-color);
}

.ps-reset {
  width: 100%;
}

.ps-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 6px;
  padding-top: 12px;
  border-top: 1px solid var(--borderLighter-color);
}

.ps-stats div {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.ps-stats span {
  font-size: 9px;
  letter-spacing: 0.04em;
  color: var(--textLight-color);
}

.ps-stats b {
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 13px;
  font-weight: 700;
  white-space: nowrap;
}

/* ---------- 响应式 ---------- */
@media (max-width: 1200px) {
  .ps-body {
    grid-template-columns: 1fr;
  }

  .ps-stage {
    order: -1;
    height: 56vh;
    min-height: 400px;
  }

  .ps-view-grid {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }

  .ps-controls {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    align-items: start;
  }

  .ps-controls .ps-panel-head,
  .ps-reset,
  .ps-stats,
  .ps-switch-grid {
    grid-column: 1 / -1;
  }
}

@media (max-width: 760px) {
  .ps-head {
    flex-direction: column;
    align-items: flex-start;
  }

  .ps-view-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .ps-controls {
    display: flex;
  }

  .ps-stage {
    height: 62vh;
    min-height: 360px;
  }
}
</style>
