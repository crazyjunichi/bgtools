# BGTools 设计规范

写代码时的硬约束在 [CLAUDE.md](../CLAUDE.md)，本文记录**取值依据与完整对照表**。改动配色/字号/布局前先读这里，别凭手感调。

## 1. 运行场景（所有取值的来源）

| 事实 | 推出的约束 |
|---|---|
| 平板**横屏**、**平放**在桌面中央 | 布局横向双栏，不做竖屏优先；屏幕是斜视的，不是正视 |
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

## 3. 排版与尺寸

| 角色 | 取值 |
|---|---|
| 图例、角标 | `text-xs`（12px）——**最小值，不许更小** |
| 标签、说明 | `text-sm`（14px） |
| 列表正文、按钮 | `text-base`（16px） |
| section 标题 | `section-label` utility |
| 主数据（默认档） | `text-data` = `clamp(2.5rem, 9vh, 5.5rem)` |
| 次级数据（默认档） | `text-data-sm` = `clamp(1.5rem, 4.5vh, 3rem)` |
| 触控目标 | `size-14` / `min-h-14`（56px）起；次要按钮不低于 `min-h-12` |
| 卡片内距 | `p-5`（`card` utility 已含） |

数字用 `vh` 而非固定 px：桌上平板从 10" 到 13" 都有，固定 px 在大屏上会显得偏小。所有会变化的数字必须加 `font-mono tabular-nums`，否则动画时宽度会跳。

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

- [App.tsx](../src/App.tsx) 外壳是 `h-dvh overflow-hidden`。**这是有意的硬约束**：内容超一屏必须让布局自己收缩，而不是悄悄变成可滚页面
- **顶栏（返回 + 全屏）由 [AppHeader](../src/AppHeader.tsx) 统一提供，工具里不要自己画。** 它在工具页 3 秒后自动收起，顶部留一条 16px 全宽热区 + 小把手唤出；首次进入工具页提示一次（`bgtools:chrome-hint`）。两个不能改的实现细节：
  - 工具页的顶栏是 `absolute` overlay，**绝不参与 flex 布局** —— 参与了，收放时内容区高度就会变，跟 `vh` / `flex-1` 走的骰子和大数字会跳一下。首页没有一屏压力，顶栏正常占位
  - 隐藏状态靠 `key={tool.id}` 重挂载重置，不在 effect 里同步 `setState`（oxlint 的 `react(set-state-in-effect)` 会拦）
  - 代价：顶栏唤出时会盖住内容顶部约 57px（工具页顶部是 `section-label` 一行），3 秒后自己让开，可接受
- **通用小工具（骰子 🎲 / 计时器 ⏱️ / 随机指针 🧭）的入口也在顶栏**，点开是居中 dialog，不占工具页版面。浮层不能挂在 `<header>` 内（`translate` + `backdrop-blur` 会成为 `fixed` 的包含块），由 App 层的 [QuickLayer](../src/quick/QuickLayer.tsx) 渲染，机械流程见 [CLAUDE.md](../CLAUDE.md)
- `fixed` 浮层的层级约定，**新增浮层按这三档挑，不要自造数字**：

  | 层 | z | 例子 |
  |---|---|---|
  | 顶栏与工具内浮层 | `z-20` | [AppHeader](../src/AppHeader.tsx)、[SettingsPopover](../src/tools/bomb-busters/SettingsPopover.tsx) |
  | 通用小工具 dialog | `z-30` | [QuickDialog](../src/quick/QuickDialog.tsx)（要压住顶栏） |
  | 打断性提醒 | `z-40` | [TimerAlarm](../src/quick/timer/TimerAlarm.tsx)（dialog 开着时到时也要在最上层） |
- 工具页统一套 [ToolLayout](../src/shared/components/ToolLayout.tsx)：左控制栏（`minmax(17rem, 24%)`）+ 右主显示区，`lg`（≥1024px，含 iPad mini 横屏）双栏，窄屏/竖屏退化单列可滚
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
| 拆弹三态 | 描边/底色 | `½` / `✓` 角标 + 半高填充 + 删除线 |
| 道具三态 | 描边/底色 | 徽章文字（未激活/可用/已用）+ 已用加删除线 |
| 生命危险 | 整块转红 | 文案换成「⚠️ 最后一点」「💥 已引爆」+ 脉冲 |

## 7. 新增工具时的自检

1. iPad 横屏 **1180×820** 下页面级无滚动条；**820×1180** 竖屏回退仍可用
2. 没有 `slate-*` 系列颜色、没有小于 `text-xs` 的字号（`grep` 一遍）
3. 破坏性操作走 [ConfirmButton](../src/shared/components/ConfirmButton.tsx)，且同屏内 rose 只出现在破坏性语义上
4. 关键数字跟视口高走（默认档 `text-data` / `text-data-sm`，或工具自己目录里的 `clamp()` 常量）+ `font-mono tabular-nums`
5. 多态控件有非颜色编码
6. 长时间盯屏的工具调 [useWakeLock](../src/shared/hooks/useWakeLock.ts)
7. 没有自己画返回/全屏/标题栏；页面最顶部 16px 内没有需要精准点击的控件（那是顶栏唤出热区）

## 8. 已知取舍

- **竖屏只是回退**，不做强制横屏提示（前端无法真正锁屏，提示反而挡住内容）
- **矩形格子优于正方形**：拆弹网格在高度受限时拉成矩形，是为了不翻页
- **首页允许滚动**：工具变多后宫格会超一屏，首页翻页比工具页翻页可接受
- **顶栏自动隐藏**：换回约 57px 高度（820px 屏的 7%），代价是返回键不常显、要学一次唤出动作 —— 用一次性文字提示 + 全宽热区补偿。不做「点任意处唤出」，那会跟工具本身的点按抢事件
- **计时器运行中不做任何残留指示**：dialog 关掉后既没有顶栏角标（顶栏会自动收起，角标跟着消失），也没有角落浮标 —— 少一个常驻浮层，代价是桌上看不到还剩多久，靠到时的震动 + 提示音 + 全屏红字补偿
- **`!` important 前缀**（`!min-h-12`）在 Tailwind 4.3 仍生效，沿用旧代码风格，只用于覆盖 `btn-base` 的尺寸
