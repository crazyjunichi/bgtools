# BGTools 设计规范

写代码时的硬约束在 [CLAUDE.md](../CLAUDE.md)，本文记录**取值依据与完整对照表**。改动配色/字号/布局前先读这里，别凭手感调。

## 1. 运行场景（所有取值的来源）

| 事实 | 推出的约束 |
|---|---|
| 平板**横屏**、**平放**在桌面中央 | 横屏是主场景（横向双栏），但**竖屏是一等布局**（主显示在上 + 控制栏贴底，同样不滚动）—— 前端锁不住所有平台的朝向；屏幕是斜视的，不是正视 |
| 多人从不同角度看，视距 **50–70cm** | 最小正文 14px；关键数字跟视口高走；对比度下限按"倾斜 45° 仍可分辨"而非 WCAG AA |
| 手在桌面上斜着点 | 触控目标 **56px** 起（不是 44px） |
| 游戏进行中没人愿意滚屏找信息 | **一屏放完，页面级不滚动**；只允许次要列表在自己的框里滚 |
| 环境光从明亮客厅到昏暗桌灯都有 | 深色单一主题 + 高对比，不做主题切换、不做自动亮度适配 |

## 2. 颜色

### 表面阶梯

定义在 [src/index.css](../src/index.css) `@theme`。相邻两级亮度差 ≈2×，斜视时卡片边界才不糊成一片。

| token | 值 | 用途 |
|---|---|---|
| `ink` | `#0a0a0a` | 页面底；亮色实心按钮上的文字色 |
| `surface` | `#17181a` | 卡片 |
| `surface-2` | `#262829` | 控件底、嵌套块 |
| `surface-3` | `#343739` | 悬浮/次级选中态 |
| `line` | `#454a4f` | 描边，对 `surface` **2.0:1** |

`line` 是这次改动的重点之一：旧值 `#2a3547` 对旧 `surface` 只有 **1.42:1**，斜视时整条描边会消失，卡片分不出边界。

### 文字阶梯

只有 3 档，**比 `text-dim` 更暗的颜色一律不用**（旧代码里的 `slate-500` 是 3.6:1、`slate-600` 是 2.3:1，桌上等于看不见）。

| token | 值 | 对 `surface` | 用途 |
|---|---|---|---|
| `text` | `#f5f5f5` | 16.4:1 | 主文字、关键数字 |
| `text-muted` | `#b4b8bd` | 9.0:1 | section 标签、说明、次要数值 |
| `text-dim` | `#8b9096` | 5.6:1 | 最低档：时间戳、单位、图例 |

### 语义色（用 Tailwind 内置色板，不进 `@theme`）

深底上的档位规则：

| 场景 | 写法 | 为什么 |
|---|---|---|
| 文字/图标 | `text-<c>-300` | 深底上 300 档才够亮 |
| 实心底 | `bg-<c>-400 text-ink` | 如 `amber-400` + `ink` = **11:1** |
| 淡底态 | `bg-<c>-500/15` + `border-<c>-500/60` | 底色够暗时仍能看出色相 |
| 危险实心（唯一例外） | `bg-rose-600 text-white font-bold` | **不要 `rose-500` + 白字，只有 3.75:1**；`rose-600` 是 4.5:1，靠加粗 + ≥16px 补足，保留红色的警示直觉 |

rose 语义的一处已登记例外：计时器到时提醒 [TimerAlarm](../src/quick/timer/TimerAlarm.tsx) 用 `bg-rose-600/95` 铺满全屏。理由是平板平放桌上、没人盯屏，只有整屏变色才能在斜视下被立刻注意到；它全屏独占且瞬时，不会与工具内的 rose 同屏，档位仍是"危险实心"那一档。**新增浮层不要照抄这个例外**。

语义分配（**不要混用**）：

- `rose` = 破坏性 / 危险 / 生命流失 —— **仅此用途**，普通选中态不许用
- `emerald` = 完成、成功
- `sky` = 信息、可用、中性参数选中
- `amber` = 警告、进行中、待处理

### 工具身份色

**不设全局主色。** 每个工具的主操作色由自己 `meta.accent` 决定（骰子 = amber，炸弹克星 = rose），在该工具的组件里显式写死类名。首页宫格的 `ACCENT` 映射见 [Home.tsx](../src/pages/Home.tsx)。

注意：工具 accent 与语义色可能撞车。炸弹克星 accent 是 `rose`，所以它的**人数选中态改用 `sky-400`** —— 同一屏里 rose 必须只代表"会掉血/会重开"。

玩家名单面板（顶栏 👥）身份色用 `teal`：四个语义色都不能占，`amber` / `sky` / `violet` 已分给快速骰子 / 计时器 / 随机指针。**调色板扩到 16 色后 `teal` 也成了玩家色**，这个重叠无法回避（非语义色相一共只有 12 个，全给了玩家），改由位置区分：accent 只出现在操作条按钮上，玩家色只出现在名字旁 —— 新面板挑 accent 时别再指望"找一个没被玩家占的色相"。

### 玩家标识色

[shared/players/colors.ts](../src/shared/players/colors.ts) 的 16 色，**刻意一个都不碰语义色**：玩家色要能和"危险 / 完成 / 信息 / 警告"同屏共存，撞色就分不出哪个是语义。取的都是桌上实物棋子常见的颜色，玩家能直接对上手里的棋子。

排除 rose / emerald / sky / amber 后，Tailwind 只剩 **12 个可用色相**，而 16 个格子要"互相不像"，所以后 4 格换维度取 —— 中性色与大地色跟任何色相都不可能看混。四行就是四个色域块：

| 行 | 玩家色 | Tailwind 色板 |
|---|---|---|
| 暖 | 红 / 橙 / 黄 / 柠绿 | `red` / `orange` / `yellow` / `lime` |
| 绿青 | 绿 / 松绿 / 青 / 蓝 | `green` / `teal` / `cyan` / `blue` |
| 紫粉 | 靛 / 紫 / 洋红 / 粉 | `indigo` / `violet` / `fuchsia` / `pink` |
| 中性与大地 | 棕 / 白 / 灰 / 黑 | `brown`（自定义）/ `zinc-100` / `zinc-400` / `zinc-950` |

**这已经是 16 色的上限，不要再加。** 剩下的色相全在四个语义色上，中性维度也只剩"更暗的灰"—— 深底上再往下就分不出来了。最近的两对是 松绿/青（相差 16°）与 靛/紫（19°），它们靠色名区分。

档位仍走上面那张表：`PLAYER_SOLID` = `bg-<c>-400 text-ink`，`PLAYER_SOFT` = `border-<c>-500/60 bg-<c>-500/15 text-<c>-300`，`PLAYER_DOT` 只取 `bg-<c>-400`。三张都是显式 `Record`，禁止拼接。**soft 档已含 `bg-<c>-500/15`，不要再叠 `bg-surface-2`** —— 两条都是 `background-color`，谁赢取决于 CSS 生成顺序而非类名顺序。

三处偏离上表的地方，都是深底逼出来的：

- **棕不在 Tailwind 色板上**，三档定义在 [index.css](../src/index.css) 的 `@theme`（`--color-brown-300/400/500`）。这是 `@theme` 里唯一的语义无关色，值按同样标准取：`-400` 对 `ink` 7.3:1、`-300` 对 `surface` 9.4:1
- **黑的实心档是 `bg-zinc-950 text-text ring-2 ring-zinc-400`**：`text-ink` 在近黑底上等于看不见，所以只有它用白字；亮描边是"黑棋子"能在深色 UI 上成形的唯一办法（`PLAYER_DOT` 的黑点同理带 `ring-1`）
- **黑的淡底档用不透明 `bg-zinc-950`**，不用 `/15` —— 近黑色的 15% 叠在 `surface` 上什么都看不出来

调用点因此**不许在 `PLAYER_SOLID` 之后再补 `text-*`**：那会把黑的白字覆盖回去。文字色一律由这三张表给。

**同色允许被两个玩家共用**（偏好比唯一性重要，调色板只提示"谁也在用"、不禁用）。**人数本身不设上限**，所以超过 16 人时重复是必然的 —— 颜色永远不是唯一识别编码，硬性要求：任何露出玩家色的地方必须同时出**名字**或**色名**，选中态再叠 `✓`（见 §6）。

## 3. 排版与尺寸

| 角色 | 取值 |
|---|---|
| 图例、角标 | `text-xs`（12px）——**最小值，不许更小** |
| 标签、说明 | `text-sm`（14px） |
| 列表正文、按钮 | `text-base`（16px） |
| section 标题 | `section-label` utility |
| 主数据（默认档） | `text-data` = `clamp(2.5rem, 9vmin, 5.5rem)` |
| 次级数据（默认档） | `text-data-sm` = `clamp(1.5rem, 4.5vmin, 3rem)` |
| 触控目标 | `size-14` / `min-h-14`（56px）起；次要按钮不低于 `min-h-12` |
| 卡片内距 | `p-5`（`card` utility 已含） |
| 功能图标 | `size-6`（24px）默认，`short` 档降一级；徽章内 `size-3.5` |

数字用视口单位而非固定 px：桌上平板从 10" 到 13" 都有，固定 px 在大屏上会显得偏小。

单位必须是 **`vmin` 而不是 `vh`**：横屏下 `vmin === vh`（表现与原来完全一致），竖屏下自动改按宽度算 —— 否则 820×1180 竖屏里 `18vh` = 212px 的生命数字会把卡片撑爆。所有会变化的数字必须加 `font-mono tabular-nums`，否则动画时宽度会跳。

**功能按钮的图标是 SVG（lucide-react，出口收在 [shared/icons.ts](../src/shared/icons.ts)）而不是 emoji 字形**：emoji 的粗细/基线由系统字体决定，`⤢ ⤡` 在部分安卓字体里没有字形会掉成方框，字号也只能间接控制视觉体积。尺寸因此走 `size-*` 而非 `text-*`，描边由 [main.tsx](../src/main.tsx) 的 `LucideProvider` 统一给 `strokeWidth: 2.25` —— 比默认 2 更实，视距 50–70cm 斜视 45° 下细线会糊断。**内容标识（`meta.icon`、装备卡图示、⚠️💥⚡）仍是 emoji**，彩色轮廓在斜视下比单色线条更好认，分工写在 [CLAUDE.md](../CLAUDE.md) 的「图标」一节。

**两档数据字号是默认值，不是上限。** 数字该多大取决于工具自己的信息密度：同屏元素多的工具整体压小，元素少的应该把焦点数字放大到容器装得下的最大值 —— 不要为了统一 token 而缩小信息。需要更激进字号的工具，在**自己目录里**用 `clamp()` 定一组常量、附上按最窄视口算出的上限依据，别往 `@theme` 加全局档位（一个工具的密度不该强加给其他工具）。

## 4. Utility（[src/index.css](../src/index.css)）

| utility | 展开 |
|---|---|
| `card` | `rounded-2xl border border-line bg-surface p-5` |
| `section-label` | `text-sm font-semibold tracking-wide text-text-muted` |
| `btn-base` | `inline-flex` 居中 + `min-h-14` + `rounded-xl` + `font-semibold` + `transition-transform duration-75` + `active:scale-95` + `disabled:opacity-40` |
| `btn-quiet` | `btn-base` + `bg-surface-2 text-text` |

`btn-base` 故意只管形状/尺寸/反馈，**不管颜色** —— 主色是 per-tool 的，颜色由调用方给。

过渡只作用于 `transform`：用通用 `transition` 会让选中态的颜色也渐变，桌上点按反馈发钝。

## 5. 布局：一屏不翻页

- 高度锁在 `html` / `body` / `#root` 上（`height: 100%; overflow: hidden`，[index.css](../src/index.css)），[App.tsx](../src/App.tsx) 外壳跟着 `h-full overflow-hidden`。**这是有意的硬约束**：内容超一屏必须让布局自己收缩，而不是悄悄变成可滚页面
  - **不要用 `h-dvh` 当外壳**：PWA standalone 下 `100dvh` 在部分平台包含状态栏那一条，`#root` 比真正可视区高出 24–48px，而 `body` 没有 `overflow` 兜底 → 整页多出一条滚动条。`height: 100%` 取 ICB，不受这类实现差异影响；百分比高度要求父链每级高度确定，所以 `#root` 也必须给
  - 配套：manifest `display: 'fullscreen'`（[vite.config.ts](../vite.config.ts)）让 Android 直接隐藏状态栏。**iOS 忽略此值仍是 standalone**，所以 `safe-t` / `safe-b` / `safe-x` 避让一个都不能拆
- **顶栏（返回 + 全屏）由 [AppHeader](../src/AppHeader.tsx) 统一提供，工具里不要自己画。** 它在工具页 3 秒后自动收起，顶部留一条 16px 全宽热区 + 小把手唤出；首次进入工具页提示一次（`bgtools:chrome-hint`）。两个不能改的实现细节：
  - 工具页的顶栏是 `absolute` overlay，**绝不参与 flex 布局** —— 参与了，收放时内容区高度就会变，跟 `vh` / `flex-1` 走的骰子和大数字会跳一下。首页没有一屏压力，顶栏正常占位
  - 隐藏状态靠 `key={tool.id}` 重挂载重置，不在 effect 里同步 `setState`（oxlint 的 `react(set-state-in-effect)` 会拦）
  - 代价：顶栏唤出时会盖住内容顶部约 57px（工具页顶部是 `section-label` 一行），3 秒后自己让开，可接受
- **通用小工具（骰子 / 计时器 / 随机指针 / 玩家名单）的入口也在顶栏**（图标来自 [shared/icons.ts](../src/shared/icons.ts)，注册表里存的是组件不是字符串），点开是居中 dialog，不占工具页版面。浮层不能挂在 `<header>` 内（`translate` + `backdrop-blur` 会成为 `fixed` 的包含块），由 App 层的 [QuickLayer](../src/quick/QuickLayer.tsx) 渲染，机械流程见 [CLAUDE.md](../CLAUDE.md)
- quick 面板的 `wide` prop 只决定**宽度上限**（`max-w-2xl` / `max-w-md`），不是朝向判据。内部要分横竖屏的面板（[QuickPlayers](../src/quick/players/QuickPlayers.tsx)：横屏左名单 + 右编辑，竖屏上下堆叠）自己写 `wide:` variant，并**显式给一个 `h-[min(…rem,…vh)]` 高度** —— 面板高度由内容决定，内层写 `h-full` 没有锚点会塌缩，列表也就撑不满
- `fixed` 浮层的层级约定，**新增浮层按这三档挑，不要自造数字**：

  | 层 | z | 例子 |
  |---|---|---|
  | 顶栏与工具内浮层 | `z-20` | [AppHeader](../src/AppHeader.tsx)、[SettingsPopover](../src/tools/bomb-busters/SettingsPopover.tsx) |
  | 通用小工具 dialog | `z-30` | [QuickDialog](../src/quick/QuickDialog.tsx)（要压住顶栏） |
  | 打断性提醒 | `z-40` | [TimerAlarm](../src/quick/timer/TimerAlarm.tsx)（dialog 开着时到时也要在最上层） |
- 工具页统一套 [ToolLayout](../src/shared/components/ToolLayout.tsx)，它一个人承担朝向切换，**工具页不写朝向代码也能在竖屏可用**：
  - 横屏（`wide`）：左控制栏（`minmax(17rem, 24%)`）+ 右主显示区
  - 竖屏：`grid-rows-[1fr_auto]`，主显示区在上、控制栏贴底（拇指够得到），控制栏限 `max-h-[45dvh]` 且只在自己框里滚，页面级仍不滚动。DOM 顺序保持"控制在前"（Tab / 读屏顺序），视觉换序靠 `order-*`
- **朝向判据只有 `wide` variant**（`@custom-variant wide (@media (orientation: landscape))`，定义在 [index.css](../src/index.css)）。**不许用宽度断点判横竖屏**：安卓平板横屏的 CSS 视口宽常只有 800–962px，iPad 分屏后更窄，旧代码的 `lg`（≥1024px）会把这批横屏平板整批误判成竖屏，这是"横屏还是竖屏布局"这个 bug 的根因。首页宫格的 `sm:` / `lg:` 是**列数密度**不是朝向，不在此约束内
- 主显示区要放两块信息时用 [Split](../src/shared/components/Split.tsx)（横屏并排、竖屏上下等分），别自己写朝向类。`ratio` 只描述横屏的宽度比 —— 竖屏一律等分，因为横向挤压只是变窄仍可读，纵向挤压会直接切掉整行
- 左栏放参数与破坏性操作，右栏放**全桌要看的那块信息**
- 次要列表（历史记录等）在自己的框里 `overflow-y-auto` —— 局部滚动不算翻页
- 两种撑满可用空间的手法，按需选：
  - **保持比例**（骰子）：`aspectRatio` inline style + `max-h-full max-w-full` 双向夹住，见 [DicePage.tsx](../src/tools/dice/DicePage.tsx)
  - **填满格子**（拆弹网格）：`grid-rows-*` + `min-h-0 flex-1`，格子变矩形但不溢出，见 [WireGrid.tsx](../src/tools/bomb-busters/WireGrid.tsx)

`min-h-0` 在每一层 flex/grid 子项上都要给，漏一层就会溢出裁切。

## 6. 状态不许只靠颜色

桌上有色觉障碍玩家、也有斜视导致的色偏。每个多态控件至少两种编码：

| 例子 | 编码 1 | 编码 2 |
|---|---|---|
| 拆弹三态 | 描边/底色 | `½` / `✓` 角标 + 半高填充 + 删除线（**刻意保留字形**：这俩是压在内容格上的排版记号，跟数字同处一个字号体系，换成 SVG 会与编号错位） |
| 道具三态 | 描边/底色 | 徽章文字（未激活/可用/已用）+ 已用加删除线 |
| 生命危险 | 整块转红 | 文案换成「⚠️ 最后一点」「💥 已引爆」+ 脉冲 |
| 玩家身份 | 玩家色实心/色点 | **始终带名字**；调色板格子带中文色名，选中加 `IconCheck`（同色可共用，颜色靠不住） |
| 名单里选中的玩家 | 实心玩家色 | `IconCheck` 角标；面板左侧列表的选中态干脆不用玩家色，走 `surface-3` + `IconSelected` |
| 计时器暂停 | amber 淡底 | 状态行换成 `IconPause` + 「已暂停」 |

## 7. 新增工具时的自检

1. 三种视口下页面级都无滚动条：iPad 横屏 **1180×820**、安卓平板横屏 **962×601**（旧宽度断点在这挂掉过）、竖屏 **820×1180**（主显示在上、控制栏贴底，不是单列长滚）
2. 没有 `slate-*` 系列颜色、没有小于 `text-xs` 的字号（`grep` 一遍）
3. 破坏性操作走 [ConfirmButton](../src/shared/components/ConfirmButton.tsx)，且同屏内 rose 只出现在破坏性语义上
4. 关键数字跟视口**短边**走（默认档 `text-data` / `text-data-sm`，或工具自己目录里的 `clamp()` 常量，单位一律 `vmin` 不用 `vh`）+ `font-mono tabular-nums`
5. 多态控件有非颜色编码
6. 长时间盯屏的工具调 [useWakeLock](../src/shared/hooks/useWakeLock.ts)
7. 没有自己画返回/全屏/标题栏；页面最顶部 16px 内没有需要精准点击的控件（那是顶栏唤出热区）
8. 横竖屏判断只用 `wide` variant：`grep -n "lg:\|max-lg:" src` 一遍，布局类里不该再有宽度断点
9. 功能按钮里没有裸 emoji / 箭头字形（`← ✕ ⏸ ▶ ↑ ↓ ↺ ▸ ⚙️ 🗑`），图标一律从 [shared/icons.ts](../src/shared/icons.ts) 取；尺寸用 `size-*`，没有只为撑字形而留下的 `text-*`

## 8. 已知取舍

- **锁横屏只能尽力而为，所以竖屏必须是一等布局**。能做的两半都做了：PWA manifest `orientation: 'landscape'`（[vite.config.ts](../vite.config.ts)，装成 PWA 的 Android 生效）+ 进全屏后 `screen.orientation.lock('landscape')`（[useFullscreen](../src/shared/hooks/useFullscreen.ts)，Android Chrome 生效）。**iOS Safari 两条都拿不到**，全靠 `catch` 静默兜住。仍然不做「请旋转设备」提示 —— 挡内容，而且竖屏现在本来就能用
- **竖屏控制栏允许框内滚**：竖屏底栏只有 45dvh，控制项多的工具（骰子的历史记录）会在栏内滚。页面级不滚这条底线没破，但比横屏多一次滚动动作
- **矩形格子优于正方形**：拆弹网格在高度受限时拉成矩形，是为了不翻页
- **首页允许滚动**：工具变多后宫格会超一屏，首页翻页比工具页翻页可接受
- **顶栏自动隐藏**：换回约 57px 高度（820px 屏的 7%），代价是返回键不常显、要学一次唤出动作 —— 用一次性文字提示 + 全宽热区补偿。不做「点任意处唤出」，那会跟工具本身的点按抢事件
- **计时器运行中不做任何残留指示**：dialog 关掉后既没有顶栏角标（顶栏会自动收起，角标跟着消失），也没有角落浮标 —— 少一个常驻浮层，代价是桌上看不到还剩多久，靠到时的震动 + 提示音 + 全屏红字补偿
- **`!` important 前缀**（`!min-h-12`）在 Tailwind 4.3 仍生效，沿用旧代码风格，只用于覆盖 `btn-base` 的尺寸
