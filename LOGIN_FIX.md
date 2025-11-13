# 登录问题修复说明

## 修复的问题

### 1. **请求拦截器中的 Pinia Store 访问问题**
**问题**：在 `request.js` 的请求拦截器中直接调用 `useUserStore()` 可能在 Pinia 未完全初始化时失败。

**解决方案**：
- 在请求拦截器中直接从 `localStorage` 获取 token
- 避免在拦截器中依赖 Pinia Store

```javascript
// 修改前
const userStore = useUserStore()
const token = userStore.token

// 修改后
const token = localStorage.getItem('token')
```

### 2. **响应拦截器错误处理优化**
**问题**：
- 在拦截器中直接显示错误消息，导致业务层无法自定义错误提示
- 401/403 错误处理时可能因 Pinia 未初始化而失败

**解决方案**：
- 移除拦截器中的 `ElMessage.error()`，让业务层处理错误提示
- 使用 try-catch 包裹 `useUserStore()` 调用，避免崩溃
- 优先清除 `localStorage` 中的 token

```javascript
// 401/403 错误处理
localStorage.removeItem('token')
try {
  const userStore = useUserStore()
  userStore.logout()
} catch (e) {
  console.warn('无法访问 userStore:', e)
}
```

### 3. **User Store 登录逻辑增强**
**问题**：登录失败时错误信息不够详细

**解决方案**：
- 添加响应数据格式验证
- 增强错误处理和日志记录
- 显示更友好的错误消息

```javascript
async login(loginForm) {
  try {
    const res = await userApi.login(loginForm)
    
    // 检查响应数据
    if (!res || !res.data) {
      throw new Error('登录响应数据格式错误')
    }
    
    // 保存数据...
    ElMessage.success(res.message || '登录成功')
    return true
  } catch (error) {
    console.error('登录失败:', error)
    const errorMsg = error.message || error.response?.data?.message || '登录失败'
    ElMessage.error(errorMsg)
    return false
  }
}
```

### 4. **Mock 数据错误处理**
**问题**：Mock 处理器没有错误捕获机制

**解决方案**：
- 在 Mock 处理器中添加 try-catch
- 返回更详细的错误信息

```javascript
mock.onPost('/user/login').reply((config) => {
  try {
    const { username, password } = JSON.parse(config.data)
    // ... 处理逻辑
  } catch (error) {
    console.error('登录 Mock 错误:', error)
    return errorResponse('登录请求处理失败', 500)
  }
})
```

### 5. **应用初始化顺序优化**
**问题**：Mock 在 Pinia 之前初始化，可能导致某些依赖 Store 的功能失败

**解决方案**：调整 `main.js` 中的初始化顺序

```javascript
// 修改前
setupMock(request)
const app = createApp(App)
const pinia = createPinia()
app.use(pinia)

// 修改后
const app = createApp(App)
const pinia = createPinia()
app.use(pinia)
setupMock(request)  // 在 Pinia 之后初始化
```

### 6. **Mock 系统日志增强**
添加了更详细的初始化日志，方便调试：

```
🎭 Mock数据已启用
✅ 用户Mock已注册
✅ 游戏Mock已注册
🚀 Mock系统初始化完成
```

## 测试登录功能

### 测试账号
- **用户名**: `admin`
- **密码**: `123456`

或

- **用户名**: `user`
- **密码**: `123456`

### 测试步骤
1. 重启开发服务器：`npm run dev`
2. 打开浏览器控制台，查看 Mock 初始化日志
3. 点击导航栏右侧的用户菜单
4. 点击"登录"
5. 输入用户名（如 `admin`）
6. 点击确认

### 预期结果
- ✅ 显示"登录成功"提示
- ✅ 用户头像和名称更新
- ✅ 自动跳转到个人设置页面
- ✅ 用户菜单显示"个人设置"和"退出登录"选项

## 常见问题排查

### 问题1：登录后没有跳转
**检查**：
- 路由是否正确配置 `/user/settings`
- 浏览器控制台是否有路由错误

### 问题2：提示"登录响应数据格式错误"
**检查**：
- Mock 是否正确初始化（查看控制台日志）
- `.env.development` 中 `VITE_MOCK_ENABLED` 是否为 `true`

### 问题3：Token 未保存
**检查**：
- 浏览器 localStorage 中是否有 `token` 字段
- 打开开发者工具 → Application → Local Storage

### 问题4：401 错误
**检查**：
- Mock 数据中的用户名和密码是否匹配
- 请求头中是否正确携带 Authorization

## 文件修改清单

- ✅ `src/utils/request.js` - 优化拦截器逻辑
- ✅ `src/store/modules/user.js` - 增强登录错误处理
- ✅ `src/mock/user.js` - 添加错误捕获
- ✅ `src/mock/index.js` - 增强日志输出
- ✅ `src/main.js` - 调整初始化顺序

## 下一步建议

1. **添加登录表单页面**：创建专门的登录页面，而不是使用弹窗
2. **添加注册功能**：在导航栏添加注册入口
3. **记住密码功能**：使用 localStorage 保存用户偏好
4. **自动登录**：页面刷新时自动恢复登录状态
5. **Token 过期处理**：添加 token 刷新机制
