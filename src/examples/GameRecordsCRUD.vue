<template>
  <div class="game-records-crud-demo">
    <el-card header="游戏记录增删改查示例">
      <el-space direction="vertical" :size="20" style="width: 100%">
        <!-- 操作按钮区 -->
        <el-card shadow="never">
          <template #header>
            <span>操作演示</span>
          </template>
          <el-space wrap>
            <el-button type="primary" @click="handleAddRecord">
              <el-icon><Plus /></el-icon>
              新增记录
            </el-button>
            <el-button type="success" @click="handleQueryRecords">
              <el-icon><Search /></el-icon>
              查询记录
            </el-button>
            <el-button type="warning" @click="handleAdvancedQuery">
              <el-icon><Filter /></el-icon>
              高级筛选
            </el-button>
            <el-button
              type="danger"
              :disabled="selectedIds.length === 0"
              @click="handleBatchDelete"
            >
              <el-icon><Delete /></el-icon>
              批量删除 ({{ selectedIds.length }})
            </el-button>
          </el-space>
        </el-card>

        <!-- 统计信息 -->
        <el-card shadow="never">
          <template #header>
            <span>统计信息</span>
          </template>
          <el-descriptions :column="4" border>
            <el-descriptions-item label="总记录数">
              {{ gameStore.gameHistoryTotal }}
            </el-descriptions-item>
            <el-descriptions-item label="总游玩次数">
              {{ gameStore.gameStats.totalPlayed }}
            </el-descriptions-item>
            <el-descriptions-item label="总分数">
              {{ gameStore.gameStats.totalScore }}
            </el-descriptions-item>
            <el-descriptions-item label="最高分">
              {{ gameStore.gameStats.highestScore }}
            </el-descriptions-item>
          </el-descriptions>
        </el-card>

        <!-- 数据表格 -->
        <el-card shadow="never">
          <template #header>
            <span>游戏记录列表</span>
          </template>
          
          <el-table
            v-loading="loading"
            :data="gameStore.gameHistory"
            stripe
            border
            @selection-change="handleSelectionChange"
          >
            <el-table-column type="selection" width="55" />
            <el-table-column prop="id" label="ID" width="80" />
            <el-table-column label="游戏" width="200">
              <template #default="{ row }">
                <el-space>
                  <span style="font-size: 20px">{{ row.gameIcon }}</span>
                  <span>{{ row.gameName }}</span>
                </el-space>
              </template>
            </el-table-column>
            <el-table-column prop="score" label="分数" width="120" sortable>
              <template #default="{ row }">
                <el-tag type="success">{{ row.score }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="playTime" label="时长" width="120">
              <template #default="{ row }">
                {{ formatPlayTime(row.playTime) }}
              </template>
            </el-table-column>
            <el-table-column prop="playDate" label="游玩日期" width="180" sortable>
              <template #default="{ row }">
                {{ formatDate(row.playDate) }}
              </template>
            </el-table-column>
            <el-table-column prop="remark" label="备注" show-overflow-tooltip />
            <el-table-column label="操作" width="250" fixed="right">
              <template #default="{ row }">
                <el-button size="small" @click="handleViewDetail(row)">
                  查看
                </el-button>
                <el-button size="small" type="primary" @click="handleEditRecord(row)">
                  编辑
                </el-button>
                <el-button size="small" type="danger" @click="handleDeleteRecord(row.id)">
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
            :page-sizes="[5, 10, 20, 50]"
            layout="total, sizes, prev, pager, next, jumper"
            style="margin-top: 20px; justify-content: center"
            @current-change="loadRecords"
            @size-change="loadRecords"
          />
        </el-card>

        <!-- 日志输出 -->
        <el-card shadow="never">
          <template #header>
            <el-space>
              <span>操作日志</span>
              <el-button size="small" @click="logs = []">清空</el-button>
            </el-space>
          </template>
          <div class="logs-container">
            <div v-for="(log, index) in logs" :key="index" class="log-item">
              <el-tag :type="log.type" size="small">{{ log.time }}</el-tag>
              <span>{{ log.message }}</span>
            </div>
            <el-empty v-if="logs.length === 0" description="暂无日志" />
          </div>
        </el-card>
      </el-space>
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
              :label="`${game.icon} ${game.label}`"
              :value="game.value"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="分数" required>
          <el-input-number v-model="formData.score" :min="0" :max="99999" />
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

    <!-- 详情对话框 -->
    <el-dialog v-model="detailVisible" title="记录详情" width="500px">
      <el-descriptions v-if="currentDetail" :column="1" border>
        <el-descriptions-item label="ID">{{ currentDetail.id }}</el-descriptions-item>
        <el-descriptions-item label="游戏">
          {{ currentDetail.gameIcon }} {{ currentDetail.gameName }}
        </el-descriptions-item>
        <el-descriptions-item label="分数">
          <el-tag type="success" size="large">{{ currentDetail.score }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="游玩时长">
          {{ formatPlayTime(currentDetail.playTime) }}
        </el-descriptions-item>
        <el-descriptions-item label="排名">
          {{ currentDetail.ranking || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="游玩日期">
          {{ formatDate(currentDetail.playDate) }}
        </el-descriptions-item>
        <el-descriptions-item label="创建时间">
          {{ currentDetail.createTime }}
        </el-descriptions-item>
        <el-descriptions-item label="备注">
          {{ currentDetail.remark || '-' }}
        </el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useGameStore } from '@/store'
import { ElMessageBox, ElMessage } from 'element-plus'
import { Plus, Search, Filter, Delete } from '@element-plus/icons-vue'

const gameStore = useGameStore()

// 加载状态
const loading = ref(false)

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

// 详情对话框
const detailVisible = ref(false)
const currentDetail = ref(null)

// 表单数据
const formData = reactive({
  gameId: null,
  score: 0,
  playTime: 0,
  playDate: new Date(),
  ranking: null,
  remark: ''
})

// 日志
const logs = ref([])

// 添加日志
const addLog = (message, type = 'info') => {
  logs.value.unshift({
    time: new Date().toLocaleTimeString(),
    message,
    type
  })
  if (logs.value.length > 50) {
    logs.value.pop()
  }
}

// 加载记录
const loadRecords = async () => {
  loading.value = true
  addLog('开始加载游戏记录...', 'info')
  
  try {
    await gameStore.fetchGameHistory({
      page: pagination.page,
      pageSize: pagination.pageSize
    })
    addLog(`成功加载 ${gameStore.gameHistory.length} 条记录`, 'success')
  } catch (error) {
    addLog('加载记录失败: ' + error.message, 'danger')
  } finally {
    loading.value = false
  }
}

// 查询记录
const handleQueryRecords = async () => {
  addLog('执行基础查询...', 'info')
  await loadRecords()
}

// 高级筛选
const handleAdvancedQuery = async () => {
  loading.value = true
  addLog('执行高级筛选查询...', 'warning')
  
  try {
    await gameStore.fetchGameHistory({
      page: 1,
      pageSize: 10,
      gameId: 1, // 筛选第一个游戏
      minScore: 5000,
      maxScore: 10000
    })
    addLog(`高级筛选完成，找到 ${gameStore.gameHistory.length} 条记录`, 'success')
  } catch (error) {
    addLog('高级筛选失败: ' + error.message, 'danger')
  } finally {
    loading.value = false
  }
}

// 选择变化
const handleSelectionChange = (selection) => {
  selectedIds.value = selection.map(item => item.id)
  addLog(`已选择 ${selectedIds.value.length} 条记录`, 'info')
}

// 新增记录
const handleAddRecord = () => {
  isEdit.value = false
  dialogTitle.value = '新增记录'
  Object.assign(formData, {
    gameId: gameStore.gameOptions[0]?.value || null,
    score: Math.floor(Math.random() * 5000) + 5000,
    playTime: Math.floor(Math.random() * 1800) + 300,
    playDate: new Date(),
    ranking: Math.floor(Math.random() * 100) + 1,
    remark: '这是一条测试记录'
  })
  dialogVisible.value = true
  addLog('打开新增记录对话框', 'info')
}

// 编辑记录
const handleEditRecord = (row) => {
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
  addLog(`打开编辑对话框 - 记录ID: ${row.id}`, 'info')
}

// 查看详情
const handleViewDetail = async (row) => {
  addLog(`查看记录详情 - ID: ${row.id}`, 'info')
  currentDetail.value = await gameStore.fetchGameRecordDetail(row.id)
  detailVisible.value = true
}

// 提交表单
const handleSubmit = async () => {
  if (isEdit.value) {
    // 更新
    addLog(`更新记录 - ID: ${currentRecordId.value}`, 'warning')
    const success = await gameStore.updateGameRecord(currentRecordId.value, formData)
    if (success) {
      dialogVisible.value = false
      addLog('记录更新成功', 'success')
      await loadRecords()
    }
  } else {
    // 新增
    addLog('新增游戏记录...', 'primary')
    const record = await gameStore.addGameRecord({
      ...formData,
      playDate: formData.playDate.toISOString()
    })
    if (record) {
      dialogVisible.value = false
      addLog(`记录添加成功 - ID: ${record.id}`, 'success')
      await loadRecords()
    }
  }
}

// 删除记录
const handleDeleteRecord = async (id) => {
  try {
    await ElMessageBox.confirm('确定要删除这条记录吗？', '提示', {
      type: 'warning'
    })
    
    addLog(`删除记录 - ID: ${id}`, 'warning')
    await gameStore.deleteGameRecord(id)
    addLog('记录删除成功', 'success')
    await loadRecords()
  } catch (error) {
    if (error !== 'cancel') {
      addLog('删除失败: ' + error.message, 'danger')
    }
  }
}

// 批量删除
const handleBatchDelete = async () => {
  try {
    await ElMessageBox.confirm(
      `确定要删除选中的 ${selectedIds.value.length} 条记录吗？`,
      '批量删除',
      { type: 'warning' }
    )
    
    addLog(`批量删除 ${selectedIds.value.length} 条记录...`, 'warning')
    await gameStore.batchDeleteGameRecords(selectedIds.value)
    addLog('批量删除成功', 'success')
    selectedIds.value = []
    await loadRecords()
  } catch (error) {
    if (error !== 'cancel') {
      addLog('批量删除失败: ' + error.message, 'danger')
    }
  }
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

// 格式化日期
const formatDate = (dateStr) => {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  return date.toLocaleString('zh-CN')
}

onMounted(() => {
  addLog('组件已挂载，开始初始化...', 'primary')
  loadRecords()
})
</script>

<style scoped>
.game-records-crud-demo {
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
}

.logs-container {
  max-height: 300px;
  overflow-y: auto;
  padding: 10px;
  background-color: #f5f7fa;
  border-radius: 4px;
}

.log-item {
  padding: 8px;
  margin-bottom: 8px;
  background-color: white;
  border-radius: 4px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.log-item:last-child {
  margin-bottom: 0;
}
</style>
