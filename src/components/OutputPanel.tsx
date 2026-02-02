'use client';

import { useRef, useEffect } from 'react';
import { ExecutionResult, ExecutionStatus } from '@/types';

interface OutputPanelProps {
  result: ExecutionResult | null;
  status: ExecutionStatus;
}

export function OutputPanel({ result, status }: OutputPanelProps) {
  const outputRef = useRef<HTMLPreElement>(null);

  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [result]);

  const hasError = result?.status === 'error' || status === 'error';
  const hasOutput = result?.stdout || result?.stderr;

  // Render empty state
  if (!hasOutput && status !== 'running') {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6 text-center bg-neutral-50/50 dark:bg-neutral-900/50">
        <div className="w-14 h-14 rounded-2xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center mb-4 shadow-sm">
          <svg className="w-7 h-7 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-1.5">
          Output will appear here
        </p>
        <p className="text-xs text-neutral-400 dark:text-neutral-500 flex items-center gap-1.5">
          Press 
          <kbd className="inline-flex items-center px-1.5 py-0.5 rounded bg-neutral-200 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300 font-mono text-[10px] font-medium shadow-sm">
            ⌘ Enter
          </kbd> 
          or click 
          <span className="inline-flex items-center px-2 py-0.5 rounded bg-emerald-500 text-white text-[10px] font-medium">
            Run
          </span>
        </p>
      </div>
    );
  }

  // Render running state
  if (status === 'running' && !hasOutput) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6 bg-neutral-50/50 dark:bg-neutral-900/50">
        <div className="relative mb-4">
          <div className="w-10 h-10 border-3 border-neutral-200 dark:border-neutral-700 rounded-full"></div>
          <div className="absolute inset-0 w-10 h-10 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
        <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
          Executing code...
        </p>
        <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-1">
          Please wait while your code runs
        </p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-neutral-50/30 dark:bg-neutral-900/30">
      {/* Success indicator */}
      {!hasError && result?.stdout && (
        <div className="px-3 py-2 bg-emerald-50 dark:bg-emerald-900/20 border-b border-emerald-100 dark:border-emerald-800/30">
          <div className="flex items-center gap-2 text-xs text-emerald-700 dark:text-emerald-400">
            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="font-medium">Execution completed successfully!</span>
          </div>
        </div>
      )}

      {/* Error Banner */}
      {hasError && result?.stderr && (
        <div className="px-3 py-2 bg-red-50 dark:bg-red-900/20 border-b border-red-100 dark:border-red-800/30">
          <div className="flex items-center gap-2 text-xs text-red-700 dark:text-red-400">
            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="font-medium">Error occurred during execution</span>
          </div>
        </div>
      )}

      {/* Output Content */}
      <pre
        ref={outputRef}
        className="flex-1 p-4 overflow-auto font-mono text-[13px] whitespace-pre-wrap leading-relaxed panel-scrollbar"
      >
        {result?.stdout && (
          <span className="text-neutral-800 dark:text-neutral-200">{result.stdout}</span>
        )}
        {result?.stderr && (
          <span className={`${result.stdout ? 'block mt-3 pt-3 border-t border-neutral-200 dark:border-neutral-800' : ''} text-red-600 dark:text-red-400`}>
            {result.stderr}
          </span>
        )}
      </pre>
    </div>
  );
}
