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

  return { zoom, setZoom, panOffset, isPanModeActive, setIsPanModeActive, handleWheel, handlePanStart, resetZoomAndPan, isCurrentlyPanning };
};