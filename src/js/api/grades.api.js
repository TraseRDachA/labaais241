import { apiClient, logAuditAction } from './client.js';

// Вычисление среднего балла и статуса допуска
export function calculateStudentStats(entry, controlType = "Экзамен") {
  const isCredit = controlType === "Зачет";
  const scores = [];
  let hasFailed = false;

  const numericFields = ['lab1', 'lab2', 'lab3', 'lab4', 'cw', 'test', 'exam'];
  
  numericFields.forEach(field => {
    const val = entry[field];
    if (val !== undefined && val !== null && val !== "") {
      if (val === "Зач") scores.push(5);
      else if (val === "Незач") {
        scores.push(2);
        hasFailed = true;
      } else {
        const num = parseFloat(val);
        if (!isNaN(num)) {
          scores.push(num);
          if (num < 3) hasFailed = true;
        }
      }
    }
  });

  const finalScore = scores.length > 0
    ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(2)
    : "0.00";

  // Условие допуска: сданы ключевые точки и средний балл >= 3.0
  const isAdmitted = !hasFailed && scores.length >= 3 && parseFloat(finalScore) >= 3.0;

  return {
    finalScore: parseFloat(finalScore),
    isAdmitted
  };
}

export const gradesApi = {
  // Получение матрицы журнала для связки (семестр, группа, дисциплина)
  async getJournalGrades(semester, groupId, disciplineId) {
    return apiClient.get(`/grades?semester=${semester}&groupId=${groupId}&disciplineId=${disciplineId}`, (db) => {
      const key = `${semester}_${groupId}_${disciplineId}`;
      let groupGrades = db.grades[key];

      // Получаем всех студентов этой группы
      const groupStudents = db.students.filter(s => s.groupId === groupId);
      const discipline = db.disciplines.find(d => d.id === disciplineId);
      const controlType = discipline ? discipline.controlType : "Экзамен";

      if (!groupGrades) {
        // Создаем пустые/базовые записи для всех студентов группы
        groupGrades = groupStudents.map(st => {
          const entry = {
            studentId: st.id,
            lab1: "", lab2: "", lab3: "", lab4: "", cw: "", test: "", exam: "",
            isAdmitted: false,
            finalScore: 0.0
          };
          return entry;
        });
        db.grades[key] = groupGrades;
      } else {
        // Убедимся, что новые студенты тоже включены в матрицу
        groupStudents.forEach(st => {
          if (!groupGrades.some(g => g.studentId === st.id)) {
            groupGrades.push({
              studentId: st.id,
              lab1: "", lab2: "", lab3: "", lab4: "", cw: "", test: "", exam: "",
              isAdmitted: false,
              finalScore: 0.0
            });
          }
        });
      }

      // Обогащаем данными студентов
      return groupGrades.map(grade => {
        const student = groupStudents.find(s => s.id === grade.studentId) || {
          fullName: "Неизвестный студент",
          studentCardNumber: "—",
          status: "Учится"
        };
        const stats = calculateStudentStats(grade, controlType);
        grade.finalScore = stats.finalScore;
        grade.isAdmitted = stats.isAdmitted;
        return {
          ...grade,
          studentName: student.fullName,
          studentCardNumber: student.studentCardNumber,
          studentStatus: student.status
        };
      });
    });
  },

  // Обновление оценки (in-place)
  async updateGrade(semester, groupId, disciplineId, studentId, field, value) {
    return apiClient.put('/grades/cell', { semester, groupId, disciplineId, studentId, field, value }, (db) => {
      const key = `${semester}_${groupId}_${disciplineId}`;
      if (!db.grades[key]) db.grades[key] = [];

      let entry = db.grades[key].find(g => g.studentId === studentId);
      if (!entry) {
        entry = { studentId, lab1: "", lab2: "", lab3: "", lab4: "", cw: "", test: "", exam: "" };
        db.grades[key].push(entry);
      }

      entry[field] = value;

      const discipline = db.disciplines.find(d => d.id === disciplineId);
      const stats = calculateStudentStats(entry, discipline ? discipline.controlType : "Экзамен");
      entry.finalScore = stats.finalScore;
      entry.isAdmitted = stats.isAdmitted;

      const student = db.students.find(s => s.id === studentId);
      logAuditAction(
        'Выставление оценки',
        `Студент: ${student ? student.fullName : studentId}, поле: ${field}, оценка: ${value || '—'}`
      );

      return entry;
    });
  },

  // Данные успеваемости для личного кабинета студента
  async getStudentPerformance(studentId, semester = 5) {
    return apiClient.get(`/student/${studentId}/performance?semester=${semester}`, (db) => {
      const student = db.students.find(s => s.id === studentId) || db.students[0];
      if (!student) throw new Error('Студент не найден');

      // Рейтинг в группе
      const groupStudents = db.students
        .filter(s => s.groupId === student.groupId && s.status === 'Учится')
        .sort((a, b) => (b.gpa || 0) - (a.gpa || 0));

      const rankIndex = groupStudents.findIndex(s => s.id === student.id);
      const rank = rankIndex !== -1 ? `${rankIndex + 1} из ${groupStudents.length}` : `1 из ${groupStudents.length}`;

      // Предметы за семестр
      const semesterDisciplines = db.disciplines.filter(d => Number(d.semester) === Number(semester));

      const subjects = semesterDisciplines.map(disc => {
        const key = `${semester}_${student.groupId}_${disc.id}`;
        const groupGrades = db.grades[key] || [];
        const gradeEntry = groupGrades.find(g => g.studentId === student.id) || {
          lab1: "", lab2: "", lab3: "", lab4: "", cw: "", test: "", exam: ""
        };

        const stats = calculateStudentStats(gradeEntry, disc.controlType);
        const teacher = db.teachers.find(t => t.id === disc.teacherId);

        // Проверка на долг (оценка 2 или Незачет, либо незакрытый экзамен)
        const isDebt = gradeEntry.exam === 2 || 
                       gradeEntry.exam === "2" || 
                       gradeEntry.exam === "Незач" || 
                       gradeEntry.lab1 === 2 || 
                       gradeEntry.lab2 === 2 ||
                       gradeEntry.test === 2;

        return {
          disciplineId: disc.id,
          disciplineCode: disc.code,
          disciplineName: disc.name,
          teacherName: teacher ? teacher.fullName : "Кафедра",
          controlType: disc.controlType,
          hours: disc.hours,
          grades: gradeEntry,
          finalScore: stats.finalScore,
          isAdmitted: stats.isAdmitted,
          isDebt
        };
      });

      // Подсчет среднего балла по заполненным предметам
      const ratedSubjects = subjects.filter(s => s.finalScore > 0);
      const currentGpa = ratedSubjects.length > 0 
        ? (ratedSubjects.reduce((acc, curr) => acc + curr.finalScore, 0) / ratedSubjects.length).toFixed(2)
        : student.gpa || "4.50";

      const debtCount = subjects.filter(s => s.isDebt).length;

      return {
        student,
        currentGpa: parseFloat(currentGpa),
        rank,
        totalSubjects: subjects.length,
        debtCount,
        subjects
      };
    });
  }
};
