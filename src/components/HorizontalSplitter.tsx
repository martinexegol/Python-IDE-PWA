import React, { useCallback, useEffect, useState } from 'react';
import { PythonTheme } from '../types';
import { GripHorizontal } from 'lucide-react';

interface HorizontalSplitterProps {
  onDrag: (deltaY: number) => void;
  activeTheme: PythonTheme;
  onReset?: () => void;
}

export const HorizontalSplitter: React.FC<HorizontalSplitterProps> = ({
  onDrag,
  activeTheme,
  onReset,
}) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      setIsDragging(true);

      let lastY = e.clientY;

      const handleMouseMove = (moveEvent: MouseEvent) => {
        const delta = moveEvent.clientY - lastY;
        lastY = moveEvent.clientY;
        onDrag(delta);
      };

      const handleMouseUp = () => {
        setIsDragging(false);
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };

      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    },
    [onDrag]
  );

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      setIsDragging(true);
      let lastY = e.touches[0].clientY;

      const handleTouchMove = (moveEvent: TouchEvent) => {
        if (moveEvent.touches.length > 0) {
          const currentY = moveEvent.touches[0].clientY;
          const delta = currentY - lastY;
          lastY = currentY;
          onDrag(delta);
        }
      };

      const handleTouchEnd = () => {
        setIsDragging(false);
        window.removeEventListener('touchmove', handleTouchMove);
        window.removeEventListener('touchend', handleTouchEnd);
      };

      window.addEventListener('touchmove', handleTouchMove, { passive: true });
      window.addEventListener('touchend', handleTouchEnd);
    },
    [onDrag]
  );

  return (
    <div
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
      onDoubleClick={onReset}
      className={`group relative h-2.5 w-full flex items-center justify-center cursor-row-resize select-none shrink-0 transition-colors z-20 ${
        isDragging ? 'opacity-100' : 'hover:opacity-100'
      }`}
      style={{
        backgroundColor: isDragging ? activeTheme.colors.accent : activeTheme.colors.border,
      }}
      title="Glissez vers le haut ou le bas pour redimensionner l'éditeur et la console (Double-clic pour réinitialiser)"
    >
      {/* Central handle indicator */}
      <div
        className="flex items-center justify-center px-3 py-0.5 rounded-full transition-transform group-hover:scale-110 shadow-xs"
        style={{
          backgroundColor: isDragging
            ? activeTheme.colors.accentText
            : activeTheme.colors.tabInactiveBg,
          color: isDragging ? activeTheme.colors.accent : activeTheme.colors.textSecondary,
        }}
      >
        <GripHorizontal className="w-4 h-2.5" />
      </div>

      {/* Visual drag indicator bar */}
      <div
        className={`absolute inset-x-0 -top-1 -bottom-1 cursor-row-resize ${
          isDragging ? 'pointer-events-auto' : ''
        }`}
      />
    </div>
  );
};
