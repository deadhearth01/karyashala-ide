'use client';

import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { Sidebar } from '@/components/Sidebar';
import { OutputPanel } from '@/components/OutputPanel';
import { NetworkBanner } from '@/components/NetworkBanner';
import { HeaderLoadingIndicator } from '@/components/LoadingBar';
import { ToastProvider, showToast } from '@/components/Toast';
import { usePythonWorker } from '@/hooks/usePythonWorker';
import { useCWorker } from '@/hooks/useCCompiler';
import { useFileSystem } from '@/hooks/useFileSystem';
import { useSettings } from '@/hooks/useSettings';
import { useServiceWorker } from '@/hooks/useServiceWorker';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { useTheme } from '@/components/ThemeProvider';
import { Language, ExecutionResult, ExecutionStatus, SidebarTab, PythonModuleInfo } from '@/types';
import { Button } from '@/components/ui/button';
import { LanguageSelector } from '@/components/LanguageSelector';
import { initializeSecurity, addSecurityStyles, setCopyPasteEnabled, setToastCallback } from '@/lib/security';

// Dynamic import Monaco Editor to avoid SSR issues
const CodeEditor = dynamic(() => import('@/components/CodeEditor'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-neutral-50 dark:bg-neutral-900">
      <div className="flex items-center gap-3">
        <div className="w-5 h-5 border-2 border-neutral-900 dark:border-neutral-100 border-t-transparent rounded-full animate-spin"></div>
        <span className="text-neutral-600 dark:text-neutral-400">Loading Editor...</span>
      </div>
    </div>
  ),
});

// Default Python modules that come with Pyodide
const DEFAULT_PYTHON_MODULES: PythonModuleInfo[] = [
  { name: 'numpy', version: 'Built-in', isInstalled: true },
  { name: 'micropip', version: 'Built-in', isInstalled: true },
  { name: 'sqlite3', version: 'Built-in', isInstalled: true },
  { name: 'json', version: 'Built-in', isInstalled: true },
  { name: 'math', version: 'Built-in', isInstalled: true },
  { name: 're', version: 'Built-in', isInstalled: true },
  { name: 'datetime', version: 'Built-in', isInstalled: true },
  { name: 'collections', version: 'Built-in', isInstalled: true },
];

export default function Home() {
  // File system
  const {
    files,
    activeFile,
    activeFileId,
    setActiveFileId,
    getFilesByLanguage,
    createFile,
    renameFile,
    updateFileContent,
    deleteFile,
    getFileContentsMap,
    clearAllData,
    isLoaded: filesLoaded,
  } = useFileSystem();

  // Settings
  const { settings, updateSetting, isLoaded: settingsLoaded } = useSettings();

  // UI state
  const [sidebarTab, setSidebarTab] = useState<SidebarTab>('files');
  const [selectedLanguage, setSelectedLanguage] = useState<Language>('python');
  const [output, setOutput] = useState<ExecutionResult | null>(null);
  const [status, setStatus] = useState<ExecutionStatus>('idle');
  const [copyPasteAllowed, setCopyPasteAllowed] = useState(false);
  const editorRef = useRef<any>(null);

  // Determine current language from active file or selected language
  const currentLanguage: Language = activeFile?.language || selectedLanguage;

  // Theme
  const { theme, toggleTheme, setThemeMode } = useTheme();

  // Network status
  const { isOnline } = useNetworkStatus();

  // Workers
  const { 
    runPython, 
    isReady: isPythonReady, 
    isLoading: isPythonLoading,
    loadProgress: pythonLoadProgress,
    loadStatus: pythonLoadStatus,
    error: pythonError 
  } = usePythonWorker();
  
  const { 
    runC, 
    isReady: isCReady, 
    isLoading: isCLoading,
    loadProgress: cLoadProgress,
    loadStatus: cLoadStatus,
    error: cError 
  } = useCWorker();

  // Initialize service worker for offline caching
  useServiceWorker();

  // Initialize security features
  useEffect(() => {
    addSecurityStyles();
    setToastCallback(showToast);
    const cleanup = initializeSecurity();
    return cleanup;
  }, []);

  // Handle copy/paste toggle
  const handleCopyPasteToggle = useCallback(() => {
    const newValue = !copyPasteAllowed;
    setCopyPasteAllowed(newValue);
    setCopyPasteEnabled(newValue);
  }, [copyPasteAllowed]);

  // Handle editor mount
  const handleEditorMount = useCallback((editor: any) => {
    editorRef.current = editor;
  }, []);

  // Handle code change
  const handleCodeChange = useCallback((value: string | undefined) => {
    if (activeFileId && value !== undefined) {
      updateFileContent(activeFileId, value);
    }
  }, [activeFileId, updateFileContent]);

  // Handle file selection
  const handleFileSelect = useCallback((fileId: string) => {
    setActiveFileId(fileId);
    // Clear output when switching files
    setOutput(null);
    setStatus('idle');
  }, [setActiveFileId]);

  // Handle language change
  const handleLanguageChange = useCallback((language: Language) => {
    setSelectedLanguage(language);
    // Find first file of the selected language and switch to it
    const languageFiles = files.filter(f => f.language === language);
    if (languageFiles.length > 0) {
      setActiveFileId(languageFiles[0].id);
    }
    // Clear output
    setOutput(null);
    setStatus('idle');
  }, [files, setActiveFileId]);

  // Handle search result click (navigate to line)
  const handleSearchResultClick = useCallback((fileId: string, lineNumber: number) => {
    setActiveFileId(fileId);
    // Navigate to line in editor
    setTimeout(() => {
      if (editorRef.current) {
        editorRef.current.revealLineInCenter(lineNumber);
        editorRef.current.setPosition({ lineNumber, column: 1 });
        editorRef.current.focus();
      }
    }, 100);
  }, [setActiveFileId]);

  // Handle run
  const handleRun = useCallback(async () => {
    if (!activeFile) return;

    // Check if runtime has an error
    const currentError = currentLanguage === 'python' ? pythonError : cError;
    if (currentError) {
      setOutput({
        stdout: '',
        stderr: currentError,
        executionTime: 0,
        status: 'error',
      });
      setStatus('error');
      return;
    }

    setStatus('running');
    setOutput({
      stdout: '',
      stderr: '',
      executionTime: 0,
      status: 'running',
    });

    const startTime = performance.now();

    try {
      let result: ExecutionResult;

      if (currentLanguage === 'python') {
        // Get all Python files for multi-file support (import between files)
        const fileContents = getFileContentsMap();
        // Pass all files to the worker so imports can work
        result = await runPython(activeFile.content, fileContents);
      } else {
        result = await runC(activeFile.content);
      }

      const executionTime = performance.now() - startTime;
      
      setOutput({
        ...result,
        executionTime,
      });
      setStatus(result.status === 'error' ? 'error' : 'success');
    } catch (error) {
      const executionTime = performance.now() - startTime;
      setOutput({
        stdout: '',
        stderr: error instanceof Error ? error.message : 'An unexpected error occurred',
        executionTime,
        status: 'error',
      });
      setStatus('error');
    }
  }, [activeFile, currentLanguage, runPython, runC, pythonError, cError, getFileContentsMap]);

  const handleClear = useCallback(() => {
    setOutput(null);
    setStatus('idle');
  }, []);

  // Handle clear all data
  const handleClearData = useCallback(() => {
    clearAllData();
    setOutput(null);
    setStatus('idle');
    showToast('All data cleared successfully');
  }, [clearAllData]);

  // Handle settings update with theme sync
  const handleUpdateSetting = useCallback(<K extends keyof typeof settings>(key: K, value: typeof settings[K]) => {
    updateSetting(key, value);
    // Sync theme changes with ThemeProvider
    if (key === 'theme') {
      setThemeMode(value as 'light' | 'dark' | 'system');
    }
  }, [updateSetting, setThemeMode]);

  // Derived state
  const isReady = currentLanguage === 'python' ? isPythonReady : isCReady;
  const isLoading = currentLanguage === 'python' ? isPythonLoading : isCLoading;
  const loadStatus = currentLanguage === 'python' ? pythonLoadStatus : cLoadStatus;
  const currentError = currentLanguage === 'python' ? pythonError : cError;

  // Keyboard shortcut: Ctrl+Enter or Cmd+Enter to run
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        if (isReady && status !== 'running') {
          handleRun();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isReady, status, handleRun]);

  // Don't render until files and settings are loaded
  if (!filesLoaded || !settingsLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-neutral-950">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-neutral-500">Loading workspace...</span>
        </div>
      </div>
    );
  }

  return (
    <ToastProvider>
      <div className="min-h-screen h-screen flex flex-col bg-neutral-50 dark:bg-neutral-950 transition-colors duration-200 no-select overflow-hidden relative">
        {/* Loading indicator at top */}
        <HeaderLoadingIndicator
          pythonLoading={isPythonLoading}
          pythonProgress={pythonLoadProgress}
          pythonStatus={pythonLoadStatus}
          cLoading={isCLoading}
          cProgress={cLoadProgress}
          cStatus={cLoadStatus}
        />

        {/* Network Status Banner */}
        <NetworkBanner />
        
        {/* Header */}
        <header className="bg-white dark:bg-neutral-950 border-b border-neutral-200 dark:border-neutral-800 transition-colors duration-200 flex-shrink-0">
          <div className="flex items-center justify-between h-14 px-4 gap-4">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-sm">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                </svg>
              </div>
              <div className="hidden sm:block">
                <h1 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
                  Code Compiler
                </h1>
              </div>
            </div>

            {/* Center - Language selector + File name */}
            <div className="flex items-center gap-3">
              {/* Language Selector */}
              <LanguageSelector
                language={currentLanguage}
                onChange={handleLanguageChange}
                disabled={status === 'running'}
              />

              {/* Current file name */}
              {activeFile && (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700">
                  <span className={`w-2 h-2 rounded-full ${currentLanguage === 'python' ? 'bg-[#3776AB]' : 'bg-[#A8B9CC]'}`} />
                  <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                    {activeFile.name}
                  </span>
                </div>
              )}

              {/* Copy/Paste Toggle */}
              <button
                onClick={handleCopyPasteToggle}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm font-medium transition-colors ${
                  copyPasteAllowed
                    ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-300 dark:border-emerald-700 text-emerald-600 dark:text-emerald-400'
                    : 'bg-neutral-100 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 text-neutral-500 dark:text-neutral-400'
                }`}
                title={copyPasteAllowed ? 'Copy/Paste Enabled' : 'Copy/Paste Disabled'}
              >
                {copyPasteAllowed ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                  </svg>
                )}
                <span className="hidden md:inline">{copyPasteAllowed ? 'Copy/Paste On' : 'Copy/Paste Off'}</span>
              </button>
            </div>

            {/* Right side controls */}
            <div className="flex items-center gap-3">
              {/* Network Status */}
              <div className={`hidden md:flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium ${
                isOnline 
                  ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400' 
                  : 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`} />
                {isOnline ? 'Online' : 'Offline'}
              </div>

              {/* WASM badge */}
              <div className="hidden md:flex items-center gap-1.5 px-2 py-1 rounded-md bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400 text-xs font-medium">
                <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M14.745 2.015L12 5.477 9.255 2.015 0 4.479l2.197 14.832L12 22l9.803-2.689L24 4.479l-9.255-2.464z"/>
                </svg>
                WASM
              </div>

              {/* Clear button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClear}
                disabled={status === 'running'}
                className="h-8 px-2 text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"
              >
                Clear
              </Button>

              {/* Run button */}
              <Button
                onClick={handleRun}
                disabled={!isReady || status === 'running' || !!currentError}
                className="h-8 gap-1.5 bg-emerald-500 hover:bg-emerald-600 text-white"
              >
                {status === 'running' ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span className="hidden sm:inline">Running</span>
                  </>
                ) : isLoading ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span className="hidden sm:inline">Loading</span>
                  </>
                ) : currentError ? (
                  <>
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <span className="hidden sm:inline">Error</span>
                  </>
                ) : (
                  <>
                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                    </svg>
                    <span>Run</span>
                  </>
                )}
              </Button>

              {/* Theme toggle */}
              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                aria-label="Toggle theme"
              >
                {theme === 'light' ? (
                  <svg className="w-4 h-4 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
        </header>
        
        {/* Main content */}
        <main className="flex-1 flex overflow-hidden">
          {/* Sidebar */}
          <Sidebar
            activeTab={sidebarTab}
            onTabChange={setSidebarTab}
            files={files}
            activeFileId={activeFileId}
            currentLanguage={currentLanguage}
            onFileSelect={handleFileSelect}
            onFileCreate={createFile}
            onFileRename={renameFile}
            onFileDelete={deleteFile}
            onSearchResultClick={handleSearchResultClick}
            settings={settings}
            onUpdateSetting={handleUpdateSetting}
            onClearData={handleClearData}
            pythonReady={isPythonReady}
            pythonModules={DEFAULT_PYTHON_MODULES}
          />

          {/* Editor and Output */}
          <div className="flex-1 flex gap-0 min-w-0">
            {/* Code Editor */}
            <div className="flex-1 flex flex-col min-w-0 border-r border-neutral-200 dark:border-neutral-800">
              {/* Editor tabs bar */}
              <div className="flex items-center h-9 bg-neutral-100 dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800 px-1 overflow-x-auto">
                {files.filter(f => f.language === currentLanguage).slice(0, 5).map((file) => (
                  <button
                    key={file.id}
                    onClick={() => handleFileSelect(file.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-t transition-colors whitespace-nowrap ${
                      file.id === activeFileId
                        ? 'bg-white dark:bg-neutral-950 text-neutral-800 dark:text-neutral-200 border-t border-l border-r border-neutral-200 dark:border-neutral-700 -mb-px'
                        : 'text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 hover:bg-neutral-200/50 dark:hover:bg-neutral-800/50'
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${file.language === 'python' ? 'bg-[#3776AB]' : 'bg-[#A8B9CC]'}`} />
                    {file.name}
                  </button>
                ))}
              </div>

              {/* Editor */}
              <div className="flex-1 min-h-0">
                {activeFile ? (
                  <CodeEditor
                    language={currentLanguage}
                    value={activeFile.content}
                    onChange={handleCodeChange}
                    onMount={handleEditorMount}
                    fontSize={settings.fontSize}
                    showLineNumbers={settings.showLineNumbers}
                    wordWrap={settings.wordWrap}
                    tabSize={settings.tabSize}
                  />
                ) : (
                  <div className="h-full flex items-center justify-center bg-neutral-50 dark:bg-neutral-900">
                    <div className="text-center">
                      <p className="text-neutral-500 dark:text-neutral-400 mb-2">No file selected</p>
                      <button
                        onClick={() => createFile('new_file', currentLanguage)}
                        className="text-sm text-blue-500 hover:underline"
                      >
                        Create a new file
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Output Panel */}
            <div className="w-[380px] min-w-[320px] flex flex-col bg-white dark:bg-neutral-950 border-l border-neutral-200 dark:border-neutral-800">
              {/* Output header */}
              <div className="flex items-center justify-between h-9 px-4 bg-neutral-50 dark:bg-neutral-900/50 border-b border-neutral-200 dark:border-neutral-800">
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                    Console Output
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {status === 'running' && (
                    <div className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400">
                      <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                      Running
                    </div>
                  )}
                  {output?.executionTime && status !== 'running' && (
                    <span className="text-[10px] text-neutral-400 font-mono">
                      {output.executionTime.toFixed(2)}ms
                    </span>
                  )}
                </div>
              </div>

              {/* Output content */}
              <div className="flex-1 overflow-auto">
                <OutputPanel result={output} status={status} />
              </div>

              {/* Status bar */}
              <div className="flex items-center justify-between h-7 px-3 bg-neutral-100 dark:bg-neutral-900 border-t border-neutral-200 dark:border-neutral-800 text-[10px]">
                <div className="flex items-center gap-2">
                  <span className={`w-1.5 h-1.5 rounded-full transition-colors ${
                    currentError ? 'bg-red-500' :
                    isLoading ? 'bg-amber-500 animate-pulse' :
                    status === 'running' ? 'bg-amber-500 animate-pulse' :
                    status === 'error' ? 'bg-red-500' :
                    isReady ? 'bg-emerald-500' : 'bg-neutral-400'
                  }`} />
                  <span className="text-neutral-500 dark:text-neutral-400 font-medium">
                    {currentError ? 'Error' :
                     isLoading ? (loadStatus || 'Loading...') :
                     status === 'running' ? 'Executing...' :
                     status === 'success' ? 'Completed' :
                     status === 'error' ? 'Error' :
                     isReady ? 'Ready' : 'Initializing'}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-neutral-400">
                  <span>{currentLanguage === 'python' ? 'Pyodide' : 'Clang'}</span>
                  <span>•</span>
                  <span>WebAssembly</span>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </ToastProvider>
  );
}
