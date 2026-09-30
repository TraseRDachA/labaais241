import { initialMockData } from './mockData.js';

export const USE_MOCK = false;
const API_BASE_URL = typeof window !== 'undefined' && (window.location.port === '3000' || window.location.pathname.startsWith('/api'))
  ? '/api/v1'
  : 'http://localhost:5000/api/v1';
const DB_STORAGE_KEY = 'student_portal_db_v2';
const AUTH_TOKEN_KEY = 'student_portal_token';
const AUTH_USER_KEY = 'student_portal_user';

function initMockDb() {
  const existing = localStorage.getItem(DB_STORAGE_KEY);
  let db = null;
  if (existing) {
    try {
      db = JSON.parse(existing);
    } catch {
      db = null;
    }
  }

  if (!db || typeof db !== 'object') {
    db = JSON.parse(JSON.stringify(initialMockData));
    localStorage.setItem(DB_STORAGE_KEY, JSON.stringify(db));
    return db;
  }

  let modified = false;
  if (!Array.isArray(db.users) || db.users.length < 4) {
    db.users = JSON.parse(JSON.stringify(initialMockData.users));
    modified = true;
  }
  if (!Array.isArray(db.groups) || db.groups.length === 0) {
    db.groups = JSON.parse(JSON.stringify(initialMockData.groups));
    modified = true;
  }
  if (!Array.isArray(db.students) || db.students.length === 0) {
    db.students = JSON.parse(JSON.stringify(initialMockData.students));
    modified = true;
  }
  if (!Array.isArray(db.disciplines) || db.disciplines.length === 0) {
    db.disciplines = JSON.parse(JSON.stringify(initialMockData.disciplines));
    modified = true;
  }
  if (!Array.isArray(db.teachers) || db.teachers.length === 0) {
    db.teachers = JSON.parse(JSON.stringify(initialMockData.teachers));
    modified = true;
  }
  if (!db.grades || typeof db.grades !== 'object') {
    db.grades = JSON.parse(JSON.stringify(initialMockData.grades));
    modified = true;
  }
  if (!Array.isArray(db.auditLogs)) {
    db.auditLogs = JSON.parse(JSON.stringify(initialMockData.auditLogs || []));
    modified = true;
  }

  if (modified) {
    localStorage.setItem(DB_STORAGE_KEY, JSON.stringify(db));
  }

  return db;
}

export function getMockDb() {
  return initMockDb();
}

export function saveMockDb(db) {
  if (db && typeof db === 'object') {
    localStorage.setItem(DB_STORAGE_KEY, JSON.stringify(db));
  }
}

// Задержка имитации сети
function delay(ms = 180) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Запись действия в аудит-лог
export function logAuditAction(action, details) {
  try {
    const db = getMockDb();
    const currentUser = getCurrentUser();
    const newLog = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      userId: currentUser ? currentUser.id : "anonymous",
      userName: currentUser ? currentUser.fullName : "Аноним",
      role: currentUser ? currentUser.role : "none",
      action,
      details,
      ipAddress: "127.0.0.1"
    };
    if (!Array.isArray(db.auditLogs)) {
      db.auditLogs = [];
    }
    db.auditLogs.unshift(newLog);
    if (db.auditLogs.length > 50) db.auditLogs.pop();
    saveMockDb(db);
  } catch (err) {
    console.warn('logAuditAction non-fatal warning:', err);
  }
}

export function getAuthToken() {
  return localStorage.getItem(AUTH_TOKEN_KEY);
}

export function setAuthToken(token) {
  if (token) {
    localStorage.setItem(AUTH_TOKEN_KEY, token);
  } else {
    localStorage.removeItem(AUTH_TOKEN_KEY);
  }
}

export function getCurrentUser() {
  const userStr = localStorage.getItem(AUTH_USER_KEY);
  if (!userStr) return null;
  try {
    return JSON.parse(userStr);
  } catch {
    return null;
  }
}

export function setCurrentUser(user) {
  if (user) {
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(AUTH_USER_KEY);
  }
}

async function request(endpoint, options = {}) {
  const token = getAuthToken();
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  let response;
  try {
    response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers
    });
  } catch (err) {
    if (err.message?.includes('Failed to fetch') || err.message?.includes('NetworkError') || err.message?.includes('fetch failed')) {
      throw new Error('Бэкенд недоступен (порт 5000). Запустите сервер: npm run server');
    }
    throw err;
  }

  if (response.status === 401) {
    setAuthToken(null);
    setCurrentUser(null);
    if (window.location.hash !== '#/login') {
      window.location.hash = '#/login';
    }
    throw new Error('Сессия завершена или недействительна. Пожалуйста, выполните вход.');
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Ошибка сервера: ${response.status}`);
  }

  return await response.json();
}

export const apiClient = {
  async get(endpoint, mockHandler) {
    if (USE_MOCK) {
      await delay(150);
      try {
        const result = mockHandler ? mockHandler(getMockDb()) : null;
        return { success: true, data: result, errors: [], message: null };
      } catch (err) {
        return { success: false, data: null, errors: [err.message], message: err.message };
      }
    }
    return request(endpoint, { method: 'GET' });
  },

  async post(endpoint, body, mockHandler) {
    if (USE_MOCK) {
      await delay(180);
      try {
        const db = getMockDb();
        const result = mockHandler ? mockHandler(db, body) : body;
        saveMockDb(db);
        return { success: true, data: result, errors: [], message: null };
      } catch (err) {
        return { success: false, data: null, errors: [err.message], message: err.message };
      }
    }
    return request(endpoint, {
      method: 'POST',
      body: JSON.stringify(body)
    });
  },

  async put(endpoint, body, mockHandler) {
    if (USE_MOCK) {
      await delay(180);
      try {
        const db = getMockDb();
        const result = mockHandler ? mockHandler(db, body) : body;
        saveMockDb(db);
        return { success: true, data: result, errors: [], message: null };
      } catch (err) {
        return { success: false, data: null, errors: [err.message], message: err.message };
      }
    }
    return request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(body)
    });
  },

  async delete(endpoint, mockHandler) {
    if (USE_MOCK) {
      await delay(150);
      try {
        const db = getMockDb();
        const result = mockHandler ? mockHandler(db) : { success: true };
        saveMockDb(db);
        return { success: true, data: result, errors: [], message: null };
      } catch (err) {
        return { success: false, data: null, errors: [err.message], message: err.message };
      }
    }
    return request(endpoint, { method: 'DELETE' });
  }
};
