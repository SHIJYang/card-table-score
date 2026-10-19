/**
 * 涂鸦过山车 —— 一点点声音
 *
 * 风声跟着速度变化（低通滤波器的噪声），发车前两声提示音，松开刹车「咣当」一下，
 * 终点刹车「嘶——」。全用 WebAudio 现场合成，不需要任何音频文件。
 */
export class AudioKit {
  constructor() {
    this.ac = null
    this.windGain = null
    this.windFilter = null
    this.enabled = true
  }

  /** 必须在用户手势里调用一次 */
  init() {
    if (!this.enabled) return
    try {
      if (!this.ac) {
        const C = window.AudioContext || window.webkitAudioContext
        if (!C) return
        this.ac = new C()
        const len = this.ac.sampleRate * 2
        const buf = this.ac.createBuffer(1, len, this.ac.sampleRate)
        const d = buf.getChannelData(0)
        for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1
        const src = this.ac.createBufferSource()
        src.buffer = buf
        src.loop = true
        this.windFilter = this.ac.createBiquadFilter()
        this.windFilter.type = 'lowpass'
        this.windFilter.frequency.value = 400
        this.windGain = this.ac.createGain()
        this.windGain.gain.value = 0
        src.connect(this.windFilter)
        this.windFilter.connect(this.windGain)
        this.windGain.connect(this.ac.destination)
        src.start()
      }
      if (this.ac.state !== 'running') {
        this.ac.resume().catch(() => {})
        const b = this.ac.createBuffer(1, 1, 22050)
        const src = this.ac.createBufferSource()
        src.buffer = b
        src.connect(this.ac.destination)
        src.start(0)
      }
    } catch (e) {
      /* 静音也没关系 */
    }
  }

  setEnabled(on) {
    this.enabled = on
    if (!on) this.wind(0)
    if (on) this.init()
  }

  /** 风声，v 为速度（米/秒） */
  wind(v) {
    if (!this.ac || !this.enabled) return
    const a = Math.min(1, Math.max(0, v) / 35)
    const t = this.ac.currentTime
    this.windGain.gain.setTargetAtTime(a * a * 0.28, t, 0.08)
    this.windFilter.frequency.setTargetAtTime(300 + a * 1600, t, 0.08)
  }

  /** 发车前两声提示 */
  chime() {
    if (!this.ac || !this.enabled) return
    const t = this.ac.currentTime
    ;[
      [659.3, 0],
      [523.3, 0.42],
    ].forEach(([f, d]) => {
      const o = this.ac.createOscillator()
      const g = this.ac.createGain()
      o.type = 'sine'
      o.frequency.value = f
      g.gain.setValueAtTime(0.0001, t + d)
      g.gain.exponentialRampToValueAtTime(0.16, t + d + 0.02)
      g.gain.exponentialRampToValueAtTime(0.0001, t + d + 1.1)
      o.connect(g)
      g.connect(this.ac.destination)
      o.start(t + d)
      o.stop(t + d + 1.15)
    })
  }

  /** 刹车松开：一声闷响 + 一小段气流 */
  release() {
    if (!this.ac || !this.enabled) return
    const t = this.ac.currentTime
    const o = this.ac.createOscillator()
    const g = this.ac.createGain()
    o.type = 'sine'
    o.frequency.setValueAtTime(120, t)
    o.frequency.exponentialRampToValueAtTime(55, t + 0.25)
    g.gain.setValueAtTime(0.0001, t)
    g.gain.exponentialRampToValueAtTime(0.3, t + 0.01)
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.3)
    o.connect(g)
    g.connect(this.ac.destination)
    o.start(t)
    o.stop(t + 0.32)
    const len = Math.floor(this.ac.sampleRate * 0.45)
    const buf = this.ac.createBuffer(1, len, this.ac.sampleRate)
    const d = buf.getChannelData(0)
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2)
    const src = this.ac.createBufferSource()
    src.buffer = buf
    const f = this.ac.createBiquadFilter()
    f.type = 'highpass'
    f.frequency.value = 1800
    const hg = this.ac.createGain()
    hg.gain.value = 0.09
    src.connect(f)
    f.connect(hg)
    hg.connect(this.ac.destination)
    src.start(t + 0.05)
  }

  /** 终点刹车 */
  brake() {
    if (!this.ac || !this.enabled) return
    const len = Math.floor(this.ac.sampleRate * 0.6)
    const buf = this.ac.createBuffer(1, len, this.ac.sampleRate)
    const d = buf.getChannelData(0)
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len)
    const s = this.ac.createBufferSource()
    s.buffer = buf
    const f = this.ac.createBiquadFilter()
    f.type = 'bandpass'
    f.frequency.value = 2400
    f.Q.value = 1.5
    const g = this.ac.createGain()
    g.gain.value = 0.25
    s.connect(f)
    f.connect(g)
    g.connect(this.ac.destination)
    s.start()
  }

  /** 过矮坡时的「咔哒」轨道接缝声 */
  click() {
    if (!this.ac || !this.enabled) return
    const o = this.ac.createOscillator()
    const g = this.ac.createGain()
    const t = this.ac.currentTime
    o.type = 'square'
    o.frequency.value = 900
    g.gain.setValueAtTime(0.05, t)
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.03)
    o.connect(g)
    g.connect(this.ac.destination)
    o.start(t)
    o.stop(t + 0.04)
  }

  dispose() {
    try {
      this.wind(0)
      this.ac?.close?.()
    } catch (e) {
      /* ignore */
    }
    this.ac = null
  }
}
