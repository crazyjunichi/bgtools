import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="flex flex-col items-center gap-4 py-20 text-center">
      <span className="text-5xl">🧭</span>
      <p className="text-slate-400">没有这个工具</p>
      <Link to="/" className="rounded-xl bg-surface-2 px-4 py-2.5 text-sm font-medium">
        回首页
      </Link>
    </div>
  )
}
