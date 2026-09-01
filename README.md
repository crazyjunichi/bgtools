# BGTools · 桌游工具箱

桌游桌上常用的小工具合集。纯前端、离线可用（PWA）、移动优先。

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
src/
  App.tsx              # 布局外壳（顶栏 / 返回 / 全屏）
  main.tsx             # 由 registry 生成 hash 路由
  pages/               # 首页、404
  tools/
    registry.ts        # 工具注册表 —— 唯一真源
    types.ts           # ToolMeta / ToolEntry 契约
    dice/              # 骰子工具
  shared/
    components/        # Stepper（长按连增）、ConfirmButton（防误触）
    hooks/             # useWakeLock（防息屏）、useFullscreen
    haptics.ts         # 震动反馈
```

## 已实现

- **骰子**：d4~d100，1–12 颗同投，d6 点阵显示，总和，历史记录 20 条

## 计划中

计分板 · 计时器/沙漏 · 随机首位玩家 · 转盘 · 分组抽签 · 生命值追踪 · 卡组抽卡
