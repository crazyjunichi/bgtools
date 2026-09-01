import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { tools } from '../tools/registry'
import type { ToolMeta } from '../tools/types'

// 显式映射而非拼接类名：Tailwind 编译期扫描静态字符串，动态拼接会被漏掉
// 描边也带身份色：纯 border-line 在斜视时几张卡片会糊成一片
const ACCENT: Record<ToolMeta['accent'], string> = {
  amber: 'from-amber-500/20 border-amber-500/30 text-amber-300',
  emerald: 'from-emerald-500/20 border-emerald-500/30 text-emerald-300',
  sky: 'from-sky-500/20 border-sky-500/30 text-sky-300',
  violet: 'from-violet-500/20 border-violet-500/30 text-violet-300',
  rose: 'from-rose-500/20 border-rose-500/30 text-rose-300',
}

/**
 * 首页宫格。横向大卡（图左文右）而非小方卡：可用高 ≈740px 而旧卡片只有 165px，
 * 上方一行卡片下方全空。横卡把靶子做到 ≈500×176，封面/emoji 从 40px 提到 144px。
 *
 * 两层容器是必须的：`content-center` 在内容溢出时会把头部推到滚动区外且滚不回来，
 * 所以居中交给内层的 `min-h-full`（工具变多、grid 比容器高时它自然失效，从顶部开始滚），
 * 滚动交给外层。列数只用 `wide:` 判朝向 —— 宽度断点会把 CSS 宽不足 1024px 的
 * 安卓平板横屏误判成竖屏，整批退成单列。
 */
export default function Home() {
  const { t } = useTranslation()
  // 封面 404 时退回 emoji：图挂了不能让卡片空一块。存 id 而不是改 src，改 src 会死循环
  const [broken, setBroken] = useState<ReadonlySet<string>>(new Set())

  return (
    <div className="mx-auto h-full max-w-5xl overflow-y-auto">
      <div className="grid min-h-full auto-rows-min grid-cols-1 content-center gap-4 wide:grid-cols-2">
        {tools.map((tool) => {
          const cover = tool.cover && !broken.has(tool.id) ? tool.cover : null
          return (
            <Link
              key={tool.id}
              to={`/${tool.id}`}
              className={`flex items-center gap-4 rounded-2xl border bg-gradient-to-br to-surface p-4 transition-transform duration-75 active:scale-95 short:gap-3 short:p-3 ${
                ACCENT[tool.accent]
              }`}
            >
              {/* 图与 emoji 共用同一个方形槽位，换哪种都不影响卡片高度 */}
              <span className="flex size-28 shrink-0 items-center justify-center wide:size-36 short:size-20">
                {cover ? (
                  <img
                    // base 为相对路径，绝对的 /covers/... 在子目录部署下会 404
                    src={`${import.meta.env.BASE_URL}${cover}`}
                    alt=""
                    className="size-full rounded-xl object-contain"
                    onError={() => setBroken((s) => new Set(s).add(tool.id))}
                  />
                ) : (
                  <span className="text-5xl wide:text-6xl short:text-4xl">{tool.icon}</span>
                )}
              </span>
              <span className="flex min-w-0 flex-col gap-1">
                <span className="text-xl font-semibold text-text short:text-lg">
                  {t(tool.nameKey)}
                </span>
                <span className="text-sm leading-relaxed text-text-muted">{t(tool.descKey)}</span>
              </span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
