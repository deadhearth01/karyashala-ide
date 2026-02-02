'use client';

import { useState } from 'react';
import { AppSettings, EditorFontSize, ThemeMode, PythonModuleInfo } from '@/types';
import { cn } from '@/lib/utils';

interface SettingsPanelProps {
  settings: AppSettings;
  onUpdateSetting: <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => void;
  onClearData: () => void;
  pythonReady: boolean;
  pythonModules: PythonModuleInfo[];
}

type SettingsSection = 'appearance' | 'editor' | 'modules' | 'data';

export function SettingsPanel({
  settings,
  onUpdateSetting,
  onClearData,
  pythonReady,
  pythonModules,
}: SettingsPanelProps) {
  const [activeSection, setActiveSection] = useState<SettingsSection>('appearance');
  const [confirmClear, setConfirmClear] = useState(false);

  const sections: { id: SettingsSection; label: string; icon: React.ReactNode }[] = [
    {
      id: 'appearance',
      label: 'Appearance',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
        </svg>
      ),
    },
    {
      id: 'editor',
      label: 'Editor',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
        </svg>
      ),
    },
    {
      id: 'modules',
      label: 'Python Modules',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      ),
    },
    {
      id: 'data',
      label: 'Data & Storage',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
        </svg>
      ),
    },
  ];

  const handleClearData = () => {
    if (confirmClear) {
      onClearData();
      setConfirmClear(false);
    } else {
      setConfirmClear(true);
      // Reset after 3 seconds
      setTimeout(() => setConfirmClear(false), 3000);
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="px-3 py-2 border-b border-neutral-200 dark:border-neutral-800">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
          Settings
        </span>
      </div>

      {/* Section tabs */}
      <div className="flex flex-col gap-0.5 p-2 border-b border-neutral-200 dark:border-neutral-800">
        {sections.map((section) => (
          <button
            key={section.id}
            onClick={() => setActiveSection(section.id)}
            className={cn(
              "flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors",
              activeSection === section.id
                ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                : "hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-400"
            )}
          >
            {section.icon}
            <span>{section.label}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-3 panel-scrollbar">
        {/* Appearance Section */}
        {activeSection === 'appearance' && (
          <div className="space-y-4">
            {/* Theme */}
            <div>
              <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                Theme
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['light', 'dark', 'system'] as ThemeMode[]).map((theme) => (
                  <button
                    key={theme}
                    onClick={() => onUpdateSetting('theme', theme)}
                    className={cn(
                      "flex flex-col items-center gap-1.5 p-2 rounded-lg border-2 transition-all",
                      settings.theme === theme
                        ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                        : "border-neutral-200 dark:border-neutral-700 hover:border-neutral-300 dark:hover:border-neutral-600"
                    )}
                  >
                    {theme === 'light' && (
                      <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                    )}
                    {theme === 'dark' && (
                      <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                      </svg>
                    )}
                    {theme === 'system' && (
                      <svg className="w-5 h-5 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    )}
                    <span className="text-xs capitalize text-neutral-700 dark:text-neutral-300">{theme}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Font Size */}
            <div>
              <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                Font Size
              </label>
              <div className="flex items-center gap-2">
                {([12, 14, 16, 18, 20] as EditorFontSize[]).map((size) => (
                  <button
                    key={size}
                    onClick={() => onUpdateSetting('fontSize', size)}
                    className={cn(
                      "px-3 py-1.5 rounded-md text-sm font-medium transition-all",
                      settings.fontSize === size
                        ? "bg-blue-500 text-white"
                        : "bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700"
                    )}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Editor Section */}
        {activeSection === 'editor' && (
          <div className="space-y-3">
            <ToggleSetting
              label="Show Line Numbers"
              description="Display line numbers in the editor gutter"
              checked={settings.showLineNumbers}
              onChange={(v) => onUpdateSetting('showLineNumbers', v)}
            />
            <ToggleSetting
              label="Word Wrap"
              description="Wrap long lines to fit the editor width"
              checked={settings.wordWrap}
              onChange={(v) => onUpdateSetting('wordWrap', v)}
            />
            <ToggleSetting
              label="Auto Save"
              description="Automatically save files to browser storage"
              checked={settings.autoSave}
              onChange={(v) => onUpdateSetting('autoSave', v)}
            />
            
            {/* Tab Size */}
            <div className="pt-2">
              <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                Tab Size
              </label>
              <div className="flex items-center gap-2">
                {([2, 4] as const).map((size) => (
                  <button
                    key={size}
                    onClick={() => onUpdateSetting('tabSize', size)}
                    className={cn(
                      "px-4 py-1.5 rounded-md text-sm font-medium transition-all",
                      settings.tabSize === size
                        ? "bg-blue-500 text-white"
                        : "bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700"
                    )}
                  >
                    {size} spaces
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Python Modules Section */}
        {activeSection === 'modules' && (
          <div className="space-y-3">
            {/* Status */}
            <div className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-lg",
              pythonReady
                ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400"
                : "bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400"
            )}>
              <span className={cn(
                "w-2 h-2 rounded-full",
                pythonReady ? "bg-emerald-500" : "bg-amber-500 animate-pulse"
              )} />
              <span className="text-sm font-medium">
                {pythonReady ? 'Pyodide Runtime Ready' : 'Loading Pyodide...'}
              </span>
            </div>

            {/* Built-in modules info */}
            <div className="text-xs text-neutral-500 dark:text-neutral-400 mb-2">
              Pyodide includes Python standard library and these packages:
            </div>

            {/* Module list */}
            <div className="space-y-1">
              {pythonModules.map((mod) => (
                <div
                  key={mod.name}
                  className="flex items-center justify-between px-3 py-2 rounded-lg bg-neutral-50 dark:bg-neutral-900"
                >
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      "w-1.5 h-1.5 rounded-full",
                      mod.isInstalled ? "bg-emerald-500" : "bg-neutral-400"
                    )} />
                    <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                      {mod.name}
                    </span>
                  </div>
                  <span className="text-xs text-neutral-500 dark:text-neutral-400">
                    {mod.version}
                  </span>
                </div>
              ))}
            </div>

            {/* Note */}
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-3 p-2 bg-neutral-100 dark:bg-neutral-800 rounded-lg">
              💡 Additional packages can be installed using <code className="px-1 py-0.5 bg-neutral-200 dark:bg-neutral-700 rounded text-[10px]">micropip.install()</code> in your Python code.
            </p>
          </div>
        )}

        {/* Data & Storage Section */}
        {activeSection === 'data' && (
          <div className="space-y-4">
            {/* Storage info */}
            <div className="p-3 rounded-lg bg-neutral-50 dark:bg-neutral-900">
              <div className="flex items-center gap-2 mb-2">
                <svg className="w-4 h-4 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                </svg>
                <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                  Browser Storage
                </span>
              </div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Your files and settings are stored locally in your browser using localStorage.
              </p>
            </div>

            {/* Clear data button */}
            <div className="pt-2">
              <button
                onClick={handleClearData}
                className={cn(
                  "w-full px-4 py-2.5 rounded-lg text-sm font-medium transition-all",
                  confirmClear
                    ? "bg-red-500 text-white hover:bg-red-600"
                    : "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30"
                )}
              >
                {confirmClear ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    Click again to confirm
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Clear All Data & Cache
                  </span>
                )}
              </button>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-2 text-center">
                This will delete all files, settings, and cached data
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Toggle setting component
interface ToggleSettingProps {
  label: string;
  description: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}

function ToggleSetting({ label, description, checked, onChange }: ToggleSettingProps) {
  return (
    <div className="flex items-start justify-between gap-3 py-2">
      <div>
        <div className="text-sm font-medium text-neutral-700 dark:text-neutral-300">{label}</div>
        <div className="text-xs text-neutral-500 dark:text-neutral-400">{description}</div>
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={cn(
          "relative w-10 h-6 rounded-full transition-colors flex-shrink-0",
          checked ? "bg-blue-500" : "bg-neutral-300 dark:bg-neutral-600"
        )}
      >
        <span
          className={cn(
            "absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow transition-transform",
            checked && "translate-x-4"
          )}
        />
      </button>
    </div>
  );
}
