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
        // 👇 6. 优化分包策略
        // 之前的逻辑很好，稍微做了整理，确保 three.js 生态不被打散导致加载错误
        manualChunks(id) {
          if (id.includes('node_modules')) {
            // 3D 引擎及相关库（TresJS 基于 Three，通常建议打包在一起避免上下文丢失）
            if (id.includes('three') || id.includes('@tresjs') || id.includes('ogl')) {
              return 'three-engine';
            }
            // 视觉识别大库
            if (id.includes('@mediapipe') || id.includes('mediapipe')) {
              return 'mediapipe';
            }
          
            // 动画库
            if (id.includes('gsap') || id.includes('motion') || id.includes('animate')) {
              return 'animation';
            }

            
          }
        }
      }
    }
  }
})