import { Link } from 'react-router-dom'
import { tools } from '../tools/registry'
import type { ToolMeta } from '../tools/types'

// 显式映射而非拼接类名：Tailwind 编译期扫描静态字符串，动态拼接会被漏掉
const ACCENT: Record<ToolMeta['accent'], string> = {
  amber: 'from-amber-500/20 text-amber-300',
  emerald: 'from-emerald-500/20 text-emerald-300',
  sky: 'from-sky-500/20 text-sky-300',
  violet: 'from-violet-500/20 text-violet-300',
  rose: 'from-rose-500/20 text-rose-300',
}

export default function Home() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {tools.map((tool) => (
        <Link
          key={tool.id}
          to={`/${tool.id}`}
          className={`flex flex-col gap-2 rounded-2xl border border-line bg-gradient-to-br to-surface p-4 transition active:scale-95 ${
            ACCENT[tool.accent]
          }`}
        >
          <span className="text-3xl">{tool.icon}</span>
          <span className="font-semibold text-slate-100">{tool.name}</span>
          <span className="text-xs leading-relaxed text-slate-400">{tool.desc}</span>
        </Link>
      ))}
    </div>
  )
}
