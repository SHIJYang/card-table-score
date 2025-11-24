# ⚡ 快速参考手册

## 📦 Store 快速查询

### useUserStore - 用户管理

```javascript
import { useUserStore } from "@/store";
const userStore = useUserStore();

// 登录111
await userStore.login({ username, password });

// 获取用户信息
await userStore.fetchUserInfo();

// 更新用户信息
await userStore.updateUserInfo({ name, email });

// 退出登录
await userStore.logout();

// 读取状态
userStore.userName; // 用户名
userStore.hasLogin; // 是否登录
userStore.userAvatar; // 头像
```

### useGameStore - 游戏管理

```javascript
import { useGameStore } from "@/store";
const gameStore = useGameStore();

// 获取游戏列表
await gameStore.fetchGameList({ page: 1, pageSize: 10 });

// 获取游戏详情
await gameStore.fetchGameDetail(gameId);

// 获取热门游戏
await gameStore.fetchHotGames(6);

// 搜索游戏
await gameStore.searchGames("关键词");

// 收藏游戏
await gameStore.toggleFavorite(gameId);

// 提交分数
await gameStore.submitScore({ gameId, score, playTime });

// 读取状态
gameStore.gameList; // 游戏列表
gameStore.currentGame; // 当前游戏
gameStore.isFavorite(id); // 是否收藏
gameStore.averageScore; // 平均分
```

### useSettingsStore - 设置管理

```javascript
import { useSettingsStore } from "@/store";
const settingsStore = useSettingsStore();

// 切换主题
settingsStore.toggleTheme();

// 设置语言
settingsStore.setLanguage("zh-CN");

// 设置音量
settingsStore.setVolume(80);

// 重置设置
settingsStore.resetSettings();

// 读取状态
settingsStore.theme; // 当前主题
settingsStore.isDarkTheme; // 是否深色
settingsStore.volume; // 音量
```

### useAppStore - 应用状态

```javascript
import { useAppStore } from "@/store";
const appStore = useAppStore();

// 初始化应用
await appStore.init();

// 添加缓存视图
appStore.addCachedView(view);

// 清空缓存
appStore.clearCachedViews();

// 读取状态
appStore.isOnline; // 是否在线
appStore.isMobile; // 是否移动端
appStore.isDesktop; // 是否桌面端
```

---

## 🌐 API 快速查询

### 用户 API

```javascript
import * as userApi from '@/api/user'

userApi.login({ username, password })      // 登录
userApi.register({ username, password })   // 注册
userApi.getUserInfo()                      // 获取用户信息
userApi.updateUserInfo(data)               // 更新用户信息
userApi.changePassword({ old, new })       // 修改密码
userApi.getUserStats()                     // 获取统计
userApi.uploadAvatar(file)                 // 上传头像
userApi.logout()                           // 登出
```

### 游戏 API

```javascript
import * as gameApi from "@/api/game";

gameApi.getGameList({ page, pageSize }); // 游戏列表
gameApi.getGameDetail(id); // 游戏详情
gameApi.getHotGames({ limit }); // 热门游戏
gameApi.getRecommendGames({ limit }); // 推荐游戏
gameApi.searchGames(keyword); // 搜索游戏
gameApi.favoriteGame(id); // 收藏
gameApi.unfavoriteGame(id); // 取消收藏
gameApi.getGameCategories(); // 游戏分类
gameApi.getGamesByCategory(catId, params); // 分类游戏
gameApi.submitGameScore({ gameId, score }); // 提交分数
gameApi.getGameRanking(gameId, params); // 排行榜
gameApi.getGameHistory(params); // 游戏历史
gameApi.deleteGameRecord(recordId); // 删除记录
```

---

## 🔧 请求工具

```javascript
import { request } from "@/utils/request";

// GET 请求
await request.get("/api/endpoint", { params });

// POST 请求
await request.post("/api/endpoint", { data });

// PUT 请求
await request.put("/api/endpoint", { data });

// DELETE 请求
await request.delete("/api/endpoint", { params });

// 上传文件
await request.upload("/api/upload", formData);
```

---

## 📂 文件路径速查

```
src/
├── store/
│   ├── index.js                  # Store 入口
│   └── modules/
│       ├── user.js              # 用户 Store
│       ├── game.js              # 游戏 Store
│       ├── settings.js          # 设置 Store
│       └── app.js               # 应用 Store
├── api/
│   ├── user.js                  # 用户 API
│   └── game.js                  # 游戏 API
├── utils/
│   └── request.js               # 请求封装
└── mock/
    ├── index.js                 # Mock 配置
    ├── user.js                  # 用户 Mock
    └── game.js                  # 游戏 Mock
```

---

## 🎯 常用代码片段

### 完整登录流程

```vue
<script setup>
import { useUserStore } from "@/store";
import { useRouter } from "vue-router";

const userStore = useUserStore();
const router = useRouter();

const login = async () => {
  const success = await userStore.login({
    username: "admin",
    password: "123456",
  });

  if (success) {
    router.push("/");
  }
};
</script>
```

### 获取并显示游戏列表

```vue
<script setup>
import { ref, onMounted } from "vue";
import { useGameStore } from "@/store";

const gameStore = useGameStore();
const games = ref([]);

onMounted(async () => {
  games.value = await gameStore.fetchGameList({
    page: 1,
    pageSize: 10,
  });
});
</script>

<template>
  <div v-for="game in games" :key="game.id">
    {{ game.name }}
  </div>
</template>
```

### 主题切换

```vue
<script setup>
import { useSettingsStore } from "@/store";

const settingsStore = useSettingsStore();
</script>

<template>
  <el-switch
    v-model="settingsStore.isDarkTheme"
    @change="settingsStore.toggleTheme()"
  />
</template>
```

---

## ⚙️ 环境变量

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

---

## 🎭 Mock 数据

### 测试账号

```
用户名: admin 或 user
密码: 123456
```

### 开启/关闭 Mock

```env
# .env.development
VITE_MOCK_ENABLED=true   # 开启
VITE_MOCK_ENABLED=false  # 关闭
```

---

## 📚 文档列表

| 文档                        | 说明                  |
| --------------------------- | --------------------- |
| `STORE_MODULES_COMPLETE.md` | Store 模块化重构总结  |
| `src/store/README.md`       | Store 详细文档        |
| `STORE_API_GUIDE.md`        | Store 和 API 对应指南 |
| `README_API.md`             | API 接口文档          |
| `USAGE.md`                  | 完整使用指南          |
| `QUICK_REFERENCE.md`        | 本文档 - 快速参考     |

---

## 🔗 示例页面

```
http://localhost:5173/examples/quickstart  # 快速开始
http://localhost:5173/examples/store       # Store 示例
http://localhost:5173/examples/api         # API 示例
```

---

**保存此文档作为日常开发参考！** 📌
