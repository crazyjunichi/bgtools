import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { ShareSkinId } from './share/skins'

/**
 * 分享面板上次选的外观与形态。**这台设备的偏好，不属于任何一局** ——
 * 习惯发群里的人每次都要战绩榜，要打印的人每次都要浅底，所以值得 persist；
 * 而读一局历史不该把当时的排版一起读回来。
 *
 * `form` 是裸 string：各工具注册的形态集合互不相同（见
 * [MatchExport](detail.ts)），跨工具共用一个偏好时 id 必然会失效，
 * 面板那边一律回落到首项。
 */
type ShareState = {
  skin: ShareSkinId
  form: string
  setSkin: (skin: ShareSkinId) => void
  setForm: (form: string) => void
}

export const useShareStore = create<ShareState>()(
  persist(
    (set) => ({
      skin: 'print',
      form: 'matrix',
      setSkin: (skin) => set({ skin }),
      setForm: (form) => set({ form }),
    }),
    { name: 'bgtools:share' },
  ),
)
