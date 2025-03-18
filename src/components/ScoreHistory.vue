<template>
  <a-card title="积分历史记录" :style="{ marginTop: '16px' }">
    <a-table
      :columns="columns"
      :data-source="history"
      :row-key="record => `${record.timestamp}-${record.tableId}-${record.playerName}`"
      :pagination="{ pageSize: 10 }"
    />
  </a-card>
</template>

<script setup>
import { h } from 'vue'
import moment from 'moment'

const props = defineProps({
  history: {
    type: Array,
    default: () => []
  }
})

const columns = [
  {
    title: '时间',
    dataIndex: 'timestamp',
    key: 'timestamp',
    customRender: ({ text }) => moment(text).format('YYYY-MM-DD HH:mm:ss')
  },
  {
    title: '桌号',
    dataIndex: 'tableId',
    key: 'tableId'
  },
  {
    title: '玩家',
    dataIndex: 'playerName',
    key: 'playerName'
  },
  {
    title: '积分变化',
    dataIndex: 'scoreChange',
    key: 'scoreChange',
    customRender: ({ text }) => h(
      'span',
      { style: { color: text >= 0 ? '#52c41a' : '#f5222d' } },
      text >= 0 ? `+${text}` : text
    )
  },
  {
    title: '备注',
    dataIndex: 'note',
    key: 'note'
  }
]
</script> 