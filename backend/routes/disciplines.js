import { Router } from 'express';
import { db } from '../db.js';

export const disciplinesRouter = Router();

function toDto(row) {
  return {
    id: row.id,
    code: row.code,
    name: row.name,
    semester: row.semester,
    hours: row.hours,
    controlType: row.controlType,
    department: row.department,
    teacherId: row.teacherId
  };
}

disciplinesRouter.get('/', (req, res) => {
  const { semester } = req.query;
  let sql = 'SELECT * FROM disciplines';
  const params = [];

  if (semester) {
    sql += ' WHERE semester = ?';
    params.push(parseInt(semester, 10));
  }
  sql += ' ORDER BY semester, code COLLATE NOCASE';

  const rows = db.prepare(sql).all(...params);
  res.json({ success: true, data: rows.map(toDto), errors: [], message: null });
});


disciplinesRouter.get('/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM disciplines WHERE id = ?').get(req.params.id);
  if (!row) {
    return res.json({
      success: false, data: null,
      errors: ['Дисциплина не найдена'],
      message: `Дисциплина с id="${req.params.id}" не найдена`
    });
  }
  res.json({ success: true, data: toDto(row), errors: [], message: null });
});

disciplinesRouter.post('/', (req, res) => {
  const body = req.body || {};
  const missing = ['code', 'name', 'semester', 'controlType'].filter((f) => !body[f]);
  if (missing.length > 0) {
    return res.json({
      success: false, data: null,
      errors: [`Обязательные поля: ${missing.join(', ')}`],
      message: 'Недостаточно данных для создания дисциплины'
    });
  }

  const newDisc = {
    id: `d-${Date.now()}`,
    code: body.code.trim(),
    name: body.name.trim(),
    semester: parseInt(body.semester, 10) || 1,
    hours: parseInt(body.hours, 10) || 144,
    controlType: body.controlType,
    department: body.department?.trim() || null,
    teacherId: body.teacherId || null
  };

  db.prepare(`
    INSERT INTO disciplines (id, code, name, semester, hours, controlType, department, teacherId)
    VALUES (@id, @code, @name, @semester, @hours, @controlType, @department, @teacherId)
  `).run(newDisc);

  logAudit(req, 'Создание дисциплины', `Создана дисциплина ${newDisc.name}`);
  res.json({ success: true, data: toDto(newDisc), errors: [], message: null });
});

disciplinesRouter.put('/:id', (req, res) => {
  const id = req.params.id;
  const existing = db.prepare('SELECT * FROM disciplines WHERE id = ?').get(id);
  if (!existing) {
    return res.json({
      success: false, data: null,
      errors: ['Дисциплина не найдена'],
      message: `Дисциплина с id="${id}" не найдена`
    });
  }

  const body = req.body || {};
  const updated = {
    id,
    code: body.code?.trim() ?? existing.code,
    name: body.name?.trim() ?? existing.name,
    semester: body.semester !== undefined ? parseInt(body.semester, 10) : existing.semester,
    hours: body.hours !== undefined ? parseInt(body.hours, 10) : existing.hours,
    controlType: body.controlType ?? existing.controlType,
    department: body.department !== undefined ? body.department?.trim() || null : existing.department,
    teacherId: body.teacherId !== undefined ? (body.teacherId || null) : existing.teacherId
  };

  db.prepare(`
    UPDATE disciplines
       SET code = @code, name = @name, semester = @semester,
           hours = @hours, controlType = @controlType,
           department = @department, teacherId = @teacherId
     WHERE id = @id
  `).run(updated);

  logAudit(req, 'Обновление дисциплины', `Обновлена дисциплина ${updated.name}`);
  res.json({ success: true, data: toDto(updated), errors: [], message: null });
});

disciplinesRouter.delete('/:id', (req, res) => {
  const id = req.params.id;
  const existing = db.prepare('SELECT * FROM disciplines WHERE id = ?').get(id);
  if (!existing) {
    return res.json({
      success: false, data: null,
      errors: ['Дисциплина не найдена'],
      message: `Дисциплина с id="${id}" не найдена`
    });
  }

  db.prepare('DELETE FROM disciplines WHERE id = ?').run(id);
  logAudit(req, 'Удаление дисциплины', `Удалена дисциплина ${existing.name}`);
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