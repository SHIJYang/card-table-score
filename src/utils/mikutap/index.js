/**
 * Mikutap核心模块入口
 * 整合音频、视觉、配置等所有功能
 */

import { getAudioEngine } from '../audio/audioEngine.js'
import { getSoundPackManager } from '../audio/soundPackManager.js'
import { executeEffect } from '../visual/effectRegistry.js'
import {
  GRID_CONFIG,
  AREA_COLORS,
  AREA_NOTES,
  AREA_EFFECTS,
  AREA_CONFIGS,
  SoundPackType,
  SOUND_PACK_CONFIGS,
  getAreaIndex,
  getAreaConfig,
  getAreaColor,
  getAreaNote,
  getAreaEffect,
  getSoundPackConfig,
  getAllSoundPackOptions
} from './areaConfig.js'

class MikutapCore {
  constructor() {
    this.audioEngine = getAudioEngine()
    this.soundPackManager = getSoundPackManager()
    this.currentSoundPack = SoundPackType.NONE
    this.isInitialized = false
    this.visualContext = null
  }

  /**
   * 初始化Mikutap核心
   * @param {Object} visualContext - 视觉上下文对象
   */
  init(visualContext = null) {
    this.visualContext = visualContext
    this.audioEngine.init()
    this.isInitialized = true
    console.log('[MikutapCore] 初始化完成')
  }

  /**
   * 加载音效包
   * @param {string} packType - 音效包类型
   * @param {string} customUrl - 自定义音效包URL（可选）
   * @returns {Promise<boolean>}
   */
  async loadSoundPack(packType, customUrl = null) {
    if (packType === SoundPackType.NONE) {
      this.soundPackManager.unload()
      this.currentSoundPack = packType
      console.log('[MikutapCore] 使用默认合成音效')
      return true
    }

    const config = getSoundPackConfig(packType)
    if (!config) {
      console.error('[MikutapCore] 未知的音效包类型:', packType)
      return false
    }

    const url = customUrl || config.url
    if (!url) {
      console.error('[MikutapCore] 音效包URL无效')
      return false
    }

    const success = await this.soundPackManager.loadMikutapPack(url)
    if (success) {
      this.currentSoundPack = packType
      console.log('[MikutapCore] 音效包加载成功:', config.name)
    }
    return success
  }

  /**
   * 触发区域效果
   * @param {number} areaIndex - 区域索引
   * @param {number} x - 触发点x坐标
   * @param {number} y - 触发点y坐标
   */
  trigger(areaIndex, x, y) {
    if (!this.isInitialized) {
      this.init()
    }

    const config = getAreaConfig(areaIndex)
    if (!config) return

    // 播放音效
    this.playSound(areaIndex)

    // 执行视觉效果
    if (this.visualContext) {
      this.playVisualEffect(config.effect, config.color)
    }
  }

  /**
   * 播放音效
   * @param {number} areaIndex - 区域索引
   */
  playSound(areaIndex) {
    if (this.soundPackManager.isLoaded) {
      // 使用音效包
      const soundIndex = areaIndex % this.soundPackManager.getSoundCount()
      this.soundPackManager.play(soundIndex)
    } else {
      // 使用默认合成音效
      const frequency = getAreaNote(areaIndex)
      this.audioEngine.playComplexTone({
        frequency,
        waveforms: [
          { type: 'sine', volume: 0.3, detune: 0 },
          { type: 'triangle', volume: 0.12, octave: 2 }
        ]
      })
    }
  }

  /**
   * 播放视觉效果
   * @param {string} effectName - 效果名称
   * @param {string} color - 颜色
   */
  playVisualEffect(effectName, color) {
    if (!this.visualContext) return
    executeEffect(effectName, this.visualContext, color)
  }

  /**
   * 设置视觉上下文
   * @param {Object} context - 视觉上下文
   */
  setVisualContext(context) {
    this.visualContext = context
  }

  /**
   * 获取当前音效包类型
   * @returns {string}
   */
  getCurrentSoundPack() {
    return this.currentSoundPack
  }

  /**
   * 获取音效包信息
   * @returns {Object|null}
   */
  getSoundPackInfo() {
    return this.soundPackManager.getPackInfo()
  }

  /**
   * 销毁核心
   */
  destroy() {
    this.soundPackManager.unload()
    this.audioEngine.destroy()
    this.isInitialized = false
    this.visualContext = null
    console.log('[MikutapCore] 已销毁')
  }
}

// 单例模式
let mikutapCoreInstance = null

export function getMikutapCore() {
  if (!mikutapCoreInstance) {
    mikutapCoreInstance = new MikutapCore()
  }
  return mikutapCoreInstance
}

export function resetMikutapCore() {
  if (mikutapCoreInstance) {
    mikutapCoreInstance.destroy()
    mikutapCoreInstance = null
  }
}

// 导出所有配置和工具
export {
  GRID_CONFIG,
  AREA_COLORS,
  AREA_NOTES,
  AREA_EFFECTS,
  AREA_CONFIGS,
  SoundPackType,
  SOUND_PACK_CONFIGS,
  getAreaIndex,
  getAreaConfig,
  getAreaColor,
  getAreaNote,
  getAreaEffect,
  getSoundPackConfig,
  getAllSoundPackOptions
}

export default MikutapCore
