import { Router } from 'express';
import { db } from '../db.js';
import { calculateStudentStats } from './grades.js';

export const reportsRouter = Router();

reportsRouter.get('/subject', (req, res) => {
  const semester = parseInt(req.query.semester, 10);
  const { groupId, disciplineId } = req.query;

  if (!semester || !groupId || !disciplineId) {
    return res.json({
      success: false, data: null,
      errors: ['Укажите semester, groupId и disciplineId'],
      message: 'Недостаточно параметров'
    });
  }

  const group = db.prepare('SELECT * FROM groups WHERE id = ?').get(groupId);
  if (!group) {
    return res.json({
      success: false, data: null,
      errors: ['Группа не найдена'],
      message: `Группа с id="${groupId}" не существует`
    });
  }

  const discipline = db.prepare('SELECT * FROM disciplines WHERE id = ?').get(disciplineId);
  if (!discipline) {
    return res.json({
      success: false, data: null,
      errors: ['Дисциплина не найдена'],
      message: `Дисциплина с id="${disciplineId}" не существует`
    });
  }

  const teacher = db.prepare('SELECT * FROM teachers WHERE id = ?').get(discipline.teacherId);
  const controlType = discipline.controlType;

  const students = db.prepare(
    'SELECT * FROM students WHERE groupId = ? ORDER BY fullName COLLATE NOCASE'
  ).all(groupId);

  const allGrades = db.prepare(`
    SELECT * FROM grades
     WHERE semester = ? AND groupId = ? AND disciplineId = ?
  `).all(semester, groupId, disciplineId);

  const gradesByStudent = new Map(allGrades.map((g) => [g.studentId, g]));

  const rows = students.map((st, idx) => {
    const grade = gradesByStudent.get(st.id) || {
      lab1: '', lab2: '', lab3: '', lab4: '', cw: '', test: '', exam: ''
    };
    const stats = calculateStudentStats(grade, controlType);

    return {
      num: idx + 1,
      studentName: st.fullName,
      studentCard: st.studentCardNumber,
      lab1: grade.lab1 || '—',
      lab2: grade.lab2 || '—',
      lab3: grade.lab3 || '—',
      lab4: grade.lab4 || '—',
      cw: grade.cw || '—',
      test: grade.test || '—',
      exam: grade.exam || '—',
      finalScore: stats.finalScore,
      isAdmitted: stats.isAdmitted ? 'Допущен' : 'Не допущен'
    };
  });

  logAudit(req, 'Формирование отчета',
    `Сформирована ведомость: ${discipline.name} (${group.code})`);

  res.json({
    success: true,
    data: {
      semester,
      groupCode: group.code,
      groupSpecialty: group.specialty,
      disciplineName: discipline.name,
      controlType,
      teacherName: teacher ? teacher.fullName : 'Не назначен',
      date: new Date().toLocaleDateString('ru-RU'),
      rows
    },
    errors: [],
    message: null
  });
});


reportsRouter.get('/debtors', (req, res) => {
  const students = db.prepare('SELECT * FROM students').all();
  const disciplines = db.prepare('SELECT * FROM disciplines').all();
  const discById = new Map(disciplines.map((d) => [d.id, d]));

  const allGrades = db.prepare('SELECT * FROM grades').all();


  const gradesByStudent = new Map();
  for (const g of allGrades) {
    if (!gradesByStudent.has(g.studentId)) {
      gradesByStudent.set(g.studentId, []);
    }
    gradesByStudent.get(g.studentId).push(g);
  }

  const debtors = [];

  for (const st of students) {
    const studentDebts = [];
    const grades = gradesByStudent.get(st.id) || [];

    for (const g of grades) {
      const disc = discById.get(g.disciplineId);
      const discName = disc ? disc.name : 'Дисциплина';

      // Долг: оценка 2 / Незач / недопуск
      if (g.exam === 2 || g.exam === '2' || g.exam === 'Незач') {
        studentDebts.push({
          disciplineName: discName,
          type: 'Итоговая аттестация',
          reason: `Оценка: ${g.exam}`
        });
      } else if (
        (g.lab1 === 2 || g.lab2 === 2 || g.lab3 === 2 || g.lab4 === 2 || g.test === 2 || g.cw === 2)
      ) {
        studentDebts.push({
          disciplineName: discName,
          type: 'Текущий контроль',
          reason: 'Есть неудовлетворительные оценки'
        });
      } else if (!g.isAdmitted && (g.lab1 || g.lab2 || g.test)) {
        studentDebts.push({
          disciplineName: discName,
          type: 'Допуск',
          reason: 'Не получен допуск'
        });
      }
    }

    if (studentDebts.length > 0 || st.status === 'Отчислен') {
      debtors.push({
        id: st.id,
        fullName: st.fullName,
        groupCode: st.groupCode,
        studentCard: st.studentCardNumber,
        status: st.status,
        phone: st.phone,
        debts: studentDebts
      });
    }
  }

  logAudit(req, 'Формирование отчета', 'Сформирован список академических должников');

  res.json({ success: true, data: debtors, errors: [], message: null });
});


reportsRouter.get('/quality', (req, res) => {
  const allGrades = db.prepare('SELECT * FROM grades').all();

  let totalGrades = 0;
  let count5 = 0;
  let count4 = 0;
  let count3 = 0;
  let count2 = 0;

  for (const g of allGrades) {
    const score = g.finalScore;
    if (score && score > 0) {
      totalGrades++;
      if (score >= 4.5) count5++;
      else if (score >= 3.5) count4++;
      else if (score >= 2.5) count3++;
      else count2++;
    }
  }

  const qualityPercent = totalGrades > 0
    ? parseFloat((((count5 + count4) / totalGrades) * 100).toFixed(1))
    : 0;
  const successPercent = totalGrades > 0
    ? parseFloat((((count5 + count4 + count3) / totalGrades) * 100).toFixed(1))
    : 0;

  const groupsCount = db.prepare('SELECT COUNT(*) AS c FROM groups').get().c;
  const studentsCount = db.prepare('SELECT COUNT(*) AS c FROM students').get().c;

  res.json({
    success: true,
    data: {
      totalGrades,
      count5,
      count4,
      count3,
      count2,
      qualityPercent,
      successPercent,
      groupsCount,
      studentsCount
    },
    errors: [],
    message: null
  });
});

function makeCsvResponse(res, filename, headers, rows) {
  const bom = '\uFEFF';
  const content = bom + [
    headers.join(';'),
    ...rows.map((row) => row.map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(';'))
  ].join('\r\n');

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}.csv"`);
  res.send(content);
}

reportsRouter.get('/export/subject', (req, res) => {
  const semester = parseInt(req.query.semester, 10);
  const { groupId, disciplineId } = req.query;

  if (!semester || !groupId || !disciplineId) {
    return res.status(400).send('Недостаточно параметров для экспорта');
  }

  const group = db.prepare('SELECT * FROM groups WHERE id = ?').get(groupId);
  const discipline = db.prepare('SELECT * FROM disciplines WHERE id = ?').get(disciplineId);
  const students = db.prepare('SELECT * FROM students WHERE groupId = ? ORDER BY fullName COLLATE NOCASE').all(groupId);
  const allGrades = db.prepare('SELECT * FROM grades WHERE semester = ? AND groupId = ? AND disciplineId = ?').all(semester, groupId, disciplineId);
  const gradesByStudent = new Map(allGrades.map((g) => [g.studentId, g]));

  const headers = ['№', 'ФИО Студента', 'Номер зачетки', 'Лаб 1', 'Лаб 2', 'Лаб 3', 'Лаб 4', 'КР', 'Тест', discipline?.controlType || 'Аттестация', 'Итог балл', 'Статус допуска'];
  const rows = students.map((st, idx) => {
    const g = gradesByStudent.get(st.id) || {};
    const stats = calculateStudentStats(g, discipline?.controlType);
    return [
      idx + 1,
      st.fullName,
      st.studentCardNumber,
      g.lab1 || '—',
      g.lab2 || '—',
      g.lab3 || '—',
      g.lab4 || '—',
      g.cw || '—',
      g.test || '—',
      g.exam || '—',
      stats.finalScore,
      stats.isAdmitted ? 'Допущен' : 'Не допущен'
    ];
  });

  const filename = `Ведомость_${group ? group.code : 'Группа'}_${discipline ? discipline.name : 'Предмет'}_сем${semester}`;
  makeCsvResponse(res, filename, headers, rows);
});

reportsRouter.get('/export/debtors', (req, res) => {
  const students = db.prepare('SELECT * FROM students').all();
  const disciplines = db.prepare('SELECT * FROM disciplines').all();
  const discById = new Map(disciplines.map((d) => [d.id, d]));
  const allGrades = db.prepare('SELECT * FROM grades').all();

  const gradesByStudent = new Map();
  for (const g of allGrades) {
    if (!gradesByStudent.has(g.studentId)) gradesByStudent.set(g.studentId, []);
    gradesByStudent.get(g.studentId).push(g);
  }

  const headers = ['ФИО Студента', 'Группа', 'Номер зачетки', 'Статус обучения', 'Телефон', 'Дисциплина долга', 'Тип контроля', 'Причина'];
  const rows = [];

  for (const st of students) {
    const grades = gradesByStudent.get(st.id) || [];
    let hasDebt = false;

    for (const g of grades) {
      const disc = discById.get(g.disciplineId);
      const discName = disc ? disc.name : 'Дисциплина';

      if (g.exam === 2 || g.exam === '2' || g.exam === 'Незач') {
        rows.push([st.fullName, st.groupCode, st.studentCardNumber, st.status, st.phone || '—', discName, 'Итоговая аттестация', `Оценка: ${g.exam}`]);
        hasDebt = true;
      } else if (g.lab1 === 2 || g.lab2 === 2 || g.lab3 === 2 || g.lab4 === 2 || g.test === 2 || g.cw === 2) {
        rows.push([st.fullName, st.groupCode, st.studentCardNumber, st.status, st.phone || '—', discName, 'Текущий контроль', 'Неудовлетворительная оценка']);
        hasDebt = true;
      }
    }

    if (!hasDebt && st.status === 'Отчислен') {
      rows.push([st.fullName, st.groupCode, st.studentCardNumber, st.status, st.phone || '—', '—', '—', 'Отчислен приказом']);
    }
  }

  makeCsvResponse(res, 'Список_академических_должников', headers, rows);
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