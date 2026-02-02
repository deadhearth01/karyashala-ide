'use client';

import { useState, useEffect, useCallback } from 'react';
import { Snackbar, Alert, Box } from '@mui/material';

interface Toast {
  id: number;
  message: string;
}

let toastId = 0;
let addToastFn: ((message: string) => void) | null = null;

export function showToast(message: string): void {
  if (addToastFn) {
    addToastFn(message);
  }
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((message: string) => {
    const id = ++toastId;
    setToasts(prev => [...prev, { id, message }]);
    
    // Auto remove after 3 seconds
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  }, []);

  useEffect(() => {
    addToastFn = addToast;
    return () => {
      addToastFn = null;
    };
  }, [addToast]);

  return (
    <>
      {children}
      <Box
        sx={{
          position: 'fixed',
          bottom: 16,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          gap: 1,
          pointerEvents: 'none',
        }}
      >
        {toasts.map(toast => (
          <Alert
            key={toast.id}
            severity="info"
            sx={{
              pointerEvents: 'auto',
              boxShadow: 3,
            }}
          >
            {toast.message}
          </Alert>
        ))}
      </Box>
    </>
  );
}
