import { Router } from 'express';
import { db } from '../db.js';
import bcrypt from 'bcryptjs';

export const adminRouter = Router();

function toUserDto(row) {
  if (!row) return null;
  const { password, ...safe } = row;
  return safe;
}

adminRouter.get('/users', (req, res) => {
  const users = db.prepare('SELECT * FROM users ORDER BY fullName COLLATE NOCASE').all();
  res.json({ success: true, data: users.map(toUserDto), errors: [], message: null });
});

adminRouter.post('/users', (req, res) => {
  const body = req.body || {};
  const required = ['username', 'password', 'fullName', 'role'];
  const missing = required.filter((f) => !body[f]);

  if (missing.length > 0) {
    return res.json({
      success: false, data: null,
      errors: [`Обязательные поля: ${missing.join(', ')}`],
      message: 'Недостаточно данных для создания пользователя'
    });
  }

  const exists = db.prepare('SELECT id FROM users WHERE LOWER(username) = LOWER(?)').get(body.username.trim());
  if (exists) {
    return res.json({
      success: false, data: null,
      errors: ['Логин уже занят'],
      message: `Пользователь с логином "${body.username}" уже существует`
    });
  }

  const roleNames = {
    admin: 'Системный администратор',
    dean: 'Сотрудник деканата',
    teacher: 'Преподаватель',
    student: 'Студент'
  };

  const newUser = {
    id: `u-${Date.now()}`,
    username: body.username.trim(),
    password: bcrypt.hashSync(body.password, 10),
    fullName: body.fullName.trim(),
    role: body.role,
    roleName: roleNames[body.role] || body.role,
    email: body.email?.trim() || null,
    avatar: body.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${body.username.trim()}`,
    department: body.department?.trim() || null,
    teacherId: body.teacherId || null,
    studentId: body.studentId || null,
    groupCode: body.groupCode || null,
    createdAt: new Date().toISOString()
  };

  db.prepare(`
    INSERT INTO users (id, username, password, fullName, role, roleName, email, avatar, department, teacherId, studentId, groupCode, createdAt)
    VALUES (@id, @username, @password, @fullName, @role, @roleName, @email, @avatar, @department, @teacherId, @studentId, @groupCode, @createdAt)
  `).run(newUser);

  logAudit(req, 'Создание пользователя', `Создан пользователь ${newUser.fullName} (${newUser.roleName})`);

  res.json({ success: true, data: toUserDto(newUser), errors: [], message: null });
});

adminRouter.put('/users/:id', (req, res) => {
  const id = req.params.id;
  const existing = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
  if (!existing) {
    return res.json({
      success: false, data: null,
      errors: ['Пользователь не найден'],
      message: `Пользователь с id="${id}" не найден`
    });
  }

  const body = req.body || {};
  const roleNames = {
    admin: 'Системный администратор',
    dean: 'Сотрудник деканата',
    teacher: 'Преподаватель',
    student: 'Студент'
  };

  const newRole = body.role ?? existing.role;

  const updated = {
    id,
    username: existing.username, 
    password: body.password?.trim()
    ? bcrypt.hashSync(body.password.trim(), 10)
    : existing.password,
    fullName: body.fullName?.trim() ?? existing.fullName,
    role: newRole,
    roleName: roleNames[newRole] || newRole,
    email: body.email !== undefined ? (body.email?.trim() || null) : existing.email,
    avatar: body.avatar ?? existing.avatar,
    department: body.department !== undefined ? (body.department?.trim() || null) : existing.department,
    teacherId: body.teacherId !== undefined ? (body.teacherId || null) : existing.teacherId,
    studentId: body.studentId !== undefined ? (body.studentId || null) : existing.studentId,
    groupCode: body.groupCode !== undefined ? (body.groupCode || null) : existing.groupCode,
    createdAt: existing.createdAt
  };

  db.prepare(`
    UPDATE users
       SET password = @password, fullName = @fullName, role = @role, roleName = @roleName,
           email = @email, avatar = @avatar, department = @department,
           teacherId = @teacherId, studentId = @studentId, groupCode = @groupCode
     WHERE id = @id
  `).run(updated);

  logAudit(req, 'Редактирование пользователя', `Обновлён пользователь ${updated.fullName}`);

  res.json({ success: true, data: toUserDto(updated), errors: [], message: null });
});

adminRouter.delete('/users/:id', (req, res) => {
  const id = req.params.id;

  const currentUser = req.user || {};
  if (currentUser.id === id) {
    return res.json({
      success: false, data: null,
      errors: ['Нельзя удалить свою учетную запись'],
      message: 'Удаление собственного профиля запрещено'
    });
  }

  const existing = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
  if (!existing) {
    return res.json({
      success: false, data: null,
      errors: ['Пользователь не найден'],
      message: `Пользователь с id="${id}" не найден`
    });
  }

  db.prepare('DELETE FROM users WHERE id = ?').run(id);
  logAudit(req, 'Удаление пользователя', `Удалён пользователь ${existing.fullName} (${existing.username})`);

  res.json({ success: true, data: { id }, errors: [], message: null });
});

adminRouter.get('/audit-logs', (req, res) => {
  const limit = Math.min(parseInt(req.query.limit, 10) || 50, 200);
  const logs = db.prepare(`
    SELECT * FROM auditLogs
     ORDER BY timestamp DESC
     LIMIT ?
  `).all(limit);

  const dto = logs.map((l) => ({
    id: l.id,
    timestamp: l.timestamp,
    userId: l.userId,
    userName: l.userName,
    userRole: l.role,
    action: l.action,
    details: l.details,
    ipAddress: l.ipAddress
  }));

  res.json({ success: true, data: dto, errors: [], message: null });
});

adminRouter.delete('/audit-logs', (req, res) => {
  db.prepare('DELETE FROM auditLogs').run();
  logAudit(req, 'Очистка журнала', 'Журнал аудита очищен');
  res.json({ success: true, data: { cleared: true }, errors: [], message: null });
});

function logAudit(req, action, details) {
  try {
    const user = req.user || {};
    db.prepare(`
      INSERT INTO auditLogs (id, timestamp, userId, userName, role, action, details, ipAddress)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      `log-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      new Date().toISOString(),
      user.id || null,
      user.fullName || 'Аноним',
      user.role || null,
      action,
      details,
      req.ip || '127.0.0.1'
    );
  } catch (e) { console.warn('[audit] failed:', e.message); }
}