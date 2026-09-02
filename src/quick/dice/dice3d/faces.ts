import * as THREE from 'three'

/**
 * 骰子几何体 + 每个面的「点数 / 法线 / 中心 / 正立方向」。
 *
 * 不做 UV 贴图：多面体的每面单独排 UV 工作量极大，而这里的数字是贴片
 * （面前方一张 plane），所以只需要知道每个面在哪、朝哪、哪边算上。
 */

/** 所有骰型统一外接球半径 —— 多颗并排时视觉大小才一致 */
const R = 1

export type DieFace = {
  value: number
  /** 单位法线，指向骰子外侧 */
  normal: THREE.Vector3
  /** 面中心（局部坐标） */
  center: THREE.Vector3
  /** 面内的「数字朝上」方向，决定贴片正立姿态；与 normal 正交 */
  up: THREE.Vector3
}

export type DieShape = {
  geometry: THREE.BufferGeometry
  faces: DieFace[]
  /** 数字贴片边长（局部单位）。三角面能放的字比五边形小得多 */
  numeralSize: number
}

/**
 * 数字贴片边长。上限是「正方形贴片内接于该面的内切圆」，超了贴片四角会戳出骰面边缘 ——
 * 加新面数时按这个约束反推，别照着已有值猜。三角面 (d4/d8/d20) 吃亏最大。
 */
const NUMERAL_SIZE: Record<number, number> = {
  4: 0.66,
  6: 0.84,
  8: 0.56,
  10: 0.5,
  12: 0.68,
  20: 0.42,
}

export function createDieShape(sides: number): DieShape {
  const geometry = createGeometry(sides)
  const faces = extractFaces(geometry)
  assignValues(faces, sides)
  return { geometry, faces, numeralSize: NUMERAL_SIZE[sides] ?? 0.6 }
}

function createGeometry(sides: number): THREE.BufferGeometry {
  switch (sides) {
    case 4:
      return nonIndexed(new THREE.TetrahedronGeometry(R))
    // 立方体外接球半径 = (√3/2)·边长，反解边长才能与其它骰型等大
    case 6:
      return nonIndexed(new THREE.BoxGeometry(...cubeEdge()))
    case 8:
      return nonIndexed(new THREE.OctahedronGeometry(R))
    case 10:
      return createTrapezohedron()
    case 12:
      return nonIndexed(new THREE.DodecahedronGeometry(R))
    default:
      return nonIndexed(new THREE.IcosahedronGeometry(R))
  }
}

function cubeEdge(): [number, number, number] {
  const e = (2 * R) / Math.sqrt(3)
  return [e, e, e]
}

/** 面归并要逐三角形读顶点，索引化的几何体先摊平 */
function nonIndexed(geo: THREE.BufferGeometry): THREE.BufferGeometry {
  if (!geo.index) return geo
  const flat = geo.toNonIndexed()
  geo.dispose()
  return flat
}

/**
 * 五角十二面体（真正的 d10 形状，three 没有内置）。
 * 两个尖端 + 赤道上下交错的两圈各 5 个顶点，每个面是一枚鸢形。
 * 鸢形四点共面这个约束把尖端高度锁死在赤道振幅的 9.472 倍（联立平面方程解出），
 * 改了 ZIGZAG 就必须同步改这个系数，否则面会扭曲、贴片浮在面外。
 */
function createTrapezohedron(): THREE.BufferGeometry {
  const ZIGZAG = 0.11
  const apexY = 9.4718 * ZIGZAG
  const ring: THREE.Vector3[] = []
  for (let i = 0; i < 10; i++) {
    const a = (i * Math.PI * 2) / 10
    ring.push(new THREE.Vector3(Math.cos(a), i % 2 === 0 ? ZIGZAG : -ZIGZAG, Math.sin(a)))
  }
  const top = new THREE.Vector3(0, apexY, 0)
  const bottom = new THREE.Vector3(0, -apexY, 0)

  const verts: number[] = []
  const kite = (apex: THREE.Vector3, i0: number, i1: number, i2: number) => {
    const a = ring[i0 % 10]
    const b = ring[i1 % 10]
    const c = ring[i2 % 10]
    // 拆两个三角形，绕向统一朝外
    pushTri(verts, apex, a, b)
    pushTri(verts, apex, b, c)
  }
  for (let i = 0; i < 5; i++) {
    kite(top, 2 * i + 2, 2 * i + 1, 2 * i)
    kite(bottom, 2 * i + 1, 2 * i + 2, 2 * i + 3)
  }

  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3))
  // 尖端就是最远点，按它归一化后各骰型外接球半径一致
  geo.scale(R / apexY, R / apexY, R / apexY)
  geo.computeVertexNormals()
  return geo
}

function pushTri(out: number[], a: THREE.Vector3, b: THREE.Vector3, c: THREE.Vector3) {
  out.push(a.x, a.y, a.z, b.x, b.y, b.z, c.x, c.y, c.z)
}

/** 逐三角形读顶点，法线共线的归并成一个面 —— d12 的五边形、d10 的鸢形都是拆开存的 */
function extractFaces(geo: THREE.BufferGeometry): DieFace[] {
  const pos = geo.getAttribute('position')
  const groups: { normal: THREE.Vector3; points: THREE.Vector3[] }[] = []
  const a = new THREE.Vector3()
  const b = new THREE.Vector3()
  const c = new THREE.Vector3()

  for (let i = 0; i < pos.count; i += 3) {
    a.fromBufferAttribute(pos, i)
    b.fromBufferAttribute(pos, i + 1)
    c.fromBufferAttribute(pos, i + 2)
    const normal = new THREE.Vector3()
      .subVectors(b, a)
      .cross(new THREE.Vector3().subVectors(c, a))
      .normalize()

    let group = groups.find((g) => g.normal.dot(normal) > 0.999)
    if (!group) {
      group = { normal, points: [] }
      groups.push(group)
    }
    for (const p of [a, b, c]) {
      if (!group.points.some((q) => q.distanceToSquared(p) < 1e-8)) group.points.push(p.clone())
    }
  }

  return groups.map(({ normal, points }) => {
    const center = points
      .reduce((sum, p) => sum.add(p), new THREE.Vector3())
      .divideScalar(points.length)
    return { value: 0, normal, center, up: pickUp(points, center, normal) }
  })
}

/**
 * 数字该朝哪边。真骰子的刻字方向不是随便定的：
 * 正方形（d6）数字轴对齐 → 取边中点方向；三角形/五边形数字与对边平行 → 取顶点方向；
 * 鸢形（d10）沿长轴 → 取最远那个顶点，也就是朝骰子尖端。
 */
function pickUp(points: THREE.Vector3[], center: THREE.Vector3, normal: THREE.Vector3) {
  const radii = points.map((p) => p.distanceTo(center))
  const irregular = Math.max(...radii) - Math.min(...radii) > 1e-3

  let target: THREE.Vector3
  if (irregular) {
    target = points[radii.indexOf(Math.max(...radii))]
  } else if (points.length % 2 === 0) {
    const first = points[0]
    // 最近的另一个顶点必然是相邻顶点（对角线更远）
    const neighbor = points
      .slice(1)
      .reduce((best, p) => (p.distanceTo(first) < best.distanceTo(first) ? p : best))
    target = new THREE.Vector3().addVectors(first, neighbor).multiplyScalar(0.5)
  } else {
    target = points[0]
  }

  return target.clone().sub(center).projectOnPlane(normal).normalize()
}

/**
 * 按真骰子惯例编号：对面点数之和 = 面数 + 1（d6 的 7 点、d20 的 21 点）。
 * 先按法线排序，保证同一骰型每次生成的编号完全一致 —— 否则重开 dialog 骰面就变了。
 * d4 的四个面互不对顶，没有配对可言，退化成顺序编号。
 */
function assignValues(faces: DieFace[], sides: number) {
  const order = [...faces].sort(
    (p, q) =>
      round(q.normal.y) - round(p.normal.y) ||
      round(p.normal.x) - round(q.normal.x) ||
      round(p.normal.z) - round(q.normal.z),
  )

  let next = 1
  for (const face of order) {
    if (face.value) continue
    face.value = next
    const opposite = order.find((o) => !o.value && o.normal.dot(face.normal) < -0.999)
    if (opposite) opposite.value = sides + 1 - next
    next++
  }
}

function round(v: number) {
  return Math.round(v * 1e4) / 1e4
}
