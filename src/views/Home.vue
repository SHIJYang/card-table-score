<template>
  <div class="common-layout">
    <topnav />

    <div class="main">
      <!-- 英雄区域 -->
      <div class="hero-section">
        <div class="hero-background">
          <ImageTrail
            :items="[
              'https://picsum.photos/id/287/300/300',
              'https://picsum.photos/id/1001/300/300',
              'https://picsum.photos/id/1025/300/300',
              'https://picsum.photos/id/1026/300/300',
              'https://picsum.photos/id/1027/300/300',
              'https://picsum.photos/id/1028/300/300',
              'https://picsum.photos/id/1029/300/300',
              'https://picsum.photos/id/1030/300/300',
            ]"
            :variant="6"
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
      </div>

      <!-- 游戏展示区域 -->
      <div class="section-container">
        <el-card class="game-showcase" body-style="padding: 0 20px">
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
      </div>

      <!-- 游戏分类区域 -->
      <div class="section-container">
        <div class="game-categories">
          <h2 class="section-title">游戏分类</h2>
          <div class="chroma-grid-wrapper">
            <ChromaGrid
              :items="items"
              :radius="300"
              :damping="0.45"
              :fadeOut="0.6"
              ease="power3.out"
            />
          </div>
        </div>
      </div>

      <!-- 特色游戏区域 -->
      <div class="section-container">
        <div class="featured-games">
          <h2 class="section-title">热门游戏</h2>
          <div class="games-grid">
            <div class="game-card" v-for="game in featuredGames" :key="game.id">
              <div class="game-image">
                <img :src="game.image" :alt="game.name" />
                <div class="game-overlay"></div>
              </div>
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
import ChromaGrid from "../components/gsap/ChromaGrid.vue";
import ImageTrail from "../components/gsap/ImageTrail.vue";

// 游戏数据
const gameItems = ref([
  { image: "https://picsum.photos/800/600?random=1", text: "益智解谜" },
  { image: "https://picsum.photos/800/600?random=2", text: "动作冒险" },
  { image: "https://picsum.photos/800/600?random=3", text: "休闲放松" },
  { image: "https://picsum.photos/800/600?random=4", text: "策略对战" },
  { image: "https://picsum.photos/800/600?random=5", text: "角色扮演" },
  { image: "https://picsum.photos/800/600?random=6", text: "多人竞技" },
]);

const items = ref([
  {
    image: "https://picsum.photos/300?random=7",
    title: "益智游戏",
    subtitle: "锻炼大脑思维",
    handle: "@puzzle",
    borderColor: "#3B82F6",
    gradient: "linear-gradient(145deg, #3B82F6, #1E40AF)",
    url: "",
  },
  {
    image: "https://picsum.photos/300?random=8",
    title: "动作游戏",
    subtitle: "刺激冒险体验",
    handle: "@action",
    borderColor: "#EF4444",
    gradient: "linear-gradient(145deg, #EF4444, #DC2626)",
    url: "",
  },
  {
    image: "https://picsum.photos/300?random=9",
    title: "休闲游戏",
    subtitle: "放松身心娱乐",
    handle: "@casual",
    borderColor: "#10B981",
    gradient: "linear-gradient(145deg, #10B981, #059669)",
    url: "",
  },
  {
    image: "https://picsum.photos/300?random=10",
    title: "策略游戏",
    subtitle: "考验智慧谋略",
    handle: "@strategy",
    borderColor: "#F59E0B",
    gradient: "linear-gradient(145deg, #F59E0B, #D97706)",
    url: "",
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
  {
    id: 5,
    name: "记忆翻牌",
    description: "挑战你的记忆力极限",
    image: "https://picsum.photos/400/300?random=11",
    players: "1.5万",
  },
  {
    id: 6,
    name: "拼图大师",
    description: "完成精美的图片拼图",
    image: "https://picsum.photos/400/300?random=12",
    players: "9.2千",
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

/* 通用容器 */
.section-container {
  width: 92%;
  margin: 2rem 0;
}

/* 英雄区域 */
.hero-section {
  width: 100%;
  height: 600px;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.hero-background {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1;
}

.hero-content {
  position: relative;
  z-index: 2;
  text-align: center;
  color: white;
}

.hero-title {
  font-size: 4rem;
  font-weight: 800;
  margin-bottom: 1rem;
  text-shadow: 2px 2px 8px rgba(0, 0, 0, 0.7);
}

.hero-subtitle {
  font-size: 1.5rem;
  margin-bottom: 2rem;
  text-shadow: 1px 1px 4px rgba(0, 0, 0, 0.5);
}

.hero-buttons {
  display: flex;
  gap: 1rem;
  justify-content: center;
}

.hero-btn {
  padding: 12px 32px;
  font-size: 1.1rem;
  border-radius: 8px;
}

.hero-btn.secondary {
  background: rgba(255, 255, 255, 0.2);
  border: 2px solid rgba(255, 255, 255, 0.3);
  color: white;
}

.hero-btn.secondary:hover {
  background: rgba(255, 255, 255, 0.3);
  border-color: rgba(255, 255, 255, 0.5);
}

/* 游戏展示区域 */
.game-showcase {
  width: 100%;
  padding: 20px 0;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 15px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
}

/* 游戏分类区域 */
.game-categories {
  text-align: center;
  padding: 2rem 0;
}

.chroma-grid-wrapper {
  display: flex;
  justify-content: center;
  margin-top: 2rem;
}

/* 特色游戏区域 */
.featured-games {
  width: 100%;
}

.section-title {
  font-size: 2.5rem;
  text-align: center;
  margin-bottom: 2rem;
  color: #333;
  font-weight: 700;
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
  cursor: pointer;
}

.game-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 15px 35px rgba(0, 0, 0, 0.2);
}

.game-image {
  width: 100%;
  height: 200px;
  position: relative;
  overflow: hidden;
}

.game-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.game-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    to bottom,
    transparent 0%,
    rgba(0, 0, 0, 0.1) 100%
  );
}

.game-card:hover .game-image img {
  transform: scale(1.1);
}

.game-info {
  padding: 1.5rem;
}

.game-info h4 {
  font-size: 1.3rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
  color: #333;
}

.game-info p {
  color: #666;
  line-height: 1.6;
  margin-bottom: 1rem;
  font-size: 0.95rem;
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

/* 响应式设计 */
@media (max-width: 768px) {
  .hero-section {
    height: 500px;
  }

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

  .section-container {
    width: 95%;
  }

  .games-grid {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }

  .section-title {
    font-size: 2rem;
  }
}

@media (max-width: 480px) {
  .hero-title {
    font-size: 2rem;
  }

  .hero-subtitle {
    font-size: 1rem;
  }

  .hero-btn {
    width: 100%;
    max-width: 250px;
  }
}
</style>
