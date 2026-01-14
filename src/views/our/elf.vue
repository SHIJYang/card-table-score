<template>
  <div class="home-page">

    <FloatingDogBackground />

    <main class="content-layer">
      <h1>欢迎来到我的主页</h1>
      <p>拖动背景里的小狗试试看！</p>

      <div class="card">
        <button @click="doSomething">我的按钮</button>
      </div>
    </main>

  </div>
</template>

<script setup lang="ts">
import FloatingDogBackground from '../../components/FloatingDog/FloatingDog.vue'

const doSomething = () => {
  alert('你点击了网页按钮，没有被 3D 场景挡住！')
}
</script>

<style scoped>
.home-page {
  position: relative;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  background-color: var(--bgPrimary, #ffba6c);
  /* 给个底色 */
}

/* 关键：让内容浮在 3D 场景之上 */
.content-layer {
  position: relative;
  z-index: 10;
  pointer-events: none;

  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 100px;
  color: #333;
}

/* 恢复按钮和文字的点击事件 */
.content-layer h1,
.content-layer p,
.content-layer button,
.content-layer .card {
  pointer-events: auto;

}

.card {
  background: rgba(204, 77, 77, 0.8);
  padding: 20px;
  border-radius: 12px;
  margin-top: 20px;
  backdrop-filter: blur(5px);
}
</style>