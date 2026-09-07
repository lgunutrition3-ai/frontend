import React, { createContext, useState, useEffect, useContext, useCallback } from 'react'
import { useLocation } from 'react-router-dom'

export const ThemeContext = createContext()

const THEME_KEY = 'nutrition-theme'
const ACCENT_KEY = 'nutrition-accent'

export const THEME_OPTIONS = [
  { value: 'emerald', label: 'Emerald', color: '#2E8B6F' },
  { value: 'ocean', label: 'Ocean', color: '#2563EB' },
  { value: 'amber', label: 'Amber', color: '#D9930C' },
  { value: 'rose', label: 'Rose', color: '#D1455B' },
  { value: 'violet', label: 'Violet', color: '#6D5BD0' },
]

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => localStorage.getItem(THEME_KEY) || 'light')
  const [accent, setAccent] = useState(() => localStorage.getItem(ACCENT_KEY) || 'emerald')
  const location = useLocation()

  useEffect(() => {
    const isLoginPage = location.pathname === '/login'
    const effectiveTheme = isLoginPage ? 'light' : theme

    document.documentElement.setAttribute('data-theme', effectiveTheme)
    document.documentElement.setAttribute('data-bs-theme', effectiveTheme)
    document.documentElement.setAttribute('data-accent', accent)
    localStorage.setItem(THEME_KEY, theme)
    localStorage.setItem(ACCENT_KEY, accent)
  }, [theme, accent, location.pathname])

  const toggleTheme = useCallback(() => {
    setTheme((t) => (t === 'light' ? 'dark' : 'light'))
  }, [])

  const value = {
    theme,
    accent,
    setTheme,
    setAccent,
    toggleTheme,
  }

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider')
  }
  return context
}