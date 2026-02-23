import { useState } from 'react'
import { Link } from 'react-router-dom'
import { searchUsers } from '../api/users'
import { followUser, unfollowUser } from '../api/followers'
import { useAuth } from '../context/AuthContext'
import Navbar from '../components/Navbar'

export default function SearchPage() {
  const { user: currentUser } = useAuth()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)

  const handleSearch = async (e) => {
    e.preventDefault()
    if (!query.trim()) return
    setLoading(true)
    setSearched(true)
    try {
      const res = await searchUsers(query.trim())
      setResults(res.data)
    } catch {
      setResults([])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-black">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        <h1 className="text-xl font-bold">Search people</h1>
        <form onSubmit={handleSearch} className="flex gap-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by username or name..."
            className="input-field flex-1"
          />
          <button
            type="submit"
            disabled={loading || !query.trim()}
            className="bg-cadre-red text-white px-4 py-2 rounded text-sm font-semibold hover:opacity-90 disabled:opacity-50 transition"
          >
            {loading ? 'Searching...' : 'Search'}
          </button>
        </form>

        {searched && !loading && results.length === 0 && (
          <p className="text-cadre-muted text-sm">No users found for "{query}".</p>
        )}

        <div className="space-y-3">
          {results.map((u) => (
            <UserRow key={u.id} result={u} currentUser={currentUser} />
          ))}
        </div>
      </div>
    </div>
  )
}

function UserRow({ result, currentUser }) {
  const [isFollowing, setIsFollowing] = useState(result.is_following)
  const [loading, setLoading] = useState(false)

  const handleFollow = async () => {
    if (loading) return
    const was = isFollowing
    setIsFollowing(!was)
    setLoading(true)
    try {
      if (was) await unfollowUser(result.username)
      else await followUser(result.username)
    } catch {
      setIsFollowing(was)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-between border border-cadre-border rounded-lg px-4 py-3 bg-cadre-dark">
      <Link
        to={`/profile/${result.username}`}
        className="flex items-center gap-3 hover:opacity-80 transition"
      >
        <div className="w-9 h-9 rounded-full bg-cadre-border flex items-center justify-center text-sm font-bold text-cadre-red">
          {(result.display_name || result.username)[0].toUpperCase()}
        </div>
        <div>
          <p className="text-sm font-semibold">{result.display_name || `@${result.username}`}</p>
          <p className="text-xs text-cadre-muted">@{result.username} · {result.followers_count} followers</p>
        </div>
      </Link>
      {currentUser && (
        <button
          onClick={handleFollow}
          disabled={loading}
          className={
            isFollowing
              ? 'border border-cadre-border text-cadre-muted px-3 py-1 rounded text-xs hover:border-cadre-red hover:text-cadre-red transition disabled:opacity-50'
              : 'bg-cadre-red text-white px-3 py-1 rounded text-xs font-semibold hover:opacity-90 transition disabled:opacity-50'
          }
        >
          {isFollowing ? 'Following' : 'Follow'}
        </button>
      )}
    </div>
  )
}
