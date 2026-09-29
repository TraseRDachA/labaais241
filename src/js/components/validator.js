export const validator = {
  validate(formElement, rules) {
    let isValid = true;
    const errors = {};

    // Очистить старые ошибки
    formElement.querySelectorAll('.form-group__input--error, .form-group__select--error').forEach(el => {
      el.classList.remove('form-group__input--error', 'form-group__select--error');
    });
    formElement.querySelectorAll('.form-group__error').forEach(el => el.remove());

    for (const [fieldName, fieldRules] of Object.entries(rules)) {
      const input = formElement.elements[fieldName];
      if (!input) continue;

      const value = (input.value || '').trim();

      for (const rule of fieldRules) {
        if (rule.required && !value) {
          isValid = false;
          errors[fieldName] = rule.message || 'Поле обязательно для заполнения';
          break;
        }

        if (rule.minLength && value.length < rule.minLength) {
          isValid = false;
          errors[fieldName] = rule.message || `Минимальная длина — ${rule.minLength} символов`;
          break;
        }

        if (rule.email && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          isValid = false;
          errors[fieldName] = rule.message || 'Введите корректный email адрес';
          break;
        }

        if (rule.pattern && value && !rule.pattern.test(value)) {
          isValid = false;
          errors[fieldName] = rule.message || 'Неверный формат поля';
          break;
        }

        if (rule.custom && !rule.custom(value, formElement)) {
          isValid = false;
          errors[fieldName] = rule.message || 'Значение поля некорректно';
          break;
        }
      }

      if (errors[fieldName]) {
        input.classList.add(input.tagName === 'SELECT' ? 'form-group__select--error' : 'form-group__input--error');
        const errEl = document.createElement('div');
        errEl.className = 'form-group__error';
        errEl.textContent = errors[fieldName];
        const group = input.closest('.form-group');
        if (group) group.appendChild(errEl);
      }
    }

    return { isValid, errors };
  }
};
