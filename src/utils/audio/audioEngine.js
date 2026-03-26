/**
 * 音频引擎模块
 * 封装Web Audio API核心功能，提供统一的音频播放接口
 */

class AudioEngine {
  constructor() {
    this.audioContext = null
    this.masterGain = null
    this.volume = 0.4
    this.isInitialized = false
    this.soundBuffers = new Map()
  }

  /**
   * 初始化音频上下文
   * @returns {AudioContext|null}
   */
  init() {
    if (this.isInitialized) return this.audioContext

    try {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)()
      this.masterGain = this.audioContext.createGain()
      this.masterGain.gain.value = this.volume
      this.masterGain.connect(this.audioContext.destination)
      this.isInitialized = true
      console.log('[AudioEngine] 音频引擎初始化成功')
    } catch (error) {
      console.error('[AudioEngine] 音频引擎初始化失败:', error)
    }

    return this.audioContext
  }

  /**
   * 恢复音频上下文（处理浏览器自动播放策略）
   */
  resume() {
    if (this.audioContext && this.audioContext.state === 'suspended') {
      this.audioContext.resume()
    }
  }

  /**
   * 设置主音量
   * @param {number} vol - 音量值 (0-1)
   */
  setVolume(vol) {
    this.volume = Math.max(0, Math.min(1, vol))
    if (this.masterGain) {
      this.masterGain.gain.setValueAtTime(this.volume, this.audioContext.currentTime)
    }
  }

  /**
   * 创建振荡器播放简单音效
   * @param {Object} options - 音效配置
   * @param {number} options.frequency - 频率(Hz)
   * @param {string} options.type - 波形类型 ('sine', 'square', 'sawtooth', 'triangle')
   * @param {number} options.duration - 持续时间(秒)
   * @param {number} options.attack - 攻击时间(秒)
   * @param {number} options.decay - 衰减时间(秒)
   * @param {number} options.volume - 音量 (0-1)
   */
  playTone(options = {}) {
    if (!this.audioContext) {
      this.init()
      if (!this.audioContext) return
    }

    this.resume()

    const {
      frequency = 440,
      type = 'sine',
      duration = 0.5,
      attack = 0.01,
      decay = 0.4,
      volume = 0.3
    } = options

    const now = this.audioContext.currentTime

    // 创建振荡器
    const osc = this.audioContext.createOscillator()
    const gain = this.audioContext.createGain()

    osc.type = type
    osc.frequency.setValueAtTime(frequency, now)

    // 音量包络
    gain.gain.setValueAtTime(0, now)
    gain.gain.linearRampToValueAtTime(volume, now + attack)
    gain.gain.exponentialRampToValueAtTime(0.001, now + attack + decay)

    osc.connect(gain)
    gain.connect(this.masterGain)

    osc.start(now)
    osc.stop(now + duration)
  }

  /**
   * 播放复合音效（多层振荡器）
   * @param {Object} options - 音效配置
   * @param {number} options.frequency - 基础频率
   * @param {number} options.harmonics - 泛音数量
   * @param {Array} options.waveforms - 波形配置数组
   */
  playComplexTone(options = {}) {
    if (!this.audioContext) {
      this.init()
      if (!this.audioContext) return
    }

    this.resume()

    const {
      frequency = 440,
      waveforms = [
        { type: 'sine', volume: 0.3, detune: 0 },
        { type: 'triangle', volume: 0.12, detune: 0, octave: 2 }
      ]
    } = options

    const now = this.audioContext.currentTime

    waveforms.forEach(wave => {
      const osc = this.audioContext.createOscillator()
      const gain = this.audioContext.createGain()
      const filter = this.audioContext.createBiquadFilter()

      osc.type = wave.type
      const freq = wave.octave ? frequency * wave.octave : frequency
      osc.frequency.setValueAtTime(freq, now)
      if (wave.detune) {
        osc.detune.setValueAtTime(wave.detune, now)
      }

      filter.type = 'lowpass'
      filter.frequency.setValueAtTime(2000, now)

      const vol = wave.volume || 0.3
      gain.gain.setValueAtTime(0, now)
      gain.gain.linearRampToValueAtTime(vol, now + 0.01)
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4)

      osc.connect(filter)
      filter.connect(gain)
      gain.connect(this.masterGain)

      osc.start(now)
      osc.stop(now + 0.5)
    })
  }

  /**
   * 加载音频文件为AudioBuffer
   * @param {string} url - 音频文件URL
   * @returns {Promise<AudioBuffer>}
   */
  async loadBuffer(url) {
    if (this.soundBuffers.has(url)) {
      return this.soundBuffers.get(url)
    }

    if (!this.audioContext) {
      this.init()
    }

    try {
      const response = await fetch(url)
      const arrayBuffer = await response.arrayBuffer()
      const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer)
      this.soundBuffers.set(url, audioBuffer)
      return audioBuffer
    } catch (error) {
      console.error('[AudioEngine] 加载音频失败:', url, error)
      return null
    }
  }

  /**
   * 播放AudioBuffer
   * @param {AudioBuffer} buffer - 音频缓冲区
   * @param {Object} options - 播放选项
   */
  playBuffer(buffer, options = {}) {
    if (!this.audioContext || !buffer) return

    this.resume()

    const { volume = 1, playbackRate = 1 } = options
    const now = this.audioContext.currentTime

    const source = this.audioContext.createBufferSource()
    const gain = this.audioContext.createGain()

    source.buffer = buffer
    source.playbackRate.value = playbackRate

    gain.gain.setValueAtTime(volume, now)

    source.connect(gain)
    gain.connect(this.masterGain)

    source.start(now)
  }

  /**
   * 从Base64数据播放音频
   * @param {string} base64Data - Base64编码的音频数据
   * @param {Object} options - 播放选项
   */
  async playBase64(base64Data, options = {}) {
    if (!this.audioContext) {
      this.init()
    }

    try {
      // 提取base64部分
      const base64 = base64Data.includes(',') 
        ? base64Data.split(',')[1] 
        : base64Data
      
      const binaryString = atob(base64)
      const bytes = new Uint8Array(binaryString.length)
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i)
      }

      const buffer = await this.audioContext.decodeAudioData(bytes.buffer)
      this.playBuffer(buffer, options)
    } catch (error) {
      console.error('[AudioEngine] 播放Base64音频失败:', error)
    }
  }

  /**
   * 销毁音频引擎
   */
  destroy() {
    if (this.audioContext) {
      this.audioContext.close()
      this.audioContext = null
      this.masterGain = null
      this.isInitialized = false
      this.soundBuffers.clear()
    }
  }
}

// 单例模式
let audioEngineInstance = null

export function getAudioEngine() {
  if (!audioEngineInstance) {
    audioEngineInstance = new AudioEngine()
  }
  return audioEngineInstance
}

export function resetAudioEngine() {
  if (audioEngineInstance) {
    audioEngineInstance.destroy()
    audioEngineInstance = null
  }
}

export default AudioEngine
