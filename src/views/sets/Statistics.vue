<template>
  <div class="settings-page">
    <div class="page-header">
      <h1>📊 数据统计</h1>
      <p class="page-desc">您的游戏数据概览</p>
    </div>

    <el-row :gutter="20" style="margin-bottom: 20px">
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-item">
            <el-icon class="stat-icon" color="#409eff"><Trophy /></el-icon>
            <div class="stat-info">
              <p class="stat-value">{{ userStats.totalPlayed || 0 }}</p>
              <p class="stat-label">游戏总局数</p>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-item">
            <el-icon class="stat-icon" color="#67c23a"><Star /></el-icon>
            <div class="stat-info">
              <p class="stat-value">{{ userStats.totalScore || 0 }}</p>
              <p class="stat-label">累计得分</p>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-item">
            <el-icon class="stat-icon" color="#e6a23c"><Medal /></el-icon>
            <div class="stat-info">
              <p class="stat-value">{{ userStats.highestScore || 0 }}</p>
              <p class="stat-label">最高分数</p>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-item">
            <el-icon class="stat-icon" color="#f56c6c"><Timer /></el-icon>
            <div class="stat-info">
              <p class="stat-value">
                {{ formatPlayTime(userStats.totalPlayTime || 0) }}
              </p>
              <p class="stat-label">总游戏时长</p>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-card class="content-card">
      <h3 style="margin-bottom: 16px">游戏排行</h3>
      <el-table :data="userStats.topGames || []">
        <el-table-column type="index" label="排名" width="80" />
        <el-table-column prop="gameName" label="游戏名称" />
        <el-table-column
          prop="playCount"
          label="游玩次数"
          width="120"
          sortable
        />
        <el-table-column prop="bestScore" label="最高分" width="120" sortable />
        <el-table-column prop="avgScore" label="平均分" width="120" sortable />
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { Trophy, Star, Medal, Timer } from "@element-plus/icons-vue";
import { useGameStore } from "@/store";

// Store
const gameStore = useGameStore();

// 用户统计数据
const userStats = ref({
  totalPlayed: 0,
  totalScore: 0,
  highestScore: 0,
  totalPlayTime: 0,
  topGames: [],
});

// 格式化游戏时长
const formatPlayTime = (seconds) => {
  if (!seconds) return "0秒";
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  if (hours > 0) return `${hours}小时${minutes}分钟`;
  if (minutes > 0) return `${minutes}分钟${secs}秒`;
  return `${secs}秒`;
};

// 加载用户统计（从本地游戏记录计算）
const loadUserStats = () => {
  const history = gameStore.gameHistory;

  if (history.length === 0) {
    userStats.value = {
      totalPlayed: 0,
      totalScore: 0,
      highestScore: 0,
      totalPlayTime: 0,
      topGames: [],
    };
    return;
  }

  // 计算统计数据
  const totalPlayed = history.length;
  const totalScore = history.reduce((sum, record) => sum + record.score, 0);
  const highestScore = Math.max(...history.map((r) => r.score));
  const totalPlayTime = history.reduce(
    (sum, record) => sum + record.playTime,
    0
  );

  // 计算Top游戏
  const gameStatsMap = {};
  history.forEach((record) => {
    if (!gameStatsMap[record.gameId]) {
      gameStatsMap[record.gameId] = {
        gameName: record.gameName,
        playCount: 0,
        totalScore: 0,
        bestScore: 0,
      };
    }
    const stats = gameStatsMap[record.gameId];
    stats.playCount++;
    stats.totalScore += record.score;
    stats.bestScore = Math.max(stats.bestScore, record.score);
  });

  const topGames = Object.values(gameStatsMap)
    .map((stats) => ({
      ...stats,
      avgScore: Math.round(stats.totalScore / stats.playCount),
    }))
    .sort((a, b) => b.playCount - a.playCount)
    .slice(0, 5);

  userStats.value = {
    totalPlayed,
    totalScore,
    highestScore,
    totalPlayTime,
    topGames,
  };
};

// 页面初始化
onMounted(async () => {
  // 确保游戏历史已加载
  if (gameStore.gameHistory.length === 0) {
    await gameStore.fetchGameHistory();
  }
  loadUserStats();
});
</script>

<style scoped lang="scss">
.settings-page {
  min-height: 100vh;
  background: #f5f7fa;
  padding: 30px;

  .page-header {
    margin-bottom: 24px;
    h1 {
      font-size: 28px;
      color: #303133;
      margin: 0 0 8px 0;
    }
    .page-desc {
      font-size: 16px;
      color: #909399;
      margin: 0;
    }
  }

  .content-card {
    background: white;
    border-radius: 8px;
    padding: 24px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  }

  .stat-card {
    background: white;
    border-radius: 8px;
    padding: 20px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
    .stat-item {
      display: flex;
      align-items: center;
      gap: 15px;
      .stat-icon {
        font-size: 40px;
      }
      .stat-info {
        .stat-value {
          font-size: 28px;
          font-weight: bold;
          color: #303133;
          margin: 0;
        }
        .stat-label {
          font-size: 14px;
          color: #909399;
          margin: 5px 0 0 0;
        }
      }
    }
  }
}
</style>
