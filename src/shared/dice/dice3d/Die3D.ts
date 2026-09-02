import * as THREE from 'three'
import { createDieShape, type DieShape } from './faces'
import { glyphTexture } from './glyph'

/** 相机架在 +Z 正对原点，所以「读数面」就是法线朝 +Z 的那一面 */
const READ_DIR = new THREE.Vector3(0, 0, 1)
const SCREEN_UP = new THREE.Vector3(0, 1, 0)
const ORIGIN = new THREE.Vector3()
/**
 * 结果面正对镜头会看着像张卡片，统一偏一点让顶面和右侧面露出来才有立体感
 * （偏转量也正好把这两面转向主光）。
 * 别再加大：这里偏多少，字形就少读多少，而可读性是这个场景的硬指标。
 */
const TILT = new THREE.Quaternion().setFromEuler(new THREE.Euler(-0.2, 0.24, 0))
/** 贴片浮出面外一点，免得和骰身共面打架 */
const GLYPH_LIFT = 0.006

/** 锁定轮廓：emerald = 完成/保留。放大的背面壳，被骰身挡住中间只露出边缘一圈 */
const LOCK_COLOR = 0x34d399
const LOCK_SCALE = 1.07

/**
 * 渲染一颗骰子所需的全部外观。「面上画什么」由骰组数据层给到这里，
 * 3D 层不认识数值、符号这些概念，只认字形表。
 */
export type DieRender = {
  /**
   * kit 缓存键，用骰型 id。**同一个 kitKey 必须对应完全一样的外观** ——
   * 几何体、材质、贴片全按它共享，两种同面数不同符号的骰共用一个键会互相串图
   */
  kitKey: string
  sides: number
  /** 骰身色，被灯打亮后会落在比它亮一档的位置 */
  bodyColor: number
  /** 描边色。小尺寸下轮廓靠明暗撑不住，得有一圈实线 */
  edgeColor: number
  /** 字色，canvas 用的 CSS 色串 */
  glyphInk: string
  /** 面号 1..N 对应的字形，`glyphs[i]` 是面号 `i + 1` */
  glyphs: readonly string[]
}

export type Die = {
  group: THREE.Group
  /** 面号 → 让该面朝向镜头、字形正立的姿态 */
  poses: Map<number, THREE.Quaternion>
  /** 切锁定轮廓。材质是按骰型共享的，**锁定态不许改材质颜色** —— 会连带染到别的骰子 */
  setLocked: (locked: boolean) => void
}

/**
 * 同一骰型的每颗骰子长得一模一样，几何体/材质/姿态表全部按 kitKey 缓存共享。
 * 故意不提供释放：骰型是有限几种，代价是几十 KB 显存，换来的是每次投掷只新建
 * 几十个 Object3D（不碰 GPU 资源），换骰组和重开界面也都是零成本。
 */
const kits = new Map<string, DieKit>()

type DieKit = {
  shape: DieShape
  edgeGeometry: THREE.EdgesGeometry
  planeGeometry: THREE.PlaneGeometry
  bodyMaterial: THREE.Material
  edgeMaterial: THREE.Material
  lockMaterial: THREE.Material
  /** 每个面的字形贴片：材质 + 贴在骰身上的局部姿态 */
  glyphs: { material: THREE.Material; position: THREE.Vector3; quaternion: THREE.Quaternion }[]
  poses: Map<number, THREE.Quaternion>
}

export function createDie(render: DieRender): Die {
  const kit = kitFor(render)
  const group = new THREE.Group()

  // 轮廓壳排在骰身之前加进去，读起来就是「先铺底再盖骰身」
  const outline = new THREE.Mesh(kit.shape.geometry, kit.lockMaterial)
  outline.scale.setScalar(LOCK_SCALE)
  outline.visible = false
  group.add(outline)

  group.add(new THREE.Mesh(kit.shape.geometry, kit.bodyMaterial))
  group.add(new THREE.LineSegments(kit.edgeGeometry, kit.edgeMaterial))
  for (const glyph of kit.glyphs) {
    const plane = new THREE.Mesh(kit.planeGeometry, glyph.material)
    plane.position.copy(glyph.position)
    plane.quaternion.copy(glyph.quaternion)
    group.add(plane)
  }

  return {
    group,
    poses: kit.poses,
    setLocked: (locked) => {
      outline.visible = locked
    },
  }
}

function kitFor(render: DieRender): DieKit {
  const hit = kits.get(render.kitKey)
  if (hit) return hit

  const shape = createDieShape(render.sides)
  const basis = new THREE.Matrix4()
  const kit: DieKit = {
    shape,
    edgeGeometry: new THREE.EdgesGeometry(shape.geometry, 1),
    planeGeometry: new THREE.PlaneGeometry(shape.glyphSize, shape.glyphSize),
    bodyMaterial: new THREE.MeshStandardMaterial({
      color: render.bodyColor,
      roughness: 0.42,
      metalness: 0,
      flatShading: true,
    }),
    edgeMaterial: new THREE.LineBasicMaterial({ color: render.edgeColor }),
    lockMaterial: new THREE.MeshBasicMaterial({ color: LOCK_COLOR, side: THREE.BackSide }),
    glyphs: [],
    poses: new Map(),
  }

  for (const face of shape.faces) {
    // lookAt 让贴片的 +Z 对上面法线、+Y 对上 face.up，字形就贴着面躺平且正立
    basis.lookAt(face.normal, ORIGIN, face.up)
    kit.glyphs.push({
      material: new THREE.MeshBasicMaterial({
        map: glyphTexture(render.glyphs[face.value - 1] ?? '', render.glyphInk),
        transparent: true,
        depthWrite: false,
      }),
      position: face.center.clone().addScaledVector(face.normal, GLYPH_LIFT),
      quaternion: new THREE.Quaternion().setFromRotationMatrix(basis),
    })
    kit.poses.set(face.value, poseFor(face.normal, face.up))
  }

  kits.set(render.kitKey, kit)
  return kit
}

/**
 * 求「让这个面朝向镜头且字形正立」的姿态，分三步：
 * 1. 把面法线转到 READ_DIR —— 面朝镜头了，但字形可能是躺着或倒着的
 * 2. 绕 READ_DIR 补一个扭转角，把 face.up 拧到屏幕正上方 —— 字形正立
 * 3. 左乘 TILT（世界空间）偏一点，露出相邻的面
 *
 * 结果是确定值，动画只负责从乱转衰减到它 —— 面号仍然由 crypto 决定，
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
