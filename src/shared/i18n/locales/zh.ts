/**
 * 简体中文 —— 文案真源。key 的形状由这份文件定义，[en.ts](en.ts) 必须与它同构
 * （类型 `Resources` 会强制这一点，缺 key / 多 key 都在 `tsc` 阶段报错）。
 *
 * 分层与目录对齐：`common` 跨处复用 · `dice` 骰子术语 ·
 * `quick.*` 顶栏小工具 · `tools.*` 首页宫格里的工具。
 *
 * 插值参数一律不叫 `count` —— 那是 i18next 的复数保留名，会让它去找
 * `xxx_one` / `xxx_other` 变体。数量统一用 `{{n}}`。
 */
export const zh = {
  app: {
    title: '桌游工具箱',
  },

  common: {
    /** ConfirmButton 的默认二次确认文案 */
    confirm: '确认？',
    confirmShort: '确认',
    confirmDelete: '确认删除',
    cancel: '取消',
    close: '关闭',
    /** 从 IDB 读盘期间的占位（计分纸历史、统计页） */
    loading: '正在读取…',
    reset: '重置',
    delete: '删除',
    clear: '清空',
    total: '总和',
    count: '数量',
  },

  header: {
    back: '返回首页',
    /** 顶栏返回被工具内子视图接管时（回工具入口而非首页），读屏不能说成「返回首页」 */
    backInTool: '返回',
    toPortrait: '切换到竖屏',
    toLandscape: '切换到横屏',
  },

  /** 首页三个分区 */
  home: {
    quick: '快捷工具',
    general: '通用工具',
    game: '游戏专用工具',
    /** 模板入口的读屏文本：卡面上只有游戏名，得说清点进去是哪个工具 */
    sheetOf: '{{name}} · 计分纸',
    /** 模板卡的描述行。同区里还有别的工具，这行要担起「点进去是干什么」 */
    sheetDesc: '计分纸 · {{n}} 项条目',
    /** 只筛游戏专用区。与计分纸的模板搜索同一套判据：中英文名、别名都能命中 */
    filter: '筛选游戏',
    noMatch: '没有匹配的游戏。',
  },

  notFound: {
    text: '没有这个工具',
    home: '回首页',
  },

  /** 工具页的 chunk 拉不到（多半是刚部署过，旧 hash 已失效） */
  loadError: {
    text: '这个工具没加载出来',
    hint: '通常是刚更新过，重新加载就好。记录都在本机，不会丢。',
    retry: '重新加载',
  },

  /** 有新版本装好了在等着接管 */
  update: {
    available: '有新版本',
    hint: '更新会重新加载页面，记录不受影响',
    action: '立即更新',
    later: '稍后',
  },

  stepper: {
    decrease: '减少',
    increase: '增加',
  },

  /** 顶栏快捷骰子（前三条）与游戏骰组界面（[shared/dice](../../dice)）共用 */
  dice: {
    type: '骰型',
    roll: '投掷 {{n}}d{{sides}}',
    rolling: '投掷中…',
    /** 骰组名，与 [presets.ts](../../dice/presets.ts) 一一对应 */
    sets: {
      yahtzee: '快艇骰子',
    },
    /** 骰池：勾选哪几颗、投掷、锁定结果 */
    pool: {
      /** 入口按钮只有一个图标，同一页上可能有两套骰组，读屏得报出是哪套 */
      open: '打开{{name}}',
      pick: '骰子',
      all: '全选',
      none: '全不选',
      /** 勾选格的读屏名：骰名 + 它是盒里第几颗 */
      die: '{{name}} 第 {{n}} 颗',
      roll: '投掷 {{n}} 颗',
      reroll: '重掷 {{n}} 颗',
      emptyPick: '先勾选要投的骰子',
      lock: '锁定 {{name}}：{{face}}',
      unlock: '解锁 {{name}}：{{face}}',
      tally: '各面',
    },
  },

  players: {
    /** 系统生成的座位名。已存进 localStorage 的旧名字不会跟着语言变 */
    defaultName: '玩家{{n}}',
    /** 顺序与 [colors.ts](../../players/colors.ts) 的 PLAYER_COLORS 一致：四行 = 四个色域块 */
    colors: {
      red: '红',
      orange: '橙',
      yellow: '黄',
      lime: '柠绿',
      green: '绿',
      teal: '松绿',
      cyan: '青',
      blue: '蓝',
      indigo: '靛',
      violet: '紫',
      fuchsia: '洋红',
      pink: '粉',
      brown: '棕',
      white: '白',
      gray: '灰',
      black: '黑',
    },
    select: {
      empty: '名单是空的。',
      manage: '管理玩家',
      /** 待选区上方那行引导，不说「池」 */
      poolHint: '点击玩家加入',
      /** 待选卡点一下进参与区，参与卡点一下放回 —— 动作文案给读屏 */
      join: '{{name}}，点击加入',
      leave: '{{name}}，点击移出',
    },
    /** 计分工具的开局选人空态（[SeatStart](../../players/SeatStart.tsx)），计分工具共用 */
    seatStart: {
      /** n = 已加入人数（名单勾选 + 临时席），主角区的人数要一眼可见 */
      label: '这局谁在玩（{{n}} 人）',
      start: '就坐（{{n}} 人）',
      /** 参与卡末尾那张虚线卡：加一个待入座的临时席 */
      tempAdd: '临时玩家',
      /** 待入座卡点了就删，卡上显示的是落座后的名字（玩家N），文案给读屏 */
      tempRemove: '移除 {{name}}',
    },
    /**
     * 席位面板（[SeatPicker](../../players/SeatPicker.tsx)），多轮计分与计分纸共用。
     * 「移除这一列」的按钮在这里，但**文案留在各自的 `tools.*` 下**并由工具传进来 ——
     * 各工具删掉的东西不一样（一边连历史轮次，一边连各项分数）
     */
    seat: {
      nameInput: '改这一列的名字',
      roster: '名单里的人',
      emptyRoster: '名单是空的。',
      /** 已经是这一列的人：格子上另有 ✓ 与描边，这条只给读屏 */
      current: '{{name}}，当前就是这一列',
      seated: '{{name}}，已在别的列入座',
      unlink: '解除关联，改回临时席位',
      /** 这一列还是临时席位（没绑名单玩家）时显示的一句，在席位面板里 */
      tempHint: '临时席位不计入个人战绩，从名单选人可长期统计',
      /** 列表最后一格，宽度只有约 128px */
      manage: '管理名单',
    },
  },

  /**
   * 游戏目录（[shared/games](../../games/registry.ts)）。**与 `tools.*` 的工具名分开**：
   * 「狼人杀」是一盒游戏，「狼人杀主持」是服务它的工具，两个名字都得在。
   */
  games: {
    name: {
      agricola: '农场主',
      catan: '卡坦岛',
      splendor: '璀璨宝石',
      azul: '花砖物语',
      ticketToRide: '铁路之旅',
      carcassonne: '卡卡颂',
      wingspan: '展翅翱翔',
      patchwork: '拼布',
      everdell: '绮丽庄园',
      sevenWonders: '七大奇迹',
      arnak: '阿纳克遗迹',
      cascadia: '喀斯喀迪亚',
      terraformingMars: '火星殖民地',
      terraMystica: '泰拉神秘之地',
      greatWesternTrail: '大西部之路',
      castlesOfBurgundy: '勃艮第城堡',
      /** 中文圈没有统一译名，索性用原名，几种叫法都进别名串 */
      clank: 'Clank!',
      bombBusters: '炸弹克星',
      werewolf: '狼人杀',
      yahtzee: '快艇骰子',
      diceThrone: '王权骰铸',
    },
    /**
     * **只参与搜索、永不渲染**：桌上的口头叫法常常不是官方译名（农家乐 / 翼展 / 车票之旅），
     * 只匹配正式名会搜不到。两个语言的别名都进比对串，所以中英文混着打也能命中
     */
    alias: {
      agricola: '农家乐 农夫',
      catan: '卡坦 开拓者',
      splendor: '宝石商人 宝石',
      azul: '阿祖 瓷砖',
      ticketToRide: '车票之旅 铁路 火车 TTR',
      carcassonne: '卡卡送 版块',
      wingspan: '翼展 鸟',
      patchwork: '拼布艺术 双人',
      everdell: '常青庄园 艾弗戴尔 松鼠',
      sevenWonders: '7 Wonders 奇迹',
      arnak: '失落的阿纳克遗迹 阿纳克 遗迹 Arnak',
      cascadia: '卡斯卡迪亚 山河之间 动物 Cascadia',
      terraformingMars: '改造火星 殖民火星 火星 TM',
      terraMystica: '泰拉密斯提卡 神秘大地 教派',
      greatWesternTrail: '西部之路 赶牛 牛仔 GWT',
      castlesOfBurgundy: '勃根地城堡 城堡 骰子',
      clank: '克朗克 珂玛 叮当 地牢',
      bombBusters: '拆弹 拆炸弹 排线 Bomb Busters',
      werewolf: '狼人 狼 Werewolf',
      yahtzee: '快艇 大话骰 Yahtzee',
      diceThrone: '骰子王座 王权 Dice Throne',
    },
  },

  /** 一局游戏的结算与存档（[shared/match](../../match/types.ts)），各工具共用同一套措辞 */
  match: {
    title: '本局结算',
    gameLabel: '这是哪盒游戏',
    gameNone: '不指定',
    players: '参与者',
    /** 名次角标，`n` 是第几名 */
    rank: '第 {{n}}',
    /** 点一下切换「这人算赢」，读屏要念到是谁 */
    markWin: '{{name}} 算获胜',
    coopQuestion: '这局赢了吗',
    coopWin: '通关',
    coopLoss: '失败',
    winnerTeam: '获胜阵营',
    duration: '时长',
    durationHm: '{{h}} 小时 {{m}} 分',
    durationM: '{{m}} 分钟',
    /** 不足一分钟不给数字，见 [format.ts](../../match/format.ts) */
    durationShort: '不到 1 分钟',
    note: '备注',
    notePlaceholder: '随便记一句（可留空）',
    save: '记录这一局',
    discard: '不记录，直接开新局',
    confirmDiscard: '确认丢弃本局',
    unavailable: '这台设备禁用了本地数据库，本局记不下来，但可以直接开新局',
    /** 记下来之后那一步：先给分享的机会，开新局要再按一下 */
    saved: '这一局已经记下来了',
    newGame: '开新局',
    /** 历史列表一行的读屏文案（[MatchRow](../../match/MatchRow.tsx)），整块是按钮 */
    open: '{{date}} · {{name}}，点击查看这一局',

    /** 把一局分享出去（[MatchShare](../../match/MatchShare.tsx)），各工具共用 */
    share: {
      /** 面板标题，也当图片的 alt 与系统分享面板的标题 */
      title: '分享本局',
      save: '保存',
      /** 走系统分享面板。与 `save` 并排，所以只留一个词 */
      shareBtn: '分享',
      copyText: '复制文本',
      copied: '已复制',
      /** 换形态时新图还没画完那一小会儿 */
      rendering: '正在生成…',
      /** payload 反解不出来（别的版本记下的局面）时的一句人话，不出堆栈 */
      failed: '这一局出不了这种形式，可能是旧版本记下的。换一种试试，战绩榜总是出得来。',
      /** 画在图片页脚：图会脱离应用流传，得留一句它是什么出的 */
      brand: 'BGTools',
      /** 外观：只换配色，不影响画哪些数 */
      skin: '外观',
      /** 形态：决定导出什么、怎么摆 */
      form: '内容',
      skins: {
        print: '印刷',
        dark: '深色',
      },
      /** 各工具自己的形态在它们的 key 下，这里只有跨工具通用的两种 */
      forms: {
        rank: '仅排名',
        csv: 'CSV',
      },
    },

    /** 回看一局的细则视图（[MatchTool.Detail](../../match/detail.ts)），各工具自己画 */
    detail: {
      /** 反解不出那一局的局面时（别的版本记下的）只少这一块，名单与备注照显示 */
      unreadable: '这一局的细则读不出来，可能是旧版本记下的。名次与分数仍在上面。',
      /** 细则那份代码没加载出来（通常是刚更新过，旧 chunk 没了） */
      failed: '细则没加载出来，可能是刚更新过。重新加载页面再试。',
    },

    /** 纯文本摘要（[summary](../../match/share/summary.ts)），贴到群里用 */
    summary: {
      note: '备注：{{text}}',
    },
  },

  quick: {
    /** tile 面板的入口按钮 aria-label，也是面板自己的名字 */
    menu: {
      name: '小工具',
    },
    dice: {
      name: '快速骰子',
      /** 首页快捷卡上的一行说明，下同 */
      desc: '随手投一把',
    },
    timer: {
      name: '计时器',
      desc: '回合限时 · 代替沙漏',
      quickStart: '快速开始',
      custom: '自定义（{{step}} 秒一档）',
      start: '开始 {{time}}',
      pause: '暂停',
      resume: '继续',
      running: '计时中',
      paused: '已暂停',
      idle: '未开始',
      alarm: {
        title: '时间到',
        again: '再计 {{time}}',
        dismiss: '知道了',
      },
    },
    pointer: {
      name: '随机指针',
      desc: '随机指一个方向',
      spinning: '旋转中…',
      oclock: '≈ {{hour}} 点方向',
      spin: '随机指向',
    },
    /** 随机点人。候选只能是当前这一局的席位，所以入口只在工具页里有人时才出现 */
    pick: {
      name: '随机点人',
      desc: '从这局的人里抽一个',
      candidates: '这局的人',
      spinning: '抽…',
      result: '就是这位',
      spin: '抽一个',
      again: '再抽一个',
      /** 浮层开着时切回首页会走到这里 */
      empty: '这局还没有人。',
    },
    players: {
      name: '玩家名单',
      desc: '桌上是谁 · 名字与颜色',
      roster: '已添加玩家',
      emptyList: '名单是空的。',
      add: '添加玩家',
      nameInput: '玩家名字',
      colorLabel: '偏好颜色',
      colorTaken: '{{color}}，{{who}} 也在用',
    },
    /** 扫本站二维码（join 码、分享本站出示的页面码），扫到同源链接直接跳转 */
    scan: {
      name: '扫码',
      desc: '扫本站的二维码',
      hint: '对准本站的二维码',
      starting: '正在打开相机…',
      denied: '没有相机权限，请在浏览器设置里允许',
      noCamera: '找不到可用的相机',
      unsupported: '当前环境打不开相机',
      badLink: '不是本站的二维码',
    },
    /** 出示当前页面的二维码 / 链接给别的设备 */
    share: {
      name: '分享本站',
      desc: '扫码打开当前页面',
      copyLink: '复制链接',
      copied: '已复制',
      shareBtn: '分享',
    },
    settings: {
      name: '设置',
      desc: '界面语言',
      language: '语言',
      theme: '主题',
      themeSystem: '跟随系统',
      themeLight: '浅色',
      themeDark: '深色',
      eink: '墨水屏',
      einkAuto: '自动',
      einkOn: '开',
      einkOff: '关',
    },
  },

  /**
   * 语音主持人（[shared/voice-host](../../voice-host)）自己的界面文案。
   * **被念出去的台词不在这里**，在各宿主游戏的 `tools.<id>.say.*` 下 ——
   * 流程是按游戏定的，引擎不认识任何一句台词。
   */
  voiceHost: {
    start: '开始主持',
    progress: '第 {{n}} / {{total}} 步',
    stepsTotal: '共 {{n}} 步',
    toggles: '包含的角色',
    pause: '暂停',
    resume: '继续',
    skip: '跳过',
    stop: '结束',
    stopConfirm: '确认结束',
    paused: '已暂停',
    done: '流程结束',
    again: '再跑一遍',
    /** 「等你确认」那一步的主按钮：把屏上那句话说完了才点 */
    spoken: '说完了，继续',
    /** reveal 步的主按钮：密件记在脑子里了才点 */
    memorized: '记住了，继续',
    noSpeech: '这台设备不支持语音播报，流程改为屏幕显示',
    /** 每种步骤是什么。也当读屏文本用（流程预览里那排图标的 aria-label） */
    kind: {
      say: '播报',
      wait: '等待',
      confirm: '等你确认',
      reveal: '看密件',
      beep: '提示音',
    },
  },

  /**
   * 发身份（[shared/deal-roles](../../deal-roles)）自己的界面文案。
   * **身份名与阵营不在这里**，在各宿主游戏的 `tools.<id>.roles.*` 下 ——
   * 身份是按游戏定的，引擎不认识任何一个具体身份。
   */
  dealRoles: {
    /** 宿主游戏页上的入口按钮，各游戏共用这一句 */
    open: '发身份',
    title: '发身份',
    preset: '常见板子',
    presetN: '{{n}} 人',
    pick: '可选身份 · 点一下加一张',
    pool: '这局的身份 · 点一下减一张',
    total: '共 {{n}} 张',
    emptyPool: '还没放身份。',
    addRole: '加入 {{name}}',
    removeRole: '移除一张 {{name}}',
    /** 两种发牌方式并列，所以这句要点明是哪一种 */
    start: '轮传发 {{n}} 张',
    tooFew: '至少放两张身份',
    seat: '第 {{n}} 位 / 共 {{total}} 位',
    tapToReveal: '点这张卡查看身份',
    tapToHide: '看完了？点卡盖上，传给下一位',
    tapToFinish: '看完了？点卡结束',
    /** 盖上牌之后的过场，停一下才切到下一位的待翻界面 —— 逼出"先把设备递出去"这个动作 */
    handoff: '请交给下一位',
    done: '全部发完',
    again: '重新洗牌再发',
    stop: '结束发牌',
    stopConfirm: '确认结束',
    online: {
      start: '扫码发牌',
      title: '扫码发牌',
      /** 配置引导。要说清三件事：只做一次、地址是他自己的、地址不外传 */
      setupHint: '这一步只做一次：填一个你自己的实时数据库地址。玩家扫码后各自去那里排队领牌，地址只存在这台设备上。',
      urlLabel: '数据库地址',
      urlPlaceholder: 'https://……firebasedatabase.app',
      test: '测试并保存',
      testing: '正在测试…',
      change: '换个地址',
      opening: '正在开局…',
      scanHint: '各位用手机扫这个码，扫到的就是自己的身份',
      claimed: '已领 {{n}} / {{total}}',
      /** 领的人比牌多：多出来的那几台会看到"已领完"，这里得让组织者知道发生了什么 */
      overClaimed: '领牌的比牌还多：{{n}} / {{total}}',
      mine: '我也领一张',
      backToQr: '回到二维码',
      retry: '重试',
      joining: '正在领牌…',
      keepSecret: '记住它，别给别人看',
      soldOut: '这一局的牌已经领完了',
      soldOutHint: '找组织者确认一下 —— 也可能你扫的是上一局的码。',
      unknownSet: '认不出这局的游戏，更新一下再扫。',
      err: {
        offline: '连不上发牌服务，检查一下网络。轮传发牌不需要网络，随时可以改用它。',
        config: '发牌服务拒绝了这次请求。核对一下地址，并确认数据库规则已经发布。',
        taken: '这个牌局编号被占用了，再试一次会换一个。',
        ridCollision: '领牌没成功，再试一次。',
        badLink: '这个二维码不完整，请组织者重新出一次。',
        version: '两边的版本不一样，都更新一下再发。',
        unsupported: '这种发牌服务还没接上。',
      },
    },
  },

  /**
   * 联机会话（[shared/session](../../session)）的玩家落地页文案。
   * 主机侧的操作文案在各游戏的 `tools.<id>.*` 下。
   */
  play: {
    connecting: '正在连接主机…',
    failed: '连不上主机。',
    failedHint: '手机和主机要在同一个 Wi-Fi 下。一直连不上的话，请组织者改用离线玩法。',
    retry: '重试',
    /** 失败后的自动重试倒计时 */
    retryIn: '{{n}} 秒后自动重试',
    rejected: '主机没有给你留位置，看桌上的公共屏吧。',
    badLink: '这个二维码不完整或已过期，请组织者重新出一次。',
    insecure: '联机需要 HTTPS 页面（或本机 localhost）。当前是明文 HTTP 地址，浏览器不允许建立加密通道。',
    /** 连接中那句话下面的小字：把诊断计数翻成「进行到哪一步」，三层断点对应三句 */
    stageNet: '正在接通网络信号…',
    stageWaitHost: '信号正常，正在寻找主机…',
    stageSeating: '已找到主机，正在入座…',
  },

  tools: {
    codenames: {
      name: '行动代号',
      desc: '红蓝猜词对抗 · 队长手机看键卡出题',
      start: '开局',
      startHint:
        '25 个词里藏着两队的目标。只有队长知道答案，只能给「一个词 + 一个数字」的线索；队员讨论后点词翻开，翻到刺客当场判负。',
      newGame: '新一局',
      confirmNewGame: '重开？当前牌面作废',
      pass: '结束回合',
      peekKey: '队长键卡',
      peekHint: '仅队长查看 · 点任意处关闭',
      team: {
        red: '红队',
        blue: '蓝队',
      },
      turn: '{{team}}回合',
      waitingClue: '等待队长出题',
      clueNow: '线索：{{word}} × {{n}}',
      guessesLeft: '还可猜 {{n}} 个',
      remaining: '红 {{red}} · 蓝 {{blue}}',
      winner: '{{team}}获胜',
      byAssassin: '翻到了刺客',
      onlineOpen: '队长扫码入局',
      onlineInsecure: '联机需要 HTTPS 页面（或本机 localhost）。局域网 IP 的明文 HTTP 地址建不了加密通道，请用部署后的地址。',
      peersOnline: '手机已连 {{n}} 台',
      /** relay 全断时的提醒：玩家扫了也连不进来 */
      onlineNetDown: '联机信号未接通，玩家暂时连不进来',
      /** 有设备配对上了但还没入座（hellos 没到） */
      onlineJoining: '{{n}} 台设备正在连接…',
      seatTaken: '已入座',
      seatFree: '虚位',
      resetSeats: '重置座位',
      resetSeatsConfirm: '两位队长都要重新认领？',
      onlineClose: '关闭联机',
      onlineCloseConfirm: '关闭后所有手机断开？',
      /** 队长手机端（/play 落地页里的视图） */
      p: {
        claimTitle: '认领你的队伍',
        seatTaken: '已有人',
        full: '两个队长位都满了，公共牌面在桌上的平板。',
        youAre: '你是{{team}}队长',
        giveClue: '轮到你出题',
        clueWordPh: '一个线索词（不能在牌面上）',
        clueN: '关联个数',
        submitClue: '公布线索',
        badWord: '线索词不能在牌面上',
        waitGuess: '线索「{{word}} × {{n}}」· 队员猜词中，还可翻 {{left}} 个',
        waitClue: '对方队长出题中…',
      },
    },
    werewolf: {
      name: '狼人杀主持',
      desc: '语音主持一整夜 · 顺手发身份',
      flow: '标准夜晚流程',
      home: {
        dealDesc: '轮传或扫码，各看各的身份',
        host: '主持',
        hostDesc: '语音主持一整局，夜里按身份逐个叫醒',
      },
      param: {
        guard: '守卫',
        witch: '女巫',
        seer: '预言家',
        hunter: '猎人',
        roleSec: '每个角色环节',
        daySec: '白天讨论',
      },
      /** 这些是**要被念出来**的台词：写口语、带标点（TTS 靠标点断句和收尾） */
      say: {
        nightFall: '天黑请闭眼。',
        guardOpen: '守卫请睁眼，请选择你今晚要守护的人。',
        guardClose: '守卫请闭眼。',
        wolvesOpen: '狼人请睁眼，请互相确认身份，统一意见选择今晚要击杀的人。',
        wolvesClose: '狼人请闭眼。',
        witchOpen: '女巫请睁眼。你有一瓶解药和一瓶毒药，今晚要用吗？',
        witchClose: '女巫请闭眼。',
        seerOpen: '预言家请睁眼，请选择一位玩家查验身份。',
        seerClose: '预言家请闭眼。',
        hunterOpen: '猎人请睁眼，请确认你的技能状态。',
        hunterClose: '猎人请闭眼。',
        dayBreak: '天亮了，请所有人睁眼。',
        discuss: '本轮自由讨论 {{n}} 秒，时间到会有提示音。现在开始。',
        vote: '讨论时间到，请开始投票。',
        roundEnd: '本轮结束。',
      },
      /** 反过来这些**不念**：给主持人看的动作提示，内容每局都变，只能人自己说 */
      do: {
        announceDeaths: '宣布昨晚的死亡情况',
        announceVote: '宣布投票结果与被放逐的人',
      },
      /** 发身份用的身份集（[roles.ts](../../../../tools/werewolf/roles.ts)）：只有名字，交互文案在 `dealRoles.*` */
      roles: {
        set: '标准身份',
        role: {
          wolf: '狼人',
          villager: '平民',
          seer: '预言家',
          witch: '女巫',
          hunter: '猎人',
          guard: '守卫',
          idiot: '白痴',
        },
        team: {
          wolf: '狼人阵营',
          village: '好人阵营',
        },
      },
    },

    werewords: {
      name: '狼人真言',
      desc: '屏幕显词 · 语音主持 · 发身份',
      flow: '标准流程',
      home: {
        dealDesc: '轮传或扫码，各看各的身份',
        host: '主持',
        hostDesc: '语音主持一整局，魔法词在屏幕上显',
      },
      difficulty: {
        label: '词语难度',
        easy: '简单',
        standard: '标准',
      },
      param: {
        daySec: '提问时长',
      },
      /** 这些是**要被念出来**的台词：写口语、带标点（TTS 靠标点断句和收尾） */
      say: {
        nightFall: '天黑请闭眼。村长请睁眼。',
        mayorClose: '村长请闭眼。狼人请睁眼。',
        wolvesClose: '狼人请闭眼。先知请睁眼。',
        seerClose: '先知请闭眼。',
        dayBreak:
          '天亮了，请所有人睁眼。现在轮流向村长提问，猜出魔法词。村长只能回答：是、否、也许、很接近、差太远。',
        discuss: '你们有 {{n}} 秒，时间到会有提示音。现在开始。',
        timeUp: '时间到。',
      },
      /** 显词步的屏上指令：词本身在旁边大字显示，这句只是告诉该看的人看什么 */
      reveal: {
        mayor: '村长请记住这个魔法词',
        wolves: '狼人请记住这个魔法词',
        seer: '先知请记住这个魔法词',
      },
      /** 不念：结局内容每局都变，主持人自己宣布 */
      do: {
        ending:
          '宣布结果：若有人猜中魔法词，狼人有最后一次指认先知翻盘的机会；若没人猜中，村民投票指认狼人',
      },
      /** 发身份用的身份集（[roles.ts](../../../../tools/werewords/roles.ts)）。村长是职责不是身份，不在牌堆里 */
      roles: {
        set: '标准身份',
        role: {
          wolf: '狼人',
          seer: '先知',
          villager: '村民',
        },
        team: {
          wolf: '狼人阵营',
          village: '好人阵营',
        },
      },
    },

    avalon: {
      name: '阿瓦隆',
      desc: '发身份 · 语音主持开局夜',
      flow: '开局认身份',
      home: {
        dealDesc: '轮传或扫码，各看各的身份',
        host: '主持',
        hostDesc: '语音主持开局认身份夜，口诀一句不落',
      },
      param: {
        percival: '派西维尔与莫甘娜',
        mordred: '莫德雷德',
        oberon: '奥伯伦',
        roleSec: '睁眼时长',
      },
      /** 这些是**要被念出来**的台词：写口语、带标点（TTS 靠标点断句和收尾） */
      say: {
        nightFall: '天黑请闭眼。',
        oberonStay: '奥伯伦请保持闭眼。',
        minionsOpen: '所有坏人请睁眼，互相确认身份。',
        minionsClose: '坏人请闭眼。',
        thumbsUp: '所有坏人请竖起大拇指。',
        mordredDown: '莫德雷德请放下大拇指。',
        merlinOpen: '梅林请睁眼，记住这些坏人。',
        merlinClose: '梅林请闭眼。坏人请放下大拇指。',
        percivalOpen: '梅林和莫甘娜请竖起大拇指。派西维尔请睁眼。',
        percivalClose: '派西维尔请闭眼。大家请放下大拇指。',
        dayBreak: '天亮了，所有人请睁眼。游戏开始。',
      },
      /** 发身份用的身份集（[roles.ts](../../../../tools/avalon/roles.ts)） */
      roles: {
        set: '标准身份',
        role: {
          merlin: '梅林',
          percival: '派西维尔',
          servant: '忠臣',
          assassin: '刺客',
          morgana: '莫甘娜',
          mordred: '莫德雷德',
          oberon: '奥伯伦',
          minion: '爪牙',
        },
        team: {
          good: '好人阵营',
          evil: '坏人阵营',
        },
      },
    },

    bombBusters: {
      name: '炸弹克星',
      desc: '拆弹进度 · 装备发放 · 生命追踪',
      lives: {
        dead: '💥 已引爆',
        critical: '⚠️ 最后一点',
        low: '⚡ 还剩两点',
        ok: '剩余生命',
        minus: '扣除一点生命',
        plus: '增加一点生命',
      },
      wires: {
        title: '拆弹状态',
        cell: '数字 {{n}}：{{state}}',
        state: {
          intact: '未拆过',
          half: '拆了一半',
          done: '全部拆完',
        },
        /** 图例要挤进一行，比 state 更短 */
        legend: {
          intact: '未拆',
          half: '一半',
          done: '全拆',
        },
      },
      equip: {
        title: '装备牌 · 点击切换状态',
        card: '{{no}} 号 {{name}}：{{state}}',
        unknown: '未知装备',
        stale: '清单已更新，请重发装备',
        /** 三态词只进 aria-label —— 卡上的徽章只画图标，那点宽度让给名称 */
        state: {
          locked: '未激活',
          ready: '可用',
          used: '已用',
        },
        /**
         * 装备卡 1–12。desc 只写核心动作 —— 装备栏窄且 line-clamp-2，
         * 中文超过约 28 字就会被截断，完整措辞看桌上实物卡。
         */
        e1: { name: '标签 ≠', desc: '在两根号码不同的相邻导线间放 ≠ 指示物' },
        e2: { name: '对讲机', desc: '与一名玩家各交换一根未剪断的导线' },
        e3: { name: '三重探测器', desc: '探测队友底座上指定的 3 根导线' },
        e4: { name: '便利贴', desc: '在自己一根蓝线前放「危险」指示物' },
        e5: { name: '超级探测器', desc: '探测队友整个底座上的所有导线' },
        e6: { name: '抑制器', desc: '起爆器指针倒退一格' },
        e7: { name: '备用电池', desc: '翻回 1–2 张已用的角色能力牌' },
        e8: { name: '通用雷达', desc: '报一个号码，有该号蓝线的人须应「有」' },
        e9: { name: '稳定器', desc: '本回合指针不动、红线不炸' },
        e10: { name: 'X/Y 射线', desc: '指定 1 根导线时可同时报两个号码' },
        e11: { name: '咖啡瓶', desc: '跳过本回合，并指定下一位行动的玩家' },
        e12: { name: '标签 =', desc: '在自己两根号码相同的相邻导线前放 = 指示物' },
      },
      /** 左栏常驻的局面快捷键 */
      actions: {
        deal: '重发装备',
        newGame: '新一局',
        confirmNewGame: '确认重开',
      },
      settings: {
        open: '设置：人数',
        title: '设置',
        players: '人数（决定初始生命与装备数）',
        /** 人数下限是 2，英文永远是复数，不需要 i18next 的复数变体 */
        playerCount: '{{n}}人',
        warn: '切到 {{n}} 人将重开一局：生命重置为 {{n}}、装备重发、拆弹进度清空',
      },
    },
    diceThrone: {
      name: '王权骰铸',
      desc: '血量 · 战斗点 · 状态标记',
      finish: '结算',
      addSeat: '加一位',
      newGame: '新一局',
      confirmNewGame: '确认重开',
      hp: '生命',
      cp: '战斗点',
      /** 改它会同时把当前血量重置满，开局定档用 */
      startHp: '初始生命',
      statuses: '状态标记',
      eliminated: '已淘汰',
      editSeat: '{{name}}，点击改名或换人',
      remove: '移出本局',
      confirmRemove: '确认移出',
      /** 整张面板卡的读屏文本（卡上信息多，读屏只说最关键的两轨） */
      cardAria: '{{name}}：生命 {{hp}}，战斗点 {{cp}}',
      status: {
        burn: '灼烧',
        poison: '中毒',
        bleed: '流血',
        chill: '寒冷',
        stun: '昏迷',
        concussion: '脑震荡',
        knockdown: '击倒',
        blind: '致盲',
        paralyze: '麻痹',
        hex: '诅咒',
        evasive: '闪避',
        untargetable: '不可选中',
        protect: '护盾',
        counter: '反击',
        regeneration: '再生',
        berserk: '狂暴',
      },
    },
    score: {
      name: '多轮计分',
      desc: '多人加减分 · 逐轮历史 · 总分表',
      /** 完整记录里首列的列头，只给读屏用（视觉上是空白，轮次号自己会说明） */
      roundCol: '轮',
      /** 调分浮层里两个数字块的标签 */
      total: '合计',
      thisRound: '本轮',
      /** 卡片里最近三轮那几行的行首，窄得只放得下三四个字 */
      roundNo: '第{{n}}轮',
      noRounds: '还没有封档的轮次。',
      /**
       * 整张卡片是一个按钮，三个数字一起念出来。
       * 领先态另起一条完整字面量而不是拼接后缀 —— 拼接会丢掉类型校验，标点也做不到两种语言都对
       */
      seatCell: '{{name}}，合计 {{total}} 分，本轮 {{delta}} 分，点击调分或换人',
      seatCellLeader: '{{name}}，领先，合计 {{total}} 分，本轮 {{delta}} 分，点击调分或换人',
      /** 操作条只有 80px 宽，可见文字最多四个字，剩下的语义靠图标 */
      bar: {
        nextRound: '下一轮',
        undo: '撤销',
        history: '记录',
        settings: '更多操作',
      },
      history: {
        title: '完整记录',
        /** 提醒合计与主界面同源：矩阵里最上面那行还没封档，也已经算进合计了 */
        hint: '已封档 {{n}} 轮 · 合计含本轮',
      },
      settings: {
        title: '更多操作',
        addSeat: '加一个席位',
        /** 加过分才出现，走结算面板（[MatchFinish](../../match/MatchFinish.tsx)） */
        finish: '本局结算',
        newGame: '新一局（清空分数）',
        confirmNewGame: '确认清空历史',
        clearAll: '新开一局并清空所有人',
        confirmClearAll: '确认清空所有席位与分数',
      },
      sheet: {
        /** 名字那块实心色是按钮，点开席位面板 */
        editSeat: '{{name}}，点击改名或换人',
        /** 只有图标位，文字给读屏。同时传给席位面板的删除键 */
        remove: '移除这一列（含历史分数）',
        confirmRemove: '确认移除，分数一起删',
      },
    },

    scoreSheet: {
      name: '计分纸',
      desc: '固定条目逐项结算 · 游戏模板 · 自动合计',
      /** 矩阵首列的列头，视觉上是空的（下面每行自己写着条目名） */
      entryCol: '计分条目',
      total: '合计',
      /** 自定义条目的默认名。已存进 localStorage 的旧条目不会跟着语言变 */
      defaultEntry: '条目{{n}}',
      /** 「每个 N 分」的条目：格子里填数量，行首用这条标出来 */
      perUnit: '每个 {{n}} 分',
      /** 「每 N 个 M 分」的条目：零头不算（11 枚金币仍是 3 分） */
      perGroup: '每 {{every}} 个 {{score}} 分',
      /** 分段表条目的行首副标签。具体档位在行首浮层里，这里只标出「填的是数量」 */
      byTable: '按数量算分',
      /** 数量模式格子的角标：大字是得分，这里补一句填的是几个 */
      cellCount: '{{n}} 个',
      cell: '{{name}} 的{{entry}}：{{score}} 分，点击输入',
      cellCounted: '{{name}} 的{{entry}}：{{n}} 个 = {{score}} 分，点击输入',
      cellEmpty: '{{name}} 的{{entry}}：还没填，点击输入',
      editEntry: '{{name}}，点击看换算表或改输入方式',
      addEntry: '添加条目',
      /** 「更多」浮层里的加人按钮（原先是矩阵列头末尾的 ＋） */
      addSeat: '加人',
      /** 列头整块是按钮，点开席位面板 */
      editSeat: '{{name}}，点击改名、换人或移除这一列',
      /** 键盘底部的动作行，两个按钮各约 120px */
      bar: {
        template: '模板',
        more: '更多',
      },
      /** 移除键在共用的席位面板里，文案留在这儿：这个工具删的是各项分数 */
      seat: {
        remove: '移除这一列（含各项分数）',
        confirmRemove: '确认移除，分数一起删',
      },
      keypad: {
        /** 未选中时占着条目名那一行，**必须压在单行内** —— 折行会让下面的键区跟着漂 */
        idle: '点格子填分',
        /** 缓冲大数字的可见 label，按条目语义二选一 */
        count: '数量',
        score: '得分',
        /** 数量折成几分。挂在大数字右边而不另起一行，上下文块才能保持三行恒定 */
        derived: '= {{score}} 分',
        backspace: '退格',
        clear: '清空这一格',
        sign: '正负号',
        next: '下一条',
      },
      settings: {
        title: '计分模板',
        /** 搜索框的 placeholder 与 aria-label 共用一条 */
        search: '搜索游戏名',
        /** 搜索结果里可能没有选中项，当前模板要有个常驻锚点 */
        current: '当前：{{name}}',
        /** 每个模板右侧的条目数：这张表有多长，选之前就该知道 */
        entryCount: '{{n}} 项',
        noMatch: '没有匹配的模板。',
      },
      /** 更多操作浮层（[SheetMore](../../../tools/score-sheet/SheetMore.tsx)）：一局的收尾出口 */
      more: {
        title: '更多操作',
        /** 加人与清空所有人那一组的标签 */
        seats: '席位',
        /** 连人带分全清，回到开局入座 */
        clearSeats: '清空所有人',
        confirmClearSeats: '确认清空所有人',
        /** 分享与历史那一组的标签 */
        output: '本局',
        /** 排版与外观在分享面板里选（[MatchShare](../../match/MatchShare.tsx)），这里只是入口 */
        share: '分享本局',
        history: '历史记录',
        /** 填齐了才出现，走结算面板（[MatchFinish](../../match/MatchFinish.tsx)） */
        finish: '本局结算',
        newGame: '新一局（清空所有分数）',
        confirmNewGame: '确认清空分数',
      },
      /** 历史浮层（[SheetHistory](../../../tools/score-sheet/SheetHistory.tsx)）：列表 + 单局详情 */
      history: {
        title: '历史记录',
        /** IndexedDB 被禁（隐私模式等）时只关掉这一块，其余功能照用 */
        unavailable: '这台设备不能保存本地存档，可能开着隐私模式。其余功能不受影响。',
        empty: '还没有存档。',
        /** 列表只渲染最近 50 条，更早的按需展开 */
        more: '显示更早的',
        back: '返回列表',
        load: '读取这一局',
        confirmLoad: '确认读取，覆盖当前局',
        remove: '删除这一局',
        confirmRemove: '确认删除这一局',
        clear: '清空历史',
        confirmClear: '确认清空全部历史',
      },
      /**
       * 计分纸自己的导出形态（[match.ts](../../../tools/score-sheet/match.ts)）。
       * 面板与按钮文案在 `match.share.*` —— 那一层是所有工具共用的
       */
      image: {
        /** 画在图片页脚：图会脱离应用流传，得留一句它是什么出的 */
        brand: 'BGTools 计分纸',
        forms: {
          matrix: '标准',
          transposed: '转置',
        },
      },
      /** 行首浮层（[EntryPanel](../../../tools/score-sheet/EntryPanel.tsx)）：换算表 + 输入方式 */
      entry: {
        name: '条目名',
        namePlaceholder: '例如：田地',
        scoring: '这一条怎么算分',
        /** 换算方式由模板定死，所以这里只有两个选项：填数量 or 填总分 */
        modeDirect: '直接填得分',
        /** 模板条目：怎么折算是模板的事，不必在按钮上重复 */
        modeCounted: '填数量 · 模板自动折算',
        /** 自定义条目：没有模板规则，N 由用户在下面的 Stepper 里定 */
        modePerUnit: '填数量 · 每个 N 分',
        confirmSwitch: '确认切换，这一行清空',
        per: '每个几分',
        /** 分段表和「每个 N 分」共用这个标题 —— 两者互斥，一条只会出一种 */
        ruleTitle: '换算规则（模板自带，不可改）',
        /** 一档一行，由 [Step](../../../tools/score-sheet/templates.ts) 的下界推出区间 */
        tableRowOne: '{{from}} 个 → {{score}} 分',
        tableRowRange: '{{from}}–{{to}} 个 → {{score}} 分',
        tableRowUp: '{{from}} 个及以上 → {{score}} 分',
        remove: '删除这个条目',
        confirmRemove: '确认删除，这一行的分数一起删',
      },
      /**
       * **只剩空白表这一条** —— 其余模板的名字与别名都搬去了 `games.*`
       * （[shared/games](../../games/registry.ts)），模板只存 `gameId` 指回去。
       * 空白表不是一盒游戏，所以它的名字仍归模板自己
       */
      templates: {
        custom: '通用空白',
      },
      /**
       * 《农场主》局末计分表。**只剩条目名** —— 换算表已经是
       * [templates.ts](../../../tools/score-sheet/templates.ts) 里的 `steps` 数据，
       * 由程序算分并在行首浮层里逐档展开。早先那串 `0–1 = −1 · 2 = 1 · …` 是文案，
       * 等于把查表这件事推回给玩家，本就不该存在
       */
      agricola: {
        fields: '田地',
        pastures: '牧场',
        grain: '谷物',
        veg: '蔬菜',
        sheep: '羊',
        boar: '野猪',
        cattle: '牛',
        unused: '未使用空地',
        stables: '围栏牲口棚',
        clayRooms: '黏土屋房间',
        stoneRooms: '石屋房间',
        family: '家庭成员',
        begging: '乞讨卡',
        cards: '卡牌分',
        bonus: '额外分',
      },
      /**
       * 其余各款同理：**只写条目名**，怎么折算全在
       * [templates.ts](../../../tools/score-sheet/templates.ts) 的数据里。
       * 行首列只有 112–128px，名字压在 6 字内，超了会被 truncate 掉
       */
      catan: {
        settlements: '定居点',
        cities: '城市',
        /** 一次性 2 分，不按数量算，所以名字里带上分值 */
        longestRoad: '最长道路 2',
        largestArmy: '最大骑士团 2',
        vpCards: '胜利点卡',
        bonus: '额外分',
      },
      splendor: {
        cards: '发展卡分',
        nobles: '贵族',
      },
      azul: {
        board: '面板得分',
        rows: '完整横排',
        cols: '完整竖列',
        colors: '同色五块',
      },
      ticketToRide: {
        routes: '路线得分',
        tickets: '完成车票',
        /** 填的是**面值总和**而非张数（每张扣的分不一样），配 perUnit −1 */
        failed: '未完成面值',
        longest: '最长路线',
        stations: '未用车站',
      },
      carcassonne: {
        track: '计分轨',
        /** 数「板块 + 纹章」，每个 1 分 */
        city: '未完成城市',
        road: '未完成道路',
        /** 数「修道院 + 周围板块」 */
        cloister: '未完成修道院',
        farmers: '农夫',
        bonus: '额外分',
      },
      wingspan: {
        birds: '鸟类分',
        bonus: '奖励卡',
        goals: '回合目标',
        eggs: '蛋',
        food: '卡上食物',
        tucked: '巢中卡牌',
      },
      patchwork: {
        buttons: '纽扣',
        empty: '空格',
        special: '7×7 板块',
      },
      everdell: {
        cards: '卡牌分',
        prosperity: '繁荣加成',
        events: '事件',
        journey: '旅程',
        tokens: '点数令牌',
      },
      sevenWonders: {
        military: '军事冲突',
        /** 零头不算，所以走 perGroup 而不是 perUnit */
        coins: '金币',
        wonders: '奇迹',
        civilian: '蓝色民用',
        commerce: '黄色商业',
        guilds: '紫色公会',
        /** 三种符号各自 n 个得 n²，所以拆成三行 */
        gears: '齿轮',
        tablets: '石板',
        compasses: '罗盘',
        sets: '科技全套',
      },
      arnak: {
        /** 两个标记各停一格、各印一个分值，所以是两行 */
        magnifier: '放大镜',
        notebook: '笔记本',
        temple: '神庙板块',
        idols: '神像',
        guardians: '击败守卫',
        cards: '卡牌分',
        fear: '恐惧卡',
      },
      cascadia: {
        bear: '熊',
        elk: '麋鹿',
        salmon: '鲑鱼',
        hawk: '鹰',
        fox: '狐狸',
        /** 以下五行填「最大走廊格数 + 多数奖励」的合计 */
        mountain: '山地',
        forest: '森林',
        prairie: '草原',
        wetland: '湿地',
        river: '河流',
        nature: '自然徽章',
      },
      terraformingMars: {
        tr: '类地指数',
        milestones: '里程碑',
        awards: '奖励',
        greenery: '绿地板块',
        /** 填的是城市旁的绿地数，不是城市数 */
        cities: '城市邻接',
        cards: '卡牌分',
      },
      terraMystica: {
        track: '计分轨',
        network: '最大连通区',
        fire: '火教派',
        water: '水教派',
        earth: '土教派',
        air: '风教派',
        coins: '剩余金币',
      },
      greatWesternTrail: {
        money: '金钱',
        buildings: '建筑',
        cities: '城市徽章',
        stations: '火车站',
        hazards: '灾害板块',
        cattle: '牛卡',
        objectives: '目标卡',
        stationMaster: '站长牌',
        /** 只数站在计分格上的工人 */
        workers: '工人',
        bonus: '额外分',
      },
      castlesOfBurgundy: {
        track: '计分轨',
        knowledge: '知识板块',
        goods: '未售货物',
        silver: '剩余银币',
        workers: '工人板块',
        bonus: '额外分',
      },
      clank: {
        artifacts: '神器',
        crowns: '皇冠',
        secrets: '秘密标记',
        monkey: '猴子偶像',
        gold: '金币',
        cards: '卡牌分',
        mastery: '精通标记',
      },
    },
    touchPick: {
      name: '手指抽选',
      desc: '多指按屏 · 选一人 · 排序 · 分组',
      /** 窄条按钮只放得下三个字 */
      mode: {
        one: '选一个',
        order: '排序',
        group: '分组',
      },
      /** 组数按钮：大数字在上，这个词在下 */
      groupsUnit: '组',
      groupsAria: '组数：{{n}}，点击切换',
      hint: {
        idle: '所有人一起把手指按在这里',
        more: '至少要两根手指',
        arming: '按住别动…',
        /** 结果还在，但手都抬起来了 */
        again: '再按一次重来',
        one: '选中了',
        order: '顺序已定',
        group: '已分 {{n}} 组',
      },
      /**
       * 只给读屏：触点是匿名的手指，报不出人名，只能报"几个触点里选了谁"这一层。
       * 组数用 {{g}} 而不是复用 {{n}}，两个数字同时出现在分组那条里
       */
      a11y: {
        one: '{{n}} 个触点中随机选中 1 个',
        order: '{{n}} 个触点已随机排序',
        group: '{{n}} 个触点已随机分成 {{g}} 组',
      },
    },

    /** 战绩统计（[tools/stats](../../../tools/stats/StatsPage.tsx)），只读 match 存档 */
    stats: {
      name: '战绩统计',
      desc: '按玩家 / 按游戏看历史对局',
      view: {
        players: '按玩家',
        games: '按游戏',
        time: '按时间',
      },
      overview: '总览',
      totalGames: '记录局数',
      totalTime: '累计时长',
      gameKinds: '玩过的游戏',
      /** 滚动窗口，不按自然周/月（见 aggregate.ts 的 Overview） */
      recent7: '近 7 天',
      recent30: '近 30 天',
      /** 局数最多的一盒游戏 */
      topGame: '最常玩',
      /** 局数最多的名单玩家 */
      topPlayer: '最活跃',
      unavailable: '这台设备不能读本地存档，可能开着隐私模式。其余功能不受影响。',
      empty: '还没有记录。',
      /** 有记录但一个都没绑名单玩家 */
      playerEmpty: '记录里都是临时席位。去顶栏 👥 把人加进名单，之后的对局才能算进个人战绩。',
      gameCount: '{{n}} 局',
      winCount: '{{n}} 胜',
      rate: '胜率 {{n}}%',
      /** 均分只在同一盒游戏内平均，跨游戏不是一个量纲 */
      avg: '均分 {{score}}',
      avgTime: '均 {{time}}',
      openPlayer: '展开或收起 {{name}} 的分游戏战绩',
      noWinner: '还没有胜负记录',
      /** 「按时间」只渲染最近 50 条，更早的按需展开 */
      more: '显示更早的',
    },

    yahtzee: {
      name: '快艇骰子',
      desc: '5 颗骰 · 锁定重掷',
    },
  },
} as const
