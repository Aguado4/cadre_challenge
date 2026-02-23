import { Link } from 'react-router-dom'

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-4">
      <h1 className="text-6xl font-bold text-cadre-red">404</h1>
      <p className="text-cadre-muted">This page doesn&apos;t exist.</p>
      <Link to="/" className="text-cadre-red hover:underline text-sm">
        Go home
      </Link>
    </div>
  )
}
