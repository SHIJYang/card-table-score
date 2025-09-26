<template>
  <el-dropdown @command="handleThemeChange" trigger="click">
    <el-button class="theme-switcher" type="primary" text>
      <el-icon><Brush /></el-icon>
      <span>{{ currentTheme.label }}</span>
      <el-icon class="el-icon--right"><ArrowDown /></el-icon>
    </el-button>
    <template #dropdown>
      <el-dropdown-menu>
        <el-dropdown-item
          v-for="theme in themeList"
          :key="theme.name"
          :command="theme.name"
          :class="{ 'active-theme': currentTheme.name === theme.name }"
        >
          <div class="theme-option">
            <span
              class="theme-color-preview"
              :style="{ backgroundColor: theme.colors.primary }"
            ></span>
            <span>{{ theme.label }}</span>
            <el-icon v-if="currentTheme.name === theme.name" class="check-icon"
              ><Check
            /></el-icon>
          </div>
        </el-dropdown-item>
      </el-dropdown-menu>
    </template>
  </el-dropdown>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { Brush, ArrowDown, Check } from "@element-plus/icons-vue";
import { themes, getCurrentTheme, setTheme } from "../theme/index.js";

const currentTheme = ref(getCurrentTheme());
const themeList = Object.values(themes);

const handleThemeChange = (themeName) => {
  const theme = setTheme(themeName);
  currentTheme.value = theme;
};

// 监听主题变化
onMounted(() => {
  // 初始化主题
  currentTheme.value = getCurrentTheme();

  // 监听storage变化以实现多标签页同步
  window.addEventListener("storage", (e) => {
    if (e.key === "app-theme") {
      currentTheme.value = getCurrentTheme();
    }
  });
});
</script>

<style scoped>
.theme-switcher {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: var(--border-radius);
  transition: all var(--transition-duration);
}

.theme-switcher:hover {
  background-color: rgba(255, 255, 255, 0.1);
}

.theme-option {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 0;
  min-width: 120px;
}

.theme-color-preview {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  border: 1px solid #ddd;
}

.check-icon {
  margin-left: auto;
  color: var(--primary-color);
}

.active-theme {
  background-color: rgba(64, 158, 255, 0.1);
}
</style>
