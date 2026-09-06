/**
 * BGG xmlapi2 的 token 校验:带 Bearer 请求一个最轻的公开端点,只看状态码。
 *
 * 浏览器直连可行 —— BGG 的 CORS preflight 已放行 Authorization 头
 * (2025 年"必须走代理"的报告已过时,2026-09 实测)。这是扫码发牌之外
 * 第二个出网点,只在设置页保存 token 时由用户主动触发一次。
 */
export type BggTestResult = 'ok' | 'invalid' | 'unreachable'

export async function testBggToken(token: string): Promise<BggTestResult> {
  let res: Response
  try {
    res = await fetch('https://boardgamegeek.com/xmlapi2/thing?id=1', {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    })
  } catch {
    return 'unreachable'
  }
  // 401 专指 token 无效;5xx 与断网对使用者没有区别,都归 unreachable
  if (res.status === 401) return 'invalid'
  return res.ok ? 'ok' : 'unreachable'
}
