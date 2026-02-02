'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Chip,
  CircularProgress,
  Tooltip,
  Select,
  MenuItem,
  FormControl,
  LinearProgress,
} from '@mui/material';
import {
  PlayArrow as PlayArrowIcon,
  DarkMode as DarkModeIcon,
  LightMode as LightModeIcon,
  ContentCopy as ContentCopyIcon,
  Block as BlockIcon,
  Wifi as WifiIcon,
  WifiOff as WifiOffIcon,
  Terminal as TerminalIcon,
} from '@mui/icons-material';

import { MuiSidebar } from '@/components/MuiSidebar';
import { MuiOutputPanel } from '@/components/MuiOutputPanel';
import { ToastProvider, showToast } from '@/components/Toast';
import { usePythonWorker } from '@/hooks/usePythonWorker';
import { useCWorker } from '@/hooks/useCCompiler';
import { useFileSystem } from '@/hooks/useFileSystem';
import { useSettings } from '@/hooks/useSettings';
import { useServiceWorker } from '@/hooks/useServiceWorker';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { useTheme } from '@/components/MuiThemeProvider';
import { Language, ExecutionResult, ExecutionStatus, SidebarTab } from '@/types';
import { initializeSecurity, addSecurityStyles, setCopyPasteEnabled, setToastCallback } from '@/lib/security';

// Dynamic import Monaco Editor
const CodeEditor = dynamic(() => import('@/components/CodeEditor'), {
  ssr: false,
  loading: () => (
    <Box
      sx={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'background.paper',
      }}
    >
      <CircularProgress size={24} />
      <Typography variant="body2" sx={{ ml: 2, color: 'text.secondary' }}>
        Loading Editor...
      </Typography>
    </Box>
  ),
});

export default function Home() {
  const {
    files,
    activeFile,
    activeFileId,
    setActiveFileId,
    createFile,
    renameFile,
    updateFileContent,
    deleteFile,
    getFileContentsMap,
    clearAllData,
    isLoaded: filesLoaded,
  } = useFileSystem();

  const { settings, updateSetting, isLoaded: settingsLoaded } = useSettings();

  const [sidebarTab, setSidebarTab] = useState<SidebarTab>('files');
  const [selectedLanguage, setSelectedLanguage] = useState<Language>('python');
  const [output, setOutput] = useState<ExecutionResult | null>(null);
  const [status, setStatus] = useState<ExecutionStatus>('idle');
  const [copyPasteAllowed, setCopyPasteAllowed] = useState(false);
  const editorRef = useRef<any>(null);

  const [sidebarWidth, setSidebarWidth] = useState(280);
  const [outputWidth, setOutputWidth] = useState(360);
  const [isResizingEditor, setIsResizingEditor] = useState(false);
  const [isResizingOutput, setIsResizingOutput] = useState(false);

  const currentLanguage: Language = activeFile?.language || selectedLanguage;
  const { theme, toggleTheme, setThemeMode } = useTheme();
  const { isOnline } = useNetworkStatus();

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

  useServiceWorker();

  // Resize handlers
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isResizingEditor) {
        // Account for the icon sidebar (48px) when calculating width
        const iconSidebarWidth = 48;
        const newWidth = e.clientX - iconSidebarWidth;
        if (newWidth >= 150 && newWidth <= 500) {
          setSidebarWidth(newWidth);
        }
      }
      if (isResizingOutput) {
        const newWidth = window.innerWidth - e.clientX;
        if (newWidth >= 200 && newWidth <= 700) {
          setOutputWidth(newWidth);
        }
      }
    };

    const handleMouseUp = () => {
      setIsResizingEditor(false);
      setIsResizingOutput(false);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    if (isResizingEditor || isResizingOutput) {
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizingEditor, isResizingOutput]);

  useEffect(() => {
    addSecurityStyles();
    setToastCallback(showToast);
    const cleanup = initializeSecurity();
    return cleanup;
  }, []);

  const handleCopyPasteToggle = useCallback(() => {
    const newValue = !copyPasteAllowed;
    setCopyPasteAllowed(newValue);
    setCopyPasteEnabled(newValue);
  }, [copyPasteAllowed]);

  const handleEditorMount = useCallback((editor: any) => {
    editorRef.current = editor;
  }, []);

  const handleCodeChange = useCallback((value: string | undefined) => {
    if (activeFileId && value !== undefined) {
      updateFileContent(activeFileId, value);
    }
  }, [activeFileId, updateFileContent]);

  const handleFileSelect = useCallback((fileId: string) => {
    setActiveFileId(fileId);
    setOutput(null);
    setStatus('idle');
  }, [setActiveFileId]);

  const handleLanguageChange = useCallback((language: Language) => {
    setSelectedLanguage(language);
    // Find a file matching the selected language and switch to it
    const languageFiles = files.filter(f => f.language === language);
    if (languageFiles.length > 0) {
      setActiveFileId(languageFiles[0].id);
    } else {
      // Create a new file for this language if none exists
      const newFileName = language === 'python' ? 'main.py' : 'main.c';
      createFile(newFileName, language);
    }
    setOutput(null);
    setStatus('idle');
  }, [files, setActiveFileId, createFile]);

  const handleSearchResultClick = useCallback((fileId: string, lineNumber: number) => {
    setActiveFileId(fileId);
    setTimeout(() => {
      if (editorRef.current) {
        editorRef.current.revealLineInCenter(lineNumber);
        editorRef.current.setPosition({ lineNumber, column: 1 });
        editorRef.current.focus();
      }
    }, 100);
  }, [setActiveFileId]);

  const handleRun = useCallback(async () => {
    if (!activeFile) return;

    // Use the active file's language for execution
    const fileLanguage = activeFile.language;
    const currentError = fileLanguage === 'python' ? pythonError : cError;
    if (currentError) {
      setOutput({ stdout: '', stderr: currentError, executionTime: 0, status: 'error' });
      setStatus('error');
      return;
    }

    setStatus('running');
    setOutput({ stdout: '', stderr: '', executionTime: 0, status: 'running' });

    const startTime = performance.now();

    try {
      let result: ExecutionResult;
      if (fileLanguage === 'python') {
        const fileContents = getFileContentsMap();
        result = await runPython(activeFile.content, fileContents);
      } else {
        result = await runC(activeFile.content);
      }
      const executionTime = performance.now() - startTime;
      setOutput({ ...result, executionTime });
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
  }, [activeFile, runPython, runC, pythonError, cError, getFileContentsMap]);

  const handleClear = useCallback(() => {
    setOutput(null);
    setStatus('idle');
  }, []);

  const handleClearData = useCallback(() => {
    clearAllData();
    setOutput(null);
    setStatus('idle');
    showToast('All data cleared successfully');
  }, [clearAllData]);

  const handleUpdateSetting = useCallback(<K extends keyof typeof settings>(key: K, value: typeof settings[K]) => {
    updateSetting(key, value);
    if (key === 'theme' && (value === 'light' || value === 'dark')) {
      setThemeMode(value as 'light' | 'dark');
    }
  }, [updateSetting, setThemeMode]);

  // Use active file's language for runtime status
  const activeLanguage = activeFile?.language || 'python';
  const isReady = activeLanguage === 'python' ? isPythonReady : isCReady;
  const isLoading = activeLanguage === 'python' ? isPythonLoading : isCLoading;
  const loadStatus = activeLanguage === 'python' ? pythonLoadStatus : cLoadStatus;
  const loadProgress = activeLanguage === 'python' ? pythonLoadProgress : cLoadProgress;
  const currentError = activeLanguage === 'python' ? pythonError : cError;

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

  if (!filesLoaded || !settingsLoaded) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', bgcolor: 'background.default' }}>
        <CircularProgress size={40} />
        <Typography variant="body2" sx={{ mt: 2, color: 'text.secondary' }}>Loading workspace...</Typography>
      </Box>
    );
  }

  // Show all files in the tabs
  const displayedFiles = files;

  return (
    <ToastProvider>
      <Box sx={{ minHeight: '100vh', height: '100vh', display: 'flex', flexDirection: 'column', bgcolor: 'background.default', overflow: 'hidden' }}>
        {isLoading && (
          <LinearProgress variant="determinate" value={loadProgress} sx={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 9999, height: 3 }} />
        )}

        <AppBar position="static" elevation={0} sx={{ bgcolor: 'background.paper', borderBottom: 1, borderColor: 'divider' }}>
          <Toolbar sx={{ minHeight: 56, gap: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box
                component="img"
                src="/image.png"
                alt="Karyashala IDE"
                sx={{
                  width: 76,
                  height: 76,
                  objectFit: 'contain',
                  borderRadius: 1,
                }}
              />
            </Box>

            <FormControl size="small" sx={{ minWidth: 120 }}>
              <Select
                value={currentLanguage}
                onChange={(e) => handleLanguageChange(e.target.value as Language)}
                disabled={status === 'running'}
                sx={{ bgcolor: 'background.default', '& .MuiSelect-select': { display: 'flex', alignItems: 'center', gap: 1 } }}
              >
                <MenuItem value="python">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box component="img" src="/python.svg" alt="Python" sx={{ width: 18, height: 18 }} />
                    Python
                  </Box>
                </MenuItem>
                <MenuItem value="c">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box component="img" src="/c.svg" alt="C" sx={{ width: 18, height: 18, borderRadius: 0.5 }} />
                    C
                  </Box>
                </MenuItem>
              </Select>
            </FormControl>

            <Tooltip title={copyPasteAllowed ? 'Copy/Paste Enabled' : 'Copy/Paste Disabled'}>
              <Button
                variant={copyPasteAllowed ? 'contained' : 'outlined'}
                size="small"
                color={copyPasteAllowed ? 'success' : 'primary'}
                onClick={handleCopyPasteToggle}
                startIcon={copyPasteAllowed ? <ContentCopyIcon /> : <BlockIcon />}
                sx={{ 
                  borderRadius: 2, 
                  display: { xs: 'none', md: 'flex' },
                  borderColor: copyPasteAllowed ? undefined : 'divider',
                  color: copyPasteAllowed ? undefined : 'text.primary',
                }}
              >
                Copy/Paste {copyPasteAllowed ? 'On' : 'Off'}
              </Button>
            </Tooltip>

            <Box sx={{ flexGrow: 1 }} />

            <Chip
              icon={isOnline ? <WifiIcon /> : <WifiOffIcon />}
              label={isOnline ? 'Online' : 'Offline'}
              size="small"
              color={isOnline ? 'success' : 'warning'}
              variant="outlined"
              sx={{ display: { xs: 'none', md: 'flex' } }}
            />

            <Button variant="text" size="small" onClick={handleClear} disabled={status === 'running'} sx={{ color: 'text.secondary' }}>
              Clear
            </Button>

            <Button
              variant="contained"
              color="success"
              onClick={handleRun}
              disabled={!isReady || status === 'running' || !!currentError}
              startIcon={status === 'running' || isLoading ? <CircularProgress size={16} color="inherit" /> : <PlayArrowIcon />}
              sx={{ borderRadius: 2 }}
            >
              {status === 'running' ? 'Running' : isLoading ? 'Loading' : 'Run'}
            </Button>

            <Tooltip title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}>
              <IconButton onClick={toggleTheme} sx={{ color: 'text.secondary' }}>
                {theme === 'light' ? <DarkModeIcon /> : <LightModeIcon />}
              </IconButton>
            </Tooltip>
          </Toolbar>
        </AppBar>

        <Box sx={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          <Box sx={{ width: sidebarWidth, flexShrink: 0, borderRight: 1, borderColor: 'divider', display: 'flex', bgcolor: 'background.paper' }}>
            <MuiSidebar
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
            />
          </Box>

          {/* Sidebar Resize Handle */}
          <Box
            onMouseDown={() => setIsResizingEditor(true)}
            sx={{
              width: 6,
              cursor: 'col-resize',
              bgcolor: isResizingEditor ? 'primary.main' : 'divider',
              '&:hover': { bgcolor: 'primary.light' },
              transition: 'background-color 0.15s',
              flexShrink: 0,
              position: 'relative',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                bottom: 0,
                left: -4,
                right: -4,
              },
            }}
          />

          <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', height: 40, bgcolor: 'background.default', borderBottom: 1, borderColor: 'divider', px: 1, gap: 0.5, overflowX: 'auto' }}>
              {displayedFiles.slice(0, 8).map((file) => (
                <Button
                  key={file.id}
                  size="small"
                  variant={file.id === activeFileId ? 'contained' : 'text'}
                  onClick={() => handleFileSelect(file.id)}
                  sx={{
                    minWidth: 'auto',
                    px: 2,
                    py: 0.5,
                    borderRadius: 1,
                    fontSize: '0.75rem',
                    textTransform: 'none',
                    bgcolor: file.id === activeFileId ? 'background.paper' : 'transparent',
                    color: file.id === activeFileId ? 'text.primary' : 'text.secondary',
                    boxShadow: 'none',
                    '&:hover': { bgcolor: file.id === activeFileId ? 'background.paper' : 'action.hover', boxShadow: 'none' },
                  }}
                  startIcon={
                    <Box
                      component="img"
                      src={file.name.endsWith('.py') ? '/python.svg' : file.name.endsWith('.c') ? '/c.svg' : undefined}
                      alt=""
                      sx={{
                        width: 16,
                        height: 16,
                        borderRadius: 0.25,
                      }}
                    />
                  }
                >
                  {file.name}
                </Button>
              ))}
            </Box>

            <Box sx={{ flex: 1, minHeight: 0 }}>
              {activeFile ? (
                <CodeEditor
                  language={activeFile.language}
                  value={activeFile.content}
                  onChange={handleCodeChange}
                  onMount={handleEditorMount}
                  fontSize={settings.fontSize}
                  showLineNumbers={settings.showLineNumbers}
                  wordWrap={settings.wordWrap}
                  tabSize={settings.tabSize}
                />
              ) : (
                <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', bgcolor: 'background.default' }}>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>No file selected</Typography>
                  <Button variant="text" size="small" onClick={() => createFile('new_file', currentLanguage)}>Create a new file</Button>
                </Box>
              )}
            </Box>
          </Box>

          {/* Output Panel Resize Handle */}
          <Box
            onMouseDown={() => setIsResizingOutput(true)}
            sx={{
              width: 6,
              cursor: 'col-resize',
              bgcolor: isResizingOutput ? 'primary.main' : 'divider',
              '&:hover': { bgcolor: 'primary.light' },
              transition: 'background-color 0.2s',
              flexShrink: 0,
              position: 'relative',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                bottom: 0,
                left: -4,
                right: -4,
              },
            }}
          />

          <Box sx={{ width: outputWidth, flexShrink: 0, display: 'flex', flexDirection: 'column', bgcolor: 'background.paper' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 40, px: 2, borderBottom: 1, borderColor: 'divider', bgcolor: 'background.default' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <TerminalIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                <Typography variant="caption" fontWeight={600} color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>Console Output</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {status === 'running' && <Chip size="small" label="Running" color="warning" sx={{ height: 20, fontSize: '0.65rem' }} />}
                {output?.executionTime && status !== 'running' && (
                  <Typography variant="caption" color="text.disabled" fontFamily="monospace">{output.executionTime.toFixed(2)}ms</Typography>
                )}
              </Box>
            </Box>

            <Box sx={{ flex: 1, overflow: 'auto' }}>
              <MuiOutputPanel result={output} status={status} />
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 28, px: 2, borderTop: 1, borderColor: 'divider', bgcolor: 'background.default' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box
                  sx={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    bgcolor: currentError ? 'error.main' : isLoading || status === 'running' ? 'warning.main' : status === 'error' ? 'error.main' : isReady ? 'success.main' : 'grey.500',
                    animation: isLoading || status === 'running' ? 'pulse 1.5s infinite' : 'none',
                    '@keyframes pulse': { '0%, 100%': { opacity: 1 }, '50%': { opacity: 0.5 } },
                  }}
                />
                <Typography variant="caption" color="text.secondary">
                  {currentError ? 'Error' : isLoading ? loadStatus || 'Loading...' : status === 'running' ? 'Executing...' : status === 'success' ? 'Completed' : status === 'error' ? 'Error' : isReady ? 'Ready' : 'Initializing'}
                </Typography>
              </Box>
              <Typography variant="caption" color="text.disabled">{activeLanguage === 'python' ? 'Pyodide' : 'Clang'} • WebAssembly</Typography>
            </Box>
          </Box>
        </Box>
      </Box>
    </ToastProvider>
  );
}

