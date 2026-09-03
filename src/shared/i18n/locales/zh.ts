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
    noMatch: '没有匹配的游戏。换个语言或试试别名。',
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
      hint: '点「投掷」出数',
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
      empty: '名单是空的。先添加玩家，之后每个工具都能直接用。',
      manage: '管理玩家',
    },
    /** 计分工具的开局选人空态（[SeatStart](../../players/SeatStart.tsx)），两个计分工具共用 */
    seatStart: {
      label: '这局谁在玩',
      start: '就坐（{{n}} 人）',
      temp: '加一个临时席位',
    },
    /**
     * 席位面板（[SeatPicker](../../players/SeatPicker.tsx)），多轮计分与计分纸共用。
     * 「移除这一列」的按钮在这里，但**文案留在各自的 `tools.*` 下**并由工具传进来 ——
     * 各工具删掉的东西不一样（一边连历史轮次，一边连各项分数）
     */
    seat: {
      nameInput: '改这一列的名字',
      roster: '名单里的人',
      emptyRoster: '名单是空的，点「管理名单」加人，之后每个工具都能直接用。',
      /** 已经是这一列的人：格子上另有 ✓ 与描边，这条只给读屏 */
      current: '{{name}}，当前就是这一列',
      seated: '{{name}}，已在别的列入座',
      unlink: '解除关联，改回临时席位',
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
    /** 临时席位没绑名单玩家，进不了个人战绩 —— 得先说清楚再让人存 */
    tempHint: '临时席位不计入个人战绩，去顶栏 👥 把人加进名单可以长期统计',
    save: '记录并开新局',
    discard: '不记录，直接开新局',
    confirmDiscard: '确认丢弃本局',
    unavailable: '这台设备禁用了本地数据库，本局记不下来，但可以直接开新局',
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
      hint: '点「投掷」出数',
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
        tapToClose: '点任意处关闭',
      },
    },
    pointer: {
      name: '随机指针',
      desc: '随机指一个方向',
      spinning: '旋转中…',
      oclock: '≈ {{hour}} 点方向',
      hint: '点指针或按钮开始',
      spin: '随机指向',
    },
    /** 随机点人。候选只能是当前这一局的席位，所以入口只在工具页里有人时才出现 */
    pick: {
      name: '随机点人',
      desc: '从这局的人里抽一个',
      candidates: '这局的人',
      hint: '点「抽一个」出人',
      spinning: '抽…',
      result: '就是这位',
      spin: '抽一个',
      again: '再抽一个',
      /** 浮层开着时切回首页会走到这里 */
      empty: '这局还没有人。在计分工具里选好参与者，就能从他们里面抽了。',
    },
    players: {
      name: '玩家名单',
      desc: '桌上是谁 · 名字与颜色',
      roster: '已添加玩家',
      emptyList: '名单是空的，点上方「添加玩家」。',
      add: '添加玩家',
      nameInput: '玩家名字',
      colorLabel: '偏好颜色',
      colorTaken: '{{color}}，{{who}} 也在用',
      emptyHint: '添加玩家后在这里改名、选颜色',
      pickHint: '点左侧玩家开始编辑',
    },
    settings: {
      name: '设置',
      desc: '界面语言',
      language: '语言',
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
    noSpeech: '这台设备不支持语音播报，流程改为屏幕显示',
    /** 每种步骤是什么。也当读屏文本用（流程预览里那排图标的 aria-label） */
    kind: {
      say: '播报',
      wait: '等待',
      confirm: '等你确认',
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
    emptyPool: '还没放身份。点上面的身份加一张，或选一档常见板子。',
    addRole: '加入 {{name}}',
    removeRole: '移除一张 {{name}}',
    start: '开始发 {{n}} 张',
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
  },

  tools: {
    werewolf: {
      name: '狼人杀主持',
      desc: '语音主持一整夜 · 顺手发身份',
      flow: '标准夜晚流程',
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
    score: {
      name: '多轮计分',
      desc: '多人加减分 · 逐轮历史 · 总分表',
      empty: '选出这局在玩的人就能开始。名单里没有的人加个临时席位，开局后还能用操作条的「加人」继续加。',
      /** 完整记录里首列的列头，只给读屏用（视觉上是空白，轮次号自己会说明） */
      roundCol: '轮',
      /** 调分浮层里两个数字块的标签 */
      total: '合计',
      thisRound: '本轮',
      /** 卡片里最近三轮那几行的行首，窄得只放得下三四个字 */
      roundNo: '第{{n}}轮',
      noRounds: '还没有封档的轮次。这一轮记完点「下一轮」，就会在这里落一行。',
      /**
       * 整张卡片是一个按钮，三个数字一起念出来。
       * 领先态另起一条完整字面量而不是拼接后缀 —— 拼接会丢掉类型校验，标点也做不到两种语言都对
       */
      seatCell: '{{name}}，合计 {{total}} 分，本轮 {{delta}} 分，点击调分或换人',
      seatCellLeader: '{{name}}，领先，合计 {{total}} 分，本轮 {{delta}} 分，点击调分或换人',
      /** 操作条只有 80px 宽，可见文字最多三个字，剩下的语义靠图标 */
      bar: {
        addSeat: '加人',
        nextRound: '下一轮',
        undo: '撤销',
        history: '记录',
        settings: '局面',
      },
      history: {
        title: '完整记录',
        /** 提醒合计与主界面同源：矩阵里最上面那行还没封档，也已经算进合计了 */
        hint: '已封档 {{n}} 轮 · 合计含本轮',
      },
      settings: {
        title: '局面',
        /** 加过分才出现，走结算面板（[MatchFinish](../../match/MatchFinish.tsx)） */
        finish: '本局结算',
        newGame: '新一局（清空分数）',
        confirmNewGame: '确认清空历史',
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
      empty: '选出这局在玩的人就能开始。名单里没有的人加个临时席位，开局后还能用表格右上角的「＋」继续加。',
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
      /** 列头行末尾那个 ＋ 的 aria-label */
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
        idle: '点击单元格填写得分',
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
        noMatch: '没有匹配的模板。中英文名、常用别名都能搜。',
        /** 打消「切模板会不会把分数弄丢」的顾虑，省掉一次二次确认 */
        keepHint: '切换模板不清分数：切走的条目只是先收起来，切回来还在。',
      },
      /** 更多操作浮层（[SheetMore](../../../tools/score-sheet/SheetMore.tsx)）：一局的收尾出口 */
      more: {
        title: '更多操作',
        /** 导出分组的标签。按钮文案只留一个词 —— 英文比中文宽近两倍，写全句会撑破 */
        export: '本局导出',
        exportImage: '图片',
        exportCsv: 'CSV',
        history: '历史记录',
        /** 说明记录是怎么进去的，也说明为什么这里有时是「结算」有时是「清空」 */
        archiveHint: '每人都填过分之后，出口会变成「本局结算」：记下参与者与名次，再开新局。',
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
        empty: '还没有存档。一局填完后按「本局结算」，记录就会存到这里。',
        /** 列表只渲染最近 50 条，更早的按需展开 */
        more: '显示更早的',
        /** 一行一局，整块是按钮 */
        open: '{{date}} · {{name}}，点击查看这一局',
        back: '返回列表',
        load: '读取这一局',
        confirmLoad: '确认读取，覆盖当前局',
        remove: '删除这一局',
        confirmRemove: '确认删除这一局',
        clear: '清空历史',
        confirmClear: '确认清空全部历史',
      },
      /** 全屏图片层（[SheetImage](../../../tools/score-sheet/SheetImage.tsx)） */
      image: {
        title: '导出图片',
        hint: '长按或右键图片可保存、分享。',
        save: '保存',
        share: '分享',
        /** 画在图片页脚：图会脱离应用流传，得留一句它是什么出的 */
        brand: 'BGTools 计分纸',
        /** 换排版时新图还没画完那一小会儿 */
        rendering: '正在生成…',
        /** 外观：只换配色，不影响画哪些数 */
        skin: '外观',
        prevSkin: '上一种外观',
        nextSkin: '下一种外观',
        skins: {
          dark: '深色',
          print: '印刷',
        },
        /** 内容形式：决定画哪些数、怎么摆 */
        form: '内容',
        forms: {
          /** 用「×」而不是「乘」：它读作「谁当行、谁当列」，两个词都得出现才分得清转置 */
          matrix: '条目×人',
          transposed: '人×条目',
          rank: '战绩榜',
        },
      },
      /** 行首浮层（[EntryPanel](../../../tools/score-sheet/EntryPanel.tsx)）：换算表 + 输入方式 */
      entry: {
        name: '条目名',
        namePlaceholder: '例如：田地',
        scoring: '这一条怎么算分',
        /** 换算方式由模板定死，所以这里只有两个选项：填数量 or 填总分 */
        switchHint: '换一种填法会清空这一行已填的数。',
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
      },
      overview: '总览',
      totalGames: '记录局数',
      totalTime: '累计时长',
      gameKinds: '玩过的游戏',
      /** 旧版计分纸的存档没有胜负与分数，进不了统计，得说清为什么这里的局数少 */
      legacyHint: '另有 {{n}} 条旧版计分纸记录没有胜负与分数，只出现在计分纸自己的历史里。',
      unavailable: '这台设备不能读本地存档，可能开着隐私模式。其余功能不受影响。',
      empty: '还没有记录。在计分工具里打完一局，按「本局结算」存下来就会出现在这里。',
      /** 有记录但一个都没绑名单玩家 */
      playerEmpty: '记录里都是临时席位。去顶栏 👥 把人加进名单，之后的对局才能算进个人战绩。',
      gameCount: '{{n}} 局',
      winCount: '{{n}} 胜',
      rate: '胜率 {{n}}%',
      /** 均分只在同一盒游戏内平均，跨游戏不是一个量纲 */
      avg: '均分 {{score}}',
      avgTime: '均 {{time}}',
      openPlayer: '查看 {{name}} 的战绩',
      noWinner: '还没有胜负记录',
      byGame: '按游戏拆分',
    },

    yahtzee: {
      name: '快艇骰子',
      desc: '5 颗骰 · 锁定重掷',
    },
  },
} as const
