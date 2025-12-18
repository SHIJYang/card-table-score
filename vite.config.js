import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

// 👇 引入自动导入插件
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    // 👇 配置自动导入 (Element Plus 按需引入)
    AutoImport({
      resolvers: [ElementPlusResolver()],
    }),
    Components({
      resolvers: [ElementPlusResolver()],
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    port: 5173,
    open: true,
    cors: true,
    proxy: {
      '/picui-proxy/': {
        // 目标服务器（图片托管的域名）
        target: 'https://free.picui.cn',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/picui-proxy/, '')
        // 推荐在开发环境中禁用 SSL 证书检查，但请谨慎使用
        // secure: false 
      }
    },
    // 添加安全响应头
    configureServer: (server) => {
      server.middlewares.use((_req, res, next) => {
        // 添加X-Content-Type-Options头，防止MIME类型嗅探攻击
        res.setHeader('X-Content-Type-Options', 'nosniff');
        next();
      });
    }
  },
  // 👇 生产环境构建配置 (新增分包策略)
  build: {
    chunkSizeWarningLimit: 1500, // 调高文件大小警告阈值 (1500kb)
    rollupOptions: {
      output: {
        // 手动分包，解决 chunk 过大问题
        manualChunks(id) {
          if (id.includes('node_modules')) {
            // 拆分 3D 库
            if (id.includes('three')) {
              return 'three';
            }
            // 拆分 AI 视觉库 (这个通常很大)
            if (id.includes('@mediapipe') || id.includes('mediapipe')) {
              return 'mediapipe';
            }
            // 拆分 UI 库
            if (id.includes('element-plus')) {
              return 'element-plus';
            }
            // 其他依赖
            return 'vendor';
          }
        }
      }
    }
  }
})