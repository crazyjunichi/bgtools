import { LucideProvider } from 'lucide-react'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createHashRouter, RouterProvider } from 'react-router-dom'
import App from './App'
import './index.css'
import Home from './pages/Home'
import NotFound from './pages/NotFound'
import { tools } from './tools/registry'

// hash 路由：静态托管无需配置 SPA rewrite，直接部署即可
const router = createHashRouter([
  {
    path: '/',
    element: <App />,
    children: [
      { index: true, element: <Home /> },
      ...tools.map((tool) => ({
        path: tool.id,
        lazy: async () => ({ Component: (await tool.load()).default }),
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
