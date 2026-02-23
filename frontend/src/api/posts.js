import api from './axios'

export const getFeed = (skip = 0, limit = 20, following = false) =>
  api.get('/posts/feed', { params: { skip, limit, ...(following ? { following: true } : {}) } })

export const getUserPosts = (username, skip = 0, limit = 20) =>
  api.get(`/posts/user/${username}`, { params: { skip, limit } })

export const createPost = (data) => api.post('/posts', data)
export const updatePost = (id, data) => api.put(`/posts/${id}`, data)
export const deletePost = (id) => api.delete(`/posts/${id}`)
