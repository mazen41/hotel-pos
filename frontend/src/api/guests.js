import { apiClient } from './client';

export const guestsApi = {
  list: (params = {}) => apiClient.get('/guests', { params }),
  search: (q) => apiClient.get('/guests/search', { params: { q } }),
  show: (id) => apiClient.get(`/guests/${id}`),
  create: (payload) => apiClient.post('/guests', payload),
  update: (id, payload) => apiClient.put(`/guests/${id}`, payload),
  remove: (id) => apiClient.delete(`/guests/${id}`),
};
