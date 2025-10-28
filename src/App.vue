<template>
  <div id="app">
    <router-view></router-view>
  </div>
</template>

<script setup>
import { onMounted } from "vue";
import { initTheme } from "./theme/index.js";

// 初始化主题
onMounted(() => {
  initTheme();
});
</script>

<style>
@import url("https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@400;500;700&display=swap");

#app {
  height: 100vh;
  width: 100vw;
  font-family: "Noto Sans SC", sans-serif;
  background: linear-gradient(
    135deg,
    var(--bgPrimary-color) 0%,
    var(--bgSecondary-color) 100%
  );
  overflow: auto;
}

/* 自定义滚动条 */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb {
  background: #c0c4cc;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: #909399;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}
</style>
