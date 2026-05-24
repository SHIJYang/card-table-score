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

    Icons({
      autoInstall: true,
    }),

    viteCompression({
      verbose: true,
      disable: false,
      threshold: 10240,
      algorithm: 'gzip',
      ext: '.gz',
    }),
    visualizer({ open: false }),

    // 🚀 通用图片代理插件（作为 Vite 插件，configureServer 钩子会正确注册）
    {
      name: 'image-proxy',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          if (!req.url?.startsWith('/proxy-img/')) {
            res.setHeader('X-Content-Type-Options', 'nosniff');
            return next();
          }

          const rawPath = req.url.split('?')[0].replace('/proxy-img/', '');
          const originalUrl = decodeURIComponent(rawPath);

          fetch(originalUrl, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
              'Referer': 'https://picui.cn/',
              'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
            },
            redirect: 'follow',
          })
            .then(async (resp) => {
              if (!resp.ok) throw new Error('HTTP ' + resp.status);
              const ct = resp.headers.get('content-type') || 'application/octet-stream';
              const buf = await resp.arrayBuffer();
              res.writeHead(200, {
                'Content-Type': ct,
                'Content-Length': buf.byteLength,
                'Access-Control-Allow-Origin': '*',
                'Cache-Control': 'public, max-age=31536000, immutable',
              });
              res.end(Buffer.from(buf));
            })
            .catch((err) => {
              console.error('[proxy-img] Error:', err.message);
              if (!res.headersSent) {
                res.writeHead(502, { 'Content-Type': 'text/plain' });
              }
              res.end('Proxy error: ' + err.message);
            });
        });
      }
    },
  ],

  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },

  css: {
    preprocessorOptions: {
      scss: {
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
    }
  },

  build: {
    target: 'esnext',
    minify: 'esbuild',
    chunkSizeWarningLimit: 2000,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('three') || id.includes('@tresjs') || id.includes('ogl')) {
              return '3d-engine';
            }
            if (id.includes('@mediapipe') || id.includes('mediapipe')) {
              return 'vision-ai';
            }
            if (id.includes('@dimforge/rapier3d') || id.includes('rapier')) {
              return 'physics';
            }
          }
        }
      }
    }
  }
})
