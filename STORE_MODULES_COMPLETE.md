# ✅ Store 模块化重构完成

## 🎯 重构概述

已将原来的单文件 Store 拆分为模块化组织，提高代码的可维护性和可扩展性。

## 📂 新的目录结构

```
src/store/
├── index.js                  # Store 统一导出入口
├── README.md                 # Store 模块使用文档
└── modules/                  # Store 模块目录
    ├── user.js              # 👤 用户管理
    ├── game.js              # 🎮 游戏管理
    ├── settings.js          # ⚙️ 设置管理
    └── app.js               # 📱 应用状态
```

## 🆕 四大核心 Store 模块

### 1️⃣ useUserStore - 用户管理
**文件**: `store/modules/user.js`

**核心功能**:
- ✅ 用户登录/注册
- ✅ 用户信息管理
- ✅ Token 管理
- ✅ 用户统计数据
- ✅ 头像上传

**State 状态**:
```javascript
{
  userInfo: null,      // 用户信息对象
  token: '',          // 登录Token
  isLogin: false,     // 是否登录
  userStats: null,    // 用户统计信息
}
```

**主要 Actions**:
```javascript
login(loginForm)              // 登录
register(registerForm)        // 注册
fetchUserInfo()               // 获取用户信息
updateUserInfo(data)          // 更新用户信息
changePassword(passwordForm)  // 修改密码
fetchUserStats()              // 获取统计信息
uploadAvatar(file)            // 上传头像
logout()                      // 退出登录
```

**对应 API**: `api/user.js`

---

### 2️⃣ useGameStore - 游戏管理
**文件**: `store/modules/game.js`

**核心功能**:
- ✅ 游戏列表管理
- ✅ 游戏详情获取
- ✅ 游戏收藏功能
- ✅ 游戏历史记录
- ✅ 分数提交
- ✅ 排行榜查询
- ✅ 游戏搜索和分类

**State 状态**:
```javascript
{
  gameList: [],               // 游戏列表
  gameListTotal: 0,           // 游戏总数
  currentGame: null,          // 当前游戏详情
  gameHistory: [],            // 游戏历史记录
  favoriteGames: [],          // 收藏的游戏ID
  gameStats: {                // 游戏统计
    totalPlayed: 0,
    totalScore: 0,
    highestScore: 0,
  },
  categories: [],             // 游戏分类
  hotGames: [],              // 热门游戏
  recommendGames: [],        // 推荐游戏
  ranking: [],               // 排行榜
}
```

**主要 Actions**:
```javascript
fetchGameList(params)              // 获取游戏列表
fetchGameDetail(gameId)            // 获取游戏详情
fetchHotGames(limit)               // 获取热门游戏
fetchRecommendGames(limit)         // 获取推荐游戏
searchGames(keyword)               // 搜索游戏
toggleFavorite(gameId)             // 收藏/取消收藏
fetchCategories()                  // 获取游戏分类
fetchGamesByCategory(categoryId)   // 按分类获取游戏
submitScore(scoreData)             // 提交游戏分数
fetchRanking(gameId)               // 获取排行榜
fetchGameHistory(params)           // 获取游戏历史
deleteGameRecord(recordId)         // 删除游戏记录
```

**对应 API**: `api/game.js`

---

### 3️⃣ useSettingsStore - 设置管理
**文件**: `store/modules/settings.js`

**核心功能**:
- ✅ 主题切换（浅色/深色）
- ✅ 语言设置（中文/英文）
- ✅ 音效控制
- ✅ 音乐控制
- ✅ 音量调节
- ✅ 动画效果设置
- ✅ 通知开关
- ✅ 字体大小设置
- ✅ 自动保存设置

**State 状态**:
```javascript
{
  loading: false,              // 全局加载状态
  theme: 'light',             // 主题 'light' | 'dark'
  language: 'zh-CN',          // 语言
  sidebarCollapsed: false,    // 侧边栏状态
  soundEnabled: true,         // 音效开关
  musicEnabled: true,         // 音乐开关
  volume: 50,                 // 音量 0-100
  animationEnabled: true,     // 动画效果
  notificationEnabled: true,  // 通知开关
  fontSize: 'medium',         // 字体大小
  autoSave: true,            // 自动保存
}
```

**主要 Actions**:
```javascript
setLoading(loading)              // 设置加载状态
toggleTheme()                    // 切换主题
setTheme(theme)                  // 设置主题
setLanguage(lang)                // 设置语言
toggleSidebar()                  // 切换侧边栏
setSoundEnabled(enabled)         // 设置音效
toggleSound()                    // 切换音效
setMusicEnabled(enabled)         // 设置音乐
toggleMusic()                    // 切换音乐
setVolume(volume)                // 设置音量
setAnimationEnabled(enabled)     // 设置动画
setNotificationEnabled(enabled)  // 设置通知
setFontSize(size)                // 设置字体大小
setAutoSave(enabled)             // 设置自动保存
resetSettings()                  // 重置所有设置
updateSettings(settings)         // 批量更新设置
```

**数据存储**: `localStorage`（无需 API）

---

### 4️⃣ useAppStore - 应用状态
**文件**: `store/modules/app.js`

**核心功能**:
- ✅ 应用初始化管理
- ✅ 网络状态监听
- ✅ 页面可见性监听
- ✅ 路由缓存管理
- ✅ 面包屑导航
- ✅ 全局错误收集
- ✅ 设备信息检测

**State 状态**:
```javascript
{
  initialized: false,    // 应用初始化状态
  online: true,         // 网络状态
  pageVisible: true,    // 页面可见性
  cachedViews: [],      // 缓存的视图
  breadcrumbs: [],      // 面包屑导航
  errors: [],           // 全局错误列表
  device: {             // 设备信息
    isMobile: false,
    isTablet: false,
    isDesktop: true,
  },
}
```

**主要 Actions**:
```javascript
init()                      // 初始化应用
setOnlineStatus(status)     // 设置网络状态
setPageVisible(visible)     // 设置页面可见性
addCachedView(view)         // 添加缓存视图
removeCachedView(view)      // 删除缓存视图
clearCachedViews()          // 清空所有缓存
setBreadcrumbs(breadcrumbs) // 设置面包屑
addError(error)             // 添加错误
clearErrors()               // 清空错误
```

**特点**: 处理运行时状态，无需 API

---

## 💡 使用方式

### 导入 Store
```javascript
// 方式 1: 从统一入口导入（推荐）
import { useUserStore, useGameStore, useSettingsStore, useAppStore } from '@/store'

// 方式 2: 从模块直接导入
import { useUserStore } from '@/store/modules/user'
import { useGameStore } from '@/store/modules/game'
```

### 在组件中使用
```vue
<script setup>
import { useUserStore, useGameStore } from '@/store'

const userStore = useUserStore()
const gameStore = useGameStore()

// 调用 Store 方法
const handleLogin = async () => {
  await userStore.login({ username: 'admin', password: '123456' })
}

const loadGames = async () => {
  await gameStore.fetchGameList({ page: 1, pageSize: 10 })
}
</script>

<template>
  <div>
    <p>用户名: {{ userStore.userName }}</p>
    <p>游戏总数: {{ gameStore.totalGames }}</p>
  </div>
</template>
```

---

## 📊 Store 和 API 对应关系

### 用户相关
```
useUserStore (modules/user.js)    ←→    api/user.js
├─ login()                       ←→    userApi.login()
├─ register()                    ←→    userApi.register()
├─ fetchUserInfo()               ←→    userApi.getUserInfo()
├─ updateUserInfo()              ←→    userApi.updateUserInfo()
├─ changePassword()              ←→    userApi.changePassword()
├─ fetchUserStats()              ←→    userApi.getUserStats()
├─ uploadAvatar()                ←→    userApi.uploadAvatar()
└─ logout()                      ←→    userApi.logout()
```

### 游戏相关
```
useGameStore (modules/game.js)      ←→    api/game.js
├─ fetchGameList()                 ←→    gameApi.getGameList()
├─ fetchGameDetail()               ←→    gameApi.getGameDetail()
├─ fetchHotGames()                 ←→    gameApi.getHotGames()
├─ searchGames()                   ←→    gameApi.searchGames()
├─ toggleFavorite()                ←→    gameApi.favoriteGame/unfavoriteGame()
├─ fetchCategories()               ←→    gameApi.getGameCategories()
├─ submitScore()                   ←→    gameApi.submitGameScore()
└─ fetchRanking()                  ←→    gameApi.getGameRanking()
```

### 设置相关
```
useSettingsStore (modules/settings.js)
├─ 所有设置存储在 localStorage
└─ 无需调用 API
```

### 应用相关
```
useAppStore (modules/app.js)
├─ 运行时状态管理
└─ 无需调用 API
```

---

## 🎯 模块化的优势

### ✅ 代码组织更清晰
- 每个模块职责单一
- 易于理解和维护
- 便于团队协作

### ✅ 按需加载
- 只导入需要的 Store
- 减少初始加载体积
- 提升应用性能

### ✅ 易于扩展
- 添加新模块很简单
- 不影响现有模块
- 支持独立测试

### ✅ 更好的类型支持
- 每个模块类型清晰
- IDE 自动补全更准确
- 减少类型错误

---

## 📚 相关文档

| 文档 | 路径 | 说明 |
|------|------|------|
| Store 模块文档 | `src/store/README.md` | Store 详细使用说明 |
| Store API 对应指南 | `STORE_API_GUIDE.md` | Store 和 API 完整对应 |
| API 使用文档 | `README_API.md` | API 接口详细说明 |
| 使用指南 | `USAGE.md` | 项目完整使用指南 |

---

## 🚀 快速开始

### 1. 查看示例页面
```
http://localhost:5173/examples/quickstart
http://localhost:5173/examples/store
http://localhost:5173/examples/api
```

### 2. 在项目中使用
```javascript
import { useUserStore, useGameStore } from '@/store'

const userStore = useUserStore()
const gameStore = useGameStore()

// 登录
await userStore.login({ username: 'admin', password: '123456' })

// 获取游戏列表
await gameStore.fetchGameList({ page: 1, pageSize: 10 })
```

### 3. 查看文档
```bash
# Store 模块文档
src/store/README.md

# Store 和 API 对应指南
STORE_API_GUIDE.md
```

---

## ✨ 总结

✅ **已完成**:
- 将单文件 Store 拆分为 4 个独立模块
- 每个模块职责清晰，易于维护
- Store 方法直接对应 API 调用
- 完善的文档和使用示例
- 向后兼容，无需修改现有代码

✅ **现在你可以**:
- 使用模块化的 Store 管理状态
- 按需导入需要的 Store
- 轻松添加新的 Store 模块
- 享受更好的代码组织和维护体验

**Store 模块化重构完成，开发更高效！** 🎉
