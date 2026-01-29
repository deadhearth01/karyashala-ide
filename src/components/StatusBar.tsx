'use client';

import { ExecutionStatus } from '@/types';

interface StatusBarProps {
  language: 'python' | 'c';
  status: ExecutionStatus;
  executionTime?: number;
  isReady: boolean;
  isLoading: boolean;
}

export function StatusBar({ language, status, executionTime, isReady, isLoading }: StatusBarProps) {
  const languageInfo = {
    python: { name: 'Python 3.11', runtime: 'Pyodide WASM' },
    c: { name: 'C (C99)', runtime: 'WASM Interpreter' },
  };

  const info = languageInfo[language];
  const isRunning = status === 'running';

  const getStatusIndicator = () => {
    if (isLoading) return { color: 'bg-amber-500 animate-pulse', text: 'Loading runtime...' };
    if (isRunning) return { color: 'bg-amber-500 animate-pulse', text: 'Running...' };
    if (status === 'error') return { color: 'bg-red-500', text: 'Error' };
    if (status === 'success') return { color: 'bg-emerald-500', text: 'Success' };
    if (isReady) return { color: 'bg-emerald-500', text: 'Ready' };
    return { color: 'bg-neutral-500', text: 'Initializing...' };
  };

  const statusIndicator = getStatusIndicator();

  return (
    <div className="mt-4 h-8 bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg flex items-center justify-between px-4 text-xs">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${statusIndicator.color}`} />
          <span className="text-neutral-600 dark:text-neutral-400">
            {statusIndicator.text}
          </span>
        </div>
        <div className="h-3 w-px bg-neutral-300 dark:bg-neutral-700" />
        <span className="text-neutral-600 dark:text-neutral-400">{info.name}</span>
        <div className="h-3 w-px bg-neutral-300 dark:bg-neutral-700" />
        <span className="text-neutral-500 dark:text-neutral-500">{info.runtime}</span>
      </div>
      
      <div className="flex items-center gap-4">
        {executionTime !== undefined && status === 'success' && (
          <span className="text-neutral-600 dark:text-neutral-400">
            Executed in {executionTime.toFixed(2)}ms
          </span>
        )}
        <span className="text-neutral-500 dark:text-neutral-500">
          WebAssembly
        </span>
      </div>
    </div>
  );
}
