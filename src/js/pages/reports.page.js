import { studentsApi } from '../api/students.api.js';
import { reportsApi } from '../api/reports.api.js';
import { toast } from '../components/toast.js';
import { USE_MOCK } from '../api/client.js';

export function renderReportsPage({ user }) {
  const container = document.createElement('div');
  container.className = 'page-container reports-page';

  let reportType = 'subject'; // subject | debtors | quality
  let groups = [];
  let disciplines = [];
  let selectedSemester = 5;
  let selectedGroupId = '';
  let selectedDisciplineId = '';
  let currentReportData = null;

  container.innerHTML = `
    <div>
      <h1 style="font-size: 26px; font-weight: 800; color: var(--white-100);">Отчеты и академическая аналитика</h1>
      <p style="font-size: 13px; color: var(--white-50); margin-top: 4px;">
        Формирование официальных зачетно-экзаменационных ведомостей, списков должников и статистики качества
      </p>
    </div>

    <!-- Панель управления отчетом -->
    <div class="reports-page__controls-card">
      <div class="reports-page__controls-grid">
        <div class="form-group">
          <label class="form-group__label">Тип отчета</label>
          <select class="form-group__select" id="rep-type-select">
            <option value="subject" selected>Зачетно-экзаменационная ведомость по предмету</option>
            <option value="debtors">Список академических должников</option>
            <option value="quality">Аналитика качества знаний и успеваемости</option>
          </select>
        </div>

        <div class="form-group rep-sub-filter" id="rep-filter-semester">
          <label class="form-group__label">Семестр</label>
          <select class="form-group__select" id="rep-semester-select">
            <option value="1">1 семестр</option>
            <option value="2">2 семестр</option>
            <option value="3">3 семестр</option>
            <option value="4">4 семестр</option>
            <option value="5" selected>5 семестр</option>
            <option value="6">6 семестр</option>
            <option value="7">7 семестр</option>
          </select>
        </div>

        <div class="form-group rep-sub-filter" id="rep-filter-group">
          <label class="form-group__label">Группа</label>
          <select class="form-group__select" id="rep-group-select">
            <option value="">Загрузка групп...</option>
          </select>
        </div>

        <div class="form-group rep-sub-filter" id="rep-filter-discipline">
          <label class="form-group__label">Дисциплина</label>
          <select class="form-group__select" id="rep-discipline-select">
            <option value="">Загрузка дисциплин...</option>
          </select>
        </div>
      </div>

      <div class="reports-page__actions-bar">
        <button type="button" class="btn btn--secondary" id="btn-export-excel">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
          Экспорт в Excel (.csv)
        </button>
        <button type="button" class="btn btn--accent" id="btn-print-statement">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
          Печать ведомости
        </button>
      </div>
    </div>

    <!-- Область отображения сформированного отчета -->
    <div id="reports-output-area">
      <div style="text-align: center; padding: 40px; color: var(--white-40);">Формирование данных отчета...</div>
    </div>
  `;

  async function init() {
    try {
      const [grRes, discRes] = await Promise.all([studentsApi.getGroups(), studentsApi.getDisciplines()]);
      groups = grRes.data || [];
      disciplines = discRes.data || [];

      const grSelect = container.querySelector('#rep-group-select');
      grSelect.innerHTML = groups.map(g => `<option value="${g.id}">${g.code} (${g.specialty})</option>`).join('');

      if (groups.length > 0) {
        selectedGroupId = groups[0].id;
      }

      updateDisciplines();
    } catch (err) {
      toast.error('Ошибка инициализации отчетов', err.message);
    }
  }

  function updateDisciplines() {
    const semSelect = container.querySelector('#rep-semester-select');
    selectedSemester = parseInt(semSelect.value, 10);

    const filtered = disciplines.filter(d => Number(d.semester) === selectedSemester);
    const discSelect = container.querySelector('#rep-discipline-select');

    if (filtered.length > 0) {
      discSelect.innerHTML = filtered.map(d => `<option value="${d.id}">${d.name} (${d.controlType})</option>`).join('');
      selectedDisciplineId = filtered[0].id;
    } else {
      discSelect.innerHTML = `<option value="">Нет дисциплин</option>`;
      selectedDisciplineId = '';
    }

    generateReport();
  }

  async function generateReport() {
    const output = container.querySelector('#reports-output-area');
    output.innerHTML = `<div style="text-align: center; padding: 40px; color: var(--white-40);">Формирование отчета...</div>`;

    try {
      if (reportType === 'subject') {
        if (!selectedGroupId || !selectedDisciplineId) {
          output.innerHTML = `<div style="text-align: center; padding: 40px; color: var(--white-40);">Выберите группу и предмет</div>`;
          return;
        }
        const res = await reportsApi.getSubjectStatement(selectedSemester, selectedGroupId, selectedDisciplineId);
        currentReportData = res.data;
        renderSubjectReport(output, res.data);
      } else if (reportType === 'debtors') {
        const res = await reportsApi.getDebtors();
        currentReportData = res.data;
        renderDebtorsReport(output, res.data);
      } else if (reportType === 'quality') {
        const res = await reportsApi.getQualityStatistics();
        currentReportData = res.data;
        renderQualityReport(output, res.data);
      }
    } catch (err) {
      toast.error('Ошибка формирования отчета', err.message);
    }
  }

  function renderSubjectReport(containerEl, data) {
    if (!data) return;

    let rowsHtml = data.rows.map(r => `
      <tr>
        <td style="text-align: center;">${r.num}</td>
        <td><strong>${r.studentName}</strong></td>
        <td>${r.studentCard}</td>
        <td style="text-align: center;">${r.lab1}</td>
        <td style="text-align: center;">${r.lab2}</td>
        <td style="text-align: center;">${r.lab3}</td>
        <td style="text-align: center;">${r.lab4}</td>
        <td style="text-align: center;">${r.test}</td>
        <td style="text-align: center;">${r.cw}</td>
        <td style="text-align: center; font-weight: 800; font-size: 14px;">${r.exam}</td>
        <td style="text-align: center; font-weight: 800;">${r.finalScore}</td>
        <td style="text-align: center;">
          <span class="badge ${r.isAdmitted === 'Допущен' ? 'badge--admitted' : 'badge--not-admitted'}">${r.isAdmitted}</span>
        </td>
      </tr>
    `).join('');

    containerEl.innerHTML = `
      <div class="reports-page__statement-sheet">
        <div class="reports-page__statement-header">
          <p style="text-transform: uppercase; font-size: 11px; letter-spacing: 0.1em; color: var(--white-50);">Министерство науки и высшего образования Российской Федерации</p>
          <h2>Зачетно-экзаменационная ведомость</h2>
          <p>Факультет информационных технологий • Семестр № ${data.semester}</p>
        </div>

        <div class="reports-page__statement-info">
          <div>Дисциплина: <strong>${data.disciplineName}</strong></div>
          <div>Академическая группа: <strong>${data.groupCode}</strong></div>
          <div>Специальность: <strong>${data.groupSpecialty}</strong></div>
          <div>Форма контроля: <strong>${data.controlType}</strong></div>
          <div>Преподаватель: <strong>${data.teacherName}</strong></div>
          <div>Дата формирования: <strong>${data.date}</strong></div>
        </div>

        <div class="datatable__table-wrapper" style="box-shadow: none; border-radius: var(--radius-md);">
          <table class="datatable__table">
            <thead>
              <tr>
                <th style="width: 40px; text-align: center;">№</th>
                <th>ФИО студента</th>
                <th style="width: 110px;">Зачетка</th>
                <th style="width: 50px; text-align: center;">Л1</th>
                <th style="width: 50px; text-align: center;">Л2</th>
                <th style="width: 50px; text-align: center;">Л3</th>
                <th style="width: 50px; text-align: center;">Л4</th>
                <th style="width: 50px; text-align: center;">КР</th>
                <th style="width: 50px; text-align: center;">Курс</th>
                <th style="width: 90px; text-align: center;">Аттестация</th>
                <th style="width: 80px; text-align: center;">Балл</th>
                <th style="width: 110px; text-align: center;">Статус</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>
        </div>

        <div class="reports-page__statement-signatures">
          <div>Преподаватель: <span class="signature-line"></span> / ${data.teacherName} /</div>
          <div>Декан факультета: <span class="signature-line"></span> / Смирнова Е.В. /</div>
        </div>
      </div>
    `;
  }

  function renderDebtorsReport(containerEl, debtors) {
    if (!debtors || debtors.length === 0) {
      containerEl.innerHTML = `
        <div class="reports-page__statement-sheet" style="text-align: center; padding: 48px;">
          <h3 style="color: var(--success); font-size: 20px; font-weight: 800;">Академических задолженностей не обнаружено!</h3>
          <p style="color: var(--white-50); margin-top: 8px;">Все студенты успешно сдали текущие аттестации и допущены к экзаменам.</p>
        </div>
      `;
      return;
    }

    let rowsHtml = debtors.map((st, idx) => {
      const debtsStr = st.debts.length > 0 
        ? st.debts.map(d => `<div style="font-size: 12px; margin-bottom: 2px;">• <strong>${d.disciplineName}</strong> (${d.reason})</div>`).join('')
        : `<span style="color: var(--white-50);">Статус: ${st.status}</span>`;

      return `
        <tr>
          <td style="text-align: center;">${idx + 1}</td>
          <td>
            <strong>${st.fullName}</strong>
            <div style="font-size: 11px; color: var(--white-50);">${st.phone || 'Телефон не указан'}</div>
          </td>
          <td><span class="badge badge--dean">${st.groupCode}</span></td>
          <td>${st.studentCard}</td>
          <td>
            <span class="badge ${st.status === 'Отчислен' ? 'badge--status-expelled' : 'badge--debt'}">
              ${st.status === 'Отчислен' ? 'Отчислен' : `${st.debts.length} долг(а)`}
            </span>
          </td>
          <td>${debtsStr}</td>
        </tr>
      `;
    }).join('');

    containerEl.innerHTML = `
      <div class="reports-page__statement-sheet">
        <div class="reports-page__statement-header">
          <h2>Список академических должников</h2>
          <p>Сводная ведомость студентов, имеющих академические задолженности и недопуски</p>
        </div>

        <div class="datatable__table-wrapper" style="box-shadow: none;">
          <table class="datatable__table">
            <thead>
              <tr>
                <th style="width: 40px; text-align: center;">№</th>
                <th>Студент</th>
                <th style="width: 100px;">Группа</th>
                <th style="width: 120px;">Зачетка</th>
                <th style="width: 120px;">Статус</th>
                <th>Дисциплины с задолженностями</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  function renderQualityReport(containerEl, stats) {
    if (!stats) return;

    containerEl.innerHTML = `
      <div class="reports-page__statement-sheet">
        <div class="reports-page__statement-header">
          <h2>Аналитический отчет качества знаний</h2>
          <p>Обобщенные статистические показатели успеваемости по факультету</p>
        </div>

        <div class="reports-page__quality-grid">
          <div class="student-page__stat-card">
            <div class="student-page__stat-card-info">
              <span class="student-page__stat-card-value student-page__stat-card-value--accent">${stats.qualityPercent}%</span>
              <span class="student-page__stat-card-label">Качество знаний (% 4 и 5)</span>
            </div>
          </div>

          <div class="student-page__stat-card">
            <div class="student-page__stat-card-info">
              <span class="student-page__stat-card-value" style="color: var(--success);">${stats.successPercent}%</span>
              <span class="student-page__stat-card-label">Абсолютная успеваемость</span>
            </div>
          </div>

          <div class="student-page__stat-card">
            <div class="student-page__stat-card-info">
              <span class="student-page__stat-card-value">${stats.totalGrades}</span>
              <span class="student-page__stat-card-label">Всего выставлено оценок</span>
            </div>
          </div>

          <div class="student-page__stat-card">
            <div class="student-page__stat-card-info">
              <span class="student-page__stat-card-value">${stats.studentsCount}</span>
              <span class="student-page__stat-card-label">Студентов в базе</span>
            </div>
          </div>
        </div>

        <div style="background: rgba(255, 255, 255, 0.02); padding: 24px; border-radius: var(--radius-lg); border: 1px solid var(--grey-border);">
          <h3 style="font-size: 16px; font-weight: 700; color: var(--white-100); margin-bottom: 16px;">Распределение полученных оценок</h3>
          
          <div style="display: flex; flex-direction: column; gap: 12px;">
            <div>
              <div style="display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 4px;">
                <span>Оценки «Отлично» (5 / Зач)</span>
                <strong>${stats.count5}</strong>
              </div>
              <div style="height: 8px; border-radius: 4px; background: rgba(255,255,255,0.05); overflow: hidden;">
                <div style="height: 100%; width: ${(stats.count5 / (stats.totalGrades || 1)) * 100}%; background: var(--success);"></div>
              </div>
            </div>

            <div>
              <div style="display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 4px;">
                <span>Оценки «Хорошо» (4)</span>
                <strong>${stats.count4}</strong>
              </div>
              <div style="height: 8px; border-radius: 4px; background: rgba(255,255,255,0.05); overflow: hidden;">
                <div style="height: 100%; width: ${(stats.count4 / (stats.totalGrades || 1)) * 100}%; background: #60a5fa;"></div>
              </div>
            </div>

            <div>
              <div style="display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 4px;">
                <span>Оценки «Удовлетворительно» (3)</span>
                <strong>${stats.count3}</strong>
              </div>
              <div style="height: 8px; border-radius: 4px; background: rgba(255,255,255,0.05); overflow: hidden;">
                <div style="height: 100%; width: ${(stats.count3 / (stats.totalGrades || 1)) * 100}%; background: var(--warning);"></div>
              </div>
            </div>

            <div>
              <div style="display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 4px;">
                <span>Оценки «Неудовлетворительно» (2 / Незач)</span>
                <strong>${stats.count2}</strong>
              </div>
              <div style="height: 8px; border-radius: 4px; background: rgba(255,255,255,0.05); overflow: hidden;">
                <div style="height: 100%; width: ${(stats.count2 / (stats.totalGrades || 1)) * 100}%; background: var(--danger);"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // Слушатели фильтров
  const typeSelect = container.querySelector('#rep-type-select');
  const semSelect = container.querySelector('#rep-semester-select');
  const grSelect = container.querySelector('#rep-group-select');
  const discSelect = container.querySelector('#rep-discipline-select');

  typeSelect.addEventListener('change', () => {
    reportType = typeSelect.value;
    const subFilters = container.querySelectorAll('.rep-sub-filter');
    if (reportType === 'subject') {
      subFilters.forEach(f => f.style.display = 'flex');
    } else {
      subFilters.forEach(f => f.style.display = 'none');
    }
    generateReport();
  });

  semSelect.addEventListener('change', updateDisciplines);
  grSelect.addEventListener('change', () => {
    selectedGroupId = grSelect.value;
    generateReport();
  });
  discSelect.addEventListener('change', () => {
    selectedDisciplineId = discSelect.value;
    generateReport();
  });

  // Экспорт в Excel / CSV
  container.querySelector('#btn-export-excel').addEventListener('click', () => {
    if (!currentReportData) {
      toast.warning('Нет данных', 'Сначала сформируйте отчет');
      return;
    }

    if (reportType === 'subject') {
      if (!USE_MOCK) {
        window.location.href = `/api/v1/reports/export/subject?semester=${selectedSemester}&groupId=${selectedGroupId}&disciplineId=${selectedDisciplineId}`;
        toast.success('Экспорт выполнен', 'Ведомость скачивается с сервера в формате Excel (.csv)');
        return;
      }
      const headers = ['№', 'ФИО Студента', 'Номер зачетки', 'Лаб 1', 'Лаб 2', 'Лаб 3', 'Лаб 4', 'КР', 'Курсовая', 'Аттестация', 'Итоговый балл', 'Допуск'];
      const rows = currentReportData.rows.map(r => [
        r.num, r.studentName, r.studentCard, r.lab1, r.lab2, r.lab3, r.lab4, r.test, r.cw, r.exam, r.finalScore, r.isAdmitted
      ]);
      reportsApi.exportToCsv(`Ведомость_${currentReportData.groupCode}_${currentReportData.disciplineName}`, headers, rows);
      toast.success('Экспорт выполнен', 'Файл ведомости сохранен в формате CSV/Excel');
    } else if (reportType === 'debtors') {
      if (!USE_MOCK) {
        window.location.href = '/api/v1/reports/export/debtors';
        toast.success('Экспорт выполнен', 'Список должников скачивается с сервера в формате Excel (.csv)');
        return;
      }
      const headers = ['№', 'ФИО Студента', 'Группа', 'Зачетка', 'Статус', 'Телефон', 'Задолженности'];
      const rows = currentReportData.map((d, i) => [
        i + 1, d.fullName, d.groupCode, d.studentCard, d.status, d.phone, d.debts.map(x => `${x.disciplineName} (${x.reason})`).join(', ')
      ]);
      reportsApi.exportToCsv('Список_академических_должников', headers, rows);
      toast.success('Экспорт выполнен', 'Список должников успешно выгружен');
    } else if (reportType === 'quality') {
      const headers = ['Показатель', 'Значение'];
      const rows = [
        ['Качество знаний (% 4 и 5)', `${currentReportData.qualityPercent}%`],
        ['Абсолютная успеваемость', `${currentReportData.successPercent}%`],
        ['Всего оценок', currentReportData.totalGrades],
        ['Оценок 5 (Отлично)', currentReportData.count5],
        ['Оценок 4 (Хорошо)', currentReportData.count4],
        ['Оценок 3 (Удовл.)', currentReportData.count3],
        ['Оценок 2 (Неуд.)', currentReportData.count2]
      ];
      reportsApi.exportToCsv('Статистика_качества_знаний', headers, rows);
      toast.success('Экспорт выполнен', 'Статистика качества выгружена');
    }
  });

  // Печать
  container.querySelector('#btn-print-statement').addEventListener('click', () => {
    reportsApi.printStatement();
  });

  init();

  return container;
}
