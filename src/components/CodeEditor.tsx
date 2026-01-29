'use client';

import { useState, useEffect } from 'react';
import Editor, { loader } from '@monaco-editor/react';
import { useTheme } from './ThemeProvider';
import { Language } from '@/types';

interface CodeEditorProps {
  language: Language;
  value: string;
  onChange: (value: string | undefined) => void;
  onMount?: (editor: any) => void;
}

const languageMap: Record<Language, string> = {
  python: 'python',
  c: 'c',
};

// Simple fallback editor for offline mode
function FallbackEditor({ language, value, onChange }: CodeEditorProps) {
  const { theme } = useTheme();
  
  return (
    <div className="w-full h-full relative">
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full h-full p-4 font-mono text-sm resize-none outline-none ${
          theme === 'dark' 
            ? 'bg-[#1e1e1e] text-[#d4d4d4]' 
            : 'bg-white text-gray-900'
        }`}
        style={{
          fontFamily: "'JetBrains Mono', 'Fira Code', Consolas, monospace",
          fontSize: '14px',
          lineHeight: '1.5',
          tabSize: 4,
        }}
        spellCheck={false}
        autoCapitalize="off"
        autoCorrect="off"
      />
      <div className={`absolute top-2 right-2 text-xs px-2 py-1 rounded ${
        theme === 'dark' ? 'bg-yellow-900/50 text-yellow-300' : 'bg-yellow-100 text-yellow-800'
      }`}>
        Offline Mode
      </div>
    </div>
  );
}

export default function CodeEditor({ language, value, onChange, onMount }: CodeEditorProps) {
  const { theme } = useTheme();
  const [loadFailed, setLoadFailed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Set a timeout for Monaco loading
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (isLoading) {
        console.warn('Monaco editor load timeout - falling back to simple editor');
        setLoadFailed(true);
        setIsLoading(false);
      }
    }, 10000); // 10 second timeout

    return () => clearTimeout(timeout);
  }, [isLoading]);

  // If Monaco failed to load, use fallback
  if (loadFailed) {
    return <FallbackEditor language={language} value={value} onChange={onChange} />;
  }

  const handleEditorMount = (editor: any) => {
    setIsLoading(false);
    
    // Configure editor settings
    editor.updateOptions({
      fontSize: 14,
      fontFamily: "'JetBrains Mono', 'Fira Code', Consolas, monospace",
      fontLigatures: true,
      minimap: { enabled: false },
      scrollBeyondLastLine: false,
      lineNumbers: 'on',
      glyphMargin: false,
      folding: true,
      lineDecorationsWidth: 10,
      lineNumbersMinChars: 3,
      renderLineHighlight: 'line',
      scrollbar: {
        verticalScrollbarSize: 8,
        horizontalScrollbarSize: 8,
      },
      padding: { top: 16, bottom: 16 },
      cursorBlinking: 'smooth',
      cursorSmoothCaretAnimation: 'on',
      smoothScrolling: true,
      bracketPairColorization: { enabled: true },
      automaticLayout: true,
    });

    // Call the external onMount handler if provided
    if (onMount) {
      onMount(editor);
    }
  };

  return (
    <Editor
      height="100%"
      language={languageMap[language]}
      value={value}
      onChange={onChange}
      theme={theme === 'dark' ? 'vs-dark' : 'light'}
      onMount={handleEditorMount}
      options={{
        fontSize: 14,
        fontFamily: "'JetBrains Mono', 'Fira Code', Consolas, monospace",
        minimap: { enabled: false },
        scrollBeyondLastLine: false,
        automaticLayout: true,
        padding: { top: 16, bottom: 16 },
      }}
      loading={
        <div className="w-full h-full flex items-center justify-center bg-white dark:bg-gray-900">
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-gray-500 dark:text-gray-400">Loading editor...</span>
          </div>
        </div>
      }
    />
  );
}
