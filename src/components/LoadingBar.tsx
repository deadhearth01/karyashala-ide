'use client';

import { cn } from '@/lib/utils';

interface LoadingBarProps {
  isLoading: boolean;
  progress: number;
  status: string;
  className?: string;
}

export function LoadingBar({ isLoading, progress, status, className }: LoadingBarProps) {
  if (!isLoading) return null;

  return (
    <div className={cn("w-full", className)}>
      {/* Progress bar container */}
      <div className="h-1 bg-neutral-200 dark:bg-neutral-800 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-blue-500 via-blue-600 to-blue-500 transition-all duration-300 ease-out relative"
          style={{ width: `${progress}%` }}
        >
          {/* Animated shimmer effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
        </div>
      </div>
      
      {/* Status text - shown in a subtle way */}
      <div className="flex items-center justify-center py-1 bg-neutral-50 dark:bg-neutral-900/50">
        <div className="flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400">
          <div className="w-3 h-3 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <span>{status}</span>
          <span className="text-neutral-400 dark:text-neutral-500">({Math.round(progress)}%)</span>
        </div>
      </div>
    </div>
  );
}

// Compact loading indicator for the header
interface HeaderLoadingIndicatorProps {
  pythonLoading: boolean;
  pythonProgress: number;
  pythonStatus: string;
  cLoading: boolean;
  cProgress: number;
  cStatus: string;
}

export function HeaderLoadingIndicator({
  pythonLoading,
  pythonProgress,
  pythonStatus,
  cLoading,
  cProgress,
  cStatus,
}: HeaderLoadingIndicatorProps) {
  const isLoading = pythonLoading || cLoading;
  
  if (!isLoading) return null;

  const currentProgress = pythonLoading ? pythonProgress : cProgress;
  const currentStatus = pythonLoading ? pythonStatus : cStatus;

  return (
    <div className="absolute top-0 left-0 right-0 z-50">
      {/* Thin progress bar at the very top */}
      <div className="h-0.5 bg-neutral-200 dark:bg-neutral-800">
        <div
          className="h-full bg-gradient-to-r from-blue-400 via-blue-600 to-purple-500 transition-all duration-500 ease-out relative overflow-hidden"
          style={{ width: `${currentProgress}%` }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
        </div>
      </div>
      
      {/* Compact status indicator */}
      <div className="absolute top-1 right-4 flex items-center gap-2 px-2.5 py-1 rounded-full bg-white/90 dark:bg-neutral-900/90 border border-neutral-200 dark:border-neutral-700 shadow-sm backdrop-blur-sm">
        <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
        <span className="text-[10px] font-medium text-neutral-600 dark:text-neutral-400">
          {currentStatus}
        </span>
      </div>
    </div>
  );
}
