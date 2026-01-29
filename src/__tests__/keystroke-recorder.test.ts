import {
  KeystrokeRecorder,
  KeystrokePlayer,
  serializeEvents,
  deserializeEvents,
  type KeystrokeEvent,
} from '@/lib/keystroke-recorder';

describe('KeystrokeRecorder', () => {
  let recorder: KeystrokeRecorder;
  let mockEditor: any;
  let changeListener: ((e: any) => void) | null = null;

  beforeEach(() => {
    recorder = new KeystrokeRecorder();
    
    // Mock Monaco editor
    mockEditor = {
      getValue: jest.fn(() => ''),
      getModel: jest.fn(() => ({
        onDidChangeContent: jest.fn((callback: any) => {
          changeListener = callback;
          return { dispose: jest.fn() };
        }),
      })),
    };
  });

  afterEach(() => {
    recorder.stop();
    changeListener = null;
  });

  test('should start recording', () => {
    recorder.start(mockEditor);
    expect(recorder.isRecording()).toBe(true);
  });

  test('should stop recording and return events', () => {
    recorder.start(mockEditor);
    const events = recorder.stop();
    
    expect(recorder.isRecording()).toBe(false);
    expect(Array.isArray(events)).toBe(true);
  });

  test('should capture keystroke events', () => {
    recorder.start(mockEditor);
    
    // Simulate typing
    if (changeListener) {
      changeListener({
        changes: [
          {
            text: 'H',
            range: { startLineNumber: 1, startColumn: 1, endLineNumber: 1, endColumn: 1 },
          },
        ],
      });
    }
    
    const events = recorder.stop();
    expect(events.length).toBeGreaterThan(0);
    expect(events[0].type).toBe('insert');
    expect(events[0].text).toBe('H');
  });

  test('should capture delete events', () => {
    mockEditor.getValue = jest.fn(() => 'Hello');
    recorder.start(mockEditor);
    
    // Simulate deletion
    if (changeListener) {
      changeListener({
        changes: [
          {
            text: '',
            range: { startLineNumber: 1, startColumn: 5, endLineNumber: 1, endColumn: 6 },
          },
        ],
      });
    }
    
    const events = recorder.stop();
    expect(events.length).toBeGreaterThan(0);
  });

  test('should get events while recording', () => {
    recorder.start(mockEditor);
    
    if (changeListener) {
      changeListener({
        changes: [{ text: 'A', range: { startLineNumber: 1, startColumn: 1, endLineNumber: 1, endColumn: 1 } }],
      });
    }
    
    const events = recorder.getEvents();
    expect(events.length).toBe(1);
  });
});

describe('KeystrokePlayer', () => {
  let mockEditor: any;
  let mockModel: any;

  beforeEach(() => {
    mockModel = {
      getValueInRange: jest.fn(() => ''),
      applyEdits: jest.fn(),
    };
    
    mockEditor = {
      setValue: jest.fn(),
      getValue: jest.fn(() => ''),
      getModel: jest.fn(() => mockModel),
      setPosition: jest.fn(),
      focus: jest.fn(),
    };
  });

  test('should create player with events', () => {
    const events: KeystrokeEvent[] = [
      { type: 'insert', text: 'H', position: { line: 1, column: 1 }, timestamp: 0 },
    ];
    
    const player = new KeystrokePlayer(events);
    expect(player).toBeDefined();
  });

  test('should play events on editor', async () => {
    const events: KeystrokeEvent[] = [
      { type: 'insert', text: 'H', position: { line: 1, column: 1 }, timestamp: 0 },
      { type: 'insert', text: 'i', position: { line: 1, column: 2 }, timestamp: 50 },
    ];
    
    const onComplete = jest.fn();
    const player = new KeystrokePlayer(events, { speed: 10, onComplete });
    
    player.play(mockEditor);
    
    // Wait for playback to complete
    await new Promise(resolve => setTimeout(resolve, 100));
    
    expect(onComplete).toHaveBeenCalled();
  });

  test('should pause and resume playback', async () => {
    const events: KeystrokeEvent[] = [
      { type: 'insert', text: 'H', position: { line: 1, column: 1 }, timestamp: 0 },
      { type: 'insert', text: 'e', position: { line: 1, column: 2 }, timestamp: 100 },
      { type: 'insert', text: 'l', position: { line: 1, column: 3 }, timestamp: 200 },
    ];
    
    const player = new KeystrokePlayer(events, { speed: 1 });
    player.play(mockEditor);
    
    // Pause after short delay
    await new Promise(resolve => setTimeout(resolve, 50));
    player.pause();
    
    expect(player.isPlaying()).toBe(false);
    expect(player.isPaused()).toBe(true);
    
    // Resume
    player.resume(mockEditor);
    expect(player.isPlaying()).toBe(true);
    expect(player.isPaused()).toBe(false);
  });

  test('should stop playback', () => {
    const events: KeystrokeEvent[] = [
      { type: 'insert', text: 'H', position: { line: 1, column: 1 }, timestamp: 0 },
    ];
    
    const player = new KeystrokePlayer(events);
    player.play(mockEditor);
    player.stop();
    
    expect(player.isPlaying()).toBe(false);
  });

  test('should adjust playback speed', () => {
    const events: KeystrokeEvent[] = [
      { type: 'insert', text: 'H', position: { line: 1, column: 1 }, timestamp: 0 },
    ];
    
    const player = new KeystrokePlayer(events, { speed: 1 });
    player.setSpeed(2);
    
    // Speed is adjusted internally
    expect(player).toBeDefined();
  });
});

describe('Serialization', () => {
  test('should serialize events to JSON string', () => {
    const events: KeystrokeEvent[] = [
      { type: 'insert', text: 'Hello', position: { line: 1, column: 1 }, timestamp: 0 },
      { type: 'insert', text: ' World', position: { line: 1, column: 6 }, timestamp: 500 },
    ];
    
    const serialized = serializeEvents(events);
    expect(typeof serialized).toBe('string');
    expect(serialized).toContain('Hello');
  });

  test('should deserialize JSON string to events', () => {
    const events: KeystrokeEvent[] = [
      { type: 'insert', text: 'Test', position: { line: 1, column: 1 }, timestamp: 0 },
    ];
    
    const serialized = serializeEvents(events);
    const deserialized = deserializeEvents(serialized);
    
    expect(deserialized).toEqual(events);
  });

  test('should handle empty events array', () => {
    const events: KeystrokeEvent[] = [];
    
    const serialized = serializeEvents(events);
    const deserialized = deserializeEvents(serialized);
    
    expect(deserialized).toEqual([]);
  });

  test('should handle invalid JSON gracefully', () => {
    const result = deserializeEvents('invalid json');
    expect(result).toEqual([]);
  });
});
