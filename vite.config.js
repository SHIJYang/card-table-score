import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

// 自动化插件
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'
import Icons from 'unplugin-icons/vite'
import IconsResolver from 'unplugin-icons/resolver'

// 优化插件
import viteCompression from 'vite-plugin-compression'
import { visualizer } from 'rollup-plugin-visualizer'

export default defineConfig({
  plugins: [
    vue({
      template: {
        compilerOptions: {

          isCustomElement: (tag) =>
            (tag.startsWith('Tres') && tag !== 'TresCanvas') || tag === 'primitive',
          "baseUrl": ".",
          "paths": {
            "@/*": ["src/*"]
          }
        },
      },
    }),

 
    AutoImport({
      
      imports: ['vue', 'vue-router', 'pinia'],
      
      dirs: ['./src/store'],
      resolvers: [
        ElementPlusResolver(),
        // 自动导入图标组件的解析器
        IconsResolver({ prefix: 'Icon' }),
      ],
  
      dts: 'auto-imports.d.ts',
      eslintrc: {
        enabled: true, 
      },
    }),

    
    Components({
   
      dirs: ['src/components'],
      directoryAsNamespace: true,
      resolvers: [
        ElementPlusResolver(),
        IconsResolver({
          enabledCollections: ['ep'],
        }),
      ],
      dts: 'components.d.ts',
    }),

    // 👇 4. 图标自动加载引擎
    Icons({
      autoInstall: true, // 如果检测到未安装的图标集，自动尝试安装
    }),

    viteCompression({
      verbose: true,
      disable: false,
      threshold: 10240,
      algorithm: 'gzip',
      ext: '.gz',
    }),
    visualizer({ open: false })
  ],

  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)),
     
     },
  },

  css: {
    
    preprocessorOptions: {
      scss: {
       //additionalData: `@use "@/assets/styles/variables.scss" as *;`,
        api: 'modern-compiler',
        silenceDeprecations: ['legacy-js-api'],
      }
    }
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
    // 安全策略头
    configureServer: (server) => {
      server.middlewares.use((_req, res, next) => {
        res.setHeader('X-Content-Type-Options', 'nosniff');
        next();
      });
    }
  },

  build: {
    target: 'esnext',
    minify: 'esbuild',
    chunkSizeWarningLimit: 2000,
    rollupOptions: {
      output: {
        // 👇 优化分包策略：只有极耗内存的库才分包，其他都在主包
        manualChunks(id) {
          if (id.includes('node_modules')) {
            // 3D 引擎生态（Three.js + TresJS + OGL）- 极耗内存，必须分包
            if (id.includes('three') || id.includes('@tresjs') || id.includes('ogl')) {
              return '3d-engine';
            }
            // 视觉识别库（MediaPipe）- 模型文件巨大，必须分包
            if (id.includes('@mediapipe') || id.includes('mediapipe')) {
              return 'vision-ai';
            }
            // 物理引擎（Rapier3D）- WASM 文件很大，必须分包
            if (id.includes('@dimforge/rapier3d') || id.includes('rapier')) {
              return 'physics';
            }
            // 其他库（Vue、Element Plus、动画库等）都打包到主包，减少请求数
          }
        }
      }
    }
  }
})