/**
 * trystero + mqtt.js 的体积不该进首屏 —— 只有真正开联机的那条路才拉这块 chunk。
 * 主机（工具页点开联机）与玩家（/play 落地页）都从这一个口进。
 */
export const loadSessionTransport = () => import('@trystero-p2p/mqtt')
