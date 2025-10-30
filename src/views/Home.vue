<template>
  <div class="common-layout">
    <topnav />

    <div class="main">
      <div class="dot-grid-container">
        <DotGrid
          :dot-size="16"
          :gap="32"
          base-color="#27FF64"
          active-color="#27FF64"
          :proximity="150"
          :speed-trigger="100"
          :shock-radius="250"
          :shock-strength="5"
          :max-speed="5000"
          :resistance="750"
          :return-duration="1.5"
          class-name="custom-dot-grid"
        />
      </div>

      <div class="hero-content">
        <h1 class="hero-title">游戏乐园</h1>
        <p class="hero-subtitle">探索精彩纷呈的小游戏世界</p>
        <div class="hero-buttons">
          <el-button type="primary" size="large" class="hero-btn"
            >开始游戏</el-button
          >
          <el-button size="large" class="hero-btn secondary"
            >查看合集</el-button
          >
        </div>
      </div>

      <!-- 游戏展示区域 -->
      <el-card
        class="game-showcase"
        style="width: 92%; padding: 0"
        body-style="padding: 0 20px"
      >
        <CircularGallery
          :items="gameItems"
          :bend="0"
          text-color="#afafaf"
          :border-radius="0.05"
          :scroll-speed="5"
          :scroll-ease="0.05"
          class="canvas"
        />
      </el-card>

      <!-- 游戏分类区域 -->
      <div class="game-categories">
        <el-card v-for="category in categories" :key="category.id">
          <div class="category-icon">
            <i :class="category.icon"></i>
          </div>
          <h3>{{ category.name }}</h3>
          <p>{{ category.description }}</p>
        </el-card>
      </div>

      <!-- 特色游戏区域 -->
      <div class="featured-games">
        <h2 class="section-title">热门游戏</h2>
        <div class="games-grid">
          <div class="game-card" v-for="game in featuredGames" :key="game.id">
            <div class="game-image">
              <img :src="game.image" :alt="game.name" />
              <div class="game-info">
                <h4>{{ game.name }}</h4>
                <p>{{ game.description }}</p>
                <div class="game-stats">
                  <span class="players">👥 {{ game.players }}</span>
                  <el-button type="primary" size="small">立即游玩</el-button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import Topnav from "../views/topnav/TopNav.vue";
import CircularGallery from "../components/gsap/CircularGallery.vue";
import DotGrid from "../components/gsap/DotGrid.vue";
// 游戏数据
const gameItems = ref([
  { image: "https://picsum.photos/800/600?random=1", text: "益智解谜" },
  { image: "https://picsum.photos/800/600?random=2", text: "动作冒险" },
  { image: "https://picsum.photos/800/600?random=3", text: "休闲放松" },
  { image: "https://picsum.photos/800/600?random=4", text: "策略对战" },
  { image: "https://picsum.photos/800/600?random=5", text: "角色扮演" },
  { image: "https://picsum.photos/800/600?random=6", text: "多人竞技" },
]);

const categories = ref([
  {
    id: 1,
    name: "益智类",
    icon: "fas fa-puzzle-piece",
    description: "锻炼大脑的逻辑游戏",
  },
  {
    id: 2,
    name: "动作类",
    icon: "fas fa-gamepad",
    description: "刺激的操作体验",
  },
  {
    id: 3,
    name: "休闲类",
    icon: "fas fa-coffee",
    description: "放松心情的小游戏",
  },
  {
    id: 4,
    name: "策略类",
    icon: "fas fa-chess",
    description: "考验智慧的决策游戏",
  },
  {
    id: 5,
    name: "冒险类",
    icon: "fas fa-map",
    description: "探索未知的冒险之旅",
  },
]);

const featuredGames = ref([
  {
    id: 1,
    name: "迷宫探险",
    description: "在复杂的迷宫中寻找出路，考验你的方向感",
    image: "https://picsum.photos/400/300?random=7",
    players: "1.2万",
  },
  {
    id: 2,
    name: "数字华容道",
    description: "经典的数字滑动拼图游戏",
    image: "https://picsum.photos/400/300?random=8",
    players: "8.5千",
  },
  {
    id: 3,
    name: "宝石消除",
    description: "绚丽多彩的消除类游戏",
    image: "https://picsum.photos/400/300?random=9",
    players: "2.3万",
  },
  {
    id: 4,
    name: "太空射击",
    description: "刺激的太空战斗体验",
    image: "https://picsum.photos/400/300?random=10",
    players: "1.8万",
  },
]);
</script>

<style scoped>
.main {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: 0px;
  position: relative;
  overflow: hidden;
}

/* 英雄区域 */
.dot-grid-container {
  width: 100%;
  height: 500px;
  position: relative;
  overflow: hidden;
}
/* 游戏分类区域 */
.game-categories {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 2rem;
  width: 92%;
  margin: 3rem 0;
}

/* 特色游戏区域 */
.featured-games {
  width: 92%;
  margin: 3rem 0;
}

.section-title {
  font-size: 2.5rem;
  text-align: center;
  margin-bottom: 2rem;
  color: #333;
}

.games-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 2rem;
}

.game-card {
  background: white;
  border-radius: 15px;
  overflow: hidden;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.game-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 15px 35px rgba(0, 0, 0, 0.15);
}

.game-image {
  width: 100%;
  height: 200px;
  overflow: hidden;
}

.game-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.game-card:hover .game-image img {
  transform: scale(1.05);
}

.game-info {
  padding: 1.5rem;
}

.game-info h4 {
  font-size: 1.3rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
}

.game-info p {
  color: #666;
  line-height: 1.6;
  margin-bottom: 1rem;
}

.game-stats {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.players {
  color: #888;
  font-size: 0.9rem;
}

/* 粒子效果 */
.particles-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 1;
}

.particle {
  position: absolute;
  width: 4px;
  height: 4px;
  background: rgba(102, 126, 234, 0.6);
  border-radius: 50%;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .hero-title {
    font-size: 2.5rem;
  }

  .hero-subtitle {
    font-size: 1.2rem;
  }

  .hero-buttons {
    flex-direction: column;
    align-items: center;
  }

  .game-categories {
    grid-template-columns: 1fr;
  }
}
</style>
