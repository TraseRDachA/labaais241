import { studentsApi } from '../api/students.api.js';
import { gradesApi } from '../api/grades.api.js';
import { toast } from '../components/toast.js';

export function renderJournalPage({ user }) {
  const container = document.createElement('div');
  container.className = 'page-container journal-page';

  let semester = 5;
  let selectedGroupId = '';
  let selectedDisciplineId = '';
  let groups = [];
  let disciplines = [];
  let journalData = [];

  const canEditGrades = user && (user.role === 'teacher' || user.role === 'admin');

  container.innerHTML = `
    <div class="journal-page__header">
      <div>
        <h1 style="font-size: 26px; font-weight: 800; color: var(--white-100);">Электронный журнал успеваемости</h1>
        <p style="font-size: 13px; color: var(--white-50); margin-top: 4px;">
          Оперативный учет текущих и рубежных контрольных точек, расчет допуска к сессии
        </p>
      </div>
      <div style="display: flex; align-items: center; gap: 8px;">
        ${!canEditGrades ? `
          <span class="badge badge--dean">Режим только для чтения</span>
        ` : `
          <span class="badge badge--status-active"><span class="badge__dot"></span>Режим редактирования (in-place)</span>
        `}
      </div>
    </div>

    <!-- Каскадные селекторы -->
    <div class="journal-page__selectors-bar">
      <div class="journal-page__selector-group" style="max-width: 140px; min-width: 120px;">
        <label>Семестр</label>
        <select id="select-semester">
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

      <div class="journal-page__selector-group">
        <label>Академическая группа</label>
        <select id="select-group">
          <option value="">Загрузка групп...</option>
        </select>
      </div>

      <div class="journal-page__selector-group">
        <label>Дисциплина</label>
        <select id="select-discipline">
          <option value="">Сначала выберите группу...</option>
        </select>
      </div>
    </div>

    <div class="journal-page__meta-bar" id="journal-meta-bar" style="display: none;">
      <div>Преподаватель: <strong id="meta-teacher">—</strong></div>
      <div>Форма контроля: <strong id="meta-control">—</strong></div>
      <div>Всего студентов: <strong id="meta-total-students">0</strong></div>
    </div>

    <!-- Таблица журнала -->
    <div class="journal-page__table-wrapper" id="journal-table-wrapper">
      <div style="text-align: center; padding: 48px; color: var(--white-40); font-size: 14px;">
        Выберите семестр, группу и дисциплину для отображения журнала оценок
      </div>
    </div>

    <!-- Легенда и подсказка -->
    <div class="journal-page__legend">
      <div style="font-weight: 700; color: var(--white-80); margin-right: 8px;">Цветовая шкала:</div>
      <div class="journal-page__legend-item">
        <span class="journal-page__cell journal-page__cell--score-5" style="width: 28px; height: 24px; font-size: 12px;">5</span>
        <span>Отлично (Зач)</span>
      </div>
      <div class="journal-page__legend-item">
        <span class="journal-page__cell journal-page__cell--score-4" style="width: 28px; height: 24px; font-size: 12px;">4</span>
        <span>Хорошо</span>
      </div>
      <div class="journal-page__legend-item">
        <span class="journal-page__cell journal-page__cell--score-3" style="width: 28px; height: 24px; font-size: 12px;">3</span>
        <span>Удовлетворительно</span>
      </div>
      <div class="journal-page__legend-item">
        <span class="journal-page__cell journal-page__cell--score-2" style="width: 28px; height: 24px; font-size: 12px;">2</span>
        <span>Неудовлетворительно (Незач)</span>
      </div>
      ${canEditGrades ? `
        <div style="margin-left: auto; color: var(--white-40); font-size: 11px;">
          💡 Кликните по ячейке оценки для быстрого редактирования
        </div>
      ` : ''}
    </div>
  `;

  // Инициализация каскадов
  async function init() {
    try {
      const [grRes, discRes] = await Promise.all([studentsApi.getGroups(), studentsApi.getDisciplines()]);
      groups = grRes.data || [];
      disciplines = discRes.data || [];

      // Заполняем группы
      const groupSelect = container.querySelector('#select-group');
      groupSelect.innerHTML = groups.map(g => `<option value="${g.id}">${g.code} (${g.course} курс, ${g.specialty})</option>`).join('');

      if (groups.length > 0) {
        selectedGroupId = groups[0].id;
        updateDisciplinesList();
      }
    } catch (err) {
      toast.error('Ошибка инициализации журнала', err.message);
    }
  }

  function updateDisciplinesList() {
    const semSelect = container.querySelector('#select-semester');
    semester = parseInt(semSelect.value, 10);

    const filteredDiscs = disciplines.filter(d => Number(d.semester) === semester);
    const discSelect = container.querySelector('#select-discipline');

    if (filteredDiscs.length === 0) {
      discSelect.innerHTML = `<option value="">Нет дисциплин в ${semester} семестре</option>`;
      selectedDisciplineId = '';
      renderEmptyState('В выбранном семестре отсутствуют зарегистрированные дисциплины');
      return;
    }

    discSelect.innerHTML = filteredDiscs.map(d => `<option value="${d.id}">${d.code}: ${d.name} (${d.controlType})</option>`).join('');
    selectedDisciplineId = filteredDiscs[0].id;

    loadJournal();
  }

  async function loadJournal() {
    if (!selectedGroupId || !selectedDisciplineId) return;

    const wrapper = container.querySelector('#journal-table-wrapper');
    wrapper.innerHTML = `<div style="text-align: center; padding: 48px; color: var(--white-50);">Загрузка ведомости успеваемости...</div>`;

    try {
      const res = await gradesApi.getJournalGrades(semester, selectedGroupId, selectedDisciplineId);
      journalData = res.data || [];

      // Мета-информация
      const disc = disciplines.find(d => d.id === selectedDisciplineId);
      const metaBar = container.querySelector('#journal-meta-bar');
      if (disc && metaBar) {
        metaBar.style.display = 'flex';
        studentsApi.getTeachers().then(tcRes => {
          const t = (tcRes.data || []).find(item => item.id === disc.teacherId);
          container.querySelector('#meta-teacher').textContent = t ? t.fullName : 'Кафедра';
        });
        container.querySelector('#meta-control').textContent = disc.controlType;
        container.querySelector('#meta-total-students').textContent = journalData.length;
      }

      renderTable();
    } catch (err) {
      toast.error('Ошибка загрузки оценок', err.message);
    }
  }

  function renderEmptyState(msg) {
    const wrapper = container.querySelector('#journal-table-wrapper');
    wrapper.innerHTML = `<div style="text-align: center; padding: 48px; color: var(--white-40);">${msg}</div>`;
    container.querySelector('#journal-meta-bar').style.display = 'none';
  }

  function getScoreClass(val) {
    if (val === 5 || val === '5') return 'journal-page__cell--score-5';
    if (val === 4 || val === '4') return 'journal-page__cell--score-4';
    if (val === 3 || val === '3') return 'journal-page__cell--score-3';
    if (val === 2 || val === '2') return 'journal-page__cell--score-2';
    if (val === 'Зач') return 'journal-page__cell--pass';
    if (val === 'Незач') return 'journal-page__cell--fail';
    return 'journal-page__cell--empty';
  }

  function renderTable() {
    const wrapper = container.querySelector('#journal-table-wrapper');
    const disc = disciplines.find(d => d.id === selectedDisciplineId);
    const isCredit = disc && disc.controlType === 'Зачет';

    if (journalData.length === 0) {
      wrapper.innerHTML = `<div style="text-align: center; padding: 48px; color: var(--white-40);">В этой группе нет студентов</div>`;
      return;
    }

    let rowsHtml = journalData.map((row, idx) => {
      const isAdmittedBadge = row.isAdmitted
        ? `<span class="badge badge--admitted">Допущен</span>`
        : `<span class="badge badge--not-admitted">Не допущен</span>`;

      return `
        <tr data-student-id="${row.studentId}">
          <td style="color: var(--white-40); font-weight: 600;">${idx + 1}</td>
          <td>
            <div style="font-weight: 700; color: var(--white-100);">${row.studentName}</div>
            <div style="font-size: 11px; color: var(--white-40);">${row.studentCardNumber} (${row.studentStatus})</div>
          </td>
          <td>${renderCell(row.studentId, 'lab1', row.lab1, isCredit)}</td>
          <td>${renderCell(row.studentId, 'lab2', row.lab2, isCredit)}</td>
          <td>${renderCell(row.studentId, 'lab3', row.lab3, isCredit)}</td>
          <td>${renderCell(row.studentId, 'lab4', row.lab4, isCredit)}</td>
          <td>${renderCell(row.studentId, 'test', row.test, isCredit)}</td>
          <td>${renderCell(row.studentId, 'cw', row.cw, isCredit)}</td>
          <td style="background: rgba(255, 255, 255, 0.01);">${renderCell(row.studentId, 'exam', row.exam, isCredit)}</td>
          <td style="font-size: 15px; font-weight: 800; color: ${Number(row.finalScore) >= 4 ? 'var(--success)' : Number(row.finalScore) >= 3 ? 'var(--warning)' : 'var(--danger)'};" class="cell-final-score">
            ${row.finalScore ?? '0.00'}
          </td>
          <td class="cell-admitted-status">${isAdmittedBadge}</td>
        </tr>
      `;
    }).join('');

    wrapper.innerHTML = `
      <table class="journal-page__table">
        <thead>
          <tr>
            <th style="width: 40px;">№</th>
            <th>Студент (ФИО / Номер зачетки)</th>
            <th style="width: 70px;">Лаб 1</th>
            <th style="width: 70px;">Лаб 2</th>
            <th style="width: 70px;">Лаб 3</th>
            <th style="width: 70px;">Лаб 4</th>
            <th style="width: 70px;">Контр. раб.</th>
            <th style="width: 70px;">Курсовая</th>
            <th style="width: 80px; background: rgba(101, 64, 251, 0.1); color: var(--white-100);">${disc ? disc.controlType : 'Аттестация'}</th>
            <th style="width: 90px;">Средний балл</th>
            <th style="width: 110px;">Допуск</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml}
        </tbody>
      </table>
    `;

    if (canEditGrades) {
      attachCellEvents();
    }
  }

  function renderCell(studentId, field, val, isCredit) {
    const displayVal = val !== undefined && val !== null && val !== '' ? val : '—';
    const cls = getScoreClass(val);
    return `
      <div class="journal-page__cell ${cls}" data-student="${studentId}" data-field="${field}" data-credit="${isCredit ? 'true' : 'false'}">
        ${displayVal}
      </div>
    `;
  }

  function attachCellEvents() {
    container.querySelectorAll('.journal-page__cell[data-field]').forEach(cell => {
      cell.addEventListener('click', () => {
        // Если уже в режиме редактирования - игнорируем
        if (cell.querySelector('input') || cell.querySelector('select')) return;

        const studentId = cell.getAttribute('data-student');
        const field = cell.getAttribute('data-field');
        const isCredit = cell.getAttribute('data-credit') === 'true';
        const currentText = cell.textContent.trim();
        const initialVal = currentText === '—' ? '' : currentText;

        if (isCredit) {
          // Селект Зач/Незач
          cell.innerHTML = `
            <select class="journal-page__cell-select">
              <option value="">—</option>
              <option value="Зач" ${initialVal === 'Зач' ? 'selected' : ''}>Зач</option>
              <option value="Незач" ${initialVal === 'Незач' ? 'selected' : ''}>Незач</option>
            </select>
          `;
          const sel = cell.querySelector('select');
          sel.focus();

          const handleSave = async () => {
            const newVal = sel.value;
            await saveCellGrade(studentId, field, newVal, cell);
          };

          sel.addEventListener('change', handleSave);
          sel.addEventListener('blur', handleSave);
        } else {
          // Числовой инпут (2..5)
          cell.innerHTML = `
            <input type="text" class="journal-page__cell-input" maxlength="1" value="${initialVal}">
          `;
          const inp = cell.querySelector('input');
          inp.focus();
          inp.select();

          let saved = false;
          const handleSave = async () => {
            if (saved) return;
            saved = true;
            let val = inp.value.trim();
            if (val !== '' && !['2', '3', '4', '5'].includes(val)) {
              toast.warning('Некорректная оценка', 'Допустимые значения: 2, 3, 4, 5 или пусто');
              val = initialVal;
            }
            await saveCellGrade(studentId, field, val ? parseInt(val, 10) : '', cell);
          };

          inp.addEventListener('blur', handleSave);
          inp.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
              inp.blur();
            } else if (e.key === 'Escape') {
              saved = true;
              cell.innerHTML = initialVal || '—';
              cell.className = `journal-page__cell ${getScoreClass(initialVal)}`;
            }
          });
        }
      });
    });
  }

  async function saveCellGrade(studentId, field, value, cellElement) {
    cellElement.classList.add('journal-page__cell--saving');
    try {
      const res = await gradesApi.updateGrade(semester, selectedGroupId, selectedDisciplineId, studentId, field, value);
      const updatedRow = res.data;

      // Обновляем визуальное отображение ячейки
      cellElement.className = `journal-page__cell ${getScoreClass(value)} journal-page__cell--saved`;
      cellElement.textContent = value !== '' ? value : '—';

      // Обновляем средний балл и статус допуска в строке таблицы
      const tr = container.querySelector(`tr[data-student-id="${studentId}"]`);
      if (tr && updatedRow) {
        const scoreCell = tr.querySelector('.cell-final-score');
        const admitCell = tr.querySelector('.cell-admitted-status');
        if (scoreCell) {
          scoreCell.textContent = updatedRow.finalScore;
          scoreCell.style.color = Number(updatedRow.finalScore) >= 4 ? 'var(--success)' : Number(updatedRow.finalScore) >= 3 ? 'var(--warning)' : 'var(--danger)';
        }
        if (admitCell) {
          admitCell.innerHTML = updatedRow.isAdmitted
            ? `<span class="badge badge--admitted">Допущен</span>`
            : `<span class="badge badge--not-admitted">Не допущен</span>`;
        }
      }
    } catch (err) {
      toast.error('Не удалось сохранить', err.message);
      cellElement.textContent = '—';
    } finally {
      cellElement.classList.remove('journal-page__cell--saving');
    }
  }

  // Слушатели каскадных селекторов
  const semSelect = container.querySelector('#select-semester');
  const groupSelect = container.querySelector('#select-group');
  const discSelect = container.querySelector('#select-discipline');

  semSelect.addEventListener('change', () => {
    semester = parseInt(semSelect.value, 10);
    updateDisciplinesList();
  });

  groupSelect.addEventListener('change', () => {
    selectedGroupId = groupSelect.value;
    loadJournal();
  });

  discSelect.addEventListener('change', () => {
    selectedDisciplineId = discSelect.value;
    loadJournal();
  });

  init();

  return container;
}
