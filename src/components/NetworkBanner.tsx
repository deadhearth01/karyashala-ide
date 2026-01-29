'use client';

import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';

interface NetworkBannerProps {
  className?: string;
}

export function NetworkBanner({ className }: NetworkBannerProps) {
  const { isOnline } = useNetworkStatus();
  const [showBanner, setShowBanner] = useState(false);
  const [wasOffline, setWasOffline] = useState(false);
  const [showOnlineMessage, setShowOnlineMessage] = useState(false);

  useEffect(() => {
    if (!isOnline) {
      setShowBanner(true);
      setWasOffline(true);
    } else if (wasOffline && isOnline) {
      // Just came back online
      setShowOnlineMessage(true);
      setShowBanner(true);
      
      // Hide the "back online" message after 3 seconds
      const timer = setTimeout(() => {
        setShowBanner(false);
        setShowOnlineMessage(false);
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [isOnline, wasOffline]);

  if (!showBanner) return null;

  return (
    <div
      className={cn(
        'px-3 py-2 text-sm font-medium text-center transition-all duration-300',
        isOnline
          ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-b border-emerald-200 dark:border-emerald-800/50'
          : 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-b border-amber-200 dark:border-amber-800/50',
        className
      )}
    >
      {isOnline ? (
        <div className="flex items-center justify-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span>You&apos;re back online!</span>
        </div>
      ) : (
        <div className="flex items-center justify-center gap-2">
          <svg className="w-4 h-4 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636a9 9 0 010 12.728m-3.536-3.536a4 4 0 010-5.656m-7.072 7.072a4 4 0 010-5.656m-3.536 9.192a9 9 0 010-12.728" />
          </svg>
          <span>You&apos;re offline — but don&apos;t worry, your code still runs!</span>
        </div>
      )}
    </div>
  );
}
