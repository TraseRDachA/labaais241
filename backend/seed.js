import { db } from './db.js';
import { initialMockData } from './mockData.js';
import bcrypt from 'bcryptjs';

console.log('[seed] Наполнитьбдстарт');

//чистка
db.exec(`
  DELETE FROM grades;
  DELETE FROM students;
  DELETE FROM disciplines;
  DELETE FROM teachers;
  DELETE FROM groups;
  DELETE FROM users;
  DELETE FROM auditLogs;
`);

// пользов
const insUser = db.prepare(`
  INSERT INTO users (id, username, password, fullName, role, roleName, email, avatar, department, teacherId, studentId, groupCode, createdAt)
  VALUES (@id, @username, @password, @fullName, @role, @roleName, @email, @avatar, @department, @teacherId, @studentId, @groupCode, @createdAt)
`);
for (const u of initialMockData.users) {
  insUser.run({
    id: u.id,
    username: u.username,
    password: bcrypt.hashSync(u.password, 10),
    fullName: u.fullName,
    role: u.role,
    roleName: u.roleName ?? null,
    email: u.email ?? null,
    avatar: u.avatar ?? null,
    department: u.department ?? null,
    teacherId: u.teacherId ?? null,
    studentId: u.studentId ?? null,
    groupCode: u.groupCode ?? null,
    createdAt: u.createdAt ?? null
  });
}
console.log(`[seed] users: ${initialMockData.users.length}`);

// группы
const insGroup = db.prepare(`
  INSERT INTO groups (id, code, course, faculty, specialty, curator, studentCount)
  VALUES (@id, @code, @course, @faculty, @specialty, @curator, @studentCount)
`);
for (const g of initialMockData.groups) {
  insGroup.run({
    id: g.id,
    code: g.code,
    course: g.course,
    faculty: g.faculty ?? null,
    specialty: g.specialty ?? null,
    curator: g.curator ?? null,
    studentCount: g.studentCount ?? 0
  });
}
console.log(`[seed] groups: ${initialMockData.groups.length}`);

// учителя
const insTeacher = db.prepare(`
  INSERT INTO teachers (id, fullName, degree, department, email, phone)
  VALUES (@id, @fullName, @degree, @department, @email, @phone)
`);
for (const t of initialMockData.teachers) {
  insTeacher.run({
    id: t.id,
    fullName: t.fullName,
    degree: t.degree ?? null,
    department: t.department ?? null,
    email: t.email ?? null,
    phone: t.phone ?? null
  });
}
console.log(`[seed] teachers: ${initialMockData.teachers.length}`);

// дисциплины
const insDisc = db.prepare(`
  INSERT INTO disciplines (id, code, name, semester, hours, controlType, department, teacherId)
  VALUES (@id, @code, @name, @semester, @hours, @controlType, @department, @teacherId)
`);
for (const d of initialMockData.disciplines) {
  insDisc.run({
    id: d.id,
    code: d.code,
    name: d.name,
    semester: d.semester,
    hours: d.hours ?? 144,
    controlType: d.controlType,
    department: d.department ?? null,
    teacherId: d.teacherId ?? null
  });
}
console.log(`[seed] disciplines: ${initialMockData.disciplines.length}`);

// студенты
const insStudent = db.prepare(`
  INSERT INTO students (id, fullName, groupId, groupCode, studentCardNumber, email, phone, status, budget, gpa)
  VALUES (@id, @fullName, @groupId, @groupCode, @studentCardNumber, @email, @phone, @status, @budget, @gpa)
`);
for (const s of initialMockData.students) {
  insStudent.run({
    id: s.id,
    fullName: s.fullName,
    groupId: s.groupId,
    groupCode: s.groupCode,
    studentCardNumber: s.studentCardNumber,
    email: s.email ?? null,
    phone: s.phone ?? null,
    status: s.status ?? 'Учится',
    budget: s.budget ? 1 : 0,
    gpa: s.gpa ?? 0
  });
}
console.log(`[seed] students: ${initialMockData.students.length}`);

// оценки
// "5_g-1_d-1"
const insGrade = db.prepare(`
  INSERT INTO grades (semester, groupId, disciplineId, studentId, lab1, lab2, lab3, lab4, cw, test, exam, finalScore, isAdmitted)
  VALUES (@semester, @groupId, @disciplineId, @studentId, @lab1, @lab2, @lab3, @lab4, @cw, @test, @exam, @finalScore, @isAdmitted)
`);
let gradeCount = 0;
for (const [key, entries] of Object.entries(initialMockData.grades || {})) {
  const [semesterStr, groupId, disciplineId] = key.split('_');
  const semester = parseInt(semesterStr, 10);

  for (const e of entries) {
    insGrade.run({
      semester,
      groupId,
      disciplineId,
      studentId: e.studentId,
      lab1: String(e.lab1 ?? ''),
      lab2: String(e.lab2 ?? ''),
      lab3: String(e.lab3 ?? ''),
      lab4: String(e.lab4 ?? ''),
      cw:   String(e.cw   ?? ''),
      test: String(e.test ?? ''),
      exam: String(e.exam ?? ''),
      finalScore: e.finalScore ?? 0,
      isAdmitted: e.isAdmitted ? 1 : 0
    });
    gradeCount++;
  }
}
console.log(`[seed] grades: ${gradeCount}`);

// аудиты
const insLog = db.prepare(`
  INSERT INTO auditLogs (id, timestamp, userId, userName, role, action, details, ipAddress)
  VALUES (@id, @timestamp, @userId, @userName, @role, @action, @details, @ipAddress)
`);
for (const l of initialMockData.auditLogs || []) {
  insLog.run({
    id: l.id,
    timestamp: l.timestamp,
    userId: l.userId ?? null,
    userName: l.userName ?? null,
    role: l.role ?? null,
    action: l.action,
    details: l.details ?? null,
    ipAddress: l.ipAddress ?? null
  });
}
console.log(`[seed] auditLogs: ${(initialMockData.auditLogs || []).length}`);

console.log('[seed] ++');