# 全局导航栏配置说明

## 修改概述

已将导航栏提升到全局级别，现在所有页面都会显示导航栏。

## 修改内容

### 1. **App.vue** - 添加全局导航栏

**修改前**：
```vue
<template>
  <div id="app">
    <router-view></router-view>
  </div>
</template>
```

**修改后**：
```vue
<template>
  <div id="app">
    <!-- 全局导航栏 -->
    <topnav />
    
    <!-- 页面内容 -->
    <div class="page-content">
      <router-view></router-view>
    </div>
  </div>
</template>

<script setup>
import Topnav from "./views/topnav/TopNav.vue";
</script>
```

### 2. **Home.vue** - 移除局部导航栏

**移除内容**：
- 移除了 `<topnav />` 组件
- 移除了 `import Topnav` 导入语句
- 调整了页面高度计算（减去导航栏高度）

**样式调整**：
```css
/* 修改前 */
.game-homepage {
  min-height: 100vh;
}

/* 修改后 */
.game-homepage {
  min-height: calc(100vh - 60px); /* 减去导航栏高度 */
}
```

### 3. **App.vue 样式** - 布局优化

```css
#app {
  min-height: 100vh;
  width: 100vw;
  display: flex;
  flex-direction: column; /* 垂直布局 */
}

.page-content {
  flex: 1; /* 占据剩余空间 */
  overflow: auto; /* 内容滚动 */
}
```

## 布局结构

```
App.vue (全局容器)
├── TopNav (固定导航栏 - 60px 高度)
└── .page-content (页面内容区域)
    └── <router-view> (路由页面)
        ├── Home.vue
        ├── SnakeGame.vue
        ├── GomokuGame.vue
        ├── UserSettings.vue
        └── ... (其他页面)
```

## 优势

### ✅ 统一体验
- 所有页面都有一致的导航栏
- 用户可以随时切换页面

### ✅ 简化维护
- 导航栏只需在一个地方维护
- 避免在每个页面重复代码

### ✅ 更好的导航
- 用户在任何页面都能访问主菜单
- 设置按钮始终可见

### ✅ 响应式布局
- 导航栏固定在顶部
- 内容区域自适应高度

## 导航栏高度

- **默认高度**: 60px
- **CSS 变量**: `--el-menu-horizontal-height: 60px`
- **计算公式**: `calc(100vh - 60px)` 用于页面内容区域

## 受影响的页面

所有页面现在都会显示导航栏：

1. ✅ **首页** (`/`) - Home.vue
2. ✅ **贪吃蛇** (`/snake`) - SnakeGame.vue
3. ✅ **五子棋** (`/gomoku`) - GomokuGame.vue
4. ✅ **商店** (`/shop`) - ShopGame.vue
5. ✅ **2048** (`/2048`) - 2048.vue
6. ✅ **分数系统** (`/score`) - ScoreSystem.vue
7. ✅ **试玩** (`/try`) - try.vue
8. ✅ **设置** (`/user/settings`) - UserSettings.vue
9. ✅ **示例页面** (`/examples/*`) - 所有示例页面

## 样式注意事项

### 页面高度计算

如果你的页面需要全屏显示，请使用以下高度计算：

```css
.your-page {
  min-height: calc(100vh - 60px);
}
```

### 固定定位元素

如果页面中有固定定位的元素，需要考虑导航栏的高度：

```css
.fixed-element {
  top: 60px; /* 导航栏高度 */
}
```

### 滚动容器

页面内容的滚动现在在 `.page-content` 容器中：

```css
.page-content {
  overflow: auto; /* 启用滚动 */
}
```

## 导航栏菜单项

当前导航栏包含以下菜单：

### 主菜单
- 🏠 **首页** - 跳转到主页
- 📋 **游戏列表** - 下拉菜单
  - 📊 分数系统
  - ⚫ 五子棋
  - 🛒 商店
  - 🐍 贪吃蛇
  - 🎮 2048
  - 🎯 试玩
- 📄 **示例** - 下拉菜单
  - ⚡ 快速开始
  - 📦 Store示例
  - 🔌 API示例
- ⚙️ **设置** - 跳转到设置页面

### 中间标题
- **SHIJY GAME** - 动态文字效果

## 自定义导航栏

如果需要修改导航栏，只需编辑一个文件：

```
src/views/topnav/TopNav.vue
```

### 添加新菜单项

```vue
<el-menu-item index="/new-page">
  <el-icon><YourIcon /></el-icon>
  <span>新页面</span>
</el-menu-item>
```

### 添加子菜单

```vue
<el-sub-menu index="new-menu">
  <template #title>
    <el-icon><YourIcon /></el-icon>
    <span>新菜单</span>
  </template>
  <el-menu-item index="/sub-page-1">子页面1</el-menu-item>
  <el-menu-item index="/sub-page-2">子页面2</el-menu-item>
</el-sub-menu>
```

## 响应式设计

导航栏已包含响应式设计：

```css
@media (max-width: 768px) {
  .el-menu-demo span {
    display: none; /* 小屏幕隐藏文字 */
  }
}
```

## 测试清单

- ✅ 首页显示导航栏
- ✅ 游戏页面显示导航栏
- ✅ 设置页面显示导航栏
- ✅ 示例页面显示导航栏
- ✅ 导航栏菜单可点击
- ✅ 路由跳转正常
- ✅ 页面滚动正常
- ✅ 响应式布局正常

## 常见问题

### Q: 某个页面不想显示导航栏怎么办？

A: 可以使用路由元信息控制：

```javascript
// router/index.js
{
  path: '/fullscreen',
  name: 'Fullscreen',
  component: () => import('../views/Fullscreen.vue'),
  meta: { hideNavbar: true }
}
```

然后在 App.vue 中：

```vue
<topnav v-if="!$route.meta.hideNavbar" />
```

### Q: 导航栏高度如何修改？

A: 修改 TopNav.vue 中的 CSS 变量：

```css
.el-menu-demo {
  --el-menu-item-height: 80px; /* 修改为你想要的高度 */
  --el-menu-horizontal-height: 80px;
}
```

同时更新页面高度计算：

```css
.your-page {
  min-height: calc(100vh - 80px); /* 使用新高度 */
}
```

### Q: 如何让导航栏固定在顶部不滚动？

A: 在 App.vue 中添加样式：

```css
#app {
  position: relative;
}

.topnav {
  position: sticky;
  top: 0;
  z-index: 1000;
}
```

## 文件修改清单

- ✅ `src/App.vue` - 添加全局导航栏和布局
- ✅ `src/views/Home.vue` - 移除局部导航栏
- ✅ `src/views/topnav/TopNav.vue` - 无需修改（已简化）

## 后续优化建议

1. **面包屑导航** - 在导航栏下方添加面包屑
2. **搜索功能** - 在导航栏添加全局搜索
3. **通知中心** - 添加消息通知图标
4. **主题切换** - 在导航栏添加主题切换按钮
5. **用户中心** - 恢复用户头像和菜单（如需要）
6. **快捷键** - 支持键盘快捷键导航
