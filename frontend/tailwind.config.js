/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: ['class', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        app: 'var(--bg-app)',
        surface: {
          DEFAULT: 'var(--bg-surface)',
          muted: 'var(--bg-surface-muted)',
        },
        brand: {
          primary: 'var(--brand-primary)',
          hover: 'var(--brand-primary-hover)',
          surface: 'var(--brand-surface)',
        },
        content: {
          primary: 'var(--text-primary)',
          secondary: 'var(--text-secondary)',
          muted: 'var(--text-muted)',
        },
        edge: {
          subtle: 'var(--border-subtle)',
          strong: 'var(--border-strong)',
        },
        feedback: {
          success: 'var(--color-success)',
          warning: 'var(--color-warning)',
          error: 'var(--color-error)',
          info: 'var(--color-info)',
        },
      },
      minHeight: {
        touch: '44px',
      },
      minWidth: {
        touch: '44px',
      },
    },
  },
  plugins: [],
};
