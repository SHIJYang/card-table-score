<template>
  <div class="common-layout">
    <el-container>
      <el-main style="padding: 0">
        <div class="score-system">
          <el-row :gutter="24">
            <el-col :span="24">
              <el-card class="main-card animate__animated animate__fadeInLeft">
                <template #header>
                  <div class="card-header">
                    <div class="title">
                      <el-icon><Trophy /></el-icon>
                      <span>🏆 欢乐计分板</span>
                    </div>
                    <div class="add-player-form">
                      <el-input
                        v-model="newPlayerName"
                        placeholder="新玩家名字"
                        size="small"
                        class="cartoon-input"
                        @keyup.enter="handleAddPlayer"
                      />
                      <el-button type="primary" @click="handleAddPlayer" class="cartoon-btn-small">
                        + 新增
                      </el-button>
                    </div>
                  </div>
                </template>
                
                <el-empty v-if="players.length === 0" description="还没人来玩呢~" :image-size="120">
                    <el-button type="primary" class="cartoon-btn" @click="newPlayerName='玩家1';handleAddPlayer()">添加示例</el-button>
                </el-empty>

                <div v-else class="players-list">
                    <div v-for="(player, index) in players" :key="index" class="player-card">
                        <div class="player-info">
                            <div class="rank-num">#{{ index + 1 }}</div>
                            <div class="name-section">
                                <span v-if="!player.isEditing" class="name-text">{{ player.name }}</span>
                                <el-input v-else v-model="player.editingName" size="small" class="edit-input" />
                                <div class="edit-actions">
                                    <el-button v-if="!player.isEditing" link @click="startEditName(player)"><el-icon><Edit /></el-icon></el-button>
                                    <template v-else>
                                        <el-button link type="success" @click="finishEditName(player)"><el-icon><Check /></el-icon></el-button>
                                        <el-button link type="danger" @click="cancelEditName(player)"><el-icon><Close /></el-icon></el-button>
                                    </template>
                                </div>
                            </div>
                        </div>
                        
                        <div class="score-display" :class="getScoreClass(player.score)">
                            {{ player.score }}
                        </div>

                        <div class="control-panel">
                            <el-button class="cartoon-icon-btn minus" @click="minusScore(player)">-</el-button>
                            <el-input-number v-model="player.scoreInput" :min="1" :max="100" size="small" :controls="false" class="step-input" />
                            <el-button class="cartoon-icon-btn plus" @click="addScore(player)">+</el-button>
                            <el-button type="danger" circle plain size="small" @click="removePlayer(index)" class="delete-btn"><el-icon><Delete /></el-icon></el-button>
                        </div>
                    </div>
                </div>

                <div v-if="players.length > 0" class="score-summary cartoon-box">
                  <div class="summary-item">
                    <span class="label">🌟 总分:</span>
                    <span class="value">{{ totalScore }}</span>
                  </div>
                  <div class="summary-item">
                    <span class="label">🥇 冠军:</span>
                    <span class="value highlight">{{ highestScore.name }} ({{ highestScore.score }})</span>
                  </div>
                </div>
              </el-card>

              <el-card class="history-card" style="margin-top: 24px">
                <template #header>
                    <div class="card-header" @click="toggleHistory" style="cursor: pointer">
                        <div class="title"><el-icon><Timer /></el-icon> 📝 历史记录</div>
                        <el-icon><component :is="isHistoryCollapsed ? 'ArrowDown' : 'ArrowUp'" /></el-icon>
                    </div>
                </template>
                <div v-show="!isHistoryCollapsed" class="history-content">
                    <div v-for="(record, index) in history" :key="index" class="history-row">
                        <span class="time">{{ record.time.split(' ')[1] }}</span>
                        <span class="content">{{ record.content }}</span>
                    </div>
                </div>
              </el-card>
            </el-col>
          </el-row>
        </div>
      </el-main>
    </el-container>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from "vue";
import { Plus, Minus, Trophy, Timer, Edit, Delete, Check, Close, ArrowUp, ArrowDown } from "@element-plus/icons-vue";
import { ElMessage, ElMessageBox } from "element-plus";

const players = ref([{ name: "玩家1", score: 0, scoreInput: 10, isEditing: false, editingName: "" }]);
const history = ref([]);
const newPlayerName = ref("");
const isHistoryCollapsed = ref(false);

const toggleHistory = () => { isHistoryCollapsed.value = !isHistoryCollapsed.value; };
const loadData = () => {
  try {
    const saved = localStorage.getItem("scoreData");
    if (saved) {
      const data = JSON.parse(saved);
      if (data.players) players.value = data.players.map(p => ({...p, scoreInput: Number(p.scoreInput) || 10, isEditing: false}));
      if (data.history) history.value = data.history;
    }
  } catch (error) {}
};
const saveData = () => {
    localStorage.setItem("scoreData", JSON.stringify({ players: players.value.map(({isEditing, editingName, ...r}) => r), history: history.value }));
};

const handleAddPlayer = () => {
  if (!newPlayerName.value.trim()) return ElMessage.warning("名字不能为空哦");
  players.value.push({ name: newPlayerName.value, score: 0, scoreInput: 10, isEditing: false, editingName: "" });
  addHistory(`🎉 欢迎新朋友 ${newPlayerName.value}`);
  newPlayerName.value = ""; saveData();
};

const addScore = (p) => { p.score += p.scoreInput; addHistory(`${p.name} 加了 ${p.scoreInput} 分! 🚀`); saveData(); };
const minusScore = (p) => { p.score -= p.scoreInput; addHistory(`${p.name} 扣了 ${p.scoreInput} 分... 😢`); saveData(); };
const startEditName = (p) => { p.editingName = p.name; p.isEditing = true; };
const finishEditName = (p) => { if(p.editingName) { p.name = p.editingName; p.isEditing = false; saveData(); } };
const cancelEditName = (p) => { p.isEditing = false; };
const removePlayer = (i) => { players.value.splice(i, 1); saveData(); };
const addHistory = (content) => history.value.unshift({ time: new Date().toLocaleString(), content });

const totalScore = computed(() => players.value.reduce((t, p) => t + p.score, 0));
const highestScore = computed(() => players.value.reduce((h, p) => p.score > h.score ? p : h, players.value[0] || {name:'-', score:0}));
const getScoreClass = (s) => s > 0 ? 'pos' : s < 0 ? 'neg' : 'zero';

onMounted(loadData);
</script>

<style scoped>
.score-system { width: 100%; max-width: 800px; margin: 0 auto; }
.main-card, .history-card {
  border: 4px solid var(--border-color);
  border-radius: var(--border-radius);
  box-shadow: 6px 6px 0px 0px rgba(0,0,0,0.1);
  background: var(--bg-secondary);
  overflow: visible;
}
.card-header { display: flex; justify-content: space-between; align-items: center; }
.title { font-size: 1.2rem; font-weight: 900; color: var(--text-color); display: flex; align-items: center; gap: 8px; }

.add-player-form { display: flex; gap: 8px; }
.cartoon-input :deep(.el-input__wrapper) {
    border: 2px solid var(--border-color);
    border-radius: 8px;
    box-shadow: none;
}
.cartoon-btn-small {
    border: 2px solid var(--border-color);
    font-weight: bold;
    box-shadow: 2px 2px 0 0 rgba(0,0,0,0.2);
}
.cartoon-btn-small:active { transform: translate(1px, 1px); box-shadow: none; }

.players-list { display: flex; flex-direction: column; gap: 12px; margin-top: 10px; }
.player-card {
    display: flex; align-items: center; justify-content: space-between;
    padding: 12px;
    background: var(--bg-primary);
    border: 2px solid var(--border-color);
    border-radius: 12px;
    transition: transform 0.2s;
}
.player-card:hover { transform: scale(1.01); }

.player-info { display: flex; align-items: center; gap: 10px; flex: 1; }
.rank-num {
    width: 24px; height: 24px; background: var(--border-color); color: white;
    border-radius: 50%; text-align: center; line-height: 24px; font-weight: bold; font-size: 12px;
}
.name-text { font-weight: bold; font-size: 1.1rem; }

.score-display {
    font-family: 'Courier New', monospace;
    font-size: 1.5rem; font-weight: 900;
    width: 80px; text-align: center;
}
.score-display.pos { color: var(--success-color); }
.score-display.neg { color: var(--danger-color); }
.score-display.zero { color: var(--text-color-light); }

.control-panel { display: flex; align-items: center; gap: 8px; }
.cartoon-icon-btn {
    width: 32px; height: 32px; border-radius: 50%; border: 2px solid var(--border-color);
    font-weight: bold; cursor: pointer; display: flex; align-items: center; justify-content: center;
    transition: all 0.1s;
}
.cartoon-icon-btn:active { transform: scale(0.9); }
.cartoon-icon-btn.plus { background: var(--success-color); color: white; }
.cartoon-icon-btn.minus { background: var(--warning-color); color: var(--text-color); }
.step-input { width: 50px; }
.delete-btn { margin-left: 10px; }

.score-summary {
    margin-top: 20px; padding: 15px;
    background: var(--selectBg);
    border: 2px dashed var(--border-color);
    border-radius: 12px;
    display: flex; gap: 20px; justify-content: center;
}
.summary-item { font-size: 1.1rem; }
.highlight { font-weight: 900; color: var(--primary-color); }

.history-row {
    padding: 8px 0; border-bottom: 1px solid var(--border-color-extra-light);
    display: flex; gap: 10px; font-size: 0.9rem;
}
.history-row .time { color: var(--text-color-secondary); font-family: monospace; }
</style>