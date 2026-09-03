import { create } from 'zustand'
import { persist } from 'zustand/middleware'

/**
 * 只留最近这些局。玩家侧一晚可能扫好几局，不裁剪就会无界增长 ——
 * 而这里刻意不上 IndexedDB：需要同步首帧（异步读会让落地页先闪一下"正在领牌"），
 * 且旧局的 rid 没有任何回看价值，超出就该丢。
 */
const KEEP = 20

type JoinEntry = {
  gameId: string
  /** 自己那条排队记录的 id。**幂等重扫全靠它**：服务端不认人，只认这个 id */
  rid: string
}

type DealJoinState = {
  mine: JoinEntry[]
  remember: (gameId: string, rid: string) => void
}

/**
 * 玩家侧记的"我在哪局用的哪个 rid"。刷新页面、息屏后重开都能看到同一张牌；
 * 清了浏览器数据或换手机就会重领一张 —— 那是可以接受的（重复领取只要幂等，
 * 不需要服务端硬拦）。
 *
 * **这里不存身份**：身份是从二维码的配比 + 种子 + 自己的排队序号当场算出来的，
 * 落盘等于把牌留在手机上。
 */
export const useDealJoinStore = create<DealJoinState>()(
  persist(
    (set, get) => ({
      mine: [],

      remember: (gameId, rid) => {
        const rest = get().mine.filter((e) => e.gameId !== gameId)
        set({ mine: [...rest, { gameId, rid }].slice(-KEEP) })
      },
    }),
    {
      name: 'bgtools:deal-join',
      partialize: ({ mine }) => ({ mine }),
    },
  ),
)

/** store 外也要查（claim 流程在渲染之外跑），单独给一个读函数 */
export function ridFor(gameId: string): string | undefined {
  return useDealJoinStore.getState().mine.find((e) => e.gameId === gameId)?.rid
}
