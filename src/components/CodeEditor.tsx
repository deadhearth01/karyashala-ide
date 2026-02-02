'use client';

import { useState, useEffect, useCallback, memo } from 'react';
import Editor, { loader } from '@monaco-editor/react';
import { Box, CircularProgress, Typography, Chip } from '@mui/material';
import { useTheme } from './MuiThemeProvider';
import { Language } from '@/types';

// Configure Monaco to load from CDN with caching
loader.config({
  paths: {
    vs: 'https://cdn.jsdelivr.net/npm/monaco-editor@0.45.0/min/vs'
  }
});

// Pre-load Monaco in the background
if (typeof window !== 'undefined') {
  loader.init().catch(console.error);
}

interface CodeEditorProps {
  language: Language;
  value: string;
  onChange: (value: string | undefined) => void;
  onMount?: (editor: any) => void;
  fontSize?: number;
  showLineNumbers?: boolean;
  wordWrap?: boolean;
  tabSize?: number;
}

const languageMap: Record<Language, string> = {
  python: 'python',
  c: 'c',
};

// Simple fallback editor for offline mode
function FallbackEditor({ value, onChange }: { value: string; onChange: (value: string | undefined) => void }) {
  const { theme } = useTheme();
  
  return (
    <Box sx={{ width: '100%', height: '100%', position: 'relative' }}>
      <Box
        component="textarea"
        value={value}
        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => onChange(e.target.value)}
        sx={{
          width: '100%',
          height: '100%',
          p: 2,
          fontFamily: "'JetBrains Mono', 'Fira Code', Consolas, monospace",
          fontSize: '14px',
          lineHeight: 1.5,
          resize: 'none',
          border: 'none',
          outline: 'none',
          bgcolor: theme === 'dark' ? '#1e1e1e' : '#ffffff',
          color: theme === 'dark' ? '#d4d4d4' : '#1e1e1e',
        }}
        spellCheck={false}
        autoCapitalize="off"
        autoCorrect="off"
      />
      <Chip
        label="Offline Mode"
        size="small"
        color="warning"
        sx={{
          position: 'absolute',
          top: 8,
          right: 8,
        }}
      />
    </Box>
  );
}

export default memo(function CodeEditor({ 
  language, 
  value, 
  onChange, 
  onMount,
  fontSize = 14,
  showLineNumbers = true,
  wordWrap = false,
  tabSize = 4,
}: CodeEditorProps) {
  const { theme } = useTheme();
  const [loadFailed, setLoadFailed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Set a timeout for Monaco loading - reduced from 10s to 5s
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (isLoading) {
        console.warn('Monaco editor load timeout - falling back to simple editor');
        setLoadFailed(true);
        setIsLoading(false);
      }
    }, 5000);

    return () => clearTimeout(timeout);
  }, [isLoading]);

  // If Monaco failed to load, use fallback
  if (loadFailed) {
    return <FallbackEditor value={value} onChange={onChange} />;
  }

  const handleEditorMount = useCallback((editor: any) => {
    setIsLoading(false);
    
    editor.updateOptions({
      fontSize: fontSize,
      fontFamily: "'JetBrains Mono', 'Fira Code', Consolas, monospace",
      fontLigatures: true,
      minimap: { enabled: false },
      scrollBeyondLastLine: false,
      lineNumbers: showLineNumbers ? 'on' : 'off',
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
      wordWrap: wordWrap ? 'on' : 'off',
      tabSize: tabSize,
    });

    if (onMount) {
      onMount(editor);
    }
  }, [fontSize, showLineNumbers, wordWrap, tabSize, onMount]);

  return (
    <Editor
      height="100%"
      language={languageMap[language]}
      value={value}
      onChange={onChange}
      theme={theme === 'dark' ? 'vs-dark' : 'light'}
      onMount={handleEditorMount}
      options={{
        fontSize: fontSize,
        fontFamily: "'JetBrains Mono', 'Fira Code', Consolas, monospace",
        minimap: { enabled: false },
        scrollBeyondLastLine: false,
        automaticLayout: true,
        padding: { top: 16, bottom: 16 },
        lineNumbers: showLineNumbers ? 'on' : 'off',
        wordWrap: wordWrap ? 'on' : 'off',
        tabSize: tabSize,
      }}
      loading={
        <Box
          sx={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: 'background.paper',
          }}
        >
          <CircularProgress size={24} sx={{ mr: 2 }} />
          <Typography variant="body2" color="text.secondary">
            Loading editor...
          </Typography>
        </Box>
      }
    />
  );
});
