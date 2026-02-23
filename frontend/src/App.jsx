import { useEffect, useState } from 'react'
import axios from 'axios'

export default function App() {
  const [health, setHealth] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    axios
      .get('/api/health')
      .then((res) => setHealth(res.data))
      .catch(() => setError('Backend unreachable'))
  }, [])

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-6">
      <h1 className="text-5xl font-bold tracking-tight">
        Cadre<span className="text-cadre-red">Book</span>
      </h1>
      <p className="text-cadre-muted text-sm">Connect. Share. Belong.</p>
      <div className="mt-4 px-4 py-2 rounded border border-cadre-border text-sm">
        {error ? (
          <span className="text-cadre-red">{error}</span>
        ) : health ? (
          <span className="text-green-400">
            API status: <strong>{health.status}</strong>
          </span>
        ) : (
          <span className="text-cadre-muted">Checking API...</span>
        )}
      </div>
    </div>
  )
}
