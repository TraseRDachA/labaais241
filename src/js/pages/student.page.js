import { gradesApi } from '../api/grades.api.js';
import { studentsApi } from '../api/students.api.js';
import { toast } from '../components/toast.js';

export function renderStudentPage({ user }) {
  const container = document.createElement('div');
  container.className = 'page-container student-page';

  let currentSemester = 5;
  const studentId = user && user.studentId ? user.studentId : 's-1';

  container.innerHTML = `
    <!-- Профиль студента -->
    <div class="student-page__profile-card">
      <div class="student-page__profile-main">
        <div class="student-page__avatar">
          <img src="${user ? user.avatar : 'https://api.dicebear.com/7.x/avataaars/svg?seed=Artem'}" alt="Аватар">
        </div>
        <div class="student-page__info">
          <div style="display: flex; align-items: center; gap: 10px;">
            <h1 class="student-page__name" id="st-fullname">Загрузка...</h1>
            <span class="badge badge--student"><span class="badge__dot"></span>Студент</span>
          </div>
          <div class="student-page__meta">
            <span>Группа: <strong id="st-group">—</strong></span>
            <span>•</span>
            <span>Зачетная книжка: <strong id="st-card">—</strong></span>
            <span>•</span>
            <span>Основа: <strong id="st-budget">—</strong></span>
          </div>
        </div>
      </div>

      <div style="display: flex; align-items: center; gap: 12px;">
        <div style="font-size: 12px; color: var(--white-50); font-weight: 600;">ВЫБОР СЕМЕСТРА:</div>
        <select class="form-group__select" id="st-semester-select" style="width: 140px; padding: 8px 12px;">
          <option value="1">1 семестр</option>
          <option value="2">2 семестр</option>
          <option value="3">3 семестр</option>
          <option value="4">4 семестр</option>
          <option value="5" selected>5 семестр</option>
          <option value="6">6 семестр</option>
          <option value="7">7 семестр</option>
          <option value="8">8 семестр</option>
        </select>
      </div>
    </div>

    <!-- Метрики успеваемости -->
    <div class="student-page__stats-grid">
      <div class="student-page__stat-card">
        <div class="student-page__stat-card-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="7"></circle><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"></polyline></svg>
        </div>
        <div class="student-page__stat-card-info">
          <span class="student-page__stat-card-value student-page__stat-card-value--accent" id="metric-gpa">0.00</span>
          <span class="student-page__stat-card-label">Средний балл (GPA)</span>
        </div>
      </div>

      <div class="student-page__stat-card">
        <div class="student-page__stat-card-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M22 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
        </div>
        <div class="student-page__stat-card-info">
          <span class="student-page__stat-card-value" id="metric-rank">—</span>
          <span class="student-page__stat-card-label">Рейтинг в группе</span>
        </div>
      </div>

      <div class="student-page__stat-card">
        <div class="student-page__stat-card-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path></svg>
        </div>
        <div class="student-page__stat-card-info">
          <span class="student-page__stat-card-value" id="metric-subjects">0</span>
          <span class="student-page__stat-card-label">Изучаемых дисциплин</span>
        </div>
      </div>

      <div class="student-page__stat-card" id="card-debt">
        <div class="student-page__stat-card-icon student-page__stat-card-icon--success" id="debt-icon-box">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
        </div>
        <div class="student-page__stat-card-info">
          <span class="student-page__stat-card-value" id="metric-debts">0</span>
          <span class="student-page__stat-card-label">Академических задолженностей</span>
        </div>
      </div>
    </div>

    <!-- Таблица дисциплин и оценок -->
    <div class="student-page__table-card">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
        <div>
          <h2 style="font-size: 18px; font-weight: 700; color: var(--white-100);">Успеваемость по дисциплинам семестра</h2>
          <p style="font-size: 12px; color: var(--white-50);">Детализация контрольных мероприятий, баллов и аттестаций</p>
        </div>
      </div>

      <div class="datatable__table-wrapper">
        <table class="datatable__table">
          <thead>
            <tr>
              <th style="width: 80px;">Код</th>
              <th>Дисциплина / Преподаватель</th>
              <th style="width: 110px;">Контроль</th>
              <th style="width: 60px; text-align: center;">Лаб 1</th>
              <th style="width: 60px; text-align: center;">Лаб 2</th>
              <th style="width: 60px; text-align: center;">Лаб 3</th>
              <th style="width: 60px; text-align: center;">Лаб 4</th>
              <th style="width: 60px; text-align: center;">КР</th>
              <th style="width: 60px; text-align: center;">Курс.</th>
              <th style="width: 80px; text-align: center;">Аттестация</th>
              <th style="width: 100px; text-align: center;">Итог</th>
              <th style="width: 120px; text-align: center;">Статус</th>
            </tr>
          </thead>
          <tbody id="student-subjects-body">
            <tr><td colspan="12" style="text-align: center; padding: 40px; color: var(--white-40);">Загрузка дисциплин...</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  `;

  async function loadData() {
    try {
      const res = await gradesApi.getStudentPerformance(studentId, currentSemester);
      const data = res.data;

      if (!data) return;

      // Заполнение профиля
      container.querySelector('#st-fullname').textContent = data.student.fullName;
      container.querySelector('#st-group').textContent = data.student.groupCode;
      container.querySelector('#st-card').textContent = data.student.studentCardNumber;
      container.querySelector('#st-budget').textContent = data.student.budget ? 'Бюджет' : 'Договор';

      // Заполнение метрик
      container.querySelector('#metric-gpa').textContent = data.currentGpa.toFixed(2);
      container.querySelector('#metric-rank').textContent = data.rank;
      container.querySelector('#metric-subjects').textContent = data.totalSubjects;

      const debtsEl = container.querySelector('#metric-debts');
      const debtBox = container.querySelector('#debt-icon-box');
      debtsEl.textContent = data.debtCount;

      if (data.debtCount > 0) {
        debtsEl.classList.add('student-page__stat-card-value--danger');
        debtBox.className = 'student-page__stat-card-icon student-page__stat-card-icon--danger';
        debtBox.innerHTML = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>`;
      } else {
        debtsEl.classList.remove('student-page__stat-card-value--danger');
        debtBox.className = 'student-page__stat-card-icon student-page__stat-card-icon--success';
        debtBox.innerHTML = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>`;
      }

      // Таблица предметов
      const tbody = container.querySelector('#student-subjects-body');
      if (data.subjects.length === 0) {
        tbody.innerHTML = `<tr><td colspan="12" style="text-align: center; padding: 40px; color: var(--white-40);">В ${currentSemester} семестре дисциплин не найдено</td></tr>`;
        return;
      }

      tbody.innerHTML = data.subjects.map(s => {
        const g = s.grades;
        const examDisplay = g.exam !== '' && g.exam !== undefined ? g.exam : '—';

        // Визуальное выделение задолженности
        let statusBadge = `<span class="badge badge--status-active">Сдано</span>`;
        if (s.isDebt) {
          statusBadge = `<span class="badge badge--debt">Задолженность</span>`;
        } else if (!s.isAdmitted && (g.lab1 || g.lab2)) {
          statusBadge = `<span class="badge badge--not-admitted">Не допущен</span>`;
        } else if (!g.exam) {
          statusBadge = `<span class="badge badge--dean">В процессе</span>`;
        }

        return `
          <tr style="${s.isDebt ? 'background: rgba(239, 68, 68, 0.05);' : ''}">
            <td style="font-family: monospace; color: var(--accent-light); font-weight: 600;">${s.disciplineCode}</td>
            <td>
              <div style="font-weight: 700; color: var(--white-100);">${s.disciplineName}</div>
              <div style="font-size: 11px; color: var(--white-50);">${s.teacherName} (${s.hours} ч.)</div>
            </td>
            <td><span class="badge badge--dean">${s.controlType}</span></td>
            <td style="text-align: center;">${renderScore(g.lab1)}</td>
            <td style="text-align: center;">${renderScore(g.lab2)}</td>
            <td style="text-align: center;">${renderScore(g.lab3)}</td>
            <td style="text-align: center;">${renderScore(g.lab4)}</td>
            <td style="text-align: center;">${renderScore(g.test)}</td>
            <td style="text-align: center;">${renderScore(g.cw)}</td>
            <td style="text-align: center; font-weight: 800; font-size: 14px;">${renderExamScore(examDisplay)}</td>
            <td style="text-align: center; font-weight: 800; color: ${s.finalScore >= 4 ? 'var(--success)' : s.finalScore >= 3 ? 'var(--warning)' : 'var(--danger)'};">
              ${s.finalScore > 0 ? s.finalScore.toFixed(2) : '—'}
            </td>
            <td style="text-align: center;">${statusBadge}</td>
          </tr>
        `;
      }).join('');

    } catch (err) {
      toast.error('Ошибка загрузки успеваемости', err.message);
    }
  }

  function renderScore(val) {
    if (!val && val !== 0) return '<span style="color: var(--white-30);">—</span>';
    let color = 'var(--white-90)';
    if (val === 5 || val === '5' || val === 'Зач') color = 'var(--success)';
    else if (val === 4 || val === '4') color = '#60a5fa';
    else if (val === 3 || val === '3') color = 'var(--warning)';
    else if (val === 2 || val === '2' || val === 'Незач') color = 'var(--danger)';
    return `<strong style="color: ${color};">${val}</strong>`;
  }

  function renderExamScore(val) {
    if (val === '—') return '<span style="color: var(--white-30);">—</span>';
    if (val === 2 || val === '2' || val === 'Незач') {
      return `<span class="badge badge--debt">${val}</span>`;
    }
    return renderScore(val);
  }

  container.querySelector('#st-semester-select').addEventListener('change', (e) => {
    currentSemester = parseInt(e.target.value, 10);
    loadData();
  });

  loadData();

  return container;
}
