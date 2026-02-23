import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { register as registerApi } from '../api/auth'
import { useAuth } from '../context/AuthContext'

export default function RegisterPage() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [form, setForm] = useState({ username: '', email: '', password: '', confirm: '' })
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)

    if (form.password !== form.confirm) {
      setError("Passwords don't match")
      return
    }

    setLoading(true)
    try {
      const res = await registerApi({
        username: form.username,
        email: form.email,
        password: form.password,
      })
      login(res.data.access_token, res.data.user)
      navigate('/')
    } catch (err) {
      const detail = err.response?.data?.detail
      if (Array.isArray(detail)) {
        setError(detail[0]?.msg ?? 'Validation error')
      } else {
        setError(detail ?? 'Something went wrong')
      }
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
            placeholder="Username (letters, numbers, _)"
            value={form.username}
            onChange={handleChange}
            required
            autoComplete="username"
            className="bg-cadre-dark border border-cadre-border rounded px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-cadre-red transition"
          />
          <input
            name="email"
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={handleChange}
            required
            autoComplete="email"
            className="bg-cadre-dark border border-cadre-border rounded px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-cadre-red transition"
          />
          <input
            name="password"
            type="password"
            placeholder="Password (min. 8 characters)"
            value={form.password}
            onChange={handleChange}
            required
            autoComplete="new-password"
            className="bg-cadre-dark border border-cadre-border rounded px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-cadre-red transition"
          />
          <input
            name="confirm"
            type="password"
            placeholder="Confirm password"
            value={form.confirm}
            onChange={handleChange}
            required
            autoComplete="new-password"
            className="bg-cadre-dark border border-cadre-border rounded px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-cadre-red transition"
          />

          {error && <p className="text-cadre-red text-sm">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="bg-cadre-red text-white rounded py-2 font-semibold hover:opacity-90 disabled:opacity-50 transition"
          >
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <p className="text-center text-cadre-muted text-sm mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-cadre-red hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  )
}
