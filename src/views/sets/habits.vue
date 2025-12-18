<template>
  <div class="settings-page">
    <h1>{{ $t("settings.title") }}</h1>
    <el-form label-position="left" label-width="120px" class="settings-form">
      <el-form-item :label="$t('settings.mode') || '显示模式'">
         <ThemeSwitch v-model="settingsStore.theme" />
      </el-form-item>
      <el-form-item :label="$t('settings.theme')">
        <el-select v-model="settingsStore.theme" @change="settingsStore.setTheme" :placeholder="$t('settings.selectTheme')">
          <el-option v-for="themeKey in ['light', 'dark', 'cartoon', 'custom']" :key="themeKey" :label="$t(`settings.themes.${themeKey}`)" :value="themeKey" />
        </el-select>
      </el-form-item>
      <el-form-item :label="$t('settings.language')">
        <el-select v-model="settingsStore.language" @change="settingsStore.setLanguage" :placeholder="$t('settings.selectLanguage')">
          <el-option v-for="langKey in ['zh-CN', 'en-US']" :key="langKey" :label="$t(`settings.languages.${langKey}`)" :value="langKey" />
        </el-select>
      </el-form-item>
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
import ThemeSwitch from '@/components/ThemeSwitch.vue' 
const { t } = useI18n()
</script>

<style scoped>
.settings-page {
  padding: 20px;
  max-width: 800px;
  margin: 0 auto;
  /* Use theme background */
  background: var(--bgPrimary-color); 
  min-height: 100vh;
  transition: background 0.3s ease;
}

.settings-page h1 {
  font-weight: bold;
  /* Use header gradient for title text */
  background: var(--headerBg);
  -webkit-background-clip: text;
  background-clip: text;
  color: var(--text-color);
  text-shadow: 0 0 0 var(--text-color); 
  
  margin-bottom: 20px;
  font-size: 2rem;
}

/* Fix for transparent text in Safari/Chrome if text-shadow is active */
@supports (-webkit-background-clip: text) {
  .settings-page h1 {
    text-shadow: none;
    
  }
}

.settings-form {
  margin-top: 20px;
  /* Secondary background for the card */
  background: var(--bgSecondary-color);
  padding: 24px;
  
  border-radius: var(--borderRadius); 
  box-shadow: var(--boxShadow);
  border: 1px solid var(--border-color);
  
  transition: all var(--transitionDuration) ease;
}

.settings-form:hover {
  box-shadow: var(--boxShadowHover);
}

.el-form-item {
  margin-bottom: 20px;
}

/* Force label color to match theme */
:deep(.el-form-item__label) {
  color: var(--text-color);
}

.el-select,
.el-slider {
  width: 100%;
}

/* --- Element Plus Overrides --- */

/* Input / Select Backgrounds */
:deep(.el-input__wrapper),
:deep(.el-textarea__inner) {
  /* Use secondary or disabled bg for inputs to stand out from form bg */
  background-color: var(--bgDisabled-color) !important; 
  box-shadow: 0 0 0 1px var(--border-color) inset !important;
  border-radius: var(--borderRadius);
  color: var(--text-color);
}

:deep(.el-input__inner) {
  color: var(--text-color);
}

/* Hover/Focus states for inputs */
:deep(.el-input__wrapper:hover),
:deep(.el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 1px var(--primary-color) inset !important;
}

/* Select Dropdown Poppers (Global styles might be needed in App.vue, but local override attempts) */
:deep(.el-select-dropdown__item) {
  color: var(--text-color);
}
:deep(.el-select-dropdown__item.hover), 
:deep(.el-select-dropdown__item:hover) {
  background-color: var(--bgDisabled-color);
}

/* Switch Component */
:deep(.el-switch__core) {
  border-color: var(--border-color);
  background-color: var(--bgDisabled-color);
}
:deep(.el-switch.is-checked .el-switch__core) {
  border-color: var(--primary-color);
  background-color: var(--primary-color);
}

/* Slider Component */
:deep(.el-slider__runway) {
  background-color: var(--bgDisabled-color);
}
:deep(.el-slider__bar) {
  background-color: var(--primary-color);
}
:deep(.el-slider__button) {
  border-color: var(--primary-color);
  background-color: var(--bgSecondary-color);
}

/* Button Component */
.el-button {
  transition: all 0.3s ease;
  border-radius: var(--borderRadius);
  font-weight: 600;
}

/* Responsive Design */
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