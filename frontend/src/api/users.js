import api from './axios'

export const getProfile = (username) => api.get(`/users/${username}`)
export const updateProfile = (data) => api.put('/users/me/profile', data)
