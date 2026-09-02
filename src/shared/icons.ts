/**
 * 功能按钮图标的唯一出口。
 *
 * 为什么引库而不继续用 emoji 字面量：emoji 字形由系统字体决定，
 * `⏸ ▶ ↺ ▸ ⤢` 在 Android / iOS / Windows 上的粗细与基线各不相同，
 * `⤢ ⤡` 在部分安卓字体里干脆没有字形、掉成方框；且字号只能间接控制视觉体积
 * （emoji 自带留白，同字号下明显小一圈），描边粗细完全调不了。
 *
 * **分工**：只有「功能按钮 / chrome UI」走这里。工具身份（`meta.icon`）、
 * 装备卡图示、生命档位文案的 ⚠️💥⚡ 仍是 emoji —— 那些是**内容标识**，
 * 彩色 emoji 的轮廓差异在桌上斜视时比单色线条更好认。
 *
 * 用法约定：
 * - 新增图标先在这里加一个语义名，业务文件不直接 import 'lucide-react'
 *   （换库或调档位只改这一处，也避免同一动作在不同页面挑了不同图标）
 * - 尺寸走 `size-*` 不靠 `text-*`，`short` 档降一级（档位见 docs/DESIGN.md §3）
 * - `strokeWidth` **不在调用点写**，由 [main.tsx](../main.tsx) 的 `LucideProvider`
 *   统一给一档比 lucide 默认更粗的描边 —— 桌上的视距下细线会糊断
 */
export {
  AlarmClock as IconAlarm,
  ArrowLeft as IconBack,
  /** 数字键盘的退格。lucide 的 `Delete` 画的正是键帽上那个 ⌫，与 IconDelete（垃圾桶）不同 */
  Delete as IconBackspace,
  Check as IconCheck,
  X as IconClose,
  Compass as IconCompass,
  Crown as IconCrown,
  /** 导出为 CSV。用表格而非文档字形，才和 IconImage 一眼区分得开 */
  Sheet as IconCsv,
  Trash2 as IconDelete,
  Dices as IconDice,
  Pencil as IconEdit,
  /** 「整格清空」，与退格区分：退格删一位，橡皮擦整格 */
  Eraser as IconEraser,
  Minimize as IconExitFull,
  Maximize as IconFullscreen,
  Boxes as IconGroups,
  History as IconHistory,
  /** 导出为图片 */
  Image as IconImage,
  Lock as IconLocked,
  Target as IconLogo,
  Minus as IconMinus,
  /** 「更多操作」的收纳入口，横向省略号是这个语义的通行字形 */
  Ellipsis as IconMore,
  ChevronDown as IconMoveDown,
  ChevronUp as IconMoveUp,
  Bomb as IconNewGame,
  ListOrdered as IconOrder,
  Pause as IconPause,
  Play as IconPlay,
  UserPlus as IconPlayerAdd,
  Users as IconPlayers,
  Plus as IconPlus,
  LayoutGrid as IconQuickMenu,
  RefreshCw as IconRepeat,
  RotateCcw as IconReset,
  /** 存到本地文件 */
  Download as IconSave,
  Search as IconSearch,
  ChevronRight as IconSelected,
  Settings as IconSettings,
  /** 系统分享面板 */
  Share2 as IconShare,
  /** 计分模板（一张预置好条目的表），与 IconCsv 的表格字形区分开 */
  ClipboardList as IconTemplate,
  Timer as IconTimer,
  CircleHelp as IconUnknown,
} from 'lucide-react'

export type { LucideIcon } from 'lucide-react'
