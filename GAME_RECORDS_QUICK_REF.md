# 游戏记录 API 快速参考

## 📦 导入

```javascript
import { useGameStore } from '@/store'
const gameStore = useGameStore()
```

---

## 🔍 查询记录

### 基础查询
```javascript
await gameStore.fetchGameHistory({
  page: 1,
  pageSize: 10
})
```

### 按游戏筛选
```javascript
await gameStore.fetchGameHistory({
  gameId: 1
})
```

### 按日期筛选
```javascript
await gameStore.fetchGameHistory({
  startDate: '2024-01-01',
  endDate: '2024-12-31'
})
```

### 按分数筛选
```javascript
await gameStore.fetchGameHistory({
  minScore: 5000,
  maxScore: 10000
})
```

### 关键词搜索
```javascript
await gameStore.fetchGameHistory({
  keyword: '宝石'
})
```

### 组合筛选
```javascript
await gameStore.fetchGameHistory({
  page: 1,
  pageSize: 10,
  gameId: 1,
  startDate: '2024-01-01',
  endDate: '2024-12-31',
  minScore: 5000,
  maxScore: 10000,
  keyword: '宝石'
})
```

---

## ➕ 新增记录

### 基础新增
```javascript
await gameStore.addGameRecord({
  gameId: 1,
  score: 8888
})
```

### 完整新增
```javascript
await gameStore.addGameRecord({
  gameId: 1,
  score: 8888,
  playTime: 1200,
  playDate: new Date().toISOString(),
  ranking: 5,
  remark: '今天发挥不错！'
})
```

---

## ✏️ 更新记录

```javascript
await gameStore.updateGameRecord(recordId, {
  score: 9999,
  remark: '更新备注'
})
```

---

## 🗑️ 删除记录

### 单个删除
```javascript
await gameStore.deleteGameRecord(recordId)
```

### 批量删除
```javascript
await gameStore.batchDeleteGameRecords([1, 2, 3, 4, 5])
```

---

## 👁️ 查看详情

```javascript
const detail = await gameStore.fetchGameRecordDetail(recordId)
```

---

## 📊 访问数据

### 记录列表
```javascript
const records = gameStore.gameHistory
```

### 总记录数
```javascript
const total = gameStore.gameHistoryTotal
```

### 统计数据
```javascript
const stats = gameStore.gameStats
// {
//   totalPlayed: 156,
//   totalScore: 98560,
//   highestScore: 9999
// }
```

### 游戏选项
```javascript
const options = gameStore.gameOptions
// [
//   { value: 1, label: '迷宫探险', icon: '🧩' },
//   { value: 2, label: '数字华容道', icon: '🔢' },
//   ...
// ]
```

---

## 🎯 完整示例

```vue
<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useGameStore } from '@/store'
import { ElMessageBox } from 'element-plus'

const gameStore = useGameStore()

// 分页
const pagination = reactive({
  page: 1,
  pageSize: 10
})

// 筛选条件
const filters = reactive({
  gameId: null,
  startDate: null,
  endDate: null,
  minScore: null,
  maxScore: null,
  keyword: ''
})

// 加载记录
const loadRecords = async () => {
  await gameStore.fetchGameHistory({
    ...pagination,
    ...filters
  })
}

// 新增
const handleAdd = async () => {
  await gameStore.addGameRecord({
    gameId: 1,
    score: 8888,
    playTime: 1200,
    playDate: new Date().toISOString(),
    remark: '测试记录'
  })
  await loadRecords()
}

// 编辑
const handleEdit = async (recordId) => {
  await gameStore.updateGameRecord(recordId, {
    score: 9999,
    remark: '更新备注'
  })
  await loadRecords()
}

// 删除
const handleDelete = async (recordId) => {
  await ElMessageBox.confirm('确定要删除吗？', '提示', {
    type: 'warning'
  })
  await gameStore.deleteGameRecord(recordId)
  await loadRecords()
}

// 批量删除
const handleBatchDelete = async (ids) => {
  await ElMessageBox.confirm(
    `确定要删除 ${ids.length} 条记录吗？`,
    '批量删除',
    { type: 'warning' }
  )
  await gameStore.batchDeleteGameRecords(ids)
  await loadRecords()
}

onMounted(() => {
  loadRecords()
})
</script>
```

---

## 📝 数据结构

### 记录对象
```typescript
{
  id: number              // 记录ID
  gameId: number          // 游戏ID
  gameName: string        // 游戏名称
  gameIcon: string        // 游戏图标
  score: number           // 分数
  playTime: number        // 游玩时长（秒）
  ranking?: number        // 排名
  playDate: string        // 游玩日期（ISO格式）
  createTime: string      // 创建时间
  updateTime?: string     // 更新时间
  remark?: string         // 备注
}
```

### 查询参数
```typescript
{
  page: number            // 页码
  pageSize: number        // 每页数量
  gameId?: number         // 游戏ID
  startDate?: string      // 开始日期
  endDate?: string        // 结束日期
  minScore?: number       // 最低分数
  maxScore?: number       // 最高分数
  keyword?: string        // 关键词
}
```

---

## ⚡ 快捷操作

### 获取最新10条记录
```javascript
await gameStore.fetchGameHistory({ page: 1, pageSize: 10 })
```

### 获取某个游戏的所有记录
```javascript
await gameStore.fetchGameHistory({ gameId: 1, pageSize: 999 })
```

### 获取今天的记录
```javascript
const today = new Date().toISOString().split('T')[0]
await gameStore.fetchGameHistory({
  startDate: today,
  endDate: today
})
```

### 获取高分记录（>8000分）
```javascript
await gameStore.fetchGameHistory({ minScore: 8000 })
```

### 清空所有记录（慎用）
```javascript
const allIds = gameStore.gameHistory.map(r => r.id)
await gameStore.batchDeleteGameRecords(allIds)
```

---

## 🎨 UI 组件推荐

### 表格
```vue
<el-table :data="gameStore.gameHistory">
  <el-table-column prop="id" label="ID" />
  <el-table-column prop="gameName" label="游戏" />
  <el-table-column prop="score" label="分数" />
  <el-table-column prop="playDate" label="日期" />
</el-table>
```

### 分页
```vue
<el-pagination
  v-model:current-page="pagination.page"
  v-model:page-size="pagination.pageSize"
  :total="gameStore.gameHistoryTotal"
  @current-change="loadRecords"
  @size-change="loadRecords"
/>
```

### 筛选
```vue
<el-select v-model="filters.gameId">
  <el-option
    v-for="game in gameStore.gameOptions"
    :key="game.value"
    :label="game.label"
    :value="game.value"
  />
</el-select>
```

---

## 💡 最佳实践

1. **使用分页** - 避免一次加载过多数据
2. **合理筛选** - 使用筛选条件减少数据量
3. **批量操作** - 需要删除多条时使用批量删除
4. **错误处理** - 使用 try-catch 捕获异常
5. **二次确认** - 删除操作前确认

---

## 🔗 相关文档

- [完整指南](./GAME_RECORDS_CRUD.md)
- [功能总结](./GAME_RECORDS_SUMMARY.md)
- [测试指南](./TEST_GAME_RECORDS.md)
- [更新日志](./CHANGELOG_GAME_RECORDS.md)

---

**最后更新**: 2025-11-13
