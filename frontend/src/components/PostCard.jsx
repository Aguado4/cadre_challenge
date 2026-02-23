import { useState } from 'react'
import { Link } from 'react-router-dom'
import { updatePost, deletePost } from '../api/posts'
import { toggleLike } from '../api/likes'
import { useAuth } from '../context/AuthContext'

function timeAgo(iso) {
  // Backend returns naive UTC — append 'Z' so JS parses it as UTC, not local time
  const utc = iso.endsWith('Z') ? iso : iso + 'Z'
  const diff = Math.floor((Date.now() - new Date(utc)) / 1000)
  if (diff < 60) return `${diff}s ago`
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return new Date(utc).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function PostCard({ post, onUpdated, onDeleted }) {
  const { user } = useAuth()
  const isOwner = user?.id === post.user_id

  const [editing, setEditing] = useState(false)
  const [editContent, setEditContent] = useState(post.content)
  const [saving, setSaving] = useState(false)
  const [editError, setEditError] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  // Like state — starts from server value
  const [liked, setLiked] = useState(post.liked_by_me)
  const [likesCount, setLikesCount] = useState(post.likes_count)
  const [liking, setLiking] = useState(false)

  const handleLike = async () => {
    if (liking) return
    // Optimistic update
    const prevLiked = liked
    const prevCount = likesCount
    setLiked(!liked)
    setLikesCount(liked ? likesCount - 1 : likesCount + 1)
    setLiking(true)
    try {
      const res = await toggleLike(post.id)
      setLiked(res.data.liked_by_me)
      setLikesCount(res.data.likes_count)
    } catch {
      // Rollback on error
      setLiked(prevLiked)
      setLikesCount(prevCount)
    } finally {
      setLiking(false)
    }
  }

  const handleSave = async () => {
    if (!editContent.trim()) return
    setSaving(true)
    setEditError(null)
    try {
      const res = await updatePost(post.id, { content: editContent.trim() })
      onUpdated({ ...res.data, liked_by_me: liked, likes_count: likesCount })
      setEditing(false)
    } catch (err) {
      const detail = err.response?.data?.detail
      setEditError(Array.isArray(detail) ? detail[0]?.msg : (detail ?? 'Save failed'))
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await deletePost(post.id)
      onDeleted(post.id)
    } catch {
      setDeleting(false)
      setConfirmDelete(false)
    }
  }

  return (
    <div className="border border-cadre-border rounded-lg p-4 bg-cadre-dark">
      {/* Author + time */}
      <div className="flex items-center justify-between mb-3">
        <Link
          to={`/profile/${post.author?.username}`}
          className="flex items-center gap-2 hover:opacity-80 transition"
        >
          <div className="w-8 h-8 rounded-full bg-cadre-border flex items-center justify-center text-xs font-bold text-cadre-red">
            {(post.author?.display_name || post.author?.username || '?')[0].toUpperCase()}
          </div>
          <div>
            <p className="text-sm font-semibold leading-none">
              {post.author?.display_name || `@${post.author?.username}`}
            </p>
            <p className="text-xs text-cadre-muted leading-none mt-0.5">
              @{post.author?.username}
            </p>
          </div>
        </Link>
        <span className="text-xs text-cadre-muted">{timeAgo(post.created_at)}</span>
      </div>

      {/* Content or edit form */}
      {editing ? (
        <div className="space-y-2">
          <textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            maxLength={1000}
            rows={3}
            className="input-field resize-none text-sm"
          />
          {editError && <p className="text-cadre-red text-xs">{editError}</p>}
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={saving || !editContent.trim()}
              className="bg-cadre-red text-white px-3 py-1 rounded text-xs font-semibold hover:opacity-90 disabled:opacity-50 transition"
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
            <button
              onClick={() => { setEditing(false); setEditContent(post.content); setEditError(null) }}
              className="border border-cadre-border text-cadre-muted px-3 py-1 rounded text-xs hover:border-white hover:text-white transition"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <p className="text-sm text-white whitespace-pre-wrap break-words">{post.content}</p>
      )}

      {/* Footer: like button + owner actions */}
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-cadre-border">
        {/* Like button */}
        <button
          onClick={handleLike}
          disabled={liking}
          className={`flex items-center gap-1.5 text-sm transition disabled:opacity-50 ${
            liked ? 'text-cadre-red' : 'text-cadre-muted hover:text-cadre-red'
          }`}
        >
          <span className="text-base leading-none">{liked ? '♥' : '♡'}</span>
          <span>{likesCount}</span>
        </button>

        {isOwner && !editing && (
          <div className="flex items-center gap-3">
            {confirmDelete ? (
              <>
                <span className="text-xs text-cadre-muted">Delete post?</span>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="text-xs text-cadre-red hover:underline disabled:opacity-50"
                >
                  {deleting ? 'Deleting...' : 'Yes, delete'}
                </button>
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="text-xs text-cadre-muted hover:text-white"
                >
                  Cancel
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setEditing(true)}
                  className="text-xs text-cadre-muted hover:text-white transition"
                >
                  Edit
                </button>
                <button
                  onClick={() => setConfirmDelete(true)}
                  className="text-xs text-cadre-muted hover:text-cadre-red transition"
                >
                  Delete
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
