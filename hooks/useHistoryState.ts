/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import { useState, useCallback, useEffect, useMemo } from 'react';
import { dataURLtoFile, fileToDataURL } from '../utils/imageUtils';

/**
 * @description Manages image editing history (undo/redo stack).
 * @param {() => void} onStateChange - Callback triggered on history changes to clear related editing states (masks, crops, etc.).
 * @returns {object} The history state and actions to manipulate it.
 */
export const useHistoryState = (onStateChange: () => void) => {
  const [history, setHistory] = useState<File[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const [isHistoryLoading, setIsHistoryLoading] = useState<boolean>(false); // Can be used for async loading from IDB in future

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  const currentImage = useMemo(() => history[historyIndex] ?? null, [history, historyIndex]);
  const originalImage = useMemo(() => history[0] ?? null, [history]);

  const addImageToHistory = useCallback((newImageFile: File) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newImageFile);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
    onStateChange();
  }, [history, historyIndex, onStateChange]);
  
  const setInitialImage = useCallback((file: File) => {
      const newHistory = [file];
      setHistory(newHistory);
      setHistoryIndex(0);
      onStateChange();
  }, [onStateChange]);

  const clearHistory = useCallback(() => {
    setHistory([]);
    setHistoryIndex(-1);
    // onStateChange(); // Let the caller decide if UI should clear
  }, []);

  const undo = useCallback(() => {
    if (canUndo) {
      setHistoryIndex(historyIndex - 1);
      onStateChange();
    }
  }, [canUndo, historyIndex, onStateChange]);

  const redo = useCallback(() => {
    if (canRedo) {
      setHistoryIndex(historyIndex + 1);
      onStateChange();
    }
  }, [canRedo, historyIndex, onStateChange]);

  const resetHistory = useCallback(() => {
    if (history.length > 0 && historyIndex > 0) {
        setHistory([history[0]]);
        setHistoryIndex(0);
        onStateChange();
    }
  }, [history, historyIndex, onStateChange]);

  return {
    currentImage,
    originalImage,
    canUndo,
    canRedo,
    isHistoryLoading,
    addImageToHistory,
    setInitialImage,
    clearHistory,
    undo,
    redo,
    resetHistory,
  };
};
