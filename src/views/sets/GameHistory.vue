<template>
  <div class="settings-page">
    <div class="page-header">
      <h1>🎮 游戏记录</h1>
      <p class="page-desc">查看您的游戏历史记录</p>
    </div>

    <el-card class="content-card">
      <!-- 筛选器 -->
      <div class="filter-bar">
        <el-select
          v-model="historyFilter.selectedGame"
          placeholder="选择游戏"
          clearable
          style="width: 200px"
          @change="handleGameFilterChange"
        >
          <el-option label="全部游戏" value="" />
          <el-option
            v-for="game in gameList"
            :key="game.id"
            :label="game.name"
            :value="game.id"
          >
            <div class="game-option">
              <span>{{ game.icon }}</span>
              <span class="game-name">{{ game.name }}</span>
            </div>
          </el-option>
        </el-select>

        <el-input
          v-model="historyFilter.keyword"
          placeholder="搜索关键词"
          style="width: 180px; margin-left: 10px"
          clearable
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>

        <el-date-picker
          v-model="historyFilter.dateRange"
          type="daterange"
          range-separator="-"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          style="width: 240px; margin-left: 10px"
        />

        <el-button type="primary" @click="handleSearchHistory" style="margin-left: 10px">
          <el-icon><Search /></el-icon>
          搜索
        </el-button>

        <el-button @click="handleResetFilter">重置</el-button>

        <el-button type="danger" @click="handleClearHistory" style="margin-left: auto">
          <el-icon><Delete /></el-icon>
          清空记录
        </el-button>
      </div>

      <!-- 游戏统计卡片 -->
      <div class="game-stats-cards" v-if="historyFilter.selectedGame">
        <el-row :gutter="16" style="margin-top: 20px">
          <el-col :span="6">
            <div class="mini-stat-card">
              <div class="stat-icon" style="background: var(--el-color-primary)">🎮</div>
              <div class="stat-content">
                <div class="stat-value">{{ currentGameStats.playCount }}</div>
                <div class="stat-label">游玩次数</div>
              </div>
            </div>
          </el-col>
          <el-col :span="6">
            <div class="mini-stat-card">
              <div class="stat-icon" style="background: var(--el-color-success)">⭐</div>
              <div class="stat-content">
                <div class="stat-value">{{ currentGameStats.bestScore }}</div>
                <div class="stat-label">最高分</div>
              </div>
            </div>
          </el-col>
          <el-col :span="6">
            <div class="mini-stat-card">
              <div class="stat-icon" style="background: var(--el-color-warning)">📊</div>
              <div class="stat-content">
                <div class="stat-value">{{ currentGameStats.avgScore }}</div>
                <div class="stat-label">平均分</div>
              </div>
            </div>
          </el-col>
          <el-col :span="6">
            <div class="mini-stat-card">
              <div class="stat-icon" style="background: var(--el-color-danger)">⏱️</div>
              <div class="stat-content">
                <div class="stat-value">{{ formatPlayTime(currentGameStats.totalTime) }}</div>
                <div class="stat-label">总时长</div>
              </div>
            </div>
          </el-col>
        </el-row>
      </div>

      <!-- 游戏记录表格 -->
      <el-table
        :data="filteredHistory"
        v-loading="loadingHistory"
        style="width: 100%; margin-top: 20px"
        stripe
      >
        <el-table-column type="index" label="#" width="60" />

        <el-table-column label="游戏名称" min-width="150" v-if="!historyFilter.selectedGame">
          <template #default="{ row }">
            <div class="game-cell">
              <el-image
                :src="row.gameIcon"
                style="width: 40px; height: 40px; border-radius: 4px"
                fit="cover"
                lazy
              />
              <span class="game-name">{{ row.gameName }}</span>
            </div>
          </template>
        </el-table-column>

        <el-table-column prop="score" label="得分" width="120" sortable>
          <template #default="{ row }">
            <el-tag :type="getScoreTagType(row.score, row.gameId)" effect="dark">
              {{ row.score }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="playTime" label="游戏时长" width="120">
          <template #default="{ row }">
            {{ formatPlayTime(row.playTime) }}
          </template>
        </el-table-column>

        <el-table-column prop="ranking" label="排名" width="100">
          <template #default="{ row }">
            <el-tag v-if="row.ranking === 1" type="danger" effect="dark">🥇 第1名</el-tag>
            <el-tag v-else-if="row.ranking === 2" type="warning" effect="dark">🥈 第2名</el-tag>
            <el-tag v-else-if="row.ranking === 3" type="success" effect="dark">🥉 第3名</el-tag>
            <span v-else>第{{ row.ranking }}名</span>
          </template>
        </el-table-column>

        <el-table-column prop="playDate" label="游戏时间" width="180" sortable>
          <template #default="{ row }">
            {{ formatDate(row.playDate) }}
          </template>
        </el-table-column>

        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button size="small" type="primary" link @click="handleViewDetail(row)">
              查看详情
            </el-button>
            <el-button size="small" type="danger" link @click="handleDeleteRecord(row)">
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <el-pagination
        v-model:current-page="historyPagination.page"
        v-model:page-size="historyPagination.pageSize"
        :total="gameStore.gameHistoryTotal"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handleHistorySizeChange"
        @current-change="handleHistoryPageChange"
        style="margin-top: 20px; justify-content: center"
      />
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { Search, Delete } from "@element-plus/icons-vue";
import { useGameStore } from "@/store";

const gameStore = useGameStore();
const loadingHistory = ref(false);

const historyFilter = reactive({
  keyword: "",
  dateRange: null,
  selectedGame: "",
});

const historyPagination = reactive({
  page: 1,
  pageSize: 10,
});

const gameList = computed(() => gameStore.enabledGames);

const currentGameStats = computed(() => {
  if (!historyFilter.selectedGame) {
    return { playCount: 0, bestScore: 0, avgScore: 0, totalTime: 0 };
  }
  const records = gameStore.gameHistory.filter((item) => item.gameId === historyFilter.selectedGame);
  if (records.length === 0) {
    return { playCount: 0, bestScore: 0, avgScore: 0, totalTime: 0 };
  }
  const totalScore = records.reduce((sum, r) => sum + r.score, 0);
  const totalTime = records.reduce((sum, r) => sum + r.playTime, 0);
  const bestScore = Math.max(...records.map((r) => r.score));
  return {
    playCount: records.length,
    bestScore,
    avgScore: Math.round(totalScore / records.length),
    totalTime,
  };
});

const filteredHistory = computed(() => {
  let list = [...gameStore.gameHistory];

  if (historyFilter.selectedGame) {
    list = list.filter((item) => item.gameId === historyFilter.selectedGame);
  }

  if (historyFilter.keyword) {
    const k = historyFilter.keyword.toLowerCase();
    list = list.filter(
      (item) =>
        item.gameName.toLowerCase().includes(k) ||
        item.score.toString().includes(k)
    );
  }

  if (historyFilter.dateRange?.length === 2) {
    const [start, end] = historyFilter.dateRange;
    list = list.filter((item) => {
      const d = new Date(item.playDate);
      return d >= start && d <= end;
    });
  }

  return list;
});

// ========== Methods ==========
const handleSearchHistory = async () => {
  historyPagination.page = 1;
  await loadGameHistory();
};

const handleGameFilterChange = () => {
  historyPagination.page = 1;
};

const handleResetFilter = () => {
  historyFilter.keyword = "";
  historyFilter.dateRange = null;
  historyFilter.selectedGame = "";
  historyPagination.page = 1;
};

const getScoreTagType = (score, gameId) => {
  const records = gameStore.gameHistory.filter((item) => item.gameId === gameId);
  if (records.length === 0) return "info";
  const max = Math.max(...records.map((r) => r.score));
  const min = Math.min(...records.map((r) => r.score));
  const range = max - min;
  if (score === max) return "danger";
  if (score >= max - range * 0.2) return "warning";
  if (score >= max - range * 0.5) return "success";
  return "info";
};

const handleClearHistory = async () => {
  try {
    await ElMessageBox.confirm("确定要清空所有游戏记录吗？此操作不可恢复！", "警告", {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "warning",
    });
    await gameStore.clearHistory();
    ElMessage.success("历史记录已清空");
    await loadGameHistory();
  } catch {}
};

const handleViewDetail = (row) => {
  ElMessageBox.alert(
    `游戏：${row.gameName}\n得分：${row.score}\n时长：${formatPlayTime(row.playTime)}\n排名：第${row.ranking}名\n时间：${formatDate(row.playDate)}`,
    "游戏详情",
    { confirmButtonText: "确定" }
  );
};

const handleDeleteRecord = async (row) => {
  try {
    await ElMessageBox.confirm("确定要删除这条游戏记录吗？", "提示", {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "warning",
    });
    const success = await gameStore.deleteGameRecord(row.id);
    if (success) {
      ElMessage.success("记录删除成功");
      await loadGameHistory();
    }
  } catch {}
};

const handleHistorySizeChange = (size) => {
  historyPagination.pageSize = size;
  loadGameHistory();
};

const handleHistoryPageChange = (page) => {
  historyPagination.page = page;
  loadGameHistory();
};

const formatPlayTime = (seconds) => {
  if (!seconds) return "0秒";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}小时${m}分钟`;
  if (m > 0) return `${m}分钟${s}秒`;
  return `${s}秒`;
};

const formatDate = (date) => {
  if (!date) return "";
  return new Date(date).toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const loadGameHistory = async () => {
  loadingHistory.value = true;
  try {
    await gameStore.fetchGameHistory({
      page: historyPagination.page,
      pageSize: historyPagination.pageSize,
    });
  } finally {
    loadingHistory.value = false;
  }
};

onMounted(async () => {
  await loadGameHistory();
});
</script>

<style scoped lang="scss">
.settings-page {
  min-height: 100vh;
  padding: 30px;
  background: var(--el-bg-color-page);
  font-family:
    "Helvetica Neue",
    Helvetica,
    Arial,
    "PingFang SC",
    "Hiragino Sans GB",
    "Microsoft YaHei",
    sans-serif;

  .page-header {
    margin-bottom: 24px;
    h1 {
      font-size: 28px;
      color: var(--el-text-color-primary);
      margin: 0 0 8px;
    }
    .page-desc {
      font-size: 16px;
      color: var(--el-text-color-secondary);
      margin: 0;
    }
  }

  .content-card {
    background: var(--el-bg-color);
    border-radius: 8px;
    padding: 24px;
    box-shadow: var(--el-box-shadow-light);
    border: 1px solid var(--el-border-color-light);
  }

  .filter-bar {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 10px;
    margin-bottom: 20px;
  }

  .game-option,
  .game-cell {
    display: flex;
    align-items: center;
  }

  .game-name {
    margin-left: 8px;
  }

  .game-stats-cards {
    .mini-stat-card {
      background: var(--el-fill-color-light);
      border-radius: 12px;
      padding: 16px;
      display: flex;
      align-items: center;
      gap: 12px;
      transition: all 0.3s ease;
      box-shadow: var(--el-box-shadow-light);
      border: 1px solid var(--el-border-color-light);

      &:hover {
        transform: translateY(-4px);
        box-shadow: var(--el-box-shadow);
      }

      .stat-icon {
        width: 48px;
        height: 48px;
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 24px;
        color: white;
      }

      .stat-content {
        flex: 1;
        .stat-value {
          font-size: 24px;
          font-weight: bold;
          color: var(--el-text-color-primary);
          margin-bottom: 4px;
        }
        .stat-label {
          font-size: 12px;
          color: var(--el-text-color-secondary);
        }
      }
    }
  }

  // 响应式优化
  @media (max-width: 768px) {
    padding: 16px;

    .filter-bar {
      flex-direction: column;
      align-items: stretch;
    }

    .filter-bar > * {
      width: 100% !important;
      margin-left: 0 !important;
      margin-bottom: 8px;
    }

    .game-stats-cards .el-col {
      margin-bottom: 16px;
    }
  }
}
</style>