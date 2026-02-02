'use client';

import { useState, useCallback, useEffect } from 'react';
import { AppSettings, EditorFontSize, ThemeMode } from '@/types';

const SETTINGS_KEY = 'wasm-compiler-settings';

const DEFAULT_SETTINGS: AppSettings = {
  theme: 'system',
  fontSize: 14,
  autoSave: true,
  showLineNumbers: true,
  wordWrap: false,
  tabSize: 4,
};

export function useSettings() {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load settings from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(SETTINGS_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setSettings({ ...DEFAULT_SETTINGS, ...parsed });
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
    setIsLoaded(true);
  }, []);

  // Save settings to localStorage whenever they change
  useEffect(() => {
    if (isLoaded) {
      try {
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
      } catch (error) {
        console.error('Failed to save settings:', error);
      }
    }
  }, [settings, isLoaded]);

  // Update a single setting
  const updateSetting = useCallback(<K extends keyof AppSettings>(
    key: K,
    value: AppSettings[K]
  ) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  }, []);

  // Update theme
  const setTheme = useCallback((theme: ThemeMode) => {
    updateSetting('theme', theme);
  }, [updateSetting]);

  // Update font size
  const setFontSize = useCallback((size: EditorFontSize) => {
    updateSetting('fontSize', size);
  }, [updateSetting]);

  // Reset to defaults
  const resetSettings = useCallback(() => {
    setSettings(DEFAULT_SETTINGS);
  }, []);

  return {
    settings,
    updateSetting,
    setTheme,
    setFontSize,
    resetSettings,
    isLoaded,
  };
}
