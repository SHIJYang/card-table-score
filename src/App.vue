<template>
  <div class="app-container">
    <el-container>
      <el-header class="animate__animated animate__fadeIn">
        <div class="header-content">
          <h1><span class="logo-icon">🎲</span> 牌桌计分系统</h1>
          <el-button type="success" plain round @click="resetGame" class="animate__animated animate__pulse animate__infinite animate__slower">
            <el-icon><Plus /></el-icon>新建游戏
          </el-button>
        </div>
      </el-header>
      <el-main>
        <el-row :gutter="24">
          <el-col :span="24">
            <el-card class="main-card animate__animated animate__fadeInLeft">
              <template #header>
                <div class="card-header">
                  <div class="title">
                    <el-icon><Trophy /></el-icon>
                    <span>计分板</span>
                  </div>
                  <div class="add-player-form">
                    <el-input 
                      v-model="newPlayerName" 
                      placeholder="输入玩家昵称" 
                      size="small"
                      @keyup.enter="handleAddPlayer"
                      class="player-input"
                    >
                      <template #prefix>
                        <el-icon><User /></el-icon>
                      </template>
                    </el-input>
                    <el-button type="primary" @click="handleAddPlayer" class="add-btn">
                      <el-icon><Plus /></el-icon>新增玩家
                    </el-button>
                  </div>
                </div>
              </template>
              <div v-if="players.length === 0" class="empty-state">
                <el-empty description="暂无玩家，请添加玩家开始游戏" :image-size="120">
                  <el-button type="primary" @click="newPlayerName = '玩家1'; handleAddPlayer()">添加示例玩家</el-button>
                </el-empty>
              </div>
              <el-table 
                v-else
                :data="players"
                :stripe="true"
                :border="true"
                class="custom-table">
                <el-table-column label="玩家名称" width="220">
                  <template #default="scope">
                    <div class="player-name" v-if="!scope.row.isEditing">
                      <el-avatar :size="28" :src="scope.row.avatar">
                        {{ scope.row.name.charAt(0) }}
                      </el-avatar>
                      <span class="player-name-text">{{ scope.row.name }}</span>
                      <div class="player-actions">
                        <el-button type="primary" link @click="startEditName(scope.row)">
                          <el-icon><Edit /></el-icon>
                        </el-button>
                        <el-button type="danger" link @click="removePlayer(scope.$index)">
                          <el-icon><Delete /></el-icon>
                        </el-button>
                      </div>
                    </div>
                    <div class="player-name-edit" v-else>
                      <el-input 
                        v-model="scope.row.editingName" 
                        size="small"
                        @keyup.enter="finishEditName(scope.row)"
                      />
                      <el-button type="success" link @click="finishEditName(scope.row)">
                        <el-icon><Check /></el-icon>
                      </el-button>
                      <el-button type="danger" link @click="cancelEditName(scope.row)">
                        <el-icon><Close /></el-icon>
                      </el-button>
                    </div>
                  </template>
                </el-table-column>
                <el-table-column prop="score" label="当前分数" width="100">
                  <template #default="scope">
                    <span :class="{'score-positive': scope.row.score > 0, 'score-negative': scope.row.score < 0, 'score-zero': scope.row.score === 0}">
                      {{ scope.row.score }}
                    </span>
                  </template>
                </el-table-column>
                <el-table-column label="操作" min-width="220">
                  <template #default="scope">
                    <div class="button-group">
                      <el-input-number 
                        v-model="scope.row.scoreInput" 
                        :min="1"
                        :max="100"
                        size="small"
                        class="score-input"
                        controls-position="right"
                      />
                      <div class="score-actions">
                        <el-button type="primary" size="small" @click="addScore(scope.row)" class="score-btn">
                          <el-icon><Plus /></el-icon>加分
                        </el-button>
                        <el-button type="danger" size="small" @click="minusScore(scope.row)" class="score-btn">
                          <el-icon><Minus /></el-icon>减分
                        </el-button>
                      </div>
                    </div>
                  </template>
                </el-table-column>
              </el-table>
              <div v-if="players.length > 0" class="score-summary">
                <div class="summary-item">
                  <span class="label">总分：</span>
                  <span class="value">{{ totalScore }}</span>
                </div>
                <div class="summary-item">
                  <span class="label">最高分：</span>
                  <span class="value">{{ highestScore.score }}</span>
                  <span class="player">({{ highestScore.name }})</span>
                </div>
                <div class="summary-item">
                  <span class="label">最低分：</span>
                  <span class="value">{{ lowestScore.score }}</span>
                  <span class="player">({{ lowestScore.name }})</span>
                </div>
              </div>
            </el-card>
            <el-card class="history-card animate__animated animate__fadeInLeft" style="margin-top: 24px;">
              <template #header>
                <div class="card-header">
                  <div class="title">
                    <el-icon><Timer /></el-icon>
                    <span>历史记录</span>
                  </div>
                  <div class="header-actions">
                    <el-button type="info" text @click="handleClearHistory">
                      清空记录
                    </el-button>
                    <el-button type="primary" link @click="toggleHistory">
                      <el-icon><component :is="isHistoryCollapsed ? 'ArrowDown' : 'ArrowUp'" /></el-icon>
                      {{ isHistoryCollapsed ? '展开' : '收起' }}
                    </el-button>
                  </div>
                </div>
              </template>
              <el-collapse-transition>
                <div v-show="!isHistoryCollapsed">
                  <div v-if="history.length <= 1" class="empty-state">
                    <el-empty description="暂无历史记录" :image-size="80"></el-empty>
                  </div>
                  <el-timeline v-else>
                    <el-timeline-item
                      v-for="(record, index) in history"
                      :key="index"
                      :type="record.type"
                      :timestamp="record.time"
                      :hollow="true">
                      <div class="timeline-content">
                        {{ record.content }}
                      </div>
                    </el-timeline-item>
                  </el-timeline>
                </div>
              </el-collapse-transition>
            </el-card>
          </el-col>
        </el-row>
      </el-main>
      <el-footer class="app-footer">
        <div>牌桌计分系统 &copy; {{ new Date().getFullYear() }}</div>
      </el-footer>
    </el-container>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { Plus, Minus, Trophy, Timer, User, Edit, Delete, Check, Close, ArrowUp, ArrowDown } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import 'animate.css/animate.min.css'

// 初始化数据
const players = ref([
  { name: '玩家1', score: 0, scoreInput: 10, avatar: '', isEditing: false, editingName: '' },
  { name: '玩家2', score: 0, scoreInput: 10, avatar: '', isEditing: false, editingName: '' },
])

const history = ref([
  { time: new Date().toLocaleString(), content: '游戏开始', type: 'primary' }
])

// 新玩家名称
const newPlayerName = ref('')

// 历史记录收起状态
const isHistoryCollapsed = ref(false)

// 切换历史记录显示状态
const toggleHistory = () => {
  isHistoryCollapsed.value = !isHistoryCollapsed.value
}

// 从本地存储加载数据
const loadData = () => {
  try {
    const saved = localStorage.getItem('scoreData');
    if (saved) {
      const data = JSON.parse(saved);
      // 确保每个玩家都有scoreInput属性
      if (data.players && Array.isArray(data.players)) {
        data.players.forEach(player => {
          if (!player.scoreInput) {
            player.scoreInput = 10;
          }
          // 添加编辑状态属性
          player.isEditing = false;
          player.editingName = '';
        });
        players.value = data.players;
      }
      
      if (data.history && Array.isArray(data.history)) {
        history.value = data.history;
      }
    }
  } catch (error) {
    console.error('加载数据失败:', error);
    // 出错时使用默认数据
  }
}

// 保存数据到本地存储
const saveData = () => {
  try {
    // 移除临时编辑状态属性再保存
    const playersToSave = players.value.map(player => {
      const { isEditing, editingName, ...rest } = player;
      return rest;
    });
    
    localStorage.setItem('scoreData', JSON.stringify({
      players: playersToSave,
      history: history.value
    }));
  } catch (error) {
    console.error('保存数据失败:', error);
  }
}

const handleAddPlayer = () => {
  if (!newPlayerName.value.trim()) {
    ElMessage.warning('玩家昵称不能为空');
    return;
  }
  
  // 检查昵称是否重复
  const nameExists = players.value.some(player => player.name === newPlayerName.value);
  if (nameExists) {
    ElMessage.warning('玩家昵称已存在');
    return;
  }
  
  const newPlayer = {
    name: newPlayerName.value,
    score: 0,
    scoreInput: 10,
    avatar: '',
    isEditing: false,
    editingName: ''
  };
  
  players.value.push(newPlayer);
  history.value.unshift({
    time: new Date().toLocaleString(),
    content: `新增玩家 ${newPlayer.name}`,
    type: 'info'
  });
  
  saveData();
  newPlayerName.value = ''; // 重置输入框
}

const startEditName = (player) => {
  // 先关闭其他正在编辑的行
  players.value.forEach(p => {
    if (p !== player && p.isEditing) {
      p.isEditing = false;
      p.editingName = '';
    }
  });
  
  player.editingName = player.name;
  player.isEditing = true;
}

const finishEditName = (player) => {
  if (!player.editingName.trim()) {
    ElMessage.warning('玩家昵称不能为空');
    return;
  }
  
  // 检查昵称是否重复（排除自己）
  const nameExists = players.value.some(p => 
    p !== player && p.name === player.editingName
  );
  
  if (nameExists) {
    ElMessage.warning('玩家昵称已存在');
    return;
  }
  
  const oldName = player.name;
  player.name = player.editingName;
  player.isEditing = false;
  
  if (oldName !== player.name) {
    history.value.unshift({
      time: new Date().toLocaleString(),
      content: `玩家 ${oldName} 改名为 ${player.name}`,
      type: 'info'
    });
    saveData();
  }
}

const cancelEditName = (player) => {
  player.isEditing = false;
  player.editingName = '';
}

const removePlayer = (index) => {
  ElMessageBox.confirm(
    `确定要删除玩家 ${players.value[index].name} 吗？`,
    '提示',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    }
  )
    .then(() => {
      const removedPlayer = players.value[index];
      players.value.splice(index, 1);
      
      history.value.unshift({
        time: new Date().toLocaleString(),
        content: `删除玩家 ${removedPlayer.name}`,
        type: 'warning'
      });
      
      saveData();
      ElMessage({
        type: 'success',
        message: '删除成功',
      });
    })
    .catch(() => {
      // 取消删除
    });
}

const resetGame = () => {
  ElMessageBox.confirm(
    '确定要重置游戏吗？所有玩家分数将清零。',
    '提示',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    }
  )
    .then(() => {
      // 保留玩家，但重置分数
      players.value.forEach(player => {
        player.score = 0;
      });
      
      history.value = [
        { time: new Date().toLocaleString(), content: '游戏重置', type: 'warning' }
      ];
      
      saveData();
      ElMessage({
        type: 'success',
        message: '游戏已重置',
      });
    })
    .catch(() => {
      // 取消重置
    });
}

const handleClearHistory = () => {
  ElMessageBox.confirm(
    '确定要清空历史记录吗？',
    '提示',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    }
  )
    .then(() => {
      history.value = [
        { time: new Date().toLocaleString(), content: '历史记录已清空', type: 'info' }
      ];
      saveData();
      ElMessage({
        type: 'success',
        message: '历史记录已清空',
      });
    })
    .catch(() => {
      // 取消清空
    });
}

// 组件挂载时加载数据
onMounted(loadData);

const addScore = (player) => {
  if (!player.scoreInput) {
    player.scoreInput = 10; // 确保有默认值
  }
  player.score += player.scoreInput;
  history.value.unshift({
    time: new Date().toLocaleString(),
    content: `${player.name} 加分 ${player.scoreInput}`,
    type: 'success'
  });
  saveData();
}

const minusScore = (player) => {
  if (!player.scoreInput) {
    player.scoreInput = 10; // 确保有默认值
  }
  player.score -= player.scoreInput;
  history.value.unshift({
    time: new Date().toLocaleString(),
    content: `${player.name} 减分 ${player.scoreInput}`,
    type: 'danger'
  });
  saveData();
}

// 计算属性
const totalScore = computed(() => {
  if (players.value.length === 0) return 0;
  return players.value.reduce((total, player) => total + player.score, 0);
});

const highestScore = computed(() => {
  if (players.value.length === 0) return { name: '无', score: 0 };
  return players.value.reduce((highest, player) => {
    if (player.score > highest.score) {
      return { name: player.name, score: player.score };
    }
    return highest;
  }, { name: players.value[0].name, score: players.value[0].score });
});

const lowestScore = computed(() => {
  if (players.value.length === 0) return { name: '无', score: 0 };
  return players.value.reduce((lowest, player) => {
    if (player.score < lowest.score) {
      return { name: player.name, score: player.score };
    }
    return lowest;
  }, { name: players.value[0].name, score: players.value[0].score });
});
</script>

<style>
@import url('https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@400;500;700&display=swap');

:root {
  --primary-color: #409EFF;
  --success-color: #67c23a;
  --warning-color: #e6a23c;
  --danger-color: #f56c6c;
  --info-color: #909399;
  --text-color: #303133;
  --text-color-secondary: #606266;
  --border-radius: 8px;
  --box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  --box-shadow-hover: 0 6px 16px rgba(0, 0, 0, 0.08);
  --transition-duration: 0.3s;
}

.app-container {
  height: 100vh;
  width: 100vw;
  font-family: 'Noto Sans SC', sans-serif;
  background: linear-gradient(135deg, #f5f7fa 0%, #e4e7ed 100%);
  overflow: auto;
}

.el-header {
  background: linear-gradient(135deg, #409EFF 0%, #36cfc9 100%);
  color: white;
  padding: 0 24px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-content {
  max-width: 1200px;
  margin: 0 auto;
  height: 60px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-content h1 {
  margin: 0;
  font-size: 24px;
  font-weight: 500;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  gap: 8px;
}

.logo-icon {
  font-size: 28px;
  animation: spin 10s linear infinite;
  display: inline-block;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.el-main {
  padding: 24px;
  max-width: 1200px;
  margin: 0 auto;
}

.main-card, .history-card {
  border-radius: var(--border-radius);
  box-shadow: var(--box-shadow);
  transition: all var(--transition-duration) ease;
  overflow: hidden;
  border: none;
}

.main-card:hover, .history-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--box-shadow-hover);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #ebeef5;
  background-color: #fafafa;
}

.card-header .title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 500;
  color: var(--text-color);
}

.card-header .title .el-icon {
  font-size: 18px;
  color: var(--primary-color);
}

.add-player-form {
  display: flex;
  align-items: center;
  gap: 8px;
}

.player-input {
  width: 150px;
  transition: all var(--transition-duration) ease;
}

.player-input:focus {
  width: 180px;
}

.add-btn {
  transition: all 0.3s ease;
}

.add-btn:hover {
  transform: scale(1.05);
}

.player-name {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 180px;
}

.player-name-text {
  flex: 1;
  min-width: 80px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.player-actions {
  display: flex;
  gap: 4px;
  margin-left: auto;
  flex-shrink: 0;
}

.player-actions .el-button {
  padding: 4px;
}

.player-actions .el-button:hover {
  transform: scale(1.1);
}

.player-name-edit {
  display: flex;
  align-items: center;
  gap: 8px;
}

.custom-table {
  margin-top: 12px;
  border-radius: var(--border-radius);
  overflow: hidden;
}

.el-table th {
  background-color: #f5f7fa !important;
  font-weight: 500;
  color: var(--text-color);
}

.el-table--striped .el-table__body tr.el-table__row--striped td {
  background-color: #fafafa;
}

.el-table td, .el-table th {
  padding: 12px 0;
}

.button-group {
  display: flex;
  gap: 8px;
  align-items: center;
  flex-wrap: nowrap;
  min-width: 240px;
}

.score-input {
  width: 70px;
  flex-shrink: 0;
}

.score-actions {
  display: flex;
  gap: 4px;
  flex-shrink: 0;
}

.score-btn {
  padding: 6px 8px;
  min-width: 60px;
  font-size: 13px;
}

.delete-btn {
  padding: 6px 8px !important;
  background-color: var(--danger-color) !important;
  color: white !important;
  border-radius: 4px !important;
  flex-shrink: 0;
  transition: all 0.2s ease;
  border: none !important;
  min-width: 60px;
}

.delete-btn:hover {
  background-color: #ff4d4f !important;
  transform: scale(1.05);
}

.delete-btn .el-icon {
  margin-right: 4px;
}

.score-positive {
  color: var(--success-color);
  font-weight: 500;
}

.score-negative {
  color: var(--danger-color);
  font-weight: 500;
}

.score-zero {
  color: var(--info-color);
  font-weight: 500;
}

.timeline-content {
  font-size: 14px;
  color: var(--text-color-secondary);
  padding: 8px 12px;
  background-color: #f9f9f9;
  border-radius: var(--border-radius);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.el-timeline-item {
  padding-bottom: 20px;
}

.el-timeline-item__timestamp {
  font-size: 12px;
  color: var(--info-color);
}

.el-timeline-item__node--primary {
  background-color: var(--primary-color);
}

.el-timeline-item__node--success {
  background-color: var(--success-color);
}

.el-timeline-item__node--warning {
  background-color: var(--warning-color);
}

.el-timeline-item__node--danger {
  background-color: var(--danger-color);
}

.el-timeline-item__node--info {
  background-color: var(--info-color);
}

.el-avatar {
  background: linear-gradient(135deg, var(--primary-color) 0%, #36cfc9 100%);
  color: white;
  font-weight: 500;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.el-button {
  border-radius: 4px;
  transition: all 0.2s ease;
}

.el-button:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.el-button--primary {
  background: linear-gradient(135deg, #409EFF 0%, #3a8ee6 100%);
  border-color: #3a8ee6;
}

.el-button--danger {
  background: linear-gradient(135deg, #f56c6c 0%, #e64242 100%);
  border-color: #e64242;
}

.el-button--success {
  background: linear-gradient(135deg, #67c23a 0%, #5daf34 100%);
  border-color: #5daf34;
}

.empty-state {
  padding: 40px 0;
  text-align: center;
}

.score-summary {
  margin-top: 20px;
  padding: 16px;
  background-color: #f9f9f9;
  border-radius: var(--border-radius);
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
}

.summary-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.summary-item .label {
  font-weight: 500;
  color: var(--text-color);
}

.summary-item .value {
  font-size: 18px;
  font-weight: 700;
  color: var(--primary-color);
}

.summary-item .player {
  font-size: 14px;
  color: var(--text-color-secondary);
}

.app-footer {
  text-align: center;
  color: var(--text-color-secondary);
  font-size: 12px;
  padding: 16px 0;
  background-color: #f5f7fa;
  border-top: 1px solid #ebeef5;
}

/* 添加响应式设计 */
@media (max-width: 768px) {
  .el-row {
    flex-direction: column;
  }
  
  .el-col {
    width: 100% !important;
    margin-bottom: 16px;
  }

  .el-table {
    width: 100%;
    overflow-x: auto;
  }
  
  .history-card {
    margin-top: 16px;
  }
  
  .button-group {
    min-width: 220px;
    gap: 4px;
  }
  
  .score-input {
    width: 60px;
  }
  
  .score-btn {
    padding: 4px 6px;
    min-width: 55px;
    font-size: 12px;
  }

  .delete-btn {
    padding: 4px 8px !important;
    min-width: 55px;
  }
}

@media (max-width: 480px) {
  .button-group {
    min-width: 200px;
    gap: 2px;
  }
  
  .score-input {
    width: 50px;
  }
  
  .score-btn {
    padding: 4px;
    min-width: 50px;
    font-size: 12px;
  }
  
  .delete-btn {
    padding: 4px 6px !important;
    min-width: 50px;
  }
}

/* 添加动画效果 */
.animate__animated {
  animation-duration: 0.8s;
}

.el-table__row {
  transition: all 0.3s ease;
}

.el-table__row:hover {
  transform: translateY(-2px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  z-index: 1;
  position: relative;
}

/* 自定义滚动条 */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb {
  background: #c0c4cc;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: #909399;
}

.header-actions {
  display: flex;
  gap: 8px;
  align-items: center;
}

.el-collapse-transition {
  transition: 0.3s height ease-in-out, 0.3s padding-top ease-in-out, 0.3s padding-bottom ease-in-out;
}
</style>