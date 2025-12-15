<template>
  <div class="common-layout">
    <el-container>
      <el-main class="game-main-container">
        <div id="app">
          <div class="game-container">
            <div v-if="!gameStarted" class="setup-screen">
              <div class="setup-card animate__animated animate__bounceIn">
                <div class="card-header">
                  <h1>🏪 商场大亨</h1>
                  <p class="subtitle">低买高卖，赚取第一桶金！💰</p>
                </div>

                <div class="config-form">
                  <div class="form-item">
                    <label>📅 游戏天数</label>
                    <div class="input-group">
                      <el-input-number
                        v-model="gameConfig.totalDays"
                        :min="10"
                        :max="100"
                        size="large"
                        class="cartoon-input"
                      />
                    </div>
                  </div>

                  <div class="form-item">
                    <label>📦 商品数量</label>
                    <div class="input-group">
                      <el-input-number
                        v-model="gameConfig.dailyItemCount"
                        :min="3"
                        :max="9"
                        size="large"
                        class="cartoon-input"
                      />
                    </div>
                  </div>

                  <div class="form-item">
                    <label>📈 波动幅度</label>
                    <div class="input-group">
                      <el-select
                        v-model="gameConfig.priceVolatility"
                        placeholder="请选择"
                        size="large"
                        class="cartoon-select"
                      >
                        <el-option label="😊 平稳 (5%)" value="0.05" />
                        <el-option label="🙂 正常 (10%)" value="0.1" />
                        <el-option label="😲 刺激 (20%)" value="0.2" />
                        <el-option label="😱 疯狂 (30%)" value="0.3" />
                      </el-select>
                    </div>
                  </div>

                  <el-button
                    type="primary"
                    size="large"
                    @click="startGame"
                    class="start-btn cartoon-btn"
                  >
                    🚀 开始赚钱
                  </el-button>
                </div>
              </div>
            </div>

            <div v-else class="game-screen">
              <div class="status-bar">
                <div class="status-grid">
                  <div class="status-item">
                    <span class="label">📅 天数</span>
                    <span class="value">{{ gameState.day }}/{{ gameState.totalDays }}</span>
                  </div>
                  <div class="status-item highlight-cash">
                    <span class="label">💵 现金</span>
                    <span class="value cash">¥{{ gameState.cash }}</span>
                  </div>
                  <div class="status-item">
                    <span class="label">🏦 总资产</span>
                    <span class="value total">¥{{ totalAssets }}</span>
                  </div>
                  <div class="status-item">
                    <span class="label">📊 收益率</span>
                    <span class="value" :class="profitClass">{{ profitPercentage }}%</span>
                  </div>
                </div>
              </div>

              <div class="items-section">
                <div class="items-grid">
                  <div
                    v-for="item in gameState.availableItems"
                    :key="item.id"
                    class="item-card animate__animated animate__fadeInUp"
                    :class="{
                      'price-up': item.priceChange > 0,
                      'price-down': item.priceChange < 0,
                    }"
                  >
                    <div class="price-badge" v-if="item.priceChange !== 0">
                        {{ item.priceChange > 0 ? '🔥 +' : '❄️ ' }}{{ item.priceChange }}%
                    </div>
                    
                    <div class="item-header">
                      <div class="item-image">
                        <img :src="itemImages[item.id]" :alt="item.name" @error="handleImageError($event, item.id)" />
                      </div>
                      <div class="item-info">
                        <h3 class="item-name">{{ item.name }}</h3>
                        <div class="item-price">¥{{ item.currentPrice }}</div>
                      </div>
                    </div>

                    <div class="item-stats">
                      <div class="owned">🎒 持有: {{ gameState.inventory[item.id] || 0 }}</div>
                    </div>

                    <div class="action-buttons">
                      <el-button
                        class="buy-btn cartoon-btn-small"
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
                        class="sell-btn cartoon-btn-small"
                        @mousedown="startFastAction(item.id, 'sell')"
                        @mouseup="stopFastAction"
                        @mouseleave="stopFastAction"
                        @touchstart="startFastAction(item.id, 'sell')"
                        @touchend="stopFastAction"
                        :disabled="!gameState.inventory[item.id] || gameState.inventory[item.id] <= 0"
                      >
                        卖出
                      </el-button>
                    </div>
                  </div>
                </div>
              </div>

              <div class="action-section">
                <el-button type="primary" size="large" class="next-day-btn cartoon-btn" @click="nextDay">
                  🌙 结束这一天
                </el-button>

                <el-button type="default" size="large" class="inventory-btn cartoon-btn" @click="showInventory = !showInventory">
                  {{ showInventory ? "🙈 隐藏库存" : "📦 查看库存" }}
                </el-button>
              </div>

              <div class="history-section">
                <div class="section-header">
                  <h3 class="section-title">📝 账本</h3>
                </div>
                <div class="log-container">
                  <div
                    v-for="(entry, index) in gameState.logEntries"
                    :key="index"
                    class="log-entry"
                    :class="{ profit: entry.includes('盈利'), loss: entry.includes('亏损') }"
                  >
                    <span class="log-text">{{ entry }}</span>
                  </div>
                </div>
              </div>

              <div v-if="showInventory" class="inventory-section animate__animated animate__fadeIn">
                <div class="section-header">
                  <h3 class="section-title">📦 仓库</h3>
                  <span class="total-value">总价值: ¥{{ inventoryTotalValue }}</span>
                </div>
                <div class="inventory-grid">
                  <div v-for="item in inventoryItems" :key="item.id" class="inventory-item">
                    <img :src="itemImages[item.id]" class="inv-img" />
                    <div class="inv-info">
                        <span>{{ item.name }}</span>
                        <span class="qty">x{{ item.quantity }}</span>
                    </div>
                    <span class="inv-val">¥{{ item.value }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <el-alert v-if="alert.show" :title="alert.message" :type="alert.type" show-icon class="alert-message cartoon-alert" @close="closeAlert" />
        </div>
      </el-main>
    </el-container>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted } from "vue";

// 物品图片映射 (使用 Emoji 或者简单的图标)
const itemImages = {
  1: "https://img.icons8.com/emoji/96/brick-emoji.png", // 黄金 -> 金砖
  2: "https://img.icons8.com/emoji/96/nut-and-bolt.png", // 白银 -> 螺母(暂代)
  3: "https://img.icons8.com/emoji/96/gem-stone.png",
  4: "https://img.icons8.com/emoji/96/oil-drum.png",
  5: "https://img.icons8.com/fluency/96/bitcoin.png",
  6: "https://img.icons8.com/emoji/96/sheaf-of-rice.png",
  7: "https://img.icons8.com/emoji/96/hot-beverage.png",
  8: "https://img.icons8.com/emoji/96/stop-sign.png", // 铜 -> 暂代
  9: "https://img.icons8.com/emoji/96/rock.png",
};
const fallbackImages = {}; // 简化，直接用上面的

const allItems = [
  { id: 1, name: "金砖", basePrice: 280 },
  { id: 2, name: "白银", basePrice: 150 },
  { id: 3, name: "钻石", basePrice: 250 },
  { id: 4, name: "石油", basePrice: 180 },
  { id: 5, name: "比特币", basePrice: 220 },
  { id: 6, name: "小麦", basePrice: 80 },
  { id: 7, name: "咖啡", basePrice: 120 },
  { id: 8, name: "红铜", basePrice: 90 },
  { id: 9, name: "稀土", basePrice: 200 },
];

const gameConfig = reactive({
  totalDays: 30,
  dailyItemCount: 6,
  priceVolatility: "0.1",
});

const gameState = reactive({
  cash: 1000,
  day: 1,
  totalDays: 30,
  inventory: {},
  availableItems: [],
  logEntries: [],
  priceHistory: {},
  fastAction: { itemId: null, action: null, timer: null, interval: null, lastActionTime: 0, speed: 1 },
});

const gameStarted = ref(false);
const showInventory = ref(false);
const alert = reactive({ show: false, message: "", type: "error" });

const inventoryItems = computed(() => {
  const items = [];
  allItems.forEach((item) => {
    if (gameState.inventory[item.id] > 0) {
      const currentItem = gameState.availableItems.find((i) => i.id === item.id) || item;
      const value = gameState.inventory[item.id] * (currentItem.currentPrice || item.basePrice);
      items.push({ ...item, quantity: gameState.inventory[item.id], value });
    }
  });
  return items;
});

const inventoryTotalValue = computed(() => inventoryItems.value.reduce((total, item) => total + item.value, 0));
const totalAssets = computed(() => gameState.cash + inventoryTotalValue.value);
const profitPercentage = computed(() => (((totalAssets.value - 1000) / 1000) * 100).toFixed(2));
const profitClass = computed(() => (totalAssets.value - 1000 > 0 ? "profit" : totalAssets.value - 1000 < 0 ? "loss" : ""));

const handleImageError = (event, itemId) => {}; // 简化
const showAlert = (message, type = "error") => {
  alert.message = message; alert.type = type; alert.show = true;
  setTimeout(() => closeAlert(), 3000);
};
const closeAlert = () => { alert.show = false; };

const startGame = () => {
  gameState.totalDays = gameConfig.totalDays;
  gameState.dailyItemCount = gameConfig.dailyItemCount;
  gameState.priceVolatility = parseFloat(gameConfig.priceVolatility);
  gameState.cash = 1000; gameState.day = 1; gameState.inventory = {};
  gameState.logEntries = []; gameState.priceHistory = {};
  allItems.forEach((item) => { gameState.inventory[item.id] = 0; gameState.priceHistory[item.id] = [item.basePrice]; });
  gameStarted.value = true; showInventory.value = false;
  setupDay();
};

const setupDay = () => {
  gameState.availableItems = [...allItems].sort(() => 0.5 - Math.random()).slice(0, gameState.dailyItemCount);
  gameState.availableItems.forEach((item) => {
    const lastPrice = gameState.priceHistory[item.id]?.[gameState.priceHistory[item.id].length - 1] || item.basePrice;
    const change = (Math.random() * 2 - 1) * gameState.priceVolatility;
    const newPrice = Math.max(1, Math.round(lastPrice * (1 + change)));
    item.currentPrice = newPrice;
    item.priceChange = parseFloat((((newPrice - lastPrice) / lastPrice) * 100).toFixed(1));
    if (!gameState.priceHistory[item.id]) gameState.priceHistory[item.id] = [];
    gameState.priceHistory[item.id].push(newPrice);
  });
};

const startFastAction = (itemId, action) => {
  gameState.fastAction.itemId = itemId; gameState.fastAction.action = action;
  gameState.fastAction.lastActionTime = Date.now(); gameState.fastAction.speed = 1;
  performSingleAction();
  gameState.fastAction.timer = setTimeout(() => {
    gameState.fastAction.interval = setInterval(() => {
      const now = Date.now();
      const holdTime = (now - gameState.fastAction.lastActionTime) / 1000;
      gameState.fastAction.speed = Math.min(1 + Math.pow(holdTime, 2), 10);
      if (now - gameState.fastAction.lastActionTime > 200 / gameState.fastAction.speed) {
        performSingleAction(); gameState.fastAction.lastActionTime = now;
      }
    }, 50);
  }, 200);
};

const performSingleAction = () => {
  if (gameState.fastAction.action === "buy") buyItem(gameState.fastAction.itemId, 1);
  else sellItem(gameState.fastAction.itemId, 1);
};

const stopFastAction = () => {
  clearTimeout(gameState.fastAction.timer); clearInterval(gameState.fastAction.interval);
  gameState.fastAction.itemId = null; gameState.fastAction.action = null;
};

const buyItem = (itemId, quantity) => {
  const item = gameState.availableItems.find((i) => i.id === itemId);
  if (!item) return;
  const totalCost = item.currentPrice * quantity;
  if (gameState.cash >= totalCost) {
    gameState.cash -= totalCost;
    gameState.inventory[item.id] = (gameState.inventory[item.id] || 0) + quantity;
    gameState.logEntries.unshift(`💸 第 ${gameState.day} 天: 买入 ${item.name} (-¥${totalCost})`);
    if (gameState.logEntries.length > 50) gameState.logEntries.pop();
  } else { showAlert("💰 没钱啦！", "error"); stopFastAction(); }
};

const sellItem = (itemId, quantity) => {
  const item = gameState.availableItems.find((i) => i.id === itemId);
  if (!item) return;
  if ((gameState.inventory[item.id] || 0) >= quantity) {
    const totalValue = item.currentPrice * quantity;
    gameState.cash += totalValue;
    gameState.inventory[item.id] -= quantity;
    gameState.logEntries.unshift(`💰 第 ${gameState.day} 天: 卖出 ${item.name} (+¥${totalValue})`);
    if (gameState.logEntries.length > 50) gameState.logEntries.pop();
  } else { showAlert("🎒 没货啦！", "error"); stopFastAction(); }
};

const nextDay = () => {
  gameState.day++;
  if (gameState.day > gameState.totalDays) {
    showAlert("🎉 游戏结束！查看结果...", "success");
    showInventory.value = true;
    setTimeout(() => { gameStarted.value = false; showInventory.value = false; }, 5000);
    return;
  }
  showInventory.value = false;
  setupDay();
};

onMounted(() => { allItems.forEach((item) => gameState.inventory[item.id] = 0); });
onUnmounted(() => stopFastAction());
</script>

<style scoped>
.game-main-container {
  padding: 0;
  background-color: var(--bg-color);
  min-height: 100vh;
}
.game-container {
  max-width: 1000px;
  margin: 0 auto;
  padding: 20px;
}
.setup-card {
  background-color: var(--bg-secondary);
  border: 4px solid var(--border-color);
  
  border-radius: var(--border-radius);
  padding: 40px;
  
  max-width: 500px;
  margin: 100px auto;
}
.card-header { text-align: center; margin-bottom: 30px; }
.card-header h1 { font-size: 2.5rem; color: var(--primary-color); text-shadow: 2px 2px 0 var(--border-color); }
.config-form { display: flex; flex-direction: column; gap: 20px; }
.form-item label { font-weight: bold; margin-bottom: 5px; display: block; }

/* 游戏内样式 */
.status-bar {
  background: var(--bg-secondary);
  border: 4px solid var(--border-color);
  border-radius: var(--border-radius);
  padding: 15px;
  margin-bottom: 20px;
  
}
.status-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 10px; }
.status-item {
  background: var(--bg-primary);
  border: 2px solid var(--border-color);
  border-radius: 12px;
  padding: 10px;
  text-align: center;
  display: flex;
  flex-direction: column;
}
.status-item .value { font-weight: 900; font-size: 1.2rem; }
.highlight-cash { background-color: var(--warning-color); color: #fff; border-color: #000; }
.profit { color: var(--success-color); }
.loss { color: var(--danger-color); }

.items-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 20px;
}
.item-card {
  background: var(--bg-secondary);
  border: 3px solid var(--border-color);
  border-radius: var(--border-radius);
  padding: 15px;
  position: relative;
  transition: transform 0.2s;
}
.item-card:hover { transform: translateY(-5px); box-shadow: 6px 6px 0px 0px rgba(0,0,0,0.15); }

.price-badge {
    position: absolute;
    top: -10px;
    right: -10px;
    background: var(--primary-color);
    color: white;
    padding: 2px 8px;
    border-radius: 12px;
    font-weight: bold;
    border: 2px solid var(--border-color);
    font-size: 0.8rem;
    z-index: 2;
}
.price-up .price-badge { background: var(--danger-color); }
.price-down .price-badge { background: var(--success-color); }

.item-header { display: flex; align-items: center; gap: 15px; margin-bottom: 10px; }
.item-image img { width: 50px; height: 50px; }
.item-name { margin: 0; font-size: 1.2rem; }
.item-price { font-weight: bold; color: var(--primary-color); font-size: 1.3rem; }
.item-stats { background: var(--bg-primary); border-radius: 8px; padding: 5px; text-align: center; margin-bottom: 10px; font-weight: bold; }

.action-buttons { display: flex; gap: 10px; }
.cartoon-btn, .cartoon-btn-small {
  border: 2px solid var(--border-color) !important;
 
  font-weight: bold !important;
  transition: all 0.1s;
}
.cartoon-btn:active, .cartoon-btn-small:active {
  transform: translate(2px, 2px);
  
}
.buy-btn { flex: 1; background-color: var(--success-color) !important; color: white !important; }
.sell-btn { flex: 1; background-color: var(--danger-color) !important; color: white !important; }

.action-section { margin-top: 20px; display: flex; gap: 15px; justify-content: center; }
.next-day-btn { flex: 2; height: 50px; font-size: 1.2rem; }
.inventory-btn { flex: 1; height: 50px; }

.history-section, .inventory-section {
  margin-top: 20px;
  background: var(--bg-secondary);
  border: 3px solid var(--border-color);
  border-radius: var(--border-radius);
  padding: 15px;
}
.log-container { max-height: 200px; overflow-y: auto; }
.log-entry {
  padding: 8px; border-bottom: 1px dashed var(--border-color); font-size: 0.9rem;
}
.inventory-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 10px; }
.inventory-item {
    display: flex; flex-direction: column; align-items: center;
    background: var(--bg-primary); border: 2px solid var(--border-color);
    border-radius: 8px; padding: 10px;
}
.inv-img { width: 40px; height: 40px; margin-bottom: 5px; }
.inv-info { font-size: 0.9rem; text-align: center; }
.inv-val { color: var(--success-color); font-weight: bold; }

.alert-message {
    border: 3px solid var(--border-color);
 
    position: fixed; top: 20px; right: 20px; z-index: 999;
}
</style>