/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useCallback, useRef, useEffect } from 'react';

/**
 * @description Manages the state and event handlers for pan and zoom functionalities.
 * @returns {object} An object containing the pan and zoom state, and actions to manipulate them.
 */
export const usePanAndZoom = () => {
  const [zoom, setZoom] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isPanModeActive, setIsPanModeActive] = useState<boolean>(false);
  const isPanning = useRef(false);
  const panStart = useRef({ x: 0, y: 0 });

  // Refs for touch gestures
  const lastTouchDist = useRef(0);

  // FIX: Changed parameter type from the DOM's TouchList to React.TouchList to match React's event types.
  const getTouchDistance = (touches: React.TouchList) => {
      const touch1 = touches[0];
      const touch2 = touches[1];
      return Math.sqrt(
          Math.pow(touch2.clientX - touch1.clientX, 2) +
          Math.pow(touch2.clientY - touch1.clientY, 2)
      );
  };

  // FIX: Changed parameter type from the DOM's TouchList to React.TouchList to match React's event types.
  const getTouchCenter = (touches: React.TouchList) => {
      const touch1 = touches[0];
      const touch2 = touches[1];
      return { x: (touch1.clientX + touch2.clientX) / 2, y: (touch1.clientY + touch2.clientY) / 2 };
  };

  // Automatically disable pan mode if zoom is reset.
  useEffect(() => {
    if (zoom <= 1) {
      setIsPanModeActive(false);
      setPanOffset({ x: 0, y: 0 });
    }
  }, [zoom]);

  const handlePanMove = useCallback((e: MouseEvent) => {
    if (!isPanning.current) return;
    e.preventDefault();
    setPanOffset({
      x: e.clientX - panStart.current.x,
      y: e.clientY - panStart.current.y,
    });
  }, []);

  const handlePanEnd = useCallback(() => {
    isPanning.current = false;
    window.removeEventListener('mousemove', handlePanMove);
    window.removeEventListener('mouseup', handlePanEnd);
  }, [handlePanMove]);

  const handlePanStart = useCallback((e: React.MouseEvent) => {
    if (!isPanModeActive || e.button !== 0) return;
    e.preventDefault();
    isPanning.current = true;
    panStart.current = {
      x: e.clientX - panOffset.x,
      y: e.clientY - panOffset.y,
    };
    window.addEventListener('mousemove', handlePanMove);
    window.addEventListener('mouseup', handlePanEnd);
  }, [isPanModeActive, panOffset.x, panOffset.y, handlePanMove, handlePanEnd]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
      try {
          if (e.touches.length === 2) {
              e.preventDefault();
              lastTouchDist.current = getTouchDistance(e.touches);
          } else if (e.touches.length === 1 && isPanModeActive) {
              e.preventDefault();
              isPanning.current = true;
              panStart.current = {
                  x: e.touches[0].clientX - panOffset.x,
                  y: e.touches[0].clientY - panOffset.y,
              };
          }
      } catch (err) { /* Silently catch errors */ }
  }, [isPanModeActive, panOffset.x, panOffset.y]);

  const handleTouchMove = useCallback((e: React.TouchEvent, containerRect: DOMRect) => {
      try {
          if (e.touches.length === 2) {
              e.preventDefault();
              if (lastTouchDist.current === 0) return;
              
              const newDist = getTouchDistance(e.touches);
              const distRatio = newDist / lastTouchDist.current;
              lastTouchDist.current = newDist;

              setZoom(prevZoom => {
                  const newZoom = Math.max(1, Math.min(5, prevZoom * distRatio));
                  const center = getTouchCenter(e.touches);
                  const mouseX = center.x - containerRect.left;
                  const mouseY = center.y - containerRect.top;

                  setPanOffset(prevPan => {
                      const imageX = (mouseX - prevPan.x) / prevZoom;
                      const imageY = (mouseY - prevPan.y) / prevZoom;
                      return {
                          x: mouseX - imageX * newZoom,
                          y: mouseY - imageY * newZoom
                      };
                  });

                  return newZoom;
              });
          } else if (e.touches.length === 1 && isPanModeActive && isPanning.current) {
              e.preventDefault();
              setPanOffset({
                  x: e.touches[0].clientX - panStart.current.x,
                  y: e.touches[0].clientY - panStart.current.y,
              });
          }
      } catch (err) { /* Silently catch errors */ }
  }, [isPanModeActive]);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
      isPanning.current = false;
      if (e.touches.length < 2) {
          lastTouchDist.current = 0;
      }
  }, []);

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (e.ctrlKey) {
        e.preventDefault();
        
        const zoomDirection = e.deltaY < 0 ? 1 : -1;
        const zoomStep = 0.2;
        const currentZoom = zoom;
        const newZoom = Math.max(1, Math.min(5, currentZoom + zoomDirection * zoomStep));

        if (newZoom === currentZoom) return;

        const rect = e.currentTarget.getBoundingClientRect();
        
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        const imageX = (mouseX - panOffset.x) / currentZoom;
        const imageY = (mouseY - panOffset.y) / currentZoom;
        
        const newPanX = mouseX - imageX * newZoom;
        const newPanY = mouseY - imageY * newZoom;

        setZoom(newZoom);
        setPanOffset({ x: newPanX, y: newPanY });
    }
  };

  const resetZoomAndPan = useCallback(() => {
    setZoom(1);
    setPanOffset({ x: 0, y: 0 });
    setIsPanModeActive(false);
  }, []);
  
  const isCurrentlyPanning = isPanning.current;

  return { zoom, setZoom, panOffset, isPanModeActive, setIsPanModeActive, handleWheel, handlePanStart, resetZoomAndPan, isCurrentlyPanning, handleTouchStart, handleTouchMove, handleTouchEnd };
};
