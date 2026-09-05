import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { bindSeat, makeSeat, type Seat } from '../../shared/players/seats'
import type { Player } from '../../shared/players/store'
import { rollDie, shuffle } from '../../shared/random'
import { WORDS } from './words'

/** 一局的题：主题公开（冒牌货也知道），词只有艺术家看得到 */
export type Prompt = { category: string; word: string }

/**
 * 一笔。坐标归一化到 0..1 —— 画布随容器 resize，像素坐标一缩放就全错位。
 * 存 seatId 不存颜色：颜色渲染期经 resolveSeat 实时取，顶栏改名/换色旧笔画跟着变；
 * 人从名单里删了就退回席位快照 —— 正是 Seat 契约的本意。
 */
export type Stroke = { seat: string; pts: [number, number][] }

/** 规则书 5–10 人含出题人，App 把出题省了：2 画 1 冒起 */
export const MIN_SEATS = 3
export const MAX_ROUNDS = 3

type Phase = 'setup' | 'playing'

type FakeArtistState = {
  /** 座位顺序 = 走笔顺序 */
  seats: Seat[]
  /** 每人画几笔（1–MAX_ROUNDS） */
  rounds: number
  prompt: Prompt | null
  strokes: Stroke[]
  phase: Phase
  /** 提前结束作画（没画满轮数就进定格） */
  earlyDone: boolean
  /** 定格画面里已亮出答案 */
  revealed: boolean
  /** 开画时刻。与 endAt 配对进归档，算这一局玩了多久 */
  startedAt: number | null
  /**
   * 最后一笔的时刻（归档的 endAt 取它，不取归档当下）—— 画完摊在桌上讨论一晚上、
   * 隔天才点「再来一局」是常态。撤销也算实质改动，同样刷新
   */
  lastActiveAt: number | null
  /** 画布的纵横比（w/h）。坐标是归一化的，回放/导出没有它会把画拉变形 */
  aspect: number | null

  seatPlayers: (picked: Player[], temps?: number) => void
  clearSeats: () => void
  /** 重洗走笔顺序：setup 预览上的「换顺序」按钮，以及再来一局时都走它 */
  shuffleSeats: () => void
  setRounds: (n: number) => void
  /** 抽题并返回 —— 打开发牌那一刻调，调用方随即把它拼进内容池，所以得同步拿到 */
  drawPrompt: () => Prompt
  /** 进入画板。重来一题也是走它：清空上一局的笔画与定格态 */
  startPlaying: () => void
  commitStroke: (seat: string, pts: [number, number][], aspect: number) => void
  undoStroke: () => void
  finishEarly: () => void
  reveal: () => void
  /** 回开局页，词与画作一起丢掉；座位与轮数保留 */
  reset: () => void
}

/** 入席/清席都是「换了一桌人」：连局带词一起清，回到 setup */
const FRESH_GAME = {
  phase: 'setup' as const,
  prompt: null,
  strokes: [],
  earlyDone: false,
  revealed: false,
  startedAt: null,
  lastActiveAt: null,
  aspect: null,
}

export const useFakeArtistStore = create<FakeArtistState>()(
  persist(
    (set, get) => ({
      seats: [],
      rounds: 2,
      ...FRESH_GAME,

      seatPlayers: (picked, temps = 0) => {
        const seated = picked.reduce<Seat[]>((acc, p) => [...acc, bindSeat(makeSeat(acc), p)], [])
        for (let i = 0; i < temps; i++) seated.push(makeSeat(seated))
        // 点击顺序只是"选了谁"，不该隐含走笔顺序（先点先画既可预测又暴露信息）：
        // 入座时洗一次，setup 预览里看到的就是最终走笔顺序
        set({ seats: shuffle(seated), ...FRESH_GAME })
      },

      clearSeats: () => set({ seats: [], ...FRESH_GAME }),

      shuffleSeats: () => set({ seats: shuffle(get().seats) }),

      setRounds: (rounds) => set({ rounds }),

      drawPrompt: () => {
        const cat = WORDS[rollDie(WORDS.length) - 1]
        let word = cat.words[rollDie(cat.words.length) - 1]
        // 连着两局同一个词太扫兴：重抽一次就够，再撞认命
        if (cat.words.length > 1 && word === get().prompt?.word) {
          word = cat.words[rollDie(cat.words.length) - 1]
        }
        const prompt = { category: cat.category, word }
        set({ prompt })
        return prompt
      },

      startPlaying: () =>
        set({
          phase: 'playing',
          strokes: [],
          earlyDone: false,
          revealed: false,
          startedAt: Date.now(),
          lastActiveAt: Date.now(),
          aspect: null,
        }),

      commitStroke: (seat, pts, aspect) =>
        set({ strokes: [...get().strokes, { seat, pts }], lastActiveAt: Date.now(), aspect }),

      // 撤销连带撤掉「提前结束」：定格后又点撤销，意图明显是想继续画
      undoStroke: () =>
        set({ strokes: get().strokes.slice(0, -1), earlyDone: false, lastActiveAt: Date.now() }),

      finishEarly: () => set({ earlyDone: true }),
      reveal: () => set({ revealed: true }),

      // 再来一局连走笔顺序也重洗：不换顺序，冒牌货能从上局的动笔位置读出信息
      reset: () => set({ seats: shuffle(get().seats), ...FRESH_GAME }),
    }),
    {
      // 整局都是"摊在桌上的当前局面"：刷新不能把它弄丢，全量 persist
      name: 'bgtools:fake-artist',
      // v0 的 seatIds / 带色笔画与 Seat 模型没有对应关系，直接从头来
      version: 1,
      migrate: () => ({ seats: [], ...FRESH_GAME }),
    },
  ),
)

/** 当前轮到第几个座位（strokes 里找不到就要它），与轮到谁几笔的推导共用一处 */
export function turnIndexOf(strokes: number, seats: number): number {
  return seats > 0 ? strokes % seats : 0
}

/** 第几轮（1 起）。没画满一轮时大家都在第 1 轮 */
export function roundOf(strokes: number, seats: number): number {
  return seats > 0 ? Math.floor(strokes / seats) + 1 : 1
}

/** 画满了（每人 rounds 笔）或被提前结束都算定格 */
export function isDoneOf(
  s: Pick<FakeArtistState, 'phase' | 'earlyDone' | 'strokes' | 'seats' | 'rounds'>,
): boolean {
  return s.phase === 'playing' && (s.earlyDone || s.strokes.length >= s.seats.length * s.rounds)
}
