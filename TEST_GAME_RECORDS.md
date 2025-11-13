# 游戏记录功能测试指南

## 🧪 测试清单

### 1. 查询功能测试

#### 基础查询
```javascript
// 在浏览器控制台执行
import { useGameStore } from '@/store'
const gameStore = useGameStore()

// 测试基础查询
await gameStore.fetchGameHistory({ page: 1, pageSize: 10 })
console.log('查询结果:', gameStore.gameHistory)
console.log('总数:', gameStore.gameHistoryTotal)
```

#### 高级筛选测试
```javascript
// 按游戏ID筛选
await gameStore.fetchGameHistory({ gameId: 1 })

// 按日期范围筛选
await gameStore.fetchGameHistory({
  startDate: '2024-01-01',
  endDate: '2024-12-31'
})

// 按分数范围筛选
await gameStore.fetchGameHistory({
  minScore: 5000,
  maxScore: 10000
})

// 组合筛选
await gameStore.fetchGameHistory({
  gameId: 1,
  minScore: 5000,
  startDate: '2024-01-01'
})
```

### 2. 新增功能测试

```javascript
// 测试新增记录
const newRecord = await gameStore.addGameRecord({
  gameId: 1,
  score: 8888,
  playTime: 1200,
  playDate: new Date().toISOString(),
  remark: '测试记录'
})

console.log('新增记录:', newRecord)
console.log('统计更新:', gameStore.gameStats)
```

### 3. 更新功能测试

```javascript
// 获取第一条记录的ID
const recordId = gameStore.gameHistory[0]?.id

// 测试更新
if (recordId) {
  await gameStore.updateGameRecord(recordId, {
    score: 9999,
    remark: '更新后的备注'
  })
  
  console.log('更新后的记录:', gameStore.gameHistory[0])
}
```

### 4. 删除功能测试

```javascript
// 单个删除
const recordId = gameStore.gameHistory[0]?.id
if (recordId) {
  await gameStore.deleteGameRecord(recordId)
  console.log('删除后总数:', gameStore.gameHistoryTotal)
}

// 批量删除
const ids = gameStore.gameHistory.slice(0, 3).map(r => r.id)
await gameStore.batchDeleteGameRecords(ids)
console.log('批量删除后总数:', gameStore.gameHistoryTotal)
```

### 5. 详情查询测试

```javascript
const recordId = gameStore.gameHistory[0]?.id
if (recordId) {
  const detail = await gameStore.fetchGameRecordDetail(recordId)
  console.log('记录详情:', detail)
}
```

---

## 🎯 UI 测试步骤

### 方式一：使用演示组件

1. 启动开发服务器
```bash
npm run dev
```

2. 在路由中添加演示页面（如果还没有）
```javascript
// src/router/index.js
{
  path: '/examples/game-records-crud',
  name: 'GameRecordsCRUD',
  component: () => import('@/examples/GameRecordsCRUD.vue')
}
```

3. 访问 `http://localhost:5173/examples/game-records-crud`

4. 测试以下功能：
   - ✅ 点击"新增记录"按钮
   - ✅ 填写表单并提交
   - ✅ 查看记录列表是否更新
   - ✅ 点击"编辑"按钮修改记录
   - ✅ 点击"删除"按钮删除记录
   - ✅ 选择多条记录进行批量删除
   - ✅ 使用高级筛选功能
   - ✅ 查看操作日志

### 方式二：在现有页面测试

在 `UserSettings.vue` 的游戏记录标签页中测试：

1. 访问 `/user/settings`
2. 切换到"游戏记录"标签
3. 测试筛选、删除等功能

---

## 📊 预期结果

### 新增记录
- ✅ 记录成功添加到列表顶部
- ✅ 总记录数 +1
- ✅ 统计数据更新（总游玩次数、总分数）
- ✅ 显示成功提示消息

### 更新记录
- ✅ 记录数据成功更新
- ✅ 列表中对应记录刷新
- ✅ 显示成功提示消息

### 删除记录
- ✅ 记录从列表中移除
- ✅ 总记录数 -1
- ✅ 统计数据更新
- ✅ 显示成功提示消息

### 批量删除
- ✅ 所有选中记录被删除
- ✅ 总记录数减少相应数量
- ✅ 显示删除数量提示

### 高级筛选
- ✅ 按条件正确筛选记录
- ✅ 分页正确显示
- ✅ 筛选结果准确

---

## 🐛 常见问题排查

### 问题1: 记录不显示

**检查项**:
1. Mock 是否启用？检查 `.env` 文件中 `VITE_MOCK_ENABLED=true`
2. 是否调用了 `fetchGameHistory()`？
3. 检查浏览器控制台是否有错误

**解决方案**:
```javascript
// 手动加载记录
await gameStore.fetchGameHistory({ page: 1, pageSize: 10 })
```

### 问题2: 新增失败

**检查项**:
1. 是否选择了游戏？
2. 分数是否有效？
3. 检查网络请求是否成功

**解决方案**:
```javascript
// 检查表单数据
console.log('表单数据:', formData)

// 检查游戏选项
console.log('游戏选项:', gameStore.gameOptions)
```

### 问题3: 统计数据不更新

**检查项**:
1. 是否使用了 Store 的方法？
2. 是否直接修改了数组？

**解决方案**:
```javascript
// 正确方式：使用 Store 方法
await gameStore.addGameRecord(data)

// 错误方式：直接修改
// gameStore.gameHistory.push(data) ❌
```

### 问题4: 批量删除不工作

**检查项**:
1. 是否选中了记录？
2. 检查 `selectedIds` 是否有值

**解决方案**:
```javascript
// 检查选中的ID
console.log('选中的ID:', selectedIds.value)

// 确保使用了 @selection-change
<el-table @selection-change="handleSelectionChange">
```

---

## 🔍 调试技巧

### 1. 查看 Store 状态

```javascript
import { useGameStore } from '@/store'
const gameStore = useGameStore()

// 查看所有记录
console.log('游戏记录:', gameStore.gameHistory)

// 查看统计
console.log('统计数据:', gameStore.gameStats)

// 查看总数
console.log('总记录数:', gameStore.gameHistoryTotal)
```

### 2. 监听 API 请求

打开浏览器开发者工具 -> Network 标签，筛选 XHR 请求：

- `GET /game/history` - 查询记录
- `POST /game/history` - 新增记录
- `PUT /game/history/:id` - 更新记录
- `DELETE /game/history/:id` - 删除记录
- `POST /game/history/batch-delete` - 批量删除

### 3. 查看 Mock 数据

```javascript
// 在控制台查看 Mock 数据
import { mockGameHistory } from '@/mock/game'
console.log('Mock 游戏记录:', mockGameHistory)
```

---

## ✅ 测试通过标准

所有以下功能都应正常工作：

- [x] 基础查询（分页）
- [x] 高级筛选（游戏、日期、分数、关键词）
- [x] 新增记录
- [x] 更新记录
- [x] 删除记录
- [x] 批量删除
- [x] 查看详情
- [x] 统计数据自动更新
- [x] 错误提示正常显示
- [x] 加载状态正常显示

---

## 📝 测试报告模板

```markdown
## 测试报告

**测试日期**: 2025-11-13
**测试人员**: [你的名字]
**测试环境**: Chrome / Firefox / Safari

### 功能测试结果

| 功能 | 状态 | 备注 |
|------|------|------|
| 基础查询 | ✅ / ❌ | |
| 高级筛选 | ✅ / ❌ | |
| 新增记录 | ✅ / ❌ | |
| 更新记录 | ✅ / ❌ | |
| 删除记录 | ✅ / ❌ | |
| 批量删除 | ✅ / ❌ | |
| 查看详情 | ✅ / ❌ | |
| 统计更新 | ✅ / ❌ | |

### 发现的问题

1. [问题描述]
2. [问题描述]

### 建议

1. [改进建议]
2. [改进建议]
```

---

## 🚀 性能测试

### 大数据量测试

```javascript
// 生成大量测试数据
const generateTestRecords = async (count) => {
  for (let i = 0; i < count; i++) {
    await gameStore.addGameRecord({
      gameId: Math.floor(Math.random() * 6) + 1,
      score: Math.floor(Math.random() * 10000),
      playTime: Math.floor(Math.random() * 3600),
      playDate: new Date().toISOString(),
      remark: `测试记录 ${i + 1}`
    })
  }
}

// 测试 100 条记录
await generateTestRecords(100)
```

### 筛选性能测试

```javascript
// 测试复杂筛选
console.time('高级筛选')
await gameStore.fetchGameHistory({
  gameId: 1,
  startDate: '2024-01-01',
  endDate: '2024-12-31',
  minScore: 5000,
  maxScore: 10000
})
console.timeEnd('高级筛选')
```

---

**祝测试顺利！** 🎉
