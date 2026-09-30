import { db } from '../db.js';

function extractUserFromToken(token) {
  if (!token || typeof token !== 'string') return null;

  // Поддержка токенов: fake-token-<id>-<timestamp> и fake-jwt-token-for-<id>-<timestamp>
  const fakeMatch = token.match(/^fake-(?:jwt-)?token-(?:for-)?(.+)-(\d+)$/);
  if (fakeMatch) {
    return db.prepare('SELECT * FROM users WHERE id = ?').get(fakeMatch[1]);
  }

  // Поддержка demo-токенов: demo-token-<role>-<timestamp>
  const demoMatch = token.match(/^demo-token-([a-z]+)-(\d+)$/);
  if (demoMatch) {
    return db.prepare('SELECT * FROM users WHERE LOWER(role) = LOWER(?) LIMIT 1').get(demoMatch[1]);
  }

  return null;
}

export function attachUser(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice(7).trim();
    const user = extractUserFromToken(token);
    if (user) {
      const { password, ...safeUser } = user;
      req.user = safeUser;
    }
  }
  next();
}

export function requireAuth(req, res, next) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      data: null,
      errors: ['Требуется авторизация'],
      message: 'Вы не авторизованы для выполнения этого действия'
    });
  }
  next();
}

export function requireRole(allowedRoles = []) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        data: null,
        errors: ['Требуется авторизация'],
        message: 'Вы не авторизованы'
      });
    }

    const role = (req.user.role || '').toLowerCase();
    const normalized = allowedRoles.map(r => r.toLowerCase());
    if (!normalized.includes(role)) {
      return res.status(403).json({
        success: false,
        data: null,
        errors: ['Недостаточно прав доступа'],
        message: `Действие запрещено для роли "${req.user.roleName || req.user.role}"`
      });
    }
    next();
  };
}