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
        /* =========================================================
           CENTRALIZED SEMANTIC COLOR MAPPINGS
           Source of truth: frontend/src/index.css
           Format: hsl(var(--<token>) / <alpha-value>)
           Enables standard Tailwind opacity modifiers (e.g., bg-primary/20, ring-primary/30)
           ========================================================= */

        /*
         * PRIMARY & PRIMARY FOREGROUND
         * Maps CSS variables: --color-primary, --color-primary-foreground
         * Enables utilities:
         *   bg-primary, text-primary, border-primary, ring-primary
         *   bg-primary-foreground, text-primary-foreground
         * Normal usage:
         *   Primary call-to-action buttons, active navigation states, focus rings, brand accents.
         * Cause & effect:
         *   Changing --color-primary in index.css alters the central brand hue throughout all buttons
         *   and active highlights. text-primary-foreground ensures text remains readable on top.
         */
        primary: {
          DEFAULT: 'hsl(var(--color-primary) / <alpha-value>)',
          dark: 'hsl(var(--color-primary-dark) / <alpha-value>)',
          foreground: 'hsl(var(--color-primary-foreground) / <alpha-value>)',
        },

        /*
         * SECONDARY & SECONDARY FOREGROUND
         * Maps CSS variables: --color-secondary, --color-secondary-foreground
         * Enables utilities:
         *   bg-secondary, text-secondary, border-secondary
         * Normal usage:
         *   Teal coastal brand accents, secondary badge indicators, gradient endpoints.
         */
        secondary: {
          DEFAULT: 'hsl(var(--color-secondary) / <alpha-value>)',
          foreground: 'hsl(var(--color-secondary-foreground) / <alpha-value>)',
        },

        /*
         * ACCENT
         * Maps CSS variables: --color-accent, --color-accent-foreground
         * Enables utilities: bg-accent, text-accent
         * Normal usage: Warm golden sunrise badges and highlights.
         */
        accent: {
          DEFAULT: 'hsl(var(--color-accent) / <alpha-value>)',
          foreground: 'hsl(var(--color-accent-foreground) / <alpha-value>)',
        },

        /*
         * BACKGROUND & FOREGROUND (Canvas)
         * Maps CSS variables: --color-background, --color-foreground
         * Enables utilities:
         *   bg-background, text-foreground
         * Normal usage:
         *   Application base canvas and primary content typography (headings, body copy).
         * Cause & effect:
         *   Adapts dynamically between Light Mode (near-white canvas + dark text)
         *   and Dark Mode (obsidian canvas + off-white text).
         */
        background: 'hsl(var(--color-background) / <alpha-value>)',
        foreground: 'hsl(var(--color-foreground) / <alpha-value>)',

        /*
         * SURFACE & SURFACE FOREGROUND
         * Maps CSS variables: --color-surface, --color-surface-foreground
         * Enables utilities:
         *   bg-surface, text-surface-foreground, bg-surface-hover
         * Normal usage:
         *   Elevated containers such as cards, dialogs, dropdowns, and modal backdrops.
         * Cause & effect:
         *   Provides container lift above the canvas in both Light and Dark themes.
         */
        surface: {
          DEFAULT: 'hsl(var(--color-surface) / <alpha-value>)',
          hover: 'hsl(var(--color-surface-hover) / <alpha-value>)',
          muted: 'hsl(var(--color-bg-alt) / <alpha-value>)',
          foreground: 'hsl(var(--color-surface-foreground) / <alpha-value>)',
        },

        /*
         * MUTED & MUTED FOREGROUND
         * Maps CSS variables: --color-muted, --color-muted-foreground
         * Enables utilities:
         *   bg-muted, text-muted-foreground
         * Normal usage:
         *   Subtle backing sections, secondary labels, company metadata, and helper hints.
         */
        muted: {
          DEFAULT: 'hsl(var(--color-muted) / <alpha-value>)',
          foreground: 'hsl(var(--color-muted-foreground) / <alpha-value>)',
          faint: 'hsl(var(--color-text-faint) / <alpha-value>)',
        },

        /*
         * BORDERS & INPUTS
         * Maps CSS variables: --color-border, --color-border-subtle, --color-input
         * Enables utilities:
         *   border-border, border-border-subtle, bg-input
         * Normal usage:
         *   Dividers, card boundaries, and resting form input backgrounds.
         */
        border: {
          DEFAULT: 'hsl(var(--color-border) / <alpha-value>)',
          subtle: 'hsl(var(--color-border-subtle) / <alpha-value>)',
        },
        input: 'hsl(var(--color-input) / <alpha-value>)',

        /*
         * RING
         * Maps CSS variable: --color-ring
         * Enables utilities: ring-ring, ring-primary
         * Normal usage: Accessible focus rings on interactive elements (:focus-visible).
         */
        ring: 'hsl(var(--color-ring) / <alpha-value>)',

        /*
         * DANGER / DESTRUCTIVE
         * Maps CSS variables: --color-danger, --color-danger-foreground
         * Enables utilities:
         *   bg-danger, text-danger, border-danger, bg-destructive, text-destructive
         * Normal usage:
         *   Destructive actions, job deletion, application withdrawal, and error banners.
         */
        danger: {
          DEFAULT: 'hsl(var(--color-danger) / <alpha-value>)',
          foreground: 'hsl(var(--color-danger-foreground) / <alpha-value>)',
        },
        destructive: {
          DEFAULT: 'hsl(var(--color-danger) / <alpha-value>)',
          foreground: 'hsl(var(--color-danger-foreground) / <alpha-value>)',
        },

        /*
         * STATUS INDICATORS (Success, Warning, Info)
         * Maps CSS variables: --color-success, --color-warning, --color-info
         * Enables utilities:
         *   bg-success, text-success, bg-warning, text-warning, bg-info, text-info
         * Normal usage:
         *   Application status badges, toast notification accents, and verification dots.
         */
        success: {
          DEFAULT: 'hsl(var(--color-success) / <alpha-value>)',
          foreground: 'hsl(var(--color-success-foreground) / <alpha-value>)',
        },
        warning: {
          DEFAULT: 'hsl(var(--color-warning) / <alpha-value>)',
          foreground: 'hsl(var(--color-warning-foreground) / <alpha-value>)',
        },
        info: {
          DEFAULT: 'hsl(var(--color-info) / <alpha-value>)',
          foreground: 'hsl(var(--color-info-foreground) / <alpha-value>)',
        },

        /* =========================================================
           LEGACY NAMESPACE COMPATIBILITY ALIASES
           Retained to guarantee zero regressions for existing code.
           Now upgraded with <alpha-value> support.
           ========================================================= */
        app: 'hsl(var(--color-bg) / <alpha-value>)',
        brand: {
          primary: 'hsl(var(--color-primary) / <alpha-value>)',
          hover: 'hsl(var(--color-primary-dark) / <alpha-value>)',
        },
        content: {
          primary: 'hsl(var(--color-text) / <alpha-value>)',
          secondary: 'hsl(var(--color-text-muted) / <alpha-value>)',
          muted: 'hsl(var(--color-text-faint) / <alpha-value>)',
        },
        edge: {
          subtle: 'hsl(var(--color-border-subtle) / <alpha-value>)',
          strong: 'hsl(var(--color-border) / <alpha-value>)',
        },
        feedback: {
          success: 'hsl(var(--color-success) / <alpha-value>)',
          warning: 'hsl(var(--color-warning) / <alpha-value>)',
          error: 'hsl(var(--color-danger) / <alpha-value>)',
          info: 'hsl(var(--color-info) / <alpha-value>)',
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
