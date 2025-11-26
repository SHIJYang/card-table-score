// settings.js (重构版)
import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { ElMessage } from 'element-plus'

export const useSettingsStore = defineStore('settings', () => {
  // ========== 状态 ==========
  const loading = ref(false)
  const theme = ref(localStorage.getItem('theme') || 'light')
  const language = ref(localStorage.getItem('language') || 'zh-CN')
  const sidebarCollapsed = ref(localStorage.getItem('sidebarCollapsed') === 'true')
  const soundEnabled = ref(localStorage.getItem('soundEnabled') !== 'false')
  const musicEnabled = ref(localStorage.getItem('musicEnabled') !== 'false')
  const volume = ref(Number(localStorage.getItem('volume')) || 50)
  const animationEnabled = ref(localStorage.getItem('animationEnabled') !== 'false')
  const notificationEnabled = ref(localStorage.getItem('notificationEnabled') !== 'false')
  const fontSize = ref(localStorage.getItem('fontSize') || 'medium')
const imgapi = ref(localStorage.getItem('imgapi') || '')
  const autoSave = ref(localStorage.getItem('autoSave') !== 'false')

  // ========== 计算属性 ==========
  const isLoading = computed(() => loading.value)
  const isDarkTheme = computed(() => theme.value === 'dark')
  const isZhCN = computed(() => language.value === 'zh-CN')
  const allSettings = computed(() => ({
    theme: theme.value,
    language: language.value,
    soundEnabled: soundEnabled.value,
    musicEnabled: musicEnabled.value,
    volume: volume.value,
    animationEnabled: animationEnabled.value,
    notificationEnabled: notificationEnabled.value,
    fontSize: fontSize.value,
    imgapi:imgapi.value,
    autoSave: autoSave.value,
  }))

  // ========== 辅助函数 ==========
  function saveToStorage(key, value) {
    localStorage.setItem(key, String(value))
  }

  // ========== Actions ==========
  function setLoading(val) {
    loading.value = val
  }

  function toggleTheme() {
    theme.value = theme.value === 'light' ? 'dark' : 'light'
    saveToStorage('theme', theme.value)
    document.documentElement.setAttribute('data-theme', theme.value)
    
  }

  function setTheme(newTheme) {
    theme.value = newTheme
    saveToStorage('theme', newTheme)
    document.documentElement.setAttribute('data-theme', newTheme)
    
  }

  function setLanguage(lang) {
    const newLang = typeof lang === 'string' ? lang : language.value
    language.value = newLang
    saveToStorage('language', newLang)

  }

  function toggleSidebar() {
    sidebarCollapsed.value = !sidebarCollapsed.value
    saveToStorage('sidebarCollapsed', sidebarCollapsed.value)
  }

  function setSoundEnabled(enabled) {
    const val = typeof enabled === 'boolean' ? enabled : soundEnabled.value
    soundEnabled.value = val
    saveToStorage('soundEnabled', val)
    
  }

  function toggleSound() {
    setSoundEnabled(!soundEnabled.value)
  }

  function setMusicEnabled(enabled) {
    const val = typeof enabled === 'boolean' ? enabled : musicEnabled.value
    musicEnabled.value = val
    saveToStorage('musicEnabled', val)
    
  }

  function toggleMusic() {
    setMusicEnabled(!musicEnabled.value)
  }

  function setVolume(vol) {
    const newVol = Math.max(0, Math.min(100, typeof vol === 'number' ? vol : volume.value))
    volume.value = newVol
    saveToStorage('volume', newVol)
  }

  function setAnimationEnabled(enabled) {
    const val = typeof enabled === 'boolean' ? enabled : animationEnabled.value
    animationEnabled.value = val
    saveToStorage('animationEnabled', val)
   
  }

  function setNotificationEnabled(enabled) {
    const val = typeof enabled === 'boolean' ? enabled : notificationEnabled.value
    notificationEnabled.value = val
    saveToStorage('notificationEnabled', val)
    
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

  function resetSettings() {
    theme.value = 'light'
    language.value = 'zh-CN'
    soundEnabled.value = true
    musicEnabled.value = true
    volume.value = 50
    animationEnabled.value = true
    notificationEnabled.value = true
    fontSize.value = 'medium'
    imgapi.value=''
    autoSave.value = true

    // 批量保存
    Object.entries({
      theme: 'light',
      language: 'zh-CN',
      soundEnabled: 'true',
      musicEnabled: 'true',
      volume: '50',
      animationEnabled: 'true',
      notificationEnabled: 'true',
      fontSize: 'medium',
      imgapi:'',
      autoSave: 'true',
    }).forEach(([k, v]) => localStorage.setItem(k, v))

    document.documentElement.setAttribute('data-theme', 'light')
    document.documentElement.setAttribute('data-font-size', 'medium')
    ElMessage.success('设置已重置为默认值')
  }

  function updateSettings(settings) {
    Object.keys(settings).forEach(key => {
      if (key in stateRefs) {
        stateRefs[key].value = settings[key]
        saveToStorage(key, settings[key])
      }
    })
    if (settings.theme) document.documentElement.setAttribute('data-theme', settings.theme)
    if (settings.fontSize) document.documentElement.setAttribute('data-font-size', settings.fontSize)
    ElMessage.success('设置已保存')
  }

  // 用于 updateSettings 的引用映射（可选优化）
  const stateRefs = {
    theme, language, soundEnabled, musicEnabled, volume,
    animationEnabled, notificationEnabled, fontSize, autoSave
  }

  // ========== 返回 ==========
  return {
    // 状态
    loading, theme, language, sidebarCollapsed, soundEnabled,
    musicEnabled, volume, animationEnabled, notificationEnabled,
    fontSize,imgapi, autoSave,
    // 计算属性
    isLoading, isDarkTheme, isZhCN, allSettings,
    // 方法
    setLoading, toggleTheme, setTheme, setLanguage, toggleSidebar,
    setSoundEnabled, toggleSound, setMusicEnabled, toggleMusic,
    setVolume, setAnimationEnabled, setNotificationEnabled,
    setFontSize,setImgapi, setAutoSave, resetSettings, updateSettings,
  }
})