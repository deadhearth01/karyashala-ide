'use client';

import { useState, useEffect, useCallback } from 'react';

export interface NetworkStatus {
  isOnline: boolean;
  wasOffline: boolean;
  connectionType: string | null;
}

export function useNetworkStatus() {
  const [status, setStatus] = useState<NetworkStatus>({
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    wasOffline: false,
    connectionType: null,
  });

  const updateConnectionInfo = useCallback(() => {
    if (typeof navigator !== 'undefined' && 'connection' in navigator) {
      const connection = (navigator as any).connection;
      setStatus(prev => ({
        ...prev,
        connectionType: connection?.effectiveType || null,
      }));
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleOnline = () => {
      setStatus(prev => ({
        isOnline: true,
        wasOffline: prev.wasOffline || !prev.isOnline,
        connectionType: prev.connectionType,
      }));
      updateConnectionInfo();
    };

    const handleOffline = () => {
      setStatus(prev => ({
        ...prev,
        isOnline: false,
      }));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Listen for connection changes
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      connection?.addEventListener('change', updateConnectionInfo);
    }

    // Initial connection info
    updateConnectionInfo();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if ('connection' in navigator) {
        const connection = (navigator as any).connection;
        connection?.removeEventListener('change', updateConnectionInfo);
      }
    };
  }, [updateConnectionInfo]);

  return status;
}
