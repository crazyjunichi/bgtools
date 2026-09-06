import { create } from 'zustand'
import { persist } from 'zustand/middleware'

/** 一条自定义身份：文本 + 张数。count 为 0 = 这局不发，条目留着下局再用 */
export type DealEntry = {
  id: string
  text: string
  count: number
}

type DealCustomState = {
  entries: DealEntry[]
  /**
   * 下一个条目序号，id 即 `c<N>`。刻意用顺序短 id 而不是随机串：
   * 扫码发牌时 id 按 `id:n` 拼进二维码（见 [payload.ts](../../shared/deal-roles/online/payload.ts)），
   * 短 id 直接决定码的密度；id 只由组织者这一台设备生成，无多端碰撞。
   */
  nextId: number

  add: (text: string) => void
  rename: (id: string, text: string) => void
  setCount: (id: string, n: number) => void
  remove: (id: string) => void
  clear: () => void
}

export const useDealCustomStore = create<DealCustomState>()(
  persist(
    (set, get) => ({
      entries: [],
      nextId: 1,

      add: (text) => {
        const { entries, nextId } = get()
        set({ entries: [...entries, { id: `c${nextId}`, text, count: 1 }], nextId: nextId + 1 })
      },

      rename: (id, text) =>
        set({ entries: get().entries.map((e) => (e.id === id ? { ...e, text } : e)) }),

      setCount: (id, n) =>
        set({
          entries: get().entries.map((e) => (e.id === id ? { ...e, count: Math.max(0, n) } : e)),
        }),

      remove: (id) => set({ entries: get().entries.filter((e) => e.id !== id) }),

      clear: () => set({ entries: [] }),
    }),
    { name: 'bgtools:deal-custom' },
  ),
)
