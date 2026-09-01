import type { Resources } from '../types'

/**
 * English。类型受 [zh.ts](zh.ts) 约束：缺 key / 多 key / 拼错都在 `tsc` 阶段报错。
 *
 * 措辞刻意压短 —— 运行场景是平板横屏，英文普遍比中文宽 1.5–2 倍，
 * 按钮和 `line-clamp-2` 的道具描述都是按中文长度调过的。
 * 装备卡名按实物卡直译，与官方英文版卡名可能有出入。
 */
export const en: Resources = {
  app: {
    title: 'Board Game Tools',
  },

  common: {
    confirm: 'Confirm?',
    confirmShort: 'Confirm',
    confirmDelete: 'Delete?',
    cancel: 'Cancel',
    close: 'Close',
    reset: 'Reset',
    delete: 'Delete',
    clear: 'Clear',
    total: 'Total',
    count: 'Count',
  },

  header: {
    back: 'Back to home',
    enterFullscreen: 'Enter fullscreen',
    exitFullscreen: 'Exit fullscreen',
    show: 'Show header',
    hint: 'Header auto-hides · tap the top of the screen',
  },

  notFound: {
    text: 'No such tool',
    home: 'Back to home',
  },

  stepper: {
    decrease: 'Decrease',
    increase: 'Increase',
  },

  dice: {
    type: 'Die type',
    roll: 'Roll {{n}}d{{sides}}',
    rolling: 'Rolling…',
  },

  players: {
    defaultName: 'Player {{n}}',
    /** 色板格子只有 ≈78px 宽，色名一律用单词，不写 "Light green" 这类词组 */
    colors: {
      red: 'Red',
      orange: 'Orange',
      yellow: 'Yellow',
      lime: 'Lime',
      green: 'Green',
      teal: 'Teal',
      cyan: 'Cyan',
      blue: 'Blue',
      indigo: 'Indigo',
      violet: 'Violet',
      fuchsia: 'Magenta',
      pink: 'Pink',
      brown: 'Brown',
      white: 'White',
      gray: 'Gray',
      black: 'Black',
    },
    select: {
      empty: 'Roster is empty. Add players once and every tool can use them.',
      manage: 'Manage players',
    },
  },

  quick: {
    dice: {
      name: 'Quick dice',
      hint: 'Tap Roll to get a number',
    },
    timer: {
      name: 'Timer',
      quickStart: 'Quick start',
      custom: 'Custom ({{step}}s steps)',
      start: 'Start {{time}}',
      pause: 'Pause',
      resume: 'Resume',
      running: 'Running',
      paused: 'Paused',
      idle: 'Idle',
      alarm: {
        title: "Time's up",
        again: 'Again {{time}}',
        dismiss: 'Got it',
        tapToClose: 'Tap anywhere to close',
      },
    },
    pointer: {
      name: 'Spinner',
      spinning: 'Spinning…',
      oclock: "≈ {{hour}} o'clock",
      hint: 'Tap the needle or the button',
      spin: 'Spin',
    },
    players: {
      name: 'Players',
      roster: 'Players',
      emptyList: 'Roster is empty — tap Add above.',
      // 与「已添加玩家」标签同排，左栏窄的时候放不进 "Add player"
      add: 'Add',
      nameInput: 'Player name',
      colorLabel: 'Preferred color',
      colorTaken: '{{color}}, also used by {{who}}',
      emptyHint: 'Add a player to rename and pick a color',
      pickHint: 'Tap a player on the left to edit',
    },
    settings: {
      name: 'Settings',
      language: 'Language',
    },
  },

  tools: {
    dice: {
      name: 'Dice',
      desc: 'd4–d100, roll several at once, with history',
      history: 'History',
      hint: 'Tap the button on the left to roll',
    },
    bombBusters: {
      name: 'Bomb Busters',
      desc: 'Defuse progress · gear dealing · lives',
      lives: {
        dead: '💥 Detonated',
        critical: '⚠️ Last point',
        low: '⚡ Two points left',
        ok: 'Lives left',
        minus: 'Lose one life',
        plus: 'Gain one life',
      },
      wires: {
        title: 'Defuse status',
        cell: 'Number {{n}}: {{state}}',
        state: {
          intact: 'not cut',
          half: 'half cut',
          done: 'fully cut',
        },
        legend: {
          intact: 'Intact',
          half: 'Half',
          done: 'Cut',
        },
      },
      equip: {
        title: 'Gear cards · tap to change state',
        card: '{{no}} {{name}}: {{state}}',
        unknown: 'Unknown gear',
        stale: 'Hand changed — redeal the gear',
        state: {
          locked: 'Locked',
          ready: 'Ready',
          used: 'Used',
        },
        e1: { name: '≠ Marker', desc: 'Place a ≠ token between two adjacent wires of different numbers' },
        e2: { name: 'Walkie-talkie', desc: 'Swap one uncut wire with another player' },
        e3: { name: 'Triple Detector', desc: "Detect 3 chosen wires on a teammate's stand" },
        e4: { name: 'Sticky Note', desc: 'Put a DANGER token in front of one of your blue wires' },
        e5: { name: 'Super Detector', desc: "Detect every wire on a teammate's whole stand" },
        e6: { name: 'Inhibitor', desc: 'Move the detonator dial back one notch' },
        e7: { name: 'Spare Battery', desc: 'Flip 1–2 used character ability cards back over' },
        e8: { name: 'Universal Radar', desc: 'Call a number; everyone holding that blue wire must say so' },
        e9: { name: 'Stabilizer', desc: "This turn the dial stays put and red wires don't explode" },
        e10: { name: 'X/Y Ray', desc: 'Call two numbers at once when targeting a single wire' },
        e11: { name: 'Coffee Bottle', desc: 'Skip this turn and choose who acts next' },
        e12: { name: '= Marker', desc: 'Place an = token before two of your adjacent wires of the same number' },
      },
      settings: {
        open: 'Settings: players, redeal gear, new game',
        title: 'Settings',
        players: 'Players (sets starting lives and gear count)',
        playerCount: '{{n}} players',
        warn: 'Switching to {{n}} players starts a new game: lives reset to {{n}}, gear redealt, defuse progress cleared',
        board: 'Game',
        deal: 'Redeal gear',
        newGame: 'New game',
      },
    },
    score: {
      name: 'Scoreboard',
      desc: 'Add and subtract · round history · totals',
      empty:
        'Tap Seat at the top of the action bar to set up players. To use someone from the roster, open their card and tap the ✏️.',
      // 首列的列头只给读屏用，长度不受列宽限制
      roundCol: 'Round',
      total: 'Total',
      thisRound: 'Now',
      // 卡片里的行首，"Round 3" 会撑破，缩成 R3
      roundNo: 'R{{n}}',
      noRounds: 'No archived rounds yet. Tap Next round and this one lands here as a row.',
      seatCell: '{{name}}, total {{total}}, {{delta}} this round, tap to score or swap',
      seatCellLeader:
        '{{name}}, leading, total {{total}}, {{delta}} this round, tap to score or swap',
      // 操作条只有 80px 宽，"Add seat" / "Next round" 都会折行，各缩成一个词
      bar: {
        addSeat: 'Seat',
        nextRound: 'Next',
        undo: 'Undo',
        history: 'Log',
        settings: 'Game',
      },
      history: {
        title: 'Full log',
        hint: '{{n}} rounds archived · totals include this round',
      },
      settings: {
        title: 'Game',
        newGame: 'New game (clear scores)',
        confirmNewGame: 'Clear history?',
      },
      sheet: {
        editSeat: 'Swap player or remove column',
      },
      pick: {
        title: 'Who is this column?',
        current: 'Now: {{name}}',
        available: 'Roster players not seated yet',
        emptyRoster: 'Roster is empty. Add players in 👥 above and every tool can use them.',
        allSeated: 'Everyone on the roster is already seated.',
        unlink: 'Unlink, back to temp seat',
        manage: 'Manage roster (rename · recolor · add)',
        remove: 'Remove this column (and its scores)',
        confirmRemove: 'Remove with scores?',
      },
    },
  },
}
