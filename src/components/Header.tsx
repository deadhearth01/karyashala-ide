'use client';

import { useTheme } from './ThemeProvider';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';

export function Header() {
  const { theme, toggleTheme } = useTheme();
  const { isOnline } = useNetworkStatus();

  return (
    <header className="bg-white dark:bg-neutral-950 border-b border-neutral-200 dark:border-neutral-800 transition-colors duration-200">
      <div className="container mx-auto px-6 max-w-7xl">
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-neutral-900 dark:bg-neutral-100 flex items-center justify-center">
              <svg className="w-5 h-5 text-white dark:text-neutral-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
              </svg>
            </div>
            <div>
              <h1 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
                Code Compiler
              </h1>
            </div>
          </div>

          {/* Right side controls */}
          <div className="flex items-center gap-2">
            {/* Network Status Indicator */}
            <div className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium ${
              isOnline 
                ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' 
                : 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`} />
              {isOnline ? 'Online' : 'Offline'}
            </div>

            {/* WebAssembly badge */}
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-neutral-100 dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 text-xs font-medium">
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M14.745 2.015L12 5.477 9.255 2.015 0 4.479l2.197 14.832L12 22l9.803-2.689L24 4.479l-9.255-2.464zM6.27 14.91l.728-3.883.108-.554h.054l.135.554.782 3.883h1.593l1.377-6.363H9.534l-.54 3.72-.108.527h-.054l-.108-.527-.729-3.72H6.594l-.729 3.72-.108.527h-.054l-.108-.527-.54-3.72H3.543l1.377 6.363H6.27zm10.044 0l-.945-3.13-.162-.5h-.054l-.162.5-.945 3.13h-1.458l-1.62-6.363h1.62l.702 3.288.162.609h.054l.162-.609.864-3.288h1.35l.864 3.288.162.609h.054l.162-.609.702-3.288h1.62l-1.62 6.363h-1.512z"/>
              </svg>
              WASM
            </div>

            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg bg-neutral-100 dark:bg-neutral-900 hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors duration-200"
              aria-label="Toggle theme"
            >
              {theme === 'light' ? (
                <svg className="w-4 h-4 text-neutral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              ) : (
                <svg className="w-4 h-4 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
