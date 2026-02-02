'use client';

import { useState, useRef, useEffect } from 'react';
import { VirtualFile, Language } from '@/types';
import { cn } from '@/lib/utils';

interface FileExplorerProps {
  files: VirtualFile[];
  activeFileId: string | null;
  currentLanguage: Language;
  onFileSelect: (fileId: string) => void;
  onFileCreate: (name: string, language: Language) => void;
  onFileRename: (id: string, newName: string) => void;
  onFileDelete: (id: string) => void;
}

// File icons based on extension
function FileIcon({ filename, className }: { filename: string; className?: string }) {
  const isPython = filename.endsWith('.py');
  const isC = filename.endsWith('.c') || filename.endsWith('.h');
  
  if (isPython) {
    return (
      <svg className={cn("w-4 h-4 text-[#3776AB]", className)} viewBox="0 0 24 24" fill="currentColor">
        <path d="M14.25.18l.9.2.73.26.59.3.45.32.34.34.25.34.16.33.1.3.04.26.02.2-.01.13V8.5l-.05.63-.13.55-.21.46-.26.38-.3.31-.33.25-.35.19-.35.14-.33.1-.3.07-.26.04-.21.02H8.77l-.69.05-.59.14-.5.22-.41.27-.33.32-.27.35-.2.36-.15.37-.1.35-.07.32-.04.27-.02.21v3.06H3.17l-.21-.03-.28-.07-.32-.12-.35-.18-.36-.26-.36-.36-.35-.46-.32-.59-.28-.73-.21-.88-.14-1.05-.05-1.23.06-1.22.16-1.04.24-.87.32-.71.36-.57.4-.44.42-.33.42-.24.4-.16.36-.1.32-.05.24-.01h.16l.06.01h8.16v-.83H6.18l-.01-2.75-.02-.37.05-.34.11-.31.17-.28.25-.26.31-.23.38-.2.44-.18.51-.15.58-.12.64-.1.71-.06.77-.04.84-.02 1.27.05zm-6.3 1.98l-.23.33-.08.41.08.41.23.34.33.22.41.09.41-.09.33-.22.23-.34.08-.41-.08-.41-.23-.33-.33-.22-.41-.09-.41.09zm13.09 3.95l.28.06.32.12.35.18.36.27.36.35.35.47.32.59.28.73.21.88.14 1.04.05 1.23-.06 1.23-.16 1.04-.24.86-.32.71-.36.57-.4.45-.42.33-.42.24-.4.16-.36.09-.32.05-.24.02-.16-.01h-8.22v.82h5.84l.01 2.76.02.36-.05.34-.11.31-.17.29-.25.25-.31.24-.38.2-.44.17-.51.15-.58.13-.64.09-.71.07-.77.04-.84.01-1.27-.04-1.07-.14-.9-.2-.73-.25-.59-.3-.45-.33-.34-.34-.25-.34-.16-.33-.1-.3-.04-.25-.02-.2.01-.13v-5.34l.05-.64.13-.54.21-.46.26-.38.3-.32.33-.24.35-.2.35-.14.33-.1.3-.06.26-.04.21-.02.13-.01h5.84l.69-.05.59-.14.5-.21.41-.28.33-.32.27-.35.2-.36.15-.36.1-.35.07-.32.04-.28.02-.21V6.07h2.09l.14.01zm-6.47 14.25l-.23.33-.08.41.08.41.23.33.33.23.41.08.41-.08.33-.23.23-.33.08-.41-.08-.41-.23-.33-.33-.23-.41-.08-.41.08z"/>
      </svg>
    );
  }
  
  if (isC) {
    return (
      <svg className={cn("w-4 h-4 text-[#A8B9CC]", className)} viewBox="0 0 24 24" fill="currentColor">
        <path d="M20.66 7.73a8.42 8.42 0 00-.46-1.66 7.94 7.94 0 00-.76-1.47 8.08 8.08 0 00-1.04-1.27 8.46 8.46 0 00-1.27-1.04 8.18 8.18 0 00-1.47-.76 8.14 8.14 0 00-1.67-.46A8.23 8.23 0 0012 1a8.23 8.23 0 00-1.99.07 8.14 8.14 0 00-1.67.46 8.18 8.18 0 00-1.47.76 8.46 8.46 0 00-1.27 1.04A8.08 8.08 0 004.56 4.6a7.94 7.94 0 00-.76 1.47 8.42 8.42 0 00-.46 1.66A8.23 8.23 0 003.27 10v4c0 .68.02 1.33.07 1.99.04.66.19 1.17.46 1.66.26.5.48.99.76 1.47.28.48.65.91 1.04 1.27.39.36.82.73 1.27 1.04.45.31.96.54 1.47.76.51.22 1.01.38 1.67.46.66.08 1.31.35 1.99.35s1.33-.27 1.99-.35c.66-.08 1.17-.24 1.67-.46.5-.22 1.02-.45 1.47-.76.45-.31.88-.68 1.27-1.04.39-.36.76-.79 1.04-1.27.28-.48.5-.97.76-1.47.22-.49.42-1 .46-1.66.05-.66.07-1.31.07-1.99v-4c0-.68-.27-1.33-.34-1.99zM12 18.27c-3.45 0-6.27-2.82-6.27-6.27S8.55 5.73 12 5.73 18.27 8.55 18.27 12 15.45 18.27 12 18.27zm3.5-5.5h-1.12c-.07.33-.18.65-.33.94-.15.29-.33.55-.56.78a3.32 3.32 0 01-.78.56c-.29.15-.61.26-.94.33V14h1.12c.07-.33.18-.65.33-.94.15-.29.33-.55.56-.78.23-.23.49-.41.78-.56.29-.15.61-.26.94-.33V12.77z"/>
      </svg>
    );
  }
  
  return (
    <svg className={cn("w-4 h-4 text-neutral-400", className)} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  );
}

export function FileExplorer({
  files,
  activeFileId,
  currentLanguage,
  onFileSelect,
  onFileCreate,
  onFileRename,
  onFileDelete,
}: FileExplorerProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [editingFileId, setEditingFileId] = useState<string | null>(null);
  const [editingFileName, setEditingFileName] = useState('');
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; fileId: string } | null>(null);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const editInputRef = useRef<HTMLInputElement>(null);
  const contextMenuRef = useRef<HTMLDivElement>(null);

  // Filter files by current language
  const filteredFiles = files.filter(f => f.language === currentLanguage);

  // Focus input when creating new file
  useEffect(() => {
    if (isCreating && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isCreating]);

  // Focus input when editing file name
  useEffect(() => {
    if (editingFileId && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [editingFileId]);

  // Close context menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (contextMenuRef.current && !contextMenuRef.current.contains(e.target as Node)) {
        setContextMenu(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleCreateFile = () => {
    if (newFileName.trim()) {
      onFileCreate(newFileName.trim(), currentLanguage);
      setNewFileName('');
      setIsCreating(false);
    }
  };

  const handleRenameFile = () => {
    if (editingFileId && editingFileName.trim()) {
      onFileRename(editingFileId, editingFileName.trim());
      setEditingFileId(null);
      setEditingFileName('');
    }
  };

  const handleContextMenu = (e: React.MouseEvent, fileId: string) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, fileId });
  };

  const startRenaming = (file: VirtualFile) => {
    setEditingFileId(file.id);
    setEditingFileName(file.name);
    setContextMenu(null);
  };

  const handleDelete = (fileId: string) => {
    if (confirm('Are you sure you want to delete this file?')) {
      onFileDelete(fileId);
    }
    setContextMenu(null);
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-neutral-200 dark:border-neutral-800">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
          Explorer
        </span>
        <button
          onClick={() => setIsCreating(true)}
          className="p-1 rounded hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
          title="New File"
        >
          <svg className="w-4 h-4 text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>

      {/* Project Root */}
      <div className="px-2 py-1">
        <div className="flex items-center gap-1.5 px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-neutral-600 dark:text-neutral-400">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
          <span>Project</span>
        </div>
      </div>

      {/* File List */}
      <div className="flex-1 overflow-y-auto px-2">
        {filteredFiles.map((file) => (
          <div
            key={file.id}
            className={cn(
              "group flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer transition-colors mb-0.5",
              activeFileId === file.id
                ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                : "hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300"
            )}
            onClick={() => onFileSelect(file.id)}
            onContextMenu={(e) => handleContextMenu(e, file.id)}
          >
            <FileIcon filename={file.name} />
            
            {editingFileId === file.id ? (
              <input
                ref={editInputRef}
                type="text"
                value={editingFileName}
                onChange={(e) => setEditingFileName(e.target.value)}
                onBlur={handleRenameFile}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleRenameFile();
                  if (e.key === 'Escape') {
                    setEditingFileId(null);
                    setEditingFileName('');
                  }
                }}
                className="flex-1 bg-white dark:bg-neutral-800 border border-blue-400 rounded px-1 py-0.5 text-sm outline-none"
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <span className="flex-1 text-sm truncate">{file.name}</span>
            )}

            {/* Inline actions - visible on hover */}
            {editingFileId !== file.id && (
              <div className="hidden group-hover:flex items-center gap-0.5">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    startRenaming(file);
                  }}
                  className="p-0.5 rounded hover:bg-neutral-200 dark:hover:bg-neutral-700"
                  title="Rename"
                >
                  <svg className="w-3.5 h-3.5 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(file.id);
                  }}
                  className="p-0.5 rounded hover:bg-red-100 dark:hover:bg-red-900/30"
                  title="Delete"
                >
                  <svg className="w-3.5 h-3.5 text-neutral-500 hover:text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            )}
          </div>
        ))}

        {/* New file input */}
        {isCreating && (
          <div className="flex items-center gap-2 px-2 py-1.5">
            <FileIcon filename={currentLanguage === 'python' ? '.py' : '.c'} />
            <input
              ref={inputRef}
              type="text"
              value={newFileName}
              onChange={(e) => setNewFileName(e.target.value)}
              onBlur={() => {
                if (!newFileName.trim()) setIsCreating(false);
                else handleCreateFile();
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreateFile();
                if (e.key === 'Escape') {
                  setIsCreating(false);
                  setNewFileName('');
                }
              }}
              placeholder={currentLanguage === 'python' ? 'filename.py' : 'filename.c'}
              className="flex-1 bg-white dark:bg-neutral-800 border border-blue-400 rounded px-1.5 py-0.5 text-sm outline-none placeholder:text-neutral-400"
            />
          </div>
        )}

        {/* Empty state */}
        {filteredFiles.length === 0 && !isCreating && (
          <div className="px-4 py-8 text-center">
            <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-2">
              No {currentLanguage === 'python' ? 'Python' : 'C'} files yet
            </p>
            <button
              onClick={() => setIsCreating(true)}
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
            >
              Create a new file
            </button>
          </div>
        )}
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <div
          ref={contextMenuRef}
          className="fixed z-50 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg shadow-lg py-1 min-w-[140px]"
          style={{ left: contextMenu.x, top: contextMenu.y }}
        >
          <button
            onClick={() => {
              const file = files.find(f => f.id === contextMenu.fileId);
              if (file) startRenaming(file);
            }}
            className="w-full px-3 py-1.5 text-sm text-left hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Rename
          </button>
          <button
            onClick={() => handleDelete(contextMenu.fileId)}
            className="w-full px-3 py-1.5 text-sm text-left hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Delete
          </button>
        </div>
      )}
    </div>
  );
}
