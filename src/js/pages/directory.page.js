import { studentsApi } from '../api/students.api.js';
import { DataTable } from '../components/datatable.js';
import { modal } from '../components/modal.js';
import { toast } from '../components/toast.js';
import { validator } from '../components/validator.js';

export function renderDirectoryPage({ user }) {
  const container = document.createElement('div');
  container.className = 'page-container directory-page';

  let currentTab = 'students'; // students | groups | disciplines | teachers
  let dataTable = null;
  let cachedGroups = [];
  let cachedTeachers = [];

  const canEdit = user && (user.role === 'dean' || user.role === 'admin');

  container.innerHTML = `
    <div class="directory-page__header">
      <div>
        <h1 class="directory-page__title">Справочники системы</h1>
        <p style="font-size: 13px; color: var(--white-50); margin-top: 4px;">
          Управление реестрами студентов, академических групп, дисциплин и профессорско-преподавательского состава
        </p>
      </div>
      ${canEdit ? `
        <button type="button" class="btn btn--accent" id="btn-add-record">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
          <span id="btn-add-text">Добавить студента</span>
        </button>
      ` : ''}
    </div>

    <div class="directory-page__tabs">
      <button type="button" class="directory-page__tab-btn directory-page__tab-btn--active" data-tab="students">Студенты</button>
      <button type="button" class="directory-page__tab-btn" data-tab="groups">Группы</button>
      <button type="button" class="directory-page__tab-btn" data-tab="disciplines">Дисциплины</button>
      <button type="button" class="directory-page__tab-btn" data-tab="teachers">Преподаватели</button>
    </div>

    <div class="directory-page__content" id="directory-table-container">
      <div style="text-align: center; padding: 40px; color: var(--white-40);">Загрузка справочника...</div>
    </div>
  `;

  // Инициализация загрузки
  async function loadInitial() {
    try {
      const [grRes, tcRes] = await Promise.all([studentsApi.getGroups(), studentsApi.getTeachers()]);
      cachedGroups = grRes.data || [];
      cachedTeachers = tcRes.data || [];
      await switchTab('students');
    } catch (err) {
      toast.error('Ошибка загрузки', err.message);
    }
  }

  // Переключение вкладок
  async function switchTab(tab) {
    currentTab = tab;
    container.querySelectorAll('.directory-page__tab-btn').forEach(btn => {
      btn.classList.toggle('directory-page__tab-btn--active', btn.getAttribute('data-tab') === tab);
    });

    const addBtnText = container.querySelector('#btn-add-text');
    if (addBtnText) {
      if (tab === 'students') addBtnText.textContent = 'Добавить студента';
      else if (tab === 'groups') addBtnText.textContent = 'Добавить группу';
      else if (tab === 'disciplines') addBtnText.textContent = 'Добавить дисциплину';
      else if (tab === 'teachers') addBtnText.textContent = 'Добавить преподавателя';
    }

    const tableContainer = container.querySelector('#directory-table-container');
    tableContainer.innerHTML = '';

    if (tab === 'students') {
      await renderStudentsTab(tableContainer);
    } else if (tab === 'groups') {
      await renderGroupsTab(tableContainer);
    } else if (tab === 'disciplines') {
      await renderDisciplinesTab(tableContainer);
    } else if (tab === 'teachers') {
      await renderTeachersTab(tableContainer);
    }
  }

  // === ВКЛАДКА СТУДЕНТЫ ===
  async function renderStudentsTab(tableContainer) {
    const res = await studentsApi.getStudents();
    const students = res.data || [];

    const groupOptions = cachedGroups.map(g => ({ value: g.id, label: g.code }));

    dataTable = new DataTable({
      container: tableContainer,
      data: students,
      searchPlaceholder: 'Поиск по ФИО, номеру зачетки или группе...',
      filters: [
        {
          id: 'groupId',
          label: 'Группа',
          options: groupOptions,
          filterFn: (item, val) => item.groupId === val
        },
        {
          id: 'status',
          label: 'Статус',
          options: [
            { value: 'Учится', label: 'Учится' },
            { value: 'Академический отпуск', label: 'Академический отпуск' },
            { value: 'Отчислен', label: 'Отчислен' }
          ]
        }
      ],
      columns: [
        { key: 'studentCardNumber', title: 'Номер зачетки', sortable: true },
        { 
          key: 'fullName', 
          title: 'ФИО студента', 
          sortable: true,
          render: (val, item) => `
            <div style="font-weight: 700; color: var(--white-100);">${val}</div>
            <div style="font-size: 11px; color: var(--white-50);">${item.email || '—'}</div>
          `
        },
        { key: 'groupCode', title: 'Группа', sortable: true },
        {
          key: 'status',
          title: 'Статус',
          sortable: true,
          render: (val) => {
            let cls = 'badge--status-active';
            if (val === 'Академический отпуск') cls = 'badge--status-sabbatical';
            if (val === 'Отчислен') cls = 'badge--status-expelled';
            return `<span class="badge ${cls}"><span class="badge__dot"></span>${val}</span>`;
          }
        },
        {
          key: 'budget',
          title: 'Основа',
          sortable: true,
          render: (val) => val ? '<span style="color: var(--accent-light); font-weight: 600;">Бюджет</span>' : '<span style="color: var(--white-50);">Договор</span>'
        },
        {
          key: 'gpa',
          title: 'Средний балл',
          sortable: true,
          render: (val) => `<strong style="color: ${Number(val) >= 4.0 ? 'var(--success)' : 'var(--warning)'}; font-size: 14px;">${val || '—'}</strong>`
        }
      ],
      actions: canEdit ? [
        {
          name: 'edit',
          title: 'Редактировать',
          icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>`,
          onClick: (item) => openStudentModal(item)
        },
        {
          name: 'delete',
          title: 'Удалить',
          icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>`,
          onClick: (item) => confirmDeleteStudent(item)
        }
      ] : []
    });
  }

  // === ВКЛАДКА ГРУППЫ ===
  async function renderGroupsTab(tableContainer) {
    const res = await studentsApi.getGroups();
    const groups = res.data || [];
    cachedGroups = groups;

    dataTable = new DataTable({
      container: tableContainer,
      data: groups,
      searchPlaceholder: 'Поиск группы или специальности...',
      columns: [
        { key: 'code', title: 'Шифр группы', sortable: true, render: val => `<strong>${val}</strong>` },
        { key: 'course', title: 'Курс', sortable: true },
        { key: 'faculty', title: 'Факультет', sortable: true },
        { key: 'specialty', title: 'Специальность / Направление', sortable: true },
        { key: 'curator', title: 'Куратор', sortable: true },
        { key: 'studentCount', title: 'Студентов', sortable: true, render: val => `<span class="badge badge--dean">${val ?? 0} чел.</span>` }
      ],
      actions: canEdit ? [
        {
          name: 'edit',
          title: 'Редактировать',
          icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>`,
          onClick: (item) => openGroupModal(item)
        },
        {
          name: 'delete',
          title: 'Удалить',
          icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>`,
          onClick: (item) => confirmDeleteGroup(item)
        }
      ] : []
    });
  }

  // === ВКЛАДКА ДИСЦИПЛИНЫ ===
  async function renderDisciplinesTab(tableContainer) {
    const res = await studentsApi.getDisciplines();
    const disciplines = res.data || [];

    dataTable = new DataTable({
      container: tableContainer,
      data: disciplines,
      searchPlaceholder: 'Поиск дисциплины или кафедры...',
      columns: [
        { key: 'code', title: 'Код', sortable: true },
        { key: 'name', title: 'Наименование дисциплины', sortable: true, render: val => `<strong>${val}</strong>` },
        { key: 'semester', title: 'Семестр', sortable: true },
        { key: 'hours', title: 'Академ. часы', sortable: true, render: val => `${val} ч.` },
        { 
          key: 'controlType', 
          title: 'Форма контроля', 
          sortable: true,
          render: (val) => `<span class="badge ${val === 'Экзамен' ? 'badge--debt' : 'badge--dean'}">${val}</span>`
        },
        { 
          key: 'teacherId', 
          title: 'Преподаватель', 
          sortable: true,
          render: (val) => {
            const t = cachedTeachers.find(item => item.id === val);
            return t ? t.fullName : 'Не назначен';
          }
        }
      ],
      actions: canEdit ? [
        {
          name: 'edit',
          title: 'Редактировать',
          icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>`,
          onClick: (item) => openDisciplineModal(item)
        },
        {
          name: 'delete',
          title: 'Удалить',
          icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>`,
          onClick: (item) => confirmDeleteDiscipline(item)
        }
      ] : []
    });
  }

  // === ВКЛАДКА ПРЕПОДАВАТЕЛИ ===
  async function renderTeachersTab(tableContainer) {
    const res = await studentsApi.getTeachers();
    const teachers = res.data || [];

    dataTable = new DataTable({
      container: tableContainer,
      data: teachers,
      searchPlaceholder: 'Поиск преподавателя...',
      columns: [
        { key: 'fullName', title: 'ФИО преподавателя', sortable: true, render: val => `<strong>${val}</strong>` },
        { key: 'degree', title: 'Степень / Звание', sortable: true },
        { key: 'department', title: 'Кафедра', sortable: true },
        { key: 'email', title: 'Email', sortable: true },
        { key: 'phone', title: 'Телефон', sortable: true }
      ],
      actions: canEdit ? [
        {
          name: 'edit',
          title: 'Редактировать',
          icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>`,
          onClick: (item) => openTeacherModal(item)
        },
        {
          name: 'delete',
          title: 'Удалить',
          icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>`,
          onClick: (item) => confirmDeleteTeacher(item)
        }
      ] : []
    });
  }

  // === МОДАЛКИ СТУДЕНТА ===
  function openStudentModal(student = null) {
    const isEdit = !!student;
    const title = isEdit ? 'Редактирование студента' : 'Добавление нового студента';

    const groupOptions = cachedGroups.map(g => 
      `<option value="${g.id}" ${student && student.groupId === g.id ? 'selected' : ''}>${g.code} (${g.specialty})</option>`
    ).join('');

    const formHtml = `
      <form id="student-form" novalidate>
        <div class="form-row">
          <div class="form-group">
            <label class="form-group__label">ФИО студента <span class="required">*</span></label>
            <input type="text" name="fullName" class="form-group__input" value="${student ? student.fullName : ''}" placeholder="Иванов Иван Иванович" required>
          </div>
          <div class="form-group">
            <label class="form-group__label">Номер зачетной книжки <span class="required">*</span></label>
            <input type="text" name="studentCardNumber" class="form-group__input" value="${student ? student.studentCardNumber : ''}" placeholder="22-ПИ-099" required>
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label class="form-group__label">Академическая группа <span class="required">*</span></label>
            <select name="groupId" class="form-group__select" required>
              <option value="">Выберите группу...</option>
              ${groupOptions}
            </select>
          </div>
          <div class="form-group">
            <label class="form-group__label">Статус обучения</label>
            <select name="status" class="form-group__select">
              <option value="Учится" ${student && student.status === 'Учится' ? 'selected' : ''}>Учится</option>
              <option value="Академический отпуск" ${student && student.status === 'Академический отпуск' ? 'selected' : ''}>Академический отпуск</option>
              <option value="Отчислен" ${student && student.status === 'Отчислен' ? 'selected' : ''}>Отчислен</option>
            </select>
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label class="form-group__label">Email</label>
            <input type="email" name="email" class="form-group__input" value="${student ? student.email : ''}" placeholder="student@stud.university.edu">
          </div>
          <div class="form-group">
            <label class="form-group__label">Телефон</label>
            <input type="text" name="phone" class="form-group__input" value="${student ? student.phone : ''}" placeholder="+7 (999) 000-00-00">
          </div>
        </div>

        <div class="form-group" style="flex-direction: row; align-items: center; gap: 10px; margin-top: 6px;">
          <input type="checkbox" name="budget" id="chk-budget" ${!student || student.budget ? 'checked' : ''} style="width: 18px; height: 18px; accent-color: var(--accent); cursor: pointer;">
          <label for="chk-budget" style="font-size: 13px; color: var(--white-90); cursor: pointer;">Бюджетная основа обучения</label>
        </div>
      </form>
    `;

    const footerHtml = `
      <button type="button" class="btn btn--secondary btn-close-modal">Отмена</button>
      <button type="button" class="btn btn--accent btn-save-student">${isEdit ? 'Сохранить изменения' : 'Добавить студента'}</button>
    `;

    modal.open({
      title,
      content: formHtml,
      footer: footerHtml,
      size: 'large',
      onOpen: (dialog) => {
        dialog.querySelector('.btn-close-modal').addEventListener('click', () => modal.close());

        dialog.querySelector('.btn-save-student').addEventListener('click', async () => {
          const form = dialog.querySelector('#student-form');
          const check = validator.validate(form, {
            fullName: [{ required: true, message: 'Укажите ФИО студента' }, { minLength: 3 }],
            studentCardNumber: [{ required: true, message: 'Укажите номер зачетной книжки' }],
            groupId: [{ required: true, message: 'Выберите группу' }]
          });

          if (!check.isValid) return;

          const data = {
            fullName: form.elements.fullName.value.trim(),
            studentCardNumber: form.elements.studentCardNumber.value.trim(),
            groupId: form.elements.groupId.value,
            status: form.elements.status.value,
            email: form.elements.email.value.trim(),
            phone: form.elements.phone.value.trim(),
            budget: form.elements.budget.checked
          };

          try {
            if (isEdit) {
              await studentsApi.updateStudent(student.id, data);
              toast.success('Сохранено', `Данные студента ${data.fullName} обновлены`);
            } else {
              await studentsApi.createStudent(data);
              toast.success('Создано', `Студент ${data.fullName} успешно зачислен`);
            }
            modal.close();
            await switchTab('students');
          } catch (err) {
            toast.error('Ошибка сохранения', err.message);
          }
        });
      }
    });
  }

  function confirmDeleteStudent(student) {
    modal.confirm({
      title: 'Удаление студента',
      message: `Вы действительно хотите удалить студента <strong>${student.fullName}</strong> (${student.studentCardNumber})? Это действие нельзя отменить.`,
      confirmText: 'Да, удалить',
      confirmType: 'danger',
      onConfirm: async () => {
        try {
          await studentsApi.deleteStudent(student.id);
          toast.success('Удалено', `Студент ${student.fullName} удален`);
          await switchTab('students');
        } catch (err) {
          toast.error('Ошибка удаления', err.message);
        }
      }
    });
  }

  // === МОДАЛКА ГРУППЫ ===
  function openGroupModal(group = null) {
    const isEdit = !!group;
    const title = isEdit ? 'Редактирование группы' : 'Создание академической группы';

    const formHtml = `
      <form id="group-form" novalidate>
        <div class="form-row">
          <div class="form-group">
            <label class="form-group__label">Шифр группы <span class="required">*</span></label>
            <input type="text" name="code" class="form-group__input" value="${group ? group.code : ''}" placeholder="ПИ-21" required>
          </div>
          <div class="form-group">
            <label class="form-group__label">Курс (1-6) <span class="required">*</span></label>
            <input type="number" name="course" min="1" max="6" class="form-group__input" value="${group ? group.course : 1}" required>
          </div>
        </div>

        <div class="form-group">
          <label class="form-group__label">Специальность / Направление <span class="required">*</span></label>
          <input type="text" name="specialty" class="form-group__input" value="${group ? group.specialty : ''}" placeholder="09.03.04 Программная инженерия" required>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label class="form-group__label">Факультет</label>
            <input type="text" name="faculty" class="form-group__input" value="${group ? group.faculty : 'ФИТ'}">
          </div>
          <div class="form-group">
            <label class="form-group__label">Куратор группы</label>
            <input type="text" name="curator" class="form-group__input" value="${group ? group.curator : ''}" placeholder="Кузнецов Д.С.">
          </div>
        </div>
      </form>
    `;

    modal.open({
      title,
      content: formHtml,
      footer: `
        <button type="button" class="btn btn--secondary btn-close-modal">Отмена</button>
        <button type="button" class="btn btn--accent btn-save-group">${isEdit ? 'Сохранить' : 'Создать'}</button>
      `,
      onOpen: (dialog) => {
        dialog.querySelector('.btn-close-modal').addEventListener('click', () => modal.close());
        dialog.querySelector('.btn-save-group').addEventListener('click', async () => {
          const form = dialog.querySelector('#group-form');
          const check = validator.validate(form, {
            code: [{ required: true, message: 'Укажите шифр группы' }],
            course: [{ required: true, message: 'Укажите курс' }],
            specialty: [{ required: true, message: 'Укажите специальность' }]
          });
          if (!check.isValid) return;

          const data = {
            code: form.elements.code.value.trim(),
            course: parseInt(form.elements.course.value, 10),
            specialty: form.elements.specialty.value.trim(),
            faculty: form.elements.faculty.value.trim(),
            curator: form.elements.curator.value.trim()
          };

          try {
            if (isEdit) {
              await studentsApi.updateGroup(group.id, data);
              toast.success('Сохранено', `Группа ${data.code} обновлена`);
            } else {
              await studentsApi.createGroup(data);
              toast.success('Создано', `Группа ${data.code} добавлена`);
            }
            modal.close();
            const grRes = await studentsApi.getGroups();
            cachedGroups = grRes.data || [];
            await switchTab('groups');
          } catch (err) {
            toast.error('Ошибка', err.message);
          }
        });
      }
    });
  }

  function confirmDeleteGroup(group) {
    modal.confirm({
      title: 'Удаление группы',
      message: `Удалить группу <strong>${group.code}</strong>? Студенты этой группы могут остаться без привязки!`,
      confirmText: 'Удалить группу',
      onConfirm: async () => {
        try {
          await studentsApi.deleteGroup(group.id);
          toast.success('Удалено', `Группа ${group.code} удалена`);
          const grRes = await studentsApi.getGroups();
          cachedGroups = grRes.data || [];
          await switchTab('groups');
        } catch (err) {
          toast.error('Ошибка', err.message);
        }
      }
    });
  }

  // === МОДАЛКА ДИСЦИПЛИНЫ ===
  function openDisciplineModal(disc = null) {
    const isEdit = !!disc;
    const title = isEdit ? 'Редактирование дисциплины' : 'Создание дисциплины';

    const teacherOptions = cachedTeachers.map(t => 
      `<option value="${t.id}" ${disc && disc.teacherId === t.id ? 'selected' : ''}>${t.fullName} (${t.department})</option>`
    ).join('');

    const formHtml = `
      <form id="disc-form" novalidate>
        <div class="form-row">
          <div class="form-group">
            <label class="form-group__label">Код дисциплины <span class="required">*</span></label>
            <input type="text" name="code" class="form-group__input" value="${disc ? disc.code : ''}" placeholder="SE-301" required>
          </div>
          <div class="form-group">
            <label class="form-group__label">Семестр (1-8) <span class="required">*</span></label>
            <input type="number" name="semester" min="1" max="8" class="form-group__input" value="${disc ? disc.semester : 5}" required>
          </div>
        </div>

        <div class="form-group">
          <label class="form-group__label">Наименование дисциплины <span class="required">*</span></label>
          <input type="text" name="name" class="form-group__input" value="${disc ? disc.name : ''}" placeholder="Программная инженерия" required>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label class="form-group__label">Форма контроля</label>
            <select name="controlType" class="form-group__select">
              <option value="Экзамен" ${disc && disc.controlType === 'Экзамен' ? 'selected' : ''}>Экзамен</option>
              <option value="Зачет" ${disc && disc.controlType === 'Зачет' ? 'selected' : ''}>Зачет</option>
              <option value="Диф. зачет" ${disc && disc.controlType === 'Диф. зачет' ? 'selected' : ''}>Диф. зачет</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-group__label">Академические часы</label>
            <input type="number" name="hours" class="form-group__input" value="${disc ? disc.hours : 144}">
          </div>
        </div>

        <div class="form-group">
          <label class="form-group__label">Ведущий преподаватель</label>
          <select name="teacherId" class="form-group__select">
            <option value="">Выберите преподавателя...</option>
            ${teacherOptions}
          </select>
        </div>
      </form>
    `;

    modal.open({
      title,
      content: formHtml,
      footer: `
        <button type="button" class="btn btn--secondary btn-close-modal">Отмена</button>
        <button type="button" class="btn btn--accent btn-save-disc">${isEdit ? 'Сохранить' : 'Создать'}</button>
      `,
      onOpen: (dialog) => {
        dialog.querySelector('.btn-close-modal').addEventListener('click', () => modal.close());
        dialog.querySelector('.btn-save-disc').addEventListener('click', async () => {
          const form = dialog.querySelector('#disc-form');
          const check = validator.validate(form, {
            code: [{ required: true, message: 'Укажите код' }],
            name: [{ required: true, message: 'Укажите название дисциплины' }],
            semester: [{ required: true, message: 'Укажите семестр' }]
          });
          if (!check.isValid) return;

          const data = {
            code: form.elements.code.value.trim(),
            name: form.elements.name.value.trim(),
            semester: parseInt(form.elements.semester.value, 10),
            controlType: form.elements.controlType.value,
            hours: parseInt(form.elements.hours.value, 10) || 144,
            teacherId: form.elements.teacherId.value
          };

          try {
            if (isEdit) {
              await studentsApi.updateDiscipline(disc.id, data);
              toast.success('Сохранено', `Дисциплина ${data.name} обновлена`);
            } else {
              await studentsApi.createDiscipline(data);
              toast.success('Создано', `Дисциплина ${data.name} добавлена`);
            }
            modal.close();
            await switchTab('disciplines');
          } catch (err) {
            toast.error('Ошибка', err.message);
          }
        });
      }
    });
  }

  function confirmDeleteDiscipline(disc) {
    modal.confirm({
      title: 'Удаление дисциплины',
      message: `Удалить предмет <strong>${disc.name}</strong>?`,
      confirmText: 'Удалить',
      onConfirm: async () => {
        try {
          await studentsApi.deleteDiscipline(disc.id);
          toast.success('Удалено', `Дисциплина ${disc.name} удалена`);
          await switchTab('disciplines');
        } catch (err) {
          toast.error('Ошибка', err.message);
        }
      }
    });
  }

  // === МОДАЛКА ПРЕПОДАВАТЕЛЯ ===
  function openTeacherModal(teacher = null) {
    const isEdit = !!teacher;
    const title = isEdit ? 'Редактирование преподавателя' : 'Добавление преподавателя';

    const formHtml = `
      <form id="teacher-form" novalidate>
        <div class="form-group">
          <label class="form-group__label">ФИО преподавателя <span class="required">*</span></label>
          <input type="text" name="fullName" class="form-group__input" value="${teacher ? teacher.fullName : ''}" placeholder="Кузнецов Дмитрий Сергеевич" required>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label class="form-group__label">Ученая степень / Должность</label>
            <input type="text" name="degree" class="form-group__input" value="${teacher ? teacher.degree : 'к.т.н., доцент'}">
          </div>
          <div class="form-group">
            <label class="form-group__label">Кафедра</label>
            <input type="text" name="department" class="form-group__input" value="${teacher ? teacher.department : 'Программная инженерия'}">
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label class="form-group__label">Email</label>
            <input type="email" name="email" class="form-group__input" value="${teacher ? teacher.email : ''}" placeholder="teacher@university.edu">
          </div>
          <div class="form-group">
            <label class="form-group__label">Телефон</label>
            <input type="text" name="phone" class="form-group__input" value="${teacher ? teacher.phone : ''}" placeholder="+7 (911) 000-00-00">
          </div>
        </div>
      </form>
    `;

    modal.open({
      title,
      content: formHtml,
      footer: `
        <button type="button" class="btn btn--secondary btn-close-modal">Отмена</button>
        <button type="button" class="btn btn--accent btn-save-teacher">${isEdit ? 'Сохранить' : 'Добавить'}</button>
      `,
      onOpen: (dialog) => {
        dialog.querySelector('.btn-close-modal').addEventListener('click', () => modal.close());
        dialog.querySelector('.btn-save-teacher').addEventListener('click', async () => {
          const form = dialog.querySelector('#teacher-form');
          const check = validator.validate(form, {
            fullName: [{ required: true, message: 'Укажите ФИО' }]
          });
          if (!check.isValid) return;

          const data = {
            fullName: form.elements.fullName.value.trim(),
            degree: form.elements.degree.value.trim(),
            department: form.elements.department.value.trim(),
            email: form.elements.email.value.trim(),
            phone: form.elements.phone.value.trim()
          };

          try {
            if (isEdit) {
              await studentsApi.updateTeacher(teacher.id, data);
              toast.success('Сохранено', `Преподаватель ${data.fullName} обновлен`);
            } else {
              await studentsApi.createTeacher(data);
              toast.success('Создано', `Преподаватель ${data.fullName} добавлен`);
            }
            modal.close();
            const tcRes = await studentsApi.getTeachers();
            cachedTeachers = tcRes.data || [];
            await switchTab('teachers');
          } catch (err) {
            toast.error('Ошибка', err.message);
          }
        });
      }
    });
  }

  function confirmDeleteTeacher(teacher) {
    modal.confirm({
      title: 'Удаление преподавателя',
      message: `Удалить преподавателя <strong>${teacher.fullName}</strong>?`,
      confirmText: 'Удалить',
      onConfirm: async () => {
        try {
          await studentsApi.deleteTeacher(teacher.id);
          toast.success('Удалено', `Преподаватель ${teacher.fullName} удален`);
          const tcRes = await studentsApi.getTeachers();
          cachedTeachers = tcRes.data || [];
          await switchTab('teachers');
        } catch (err) {
          toast.error('Ошибка', err.message);
        }
      }
    });
  }

  // Общий обработчик верхней кнопки "Добавить..."
  const mainAddBtn = container.querySelector('#btn-add-record');
  if (mainAddBtn) {
    mainAddBtn.addEventListener('click', () => {
      if (currentTab === 'students') openStudentModal();
      else if (currentTab === 'groups') openGroupModal();
      else if (currentTab === 'disciplines') openDisciplineModal();
      else if (currentTab === 'teachers') openTeacherModal();
    });
  }

  // Привязка кликов по вкладкам
  container.querySelectorAll('.directory-page__tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const tab = btn.getAttribute('data-tab');
      switchTab(tab);
    });
  });

  loadInitial();

  return container;
}
