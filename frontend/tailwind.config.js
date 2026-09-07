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
        // Keys map to the actual CSS custom properties defined in index.css.
        // Raw HSL tokens (e.g. "214 89% 52%") require hsl() wrappers here.
        app: 'hsl(var(--color-bg))',
        surface: {
          DEFAULT: 'hsl(var(--color-surface))',
          muted: 'hsl(var(--color-bg-alt))',
        },
        brand: {
          primary: 'hsl(var(--color-primary))',
          hover: 'hsl(var(--color-primary-dark))',
        },
        content: {
          primary: 'hsl(var(--color-text))',
          secondary: 'hsl(var(--color-text-muted))',
          muted: 'hsl(var(--color-text-faint))',
        },
        edge: {
          subtle: 'hsl(var(--color-border-subtle))',
          strong: 'hsl(var(--color-border))',
        },
        feedback: {
          success: 'hsl(var(--color-success))',
          warning: 'hsl(var(--color-warning))',
          error: 'hsl(var(--color-danger))',
          info: 'hsl(var(--color-info))',
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
