<template>
  <div class="game-registry-example">
    <h1>🎮 游戏注册表示例</h1>

    <!-- 示例1：显示所有游戏 -->
    <el-card class="demo-card">
      <template #header>
        <div class="card-header">
          <span>示例1：显示所有已启用的游戏</span>
          <el-tag>{{ gameStore.enabledGames.length }} 个游戏</el-tag>
        </div>
      </template>
      
      <div class="game-grid">
        <div
          v-for="game in gameStore.enabledGames"
          :key="game.id"
          class="game-item"
        >
          <div class="game-icon">{{ game.icon }}</div>
          <div class="game-info">
            <div class="game-name">{{ game.name }}</div>
            <div class="game-category">{{ game.categoryName }}</div>
            <el-tag :type="getDifficultyType(game.difficulty)" size="small">
              {{ game.difficulty }}
            </el-tag>
          </div>
        </div>
      </div>
    </el-card>

    <!-- 示例2：按分类显示游戏 -->
    <el-card class="demo-card">
      <template #header>
        <span>示例2：按分类显示游戏</span>
      </template>
      
      <div
        v-for="category in gameStore.categoriesWithCount"
        :key="category.id"
        class="category-section"
      >
        <h3>
          {{ category.icon }} {{ category.name }}
          <el-tag type="info">{{ category.count }} 个游戏</el-tag>
        </h3>
        <div class="game-list">
          <el-tag
            v-for="game in gameStore.getGamesByCategory(category.id)"
            :key="game.id"
            class="game-tag"
          >
            {{ game.icon }} {{ game.name }}
          </el-tag>
        </div>
      </div>
    </el-card>

    <!-- 示例3：游戏选择器 -->
    <el-card class="demo-card">
      <template #header>
        <span>示例3：游戏选择器</span>
      </template>
      
      <el-form label-width="120px">
        <el-form-item label="选择游戏">
          <el-select v-model="selectedGame" placeholder="请选择游戏" style="width: 300px">
            <el-option
              v-for="game in gameStore.enabledGames"
              :key="game.id"
              :label="game.name"
              :value="game.id"
            >
              <div style="display: flex; align-items: center; gap: 8px">
                <span>{{ game.icon }}</span>
                <span>{{ game.name }}</span>
                <el-tag size="small" :type="getDifficultyType(game.difficulty)">
                  {{ game.difficulty }}
                </el-tag>
              </div>
            </el-option>
          </el-select>
        </el-form-item>
        
        <el-form-item label="已选游戏" v-if="currentGameInfo">
          <el-descriptions :column="2" border>
            <el-descriptions-item label="游戏名称">
              {{ currentGameInfo.icon }} {{ currentGameInfo.name }}
            </el-descriptions-item>
            <el-descriptions-item label="分类">
              {{ currentGameInfo.categoryName }}
            </el-descriptions-item>
            <el-descriptions-item label="难度">
              <el-tag :type="getDifficultyType(currentGameInfo.difficulty)">
                {{ currentGameInfo.difficulty }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="描述" :span="2">
              {{ currentGameInfo.description }}
            </el-descriptions-item>
          </el-descriptions>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 示例4：游戏统计 -->
    <el-card class="demo-card">
      <template #header>
        <span>示例4：游戏统计数据</span>
      </template>
      
      <el-table :data="gameStatsArray" style="width: 100%">
        <el-table-column label="游戏" width="200">
          <template #default="{ row }">
            <div style="display: flex; align-items: center; gap: 8px">
              <span style="font-size: 20px">{{ row.gameIcon }}</span>
              <span>{{ row.gameName }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="playCount" label="游玩次数" width="120" sortable />
        <el-table-column prop="bestScore" label="最高分" width="120" sortable />
        <el-table-column prop="avgScore" label="平均分" width="120" sortable />
        <el-table-column prop="totalTime" label="总时长" width="150">
          <template #default="{ row }">
            {{ formatTime(row.totalTime) }}
          </template>
        </el-table-column>
        <el-table-column label="最后游玩" width="180">
          <template #default="{ row }">
            {{ row.lastPlayDate ? new Date(row.lastPlayDate).toLocaleString() : '未游玩' }}
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 示例5：动态注册新游戏 -->
    <el-card class="demo-card">
      <template #header>
        <span>示例5：动态注册新游戏</span>
      </template>
      
      <el-form :model="newGameForm" label-width="120px">
        <el-form-item label="游戏ID">
          <el-input-number v-model="newGameForm.id" :min="7" />
        </el-form-item>
        <el-form-item label="游戏名称">
          <el-input v-model="newGameForm.name" placeholder="请输入游戏名称" />
        </el-form-item>
        <el-form-item label="游戏图标">
          <el-input v-model="newGameForm.icon" placeholder="输入Emoji，如：🎯" />
        </el-form-item>
        <el-form-item label="分类">
          <el-select v-model="newGameForm.category">
            <el-option
              v-for="cat in gameStore.categoryRegistry"
              :key="cat.id"
              :label="cat.name"
              :value="cat.id"
            >
              {{ cat.icon }} {{ cat.name }}
            </el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="难度">
          <el-radio-group v-model="newGameForm.difficulty">
            <el-radio label="easy">简单</el-radio>
            <el-radio label="medium">中等</el-radio>
            <el-radio label="hard">困难</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="描述">
          <el-input
            v-model="newGameForm.description"
            type="textarea"
            placeholder="请输入游戏描述"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleRegisterGame">
            注册新游戏
          </el-button>
          <el-button @click="resetNewGameForm">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 示例6：管理游戏 -->
    <el-card class="demo-card">
      <template #header>
        <span>示例6：管理游戏（启用/禁用）</span>
      </template>
      
      <el-table :data="gameStore.gameRegistry" style="width: 100%">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column label="游戏" width="200">
          <template #default="{ row }">
            {{ row.icon }} {{ row.name }}
          </template>
        </el-table-column>
        <el-table-column prop="categoryName" label="分类" width="120" />
        <el-table-column prop="difficulty" label="难度" width="100" />
        <el-table-column label="状态" width="120">
          <template #default="{ row }">
            <el-tag :type="row.enabled ? 'success' : 'info'">
              {{ row.enabled ? '已启用' : '已禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150">
          <template #default="{ row }">
            <el-switch
              v-model="row.enabled"
              @change="gameStore.toggleGameEnabled(row.id, row.enabled)"
            />
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useGameStore } from '@/store'

const gameStore = useGameStore()

// 示例3：游戏选择器
const selectedGame = ref(null)
const currentGameInfo = computed(() => {
  return selectedGame.value ? gameStore.getGameById(selectedGame.value) : null
})

// 示例4：游戏统计
const gameStatsArray = computed(() => {
  return Object.values(gameStore.gameStatsMap)
})

// 示例5：动态注册新游戏
const newGameForm = ref({
  id: 7,
  name: '',
  icon: '🎯',
  category: 'puzzle',
  difficulty: 'medium',
  description: '',
})

const handleRegisterGame = () => {
  const success = gameStore.registerGame({
    ...newGameForm.value,
    categoryName: gameStore.categoryRegistry.find(c => c.id === newGameForm.value.category)?.name,
    enabled: true,
  })
  
  if (success) {
    resetNewGameForm()
  }
}

const resetNewGameForm = () => {
  newGameForm.value = {
    id: gameStore.gameRegistry.length + 1,
    name: '',
    icon: '🎯',
    category: 'puzzle',
    difficulty: 'medium',
    description: '',
  }
}

// 工具方法
const getDifficultyType = (difficulty) => {
  const typeMap = {
    easy: 'success',
    medium: 'warning',
    hard: 'danger',
  }
  return typeMap[difficulty] || 'info'
}

const formatTime = (seconds) => {
  if (!seconds) return '0秒'
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60
  
  if (hours > 0) return `${hours}小时${minutes}分钟`
  if (minutes > 0) return `${minutes}分钟${secs}秒`
  return `${secs}秒`
}
</script>

<style scoped lang="scss">
.game-registry-example {
  padding: 20px;
  background: #f5f7fa;
  min-height: 100vh;

  h1 {
    text-align: center;
    margin-bottom: 30px;
    color: #303133;
  }

  .demo-card {
    margin-bottom: 20px;

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
  }

  .game-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 16px;
    
    .game-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px;
      border: 1px solid #dcdfe6;
      border-radius: 8px;
      transition: all 0.3s;
      
      &:hover {
        border-color: #409eff;
        background: #ecf5ff;
        transform: translateY(-2px);
      }
      
      .game-icon {
        font-size: 32px;
      }
      
      .game-info {
        flex: 1;
        
        .game-name {
          font-weight: bold;
          margin-bottom: 4px;
        }
        
        .game-category {
          font-size: 12px;
          color: #909399;
          margin-bottom: 4px;
        }
      }
    }
  }

  .category-section {
    margin-bottom: 24px;
    
    h3 {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 12px;
    }
    
    .game-list {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      
      .game-tag {
        cursor: pointer;
        transition: all 0.3s;
        
        &:hover {
          transform: scale(1.05);
        }
      }
    }
  }
}
</style>
