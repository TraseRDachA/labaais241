import { apiClient, logAuditAction } from './client.js';

export const reportsApi = {
  // Ведомость по предмету
  async getSubjectStatement(semester, groupId, disciplineId) {
    return apiClient.get(`/reports/subject?semester=${semester}&groupId=${groupId}&disciplineId=${disciplineId}`, (db) => {
      const group = db.groups.find(g => g.id === groupId) || { code: "Не выбрано" };
      const discipline = db.disciplines.find(d => d.id === disciplineId) || { name: "Не выбрано", controlType: "Экзамен" };
      const teacher = db.teachers.find(t => t.id === discipline.teacherId) || { fullName: "Не назначен" };
      const key = `${semester}_${groupId}_${disciplineId}`;
      const groupGrades = db.grades[key] || [];
      const groupStudents = db.students.filter(s => s.groupId === groupId);

      const rows = groupStudents.map((st, idx) => {
        const grade = groupGrades.find(g => g.studentId === st.id) || {};
        return {
          num: idx + 1,
          studentName: st.fullName,
          studentCard: st.studentCardNumber,
          lab1: grade.lab1 || "—",
          lab2: grade.lab2 || "—",
          lab3: grade.lab3 || "—",
          lab4: grade.lab4 || "—",
          cw: grade.cw || "—",
          test: grade.test || "—",
          exam: grade.exam || "—",
          finalScore: grade.finalScore || "—",
          isAdmitted: grade.isAdmitted ? "Допущен" : "Не допущен"
        };
      });

      logAuditAction('Формирование отчета', `Сформирована ведомость: ${discipline.name} (${group.code})`);

      return {
        semester,
        groupCode: group.code,
        groupSpecialty: group.specialty,
        disciplineName: discipline.name,
        controlType: discipline.controlType,
        teacherName: teacher.fullName,
        date: new Date().toLocaleDateString('ru-RU'),
        rows
      };
    });
  },

  // Список академических должников
  async getDebtors() {
    return apiClient.get('/reports/debtors', (db) => {
      const debtors = [];

      db.students.forEach(st => {
        const studentDebts = [];

        // Проверяем все записи оценок
        Object.keys(db.grades).forEach(key => {
          const [semester, groupId, disciplineId] = key.split('_');
          if (st.groupId === groupId) {
            const entry = (db.grades[key] || []).find(g => g.studentId === st.id);
            if (entry) {
              const discipline = db.disciplines.find(d => d.id === disciplineId);
              const discName = discipline ? discipline.name : "Дисциплина";
              
              if (entry.exam === 2 || entry.exam === "2" || entry.exam === "Незач") {
                studentDebts.push({ disciplineName: discName, type: "Итоговая аттестация", reason: `Оценка: ${entry.exam}` });
              } else if (!entry.isAdmitted && (entry.lab1 || entry.lab2 || entry.test)) {
                studentDebts.push({ disciplineName: discName, type: "Текущий контроль", reason: "Не получен допуск" });
              }
            }
          }
        });

        if (studentDebts.length > 0 || st.status === "Отчислен") {
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
      });

      logAuditAction('Формирование отчета', 'Сформирован список академических должников');
      return debtors;
    });
  },

  // Статистика качества знаний
  async getQualityStatistics() {
    return apiClient.get('/reports/quality', (db) => {
      let totalGrades = 0;
      let count5 = 0;
      let count4 = 0;
      let count3 = 0;
      let count2 = 0;

      Object.values(db.grades).forEach(groupGrades => {
        groupGrades.forEach(g => {
          const score = g.finalScore;
          if (score && score > 0) {
            totalGrades++;
            if (score >= 4.5) count5++;
            else if (score >= 3.5) count4++;
            else if (score >= 2.5) count3++;
            else count2++;
          }
        });
      });

      const qualityPercent = totalGrades > 0 ? (((count5 + count4) / totalGrades) * 100).toFixed(1) : 0;
      const successPercent = totalGrades > 0 ? (((count5 + count4 + count3) / totalGrades) * 100).toFixed(1) : 0;

      return {
        totalGrades,
        count5,
        count4,
        count3,
        count2,
        qualityPercent,
        successPercent,
        groupsCount: db.groups.length,
        studentsCount: db.students.length
      };
    });
  },

  // Экспорт данных в CSV / Excel с русским UTF-8 BOM
  exportToCsv(filename, headers, rows) {
    const csvContent = "\uFEFF" + [
      headers.join(';'),
      ...rows.map(row => row.map(cell => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(';'))
    ].join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  },

  // Печать ведомости
  printStatement() {
    window.print();
  }
};
