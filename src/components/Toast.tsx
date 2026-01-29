'use client';

import { useState, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';

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
    
    // Auto remove after 2 seconds
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 2000);
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
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[9999] flex flex-col gap-2 pointer-events-none">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className={cn(
              'px-4 py-2 rounded-lg shadow-lg',
              'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900',
              'text-sm font-medium',
              'animate-in fade-in slide-in-from-bottom-4 duration-200'
            )}
          >
            {toast.message}
          </div>
        ))}
      </div>
    </>
  );
}
