class ModalManager {
  constructor() {
    this.activeModal = null;
    this.bindEvents();
  }

  bindEvents() {
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.activeModal) {
        this.close();
      }
    });
  }

  open({ title = 'Окно', content = '', footer = '', size = 'normal', onOpen = null }) {
    this.close();

    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';

    const dialog = document.createElement('div');
    dialog.className = `modal-dialog ${size === 'large' ? 'modal-dialog--large' : ''}`;

    dialog.innerHTML = `
      <div class="modal-dialog__header">
        <h3 class="modal-dialog__title">${title}</h3>
        <button class="modal-dialog__close-btn" type="button" aria-label="Закрыть">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>
      </div>
      <div class="modal-dialog__body">
        ${content}
      </div>
      ${footer ? `<div class="modal-dialog__footer">${footer}</div>` : ''}
    `;

    overlay.appendChild(dialog);
    document.body.appendChild(overlay);

    // Закрытие при клике по фону
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) this.close();
    });

    dialog.querySelector('.modal-dialog__close-btn').addEventListener('click', () => {
      this.close();
    });

    this.activeModal = overlay;

    requestAnimationFrame(() => {
      overlay.classList.add('modal-overlay--active');
    });

    if (typeof onOpen === 'function') {
      onOpen(dialog);
    }

    return dialog;
  }

  confirm({
    title = 'Подтверждение действия',
    message = 'Вы уверены, что хотите продолжить?',
    confirmText = 'Удалить',
    cancelText = 'Отмена',
    confirmType = 'danger',
    onConfirm = null
  }) {
    const content = `
      <div style="font-size: 14px; line-height: 1.6; color: var(--white-80);">
        <p>${message}</p>
      </div>
    `;

    const footer = `
      <button type="button" class="btn btn--secondary btn-modal-cancel">${cancelText}</button>
      <button type="button" class="btn btn--${confirmType} btn-modal-confirm">${confirmText}</button>
    `;

    const dialog = this.open({
      title,
      content,
      footer,
      onOpen: (el) => {
        el.querySelector('.btn-modal-cancel').addEventListener('click', () => this.close());
        el.querySelector('.btn-modal-confirm').addEventListener('click', async () => {
          if (typeof onConfirm === 'function') {
            await onConfirm();
          }
          this.close();
        });
      }
    });

    return dialog;
  }

  close() {
    if (!this.activeModal) return;
    const modal = this.activeModal;
    modal.classList.remove('modal-overlay--active');
    setTimeout(() => {
      if (modal.parentNode) modal.parentNode.removeChild(modal);
    }, 250);
    this.activeModal = null;
  }
}

export const modal = new ModalManager();
