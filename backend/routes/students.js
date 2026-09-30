import { Router } from 'express';
import { db } from '../db.js';

export const studentsRouter = Router();

// Преобразование строки из БД в DTO для фронта
function toDto(row) {
  if (!row) return null;
  return {
    id: row.id,
    fullName: row.fullName,
    studentCardNumber: row.studentCardNumber,
    groupId: row.groupId,
    groupCode: row.groupCode,
    email: row.email,
    phone: row.phone,
    status: row.status,
    budget: row.budget === 1,
    gpa: row.gpa
  };
}


studentsRouter.get('/', (req, res) => {
  const { search, groupId, status } = req.query;

  let sql = 'SELECT * FROM students WHERE 1=1';
  const params = [];

  if (groupId) {
    sql += ' AND groupId = ?';
    params.push(groupId);
  }

  if (status) {
    sql += ' AND status = ?';
    params.push(status);
  }

  sql += ' ORDER BY fullName COLLATE NOCASE';

  let rows = db.prepare(sql).all(...params);


  if (search) {
    const q = search.trim().toLowerCase();
    rows = rows.filter((row) => {
      const fullName = (row.fullName || '').toLowerCase();
      const cardNumber = (row.studentCardNumber || '').toLowerCase();
      const groupCode = (row.groupCode || '').toLowerCase();
      return fullName.includes(q) || cardNumber.includes(q) || groupCode.includes(q);
    });
  }

  res.json({
    success: true,
    data: rows.map(toDto),
    errors: [],
    message: null
  });
});

studentsRouter.get('/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM students WHERE id = ?').get(req.params.id);
  if (!row) {
    return res.json({
      success: false,
      data: null,
      errors: ['Студент не найден'],
      message: `Студент с id="${req.params.id}" не найден`
    });
  }
  res.json({ success: true, data: toDto(row), errors: [], message: null });
});


studentsRouter.post('/', (req, res) => {
  const body = req.body || {};
  const required = ['fullName', 'studentCardNumber', 'groupId'];
  const missing = required.filter((f) => !body[f]);

  if (missing.length > 0) {
    return res.json({
      success: false,
      data: null,
      errors: [`Обязательные поля: ${missing.join(', ')}`],
      message: 'Недостаточно данных для создания студента'
    });
  }

  const group = db.prepare('SELECT * FROM groups WHERE id = ?').get(body.groupId);
  if (!group) {
    return res.json({
      success: false,
      data: null,
      errors: ['Группа не найдена'],
      message: `Группа с id="${body.groupId}" не существует`
    });
  }

  const newId = `s-${Date.now()}`;
  const newStudent = {
    id: newId,
    fullName: body.fullName.trim(),
    groupId: body.groupId,
    groupCode: group.code,
    studentCardNumber: body.studentCardNumber.trim(),
    email: body.email?.trim() || null,
    phone: body.phone?.trim() || null,
    status: body.status || 'Учится',
    budget: body.budget ? 1 : 0,
    gpa: body.gpa ?? 0
  };

  db.prepare(`
    INSERT INTO students (id, fullName, groupId, groupCode, studentCardNumber, email, phone, status, budget, gpa)
    VALUES (@id, @fullName, @groupId, @groupCode, @studentCardNumber, @email, @phone, @status, @budget, @gpa)
  `).run(newStudent);

  db.prepare('UPDATE groups SET studentCount = studentCount + 1 WHERE id = ?').run(body.groupId);
  logAudit(req, 'Создание студента', `Добавлен студент ${newStudent.fullName} (${newStudent.groupCode})`);

  res.json({
    success: true,
    data: toDto(newStudent),
    errors: [],
    message: null
  });
});


studentsRouter.put('/:id', (req, res) => {
  const id = req.params.id;
  const existing = db.prepare('SELECT * FROM students WHERE id = ?').get(id);
  if (!existing) {
    return res.json({
      success: false,
      data: null,
      errors: ['Студент не найден'],
      message: `Студент с id="${id}" не найден`
    });
  }

  const body = req.body || {};
  const group = body.groupId
    ? db.prepare('SELECT * FROM groups WHERE id = ?').get(body.groupId)
    : null;

  const updated = {
    id,
    fullName: body.fullName?.trim() ?? existing.fullName,
    groupId: body.groupId ?? existing.groupId,
    groupCode: group ? group.code : existing.groupCode,
    studentCardNumber: body.studentCardNumber?.trim() ?? existing.studentCardNumber,
    email: body.email !== undefined ? (body.email?.trim() || null) : existing.email,
    phone: body.phone !== undefined ? (body.phone?.trim() || null) : existing.phone,
    status: body.status ?? existing.status,
    budget: body.budget !== undefined ? (body.budget ? 1 : 0) : existing.budget,
    gpa: body.gpa ?? existing.gpa
  };


  if (existing.groupId !== updated.groupId) {
    db.prepare('UPDATE groups SET studentCount = MAX(0, studentCount - 1) WHERE id = ?').run(existing.groupId);
    db.prepare('UPDATE groups SET studentCount = studentCount + 1 WHERE id = ?').run(updated.groupId);
  }

  db.prepare(`
    UPDATE students
       SET fullName = @fullName,
           groupId = @groupId,
           groupCode = @groupCode,
           studentCardNumber = @studentCardNumber,
           email = @email,
           phone = @phone,
           status = @status,
           budget = @budget,
           gpa = @gpa
     WHERE id = @id
  `).run(updated);

  logAudit(req, 'Обновление студента', `Обновлены данные студента ${updated.fullName}`);

  res.json({
    success: true,
    data: toDto(updated),
    errors: [],
    message: null
  });
});


studentsRouter.delete('/:id', (req, res) => {
  const id = req.params.id;
  const existing = db.prepare('SELECT * FROM students WHERE id = ?').get(id);
  if (!existing) {
    return res.json({
      success: false,
      data: null,
      errors: ['Студент не найден'],
      message: `Студент с id="${id}" не найден`
    });
  }

  db.prepare('DELETE FROM students WHERE id = ?').run(id);
  db.prepare('DELETE FROM grades WHERE studentId = ?').run(id);
  db.prepare('UPDATE groups SET studentCount = MAX(0, studentCount - 1) WHERE id = ?').run(existing.groupId);

  logAudit(req, 'Удаление студента', `Удалён студент ${existing.fullName} (${existing.groupCode})`);

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
      user.id || null,
      user.fullName || 'Аноним',
      user.role || null,
      action,
      details,
      req.ip || '127.0.0.1'
    );
  } catch (e) {
    console.warn('[audit] failed:', e.message);
  }
}