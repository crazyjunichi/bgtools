import { LucideProvider } from 'lucide-react'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createHashRouter, RouterProvider } from 'react-router-dom'
import App from './App'
import './index.css'
import Home from './pages/Home'
import LoadError from './pages/LoadError'
import NotFound from './pages/NotFound'
import StyleLab from './pages/StyleLab'
import { reloadOnceForStaleChunk } from './shared/staleChunk'
import { tools } from './tools/registry'

/*
 * 懒加载的工具页取不到 chunk 时自动重载一次（多半是刚部署过，详见 shared/staleChunk）。
 * 不 preventDefault：错误仍然要冒到路由的 errorElement，重载救不回来时才有界面可看。
 */
window.addEventListener('vite:preloadError', () => {
  reloadOnceForStaleChunk()
})

// hash 路由：静态托管无需配置 SPA rewrite，直接部署即可
const router = createHashRouter([
  {
    path: '/',
    element: <App />,
    children: [
      { index: true, element: <Home /> },
      // ⚠️ 临时风格样板间，选定首页风格后连同 pages/StyleLab.tsx 一起删
      { path: 'style-lab', element: <StyleLab /> },
      ...tools.map((tool) => ({
        path: tool.id,
        lazy: async () => ({ Component: (await tool.load()).default }),
        // chunk 拉不到时不要落到 React Router 的默认报错页
        errorElement: <LoadError />,
      })),
      { path: '*', element: <NotFound /> },
    ],
  },
])

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {/* 描边 2.25 而非默认 2：平板平放桌面、视距 50–70cm 斜视 45°，细线会糊断。
        尺寸不在这里给 —— 各处用 size-* 类，CSS 才能压过 svg 的 width/height 属性 */}
    <LucideProvider strokeWidth={2.25}>
      <RouterProvider router={router} />
    </LucideProvider>
  </StrictMode>,
)
