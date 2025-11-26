<template>
  <div class="game-homepage">
    <!-- 主要内容 -->
    <main class="main-content">
      <!-- 英雄区域 -->
      <section class="hero-section">
        
              <!-- <CircularGallery
                :items="featuredGames"
                :bend="0"
                text-color="#afafaf"
                :border-radius="0.05"
                :scroll-speed="5"
                :scroll-ease="0.05"
                class="canvas"
              /> -->
        
      </section>
      <!-- 游戏分类区域 -->
      <section class="categories-section">
        <div class="container">
          <div class="section-header">
            
            <p class="section-subtitle">选择你想玩的游戏</p>
          </div>

          <div class="categories-grid">
            <div
              v-for="category in gameCategories"
              :key="category.id"
              class="category-card"
              :style="{ '--category-color': category.color }"
            >
              <div class="category-icon">
                <span>{{ category.icon }}</span>
              </div>
              <h3 class="category-name">{{ category.name }}</h3>
              <div class="category-hover">
                <el-button
                  class="explore-btn"
                  @click="handleExplore(category.link)"
                >
                  点击，去玩！
                </el-button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- CTA区域 -->
      <section class="cta-section">
        <div class="container">
          <div class="cta-content">
            <h2 class="cta-title">准备好开始游戏了吗？</h2>
            <p class="cta-description">
              加入我们，立即体验精彩的游戏世界
            </p>
          </div>
        </div>
      </section>
      <!-- 特色游戏区域 -->
      <section class="featured-section">
        <div class="container">
          <div class="section-header">
            <h2 class="section-title">热门推荐</h2>
            <p class="section-subtitle">精选最受欢迎的游戏</p>
          </div>

          <div class="featured-grid">
            <div
              v-for="game in featuredGames"
              :key="game.id"
              class="featured-card"
              :style="{ '--accent-color': game.color }"
            >
              <div class="card-image">
                <img :src="game.image" :alt="game.name" />
              </div>
              <div class="card-content">
                <h3 class="card-title">{{ game.name }}</h3>
                <p class="card-description">{{ game.description }}</p>
                <div class="card-meta"></div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  </div>
</template>

<script setup lang="ts">
import CircularGallery from "../components/gsap/CircularGallery.vue";
// 特色游戏数据
const featuredGames = [
  {
    id: 1,
    name: "迷宫探险",
    text: "迷宫探险",
    description: "在复杂的迷宫中寻找出路，考验你的方向感和逻辑思维",
    image: "https://picsum.photos/400/300?random=11",
    players: "12,458",
    rating: "4.8",
    category: "益智",
    color: "#3B82F6",
  },
  {
    id: 2,
    name: "数字华容道",
    text: "迷宫探险",
    description: "经典的数字滑动拼图游戏，挑战你的大脑极限",
    image: "https://picsum.photos/400/300?random=12",
    players: "8,742",
    rating: "4.9",
    category: "解谜",
    color: "#10B981",
  },
  {
    id: 3,
    name: "宝石消除",
    text: "宝石消除",
    description: "绚丽多彩的消除类游戏，享受视觉和操作的乐趣",
    image: "https://picsum.photos/400/300?random=13",
    players: "23,156",
    rating: "4.7",
    category: "休闲",
    color: "#F59E0B",
  },
  {
    id: 4,
    name: "太空射击",
    text: "太空射击",
    description: "刺激的太空战斗体验，展现你的操作技巧",
    image: "https://picsum.photos/400/300?random=14",
    players: "18,329",
    rating: "4.6",
    category: "动作",
    color: "#EF4444",
  },
];

// 游戏分类数据
const gameCategories = [
  {
    id: 1,
    name: "计分",
    icon: "🧩",
    color: "#3B82F6",
    link: "/score",
  },
  {
    id: 2,
    name: "五子棋",
    icon: "🎯",
    link: "/gomoku",
    color: "#EF4444",
  },
  {
    id: 3,
    name: "商店",
    icon: "🌴",
    link: "/shop",
    color: "#10B981",
  },
  {
    id: 4,
    name: "贪吃蛇",
    icon: "♟️",
    link: "/snake",
    color: "#8B5CF6",
  },
  {
    id: 5,
    name: "2048",
    icon: "🦸",
    link: "/2048",
    color: "#F59E0B",
  },
  {
    id: 6,
    name: "404",
    icon: "👥",
    link: "/try",
    color: "#EC4899",
  },
];

const handleExplore = (url: any) => {
  //window.open(url, "_blank"); // 新窗口打开
  window.location.href = url; //（当前页跳转）
};
</script>

<style scoped>
.game-homepage {
  min-height: calc(100vh - 60px); /* 减去导航栏高度 */
  background: linear-gradient(135deg, #9ec0ff 0%, #98f7b7 50%, #ff8080 100%);
  color: rgb(88, 73, 105);
}

.main-content {
  width: 100%;
}

/* 英雄区域 */
.hero-section {
  position: relative;
  width: 100%;
  display: flex;
  align-items: center;
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

.hero-glow {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 800px;
  height: 800px;
  background: radial-gradient(
    circle,
    rgba(59, 130, 246, 0.15) 0%,
    transparent 70%
  );
  filter: blur(80px);
}

.floating-shapes {
  position: absolute;
  width: 100%;
  height: 100%;
}

.shape {
  position: absolute;
  border-radius: 50%;
  background: linear-gradient(45deg, #3b82f6, #8b5cf6);
  opacity: 0.1;
  animation: float 6s ease-in-out infinite;
}

.shape-1 {
  width: 200px;
  height: 200px;
  top: 10%;
  left: 10%;
  animation-delay: 0s;
}

.shape-2 {
  width: 150px;
  height: 150px;
  top: 60%;
  right: 10%;
  animation-delay: 2s;
}

.shape-3 {
  width: 100px;
  height: 100px;
  bottom: 20%;
  left: 20%;
  animation-delay: 4s;
}

@keyframes float {
  0%,
  100% {
    transform: translateY(0px) rotate(0deg);
  }
  50% {
    transform: translateY(-20px) rotate(180deg);
  }
}

.hero-container {
  position: relative;
  z-index: 2;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2rem;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 4rem;
  align-items: center;
}

.hero-content {
  max-width: 500px;
}

.hero-badge {
  display: inline-block;
  background: rgba(59, 130, 246, 0.2);
  border: 1px solid rgba(59, 130, 246, 0.4);
  padding: 0.5rem 1rem;
  border-radius: 50px;
  font-size: 0.9rem;
  margin-bottom: 2rem;
  backdrop-filter: blur(10px);
}

.hero-title {
  font-size: 3.5rem;
  font-weight: 800;
  line-height: 1.1;
  margin-bottom: 1.5rem;
}

.title-line {
  display: block;
}

.title-line.accent {
  background: linear-gradient(135deg, #3b82f6, #8b5cf6);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.hero-description {
  font-size: 1.2rem;
  line-height: 1.6;
  color: rgba(255, 255, 255, 0.8);
  margin-bottom: 2.5rem;
}

.hero-actions {
  display: flex;
  gap: 1rem;
  margin-bottom: 3rem;
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.875rem 2rem;
  border: none;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 600;
  text-decoration: none;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-primary {
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  color: white;
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 25px rgba(59, 130, 246, 0.4);
}

.btn-secondary {
  background: rgba(255, 255, 255, 0.1);
  color: white;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.btn-secondary:hover {
  background: rgba(255, 255, 255, 0.15);
  transform: translateY(-2px);
}

.btn-large {
  padding: 1rem 2.5rem;
  font-size: 1.1rem;
}

.hero-stats {
  display: flex;
  gap: 2rem;
}

.stat {
  text-align: center;
}

.stat-number {
  font-size: 1.5rem;
  font-weight: 700;
  color: #3b82f6;
  margin-bottom: 0.25rem;
}

.stat-label {
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.7);
}

.hero-preview {
  display: flex;
  justify-content: center;
  align-items: center;
}

.preview-card {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  
  padding: 0 20px;
  width: 80%;
  
}

.card-header {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 1rem;
}

.card-dots {
  display: flex;
  gap: 0.5rem;
}

.card-dots span {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.5);
}

.card-content {
  background: rgba(0, 0, 0, 0.3);

  height: 100px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.game-scene {
  display: flex;
  gap: 0.5rem;
}

.scene-element {
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, #3b82f6, #8b5cf6);
  border-radius: 8px;
  animation: bounce 2s ease-in-out infinite;
}

.scene-element:nth-child(2) {
  animation-delay: 0.2s;
}

.scene-element:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes bounce {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
}

/* 特色游戏区域 */
.featured-section {
  padding: 6rem 0;
  position: relative;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2rem;
}

.section-header {
  text-align: center;
  margin-bottom: 4rem;
}

.section-title {
  font-size: 2.5rem;
  font-weight: 700;
  margin-bottom: 1rem;
  background: linear-gradient(135deg, #fff, rgba(255, 255, 255, 0.8));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.section-subtitle {
  font-size: 1.1rem;
  color: rgba(255, 255, 255, 0.7);
}

.featured-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 2rem;
}

.featured-card {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  overflow: hidden;
  transition: all 0.3s ease;
  position: relative;
}

.featured-card:hover {
  transform: translateY(-8px);
  border-color: var(--accent-color);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
}

.card-badge {
  position: absolute;
  top: 1rem;
  left: 1rem;
  background: var(--accent-color);
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 600;
  z-index: 2;
}

.card-image {
  position: relative;
  height: 200px;
  overflow: hidden;
}

.card-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.featured-card:hover .card-image img {
  transform: scale(1.1);
}

.card-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.featured-card:hover .card-overlay {
  opacity: 1;
}

.play-btn {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: var(--accent-color);
  border: none;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: transform 0.3s ease;
}

.play-btn:hover {
  transform: scale(1.1);
}

.card-content {
  padding: 1.5rem;
}

.card-title {
  font-size: 1.25rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
}

.card-description {
  color: rgba(255, 255, 255, 0.7);
  line-height: 1.5;
  margin-bottom: 1rem;
  font-size: 0.9rem;
}

.card-meta {
  display: flex;
  gap: 1rem;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.85rem;
}

.meta-item svg {
  width: 16px;
  height: 16px;
}

/* 分类区域 */
.categories-section {
  padding: 6rem 0;
  background: rgba(255, 255, 255, 0.02);
}

.categories-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
}

.category-card {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  padding: 1rem;
  text-align: center;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.category-card::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 4px;
  background: var(--category-color);
  transform: scaleX(0);
  transition: transform 0.3s ease;
}

.category-card:hover::before {
  transform: scaleX(1);
}

.category-card:hover {
  transform: translateY(-5px);
  border-color: var(--category-color);
}

.category-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.category-name {
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
}

.category-count {
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.9rem;
  margin-bottom: 1rem;
}

.category-hover {
  opacity: 0;
  transition: opacity 0.3s ease;
}

.category-card:hover .category-hover {
  opacity: 1;
}

.explore-btn {
  background: var(--category-color);
  color: white;
  border: none;
  padding: 0.5rem 1.5rem;
  border-radius: 20px;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.3s ease;
}

.explore-btn:hover {
  transform: scale(1.05);
}

/* CTA区域 */
.cta-section {
  padding: 6rem 0;
  height: 100vh;
  text-align: center;
  display: flex;
  align-items: center;
}

.cta-content {
  max-width: 600px;
  margin: 0 auto;
}

.cta-title {
  font-size: 2.5rem;
  font-weight: 700;
  margin-bottom: 1rem;
}

.cta-description {
  font-size: 1.1rem;
  color: rgba(255, 255, 255, 0.7);
  margin-bottom: 2.5rem;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .hero-container {
    grid-template-columns: 1fr;
    gap: 2rem;
    text-align: center;
  }

  .hero-title {
    font-size: 2.5rem;
  }

  .hero-actions {
    justify-content: center;
    flex-wrap: wrap;
  }

  .hero-stats {
    justify-content: center;
  }

  .featured-grid {
    grid-template-columns: 1fr;
  }

  .categories-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 480px) {
  .container {
    padding: 0 1rem;
  }

  .hero-title {
    font-size: 2rem;
  }

  .section-title {
    font-size: 2rem;
  }

  .hero-stats {
    gap: 1rem;
  }
}
</style>
