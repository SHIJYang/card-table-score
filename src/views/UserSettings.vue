<template>
  <div class="user-settings-page">
    <el-container>
      <!-- 侧边导航 -->
      <el-aside width="220px" class="settings-aside">
        <el-menu
          :default-active="activeTab"
          @select="handleMenuSelect"
          class="settings-menu"
        >
          <el-menu-item index="game-history">
            <el-icon><Trophy /></el-icon>
            <span>游戏记录</span>
          </el-menu-item>
          <el-menu-item index="statistics">
            <el-icon><DataAnalysis /></el-icon>
            <span>数据统计</span>
          </el-menu-item>
          <el-menu-item index="preferences">
            <el-icon><Setting /></el-icon>
            <span>偏好设置</span>
          </el-menu-item>
        </el-menu>
      </el-aside>

      <!-- 主内容区 -->
      <el-main class="settings-main">
        <!-- 游戏记录 -->
        <div v-show="activeTab === 'game-history'" class="settings-section">
          <div class="section-header">
            <h2>🎮 游戏记录</h2>
            <p class="section-desc">查看您的游戏历史记录</p>
          </div>

          <el-card class="info-card">
            <!-- 筛选器 -->
            <div class="filter-bar">
              <!-- 游戏选择器 -->
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
                  <div style="display: flex; align-items: center">
                    <span>{{ game.icon }}</span>
                    <span style="margin-left: 8px">{{ game.name }}</span>
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
                    <div class="stat-icon" style="background: #409eff">🎮</div>
                    <div class="stat-content">
                      <div class="stat-value">{{ currentGameStats.playCount }}</div>
                      <div class="stat-label">游玩次数</div>
                    </div>
                  </div>
                </el-col>
                <el-col :span="6">
                  <div class="mini-stat-card">
                    <div class="stat-icon" style="background: #67c23a">⭐</div>
                    <div class="stat-content">
                      <div class="stat-value">{{ currentGameStats.bestScore }}</div>
                      <div class="stat-label">最高分</div>
                    </div>
                  </div>
                </el-col>
                <el-col :span="6">
                  <div class="mini-stat-card">
                    <div class="stat-icon" style="background: #e6a23c">📊</div>
                    <div class="stat-content">
                      <div class="stat-value">{{ currentGameStats.avgScore }}</div>
                      <div class="stat-label">平均分</div>
                    </div>
                  </div>
                </el-col>
                <el-col :span="6">
                  <div class="mini-stat-card">
                    <div class="stat-icon" style="background: #f56c6c">⏱️</div>
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
                    />
                    <span style="margin-left: 10px">{{ row.gameName }}</span>
                  </div>
                </template>
              </el-table-column>

              <el-table-column prop="score" label="得分" width="120" sortable>
                <template #default="{ row }">
                  <el-tag 
                    :type="getScoreTagType(row.score, row.gameId)"
                    effect="dark"
                  >
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
                  <el-tag v-if="row.ranking === 1" type="danger" effect="dark">
                    🥇 第1名
                  </el-tag>
                  <el-tag v-else-if="row.ranking === 2" type="warning" effect="dark">
                    🥈 第2名
                  </el-tag>
                  <el-tag v-else-if="row.ranking === 3" type="success" effect="dark">
                    🥉 第3名
                  </el-tag>
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
              :total="filteredHistory.length"
              :page-sizes="[10, 20, 50, 100]"
              layout="total, sizes, prev, pager, next, jumper"
              @size-change="handleHistorySizeChange"
              @current-change="handleHistoryPageChange"
              style="margin-top: 20px; justify-content: center"
            />
          </el-card>
        </div>

        <!-- 数据统计 -->
        <div v-show="activeTab === 'statistics'" class="settings-section">
          <div class="section-header">
            <h2>📊 数据统计</h2>
            <p class="section-desc">您的游戏数据概览</p>
          </div>

          <el-row :gutter="20">
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
                    <p class="stat-value">{{ formatPlayTime(userStats.totalPlayTime || 0) }}</p>
                    <p class="stat-label">总游戏时长</p>
                  </div>
                </div>
              </el-card>
            </el-col>
          </el-row>

          <el-card class="info-card" style="margin-top: 20px">
            <h3>游戏排行</h3>
            <el-table :data="userStats.topGames || []" style="margin-top: 20px">
              <el-table-column type="index" label="排名" width="80" />
              <el-table-column prop="gameName" label="游戏名称" />
              <el-table-column prop="playCount" label="游玩次数" width="120" />
              <el-table-column prop="bestScore" label="最高分" width="120" />
              <el-table-column prop="avgScore" label="平均分" width="120" />
            </el-table>
          </el-card>
        </div>

        <!-- 偏好设置 -->
        <div v-show="activeTab === 'preferences'" class="settings-section">
          <div class="section-header">
            <h2>⚙️ 偏好设置</h2>
            <p class="section-desc">个性化您的使用体验</p>
          </div>

          <el-card class="info-card">
            <el-form label-width="120px">
              <el-form-item label="主题">
                <el-radio-group v-model="settingsStore.theme" @change="settingsStore.saveTheme()">
                  <el-radio label="light">浅色</el-radio>
                  <el-radio label="dark">深色</el-radio>
                </el-radio-group>
              </el-form-item>

              <el-form-item label="语言">
                <el-select v-model="settingsStore.language" @change="settingsStore.setLanguage">
                  <el-option label="简体中文" value="zh-CN" />
                  <el-option label="English" value="en-US" />
                </el-select>
              </el-form-item>

              <el-form-item label="音效">
                <el-switch v-model="settingsStore.soundEnabled" @change="settingsStore.setSoundEnabled" />
              </el-form-item>

              <el-form-item label="音乐">
                <el-switch v-model="settingsStore.musicEnabled" @change="settingsStore.setMusicEnabled" />
              </el-form-item>

              <el-form-item label="音量">
                <el-slider v-model="settingsStore.volume" @change="settingsStore.setVolume" />
              </el-form-item>

              <el-form-item label="动画效果">
                <el-switch v-model="settingsStore.animationEnabled" @change="settingsStore.setAnimationEnabled" />
              </el-form-item>

              <el-form-item label="通知">
                <el-switch v-model="settingsStore.notificationEnabled" @change="settingsStore.setNotificationEnabled" />
              </el-form-item>

              <el-form-item>
                <el-button @click="settingsStore.resetSettings()">
                  恢复默认设置
                </el-button>
              </el-form-item>
            </el-form>
          </el-card>
        </div>
      </el-main>
    </el-container>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Trophy, DataAnalysis, Setting,
  Search, Delete, Star, Medal, Timer
} from '@element-plus/icons-vue'
import { useGameStore, useSettingsStore } from '@/store'

// Store
const gameStore = useGameStore()
const settingsStore = useSettingsStore()

// 当前激活的标签页
const activeTab = ref('game-history')

// 加载状态
const loadingHistory = ref(false)

// ========== 游戏记录 ==========
const historyFilter = reactive({
  keyword: '',
  dateRange: null,
  selectedGame: '' // 新增：选中的游戏ID
})

const historyPagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0
})

// 游戏列表（从store获取）
const gameList = computed(() => gameStore.enabledGames)

// 当前选中游戏的统计数据
const currentGameStats = computed(() => {
  if (!historyFilter.selectedGame) {
    return {
      playCount: 0,
      bestScore: 0,
      avgScore: 0,
      totalTime: 0
    }
  }

  const gameRecords = gameStore.gameHistory.filter(
    item => item.gameId === historyFilter.selectedGame
  )

  if (gameRecords.length === 0) {
    return {
      playCount: 0,
      bestScore: 0,
      avgScore: 0,
      totalTime: 0
    }
  }

  const totalScore = gameRecords.reduce((sum, record) => sum + record.score, 0)
  const totalTime = gameRecords.reduce((sum, record) => sum + record.playTime, 0)
  const bestScore = Math.max(...gameRecords.map(r => r.score))

  return {
    playCount: gameRecords.length,
    bestScore: bestScore,
    avgScore: Math.round(totalScore / gameRecords.length),
    totalTime: totalTime
  }
})

// 用户统计数据
const userStats = reactive({
  totalPlayed: 0,
  totalScore: 0,
  highestScore: 0,
  totalPlayTime: 0,
  topGames: []
})

// 过滤后的游戏记录
const filteredHistory = computed(() => {
  let history = gameStore.gameHistory

  // 游戏筛选（优先）
  if (historyFilter.selectedGame) {
    history = history.filter(item => item.gameId === historyFilter.selectedGame)
  }

  // 关键词筛选
  if (historyFilter.keyword) {
    history = history.filter(item =>
      item.gameName.toLowerCase().includes(historyFilter.keyword.toLowerCase()) ||
      item.score.toString().includes(historyFilter.keyword)
    )
  }

  // 日期范围筛选
  if (historyFilter.dateRange && historyFilter.dateRange.length === 2) {
    const [start, end] = historyFilter.dateRange
    history = history.filter(item => {
      const date = new Date(item.playDate)
      return date >= start && date <= end
    })
  }

  // 分页处理
  const start = (historyPagination.page - 1) * historyPagination.pageSize
  const end = start + historyPagination.pageSize
  return history.slice(start, end)
})

// ========== 方法 ==========

// 菜单选择
const handleMenuSelect = (index) => {
  activeTab.value = index
}

// 搜索游戏记录
const handleSearchHistory = async () => {
  historyPagination.page = 1
  await loadGameHistory()
}

// 游戏筛选改变
const handleGameFilterChange = () => {
  historyPagination.page = 1
}

// 重置筛选
const handleResetFilter = () => {
  historyFilter.keyword = ''
  historyFilter.dateRange = null
  historyFilter.selectedGame = ''
  historyPagination.page = 1
}

// 根据分数获取标签类型
const getScoreTagType = (score, gameId) => {
  // 获取该游戏的最高分
  const gameRecords = gameStore.gameHistory.filter(item => item.gameId === gameId)
  if (gameRecords.length === 0) return 'info'
  
  const maxScore = Math.max(...gameRecords.map(r => r.score))
  const minScore = Math.min(...gameRecords.map(r => r.score))
  const range = maxScore - minScore
  
  if (score === maxScore) return 'danger'
  if (score >= maxScore - range * 0.2) return 'warning'
  if (score >= maxScore - range * 0.5) return 'success'
  return 'info'
}

// 清空历史记录
const handleClearHistory = async () => {
  ElMessageBox.confirm('确定要清空所有游戏记录吗？此操作不可恢复！', '警告', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    gameStore.clearHistory()
    ElMessage.success('历史记录已清空')
    await loadGameHistory()
  }).catch(() => {})
}

// 查看游戏记录详情
const handleViewDetail = (row) => {
  ElMessageBox.alert(
    `游戏：${row.gameName}\n得分：${row.score}\n时长：${formatPlayTime(row.playTime)}\n排名：第${row.ranking}名\n时间：${formatDate(row.playDate)}`,
    '游戏详情',
    { confirmButtonText: '确定' }
  )
}

// 删除游戏记录
const handleDeleteRecord = async (row) => {
  ElMessageBox.confirm('确定要删除这条游戏记录吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    const success = await gameStore.deleteGameRecord(row.id)
    if (success) {
      // 重新加载游戏历史
      await loadGameHistory()
      // 重新计算统计数据
      loadUserStats()
    }
  }).catch(() => {})
}

// 分页改变
const handleHistorySizeChange = (size) => {
  historyPagination.pageSize = size
  loadGameHistory()
}

const handleHistoryPageChange = (page) => {
  historyPagination.page = page
  loadGameHistory()
}

// 格式化游戏时长
const formatPlayTime = (seconds) => {
  if (!seconds) return '0秒'
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60

  if (hours > 0) {
    return `${hours}小时${minutes}分钟`
  } else if (minutes > 0) {
    return `${minutes}分钟${secs}秒`
  } else {
    return `${secs}秒`
  }
}

// 格式化日期
const formatDate = (date) => {
  if (!date) return ''
  const d = new Date(date)
  return d.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// ========== 数据加载 ==========

// 加载游戏历史
const loadGameHistory = async () => {
  loadingHistory.value = true
  try {
    await gameStore.fetchGameHistory({
      page: historyPagination.page,
      pageSize: historyPagination.pageSize
    })
    historyPagination.total = gameStore.gameHistoryTotal
  } finally {
    loadingHistory.value = false
  }
}

// 加载用户统计（从本地游戏记录计算）
const loadUserStats = () => {
  const history = gameStore.gameHistory
  
  if (history.length === 0) {
    Object.assign(userStats, {
      totalPlayed: 0,
      totalScore: 0,
      highestScore: 0,
      totalPlayTime: 0,
      topGames: []
    })
    return
  }

  // 计算统计数据
  const totalPlayed = history.length
  const totalScore = history.reduce((sum, record) => sum + record.score, 0)
  const highestScore = Math.max(...history.map(r => r.score))
  const totalPlayTime = history.reduce((sum, record) => sum + record.playTime, 0)

  // 计算Top游戏
  const gameStatsMap = {}
  history.forEach(record => {
    if (!gameStatsMap[record.gameId]) {
      gameStatsMap[record.gameId] = {
        gameName: record.gameName,
        playCount: 0,
        totalScore: 0,
        bestScore: 0
      }
    }
    const stats = gameStatsMap[record.gameId]
    stats.playCount++
    stats.totalScore += record.score
    stats.bestScore = Math.max(stats.bestScore, record.score)
  })

  const topGames = Object.values(gameStatsMap)
    .map(stats => ({
      ...stats,
      avgScore: Math.round(stats.totalScore / stats.playCount)
    }))
    .sort((a, b) => b.playCount - a.playCount)
    .slice(0, 5)

  Object.assign(userStats, {
    totalPlayed,
    totalScore,
    highestScore,
    totalPlayTime,
    topGames
  })
}

// 页面初始化
onMounted(async () => {
  await loadGameHistory()
  loadUserStats()
})
</script>

<style scoped lang="scss">
.user-settings-page {
  min-height: calc(100vh - 60px);
  background: #f5f7fa;
  padding: 20px;

  .el-container {
    background: white;
    border-radius: 8px;
    overflow: hidden;
    min-height: calc(100vh - 100px);
  }

  .settings-aside {
    background: #fafafa;
    border-right: 1px solid #e8e8e8;

    .settings-menu {
      border-right: none;
      background: transparent;
    }
  }

  .settings-main {
    padding: 30px;
  }

  .settings-section {
    .section-header {
      margin-bottom: 20px;

      h2 {
        font-size: 24px;
        color: #303133;
        margin: 0 0 8px 0;
      }

      .section-desc {
        color: #909399;
        margin: 0;
      }
    }
  }

  .info-card {
    margin-bottom: 20px;

    .avatar-section {
      display: flex;
      align-items: center;
      gap: 30px;

      .avatar-actions {
        .upload-tip {
          margin-top: 8px;
          color: #909399;
          font-size: 12px;
        }
      }
    }

    .profile-form {
      max-width: 600px;
      margin-top: 20px;
    }
  }

  .filter-bar {
    display: flex;
    align-items: center;
    margin-bottom: 20px;
  }

  .game-cell {
    display: flex;
    align-items: center;
  }

  .game-stats-cards {
    .mini-stat-card {
      background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
      border-radius: 12px;
      padding: 16px;
      display: flex;
      align-items: center;
      gap: 12px;
      transition: all 0.3s ease;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);

      &:hover {
        transform: translateY(-4px);
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
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
          color: #303133;
          margin-bottom: 4px;
        }

        .stat-label {
          font-size: 12px;
          color: #909399;
        }
      }
    }
  }

  .stat-card {
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
