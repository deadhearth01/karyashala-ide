/**
 * @jest-environment jsdom
 */

import {
  initializeSecurity,
  disableEditorCopyPaste,
  addSecurityStyles,
} from '@/lib/security';

describe('Security Module', () => {
  let originalPreventDefault: typeof Event.prototype.preventDefault;
  let addEventListenerSpy: jest.SpyInstance;
  let removeEventListenerSpy: jest.SpyInstance;

  beforeEach(() => {
    // Store original methods
    originalPreventDefault = Event.prototype.preventDefault;
    
    // Spy on event listeners
    addEventListenerSpy = jest.spyOn(document, 'addEventListener');
    removeEventListenerSpy = jest.spyOn(document, 'removeEventListener');
  });

  afterEach(() => {
    // Restore original methods
    Event.prototype.preventDefault = originalPreventDefault;
    
    // Clear spies
    addEventListenerSpy.mockRestore();
    removeEventListenerSpy.mockRestore();
    
    // Clean up any added styles
    const styleElements = document.querySelectorAll('style[data-security]');
    styleElements.forEach(el => el.remove());
  });

  describe('initializeSecurity', () => {
    test('should add event listeners for security', () => {
      const cleanup = initializeSecurity();
      
      expect(addEventListenerSpy).toHaveBeenCalledWith(
        'contextmenu',
        expect.any(Function)
      );
      expect(addEventListenerSpy).toHaveBeenCalledWith(
        'keydown',
        expect.any(Function)
      );
      
      // Cleanup should be a function
      expect(typeof cleanup).toBe('function');
    });

    test('should return cleanup function that removes listeners', () => {
      const cleanup = initializeSecurity();
      cleanup();
      
      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        'contextmenu',
        expect.any(Function)
      );
      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        'keydown',
        expect.any(Function)
      );
    });

    test('should block right-click context menu', () => {
      initializeSecurity();
      
      const event = new MouseEvent('contextmenu', {
        bubbles: true,
        cancelable: true,
      });
      
      const preventDefault = jest.fn();
      Object.defineProperty(event, 'preventDefault', { value: preventDefault });
      
      document.dispatchEvent(event);
      
      expect(preventDefault).toHaveBeenCalled();
    });

    test('should block F12 key', () => {
      initializeSecurity();
      
      const event = new KeyboardEvent('keydown', {
        key: 'F12',
        bubbles: true,
        cancelable: true,
      });
      
      const preventDefault = jest.fn();
      Object.defineProperty(event, 'preventDefault', { value: preventDefault });
      
      document.dispatchEvent(event);
      
      expect(preventDefault).toHaveBeenCalled();
    });

    test('should block Ctrl+Shift+I', () => {
      initializeSecurity();
      
      const event = new KeyboardEvent('keydown', {
        key: 'I',
        ctrlKey: true,
        shiftKey: true,
        bubbles: true,
        cancelable: true,
      });
      
      const preventDefault = jest.fn();
      Object.defineProperty(event, 'preventDefault', { value: preventDefault });
      
      document.dispatchEvent(event);
      
      expect(preventDefault).toHaveBeenCalled();
    });

    test('should block Ctrl+Shift+J', () => {
      initializeSecurity();
      
      const event = new KeyboardEvent('keydown', {
        key: 'J',
        ctrlKey: true,
        shiftKey: true,
        bubbles: true,
        cancelable: true,
      });
      
      const preventDefault = jest.fn();
      Object.defineProperty(event, 'preventDefault', { value: preventDefault });
      
      document.dispatchEvent(event);
      
      expect(preventDefault).toHaveBeenCalled();
    });

    test('should block Ctrl+U (view source)', () => {
      initializeSecurity();
      
      const event = new KeyboardEvent('keydown', {
        key: 'u',
        ctrlKey: true,
        bubbles: true,
        cancelable: true,
      });
      
      const preventDefault = jest.fn();
      Object.defineProperty(event, 'preventDefault', { value: preventDefault });
      
      document.dispatchEvent(event);
      
      expect(preventDefault).toHaveBeenCalled();
    });

    test('should block Ctrl+S (save page)', () => {
      initializeSecurity();
      
      const event = new KeyboardEvent('keydown', {
        key: 's',
        ctrlKey: true,
        bubbles: true,
        cancelable: true,
      });
      
      const preventDefault = jest.fn();
      Object.defineProperty(event, 'preventDefault', { value: preventDefault });
      
      document.dispatchEvent(event);
      
      expect(preventDefault).toHaveBeenCalled();
    });
  });

  describe('disableEditorCopyPaste', () => {
    let mockEditor: any;

    beforeEach(() => {
      mockEditor = {
        addCommand: jest.fn(),
      };
    });

    test('should add commands to disable copy/paste', () => {
      disableEditorCopyPaste(mockEditor);
      
      expect(mockEditor.addCommand).toHaveBeenCalled();
      
      // Should be called multiple times for different commands
      const callCount = mockEditor.addCommand.mock.calls.length;
      expect(callCount).toBeGreaterThanOrEqual(3);
    });

    test('should handle editor without addCommand gracefully', () => {
      const invalidEditor = {};
      
      // Should not throw
      expect(() => disableEditorCopyPaste(invalidEditor)).not.toThrow();
    });

    test('should handle null editor gracefully', () => {
      expect(() => disableEditorCopyPaste(null)).not.toThrow();
    });
  });

  describe('addSecurityStyles', () => {
    test('should add style element to document head', () => {
      // initializeSecurity already adds styles, so we just verify styles exist
      const cleanup = initializeSecurity();
      
      const styleElements = document.head.querySelectorAll('style');
      expect(styleElements.length).toBeGreaterThan(0);
      
      cleanup();
    });

    test('should include user-select styles', () => {
      const cleanup = initializeSecurity();
      
      const styleElements = document.head.querySelectorAll('style');
      const lastStyle = styleElements[styleElements.length - 1];
      
      expect(lastStyle.textContent).toContain('user-select');
      
      cleanup();
    });

    test('should handle addSecurityStyles function gracefully', () => {
      // The addSecurityStyles function should not throw
      expect(() => addSecurityStyles()).not.toThrow();
    });
  });
});
