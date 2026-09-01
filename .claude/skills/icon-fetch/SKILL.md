---
name: icon-fetch
description: 为 BGTools 找图标 / 换图标 / 加图标。当用户说"找个图标、换个 icon、这里的图标不对、补个 PWA 图标"时使用此 skill。
---

# 图标查找与接入

BGTools 的图标不是一套而是**三套**，先分流再动手 —— 走错分支的代价是把内容标识换成单色线条（桌上斜视认不出）或给功能按钮塞 emoji（字形随系统漂移）。

## 第 0 步：判断属于哪一类

| 这个图标代表… | 走哪套 | 落点 |
|---|---|---|
| 一个**动作 / chrome UI**（返回、关闭、暂停、加减、删除、设置、切页） | lucide-react | [src/shared/icons.ts](../../../src/shared/icons.ts) 加语义名，见 A |
| 一个**东西 / 身份**（工具封面、装备卡、状态档位） | emoji | 直接写字面量，见 B —— **不要抓图标** |
| 一款**真实桌游的盒图**（BGG 上有条目） | BGG 抓图 | 转 [bgg-cover](../bgg-cover/SKILL.md)，本 skill 不处理 |
| 一个**静态图像文件**（favicon、PWA maskable PNG） | Iconify 下载 | `public/` + vite manifest，见 C |

判据就是 CLAUDE.md 的那句：「这东西代表一个动作，还是代表一个东西」。拿不准时问用户它出现在哪 —— 出现在按钮里 → A，出现在卡片/宫格里当主体 → B。

---

## A. 功能按钮图标（主流程）

lucide-react 已在 `package.json` 里（v1），**不需要下载任何文件**，只是「挑一个名字 + 在 icons.ts 加一行别名」。

### A1. 语义搜索候选

lucide 官网搜索不好从命令行用，借 Iconify 的 lucide 镜像搜（它同时匹配 name / aliases / 关键词，比猜名字准）：

```bash
curl -s "https://api.iconify.design/search?query=<关键词>&prefix=lucide&limit=20" | python -m json.tool
```

- 关键词用**英文动作词**，中文搜不到（`shuffle` / `undo` / `hourglass` / `swap`）
- 一个词搜不到就换同义词，别硬拼名字
- Iconify 镜像可能比本地装的 lucide 版本旧，**它只用来发现候选，不作为存在性依据**（存在性看 A3）

### A2. 给用户确认外观

终端渲染不了图，给可点链接让用户自己看，别替用户拍板：

```
- hourglass  → https://lucide.dev/icons/hourglass
- timer-reset → https://lucide.dev/icons/timer-reset
```

需要在 IDE 里直接看图时，把候选拉到临时目录再让用户点开（描一个亮色，否则深色 IDE 里黑描边看不见）：

```bash
mkdir -p .tmp-icons && for n in hourglass timer-reset; do
  curl -s "https://api.iconify.design/lucide/$n.svg?width=96&color=%23e2e8f0" -o ".tmp-icons/$n.svg"
done
```

用完 `rm -rf .tmp-icons`，**不要**留在仓库里。

### A3. 校验本地导出名（必做）

lucide v1 大规模改过名（`AlertTriangle` → `TriangleAlert`、`AlignCenter` → `TextAlignCenter`），旧名虽然还作为 deprecated 别名导出，但随时会删。以本地 d.ts 的 `declare const` 为唯一真源，PascalCase 化 kebab 名后校验：

```bash
grep -cE "^declare const (Hourglass|TimerReset):" node_modules/lucide-react/dist/lucide-react.d.ts
```

- 命中数 = 候选数才算通过；缺了说明名字错或本地版本没有
- 结果里挑出的必须是 `declare const X:` 那个名字，**不要用 `Y as X` 的别名形式**
- 顺手看一眼有没有更贴切的同族名：`grep -oE "^declare const Timer[A-Za-z]*" node_modules/lucide-react/dist/lucide-react.d.ts`

### A4. 接入 icons.ts

在 `export { … } from 'lucide-react'` 里加一行，**按语义别名（`Icon*`）的字母序插入**，不是按 lucide 原名：

```ts
  History as IconHistory,
  Hourglass as IconHourglass,   // ← 新增
  Lock as IconLocked,
```

命名规矩：
- 语义名描述**动作/角色**，不描述形状 —— `IconReset` 而不是 `IconRotateCcw`（换库或换字形时调用点不用动）
- 同一个动作全项目只准有一个语义名；先搜一遍 `grep -n "Icon" src/shared/icons.ts` 确认没有近义的已存在项，有就复用，别新增第二个
- 业务文件只 `import { IconXxx } from '@/shared/icons'`（相对路径按所在目录），**不许直接 `import 'lucide-react'`**

### A4b. 如果是快捷工具（quick）

[quick/registry.ts](../../../src/quick/registry.ts) 的每个工具除 `icon` 还要给 `accent`（`QuickAccent`），[QuickMenu](../../../src/quick/QuickMenu.tsx) 的 tile 拿它渲染图标底下的淡底色块。**取值规则：等于该工具 dialog 内部已有的主色**（骰子 amber / 计时器 sky / 指针 violet / 名单 teal），不要另挑新色 —— 点开前后色相一致才是一套记忆。非工具性质的配置项用 `neutral`。要加新色相时同步 `QuickAccent` 联合类型和 `ACCENT` 映射表两处。

### A5. 调用点约定

- 尺寸走 `size-*`：默认 `size-6`(24px)，矮屏降一级 `short:size-5`；跟着 `text-data` 走的用 `size-[0.9em]`
- **不写 `strokeWidth`** —— [main.tsx](../../../src/main.tsx) 的 `LucideProvider` 统一给 2.25
- 替换 emoji 时把原来为撑 emoji 写的 `text-2xl` / `leading-none` 之类**删掉**，别留死类名
- 图标 + 文字同排给 `gap-2`（`btn-base` 不带 gap）
- 按钮有 `aria-label` 时图标加 `aria-hidden`；图标是唯一内容的按钮**必须**有 `aria-label`（文案走 i18n，两个 locale 都补）
- 读屏映射表不许混图标：既渲染图标又拼 `aria-label` 的，拆成「文字表 + 图标表」两张

### A6. 验收

```bash
npm run build   # 含 tsc -b，导出名写错会在这里拦住
npm run lint
```

纯换类名（不动导出）的改动可以只跑 lint。

---

## B. 内容标识：emoji，不抓

这几处**刻意**是 emoji，接到「换成图标」的请求要先反问一句，别顺手改：

- `meta.icon`（首页宫格的工具身份）
- 炸弹克星 12 张装备卡的 `icon`（[tools/bomb-busters/store.ts](../../../src/tools/bomb-busters/store.ts) 要求「避开同类形状」）
- 生命档位文案的 ⚠️💥⚡、拆弹三态的 `½ ✓`

理由：这些是**内容标识**，彩色轮廓在 50–70cm 斜视 45° 时比单色线条好认。真要换（比如用户明确说 emoji 在某设备上掉方框），那是一次方案变更 —— 按 CLAUDE.md 的红线先列方案与取舍，等用户点头。

---

## C. 静态图像资源（favicon / PWA）

只在需要**真文件**时走这条：目前 `public/` 只有 `favicon.svg`，[vite.config.ts](../../../vite.config.ts) 的 manifest 里留着「补 192/512 maskable PNG」的 TODO。

### C1. 下 SVG

```bash
curl -s "https://api.iconify.design/lucide/target.svg?width=512&height=512&color=%23e2e8f0" -o public/icon-512.svg
```

单色线条图标当 PWA 图标偏空，需要彩色成品时换图标集（都是可商用许可）：

| Prefix | 风格 | 许可 |
|---|---|---|
| `fluent-emoji-flat` | 彩色扁平 | MIT |
| `flat-color-icons` | 彩色扁平 | MIT |
| `noto` | Google 彩色 | Apache 2.0 |
| `twemoji` | Twitter 彩色 | CC BY 4.0 |

### C2. 转 PNG

本机已有 python 3.11 + cairosvg：

```bash
python -c "
import cairosvg
for s in (192, 512):
    cairosvg.svg2png(url='public/icon-512.svg', write_to=f'public/icon-{s}.png',
                     output_width=s, output_height=s, background_color='#0b0f17')
"
```

- maskable 用途必须给不透明底（`#0b0f17`，与 `theme_color` 一致）并留约 10% 安全边距，否则 Android 圆形裁切会切掉边缘
- `purpose: 'any'` 的那份保持透明背景

### C3. 同步 manifest

`vite.config.ts` 的 `icons` 数组要手动补条目，`src` **必须相对路径**（`base: './'` 的约束）：

```ts
{ src: 'icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
{ src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
```

`workbox.globPatterns` 已包含 `png`，不用改。改完跑 `npm run build` 看 manifest 产物。

---

## 交互要点

1. **先分流再搜**（第 0 步），别拿到「找个图标」就直接 curl
2. 候选给用户确认外观后再落地，不替用户定
3. 用户不满意就换关键词重搜，不要在同一个候选上反复解释
4. A 类改动记得检查是否该复用已有语义名 —— 新增一个近义名比选错字形更难回收
