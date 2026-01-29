'use client';

import { useState, useRef, useEffect } from 'react';

interface LanguageSelectorProps {
  language: 'python' | 'c';
  onChange: (language: 'python' | 'c') => void;
  disabled?: boolean;
}

const languages = [
  { id: 'python' as const, name: 'Python', icon: 'Py' },
  { id: 'c' as const, name: 'C', icon: 'C' },
];

export function LanguageSelector({ language, onChange, disabled }: LanguageSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedLanguage = languages.find(l => l.id === language) || languages[0];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`flex items-center gap-2 px-3 py-2 rounded-lg bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <span className="w-6 h-6 flex items-center justify-center rounded bg-neutral-900 dark:bg-neutral-100 text-neutral-100 dark:text-neutral-900 text-xs font-bold">
          {selectedLanguage.icon}
        </span>
        <span className="font-medium text-neutral-900 dark:text-neutral-100">
          {selectedLanguage.name}
        </span>
        <svg
          className={`w-4 h-4 text-neutral-500 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-40 bg-white dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-700 shadow-lg z-50 overflow-hidden">
          {languages.map((lang) => (
            <button
              key={lang.id}
              onClick={() => {
                onChange(lang.id);
                setIsOpen(false);
              }}
              className={`w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors ${
                lang.id === language ? 'bg-neutral-100 dark:bg-neutral-800' : ''
              }`}
            >
              <span className="w-6 h-6 flex items-center justify-center rounded bg-neutral-900 dark:bg-neutral-100 text-neutral-100 dark:text-neutral-900 text-xs font-bold">
                {lang.icon}
              </span>
              <span className="font-medium text-neutral-900 dark:text-neutral-100">
                {lang.name}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
