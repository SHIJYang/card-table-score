<template>
  <div class="api-example">
    <el-card class="example-card">
      <template #header>
        <div class="card-header">
          <span>API请求示例</span>
        </div>
      </template>

      <el-tabs v-model="activeTab">
        <!-- 用户API示例 -->
        <el-tab-pane label="用户API" name="user">
          <div class="example-content">
            <h3>用户登录</h3>
            <el-form :model="loginForm" label-width="80px">
              <el-form-item label="用户名">
                <el-input v-model="loginForm.username" placeholder="admin" />
              </el-form-item>
              <el-form-item label="密码">
                <el-input
                  v-model="loginForm.password"
                  type="password"
                  placeholder="123456"
                />
              </el-form-item>
              <el-form-item>
                <el-button type="primary" @click="handleLogin">登录</el-button>
                <el-button @click="handleGetUserInfo">获取用户信息</el-button>
                <el-button @click="handleGetUserStats">获取用户统计</el-button>
              </el-form-item>
            </el-form>

            <el-divider>响应结果</el-divider>
            <el-input
              v-model="userResponse"
              type="textarea"
              :rows="8"
              readonly
              placeholder="响应数据将显示在这里..."
            />
          </div>
        </el-tab-pane>

        <!-- 游戏API示例 -->
        <el-tab-pane label="游戏API" name="game">
          <div class="example-content">
            <h3>游戏相关接口</h3>
            <div class="button-group">
              <el-button type="primary" @click="handleGetGameList">
                获取游戏列表
              </el-button>
              <el-button type="success" @click="handleGetHotGames">
                获取热门游戏
              </el-button>
              <el-button type="warning" @click="handleGetCategories">
                获取游戏分类
              </el-button>
            </div>

            <el-form :model="gameForm" label-width="100px" style="margin-top: 20px">
              <el-form-item label="游戏ID">
                <el-input-number v-model="gameForm.gameId" :min="1" :max="6" />
              </el-form-item>
              <el-form-item label="分数">
                <el-input-number v-model="gameForm.score" :min="0" :max="10000" />
              </el-form-item>
              <el-form-item>
                <el-button type="primary" @click="handleSubmitScore">
                  提交分数
                </el-button>
                <el-button @click="handleGetGameDetail">获取游戏详情</el-button>
                <el-button @click="handleGetRanking">获取排行榜</el-button>
              </el-form-item>
            </el-form>

            <el-divider>响应结果</el-divider>
            <el-input
              v-model="gameResponse"
              type="textarea"
              :rows="8"
              readonly
              placeholder="响应数据将显示在这里..."
            />
          </div>
        </el-tab-pane>

        <!-- 请求配置示例 -->
        <el-tab-pane label="请求配置" name="config">
          <div class="example-content">
            <h3>请求拦截器配置</h3>
            <el-alert
              title="请求拦截器功能"
              type="info"
              :closable="false"
              style="margin-bottom: 20px"
            >
              <ul>
                <li>自动添加 Token 到请求头</li>
                <li>显示加载动画</li>
                <li>添加时间戳防止缓存</li>
                <li>统一错误处理</li>
                <li>401/403 自动登出</li>
              </ul>
            </el-alert>

            <h3>Mock数据配置</h3>
            <el-alert
              title="Mock数据状态"
              :type="mockEnabled ? 'success' : 'warning'"
              :closable="false"
            >
              <p>
                当前Mock状态: {{ mockEnabled ? '已启用' : '已禁用' }}
              </p>
              <p>
                可以在 <code>.env.development</code> 文件中修改
                <code>VITE_MOCK_ENABLED</code> 配置
              </p>
            </el-alert>

            <div style="margin-top: 20px">
              <h4>环境变量配置:</h4>
              <pre style="background: #f5f5f5; padding: 10px; border-radius: 4px">
API基础路径: {{ apiBaseUrl }}
Mock状态: {{ mockEnabled }}
应用标题: {{ appTitle }}</pre
              >
            </div>
          </div>
        </el-tab-pane>
      </el-tabs>
    </el-card>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import * as userApi from '@/api/user'
import * as gameApi from '@/api/game'

const activeTab = ref('user')

// 登录表单
const loginForm = ref({
  username: 'admin',
  password: '123456',
})

// 游戏表单
const gameForm = ref({
  gameId: 1,
  score: 1000,
})

// 响应数据
const userResponse = ref('')
const gameResponse = ref('')

// 环境变量
const mockEnabled = computed(() => import.meta.env.VITE_MOCK_ENABLED === 'true')
const apiBaseUrl = computed(() => import.meta.env.VITE_API_BASE_URL)
const appTitle = computed(() => import.meta.env.VITE_APP_TITLE)

// 用户登录
const handleLogin = async () => {
  try {
    const res = await userApi.login(loginForm.value)
    userResponse.value = JSON.stringify(res, null, 2)
    ElMessage.success('登录成功')
  } catch (error) {
    userResponse.value = JSON.stringify(error, null, 2)
  }
}

// 获取用户信息
const handleGetUserInfo = async () => {
  try {
    const res = await userApi.getUserInfo()
    userResponse.value = JSON.stringify(res, null, 2)
  } catch (error) {
    userResponse.value = JSON.stringify(error, null, 2)
  }
}

// 获取用户统计
const handleGetUserStats = async () => {
  try {
    const res = await userApi.getUserStats()
    userResponse.value = JSON.stringify(res, null, 2)
  } catch (error) {
    userResponse.value = JSON.stringify(error, null, 2)
  }
}

// 获取游戏列表
const handleGetGameList = async () => {
  try {
    const res = await gameApi.getGameList({ page: 1, pageSize: 10 })
    gameResponse.value = JSON.stringify(res, null, 2)
  } catch (error) {
    gameResponse.value = JSON.stringify(error, null, 2)
  }
}

// 获取热门游戏
const handleGetHotGames = async () => {
  try {
    const res = await gameApi.getHotGames({ limit: 6 })
    gameResponse.value = JSON.stringify(res, null, 2)
  } catch (error) {
    gameResponse.value = JSON.stringify(error, null, 2)
  }
}

// 获取游戏分类
const handleGetCategories = async () => {
  try {
    const res = await gameApi.getGameCategories()
    gameResponse.value = JSON.stringify(res, null, 2)
  } catch (error) {
    gameResponse.value = JSON.stringify(error, null, 2)
  }
}

// 提交分数
const handleSubmitScore = async () => {
  try {
    const res = await gameApi.submitGameScore({
      gameId: gameForm.value.gameId,
      score: gameForm.value.score,
      playTime: 300,
    })
    gameResponse.value = JSON.stringify(res, null, 2)
    ElMessage.success('分数提交成功')
  } catch (error) {
    gameResponse.value = JSON.stringify(error, null, 2)
  }
}

// 获取游戏详情
const handleGetGameDetail = async () => {
  try {
    const res = await gameApi.getGameDetail(gameForm.value.gameId)
    gameResponse.value = JSON.stringify(res, null, 2)
  } catch (error) {
    gameResponse.value = JSON.stringify(error, null, 2)
  }
}

// 获取排行榜
const handleGetRanking = async () => {
  try {
    const res = await gameApi.getGameRanking(gameForm.value.gameId, {
      page: 1,
      pageSize: 10,
    })
    gameResponse.value = JSON.stringify(res, null, 2)
  } catch (error) {
    gameResponse.value = JSON.stringify(error, null, 2)
  }
}
</script>

<style scoped>
.api-example {
  padding: 20px;
}

.example-card {
  max-width: 900px;
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
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

h3 {
  margin-top: 0;
  color: #333;
}

h4 {
  color: #666;
}

ul {
  margin: 10px 0;
  padding-left: 20px;
}

code {
  background: #f0f0f0;
  padding: 2px 6px;
  border-radius: 3px;
  color: #e83e8c;
}
</style>
