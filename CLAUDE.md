# BGTools 项目基线

桌游工具合集，纯前端 SPA。项目介绍与命令见 [README.md](README.md)，配色/字号/布局的完整规范与取值依据见 [docs/DESIGN.md](docs/DESIGN.md)。本文件只写**写代码时必须遵守的约束**。

## 技术栈（已定，不要替换）

React 19 · TypeScript 6 · Vite 8 · Tailwind CSS 4 · Zustand 5 · React Router 7

- **Tailwind 4 无配置文件**：主题在 [src/index.css](src/index.css) 的 `@theme` 里，不要创建 `tailwind.config.js` 或 `postcss.config.js`
- **hash 路由**（`createHashRouter`）：为了静态托管免配 rewrite，不要改成 BrowserRouter
- **`base: './'`**：产物路径必须保持相对，新增静态资源引用不要写绝对路径 `/xxx`
- **纯本地、无后端**：不引入网络请求。存储分两级，见下方「持久化」一节

## 新增工具的机械流程

1. 建 `src/tools/<id>/`
2. `meta.ts` 导出 `ToolMeta`（见 [src/tools/types.ts](src/tools/types.ts)）：`nameKey` / `descKey` 填 `tools.<id>.{name,desc}`，并在**两个** locale 里补上这两条；`category` 决定落首页哪个分区（`general` = 任何游戏都用得上 / `game` = 只在特定那盒游戏上用），**必填，没有缺省值**
3. 页面组件 **default export**，状态放同目录 `store.ts`
4. 在 [src/tools/registry.ts](src/tools/registry.ts) 追加一行 `{ ...xxxMeta, load: () => import('./xxx/XxxPage') }`

首页宫格和路由自动生成。**不要手写路由或首页入口。**

约定：
- `id` 即路由 path，用 kebab-case
- persist 的 `name` 统一 `bgtools:<id>` 前缀，`partialize` 只存该持久化的字段（`last`、`rolling` 这类瞬时状态不存）
- `meta.icon` 用 emoji（工具身份是**内容标识**，彩色轮廓斜视下更好认）；**功能按钮的图标走 [shared/icons.ts](src/shared/icons.ts)**，见下方「图标」一节

## 持久化：两级，按「会不会无界增长」分

| | 载体 | 判据 |
|---|---|---|
| 当前局面（模板 / 席位 / 格子 / 名单 / quick 状态） | zustand `persist` → localStorage，name `bgtools:<id>` | 小、高频写、**需要同步首帧**（异步读会让界面先闪一下空） |
| 会无界增长的存档（历史局记录） | IndexedDB，走 [shared/idb.ts](src/shared/idb.ts) | 大、低频写、**可懒加载**（只在打开历史浮层时读盘） |

默认落第一级。第二级只在数据「一晚攒好几条、永远不删」时才用，理由是硬的：

- localStorage 的 5MB 是**整个域名共享**的，现在已经有七个 `bgtools:*` key 在分
- zustand `persist` 是**全量写回**：存档进了某个 store，就等于每按一下数字键都把所有历史一起 `JSON.stringify`（同步阻塞主线程）。所以**存档必须独立一个不带 persist 的 store**（[score-sheet/games.ts](src/tools/score-sheet/games.ts) 是范例），IDB 自己就是持久层
- 新增一种存档要在 [idb.ts](src/shared/idb.ts) 的 `STORES` 加一行并 bump `VERSION`（`onupgradeneeded` 一个版本只跑一次，分散到各业务模块去建必然漏）
- **IDB 打不开是正常分支，不是崩点**：隐私模式会直接禁掉它。上层 catch 成 `status: 'unavailable'` → 那一块功能关掉 + 一句说明，其余照用

## 通用小工具（quick）

骰子、计时器这类**任何游戏都可能临时用一下**的东西不进首页宫格，而是常驻顶栏图标，点开是居中 dialog，用完关掉、状态保留。

新增一个：建 `src/quick/<id>/`（组件 + `store.ts`），在 [src/quick/registry.ts](src/quick/registry.ts) 追加一行（`nameKey` / `descKey` 填 `quick.<id>.{name,desc}`，两个 locale 补上）。`descKey` 只有首页那张卡用得到，顶栏和 tile 面板放不下一行描述。

**`onHome` 必填，而且它一个字段决定两处露出**（判据是「开局中会不会随手用一下」）：

| | 首页宫格「快捷工具」区 | 首页顶栏 | 工具页顶栏 |
|---|---|---|---|
| `onHome: true`（骰子 / 计时器 / 指针） | 一张卡 | 无 | tile 面板里 |
| `onHome: false`（名单 / 设置） | 无 | **直达按钮** | tile 面板里 |

首页顶栏刻意**不放 tile 面板**：`onHome: true` 的那几个在宫格里已有大卡，抽屉只是多一层点击。所以 [QuickBar](src/quick/QuickBar.tsx) 的首页分支取 `onHome` 的反面 —— 别在那里另写一份 id 名单，注册表才是真源。工具页反过来只放 tile 面板（横屏侧栏 64px，五个平铺放不下，也会跟工具自己的控件抢注意力）。

不许违反的三条：

- **浮层绝不能挂在 `<header>` 内部**。工具页顶栏带 `translate-y-*` + `backdrop-blur`，两者都会成为 `fixed` 的包含块 —— 挂里面的 dialog 会跟着顶栏平移出屏并继承 `pointer-events-none`。顶栏里只放按钮（[QuickBar](src/quick/QuickBar.tsx)），浮层由 [QuickLayer](src/quick/QuickLayer.tsx) 在 App 层渲染，两边靠 [quick/store.ts](src/quick/store.ts) 通信
- **`<QuickLayer />` 不带 key**，必须跨页面常驻：计时器的到时判定要在 dialog 关掉、甚至换了工具页之后依然生效
- **持续型状态（倒计时）存绝对时刻**（`endAt`），不存累减的剩余秒 —— 平板切后台 / 息屏时 interval 会被节流甚至挂起，累减必然漂移

约定：persist 的 `name` 用 `bgtools:quick-<id>`；与同名工具页**状态完全独立**（顺手掷一下不该污染骰子页的历史），只共享 [shared/random.ts](src/shared/random.ts) 这类纯函数。

### 横竖屏布局：判据，不是模板

quick 的形态无法预设（现有五个里四个恰好是「窄栏 + 主区」，设置面板只有一排按钮，下一个可能是纯列表或三块并列），所以这里给推导规则而不是骨架组件。两条不变量：**dialog 自身不滚**（[QuickDialog](src/quick/QuickDialog.tsx) 的 `overflow-y-auto` 只是兜底，不算进预算）、**触控目标不随朝向变化**（常态 56 / 矮屏 44）。

- **A. 先把每块内容标成「刚性」或「弹性」，这是所有布局决策的唯一输入。** 刚性 = 高度由触控目标和文字行数决定，压了就点不到（按钮组、输入框、[Stepper](src/shared/components/Stepper.tsx)、颜色网格）；弹性 = 任意缩放不失功能（大数字、表盘、可滚列表、留白）。**结构角色推不出伸缩性**：骰子的「控制栏」刚性、「显示区」弹性，而 [QuickPlayers](src/quick/players/QuickPlayers.tsx) 正好相反 —— 右侧编辑区（操作条 + 输入框 + 16 色板，竖屏堆起来 ≈468px）纯刚性，唯一的弹性块是左栏那个可滚列表。**刚性块装不下时给它自己一个 `overflow-y-auto` 框，不许缩格子**（色板行高下限锁 `minmax(3.5rem,1fr)`：有余量就拉伸，没余量就在框里滚，触控目标不动）。红线：**每个 quick 至少要有一块弹性块**吸收余量，全刚性的内容放不进 dialog，那是工具页而不是 quick。**唯一例外是内容总高远低于 D 的预算**（如 [QuickSettings](src/quick/settings/QuickSettings.tsx) 约 220px）—— 这种不设显式高度、走内容自然高度即可，横竖屏都没有余量要分配，硬塞一块弹性块只会撑出空白
- **B. 朝向只决定排列轴，不决定尺寸。** `flex-col wide:flex-row`，尺寸交给 flex 算：刚性块 `shrink-0` + 自然尺寸，弹性块 `flex-1 min-h-0`（横屏另加 `min-w-0`）。固定尺寸**必须带 `wide:` 前缀** —— `wide:w-56` 合法（横屏下宽度是主轴，不约束会被 grid 内容拉宽），裸 `w-56` 违规（竖屏下它把块钉成 224px 窄柱，右边全是空白）。块数不限于 2；竖屏谁排在下由「谁该贴拇指」决定，用 `order-*`，DOM 顺序保持刚性块在前（Tab 顺序更自然）
- **C. 视口单位必须匹配被约束的维度，同时受限就取短边。** 宽高同时受限的东西（正方形表盘、等比图形）**只能用 `vmin`** —— 指针表盘原来写 `min(18rem,42vh)`，竖屏 `vh` 取长边算出 288px，顶着 `shrink-0` 硬塞进 78px 的容器就溢出了。反过来，**只受高度约束的东西用 `vh` 才对**（[QuickPlayers](src/quick/players/QuickPlayers.tsx) 的 `h-[min(48rem,72vh)]`：容器高度就该跟视口高走，换 `vmin` 竖屏会取宽度把内容压得毫无必要地矮）。判断方法是问一句「这个值变大，会不会把某个方向挤爆」，两个方向都会就用 `vmin`
- **D. 预算自检是硬性的。** 可用高 = 视口高 − dialog 固定开销（常态 **136px** = 遮罩 32 + `card` 40 + 标题行 48 + gap 16；`short` 档 **88px** = 16 + 24 + 40 + 8）。**竖屏堆叠时各块高度相加、横屏并排时取各块最大值** —— 别把这两种算法搞混（同一组内容横屏 206px 就够、竖屏要 494px）。刚性块高度和 + 弹性块下限和 ≤ 可用高；超了就降弹性块下限，不许改成让 dialog 滚。降不下去（弹性块被挤到不可用）说明命中了 A 的红线，该动结构而不是继续调数值
- **E. 内层要显式高度就自己给，别写 `h-full`。** [QuickDialog](src/quick/QuickDialog.tsx) 的面板高度由内容决定（`max-h-full` 只是上限），内层 `h-full` 没有锚点会塌缩。需要确定高度的（如 QuickPlayers 里要让列表撑满剩余空间）直接给 `h-[min(<rem>,<n>vh)]`，值按 D 的预算反推

## 全局玩家名单（players）

桌上是谁、叫什么、拿哪色棋子，一晚上换几个游戏都不变，所以名单是**跨工具共享的一份数据**，不属于任何工具。

- 唯一真源是 [shared/players/store.ts](src/shared/players/store.ts)（persist `bgtools:players`），数组顺序即**座位顺序**。它**故意不放在 `src/quick/players/` 下** —— quick 的「状态与工具页完全独立」惯例只管临时工具，名单的全部价值就在被各工具读到；quick 目录里只留编辑 UI（[QuickPlayers](src/quick/players/QuickPlayers.tsx)，顶栏 👥）
- 工具要用名单：读 `usePlayersStore`，选人用 [PlayerSelect](src/shared/players/PlayerSelect.tsx)（回传 id 数组，已按座位排序），显示用 [PlayerChip](src/shared/players/PlayerChip.tsx)。**不要在工具里再实现一套增删改**，引导用户去顶栏 👥
- 名字有不变式：**永不为空**（store 的 `rename` 把空值回填成 `玩家N`），消费方不必处理空串
- **人数不设上限、名单也没有「重置」**：`add()` 永不失败（返回新 id），UI 里不要显示 `N/上限`，也不要再加一键恢复默认（误触代价太大，删除是逐个删的）
- 颜色只用 [colors.ts](src/shared/players/colors.ts) 的 `PLAYER_SOLID` / `PLAYER_SOFT` / `PLAYER_DOT` 三张显式映射表，16 色刻意避开 rose / emerald / sky / amber 四个语义色，末尾四格是中性/大地色（棕白灰黑，棕在 `@theme` 自定义）。**这已是上限，不要再加色**，依据见 [docs/DESIGN.md](docs/DESIGN.md) §2。**同色允许被两个玩家共用**（超过 16 人必然重复），所以任何露出玩家色的地方必须同时出名字或色名 —— 颜色不许是唯一识别编码。文字色由这三张表给，**调用点不许在 `PLAYER_SOLID` 后面再补 `text-*`**（会覆盖掉「黑」唯一的白字）
- `src/shared/players/` 是 shared 层「两个工具用到才上提」原则的一处**有意例外**：它本身就是跨工具契约，不是某个工具的私有组件

## 运行场景基线（每个工具都要满足）

**平板横屏、平放在桌面中央、多人斜视、视距 50–70cm。** 完整规范与取值依据见 [docs/DESIGN.md](docs/DESIGN.md)，以下是不许违反的部分：

- **一屏放完，页面级不滚动**。高度锁在 `html` / `body` / `#root` 的 `height:100% + overflow:hidden`（[src/index.css](src/index.css)），[App.tsx](src/App.tsx) 外壳跟着用 `h-full overflow-hidden`。**不要改回 `h-dvh`** —— PWA standalone 下 `100dvh` 会把状态栏算进视口，整页多出一条滚动条。工具页统一套 [ToolLayout](src/shared/components/ToolLayout.tsx)（横屏左控制栏 + 右主显示区；竖屏自动变主显示在上 + 控制栏贴底，仍不滚）。次要列表可以在自己的框里 `overflow-y-auto`，页面不许翻页
- **横竖屏判据只用 `wide` variant**（`orientation: landscape`，定义在 [src/index.css](src/index.css)）。**禁止用宽度断点（`lg:` / `max-lg:`）判横竖屏** —— 安卓平板横屏 CSS 宽常不足 1024px，会被整批误判成竖屏。主显示区放两块信息时用 [Split](src/shared/components/Split.tsx)（横屏并排 / 竖屏上下），不要自己写朝向类
- **关键数字的视口单位一律 `vmin`，不用 `vh`**：横屏下二者等价，竖屏下 `vh` 会把数字撑爆容器
- **返回/全屏/通用小工具入口由 [AppHeader](src/AppHeader.tsx) 统一提供**，工具页里不要自己画返回键、全屏键或标题栏。它在工具页 3 秒后自动收起（`absolute` overlay，不占布局高度），轻点屏幕顶部热区唤出 —— 所以工具页最顶部别放需要精准点击的控件
- **会让自己消失的元素，一律 `onClick`，不许 `onPointerDown`** —— 浮层遮罩、顶栏热区、全屏提醒都算。pointerdown 里改布局会当场卸载按下时的 target，触屏抬手补发的兼容鼠标事件按**抬手坐标**重新 hit-test，click 就穿透到底下的控件上了（关个计时器顺手把骰子投了、点热区反而跳回首页）。`onPointerDown` 只留给不改变自身存在的持续交互，如 [Stepper](src/shared/components/Stepper.tsx) 的长按连增。改了外层还要检查内层的 `stopPropagation` 是否跟着换事件类型
- **矮屏用 `short` variant**（`max-height: 480px`，同样定义在 [src/index.css](src/index.css)）。它与 `wide` 是**正交的两个维度**：`wide` 判朝向决定布局方向，`short` 判可视高决定尺寸档位，手机横屏同时命中两者。只有这一档允许把触控目标降到 44px（手持、视距 ≈30cm），别扩散到别处；要压 `card` / `btn-base` 里 `@apply` 进来的值得带 `!`（如 `short:!p-3`），否则自定义 utility 的规则位置在内置之后会赢
- 触控目标 **≥ 56px**（`size-14` / `min-h-14`，即 `btn-base` 默认值），次要按钮不低于 `min-h-12`
- 最小字号 `text-xs`（12px，仅限角标/图例），标签说明用 `text-sm` 起
- 破坏性操作（清零/重置/删除）必须走 [ConfirmButton](src/shared/components/ConfirmButton.tsx)，桌上极易误触
- 多态控件**不许只靠颜色区分**，至少再加一种编码（角标/删除线/文案）
- 需要长时间盯屏的工具必须调 [useWakeLock](src/shared/hooks/useWakeLock.ts)
- 贴边布局用 `safe-t` / `safe-b` / `safe-x` utility 避让刘海
- 深色单一主题，不做主题切换

## 文案与 i18n

界面语言 **简体中文 + English**。真源是 [locales/zh.ts](src/shared/i18n/locales/zh.ts)，[en.ts](src/shared/i18n/locales/en.ts) 受 `Resources` 类型约束与它同构 —— 缺 key / 多 key / 拼错都在 `tsc` 阶段报错，这是刻意的。切换入口在顶栏 ⚙（[QuickSettings](src/quick/settings/QuickSettings.tsx)）。

- **业务文件里不许出现界面中文字面量**，`aria-label` / `placeholder` / `confirmText` 一样算。新增文案必须同时写两个 locale
- key 分层与目录对齐：`common`（跨处复用）· `header` / `stepper` 这类共享组件 · `quick.<id>.*` · `tools.<id>.*` · `players.*`。**第二处用到才上提到 `common`**，同 shared 层的规矩
- **组件内用 `useTranslation()`，模块顶层 / store 层用 `i18n.t()`**（见 [players/store.ts](src/shared/players/store.ts) 的 `defaultName`）。后者拿到的是**求值那一刻**的语言，只适合"存进 localStorage 的快照名"这类本就不该跟着语言变的值
- **纯数据常量存 key 不存文案**：`ToolMeta.nameKey`、`QuickTool.nameKey`、`Equipment.nameKey`、`PLAYER_COLORS[].labelKey`，字段类型标 `I18nKey`（[i18n/types.ts](src/shared/i18n/types.ts)），消费方在渲染期 `t()` —— 这才是"切语言时已渲染的一切跟着变"的原因。**key 写完整字面量，禁止拼接**（`` `tools.${id}.name` `` 同时丢掉类型校验和全局搜索）
- **插值参数不叫 `count`** —— 那是 i18next 的复数保留名，会让它去找 `xxx_one` / `xxx_other` 变体。数量统一 `{{n}}`，多个数字用具名参数（`{{total}}` / `{{delta}}`）。目前全项目不用复数变体，有复数需求的地方下限都 ≥ 2
- 英文普遍比中文宽 1.5–2 倍，而布局是按中文长度调的。**撑破了先压英文措辞，不动布局**（`quick.players.add` 因此是 `Add` 而不是 `Add player`）
- 已知限制，不要试图修：[index.html](index.html) 的 `<title>` / `lang` 只是首帧默认值（运行时由 [App.tsx](src/App.tsx) 的 effect 接管），[vite.config.ts](vite.config.ts) 的 PWA manifest 是构建期静态的

## 样式约束

- **禁止动态拼接 Tailwind 类名**（`` `bg-${color}-500` `` 编译期扫不到）。按 [Home.tsx](src/pages/Home.tsx) 的写法用显式 `Record` 映射表
- 自定义色只用 `@theme` 里的 `ink` / `surface` / `surface-2` / `surface-3` / `line` / `text` / `text-muted` / `text-dim`，其余用 Tailwind 内置色板
- **`text-dim` 是最暗档，不许再往下**（`slate-500` 及更暗在桌上等于看不见）
- 语义色档位：文字用 `-300`，实心底用 `-400 + text-ink`，淡底用 `-500/15 + border-<c>-500/60`；危险实心用 `bg-rose-600 text-white font-bold`（**不要 `rose-500` + 白字**，只有 3.75:1）
- 语义色分工：`rose` 只给破坏性/危险，`emerald` 完成，`sky` 信息与中性选中，`amber` 警告。**不设全局主色**，主操作色取各工具 `meta.accent`；若与语义撞车让 accent 让位（见炸弹克星人数选择器用 `sky`）
- 复用 utility：`card`、`section-label`、`btn-base`（只管尺寸不管颜色）、`btn-quiet`
- 会变化的数字加 `font-mono tabular-nums`，关键数字用 `text-data` / `text-data-sm`（跟视口高走，别写死 px）
- 过渡只用 `transition-transform duration-75`，别用通用 `transition`（颜色跟着渐变会让点按反馈发钝）

## 注释

注释只写**目的与注意事项**（为什么这么做、改的时候会踩什么）。**不写实现取值与推导算式** —— px / rem / vmin、明度、对比度、布局预算的加减法，一律不进注释。

理由不是「注释要短」，是这类内容**必然失同步**：把 `bg-ink/40` 调成 `/50` 时没人会回头重算注释里那个明度值，于是注释开始说谎，比没有更糟。同一个数字在文件头和逐条注释里各写一遍更是必漏 —— 拆弹三态的明度表和道具卡的透明度都已经因此烂过一次。

- **判据**：这句话会不会因为**改了紧邻的代码**而变错？会 → 那是实现取值，删掉，或降级成序关系（写「压到贴近全拆」而不是「18 vs 14」）
- 依据本身有价值的（阈值凭什么取这个数、字号上限怎么算出来的）搬进 [docs/DESIGN.md](docs/DESIGN.md)，注释里只留一句指向它（「取值依据见 DESIGN.md §5」）
- **保留**这三类：领域事实（12 根导线、5 张道具、16 色上限）、CSS 写法本身（`height: 100%` 而不是 `100dvh`）、被否决的旧方案引用
- 规范文档（本文与 DESIGN.md）里的数字**不受此限**，那里就是数值的真源

## 图标

功能按钮（返回、关闭、暂停、加减、删除、设置…）用 lucide-react，**内容标识仍用 emoji**。分界线是「这东西代表一个动作，还是代表一个东西」。

- **只从 [shared/icons.ts](src/shared/icons.ts) 按语义名取**（`IconClose`、`IconReset`…），业务文件不直接 `import 'lucide-react'` —— 换库或调档位只改一处，也避免同一个动作在不同页面挑了两个不同图标。要新图标先去那个文件加一行
- **尺寸走 `size-*`，不靠 `text-*`**：默认 `size-6`(24px)，`short` 档降一级。替换字形时把原来只为撑 emoji 而写的 `text-2xl` 之类**删掉**，别留死类名。跟着 `text-data` 走的用 `size-[0.9em]`（见 [TimerAlarm](src/quick/timer/TimerAlarm.tsx)）
- **`strokeWidth` 不在调用点写**，由 [main.tsx](src/main.tsx) 的 `LucideProvider` 统一给 2.25（比默认 2 更实，视距 50–70cm 斜视下细线会糊断）
- 图标 + 文字同排的按钮记得给 `gap-2`（`btn-base` 只有 `inline-flex items-center`，不带 gap；`ConfirmButton` 已内置）
- 按钮已有 `aria-label` 时图标加 `aria-hidden`；图标是唯一内容的按钮**必须**有 `aria-label`
- **仍然是 emoji 的三处，不要顺手换掉**：`meta.icon`（首页宫格）、炸弹克星 12 张装备卡的 `icon`（[store.ts](src/tools/bomb-busters/store.ts) 明确要求「避开同类形状」，彩色轮廓才认得出）、生命档位文案的 ⚠️💥⚡ 与拆弹三态的 `½ ✓`
- 读屏文本里不许混图标：既要渲染图标又要拼 `aria-label` 的映射表，拆成「文字表 + 图标表」两张（见 [EquipmentList](src/tools/bomb-busters/EquipmentList.tsx) 的 `BADGE_TEXT` / `BADGE_ICON`）

## 随机数

任何随机（骰子、抽签、洗牌、首位玩家）必须用 `crypto.getRandomValues` + 拒绝采样，参考 [shared/random.ts](src/shared/random.ts) 的 `rollDie`。**不要用 `Math.random`** —— 桌游场景下公平性会被玩家当场质疑。例外：纯视觉动画的假值可以用 `Math.random`。

## 共享层

`src/shared/` 只放**已被两个以上工具用到**的东西。单个工具专用的组件留在工具目录内，第二次用到时再上提。

## 验收

改完跑这两条，干净就算完成：

```bash
npm run lint         # oxlint，零 warning
npm run typecheck    # tsc -b，冷跑约 2.4s
```

`typecheck` 是必跑的，因为**另外两样东西都看不见类型**：oxlint 没有 TS 程序，Vite dev 用 esbuild 只剥类型不检查。纯类型层面的错（narrowing 收窄成 `never` 之类）运行时行为完全正确，只有 `tsc` 会报 —— 少了它就只能等构建时才发现。收尾时跑一次即可，别每改一个文件跑一遍。

改了样式或布局的，再走一遍 [docs/DESIGN.md](docs/DESIGN.md) 第 7 节的自检清单（1180×820 无滚动条、无 `slate-*`、无小于 12px 字号、注释里无实现取值）。

**`npm run build` 仍然不要在会话里跑**：慢的是 `vite build` 那一半，`typecheck` 已经覆盖了它的 `tsc -b`。若 `typecheck` 报的错在别处正在写的半成品文件里，说明就好，不要去改。

**也不要起 dev server**（`npm run dev`、`preview` 等常驻进程），由我自己跑。
