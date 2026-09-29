export class DataTable {
  constructor({
    container,
    columns = [],
    data = [],
    pageSize = 8,
    searchPlaceholder = 'Поиск по записям...',
    filters = [],
    actions = [],
    emptyText = 'Записи не найдены'
  }) {
    this.container = typeof container === 'string' ? document.querySelector(container) : container;
    this.columns = columns;
    this.data = [...data];
    this.filteredData = [...data];
    this.pageSize = pageSize;
    this.currentPage = 1;
    this.sortKey = null;
    this.sortDirection = 'asc';
    this.searchQuery = '';
    this.searchPlaceholder = searchPlaceholder;
    this.filters = filters; // [{ id, label, options: [{value, label}], filterFn }]
    this.activeFilterValues = {};
    this.actions = actions; // [{ name, icon, title, className, onClick }]
    this.emptyText = emptyText;

    this.init();
  }

  init() {
    if (!this.container) return;
    this.render();
  }

  setData(newData) {
    this.data = [...newData];
    this.applyFiltersAndSort();
  }

  applyFiltersAndSort() {
    let result = [...this.data];

    // Поиск
    if (this.searchQuery) {
      const q = this.searchQuery.toLowerCase();
      result = result.filter(item => {
        return this.columns.some(col => {
          const val = item[col.key];
          return val !== undefined && val !== null && String(val).toLowerCase().includes(q);
        });
      });
    }

    // Кастомные фильтры
    this.filters.forEach(f => {
      const selectedVal = this.activeFilterValues[f.id];
      if (selectedVal && selectedVal !== 'ALL') {
        if (typeof f.filterFn === 'function') {
          result = result.filter(item => f.filterFn(item, selectedVal));
        } else {
          result = result.filter(item => String(item[f.id]) === selectedVal);
        }
      }
    });

    // Сортировка
    if (this.sortKey) {
      result.sort((a, b) => {
        let valA = a[this.sortKey] ?? '';
        let valB = b[this.sortKey] ?? '';

        if (typeof valA === 'string') valA = valA.toLowerCase();
        if (typeof valB === 'string') valB = valB.toLowerCase();

        if (valA < valB) return this.sortDirection === 'asc' ? -1 : 1;
        if (valA > valB) return this.sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
    }

    this.filteredData = result;
    const totalPages = Math.ceil(this.filteredData.length / this.pageSize) || 1;
    if (this.currentPage > totalPages) this.currentPage = 1;
    this.renderTableOnly();
  }

  handleSort(columnKey) {
    if (this.sortKey === columnKey) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortKey = columnKey;
      this.sortDirection = 'asc';
    }
    this.applyFiltersAndSort();
  }

  render() {
    this.container.innerHTML = `
      <div class="datatable">
        <div class="datatable__controls">
          <div class="datatable__search-wrapper">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
            <input type="text" class="datatable__search-input" placeholder="${this.searchPlaceholder}" value="${this.searchQuery}">
          </div>
          <div class="datatable__filters"></div>
        </div>

        <div class="datatable__table-wrapper">
          <table class="datatable__table">
            <thead>
              <tr class="datatable__header-row"></tr>
            </thead>
            <tbody class="datatable__body"></tbody>
          </table>
        </div>

        <div class="datatable__pagination"></div>
      </div>
    `;

    // Привязка поиска
    const searchInput = this.container.querySelector('.datatable__search-input');
    searchInput.addEventListener('input', (e) => {
      this.searchQuery = e.target.value.trim();
      this.currentPage = 1;
      this.applyFiltersAndSort();
    });

    // Отрисовка фильтров
    const filtersContainer = this.container.querySelector('.datatable__filters');
    this.filters.forEach(f => {
      const select = document.createElement('select');
      select.className = 'datatable__select';
      select.innerHTML = `
        <option value="ALL">${f.label}: Все</option>
        ${f.options.map(opt => `<option value="${opt.value}">${opt.label}</option>`).join('')}
      `;
      select.addEventListener('change', (e) => {
        this.activeFilterValues[f.id] = e.target.value;
        this.currentPage = 1;
        this.applyFiltersAndSort();
      });
      filtersContainer.appendChild(select);
    });

    this.renderTableOnly();
  }

  renderTableOnly() {
    const headerRow = this.container.querySelector('.datatable__header-row');
    const tbody = this.container.querySelector('.datatable__body');
    const pagination = this.container.querySelector('.datatable__pagination');

    if (!headerRow || !tbody) return;

    // Шапка
    headerRow.innerHTML = this.columns.map(col => {
      const isSorted = this.sortKey === col.key;
      const sortClass = isSorted ? `sort-${this.sortDirection}` : '';
      const sortableClass = col.sortable !== false ? 'sortable' : '';
      return `
        <th class="${sortableClass} ${sortClass}" data-key="${col.key}">
          ${col.title}
          ${col.sortable !== false ? `<span class="sort-icon">▲</span>` : ''}
        </th>
      `;
    }).join('') + (this.actions.length > 0 ? `<th style="text-align: right; width: 120px;">Действия</th>` : '');

    // Клик по сортировке
    headerRow.querySelectorAll('th.sortable').forEach(th => {
      th.addEventListener('click', () => {
        const key = th.getAttribute('data-key');
        this.handleSort(key);
      });
    });

    // Данные для текущей страницы
    const startIdx = (this.currentPage - 1) * this.pageSize;
    const pageItems = this.filteredData.slice(startIdx, startIdx + this.pageSize);

    if (pageItems.length === 0) {
      const totalColspan = this.columns.length + (this.actions.length > 0 ? 1 : 0);
      tbody.innerHTML = `<tr><td colspan="${totalColspan}" class="datatable__empty">${this.emptyText}</td></tr>`;
    } else {
      tbody.innerHTML = '';
      pageItems.forEach(item => {
        const tr = document.createElement('tr');
        
        let cellsHtml = this.columns.map(col => {
          let content = item[col.key];
          if (typeof col.render === 'function') {
            content = col.render(content, item);
          }
          return `<td>${content ?? '—'}</td>`;
        }).join('');

        if (this.actions.length > 0) {
          cellsHtml += `
            <td style="text-align: right;">
              <div class="datatable__actions" style="justify-content: flex-end;">
                ${this.actions.map(act => `
                  <button type="button" class="datatable__action-btn datatable__action-btn--${act.name}" title="${act.title}" data-action="${act.name}">
                    ${act.icon}
                  </button>
                `).join('')}
              </div>
            </td>
          `;
        }

        tr.innerHTML = cellsHtml;

        // Обработчики кнопок действий
        this.actions.forEach(act => {
          const btn = tr.querySelector(`.datatable__action-btn--${act.name}`);
          if (btn) {
            btn.addEventListener('click', (e) => {
              e.stopPropagation();
              act.onClick(item);
            });
          }
        });

        tbody.appendChild(tr);
      });
    }

    // Пагинация
    const totalItems = this.filteredData.length;
    const totalPages = Math.ceil(totalItems / this.pageSize) || 1;
    const from = totalItems > 0 ? startIdx + 1 : 0;
    const to = Math.min(startIdx + this.pageSize, totalItems);

    pagination.innerHTML = `
      <div class="datatable__pagination-info">
        Показано <strong>${from}–${to}</strong> из <strong>${totalItems}</strong> записей
      </div>
      <div class="datatable__pagination-controls">
        <button type="button" class="datatable__pagination-page-btn" id="dt-prev" ${this.currentPage <= 1 ? 'disabled' : ''}>
          ‹
        </button>
        ${Array.from({ length: totalPages }, (_, i) => i + 1).map(p => `
          <button type="button" class="datatable__pagination-page-btn ${p === this.currentPage ? 'datatable__pagination-page-btn--active' : ''}" data-page="${p}">
            ${p}
          </button>
        `).slice(Math.max(0, this.currentPage - 3), this.currentPage + 2).join('')}
        <button type="button" class="datatable__pagination-page-btn" id="dt-next" ${this.currentPage >= totalPages ? 'disabled' : ''}>
          ›
        </button>
      </div>
    `;

    const prevBtn = pagination.querySelector('#dt-prev');
    const nextBtn = pagination.querySelector('#dt-next');

    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        if (this.currentPage > 1) {
          this.currentPage--;
          this.renderTableOnly();
        }
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        if (this.currentPage < totalPages) {
          this.currentPage++;
          this.renderTableOnly();
        }
      });
    }

    pagination.querySelectorAll('[data-page]').forEach(btn => {
      btn.addEventListener('click', () => {
        this.currentPage = parseInt(btn.getAttribute('data-page'), 10);
        this.renderTableOnly();
      });
    });
  }
}
