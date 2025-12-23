import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'
// 👇 1. 引入压缩插件
import viteCompression from 'vite-plugin-compression'
// 👇 2. 引入打包分析插件 (仅在分析时启用)
import { visualizer } from 'rollup-plugin-visualizer'

export default defineConfig({
  plugins: [
    vue(),
    AutoImport({ resolvers: [ElementPlusResolver()] }),
    Components({ resolvers: [ElementPlusResolver()] }),
    // 👇 开启 Gzip 压缩 (大幅减小网络传输体积)
    viteCompression({
      verbose: true,
      disable: false,
      threshold: 10240, // 大于 10kb 的文件才压缩
      algorithm: 'gzip',
      ext: '.gz',
    }),
    // 👇 生成 stats.html 分析文件 (构建后在根目录查看)
    visualizer({ open: false }) 
  ],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  server: {
    port: 5173,
    open: true,
    cors: true,
    proxy: {
      '/picui-proxy/': {
        target: 'https://free.picui.cn',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/picui-proxy/, '')
      }
    },
    configureServer: (server) => {
      server.middlewares.use((_req, res, next) => {
        res.setHeader('X-Content-Type-Options', 'nosniff');
        next();
      });
    }
  },
  build: {
    target: 'esnext', // 支持高级语法，生成的包更小
    minify: 'esbuild', // 构建速度更快
    chunkSizeWarningLimit: 2000,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            // 👇 进一步细化分包
            if (id.includes('three')) return 'three';
            if (id.includes('@mediapipe') || id.includes('mediapipe')) return 'mediapipe';
            if (id.includes('element-plus')) return 'element-plus';
            if (id.includes('lodash') || id.includes('axios')) return 'utils'; // 工具类
            if (id.includes('gsap') || id.includes('motion') || id.includes('animate')) return 'animation'; // 动画库
            
            return 'vendor';
          }
        }
      }
    }
  }
})