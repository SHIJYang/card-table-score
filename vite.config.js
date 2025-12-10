import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
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
  // 为生产环境配置
  build: {
    // 如果使用Vite Preview或部署到生产环境，
    // 需要在服务器配置中添加相同的响应头
  }
})
