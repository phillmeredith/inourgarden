import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import fs from 'node:fs'
import path from 'node:path'
import pkg from './package.json'

// Plugin: return real 404s for /models/ requests instead of SPA fallback HTML.
// Transformers.js probes for optional files (tokenizer.json, model_quantized.onnx, etc.)
// and needs proper 404s to skip them gracefully.
function modelsNoFallback() {
  return {
    name: 'models-no-fallback',
    configureServer(server: any) {
      server.middlewares.use((req: any, res: any, next: any) => {
        if (req.url?.startsWith('/models/')) {
          const filePath = path.join(process.cwd(), 'public', req.url)
          if (!fs.existsSync(filePath)) {
            res.statusCode = 404
            res.end('Not found')
            return
          }
        }
        next()
      })
    },
  }
}

export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
  plugins: [
    modelsNoFallback(),
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: "In our garden",
        short_name: 'In our garden',
        description: 'Explore, identify, and collect bird sightings',
        theme_color: '#333626',
        background_color: '#4f523f',
        start_url: '/',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
          { src: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
        ],
      },
      workbox: {
        maximumFileSizeToCacheInBytes: 10 * 1024 * 1024,
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webp,jpg}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: { cacheName: 'google-fonts-cache' },
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: { '@': '/src' },
    dedupe: ['react', 'react-dom'],
  },
  optimizeDeps: {
    include: ['dexie', 'dexie-react-hooks', 'react', 'react-dom'],
  },
})
