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

export default function Home() {
  return (
    <div className="mx-auto h-full max-w-5xl overflow-y-auto">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {tools.map((tool) => (
          <Link
            key={tool.id}
            to={`/${tool.id}`}
            className={`flex flex-col gap-2 rounded-2xl border bg-gradient-to-br to-surface p-5 transition-transform duration-75 active:scale-95 ${
              ACCENT[tool.accent]
            }`}
          >
            <span className="text-4xl">{tool.icon}</span>
            <span className="text-lg font-semibold text-text">{tool.name}</span>
            <span className="text-sm leading-relaxed text-text-muted">{tool.desc}</span>
          </Link>
        ))}
      </div>
    </div>
  )
}
