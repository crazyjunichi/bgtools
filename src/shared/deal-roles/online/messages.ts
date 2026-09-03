import type { I18nKey } from '../../i18n/types'
import type { DealErrorCode } from './backend'

/**
 * 每个错误码一句人话。**界面上不出异常堆栈**，也不出"401"这类原始信号 ——
 * 桌上要的是"接下来怎么办"。
 *
 * key 写完整字面量、不拼接：拼接同时丢掉类型校验和全局搜索。
 */
const ERROR_KEY: Record<DealErrorCode, I18nKey> = {
  offline: 'dealRoles.online.err.offline',
  config: 'dealRoles.online.err.config',
  taken: 'dealRoles.online.err.taken',
  ridCollision: 'dealRoles.online.err.ridCollision',
  badLink: 'dealRoles.online.err.badLink',
  version: 'dealRoles.online.err.version',
  unsupported: 'dealRoles.online.err.unsupported',
}

export function errorKeyOf(code: DealErrorCode): I18nKey {
  return ERROR_KEY[code]
}
