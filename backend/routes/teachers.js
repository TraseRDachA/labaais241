import { Router } from 'express';
import { db } from '../db.js';

export const teachersRouter = Router();

function toDto(row) {
  return {
    id: row.id,
    fullName: row.fullName,
    degree: row.degree,
    department: row.department,
    email: row.email,
    phone: row.phone
  };
}

teachersRouter.get('/', (req, res) => {
  const rows = db.prepare('SELECT * FROM teachers ORDER BY fullName COLLATE NOCASE').all();
  res.json({ success: true, data: rows.map(toDto), errors: [], message: null });
});

teachersRouter.get('/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM teachers WHERE id = ?').get(req.params.id);
  if (!row) {
    return res.json({
      success: false, data: null,
      errors: ['Преподаватель не найден'],
      message: `Преподаватель с id="${req.params.id}" не найден`
    });
  }
  res.json({ success: true, data: toDto(row), errors: [], message: null });
});

teachersRouter.post('/', (req, res) => {
  const body = req.body || {};
  if (!body.fullName) {
    return res.json({
      success: false, data: null,
      errors: ['Укажите ФИО преподавателя'],
      message: 'Недостаточно данных для создания преподавателя'
    });
  }

  const newTeacher = {
    id: `t-${Date.now()}`,
    fullName: body.fullName.trim(),
    degree: body.degree?.trim() || null,
    department: body.department?.trim() || null,
    email: body.email?.trim() || null,
    phone: body.phone?.trim() || null
  };

  db.prepare(`
    INSERT INTO teachers (id, fullName, degree, department, email, phone)
    VALUES (@id, @fullName, @degree, @department, @email, @phone)
  `).run(newTeacher);

  logAudit(req, 'Создание преподавателя', `Добавлен преподаватель ${newTeacher.fullName}`);
  res.json({ success: true, data: toDto(newTeacher), errors: [], message: null });
});

teachersRouter.put('/:id', (req, res) => {
  const id = req.params.id;
  const existing = db.prepare('SELECT * FROM teachers WHERE id = ?').get(id);
  if (!existing) {
    return res.json({
      success: false, data: null,
      errors: ['Преподаватель не найден'],
      message: `Преподаватель с id="${id}" не найден`
    });
  }

  const body = req.body || {};
  const updated = {
    id,
    fullName: body.fullName?.trim() ?? existing.fullName,
    degree: body.degree !== undefined ? body.degree?.trim() || null : existing.degree,
    department: body.department !== undefined ? body.department?.trim() || null : existing.department,
    email: body.email !== undefined ? body.email?.trim() || null : existing.email,
    phone: body.phone !== undefined ? body.phone?.trim() || null : existing.phone
  };

  db.prepare(`
    UPDATE teachers
       SET fullName = @fullName, degree = @degree, department = @department,
           email = @email, phone = @phone
     WHERE id = @id
  `).run(updated);

  logAudit(req, 'Обновление преподавателя', `Обновлён преподаватель ${updated.fullName}`);
  res.json({ success: true, data: toDto(updated), errors: [], message: null });
});

teachersRouter.delete('/:id', (req, res) => {
  const id = req.params.id;
  const existing = db.prepare('SELECT * FROM teachers WHERE id = ?').get(id);
  if (!existing) {
    return res.json({
      success: false, data: null,
      errors: ['Преподаватель не найден'],
      message: `Преподаватель с id="${id}" не найден`
    });
  }

  db.prepare('DELETE FROM teachers WHERE id = ?').run(id);
  logAudit(req, 'Удаление преподавателя', `Удалён преподаватель ${existing.fullName}`);
  res.json({ success: true, data: { id }, errors: [], message: null });
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
      user.id || null, user.fullName || 'Аноним', user.role || null,
      action, details, req.ip || '127.0.0.1'
    );
  } catch (e) { console.warn('[audit] failed:', e.message); }
}