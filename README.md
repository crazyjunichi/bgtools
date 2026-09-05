# BGTools · 桌游工具箱

桌游桌上常用的小工具合集。纯前端、离线可用（PWA）。**为平板平放在桌面中央的场景设计，横竖屏都是一等布局（竖屏更常见）** —— 高对比深色主题、大号触控目标、每个工具一屏放完不翻页。设计规范见 [docs/DESIGN.md](docs/DESIGN.md)。

## 技术栈

React 19 + TypeScript + Vite 8 · Tailwind CSS 4 · Zustand（localStorage 持久化）· React Router 7（hash 路由）· i18next（简体中文 / English）

## 开发

```bash
npm install
npm run dev      # 开发服务
npm run build    # 类型检查 + 产物构建到 dist/
npm run preview  # 预览产物（可验证 PWA / Service Worker）
npm run lint     # oxlint
npm run typecheck # tsc -b，只做类型检查不出产物
```

产物 `base: './'`，`dist/` 可直接部署到任意静态托管的任意子目录。

DevTools 只能模拟单个指针，多点触摸测不了。手指抽选因此在 `dev` 下留了个钉针：**Alt + 点击**在触摸场上钉一个不随抬手消失的假触点，再 Alt + 点击它移除（[TouchField.tsx](src/tools/touch-pick/TouchField.tsx) 里 `import.meta.env.DEV` 包着，不进生产产物）。真实双指会不会被浏览器接管成缩放，仍然只能真机验。

## 新增一个工具

1. 建 `src/tools/<id>/` 目录
2. `meta.ts` 导出 `ToolMeta`（id / nameKey / descKey / icon / accent / category —— `category` 决定落首页的「通用工具」还是「游戏专用工具」区），文案本身写进 [locales/zh.ts](src/shared/i18n/locales/zh.ts) 与 [en.ts](src/shared/i18n/locales/en.ts) 的 `tools.<id>.*` —— 两边不同构会在 `tsc` 阶段报错
3. 页面组件默认导出，状态放同目录 `store.ts`（`persist` 的 name 用 `bgtools:<id>` 前缀）
4. 在 [src/tools/registry.ts](src/tools/registry.ts) 追加一行

首页入口和路由会自动生成，页面组件按需懒加载。顶栏常驻的通用小工具（骰子、计时器一类）流程类似，目录是 `src/quick/<id>/`，注册表是 [src/quick/registry.ts](src/quick/registry.ts)，入口常驻顶栏；`onHome` 一个字段同时决定两处露出 —— `true` 在首页宫格的「快捷工具」区放一张卡，`false` 则在首页顶栏放一个直达按钮（工具页顶栏两类都收进 tile 面板）。完整约束见 [CLAUDE.md](CLAUDE.md)。

## 目录结构

```
docs/DESIGN.md         # 设计规范：配色 / 字号 / 布局的取值依据
src/
  App.tsx              # 布局外壳（height:100% 一屏不滚，不用 h-dvh）
  AppHeader.tsx        # 顶栏：返回 / 朝向切换 / 小工具入口，常显（横屏变左侧竖条）
  index.css            # @theme 主题 token + card/btn-base 等 utility + wide/short variant
  main.tsx             # 由 registry 生成 hash 路由
  pages/               # 首页、404
  tools/               # 首页「通用 / 游戏专用」两区里的工具
    registry.ts        # 工具注册表 —— 唯一真源
    types.ts           # ToolMeta / ToolEntry 契约
    score/             # 多轮计分
    score-sheet/       # 计分纸
    bomb-busters/      # 炸弹克星辅助
    touch-pick/        # 手指抽选
  quick/               # 顶栏常驻小工具：居中 dialog，跨页面常驻不卸载
    registry.ts        # 小工具注册表
    dice/ timer/ pointer/ players/ settings/
  shared/
    components/        # ToolLayout（横屏双栏）、Split（按朝向排布）、Stepper（长按连增）、ConfirmButton（防误触）、Overlay
    players/           # 全局玩家名单 —— 跨工具共享的一份数据 + 15 色板
    i18n/              # 中英双语，locales/zh.ts 是文案真源
    hooks/             # useWakeLock（防息屏）、useFullscreen
    icons.ts           # lucide 图标的唯一出口，按语义名取
    random.ts          # crypto 随机：rollDie / shuffle
    haptics.ts tone.ts # 震动 / 提示音
```

## 已实现

首页分三区：**快捷工具**（骰子 / 计时器 / 指针，点开即弹窗，不离开首页）· **通用工具**（任何游戏都用得上）· **游戏专用工具**（炸弹克星 + 计分纸的每个模板各一个入口，点进去直接落到那张表；项数多，标题行带筛选框，中英文名与别名都能搜）。

有独立页面的工具：

- **多轮计分**：人数不设上限（临时席位，可逐个换成全局名单里的人）、一人一张卡（合计大字 + 领先者王冠 + 本轮得分 + 最近三轮），点卡片开浮层记分（±1/±10/±100 或直接改本轮那个大数字）、「记录」浮层里是完整的逐轮矩阵（新轮在上）、撤销
- **计分纸**：固定条目逐项结算的矩阵（横向是人、纵向是条目），点格子用右侧键盘输入；条目可设「每个 N 分」，格子里填数量、得分自动折算；自带 17 款游戏模板（通用空白 + 农场主、卡坦岛、阿纳克遗迹、喀斯喀迪亚、火星殖民地、大西部之路…，可搜中英文名与别名），切模板不清分数，只是把用不到的条目收起来
- **炸弹克星**：1–12 拆弹三态、按人数随机发放装备牌（可重发）、装备三态追踪、生命指示器（上限 6）
- **手指抽选**：所有人一起把手指按在屏幕上，≥2 指按住 1.2 秒出结果 —— 选一个（王冠高亮，其余压暗）／ 排序（各触点旁出名次）／ 分组（2–6 组，按组着色并出组号）。触点增减重置倒计时；结果锁定后不再受抬手影响，快照留在原位直到下一轮凑够两指

顶栏常驻的通用小工具（点开是居中浮层，用完关掉、状态保留）：

- **快速骰子**：d4 / d6 / d8 / d10 / d12 / d20，最多 4 颗同投
- **计时器**：快速档 + 自定义，存绝对到时时刻（切后台 / 息屏都不漂移），到时全屏提醒
- **随机指针**：转一下指个方向，报大致钟点
- **玩家名单**：桌上是谁、叫什么、拿哪色棋子。**这份名单跨工具共享**，各工具的「换人」直接从这里选；15 色板刻意避开语义色，颜色允许重复但一定同时出名字
- **设置**：中英切换

