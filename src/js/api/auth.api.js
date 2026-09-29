import { apiClient, setAuthToken, setCurrentUser, getCurrentUser, logAuditAction } from './client.js';
import { initialMockData } from './mockData.js';

export const authApi = {
  // Авторизация по логину и паролю
  async login(username, password) {
    return apiClient.post('/auth/login', { username, password }, (db) => {
      const uname = (username || '').trim().toLowerCase();
      let user = db.users.find(u => u.username && u.username.toLowerCase() === uname);
      
      // Если пользователя нет в измененной БД, ищем в эталонных
      if (!user) {
        user = initialMockData.users.find(u => u.username.toLowerCase() === uname);
        if (user) {
          db.users.push(user);
        }
      }

      if (!user) {
        throw new Error('Пользователь с таким логином не найден');
      }
      if (user.password !== password) {
        throw new Error('Неверный пароль');
      }

      const token = `fake-jwt-token-for-${user.id}-${Date.now()}`;
      setAuthToken(token);
      setCurrentUser(user);
      logAuditAction('Авторизация', `Вход пользователя ${user.fullName} (${user.roleName})`);
      return { token, user };
    });
  },

  // Мгновенный демо-вход под ролью (декан, преподаватель, студент, админ)
  async loginAsRole(role) {
    return apiClient.post('/auth/demo-login', { role }, (db) => {
      const targetRole = (role || '').trim().toLowerCase();
      if (!Array.isArray(db.users)) {
        db.users = JSON.parse(JSON.stringify(initialMockData.users));
      }

      let user = db.users.find(u => u.role && u.role.toLowerCase() === targetRole);
      
      // Защита от повреждения данных: берем из эталонных моков если нужно
      if (!user) {
        const fallbackUser = initialMockData.users.find(u => u.role.toLowerCase() === targetRole);
        if (fallbackUser) {
          user = JSON.parse(JSON.stringify(fallbackUser));
          db.users.push(user);
        }
      }

      if (!user) {
        throw new Error(`Профиль с ролью "${role}" не найден в системе`);
      }

      const token = `demo-token-${user.role}-${Date.now()}`;
      setAuthToken(token);
      setCurrentUser(user);
      logAuditAction('Быстрый вход', `Демо-вход в роли ${user.roleName || user.role}`);
      return { token, user };
    });
  },

  // Выход из системы
  async logout() {
    try {
      const user = getCurrentUser();
      if (user) {
        logAuditAction('Выход', `Выход пользователя ${user.fullName}`);
      }
    } catch {
      // Игнорируем ошибки при логауте
    }
    setAuthToken(null);
    setCurrentUser(null);
    return { success: true };
  },

  // Получение текущего пользователя
  getUser() {
    return getCurrentUser();
  }
};
