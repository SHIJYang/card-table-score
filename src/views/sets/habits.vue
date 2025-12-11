<!-- habits.vue -->
<template>
  <div class="settings-page">
    <h1>{{ $t("settings.title") }}</h1>
    <el-form label-position="left" label-width="120px" class="settings-form">
      <!-- 主题 -->
      <el-form-item :label="$t('settings.theme')">
        <el-select v-model="settingsStore.theme" @change="settingsStore.setTheme" :placeholder="$t('settings.selectTheme')">
          <el-option v-for="themeKey in ['light', 'dark', 'custom']" :key="themeKey" :label="$t(`settings.themes.${themeKey}`)" :value="themeKey" />
        </el-select>
      </el-form-item>
      <!-- 语言 -->
      <el-form-item :label="$t('settings.language')">
        <el-select v-model="settingsStore.language" @change="settingsStore.setLanguage" :placeholder="$t('settings.selectLanguage')">
          <el-option v-for="langKey in ['zh-CN', 'en-US']" :key="langKey" :label="$t(`settings.languages.${langKey}`)" :value="langKey" />
        </el-select>
      </el-form-item>
      <!-- 其他设置 -->
      <el-form-item :label="$t('settings.autoSave')">
        <el-switch v-model="settingsStore.autoSave" @change="settingsStore.setAutoSave" />
      </el-form-item>
      <el-form-item :label="$t('settings.sound')">
        <el-switch v-model="settingsStore.soundEnabled" @change="settingsStore.setSoundEnabled" />
      </el-form-item>
      <el-form-item :label="$t('settings.music')">
        <el-switch v-model="settingsStore.musicEnabled" @change="settingsStore.setMusicEnabled" />
      </el-form-item>
      <el-form-item :label="$t('settings.volume')">
        <el-slider v-model="settingsStore.volume" :min="0" :max="100" @change="settingsStore.setVolume" />
      </el-form-item>
      <el-form-item :label="$t('settings.animation')">
        <el-switch v-model="settingsStore.animationEnabled" @change="settingsStore.setAnimationEnabled" />
      </el-form-item>
      <el-form-item :label="$t('settings.notification')">
        <el-switch v-model="settingsStore.notificationEnabled" @change="settingsStore.setNotificationEnabled" />
      </el-form-item>
      <el-form-item :label="$t('settings.tpapi')">
        <el-input v-model="settingsStore.imgapi" @change="settingsStore.setImgapi" style="width: 440px" :placeholder="$t('settings.enterApiUrl')" />
      </el-form-item>
      <el-form-item>
        <el-button type="danger" @click="settingsStore.resetSettings">
          {{ $t("settings.reset") }}
        </el-button>
      </el-form-item>
    </el-form>
  </div>
</template>

<script setup>
import { useSettingsStore } from '@/store'
import { useI18n } from 'vue-i18n'
const settingsStore = useSettingsStore()
const { t } = useI18n()
</script>

<style scoped>
.settings-page {
  padding: 20px;
  max-width: 800px;
  margin: 0 auto;
  background: var(--el-bg-color-page); /* 页面背景 */
  min-height: 100vh;
  h1{
    
    font-weight: bold;
    color: var(--el-text-color-regular);
    margin-bottom: 20px;
  }
}
.settings-form {
  margin-top: 20px;
  background: var(--el-bg-color);
  padding: 24px;
  border-radius: 8px;
  box-shadow: var(--el-box-shadow-light);
  border: 1px solid var(--el-border-color-light);
  transition: all 0.3s ease;
}
.el-form-item {
  margin-bottom: 20px;
}
.el-select,
.el-slider {
  width: 100%;
}

/* 下拉选择框主题适配 */
:deep(.el-select) {
  --el-select-bg-color: var(--selectBg);
}

/* 输入框主题适配 */
:deep(.el-input__wrapper) {
  --el-input-bg-color: var(--selectBg);
  transition: all 0.3s ease;
}

:deep(.el-input__wrapper:hover) {
  box-shadow: 0 0 0 1px var(--el-color-primary) inset;
}

:deep(.el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 1px var(--el-color-primary) inset;
}

/* 开关组件主题适配 */
:deep(.el-switch.is-checked .el-switch__core) {
  background-color: var(--selectBg);
  border-color: var(--selectBg);
}

/* 滑块组件主题适配 */
:deep(.el-slider__runway) {
  background-color: var(--el-bg-color);
}

:deep(.el-slider__bar) {
  background-color: var(--selectBg);
}

:deep(.el-slider__button) {
  border-color: var(--selectBg);
}

:deep(.el-slider__button:hover) {
  border-color: var(--selectBg);
  box-shadow: 0 0 0 5px rgba(233, 200, 17, 0.1);
}

/* 按钮组件主题适配 */
.el-button {
  transition: all 0.3s ease;
}

.el-button:hover {
  opacity: 0.9;
  transform: translateY(-1px);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .settings-page {
    padding: 10px;
  }
  
  .settings-form {
    padding: 16px;
  }
  
  .el-form-item {
    margin-bottom: 16px;
  }
}
</style>