import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { theme as defaultTheme, type UiTheme } from './theme'

export type ThemeMode = 'light' | 'dark' | 'system'

type ThemeContextType = {
  theme: UiTheme
  mode: ThemeMode
  setMode: (mode: ThemeMode) => void
  effectiveTheme: 'light' | 'dark'
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem('theme-mode')
    return (saved as ThemeMode) || 'system'
  })

  // Set mode and save to localStorage
  const setMode = (newMode: ThemeMode) => {
    setModeState(newMode)
    localStorage.setItem('theme-mode', newMode)
  }


  // Listen for system theme changes
  const [systemTheme, setSystemTheme] = useState<'light' | 'dark'>(() =>
    window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  )

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = (e: MediaQueryListEvent) => {
      setSystemTheme(e.matches ? 'dark' : 'light')
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  // Recalculate effective theme if mode is system or system theme changes
  const finalEffectiveTheme = useMemo(() => {
    if (mode === 'system') return systemTheme
    return mode as 'light' | 'dark'
  }, [mode, systemTheme])

  // Use finalEffectiveTheme in the provider and effector
  useEffect(() => {
    const root = window.document.documentElement
    root.classList.remove('light-theme', 'dark')
    if (finalEffectiveTheme === 'light') {
      root.classList.add('light-theme')
    } else {
      root.classList.add('dark')
    }
  }, [finalEffectiveTheme])

  const value = useMemo(() => ({
    theme: defaultTheme,
    mode,
    setMode,
    effectiveTheme: finalEffectiveTheme
  }), [mode, finalEffectiveTheme])

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}
