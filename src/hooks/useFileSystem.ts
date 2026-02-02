'use client';

import { useState, useCallback, useEffect } from 'react';
import { VirtualFile, Language, FileSystemState } from '@/types';

const STORAGE_KEY = 'wasm-compiler-files';

// Generate unique ID
function generateId(): string {
  return `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Get file extension for language
function getExtension(language: Language): string {
  return language === 'python' ? '.py' : '.c';
}

// Detect language from filename
function detectLanguage(filename: string): Language {
  if (filename.endsWith('.py')) return 'python';
  if (filename.endsWith('.c') || filename.endsWith('.h')) return 'c';
  return 'python'; // default
}

// Default files
const DEFAULT_FILES: VirtualFile[] = [
  {
    id: 'main_py',
    name: 'main.py',
    content: `# Python Example - Runs in Browser via Pyodide (WebAssembly)
# Note: input() is not supported in browser environment

def fibonacci(n):
    """Calculate the nth Fibonacci number"""
    if n <= 1:
        return n
    return fibonacci(n - 1) + fibonacci(n - 2)

def main():
    print("Python WebAssembly Compiler")
    print("=" * 40)
    
    # Print Fibonacci sequence
    print("\\nFibonacci Sequence (first 10 numbers):")
    for i in range(10):
        print(f"  F({i}) = {fibonacci(i)}")
    
    print("\\nExecution completed successfully!")

if __name__ == "__main__":
    main()
`,
    language: 'python',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: 'utils_py',
    name: 'utils.py',
    content: `# Utility functions module
# This file can be imported from main.py using: from utils import *

def add(a, b):
    """Add two numbers"""
    return a + b

def subtract(a, b):
    """Subtract b from a"""
    return a - b

def multiply(a, b):
    """Multiply two numbers"""
    return a * b

def divide(a, b):
    """Divide a by b"""
    if b == 0:
        raise ValueError("Cannot divide by zero")
    return a / b

def greet(name):
    """Return a greeting message"""
    return f"Hello, {name}!"

# Constants
PI = 3.14159265359
E = 2.71828182846

print("utils.py module loaded successfully!")
`,
    language: 'python',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: 'main_c',
    name: 'main.c',
    content: `// C Example - Runs in Browser WebAssembly Runtime
// Note: scanf/stdin is not supported in browser environment

#include <stdio.h>

// Calculate factorial recursively
long factorial(int n) {
    if (n <= 1) return 1;
    return n * factorial(n - 1);
}

// Check if a number is prime
int is_prime(int n) {
    if (n < 2) return 0;
    for (int i = 2; i * i <= n; i++) {
        if (n % i == 0) return 0;
    }
    return 1;
}

int main() {
    printf("C WebAssembly Compiler\\n");
    printf("========================================\\n\\n");
    
    // Print factorials
    printf("Factorials:\\n");
    for (int i = 0; i <= 10; i++) {
        printf("  %2d! = %ld\\n", i, factorial(i));
    }
    
    // Print prime numbers
    printf("\\nPrime numbers up to 30:\\n  ");
    for (int i = 2; i <= 30; i++) {
        if (is_prime(i)) {
            printf("%d ", i);
        }
    }
    printf("\\n\\nExecution completed successfully!\\n");
    
    return 0;
}
`,
    language: 'c',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
];

export function useFileSystem() {
  const [files, setFiles] = useState<VirtualFile[]>([]);
  const [activeFileId, setActiveFileId] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load files from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed: FileSystemState = JSON.parse(stored);
        setFiles(parsed.files);
        setActiveFileId(parsed.activeFileId || parsed.files[0]?.id || null);
      } else {
        setFiles(DEFAULT_FILES);
        setActiveFileId(DEFAULT_FILES[0].id);
        // Save default files immediately
        const state: FileSystemState = { files: DEFAULT_FILES, activeFileId: DEFAULT_FILES[0].id };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      }
    } catch (error) {
      console.error('Failed to load files from storage:', error);
      setFiles(DEFAULT_FILES);
      setActiveFileId(DEFAULT_FILES[0].id);
    }
    setIsLoaded(true);
  }, []);

  // Debounced save files to localStorage whenever they change
  useEffect(() => {
    if (!isLoaded) return;
    
    const timeoutId = setTimeout(() => {
      try {
        const state: FileSystemState = { files, activeFileId };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      } catch (error) {
        console.error('Failed to save files to storage:', error);
      }
    }, 300); // 300ms debounce for better performance
    
    return () => clearTimeout(timeoutId);
  }, [files, activeFileId, isLoaded]);

  // Get active file
  const activeFile = files.find(f => f.id === activeFileId) || null;

  // Get files by language
  const getFilesByLanguage = useCallback((language: Language) => {
    return files.filter(f => f.language === language);
  }, [files]);

  // Create new file
  const createFile = useCallback((name: string, language: Language, content: string = '') => {
    const newFile: VirtualFile = {
      id: generateId(),
      name: name.includes('.') ? name : name + getExtension(language),
      content: content || getDefaultContent(language, name),
      language,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    setFiles(prev => [...prev, newFile]);
    setActiveFileId(newFile.id);
    return newFile;
  }, []);

  // Rename file
  const renameFile = useCallback((id: string, newName: string) => {
    setFiles(prev => prev.map(f => {
      if (f.id === id) {
        const language = detectLanguage(newName);
        return {
          ...f,
          name: newName.includes('.') ? newName : newName + getExtension(language),
          language,
          updatedAt: Date.now(),
        };
      }
      return f;
    }));
  }, []);

  // Update file content
  const updateFileContent = useCallback((id: string, content: string) => {
    setFiles(prev => prev.map(f => 
      f.id === id ? { ...f, content, updatedAt: Date.now() } : f
    ));
  }, []);

  // Delete file
  const deleteFile = useCallback((id: string) => {
    setFiles(prev => {
      const newFiles = prev.filter(f => f.id !== id);
      // If we deleted the active file, select another one
      if (activeFileId === id && newFiles.length > 0) {
        setActiveFileId(newFiles[0].id);
      } else if (newFiles.length === 0) {
        setActiveFileId(null);
      }
      return newFiles;
    });
  }, [activeFileId]);

  // Get file by name (for imports)
  const getFileByName = useCallback((name: string): VirtualFile | undefined => {
    // Try exact match first
    let file = files.find(f => f.name === name);
    if (file) return file;
    
    // Try with extension
    file = files.find(f => f.name === name + '.py' || f.name === name + '.c');
    return file;
  }, [files]);

  // Get all file contents as a map (for multi-file execution)
  const getFileContentsMap = useCallback((): Record<string, string> => {
    const map: Record<string, string> = {};
    files.forEach(f => {
      map[f.name] = f.content;
    });
    return map;
  }, [files]);

  // Clear all files and reset to defaults
  const resetFiles = useCallback(() => {
    setFiles(DEFAULT_FILES);
    setActiveFileId(DEFAULT_FILES[0].id);
  }, []);

  // Clear all data
  const clearAllData = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem('wasm-compiler-settings');
    localStorage.removeItem('theme');
    setFiles(DEFAULT_FILES);
    setActiveFileId(DEFAULT_FILES[0].id);
  }, []);

  return {
    files,
    activeFile,
    activeFileId,
    setActiveFileId,
    getFilesByLanguage,
    createFile,
    renameFile,
    updateFileContent,
    deleteFile,
    getFileByName,
    getFileContentsMap,
    resetFiles,
    clearAllData,
    isLoaded,
  };
}

// Helper to get default content for new files
function getDefaultContent(language: Language, name: string): string {
  if (language === 'python') {
    return `# ${name}\n# Created on ${new Date().toLocaleDateString()}\n\ndef main():\n    print("Hello from ${name}!")\n\nif __name__ == "__main__":\n    main()\n`;
  }
  return `// ${name}\n// Created on ${new Date().toLocaleDateString()}\n\n#include <stdio.h>\n\nint main() {\n    printf("Hello from ${name}!\\n");\n    return 0;\n}\n`;
}
