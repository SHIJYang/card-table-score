# 🎮 项目使用指南

## 快速开始

### 1. 安装依赖
```bash
npm install
```

### 2. 启动开发服务器
```bash
npm run dev
```

### 3. 访问示例页面

项目启动后，可以访问以下页面查看示例：

- **主页**: http://localhost:5173/
- **状态管理示例**: http://localhost:5173/examples/store
- **API请求示例**: http://localhost:5173/examples/api

## 📦 已集成功能

### ✅ 状态管理 (Pinia)

已配置三个 Store：

1. **useUserStore** - 用户状态管理
   - 用户信息
   - 登录状态
   - Token管理

2. **useGameStore** - 游戏状态管理
   - 当前游戏
   - 游戏历史
   - 收藏列表
   - 游戏统计

3. **useAppStore** - 应用全局状态
   - 加载状态
   - 主题切换
   - 语言设置
   - 侧边栏状态

### ✅ API请求封装

已配置 Axios 实例，包含：

- 请求拦截器（自动添加Token、加载动画）
- 响应拦截器（错误处理、状态码处理）
- 封装的请求方法（get、post、put、delete、upload）

已创建的 API 模块：

- **用户API** (`@/api/user.js`)
  - 登录、注册、获取用户信息
  - 更新用户信息、修改密码
  - 用户统计、头像上传

- **游戏API** (`@/api/game.js`)
  - 获取游戏列表、游戏详情
  - 热门游戏、推荐游戏
  - 游戏搜索、分类
  - 收藏游戏、提交分数
  - 游戏排行榜、历史记录

### ✅ Mock数据

已配置 Mock 数据拦截器：

- 自动拦截 API 请求
- 返回模拟数据
- 支持 CRUD 操作
- 模拟延迟响应

**开启/关闭 Mock**:
在 `.env.development` 文件中修改：
```env
VITE_MOCK_ENABLED=true   # 开启Mock
VITE_MOCK_ENABLED=false  # 关闭Mock
```

## 🎯 在您的组件中使用

### 使用状态管理

```vue
<script setup>
import { useUserStore, useGameStore, useAppStore } from '@/store'

const userStore = useUserStore()
const gameStore = useGameStore()
const appStore = useAppStore()

// 读取状态
console.log(userStore.userName)
console.log(gameStore.gameStats)

// 修改状态
userStore.setUserInfo({ name: '张三', email: 'test@example.com' })
gameStore.addGameHistory({ score: 100, gameName: '贪吃蛇' })
appStore.toggleTheme()
</script>
```

### 调用API

```vue
<script setup>
import { ref } from 'vue'
import * as userApi from '@/api/user'
import * as gameApi from '@/api/game'
import { ElMessage } from 'element-plus'

// 登录示例
const handleLogin = async () => {
  try {
    const res = await userApi.login({
      username: 'admin',
      password: '123456'
    })
    console.log('登录成功', res.data)
    ElMessage.success('登录成功')
  } catch (error) {
    console.error('登录失败', error)
    ElMessage.error('登录失败')
  }
}

// 获取游戏列表
const gameList = ref([])
const fetchGames = async () => {
  const res = await gameApi.getGameList({ page: 1, pageSize: 10 })
  gameList.value = res.data.list
}

// 提交游戏分数
const submitScore = async () => {
  await gameApi.submitGameScore({
    gameId: 1,
    score: 9999,
    playTime: 300
  })
  ElMessage.success('分数提交成功')
}
</script>
```

### 直接使用 request 工具

```vue
<script setup>
import { request } from '@/utils/request'

// GET 请求
const getData = async () => {
  const res = await request.get('/custom/endpoint', { id: 1 })
  console.log(res)
}

// POST 请求
const postData = async () => {
  const res = await request.post('/custom/endpoint', {
    name: 'test',
    value: 100
  })
  console.log(res)
}

// 上传文件
const uploadFile = async (file) => {
  const formData = new FormData()
  formData.append('file', file)
  const res = await request.upload('/upload', formData)
  console.log(res)
}
</script>
```

## 🔧 配置说明

### 环境变量

**.env.development** (开发环境)
```env
# API基础路径
VITE_API_BASE_URL=http://localhost:3000/api

# 是否启用Mock数据
VITE_MOCK_ENABLED=true

# 应用标题
VITE_APP_TITLE=游戏乐园

# 应用端口
VITE_PORT=5173
```

**.env.production** (生产环境)
```env
# API基础路径 - 替换成真实的API地址
VITE_API_BASE_URL=https://api.example.com/api

# 是否启用Mock数据
VITE_MOCK_ENABLED=false

# 应用标题
VITE_APP_TITLE=游戏乐园
```

### 修改API基础路径

在 `.env.development` 或 `.env.production` 文件中修改 `VITE_API_BASE_URL`

### 自定义请求拦截器

编辑 `src/utils/request.js`：

```javascript
// 请求拦截器
service.interceptors.request.use(
  (config) => {
    // 在这里添加自定义逻辑
    return config
  }
)

// 响应拦截器
service.interceptors.response.use(
  (response) => {
    // 在这里添加自定义逻辑
    return response.data
  }
)
```

## 📝 添加新的API

### 1. 创建API文件

在 `src/api/` 目录下创建新文件，例如 `product.js`：

```javascript
import { request } from '@/utils/request'

// 获取产品列表
export const getProductList = (params) => {
  return request.get('/products', params)
}

// 获取产品详情
export const getProductDetail = (id) => {
  return request.get(`/products/${id}`)
}

// 创建产品
export const createProduct = (data) => {
  return request.post('/products', data)
}
```

### 2. 添加Mock数据（可选）

在 `src/mock/` 目录下创建 `product.js`：

```javascript
import { successResponse, paginationData } from './index'

const mockProducts = [
  { id: 1, name: '产品1', price: 100 },
  { id: 2, name: '产品2', price: 200 },
]

export function productMock(mock) {
  // 获取产品列表
  mock.onGet('/products').reply(() => {
    return successResponse(mockProducts)
  })
  
  // 其他Mock接口...
}
```

然后在 `src/mock/index.js` 中注册：

```javascript
import { productMock } from './product'

export function setupMock(instance) {
  const mock = new MockAdapter(instance, { delayResponse: 300 })
  
  userMock(mock)
  gameMock(mock)
  productMock(mock)  // 添加这一行
  
  mock.onAny().passThrough()
}
```

### 3. 在组件中使用

```vue
<script setup>
import * as productApi from '@/api/product'

const fetchProducts = async () => {
  const res = await productApi.getProductList()
  console.log(res.data)
}
</script>
```

## 🎨 项目结构

```
src/
├── api/                    # API接口定义
│   ├── user.js            # 用户API
│   └── game.js            # 游戏API
├── store/                  # 状态管理
│   └── index.js           # Pinia stores
├── utils/                  # 工具函数
│   └── request.js         # Axios封装
├── mock/                   # Mock数据
│   ├── index.js           # Mock配置
│   ├── user.js            # 用户Mock
│   └── game.js            # 游戏Mock
├── examples/               # 使用示例
│   ├── StoreExample.vue   # 状态管理示例
│   └── ApiExample.vue     # API请求示例
├── views/                  # 页面组件
├── components/             # 通用组件
├── router/                 # 路由配置
└── main.js                # 入口文件
```

## 🚀 生产环境部署

### 1. 构建项目
```bash
npm run build
```

### 2. 配置生产环境API

修改 `.env.production` 文件：
```env
VITE_API_BASE_URL=https://your-api-domain.com/api
VITE_MOCK_ENABLED=false
```

### 3. 部署dist目录

将 `dist/` 目录部署到您的Web服务器即可。

## 📖 更多文档

- **API详细文档**: 查看 `README_API.md`
- **组件文档**: 查看各组件目录下的README
- **在线示例**: 启动项目后访问 `/examples/store` 和 `/examples/api`

## ❓ 常见问题

### Q: Mock数据不生效？
A: 检查 `.env.development` 文件中 `VITE_MOCK_ENABLED` 是否为 `true`，并重启开发服务器。

### Q: 请求报401错误？
A: 检查是否已登录并且token是否有效。Mock模式下可使用 `admin/123456` 登录。

### Q: 如何禁用加载动画？
A: 在API调用时传入配置：`request.get('/api', {}, { loading: false })`

### Q: 如何添加自定义请求头？
A: 在 `src/utils/request.js` 的请求拦截器中添加。

## 🎉 开始使用

现在您可以：

1. ✅ 查看示例页面了解如何使用
2. ✅ 在您的组件中使用状态管理
3. ✅ 调用已封装的API接口
4. ✅ 使用Mock数据进行开发
5. ✅ 根据需要添加新的API和Mock数据

祝您开发愉快！🚀
