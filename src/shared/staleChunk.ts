/**
 * 部署后旧页面持有的 chunk 路径会当场失效：产物名带 hash，而 GitHub Pages 是整站
 * 全量替换，旧文件在服务器上一个都不留 —— 懒加载的工具页（tools/registry.ts）
 * 于是取不到自己的 chunk。唯一的修复是重新加载，拿一份新的 index.html。
 *
 * 正常路径已经由 SW 兜住（registerType 是 prompt，旧 precache 不会被提前清掉），
 * 这里只管 SW 还没接管的那些时刻：首次访问、precache 安装失败、Pages 的 CDN
 * 跨边缘节点还没同步完。
 */

const KEY = 'bgtools:chunk-reload-at'

/**
 * 冷却窗口不能去掉：文件真的缺失时重载一样会失败，没有它就是无限刷新。
 * 存进 sessionStorage 而不是内存，因为标记必须活过它自己触发的那次重载。
 */
const COOLDOWN_MS = 15_000

/** @returns 是否真的重载了。false = 刚重载过还是失败，该把错误交给 UI（pages/LoadError.tsx） */
export function reloadOnceForStaleChunk(): boolean {
  const last = Number(sessionStorage.getItem(KEY) ?? 0)
  if (Date.now() - last < COOLDOWN_MS) return false

  sessionStorage.setItem(KEY, String(Date.now()))
  location.reload()
  return true
}
