import { db } from '../db.js';

function extractUserFromToken(token) {
  if (!token || typeof token !== 'string') return null;

  const fakeMatch = token.match(/^fake-token-([^-]+)-(\d+)$/);
  if (fakeMatch) {
    return db.prepare('SELECT * FROM users WHERE id = ?').get(fakeMatch[1]);
  }

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