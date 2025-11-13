# 修复验证指南

## 🔍 快速验证步骤

### 验证 1: 设置保存功能

#### 步骤 1 - 测试主题切换
```bash
1. 访问 http://localhost:5173/user/settings
2. 切换到"偏好设置"标签
3. 将主题从"浅色"切换到"深色"
4. 观察页面是否立即变为深色主题
5. 刷新页面 (F5)
6. ✅ 验证: 主题应该仍然是深色
```

#### 步骤 2 - 测试语言切换
```bash
1. 在"偏好设置"中
2. 将语言从"简体中文"切换到"English"
3. 观察是否显示成功提示
4. 刷新页面 (F5)
5. ✅ 验证: 语言应该仍然是 English
```

#### 步骤 3 - 测试音效开关
```bash
1. 在"偏好设置"中
2. 关闭"音效"开关
3. 观察是否显示"音效已关闭"提示
4. 刷新页面 (F5)
5. ✅ 验证: 音效开关应该仍然是关闭状态
```

#### 步骤 4 - 测试音量调节
```bash
1. 在"偏好设置"中
2. 将音量滑块调整到 80
3. 刷新页面 (F5)
4. ✅ 验证: 音量应该仍然是 80
```

---

### 验证 2: 删除记录后统计更新

#### 步骤 1 - 记录初始数据
```bash
1. 访问 http://localhost:5173/user/settings
2. 切换到"游戏记录"标签
3. 记录以下数据:
   - 总游玩次数: ___
   - 总分数: ___
   - 最高分: ___
   - 记录总数: ___
```

#### 步骤 2 - 删除一条记录
```bash
1. 在游戏记录列表中
2. 点击任意一条记录的"删除"按钮
3. 在确认对话框中点击"确定"
4. 观察是否显示"删除成功"提示
```

#### 步骤 3 - 验证数据更新
```bash
✅ 验证以下数据是否正确更新:
   - 记录总数应该减少 1
   - 总游玩次数应该减少 1
   - 总分数应该减少（被删除记录的分数）
   - 如果删除的是最高分记录，最高分应该更新
   - Top游戏排行应该重新计算
```

---

## 🧪 浏览器控制台验证

### 验证设置保存

打开浏览器开发者工具 (F12)，在 Console 中执行：

```javascript
// 1. 检查 localStorage
console.log('=== localStorage 检查 ===')
console.log('主题:', localStorage.getItem('theme'))
console.log('语言:', localStorage.getItem('language'))
console.log('音效:', localStorage.getItem('soundEnabled'))
console.log('音乐:', localStorage.getItem('musicEnabled'))
console.log('音量:', localStorage.getItem('volume'))
console.log('动画:', localStorage.getItem('animationEnabled'))
console.log('通知:', localStorage.getItem('notificationEnabled'))

// 2. 检查 Store 状态
import { useSettingsStore } from '@/store'
const settingsStore = useSettingsStore()
console.log('=== Store 状态 ===')
console.log('所有设置:', settingsStore.allSettings)

// 3. 测试设置修改
console.log('=== 测试设置修改 ===')
settingsStore.setTheme('dark')
console.log('修改后主题:', localStorage.getItem('theme')) // 应该是 'dark'

settingsStore.setLanguage('en-US')
console.log('修改后语言:', localStorage.getItem('language')) // 应该是 'en-US'

settingsStore.setSoundEnabled(false)
console.log('修改后音效:', localStorage.getItem('soundEnabled')) // 应该是 'false'
```

### 验证删除记录

```javascript
// 1. 检查游戏记录
import { useGameStore } from '@/store'
const gameStore = useGameStore()

console.log('=== 删除前 ===')
console.log('记录数量:', gameStore.gameHistory.length)
console.log('总记录数:', gameStore.gameHistoryTotal)
console.log('统计数据:', gameStore.gameStats)

// 2. 删除第一条记录
const firstRecordId = gameStore.gameHistory[0]?.id
if (firstRecordId) {
  await gameStore.deleteGameRecord(firstRecordId)
  
  console.log('=== 删除后 ===')
  console.log('记录数量:', gameStore.gameHistory.length)
  console.log('总记录数:', gameStore.gameHistoryTotal)
  console.log('统计数据:', gameStore.gameStats)
}
```

---

## ✅ 验证清单

### 设置保存验证

- [ ] 主题切换后刷新页面，主题保持
- [ ] 语言切换后刷新页面，语言保持
- [ ] 音效开关切换后刷新页面，状态保持
- [ ] 音乐开关切换后刷新页面，状态保持
- [ ] 音量调整后刷新页面，音量保持
- [ ] 动画开关切换后刷新页面，状态保持
- [ ] 通知开关切换后刷新页面，状态保持
- [ ] localStorage 中有对应的键值对
- [ ] Store 状态与 localStorage 一致

### 删除记录验证

- [ ] 删除记录后，记录从列表中消失
- [ ] 删除记录后，总记录数减少 1
- [ ] 删除记录后，总游玩次数减少 1
- [ ] 删除记录后，总分数正确更新
- [ ] 删除最高分记录后，最高分更新为次高分
- [ ] 删除记录后，Top游戏排行重新计算
- [ ] 删除所有记录后，显示空状态
- [ ] 删除所有记录后，统计数据归零

---

## 🐛 如果验证失败

### 设置不保存

**检查步骤**:
1. 打开开发者工具 -> Application -> Local Storage
2. 查看是否有对应的键值对
3. 检查值是否正确

**可能原因**:
- 浏览器禁用了 localStorage
- 浏览器处于隐私模式
- localStorage 已满

**解决方案**:
```javascript
// 清空 localStorage 重试
localStorage.clear()
location.reload()
```

### 删除后统计不更新

**检查步骤**:
1. 打开开发者工具 -> Console
2. 查看是否有错误信息
3. 检查网络请求是否成功

**可能原因**:
- `loadUserStats()` 没有被调用
- 数据计算逻辑错误

**解决方案**:
```javascript
// 手动重新计算
import { useGameStore } from '@/store'
const gameStore = useGameStore()
await gameStore.fetchGameHistory({ page: 1, pageSize: 10 })

// 在 UserSettings.vue 中
loadUserStats()
```

---

## 📊 预期结果

### 设置保存

| 操作 | 预期结果 |
|------|----------|
| 切换主题 | localStorage 中 `theme` 更新 |
| 切换语言 | localStorage 中 `language` 更新 |
| 切换音效 | localStorage 中 `soundEnabled` 更新 |
| 刷新页面 | 所有设置保持不变 |

### 删除记录

| 操作 | 预期结果 |
|------|----------|
| 删除记录 | 记录从列表消失 |
| 删除记录 | 总记录数 -1 |
| 删除记录 | 统计数据更新 |
| 删除所有记录 | 显示空状态 |

---

## 🎯 成功标准

所有验证项都通过 ✅，即表示修复成功！

如果有任何验证项失败 ❌，请查看 [SETTINGS_FIX.md](./SETTINGS_FIX.md) 获取详细的调试信息。

---

**验证日期**: _________  
**验证人**: _________  
**验证结果**: ✅ 通过 / ❌ 失败  
**备注**: _________
