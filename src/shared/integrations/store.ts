import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { DealTarget } from '../deal-roles/online/backend'

type IntegrationsState = {
  /**
   * 扫码发牌的后端地址。**只在这台浏览器里**:不进仓库、不进构建产物,
   * 也不会传给项目作者 —— 玩家那边只通过二维码的 fragment 拿到它。
   */
  dealTarget: DealTarget | null
  /** BGG 个人 token(xmlapi2 的 Bearer 凭据)。空串 = 未配置 */
  bggToken: string

  setDealTarget: (target: DealTarget) => void
  clearDealTarget: () => void
  setBggToken: (token: string) => void
}

/**
 * 第三方凭据的统一落点:设置页「第三方配置」维护,各功能读取。
 * 配得上就有对应功能(如扫码发牌),没配就完整降级,不引入任何全局在线判断。
 */
export const useIntegrationsStore = create<IntegrationsState>()(
  persist(
    (set) => ({
      dealTarget: null,
      bggToken: '',

      setDealTarget: (dealTarget) => set({ dealTarget }),
      clearDealTarget: () => set({ dealTarget: null }),
      setBggToken: (bggToken) => set({ bggToken }),
    }),
    { name: 'bgtools:integrations' },
  ),
)

// 旧 key 的一次性迁移:发牌后端地址曾独立存在这里。sync storage 下 create 返回时已水合完毕
const LEGACY_DEAL_KEY = 'bgtools:deal-online'
try {
  const raw = localStorage.getItem(LEGACY_DEAL_KEY)
  if (raw) {
    const target = (JSON.parse(raw) as { state?: { target?: DealTarget | null } }).state?.target
    if (target && !useIntegrationsStore.getState().dealTarget) {
      useIntegrationsStore.getState().setDealTarget(target)
    }
    localStorage.removeItem(LEGACY_DEAL_KEY)
  }
} catch {
  // 隐私模式可能连 localStorage 读都拒 —— 迁移失败只是旧配置不跟过来,不挡正常流程
}
