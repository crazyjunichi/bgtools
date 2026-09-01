import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
      <span className="text-6xl">🧭</span>
      <p className="text-lg text-text-muted">没有这个工具</p>
      <Link to="/" className="btn-quiet px-6 text-base">
        回首页
      </Link>
    </div>
  )
}
