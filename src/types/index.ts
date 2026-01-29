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
