# 联机会话（session）封存档案

> 本模块已于 2026-09 从 BGTools 拆除，实时联机能力迁往独立联机项目。
> **完整可运行实现留存在 git 历史：`4ea0629`（含）之前的任意提交**，`git show 4ea0629:src/shared/session/host.ts` 即可取回原文。
> 本文档蒸馏的是「为什么这么设计」和踩过的坑 —— 代码能 checkout，教训不能。

## 1. 架构模型：主机权威 + WebRTC P2P，没有服务器

- **主机就是桌上那台平板**，持有游戏状态真源（在工具自己的 zustand store 里）。
- **玩家手机是哑终端**：只渲染主机按人裁剪后下发的视图，把点击变成动作上报，**不算任何游戏规则**。
- 传输是 WebRTC DataChannel（P2P 直连）；[trystero](https://github.com/dmotz/trystero) 的**公共 MQTT relay 只在配对瞬间交换 SDP**，游戏数据一个字节不经过 relay。选 mqtt 策略是因为其默认 relay 列表含国内节点。
- 加密口令（trystero 的 `password`）**只走二维码 fragment**，不进信令。relay 只看见随机房间号，反推不出会话密钥，也不知道里面在玩什么。

```
平板(主机)                公共 MQTT relay              手机(玩家)
  │  joinRoom(appId, password) │                            │
  │◄──── SDP 信令（仅配对瞬间）►│◄──── SDP 信令 ────────────►│
  │                                                            │
  │◄══════════ WebRTC DataChannel（全部游戏数据）════════════►│
```

## 2. 协议

### 入场链接（payload.ts）

三要素全在 fragment：`#/play?tool=<id>&room=<12位base36>&key=<16位base36>`。`tool` 让玩家落地页按注册表找回对应的视图组件；`room`/`key` 即房间号与加密口令。decode 侧把二维码当外部输入，形态不对直接判废，不进会话层。

### 消息信封（types.ts）

会话层**只搬运，不解释** `data`/`view` —— 游戏私有协议放各工具目录（范例：`codenames/view.ts`）。

```ts
// 上行：手机 → 主机
type UpMsg = {
  rid: string    // 玩家 id：本机生成、按房间持久化，刷新/重连凭它认回座位
  seq: number    // 动作序号，主机按 rid 幂等去重（断线重发是常态）
  hello: boolean // true = 握手：主机重置该 rid 的 seq 水位并回推当前视图
  data: JsonValue
}
// 下行：主机 → 手机。view 已按「这台手机该看见什么」裁剪好
type DownMsg = { ok: true; view: JsonValue } | { ok: false } // false = 不接待（座位满等）
```

约束到 `JsonValue`：传输层只保证 JSON 形状，**游戏侧拿到的一律当外部输入先卡形状**。

### 关键身份设计

- `rid` 稳定（存玩家手机 localStorage，按房间记，只留最近 20 个 —— 外人设备上存东西要克制），`peerId` 每次重连都变。主机内存里维护 `rid → peerId` 绑定，座位绑定（rid ↔ 角色）持久化在主机 store。
- 玩家**无法从加入顺序认出主机**：第一张视图从哪台 peer 来，主机就是谁。

## 3. 主机侧接线模式（范例：codenames/session.ts）

这是推荐的接入形状 —— **游戏流程不分叉，session 只是一条边**：

1. 房间凭据（`room.id`/`room.key`）持久化在工具 store，主机刷新后同一张二维码仍有效。
2. `ensureSession()` 幂等：页面在 room 存在期间持续调用，建好了就直接返回。
3. **store 一变就重推**：`subscribe` 里按白名单字段（`SYNC_FIELDS`）比较，`push()` 对每个 bound rid 调 `viewFor(rid)` 分别裁剪下发。运行时状态（在线人数等）不进持久化 store，单独一个瞬时 store。
4. 动作入口先卡形状再进 store，校验全在 store 的 action 里。
5. **等 chunk 加载的间隙房间可能已被关掉**：`await createHostSession` 返回后要重新核对 store 里的 room 还是不是原来那间，不是就立即 `close()`。
6. 页面卸载 = 会话结束（`closeSession`）。

`viewFor` 的裁剪范例：未入座玩家只收到公共状态 + 哪个座位空着（`kind: 'claim'`）；入座后多发一张完整键卡（`kind: 'spy'`）。**私有信息从不离开主机去错设备**。

## 4. 玩家落地页模式（pages/Play.tsx）

- **挂在 App 之外**（与 `/` 平级）：扫码进来的人不是来用工具箱的，进来就该看到自己那份视图，零点击自动连。
- **连接状态机**：`connecting → ready | rejected | failed`。failed 给一句人话 + **自动重试倒计时**（8s，按钮只是不想等时的立即入口）—— 主机 relay 假死自愈有窗口期，自动重试覆盖它。
- **诊断翻译成人话**：原始计数（relay 开放数 / peer 数 / hello 数）普通玩家看不懂，折成三阶段一句话：`relay=0` → 网络问题；`有 relay 无 peer` → 主机不在线；`有 peer 无回音` → 主机侧的锅。
- **重扫另一局不闪旧画面**：状态带上它属于哪一轮（`attempt:search`），渲染期推导而不是 effect 里同步置。
- **`decodePlayLink(search)` 必须 `useMemo`**：它每次渲染返回新对象，直接当 effect 依赖会让会话反复重建，连接预算永远走不完（表现：永远卡在 connecting）。
- **`window.isSecureContext` 必须前置检查**：trystero 的口令加密用 `crypto.subtle`，只在安全上下文存在 —— 明文 HTTP 的局域网地址直接走不通，要给玩家一句说明而不是报错。
- App 的语言切换 effect 管不到这条路由，`document.documentElement.lang` 要自己设。

## 5. 踩过的坑（每条都对应过一个真实 bug）

### 5.1 tab 冻结 = 传输层不可信，必须重建（resume.ts）

tab 被系统冻结期间 WebRTC/WebSocket 的**断开事件不会派发**，双方状态字里连接还是"活的"（僵尸连接），trystero 会因此拒绝重新配对（selfId 没变 = 还连着）。

- **判据是「JS 被暂停过」而不是可见性**：息屏/锁屏经常只冻结 JS 而不派发 `visibilitychange`。主判据用**计时器跳变**（冻结期间 interval 不跑，恢复后第一跳就能发现时间差 > 8s），`visibilitychange` 只当即时快通道；两个通道对同一次冻结只报一次。
- 主机端：冻结恢复后**重建房间**（凭据不变，二维码不用重扫），玩家侧自动重连认回座位。
- 玩家端：自以为 ready 就降级回 connecting 重握手，否则立刻换一波 announce。

### 5.2 relay 假死与空房看门狗（host.ts）

relay 的 TCP 半开状态下 WebSocket 状态字仍是 `OPEN`，mqtt.js 要靠 keepalive **最长约 90 秒**才察觉。对策：房间没人时主动 `close()` 全部 relay socket（15s 周期），mqtt.js 秒级自动重连，trystero 重连后重新订阅并重发 announce —— 恢复窗口从 keepalive 量级压到看门狗周期量级。**只在空房时跑**：已配对 peer 走 DataChannel 不经过 relay，不打断进行中的配对。

### 5.3 配对不上要主动重进房间（client.ts）

trystero 只在进房头两秒连发 3 次 announce，之后沉默 60 秒一轮，公共 relay 丢消息又是常态 —— 干等会被连接预算截杀。对策：**没配上就定时 leave + 重新 joinRoom**（5s + 抖动），每轮换一波新的 announce 连发。注意 `joinRoom` 对同 roomId 有缓存，**必须先 leave 干净再进**，否则拿到的是旧房间。主机可能比我们晚开房（先举码后开局），每个新 peer join 都补一次 hello。

### 5.4 其他

- 上行动作必须 `(rid, seq)` 幂等：断线重发是常态。hello 会重置该 rid 的 seq 水位。
- 传输库只在联机路径**动态 import**（mqtt.js 体积不进首屏）。代价：构建期仍要全量打包，CI 构建时间从 ~40s 涨到 ~5min —— 这是本模块被拆除的直接诱因之一。
- NAT 打不通（蜂窝 + 对称 NAT）是**修不好的已知形态**：玩家侧给一句人话 + 自动重试，不出异常堆栈；主机侧永远保留不依赖网络的替代操作路径。

## 6. 拆除决策的背景（给未来项目参考）

拆除原因不是设计失败，而是定位错配：

1. **双流程税**：「必须能完整降级到单机」的约束让每个接入工具维护离线主干 + 联机侧路两套交互与提示，而不稳定性（5.1–5.3 全部是稳定性补丁）使这条税持续缴纳。
2. **构建成本**：mqtt.js 使 CI 构建 40s → 5min，而全项目只有一个工具（codenames）在用。
3. **定位**：BGTools 是桌面离线辅助工具；完整联机体验（不用考虑降级、可以做大厅/匹配）值得独立项目承载。

**给新项目的建议**：本文档的协议与坑位结论可直接复用；但「离线降级」约束可以扔掉，换来更好的联机体验（断线重连进房、跨局房间、观战等在本项目里被刻意禁止的能力）。
