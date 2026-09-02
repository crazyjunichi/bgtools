import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { createDie } from './dice3d/Die3D'

/** 相邻骰子中心距：外接球直径 2 + 间隙 */
const SPACING = 2.35
/** 单颗骰子需要的视野高度：直径 2 + 上下留白 */
const FIT_HEIGHT = 2.5
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

type Slot = {
  group: THREE.Group
  /** 本次投掷的旋转轴 */
  axis: THREE.Vector3
  /** 本次投掷的总旋转量（弧度），随缓动衰减到 0 */
  sweep: number
  /** 落点姿态 */
  pose: THREE.Quaternion
  /** 起转时刻 */
  start: number
}

type Stage = {
  scene: THREE.Scene
  /** 重算相机视野（骰子数量或容器尺寸变了都要调），顺带请求一帧 */
  fit: () => void
}

type Props = {
  sides: number
  /** store 里的 last。每次投掷都是**新数组**，组件靠这个身份变化判断"又掷了一次" */
  values: number[]
  className?: string
}

/**
 * 结果的 3D 表现层。**只表现，不决定**：点数由 store 的 crypto 随机给出，
 * 这里把对应骰面转到镜头前，旋转幅度随缓动衰减到 0，落点必然精确等于该点数。
 *
 * 装饰性质，所以 aria-hidden —— 真正的读数是下方那排大字，
 * 也因此没有 WebGL 时整块不渲染，出数这件事不受影响。
 */
export function DiceCanvas({ sides, values, className }: Props) {
  const hostRef = useRef<HTMLDivElement>(null)
  const stageRef = useRef<Stage | null>(null)
  const slotsRef = useRef<Slot[]>([])

  // 渲染器只建一次：WebGL 上下文很贵，而且浏览器同时能活的上下文数量有上限，
  // 每次投掷重建迟早会把老上下文挤掉
  useEffect(() => {
    const host = hostRef.current
    if (!host) return

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    const canvas = renderer.domElement
    // 必须脱离文档流：canvas 的固有尺寸 = drawing buffer 像素数，而 setSize 按 DPR
    // 放大它。留在流内会让这个（DPR 倍的）高度参与父级 flex 的内容高度计算 →
    // 容器变高 → ResizeObserver 再放大 buffer，正反馈一路把 dialog 撑到顶。
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

    // 动画结束就停 rAF：dialog 常开着放在桌上，空转一整晚纯烧电
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
      const spread = Math.max(slotsRef.current.length, 1) * SPACING
      // contain：先按高度定视野，一排骰子横向装不下再按宽度反算
      const viewH = Math.max(FIT_HEIGHT, spread / aspect)
      const viewW = viewH * aspect
      camera.left = -viewW / 2
      camera.right = viewW / 2
      camera.top = viewH / 2
      camera.bottom = -viewH / 2
      camera.updateProjectionMatrix()
      schedule()
    }

    stageRef.current = { scene, fit }
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

  // 换骰型或又掷了一次：重摆骰子并起转。共享缓存让这里只是新建几十个 Object3D
  useEffect(() => {
    const stage = stageRef.current
    if (!stage) return
    for (const slot of slotsRef.current) stage.scene.remove(slot.group)

    const now = performance.now()
    slotsRef.current = values.map((value, i) => {
      const die = createDie(sides)
      die.group.position.x = (i - (values.length - 1) / 2) * SPACING
      stage.scene.add(die.group)
      return {
        group: die.group,
        axis: randomAxis(),
        sweep: randomSweep(),
        pose: die.poses.get(value) ?? new THREE.Quaternion(),
        start: now + i * STAGGER_MS,
      }
    })
    stage.fit()
  }, [sides, values])

  // 探测放在 hooks 之后：没有 WebGL 就整块不挂，effect 拿不到 host 自然全部跳过
  if (!hasWebGL()) return null
  // relative 由组件自己给，不指望调用点：canvas 是 absolute，缺了包含块会跑到视口去
  return <div ref={hostRef} className={`relative ${className ?? ''}`} aria-hidden />
}

/**
 * 旋转轴。z 分量刻意压小 —— 绕视轴转只是让数字在原地打转，看着是张纸在转而不是骰子在滚，
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

/** 只探一次。3D 是装饰，缺了就退回纯数字读数，不该让出数这件事失败 */
function hasWebGL() {
  if (webglSupported === null) {
    try {
      const probe = document.createElement('canvas')
      webglSupported = Boolean(probe.getContext('webgl2') ?? probe.getContext('webgl'))
    } catch {
      webglSupported = false
    }
  }
  return webglSupported
}
