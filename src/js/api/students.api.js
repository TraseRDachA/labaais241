import { apiClient, logAuditAction } from './client.js';

export const studentsApi = {
  // === СТУДЕНТЫ ===
  async getStudents(params = {}) {
    return apiClient.get('/students', (db) => {
      let list = [...db.students];
      if (params.search) {
        const s = params.search.toLowerCase();
        list = list.filter(item => 
          item.fullName.toLowerCase().includes(s) || 
          item.studentCardNumber.toLowerCase().includes(s) ||
          item.groupCode.toLowerCase().includes(s)
        );
      }
      if (params.groupId) {
        list = list.filter(item => item.groupId === params.groupId);
      }
      if (params.status) {
        list = list.filter(item => item.status === params.status);
      }
      return list;
    });
  },

  async getStudentById(id) {
    return apiClient.get(`/students/${id}`, (db) => {
      const student = db.students.find(s => s.id === id);
      if (!student) throw new Error('Студент не найден');
      return student;
    });
  },

  async createStudent(studentData) {
    return apiClient.post('/students', studentData, (db, body) => {
      const group = db.groups.find(g => g.id === body.groupId);
      const newStudent = {
        id: `s-${Date.now()}`,
        ...body,
        groupCode: group ? group.code : body.groupCode || 'Не указана',
        gpa: body.gpa || 4.0
      };
      db.students.push(newStudent);
      if (group) group.studentCount = (group.studentCount || 0) + 1;
      logAuditAction('Создание студента', `Добавлен студент ${newStudent.fullName} (${newStudent.groupCode})`);
      return newStudent;
    });
  },

  async updateStudent(id, studentData) {
    return apiClient.put(`/students/${id}`, studentData, (db, body) => {
      const idx = db.students.findIndex(s => s.id === id);
      if (idx === -1) throw new Error('Студент не найден');
      const group = db.groups.find(g => g.id === body.groupId);
      db.students[idx] = {
        ...db.students[idx],
        ...body,
        groupCode: group ? group.code : db.students[idx].groupCode
      };
      logAuditAction('Обновление студента', `Обновлены данные студента ${db.students[idx].fullName}`);
      return db.students[idx];
    });
  },

  async deleteStudent(id) {
    return apiClient.delete(`/students/${id}`, (db) => {
      const idx = db.students.findIndex(s => s.id === id);
      if (idx === -1) throw new Error('Студент не найден');
      const removed = db.students.splice(idx, 1)[0];
      const group = db.groups.find(g => g.id === removed.groupId);
      if (group && group.studentCount > 0) group.studentCount -= 1;
      logAuditAction('Удаление студента', `Удален студент ${removed.fullName} (${removed.groupCode})`);
      return { id };
    });
  },

  // === ГРУППЫ ===
  async getGroups() {
    return apiClient.get('/groups', (db) => [...db.groups]);
  },

  async createGroup(groupData) {
    return apiClient.post('/groups', groupData, (db, body) => {
      const newGroup = {
        id: `g-${Date.now()}`,
        ...body,
        studentCount: 0
      };
      db.groups.push(newGroup);
      logAuditAction('Создание группы', `Создана группа ${newGroup.code}`);
      return newGroup;
    });
  },

  async updateGroup(id, groupData) {
    return apiClient.put(`/groups/${id}`, groupData, (db, body) => {
      const idx = db.groups.findIndex(g => g.id === id);
      if (idx === -1) throw new Error('Группа не найдена');
      db.groups[idx] = { ...db.groups[idx], ...body };
      logAuditAction('Обновление группы', `Обновлена группа ${db.groups[idx].code}`);
      return db.groups[idx];
    });
  },

  async deleteGroup(id) {
    return apiClient.delete(`/groups/${id}`, (db) => {
      const idx = db.groups.findIndex(g => g.id === id);
      if (idx === -1) throw new Error('Группа не найдена');
      const removed = db.groups.splice(idx, 1)[0];
      logAuditAction('Удаление группы', `Удалена группа ${removed.code}`);
      return { id };
    });
  },

  // === ДИСЦИПЛИНЫ ===
  async getDisciplines() {
    return apiClient.get('/disciplines', (db) => [...db.disciplines]);
  },

  async createDiscipline(data) {
    return apiClient.post('/disciplines', data, (db, body) => {
      const newDisc = {
        id: `d-${Date.now()}`,
        ...body
      };
      db.disciplines.push(newDisc);
      logAuditAction('Создание дисциплины', `Создана дисциплина ${newDisc.name}`);
      return newDisc;
    });
  },

  async updateDiscipline(id, data) {
    return apiClient.put(`/disciplines/${id}`, data, (db, body) => {
      const idx = db.disciplines.findIndex(d => d.id === id);
      if (idx === -1) throw new Error('Дисциплина не найдена');
      db.disciplines[idx] = { ...db.disciplines[idx], ...body };
      logAuditAction('Обновление дисциплины', `Обновлена дисциплина ${db.disciplines[idx].name}`);
      return db.disciplines[idx];
    });
  },

  async deleteDiscipline(id) {
    return apiClient.delete(`/disciplines/${id}`, (db) => {
      const idx = db.disciplines.findIndex(d => d.id === id);
      if (idx === -1) throw new Error('Дисциплина не найдена');
      const removed = db.disciplines.splice(idx, 1)[0];
      logAuditAction('Удаление дисциплины', `Удалена дисциплина ${removed.name}`);
      return { id };
    });
  },

  // === ПРЕПОДАВАТЕЛИ ===
  async getTeachers() {
    return apiClient.get('/teachers', (db) => [...db.teachers]);
  },

  async createTeacher(data) {
    return apiClient.post('/teachers', data, (db, body) => {
      const newTeacher = {
        id: `t-${Date.now()}`,
        ...body,
        disciplines: body.disciplines || []
      };
      db.teachers.push(newTeacher);
      logAuditAction('Создание преподавателя', `Добавлен преподаватель ${newTeacher.fullName}`);
      return newTeacher;
    });
  },

  async updateTeacher(id, data) {
    return apiClient.put(`/teachers/${id}`, data, (db, body) => {
      const idx = db.teachers.findIndex(t => t.id === id);
      if (idx === -1) throw new Error('Преподаватель не найден');
      db.teachers[idx] = { ...db.teachers[idx], ...body };
      logAuditAction('Обновление преподавателя', `Обновлен преподаватель ${db.teachers[idx].fullName}`);
      return db.teachers[idx];
    });
  },

  async deleteTeacher(id) {
    return apiClient.delete(`/teachers/${id}`, (db) => {
      const idx = db.teachers.findIndex(t => t.id === id);
      if (idx === -1) throw new Error('Преподаватель не найден');
      const removed = db.teachers.splice(idx, 1)[0];
      logAuditAction('Удаление преподавателя', `Удален преподаватель ${removed.fullName}`);
      return { id };
    });
  }
};
