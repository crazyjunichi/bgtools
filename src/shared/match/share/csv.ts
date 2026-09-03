/**
 * CSV 出口的公共部分。表格的**形状**由各工具自己拼（计分纸是条目 × 席位，
 * 多轮计分是轮次 × 席位），这里只管转义与拼串这两件所有表格都一样的事。
 */

/**
 * 逗号 / 引号 / 换行都得包起来（席位名是用户随便打的，「小明, 小红」这种一定会出现）。
 * CSV 里引号的转义是**翻倍**而不是反斜杠。
 */
function csvCell(v: string): string {
  return /[",\r\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v
}

/** BOM。用码点而非字面量：那个字符在源码里不可见，谁都不该靠肉眼确认它还在 */
const BOM = String.fromCharCode(0xfeff)

/**
 * 一行一个数组。BOM 不能省：没有它 Excel 会按本地代码页解中文，打开就是乱码。
 *
 * 数字得由调用方先转成 ASCII 负号的串 —— Excel 不认 U+2212，整列会被当成文本。
 */
export function toCsv(rows: string[][]): string {
  // CRLF：Excel 对 LF-only 的兼容性时好时坏，而所有表格软件都吃 CRLF
  return BOM + rows.map((cols) => cols.map(csvCell).join(',')).join('\r\n') + '\r\n'
}
