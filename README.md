# score-management（游戏乐园）

基于 Vue 3 + Vite 的个人娱乐站点：包含小游戏（贪吃蛇、五子棋、2048、商店、计分板）、3D 场景演示（TresJS + Rapier 物理小人、宠物狗、圣诞树）、图床图片管理、手势识别互动等功能。

## 技术栈

| 类别 | 选型 |
| --- | --- |
| 框架 | Vue 3（`<script setup>`）+ Vue Router + Pinia |
| 构建 | Vite 7 |
| UI | Element Plus（按需自动导入）+ vue-i18n 国际化 |
| 3D / 物理 | Three.js + TresJS（core / cientos）+ Rapier（rapier3d-compat） |
| 动效 | GSAP |
| 网络 | Axios（图床 API：picui.cn） |

## 快速开始

```bash
npm install
npm run dev        # 开发（http://localhost:5173）
npm run build      # 生产构建（输出 dist/，同时生成 gzip 与 stats.html）
npm run preview    # 本地预览构建产物
```

环境要求：Node.js >= 22.12。

## 目录结构

```
├── api/                  # Vercel Serverless（图片代理 /api/proxy-img）
├── public/               # 静态资源（favicon、图标、3D 模型、sw.js）
├── src/
│   ├── api/              # 图床接口封装
│   ├── assets/           # 音效包、音乐列表等资源
│   ├── components/       # 组件（gsap/ 特效、tres/ 3D、world/ 场景、play/ 控件…）
│   ├── composables/      # useGamePhysics / useJoystick / useKeyboard
│   ├── config/           # 模型与珠子配色配置
│   ├── locales/          # i18n 语言包（zh-CN / en-US）
│   ├── plugins/          # i18n 插件
│   ├── router/           # 路由（所有页面在此注册）
│   ├── store/            # Pinia（modules/ 下按职责拆分）
│   ├── theme/            # 自定义主题
│   ├── utils/            # 音频引擎、mikutap、视觉特效
│   └── views/            # 页面（与路由一一对应）
├── vite.config.js        # 构建配置（自动导入、压缩、代理、分包）
└── vercel.json           # Vercel 部署配置（SPA 回退 + 图片代理）
```

## 部署

- **Vercel**（主要方式）：`vercel.json` 提供 SPA 回退；`/proxy-img` 由 `api/proxy-img.js` Serverless 函数代理外部图片，解决 WebGL 纹理跨域。
- **Service Worker**：`public/sw.js` 仅用于缓存 MediaPipe 手势识别的 CDN 资源（trees 页手势控制使用），生产环境自动注册。

## 说明

- `auto-imports.d.ts`、`components.d.ts` 由 unplugin 插件在 dev/build 时自动生成。
- 3D 模型（KayKit、huohuo 等）仅保留运行时实际引用的 glTF/glB 文件，许可证见 `public/models/KayKit/License.txt`。
