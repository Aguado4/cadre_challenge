import api from './axios'

export const getProfile = (username) => api.get(`/users/${username}`)
export const updateProfile = (data) => api.put('/users/me/profile', data)
export const searchUsers = (q) => api.get('/users/search', { params: { q } })
