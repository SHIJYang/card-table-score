<template>
  <div class="store-example">
    <el-card class="example-card">
      <template #header>
        <div class="card-header">
          <span>状态管理示例</span>
        </div>
      </template>

      <el-tabs v-model="activeTab">
        <!-- 用户状态示例 -->
        <el-tab-pane label="用户状态" name="user">
          <div class="example-content">
            <el-descriptions title="用户信息" :column="1" border>
              <el-descriptions-item label="用户名">
                {{ userStore.userName }}
              </el-descriptions-item>
              <el-descriptions-item label="登录状态">
                <el-tag :type="userStore.hasLogin ? 'success' : 'info'">
                  {{ userStore.hasLogin ? '已登录' : '未登录' }}
                </el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="Token">
                {{ userStore.token || '无' }}
              </el-descriptions-item>
            </el-descriptions>

            <div class="button-group">
              <el-button type="primary" @click="handleLogin">模拟登录</el-button>
              <el-button @click="handleLogout">退出登录</el-button>
            </div>
          </div>
        </el-tab-pane>

        <!-- 游戏状态示例 -->
        <el-tab-pane label="游戏状态" name="game">
          <div class="example-content">
            <el-descriptions title="游戏统计" :column="2" border>
              <el-descriptions-item label="总游玩次数">
                {{ gameStore.gameStats.totalPlayed }}
              </el-descriptions-item>
              <el-descriptions-item label="总分数">
                {{ gameStore.gameStats.totalScore }}
              </el-descriptions-item>
              <el-descriptions-item label="最高分">
                {{ gameStore.gameStats.highestScore }}
              </el-descriptions-item>
              <el-descriptions-item label="平均分">
                {{ gameStore.averageScore }}
              </el-descriptions-item>
            </el-descriptions>

            <div class="button-group">
              <el-button type="primary" @click="handleAddGameRecord">
                添加游戏记录
              </el-button>
              <el-button @click="handleClearHistory">清空历史</el-button>
            </div>

            <el-divider>游戏历史</el-divider>
            <el-empty v-if="gameStore.gameHistory.length === 0" description="暂无记录" />
            <el-timeline v-else>
              <el-timeline-item
                v-for="record in gameStore.gameHistory"
                :key="record.id"
                :timestamp="record.time"
                placement="top"
              >
                {{ record.gameName }} - 得分: {{ record.score }}
              </el-timeline-item>
            </el-timeline>
          </div>
        </el-tab-pane>

        <!-- 应用状态示例 -->
        <el-tab-pane label="应用状态" name="app">
          <div class="example-content">
            <el-descriptions title="应用设置" :column="1" border>
              <el-descriptions-item label="主题">
                {{ appStore.theme }}
              </el-descriptions-item>
              <el-descriptions-item label="语言">
                {{ appStore.language }}
              </el-descriptions-item>
              <el-descriptions-item label="加载状态">
                <el-tag :type="appStore.isLoading ? 'warning' : 'success'">
                  {{ appStore.isLoading ? '加载中' : '空闲' }}
                </el-tag>
              </el-descriptions-item>
            </el-descriptions>

            <div class="button-group">
              <el-button type="primary" @click="appStore.toggleTheme">
                切换主题
              </el-button>
              <el-button @click="handleToggleLoading">
                切换加载状态
              </el-button>
            </div>
          </div>
        </el-tab-pane>
      </el-tabs>
    </el-card>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useUserStore } from '@/store'
import { useGameStore } from '@/store'
import { useAppStore } from '@/store'
import { ElMessage } from 'element-plus'

const activeTab = ref('user')

const userStore = useUserStore()
const gameStore = useGameStore()
const appStore = useAppStore()

// 模拟登录
const handleLogin = () => {
  userStore.setToken('mock-token-' + Date.now())
  userStore.setUserInfo({
    id: 1,
    name: '测试用户',
    avatar: 'https://i.pravatar.cc/150?img=1',
  })
  ElMessage.success('登录成功')
}

// 退出登录
const handleLogout = () => {
  userStore.logout()
  ElMessage.success('退出成功')
}

// 添加游戏记录
const handleAddGameRecord = () => {
  const games = ['迷宫探险', '数字华容道', '宝石消除', '太空射击']
  const randomGame = games[Math.floor(Math.random() * games.length)]
  const randomScore = Math.floor(Math.random() * 1000) + 100

  gameStore.addGameHistory({
    id: Date.now(),
    gameName: randomGame,
    score: randomScore,
    time: new Date().toLocaleString(),
  })

  ElMessage.success('添加成功')
}

// 清空历史
const handleClearHistory = () => {
  gameStore.clearHistory()
  ElMessage.success('已清空')
}

// 切换加载状态
const handleToggleLoading = () => {
  appStore.setLoading(!appStore.isLoading)
}
</script>

<style scoped>
.store-example {
  padding: 20px;
}

.example-card {
  max-width: 800px;
  margin: 0 auto;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: bold;
  font-size: 16px;
}

.example-content {
  padding: 20px;
}

.button-group {
  margin-top: 20px;
  display: flex;
  gap: 10px;
}
</style>
