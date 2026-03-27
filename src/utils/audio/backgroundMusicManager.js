/**
 * 背景音乐管理模块
 * 负责加载和循环播放背景音乐
 */

import { getAudioEngine } from './audioEngine.js'

class BackgroundMusicManager {
  constructor() {
    this.audioEngine = getAudioEngine()
    this.isPlaying = false
    this.currentTrackIndex = 0
    this.tracks = []
    this.audioElement = null
    this.playbackRate = 1.5 // 默认播放速度
  }

  /**
   * 加载背景音乐数据
   * @param {Object} trackData - 音频数据对象，格式: {"0.mp3": "data:audio/mp3;base64,..."}
   */
  loadTracks(trackData) {
    try {
      this.tracks = Object.values(trackData)
      console.log('[BackgroundMusicManager] 加载了', this.tracks.length, '首背景音乐')
    } catch (error) {
      console.error('[BackgroundMusicManager] 加载背景音乐失败:', error)
      this.tracks = []
    }
  }

  /**
   * 开始播放背景音乐
   */
  async start() {
    if (this.isPlaying || this.tracks.length === 0) return

    this.isPlaying = true
    await this.playNextTrack()
  }

  /**
   * 停止播放背景音乐
   */
  stop() {
    this.isPlaying = false
    if (this.audioElement) {
      this.audioElement.pause()
      this.audioElement = null
    }
  }

  /**
   * 播放下一首曲目
   */
  async playNextTrack() {
    if (!this.isPlaying || this.tracks.length === 0) return

    try {
      // 创建音频元素
      this.audioElement = new Audio(this.tracks[this.currentTrackIndex])
      this.audioElement.volume = 0.3
      this.audioElement.loop = false
      this.audioElement.playbackRate = this.playbackRate

      // 播放完成后自动播放下一首
      this.audioElement.onended = () => {
        this.currentTrackIndex = (this.currentTrackIndex + 1) % this.tracks.length
        this.playNextTrack()
      }

      // 播放音频
      await this.audioElement.play()
      console.log('[BackgroundMusicManager] 播放曲目:', this.currentTrackIndex + 1)
    } catch (error) {
      console.error('[BackgroundMusicManager] 播放音乐失败:', error)
      // 播放失败时尝试下一首
      this.currentTrackIndex = (this.currentTrackIndex + 1) % this.tracks.length
      setTimeout(() => this.playNextTrack(), 1000)
    }
  }

  /**
   * 设置音量
   * @param {number} volume - 音量值 (0-1)
   */
  setVolume(volume) {
    if (this.audioElement) {
      this.audioElement.volume = Math.max(0, Math.min(1, volume))
    }
  }

  /**
   * 设置播放速度
   * @param {number} rate - 播放速度倍率
   */
  setPlaybackRate(rate) {
    this.playbackRate = Math.max(0.5, Math.min(3, rate)) // 限制在0.5-3倍之间
    if (this.audioElement) {
      this.audioElement.playbackRate = this.playbackRate
    }
  }

  /**
   * 销毁
   */
  destroy() {
    this.stop()
    this.tracks = []
  }
}

// 单例模式
let bgmManagerInstance = null

export function getBackgroundMusicManager() {
  if (!bgmManagerInstance) {
    bgmManagerInstance = new BackgroundMusicManager()
  }
  return bgmManagerInstance
}

export function resetBackgroundMusicManager() {
  if (bgmManagerInstance) {
    bgmManagerInstance.destroy()
    bgmManagerInstance = null
  }
}

export default BackgroundMusicManager
