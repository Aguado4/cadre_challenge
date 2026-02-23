import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { login as loginApi } from '../api/auth'
import { useAuth } from '../context/AuthContext'

export default function LoginPage() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [form, setForm] = useState({ username: '', password: '' })
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const res = await loginApi(form)
      login(res.data.access_token, res.data.user)
      navigate('/')
    } catch (err) {
      setError(err.response?.data?.detail ?? 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <h1 className="text-4xl font-bold text-center mb-8">
          Cadre<span className="text-cadre-red">Book</span>
        </h1>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            name="username"
            type="text"
            placeholder="Username"
            value={form.username}
            onChange={handleChange}
            required
            autoComplete="username"
            className="bg-cadre-dark border border-cadre-border rounded px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-cadre-red transition"
          />
          <input
            name="password"
            type="password"
            placeholder="Password"
            value={form.password}
            onChange={handleChange}
            required
            autoComplete="current-password"
            className="bg-cadre-dark border border-cadre-border rounded px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-cadre-red transition"
          />

          {error && <p className="text-cadre-red text-sm">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="bg-cadre-red text-white rounded py-2 font-semibold hover:opacity-90 disabled:opacity-50 transition"
          >
            {loading ? 'Logging in...' : 'Log In'}
          </button>
        </form>

        <p className="text-center text-cadre-muted text-sm mt-6">
          Don&apos;t have an account?{' '}
          <Link to="/register" className="text-cadre-red hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  )
}
