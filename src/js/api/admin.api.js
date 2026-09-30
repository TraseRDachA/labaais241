import { apiClient, logAuditAction } from './client.js';

export const adminApi = {
  async getUsers() {
    return apiClient.get('/admin/users', (db) => [...(db.users || [])]);
  },

  async createUser(userData) {
    return apiClient.post('/admin/users', userData, (db, body) => {
      const newUser = {
        id: `u-${Date.now()}`,
        ...body,
        avatar: body.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${body.username || 'user'}`,
        createdAt: new Date().toISOString()
      };
      if (!Array.isArray(db.users)) db.users = [];
      db.users.push(newUser);
      logAuditAction('Создание пользователя', `Создан пользователь ${newUser.fullName} (${newUser.role})`);
      return newUser;
    });
  },

  async updateUser(id, userData) {
    return apiClient.put(`/admin/users/${id}`, userData, (db, body) => {
      const idx = (db.users || []).findIndex(u => u.id === id);
      if (idx === -1) throw new Error('Пользователь не найден');
      db.users[idx] = { ...db.users[idx], ...body };
      logAuditAction('Редактирование пользователя', `Обновлен пользователь ${db.users[idx].fullName}`);
      return db.users[idx];
    });
  },

  async deleteUser(id) {
    return apiClient.delete(`/admin/users/${id}`, (db) => {
      const idx = (db.users || []).findIndex(u => u.id === id);
      if (idx === -1) throw new Error('Пользователь не найден');
      const removed = db.users.splice(idx, 1)[0];
      logAuditAction('Удаление пользователя', `Удален пользователь ${removed.fullName}`);
      return { id };
    });
  },

  async getAuditLogs() {
    return apiClient.get('/admin/audit-logs', (db) => [...(db.auditLogs || [])]);
  },

  async clearAuditLogs() {
    return apiClient.delete('/admin/audit-logs', (db) => {
      db.auditLogs = [];
      logAuditAction('Очистка журнала', 'Журнал аудита очищен');
      return { cleared: true };
    });
  }
};