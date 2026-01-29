// Security utilities to prevent copy/paste, dev tools, and right-click

// Global state for copy/paste toggle
let copyPasteEnabled = false;
let toastCallback: ((message: string) => void) | null = null;

// Set the toast callback function
export function setToastCallback(callback: (message: string) => void): void {
  toastCallback = callback;
}

// Show toast notification
function showBlockedMessage(): void {
  if (toastCallback) {
    toastCallback('This operation is not allowed');
  }
}

// Toggle copy/paste
export function setCopyPasteEnabled(enabled: boolean): void {
  copyPasteEnabled = enabled;
}

export function isCopyPasteEnabled(): boolean {
  return copyPasteEnabled;
}

export function initializeSecurity(): () => void {
  // Disable right-click context menu
  const handleContextMenu = (e: MouseEvent) => {
    e.preventDefault();
    showBlockedMessage();
    return false;
  };

  // Disable keyboard shortcuts for dev tools and copy/paste
  const handleKeyDown = (e: KeyboardEvent) => {
    // Block all function keys F1-F12
    if (e.key.startsWith('F') && e.key.length <= 3) {
      const fKeyNum = parseInt(e.key.substring(1));
      if (fKeyNum >= 1 && fKeyNum <= 12) {
        e.preventDefault();
        showBlockedMessage();
        return false;
      }
    }

    // Prevent Ctrl/Cmd + Shift + I (Dev Tools)
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'I') {
      e.preventDefault();
      showBlockedMessage();
      return false;
    }

    // Prevent Ctrl/Cmd + Shift + J (Console)
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'J') {
      e.preventDefault();
      showBlockedMessage();
      return false;
    }

    // Prevent Ctrl/Cmd + Shift + C (Element Inspector)
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'C') {
      e.preventDefault();
      showBlockedMessage();
      return false;
    }

    // Prevent Ctrl/Cmd + U (View Source)
    if ((e.ctrlKey || e.metaKey) && e.key === 'u') {
      e.preventDefault();
      showBlockedMessage();
      return false;
    }

    // Prevent Ctrl/Cmd + S (Save)
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      showBlockedMessage();
      return false;
    }

    // Handle Copy/Paste based on toggle
    if (!copyPasteEnabled) {
      // Prevent Ctrl/Cmd + C (Copy)
      if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
        e.preventDefault();
        showBlockedMessage();
        return false;
      }

      // Prevent Ctrl/Cmd + V (Paste)
      if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
        e.preventDefault();
        showBlockedMessage();
        return false;
      }

      // Prevent Ctrl/Cmd + X (Cut)
      if ((e.ctrlKey || e.metaKey) && e.key === 'x') {
        e.preventDefault();
        showBlockedMessage();
        return false;
      }

      // Prevent Ctrl/Cmd + A (Select All)
      if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
        e.preventDefault();
        showBlockedMessage();
        return false;
      }
    }
  };

  // Disable copy events
  const handleCopy = (e: ClipboardEvent) => {
    if (!copyPasteEnabled) {
      e.preventDefault();
      showBlockedMessage();
      return false;
    }
    return true;
  };

  // Disable paste events
  const handlePaste = (e: ClipboardEvent) => {
    if (!copyPasteEnabled) {
      e.preventDefault();
      showBlockedMessage();
      return false;
    }
    return true;
  };

  // Disable cut events
  const handleCut = (e: ClipboardEvent) => {
    if (!copyPasteEnabled) {
      e.preventDefault();
      showBlockedMessage();
      return false;
    }
    return true;
  };

  // Add event listeners
  document.addEventListener('contextmenu', handleContextMenu);
  document.addEventListener('keydown', handleKeyDown, true);
  document.addEventListener('copy', handleCopy, true);
  document.addEventListener('paste', handlePaste, true);
  document.addEventListener('cut', handleCut, true);

  // Disable text selection outside editor
  const style = document.createElement('style');
  style.textContent = `
    body:not(.monaco-editor) {
      -webkit-user-select: none;
      -moz-user-select: none;
      -ms-user-select: none;
      user-select: none;
    }
    .monaco-editor, .monaco-editor * {
      -webkit-user-select: text !important;
      -moz-user-select: text !important;
      -ms-user-select: text !important;
      user-select: text !important;
    }
    .allow-select {
      -webkit-user-select: text !important;
      -moz-user-select: text !important;
      -ms-user-select: text !important;
      user-select: text !important;
    }
  `;
  document.head.appendChild(style);

  // Return cleanup function
  return () => {
    document.removeEventListener('contextmenu', handleContextMenu);
    document.removeEventListener('keydown', handleKeyDown, true);
    document.removeEventListener('copy', handleCopy, true);
    document.removeEventListener('paste', handlePaste, true);
    document.removeEventListener('cut', handleCut, true);
    if (style.parentNode) {
      style.parentNode.removeChild(style);
    }
  };
}

// Disable copy/paste within Monaco editor if needed
export function disableEditorCopyPaste(editor: any): void {
  if (!editor || typeof editor.addCommand !== 'function') return;

  // Override copy command
  editor.addCommand(
    2048 | 33, // CtrlCmd + C
    () => {
      if (!copyPasteEnabled) {
        showBlockedMessage();
      }
    }
  );

  // Override paste command
  editor.addCommand(
    2048 | 52, // CtrlCmd + V
    () => {
      if (!copyPasteEnabled) {
        showBlockedMessage();
      }
    }
  );

  // Override cut command
  editor.addCommand(
    2048 | 54, // CtrlCmd + X
    () => {
      if (!copyPasteEnabled) {
        showBlockedMessage();
      }
    }
  );
}

// Track if styles have been added
let stylesAdded = false;

// Add security styles to prevent text selection outside editor
export function addSecurityStyles(): void {
  if (stylesAdded || typeof document === 'undefined') return;
  
  const style = document.createElement('style');
  style.setAttribute('data-security', 'true');
  style.textContent = `
    .no-select {
      -webkit-user-select: none;
      -moz-user-select: none;
      -ms-user-select: none;
      user-select: none;
    }
    .monaco-editor, .monaco-editor *, .allow-select {
      -webkit-user-select: text !important;
      -moz-user-select: text !important;
      -ms-user-select: text !important;
      user-select: text !important;
    }
  `;
  document.head.appendChild(style);
  stylesAdded = true;
}
