<template>
  <div class="game-homepage">
    <MatrixBackground />

    <main class="main-content">
      <div class="loading-container">
        <TowerLoader />
        <TowerLoader :scale="1" />
        <TowerLoader :scale="2" style="--color-top: #ff9999; --color-left: #cc0000; --color-right: #ff0000;" />
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

    <!-- <FloatingDog /> -->
  </div>
</template>

<script setup lang="ts">
import MatrixBackground from '@/components/MatrixBackground.vue';
import TowerLoader from '@/components/box/TowerLoader.vue'
import CubeLoader from '@/components/box/CubeLoader.vue'
import IsometricMatrix from '@/components/box/IsometricMatrix.vue'
import FloatingDog from '@/components/FloatingDog/FloatingDog.vue'
</script>

<style scoped>
/* --- 全局容器 --- */
.game-homepage {
  min-height: 100vh;
  width: 100%;
  color: var(--text-color, #fff);
  font-family: 'Inter', system-ui, sans-serif;
  position: relative;
  overflow-x: hidden;
}

/* 确保内容在背景之上，但在 Dog 之下 */
.main-content {
  position: relative;
  padding: 50px 20px;
  display: flex;
  flex-direction: column;
  gap: 60px;
  z-index: 50;
  /* 保持这个层级，Dog 的 9999 会覆盖它 */
  /* pointer-events: none; */
  /* 这里的 none 意味着鼠标事件会穿透到下层（或上层） */
  align-items: center;
  padding-top: 100px;
  color: #333;
}

/* 区域布局样式保持不变 */
.loading-container {
  margin-top: 50px;
  display: flex;
  gap: 50px;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
}

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
  gap: 60px;
}

.page {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
}
</style>