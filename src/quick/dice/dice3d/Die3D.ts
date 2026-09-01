import * as THREE from 'three'
import { createDieShape, type DieShape } from './faces'
import { numeralTexture } from './numerals'

/** 相机架在 +Z 正对原点，所以「读数面」就是法线朝 +Z 的那一面 */
const READ_DIR = new THREE.Vector3(0, 0, 1)
const SCREEN_UP = new THREE.Vector3(0, 1, 0)
const ORIGIN = new THREE.Vector3()
/**
 * 结果面正对镜头会看着像张卡片，统一偏一点让顶面和右侧面露出来才有立体感
 * （偏离视轴 ≈18°，也正好把这两面转向 (2.5,4,5) 的主光）。
 * 别再加大：这里偏多少，数字就少读多少，而可读性是这个场景的硬指标。
 */
const TILT = new THREE.Quaternion().setFromEuler(new THREE.Euler(-0.2, 0.24, 0))
/** 贴片浮出面外一点，免得和骰身共面打架 */
const NUMERAL_LIFT = 0.006

/** 骰身：amber-500 打底，被灯打亮后落在 amber-400 附近，与工具身份色一致 */
const BODY_COLOR = 0xf59e0b
/** amber-800 描边。小尺寸下轮廓靠明暗撑不住，得有一圈实线 */
const EDGE_COLOR = 0x92400e

export type Die = {
  group: THREE.Group
  /** 点数 → 让该面朝向镜头、数字正立的姿态 */
  poses: Map<number, THREE.Quaternion>
}

/**
 * 同一骰型的每颗骰子长得一模一样，几何体/材质/姿态表全部按骰型缓存共享。
 * 故意不提供释放：只有 6 种骰型，代价是几十 KB 显存，换来的是每次投掷只新建
 * 几十个 Object3D（不碰 GPU 资源），换骰型和重开 dialog 也都是零成本。
 */
const kits = new Map<number, DieKit>()

type DieKit = {
  shape: DieShape
  edgeGeometry: THREE.EdgesGeometry
  planeGeometry: THREE.PlaneGeometry
  bodyMaterial: THREE.Material
  edgeMaterial: THREE.Material
  /** 每个面的数字贴片：材质 + 贴在骰身上的局部姿态 */
  numerals: { material: THREE.Material; position: THREE.Vector3; quaternion: THREE.Quaternion }[]
  poses: Map<number, THREE.Quaternion>
}

export function createDie(sides: number): Die {
  const kit = kitFor(sides)
  const group = new THREE.Group()
  group.add(new THREE.Mesh(kit.shape.geometry, kit.bodyMaterial))
  group.add(new THREE.LineSegments(kit.edgeGeometry, kit.edgeMaterial))
  for (const numeral of kit.numerals) {
    const plane = new THREE.Mesh(kit.planeGeometry, numeral.material)
    plane.position.copy(numeral.position)
    plane.quaternion.copy(numeral.quaternion)
    group.add(plane)
  }
  return { group, poses: kit.poses }
}

function kitFor(sides: number): DieKit {
  const hit = kits.get(sides)
  if (hit) return hit

  const shape = createDieShape(sides)
  const basis = new THREE.Matrix4()
  const kit: DieKit = {
    shape,
    edgeGeometry: new THREE.EdgesGeometry(shape.geometry, 1),
    planeGeometry: new THREE.PlaneGeometry(shape.numeralSize, shape.numeralSize),
    bodyMaterial: new THREE.MeshStandardMaterial({
      color: BODY_COLOR,
      roughness: 0.42,
      metalness: 0,
      flatShading: true,
    }),
    edgeMaterial: new THREE.LineBasicMaterial({ color: EDGE_COLOR }),
    numerals: [],
    poses: new Map(),
  }

  for (const face of shape.faces) {
    // lookAt 让贴片的 +Z 对上面法线、+Y 对上 face.up，数字就贴着面躺平且正立
    basis.lookAt(face.normal, ORIGIN, face.up)
    kit.numerals.push({
      material: new THREE.MeshBasicMaterial({
        map: numeralTexture(face.value),
        transparent: true,
        depthWrite: false,
      }),
      position: face.center.clone().addScaledVector(face.normal, NUMERAL_LIFT),
      quaternion: new THREE.Quaternion().setFromRotationMatrix(basis),
    })
    kit.poses.set(face.value, poseFor(face.normal, face.up))
  }

  kits.set(sides, kit)
  return kit
}

/**
 * 求「让这个面朝向镜头且数字正立」的姿态，分三步：
 * 1. 把面法线转到 READ_DIR —— 面朝镜头了，但数字可能是躺着或倒着的
 * 2. 绕 READ_DIR 补一个扭转角，把 face.up 拧到屏幕正上方 —— 数字正立
 * 3. 左乘 TILT（世界空间）偏一点，露出相邻的面
 *
 * 结果是确定值，动画只负责从乱转衰减到它 —— 点数仍然由 crypto 决定，
 * 渲染这一层不参与随机。
 */
function poseFor(normal: THREE.Vector3, up: THREE.Vector3) {
  const align = new THREE.Quaternion().setFromUnitVectors(normal, READ_DIR)
  // up 与 normal 正交，转过来必然落在垂直 READ_DIR 的平面上，可以直接测角
  const turned = up.clone().applyQuaternion(align)
  const sin = new THREE.Vector3().crossVectors(turned, SCREEN_UP).dot(READ_DIR)
  const cos = turned.dot(SCREEN_UP)
  const twist = new THREE.Quaternion().setFromAxisAngle(READ_DIR, Math.atan2(sin, cos))
  return TILT.clone().multiply(twist).multiply(align)
}
