// setstore.js (优化整合版)
import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { ElMessage } from 'element-plus'

export const useSettingsStore = defineStore('settings', () => {
  // ========== 常量 ==========
  // 在常量部分更新主题选项
  const THEME_OPTIONS = {
      light: '亮色',
      dark: '暗色',
    
  }

  const LANGUAGE_OPTIONS = {
    'zh-CN': '简体中文',
    'en-US': 'English'
  }

  const FONT_SIZE_OPTIONS = {
    small: '小',
    medium: '中',
    large: '大'
  }

  const MUSIC_OPTIONS = {
    none: '无',
    default: '默认',
    peaceful: '宁静',
    energetic: '活力',
    mysterious: '神秘'
  }

  const SOUND_PACK_OPTIONS = {
    none: '无（使用默认合成音效）',
    mikutap_main: 'Mikutap主音效',
    custom: '自定义音效包'
  }

  // 注意：使用动态导入时，路径需要是相对于项目根目录的完整路径
  // 例如: () => import('@/assets/Mikutap.json')
  const SOUND_PACK_IMPORTS = {
    mikutap_main: () => import('@/assets/Mikutap.json')
  }

  const SOUND_FILE_COUNT = 30

  // ========== 状态 ==========
  const theme = ref(localStorage.getItem('theme') || 'light')
  const language = ref(localStorage.getItem('language') || 'zh-CN')
  const soundEnabled = ref(localStorage.getItem('soundEnabled') !== 'false')
  const musicEnabled = ref(localStorage.getItem('musicEnabled') !== 'false')
  const volume = ref(Number(localStorage.getItem('volume')) || 50)
  const animationEnabled = ref(localStorage.getItem('animationEnabled') !== 'false')
  const notificationEnabled = ref(localStorage.getItem('notificationEnabled') !== 'false')
  const fontSize = ref(localStorage.getItem('fontSize') || 'medium')
  const imgapi = ref(localStorage.getItem('imgapi') || '')
  const autoSave = ref(localStorage.getItem('autoSave') !== 'false')
  const music = ref(localStorage.getItem('music') || 'none')
  const soundPack = ref(localStorage.getItem('soundPack') || 'none')
  const soundPackSource = ref(localStorage.getItem('soundPackSource') || 'none')
  const customSoundPackUrl = ref(localStorage.getItem('customSoundPackUrl') || '')

  // ========== 计算属性 ==========
  const isDarkTheme = computed(() => theme.value === 'dark')
  const allSettings = computed(() => ({
    theme: theme.value,
    language: language.value,
    soundEnabled: soundEnabled.value,
    musicEnabled: musicEnabled.value,
    volume: volume.value,
    animationEnabled: animationEnabled.value,
    notificationEnabled: notificationEnabled.value,
    fontSize: fontSize.value,
    imgapi: imgapi.value,
    autoSave: autoSave.value,
    music: music.value,
    soundPack: soundPack.value,
    soundPackSource: soundPackSource.value,
    customSoundPackUrl: customSoundPackUrl.value
  }))

  const themeOptions = computed(() => THEME_OPTIONS)
  const languageOptions = computed(() => LANGUAGE_OPTIONS)
  const fontSizeOptions = computed(() => FONT_SIZE_OPTIONS)
  const musicOptions = computed(() => MUSIC_OPTIONS)
  const soundPackOptions = computed(() => SOUND_PACK_OPTIONS)
  const soundPackUrls = computed(() => SOUND_PACK_URLS)
  const soundPackImports = computed(() => SOUND_PACK_IMPORTS)

  // 获取当前音效包URL
  const currentSoundPackUrl = computed(() => {
    if (soundPack.value === 'custom') {
      return customSoundPackUrl.value
    }
    return SOUND_PACK_URLS[soundPack.value] || null
  })

  // 获取当前音效包导入函数
  const currentSoundPackImport = computed(() => {
    if (soundPack.value === 'custom') {
      return null
    }
    return SOUND_PACK_IMPORTS[soundPack.value] || null
  })

  // ========== 辅助函数 ==========
  function saveToStorage(key, value) {
    localStorage.setItem(key, String(value))
  }

  // ========== Actions ==========
  function setTheme(newTheme) {
    theme.value = newTheme
    saveToStorage('theme', newTheme)
    document.documentElement.setAttribute('data-theme', newTheme)
  }

  function setLanguage(lang) {
    language.value = lang
    saveToStorage('language', lang)
  }

  function setSoundEnabled(enabled) {
    soundEnabled.value = enabled
    saveToStorage('soundEnabled', enabled)
  }

  function setMusicEnabled(enabled) {
    musicEnabled.value = enabled
    saveToStorage('musicEnabled', enabled)
  }

  function setVolume(vol) {
    const clamped = Math.max(0, Math.min(100, vol))
    volume.value = clamped
    saveToStorage('volume', clamped)
  }

  function setAnimationEnabled(enabled) {
    animationEnabled.value = enabled
    saveToStorage('animationEnabled', enabled)
  }

  function setNotificationEnabled(enabled) {
    notificationEnabled.value = enabled
    saveToStorage('notificationEnabled', enabled)
  }

  function setFontSize(size) {
    fontSize.value = size
    saveToStorage('fontSize', size)
    document.documentElement.setAttribute('data-font-size', size)
  }

  function setImgapi(api) {
    imgapi.value = api
    saveToStorage('imgapi', api)
  }

  function setAutoSave(enabled) {
    autoSave.value = enabled
    saveToStorage('autoSave', enabled)
    ElMessage.success(`自动保存已${enabled ? '开启' : '关闭'}`)
  }

  function setMusic(m) {
    music.value = m
    saveToStorage('music', m)
    ElMessage.success(`背景音乐已切换为${MUSIC_OPTIONS[m]}`)
  }

  function setSoundPack(pack) {
    soundPack.value = pack
    saveToStorage('soundPack', pack)
    ElMessage.success(`音效包已切换为${SOUND_PACK_OPTIONS[pack]}`)
  }

  function setSoundPackSource(source) {
    soundPackSource.value = source
    saveToStorage('soundPackSource', source)
  }

  function setCustomSoundPackUrl(url) {
    customSoundPackUrl.value = url
    saveToStorage('customSoundPackUrl', url)
  }

  function resetSettings() {
    setTheme('light')
    setLanguage('zh-CN')
    setSoundEnabled(true)
    setMusicEnabled(false)
    setVolume(50)
    setAnimationEnabled(true)
    setNotificationEnabled(true)
    setFontSize('medium')
    setImgapi('')
    setAutoSave(true)
    setMusic('none')
    setSoundPack('none')
    setSoundPackSource('none')
    setCustomSoundPackUrl('')
    ElMessage.success('设置已重置为默认值')
  }

  return {
    // 状态
    theme,
    language,
    soundEnabled,
    musicEnabled,
    volume,
    animationEnabled,
    notificationEnabled,
    fontSize,
    imgapi,
    autoSave,
    music,
    soundPack,
    soundPackSource,
    customSoundPackUrl,

    // 计算属性
    isDarkTheme,
    allSettings,
    themeOptions,
    languageOptions,
    fontSizeOptions,
    musicOptions,
    soundPackOptions,
    soundPackUrls,
    soundPackImports,
    currentSoundPackUrl,
    currentSoundPackImport,

    // 方法
    setTheme,
    setLanguage,
    setSoundEnabled,
    setMusicEnabled,
    setVolume,
    setAnimationEnabled,
    setNotificationEnabled,
    setFontSize,
    setImgapi,
    setAutoSave,
    setMusic,
    setSoundPack,
    setSoundPackSource,
    setCustomSoundPackUrl,
    resetSettings
  }
})