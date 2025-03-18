<template>
  <a-card
    :title="`桌号 ${table.id}`"
    :style="{ marginBottom: '16px' }"
    hoverable
  >
    <template #extra>
      <a-button type="text" danger @click="$emit('delete-table', table.id)">
        删除
      </a-button>
    </template>

    <div
      v-for="player in table.players"
      :key="player.name"
      :style="{
        display: 'flex',
        flexDirection: 'column',
        marginBottom: '16px',
        padding: '12px',
        backgroundColor: '#f5f5f5',
        borderRadius: '8px',
      }"
    >
      <div :style="{ 
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '8px'
      }">
        <span :style="{ fontWeight: 'bold', fontSize: '16px' }">{{ player.name }}</span>
        <span :style="{ 
          fontSize: '24px',
          color: player.score >= 0 ? '#52c41a' : '#f5222d',
          fontWeight: 'bold'
        }">
          {{ player.score }}
        </span>
      </div>

      <a-row :gutter="[8, 8]">
        <a-col :span="12">
          <a-button
            type="primary"
            danger
            :style="{ width: '100%', height: '50px', fontSize: '20px' }"
            @click="handleScoreChange(player.name, player.score, -2)"
          >
            <template #icon><minus-outlined /></template>
            2
          </a-button>
        </a-col>
        <a-col :span="12">
          <a-button
            type="primary"
            :style="{ width: '100%', height: '50px', fontSize: '20px' }"
            @click="handleScoreChange(player.name, player.score, 2)"
          >
            <template #icon><plus-outlined /></template>
            2
          </a-button>
        </a-col>
        <a-col :span="12">
          <a-button
            type="primary"
            danger
            :style="{ width: '100%', height: '50px', fontSize: '20px' }"
            @click="handleScoreChange(player.name, player.score, -1)"
          >
            <template #icon><minus-outlined /></template>
            1
          </a-button>
        </a-col>
        <a-col :span="12">
          <a-button
            type="primary"
            :style="{ width: '100%', height: '50px', fontSize: '20px' }"
            @click="handleScoreChange(player.name, player.score, 1)"
          >
            <template #icon><plus-outlined /></template>
            1
          </a-button>
        </a-col>
      </a-row>
    </div>

    <a-space-compact :style="{ width: '100%', marginTop: '16px' }">
      <a-input
        v-model:value="newPlayerName"
        placeholder="输入玩家姓名"
        @pressEnter="handleAddPlayer"
      />
      <a-button type="primary" @click="handleAddPlayer">
        添加玩家
      </a-button>
    </a-space-compact>
  </a-card>
</template>

<script setup>
import { ref } from 'vue'
import { PlusOutlined, MinusOutlined } from '@ant-design/icons-vue'

const props = defineProps({
  table: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['score-change', 'delete-table', 'add-player'])

const newPlayerName = ref('')

const handleAddPlayer = () => {
  if (newPlayerName.value.trim()) {
    emit('add-player', newPlayerName.value.trim())
    newPlayerName.value = ''
  }
}

const handleScoreChange = (playerName, currentScore, delta) => {
  const newScore = currentScore + delta
  emit('update-score', { playerName, newScore })
  emit('save-data')
}
</script>