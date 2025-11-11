# 🎯 Store 和 API 完整对应指南

## 📦 三大核心 Store

### 1️⃣ useUserStore - 用户管理

**负责功能**: 用户登录、注册、信息管理、统计数据

#### 📍 State 状态
```javascript
{
  userInfo: null,        // 用户信息对象
  token: '',            // 登录Token
  isLogin: false,       // 是否已登录
  userStats: null,      // 用户统计信息
}
```

#### 🔍 Getters 计算属性
```javascript
userName      // 用户名
userAvatar    // 用户头像URL
userEmail     // 用户邮箱
hasLogin      // 是否已登录
userRole      // 用户角色
```

#### ⚡ Actions 方法（对应 API）

| Action 方法 | 对应 API | 说明 |
|------------|----------|------|
| `login(loginForm)` | `userApi.login()` | 用户登录，自动保存token和用户信息 |
| `register(registerForm)` | `userApi.register()` | 用户注册 |
| `fetchUserInfo()` | `userApi.getUserInfo()` | 获取用户信息并更新store |
| `updateUserInfo(data)` | `userApi.updateUserInfo()` | 更新用户信息 |
| `changePassword(passwordForm)` | `userApi.changePassword()` | 修改密码，成功后自动登出 |
| `fetchUserStats()` | `userApi.getUserStats()` | 获取用户统计数据 |
| `uploadAvatar(file)` | `userApi.uploadAvatar()` | 上传头像 |
| `logout()` | `userApi.logout()` | 登出，清空本地状态 |

#### 💡 使用示例
```vue
<script setup>
import { useUserStore } from '@/store'

const userStore = useUserStore()

// 登录
const handleLogin = async () => {
  const success = await userStore.login({
    username: 'admin',
    password: '123456'
  })
  if (success) {
    console.log('登录成功', userStore.userName)
  }
}

// 获取用户信息
const loadUserInfo = async () => {
  await userStore.fetchUserInfo()
}

// 更新用户信息
const updateProfile = async () => {
  await userStore.updateUserInfo({
    name: '新昵称',
    email: 'new@example.com'
  })
}

// 登出
const handleLogout = async () => {
  await userStore.logout()
}
</script>
```

---

### 2️⃣ useGameStore - 游戏管理

**负责功能**: 游戏列表、详情、收藏、历史记录、分数提交、排行榜

#### 📍 State 状态
```javascript
{
  gameList: [],           // 游戏列表
  gameListTotal: 0,       // 游戏总数
  currentGame: null,      // 当前游戏详情
  gameHistory: [],        // 游戏历史记录
  gameHistoryTotal: 0,    // 历史记录总数
  favoriteGames: [],      // 收藏的游戏ID列表
  gameStats: {            // 游戏统计
    totalPlayed: 0,
    totalScore: 0,
    highestScore: 0,
  },
  categories: [],         // 游戏分类
  hotGames: [],          // 热门游戏
  ranking: [],           // 排行榜数据
}
```

#### 🔍 Getters 计算属性
```javascript
getFavoriteGames     // 收藏游戏列表
getGameHistory       // 游戏历史
averageScore         // 平均分数
isFavorite(gameId)   // 检查是否已收藏
```

#### ⚡ Actions 方法（对应 API）

| Action 方法 | 对应 API | 说明 |
|------------|----------|------|
| `fetchGameList(params)` | `gameApi.getGameList()` | 获取游戏列表（支持分页） |
| `fetchGameDetail(gameId)` | `gameApi.getGameDetail()` | 获取游戏详情并设为当前游戏 |
| `fetchHotGames(limit)` | `gameApi.getHotGames()` | 获取热门游戏 |
| `searchGames(keyword)` | `gameApi.searchGames()` | 搜索游戏 |
| `toggleFavorite(gameId)` | `gameApi.favoriteGame()` / `unfavoriteGame()` | 收藏/取消收藏游戏 |
| `fetchCategories()` | `gameApi.getGameCategories()` | 获取游戏分类 |
| `fetchGamesByCategory(categoryId, params)` | `gameApi.getGamesByCategory()` | 根据分类获取游戏 |
| `submitScore(scoreData)` | `gameApi.submitGameScore()` | 提交游戏分数 |
| `fetchRanking(gameId, params)` | `gameApi.getGameRanking()` | 获取游戏排行榜 |
| `fetchGameHistory(params)` | `gameApi.getGameHistory()` | 获取游戏历史记录 |
| `deleteGameRecord(recordId)` | `gameApi.deleteGameRecord()` | 删除游戏记录 |

#### 💡 使用示例
```vue
<script setup>
import { ref, onMounted } from 'vue'
import { useGameStore } from '@/store'

const gameStore = useGameStore()
const games = ref([])

// 获取游戏列表
onMounted(async () => {
  games.value = await gameStore.fetchGameList({ 
    page: 1, 
    pageSize: 10 
  })
})

// 获取游戏详情
const viewGameDetail = async (gameId) => {
  await gameStore.fetchGameDetail(gameId)
  console.log('当前游戏', gameStore.currentGame)
}

// 收藏游戏
const toggleFav = async (gameId) => {
  await gameStore.toggleFavorite(gameId)
}

// 提交分数
const submitGameScore = async () => {
  await gameStore.submitScore({
    gameId: 1,
    score: 999,
    playTime: 300
  })
}

// 获取热门游戏
const loadHotGames = async () => {
  const hotGames = await gameStore.fetchHotGames(6)
}

// 搜索游戏
const handleSearch = async (keyword) => {
  const results = await gameStore.searchGames(keyword)
}
</script>
```

---

### 3️⃣ useSettingsStore - 设置管理

**负责功能**: 主题、语言、音效、音量等应用设置

#### 📍 State 状态
```javascript
{
  loading: false,              // 全局加载状态
  theme: 'light',             // 主题 'light' | 'dark'
  language: 'zh-CN',          // 语言
  sidebarCollapsed: false,    // 侧边栏折叠状态
  soundEnabled: true,         // 音效开关
  musicEnabled: true,         // 音乐开关
  volume: 50,                 // 音量 0-100
  animationEnabled: true,     // 动画效果
  notificationEnabled: true,  // 通知开关
}
```

#### 🔍 Getters 计算属性
```javascript
isLoading          // 是否加载中
isDarkTheme        // 是否深色主题
isZhCN             // 是否中文
allSettings        // 所有设置对象
```

#### ⚡ Actions 方法（无需 API）

| Action 方法 | 说明 |
|------------|------|
| `setLoading(loading)` | 设置全局加载状态 |
| `toggleTheme()` | 切换主题 |
| `setTheme(theme)` | 设置指定主题 |
| `setLanguage(lang)` | 设置语言 |
| `toggleSidebar()` | 切换侧边栏 |
| `setSoundEnabled(enabled)` | 设置音效开关 |
| `toggleSound()` | 切换音效 |
| `setMusicEnabled(enabled)` | 设置音乐开关 |
| `toggleMusic()` | 切换音乐 |
| `setVolume(volume)` | 设置音量 |
| `setAnimationEnabled(enabled)` | 设置动画效果 |
| `setNotificationEnabled(enabled)` | 设置通知开关 |
| `resetSettings()` | 重置所有设置 |
| `updateSettings(settings)` | 批量更新设置 |

#### 💡 使用示例
```vue
<script setup>
import { useSettingsStore } from '@/store'

const settingsStore = useSettingsStore()

// 切换主题
const toggleTheme = () => {
  settingsStore.toggleTheme()
}

// 设置音量
const changeVolume = (val) => {
  settingsStore.setVolume(val)
}

// 批量更新设置
const saveSettings = () => {
  settingsStore.updateSettings({
    theme: 'dark',
    soundEnabled: true,
    volume: 80
  })
}

// 重置设置
const reset = () => {
  settingsStore.resetSettings()
}
</script>
```

---

## 🔥 完整业务流程示例

### 示例 1: 完整的登录流程
```vue
<template>
  <div class="login-page">
    <el-form :model="loginForm" @submit.prevent="handleLogin">
      <el-form-item label="用户名">
        <el-input v-model="loginForm.username" />
      </el-form-item>
      <el-form-item label="密码">
        <el-input v-model="loginForm.password" type="password" />
      </el-form-item>
      <el-button type="primary" @click="handleLogin">登录</el-button>
    </el-form>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/store'

const router = useRouter()
const userStore = useUserStore()

const loginForm = ref({
  username: '',
  password: ''
})

const handleLogin = async () => {
  // 调用 Store 的 login 方法，内部会调用 API
  const success = await userStore.login(loginForm.value)
  
  if (success) {
    // 登录成功后获取用户统计信息
    await userStore.fetchUserStats()
    
    // 跳转到首页
    router.push('/')
  }
}
</script>
```

### 示例 2: 游戏列表页面
```vue
<template>
  <div class="game-list">
    <!-- 分类筛选 -->
    <div class="categories">
      <el-button
        v-for="cat in gameStore.categories"
        :key="cat.id"
        @click="filterByCategory(cat.id)"
      >
        {{ cat.name }}
      </el-button>
    </div>

    <!-- 游戏列表 -->
    <div class="games">
      <div
        v-for="game in games"
        :key="game.id"
        class="game-card"
        @click="viewDetail(game.id)"
      >
        <img :src="game.image" :alt="game.name" />
        <h3>{{ game.name }}</h3>
        <p>{{ game.description }}</p>
        
        <!-- 收藏按钮 -->
        <el-button
          :type="gameStore.isFavorite(game.id) ? 'danger' : 'default'"
          @click.stop="toggleFavorite(game.id)"
        >
          {{ gameStore.isFavorite(game.id) ? '已收藏' : '收藏' }}
        </el-button>
      </div>
    </div>

    <!-- 分页 -->
    <el-pagination
      v-model:current-page="currentPage"
      :total="gameStore.gameListTotal"
      :page-size="pageSize"
      @current-change="loadGames"
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useGameStore } from '@/store'

const router = useRouter()
const gameStore = useGameStore()

const games = ref([])
const currentPage = ref(1)
const pageSize = ref(10)

// 加载游戏列表
const loadGames = async () => {
  games.value = await gameStore.fetchGameList({
    page: currentPage.value,
    pageSize: pageSize.value
  })
}

// 根据分类筛选
const filterByCategory = async (categoryId) => {
  games.value = await gameStore.fetchGamesByCategory(categoryId, {
    page: 1,
    pageSize: pageSize.value
  })
}

// 查看游戏详情
const viewDetail = async (gameId) => {
  await gameStore.fetchGameDetail(gameId)
  router.push(`/game/${gameId}`)
}

// 收藏/取消收藏
const toggleFavorite = async (gameId) => {
  await gameStore.toggleFavorite(gameId)
}

onMounted(async () => {
  // 加载分类
  await gameStore.fetchCategories()
  // 加载游戏列表
  await loadGames()
})
</script>
```

### 示例 3: 游戏详情和分数提交
```vue
<template>
  <div class="game-detail" v-if="gameStore.currentGame">
    <h1>{{ gameStore.currentGame.name }}</h1>
    <img :src="gameStore.currentGame.image" />
    <p>{{ gameStore.currentGame.description }}</p>

    <!-- 开始游戏 -->
    <el-button type="primary" @click="startGame">开始游戏</el-button>

    <!-- 提交分数 -->
    <el-button @click="submitScore">提交分数</el-button>

    <!-- 排行榜 -->
    <div class="ranking">
      <h3>排行榜</h3>
      <div v-for="(rank, index) in ranking" :key="rank.userId">
        <span>{{ index + 1 }}. {{ rank.username }}</span>
        <span>{{ rank.score }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useGameStore } from '@/store'

const route = useRoute()
const gameStore = useGameStore()
const ranking = ref([])

onMounted(async () => {
  const gameId = route.params.id
  
  // 获取游戏详情
  await gameStore.fetchGameDetail(gameId)
  
  // 获取排行榜
  ranking.value = await gameStore.fetchRanking(gameId, {
    page: 1,
    pageSize: 10
  })
})

const startGame = () => {
  // 开始游戏逻辑
  console.log('游戏开始')
}

const submitScore = async () => {
  // 提交分数
  await gameStore.submitScore({
    gameId: gameStore.currentGame.id,
    score: 999,
    playTime: 300
  })
  
  // 刷新排行榜
  ranking.value = await gameStore.fetchRanking(gameStore.currentGame.id, {
    page: 1,
    pageSize: 10
  })
}
</script>
```

### 示例 4: 设置页面
```vue
<template>
  <div class="settings-page">
    <h2>应用设置</h2>

    <!-- 主题设置 -->
    <div class="setting-item">
      <span>主题</span>
      <el-switch
        v-model="isDark"
        @change="settingsStore.toggleTheme()"
      />
    </div>

    <!-- 语言设置 -->
    <div class="setting-item">
      <span>语言</span>
      <el-select
        v-model="settingsStore.language"
        @change="settingsStore.setLanguage"
      >
        <el-option label="简体中文" value="zh-CN" />
        <el-option label="English" value="en-US" />
      </el-select>
    </div>

    <!-- 音效开关 -->
    <div class="setting-item">
      <span>音效</span>
      <el-switch
        v-model="settingsStore.soundEnabled"
        @change="settingsStore.toggleSound"
      />
    </div>

    <!-- 音量设置 -->
    <div class="setting-item">
      <span>音量</span>
      <el-slider
        v-model="settingsStore.volume"
        @change="settingsStore.setVolume"
      />
    </div>

    <!-- 重置按钮 -->
    <el-button @click="settingsStore.resetSettings()">
      重置为默认设置
    </el-button>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useSettingsStore } from '@/store'

const settingsStore = useSettingsStore()
const isDark = computed(() => settingsStore.isDarkTheme)
</script>
```

---

## 📊 Store 和 API 对应关系总览

### 用户相关
```
useUserStore          ←→  src/api/user.js
├─ login()           ←→  userApi.login()
├─ register()        ←→  userApi.register()
├─ fetchUserInfo()   ←→  userApi.getUserInfo()
├─ updateUserInfo()  ←→  userApi.updateUserInfo()
├─ changePassword()  ←→  userApi.changePassword()
├─ fetchUserStats()  ←→  userApi.getUserStats()
├─ uploadAvatar()    ←→  userApi.uploadAvatar()
└─ logout()          ←→  userApi.logout()
```

### 游戏相关
```
useGameStore                   ←→  src/api/game.js
├─ fetchGameList()            ←→  gameApi.getGameList()
├─ fetchGameDetail()          ←→  gameApi.getGameDetail()
├─ fetchHotGames()            ←→  gameApi.getHotGames()
├─ searchGames()              ←→  gameApi.searchGames()
├─ toggleFavorite()           ←→  gameApi.favoriteGame() / unfavoriteGame()
├─ fetchCategories()          ←→  gameApi.getGameCategories()
├─ fetchGamesByCategory()     ←→  gameApi.getGamesByCategory()
├─ submitScore()              ←→  gameApi.submitGameScore()
├─ fetchRanking()             ←→  gameApi.getGameRanking()
├─ fetchGameHistory()         ←→  gameApi.getGameHistory()
└─ deleteGameRecord()         ←→  gameApi.deleteGameRecord()
```

### 设置相关
```
useSettingsStore
├─ 主题设置 (toggleTheme, setTheme)
├─ 语言设置 (setLanguage)
├─ 音效设置 (setSoundEnabled, toggleSound)
├─ 音乐设置 (setMusicEnabled, toggleMusic)
├─ 音量设置 (setVolume)
└─ 其他应用级设置
（设置存储在 localStorage，无需 API）
```

---

## 💡 最佳实践

### ✅ 推荐做法
1. **在组件中使用 Store 方法，而不是直接调用 API**
   ```javascript
   // ✅ 推荐
   await userStore.login(form)
   
   // ❌ 不推荐
   const res = await userApi.login(form)
   userStore.setToken(res.data.token)
   ```

2. **使用 Store 的 Getters 获取派生数据**
   ```javascript
   // ✅ 推荐
   const avgScore = gameStore.averageScore
   
   // ❌ 不推荐
   const avgScore = gameStore.gameStats.totalScore / gameStore.gameStats.totalPlayed
   ```

3. **利用 Store 的响应式特性**
   ```vue
   <template>
     <!-- ✅ 推荐：直接使用 store 数据 -->
     <div>{{ userStore.userName }}</div>
   </template>
   ```

### 🎯 使用场景

| 场景 | 使用的 Store | 主要方法 |
|------|-------------|---------|
| 用户登录/注册 | useUserStore | login(), register() |
| 个人信息管理 | useUserStore | fetchUserInfo(), updateUserInfo() |
| 游戏列表展示 | useGameStore | fetchGameList(), fetchHotGames() |
| 游戏搜索 | useGameStore | searchGames() |
| 收藏管理 | useGameStore | toggleFavorite(), isFavorite() |
| 分数提交 | useGameStore | submitScore() |
| 排行榜 | useGameStore | fetchRanking() |
| 主题切换 | useSettingsStore | toggleTheme() |
| 音效控制 | useSettingsStore | toggleSound(), setVolume() |

---

现在您可以在项目中轻松使用 Store 和 API 了！🚀
