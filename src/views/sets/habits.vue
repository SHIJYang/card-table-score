<template>
  <div class="settings-page">
    <div class="page-header">
      <h1>⚙️ 偏好设置</h1>
      <p class="page-desc">个性化您的使用体验</p>
    </div>

    <el-card class="content-card">
      <el-form label-width="120px" :model="settings" label-position="right">
        <el-form-item label="主题">
          <el-radio-group v-model="settings.theme" @change="handleThemeChange">
            <el-radio label="light">浅色</el-radio>
            <el-radio label="dark">深色</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item label="语言">
          <el-select v-model="settings.language" @change="handleLanguageChange">
            <el-option label="简体中文" value="zh-CN" />
            <el-option label="English" value="en-US" />
          </el-select>
        </el-form-item>

        <el-form-item label="音效">
          <el-switch
            v-model="settings.soundEnabled"
            @change="handleSoundEnabledChange"
          />
        </el-form-item>

        <el-form-item label="音乐">
          <el-switch
            v-model="settings.musicEnabled"
            @change="handleMusicEnabledChange"
          />
        </el-form-item>

        <el-form-item label="音量">
          <el-slider
            v-model="settings.volume"
            @change="handleVolumeChange"
            :disabled="!settings.soundEnabled && !settings.musicEnabled"
          />
        </el-form-item>

        <el-form-item label="动画效果">
          <el-switch
            v-model="settings.animationEnabled"
            @change="handleAnimationEnabledChange"
          />
        </el-form-item>

        <el-form-item label="通知">
          <el-switch
            v-model="settings.notificationEnabled"
            @change="handleNotificationEnabledChange"
          />
        </el-form-item>

        <el-form-item>
          <el-button @click="handleResetSettings"> 恢复默认设置 </el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { ElMessage } from "element-plus";
import { useSettingsStore } from "@/store";

// Store
const settingsStore = useSettingsStore();

// 绑定表单数据
const settings = ref({
  theme: "light",
  language: "zh-CN",
  soundEnabled: true,
  musicEnabled: true,
  volume: 80,
  animationEnabled: true,
  notificationEnabled: true,
});

// 从Store加载设置
const loadSettings = () => {
  settings.value = {
    theme: settingsStore.theme,
    language: settingsStore.language,
    soundEnabled: settingsStore.soundEnabled,
    musicEnabled: settingsStore.musicEnabled,
    volume: settingsStore.volume,
    animationEnabled: settingsStore.animationEnabled,
    notificationEnabled: settingsStore.notificationEnabled,
  };
};

// 保存设置的通用方法
const saveSetting = async (key, value) => {
  try {
    // 假设store的mutation/action名称与key对应
    // 例如: setTheme, setLanguage, etc.
    const actionName = `set${key.charAt(0).toUpperCase() + key.slice(1)}`;
    if (typeof settingsStore[actionName] === "function") {
      await settingsStore[actionName](value);
    } else {
      //  fallback，如果没有对应的action，则直接赋值（不推荐，最好在store中定义）
      settingsStore[key] = value;
      await settingsStore.saveSettings(); // 假设存在一个通用的保存方法
    }
    ElMessage.success(`设置已保存`);
  } catch (error) {
    ElMessage.error(`保存设置失败: ${error.message}`);
    console.error(error);
  }
};

// 各个设置项的change事件处理器
const handleThemeChange = (value) => saveSetting("theme", value);
const handleLanguageChange = (value) => saveSetting("language", value);
const handleSoundEnabledChange = (value) => saveSetting("soundEnabled", value);
const handleMusicEnabledChange = (value) => saveSetting("musicEnabled", value);
const handleVolumeChange = (value) => saveSetting("volume", value);
const handleAnimationEnabledChange = (value) =>
  saveSetting("animationEnabled", value);
const handleNotificationEnabledChange = (value) =>
  saveSetting("notificationEnabled", value);

// 恢复默认设置
const handleResetSettings = async () => {
  await settingsStore.resetSettings();
  loadSettings();
  ElMessage.success("已恢复默认设置");
};

// 页面初始化
onMounted(() => {
  loadSettings();
});
</script>

<style scoped lang="scss">
.settings-page {
  min-height: 100vh;
  background: #f5f7fa;
  padding: 30px;

  .page-header {
    margin-bottom: 24px;
    h1 {
      font-size: 28px;
      color: #303133;
      margin: 0 0 8px 0;
    }
    .page-desc {
      font-size: 16px;
      color: #909399;
      margin: 0;
    }
  }

  .content-card {
    background: white;
    border-radius: 8px;
    padding: 24px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  }

  .el-form {
    max-width: 600px;
  }
  .el-form-item {
    margin-bottom: 20px;
  }
}
</style>
