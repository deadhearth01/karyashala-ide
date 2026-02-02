'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useMemo } from 'react';
import { ThemeProvider as MuiThemeProvider, createTheme, CssBaseline } from '@mui/material';

type ThemeMode = 'light' | 'dark';

interface ThemeContextType {
  theme: ThemeMode;
  toggleTheme: () => void;
  setThemeMode: (mode: ThemeMode) => void;
}

// Default value for SSR - light theme by default
const defaultContextValue: ThemeContextType = {
  theme: 'light',
  toggleTheme: () => {},
  setThemeMode: () => {},
};

const ThemeContext = createContext<ThemeContextType>(defaultContextValue);

export function useTheme() {
  return useContext(ThemeContext);
}

interface ThemeProviderProps {
  children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [mode, setMode] = useState<ThemeMode>('light');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Check for saved preference - default to light if not saved
    const savedTheme = localStorage.getItem('theme') as ThemeMode | null;
    if (savedTheme) {
      setMode(savedTheme);
    }
    // Default is light theme, no need to check system preference
  }, []);

  useEffect(() => {
    if (mounted) {
      localStorage.setItem('theme', mode);
      document.documentElement.classList.toggle('dark', mode === 'dark');
    }
  }, [mode, mounted]);

  const toggleTheme = () => {
    setMode((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  const setThemeMode = (newMode: ThemeMode) => {
    setMode(newMode);
  };

  // Create MUI theme based on mode - always use light theme during SSR
  const muiTheme = useMemo(
    () =>
      createTheme({
        palette: {
          mode: mounted ? mode : 'light',
          primary: {
            main: '#3b82f6',
            light: '#60a5fa',
            dark: '#2563eb',
          },
          secondary: {
            main: '#8b5cf6',
            light: '#a78bfa',
            dark: '#7c3aed',
          },
          success: {
            main: '#10b981',
            light: '#34d399',
            dark: '#059669',
          },
          warning: {
            main: '#f59e0b',
            light: '#fbbf24',
            dark: '#d97706',
          },
          error: {
            main: '#ef4444',
            light: '#f87171',
            dark: '#dc2626',
          },
          background: {
            default: mode === 'dark' ? '#0a0a0a' : '#fafafa',
            paper: mode === 'dark' ? '#171717' : '#ffffff',
          },
          text: {
            primary: mode === 'dark' ? '#fafafa' : '#171717',
            secondary: mode === 'dark' ? '#a3a3a3' : '#525252',
          },
          divider: mode === 'dark' ? '#262626' : '#e5e5e5',
        },
        typography: {
          fontFamily: "'Inter', system-ui, sans-serif",
          fontSize: 14,
          h1: {
            fontWeight: 700,
          },
          h2: {
            fontWeight: 600,
          },
          h3: {
            fontWeight: 600,
          },
          button: {
            textTransform: 'none',
            fontWeight: 500,
          },
        },
        shape: {
          borderRadius: 8,
        },
        components: {
          MuiCssBaseline: {
            styleOverrides: {
              body: {
                scrollbarWidth: 'thin',
                '&::-webkit-scrollbar': {
                  width: '8px',
                  height: '8px',
                },
                '&::-webkit-scrollbar-track': {
                  background: mode === 'dark' ? '#171717' : '#f5f5f5',
                },
                '&::-webkit-scrollbar-thumb': {
                  background: mode === 'dark' ? '#404040' : '#d4d4d4',
                  borderRadius: '4px',
                },
                '&::-webkit-scrollbar-thumb:hover': {
                  background: mode === 'dark' ? '#525252' : '#a3a3a3',
                },
              },
            },
          },
          MuiButton: {
            styleOverrides: {
              root: {
                borderRadius: 8,
                padding: '6px 16px',
              },
              contained: {
                boxShadow: 'none',
                '&:hover': {
                  boxShadow: 'none',
                },
              },
            },
          },
          MuiPaper: {
            styleOverrides: {
              root: {
                backgroundImage: 'none',
              },
            },
          },
          MuiIconButton: {
            styleOverrides: {
              root: {
                borderRadius: 8,
              },
            },
          },
          MuiTooltip: {
            styleOverrides: {
              tooltip: {
                fontSize: '0.75rem',
                borderRadius: 6,
              },
            },
          },
        },
      }),
    [mode]
  );

  const contextValue = useMemo(
    () => ({ theme: mode, toggleTheme, setThemeMode }),
    [mode]
  );

  return (
    <ThemeContext.Provider value={contextValue}>
      <MuiThemeProvider theme={muiTheme}>
        <CssBaseline />
        <div style={{ visibility: mounted ? 'visible' : 'hidden' }}>
          {children}
        </div>
      </MuiThemeProvider>
    </ThemeContext.Provider>
  );
}
