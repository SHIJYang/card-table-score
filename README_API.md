# API 和状态管理使用文档

## 📚 目录结构

```
src/
├── store/              # 状态管理
│   └── index.js       # Pinia stores (用户、游戏、应用状态)
├── api/               # API接口
│   ├── user.js        # 用户相关API
│   └── game.js        # 游戏相关API
├── utils/             # 工具函数
│   └── request.js     # Axios请求封装
├── mock/              # Mock数据
│   ├── index.js       # Mock配置
│   ├── user.js        # 用户Mock数据
│   └── game.js        # 游戏Mock数据
└── examples/          # 使用示例
    ├── StoreExample.vue   # 状态管理示例
    └── ApiExample.vue     # API请求示例
```

## 🎯 状态管理 (Pinia)

### 1. 用户状态 (useUserStore)

```javascript
import { useUserStore } from '@/store'

const userStore = useUserStore()

// State
userStore.userInfo      // 用户信息
userStore.token         // 用户token
userStore.isLogin       // 是否登录

// Getters
userStore.userName      // 用户名
userStore.userAvatar    // 用户头像
userStore.hasLogin      // 是否已登录

// Actions
userStore.setUserInfo(userInfo)    // 设置用户信息
userStore.setToken(token)          // 设置token
userStore.logout()                 // 登出
userStore.updateUserInfo(data)     // 更新用户信息
```

### 2. 游戏状态 (useGameStore)

```javascript
import { useGameStore } from '@/store'

const gameStore = useGameStore()

// State
gameStore.currentGame      // 当前游戏
gameStore.gameHistory      // 游戏历史
gameStore.favoriteGames    // 收藏的游戏
gameStore.gameStats        // 游戏统计

// Getters
gameStore.getFavoriteGames // 获取收藏游戏列表
gameStore.getGameHistory   // 获取游戏历史
gameStore.averageScore     // 获取平均分数

// Actions
gameStore.setCurrentGame(game)       // 设置当前游戏
gameStore.addGameHistory(record)     // 添加游戏记录
gameStore.toggleFavorite(gameId)     // 切换收藏
gameStore.isFavorite(gameId)         // 检查是否收藏
gameStore.clearHistory()             // 清空历史
```

### 3. 应用状态 (useAppStore)

```javascript
import { useAppStore } from '@/store'

const appStore = useAppStore()

// State
appStore.loading           // 加载状态
appStore.theme            // 主题
appStore.language         // 语言
appStore.sidebarCollapsed // 侧边栏状态

// Getters
appStore.isLoading        // 是否加载中
appStore.isDarkTheme      // 是否深色主题

// Actions
appStore.setLoading(loading)  // 设置加载状态
appStore.toggleTheme()        // 切换主题
appStore.setLanguage(lang)    // 设置语言
appStore.toggleSidebar()      // 切换侧边栏
```

## 🌐 API 请求

### 基础使用

```javascript
import { request } from '@/utils/request'

// GET请求
const data = await request.get('/api/endpoint', { params })

// POST请求
const data = await request.post('/api/endpoint', { data })

// PUT请求
const data = await request.put('/api/endpoint', { data })

// DELETE请求
const data = await request.delete('/api/endpoint', { params })

// 文件上传
const formData = new FormData()
formData.append('file', file)
const data = await request.upload('/api/upload', formData)
```

### 用户API

```javascript
import * as userApi from '@/api/user'

// 登录
await userApi.login({ username, password })

// 注册
await userApi.register({ username, password, email })

// 获取用户信息
await userApi.getUserInfo()

// 更新用户信息
await userApi.updateUserInfo({ name, email })

// 修改密码
await userApi.changePassword({ oldPassword, newPassword })

// 登出
await userApi.logout()

// 获取统计信息
await userApi.getUserStats()

// 上传头像
await userApi.uploadAvatar(file)
```

### 游戏API

```javascript
import * as gameApi from '@/api/game'

// 获取游戏列表
await gameApi.getGameList({ page: 1, pageSize: 10 })

// 获取游戏详情
await gameApi.getGameDetail(gameId)

// 获取热门游戏
await gameApi.getHotGames({ limit: 6 })

// 获取推荐游戏
await gameApi.getRecommendGames({ limit: 4 })

// 搜索游戏
await gameApi.searchGames('关键词')

// 收藏游戏
await gameApi.favoriteGame(gameId)

// 取消收藏
await gameApi.unfavoriteGame(gameId)

// 获取游戏分类
await gameApi.getGameCategories()

// 根据分类获取游戏
await gameApi.getGamesByCategory(categoryId, { page: 1, pageSize: 10 })

// 提交游戏分数
await gameApi.submitGameScore({ gameId, score, playTime })

// 获取游戏排行榜
await gameApi.getGameRanking(gameId, { page: 1, pageSize: 10 })

// 获取游戏历史
await gameApi.getGameHistory({ page: 1, pageSize: 10 })

// 删除游戏记录
await gameApi.deleteGameRecord(recordId)
```

## 🎭 Mock 数据

### 配置

在 `.env.development` 文件中配置:

```env
# 是否启用Mock数据
VITE_MOCK_ENABLED=true
```

### Mock 功能

- ✅ 自动拦截API请求
- ✅ 返回模拟数据
- ✅ 模拟延迟响应 (300ms)
- ✅ 完整的CRUD操作
- ✅ 分页支持
- ✅ 搜索和过滤

### 可用的Mock数据

#### 用户数据
- 用户名: `admin` / `user`
- 密码: `123456`

#### 游戏数据
- 6个游戏示例
- 4个游戏分类
- 排行榜数据
- 游戏历史记录

## 🔧 请求拦截器

### 请求拦截
- 自动添加 Authorization token
- 显示加载动画
- GET请求添加时间戳防止缓存

### 响应拦截
- 统一错误处理
- 自动提示错误信息
- 401/403 自动登出
- 关闭加载动画

## 📝 使用示例

### 完整的登录流程

```vue
<script setup>
import { ref } from 'vue'
import { useUserStore } from '@/store'
import * as userApi from '@/api/user'
import { ElMessage } from 'element-plus'

const userStore = useUserStore()

const loginForm = ref({
  username: '',
  password: ''
})

const handleLogin = async () => {
  try {
    // 调用登录API
    const res = await userApi.login(loginForm.value)
    
    // 保存token和用户信息到store
    userStore.setToken(res.data.token)
    userStore.setUserInfo(res.data.userInfo)
    
    ElMessage.success('登录成功')
  } catch (error) {
    ElMessage.error('登录失败')
  }
}
</script>
```

### 获取游戏列表并收藏

```vue
<script setup>
import { ref, onMounted } from 'vue'
import { useGameStore } from '@/store'
import * as gameApi from '@/api/game'

const gameStore = useGameStore()
const gameList = ref([])

// 获取游戏列表
const fetchGames = async () => {
  const res = await gameApi.getGameList({ page: 1, pageSize: 10 })
  gameList.value = res.data.list
}

// 切换收藏
const toggleFavorite = async (gameId) => {
  if (gameStore.isFavorite(gameId)) {
    await gameApi.unfavoriteGame(gameId)
  } else {
    await gameApi.favoriteGame(gameId)
  }
  gameStore.toggleFavorite(gameId)
}

onMounted(() => {
  fetchGames()
})
</script>
```

### 提交游戏分数

```vue
<script setup>
import { useGameStore } from '@/store'
import * as gameApi from '@/api/game'

const gameStore = useGameStore()

const submitScore = async (gameId, score) => {
  // 提交到服务器
  await gameApi.submitGameScore({
    gameId,
    score,
    playTime: 300
  })
  
  // 保存到本地store
  gameStore.addGameHistory({
    id: Date.now(),
    gameId,
    gameName: '游戏名称',
    score,
    time: new Date().toLocaleString()
  })
}
</script>
```

## 🎨 查看示例页面

项目中包含了两个示例页面:

1. **状态管理示例**: `src/examples/StoreExample.vue`
   - 展示如何使用 Pinia stores
   - 演示状态的读取和更新

2. **API请求示例**: `src/examples/ApiExample.vue`
   - 展示如何调用各种API
   - 演示请求拦截器的工作方式
   - 查看Mock数据的配置

## 🌟 最佳实践

1. **API调用**: 始终使用 try-catch 处理异步请求
2. **状态管理**: 复杂状态使用 Pinia，简单状态使用 ref/reactive
3. **错误处理**: 统一在拦截器中处理，特殊情况单独处理
4. **加载状态**: 使用 appStore.setLoading() 或请求配置 loading: false
5. **Mock数据**: 开发时启用，生产环境关闭

## 🔗 环境变量

### .env.development
```env
VITE_API_BASE_URL=http://localhost:3000/api
VITE_MOCK_ENABLED=true
VITE_APP_TITLE=游戏乐园
VITE_PORT=5173
```

### .env.production
```env
VITE_API_BASE_URL=https://api.example.com/api
VITE_MOCK_ENABLED=false
VITE_APP_TITLE=游戏乐园
```

## 📞 技术支持

如有问题，请查看:
- 示例页面: `src/examples/`
- API文档: 本文档
- 源码注释: 代码中的详细注释
