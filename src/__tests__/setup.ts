import '@testing-library/jest-dom';

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock Worker
class MockWorker {
  onmessage: ((e: MessageEvent) => void) | null = null;
  onerror: ((e: ErrorEvent) => void) | null = null;

  postMessage = jest.fn((message: any) => {
    // Simulate async response
    setTimeout(() => {
      if (this.onmessage && message.type === 'init') {
        this.onmessage({ data: { type: 'ready' } } as MessageEvent);
      }
    }, 10);
  });

  terminate = jest.fn();
}

Object.defineProperty(window, 'Worker', {
  value: MockWorker,
});

// Mock URL.createObjectURL
URL.createObjectURL = jest.fn(() => 'blob:mock-url');
URL.revokeObjectURL = jest.fn();

// Mock performance.now
if (!performance.now) {
  performance.now = jest.fn(() => Date.now());
}

// Suppress console errors during tests
const originalConsoleError = console.error;
console.error = (...args: any[]) => {
  if (
    args[0]?.includes?.('Warning:') ||
    args[0]?.includes?.('Error:')
  ) {
    return;
  }
  originalConsoleError.apply(console, args);
};
