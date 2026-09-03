import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { createDie, type DieRender } from './Die3D'

/** 相邻骰子中心距：外接球直径 2 + 间隙 */
const SPACING = 2.35
/** 单颗骰子需要的视野格：直径 2 + 上下留白 */
const CELL = 2.5
const SPIN_MS = 620
/**
 * 转多少圈。**必须带非整数的零头**：旋转量按 (1-eased) 衰减，起手旋转量就是这个总角度，
 * 而整数圈的四元数等于单位四元数 —— 那会让第 0 帧的姿态恰好等于落点，
 * 结果在开转前就露给玩家看了。零头锁在 0.3~0.7 圈（不许跨过整圈），保证起手至少偏 108°
 */
const SPIN_TURNS_MIN = 2.3
const SPIN_TURNS_MAX = 2.7
/** 逐颗错开起转，同步转看着像整张图在动 */
const STAGGER_MS = 70
/** 点击命中半径（世界单位）。骰子外接球半径 1，放宽一点手指才好点，但不到相邻骰子那儿 */
const HIT_RADIUS = 1.15

/** 画一颗骰子要的全部信息。外观由 [Die3D](Die3D.ts) 认，这里只管摆位与动画 */
export type RenderDie = {
  /** 骰子实例的稳定 key —— 跨投掷认出「还是那一颗」靠它 */
  key: string
  render: DieRender
  /** 面号 1..N */
  face: number
  locked: boolean
  /**
   * 投掷序号。**变了才起转**：锁定的骰子这个值原样留着，重掷时画面里纹丝不动。
   * 不用数组身份判断「又掷了一次」—— 一次重掷里有的骰子该转有的不该转
   */
  spin: number
}

type Slot = {
  key: string
  group: THREE.Group
  /** 本次投掷的旋转轴 */
  axis: THREE.Vector3
  /** 本次投掷的总旋转量（弧度），随缓动衰减到 0 */
  sweep: number
  /** 落点姿态 */
  pose: THREE.Quaternion
  /** 起转时刻 */
  start: number
  /** 世界位置，点击命中用；由 fit 重排（列数跟容器长宽比走） */
  x: number
  y: number
}

type Stage = {
  scene: THREE.Scene
  /** 重算列数、视野与摆位（骰子数量或容器尺寸变了都要调），顺带请求一帧 */
  fit: () => void
  /** 屏幕坐标 → 命中的骰子 key。fit 之后才有效 */
  pick: (clientX: number, clientY: number) => string | null
}

type Props = {
  dice: readonly RenderDie[]
  /**
   * 点某颗骰子。这一层是**装饰性增强**：canvas 是 aria-hidden 的，
   * 可访问的等价入口必须由调用方在别处给（结果芯片）
   */
  onPick?: (key: string) => void
  className?: string
}

/**
 * 结果的 3D 表现层。**只表现，不决定**：面号由 store 的 crypto 随机给出，
 * 这里把对应骰面转到镜头前，旋转幅度随缓动衰减到 0，落点必然精确等于该面。
 *
 * 装饰性质，所以 aria-hidden —— 真正的读数是调用方那排芯片，
 * 也因此没有 WebGL 时整块不渲染，出数与锁定都不受影响。
 */
export function DiceCanvas({ dice, onPick, className }: Props) {
  const hostRef = useRef<HTMLDivElement>(null)
  const stageRef = useRef<Stage | null>(null)
  const slotsRef = useRef<Slot[]>([])
  /** 上一帧每颗骰子的投掷序号，用来判断这一颗这次到底转不转 */
  const spinsRef = useRef(new Map<string, number>())

  // 渲染器只建一次：WebGL 上下文很贵，而且浏览器同时能活的上下文数量有上限，
  // 每次投掷重建迟早会把老上下文挤掉
  useEffect(() => {
    const host = hostRef.current
    if (!host) return

    // 探测通过也仍可能建不出来（同时存活的上下文数量上限、显存不足），
    // 而这层是装饰：构造抛错不许冒到路由把整页换成报错界面
    let renderer: THREE.WebGLRenderer
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    } catch {
      return
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    const canvas = renderer.domElement
    // 必须脱离文档流：canvas 的固有尺寸 = drawing buffer 像素数，而 setSize 按 DPR
    // 放大它。留在流内会让这个（DPR 倍的）高度参与父级 flex 的内容高度计算 →
    // 容器变高 → ResizeObserver 再放大 buffer，正反馈一路把面板撑到顶。
    // DPR=1 的桌面刚好是不动点，所以只在手机上暴露
    canvas.style.position = 'absolute'
    canvas.style.inset = '0'
    canvas.style.width = '100%'
    canvas.style.height = '100%'
    host.appendChild(canvas)

    const scene = new THREE.Scene()
    // 正交投影：骰子在画面各处大小一致，也不会再被透视变形啃一口可读性
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 100)
    camera.position.z = 10

    // 环境光托住暗面不发黑，主光从右上拉开棱面明暗差，补光避免左下侧面死黑
    const key = new THREE.DirectionalLight(0xffffff, 2.6)
    key.position.set(2.5, 4, 5)
    const fill = new THREE.DirectionalLight(0xffffff, 0.9)
    fill.position.set(-3, -1.5, 2)
    scene.add(new THREE.AmbientLight(0xffffff, 1.6), key, fill)

    // 动画结束就停 rAF：界面常开着放在桌上，空转一整晚纯烧电
    let raf = 0
    const spin = new THREE.Quaternion()
    const frame = () => {
      raf = 0
      const now = performance.now()
      let animating = false
      for (const slot of slotsRef.current) {
        const t = (now - slot.start) / SPIN_MS
        const eased = t >= 1 ? 1 : easeOut(Math.max(t, 0))
        if (eased < 1) animating = true
        spin.setFromAxisAngle(slot.axis, (1 - eased) * slot.sweep)
        slot.group.quaternion.copy(spin).multiply(slot.pose)
      }
      renderer.render(scene, camera)
      if (animating) raf = requestAnimationFrame(frame)
    }
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(frame)
    }

    const fit = () => {
      const w = host.clientWidth
      const h = host.clientHeight
      if (!w || !h) return
      renderer.setSize(w, h, false)
      const aspect = w / h
      const slots = slotsRef.current
      const { cols, rows, viewH } = gridFor(slots.length, aspect)
      const viewW = viewH * aspect
      camera.left = -viewW / 2
      camera.right = viewW / 2
      camera.top = viewH / 2
      camera.bottom = -viewH / 2
      camera.updateProjectionMatrix()

      slots.forEach((slot, i) => {
        const { x, y } = spotFor(i, slots.length, cols, rows)
        slot.x = x
        slot.y = y
        slot.group.position.set(x, y, 0)
      })
      schedule()
    }

    const pick = (clientX: number, clientY: number) => {
      const rect = host.getBoundingClientRect()
      if (!rect.width || !rect.height) return null
      // 正交相机、无旋转，屏幕坐标到世界坐标就是一次线性映射
      const wx = ((clientX - rect.left) / rect.width - 0.5) * (camera.right - camera.left)
      const wy = (0.5 - (clientY - rect.top) / rect.height) * (camera.top - camera.bottom)
      let best: { key: string; d: number } | null = null
      for (const slot of slotsRef.current) {
        const d = Math.hypot(slot.x - wx, slot.y - wy)
        if (d <= HIT_RADIUS && (!best || d < best.d)) best = { key: slot.key, d }
      }
      return best?.key ?? null
    }

    stageRef.current = { scene, fit, pick }
    const observer = new ResizeObserver(fit)
    observer.observe(host)

    return () => {
      observer.disconnect()
      if (raf) cancelAnimationFrame(raf)
      // 几何体和材质按骰型缓存在 Die3D 里共享，这里只拆场景
      for (const slot of slotsRef.current) scene.remove(slot.group)
      slotsRef.current = []
      stageRef.current = null
      canvas.remove()
      renderer.dispose()
    }
  }, [])

  // 骰池或结果变了：重摆骰子，只让本次真掷过的那几颗起转。
  // 共享缓存让这里只是新建几十个 Object3D
  useEffect(() => {
    const stage = stageRef.current
    if (!stage) return
    for (const slot of slotsRef.current) stage.scene.remove(slot.group)

    const now = performance.now()
    const spins = spinsRef.current
    let staggered = 0
    slotsRef.current = dice.map((item) => {
      const die = createDie(item.render)
      die.setLocked(item.locked)
      stage.scene.add(die.group)
      const rolled = spins.get(item.key) !== item.spin
      return {
        key: item.key,
        group: die.group,
        axis: randomAxis(),
        sweep: randomSweep(),
        pose: die.poses.get(item.face) ?? new THREE.Quaternion(),
        // 不该转的直接把起转时刻推到过去，第一帧就落在姿态上
        start: rolled ? now + staggered++ * STAGGER_MS : now - SPIN_MS,
        x: 0,
        y: 0,
      }
    })
    spinsRef.current = new Map(dice.map((item) => [item.key, item.spin]))
    stage.fit()
  }, [dice])

  // 探测放在 hooks 之后：没有 WebGL 就整块不挂，effect 拿不到 host 自然全部跳过
  if (!hasWebGL()) return null
  return (
    // relative 由组件自己给，不指望调用点：canvas 是 absolute，缺了包含块会跑到视口去。
    // 点击走 onClick 而非 onPointerDown（规范：pointerdown 改布局会让抬手的 click 穿透）；
    // 这层 aria-hidden，键盘与读屏走调用方的芯片，所以不给 role
    <div
      ref={hostRef}
      className={`relative ${className ?? ''}`}
      aria-hidden
      onClick={
        onPick &&
        ((e) => {
          const key = stageRef.current?.pick(e.clientX, e.clientY)
          if (key) onPick(key)
        })
      }
    />
  )
}

/**
 * 选列数：视野越小骰子越大，所以枚举列数取「装得下且视野最矮」的那档。
 * 竖屏自然收成两三列 —— 五颗骰子挤成一排会小到读不出点数。
 */
function gridFor(n: number, aspect: number) {
  let best = { cols: 1, rows: Math.max(n, 1), viewH: Infinity }
  for (let cols = 1; cols <= Math.max(n, 1); cols++) {
    const rows = Math.ceil(Math.max(n, 1) / cols)
    const viewH = Math.max(rows * CELL, (cols * CELL) / aspect)
    if (viewH < best.viewH - 1e-6) best = { cols, rows, viewH }
  }
  return best
}

/** 网格摆位。最后一行不满时整行居中，看着才不像缺了一块 */
function spotFor(i: number, n: number, cols: number, rows: number) {
  const row = Math.floor(i / cols)
  const inRow = Math.min(cols, n - row * cols)
  const col = i - row * cols
  return {
    x: (col - (inRow - 1) / 2) * SPACING,
    y: ((rows - 1) / 2 - row) * SPACING,
  }
}

/**
 * 旋转轴。z 分量刻意压小 —— 绕视轴转只是让字形在原地打转，看着是张纸在转而不是骰子在滚，
 * 得让 x/y 占主导，翻滚过程中才会有别的面扫过镜头。
 * 纯视觉的假值，按约定这种地方可以用 Math.random。
 */
function randomAxis() {
  const axis = new THREE.Vector3(
    Math.random() - 0.5,
    Math.random() - 0.5,
    (Math.random() - 0.5) * 0.5,
  )
  return axis.lengthSq() < 1e-6 ? new THREE.Vector3(0, 1, 0) : axis.normalize()
}

function randomSweep() {
  return (SPIN_TURNS_MIN + Math.random() * (SPIN_TURNS_MAX - SPIN_TURNS_MIN)) * Math.PI * 2
}

function easeOut(t: number) {
  return 1 - (1 - t) ** 3
}

let webglSupported: boolean | null = null

/** 只探一次。3D 是装饰，缺了就退回芯片读数，不该让出数这件事失败 */
function hasWebGL() {
  if (webglSupported === null) {
    try {
      const probe = document.createElement('canvas')
      // 只认 webgl2：three 的 WebGLRenderer 不再支持 webgl1，把「只有 webgl1」
      // 算成支持等于让 renderer 构造当场抛错（iOS 15 以下正是这一档）
      webglSupported = Boolean(probe.getContext('webgl2'))
    } catch {
      webglSupported = false
    }
  }
  return webglSupported
}
