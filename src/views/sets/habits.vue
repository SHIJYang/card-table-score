<template>
  <div class="settings-page">
    <!-- 标题 -->
    <h1>{{ $t("settings.title") }}</h1>

    <!-- 设置表单 -->
    <el-form
      :model="settings"
      label-position="left"
      label-width="120px"
      @submit.prevent="saveSettings"
      class="settings-form"
    >
      <!-- 主题选择 -->
      <el-form-item :label="$t('settings.theme')">
        <el-select
          v-model="settings.theme"
          @change="handleThemeChange"
          placeholder="请选择主题"
        >
          <el-option
            v-for="(label, key) in themeOptions"
            :key="key"
            :label="label"
            :value="key"
          />
        </el-select>
      </el-form-item>

      <!-- 语言选择 -->
      <el-form-item :label="$t('settings.language')">
        <el-select
          v-model="settings.language"
          @change="(value) => settingsStore.setLanguage(value)"
          placeholder="请选择语言"
        >
          <el-option
            v-for="(label, key) in languageOptions"
            :key="key"
            :label="label"
            :value="key"
          />
        </el-select>
      </el-form-item>

      <!-- 自动保存开关 -->
      <el-form-item :label="$t('settings.autoSave')">
        <el-switch
          v-model="settings.autoSave"
          @change="(value) => settingsStore.setAutoSave(value)"
        />
      </el-form-item>

      <!-- 音效开关 -->
      <el-form-item :label="$t('settings.sound')">
        <el-switch
          v-model="settings.soundEnabled"
          @change="(value) => settingsStore.setSoundEnabled(value)"
        />
      </el-form-item>

      <!-- 音乐开关 -->
      <el-form-item :label="$t('settings.music')">
        <el-switch
          v-model="settings.musicEnabled"
          @change="(value) => settingsStore.setMusicEnabled(value)"
        />
      </el-form-item>

      <!-- 音量滑块 -->
      <el-form-item :label="$t('settings.volume')">
        <el-slider
          v-model="settings.volume"
          :min="0"
          :max="100"
          @change="(value) => settingsStore.setVolume(value)"
        />
      </el-form-item>

      <!-- 动画开关 -->
      <el-form-item :label="$t('settings.animation')">
        <el-switch
          v-model="settings.animationEnabled"
          @change="(value) => settingsStore.setAnimationEnabled(value)"
        />
      </el-form-item>

      <!-- 通知开关 -->
      <el-form-item :label="$t('settings.notification')">
        <el-switch
          v-model="settings.notificationEnabled"
          @change="(value) => settingsStore.setNotificationEnabled(value)"
        />
      </el-form-item>

      <!-- 字体大小选择 -->
      <el-form-item :label="$t('settings.fontSize')">
        <el-select
          v-model="settings.fontSize"
          @change="(value) => settingsStore.setFontSize(value)"
          placeholder="请选择字体大小"
        >
          <el-option
            v-for="(label, key) in fontSizeOptions"
            :key="key"
            :label="label"
            :value="key"
          />
        </el-select>
      </el-form-item>

      <!-- 重置按钮 -->
      <el-form-item>
        <el-button type="danger" @click="resetSettings">
          {{ $t("settings.reset") }}
        </el-button>
      </el-form-item>
    </el-form>
  </div>
</template>

<script setup>
import { reactive, computed } from "vue";
import { useI18n } from "vue-i18n";
import { storeToRefs } from "pinia";
import { useSettingsStore } from "@/store";

const { t } = useI18n();
const settingsStore = useSettingsStore();

// 使用 storeToRefs 获取响应式的 state 和 getters
// 这些是从 Store 中解构出来的 refs，会随 Store 状态变化而变化
const {
  theme,
  language,
  soundEnabled,
  musicEnabled,
  volume,
  animationEnabled,
  notificationEnabled,
  fontSize,
  autoSave,
} = storeToRefs(settingsStore);

// 直接从 Store 实例获取 actions (这些是函数)
// 注意：不要对 actions 使用 storeToRefs
const {
  setTheme,
  setLanguage,
  setSoundEnabled,
  setMusicEnabled,
  setVolume,
  setAnimationEnabled,
  setNotificationEnabled,
  setFontSize,
  setAutoSave,
  resetSettings,
} = settingsStore;

// 创建一个本地的 reactive 对象，其属性代理到 Store 的 refs
// 这样做可以让 el-form 的 v-model 直接绑定到 settings.xxx，
// 同时保证了数据来源是 Store 并且是响应式的
const settings = reactive({
  theme,
  language,
  soundEnabled,
  musicEnabled,
  volume,
  animationEnabled,
  notificationEnabled,
  fontSize,
  autoSave,
});

// 主题选项
const themeOptions = computed(() => ({
  light: t("settings.themes.light"),
  dark: t("settings.themes.dark"),
  // blue: t('settings.themes.blue'),
  // green: t('settings.themes.green'),
}));

// 语言选项
const languageOptions = computed(() => ({
  "zh-CN": t("settings.languages.zhCN"),
  "en-US": t("settings.languages.enUS"),
}));

// 字体大小选项
const fontSizeOptions = computed(() => ({
  small: t("settings.fontSizes.small"),
  medium: t("settings.fontSizes.medium"),
  large: t("settings.fontSizes.large"),
}));

// 处理主题更改的函数
const handleThemeChange = (value) => {
  console.log("Selected theme:", value);
  // 直接调用 Store 中的 setTheme action
  // 这个 action 会负责更新 Store 状态、保存到 localStorage 并应用主题
  setTheme(value);
};

// 保存设置的函数 (可选，如果需要一个总的保存按钮)
const saveSettings = () => {
  console.log("Saving all settings (if triggered by form submit):", settings);
  // 如果你希望点击某个“保存”按钮时执行额外逻辑，可以放在这里
  // 但对于实时保存（如 @change），各个控件已经调用了对应的 Store actions
};

// 重置设置的函数 (绑定到重置按钮)
// 直接使用从 Store 解构出来的 resetSettings action
</script>

<style scoped>
.settings-page {
  padding: 20px;
  max-width: 800px;
  margin: 0 auto;
  background-color: var(
    --el-bg-color-page
  ); /* 使用 Element Plus 的页面背景色变量 */
  border-radius: 8px;
  box-shadow: var(--el-box-shadow-light); /* 使用 Element Plus 的浅色阴影变量 */
}

.settings-form {
  margin-top: 20px;
}

.el-form-item {
  margin-bottom: 20px;
}

.el-select,
.el-slider {
  width: 100%;
}
</style>
