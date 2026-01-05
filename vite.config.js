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

    // 👇 1. API 自动导入 (核心自动化)
    // 让你不再需要写: import { ref, computed, watch } from 'vue'
    // 也不需要写: import { useRoute, useRouter } from 'vue-router'
    AutoImport({
      // 自动导入 Vue, Vue-Router, Pinia 的核心 API
      imports: ['vue', 'vue-router', 'pinia'],
      // 自动导入 /src/store 下的模块（例如 const userStore = useUserStore()）
      dirs: ['./src/store'], 
      resolvers: [
        ElementPlusResolver(),
        // 自动导入图标组件的解析器
        IconsResolver({ prefix: 'Icon' }), 
      ],
      // 生成类型声明文件，解决 ESLint/TS 报错（根目录下会生成 auto-imports.d.ts）
      dts: 'auto-imports.d.ts', 
      eslintrc: {
        enabled: true, // 1. 改为 true 用于生成 .eslintrc-auto-import.json
      },
    }),

    // 👇 2. 组件自动注册
    // 让你不再需要手动 import MyComponent form './components/MyComponent.vue'
    Components({
      // 指定组件位置，默认为 src/components
      dirs: ['src/components'],
      // 允许子目录作为组件的命名空间
      directoryAsNamespace: true,
      resolvers: [
        // Element Plus 组件自动按需引入
        ElementPlusResolver(),
        // 👇 3. 图标组件自动引入
        // 使用方式: <i-ep-edit /> (ep 代表 element-plus set)
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
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },

  css: {
    // 👇 5. 全局样式自动化 (可选)
    // 如果你有全局变量文件，配置在这里后，每个 SCSS 文件都会自动引入，无需 @use
    preprocessorOptions: {
      scss: {
        // additionalData: `@use "@/assets/styles/variables.scss" as *;` 
        api: 'modern-compiler', // 使用更快的 sass-embedded 编译器
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
        // manualChunks(id) {
        //   if (id.includes('node_modules')) {
        //     // 3D 引擎及相关库（TresJS 基于 Three，通常建议打包在一起避免上下文丢失）
        //     if (id.includes('three') || id.includes('@tresjs') || id.includes('ogl')) {
        //       return 'three-engine';
        //     }
        //     // 视觉识别大库
        //     if (id.includes('@mediapipe') || id.includes('mediapipe')) {
        //       return 'mediapipe';
        //     }
        //     // UI 库
        //     if (id.includes('element-plus')) return 'element-plus';
            
        //     // 动画库
        //     if (id.includes('gsap') || id.includes('motion') || id.includes('animate')) {
        //       return 'animation';
        //     }

        //     // 其他依赖归为 vendor
        //     return 'vendor';
        //   }
        // }
      }
    }
  }
})