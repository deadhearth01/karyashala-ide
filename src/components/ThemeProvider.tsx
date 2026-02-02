'use client';

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';

type Theme = 'light' | 'dark';
type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: Theme;
  themeMode: ThemeMode;
  toggleTheme: () => void;
  setThemeMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'light',
  themeMode: 'system',
  toggleTheme: () => {},
  setThemeMode: () => {},
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>('light');
  const [themeMode, setThemeModeState] = useState<ThemeMode>('system');
  const [mounted, setMounted] = useState(false);

  // Get effective theme based on mode
  const getEffectiveTheme = useCallback((mode: ThemeMode): Theme => {
    if (mode === 'system') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return mode;
  }, []);

  // Apply theme to document
  const applyTheme = useCallback((newTheme: Theme) => {
    setTheme(newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
  }, []);

  useEffect(() => {
    setMounted(true);
    
    // Check for saved theme mode or default to system
    const savedMode = localStorage.getItem('themeMode') as ThemeMode | null;
    const mode = savedMode || 'system';
    setThemeModeState(mode);
    
    const effectiveTheme = getEffectiveTheme(mode);
    applyTheme(effectiveTheme);

    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      if (themeMode === 'system') {
        applyTheme(mediaQuery.matches ? 'dark' : 'light');
      }
    };
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [getEffectiveTheme, applyTheme, themeMode]);

  const setThemeMode = useCallback((mode: ThemeMode) => {
    setThemeModeState(mode);
    localStorage.setItem('themeMode', mode);
    const effectiveTheme = getEffectiveTheme(mode);
    applyTheme(effectiveTheme);
  }, [getEffectiveTheme, applyTheme]);

  const toggleTheme = useCallback(() => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setThemeModeState(newTheme);
    localStorage.setItem('themeMode', newTheme);
    applyTheme(newTheme);
  }, [theme, applyTheme]);

  // Provide default values during SSR
  const value = {
    theme: mounted ? theme : 'light',
    themeMode: mounted ? themeMode : 'system',
    toggleTheme,
    setThemeMode,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  return context;
}
