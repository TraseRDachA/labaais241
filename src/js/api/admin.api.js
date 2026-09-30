import { apiClient } from './client.js';

export const adminApi = {
  async getUsers() {
    return apiClient.get('/admin/users');
  },

  async createUser(userData) {
    return apiClient.post('/admin/users', userData);
  },

  async updateUser(id, userData) {
    return apiClient.put(`/admin/users/${id}`, userData);
  },

  async deleteUser(id) {
    return apiClient.delete(`/admin/users/${id}`);
  },

  async getAuditLogs() {
    return apiClient.get('/admin/audit-logs');
  },

  async clearAuditLogs() {
    return apiClient.delete('/admin/audit-logs');
  }
};