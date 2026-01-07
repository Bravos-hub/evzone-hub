export type UiTheme = {
  colors: {
    bg: {
      DEFAULT: string
      secondary: string
      subtle: string
    }
    panel: {
      DEFAULT: string
      2: string
    }
    text: {
      DEFAULT: string
      secondary: string
    }
    muted: string
    border: {
      DEFAULT: string
      light: string
    }
    accent: {
      DEFAULT: string
      hover: string
      light: string
    }
    danger: string
    ok: string
    warn: string
  }
  typography: {
    fontFamilySans: string[]
    fontFamilyMono: string[]
    baseFontSizePx: number
    lineHeight: number
  }
  radius: {
    xl: number
    '2xl': number
  }
  shadow: {
    DEFAULT: string
    lg: string
    soft: string
    card: string
    accent: string
  }
}

/**
 * Shared theme definition pointing to CSS variables.
 * This ensures that when the mode (light/dark) changes in CSS,
 * JS-based components also "see" the same variables.
 */
export const theme: UiTheme = {
  colors: {
    bg: {
      DEFAULT: 'var(--app-bg)',
      secondary: 'var(--app-bg-secondary)',
      subtle: 'var(--app-bg-subtle)',
    },
    panel: {
      DEFAULT: 'var(--app-panel)',
      2: 'var(--app-panel-2)',
    },
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
  },
  typography: {
    fontFamilySans: ['Inter', 'Segoe UI', 'system-ui', '-apple-system', 'sans-serif'],
    fontFamilyMono: ['SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', 'Source Code Pro', 'monospace'],
    baseFontSizePx: 14,
    lineHeight: 1.6,
  },
  radius: {
    xl: 14,
    '2xl': 18,
  },
  shadow: {
    DEFAULT: '0 8px 24px var(--app-shadow)',
    lg: '0 14px 38px var(--app-shadow)',
    soft: '0 6px 18px var(--app-shadow)',
    card: '0 10px 30px var(--app-shadow)',
    accent: '0 6px 14px var(--app-shadow-accent)',
  },
}

export type ThemeColorKey = keyof UiTheme['colors']
