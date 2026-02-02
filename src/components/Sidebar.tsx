'use client';

import { SidebarTab, VirtualFile, Language, AppSettings, PythonModuleInfo } from '@/types';
import { FileExplorer } from './FileExplorer';
import { SearchPanel } from './SearchPanel';
import { SettingsPanel } from './SettingsPanel';
import { cn } from '@/lib/utils';

interface SidebarProps {
  activeTab: SidebarTab;
  onTabChange: (tab: SidebarTab) => void;
  // File Explorer props
  files: VirtualFile[];
  activeFileId: string | null;
  currentLanguage: Language;
  onFileSelect: (fileId: string) => void;
  onFileCreate: (name: string, language: Language) => void;
  onFileRename: (id: string, newName: string) => void;
  onFileDelete: (id: string) => void;
  // Search props
  onSearchResultClick: (fileId: string, lineNumber: number) => void;
  // Settings props
  settings: AppSettings;
  onUpdateSetting: <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => void;
  onClearData: () => void;
  pythonReady: boolean;
  pythonModules: PythonModuleInfo[];
}

const tabs: { id: SidebarTab; icon: React.ReactNode; label: string }[] = [
  {
    id: 'files',
    label: 'Explorer',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
      </svg>
    ),
  },
  {
    id: 'search',
    label: 'Search',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
    ),
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
];

export function Sidebar({
  activeTab,
  onTabChange,
  files,
  activeFileId,
  currentLanguage,
  onFileSelect,
  onFileCreate,
  onFileRename,
  onFileDelete,
  onSearchResultClick,
  settings,
  onUpdateSetting,
  onClearData,
  pythonReady,
  pythonModules,
}: SidebarProps) {
  return (
    <div className="h-full flex bg-neutral-50 dark:bg-neutral-950">
      {/* Tab bar */}
      <div className="w-12 flex flex-col items-center py-2 bg-neutral-100 dark:bg-neutral-900 border-r border-neutral-200 dark:border-neutral-800">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={cn(
              "w-10 h-10 flex items-center justify-center rounded-lg mb-1 transition-colors relative group",
              activeTab === tab.id
                ? "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30"
                : "text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-800"
            )}
            title={tab.label}
          >
            {tab.icon}
            {/* Active indicator */}
            {activeTab === tab.id && (
              <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 bg-blue-500 rounded-r" />
            )}
            {/* Tooltip */}
            <span className="absolute left-full ml-2 px-2 py-1 text-xs bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
              {tab.label}
            </span>
          </button>
        ))}

        {/* User icon at bottom */}
        <div className="mt-auto">
          <button className="w-10 h-10 flex items-center justify-center rounded-lg text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Panel content */}
      <div className="flex-1 min-w-0 border-r border-neutral-200 dark:border-neutral-800 overflow-hidden">
        {activeTab === 'files' && (
          <FileExplorer
            files={files}
            activeFileId={activeFileId}
            currentLanguage={currentLanguage}
            onFileSelect={onFileSelect}
            onFileCreate={onFileCreate}
            onFileRename={onFileRename}
            onFileDelete={onFileDelete}
          />
        )}

        {activeTab === 'search' && (
          <SearchPanel
            files={files}
            onFileSelect={onFileSelect}
            onResultClick={onSearchResultClick}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsPanel
            settings={settings}
            onUpdateSetting={onUpdateSetting}
            onClearData={onClearData}
            pythonReady={pythonReady}
            pythonModules={pythonModules}
          />
        )}
      </div>
    </div>
  );
}
