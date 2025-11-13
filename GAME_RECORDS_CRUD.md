# 游戏记录增删改查完整指南

## 📋 功能概览

游戏记录管理系统现已支持完整的 CRUD 操作：

- ✅ **新增记录** - 添加新的游戏记录
- ✅ **查询记录** - 支持分页、筛选、搜索
- ✅ **更新记录** - 编辑已有记录
- ✅ **删除记录** - 单个删除或批量删除
- ✅ **高级筛选** - 按游戏、日期、分数范围筛选

---

## 🎯 API 接口

### 1. 查询游戏记录

```javascript
import { getGameHistory } from '@/api/game'

// 基础查询
const records = await getGameHistory({
  page: 1,
  pageSize: 10
})

// 高级筛选
const filteredRecords = await getGameHistory({
  page: 1,
  pageSize: 10,
  gameId: 1,              // 按游戏ID筛选
  startDate: '2024-01-01', // 开始日期
  endDate: '2024-12-31',   // 结束日期
  minScore: 5000,          // 最低分数
  maxScore: 10000,         // 最高分数
  keyword: '宝石'          // 关键词搜索
})
```

### 2. 新增游戏记录

```javascript
import { addGameRecord } from '@/api/game'

const newRecord = await addGameRecord({
  gameId: 1,                    // 必填：游戏ID
  score: 8888,                  // 必填：分数
  playTime: 1200,               // 可选：游玩时长（秒）
  playDate: '2024-01-15',       // 可选：游玩日期
  ranking: 5,                   // 可选：排名
  remark: '今天发挥不错！'      // 可选：备注
})
```

### 3. 更新游戏记录

```javascript
import { updateGameRecord } from '@/api/game'

const updated = await updateGameRecord(recordId, {
  score: 9999,
  remark: '更新备注'
})
```

### 4. 删除游戏记录

```javascript
import { deleteGameRecord, batchDeleteGameRecords } from '@/api/game'

// 单个删除
await deleteGameRecord(recordId)

// 批量删除
await batchDeleteGameRecords([1, 2, 3, 4, 5])
```

### 5. 获取记录详情

```javascript
import { getGameRecordDetail } from '@/api/game'

const detail = await getGameRecordDetail(recordId)
```

---

## 🏪 Store 使用

### 1. 查询记录

```vue
<script setup>
import { useGameStore } from '@/store'

const gameStore = useGameStore()

// 基础查询
await gameStore.fetchGameHistory({
  page: 1,
  pageSize: 10
})

// 高级筛选
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

// 访问数据
const records = gameStore.gameHistory
const total = gameStore.gameHistoryTotal
</script>
```

### 2. 新增记录

```vue
<script setup>
import { useGameStore } from '@/store'

const gameStore = useGameStore()

const handleAddRecord = async () => {
  const newRecord = await gameStore.addGameRecord({
    gameId: 1,
    score: 8888,
    playTime: 1200,
    playDate: new Date().toISOString(),
    remark: '今天发挥不错！'
  })
  
  if (newRecord) {
    console.log('添加成功', newRecord)
  }
}
</script>
```

### 3. 更新记录

```vue
<script setup>
import { useGameStore } from '@/store'

const gameStore = useGameStore()

const handleUpdateRecord = async (recordId) => {
  const success = await gameStore.updateGameRecord(recordId, {
    score: 9999,
    remark: '更新备注'
  })
  
  if (success) {
    console.log('更新成功')
  }
}
</script>
```

### 4. 删除记录

```vue
<script setup>
import { useGameStore } from '@/store'
import { ElMessageBox } from 'element-plus'

const gameStore = useGameStore()

// 单个删除
const handleDelete = async (recordId) => {
  await ElMessageBox.confirm('确定要删除这条记录吗？', '提示', {
    type: 'warning'
  })
  
  await gameStore.deleteGameRecord(recordId)
}

// 批量删除
const handleBatchDelete = async (selectedIds) => {
  await ElMessageBox.confirm(
    `确定要删除选中的 ${selectedIds.length} 条记录吗？`,
    '批量删除',
    { type: 'warning' }
  )
  
  await gameStore.batchDeleteGameRecords(selectedIds)
}
</script>
```

### 5. 获取记录详情

```vue
<script setup>
import { useGameStore } from '@/store'

const gameStore = useGameStore()

const handleViewDetail = async (recordId) => {
  const detail = await gameStore.fetchGameRecordDetail(recordId)
  console.log('记录详情', detail)
}
</script>
```

---

## 📝 完整示例：游戏记录管理页面

```vue
<template>
  <div class="game-records-manager">
    <!-- 筛选区域 -->
    <el-card class="filter-card">
      <el-form :inline="true" :model="filters">
        <el-form-item label="游戏">
          <el-select v-model="filters.gameId" placeholder="选择游戏" clearable>
            <el-option
              v-for="game in gameStore.gameOptions"
              :key="game.value"
              :label="game.label"
              :value="game.value"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="日期范围">
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            @change="handleDateChange"
          />
        </el-form-item>

        <el-form-item label="分数范围">
          <el-input-number v-model="filters.minScore" placeholder="最低分" />
          <span style="margin: 0 10px">-</span>
          <el-input-number v-model="filters.maxScore" placeholder="最高分" />
        </el-form-item>

        <el-form-item label="关键词">
          <el-input v-model="filters.keyword" placeholder="搜索游戏名称" clearable />
        </el-form-item>

        <el-form-item>
          <el-button type="primary" @click="handleSearch">搜索</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 操作按钮 -->
    <el-card class="action-card">
      <el-button type="primary" @click="handleAdd">
        <el-icon><Plus /></el-icon>
        新增记录
      </el-button>
      <el-button
        type="danger"
        :disabled="selectedIds.length === 0"
        @click="handleBatchDelete"
      >
        <el-icon><Delete /></el-icon>
        批量删除 ({{ selectedIds.length }})
      </el-button>
    </el-card>

    <!-- 数据表格 -->
    <el-card>
      <el-table
        :data="gameStore.gameHistory"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column label="游戏" width="200">
          <template #default="{ row }">
            <span>{{ row.gameIcon }} {{ row.gameName }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="score" label="分数" width="120" sortable />
        <el-table-column prop="playTime" label="时长" width="120">
          <template #default="{ row }">
            {{ formatPlayTime(row.playTime) }}
          </template>
        </el-table-column>
        <el-table-column prop="playDate" label="游玩日期" width="180" sortable />
        <el-table-column prop="remark" label="备注" />
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="handleView(row)">查看</el-button>
            <el-button size="small" type="primary" @click="handleEdit(row)">
              编辑
            </el-button>
            <el-button size="small" type="danger" @click="handleDelete(row.id)">
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.pageSize"
        :total="gameStore.gameHistoryTotal"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        @current-change="loadRecords"
        @size-change="loadRecords"
      />
    </el-card>

    <!-- 新增/编辑对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="600px"
    >
      <el-form :model="formData" label-width="100px">
        <el-form-item label="游戏" required>
          <el-select v-model="formData.gameId" placeholder="选择游戏">
            <el-option
              v-for="game in gameStore.gameOptions"
              :key="game.value"
              :label="game.label"
              :value="game.value"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="分数" required>
          <el-input-number v-model="formData.score" :min="0" />
        </el-form-item>

        <el-form-item label="游玩时长">
          <el-input-number v-model="formData.playTime" :min="0" />
          <span style="margin-left: 10px">秒</span>
        </el-form-item>

        <el-form-item label="游玩日期">
          <el-date-picker
            v-model="formData.playDate"
            type="datetime"
            placeholder="选择日期时间"
          />
        </el-form-item>

        <el-form-item label="排名">
          <el-input-number v-model="formData.ranking" :min="1" />
        </el-form-item>

        <el-form-item label="备注">
          <el-input
            v-model="formData.remark"
            type="textarea"
            :rows="3"
            placeholder="添加备注信息"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useGameStore } from '@/store'
import { ElMessageBox } from 'element-plus'
import { Plus, Delete } from '@element-plus/icons-vue'

const gameStore = useGameStore()

// 筛选条件
const filters = reactive({
  gameId: null,
  startDate: null,
  endDate: null,
  minScore: null,
  maxScore: null,
  keyword: ''
})

const dateRange = ref([])

// 分页
const pagination = reactive({
  page: 1,
  pageSize: 10
})

// 选中的记录
const selectedIds = ref([])

// 对话框
const dialogVisible = ref(false)
const dialogTitle = ref('新增记录')
const isEdit = ref(false)
const currentRecordId = ref(null)

// 表单数据
const formData = reactive({
  gameId: null,
  score: 0,
  playTime: 0,
  playDate: new Date(),
  ranking: null,
  remark: ''
})

// 加载记录
const loadRecords = async () => {
  await gameStore.fetchGameHistory({
    page: pagination.page,
    pageSize: pagination.pageSize,
    ...filters
  })
}

// 搜索
const handleSearch = () => {
  pagination.page = 1
  loadRecords()
}

// 重置
const handleReset = () => {
  Object.assign(filters, {
    gameId: null,
    startDate: null,
    endDate: null,
    minScore: null,
    maxScore: null,
    keyword: ''
  })
  dateRange.value = []
  handleSearch()
}

// 日期范围变化
const handleDateChange = (value) => {
  if (value && value.length === 2) {
    filters.startDate = value[0]
    filters.endDate = value[1]
  } else {
    filters.startDate = null
    filters.endDate = null
  }
}

// 选择变化
const handleSelectionChange = (selection) => {
  selectedIds.value = selection.map(item => item.id)
}

// 新增
const handleAdd = () => {
  isEdit.value = false
  dialogTitle.value = '新增记录'
  Object.assign(formData, {
    gameId: null,
    score: 0,
    playTime: 0,
    playDate: new Date(),
    ranking: null,
    remark: ''
  })
  dialogVisible.value = true
}

// 编辑
const handleEdit = (row) => {
  isEdit.value = true
  dialogTitle.value = '编辑记录'
  currentRecordId.value = row.id
  Object.assign(formData, {
    gameId: row.gameId,
    score: row.score,
    playTime: row.playTime,
    playDate: new Date(row.playDate),
    ranking: row.ranking,
    remark: row.remark
  })
  dialogVisible.value = true
}

// 查看
const handleView = async (row) => {
  const detail = await gameStore.fetchGameRecordDetail(row.id)
  console.log('记录详情', detail)
  // 可以打开详情对话框
}

// 提交
const handleSubmit = async () => {
  if (isEdit.value) {
    // 更新
    const success = await gameStore.updateGameRecord(currentRecordId.value, formData)
    if (success) {
      dialogVisible.value = false
      loadRecords()
    }
  } else {
    // 新增
    const record = await gameStore.addGameRecord(formData)
    if (record) {
      dialogVisible.value = false
      loadRecords()
    }
  }
}

// 删除
const handleDelete = async (id) => {
  await ElMessageBox.confirm('确定要删除这条记录吗？', '提示', {
    type: 'warning'
  })
  
  await gameStore.deleteGameRecord(id)
  loadRecords()
}

// 批量删除
const handleBatchDelete = async () => {
  await ElMessageBox.confirm(
    `确定要删除选中的 ${selectedIds.value.length} 条记录吗？`,
    '批量删除',
    { type: 'warning' }
  )
  
  await gameStore.batchDeleteGameRecords(selectedIds.value)
  selectedIds.value = []
  loadRecords()
}

// 格式化游玩时长
const formatPlayTime = (seconds) => {
  if (!seconds) return '-'
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60
  
  if (hours > 0) {
    return `${hours}小时${minutes}分${secs}秒`
  } else if (minutes > 0) {
    return `${minutes}分${secs}秒`
  } else {
    return `${secs}秒`
  }
}

onMounted(() => {
  loadRecords()
})
</script>

<style scoped>
.game-records-manager {
  padding: 20px;
}

.filter-card,
.action-card {
  margin-bottom: 20px;
}

.el-pagination {
  margin-top: 20px;
  justify-content: center;
}
</style>
```

---

## 🎨 数据结构

### 游戏记录对象

```typescript
interface GameRecord {
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
interface QueryParams {
  page: number            // 页码
  pageSize: number        // 每页数量
  gameId?: number         // 游戏ID筛选
  startDate?: string      // 开始日期
  endDate?: string        // 结束日期
  minScore?: number       // 最低分数
  maxScore?: number       // 最高分数
  keyword?: string        // 关键词搜索
}
```

---

## 💡 使用建议

1. **分页加载** - 记录较多时使用分页，避免一次加载过多数据
2. **筛选优化** - 合理使用筛选条件，提高查询效率
3. **批量操作** - 需要删除多条记录时使用批量删除
4. **数据验证** - 新增/更新时做好数据验证
5. **错误处理** - 所有操作都有错误提示，注意处理异常情况

---

## 🔧 扩展功能

可以基于现有功能扩展：

- 导出记录为 Excel/CSV
- 记录统计图表展示
- 记录对比功能
- 记录分享功能
- 自动备份功能

---

## 📚 相关文档

- [游戏注册表指南](./GAME_REGISTRY_GUIDE.md)
- [Store API 指南](./STORE_API_GUIDE.md)
- [快速参考](./QUICK_REFERENCE.md)
