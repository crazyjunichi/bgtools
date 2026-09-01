---
name: bgg-cover
description: 从 BoardGameGeek 抓某款桌游的封面图 / 盒图 / 图标，落到 public/covers/ 并（可选）接进首页宫格。当用户说"从 BGG 抓个图、给这个工具配张封面、把宫格 emoji 换成盒图、抓一下 xxx 的盒图"时使用。
---

# BGG 封面抓取

抓的是**某款具体桌游的盒图**（内容标识，彩色）。跟 [icon-fetch](../icon-fetch/SKILL.md) 的分界：

| 要的东西 | 走哪 |
|---|---|
| 一个动作（返回、关闭、重置…） | icon-fetch 的 A：lucide-react |
| 一个抽象身份（掷骰、计分…），没有对应实物 | icon-fetch 的 B：emoji |
| **一款真实桌游的盒图 / 封面** | **本 skill** |
| favicon / PWA maskable | icon-fetch 的 C：Iconify |

判据：**「这东西在 BGG 上有条目吗」**。骰子、计分板没有 → emoji；炸弹克星有 → 本 skill。

## 前提：BGG 官方 API 已经不能匿名用了（2026-08 起）

实测 `xmlapi2` / 旧 `xmlapi` 全部返回 `401 Unauthorized` + `WWW-Authenticate: Bearer realm="xml api"`，与 UA 无关；BGG 网页对非浏览器客户端返回 403，所以文档也读不出来。官方路径需要用 BGG 账号注册应用拿 token（[说明贴](https://boardgamegeek.com/thread/3539581/xml-api-read-this-for-uninterrupted-access)）。

**本 skill 走的是站点自己前端在用的 JSON 端点**，无需 token：

```
https://api.geekdo.com/api/geekitems?objectid=<id>&objecttype=thing
```

它**不是公开契约**，字段（`images.*`）随时可能变。所以：

- 报 404 / KeyError 时**不要静默兜底成空图**，直接把失败报给用户，让人决定是改端点还是去注册 token
- 用户手上已有 BGG token 时，官方路径更稳：`curl -H "Authorization: Bearer $BGG_TOKEN" "https://boardgamegeek.com/xmlapi2/thing?id=<id>"`，取 `<image>` / `<thumbnail>` 后接第 3 步。**header 方案以 BGG 自己的文档为准，不要凭这里的猜测硬套**
- 请求要限速（脚本里是 0.6s 间隔），别改成并发批量拉

**版权**：盒图版权属出版商，BGG 只是托管。本项目是个人非商业工具，但它**公开部署在 GitHub Pages** —— 首次给某款游戏落盘封面时提醒用户这一点，别默默把一堆商业美术推到公开仓库。

## 第 1 步：抓

```bash
# 按名字查候选（只列表，不落盘）
python .claude/skills/bgg-cover/scripts/fetch_bgg_cover.py --name "Bomb Busters"

# 确认后落盘
python .claude/skills/bgg-cover/scripts/fetch_bgg_cover.py --id 413246 --tool bomb-busters
```

要点：

- `--name` 用**英文主名**，中文搜不到（名字 → id 是靠 DuckDuckGo 搜 `site:boardgamegeek.com/boardgame`，BGG 自己的搜索页被 Cloudflare 拦）
- 多候选时脚本**故意只列表不落盘**：`"Bomb Busters"` 会连带 5 个扩展，挑错了比没抓到更糟。把候选连 BGG 链接一起给用户看，等他指定 `--id`
- 已知 id 或用户直接给了 BGG 链接时用 `--id` / `--url`，跳过搜索最稳
- 想先看图再决定：`--id <id> --stage` 把全部尺寸下到 `.tmp-bgg/`，用 Read 工具看图（能直接渲染）。**用完 `rm -rf .tmp-bgg`，不要留在仓库里**

尺寸档（`--variant`）：

| variant | 尺寸 | 用途 |
|---|---|---|
| `square200` | 200×200 | 默认。BGG 自家方裁，多数盒图本来就接近方形 |
| `original` | 原始 | 盒图长宽比失衡、或方裁切掉了关键元素时用，脚本会等比缩后居中留白 |
| `previewthumb` | 300×320 | 挑图时看清楚用，不适合落盘 |

留白默认**透明**（宫格卡片自带渐变底，不透明黑会出色差块）；要不透明底给 `--bg '#0b0f17'`。

## 第 2 步：落盘规范

- 路径 `public/covers/<tool-id>.png`，文件名**必须等于 `meta.id`**，接入时才能靠约定拼出来
- 200×200 PNG 就够（宫格展示 ≈64–96px，2x 屏也够）。别落原图，几百 KB 的盒图会拖慢首屏
- `vite.config.ts` 的 `workbox.globPatterns` 已含 `png`，**不用改**
- 只落 `public/`，不要 `src/assets/` —— 需要 `import.meta.env.BASE_URL` 拼相对路径，见下

## 第 3 步：接进首页宫格（要先跟用户对方案）

这一步**偏离 CLAUDE.md 的既定约定**（[types.ts](../../../src/tools/types.ts) 的 `icon` 注释写明「刻意仍用 emoji」）。按红线，动手前先把取舍摆出来等点头：

| | emoji（现状） | 盒图 |
|---|---|---|
| 50–70cm 斜视 45° | 彩色轮廓差异大，好认 | 盒图缩到 64px 后**书名号大小的字全糊**，只剩色块 |
| 辨识依据 | 抽象、要学一次 | 跟桌上实物一致，第一次就认得 |
| 成本 | 0 | 每款游戏一个 PNG，且是别人的美术 |
| 失败态 | 系统缺字形 → 方框 | 文件 404 → 空白，需要 fallback |

推荐的折中：**`cover` 是可选字段，缺了或加载失败就退回 emoji**，emoji 一行都不删。

改动点（四处，都要动）：

1. [types.ts](../../../src/tools/types.ts)：`ToolMeta` 加 `cover?: string`，注释写明「相对 `public/`，缺省退回 `icon`」
2. 对应 `meta.ts`：`cover: 'covers/bomb-busters.png'`
3. [Home.tsx](../../../src/pages/Home.tsx)：`cover` 存在时渲染 `<img>` 替掉 `<span className="text-4xl">`
   - `src` 必须 `` `${import.meta.env.BASE_URL}${tool.cover}` `` —— `base: './'` 下不许写 `/covers/...`
   - 尺寸走 `size-*`（如 `size-16`），加 `rounded-lg object-contain`
   - 名字已在旁边渲染，图 `alt=""` + `aria-hidden`，**不要**把游戏名塞进 alt 造成读屏重复
   - `onError` 里切回 emoji（用 state 或 `useState<Set<string>>` 记住失败的 id）；别用 `onError` 改 `src`，会死循环
4. 验收：`npm run build && npm run lint`（`cover` 是新字段，漏在 `ToolMeta` 里注册会在 `tsc` 阶段拦住）

不需要动 i18n（图不带文案），不需要动 registry.ts。

## 交互要点

1. **先分流**（顶上那张表），别拿到「找个图标」就来抓 BGG
2. `--name` 出多个候选时把 BGG 链接给用户，让他挑，别默认第一个 —— 扩展和本体的盒图很像
3. 落盘前把图 Read 出来给用户看一眼，缩到 200px 后糊成一团的封面不如不换
4. 第 3 步是方案变更，**先列取舍再改代码**；用户只说「抓个图」时就停在第 2 步
5. 端点挂了（404 / 字段缺失）就报出来并提注册 token 这条路，不要换个野接口自己接着试
