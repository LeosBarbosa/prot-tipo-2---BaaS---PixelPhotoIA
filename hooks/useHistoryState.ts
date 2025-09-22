/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import { useState, useCallback, useMemo } from 'react';

/**
 * @description Manages image editing history (undo/redo stack).
 * @param {(newImage?: File) => void} onStateChange - Callback triggered on history changes to clear related editing states (masks, crops, etc.).
 * @returns {object} The history state and actions to manipulate it.
 */
export const useHistoryState = (onStateChange: (newImage?: File) => void) => {
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
    onStateChange(newImageFile);
  }, [history, historyIndex, onStateChange]);
  
  const setInitialImage = useCallback((file: File) => {
      const newHistory = [file];
      setHistory(newHistory);
      setHistoryIndex(0);
      onStateChange(file);
  }, [onStateChange]);

  const clearHistory = useCallback(() => {
    setHistory([]);
    setHistoryIndex(-1);
    onStateChange();
  }, [onStateChange]);

  const undo = useCallback(() => {
    if (canUndo) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      onStateChange(history[newIndex]);
    }
  }, [canUndo, history, historyIndex, onStateChange]);

  const redo = useCallback(() => {
    if (canRedo) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      onStateChange(history[newIndex]);
    }
  }, [canRedo, history, historyIndex, onStateChange]);

  const resetHistory = useCallback(() => {
    if (history.length > 0 && historyIndex > 0) {
        const original = history[0];
        setHistory([original]);
        setHistoryIndex(0);
        onStateChange(original);
    }
  }, [history, historyIndex, onStateChange]);

  const jumpToState = useCallback((index: number) => {
      if (index >= 0 && index < history.length) {
          setHistoryIndex(index);
          onStateChange(history[index]);
      }
  }, [history, onStateChange]);

  return {
    currentImage,
    originalImage,
    canUndo,
    canRedo,
    isHistoryLoading,
    history,
    historyIndex,
    addImageToHistory,
    setInitialImage,
    clearHistory,
    undo,
    redo,
    resetHistory,
    jumpToState,
  };
};