import { db } from './db.js';

console.log('[addGrades] Догенерация оценок...');

// Все (semester, groupId, disciplineId), для которых нужны оценки
// — проходимся по всем дисциплинам и всем группам
const groups = db.prepare('SELECT * FROM groups').all();
const disciplines = db.prepare('SELECT * FROM disciplines').all();

const existing = new Set(
  db.prepare('SELECT semester, groupId, disciplineId, studentId FROM grades').all()
    .map((g) => `${g.semester}_${g.groupId}_${g.disciplineId}_${g.studentId}`)
);

const insertStmt = db.prepare(`
  INSERT INTO grades
    (semester, groupId, disciplineId, studentId, lab1, lab2, lab3, lab4, cw, test, exam, finalScore, isAdmitted)
  VALUES
    (@semester, @groupId, @disciplineId, @studentId, @lab1, @lab2, @lab3, @lab4, @cw, @test, @exam, @finalScore, @isAdmitted)
`);

function rand(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function calcStats(entry) {
  const scores = [];
  let hasFailed = false;

  for (const f of ['lab1', 'lab2', 'lab3', 'lab4', 'cw', 'test', 'exam']) {
    const val = entry[f];
    if (!val) continue;
    if (val === 'Зач') scores.push(5);
    else if (val === 'Незач') { scores.push(2); hasFailed = true; }
    else {
      const n = parseFloat(val);
      if (!isNaN(n)) { scores.push(n); if (n < 3) hasFailed = true; }
    }
  }

  const finalScore = scores.length > 0
    ? parseFloat((scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(2))
    : 0;
  const isAdmitted = !hasFailed && scores.length >= 3 && finalScore >= 3.0;
  return { finalScore, isAdmitted };
}

let created = 0;

for (const disc of disciplines) {
  for (const g of groups) {
    const students = db.prepare('SELECT * FROM students WHERE groupId = ?').all(g.id);
    if (students.length === 0) continue;

    for (const st of students) {
      const key = `${disc.semester}_${g.id}_${disc.id}_${st.id}`;
      if (existing.has(key)) continue;

      if (st.status !== 'Учится' && Math.random() < 0.5) continue;

      const isCredit = disc.controlType === 'Зачет';

      const randScore = () => {
        const r = Math.random();
        if (r < 0.35) return '5';
        if (r < 0.7)  return '4';
        if (r < 0.9)  return '3';
        return '2';
      };

      const entry = {
        semester: disc.semester,
        groupId: g.id,
        disciplineId: disc.id,
        studentId: st.id,
        lab1: isCredit ? (Math.random() < 0.85 ? 'Зач' : 'Незач') : randScore(),
        lab2: isCredit ? (Math.random() < 0.85 ? 'Зач' : 'Незач') : randScore(),
        lab3: isCredit ? (Math.random() < 0.85 ? 'Зач' : 'Незач') : randScore(),
        lab4: isCredit ? (Math.random() < 0.85 ? 'Зач' : 'Незач') : randScore(),
        cw:   isCredit ? (Math.random() < 0.85 ? 'Зач' : 'Незач') : randScore(),
        test: isCredit ? (Math.random() < 0.85 ? 'Зач' : 'Незач') : randScore(),
        exam: isCredit ? (Math.random() < 0.85 ? 'Зач' : 'Незач') : randScore()
      };

      const stats = calcStats(entry);
      entry.finalScore = stats.finalScore;
      entry.isAdmitted = stats.isAdmitted ? 1 : 0;

      insertStmt.run(entry);
      created++;
    }
  }
}

console.log(`[addGrades] записей: ${created}`);
console.log(`[addGrades] оценок в БД: ${db.prepare('SELECT COUNT(*) AS c FROM grades').get().c}`);
console.log('[addGrades] +++');