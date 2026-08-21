import { createContext, useContext, useLayoutEffect, useState, type ReactNode } from 'react'

type Theme = 'dark' | 'light'

interface ThemeContextValue {
    theme: Theme
    setTheme: (theme: Theme) => void
    toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

const STORAGE_KEY = 'failsafe-ai-theme'

function getInitialTheme(): Theme {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    if (stored === 'dark' || stored === 'light') return stored
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function applyTheme(theme: Theme) {
    document.documentElement.setAttribute('data-theme', theme)
    document.documentElement.style.colorScheme = theme
}

export function ThemeProvider({ children }: { children: ReactNode }) {
    const [theme, setThemeState] = useState<Theme>(() => {
        const initialTheme = getInitialTheme()
        applyTheme(initialTheme)
        return initialTheme
    })

    useLayoutEffect(() => {
        applyTheme(theme)
        window.localStorage.setItem(STORAGE_KEY, theme)
    }, [theme])

    const setTheme = (next: Theme) => setThemeState(next)
    const toggleTheme = () => setThemeState((prev) => (prev === 'dark' ? 'light' : 'dark'))

    return (
        <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    )
}

export function useTheme() {
    const ctx = useContext(ThemeContext)
    if (!ctx) throw new Error('useTheme must be used within ThemeProvider')
    return ctx
}
