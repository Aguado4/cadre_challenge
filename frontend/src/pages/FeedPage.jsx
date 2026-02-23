import { useEffect, useRef, useState } from 'react'
import { createPost, getFeed } from '../api/posts'
import { useAuth } from '../context/AuthContext'
import Navbar from '../components/Navbar'
import PostCard from '../components/PostCard'

export default function FeedPage() {
  const { user } = useAuth()
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [content, setContent] = useState('')
  const [posting, setPosting] = useState(false)
  const [postError, setPostError] = useState(null)
  const textareaRef = useRef(null)

  useEffect(() => {
    getFeed()
      .then((res) => setPosts(res.data))
      .finally(() => setLoading(false))
  }, [])

  const handlePost = async (e) => {
    e.preventDefault()
    if (!content.trim()) return
    setPostError(null)
    setPosting(true)
    try {
      const res = await createPost({ content: content.trim() })
      setPosts((prev) => [res.data, ...prev])
      setContent('')
    } catch (err) {
      const detail = err.response?.data?.detail
      setPostError(Array.isArray(detail) ? detail[0]?.msg : (detail ?? 'Could not post'))
    } finally {
      setPosting(false)
    }
  }

  const handleUpdated = (updated) =>
    setPosts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)))

  const handleDeleted = (id) =>
    setPosts((prev) => prev.filter((p) => p.id !== id))

  return (
    <div className="min-h-screen bg-black">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">

        {/* Create post */}
        <form onSubmit={handlePost} className="bg-cadre-dark border border-cadre-border rounded-lg p-4 space-y-3">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-full bg-cadre-border flex items-center justify-center text-xs font-bold text-cadre-red">
              {(user?.username || '?')[0].toUpperCase()}
            </div>
            <span className="text-sm text-cadre-muted">@{user?.username}</span>
          </div>
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="What's on your mind?"
            maxLength={1000}
            rows={3}
            className="input-field resize-none text-sm"
          />
          <div className="flex items-center justify-between">
            <span className="text-xs text-cadre-muted">{content.length}/1000</span>
            <button
              type="submit"
              disabled={posting || !content.trim()}
              className="bg-cadre-red text-white px-4 py-1.5 rounded text-sm font-semibold hover:opacity-90 disabled:opacity-50 transition"
            >
              {posting ? 'Posting...' : 'Post'}
            </button>
          </div>
          {postError && <p className="text-cadre-red text-xs">{postError}</p>}
        </form>

        {/* Feed */}
        {loading ? (
          <p className="text-center text-cadre-muted text-sm py-8">Loading feed...</p>
        ) : posts.length === 0 ? (
          <p className="text-center text-cadre-muted text-sm py-8">
            No posts yet. Be the first to post!
          </p>
        ) : (
          <div className="space-y-4">
            {posts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                onUpdated={handleUpdated}
                onDeleted={handleDeleted}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
