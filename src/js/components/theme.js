import { ambientOrbs } from './ambientOrbs.js';

const THEME_KEY = 'student_portal_theme';

class ThemeManager {
  constructor() {
    this.currentTheme = localStorage.getItem(THEME_KEY) || 'dark';
    this.applyTheme(this.currentTheme);
  }

  applyTheme(theme) {
    this.currentTheme = theme;
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(THEME_KEY, theme);
    if (typeof ambientOrbs !== 'undefined' && ambientOrbs.updateTheme) {
      ambientOrbs.updateTheme(theme);
    }
  }

  toggleTheme() {
    const nextTheme = this.currentTheme === 'dark' ? 'light' : 'dark';
    this.applyTheme(nextTheme);
    return nextTheme;
  }

  getTheme() {
    return this.currentTheme;
  }
}

export const themeManager = new ThemeManager();
