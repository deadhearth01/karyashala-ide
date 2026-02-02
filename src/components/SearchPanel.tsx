'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { VirtualFile } from '@/types';
import { cn } from '@/lib/utils';

interface SearchPanelProps {
  files: VirtualFile[];
  onFileSelect: (fileId: string) => void;
  onResultClick: (fileId: string, lineNumber: number) => void;
}

interface SearchResult {
  fileId: string;
  fileName: string;
  lineNumber: number;
  lineContent: string;
  matchStart: number;
  matchEnd: number;
}

export function SearchPanel({ files, onFileSelect, onResultClick }: SearchPanelProps) {
  const [query, setQuery] = useState('');
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [useRegex, setUseRegex] = useState(false);
  const [replaceMode, setReplaceMode] = useState(false);
  const [replaceText, setReplaceText] = useState('');
  
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Search results
  const results = useMemo((): SearchResult[] => {
    if (!query.trim()) return [];

    const searchResults: SearchResult[] = [];
    
    files.forEach((file) => {
      const lines = file.content.split('\n');
      
      lines.forEach((line, index) => {
        try {
          let searchQuery = query;
          let flags = 'g';
          
          if (!caseSensitive) {
            flags += 'i';
          }
          
          let regex: RegExp;
          if (useRegex) {
            regex = new RegExp(searchQuery, flags);
          } else {
            // Escape special regex characters for literal search
            const escaped = searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            regex = new RegExp(escaped, flags);
          }
          
          let match;
          while ((match = regex.exec(line)) !== null) {
            searchResults.push({
              fileId: file.id,
              fileName: file.name,
              lineNumber: index + 1,
              lineContent: line,
              matchStart: match.index,
              matchEnd: match.index + match[0].length,
            });
            
            // Prevent infinite loops for zero-length matches
            if (match.index === regex.lastIndex) {
              regex.lastIndex++;
            }
          }
        } catch (e) {
          // Invalid regex, skip
        }
      });
    });

    return searchResults;
  }, [query, files, caseSensitive, useRegex]);

  // Group results by file
  const groupedResults = useMemo(() => {
    const groups: Record<string, SearchResult[]> = {};
    results.forEach((result) => {
      if (!groups[result.fileId]) {
        groups[result.fileId] = [];
      }
      groups[result.fileId].push(result);
    });
    return groups;
  }, [results]);

  const totalResults = results.length;
  const filesWithResults = Object.keys(groupedResults).length;

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="px-3 py-2 border-b border-neutral-200 dark:border-neutral-800">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
          Search
        </span>
      </div>

      {/* Search input */}
      <div className="p-2 space-y-2">
        <div className="relative">
          <svg 
            className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search in files..."
            className="w-full pl-8 pr-3 py-1.5 text-sm bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-md outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
          />
        </div>

        {/* Search options */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setCaseSensitive(!caseSensitive)}
            className={cn(
              "p-1.5 rounded text-xs font-mono transition-colors",
              caseSensitive
                ? "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                : "hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500"
            )}
            title="Match Case"
          >
            Aa
          </button>
          <button
            onClick={() => setUseRegex(!useRegex)}
            className={cn(
              "p-1.5 rounded text-xs font-mono transition-colors",
              useRegex
                ? "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                : "hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500"
            )}
            title="Use Regular Expression"
          >
            .*
          </button>
          <div className="flex-1" />
          <button
            onClick={() => setReplaceMode(!replaceMode)}
            className={cn(
              "p-1.5 rounded transition-colors",
              replaceMode
                ? "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                : "hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500"
            )}
            title="Toggle Replace"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
          </button>
        </div>

        {/* Replace input */}
        {replaceMode && (
          <input
            type="text"
            value={replaceText}
            onChange={(e) => setReplaceText(e.target.value)}
            placeholder="Replace with..."
            className="w-full px-3 py-1.5 text-sm bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-md outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
          />
        )}
      </div>

      {/* Results summary */}
      {query && (
        <div className="px-3 py-1.5 text-xs text-neutral-500 dark:text-neutral-400 border-b border-neutral-200 dark:border-neutral-800">
          {totalResults === 0 ? (
            'No results found'
          ) : (
            <>
              {totalResults} result{totalResults !== 1 && 's'} in {filesWithResults} file{filesWithResults !== 1 && 's'}
            </>
          )}
        </div>
      )}

      {/* Results list */}
      <div className="flex-1 overflow-y-auto panel-scrollbar">
        {Object.entries(groupedResults).map(([fileId, fileResults]) => {
          const file = files.find(f => f.id === fileId);
          if (!file) return null;

          return (
            <div key={fileId} className="border-b border-neutral-100 dark:border-neutral-800">
              {/* File header */}
              <button
                onClick={() => onFileSelect(fileId)}
                className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-neutral-50 dark:hover:bg-neutral-900 transition-colors"
              >
                <FileIcon filename={file.name} />
                <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300 truncate">
                  {file.name}
                </span>
                <span className="text-xs text-neutral-400 ml-auto">
                  {fileResults.length}
                </span>
              </button>

              {/* File results */}
              <div className="pl-5">
                {fileResults.map((result, idx) => (
                  <button
                    key={`${result.lineNumber}-${idx}`}
                    onClick={() => onResultClick(result.fileId, result.lineNumber)}
                    className="w-full flex items-start gap-2 px-2 py-1 hover:bg-neutral-50 dark:hover:bg-neutral-900 transition-colors text-left"
                  >
                    <span className="text-xs text-neutral-400 w-6 flex-shrink-0 text-right font-mono">
                      {result.lineNumber}
                    </span>
                    <span className="text-xs text-neutral-600 dark:text-neutral-400 font-mono truncate">
                      <HighlightedText
                        text={result.lineContent}
                        start={result.matchStart}
                        end={result.matchEnd}
                      />
                    </span>
                  </button>
                ))}
              </div>
            </div>
          );
        })}

        {/* Empty state */}
        {!query && (
          <div className="px-4 py-8 text-center">
            <svg className="w-8 h-8 mx-auto text-neutral-300 dark:text-neutral-600 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              Type to search in files
            </p>
            <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-1">
              Use Aa for case sensitive, .* for regex
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// Highlighted text component
function HighlightedText({ text, start, end }: { text: string; start: number; end: number }) {
  const before = text.slice(0, start);
  const match = text.slice(start, end);
  const after = text.slice(end);

  return (
    <>
      {before}
      <span className="bg-yellow-200 dark:bg-yellow-500/30 text-yellow-800 dark:text-yellow-300 px-0.5 rounded">
        {match}
      </span>
      {after}
    </>
  );
}

// File icon component
function FileIcon({ filename }: { filename: string }) {
  const isPython = filename.endsWith('.py');
  
  if (isPython) {
    return (
      <svg className="w-4 h-4 text-[#3776AB] flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
        <path d="M14.25.18l.9.2.73.26.59.3.45.32.34.34.25.34.16.33.1.3.04.26.02.2-.01.13V8.5l-.05.63-.13.55-.21.46-.26.38-.3.31-.33.25-.35.19-.35.14-.33.1-.3.07-.26.04-.21.02H8.77l-.69.05-.59.14-.5.22-.41.27-.33.32-.27.35-.2.36-.15.37-.1.35-.07.32-.04.27-.02.21v3.06H3.17l-.21-.03-.28-.07-.32-.12-.35-.18-.36-.26-.36-.36-.35-.46-.32-.59-.28-.73-.21-.88-.14-1.05-.05-1.23.06-1.22.16-1.04.24-.87.32-.71.36-.57.4-.44.42-.33.42-.24.4-.16.36-.1.32-.05.24-.01h.16l.06.01h8.16v-.83H6.18l-.01-2.75-.02-.37.05-.34.11-.31.17-.28.25-.26.31-.23.38-.2.44-.18.51-.15.58-.12.64-.1.71-.06.77-.04.84-.02 1.27.05z"/>
      </svg>
    );
  }
  
  return (
    <svg className="w-4 h-4 text-[#A8B9CC] flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.66 7.73a8.42 8.42 0 00-.46-1.66 7.94 7.94 0 00-.76-1.47 8.08 8.08 0 00-1.04-1.27 8.46 8.46 0 00-1.27-1.04 8.18 8.18 0 00-1.47-.76 8.14 8.14 0 00-1.67-.46A8.23 8.23 0 0012 1a8.23 8.23 0 00-1.99.07z"/>
    </svg>
  );
}
