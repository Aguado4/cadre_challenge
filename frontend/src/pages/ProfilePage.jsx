import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { getProfile, updateProfile } from '../api/users'
import { useAuth } from '../context/AuthContext'
import Navbar from '../components/Navbar'

const SEX_OPTIONS = ['male', 'female', 'non-binary', 'prefer not to say']
const RELATIONSHIP_OPTIONS = [
  'single',
  'in a relationship',
  'engaged',
  'married',
  "it's complicated",
  'prefer not to say',
]

function formatDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

function birthdayToInput(iso) {
  if (!iso) return ''
  return new Date(iso).toISOString().split('T')[0]
}

export default function ProfilePage() {
  const { username } = useParams()
  const { user: currentUser } = useAuth()
  const isOwner = currentUser?.username === username

  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({})
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState(null)

  useEffect(() => {
    setLoading(true)
    setError(null)
    getProfile(username)
      .then((res) => {
        setProfile(res.data)
        setForm({
          display_name: res.data.display_name ?? '',
          bio: res.data.bio ?? '',
          sex: res.data.sex ?? '',
          birthday: birthdayToInput(res.data.birthday),
          relationship_status: res.data.relationship_status ?? '',
        })
      })
      .catch(() => setError('User not found'))
      .finally(() => setLoading(false))
  }, [username])

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))

  const handleSave = async (e) => {
    e.preventDefault()
    setSaveError(null)
    setSaving(true)
    try {
      const payload = {
        display_name: form.display_name || null,
        bio: form.bio || null,
        sex: form.sex || null,
        birthday: form.birthday ? new Date(form.birthday).toISOString() : null,
        relationship_status: form.relationship_status || null,
      }
      const res = await updateProfile(payload)
      setProfile(res.data)
      setEditing(false)
    } catch (err) {
      const detail = err.response?.data?.detail
      setSaveError(Array.isArray(detail) ? detail[0]?.msg : (detail ?? 'Save failed'))
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black">
        <Navbar />
        <div className="flex items-center justify-center mt-20">
          <span className="text-cadre-muted text-sm">Loading profile...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black">
        <Navbar />
        <div className="flex items-center justify-center mt-20">
          <span className="text-cadre-red">{error}</span>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-10">
        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold">
              {profile.display_name || `@${profile.username}`}
            </h2>
            <p className="text-cadre-muted text-sm mt-1">@{profile.username}</p>
            <p className="text-cadre-muted text-xs mt-1">
              Member since {formatDate(profile.created_at)}
            </p>
          </div>
          <div className="flex gap-4 text-center">
            <div>
              <p className="text-lg font-bold">{profile.followers_count}</p>
              <p className="text-cadre-muted text-xs">Followers</p>
            </div>
            <div>
              <p className="text-lg font-bold">{profile.following_count}</p>
              <p className="text-cadre-muted text-xs">Following</p>
            </div>
          </div>
        </div>

        {/* Profile info or edit form */}
        {!editing ? (
          <div className="space-y-4">
            <ProfileField label="Bio" value={profile.bio} />
            <ProfileField label="Sex" value={profile.sex} />
            <ProfileField label="Birthday" value={formatDate(profile.birthday)} />
            <ProfileField label="Relationship status" value={profile.relationship_status} />

            {isOwner && (
              <button
                onClick={() => setEditing(true)}
                className="mt-6 border border-cadre-red text-cadre-red px-4 py-2 rounded text-sm hover:bg-cadre-red hover:text-white transition"
              >
                Edit profile
              </button>
            )}
          </div>
        ) : (
          <form onSubmit={handleSave} className="space-y-4">
            <Field label="Display name">
              <input
                name="display_name"
                value={form.display_name}
                onChange={handleChange}
                placeholder="Your display name"
                maxLength={100}
                className="input-field"
              />
            </Field>

            <Field label="Bio">
              <textarea
                name="bio"
                value={form.bio}
                onChange={handleChange}
                placeholder="Tell us about yourself"
                maxLength={500}
                rows={3}
                className="input-field resize-none"
              />
            </Field>

            <Field label="Sex">
              <select name="sex" value={form.sex} onChange={handleChange} className="input-field">
                <option value="">— not specified —</option>
                {SEX_OPTIONS.map((o) => (
                  <option key={o} value={o}>
                    {o.charAt(0).toUpperCase() + o.slice(1)}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Birthday">
              <input
                name="birthday"
                type="date"
                value={form.birthday}
                onChange={handleChange}
                className="input-field"
              />
            </Field>

            <Field label="Relationship status">
              <select
                name="relationship_status"
                value={form.relationship_status}
                onChange={handleChange}
                className="input-field"
              >
                <option value="">— not specified —</option>
                {RELATIONSHIP_OPTIONS.map((o) => (
                  <option key={o} value={o}>
                    {o.charAt(0).toUpperCase() + o.slice(1)}
                  </option>
                ))}
              </select>
            </Field>

            {saveError && <p className="text-cadre-red text-sm">{saveError}</p>}

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={saving}
                className="bg-cadre-red text-white px-4 py-2 rounded text-sm font-semibold hover:opacity-90 disabled:opacity-50 transition"
              >
                {saving ? 'Saving...' : 'Save changes'}
              </button>
              <button
                type="button"
                onClick={() => { setEditing(false); setSaveError(null) }}
                className="border border-cadre-border text-cadre-muted px-4 py-2 rounded text-sm hover:border-white hover:text-white transition"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

function ProfileField({ label, value }) {
  return (
    <div className="border-b border-cadre-border pb-3">
      <p className="text-cadre-muted text-xs uppercase tracking-wider mb-1">{label}</p>
      <p className="text-white text-sm">{value || '—'}</p>
    </div>
  )
}

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-cadre-muted text-xs uppercase tracking-wider mb-1">
        {label}
      </label>
      {children}
    </div>
  )
}
