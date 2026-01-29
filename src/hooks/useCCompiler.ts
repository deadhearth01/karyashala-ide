'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { ExecutionResult } from '@/types';

/**
 * C Compiler Hook using browsercc (Clang + LLD)
 * Uses a module worker that imports from the browsercc folder
 */
export function useCWorker() {
  const [isReady, setIsReady] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadProgress, setLoadProgress] = useState(0);
  const [loadStatus, setLoadStatus] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  
  const workerRef = useRef<Worker | null>(null);
  const resolveRef = useRef<((result: ExecutionResult) => void) | null>(null);

  useEffect(() => {
    let mounted = true;

    const initWorker = async () => {
      if (isLoading || isReady) return;
      
      setIsLoading(true);
      setLoadProgress(5);
      setLoadStatus('Initializing C compiler...');
      setError(null);

      try {
        // Create a module worker from the public folder
        const worker = new Worker('/c-worker.js', { type: 'module' });
        
        worker.onmessage = (e) => {
          const { type, result, error: workerError, data } = e.data;
          
          if (!mounted) return;
          
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
              console.error('C compiler error:', workerError);
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

        worker.onerror = (e) => {
          console.error('C worker error:', e);
          if (mounted) {
            setIsLoading(false);
            setError('Failed to create C compiler worker. Please refresh the page.');
          }
        };

        workerRef.current = worker;
        worker.postMessage({ type: 'init' });

      } catch (err) {
        console.error('Failed to create C worker:', err);
        if (mounted) {
          setIsLoading(false);
          setError('Failed to initialize C compiler');
        }
      }
    };

    initWorker();

    return () => {
      mounted = false;
      if (workerRef.current) {
        workerRef.current.terminate();
      }
    };
  }, []);

  const runC = useCallback((code: string): Promise<ExecutionResult> => {
    return new Promise((resolve) => {
      if (!workerRef.current) {
        resolve({
          stdout: '',
          stderr: error || 'C compiler not initialized. Please refresh the page.',
          executionTime: 0,
          status: 'error',
        });
        return;
      }
      
      if (!isReady) {
        resolve({
          stdout: '',
          stderr: 'C compiler is still loading. Please wait...',
          executionTime: 0,
          status: 'error',
        });
        return;
      }

      resolveRef.current = resolve;
      workerRef.current.postMessage({ type: 'run', code });
    });
  }, [isReady, error]);

  const retry = useCallback(() => {
    window.location.reload();
  }, []);

  return {
    runC,
    isReady,
    isLoading,
    loadProgress,
    loadStatus,
    error,
    retry,
  };
}
