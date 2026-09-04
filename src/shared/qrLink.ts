/**
 * 本站二维码链接的唯一约定，生成 / 站内扫码 / 外部进入三层共用：
 *
 * - 码的内容一律是完整本站 URL（origin + base + `#/<path>?<query>`），**hash 路由即协议**：
 *   「这个码能干什么」由路由表回答，扫码端不认识任何具体业务参数
 * - 生成方只管拼 URL 喂 [Qr](components/Qr.tsx)，协议细节（如版本号）归各自模块
 *   （现有生成方：扫码发牌的 join 码，见 deal-roles/online/payload.ts；分享本站，见 quick/share）
 * - 外部扫码（系统相机打开 URL）与站内扫码落同一条路：hash 交给 router，
 *   未匹配的路径落 NotFound。新增一种可扫码功能 = 新增一条路由，这里不许跟着改
 */

/**
 * 把扫到的文本解析成本站路由路径（`/join?…` 这样的 hash 内容）。
 * 不是本站链接（含纯文本、外链、非 `#/` 的 hash）一律返回 null。
 */
export function sitePathOf(text: string): string | null {
  let url: URL
  try {
    url = new URL(text)
  } catch {
    return null
  }
  if (url.origin !== location.origin) return null
  if (!url.hash.startsWith('#/')) return null
  return url.hash.slice(1)
}
