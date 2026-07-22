import { apiClient } from './client';

export const reservationsApi = {
  list: (params = {}) => apiClient.get('/reservations', { params }),
  search: (q) => apiClient.get('/reservations/search', { params: { q } }),
  show: (id) => apiClient.get(`/reservations/${id}`),
  create: (payload) => apiClient.post('/reservations', payload),
  update: (id, payload) => apiClient.put(`/reservations/${id}`, payload),
  remove: (id) => apiClient.delete(`/reservations/${id}`),
};
