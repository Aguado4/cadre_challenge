import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { getComments, addComment, deleteComment } from '../api/comments'
import { useAuth } from '../context/AuthContext'

function timeAgo(iso) {
  const utc = iso.endsWith('Z') ? iso : iso + 'Z'
  const diff = Math.floor((Date.now() - new Date(utc)) / 1000)
  if (diff < 60) return `${diff}s ago`
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return new Date(utc).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function CommentSection({ postId, onCommentAdded, onCommentDeleted }) {
  const { user } = useAuth()
  const [comments, setComments] = useState([])
  const [loading, setLoading] = useState(true)
  const [content, setContent] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const inputRef = useRef(null)

  useEffect(() => {
    getComments(postId)
      .then((res) => setComments(res.data))
      .catch(() => setComments([]))
      .finally(() => setLoading(false))
  }, [postId])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!content.trim()) return
    setError(null)
    setSubmitting(true)
    try {
      const res = await addComment(postId, { content: content.trim() })
      setComments((prev) => [...prev, res.data])
      setContent('')
      onCommentAdded?.()
    } catch (err) {
      const detail = err.response?.data?.detail
      setError(Array.isArray(detail) ? detail[0]?.msg : (detail ?? 'Could not post comment'))
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (commentId) => {
    try {
      await deleteComment(commentId)
      setComments((prev) => prev.filter((c) => c.id !== commentId))
      onCommentDeleted?.()
    } catch {
      // silently ignore — comment may already be deleted
    }
  }

  return (
    <div className="mt-3 pt-3 border-t border-cadre-border space-y-3">
      {/* Comment list */}
      {loading ? (
        <p className="text-xs text-cadre-muted">Loading comments...</p>
      ) : comments.length === 0 ? (
        <p className="text-xs text-cadre-muted">No comments yet.</p>
      ) : (
        <div className="space-y-2">
          {comments.map((comment) => (
            <div key={comment.id} className="flex items-start gap-2 group">
              <div className="w-6 h-6 rounded-full bg-cadre-border flex items-center justify-center text-xs font-bold text-cadre-red flex-shrink-0 mt-0.5">
                {(comment.author?.display_name || comment.author?.username || '?')[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2 flex-wrap">
                  <Link
                    to={`/profile/${comment.author?.username}`}
                    className="text-xs font-semibold hover:text-cadre-red transition"
                  >
                    {comment.author?.display_name || `@${comment.author?.username}`}
                  </Link>
                  <span className="text-xs text-cadre-muted">{timeAgo(comment.created_at)}</span>
                  {comment.user_id === user?.id && (
                    <button
                      onClick={() => handleDelete(comment.id)}
                      className="text-xs text-cadre-muted hover:text-cadre-red transition opacity-0 group-hover:opacity-100"
                    >
                      Delete
                    </button>
                  )}
                </div>
                <p className="text-xs text-cadre-muted mt-0.5 break-words">{comment.content}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add comment form */}
      <form onSubmit={handleSubmit} className="flex gap-2 items-start">
        <div className="w-6 h-6 rounded-full bg-cadre-border flex items-center justify-center text-xs font-bold text-cadre-red flex-shrink-0 mt-1">
          {(user?.username || '?')[0].toUpperCase()}
        </div>
        <div className="flex-1 space-y-1">
          <input
            ref={inputRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write a comment..."
            maxLength={500}
            className="input-field text-xs py-1.5"
          />
          {error && <p className="text-cadre-red text-xs">{error}</p>}
        </div>
        <button
          type="submit"
          disabled={submitting || !content.trim()}
          className="bg-cadre-red text-white px-3 py-1.5 rounded text-xs font-semibold hover:opacity-90 disabled:opacity-50 transition mt-0.5"
        >
          {submitting ? '...' : 'Post'}
        </button>
      </form>
    </div>
  )
}
