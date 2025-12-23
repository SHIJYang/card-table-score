<template>
  <div class="game-homepage">
    <MatrixBackground />
    
    <main class="main-content">
      
      <div class="loading-container">
        <TowerLoader />
        <TowerLoader :scale="1" />
        <TowerLoader 
          :scale="2" 
          style="--color-top: #ff9999; --color-left: #cc0000; --color-right: #ff0000;" 
        />
      </div>
      
      <div class="showcase">
        <div class="item">
          <CubeLoader :scale="0.6" :hue="280" />
          <CubeLoader :scale="0.6" :hue="320" />
        </div>
        <div class="item">
          <CubeLoader />
        </div>
        <div class="item">
          <CubeLoader :scale="0.6" :hue="0" />
          <CubeLoader :scale="0.6" :hue="48" />
        </div>
      </div>

      <div class="page">
        <IsometricMatrix :count="4" :size="28" />
      </div>
  
    </main>
  </div>
</template>

<script setup lang="ts">
import MatrixBackground from '@/components/MatrixBackground.vue'; 
import TowerLoader from '@/components/box/TowerLoader.vue'
import CubeLoader from '@/components/box/CubeLoader.vue'
import IsometricMatrix from '@/components/box/IsometricMatrix.vue'
</script>

<style scoped>
/* --- 全局容器 --- */
.game-homepage {
  min-height: 100vh;
  width: 100%;
  color: var(--text-color, #fff); /* 添加默认白色兜底 */
  font-family: 'Inter', system-ui, sans-serif;
  position: relative;
  overflow-x: hidden;
}

/* 确保内容在背景之上 */
.main-content {
  position: relative;
  z-index: 1;
  padding: 50px 20px;
  display: flex;
  flex-direction: column;
  gap: 60px; /* 各大板块之间的间距 */
}

/* --- 区域布局样式 --- */

/* 1. TowerLoader 容器 */
.loading-container {
  margin-top: 50px;
  display: flex;
  gap: 50px;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap; /* 防止小屏幕溢出 */
}

/* 2. CubeLoader 容器 */
.showcase {
  display: flex;
  flex-wrap: wrap;
  gap: 50px;
  justify-content: center;
  align-items: center;
}

.item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 60px; /* 上下两个立方体的间距 */
}

/* 3. IsometricMatrix 容器 */
.page {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
 
}
</style>