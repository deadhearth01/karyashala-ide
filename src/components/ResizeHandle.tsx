'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

interface ResizeHandleProps {
  onResize: (delta: number) => void;
  orientation?: 'vertical' | 'horizontal';
  className?: string;
}

export function ResizeHandle({ 
  onResize, 
  orientation = 'vertical',
  className = '' 
}: ResizeHandleProps) {
  const [isDragging, setIsDragging] = useState(false);
  const startPosRef = useRef(0);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    startPosRef.current = orientation === 'vertical' ? e.clientX : e.clientY;
  }, [orientation]);

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const currentPos = orientation === 'vertical' ? e.clientX : e.clientY;
      const delta = currentPos - startPosRef.current;
      startPosRef.current = currentPos;
      onResize(delta);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    // Add listeners to document to capture mouse events even outside the handle
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    // Prevent text selection while dragging
    document.body.style.userSelect = 'none';
    document.body.style.cursor = orientation === 'vertical' ? 'col-resize' : 'row-resize';

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
    };
  }, [isDragging, onResize, orientation]);

  const isVertical = orientation === 'vertical';

  return (
    <div
      onMouseDown={handleMouseDown}
      className={`
        group relative flex-shrink-0
        ${isVertical ? 'w-1 cursor-col-resize' : 'h-1 cursor-row-resize'}
        ${isDragging ? 'bg-blue-500' : 'bg-transparent hover:bg-blue-400/50'}
        transition-colors duration-150
        ${className}
      `}
    >
      {/* Larger invisible hit area for easier grabbing */}
      <div 
        className={`
          absolute 
          ${isVertical 
            ? 'inset-y-0 -left-1 -right-1 w-3' 
            : 'inset-x-0 -top-1 -bottom-1 h-3'
          }
        `}
      />
      
      {/* Visual indicator on hover */}
      <div 
        className={`
          absolute opacity-0 group-hover:opacity-100 transition-opacity duration-150
          ${isDragging ? 'opacity-100' : ''}
          ${isVertical 
            ? 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1 h-8 rounded-full bg-blue-500' 
            : 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-1 w-8 rounded-full bg-blue-500'
          }
        `}
      />
    </div>
  );
}
