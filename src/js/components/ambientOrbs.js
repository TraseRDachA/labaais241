/**
 * Модуль анимации парящих световых сфер по физике DVD-скринсейвера
 * Сферы непрерывно перемещаются по экрану и отскакивают от краев окна,
 * создавая живое преломление света сквозь жидкое стекло (Liquid Glass).
 */

const THEME_PALETTES = {
  dark: [
    'radial-gradient(circle, rgba(101, 64, 251, 0.48) 0%, rgba(101, 64, 251, 0) 70%)',
    'radial-gradient(circle, rgba(210, 64, 251, 0.42) 0%, rgba(210, 64, 251, 0) 70%)',
    'radial-gradient(circle, rgba(59, 130, 246, 0.38) 0%, rgba(59, 130, 246, 0) 70%)',
    'radial-gradient(circle, rgba(168, 85, 247, 0.42) 0%, rgba(168, 85, 247, 0) 70%)'
  ],
  light: [
    'radial-gradient(circle, rgba(14, 165, 233, 0.65) 0%, rgba(14, 165, 233, 0) 70%)', // Яркий лазурный (Sky Cyan)
    'radial-gradient(circle, rgba(244, 63, 94, 0.55) 0%, rgba(244, 63, 94, 0) 70%)',   // Теплый кораллово-розовый (Coral Rose)
    'radial-gradient(circle, rgba(16, 185, 129, 0.58) 0%, rgba(16, 185, 129, 0) 70%)', // Свежий мятно-изумрудный (Mint Emerald)
    'radial-gradient(circle, rgba(139, 92, 246, 0.58) 0%, rgba(139, 92, 246, 0) 70%)'  // Энергичный лиловый (Electric Lilac)
  ]
};

class AmbientOrbsManager {
  constructor() {
    this.container = null;
    this.orbs = [];
    this.animationId = null;
    this.isRunning = false;
    this.currentTheme = 'dark';
  }

  init() {
    let container = document.getElementById('ambient-orbs-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'ambient-orbs-container';
      container.style.cssText = `
        position: fixed;
        inset: 0;
        pointer-events: none;
        z-index: 0;
        overflow: hidden;
      `;
      document.body.prepend(container);
    }
    this.container = container;
    this.container.innerHTML = '';

    const width = window.innerWidth;
    const height = window.innerHeight;

    const activeTheme = document.documentElement.getAttribute('data-theme') || 
                        localStorage.getItem('student_portal_theme') || 'dark';
    this.currentTheme = activeTheme;
    const palette = THEME_PALETTES[activeTheme] || THEME_PALETTES.dark;

    // Конфигурация 4 светящихся сфер
    const configs = [
      {
        size: Math.min(width, 420),
        color: palette[0],
        x: width * 0.15,
        y: height * 0.1,
        vx: 1.4,
        vy: 1.1
      },
      {
        size: Math.min(width, 360),
        color: palette[1],
        x: width * 0.65,
        y: height * 0.4,
        vx: -1.2,
        vy: 1.5
      },
      {
        size: Math.min(width, 340),
        color: palette[2],
        x: width * 0.4,
        y: height * 0.65,
        vx: 1.6,
        vy: -1.3
      },
      {
        size: Math.min(width, 280),
        color: palette[3],
        x: width * 0.8,
        y: height * 0.15,
        vx: -1.5,
        vy: -1.2
      }
    ];

    this.orbs = configs.map((cfg) => {
      const el = document.createElement('div');
      el.className = 'ambient-dvd-orb';
      el.style.cssText = `
        position: absolute;
        width: ${cfg.size}px;
        height: ${cfg.size}px;
        border-radius: 50%;
        background: ${cfg.color};
        filter: blur(80px);
        transform: translate3d(${cfg.x}px, ${cfg.y}px, 0);
        will-change: transform;
        opacity: 0.65;
        transition: background 0.6s ease, opacity 0.3s ease;
      `;
      this.container.appendChild(el);

      return {
        el,
        x: cfg.x,
        y: cfg.y,
        vx: cfg.vx,
        vy: cfg.vy,
        size: cfg.size
      };
    });

    if (!this.isRunning) {
      this.isRunning = true;
      this.loop();
    }

    window.addEventListener('resize', () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      this.orbs.forEach(orb => {
        if (orb.x + orb.size > w) orb.x = Math.max(0, w - orb.size);
        if (orb.y + orb.size > h) orb.y = Math.max(0, h - orb.size);
      });
    });
  }

  updateTheme(theme) {
    this.currentTheme = theme;
    const palette = THEME_PALETTES[theme] || THEME_PALETTES.dark;
    this.orbs.forEach((orb, i) => {
      if (orb.el) {
        orb.el.style.background = palette[i % palette.length];
      }
    });
  }

  loop() {
    if (!this.isRunning) return;

    const width = window.innerWidth;
    const height = window.innerHeight;

    for (let i = 0; i < this.orbs.length; i++) {
      const orb = this.orbs[i];

      orb.x += orb.vx;
      orb.y += orb.vy;

      // Отскок от горизонтальных границ (логика DVD-логотипа)
      if (orb.x <= 0) {
        orb.x = 0;
        orb.vx = Math.abs(orb.vx);
      } else if (orb.x + orb.size >= width) {
        orb.x = width - orb.size;
        orb.vx = -Math.abs(orb.vx);
      }

      // Отскок от вертикальных границ
      if (orb.y <= 0) {
        orb.y = 0;
        orb.vy = Math.abs(orb.vy);
      } else if (orb.y + orb.size >= height) {
        orb.y = height - orb.size;
        orb.vy = -Math.abs(orb.vy);
      }

      orb.el.style.transform = `translate3d(${orb.x.toFixed(1)}px, ${orb.y.toFixed(1)}px, 0)`;
    }

    this.animationId = requestAnimationFrame(() => this.loop());
  }

  destroy() {
    this.isRunning = false;
    if (this.animationId) cancelAnimationFrame(this.animationId);
    if (this.container && this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }
  }
}

export const ambientOrbs = new AmbientOrbsManager();
