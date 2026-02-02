'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { Header } from '@/components/Header';
import { LanguageSelector } from '@/components/LanguageSelector';
import { OutputPanel } from '@/components/OutputPanel';
import { StatusBar } from '@/components/StatusBar';
import { NetworkBanner } from '@/components/NetworkBanner';
import { ToastProvider, showToast } from '@/components/Toast';
import { usePythonWorker } from '@/hooks/usePythonWorker';
import { useCWorker } from '@/hooks/useCCompiler';
import { useServiceWorker } from '@/hooks/useServiceWorker';
import { Language, ExecutionResult, ExecutionStatus } from '@/types';
import { Button } from '@/components/ui/button';
import { initializeSecurity, addSecurityStyles, setCopyPasteEnabled, setToastCallback } from '@/lib/security';

// Dynamic import Monaco Editor to avoid SSR issues
const CodeEditor = dynamic(() => import('@/components/CodeEditor'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-neutral-100 dark:bg-neutral-900">
      <div className="flex items-center gap-3">
        <div className="w-5 h-5 border-2 border-neutral-900 dark:border-neutral-100 border-t-transparent rounded-full animate-spin"></div>
        <span className="text-neutral-600 dark:text-neutral-400">Loading Editor...</span>
      </div>
    </div>
  ),
});

const DEFAULT_CODE: Record<Language, string> = {
  python: `# Python Example - Runs in Browser via Pyodide (WebAssembly)
# Note: input() is not supported in browser environment

def fibonacci(n):
    """Calculate the nth Fibonacci number"""
    if n <= 1:
        return n
    return fibonacci(n - 1) + fibonacci(n - 2)

def main():
    print("Python WebAssembly Compiler")
    print("=" * 40)
    
    # Print Fibonacci sequence
    print("\\nFibonacci Sequence (first 10 numbers):")
    for i in range(10):
        print(f"  F({i}) = {fibonacci(i)}")
    
    print("\\nExecution completed successfully!")

if __name__ == "__main__":
    main()
`,
  c: `// C Example - Runs in Browser WebAssembly Runtime
// Note: scanf/stdin is not supported in browser environment

#include <stdio.h>

// Calculate factorial recursively
long factorial(int n) {
    if (n <= 1) return 1;
    return n * factorial(n - 1);
}

// Check if a number is prime
int is_prime(int n) {
    if (n < 2) return 0;
    for (int i = 2; i * i <= n; i++) {
        if (n % i == 0) return 0;
    }
    return 1;
}

int main() {
    printf("C WebAssembly Compiler\\n");
    printf("========================================\\n\\n");
    
    // Print factorials
    printf("Factorials:\\n");
    for (int i = 0; i <= 10; i++) {
        printf("  %2d! = %ld\\n", i, factorial(i));
    }
    
    // Print prime numbers
    printf("\\nPrime numbers up to 30:\\n  ");
    for (int i = 2; i <= 30; i++) {
        if (is_prime(i)) {
            printf("%d ", i);
        }
    }
    printf("\\n\\nExecution completed successfully!\\n");
    
    return 0;
}
`,
};

export default function Home() {
  const [language, setLanguage] = useState<Language>('python');
  const [code, setCode] = useState<string>(DEFAULT_CODE.python);
  const [output, setOutput] = useState<ExecutionResult | null>(null);
  const [status, setStatus] = useState<ExecutionStatus>('idle');
  const [copyPasteAllowed, setCopyPasteAllowed] = useState(false);
  const editorRef = useRef<any>(null);

  const { 
    runPython, 
    isReady: isPythonReady, 
    isLoading: isPythonLoading,
    loadStatus: pythonLoadStatus,
    error: pythonError 
  } = usePythonWorker();
  
  const { 
    runC, 
    isReady: isCReady, 
    isLoading: isCLoading,
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

  // Update code when language changes
  useEffect(() => {
    setCode(DEFAULT_CODE[language]);
    setOutput(null);
  }, [language]);

  const handleRun = useCallback(async () => {
    // Check if runtime has an error
    const currentError = language === 'python' ? pythonError : cError;
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

      if (language === 'python') {
        result = await runPython(code);
      } else {
        result = await runC(code);
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
  }, [language, code, runPython, runC, pythonError, cError]);

  const handleClear = useCallback(() => {
    setOutput(null);
    setStatus('idle');
  }, []);

  // Derived state
  const isReady = language === 'python' ? isPythonReady : isCReady;
  const isLoading = language === 'python' ? isPythonLoading : isCLoading;
  const loadStatus = language === 'python' ? pythonLoadStatus : cLoadStatus;
  const currentError = language === 'python' ? pythonError : cError;

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

  return (
    <ToastProvider>
      <div className="min-h-screen h-screen flex flex-col bg-neutral-50 dark:bg-neutral-950 transition-colors duration-200 no-select overflow-hidden">
        {/* Network Status Banner */}
        <NetworkBanner />
        
        <Header />
        
        <main className="flex-1 flex flex-col px-4 py-3 overflow-hidden">
          {/* Controls Bar */}
          <div className="flex items-center justify-between mb-3 flex-shrink-0">
            <div className="flex items-center gap-3">
              <LanguageSelector 
                language={language} 
                onChange={setLanguage}
                disabled={status === 'running'}
              />
              
              {/* Copy/Paste Toggle */}
              <button
                onClick={handleCopyPasteToggle}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm font-medium transition-colors ${
                  copyPasteAllowed
                    ? 'bg-emerald-100 dark:bg-emerald-900/30 border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-400'
                    : 'bg-neutral-100 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400'
                }`}
              >
                {copyPasteAllowed ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                  </svg>
                )}
                {copyPasteAllowed ? 'Copy/Paste On' : 'Copy/Paste Off'}
              </button>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClear}
                disabled={status === 'running'}
                className="text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100"
              >
                Clear
              </Button>
              
              <Button
                onClick={handleRun}
                disabled={!isReady || status === 'running' || !!currentError}
                className="gap-2 bg-neutral-900 hover:bg-neutral-800 dark:bg-neutral-100 dark:hover:bg-neutral-200 dark:text-neutral-900"
              >
                {status === 'running' ? (
                  <>
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                    Running...
                  </>
                ) : isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                    {loadStatus || 'Loading...'}
                  </>
                ) : currentError ? (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    Error
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                    </svg>
                    Run
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Main Layout - Horizontal Split */}
          <div className="flex-1 flex gap-3 min-h-0">
            {/* Code Editor - Left Side */}
            <div className="flex-1 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 overflow-hidden flex flex-col min-w-0">
              <div className="flex items-center justify-between px-3 py-2 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 flex-shrink-0">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-400 dark:bg-red-500"></div>
                    <div className="w-2.5 h-2.5 rounded-full bg-yellow-400 dark:bg-yellow-500"></div>
                    <div className="w-2.5 h-2.5 rounded-full bg-green-400 dark:bg-green-500"></div>
                  </div>
                  <span className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
                    {language === 'python' ? 'main.py' : 'main.c'}
                  </span>
                </div>
                <span className="text-xs px-2 py-0.5 rounded bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-mono">
                  {language.toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-h-0">
                <CodeEditor
                  language={language}
                  value={code}
                  onChange={(value) => setCode(value || '')}
                  onMount={handleEditorMount}
                />
              </div>
            </div>

            {/* Output Panel - Right Side */}
            <div className="flex-1 flex flex-col gap-3 min-w-0">
              {/* Console Output */}
              <div className="flex-1 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 overflow-hidden flex flex-col min-h-0">
                <div className="flex items-center justify-between px-3 py-2 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 flex-shrink-0">
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
                      Console Output
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {status === 'running' && (
                      <div className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400">
                        <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></div>
                        Running...
                      </div>
                    )}
                    {output?.executionTime && status !== 'running' && (
                      <span className="text-xs text-neutral-500">
                        {output.executionTime.toFixed(2)}ms
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex-1 overflow-auto min-h-0">
                  <OutputPanel result={output} status={status} />
                </div>
              </div>

              {/* Status Bar */}
              <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-xs flex-shrink-0">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full transition-colors ${
                      currentError ? 'bg-red-500' :
                      isLoading ? 'bg-amber-500 animate-pulse' :
                      status === 'running' ? 'bg-amber-500 animate-pulse' :
                      status === 'error' ? 'bg-red-500' :
                      isReady ? 'bg-emerald-500' : 'bg-neutral-400'
                    }`} />
                    <span className="text-neutral-600 dark:text-neutral-400 font-medium">
                      {currentError ? 'Error' :
                       isLoading ? (loadStatus || 'Loading...') :
                       status === 'running' ? 'Executing...' :
                       status === 'success' ? 'Completed' :
                       status === 'error' ? 'Error' :
                       isReady ? 'Ready' : 'Initializing...'}
                    </span>
                  </div>
                  {isLoading && (
                    <div className="h-3 w-px bg-neutral-300 dark:bg-neutral-700" />
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-neutral-500">
                    {language === 'python' ? 'Pyodide WASM' : 'Clang WASM'}
                  </span>
                  <div className="h-3 w-px bg-neutral-300 dark:bg-neutral-700" />
                  <span className="text-neutral-500">
                    WebAssembly
                  </span>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </ToastProvider>
  );
}
