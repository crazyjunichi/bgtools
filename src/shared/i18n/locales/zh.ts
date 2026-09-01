/**
 * 简体中文 —— 文案真源。key 的形状由这份文件定义，[en.ts](en.ts) 必须与它同构
 * （类型 `Resources` 会强制这一点，缺 key / 多 key 都在 `tsc` 阶段报错）。
 *
 * 分层与目录对齐：`common` 跨处复用 · `dice` 两个骰子共用的术语 ·
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
    reset: '重置',
    delete: '删除',
    clear: '清空',
    total: '总和',
    count: '数量',
  },

  header: {
    back: '返回首页',
    enterFullscreen: '进入全屏',
    exitFullscreen: '退出全屏',
    show: '显示顶栏',
    hint: '顶栏会自动隐藏 · 轻点屏幕顶部可唤出',
  },

  notFound: {
    text: '没有这个工具',
    home: '回首页',
  },

  stepper: {
    decrease: '减少',
    increase: '增加',
  },

  /** 骰子工具页与顶栏快捷骰子共用 */
  dice: {
    type: '骰型',
    roll: '投掷 {{n}}d{{sides}}',
    rolling: '投掷中…',
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
  },

  quick: {
    dice: {
      name: '快速骰子',
      hint: '点「投掷」出数',
    },
    timer: {
      name: '计时器',
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
      spinning: '旋转中…',
      oclock: '≈ {{hour}} 点方向',
      hint: '点指针或按钮开始',
      spin: '随机指向',
    },
    players: {
      name: '玩家名单',
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
      language: '语言',
    },
  },

  tools: {
    dice: {
      name: '骰子',
      desc: 'd4 ~ d100 多骰同投，带历史记录',
      history: '历史记录',
      hint: '点左侧按钮开始投掷',
    },
    bombBusters: {
      name: '炸弹克星',
      desc: '拆弹进度 · 道具发放 · 生命追踪',
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
        title: '道具牌 · 点击切换状态',
        card: '{{no}} 号 {{name}}：{{state}}',
        unknown: '未知道具',
        stale: '清单已更新，请重发道具',
        state: {
          locked: '未激活',
          ready: '可用',
          used: '已用',
        },
        /**
         * 装备卡 1–12。desc 只写核心动作 —— 道具栏窄且 line-clamp-2，
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
      settings: {
        open: '设置：人数、重发道具、新一局',
        title: '设置',
        players: '人数（决定初始生命与道具数）',
        /** 人数下限是 2，英文永远是复数，不需要 i18next 的复数变体 */
        playerCount: '{{n}}人',
        warn: '切到 {{n}} 人将重开一局：生命重置为 {{n}}、道具重发、拆弹进度清空',
        board: '局面',
        deal: '重发道具',
        newGame: '新一局',
      },
    },
    score: {
      name: '计分板',
      desc: '多人加减分 · 逐轮历史 · 总分表',
      empty: '先点操作条最上面的「加人」摆开席位。要换成名单里的人，点开那张卡片里的 ✏️。',
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
        newGame: '新一局（清空分数）',
        confirmNewGame: '确认清空历史',
      },
      sheet: {
        /** 大数字本身就是输入框，「本轮」二字是它的可见 label */
        editSeat: '换人或移除这一列',
      },
      pick: {
        title: '这一列是谁',
        current: '当前：{{name}}',
        available: '名单里还没入座的人',
        emptyRoster: '名单是空的。到顶栏 👥 添加，之后每个工具都能直接用。',
        allSeated: '名单里的人都已经入座了。',
        unlink: '解除关联，改回临时席位',
        manage: '管理名单（改名 · 换色 · 加人）',
        remove: '移除这一列（含历史分数）',
        confirmRemove: '确认移除，分数一起删',
      },
    },
  },
} as const
