<template>
  <div class="game-homepage">
    <div class="theme-pattern"></div>
    
    <main class="main-content">
      
      <section class="section-block">
        <div class="container">
          

          <div class="categories-grid">
            <div
              v-for="category in gameCategories"
              :key="category.id"
              class="category-card"
              :style="{ '--item-color': category.color }"
              @click="handleExplore(category.link)"
            >
              <div class="card-bg-decoration"></div>
              <div class="category-icon">
                <span>{{ category.icon }}</span>
              </div>
              <h3 class="category-name">{{ category.name }}</h3>
              <div class="arrow-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section class="section-block featured-block">
        <div class="container">
          <div class="section-header">
            <h2 class="section-title">热门推荐</h2>
            <p class="section-subtitle">本周精选游戏</p>
          </div>

          <div class="featured-grid">
            <div
              v-for="game in featuredGames"
              :key="game.id"
              class="featured-card"
              :style="{ '--accent-color': game.color }"
            >
              <div class="card-image-wrapper">
                <img :src="game.image" :alt="game.name" loading="lazy" />
                <div class="card-tag" :style="{ background: game.color }">{{ game.category }}</div>
              </div>
              
              <div class="card-content">
                <div class="card-header-row">
                  <h3 class="card-title">{{ game.name }}</h3>
                  <div class="rating">
                    <span class="star">★</span> {{ game.rating }}
                  </div>
                </div>
                
                <p class="card-description">{{ game.description }}</p>
                
                <div class="card-footer">
                  <span class="players-count">
                    <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                    {{ game.players }}
                  </span>
                  <button class="play-btn" :style="{ background: game.color }">
                    去玩
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

    </main>
  </div>
</template>

<script setup lang="ts">
// 数据部分保持不变
const featuredGames = [
  {
    id: 1,
    name: "迷宫探险",
    description: "在复杂的迷宫中寻找出路，考验方向感。",
    image: "https://picsum.photos/400/300?random=11",
    players: "12k",
    rating: "4.8",
    category: "益智",
    color: "#409eff", // 对应 Eleme Primary
  },
  {
    id: 2,
    name: "数字华容道",
    description: "经典的数字滑动拼图游戏。",
    image: "https://picsum.photos/400/300?random=12",
    players: "8.7k",
    rating: "4.9",
    category: "解谜",
    color: "#67c23a", // Success
  },
  {
    id: 3,
    name: "宝石消除",
    description: "绚丽多彩的消除类游戏。",
    image: "https://picsum.photos/400/300?random=13",
    players: "23k",
    rating: "4.7",
    category: "休闲",
    color: "#e6a23c", // Warning
  },
  {
    id: 4,
    name: "太空射击",
    description: "刺激的太空战斗体验。",
    image: "https://picsum.photos/400/300?random=14",
    players: "18k",
    rating: "4.6",
    category: "动作",
    color: "#f56c6c", // Danger
  },
];

const gameCategories = [
  { id: 1, name: "计分板", icon: "🧩", color: "#409eff", link: "/score" },
  { id: 2, name: "五子棋", icon: "🎯", link: "/gomoku", color: "#f56c6c" },
  { id: 3, name: "道具商店", icon: "🌴", link: "/shop", color: "#67c23a" },
  { id: 4, name: "贪吃蛇", icon: "♟️", link: "/snake", color: "#9b59b6" }, // Custom purple
  { id: 5, name: "2048", icon: "🦸", link: "/2048", color: "#e6a23c" },
  { id: 6, name: "404区域", icon: "👥", link: "/try", color: "#909399" },
];

const handleExplore = (url: string) => {
  window.location.href = url;
};
</script>

<style scoped>
/* --- 全局容器：完全依赖 Theme CSS 变量 --- */
.game-homepage {
  min-height: calc(100vh - 60px);
  width: 100%;
  /* 核心：使用 index.js 定义的变量 */
  background-color: var(--bgPrimary-color);
  color: var(--text-color);
  font-family: 'Inter', system-ui, sans-serif;
  position: relative;
  overflow-x: hidden;
  transition: background-color 0.3s, color 0.3s;
}

/* 装饰纹理：使用 currentColor 让纹理颜色自动跟随主题文字颜色 */
.theme-pattern {
  position: absolute;
  inset: 0;
  background-image: radial-gradient(var(--textSecondary-color) 1px, transparent 1px);
  background-size: 30px 30px;
  opacity: 0.05; /* 极淡的背景点阵 */
  pointer-events: none;
  z-index: 0;
}



.container {
  max-width: 1200px;
  
  margin: 0 auto;
  padding: 5vh 1.5rem;
}

/* --- 区块通用样式 --- */
.section-block {
  margin-bottom: 2rem;
}

.section-header {
  text-align: center;
  margin-bottom: 1.5rem;
}

.section-title {
  font-size: 1.8rem;
  font-weight: 800;
  margin-bottom: 0.25rem;
  /* 核心：使用 headerBg 变量实现文字渐变 */
  background: var(--headerBg);
  -webkit-background-clip: text;
  background-clip: text;
  /* 兼容性处理：如果背景是纯色或渐变，确保文字透明以显示背景 */
  color: transparent; 
  /* 如果 headerBg 未加载，使用主色回退 (通常不需要，因为 index.js 保证了变量存在) */
}

/* 如果是 Cartoon 主题，headerBg 可能比较亮，需要描边或阴影来增强可读性(可选) */
[data-theme='cartoon'] .section-title {
  -webkit-text-stroke: 1px var(--text-color);
}

.section-subtitle {
  color: var(--textSecondary-color);
  font-size: 0.9rem;
}

/* --- 游戏分类卡片 --- */
.categories-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 1rem;
}

.category-card {
  position: relative;
  /* 核心：使用次级背景色和边框变量 */
  background: var(--bgSecondary-color);
  border: 1px solid var(--border-color);
  border-radius: var(--borderRadius); /* 适配 Cartoon 的大圆角 */
  box-shadow: var(--boxShadow);       /* 适配 Cartoon 的硬阴影 或 Light 的柔和阴影 */
  
  padding: 1.5rem 1rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s, border-color 0.2s;
  overflow: hidden;
  user-select: none;
}

.category-card:hover {
  transform: translateY(-4px);
  /* 悬停时使用 hover 阴影变量 */
  box-shadow: var(--boxShadowHover);
  border-color: var(--item-color);
}

/* 背景装饰光晕 */
.card-bg-decoration {
  position: absolute;
  top: -20px;
  right: -20px;
  width: 80px;
  height: 80px;
  background: var(--item-color);
  opacity: 0.1;
  border-radius: 50%;
  filter: blur(20px);
  transition: opacity 0.3s;
}

.category-card:hover .card-bg-decoration {
  opacity: 0.2;
}

.category-icon {
  font-size: 2.5rem;
  margin-bottom: 0.5rem;
  z-index: 1;
}

.category-name {
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-color);
  z-index: 1;
}

.arrow-icon {
  margin-top: 0.5rem;
  color: var(--textLight-color);
  opacity: 0;
  transform: translateX(-10px);
  transition: all 0.3s;
}

.category-card:hover .arrow-icon {
  opacity: 1;
  transform: translateX(0);
  color: var(--item-color);
}

/* --- 热门推荐卡片 --- */
.featured-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
}

.featured-card {
  background: var(--bgSecondary-color);
  border: 1px solid var(--border-color);
  border-radius: var(--borderRadius);
  box-shadow: var(--boxShadow);
  
  overflow: hidden;
  transition: transform 0.3s, box-shadow 0.3s;
  display: flex;
  flex-direction: column;
}

.featured-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--boxShadowHover);
}

.card-image-wrapper {
  position: relative;
  height: 180px;
  width: 100%;
  background: var(--bgDisabled-color); /* 图片加载前的占位色 */
  overflow: hidden;
}

.card-image-wrapper img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.5s;
}

.featured-card:hover img {
  transform: scale(1.05);
}

.card-tag {
  position: absolute;
  top: 10px;
  right: 10px;
  color: white;
  font-size: 0.75rem;
  font-weight: bold;
  padding: 4px 8px;
  border-radius: calc(var(--borderRadius) / 2); /* 标签圆角随主题 */
  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
}

.card-content {
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  flex: 1;
}

.card-header-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 0.5rem;
}

.card-title {
  font-size: 1.2rem;
  font-weight: 700;
  color: var(--text-color);
  margin: 0;
}

.rating {
  color: #ff9800;
  font-weight: 600;
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  gap: 2px;
}

.card-description {
  font-size: 0.9rem;
  color: var(--textSecondary-color);
  margin-bottom: 1.5rem;
  line-height: 1.5;
  flex-grow: 1; /* 让描述撑开空间 */
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: auto;
  padding-top: 1rem;
  border-top: 1px solid var(--borderLighter-color);
}

.players-count {
  font-size: 0.85rem;
  color: var(--textLight-color);
  display: flex;
  align-items: center;
  gap: 4px;
}

.play-btn {
  border: none;
  color: white;
  padding: 0.5rem 1.2rem;
  border-radius: var(--borderRadius);
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.2s;
}

.play-btn:hover {
  opacity: 0.9;
}

/* --- 移动端适配 --- */
@media (max-width: 768px) {
  .categories-grid {
    grid-template-columns: repeat(2, 1fr); /* 手机端两列 */
    gap: 0.75rem;
  }
  
  .featured-grid {
    grid-template-columns: 1fr; /* 手机端单列 */
  }
  
  .card-image-wrapper {
    height: 160px;
  }
}
</style>