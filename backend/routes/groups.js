import { Router } from 'express';
import { db } from '../db.js';

export const groupsRouter = Router();

function toDto(row) {
  return {
    id: row.id,
    code: row.code,
    course: row.course,
    faculty: row.faculty,
    specialty: row.specialty,
    curator: row.curator,
    studentCount: row.studentCount
  };
}


groupsRouter.get('/', (req, res) => {
  const rows = db.prepare('SELECT * FROM groups ORDER BY code COLLATE NOCASE').all();
  res.json({ success: true, data: rows.map(toDto), errors: [], message: null });
});

groupsRouter.get('/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM groups WHERE id = ?').get(req.params.id);
  if (!row) {
    return res.json({
      success: false, data: null,
      errors: ['Группа не найдена'],
      message: `Группа с id="${req.params.id}" не найдена`
    });
  }
  res.json({ success: true, data: toDto(row), errors: [], message: null });
});

groupsRouter.post('/', (req, res) => {
  const body = req.body || {};
  const missing = ['code', 'course', 'specialty'].filter((f) => !body[f]);
  if (missing.length > 0) {
    return res.json({
      success: false, data: null,
      errors: [`Обязательные поля: ${missing.join(', ')}`],
      message: 'Недостаточно данных для создания группы'
    });
  }

  const exists = db.prepare('SELECT id FROM groups WHERE code = ?').get(body.code.trim());
  if (exists) {
    return res.json({
      success: false, data: null,
      errors: ['Группа с таким шифром уже существует'],
      message: `Группа "${body.code}" уже есть в системе`
    });
  }

  const newGroup = {
    id: `g-${Date.now()}`,
    code: body.code.trim(),
    course: parseInt(body.course, 10) || 1,
    faculty: body.faculty?.trim() || null,
    specialty: body.specialty.trim(),
    curator: body.curator?.trim() || null,
    studentCount: 0
  };

  db.prepare(`
    INSERT INTO groups (id, code, course, faculty, specialty, curator, studentCount)
    VALUES (@id, @code, @course, @faculty, @specialty, @curator, @studentCount)
  `).run(newGroup);

  logAudit(req, 'Создание группы', `Создана группа ${newGroup.code}`);

  res.json({ success: true, data: toDto(newGroup), errors: [], message: null });
});

groupsRouter.put('/:id', (req, res) => {
  const id = req.params.id;
  const existing = db.prepare('SELECT * FROM groups WHERE id = ?').get(id);
  if (!existing) {
    return res.json({
      success: false, data: null,
      errors: ['Группа не найдена'],
      message: `Группа с id="${id}" не найдена`
    });
  }

  const body = req.body || {};
  const updated = {
    id,
    code: body.code?.trim() ?? existing.code,
    course: body.course !== undefined ? parseInt(body.course, 10) : existing.course,
    faculty: body.faculty !== undefined ? body.faculty?.trim() || null : existing.faculty,
    specialty: body.specialty?.trim() ?? existing.specialty,
    curator: body.curator !== undefined ? body.curator?.trim() || null : existing.curator,
    studentCount: existing.studentCount
  };

  db.prepare(`
    UPDATE groups
       SET code = @code, course = @course, faculty = @faculty,
           specialty = @specialty, curator = @curator
     WHERE id = @id
  `).run(updated);

  if (existing.code !== updated.code) {
    db.prepare('UPDATE students SET groupCode = ? WHERE groupId = ?').run(updated.code, id);
  }

  logAudit(req, 'Обновление группы', `Обновлена группа ${updated.code}`);

  res.json({ success: true, data: toDto(updated), errors: [], message: null });
});

groupsRouter.delete('/:id', (req, res) => {
  const id = req.params.id;
  const existing = db.prepare('SELECT * FROM groups WHERE id = ?').get(id);
  if (!existing) {
    return res.json({
      success: false, data: null,
      errors: ['Группа не найдена'],
      message: `Группа с id="${id}" не найдена`
    });
  }

  db.prepare('DELETE FROM groups WHERE id = ?').run(id);
  logAudit(req, 'Удаление группы', `Удалена группа ${existing.code}`);

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