import { Router } from 'express';
import { db } from '../db.js';
import { calculateStudentStats } from './grades.js';

export const studentPerformanceRouter = Router();

studentPerformanceRouter.get('/:id/performance', (req, res) => {
  const studentId = req.params.id;
  const semester = parseInt(req.query.semester, 10) || 1;

  const student = db.prepare('SELECT * FROM students WHERE id = ?').get(studentId);
  if (!student) {
    return res.json({
      success: false, data: null,
      errors: ['Студент не найден'],
      message: `Студент с id="${studentId}" не существует`
    });
  }

  const groupMates = db.prepare(`
    SELECT * FROM students
     WHERE groupId = ? AND status = 'Учится'
     ORDER BY gpa DESC
  `).all(student.groupId);
  const rankIndex = groupMates.findIndex((s) => s.id === student.id);
  const rank = rankIndex !== -1
    ? `${rankIndex + 1} из ${groupMates.length}`
    : `1 из ${groupMates.length}`;


  const disciplines = db.prepare(`
    SELECT * FROM disciplines
     WHERE semester = ?
     ORDER BY code COLLATE NOCASE
  `).all(semester);

  const allGrades = db.prepare(`
    SELECT * FROM grades
     WHERE semester = ? AND studentId = ?
  `).all(semester, studentId);
  const gradesByDiscipline = new Map(allGrades.map((g) => [g.disciplineId, g]));

  const subjects = disciplines.map((disc) => {
    const grade = gradesByDiscipline.get(disc.id) || {
      lab1: '', lab2: '', lab3: '', lab4: '', cw: '', test: '', exam: '',
      finalScore: 0, isAdmitted: 0
    };

    const teacher = db.prepare('SELECT * FROM teachers WHERE id = ?').get(disc.teacherId);
    const stats = calculateStudentStats(grade, disc.controlType);

    const isDebt =
      grade.exam === 2 || grade.exam === '2' || grade.exam === 'Незач' ||
      grade.lab1 === 2 || grade.lab2 === 2 || grade.lab3 === 2 || grade.lab4 === 2 ||
      grade.test === 2 || grade.cw === 2;

    return {
      disciplineId: disc.id,
      disciplineCode: disc.code,
      disciplineName: disc.name,
      teacherName: teacher ? teacher.fullName : 'Кафедра',
      controlType: disc.controlType,
      hours: disc.hours,
      grades: {
        lab1: grade.lab1 ?? '',
        lab2: grade.lab2 ?? '',
        lab3: grade.lab3 ?? '',
        lab4: grade.lab4 ?? '',
        cw: grade.cw ?? '',
        test: grade.test ?? '',
        exam: grade.exam ?? ''
      },
      finalScore: stats.finalScore,
      isAdmitted: stats.isAdmitted,
      isDebt
    };
  });

  const rated = subjects.filter((s) => s.finalScore > 0);
  const currentGpa = rated.length > 0
    ? parseFloat((rated.reduce((a, s) => a + s.finalScore, 0) / rated.length).toFixed(2))
    : (student.gpa || 0);

  const debtCount = subjects.filter((s) => s.isDebt).length;

  res.json({
    success: true,
    data: {
      student: {
        id: student.id,
        fullName: student.fullName,
        groupCode: student.groupCode,
        studentCardNumber: student.studentCardNumber,
        budget: student.budget === 1,
        status: student.status
      },
      currentGpa,
      rank,
      totalSubjects: subjects.length,
      debtCount,
      subjects
    },
    errors: [],
    message: null
  });
});