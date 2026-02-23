import api from './axios'

export const getComments = (postId) => api.get(`/posts/${postId}/comments`)
export const addComment = (postId, data) => api.post(`/posts/${postId}/comments`, data)
export const deleteComment = (commentId) => api.delete(`/comments/${commentId}`)
