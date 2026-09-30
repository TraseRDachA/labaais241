import { authApi } from './api/auth.api.js';
import { USE_MOCK } from './api/client.js';
import { toast } from './components/toast.js';
import { ambientOrbs } from './components/ambientOrbs.js';
import { themeManager } from './components/theme.js';
import { renderLoginPage } from './pages/login.page.js';
import { renderDirectoryPage } from './pages/directory.page.js';
import { renderJournalPage } from './pages/journal.page.js';
import { renderStudentPage } from './pages/student.page.js';
import { renderReportsPage } from './pages/reports.page.js';
import { renderAdminPage } from './pages/admin.page.js';

const ROLE_PERMISSIONS = {
  admin: ['/directory', '/journal', '/student', '/reports', '/admin'],
  dean: ['/directory', '/journal', '/reports'],
  teacher: ['/journal', '/reports'],
  student: ['/student']
};

class App {
  constructor() {
    this.currentUser = null;
    this.currentRoute = null;
    this.root = document.querySelector('#app');
    this.router = {
      navigate: (path) => this.navigate(path)
    };

    window.addEventListener('hashchange', () => this.handleRouting());
  }

  init() {
    ambientOrbs.init();

    themeManager.applyTheme(themeManager.getTheme());

    this.currentUser = authApi.getUser();
    
    if (!this.currentUser) {
      if (window.location.hash !== '#/login') {
        window.location.hash = '#/login';
      }
    }

    this.handleRouting();
  }

  navigate(path) {
    window.location.hash = `#${path}`;
  }

  getPath() {
    const hash = window.location.hash;
    if (!hash || hash === '#' || hash === '#/') return '/login';
    return hash.replace(/^#/, '');
  }

  handleRouting() {
    const path = this.getPath();
    this.currentUser = authApi.getUser();

    // Защита неавторизованного доступа
    if (!this.currentUser && path !== '/login') {
      this.navigate('/login');
      return;
    }

    if (this.currentUser && path === '/login') {
      this.navigate(this.getDefaultRouteForRole(this.currentUser.role));
      return;
    }

    if (this.currentUser && path !== '/login') {
      const allowedRoutes = ROLE_PERMISSIONS[this.currentUser.role] || [];
      if (!allowedRoutes.includes(path)) {
        toast.warning('Ограничение доступа', `У роли "${this.currentUser.roleName || this.currentUser.role}" нет прав на этот раздел`);
        this.navigate(this.getDefaultRouteForRole(this.currentUser.role));
        return;
      }
    }

    this.currentRoute = path;
    this.render();
  }

  getDefaultRouteForRole(role) {
    if (role === 'student') return '/student';
    if (role === 'teacher') return '/journal';
    if (role === 'dean') return '/directory';
    return '/admin';
  }

  async switchRole(role) {
    try {
      const res = await authApi.loginAsRole(role);
      if (!res || !res.success || !res.data || !res.data.user) {
        throw new Error(res?.message || 'Не удалось переключить роль');
      }
      this.currentUser = res.data.user;
      toast.success('Роль переключена', `Текущий профиль: ${this.currentUser.fullName} (${this.currentUser.roleName || this.currentUser.role})`);
      this.navigate(this.getDefaultRouteForRole(role));
    } catch (err) {
      toast.error('Ошибка смены роли', err.message);
    }
  }

  render() {
    this.root.innerHTML = '';

    if (this.currentRoute === '/login') {
      const loginEl = renderLoginPage({ router: this.router });
      this.root.appendChild(loginEl);
      return;
    }

    const layout = document.createElement('div');
    layout.className = 'app-layout';

    const header = this.createHeader();
    layout.appendChild(header);

    const body = document.createElement('div');
    body.className = 'app-body';

    const sidebar = this.createSidebar();
    body.appendChild(sidebar);

    const main = document.createElement('main');
    main.className = 'app-main';

    // Монтирование активной страницы
    const pageEl = this.renderCurrentPage();
    if (pageEl) main.appendChild(pageEl);

    body.appendChild(main);
    layout.appendChild(body);

    this.root.appendChild(layout);
  }

  createHeader() {
    const header = document.createElement('header');
    header.className = 'app-header';

    const user = this.currentUser || {};
    let roleBadgeClass = 'badge--student';
    if (user.role === 'admin') roleBadgeClass = 'badge--admin';
    else if (user.role === 'dean') roleBadgeClass = 'badge--dean';
    else if (user.role === 'teacher') roleBadgeClass = 'badge--teacher';

    const isLight = themeManager.getTheme() === 'light';

    header.innerHTML = `
      <div class="app-header__left">
        <a href="#/" class="app-header__logo">
          <div class="app-header__logo-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z"></path><path d="M6 6h10"></path><path d="M6 10h10"></path></svg>
          </div>
          <span>ЕДУ<span class="app-header__logo-accent">СТАТ</span></span>
        </a>
        <div class="app-header__system-badge">АС «Успеваемость» v1.0 • Liquid Glass</div>
      </div>

      <div class="app-header__right">
        <!-- Кнопка переключения темы (Светлая / Темная) -->
        <button type="button" class="btn btn--icon theme-toggle-btn" id="btn-theme-toggle" title="Переключить тему (Светлая / Темная)">
          ${isLight ? `
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>
          ` : `
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>
          `}
        </button>

        <!-- Панель быстрого переключения ролей для защиты работы -->
        <div class="app-header__demo-switcher">
          <span class="app-header__demo-switcher-label">Демо-роль:</span>
          <button type="button" class="app-header__demo-switcher-btn ${user.role === 'dean' ? 'app-header__demo-switcher-btn--active' : ''}" data-switch="dean">Декан</button>
          <button type="button" class="app-header__demo-switcher-btn ${user.role === 'teacher' ? 'app-header__demo-switcher-btn--active' : ''}" data-switch="teacher">Препод</button>
          <button type="button" class="app-header__demo-switcher-btn ${user.role === 'student' ? 'app-header__demo-switcher-btn--active' : ''}" data-switch="student">Студент</button>
          <button type="button" class="app-header__demo-switcher-btn ${user.role === 'admin' ? 'app-header__demo-switcher-btn--active' : ''}" data-switch="admin">Админ</button>
        </div>

        <div class="app-header__user">
          <div class="app-header__user-avatar">
            <img src="${user.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin'}" alt="${user.fullName}">
          </div>
          <div class="app-header__user-info">
            <span class="app-header__user-name">${user.fullName || 'Пользователь'}</span>
            <span class="badge ${roleBadgeClass}" style="margin-top: 2px; align-self: flex-start; padding: 2px 8px; font-size: 10px;">
              <span class="badge__dot"></span>${user.roleName || user.role}
            </span>
          </div>
        </div>

        <button type="button" class="btn btn--secondary btn--sm" id="btn-logout" title="Выйти из учетной записи" style="margin-left: 8px;">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
          <span style="display: none; @media(min-width: 600px){ display: inline; }">Выход</span>
        </button>
      </div>
    `;

    // Переключение темы
    header.querySelector('#btn-theme-toggle').addEventListener('click', () => {
      const newTheme = themeManager.toggleTheme();
      toast.info('Тема оформления', newTheme === 'light' ? 'Включена светлая тема' : 'Включена темная тема');
      this.render();
    });

    // Привязка кнопок быстрого переключения роли
    header.querySelectorAll('.app-header__demo-switcher-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const role = btn.getAttribute('data-switch');
        this.switchRole(role);
      });
    });

    // Выход
    header.querySelector('#btn-logout').addEventListener('click', async () => {
      await authApi.logout();
      toast.info('Выход', 'Сессия завершена');
      this.navigate('/login');
    });

    return header;
  }

  createSidebar() {
    const sidebar = document.createElement('aside');
    sidebar.className = 'app-sidebar';

    const role = this.currentUser ? this.currentUser.role : 'student';
    const allowed = ROLE_PERMISSIONS[role] || [];

    const navItems = [
      {
        path: '/directory',
        label: 'Справочники',
        roles: ['admin', 'dean'],
        icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z"></path><path d="M6 6h10"></path><path d="M6 10h10"></path></svg>`
      },
      {
        path: '/journal',
        label: 'Электронный журнал',
        roles: ['admin', 'dean', 'teacher'],
        icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>`
      },
      {
        path: '/student',
        label: 'Моя успеваемость',
        roles: ['admin', 'student'],
        icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="12" cy="8" r="7"></circle><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"></polyline></svg>`
      },
      {
        path: '/reports',
        label: 'Отчеты и ведомости',
        roles: ['admin', 'dean', 'teacher'],
        icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>`
      },
      {
        path: '/admin',
        label: 'Администрирование',
        roles: ['admin'],
        icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg>`
      }
    ];

    const linksHtml = navItems
      .filter(item => item.roles.includes(role))
      .map(item => {
        const isActive = this.currentRoute === item.path;
        return `
          <a href="#${item.path}" class="app-sidebar__link ${isActive ? 'app-sidebar__link--active' : ''}">
            ${item.icon}
            <span>${item.label}</span>
          </a>
        `;
      }).join('');

    sidebar.innerHTML = `
      <div>
        <div class="app-sidebar__section-title">Разделы системы</div>
        <nav class="app-sidebar__nav">
          ${linksHtml}
        </nav>
      </div>

      <div class="app-sidebar__footer">
        <div class="app-sidebar__status">
          <div class="app-sidebar__status-dot" style="${!USE_MOCK ? 'background: #00e676; box-shadow: 0 0 10px rgba(0, 230, 118, 0.6);' : ''}"></div>
          <span>${USE_MOCK ? 'MOCK API активен (200ms)' : 'Express API активен (:5000)'}</span>
        </div>
      </div>
    `;

    return sidebar;
  }

  renderCurrentPage() {
    switch (this.currentRoute) {
      case '/directory':
        return renderDirectoryPage({ user: this.currentUser });
      case '/journal':
        return renderJournalPage({ user: this.currentUser });
      case '/student':
        return renderStudentPage({ user: this.currentUser });
      case '/reports':
        return renderReportsPage({ user: this.currentUser });
      case '/admin':
        return renderAdminPage({ user: this.currentUser });
      default:
        return null;
    }
  }
}

const app = new App();
document.addEventListener('DOMContentLoaded', () => {
  app.init();
});
