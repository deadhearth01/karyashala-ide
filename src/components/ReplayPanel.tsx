'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { KeystrokeRecorder, KeystrokePlayer, type KeystrokeEvent } from '@/lib/keystroke-recorder';
import { cn } from '@/lib/utils';

interface ReplayPanelProps {
  editorRef: React.MutableRefObject<any>;
  onReplayingChange?: (isReplaying: boolean) => void;
  className?: string;
  initialCode?: string;
}

export function ReplayPanel({
  editorRef,
  onReplayingChange,
  className,
  initialCode = '',
}: ReplayPanelProps) {
  const recorderRef = useRef<KeystrokeRecorder>(new KeystrokeRecorder());
  const [player, setPlayer] = useState<KeystrokePlayer | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isReplaying, setIsReplaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [savedEvents, setSavedEvents] = useState<KeystrokeEvent[]>([]);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [progress, setProgress] = useState(0);
  const [codingDuration, setCodingDuration] = useState(0);
  const [keystrokeCount, setKeystrokeCount] = useState(0);
  const [savedInitialCode, setSavedInitialCode] = useState('');
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Update saved initial code when prop changes
  useEffect(() => {
    setSavedInitialCode(initialCode);
  }, [initialCode]);

  // Start recording
  const handleStartRecording = useCallback(() => {
    if (!editorRef.current || isRecording) return;

    recorderRef.current = new KeystrokeRecorder();
    recorderRef.current.start(editorRef.current);
    setIsRecording(true);
    setSavedEvents([]);
    setKeystrokeCount(0);
    setCodingDuration(0);
    setSavedInitialCode(editorRef.current.getValue() || '');

    // Start tracking stats
    durationIntervalRef.current = setInterval(() => {
      const events = recorderRef.current.getEvents();
      setKeystrokeCount(events.length);
      if (events.length > 0) {
        setCodingDuration(events[events.length - 1].timestamp);
      }
    }, 200);

    console.log('[Replay] Recording started');
  }, [editorRef, isRecording]);

  // Stop recording
  const handleStopRecording = useCallback(() => {
    if (!isRecording) return;

    const events = recorderRef.current.stop();
    setIsRecording(false);
    setSavedEvents(events);

    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
      durationIntervalRef.current = null;
    }

    console.log('[Replay] Recording stopped, events:', events.length);
  }, [isRecording]);

  // Start replay
  const handleStartReplay = useCallback(() => {
    // Stop recording if active
    if (isRecording) {
      handleStopRecording();
    }

    if (!editorRef.current || savedEvents.length === 0) {
      console.log('[Replay] No events to replay');
      return;
    }

    const editor = editorRef.current;
    
    // Reset editor to initial state
    editor.setValue(savedInitialCode);
    console.log('[Replay] Starting replay with', savedEvents.length, 'events');

    const newPlayer = new KeystrokePlayer(savedEvents, {
      speed: playbackSpeed,
      onProgress: (current, total) => {
        setProgress((current / total) * 100);
      },
      onComplete: () => {
        console.log('[Replay] Replay completed');
        setIsReplaying(false);
        setProgress(100);
        onReplayingChange?.(false);
      },
    });

    newPlayer.play(editor);
    setPlayer(newPlayer);
    setIsReplaying(true);
    setIsPaused(false);
    onReplayingChange?.(true);
  }, [editorRef, savedEvents, playbackSpeed, onReplayingChange, savedInitialCode, isRecording, handleStopRecording]);

  const pauseReplay = useCallback(() => {
    if (!player) return;
    player.pause();
    setIsPaused(true);
    console.log('[Replay] Paused');
  }, [player]);

  const resumeReplay = useCallback(() => {
    if (!player || !editorRef.current) return;
    player.resume(editorRef.current);
    setIsPaused(false);
    console.log('[Replay] Resumed');
  }, [player, editorRef]);

  const stopReplay = useCallback(() => {
    if (!player) return;
    player.stop();
    setPlayer(null);
    setIsReplaying(false);
    setIsPaused(false);
    setProgress(0);
    onReplayingChange?.(false);
    console.log('[Replay] Stopped');
  }, [player, onReplayingChange]);

  const handleSpeedChange = useCallback((speed: number) => {
    setPlaybackSpeed(speed);
    if (player) {
      player.setSpeed(speed);
    }
  }, [player]);

  const formatDuration = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const speedOptions = [0.5, 1, 2, 4];
  const hasRecording = savedEvents.length > 0;

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }
    };
  }, []);

  return (
    <div className={cn(
      'rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 overflow-hidden',
      className
    )}>
      {/* Header */}
      <div className="px-3 py-2 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
              Session Recorder
            </span>
          </div>
          <div className="flex items-center gap-1">
            {isRecording && (
              <span className="flex items-center gap-1 text-xs text-red-500 font-medium">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                REC
              </span>
            )}
            {isReplaying && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 font-medium">
                Playing
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="px-3 py-2 grid grid-cols-2 gap-2 border-b border-neutral-200 dark:border-neutral-800 text-center">
        <div>
          <p className="text-[10px] uppercase tracking-wide text-neutral-500 dark:text-neutral-400">Time</p>
          <p className="text-base font-mono font-semibold text-neutral-900 dark:text-neutral-100">
            {formatDuration(codingDuration)}
          </p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wide text-neutral-500 dark:text-neutral-400">Keys</p>
          <p className="text-base font-mono font-semibold text-neutral-900 dark:text-neutral-100">
            {isRecording ? keystrokeCount : savedEvents.length}
          </p>
        </div>
      </div>

      {/* Controls */}
      <div className="px-3 py-2 space-y-2">
        {!isReplaying ? (
          <>
            {/* Recording Controls */}
            <div className="flex gap-2">
              {!isRecording ? (
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleStartRecording}
                  className="flex-1 gap-1 bg-red-600 hover:bg-red-700 text-white text-xs"
                >
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <circle cx="10" cy="10" r="6" />
                  </svg>
                  Start Recording
                </Button>
              ) : (
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleStopRecording}
                  className="flex-1 gap-1 bg-neutral-900 hover:bg-neutral-800 dark:bg-neutral-100 dark:hover:bg-neutral-200 dark:text-neutral-900 text-xs"
                >
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <rect x="6" y="6" width="8" height="8" rx="1" />
                  </svg>
                  Stop Recording
                </Button>
              )}
            </div>

            {/* Replay Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleStartReplay}
              disabled={!hasRecording}
              className="w-full gap-1 text-xs border-neutral-300 dark:border-neutral-700"
            >
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
              </svg>
              Play Recording ({savedEvents.length} events)
            </Button>
          </>
        ) : (
          <div className="space-y-2">
            {/* Progress Bar */}
            <div className="space-y-1">
              <div className="flex justify-between text-[10px] text-neutral-500 dark:text-neutral-400">
                <span>Progress</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <div className="w-full h-1 bg-neutral-200 dark:bg-neutral-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-neutral-900 dark:bg-neutral-100 transition-all duration-100"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            {/* Playback Controls */}
            <div className="flex gap-1">
              {!isPaused ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={pauseReplay}
                  className="flex-1 gap-1 text-xs border-neutral-300 dark:border-neutral-700"
                >
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  Pause
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={resumeReplay}
                  className="flex-1 gap-1 text-xs border-neutral-300 dark:border-neutral-700"
                >
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                  </svg>
                  Resume
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={stopReplay}
                className="flex-1 gap-1 text-xs border-neutral-300 dark:border-neutral-700"
              >
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <rect x="6" y="6" width="8" height="8" rx="1" />
                </svg>
                Stop
              </Button>
            </div>

            {/* Speed Control */}
            <div className="flex items-center gap-1">
              <span className="text-[10px] text-neutral-500 dark:text-neutral-400 mr-1">Speed:</span>
              {speedOptions.map((speed) => (
                <button
                  key={speed}
                  onClick={() => handleSpeedChange(speed)}
                  className={cn(
                    'px-2 py-0.5 text-[10px] rounded transition-colors',
                    playbackSpeed === speed
                      ? 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900'
                      : 'bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300'
                  )}
                >
                  {speed}x
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
