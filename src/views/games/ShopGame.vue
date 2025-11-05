<template>
  <div class="common-layout">
    <el-container>
      <el-header style="padding: 0"><topnav /></el-header>

      <el-main class="error404">
        <div id="app">
          <el-container class="game-container">
            <el-header class="game-header">
              <h1>商场买卖游戏</h1>
            </el-header>

            <el-main class="game-main">
              <!-- 设置界面 -->
              <div v-if="!gameStarted" class="setup-screen">
                <el-card class="setup-card">
                  <h2>游戏设置</h2>
                  <el-form :model="gameConfig" label-width="150px">
                    <el-form-item label="游戏天数:">
                      <el-input-number
                        v-model="gameConfig.totalDays"
                        :min="10"
                        :max="100"
                        controls-position="right"
                      />
                    </el-form-item>

                    <el-form-item label="每天显示商品数量:">
                      <el-input-number
                        v-model="gameConfig.dailyItemCount"
                        :min="3"
                        :max="9"
                        controls-position="right"
                      />
                    </el-form-item>

                    <el-form-item label="价格波动幅度:">
                      <el-select
                        v-model="gameConfig.priceVolatility"
                        placeholder="请选择"
                      >
                        <el-option label="低 (5%)" value="0.1" />
                        <el-option label="中 (10%)" value="0.2" />
                        <el-option label="高 (20%)" value="0.4" />
                        <el-option label="极高 (30%)" value="0.6" />
                      </el-select>
                    </el-form-item>

                    <el-form-item>
                      <el-button
                        type="primary"
                        size="large"
                        @click="startGame"
                        class="start-btn"
                      >
                        开始游戏
                      </el-button>
                    </el-form-item>
                  </el-form>
                </el-card>
              </div>

              <!-- 游戏界面 -->
              <div v-else class="game-screen">
                <!-- 状态栏 -->
                <el-row class="status-bar">
                  <el-col :span="12">
                    <div class="status-item">
                      天数: <span>{{ gameState.day }}</span
                      >/<span>{{ gameState.totalDays }}</span>
                    </div>
                  </el-col>
                  <el-col :span="12">
                    <div class="status-item">
                      现金: <span>¥{{ gameState.cash }}</span>
                    </div>
                  </el-col>
                </el-row>

                <!-- 商品列表 -->
                <el-row :gutter="20" class="items-container">
                  <el-col
                    :xs="24"
                    :sm="12"
                    :md="8"
                    v-for="item in gameState.availableItems"
                    :key="item.id"
                    class="item-col"
                  >
                    <el-card
                      class="item-card"
                      :body-style="{ padding: '15px' }"
                    >
                      <div
                        class="item-image-container"
                        :title="itemDescriptions[item.id]"
                      >
                        <img
                          class="item-image"
                          :src="itemImages[item.id]"
                          :alt="item.name"
                          @error="handleImageError($event, item.id)"
                        />
                        <div class="item-image-fallback">
                          {{ item.name.charAt(0) }}
                        </div>
                      </div>

                      <div class="item-info">
                        <div class="item-name">{{ item.name }}</div>
                        <div class="item-price">¥{{ item.currentPrice }}</div>
                      </div>

                      <div class="item-owned">
                        持有: {{ gameState.inventory[item.id] || 0 }}
                      </div>

                      <div class="action-buttons">
                        <el-button
                          class="buy-btn"
                          @mousedown="startFastAction(item.id, 'buy')"
                          @mouseup="stopFastAction"
                          @mouseleave="stopFastAction"
                          @touchstart="startFastAction(item.id, 'buy')"
                          @touchend="stopFastAction"
                        >
                          买入
                        </el-button>

                        <el-button
                          class="sell-btn"
                          @mousedown="startFastAction(item.id, 'sell')"
                          @mouseup="stopFastAction"
                          @mouseleave="stopFastAction"
                          @touchstart="startFastAction(item.id, 'sell')"
                          @touchend="stopFastAction"
                        >
                          卖出
                        </el-button>
                      </div>
                    </el-card>
                  </el-col>
                </el-row>

                <!-- 下一天按钮 -->
                <el-button
                  type="primary"
                  size="large"
                  class="next-day-btn"
                  @click="nextDay"
                >
                  下一天
                </el-button>

                <!-- 交易记录 -->
                <el-card class="history-container">
                  <template #header>
                    <div class="history-title">交易记录</div>
                  </template>
                  <div class="log-entries">
                    <div
                      v-for="(entry, index) in gameState.logEntries"
                      :key="index"
                      class="log-entry"
                      :class="{
                        profit: entry.includes('盈利'),
                        loss: entry.includes('亏损'),
                      }"
                    >
                      {{ entry }}
                    </div>
                  </div>
                </el-card>

                <!-- 库存 -->
                <el-card v-if="showInventory" class="inventory-section">
                  <template #header>
                    <div class="inventory-title">未卖出物品</div>
                  </template>
                  <el-row :gutter="10" class="inventory-grid">
                    <el-col
                      v-for="item in inventoryItems"
                      :key="item.id"
                      :xs="12"
                      :sm="8"
                      :md="6"
                      class="inventory-item-col"
                    >
                      <div class="inventory-item">
                        <div class="item-image-container">
                          <img
                            :src="itemImages[item.id]"
                            :alt="item.name"
                            @error="handleImageError($event, item.id)"
                          />
                          <div class="item-image-fallback">
                            {{ item.name.charAt(0) }}
                          </div>
                        </div>
                        <span>{{ item.name }} ×{{ item.quantity }}</span>
                        <span>¥{{ item.value }}</span>
                      </div>
                    </el-col>

                    <!-- 总价值 -->
                    <el-col :span="24" v-if="inventoryTotalValue > 0">
                      <div class="inventory-total">
                        <span>总价值</span>
                        <span>¥{{ inventoryTotalValue }}</span>
                      </div>
                    </el-col>
                  </el-row>
                </el-card>
              </div>
            </el-main>
          </el-container>

          <!-- 消息提示 -->
          <el-alert
            v-if="alert.show"
            :title="alert.message"
            :type="alert.type"
            :closable="false"
            show-icon
            class="alert-message"
            @close="closeAlert"
          />
        </div>
      </el-main>
    </el-container>
  </div>
</template>

<script setup>
import Topnav from "../topnav/TopNav.vue";
import FuzzyText from "../../components/gsap/FuzzyText.vue";
import { ref, reactive, computed, onMounted, onUnmounted } from "vue";

// 物品图片映射
const itemImages = {
  1: "https://img.icons8.com/color/96/gold-bars.png",
  2: "https://img.icons8.com/color/96/silver-bars.png",
  3: "https://img.icons8.com/color/96/diamond.png",
  4: "https://img.icons8.com/color/96/oil-industry.png",
  5: "https://img.icons8.com/color/96/bitcoin.png",
  6: "https://img.icons8.com/color/96/wheat.png",
  7: "https://img.icons8.com/color/96/coffee-beans-.png",
  8: "https://img.icons8.com/color/96/copper.png",
  9: "https://img.icons8.com/color/96/ore.png",
};

// 本地备用图片数据URL
const fallbackImages = {
  1: "data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Crect fill='%23FFD700' width='80' height='40' x='10' y='30' rx='5'/%3E%3C/svg%3E",
  2: "data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Crect fill='%23C0C0C0' width='80' height='40' x='10' y='30' rx='5'/%3E%3C/svg%3E",
  3: "data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Cpolygon fill='%23b9f2ff' points='50,10 80,40 50,70 20,40'/%3E%3C/svg%3E",
  4: "data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Ccircle fill='%23000' cx='50' cy='50' r='40'/%3E%3C/svg%3E",
  5: "data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Cpath fill='%23FF9900' d='M50,10 L90,50 L50,90 L10,50 Z'/%3E%3C/svg%3E",
  6: "data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Cpath fill='%23D2B48C' d='M20,50 Q50,20 80,50 Q50,80 20,50'/%3E%3C/svg%3E",
  7: "data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Ccircle fill='%23663300' cx='50' cy='50' r='40'/%3E%3C/svg%3E",
  8: "data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Crect fill='%23B87333' width='80' height='40' x='10' y='30' rx='5'/%3E%3C/svg%3E",
  9: "data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Cpath fill='%23008000' d='M20,50 L50,20 L80,50 L50,80 Z'/%3E%3C/svg%3E",
};

// 物品描述
const itemDescriptions = {
  1: "黄金: 保值首选，价格波动较小",
  2: "白银: 工业用途广泛，价格适中",
  3: "钻石: 奢侈品，价格高昂且波动大",
  4: "石油: 受国际形势影响大",
  5: "比特币: 高风险高回报的数字货币",
  6: "小麦: 生活必需品，价格稳定",
  7: "咖啡: 受气候影响较大的商品",
  8: "铜: 工业基础材料",
  9: "稀土: 高科技产业重要原料",
};

// 所有物品定义
const allItems = [
  { id: 1, name: "黄金", basePrice: 280 },
  { id: 2, name: "白银", basePrice: 150 },
  { id: 3, name: "钻石", basePrice: 250 },
  { id: 4, name: "石油", basePrice: 180 },
  { id: 5, name: "比特币", basePrice: 220 },
  { id: 6, name: "小麦", basePrice: 80 },
  { id: 7, name: "咖啡", basePrice: 120 },
  { id: 8, name: "铜", basePrice: 90 },
  { id: 9, name: "稀土", basePrice: 200 },
];

// 游戏配置
const gameConfig = reactive({
  totalDays: 30,
  dailyItemCount: 6,
  priceVolatility: "0.2",
});

// 游戏状态
const gameState = reactive({
  cash: 1000,
  day: 1,
  totalDays: 30,
  inventory: {},
  availableItems: [],
  logEntries: [],
  fastAction: {
    itemId: null,
    action: null,
    timer: null,
    interval: null,
    lastActionTime: 0,
    speed: 1,
  },
});

// 响应式数据
const gameStarted = ref(false);
const showInventory = ref(false);
const alert = reactive({
  show: false,
  message: "",
  type: "error",
});

// 计算属性
const inventoryItems = computed(() => {
  const items = [];
  allItems.forEach((item) => {
    if (gameState.inventory[item.id] > 0) {
      const currentItem =
        gameState.availableItems.find((i) => i.id === item.id) || item;
      const value =
        gameState.inventory[item.id] *
        (currentItem.currentPrice || item.basePrice);
      items.push({
        ...item,
        quantity: gameState.inventory[item.id],
        value,
      });
    }
  });
  return items;
});

const inventoryTotalValue = computed(() => {
  return inventoryItems.value.reduce((total, item) => total + item.value, 0);
});

// 方法
const handleImageError = (event, itemId) => {
  event.target.src = fallbackImages[itemId];
};

const showAlert = (message, type = "error") => {
  alert.message = message;
  alert.type = type;
  alert.show = true;

  // 3秒后自动关闭
  setTimeout(() => {
    closeAlert();
  }, 3000);
};

const closeAlert = () => {
  alert.show = false;
};

const startGame = () => {
  // 更新游戏配置
  gameState.totalDays = gameConfig.totalDays;
  gameState.dailyItemCount = gameConfig.dailyItemCount;
  gameState.priceVolatility = parseFloat(gameConfig.priceVolatility);

  // 重置游戏状态
  gameState.cash = 1000;
  gameState.day = 1;
  gameState.inventory = {};
  gameState.logEntries = [];

  // 初始化所有物品
  allItems.forEach((item) => {
    gameState.inventory[item.id] = 0;
  });

  // 开始游戏
  gameStarted.value = true;
  showInventory.value = false;

  // 开始第一天
  setupDay();
};

const setupDay = () => {
  // 随机选择当天可交易的商品
  gameState.availableItems = [...allItems]
    .sort(() => 0.5 - Math.random())
    .slice(0, gameState.dailyItemCount);

  // 为每个商品设置当天价格
  gameState.availableItems.forEach((item) => {
    // 随机波动价格
    const change = (Math.random() * 2 - 1) * gameState.priceVolatility;
    item.currentPrice = Math.max(1, Math.round(item.basePrice * (1 + change)));
  });
};

const startFastAction = (itemId, action) => {
  gameState.fastAction.itemId = itemId;
  gameState.fastAction.action = action;
  gameState.fastAction.lastActionTime = Date.now();
  gameState.fastAction.speed = 1;

  // 立即执行第一次操作
  performSingleAction();

  // 开始快速连续操作
  gameState.fastAction.timer = setTimeout(() => {
    gameState.fastAction.interval = setInterval(() => {
      const now = Date.now();
      // 加速曲线 - 按住时间越长速度越快
      const holdTime = (now - gameState.fastAction.lastActionTime) / 1000;
      gameState.fastAction.speed = Math.min(1 + Math.pow(holdTime, 2), 10); // 最大10倍速

      if (
        now - gameState.fastAction.lastActionTime >
        200 / gameState.fastAction.speed
      ) {
        performSingleAction();
        gameState.fastAction.lastActionTime = now;
      }
    }, 50);
  }, 200); // 200ms后开始快速连续操作
};

const performSingleAction = () => {
  if (gameState.fastAction.action === "buy") {
    buyItem(gameState.fastAction.itemId, 1);
  } else {
    sellItem(gameState.fastAction.itemId, 1);
  }
};

const stopFastAction = () => {
  clearTimeout(gameState.fastAction.timer);
  clearInterval(gameState.fastAction.interval);
  gameState.fastAction.itemId = null;
  gameState.fastAction.action = null;
};

const buyItem = (itemId, quantity = 1) => {
  const item = gameState.availableItems.find((i) => i.id === itemId);
  if (!item) return;

  const totalCost = item.currentPrice * quantity;

  if (gameState.cash >= totalCost) {
    gameState.cash -= totalCost;
    gameState.inventory[item.id] =
      (gameState.inventory[item.id] || 0) + quantity;

    gameState.logEntries.push(
      `第 ${gameState.day} 天: 买入 ${quantity} 个 ${item.name} (¥${totalCost})`
    );
  } else {
    showAlert("现金不足！", "error");
    stopFastAction();
  }
};

const sellItem = (itemId, quantity = 1) => {
  const item = gameState.availableItems.find((i) => i.id === itemId);
  if (!item) return;

  const currentQuantity = gameState.inventory[item.id] || 0;
  if (currentQuantity >= quantity) {
    const totalValue = item.currentPrice * quantity;
    gameState.cash += totalValue;
    gameState.inventory[item.id] = currentQuantity - quantity;

    // 计算盈亏 (与基础价格比较)
    const profit = (item.currentPrice - item.basePrice) * quantity;
    let profitText = "";
    if (profit > 0) {
      profitText = ` (盈利 ¥${profit})`;
    } else if (profit < 0) {
      profitText = ` (亏损 ¥${-profit})`;
    }

    gameState.logEntries.push(
      `第 ${gameState.day} 天: 卖出 ${quantity} 个 ${item.name} (¥${totalValue})${profitText}`
    );
  } else {
    showAlert("没有足够的商品可卖！", "error");
    stopFastAction();
  }
};

const calculateInventoryValue = () => {
  let total = 0;
  allItems.forEach((item) => {
    if (gameState.inventory[item.id] > 0) {
      const currentItem =
        gameState.availableItems.find((i) => i.id === item.id) || item;
      total +=
        gameState.inventory[item.id] *
        (currentItem.currentPrice || item.basePrice);
    }
  });
  return total;
};

const nextDay = () => {
  gameState.day++;

  if (gameState.day > gameState.totalDays) {
    // 游戏结束
    showInventory.value = true;

    const totalAssets = gameState.cash;
    const inventoryValue = calculateInventoryValue();
    const totalValue = totalAssets + inventoryValue;
    const profit = totalValue - 1000;
    const profitPercentage = ((profit / 1000) * 100).toFixed(2);

    let resultMessage = `游戏结束！\n最终现金: ¥${totalAssets}`;

    if (inventoryValue > 0) {
      resultMessage += `\n未卖出物品价值: ¥${inventoryValue}`;
    }

    resultMessage += `\n总价值: ¥${totalValue}`;

    if (profit > 0) {
      resultMessage += `\n盈利: ¥${profit} (+${profitPercentage}%)`;
    } else if (profit < 0) {
      resultMessage += `\n亏损: ¥${-profit} (${profitPercentage}%)`;
    } else {
      resultMessage += `\n盈亏平衡`;
    }

    gameState.logEntries.push(resultMessage.replace(/\n/g, " - "));

    showAlert(resultMessage.replace(/\n/g, "<br>"), "success");

    // 返回设置界面
    setTimeout(() => {
      gameStarted.value = false;
      showInventory.value = false;
    }, 5000);

    return;
  }

  showInventory.value = false;
  setupDay();
};

// 生命周期
onMounted(() => {
  // 初始化库存
  allItems.forEach((item) => {
    gameState.inventory[item.id] = 0;
  });
});

onUnmounted(() => {
  // 清理定时器
  stopFastAction();
});
</script>

<style scoped>
:root {
  --primary-color: #3498db;
  --secondary-color: #2ecc71;
  --danger-color: #e74c3c;
  --warning-color: #f39c12;
  --dark-color: #2c3e50;
  --light-color: #ecf0f1;
  --border-radius: 8px;
  --box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  --transition: all 0.3s ease;
}

* {
  box-sizing: border-box;
}

.game-container {
  max-width: 1200px;
  margin: 0 auto;
  min-height: 100vh;
  padding: 20px;
}

.game-header {
  text-align: center;
  padding: 20px 0;
}

h1 {
  color: var(--dark-color);
  font-size: 2.2rem;
  background: linear-gradient(
    135deg,
    var(--primary-color),
    var(--secondary-color)
  );
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  padding: 10px 0;
}

.setup-card {
  max-width: 600px;
  margin: 0 auto;
}

.setup-card h2 {
  text-align: center;
  margin-bottom: 20px;
  color: var(--dark-color);
}

.start-btn {
  width: 100%;
  margin-top: 20px;
}

.status-bar {
  background-color: var(--light-color);
  padding: 12px 20px;
  border-radius: var(--border-radius);
  margin-bottom: 20px;
  font-weight: bold;
  color: var(--dark-color);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.status-item {
  display: flex;
  align-items: center;
}

.status-item span {
  font-weight: normal;
  margin-left: 5px;
  color: var(--primary-color);
}

.items-container {
  margin-bottom: 20px;
}

.item-col {
  margin-bottom: 20px;
}

.item-card {
  height: 100%;
  transition: var(--transition);
}

.item-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
}

.item-image-container {
  width: 100%;
  height: 120px;
  margin-bottom: 10px;
  border-radius: var(--border-radius);
  background-color: #f5f5f5;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
}

.item-image {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.item-image-fallback {
  font-size: 2rem;
  color: #ccc;
}

.item-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.item-name {
  font-weight: bold;
  font-size: 1.1rem;
  color: var(--dark-color);
}

.item-price {
  color: var(--danger-color);
  font-size: 1rem;
  font-weight: bold;
}

.item-owned {
  color: var(--secondary-color);
  margin-bottom: 15px;
  font-weight: bold;
}

.action-buttons {
  display: flex;
  gap: 10px;
}

.buy-btn {
  background-color: var(--secondary-color);
  border-color: var(--secondary-color);
  color: white;
  flex: 1;
}

.buy-btn:hover {
  background-color: #27ae60;
  border-color: #27ae60;
}

.sell-btn {
  background-color: var(--danger-color);
  border-color: var(--danger-color);
  color: white;
  flex: 1;
}

.sell-btn:hover {
  background-color: #c0392b;
  border-color: #c0392b;
}

.next-day-btn {
  width: 100%;
  margin: 20px 0;
  padding: 12px;
  font-size: 1rem;
}

.history-container {
  margin-top: 20px;
}

.history-title {
  font-weight: bold;
  color: var(--dark-color);
  font-size: 1.1rem;
}

.log-entries {
  max-height: 200px;
  overflow-y: auto;
}

.log-entry {
  margin-bottom: 8px;
  padding: 8px;
  border-radius: 4px;
  background-color: white;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.profit {
  color: var(--secondary-color);
  border-left: 3px solid var(--secondary-color);
}

.loss {
  color: var(--danger-color);
  border-left: 3px solid var(--danger-color);
}

.inventory-section {
  margin-top: 20px;
}

.inventory-title {
  font-weight: bold;
  color: var(--dark-color);
}

.inventory-grid {
  margin-top: 10px;
}

.inventory-item-col {
  margin-bottom: 10px;
}

.inventory-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 10px;
  background-color: #f9f9f9;
  border-radius: var(--border-radius);
  height: 100%;
}

.inventory-item .item-image-container {
  width: 50px;
  height: 50px;
  margin-bottom: 5px;
}

.inventory-item span {
  font-size: 0.9rem;
  text-align: center;
  margin-bottom: 5px;
}

.inventory-total {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px;
  background-color: var(--light-color);
  border-radius: var(--border-radius);
  font-weight: bold;
}

.alert-message {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 1000;
  max-width: 300px;
}

@media (max-width: 768px) {
  .item-col {
    width: 100%;
  }

  .status-bar {
    flex-direction: column;
    gap: 10px;
  }

  .status-item {
    justify-content: space-between;
  }

  .alert-message {
    top: 10px;
    right: 10px;
    left: 10px;
    max-width: none;
  }

  .inventory-item-col {
    width: 50%;
  }
}
</style>
