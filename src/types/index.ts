export type Language = 'python' | 'c';

export type ExecutionStatus = 'idle' | 'running' | 'success' | 'error';

export interface ExecutionResult {
  stdout: string;
  stderr: string;
  executionTime: number;
  status: ExecutionStatus;
  exitCode?: number;
}

export interface WorkerMessage {
  type: 'run' | 'init' | 'ready' | 'result' | 'error' | 'stdout' | 'stderr' | 'status';
  code?: string;
  data?: string;
  result?: ExecutionResult;
  error?: string;
}

export interface EditorTheme {
  name: string;
  isDark: boolean;
}

// File System Types
export interface VirtualFile {
  id: string;
  name: string;
  content: string;
  language: Language;
  createdAt: number;
  updatedAt: number;
}

export interface FileSystemState {
  files: VirtualFile[];
  activeFileId: string | null;
}

// Settings Types
export type ThemeMode = 'light' | 'dark' | 'system';
export type EditorFontSize = number; // 10-24 supported

export interface AppSettings {
  theme: ThemeMode;
  fontSize: EditorFontSize;
  autoSave: boolean;
  showLineNumbers: boolean;
  wordWrap: boolean;
  tabSize: number;
}

// Python Module Status
export interface PythonModuleInfo {
  name: string;
  version: string;
  isInstalled: boolean;
}

// Sidebar Navigation
export type SidebarTab = 'files' | 'search' | 'settings';
