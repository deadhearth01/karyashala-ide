'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { ExecutionResult } from '@/types';

// Pyodide CDN URL - Official Pyodide WebAssembly distribution
const PYODIDE_CDN = 'https://cdn.jsdelivr.net/pyodide/v0.24.1/full/';

export function usePythonWorker() {
  const [isReady, setIsReady] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadProgress, setLoadProgress] = useState(0);
  const [loadStatus, setLoadStatus] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const workerRef = useRef<Worker | null>(null);
  const resolveRef = useRef<((result: ExecutionResult) => void) | null>(null);

  useEffect(() => {
    const initWorker = async () => {
      setIsLoading(true);
      setLoadProgress(5);
      setLoadStatus('Initializing Python runtime...');
      setError(null);

      try {
        // Create Web Worker with Pyodide WASM execution
        const workerCode = `
          // Pyodide Web Worker for Python WebAssembly Execution
          let pyodide = null;
          let isReady = false;
          let virtualFiles = {}; // Store virtual files for import

          // Import Pyodide from CDN (will be served from cache if available)
          async function initPyodide() {
            try {
              self.postMessage({ type: 'status', data: 'Loading Pyodide WebAssembly...' });
              self.postMessage({ type: 'progress', data: 10 });
              
              // Load Pyodide script - Service Worker will serve from cache if offline
              importScripts('${PYODIDE_CDN}pyodide.js');
              
              self.postMessage({ type: 'progress', data: 30 });
              self.postMessage({ type: 'status', data: 'Initializing Python runtime...' });
              
              // Initialize Pyodide with WASM - minimal packages for faster loading
              pyodide = await loadPyodide({
                indexURL: '${PYODIDE_CDN}',
                stdout: (text) => {
                  self.postMessage({ type: 'stdout', data: text });
                },
                stderr: (text) => {
                  self.postMessage({ type: 'stderr', data: text });
                }
              });
              
              self.postMessage({ type: 'progress', data: 80 });
              self.postMessage({ type: 'status', data: 'Setting up Python environment...' });
              
              // Set up input() override since browser doesn't support stdin
              pyodide.runPython(\`
def input(prompt=''):
    raise RuntimeError("input() is not supported in browser environment. Use hardcoded values instead.")
              \`);
              
              self.postMessage({ type: 'progress', data: 100 });
              self.postMessage({ type: 'status', data: 'Python ready!' });
              
              isReady = true;
              self.postMessage({ type: 'ready' });
              
            } catch (error) {
              const errorMessage = error.message || String(error);
              
              // Provide helpful error messages
              let userMessage = 'Failed to load Python runtime';
              if (errorMessage.includes('Failed to fetch') || errorMessage.includes('NetworkError')) {
                userMessage = 'Network error: Unable to download Python runtime. Please check your internet connection.';
              } else if (errorMessage.includes('importScripts')) {
                userMessage = 'Failed to load Pyodide script. Try refreshing the page.';
              } else {
                userMessage = 'Failed to initialize Python: ' + errorMessage;
              }
              
              self.postMessage({ 
                type: 'error', 
                error: userMessage
              });
            }
          }

          // Write virtual files to Pyodide's file system for import support
          function setupVirtualFiles(files) {
            if (!pyodide || !files) return;
            
            try {
              // Write each file to Pyodide's virtual file system
              for (const [filename, content] of Object.entries(files)) {
                if (filename.endsWith('.py')) {
                  pyodide.FS.writeFile('/' + filename, content);
                }
              }
              
              // Add current directory to Python path if not already
              pyodide.runPython(\`
import sys
if '' not in sys.path:
    sys.path.insert(0, '')
if '/' not in sys.path:
    sys.path.insert(0, '/')
              \`);
            } catch (e) {
              console.error('Error setting up virtual files:', e);
            }
          }

          async function runPython(code, files) {
            if (!isReady || !pyodide) {
              return {
                stdout: '',
                stderr: 'Python runtime is not ready. Please wait for initialization to complete.',
                status: 'error'
              };
            }

            let stdout = '';
            let stderr = '';

            try {
              // Set up virtual files for import support
              if (files) {
                setupVirtualFiles(files);
              }

              // Set up output capture
              pyodide.runPython(
                "import sys\\n" +
                "from io import StringIO\\n" +
                "_stdout_buffer = StringIO()\\n" +
                "_stderr_buffer = StringIO()\\n" +
                "_original_stdout = sys.stdout\\n" +
                "_original_stderr = sys.stderr\\n" +
                "sys.stdout = _stdout_buffer\\n" +
                "sys.stderr = _stderr_buffer"
              );

              // Execute user code
              await pyodide.runPythonAsync(code);

              // Capture the output
              stdout = pyodide.runPython('_stdout_buffer.getvalue()');
              stderr = pyodide.runPython('_stderr_buffer.getvalue()');

              // Restore original streams
              pyodide.runPython(
                "sys.stdout = _original_stdout\\n" +
                "sys.stderr = _original_stderr"
              );

              return {
                stdout: stdout || '',
                stderr: stderr || '',
                status: stderr && !stdout ? 'error' : 'success'
              };

            } catch (error) {
              // Ensure streams are restored
              try {
                pyodide.runPython("sys.stdout = _original_stdout if '_original_stdout' in dir() else sys.__stdout__");
                pyodide.runPython("sys.stderr = _original_stderr if '_original_stderr' in dir() else sys.__stderr__");
              } catch (e) {}

              let errorMessage = error.message || String(error);
              
              // Clean up error message
              if (errorMessage.includes('PythonError:')) {
                errorMessage = errorMessage.split('PythonError:')[1].trim();
              }
              
              // Simplify common error messages
              if (errorMessage.includes('input() is not supported')) {
                errorMessage = 'Error: input() is not supported in browser environment.\\nPlease use hardcoded values for testing.';
              }

              return {
                stdout: stdout || '',
                stderr: errorMessage,
                status: 'error'
              };
            }
          }

          self.onmessage = async function(e) {
            const { type, code, files } = e.data;
            
            if (type === 'init') {
              await initPyodide();
            } else if (type === 'run') {
              const startTime = performance.now();
              const result = await runPython(code, files);
              const executionTime = performance.now() - startTime;
              
              self.postMessage({ 
                type: 'result', 
                result: { ...result, executionTime }
              });
            }
          };
        `;

        const blob = new Blob([workerCode], { type: 'application/javascript' });
        const workerUrl = URL.createObjectURL(blob);
        const worker = new Worker(workerUrl);

        worker.onmessage = (e) => {
          const { type, result, error: workerError, data } = e.data;
          
          switch (type) {
            case 'ready':
              setIsReady(true);
              setIsLoading(false);
              setLoadProgress(100);
              setLoadStatus('Ready');
              break;
            case 'progress':
              setLoadProgress(data);
              break;
            case 'status':
              setLoadStatus(data);
              break;
            case 'result':
              if (resolveRef.current) {
                resolveRef.current(result);
                resolveRef.current = null;
              }
              break;
            case 'error':
              setIsLoading(false);
              setError(workerError);
              console.error('Pyodide error:', workerError);
              if (resolveRef.current) {
                resolveRef.current({
                  stdout: '',
                  stderr: workerError,
                  executionTime: 0,
                  status: 'error',
                });
                resolveRef.current = null;
              }
              break;
          }
        };

        worker.onerror = (workerError) => {
          console.error('Python worker error:', workerError);
          setIsLoading(false);
          setError('Failed to create Python worker. Please refresh the page.');
        };

        workerRef.current = worker;
        worker.postMessage({ type: 'init' });

        URL.revokeObjectURL(workerUrl);
      } catch (err) {
        console.error('Failed to create Python worker:', err);
        setIsLoading(false);
        setError('Failed to initialize Python environment');
      }
    };

    initWorker();

    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
      }
    };
  }, []);

  const runPython = useCallback((code: string, files?: Record<string, string>): Promise<ExecutionResult> => {
    return new Promise((resolve) => {
      if (!workerRef.current) {
        resolve({
          stdout: '',
          stderr: error || 'Python worker not initialized. Please refresh the page.',
          executionTime: 0,
          status: 'error',
        });
        return;
      }
      
      if (!isReady) {
        resolve({
          stdout: '',
          stderr: 'Python runtime is still loading. Please wait...',
          executionTime: 0,
          status: 'error',
        });
        return;
      }

      resolveRef.current = resolve;
      workerRef.current.postMessage({ type: 'run', code, files });
    });
  }, [isReady, error]);

  const retry = useCallback(() => {
    if (workerRef.current) {
      workerRef.current.terminate();
    }
    setIsReady(false);
    setIsLoading(false);
    setLoadProgress(0);
    setError(null);
    // Re-mount will trigger useEffect
    window.location.reload();
  }, []);

  return { 
    runPython, 
    isReady, 
    isLoading, 
    loadProgress, 
    loadStatus,
    error,
    retry,
  };
}
