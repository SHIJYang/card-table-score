<template>
  <div class="game-homepage">
    <MatrixBackground />
    
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
              <span class="category-name">{{ category.name }}</span>
              <div class="arrow-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
              </div>
            </div>
          </div>
        </div>
      </section>
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
    </main>
  </div>
</template>

<script setup lang="ts">
import MatrixBackground from '@/components/MatrixBackground.vue'; 
import TowerLoader from '@/components/box/TowerLoader.vue'
import CubeLoader from '@/components/box/CubeLoader.vue'
const gameCategories = [
  { id: 1, name: "计分板", icon: "🧩", color: "#409eff", link: "/score" },
  { id: 2, name: "五子棋", icon: "🎯", link: "/gomoku", color: "#f56c6c" },
  { id: 3, name: "道具商店", icon: "🌴", link: "/shop", color: "#67c23a" },
  { id: 4, name: "贪吃蛇", icon: "♟️", link: "/snake", color: "#9b59b6" }, 
  { id: 5, name: "2048", icon: "🦸", link: "/2048", color: "#e6a23c" },
  { id: 6, name: "404区域", icon: "👥", link: "/try", color: "#909399" },
];

const handleExplore = (url: string) => {
  window.location.href = url;
};
</script>

<style scoped>

.loading-container {
  display: flex;
  gap: 50px;
  align-items: center;
  justify-content: center;
  padding: 50px;
 
}
.showcase {
  display: flex;
  flex-wrap: wrap;
  gap: 50px;
  padding: 30px;
  background-color: #040e29; /* 深色背景更能凸显发光效果 */
  justify-content: center;
  align-items: center;
}

.item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 60px; /* 给下方阴影留出空间 */
}


/* --- 全局容器调整 --- */
.game-homepage {
  min-height: calc(100vh - 60px);
  width: 100%;
  /* 移除背景色，以便让 MatrixBackground 显示出来 */
  /* background-color: var(--bgPrimary-color); */ 
  color: var(--text-color);
  font-family: 'Inter', system-ui, sans-serif;
  position: relative;
  overflow-x: hidden;
  /* transition: background-color 0.3s, color 0.3s; */
}

/* 确保主内容在背景之上 */
.main-content {
  position: relative;
  z-index: 1;
}

/* 移除了 .theme-pattern 因为不需要点阵背景了 */

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 5vh 1.5rem;
}

/* --- 下方样式保持不变，但建议增加卡片背景的不透明度 --- */

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
  background: var(--headerBg);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent; 
  /* 如果背景太黑，文字可能看不清，可以强制加个白色阴影或描边 */
  text-shadow: 0 0 10px rgba(0,0,0,0.5); 
}

/* 如果是 Cartoon 主题 */
[data-theme='cartoon'] .section-title {
  -webkit-text-stroke: 1px var(--text-color);
}

.section-subtitle {
  color: #a0aec0; /* 调整为浅灰色以适应深色背景 */
  font-size: 0.9rem;
}

/* --- 游戏分类卡片 --- */
.categories-grid {
  display: flex;
    gap: 20px;
    flex-wrap: wrap;
    flex-direction: row;
    align-content: center;
    justify-content: space-around;
    align-items: center;
}

.category-card {
  position: relative;
  background: var(--bgSecondary-color); 
  border: 1px solid rgba(255, 255, 255, 0.1); /* 微调边框 */
  border-radius: var(--borderRadius);
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
  width: 120px;
  height: 105px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s, border-color 0.2s;
  overflow: hidden;
  user-select: none;
  backdrop-filter: blur(5px); /* 增加毛玻璃效果 */
}

.category-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 10px 15px rgba(0, 0, 0, 0.4);
  border-color: var(--item-color);
}

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
 
  z-index: 1;
}

.category-name {
  font-size: 1rem;
  margin: 0.2rem 0;
  color: var(--text); 
  z-index: 1;
}

.arrow-icon {

  color: #cbd5e0;
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
  background: rgba(30, 30, 40, 0.85); /* 同样增加不透明背景 */
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: var(--borderRadius);
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(5px);
  
  overflow: hidden;
  transition: transform 0.3s, box-shadow 0.3s;
  display: flex;
  flex-direction: column;
}

.featured-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 10px 15px rgba(0, 0, 0, 0.4);
}

.card-image-wrapper {
  position: relative;
  height: 180px;
  width: 100%;
  background: #2d3748;
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
  border-radius: calc(var(--borderRadius) / 2);
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
  color: #fff;
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
  color: #a0aec0;
  margin-bottom: 1.5rem;
  line-height: 1.5;
  flex-grow: 1;
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
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.players-count {
  font-size: 0.85rem;
  color: #cbd5e0;
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

@media (max-width: 768px) {
  
  
  
  
  
}
</style>