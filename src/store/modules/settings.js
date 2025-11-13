import { defineStore } from 'pinia'
import { ElMessage } from 'element-plus'

/**
 * 应用设置状态管理
 * 管理应用级别的配置、主题、语言等
 */
export const useSettingsStore = defineStore('settings', {
  state: () => ({
    // 加载状态
    loading: false,
    // 主题设置
    theme: localStorage.getItem('theme') || 'light',
    // 语言设置
    language: localStorage.getItem('language') || 'zh-CN',
    // 侧边栏状态
    sidebarCollapsed: localStorage.getItem('sidebarCollapsed') === 'true',
    // 音效开关
    soundEnabled: localStorage.getItem('soundEnabled') !== 'false',
    // 音乐开关
    musicEnabled: localStorage.getItem('musicEnabled') !== 'false',
    // 音量设置
    volume: Number(localStorage.getItem('volume')) || 50,
    // 动画效果开关
    animationEnabled: localStorage.getItem('animationEnabled') !== 'false',
    // 通知开关
    notificationEnabled: localStorage.getItem('notificationEnabled') !== 'false',
    // 字体大小
    fontSize: localStorage.getItem('fontSize') || 'medium',
    // 自动保存
    autoSave: localStorage.getItem('autoSave') !== 'false',
  }),

  getters: {
    // 是否加载中
    isLoading: (state) => state.loading,
    // 是否深色主题
    isDarkTheme: (state) => state.theme === 'dark',
    // 是否中文
    isZhCN: (state) => state.language === 'zh-CN',
    // 获取所有设置
    allSettings: (state) => ({
      theme: state.theme,
      language: state.language,
      soundEnabled: state.soundEnabled,
      musicEnabled: state.musicEnabled,
      volume: state.volume,
      animationEnabled: state.animationEnabled,
      notificationEnabled: state.notificationEnabled,
      fontSize: state.fontSize,
      autoSave: state.autoSave,
    }),
  },

  actions: {
    /**
     * 设置加载状态
     * @param {Boolean} loading - 是否加载中
     */
    setLoading(loading) {
      this.loading = loading
    },

    /**
     * 切换主题
     */
    toggleTheme() {
      this.theme = this.theme === 'light' ? 'dark' : 'light'
      this.saveTheme()
    },

    /**
     * 设置主题
     * @param {String} theme - 主题名称 'light' | 'dark'
     */
    setTheme(theme) {
      this.theme = theme
      this.saveTheme()
    },

    /**
     * 保存主题设置
     */
    saveTheme() {
      localStorage.setItem('theme', this.theme)
      document.documentElement.setAttribute('data-theme', this.theme)
      ElMessage.success(`已切换到${this.theme === 'light' ? '浅色' : '深色'}主题`)
    },

    /**
     * 设置语言
     * @param {String} lang - 语言代码 'zh-CN' | 'en-US'
     */
    setLanguage(lang) {
      // 如果传入的是事件对象，提取值
      const newLang = typeof lang === 'string' ? lang : this.language
      this.language = newLang
      localStorage.setItem('language', newLang)
      ElMessage.success('语言设置已更新')
    },

    /**
     * 切换侧边栏
     */
    toggleSidebar() {
      this.sidebarCollapsed = !this.sidebarCollapsed
      localStorage.setItem('sidebarCollapsed', this.sidebarCollapsed)
    },

    /**
     * 设置音效开关
     * @param {Boolean} enabled - 是否启用
     */
    setSoundEnabled(enabled) {
      // 如果传入的是事件对象，使用当前值
      const newValue = typeof enabled === 'boolean' ? enabled : this.soundEnabled
      this.soundEnabled = newValue
      localStorage.setItem('soundEnabled', newValue)
      ElMessage.success(`音效已${newValue ? '开启' : '关闭'}`)
    },

    /**
     * 切换音效
     */
    toggleSound() {
      this.setSoundEnabled(!this.soundEnabled)
    },

    /**
     * 设置音乐开关
     * @param {Boolean} enabled - 是否启用
     */
    setMusicEnabled(enabled) {
      // 如果传入的是事件对象，使用当前值
      const newValue = typeof enabled === 'boolean' ? enabled : this.musicEnabled
      this.musicEnabled = newValue
      localStorage.setItem('musicEnabled', newValue)
      ElMessage.success(`音乐已${newValue ? '开启' : '关闭'}`)
    },

    /**
     * 切换音乐
     */
    toggleMusic() {
      this.setMusicEnabled(!this.musicEnabled)
    },

    /**
     * 设置音量
     * @param {Number} volume - 音量 0-100
     */
    setVolume(volume) {
      // 如果传入的是事件对象，使用当前值
      const newVolume = typeof volume === 'number' ? volume : this.volume
      this.volume = Math.max(0, Math.min(100, newVolume))
      localStorage.setItem('volume', this.volume)
    },

    /**
     * 设置动画效果
     * @param {Boolean} enabled - 是否启用
     */
    setAnimationEnabled(enabled) {
      // 如果传入的是事件对象，使用当前值
      const newValue = typeof enabled === 'boolean' ? enabled : this.animationEnabled
      this.animationEnabled = newValue
      localStorage.setItem('animationEnabled', newValue)
      ElMessage.success(`动画效果已${newValue ? '开启' : '关闭'}`)
    },

    /**
     * 设置通知开关
     * @param {Boolean} enabled - 是否启用
     */
    setNotificationEnabled(enabled) {
      // 如果传入的是事件对象，使用当前值
      const newValue = typeof enabled === 'boolean' ? enabled : this.notificationEnabled
      this.notificationEnabled = newValue
      localStorage.setItem('notificationEnabled', newValue)
      ElMessage.success(`通知已${newValue ? '开启' : '关闭'}`)
    },

    /**
     * 设置字体大小
     * @param {String} size - 'small' | 'medium' | 'large'
     */
    setFontSize(size) {
      this.fontSize = size
      localStorage.setItem('fontSize', size)
      document.documentElement.setAttribute('data-font-size', size)
      ElMessage.success('字体大小已更新')
    },

    /**
     * 设置自动保存
     * @param {Boolean} enabled - 是否启用
     */
    setAutoSave(enabled) {
      this.autoSave = enabled
      localStorage.setItem('autoSave', enabled)
      ElMessage.success(`自动保存已${enabled ? '开启' : '关闭'}`)
    },

    /**
     * 重置所有设置为默认值
     */
    resetSettings() {
      this.theme = 'light'
      this.language = 'zh-CN'
      this.soundEnabled = true
      this.musicEnabled = true
      this.volume = 50
      this.animationEnabled = true
      this.notificationEnabled = true
      this.fontSize = 'medium'
      this.autoSave = true
      
      // 保存到localStorage
      localStorage.setItem('theme', this.theme)
      localStorage.setItem('language', this.language)
      localStorage.setItem('soundEnabled', this.soundEnabled)
      localStorage.setItem('musicEnabled', this.musicEnabled)
      localStorage.setItem('volume', this.volume)
      localStorage.setItem('animationEnabled', this.animationEnabled)
      localStorage.setItem('notificationEnabled', this.notificationEnabled)
      localStorage.setItem('fontSize', this.fontSize)
      localStorage.setItem('autoSave', this.autoSave)
      
      document.documentElement.setAttribute('data-theme', this.theme)
      document.documentElement.setAttribute('data-font-size', this.fontSize)
      ElMessage.success('设置已重置为默认值')
    },

    /**
     * 批量更新设置
     * @param {Object} settings - 设置对象
     */
    updateSettings(settings) {
      Object.keys(settings).forEach(key => {
        if (this[key] !== undefined) {
          this[key] = settings[key]
          localStorage.setItem(key, settings[key])
        }
      })
      
      if (settings.theme) {
        document.documentElement.setAttribute('data-theme', settings.theme)
      }
      
      if (settings.fontSize) {
        document.documentElement.setAttribute('data-font-size', settings.fontSize)
      }
      
      ElMessage.success('设置已保存')
    },
  },
})
