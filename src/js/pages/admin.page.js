import { getMockDb, saveMockDb, logAuditAction } from '../api/client.js';
import { DataTable } from '../components/datatable.js';
import { modal } from '../components/modal.js';
import { toast } from '../components/toast.js';
import { validator } from '../components/validator.js';

export function renderAdminPage({ user }) {
  const container = document.createElement('div');
  container.className = 'page-container admin-page';

  container.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px;">
      <div>
        <h1 style="font-size: 26px; font-weight: 800; color: var(--white-100);">Панель системного администрирования</h1>
        <p style="font-size: 13px; color: var(--white-50); margin-top: 4px;">
          Управление учетными записями пользователей, ролевой моделью RBAC и мониторинг журнала аудита
        </p>
      </div>

      <button type="button" class="btn btn--accent" id="btn-add-user">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><line x1="19" y1="8" x2="19" y2="14"></line><line x1="22" y1="11" x2="16" y2="11"></line></svg>
        Создать пользователя
      </button>
    </div>

    <div class="admin-page__grid">
      <!-- Пользователи системы -->
      <div class="admin-page__card">
        <div class="admin-page__card-header">
          <h2 class="admin-page__card-title">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--accent-light)" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
            Пользователи и уровни доступа
          </h2>
        </div>

        <div id="admin-users-table-container"></div>
      </div>

      <!-- Журнал аудита действий -->
      <div class="admin-page__card">
        <div class="admin-page__card-header">
          <h2 class="admin-page__card-title">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--accent-light)" stroke-width="2"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
            Журнал аудита безопасности (Audit Log)
          </h2>
          <button type="button" class="btn btn--secondary btn--sm" id="btn-clear-logs">Очистить лог</button>
        </div>

        <div id="admin-logs-table-container"></div>
      </div>
    </div>
  `;

  function renderUsersTable() {
    const db = getMockDb();
    const users = db.users || [];

    new DataTable({
      container: container.querySelector('#admin-users-table-container'),
      data: users,
      pageSize: 5,
      searchPlaceholder: 'Поиск пользователя по логину или имени...',
      columns: [
        {
          key: 'avatar',
          title: 'Аватар',
          sortable: false,
          render: (val) => `<img src="${val}" alt="Avatar" style="width: 32px; height: 32px; border-radius: 50%; background: #000;">`
        },
        { key: 'username', title: 'Логин', sortable: true, render: val => `<strong style="color: var(--accent-light); font-family: monospace;">${val}</strong>` },
        { key: 'fullName', title: 'ФИО пользователя', sortable: true },
        {
          key: 'role',
          title: 'Роль в системе',
          sortable: true,
          render: (val) => {
            let cls = 'badge--student';
            let label = 'Студент';
            if (val === 'admin') { cls = 'badge--admin'; label = 'Администратор'; }
            else if (val === 'dean') { cls = 'badge--dean'; label = 'Деканат'; }
            else if (val === 'teacher') { cls = 'badge--teacher'; label = 'Преподаватель'; }
            return `<span class="badge ${cls}"><span class="badge__dot"></span>${label}</span>`;
          }
        },
        { key: 'email', title: 'Email', sortable: true },
        { key: 'department', title: 'Подразделение', sortable: true }
      ],
      actions: [
        {
          name: 'edit',
          title: 'Редактировать',
          icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>`,
          onClick: (u) => openUserModal(u)
        },
        {
          name: 'delete',
          title: 'Удалить',
          icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>`,
          onClick: (u) => confirmDeleteUser(u)
        }
      ]
    });
  }

  function renderLogsTable() {
    const db = getMockDb();
    const logs = db.auditLogs || [];

    new DataTable({
      container: container.querySelector('#admin-logs-table-container'),
      data: logs,
      pageSize: 8,
      searchPlaceholder: 'Поиск по логам...',
      columns: [
        {
          key: 'timestamp',
          title: 'Время (UTC)',
          sortable: true,
          render: (val) => `<span style="font-family: monospace; font-size: 11px; color: var(--white-50);">${new Date(val).toLocaleString('ru-RU')}</span>`
        },
        {
          key: 'userName',
          title: 'Пользователь',
          sortable: true,
          render: (val, item) => `
            <div style="font-weight: 700; color: var(--white-100);">${val}</div>
            <div style="font-size: 11px; color: var(--white-40);">Роль: ${item.role}</div>
          `
        },
        {
          key: 'action',
          title: 'Действие',
          sortable: true,
          render: (val) => `<span class="badge badge--dean">${val}</span>`
        },
        { key: 'details', title: 'Детали операции', sortable: false },
        {
          key: 'ipAddress',
          title: 'IP адрес',
          sortable: true,
          render: (val) => `<span class="admin-page__log-code">${val}</span>`
        }
      ]
    });
  }

  function openUserModal(userToEdit = null) {
    const isEdit = !!userToEdit;
    const title = isEdit ? 'Редактирование профиля пользователя' : 'Создание нового пользователя';

    const formHtml = `
      <form id="admin-user-form" novalidate>
        <div class="form-row">
          <div class="form-group">
            <label class="form-group__label">Логин <span class="required">*</span></label>
            <input type="text" name="username" class="form-group__input" value="${userToEdit ? userToEdit.username : ''}" placeholder="ivanov" required ${isEdit ? 'readonly style="opacity: 0.6;"' : ''}>
          </div>
          <div class="form-group">
            <label class="form-group__label">Пароль ${isEdit ? '(оставьте пустым для сохранения)' : '<span class="required">*</span>'}</label>
            <input type="password" name="password" class="form-group__input" placeholder="••••••" ${!isEdit ? 'required' : ''}>
          </div>
        </div>

        <div class="form-group">
          <label class="form-group__label">ФИО пользователя <span class="required">*</span></label>
          <input type="text" name="fullName" class="form-group__input" value="${userToEdit ? userToEdit.fullName : ''}" placeholder="Иванов Иван Иванович" required>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label class="form-group__label">Роль в системе</label>
            <select name="role" class="form-group__select">
              <option value="student" ${userToEdit && userToEdit.role === 'student' ? 'selected' : ''}>Студент</option>
              <option value="teacher" ${userToEdit && userToEdit.role === 'teacher' ? 'selected' : ''}>Преподаватель</option>
              <option value="dean" ${userToEdit && userToEdit.role === 'dean' ? 'selected' : ''}>Сотрудник деканата</option>
              <option value="admin" ${userToEdit && userToEdit.role === 'admin' ? 'selected' : ''}>Системный администратор</option>
            </select>
          </div>

          <div class="form-group">
            <label class="form-group__label">Подразделение / Кафедра</label>
            <input type="text" name="department" class="form-group__input" value="${userToEdit ? userToEdit.department : 'Деканат ФИТ'}">
          </div>
        </div>

        <div class="form-group">
          <label class="form-group__label">Email</label>
          <input type="email" name="email" class="form-group__input" value="${userToEdit ? userToEdit.email : ''}" placeholder="user@university.edu">
        </div>
      </form>
    `;

    modal.open({
      title,
      content: formHtml,
      footer: `
        <button type="button" class="btn btn--secondary btn-close-modal">Отмена</button>
        <button type="button" class="btn btn--accent btn-save-user">${isEdit ? 'Сохранить' : 'Создать'}</button>
      `,
      onOpen: (dialog) => {
        dialog.querySelector('.btn-close-modal').addEventListener('click', () => modal.close());
        dialog.querySelector('.btn-save-user').addEventListener('click', () => {
          const form = dialog.querySelector('#admin-user-form');
          const rules = {
            username: [{ required: true, message: 'Укажите логин' }],
            fullName: [{ required: true, message: 'Укажите ФИО' }]
          };
          if (!isEdit) {
            rules.password = [{ required: true, message: 'Укажите пароль' }];
          }

          const check = validator.validate(form, rules);
          if (!check.isValid) return;

          const db = getMockDb();
          const role = form.elements.role.value;
          const roleNames = {
            admin: 'Системный администратор',
            dean: 'Сотрудник деканата',
            teacher: 'Преподаватель',
            student: 'Студент'
          };

          if (isEdit) {
            const idx = db.users.findIndex(u => u.id === userToEdit.id);
            if (idx !== -1) {
              db.users[idx] = {
                ...db.users[idx],
                fullName: form.elements.fullName.value.trim(),
                role,
                roleName: roleNames[role],
                department: form.elements.department.value.trim(),
                email: form.elements.email.value.trim()
              };
              if (form.elements.password.value.trim()) {
                db.users[idx].password = form.elements.password.value.trim();
              }
              logAuditAction('Редактирование пользователя', `Обновлен пользователь ${db.users[idx].fullName}`);
            }
          } else {
            const newUser = {
              id: `u-${Date.now()}`,
              username: form.elements.username.value.trim(),
              password: form.elements.password.value.trim(),
              fullName: form.elements.fullName.value.trim(),
              role,
              roleName: roleNames[role],
              email: form.elements.email.value.trim(),
              department: form.elements.department.value.trim(),
              avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${form.elements.username.value.trim()}`,
              createdAt: new Date().toISOString()
            };
            db.users.push(newUser);
            logAuditAction('Создание пользователя', `Создан пользователь ${newUser.fullName} (${newUser.roleName})`);
          }

          saveMockDb(db);
          toast.success('Готово', isEdit ? 'Пользователь обновлен' : 'Пользователь успешно создан');
          modal.close();
          renderUsersTable();
          renderLogsTable();
        });
      }
    });
  }

  function confirmDeleteUser(u) {
    if (u.id === user.id) {
      toast.warning('Запрещено', 'Вы не можете удалить свою текущую учетную запись');
      return;
    }

    modal.confirm({
      title: 'Удаление пользователя',
      message: `Удалить учетную запись <strong>${u.fullName}</strong> (${u.username})?`,
      confirmText: 'Удалить',
      onConfirm: () => {
        const db = getMockDb();
        const idx = db.users.findIndex(item => item.id === u.id);
        if (idx !== -1) {
          db.users.splice(idx, 1);
          logAuditAction('Удаление пользователя', `Удален пользователь ${u.fullName} (${u.username})`);
          saveMockDb(db);
          toast.success('Удалено', `Пользователь ${u.fullName} удален`);
          renderUsersTable();
          renderLogsTable();
        }
      }
    });
  }

  container.querySelector('#btn-add-user').addEventListener('click', () => openUserModal());

  container.querySelector('#btn-clear-logs').addEventListener('click', () => {
    modal.confirm({
      title: 'Очистка журнала аудита',
      message: 'Вы уверены, что хотите стереть все записи аудита?',
      confirmText: 'Очистить',
      onConfirm: () => {
        const db = getMockDb();
        db.auditLogs = [];
        saveMockDb(db);
        toast.info('Очищено', 'Журнал аудита очищен');
        renderLogsTable();
      }
    });
  });

  renderUsersTable();
  renderLogsTable();

  return container;
}
