<template>
  <Layout>
    <div class="home-view">
      <el-card class="welcome-card animate__animated animate__fadeInUp">
        <template #header>
          <div class="card-header">
            <h2>欢迎来到小游戏合集</h2>
          </div>
        </template>
        <div class="welcome-content">
          <div class="game-grid">
            <div
              v-for="game in gameStore.games"
              :key="game.id"
              class="game-card"
              @click="navigateToGame(game)"
            >
              <div class="game-icon">{{ game.icon }}</div>
              <h3>{{ game.name }}</h3>
              <p>{{ game.description }}</p>
              <el-button type="primary">开始游戏</el-button>
            </div>
          </div>

          <div v-if="gameStore.recentGames.length > 0" class="recent-games">
            <h3>最近玩过</h3>
            <div class="recent-games-grid">
              <div
                v-for="game in gameStore.recentGames"
                :key="game.id"
                class="recent-game-card"
                @click="navigateToGame(game)"
              >
                <div class="recent-game-icon">{{ game.icon }}</div>
                <span>{{ game.name }}</span>
              </div>
            </div>
          </div>

          <div class="stats-section">
            <el-row :gutter="24">
              <el-col :span="8">
                <el-statistic title="游戏总数" :value="gameStore.totalGames" />
              </el-col>
              <el-col :span="8">
                <el-statistic
                  title="最近游玩"
                  :value="gameStore.gameHistory.length"
                />
              </el-col>
              <el-col :span="8">
                <el-statistic title="当前在线" value="1" />
              </el-col>
            </el-row>
          </div>
        </div>
      </el-card>
    </div>
  </Layout>
</template>

<script setup>
import { useRouter } from "vue-router";
import { useGameStore } from "../stores/gameStore";
import Layout from "../components/Layout.vue";

const router = useRouter();
const gameStore = useGameStore();

const navigateToGame = (game) => {
  gameStore.setCurrentGame(game.id);
  router.push(game.path);
};
</script>

<style scoped>
.home-view {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
}

.welcome-card {
  border-radius: var(--border-radius);
  box-shadow: var(--box-shadow);
  transition: all var(--transition-duration) ease;
  overflow: hidden;
  border: none;
}

.welcome-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--box-shadow-hover);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #ebeef5;
  background-color: #fafafa;
}

.card-header h2 {
  margin: 0;
  color: var(--text-color);
  font-weight: 500;
}

.welcome-content {
  padding: 20px;
}

.game-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 24px;
  margin-bottom: 40px;
}

.game-card {
  background: white;
  border-radius: var(--border-radius);
  padding: 24px;
  text-align: center;
  box-shadow: var(--box-shadow);
  transition: all var(--transition-duration) ease;
  cursor: pointer;
  border: 1px solid #ebeef5;
}

.game-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--box-shadow-hover);
  border-color: var(--primary-color);
}

.game-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.game-card h3 {
  margin: 0 0 12px 0;
  color: var(--text-color);
  font-size: 18px;
  font-weight: 500;
}

.game-card p {
  margin: 0 0 20px 0;
  color: var(--text-color-secondary);
  font-size: 14px;
  line-height: 1.5;
}

.recent-games {
  margin: 40px 0;
  padding: 20px;
  background: #f9f9f9;
  border-radius: var(--border-radius);
}

.recent-games h3 {
  margin: 0 0 16px 0;
  color: var(--text-color);
  font-size: 18px;
  font-weight: 500;
}

.recent-games-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 12px;
}

.recent-game-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: white;
  border-radius: var(--border-radius);
  cursor: pointer;
  transition: all var(--transition-duration) ease;
  border: 1px solid #ebeef5;
}

.recent-game-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--box-shadow);
  border-color: var(--primary-color);
}

.recent-game-icon {
  font-size: 24px;
}

.recent-game-card span {
  font-weight: 500;
  color: var(--text-color);
}

.stats-section {
  margin-top: 40px;
  padding: 20px;
  background: #f9f9f9;
  border-radius: var(--border-radius);
}

:deep(.el-statistic) {
  text-align: center;
}

:deep(.el-statistic__number) {
  font-size: 32px;
  font-weight: bold;
  color: var(--primary-color);
}

:deep(.el-statistic__title) {
  font-size: 14px;
  color: var(--text-color-secondary);
  margin-bottom: 8px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .game-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }

  .game-card {
    padding: 20px;
  }

  .recent-games-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .stats-section {
    margin-top: 24px;
    padding: 16px;
  }

  :deep(.el-statistic__number) {
    font-size: 24px;
  }
}

@media (max-width: 480px) {
  .game-grid {
    grid-template-columns: 1fr;
  }

  .recent-games-grid {
    grid-template-columns: 1fr;
  }

  .recent-game-card {
    justify-content: center;
  }
}
</style>
