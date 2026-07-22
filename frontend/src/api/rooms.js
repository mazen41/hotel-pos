import { apiClient } from './client';

export const roomsApi = {
  list: (params = {}) => apiClient.get('/rooms', { params }),
  availability: (params = {}) => apiClient.get('/rooms/availability', { params }),
};
