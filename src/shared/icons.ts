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
 * 彩色 emoji 的轮廓差异在桌上斜视 45° 时比单色线条更好认。
 *
 * 用法约定：
 * - 新增图标先在这里加一个语义名，业务文件不直接 import 'lucide-react'
 *   （换库或调档位只改这一处，也避免同一动作在不同页面挑了不同图标）
 * - 尺寸走 `size-*` 不靠 `text-*`：默认 `size-6`(24px)，`short` 档降一级
 * - `strokeWidth` 由 [main.tsx](../main.tsx) 的 `LucideProvider` 统一给 2.25，
 *   比默认 2 更实 —— 视距 50–70cm 斜视下细线会糊断
 */
export {
  AlarmClock as IconAlarm,
  ArrowLeft as IconBack,
  Check as IconCheck,
  X as IconClose,
  Compass as IconCompass,
  Crown as IconCrown,
  Trash2 as IconDelete,
  Dices as IconDice,
  Pencil as IconEdit,
  Minimize as IconExitFull,
  Maximize as IconFullscreen,
  History as IconHistory,
  Lock as IconLocked,
  Target as IconLogo,
  Minus as IconMinus,
  ChevronDown as IconMoveDown,
  ChevronUp as IconMoveUp,
  Bomb as IconNewGame,
  Pause as IconPause,
  Play as IconPlay,
  UserPlus as IconPlayerAdd,
  Users as IconPlayers,
  Plus as IconPlus,
  RefreshCw as IconRepeat,
  RotateCcw as IconReset,
  ChevronRight as IconSelected,
  Settings as IconSettings,
  Timer as IconTimer,
  CircleHelp as IconUnknown,
} from 'lucide-react'

export type { LucideIcon } from 'lucide-react'
