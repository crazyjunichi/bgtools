# BGTools · 桌游工具箱

桌游桌上常用的小工具合集。纯前端、离线可用（PWA）。**为平板横屏、平放在桌面中央的场景设计** —— 高对比深色主题、大号触控目标、每个工具一屏放完不翻页。设计规范见 [docs/DESIGN.md](docs/DESIGN.md)。

## 技术栈

React 19 + TypeScript + Vite 8 · Tailwind CSS 4 · Zustand（localStorage 持久化）· React Router 7（hash 路由）

## 开发

```bash
npm install
npm run dev      # 开发服务
npm run build    # 类型检查 + 产物构建到 dist/
npm run preview  # 预览产物（可验证 PWA / Service Worker）
npm run lint     # oxlint
```

产物 `base: './'`，`dist/` 可直接部署到任意静态托管的任意子目录。

## 新增一个工具

1. 建 `src/tools/<id>/` 目录
2. `meta.ts` 导出 `ToolMeta`（id / name / desc / icon / accent）
3. 页面组件默认导出，状态放同目录 `store.ts`（`persist` 的 name 用 `bgtools:<id>` 前缀）
4. 在 [src/tools/registry.ts](src/tools/registry.ts) 追加一行

首页宫格和路由会自动生成，页面组件按需懒加载。

## 目录结构

```
docs/DESIGN.md         # 设计规范：配色 / 字号 / 布局的取值依据
src/
  App.tsx              # 布局外壳（h-dvh 一屏 · 顶栏 / 返回 / 全屏）
  index.css            # @theme 主题 token + card/btn-base 等 utility
  main.tsx             # 由 registry 生成 hash 路由
  pages/               # 首页、404
  tools/
    registry.ts        # 工具注册表 —— 唯一真源
    types.ts           # ToolMeta / ToolEntry 契约
    dice/              # 骰子工具
    score/             # 通用计分板
    bomb-busters/      # 炸弹克星辅助
  shared/
    components/        # ToolLayout（横屏双栏）、Stepper（长按连增）、ConfirmButton（防误触）
    hooks/             # useWakeLock（防息屏）、useFullscreen
    haptics.ts         # 震动反馈
```

## 已实现

- **骰子**：d4~d100，1–12 颗同投，d6 点阵显示，总和，历史记录 20 条
- **计分板**：人数不设上限（临时席位，可逐个换成全局名单里的人）、一人一张卡（合计大字 + 领先者王冠 + 本轮得分 + 最近三轮），点卡片开浮层记分（±1/±10/±100 或直接改本轮那个大数字）、「记录」浮层里是完整的逐轮矩阵（新轮在上）、撤销
- **炸弹克星**：1–12 拆弹三态、按人数随机发放道具牌（可重发）、道具三态追踪、生命指示器（上限 6）

## 计划中

随机首位玩家 · 转盘 · 分组抽签 · 生命值追踪 · 卡组抽卡
