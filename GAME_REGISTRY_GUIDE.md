# 游戏注册表使用指南

## 📋 概述

游戏Store已经重构为集中化配置管理，所有游戏配置都在`GAME_REGISTRY`中统一管理。添加新游戏变得非常简单！

## 🎮 快速添加新游戏

### 方式一：在注册表中直接添加（推荐）

编辑 `src/store/modules/game.js`，在 `GAME_REGISTRY` 数组中添加配置：

```javascript
export const GAME_REGISTRY = [
  // ... 现有游戏 ...
  
  // 添加新游戏
  {
    id: 7,                          // 必填：唯一ID
    name: '俄罗斯方块',              // 必填：游戏名称
    icon: '🧱',                     // 可选：游戏图标（Emoji或图片URL）
    category: 'puzzle',             // 可选：分类ID
    categoryName: '益智游戏',        // 可选：分类名称
    description: '经典俄罗斯方块',   // 可选：游戏描述
    difficulty: 'medium',           // 可选：难度 (easy/medium/hard)
    tags: ['单人', '益智', '经典'],  // 可选：标签
    route: '/game/tetris',          // 可选：游戏路由
    component: 'TetrisGame',        // 可选：游戏组件名
    enabled: true,                  // 可选：是否启用（默认true）
  },
]
```

### 方式二：动态注册（运行时）

在代码中使用store方法注册：

```javascript
import { useGameStore } from '@/store'

const gameStore = useGameStore()

// 注册单个游戏
gameStore.registerGame({
  id: 8,
  name: '连连看',
  icon: '🎴',
  category: 'puzzle',
  description: '经典连连看游戏',
  difficulty: 'easy',
})

// 批量注册游戏
gameStore.registerGames([
  {
    id: 9,
    name: '扫雷',
    icon: '💣',
    category: 'puzzle',
  },
  {
    id: 10,
    name: '贪吃蛇',
    icon: '🐍',
    category: 'action',
  },
])
```

## 📖 游戏配置字段说明

| 字段 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| `id` | Number | ✅ | - | 游戏唯一标识符，不能重复 |
| `name` | String | ✅ | - | 游戏显示名称 |
| `icon` | String | ❌ | '🎮' | 游戏图标（Emoji或图片URL） |
| `category` | String | ❌ | 'casual' | 游戏分类ID |
| `categoryName` | String | ❌ | '休闲游戏' | 分类显示名称 |
| `description` | String | ❌ | '' | 游戏描述 |
| `difficulty` | String | ❌ | 'medium' | 难度等级（easy/medium/hard） |
| `tags` | Array | ❌ | [] | 游戏标签 |
| `route` | String | ❌ | - | 游戏页面路由 |
| `component` | String | ❌ | - | 游戏组件名称 |
| `enabled` | Boolean | ❌ | true | 是否启用 |

## 🔧 Store提供的API

### Getters（查询方法）

```javascript
const gameStore = useGameStore()

// 获取所有已启用的游戏
const games = gameStore.enabledGames

// 根据ID获取游戏
const game = gameStore.getGameById(1)

// 根据分类获取游戏列表
const puzzleGames = gameStore.getGamesByCategory('puzzle')

// 获取所有分类及游戏数量
const categories = gameStore.categoriesWithCount
// 返回: [{ id: 'puzzle', name: '益智游戏', count: 4, ... }]

// 获取游戏选项（用于下拉框）
const options = gameStore.gameOptions
// 返回: [{ value: 1, label: '迷宫探险', icon: '🧩' }]

// 获取每个游戏的统计数据
const statsMap = gameStore.gameStatsMap
// 返回: { 1: { gameId: 1, playCount: 10, bestScore: 1000, ... } }

// 获取Top游戏（按游玩次数）
const topGames = gameStore.topGamesByPlayCount(5)
```

### Actions（操作方法）

```javascript
// 注册新游戏
gameStore.registerGame({ id: 7, name: '新游戏' })

// 批量注册
gameStore.registerGames([...])

// 更新游戏配置
gameStore.updateGameConfig(1, { name: '迷宫探险Pro' })

// 启用/禁用游戏
gameStore.toggleGameEnabled(1, false)

// 移除游戏（慎用）
gameStore.removeGame(1)
```

## 💡 使用示例

### 示例1：在组件中显示游戏列表

```vue
<template>
  <el-select v-model="selectedGame" placeholder="选择游戏">
    <el-option
      v-for="game in gameStore.enabledGames"
      :key="game.id"
      :label="game.name"
      :value="game.id"
    >
      <span>{{ game.icon }} {{ game.name }}</span>
    </el-option>
  </el-select>
</template>

<script setup>
import { ref } from 'vue'
import { useGameStore } from '@/store'

const gameStore = useGameStore()
const selectedGame = ref(null)
</script>
```

### 示例2：按分类显示游戏

```vue
<template>
  <div v-for="category in gameStore.categoriesWithCount" :key="category.id">
    <h3>{{ category.icon }} {{ category.name }} ({{ category.count }})</h3>
    <div class="game-grid">
      <div
        v-for="game in gameStore.getGamesByCategory(category.id)"
        :key="game.id"
        class="game-card"
      >
        <span>{{ game.icon }}</span>
        <span>{{ game.name }}</span>
      </div>
    </div>
  </div>
</template>
```

### 示例3：显示游戏统计

```vue
<template>
  <el-table :data="gameStats">
    <el-table-column label="游戏" prop="gameName">
      <template #default="{ row }">
        {{ row.gameIcon }} {{ row.gameName }}
      </template>
    </el-table-column>
    <el-table-column label="游玩次数" prop="playCount" />
    <el-table-column label="最高分" prop="bestScore" />
    <el-table-column label="平均分" prop="avgScore" />
  </el-table>
</template>

<script setup>
import { computed } from 'vue'
import { useGameStore } from '@/store'

const gameStore = useGameStore()
const gameStats = computed(() => Object.values(gameStore.gameStatsMap))
</script>
```

## 🎯 添加新游戏的完整流程

假设要添加"五子棋"游戏：

### 1️⃣ 在注册表中添加配置

```javascript
// src/store/modules/game.js
export const GAME_REGISTRY = [
  // ... 现有游戏 ...
  {
    id: 7,
    name: '五子棋',
    icon: '⚫',
    category: 'strategy',
    categoryName: '策略游戏',
    description: '两人对弈，五子连珠获胜',
    difficulty: 'medium',
    tags: ['双人', '策略', '棋类'],
    route: '/game/gomoku',
    component: 'GomokuGame',
    enabled: true,
  },
]
```

### 2️⃣ 创建游戏组件（可选）

```javascript
// src/views/games/GomokuGame.vue
<template>
  <div class="gomoku-game">
    <!-- 游戏逻辑 -->
  </div>
</template>
```

### 3️⃣ 添加路由（可选）

```javascript
// src/router/index.js
{
  path: '/game/gomoku',
  name: 'GomokuGame',
  component: () => import('@/views/games/GomokuGame.vue'),
}
```

### 4️⃣ 完成！

现在"五子棋"会自动出现在：
- ✅ 游戏列表下拉框
- ✅ 用户设置的游戏筛选器
- ✅ 游戏分类统计
- ✅ 所有使用`gameStore.enabledGames`的地方

## 🔄 游戏分类管理

### 添加新分类

编辑 `GAME_CATEGORIES`：

```javascript
export const GAME_CATEGORIES = [
  // ... 现有分类 ...
  {
    id: 'sports',
    name: '体育竞技',
    icon: '⚽',
    description: '体育类竞技游戏',
  },
]
```

## ⚠️ 注意事项

1. **游戏ID必须唯一**：添加新游戏前检查ID是否已被使用
2. **分类ID要匹配**：确保`category`字段对应`GAME_CATEGORIES`中的某个分类
3. **谨慎移除游戏**：如果已有游戏记录，移除游戏可能导致数据不一致
4. **启用/禁用优于删除**：使用`enabled: false`隐藏游戏而不是删除

## 🚀 高级技巧

### 动态加载游戏配置

如果游戏配置需要从服务器加载：

```javascript
// 在应用启动时加载
const gameStore = useGameStore()

async function loadGameConfigs() {
  const response = await fetch('/api/games/config')
  const configs = await response.json()
  gameStore.registerGames(configs)
}

loadGameConfigs()
```

### 游戏版本管理

```javascript
{
  id: 7,
  name: '五子棋',
  version: '2.0.0',
  updateLog: ['增加AI对手', '优化UI'],
  // ...
}
```

## 📞 相关文件

- 游戏Store：`src/store/modules/game.js`
- 用户设置页面：`src/views/UserSettings.vue`
- Mock数据：`src/mock/game.js`
- API接口：`src/api/game.js`
