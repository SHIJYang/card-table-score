<template>
  <div class="quick-start">
    <el-card class="welcome-card">
      <template #header>
        <div class="card-header">
          <h1>🎉 欢迎使用全局状态管理和API系统</h1>
        </div>
      </template>

      <div class="content">
        <el-alert
          title="已为您配置完成以下功能"
          type="success"
          :closable="false"
          show-icon
        >
          <ul class="feature-list">
            <li>✅ Pinia 状态管理 (用户、游戏、应用状态)</li>
            <li>✅ Axios 请求封装 (拦截器、错误处理)</li>
            <li>✅ Mock 数据系统 (开发环境模拟API)</li>
            <li>✅ API 接口定义 (用户、游戏相关)</li>
            <li>✅ 环境变量配置 (开发/生产环境)</li>
            <li>✅ 完整的使用示例和文档</li>
          </ul>
        </el-alert>

        <el-divider>快速开始</el-divider>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-card shadow="hover" class="demo-card">
              <template #header>
                <div class="demo-title">
                  <span>📦 查看状态管理示例</span>
                </div>
              </template>
              <p>了解如何使用 Pinia 管理应用状态</p>
              <el-button type="primary" @click="goToStore">
                进入示例页面
              </el-button>
            </el-card>
          </el-col>

          <el-col :span="12">
            <el-card shadow="hover" class="demo-card">
              <template #header>
                <div class="demo-title">
                  <span>🌐 查看API请求示例</span>
                </div>
              </template>
              <p>了解如何调用API接口和使用Mock数据</p>
              <el-button type="success" @click="goToApi">
                进入示例页面
              </el-button>
            </el-card>
          </el-col>
        </el-row>

        <el-divider>快速测试</el-divider>

        <el-card class="test-card">
          <h3>🚀 立即测试API和状态管理</h3>

          <div class="test-section">
            <h4>1. 测试登录API (Mock)</h4>
            <div class="test-form">
              <el-input
                v-model="testUsername"
                placeholder="用户名 (admin)"
                style="width: 200px; margin-right: 10px"
              />
              <el-input
                v-model="testPassword"
                type="password"
                placeholder="密码 (123456)"
                style="width: 200px; margin-right: 10px"
              />
              <el-button type="primary" @click="testLogin">
                登录测试
              </el-button>
            </div>

            <div v-if="loginResult" class="result-box">
              <h5>登录结果:</h5>
              <pre>{{ loginResult }}</pre>
            </div>
          </div>

          <div class="test-section">
            <h4>2. 测试获取游戏列表</h4>
            <el-button type="success" @click="testGetGames">
              获取游戏列表
            </el-button>

            <div v-if="gamesResult" class="result-box">
              <h5>游戏列表 (共 {{ gamesResult.total }} 个):</h5>
              <div class="game-list">
                <el-tag
                  v-for="game in gamesResult.list"
                  :key="game.id"
                  style="margin: 5px"
                >
                  {{ game.name }}
                </el-tag>
              </div>
            </div>
          </div>

          <div class="test-section">
            <h4>3. 测试状态管理</h4>
            <div class="test-form">
              <el-button type="warning" @click="testStore">
                添加游戏记录到Store
              </el-button>
              <el-button @click="showStoreData">查看Store数据</el-button>
            </div>

            <div v-if="storeResult" class="result-box">
              <h5>Store状态:</h5>
              <pre>{{ storeResult }}</pre>
            </div>
          </div>
        </el-card>

        <el-divider>使用文档</el-divider>

        <el-descriptions title="重要文件说明" :column="1" border>
          <el-descriptions-item label="状态管理">
            <code>src/store/index.js</code> - Pinia stores定义
          </el-descriptions-item>
          <el-descriptions-item label="API接口">
            <code>src/api/user.js</code>, <code>src/api/game.js</code> - API接口定义
          </el-descriptions-item>
          <el-descriptions-item label="请求封装">
            <code>src/utils/request.js</code> - Axios请求封装和拦截器
          </el-descriptions-item>
          <el-descriptions-item label="Mock数据">
            <code>src/mock/</code> - Mock数据配置和模拟数据
          </el-descriptions-item>
          <el-descriptions-item label="环境配置">
            <code>.env.development</code>, <code>.env.production</code> - 环境变量
          </el-descriptions-item>
          <el-descriptions-item label="完整文档">
            <code>README_API.md</code>, <code>USAGE.md</code> - 使用文档
          </el-descriptions-item>
        </el-descriptions>

        <el-divider>环境配置</el-divider>

        <el-alert
          title="当前环境配置"
          type="info"
          :closable="false"
        >
          <ul>
            <li>API基础路径: <code>{{ apiBaseUrl }}</code></li>
            <li>Mock状态: <el-tag :type="mockEnabled ? 'success' : 'warning'">{{ mockEnabled ? '已启用' : '已禁用' }}</el-tag></li>
            <li>应用标题: <code>{{ appTitle }}</code></li>
          </ul>
        </el-alert>

        <el-divider />

        <div class="footer">
          <el-button type="primary" @click="openDocs">
            📖 查看完整文档
          </el-button>
          <el-button type="success" @click="goToHome">
            🏠 返回首页
          </el-button>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useUserStore, useGameStore } from '@/store'
import * as userApi from '@/api/user'
import * as gameApi from '@/api/game'

const router = useRouter()
const userStore = useUserStore()
const gameStore = useGameStore()

// 测试数据
const testUsername = ref('admin')
const testPassword = ref('123456')
const loginResult = ref(null)
const gamesResult = ref(null)
const storeResult = ref(null)

// 环境变量
const mockEnabled = computed(() => import.meta.env.VITE_MOCK_ENABLED === 'true')
const apiBaseUrl = computed(() => import.meta.env.VITE_API_BASE_URL)
const appTitle = computed(() => import.meta.env.VITE_APP_TITLE)

// 跳转到示例页面
const goToStore = () => {
  router.push('/examples/store')
}

const goToApi = () => {
  router.push('/examples/api')
}

const goToHome = () => {
  router.push('/')
}

// 测试登录
const testLogin = async () => {
  try {
    const res = await userApi.login({
      username: testUsername.value,
      password: testPassword.value,
    })
    loginResult.value = JSON.stringify(res, null, 2)
    
    // 保存到store
    userStore.setToken(res.data.token)
    userStore.setUserInfo(res.data.userInfo)
    
    ElMessage.success('登录成功！已保存到Store')
  } catch (error) {
    loginResult.value = JSON.stringify(error, null, 2)
    ElMessage.error('登录失败')
  }
}

// 测试获取游戏列表
const testGetGames = async () => {
  try {
    const res = await gameApi.getGameList({ page: 1, pageSize: 10 })
    gamesResult.value = res.data
    ElMessage.success('获取成功')
  } catch (error) {
    ElMessage.error('获取失败')
  }
}

// 测试Store
const testStore = () => {
  gameStore.addGameHistory({
    id: Date.now(),
    gameName: '测试游戏',
    score: Math.floor(Math.random() * 1000),
    time: new Date().toLocaleString(),
  })
  ElMessage.success('已添加到游戏历史记录')
}

// 查看Store数据
const showStoreData = () => {
  storeResult.value = JSON.stringify(
    {
      user: {
        userName: userStore.userName,
        hasLogin: userStore.hasLogin,
      },
      game: {
        totalPlayed: gameStore.gameStats.totalPlayed,
        totalScore: gameStore.gameStats.totalScore,
        highestScore: gameStore.gameStats.highestScore,
        averageScore: gameStore.averageScore,
        historyCount: gameStore.gameHistory.length,
      },
    },
    null,
    2
  )
}

// 打开文档
const openDocs = () => {
  ElMessage.info('请查看项目根目录下的 README_API.md 和 USAGE.md 文件')
}
</script>

<style scoped>
.quick-start {
  padding: 20px;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.welcome-card {
  max-width: 1200px;
  margin: 0 auto;
}

.card-header h1 {
  margin: 0;
  color: #333;
  text-align: center;
}

.content {
  padding: 20px;
}

.feature-list {
  margin: 10px 0;
  padding-left: 20px;
  line-height: 2;
}

.demo-card {
  margin-bottom: 20px;
  text-align: center;
  min-height: 180px;
  display: flex;
  flex-direction: column;
}

.demo-card p {
  color: #666;
  margin: 15px 0;
  flex: 1;
}

.demo-title {
  font-size: 16px;
  font-weight: bold;
}

.test-card {
  margin-top: 20px;
}

.test-card h3 {
  margin-top: 0;
  color: #333;
}

.test-section {
  margin: 30px 0;
  padding: 20px;
  background: #f5f7fa;
  border-radius: 8px;
}

.test-section h4 {
  margin-top: 0;
  color: #606266;
}

.test-form {
  margin: 15px 0;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
}

.result-box {
  margin-top: 15px;
  padding: 15px;
  background: white;
  border-radius: 4px;
  border: 1px solid #dcdfe6;
}

.result-box h5 {
  margin-top: 0;
  color: #409eff;
}

.result-box pre {
  margin: 0;
  padding: 10px;
  background: #f5f5f5;
  border-radius: 4px;
  overflow-x: auto;
  font-size: 12px;
  line-height: 1.5;
}

.game-list {
  margin-top: 10px;
}

code {
  background: #f0f0f0;
  padding: 2px 6px;
  border-radius: 3px;
  color: #e83e8c;
  font-size: 14px;
}

.footer {
  text-align: center;
  margin-top: 30px;
}

.footer .el-button {
  margin: 0 10px;
}
</style>
