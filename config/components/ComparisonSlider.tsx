/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useRef, useCallback } from 'react';
import LazyIcon from './LazyIcon';

interface ComparisonSliderProps {
  originalSrc: string;
  modifiedSrc: string;
  filterStyle?: string;
}

const ComparisonSlider: React.FC<ComparisonSliderProps> = ({ originalSrc, modifiedSrc, filterStyle }) => {
  const [sliderPosition, setSliderPosition] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  const handleMove = useCallback((clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    const percent = (x / rect.width) * 100;
    setSliderPosition(percent);
  }, []);

  const handleInteractionMove = useCallback((e: MouseEvent | TouchEvent) => {
      if (!isDragging.current) return;
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      handleMove(clientX);
  }, [handleMove]);

  const handleInteractionEnd = useCallback(() => {
    if (!isDragging.current) return;
    isDragging.current = false;
    document.body.style.cursor = '';
    window.removeEventListener('mousemove', handleInteractionMove);
    window.removeEventListener('mouseup', handleInteractionEnd);
    window.removeEventListener('touchmove', handleInteractionMove);
    window.removeEventListener('touchend', handleInteractionEnd);
  }, [handleInteractionMove]);

  const handleInteractionStart = useCallback((clientX: number) => {
    isDragging.current = true;
    document.body.style.cursor = 'ew-resize';
    handleMove(clientX);
    window.addEventListener('mousemove', handleInteractionMove);
    window.addEventListener('mouseup', handleInteractionEnd);
    window.addEventListener('touchmove', handleInteractionMove);
    window.addEventListener('touchend', handleInteractionEnd);
  }, [handleMove, handleInteractionMove, handleInteractionEnd]);

  // Mouse event for starting drag
  const onMouseDown = (e: React.MouseEvent) => {
      e.preventDefault();
      handleInteractionStart(e.clientX);
  }
  
  // Touch event for starting drag
  const onTouchStart = (e: React.TouchEvent) => {
      e.preventDefault();
      handleInteractionStart(e.touches[0].clientX);
  }

  // Clean up listeners on unmount
  React.useEffect(() => {
      return () => {
          handleInteractionEnd();
      }
  }, [handleInteractionEnd]);

  return (
    <div
      ref={containerRef}
      className="relative w-full max-w-full max-h-full aspect-auto select-none overflow-hidden rounded-lg cursor-ew-resize"
      onMouseDown={onMouseDown}
      onTouchStart={onTouchStart}
    >
      {/* Modified Image (After) */}
      <img
        src={modifiedSrc}
        alt="Modificado"
        draggable={false}
        className="block w-full h-auto max-h-full object-contain"
        style={{ filter: filterStyle, transition: 'filter 0.15s linear' }}
      />
      <div className="absolute top-2 right-2 bg-black/50 text-white text-xs font-bold uppercase tracking-wider px-2 py-1 rounded-md pointer-events-none z-10">Depois</div>

      {/* Original Image (Before) */}
      <div
        className="absolute top-0 left-0 h-full w-full overflow-hidden"
        style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
      >
        <img
          src={originalSrc}
          alt="Original"
          draggable={false}
          className="block w-full h-auto max-h-full object-contain"
        />
        <div className="absolute top-2 left-2 bg-black/50 text-white text-xs font-bold uppercase tracking-wider px-2 py-1 rounded-md pointer-events-none z-10">Antes</div>
      </div>
      
      {/* Slider Handle */}
      <div
        className="absolute top-0 h-full w-1 bg-white/70 pointer-events-none group"
        style={{ left: `calc(${sliderPosition}% - 0.5px)` }}
        aria-hidden="true"
      >
        <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 bg-white rounded-full p-1.5 shadow-lg border-2 border-gray-800 transition-transform group-hover:scale-110">
          <LazyIcon name="CompareArrowsIcon" className="w-5 h-5 text-gray-800" />
        </div>
      </div>
    </div>
  );
};

export default ComparisonSlider;