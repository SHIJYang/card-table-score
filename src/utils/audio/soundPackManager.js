/**
 * 音效包管理模块
 * 支持加载和管理Mikutap格式的音效包
 */

import { getAudioEngine } from './audioEngine.js'

class SoundPackManager {
  constructor() {
    this.audioEngine = getAudioEngine()
    this.currentPack = null
    this.soundData = new Map()
    this.packConfig = null
    this.isLoaded = false
    this.baseUrl = ''
  }

  /**
   * 加载音效包配置文件
   * @param {string} configUrl - 音效包配置文件URL
   * @returns {Promise<boolean>}
   */
  async loadPack(configUrl) {
    try {
      console.log('[SoundPackManager] 正在加载音效包:', configUrl)
      
      const response = await fetch(configUrl)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      this.packConfig = await response.json()
      this.baseUrl = configUrl.substring(0, configUrl.lastIndexOf('/') + 1)
      this.isLoaded = true
      
      console.log('[SoundPackManager] 音效包配置加载成功:', Object.keys(this.packConfig).length, '个音效')
      return true
    } catch (error) {
      console.error('[SoundPackManager] 加载音效包失败:', error)
      this.isLoaded = false
      return false
    }
  }

  /**
   * 从Mikutap格式加载音效包
   * Mikutap格式: {"0.mp3": "data:audio/mp3;base64,...", "1.mp3": "..."}
   * @param {string|Function} packUrl - 音效包JSON文件URL或动态导入函数
   * @returns {Promise<boolean>}
   */
  async loadMikutapPack(packUrl) {
    try {
      console.log('[SoundPackManager] 正在加载Mikutap音效包:', packUrl)
      
      let packData
      
      // 支持动态导入函数
      if (typeof packUrl === 'function') {
        const module = await packUrl()
        packData = module.default || module
        console.log('[SoundPackManager] 通过动态导入加载音效包')
      } else if (packUrl.startsWith('/src/') || packUrl.startsWith('@/') || packUrl.startsWith('.')) {
        // 本地文件路径，使用动态导入
        const module = await import(/* @vite-ignore */ packUrl)
        packData = module.default || module
        console.log('[SoundPackManager] 通过动态导入加载本地音效包')
      } else {
        // 远程URL，使用fetch
        const response = await fetch(packUrl)
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        
        // 检查内容类型
        const contentType = response.headers.get('content-type')
        console.log('[SoundPackManager] 响应内容类型:', contentType)
        
        // 获取文本内容用于调试
        const text = await response.text()
        
        // 检查是否是HTML错误页面
        if (text.trim().startsWith('<!DOCTYPE') || text.trim().startsWith('<html')) {
          console.error('[SoundPackManager] 服务器返回了HTML而不是JSON')
          throw new Error('Server returned HTML instead of JSON')
        }
        
        // 解析JSON
        packData = JSON.parse(text)
      }
      
      // 解析Mikutap格式
      this.soundData.clear()
      
      for (const [filename, base64Data] of Object.entries(packData)) {
        // 提取索引 (例如 "0.mp3" -> 0)
        const index = parseInt(filename.split('.')[0])
        if (!isNaN(index)) {
          this.soundData.set(index, {
            filename,
            base64Data,
            index
          })
        }
      }
      
      this.isLoaded = true
      this.currentPack = packUrl
      
      console.log('[SoundPackManager] Mikutap音效包加载成功:', this.soundData.size, '个音效')
      return true
    } catch (error) {
      console.error('[SoundPackManager] 加载Mikutap音效包失败:', error)
      this.isLoaded = false
      return false
    }
  }

  /**
   * 直接加载Mikutap格式的音效数据（用于动态导入）
   * @param {Object} packData - 音效包数据对象
   * @returns {boolean}
   */
  loadMikutapPackData(packData) {
    try {
      console.log('[SoundPackManager] 正在加载Mikutap音效数据')
      
      // 解析Mikutap格式
      this.soundData.clear()
      
      for (const [filename, base64Data] of Object.entries(packData)) {
        // 提取索引 (例如 "0.mp3" -> 0)
        const index = parseInt(filename.split('.')[0])
        if (!isNaN(index)) {
          this.soundData.set(index, {
            filename,
            base64Data,
            index
          })
        }
      }
      
      this.isLoaded = true
      this.currentPack = 'imported'
      
      console.log('[SoundPackManager] Mikutap音效数据加载成功:', this.soundData.size, '个音效')
      return true
    } catch (error) {
      console.error('[SoundPackManager] 加载Mikutap音效数据失败:', error)
      this.isLoaded = false
      return false
    }
  }

  /**
   * 播放指定索引的音效
   * @param {number} index - 音效索引
   * @param {Object} options - 播放选项
   */
  async play(index, options = {}) {
    if (!this.isLoaded) {
      console.warn('[SoundPackManager] 音效包未加载')
      return false
    }

    const sound = this.soundData.get(index)
    if (!sound) {
      console.warn('[SoundPackManager] 音效索引不存在:', index)
      return false
    }

    try {
      await this.audioEngine.playBase64(sound.base64Data, options)
      return true
    } catch (error) {
      console.error('[SoundPackManager] 播放音效失败:', index, error)
      return false
    }
  }

  /**
   * 获取音效包中的音效数量
   * @returns {number}
   */
  getSoundCount() {
    return this.soundData.size
  }

  /**
   * 获取所有可用的音效索引
   * @returns {Array<number>}
   */
  getAvailableIndices() {
    return Array.from(this.soundData.keys()).sort((a, b) => a - b)
  }

  /**
   * 检查音效包是否包含指定索引
   * @param {number} index - 音效索引
   * @returns {boolean}
   */
  hasSound(index) {
    return this.soundData.has(index)
  }

  /**
   * 卸载当前音效包
   */
  unload() {
    this.currentPack = null
    this.soundData.clear()
    this.packConfig = null
    this.isLoaded = false
    console.log('[SoundPackManager] 音效包已卸载')
  }

  /**
   * 获取当前音效包信息
   * @returns {Object|null}
   */
  getPackInfo() {
    if (!this.isLoaded) return null
    
    return {
      url: this.currentPack,
      soundCount: this.soundData.size,
      indices: this.getAvailableIndices()
    }
  }
}

// 单例模式
let soundPackManagerInstance = null

export function getSoundPackManager() {
  if (!soundPackManagerInstance) {
    soundPackManagerInstance = new SoundPackManager()
  }
  return soundPackManagerInstance
}

export function resetSoundPackManager() {
  if (soundPackManagerInstance) {
    soundPackManagerInstance.unload()
    soundPackManagerInstance = null
  }
}

export default SoundPackManager
