import { authApi } from '../api/auth.api.js';
import { toast } from '../components/toast.js';
import { validator } from '../components/validator.js';
import { themeManager } from '../components/theme.js';

export function renderLoginPage({ router }) {
  const container = document.createElement('div');
  container.className = 'login-page';

  const isLight = themeManager.getTheme() === 'light';

  container.innerHTML = `
    <!-- Кнопка смены темы на экране входа -->
    <button type="button" class="btn btn--icon" id="login-theme-toggle" title="Переключить тему" style="position: absolute; top: 24px; right: 24px; z-index: 10;">
      ${isLight ? `
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>
      ` : `
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>
      `}
    </button>

    <div class="login-page__container">
      <div class="login-page__card">
        <div class="login-page__header">
          <div class="login-page__logo">
            <div class="login-page__logo-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z"></path><path d="M6 6h10"></path><path d="M6 10h10"></path></svg>
            </div>
            <span>ЕДУ<span style="color: var(--accent-light);">СТАТ</span></span>
          </div>
          <p class="login-page__subtitle">Информационная система учета успеваемости студентов</p>
        </div>

        <form class="login-page__form" id="login-form" novalidate>
          <div class="form-group">
            <label class="form-group__label">Логин <span class="required">*</span></label>
            <input type="text" name="username" class="form-group__input" placeholder="Введите логин (напр. admin, dean...)" autofocus autocomplete="username">
          </div>

          <div class="form-group">
            <label class="form-group__label">Пароль <span class="required">*</span></label>
            <input type="password" name="password" class="form-group__input" placeholder="Введите пароль" autocomplete="current-password">
          </div>

          <button type="submit" class="btn btn--accent" style="width: 100%; margin-top: 8px;" id="login-submit-btn">
            Войти в систему
          </button>
        </form>

        <div class="login-page__demo-panel">
          <div class="login-page__demo-panel-title">Демо-доступ для защиты работы</div>
          <div class="login-page__demo-panel-grid">
            <button type="button" class="login-page__demo-panel-btn" data-role="dean">
              <span class="badge badge--dean"><span class="badge__dot"></span>Декан</span>
              <span>Смирнова Е.В.</span>
            </button>
            <button type="button" class="login-page__demo-panel-btn" data-role="teacher">
              <span class="badge badge--teacher"><span class="badge__dot"></span>Преподаватель</span>
              <span>Кузнецов Д.С.</span>
            </button>
            <button type="button" class="login-page__demo-panel-btn" data-role="student">
              <span class="badge badge--student"><span class="badge__dot"></span>Студент</span>
              <span>Морозов А.Д.</span>
            </button>
            <button type="button" class="login-page__demo-panel-btn" data-role="admin">
              <span class="badge badge--admin"><span class="badge__dot"></span>Админ</span>
              <span>Иванов А.П.</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  `;

  // Обработка кнопки темы
  container.querySelector('#login-theme-toggle').addEventListener('click', () => {
    const newTheme = themeManager.toggleTheme();
    toast.info('Тема оформления', newTheme === 'light' ? 'Включена светлая тема' : 'Включена темная тема');
    router.navigate('/login');
  });

  // Обработка стандартной формы логина
  const form = container.querySelector('#login-form');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const validationResult = validator.validate(form, {
      username: [{ required: true, message: 'Пожалуйста, введите логин' }],
      password: [{ required: true, message: 'Пожалуйста, введите пароль' }]
    });

    if (!validationResult.isValid) return;

    const username = form.elements.username.value;
    const password = form.elements.password.value;
    const submitBtn = container.querySelector('#login-submit-btn');

    try {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Авторизация...';

      const res = await authApi.login(username, password);
      if (res && res.success && res.data && res.data.user) {
        toast.success('Добро пожаловать!', `Вы вошли как ${res.data.user.fullName}`);
        redirectByRole(res.data.user.role, router);
      } else {
        toast.error('Ошибка входа', res?.message || 'Неверный логин или пароль');
      }
    } catch (err) {
      toast.error('Ошибка авторизации', err.message);
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Войти в систему';
    }
  });

  // Кнопки демо-доступа
  container.querySelectorAll('.login-page__demo-panel-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const role = btn.getAttribute('data-role');
      try {
        btn.style.opacity = '0.5';
        const res = await authApi.loginAsRole(role);
        if (res && res.success && res.data && res.data.user) {
          toast.success('Демо-вход выполнен', `Профиль: ${res.data.user.fullName} (${res.data.user.roleName || res.data.user.role})`);
          redirectByRole(role, router);
        } else {
          toast.error('Ошибка демо-входа', res?.message || 'Не удалось войти под выбранной ролью');
        }
      } catch (err) {
        toast.error('Ошибка демо-входа', err.message);
      } finally {
        btn.style.opacity = '1';
      }
    });
  });

  return container;
}

function redirectByRole(role, router) {
  if (role === 'student') {
    router.navigate('/student');
  } else if (role === 'teacher') {
    router.navigate('/journal');
  } else if (role === 'dean') {
    router.navigate('/directory');
  } else {
    router.navigate('/admin');
  }
}
