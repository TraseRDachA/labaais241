import { Router } from 'express';
import { db } from '../db.js';
import bcrypt from 'bcryptjs';

export const authRouter = Router();


function makeToken(user) {
  return `fake-token-${user.id}-${Date.now()}`;
}


authRouter.post('/login', (req, res) => {
  const { username, password } = req.body || {};

  if (!username || !password) {
    return res.json({
      success: false,
      data: null,
      errors: ['Укажите логин и пароль'],
      message: 'Недостаточно данных для входа'
    });
  }

  const user = db
    .prepare('SELECT * FROM users WHERE LOWER(username) = LOWER(?)')
    .get(username.trim());

  if (!user) {
    return res.json({
      success: false,
      data: null,
      errors: ['Пользователь не найден'],
      message: `Пользователь с логином "${username}" не найден`
    });
  }

const isHashed = user.password.startsWith('$2a$') || user.password.startsWith('$2b$') || user.password.startsWith('$2y$');

const passwordValid = isHashed
  ? bcrypt.compareSync(password, user.password)
  : user.password === password;

if (!passwordValid) {
  return res.json({
    success: false,
    data: null,
    errors: ['Неверный пароль'],
    message: 'Неверный пароль'
  });
}
  const token = makeToken(user);

  // Логируем вход в audit
  db.prepare(`
    INSERT INTO auditLogs (id, timestamp, userId, userName, role, action, details, ipAddress)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    `log-${Date.now()}`,
    new Date().toISOString(),
    user.id,
    user.fullName,
    user.role,
    'Авторизация',
    `Вход пользователя ${user.fullName} (${user.roleName || user.role})`,
    req.ip || '127.0.0.1'
  );


  const { password: _pw, ...safeUser } = user;

  return res.json({
    success: true,
    data: { token, user: safeUser },
    errors: [],
    message: null
  });
});

authRouter.post('/demo-login', (req, res) => {
  const { role } = req.body || {};

  if (!role) {
    return res.json({
      success: false,
      data: null,
      errors: ['Укажите роль'],
      message: 'Не указана роль для демо-входа'
    });
  }

  const user = db
    .prepare('SELECT * FROM users WHERE LOWER(role) = LOWER(?) LIMIT 1')
    .get(role.trim());

  if (!user) {
    return res.json({
      success: false,
      data: null,
      errors: ['Роль не найдена'],
      message: `Профиль с ролью "${role}" не найден в системе`
    });
  }

  const token = makeToken(user);

  db.prepare(`
    INSERT INTO auditLogs (id, timestamp, userId, userName, role, action, details, ipAddress)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    `log-${Date.now()}`,
    new Date().toISOString(),
    user.id,
    user.fullName,
    user.role,
    'Быстрый вход',
    `Демо-вход в роли ${user.roleName || user.role}`,
    req.ip || '127.0.0.1'
  );

  const { password: _pw, ...safeUser } = user;

  return res.json({
    success: true,
    data: { token, user: safeUser },
    errors: [],
    message: null
  });
});