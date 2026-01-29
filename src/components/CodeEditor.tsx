'use client';

import Editor from '@monaco-editor/react';
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

export default function CodeEditor({ language, value, onChange, onMount }: CodeEditorProps) {
  const { theme } = useTheme();

  const handleEditorMount = (editor: any) => {
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
