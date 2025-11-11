# 用户设置页面使用指南

## 📋 功能概述

用户设置页面是一个完整的用户个人中心，包含以下5个主要模块：

### 1️⃣ 基础信息
- 用户头像上传
- 个人资料编辑（昵称、邮箱、手机、性别、生日、简介）
- 实时保存到本地存储

### 2️⃣ 账号安全
- 修改密码功能
- 表单验证
- 密码强度要求

### 3️⃣ 游戏记录
- 查看所有游戏历史记录
- 搜索和过滤功能
- 删除单条记录
- 清空所有记录
- 分页显示

### 4️⃣ 数据统计
- 游戏总局数统计
- 累计得分展示
- 最高分记录
- 总游戏时长
- Top5 游戏排行

### 5️⃣ 偏好设置
- 主题切换（浅色/深色）
- 语言设置
- 音效开关
- 音乐开关
- 音量调节
- 动画效果开关
- 通知开关

---

## 🚀 快速开始

### 访问页面
```
http://localhost:5173/user/settings
```

### 在导航中添加入口

**示例：在首页添加用户设置入口**

```vue
<template>
  <div>
    <el-button @click="goToSettings">
      <el-icon><Setting /></el-icon>
      个人设置
    </el-button>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { Setting } from '@element-plus/icons-vue'

const router = useRouter()

const goToSettings = () => {
  router.push('/user/settings')
}
</script>
```

---

## 💾 数据存储方式

### 1. 用户基础信息
- **存储位置**: Store (Pinia) + LocalStorage
- **API调用**: `userStore.updateUserInfo()`
- **Mock数据**: `src/mock/user.js`

```javascript
// 更新用户信息
await userStore.updateUserInfo({
  name: '新昵称',
  email: 'new@example.com',
  phone: '13800138000'
})
```

### 2. 游戏记录
- **存储位置**: Store (Pinia)
- **API调用**: `gameStore.fetchGameHistory()`
- **Mock数据**: `src/mock/game.js` (100条模拟记录)

```javascript
// 获取游戏历史
await gameStore.fetchGameHistory({
  page: 1,
  pageSize: 10
})

// 删除记录
await gameStore.deleteGameRecord(recordId)

// 清空所有记录
gameStore.clearHistory()
```

### 3. 用户统计
- **存储位置**: Store (Pinia)
- **API调用**: `userStore.fetchUserStats()`
- **Mock数据**: `src/mock/user.js`

```javascript
// 获取用户统计
const stats = await userStore.fetchUserStats()
```

### 4. 偏好设置
- **存储位置**: LocalStorage（直接存储，无需API）
- **Store**: `settingsStore`

```javascript
// 所有设置都自动保存到 localStorage
settingsStore.toggleTheme()
settingsStore.setVolume(80)
settingsStore.setSoundEnabled(false)
```

---

## 🎯 Store 和 API 对应关系

### UserStore
```
用户模块 (useUserStore):
├─ fetchUserInfo()      → GET /user/info
├─ updateUserInfo()     → PUT /user/info
├─ changePassword()     → POST /user/password/change
├─ fetchUserStats()     → GET /user/stats
└─ uploadAvatar()       → POST /user/avatar
```

### GameStore
```
游戏模块 (useGameStore):
├─ fetchGameHistory()   → GET /game/history
├─ deleteGameRecord()   → DELETE /game/history/:id
└─ clearHistory()       → 本地清空（无API调用）
```

### SettingsStore
```
设置模块 (useSettingsStore):
├─ setTheme()           → localStorage
├─ setLanguage()        → localStorage
├─ setSoundEnabled()    → localStorage
├─ setMusicEnabled()    → localStorage
├─ setVolume()          → localStorage
├─ setAnimationEnabled()→ localStorage
└─ setNotificationEnabled() → localStorage
```

---

## 📊 Mock 数据说明

### 用户信息 Mock
- **文件**: `src/mock/user.js`
- **测试账号**: 
  - 用户名: `admin` / 密码: `123456`
  - 用户名: `user` / 密码: `123456`

### 游戏记录 Mock
- **文件**: `src/mock/game.js`
- **数据量**: 100条历史记录
- **时间范围**: 最近90天
- **游戏类型**: 6种不同游戏
- **分数范围**: 1000-11000
- **游戏时长**: 1分钟-1小时

### 统计数据 Mock
```javascript
{
  totalPlayed: 156,      // 总游戏局数
  totalScore: 98560,     // 累计得分
  highestScore: 9999,    // 最高分数
  totalPlayTime: 460800, // 总时长(秒)
  topGames: [...]        // Top5游戏
}
```

---

## 🎨 页面功能详解

### 1. 基础信息编辑

**表单验证规则**:
- 昵称：必填
- 邮箱：必填 + 格式验证
- 手机号：格式验证（可选）

**头像上传**:
- 支持格式：JPG, PNG
- 大小限制：2MB
- 自动调用 API 上传

```vue
<!-- 使用示例 -->
<el-upload
  :show-file-list="false"
  :before-upload="handleAvatarUpload"
  accept="image/*"
>
  <el-button type="primary">更换头像</el-button>
</el-upload>
```

### 2. 密码修改

**验证规则**:
- 当前密码：必填
- 新密码：必填 + 最少6位
- 确认密码：必填 + 与新密码一致

**成功后自动登出**，需要重新登录

### 3. 游戏记录管理

**筛选功能**:
- 关键词搜索（游戏名称）
- 日期范围筛选
- 实时过滤

**表格功能**:
- 按分数排序
- 按时间排序
- 查看详情
- 删除记录

**分页功能**:
- 每页10/20/50/100条
- 总数统计
- 页码跳转

### 4. 数据统计卡片

**四大核心指标**:
1. 🏆 游戏总局数
2. ⭐ 累计得分
3. 🥇 最高分数
4. ⏱️ 总游戏时长

**游戏排行榜**:
- 显示Top5最常玩的游戏
- 包含游玩次数、最高分、平均分

### 5. 偏好设置

**所有设置实时保存到 localStorage**，刷新页面后保留

```javascript
// 主题设置
settingsStore.theme = 'dark'
settingsStore.saveTheme()

// 音量设置（0-100）
settingsStore.setVolume(80)

// 开关设置
settingsStore.setSoundEnabled(true)
settingsStore.setMusicEnabled(false)
```

---

## 🔧 自定义扩展

### 添加新的设置项

**1. 在 SettingsStore 中添加状态**
```javascript
// src/store/modules/settings.js
state: () => ({
  fontSize: localStorage.getItem('fontSize') || 'medium',
})
```

**2. 添加 Getter 和 Action**
```javascript
getters: {
  currentFontSize: (state) => state.fontSize
},

actions: {
  setFontSize(size) {
    this.fontSize = size
    localStorage.setItem('fontSize', size)
    ElMessage.success('字体大小已更新')
  }
}
```

**3. 在页面中使用**
```vue
<el-form-item label="字体大小">
  <el-select v-model="settingsStore.fontSize" @change="settingsStore.setFontSize">
    <el-option label="小" value="small" />
    <el-option label="中" value="medium" />
    <el-option label="大" value="large" />
  </el-select>
</el-form-item>
```

### 添加新的统计维度

**1. 更新 Mock 数据**
```javascript
// src/mock/user.js
mock.onGet('/user/stats').reply(() => {
  return successResponse({
    // ... 现有统计
    winRate: 0.68,        // 新增：胜率
    consecutiveWins: 12,  // 新增：连胜次数
  })
})
```

**2. 在页面中显示**
```vue
<el-col :span="6">
  <el-card class="stat-card">
    <div class="stat-item">
      <el-icon class="stat-icon" color="#67c23a"><Check /></el-icon>
      <div class="stat-info">
        <p class="stat-value">{{ (userStats.winRate * 100).toFixed(1) }}%</p>
        <p class="stat-label">胜率</p>
      </div>
    </div>
  </el-card>
</el-col>
```

---

## 📱 响应式设计

页面已经适配不同屏幕尺寸：

- **桌面端**: 侧边导航 + 主内容区
- **平板**: 自适应布局
- **移动端**: 建议隐藏侧边栏，使用顶部Tab切换

---

## 🐛 常见问题

### 1. 数据没有保存？
- 检查是否登录（需要Token）
- 检查 Mock 是否正确启用（.env.development）
- 查看浏览器控制台是否有错误

### 2. 游戏记录显示空白？
- Mock 数据中已经包含100条记录
- 检查 `gameStore.gameHistory` 是否有数据
- 尝试调用 `gameStore.fetchGameHistory()`

### 3. 设置没有保留？
- 设置存储在 localStorage 中
- 检查浏览器是否禁用了 localStorage
- 清除浏览器缓存后需要重新设置

### 4. 头像上传失败？
- 检查文件大小（<2MB）
- 检查文件格式（JPG/PNG）
- Mock 会返回随机头像URL

---

## 📚 相关文档

- **Store使用指南**: `src/store/README.md`
- **API文档**: `README_API.md`
- **完整使用说明**: `USAGE.md`
- **快速参考**: `QUICK_REFERENCE.md`

---

## 🎉 完成了什么

✅ **完整的用户设置页面** - 5个功能模块
✅ **数据持久化** - LocalStorage + Store
✅ **Mock数据完善** - 100条游戏记录
✅ **表单验证** - 完整的输入验证
✅ **实时更新** - 数据变化即时反映
✅ **响应式设计** - 适配多种屏幕
✅ **用户体验优化** - 加载状态、错误提示、确认对话框

现在您可以访问 `http://localhost:5173/user/settings` 体验完整的用户设置功能！🎊
