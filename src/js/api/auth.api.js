import { apiClient, setAuthToken, setCurrentUser, getCurrentUser, logAuditAction } from './client.js';
import { initialMockData } from './mockData.js';

export const authApi = {
  async login(username, password) {
    const res = await apiClient.post('/auth/login', { username, password }, (db) => {
      const uname = (username || '').trim().toLowerCase();
      let user = db.users.find(u => u.username && u.username.toLowerCase() === uname);
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

    if (res && res.success && res.data && res.data.token && res.data.user) {
      setAuthToken(res.data.token);
      setCurrentUser(res.data.user);
    }

    return res;
  },

  async loginAsRole(role) {
    const res = await apiClient.post('/auth/demo-login', { role }, (db) => {
      const targetRole = (role || '').trim().toLowerCase();
      if (!Array.isArray(db.users)) {
        db.users = JSON.parse(JSON.stringify(initialMockData.users));
      }

      let user = db.users.find(u => u.role && u.role.toLowerCase() === targetRole);

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

    if (res && res.success && res.data && res.data.token && res.data.user) {
      setAuthToken(res.data.token);
      setCurrentUser(res.data.user);
    }

    return res;
  },

  async logout() {
    try {
      const user = getCurrentUser();
      if (user) {
        logAuditAction('Выход', `Выход пользователя ${user.fullName}`);
      }
    } catch {
    }
    setAuthToken(null);
    setCurrentUser(null);
    return { success: true };
  },


  getUser() {
    return getCurrentUser();
  }
};