import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <nav className="bg-cadre-dark border-b border-cadre-border px-6 py-3 flex items-center justify-between">
      <Link to="/" className="text-xl font-bold tracking-tight">
        Cadre<span className="text-cadre-red">Book</span>
      </Link>
      {user && (
        <div className="flex items-center gap-4">
          <Link
            to="/search"
            className="text-cadre-muted text-sm hover:text-white transition"
          >
            Search
          </Link>
          <Link
            to={`/profile/${user.username}`}
            className="text-cadre-muted text-sm hover:text-white transition"
          >
            @{user.username}
          </Link>
          <button
            onClick={handleLogout}
            className="text-sm border border-cadre-border px-3 py-1 rounded hover:border-cadre-red hover:text-cadre-red transition"
          >
            Log out
          </button>
        </div>
      )}
    </nav>
  )
}
