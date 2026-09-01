import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  // 相对路径产物：丢到任意静态托管的任意子目录都能直接跑
  base: './',
  server: {
    port: 9004,
    // 端口被占用时直接报错退出，而不是静默递增到下一个可用端口 —— 否则"固定端口"没意义
    strictPort: true,
  },
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      manifest: {
        name: '桌游工具箱',
        short_name: 'BGTools',
        description: '桌游桌上常用的计分、骰子、计时等工具合集',
        lang: 'zh-CN',
        theme_color: '#0b0f17',
        background_color: '#0b0f17',
        display: 'standalone',
        orientation: 'any',
        // base 为相对路径，start_url/scope 也必须相对
        start_url: '.',
        scope: './',
        icons: [
          // TODO: 需要 Android 自适应图标时补 192/512 的 maskable PNG
          { src: 'favicon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
      },
    }),
  ],
})
