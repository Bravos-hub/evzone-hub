import type { Config } from 'tailwindcss'

export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  darkMode: 'class', // Enables dark mode based on class
  theme: {
    extend: {
      colors: {
        bg: {
          DEFAULT: 'var(--app-bg)',
          secondary: 'var(--app-bg-secondary)',
          subtle: 'var(--app-bg-subtle)',
        },
        panel: {
          DEFAULT: 'var(--app-panel)',
          '2': 'var(--app-panel-2)',
        },
        surface: 'var(--app-panel)', // Map surface to panel for consistency
        text: {
          DEFAULT: 'var(--app-text)',
          secondary: 'var(--app-text-secondary)',
        },
        muted: 'var(--app-muted)',
        border: {
          DEFAULT: 'var(--app-border)',
          light: 'var(--app-border-light)',
        },
        accent: {
          DEFAULT: 'var(--app-accent)',
          hover: 'var(--app-accent-hover)',
          light: 'var(--app-accent-light)',
        },
        danger: 'var(--app-danger)',
        ok: 'var(--app-ok)',
        warn: 'var(--app-warn)',
        info: 'var(--app-info)',
      },
      screens: {
        'sm': '680px',
        'md': '720px',
        'lg': '900px',
        'xl': '1100px',
        '2xl': '1300px',
      },
      fontFamily: {
        sans: ['Inter', 'Segoe UI', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        DEFAULT: '0 4px 12px var(--app-shadow)',
        lg: '0 12px 32px var(--app-shadow)',
        soft: '0 2px 10px var(--app-shadow)',
        card: '0 8px 30px var(--app-shadow)',
        accent: '0 4px 14px var(--app-shadow-accent)',
      },
      borderRadius: {
        xl: '14px',
        '2xl': '18px',
      },
    },
  },
  plugins: [],
} satisfies Config
