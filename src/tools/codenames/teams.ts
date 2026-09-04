import type { I18nKey } from '../../shared/i18n/types'
import type { Team } from './game'

/** 队伍色是实物游戏的内容色（红蓝两队），不走语义色。页面、网格、落地页共用这一份 */
export const TEAM_SOLID: Record<Team, string> = {
  red: 'bg-red-800 text-white',
  blue: 'bg-blue-800 text-white',
}

export const TEAM_TEXT: Record<Team, string> = {
  red: 'text-red-300',
  blue: 'text-blue-300',
}

export const TEAM_NAME: Record<Team, I18nKey> = {
  red: 'tools.codenames.team.red',
  blue: 'tools.codenames.team.blue',
}
