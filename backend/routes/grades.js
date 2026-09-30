import { Router } from 'express';
import { db } from '../db.js';

export const gradesRouter = Router();


export function calculateStudentStats(entry, controlType = 'Экзамен') {
  const scores = [];
  let hasFailed = false;

  const numericFields = ['lab1', 'lab2', 'lab3', 'lab4', 'cw', 'test', 'exam'];

  numericFields.forEach((field) => {
    const val = entry[field];
    if (val === undefined || val === null || val === '') return;

    if (val === 'Зач') {
      scores.push(5);
    } else if (val === 'Незач') {
      scores.push(2);
      hasFailed = true;
    } else {
      const num = parseFloat(val);
      if (!isNaN(num)) {
        scores.push(num);
        if (num < 3) hasFailed = true;
      }
    }
  });

  const finalScore = scores.length > 0
    ? parseFloat((scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(2))
    : 0;

  const isAdmitted = !hasFailed && scores.length >= 3 && finalScore >= 3.0;

  return { finalScore, isAdmitted };
}


function toJournalDto(gradeRow, student) {
  return {
    studentId: gradeRow.studentId,
    studentName: student ? student.fullName : 'Неизвестный студент',
    studentCardNumber: student ? student.studentCardNumber : '—',
    studentStatus: student ? student.status : 'Учится',
    lab1: gradeRow.lab1 ?? '',
    lab2: gradeRow.lab2 ?? '',
    lab3: gradeRow.lab3 ?? '',
    lab4: gradeRow.lab4 ?? '',
    cw: gradeRow.cw ?? '',
    test: gradeRow.test ?? '',
    exam: gradeRow.exam ?? '',
    finalScore: gradeRow.finalScore ?? 0,
    isAdmitted: gradeRow.isAdmitted === 1
  };
}


gradesRouter.get('/', (req, res) => {
  const semester = parseInt(req.query.semester, 10);
  const { groupId, disciplineId } = req.query;

  if (!semester || !groupId || !disciplineId) {
    return res.json({
      success: false, data: null,
      errors: ['Укажите semester, groupId и disciplineId'],
      message: 'Недостаточно параметров для загрузки журнала'
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

  const controlType = discipline.controlType;


  const students = db.prepare(
    'SELECT * FROM students WHERE groupId = ? ORDER BY fullName COLLATE NOCASE'
  ).all(groupId);


  const existingGrades = db.prepare(`
    SELECT * FROM grades
     WHERE semester = ? AND groupId = ? AND disciplineId = ?
  `).all(semester, groupId, disciplineId);

  const gradesByStudent = new Map(existingGrades.map((g) => [g.studentId, g]));


  const toInsert = [];
  const toUpdate = [];
  const result = [];

  for (const student of students) {
    let grade = gradesByStudent.get(student.id);

    if (!grade) {
      grade = {
        semester, groupId, disciplineId,
        studentId: student.id,
        lab1: '', lab2: '', lab3: '', lab4: '', cw: '', test: '', exam: '',
        finalScore: 0, isAdmitted: 0
      };
      toInsert.push(grade);
    }


    const stats = calculateStudentStats(grade, controlType);
    grade.finalScore = stats.finalScore;
    grade.isAdmitted = stats.isAdmitted ? 1 : 0;
    toUpdate.push(grade);

    result.push(toJournalDto(grade, student));
  }

  for (const g of toInsert) {
    db.prepare(`
      INSERT INTO grades
        (semester, groupId, disciplineId, studentId, lab1, lab2, lab3, lab4, cw, test, exam, finalScore, isAdmitted)
      VALUES
        (@semester, @groupId, @disciplineId, @studentId, @lab1, @lab2, @lab3, @lab4, @cw, @test, @exam, @finalScore, @isAdmitted)
    `).run({
      semester: g.semester,
      groupId: g.groupId,
      disciplineId: g.disciplineId,
      studentId: g.studentId,
      lab1: g.lab1, lab2: g.lab2, lab3: g.lab3, lab4: g.lab4,
      cw: g.cw, test: g.test, exam: g.exam,
      finalScore: g.finalScore,
      isAdmitted: g.isAdmitted
    });
  }

  for (const g of toUpdate) {
    db.prepare(`
      UPDATE grades
         SET finalScore = @finalScore, isAdmitted = @isAdmitted
       WHERE semester = @semester
         AND groupId = @groupId
         AND disciplineId = @disciplineId
         AND studentId = @studentId
    `).run({
      finalScore: g.finalScore,
      isAdmitted: g.isAdmitted,
      semester: g.semester,
      groupId: g.groupId,
      disciplineId: g.disciplineId,
      studentId: g.studentId
    });
  }

  res.json({ success: true, data: result, errors: [], message: null });
});


gradesRouter.put('/cell', (req, res) => {
  const { semester, groupId, disciplineId, studentId, field, value } = req.body || {};

  if (!semester || !groupId || !disciplineId || !studentId || !field) {
    return res.json({
      success: false, data: null,
      errors: ['Не хватает параметров'],
      message: 'Нужны semester, groupId, disciplineId, studentId, field'
    });
  }

  const allowedFields = ['lab1', 'lab2', 'lab3', 'lab4', 'cw', 'test', 'exam'];
  if (!allowedFields.includes(field)) {
    return res.json({
      success: false, data: null,
      errors: [`Недопустимое поле: ${field}`],
      message: 'Разрешены только: lab1..lab4, cw, test, exam'
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

  const student = db.prepare('SELECT * FROM students WHERE id = ?').get(studentId);
  if (!student) {
    return res.json({
      success: false, data: null,
      errors: ['Студент не найден'],
      message: `Студент с id="${studentId}" не существует`
    });
  }


  const normalizedValue = value === undefined || value === null ? '' : String(value);


  const existing = db.prepare(`
    SELECT * FROM grades
     WHERE semester = ? AND groupId = ? AND disciplineId = ? AND studentId = ?
  `).get(semester, groupId, disciplineId, studentId);

  if (!existing) {
    const emptyRow = {
      semester: parseInt(semester, 10),
      groupId,
      disciplineId,
      studentId,
      lab1: '', lab2: '', lab3: '', lab4: '', cw: '', test: '', exam: ''
    };
    emptyRow[field] = normalizedValue;

    const stats = calculateStudentStats(emptyRow, discipline.controlType);

    db.prepare(`
      INSERT INTO grades
        (semester, groupId, disciplineId, studentId, lab1, lab2, lab3, lab4, cw, test, exam, finalScore, isAdmitted)
      VALUES
        (@semester, @groupId, @disciplineId, @studentId, @lab1, @lab2, @lab3, @lab4, @cw, @test, @exam, @finalScore, @isAdmitted)
    `).run({
      semester: emptyRow.semester,
      groupId: emptyRow.groupId,
      disciplineId: emptyRow.disciplineId,
      studentId: emptyRow.studentId,
      lab1: emptyRow.lab1, lab2: emptyRow.lab2, lab3: emptyRow.lab3, lab4: emptyRow.lab4,
      cw: emptyRow.cw, test: emptyRow.test, exam: emptyRow.exam,
      finalScore: stats.finalScore,
      isAdmitted: stats.isAdmitted ? 1 : 0
    });

    logAudit(req, 'Выставление оценки',
      `Студент: ${student.fullName}, поле: ${field}, оценка: ${normalizedValue || '—'}`);

    return res.json({
      success: true,
      data: toJournalDto(
        { ...emptyRow, finalScore: stats.finalScore, isAdmitted: stats.isAdmitted ? 1 : 0 },
        student
      ),
      errors: [],
      message: null
    });
  }

  const updatedGrade = { ...existing };
  updatedGrade[field] = normalizedValue;

  const stats = calculateStudentStats(updatedGrade, discipline.controlType);


  db.prepare(`
    UPDATE grades
       SET ${field} = @value, finalScore = @finalScore, isAdmitted = @isAdmitted
     WHERE id = @id
  `).run({
    value: normalizedValue,
    finalScore: stats.finalScore,
    isAdmitted: stats.isAdmitted ? 1 : 0,
    id: existing.id
  });

  logAudit(req, 'Выставление оценки',
    `Студент: ${student.fullName}, поле: ${field}, оценка: ${normalizedValue || '—'}`);

  res.json({
    success: true,
    data: toJournalDto(
      { ...existing, [field]: normalizedValue, finalScore: stats.finalScore, isAdmitted: stats.isAdmitted ? 1 : 0 },
      student
    ),
    errors: [],
    message: null
  });
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