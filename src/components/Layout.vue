<template>
  <div class="layout-container">
    <el-container>
      <el-header class="animate__animated animate__fadeIn">
        <div class="header-content">
          <h1><span class="logo-icon">🎮</span> 小游戏合集</h1>
          <div class="navigation">
            <el-menu
              :default-active="$route.path"
              mode="horizontal"
              router
              class="nav-menu"
            >
              <el-menu-item index="/">
                <el-icon><HomeFilled /></el-icon>
                <span>首页</span>
              </el-menu-item>
              <el-menu-item index="/snake">
                <el-icon><Star /></el-icon>
                <span>贪吃蛇</span>
              </el-menu-item>
              <el-menu-item index="/gomoku">
                <el-icon><Star /></el-icon>
                <span>五子棋</span>
              </el-menu-item>
              <el-menu-item index="/score">
                <el-icon><Star /></el-icon>
                <span>牌桌计分</span>
              </el-menu-item>
            </el-menu>
            <ThemeSwitcher />
          </div>
        </div>
      </el-header>
      <el-main>
        <slot></slot>
      </el-main>
      <el-footer class="app-footer">
        <div>小游戏合集 &copy; {{ new Date().getFullYear() }}</div>
      </el-footer>
    </el-container>
  </div>
</template>

<script setup>
import { HomeFilled, Star } from "@element-plus/icons-vue";
import ThemeSwitcher from "./ThemeSwitcher.vue";
import "animate.css/animate.min.css";
</script>

<style scoped>
.layout-container {
  height: 100vh;
  width: 100vw;
  overflow: auto;
}

.el-header {
  background: var(--headerBg-color);
  color: white;
  padding: 0 24px;
  box-shadow: var(--box-shadow);
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-content {
  max-width: 1200px;
  margin: 0 auto;
  height: 60px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-content h1 {
  margin: 0;
  font-size: 24px;
  font-weight: 500;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  gap: 8px;
}

.logo-icon {
  font-size: 28px;
  animation: spin 10s linear infinite;
  display: inline-block;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.nav-menu {
  background: transparent;
  border: none;
}

.nav-menu .el-menu-item {
  color: white;
  font-weight: 500;
}

.nav-menu .el-menu-item:hover {
  background: rgba(255, 255, 255, 0.1);
}

.nav-menu .el-menu-item.is-active {
  background: rgba(255, 255, 255, 0.2);
  border-bottom: 2px solid white;
}

.el-main {
  padding: 24px;
  max-width: 1200px;
  margin: 0 auto;
  min-height: calc(100vh - 120px);
}

.app-footer {
  text-align: center;
  color: var(--textSecondary-color);
  font-size: 12px;
  padding: 16px 0;
  background-color: var(--footerBg-color);
  border-top: 1px solid var(--border-color);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .header-content {
    flex-direction: column;
    height: auto;
    padding: 12px 0;
    gap: 12px;
  }

  .header-content h1 {
    font-size: 20px;
  }

  .nav-menu {
    width: 100%;
    justify-content: center;
  }

  .el-main {
    padding: 16px;
  }
}
</style>
