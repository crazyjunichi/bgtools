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
      // 刻意不用 autoUpdate：那一档等于 workbox 的 skipWaiting + clientsClaim，
      // 新 SW 一装好就接管当前页面并清掉旧 precache —— 桌上正开着的旧页面记的是旧 hash，
      // 懒加载的工具页当场 404（GitHub Pages 全站全量替换，服务器上也没有旧文件了）。
      // prompt 让新 SW 先等着，由 [UpdatePrompt](src/UpdatePrompt.tsx) 交给用户择时更新
      registerType: 'prompt',
      includeAssets: ['favicon.svg'],
      // manifest 是构建期静态的，运行时切语言不会变（同 index.html 的 title / lang）——
      // 这里的中文字面量是唯一允许留在源码里的一处，description 中英并排聊作缓解
      manifest: {    
        name: '桌游工具箱',
        short_name: 'BGTools',
        description: '桌游工具箱 · Board game tools',
        lang: 'zh-CN',
        theme_color: '#0b0f17',
        background_color: '#0b0f17',
        // fullscreen 让 Android 连状态栏一起隐藏：桌上平放的工具页不需要时间/电量，
        // 少一条状态栏也少一处高度误差来源。iOS 忽略此值仍按 standalone 走，
        // 所以 safe-area 避让（safe-t / safe-b / safe-x）不能拆
        display: 'fullscreen',
        // 不锁朝向：横竖屏都是一等场景（竖屏更常见），跟随设备即可。
        // 要固定某个朝向由用户点顶栏的朝向键（见 shared/hooks/useOrientation.ts）
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
        runtimeCaching: [
          {
            // 扫码发牌的排队请求**绝不能进缓存**：领牌是一次写入，
            // 拿到缓存里的旧快照就会算出别人那张牌。域名只匹配形态，
            // 具体地址由组织者运行时填，不进构建产物
            urlPattern: /^https:\/\/[^/]+\.(?:firebasedatabase\.app|firebaseio\.com)\//,
            handler: 'NetworkOnly',
          },
        ],
      },
    }),
  ],
})
