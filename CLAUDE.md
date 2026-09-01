# BGTools 项目基线

桌游工具合集，纯前端 SPA。项目介绍与命令见 [README.md](README.md)，本文件只写**写代码时必须遵守的约束**。

## 技术栈（已定，不要替换）

React 19 · TypeScript 6 · Vite 8 · Tailwind CSS 4 · Zustand 5 · React Router 7

- **Tailwind 4 无配置文件**：主题在 [src/index.css](src/index.css) 的 `@theme` 里，不要创建 `tailwind.config.js` 或 `postcss.config.js`
- **hash 路由**（`createHashRouter`）：为了静态托管免配 rewrite，不要改成 BrowserRouter
- **`base: './'`**：产物路径必须保持相对，新增静态资源引用不要写绝对路径 `/xxx`
- **纯本地、无后端**：状态一律 localStorage，不引入网络请求

## 新增工具的机械流程

1. 建 `src/tools/<id>/`
2. `meta.ts` 导出 `ToolMeta`（见 [src/tools/types.ts](src/tools/types.ts)）
3. 页面组件 **default export**，状态放同目录 `store.ts`
4. 在 [src/tools/registry.ts](src/tools/registry.ts) 追加一行 `{ ...xxxMeta, load: () => import('./xxx/XxxPage') }`

首页宫格和路由自动生成。**不要手写路由或首页入口。**

约定：
- `id` 即路由 path，用 kebab-case
- persist 的 `name` 统一 `bgtools:<id>` 前缀，`partialize` 只存该持久化的字段（`last`、`rolling` 这类瞬时状态不存）
- 图标用 emoji，不引图标库

## 移动端基线（每个工具都要满足）

- 触控目标 ≥ 44px（现有按钮用 `size-12` / `py-2.5` 起）
- 破坏性操作（清零/重置/删除）必须走 [ConfirmButton](src/shared/components/ConfirmButton.tsx)，桌上极易误触
- 需要长时间盯屏的工具（计时器、计分板）必须调 [useWakeLock](src/shared/hooks/useWakeLock.ts)
- 贴边布局用 `safe-t` / `safe-b` / `safe-x` utility 避让刘海
- 深色单一主题，不做主题切换

## 样式约束

- **禁止动态拼接 Tailwind 类名**（`` `bg-${color}-500` `` 编译期扫不到）。按 [Home.tsx](src/pages/Home.tsx) 的写法用显式 `Record` 映射表
- 自定义色只用 `@theme` 里的 `ink` / `surface` / `surface-2` / `line`，其余用 Tailwind 内置色板
- 会变化的数字加 `font-mono tabular-nums`，否则动画时宽度会跳

## 随机数

任何随机（骰子、抽签、洗牌、首位玩家）必须用 `crypto.getRandomValues` + 拒绝采样，参考 [dice/store.ts](src/tools/dice/store.ts) 的 `rollDie`。**不要用 `Math.random`** —— 桌游场景下公平性会被玩家当场质疑。例外：纯视觉动画的假值可以用 `Math.random`。

## 共享层

`src/shared/` 只放**已被两个以上工具用到**的东西。单个工具专用的组件留在工具目录内，第二次用到时再上提。

## 验收

改完必须两条都干净，才算完成：

```bash
npm run build   # 含 tsc -b，类型错误会拦住
npm run lint    # oxlint，零 warning
```

**不要在会话里起 dev server**（`npm run dev`、`preview` 等常驻进程），由我自己跑。
