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
      <div className="h-full flex flex-col items-center justify-center p-6 text-center">
        <div className="w-12 h-12 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center mb-3">
          <svg className="w-6 h-6 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-1">
          Output will appear here
        </p>
        <p className="text-xs text-neutral-400 dark:text-neutral-500">
          Press <kbd className="px-1.5 py-0.5 rounded bg-neutral-200 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300 font-mono text-[10px]">Ctrl+Enter</kbd> or click Run
        </p>
      </div>
    );
  }

  // Render running state
  if (status === 'running' && !hasOutput) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6">
        <div className="w-8 h-8 border-2 border-neutral-300 dark:border-neutral-600 border-t-neutral-800 dark:border-t-neutral-200 rounded-full animate-spin mb-3"></div>
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          Executing code...
        </p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Error Banner */}
      {hasError && result?.stderr && (
        <div className="px-3 py-2 bg-red-50 dark:bg-red-900/20 border-b border-red-200 dark:border-red-800/50">
          <div className="flex items-center gap-2 text-sm text-red-700 dark:text-red-400">
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
        className="flex-1 p-4 overflow-auto font-mono text-sm whitespace-pre-wrap leading-relaxed"
      >
        {result?.stdout && (
          <span className="text-neutral-800 dark:text-neutral-200">{result.stdout}</span>
        )}
        {result?.stderr && (
          <span className={`${result.stdout ? 'block mt-2 pt-2 border-t border-neutral-200 dark:border-neutral-800' : ''} text-red-600 dark:text-red-400`}>
            {result.stderr}
          </span>
        )}
      </pre>
    </div>
  );
}
