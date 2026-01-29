'use client';

import { useState, useEffect, useCallback } from 'react';

export interface CacheStatus {
  isReady: boolean;
  isPyodideCached: boolean;
  isCCached: boolean;
  progress: number;
  error: string | null;
}

export function useServiceWorker() {
  const [swReady, setSwReady] = useState(false);
  const [cacheStatus, setCacheStatus] = useState<CacheStatus>({
    isReady: false,
    isPyodideCached: false,
    isCCached: false,
    progress: 0,
    error: null,
  });

  useEffect(() => {
    if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) {
      console.log('[SW] Service workers not supported');
      return;
    }

    const registerSW = async () => {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js');
        console.log('[SW] Service worker registered:', registration.scope);
        setSwReady(true);

        // Listen for messages from service worker
        navigator.serviceWorker.addEventListener('message', (event) => {
          const { type, progress, status } = event.data;

          switch (type) {
            case 'CACHE_PROGRESS':
              setCacheStatus(prev => ({
                ...prev,
                progress,
              }));
              break;
            case 'CACHE_COMPLETE':
              setCacheStatus(prev => ({
                ...prev,
                isReady: true,
                isPyodideCached: true,
                isCCached: true,
                progress: 100,
              }));
              break;
            case 'CACHE_STATUS':
              setCacheStatus(prev => ({
                ...prev,
                isReady: status.isComplete,
                isPyodideCached: status.isPyodideComplete,
                isCCached: status.isCComplete,
                progress: status.isComplete ? 100 : Math.round(((status.pyodideCached + status.cCached) / (status.pyodideTotal + status.cTotal)) * 100),
              }));
              break;
          }
        });

        // Wait for service worker to be ready, then check cache status
        await navigator.serviceWorker.ready;
        
        // Check cache status
        if (navigator.serviceWorker.controller) {
          navigator.serviceWorker.controller.postMessage({ type: 'GET_CACHE_STATUS' });
          
          // Trigger caching of all assets if not already cached
          setTimeout(() => {
            navigator.serviceWorker.controller?.postMessage({ type: 'CACHE_ALL' });
          }, 2000);
        }

      } catch (error) {
        console.error('[SW] Registration failed:', error);
        setCacheStatus(prev => ({
          ...prev,
          error: 'Failed to register service worker',
        }));
      }
    };

    registerSW();
  }, []);

  const preCachePyodide = useCallback(() => {
    if (!swReady) return;
    
    navigator.serviceWorker.controller?.postMessage({ type: 'CACHE_PYODIDE' });
    setCacheStatus(prev => ({
      ...prev,
      progress: 0,
    }));
  }, [swReady]);

  return {
    swReady,
    cacheStatus,
    preCachePyodide,
  };
}
