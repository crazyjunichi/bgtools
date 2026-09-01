# BGTools 项目基线

桌游工具合集，纯前端 SPA。项目介绍与命令见 [README.md](README.md)，配色/字号/布局的完整规范与取值依据见 [docs/DESIGN.md](docs/DESIGN.md)。本文件只写**写代码时必须遵守的约束**。

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

## 通用小工具（quick）

骰子、计时器这类**任何游戏都可能临时用一下**的东西不进首页宫格，而是常驻顶栏图标，点开是居中 dialog，用完关掉、状态保留。

新增一个：建 `src/quick/<id>/`（组件 + `store.ts`），在 [src/quick/registry.ts](src/quick/registry.ts) 追加一行。顶栏按钮自动出现。

不许违反的三条：

- **浮层绝不能挂在 `<header>` 内部**。工具页顶栏带 `translate-y-*` + `backdrop-blur`，两者都会成为 `fixed` 的包含块 —— 挂里面的 dialog 会跟着顶栏平移出屏并继承 `pointer-events-none`。顶栏里只放按钮（[QuickBar](src/quick/QuickBar.tsx)），浮层由 [QuickLayer](src/quick/QuickLayer.tsx) 在 App 层渲染，两边靠 [quick/store.ts](src/quick/store.ts) 通信
- **`<QuickLayer />` 不带 key**，必须跨页面常驻：计时器的到时判定要在 dialog 关掉、甚至换了工具页之后依然生效
- **持续型状态（倒计时）存绝对时刻**（`endAt`），不存累减的剩余秒 —— 平板切后台 / 息屏时 interval 会被节流甚至挂起，累减必然漂移

约定：persist 的 `name` 用 `bgtools:quick-<id>`；与同名工具页**状态完全独立**（顺手掷一下不该污染骰子页的历史），只共享 [shared/random.ts](src/shared/random.ts) 这类纯函数。

## 运行场景基线（每个工具都要满足）

**平板横屏、平放在桌面中央、多人斜视、视距 50–70cm。** 完整规范与取值依据见 [docs/DESIGN.md](docs/DESIGN.md)，以下是不许违反的部分：

- **一屏放完，页面级不滚动**。[App.tsx](src/App.tsx) 外壳是 `h-dvh overflow-hidden`，工具页统一套 [ToolLayout](src/shared/components/ToolLayout.tsx)（左控制栏 + 右主显示区）。次要列表可以在自己的框里 `overflow-y-auto`，页面不许翻页
- **返回/全屏/通用小工具入口由 [AppHeader](src/AppHeader.tsx) 统一提供**，工具页里不要自己画返回键、全屏键或标题栏。它在工具页 3 秒后自动收起（`absolute` overlay，不占布局高度），轻点屏幕顶部热区唤出 —— 所以工具页最顶部别放需要精准点击的控件
- 触控目标 **≥ 56px**（`size-14` / `min-h-14`，即 `btn-base` 默认值），次要按钮不低于 `min-h-12`
- 最小字号 `text-xs`（12px，仅限角标/图例），标签说明用 `text-sm` 起
- 破坏性操作（清零/重置/删除）必须走 [ConfirmButton](src/shared/components/ConfirmButton.tsx)，桌上极易误触
- 多态控件**不许只靠颜色区分**，至少再加一种编码（角标/删除线/文案）
- 需要长时间盯屏的工具必须调 [useWakeLock](src/shared/hooks/useWakeLock.ts)
- 贴边布局用 `safe-t` / `safe-b` / `safe-x` utility 避让刘海
- 深色单一主题，不做主题切换

## 样式约束

- **禁止动态拼接 Tailwind 类名**（`` `bg-${color}-500` `` 编译期扫不到）。按 [Home.tsx](src/pages/Home.tsx) 的写法用显式 `Record` 映射表
- 自定义色只用 `@theme` 里的 `ink` / `surface` / `surface-2` / `surface-3` / `line` / `text` / `text-muted` / `text-dim`，其余用 Tailwind 内置色板
- **`text-dim` 是最暗档，不许再往下**（`slate-500` 及更暗在桌上等于看不见）
- 语义色档位：文字用 `-300`，实心底用 `-400 + text-ink`，淡底用 `-500/15 + border-<c>-500/60`；危险实心用 `bg-rose-600 text-white font-bold`（**不要 `rose-500` + 白字**，只有 3.75:1）
- 语义色分工：`rose` 只给破坏性/危险，`emerald` 完成，`sky` 信息与中性选中，`amber` 警告。**不设全局主色**，主操作色取各工具 `meta.accent`；若与语义撞车让 accent 让位（见炸弹克星人数选择器用 `sky`）
- 复用 utility：`card`、`section-label`、`btn-base`（只管尺寸不管颜色）、`btn-quiet`
- 会变化的数字加 `font-mono tabular-nums`，关键数字用 `text-data` / `text-data-sm`（跟视口高走，别写死 px）
- 过渡只用 `transition-transform duration-75`，别用通用 `transition`（颜色跟着渐变会让点按反馈发钝）

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

改了样式或布局的，再走一遍 [docs/DESIGN.md](docs/DESIGN.md) 第 7 节的自检清单（1180×820 无滚动条、无 `slate-*`、无小于 12px 字号）。

**不要在会话里起 dev server**（`npm run dev`、`preview` 等常驻进程），由我自己跑。
