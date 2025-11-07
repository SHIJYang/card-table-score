<template>
  <div class="common-layout">
    <el-container>
      <el-header style="padding: 0"><topnav /></el-header>

      <el-main class="game-main-container">
        <div id="app">
          <div class="game-container">
            <!-- 设置界面 -->
            <div v-if="!gameStarted" class="setup-screen">
              <div class="setup-card">
                <div class="card-header">
                  <h1>商场买卖游戏</h1>
                  <p class="subtitle">低买高卖，成为商场大亨！</p>
                </div>

                <div class="config-form">
                  <div class="form-item">
                    <label>游戏天数</label>
                    <div class="input-group">
                      <el-input-number
                        v-model="gameConfig.totalDays"
                        :min="10"
                        :max="100"
                        size="large"
                      />
                      <span class="tip">建议20-40天</span>
                    </div>
                  </div>

                  <div class="form-item">
                    <label>每天商品数量</label>
                    <div class="input-group">
                      <el-input-number
                        v-model="gameConfig.dailyItemCount"
                        :min="3"
                        :max="9"
                        size="large"
                      />
                      <span class="tip">每天随机出现的商品数量</span>
                    </div>
                  </div>

                  <div class="form-item">
                    <label>价格波动幅度</label>
                    <div class="input-group">
                      <el-select
                        v-model="gameConfig.priceVolatility"
                        placeholder="请选择"
                        size="large"
                      >
                        <el-option label="低 (5%)" value="0.05" />
                        <el-option label="中 (10%)" value="0.1" />
                        <el-option label="高 (20%)" value="0.2" />
                        <el-option label="极高 (30%)" value="0.3" />
                      </el-select>
                      <span class="tip">波动越大，风险与收益越高</span>
                    </div>
                  </div>

                  <el-button
                    type="primary"
                    size="large"
                    @click="startGame"
                    class="start-btn"
                  >
                    开始游戏
                  </el-button>
                </div>
              </div>
            </div>

            <!-- 游戏界面 -->
            <div v-else class="game-screen">
              <!-- 顶部状态栏 -->
              <div class="status-bar">
                <div class="status-grid">
                  <div class="status-item">
                    <span class="label">天数</span>
                    <span class="value"
                      >{{ gameState.day }}/{{ gameState.totalDays }}</span
                    >
                  </div>
                  <div class="status-item">
                    <span class="label">现金</span>
                    <span class="value cash">¥{{ gameState.cash }}</span>
                  </div>
                  <div class="status-item">
                    <span class="label">总资产</span>
                    <span class="value total">¥{{ totalAssets }}</span>
                  </div>
                  <div class="status-item">
                    <span class="label">收益率</span>
                    <span class="value" :class="profitClass"
                      >{{ profitPercentage }}%</span
                    >
                  </div>
                </div>
              </div>

              <!-- 商品列表 -->
              <div class="items-section">
                <h2 class="section-title">今日商品</h2>
                <div class="items-grid">
                  <div
                    v-for="item in gameState.availableItems"
                    :key="item.id"
                    class="item-card"
                    :class="{
                      'price-up': item.priceChange > 0,
                      'price-down': item.priceChange < 0,
                    }"
                  >
                    <div class="item-header">
                      <div class="item-image">
                        <img
                          :src="itemImages[item.id]"
                          :alt="item.name"
                          @error="handleImageError($event, item.id)"
                        />
                      </div>
                      <div class="item-info">
                        <h3 class="item-name">{{ item.name }}</h3>
                        <div class="item-price">¥{{ item.currentPrice }}</div>
                      </div>
                    </div>

                    <div class="item-stats">
                      <div class="owned">
                        持有: {{ gameState.inventory[item.id] || 0 }}
                      </div>
                    </div>

                    <div class="action-buttons">
                      <el-button
                        class="buy-btn"
                        @mousedown="startFastAction(item.id, 'buy')"
                        @mouseup="stopFastAction"
                        @mouseleave="stopFastAction"
                        @touchstart="startFastAction(item.id, 'buy')"
                        @touchend="stopFastAction"
                        :disabled="gameState.cash < item.currentPrice"
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
                        :disabled="
                          !gameState.inventory[item.id] ||
                          gameState.inventory[item.id] <= 0
                        "
                      >
                        卖出
                      </el-button>
                    </div>
                  </div>
                </div>
              </div>

              <!-- 操作区域 -->
              <div class="action-section">
                <el-button
                  type="primary"
                  size="large"
                  class="next-day-btn"
                  @click="nextDay"
                >
                  下一天
                </el-button>

                <el-button
                  type="default"
                  size="large"
                  class="inventory-btn"
                  @click="showInventory = !showInventory"
                >
                  {{ showInventory ? "隐藏库存" : "查看库存" }}
                </el-button>
              </div>

              <!-- 交易记录 -->
              <div class="history-section">
                <div class="section-header">
                  <h3 class="section-title">交易记录</h3>
                  <span class="record-count"
                    >{{ gameState.logEntries.length }} 条记录</span
                  >
                </div>
                <div class="log-container">
                  <div
                    v-for="(entry, index) in gameState.logEntries"
                    :key="index"
                    class="log-entry"
                    :class="{
                      profit: entry.includes('盈利'),
                      loss: entry.includes('亏损'),
                    }"
                  >
                    <i class="log-icon" :class="getLogIcon(entry)"></i>
                    <span class="log-text">{{ entry }}</span>
                  </div>
                  <div
                    v-if="gameState.logEntries.length === 0"
                    class="empty-log"
                  >
                    <i class="el-icon-document"></i>
                    <p>暂无交易记录</p>
                  </div>
                </div>
              </div>

              <!-- 库存 -->
              <div v-if="showInventory" class="inventory-section">
                <div class="section-header">
                  <h3 class="section-title">库存物品</h3>
                  <span class="total-value"
                    >总价值: ¥{{ inventoryTotalValue }}</span
                  >
                </div>
                <div class="inventory-grid">
                  <div
                    v-for="item in inventoryItems"
                    :key="item.id"
                    class="inventory-item"
                  >
                    <div class="inv-item-image">
                      <img
                        :src="itemImages[item.id]"
                        :alt="item.name"
                        @error="handleImageError($event, item.id)"
                      />
                    </div>
                    <div class="inv-item-info">
                      <span class="inv-item-name">{{ item.name }}</span>
                      <span class="inv-item-quantity"
                        >×{{ item.quantity }}</span
                      >
                    </div>
                    <span class="inv-item-value">¥{{ item.value }}</span>
                  </div>

                  <div
                    v-if="inventoryItems.length === 0"
                    class="empty-inventory"
                  >
                    <i class="el-icon-box"></i>
                    <p>库存为空</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 消息提示 -->
          <el-alert
            v-if="alert.show"
            :title="alert.message"
            :type="alert.type"
            :closable="true"
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
  priceVolatility: "0.1",
});

// 游戏状态
const gameState = reactive({
  cash: 1000,
  day: 1,
  totalDays: 30,
  inventory: {},
  availableItems: [],
  logEntries: [],
  priceHistory: {},
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

const totalAssets = computed(() => {
  return gameState.cash + inventoryTotalValue.value;
});

const profitPercentage = computed(() => {
  const profit = totalAssets.value - 1000;
  return ((profit / 1000) * 100).toFixed(2);
});

const profitClass = computed(() => {
  const profit = totalAssets.value - 1000;
  if (profit > 0) return "profit";
  if (profit < 0) return "loss";
  return "";
});

// 方法
const handleImageError = (event, itemId) => {
  event.target.src = fallbackImages[itemId];
};

const getLogIcon = (entry) => {
  if (entry.includes("买入")) return "el-icon-shopping-bag-1";
  if (entry.includes("卖出")) return "el-icon-sold-out";
  if (entry.includes("盈利")) return "el-icon-success";
  if (entry.includes("亏损")) return "el-icon-error";
  return "el-icon-info";
};

const showAlert = (message, type = "error") => {
  alert.message = message;
  alert.type = type;
  alert.show = true;

  setTimeout(() => {
    closeAlert();
  }, 3000);
};

const closeAlert = () => {
  alert.show = false;
};

const startGame = () => {
  gameState.totalDays = gameConfig.totalDays;
  gameState.dailyItemCount = gameConfig.dailyItemCount;
  gameState.priceVolatility = parseFloat(gameConfig.priceVolatility);

  gameState.cash = 1000;
  gameState.day = 1;
  gameState.inventory = {};
  gameState.logEntries = [];
  gameState.priceHistory = {};

  allItems.forEach((item) => {
    gameState.inventory[item.id] = 0;
    gameState.priceHistory[item.id] = [item.basePrice];
  });

  gameStarted.value = true;
  showInventory.value = false;
  setupDay();
};

const setupDay = () => {
  gameState.availableItems = [...allItems]
    .sort(() => 0.5 - Math.random())
    .slice(0, gameState.dailyItemCount);

  gameState.availableItems.forEach((item) => {
    const lastPrice =
      gameState.priceHistory[item.id]?.[
        gameState.priceHistory[item.id].length - 1
      ] || item.basePrice;

    const change = (Math.random() * 2 - 1) * gameState.priceVolatility;
    const newPrice = Math.max(1, Math.round(lastPrice * (1 + change)));

    const priceChange = (((newPrice - lastPrice) / lastPrice) * 100).toFixed(1);

    item.currentPrice = newPrice;
    item.priceChange = parseFloat(priceChange);

    if (!gameState.priceHistory[item.id]) {
      gameState.priceHistory[item.id] = [];
    }
    gameState.priceHistory[item.id].push(newPrice);
  });
};

const startFastAction = (itemId, action) => {
  gameState.fastAction.itemId = itemId;
  gameState.fastAction.action = action;
  gameState.fastAction.lastActionTime = Date.now();
  gameState.fastAction.speed = 1;

  performSingleAction();

  gameState.fastAction.timer = setTimeout(() => {
    gameState.fastAction.interval = setInterval(() => {
      const now = Date.now();
      const holdTime = (now - gameState.fastAction.lastActionTime) / 1000;
      gameState.fastAction.speed = Math.min(1 + Math.pow(holdTime, 2), 10);

      if (
        now - gameState.fastAction.lastActionTime >
        200 / gameState.fastAction.speed
      ) {
        performSingleAction();
        gameState.fastAction.lastActionTime = now;
      }
    }, 50);
  }, 200);
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

    gameState.logEntries.unshift(
      `第 ${gameState.day} 天: 买入 ${quantity} 个 ${item.name} (¥${totalCost})`
    );

    if (gameState.logEntries.length > 50) {
      gameState.logEntries.pop();
    }
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

    const profit = (item.currentPrice - item.basePrice) * quantity;
    let profitText = "";
    if (profit > 0) {
      profitText = ` (盈利 ¥${profit})`;
    } else if (profit < 0) {
      profitText = ` (亏损 ¥${-profit})`;
    }

    gameState.logEntries.unshift(
      `第 ${gameState.day} 天: 卖出 ${quantity} 个 ${item.name} (¥${totalValue})${profitText}`
    );

    if (gameState.logEntries.length > 50) {
      gameState.logEntries.pop();
    }
  } else {
    showAlert("没有足够的商品可卖！", "error");
    stopFastAction();
  }
};

const nextDay = () => {
  gameState.day++;

  if (gameState.day > gameState.totalDays) {
    showInventory.value = true;

    const totalAssetsValue = totalAssets.value;
    const inventoryValue = inventoryTotalValue.value;
    const profit = totalAssetsValue - 1000;
    const profitPercentage = ((profit / 1000) * 100).toFixed(2);

    let resultMessage = `游戏结束！\n最终现金: ¥${gameState.cash}`;

    if (inventoryValue > 0) {
      resultMessage += `\n未卖出物品价值: ¥${inventoryValue}`;
    }

    resultMessage += `\n总价值: ¥${totalAssetsValue}`;

    if (profit > 0) {
      resultMessage += `\n盈利: ¥${profit} (+${profitPercentage}%)`;
    } else if (profit < 0) {
      resultMessage += `\n亏损: ¥${-profit} (${profitPercentage}%)`;
    } else {
      resultMessage += `\n盈亏平衡`;
    }

    gameState.logEntries.unshift(resultMessage.replace(/\n/g, " - "));

    showAlert(resultMessage.replace(/\n/g, "<br>"), "success");

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
  allItems.forEach((item) => {
    gameState.inventory[item.id] = 0;
  });
});

onUnmounted(() => {
  stopFastAction();
});
</script>

<style scoped>
* {
  box-sizing: border-box;
}

.game-main-container {
  padding: 0;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  min-height: 100vh;
}

.game-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  min-height: calc(100vh - 60px);
}

/* 设置界面样式 */
.setup-screen {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 80vh;
  padding: 40px 20px;
}

.setup-card {
  background: white;
  border-radius: 20px;
  padding: 40px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08);
  width: 100%;
  max-width: 500px;
}

.card-header {
  text-align: center;
  margin-bottom: 40px;
}

.card-header h1 {
  color: #2c3e50;
  font-size: 2.2rem;
  margin-bottom: 8px;
  font-weight: 700;
}

.subtitle {
  color: #7f8c8d;
  font-size: 1.1rem;
  margin: 0;
}

.config-form {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.form-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-item label {
  font-weight: 600;
  color: #2c3e50;
  font-size: 1rem;
}

.input-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.tip {
  font-size: 0.85rem;
  color: #95a5a6;
}

.start-btn {
  width: 100%;
  height: 50px;
  font-size: 1.1rem;
  font-weight: 600;
  margin-top: 10px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  border-radius: 12px;
}

/* 游戏界面样式 */
.game-screen {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

/* 状态栏 */
.status-bar {
  background: white;
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.status-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.status-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 12px;
}

.status-item .label {
  font-size: 0.9rem;
  color: #7f8c8d;
  margin-bottom: 4px;
}

.status-item .value {
  font-size: 1.2rem;
  font-weight: 700;
  color: #2c3e50;
}

.status-item .cash {
  color: #27ae60;
}

.status-item .total {
  color: #3498db;
}

.status-item .profit {
  color: #27ae60;
}

.status-item .loss {
  color: #e74c3c;
}

/* 商品区域 */
.items-section {
  background: white;
  border-radius: 16px;
  padding: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.section-title {
  color: #2c3e50;
  font-size: 1.4rem;
  margin-bottom: 20px;
  font-weight: 600;
}

.items-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 2fr));
  gap: 20px;
}

.item-card {
  background: #f8f9fa;
  border-radius: 12px;
  padding: 10px;
  transition: all 0.3s ease;
  border: 2px solid transparent;
}

.item-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
}

.item-card.price-up {
  border-color: #27ae60;
}

.item-card.price-down {
  border-color: #e74c3c;
}

.item-header {
  display: flex;
  gap: 16px;
  margin-bottom: 16px;
}

.item-image {
  position: relative;
  width: 60px;
  height: 60px;
  background: white;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.item-image img {
  width: 40px;
  height: 40px;
  object-fit: contain;
}

.price-change {
  position: absolute;
  top: -6px;
  right: -6px;
  background: white;
  padding: 2px 6px;
  border-radius: 10px;
  font-size: 0.75rem;
  font-weight: 600;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  gap: 2px;
}

.price-change .el-icon-top {
  color: #27ae60;
  font-size: 0.7rem;
}

.price-change .el-icon-bottom {
  color: #e74c3c;
  font-size: 0.7rem;
}

.item-info {
  flex: 1;
}

.item-name {
  color: #2c3e50;
  font-size: 1.2rem;
  font-weight: 600;
  margin-bottom: 4px;
}

.item-price {
  color: #e74c3c;
  font-size: 1.1rem;
  font-weight: 700;
}

.item-stats {
  margin-bottom: 16px;
}

.owned {
  color: #7f8c8d;
  font-size: 0.9rem;
  text-align: center;
  background: white;
  padding: 6px 12px;
  border-radius: 8px;
}

.action-buttons {
  display: flex;
}

.buy-btn,
.sell-btn {
  flex: 1;
  border-radius: 8px;
  font-weight: 600;
  transition: all 0.3s ease;
}

.buy-btn {
  background: #27ae60;
  border-color: #27ae60;
  color: white;
}

.buy-btn:hover:not(:disabled) {
  background: #219653;
  border-color: #219653;
  transform: translateY(-1px);
}

.sell-btn {
  background: #e74c3c;
  border-color: #e74c3c;
  color: white;
}

.sell-btn:hover:not(:disabled) {
  background: #c0392b;
  border-color: #c0392b;
  transform: translateY(-1px);
}

/* 操作区域 */
.action-section {
  display: flex;
  gap: 0px;
  justify-content: center;
}

.next-day-btn {
  flex: 2;
  height: 50px;
  font-size: 1.1rem;
  font-weight: 600;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  border-radius: 12px;
}

.inventory-btn {
  flex: 1;
  height: 50px;
  font-size: 1rem;
  border-radius: 12px;
}

/* 交易记录 */
.history-section,
.inventory-section {
  background: white;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.record-count,
.total-value {
  color: #7f8c8d;
  font-size: 0.9rem;
}

.log-container {
  max-height: 300px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.log-entry {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px 16px;
  background: #f8f9fa;
  border-radius: 8px;
  transition: all 0.3s ease;
}

.log-entry:hover {
  background: #e9ecef;
}

.log-icon {
  color: #7f8c8d;
  font-size: 1rem;
  margin-top: 2px;
  flex-shrink: 0;
}

.log-text {
  color: #2c3e50;
  line-height: 1.4;
}

.log-entry.profit {
  border-left: 4px solid #27ae60;
}

.log-entry.loss {
  border-left: 4px solid #e74c3c;
}

.empty-log {
  text-align: center;
  padding: 40px 20px;
  color: #95a5a6;
}

.empty-log i {
  font-size: 3rem;
  margin-bottom: 12px;
  display: block;
}

.empty-log p {
  margin: 0;
  font-size: 1rem;
}

/* 库存 */
.inventory-grid {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.inventory-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 12px;
  transition: all 0.3s ease;
}

.inventory-item:hover {
  background: #e9ecef;
  transform: translateX(4px);
}

.inv-item-image {
  width: 40px;
  height: 40px;
  background: white;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.inv-item-image img {
  width: 24px;
  height: 24px;
  object-fit: contain;
}

.inv-item-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.inv-item-name {
  color: #2c3e50;
  font-weight: 600;
}

.inv-item-quantity {
  color: #7f8c8d;
  font-size: 0.9rem;
}

.inv-item-value {
  color: #27ae60;
  font-weight: 700;
  font-size: 1.1rem;
}

.empty-inventory {
  text-align: center;
  padding: 40px 20px;
  color: #95a5a6;
}

.empty-inventory i {
  font-size: 3rem;
  margin-bottom: 12px;
  display: block;
}

.empty-inventory p {
  margin: 0;
  font-size: 1rem;
}

/* 消息提示 */
.alert-message {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 9999;
  max-width: 400px;
  border-radius: 12px;
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .game-container {
    padding: 16px;
  }

  .setup-card {
    padding: 24px;
  }

  .card-header h1 {
    font-size: 1.8rem;
  }

  .status-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .section-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .alert-message {
    top: 10px;
    right: 10px;
    left: 10px;
    max-width: none;
  }
}

@media (max-width: 480px) {
  .game-container {
    padding: 12px;
  }

  .setup-card {
    padding: 20px;
  }

  .item-header {
    text-align: center;
    gap: 12px;
  }

  .item-image {
    align-self: center;
  }
}
</style>
