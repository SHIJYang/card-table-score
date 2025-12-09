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
     
      '/picui/': {
        // 目标服务器（图片托管的域名）
        target: 'https://free.picui.cn',
        
        changeOrigin: true, 
       
        rewrite: (path) => path.replace(/^\/picui/, '')
        // 推荐在开发环境中禁用 SSL 证书检查，但请谨慎使用
        // secure: false 
      }
    }
  },
})
