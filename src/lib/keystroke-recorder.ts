// Keystroke Recording and Replay System
// Similar to Replit's Code Replay feature

export interface KeystrokeEvent {
  type: 'insert' | 'delete' | 'replace';
  text: string;
  position: {
    line: number;
    column: number;
  };
  endPosition?: {
    line: number;
    column: number;
  };
  timestamp: number;
}

interface PlayerOptions {
  speed?: number;
  onProgress?: (current: number, total: number) => void;
  onComplete?: () => void;
}

export class KeystrokeRecorder {
  private events: KeystrokeEvent[] = [];
  private recording = false;
  private startTime = 0;
  private disposable: { dispose: () => void } | null = null;

  start(editor: any): void {
    if (this.recording) return;
    
    this.events = [];
    this.recording = true;
    this.startTime = Date.now();

    const model = editor.getModel();
    if (model) {
      this.disposable = model.onDidChangeContent((e: any) => {
        if (!this.recording) return;
        
        const timestamp = Date.now() - this.startTime;
        
        for (const change of e.changes || []) {
          const range = change.range;
          const text = change.text;
          
          if (text && range.startColumn === range.endColumn && range.startLineNumber === range.endLineNumber) {
            // Insert
            this.events.push({
              type: 'insert',
              text,
              position: { line: range.startLineNumber, column: range.startColumn },
              timestamp,
            });
          } else if (!text && (range.startColumn !== range.endColumn || range.startLineNumber !== range.endLineNumber)) {
            // Delete
            this.events.push({
              type: 'delete',
              text: '',
              position: { line: range.startLineNumber, column: range.startColumn },
              endPosition: { line: range.endLineNumber, column: range.endColumn },
              timestamp,
            });
          } else {
            // Replace
            this.events.push({
              type: 'replace',
              text: text || '',
              position: { line: range.startLineNumber, column: range.startColumn },
              endPosition: { line: range.endLineNumber, column: range.endColumn },
              timestamp,
            });
          }
        }
      });
    }
  }

  stop(): KeystrokeEvent[] {
    this.recording = false;
    
    if (this.disposable) {
      this.disposable.dispose();
      this.disposable = null;
    }
    
    return [...this.events];
  }

  isRecording(): boolean {
    return this.recording;
  }

  getEvents(): KeystrokeEvent[] {
    return [...this.events];
  }
}

export class KeystrokePlayer {
  private events: KeystrokeEvent[];
  private currentIndex = 0;
  private playing = false;
  private paused = false;
  private speed: number;
  private onProgress?: (current: number, total: number) => void;
  private onComplete?: () => void;
  private timeoutId: ReturnType<typeof setTimeout> | null = null;
  private editor: any = null;

  constructor(events: KeystrokeEvent[], options: PlayerOptions = {}) {
    this.events = events;
    this.speed = options.speed || 1;
    this.onProgress = options.onProgress;
    this.onComplete = options.onComplete;
  }

  play(editor: any): void {
    if (this.playing && !this.paused) return;
    
    this.editor = editor;
    this.playing = true;
    this.paused = false;
    this.currentIndex = 0;
    
    this.playNext();
  }

  pause(): void {
    this.paused = true;
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
  }

  resume(editor: any): void {
    if (!this.paused) return;
    
    this.editor = editor;
    this.paused = false;
    this.playNext();
  }

  stop(): void {
    this.playing = false;
    this.paused = false;
    this.currentIndex = 0;
    
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
  }

  isPlaying(): boolean {
    return this.playing && !this.paused;
  }

  isPaused(): boolean {
    return this.paused;
  }

  setSpeed(speed: number): void {
    this.speed = Math.max(0.25, Math.min(4, speed));
  }

  private playNext(): void {
    if (!this.playing || this.paused || this.currentIndex >= this.events.length) {
      if (this.currentIndex >= this.events.length && this.playing) {
        this.playing = false;
        if (this.onComplete) {
          this.onComplete();
        }
      }
      return;
    }

    const event = this.events[this.currentIndex];
    const nextEvent = this.events[this.currentIndex + 1];
    
    // Apply the current event
    this.applyEvent(event);
    
    // Report progress
    if (this.onProgress) {
      this.onProgress(this.currentIndex + 1, this.events.length);
    }
    
    this.currentIndex++;
    
    if (nextEvent) {
      const delay = (nextEvent.timestamp - event.timestamp) / this.speed;
      this.timeoutId = setTimeout(() => this.playNext(), Math.max(10, delay));
    } else {
      // Last event
      this.playing = false;
      if (this.onComplete) {
        this.onComplete();
      }
    }
  }

  private applyEvent(event: KeystrokeEvent): void {
    if (!this.editor) return;
    
    const model = this.editor.getModel?.();
    if (!model) return;

    try {
      if (event.type === 'insert') {
        const range = {
          startLineNumber: event.position.line,
          startColumn: event.position.column,
          endLineNumber: event.position.line,
          endColumn: event.position.column,
        };
        model.applyEdits([{ range, text: event.text }]);
        
        // Move cursor
        const newColumn = event.position.column + event.text.length;
        this.editor.setPosition?.({ lineNumber: event.position.line, column: newColumn });
      } else if (event.type === 'delete' && event.endPosition) {
        const range = {
          startLineNumber: event.position.line,
          startColumn: event.position.column,
          endLineNumber: event.endPosition.line,
          endColumn: event.endPosition.column,
        };
        model.applyEdits([{ range, text: '' }]);
        this.editor.setPosition?.({ lineNumber: event.position.line, column: event.position.column });
      } else if (event.type === 'replace' && event.endPosition) {
        const range = {
          startLineNumber: event.position.line,
          startColumn: event.position.column,
          endLineNumber: event.endPosition.line,
          endColumn: event.endPosition.column,
        };
        model.applyEdits([{ range, text: event.text }]);
        
        const newColumn = event.position.column + event.text.length;
        this.editor.setPosition?.({ lineNumber: event.position.line, column: newColumn });
      }
      
      this.editor.focus?.();
    } catch (error) {
      console.error('Error applying keystroke event:', error);
    }
  }
}

// Serialization helpers
export function serializeEvents(events: KeystrokeEvent[]): string {
  return JSON.stringify(events);
}

export function deserializeEvents(json: string): KeystrokeEvent[] {
  try {
    return JSON.parse(json) as KeystrokeEvent[];
  } catch {
    return [];
  }
}
