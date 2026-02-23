import api from './axios'

export const followUser = (username) => api.post(`/users/${username}/follow`)
export const unfollowUser = (username) => api.delete(`/users/${username}/follow`)
