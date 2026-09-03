import type { DealBackend, DealTarget } from './backend'
import { createCloudbaseBackend } from './cloudbase'
import { createFirebaseBackend } from './firebase'

/**
 * 地址 → 后端实现。单独一个文件是为了不让 [backend.ts](backend.ts)（纯契约）
 * 反向 import 各实现 —— 那会绕成循环依赖。
 */
export function backendFor(target: DealTarget): DealBackend {
  return target.kind === 'cloudbase'
    ? createCloudbaseBackend(target)
    : createFirebaseBackend(target)
}
