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
    <RouterProvider router={router} />
  </StrictMode>,
)
