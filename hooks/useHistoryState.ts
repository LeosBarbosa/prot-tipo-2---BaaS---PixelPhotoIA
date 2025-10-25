/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import { useState, useCallback } from 'react';
import { type Layer, type LayerStateSnapshot, type ToolId, type ImageLayer, type ToolHistoryItem } from '../types';

const MAX_HISTORY_SIZE = 50;

export const useHistoryState = (initialFile: File | null) => {
    const createInitialState = (file: File): LayerStateSnapshot => {
        const initialLayer: ImageLayer = {
            id: 'base',
            name: 'Fundo',
            type: 'image',
            isVisible: true,
            opacity: 100,
            blendMode: 'normal',
            file: file,
        };
        return {
            layers: [initialLayer],
            activeLayerId: 'base',
            toolHistory: [],
        };
    };

    const initialHistory = initialFile ? [createInitialState(initialFile)] : [];
    const [history, setHistory] = useState<LayerStateSnapshot[]>(initialHistory);
    const [historyIndex, setHistoryIndex] = useState<number>(initialFile ? 0 : -1);

    const canUndo = historyIndex > 0;
    const canRedo = historyIndex < history.length - 1;
    const currentState = history[historyIndex];

    const commitChange = useCallback((layers: Layer[], activeLayerId: string | null, toolId: ToolId, params?: any) => {
        const currentToolHistory = currentState?.toolHistory || [];
        const newToolHistory: ToolHistoryItem[] = [...currentToolHistory, { toolId, params }];

        const newState: LayerStateSnapshot = { layers, activeLayerId, toolHistory: newToolHistory };
        
        const newHistory = history.slice(0, historyIndex + 1);
        newHistory.push(newState);
        
        if (newHistory.length > MAX_HISTORY_SIZE) {
            const removed = newHistory.shift();
             // Clean up blobs from removed history states to prevent memory leaks
            if (removed) {
                removed.layers.forEach(layer => {
                    if (layer.type === 'image' && (layer as ImageLayer).file) {
                        // This assumes the file is represented by a blob URL that needs revoking
                        // If it's a direct File object, this is not strictly necessary but good practice
                        const fileUrl = URL.createObjectURL((layer as ImageLayer).file);
                        URL.revokeObjectURL(fileUrl);
                    }
                });
            }
            setHistory(newHistory);
            setHistoryIndex(newHistory.length - 1);
        } else {
            setHistory(newHistory);
            setHistoryIndex(historyIndex + 1);
        }
    }, [history, historyIndex, currentState]);
    
    const undo = useCallback(() => {
        if (canUndo) {
            setHistoryIndex(historyIndex - 1);
        }
    }, [canUndo, historyIndex]);

    const redo = useCallback(() => {
        if (canRedo) {
            setHistoryIndex(historyIndex + 1);
        }
    }, [canRedo, historyIndex]);
    
    const jumpToState = useCallback((index: number) => {
        if (index >= 0 && index < history.length) {
            setHistoryIndex(index);
        }
    }, [history.length]);

    const resetHistory = useCallback((file?: File) => {
        if (file) {
            const initialState = createInitialState(file);
            setHistory([initialState]);
            setHistoryIndex(0);
        } else {
            setHistory([]);
            setHistoryIndex(-1);
        }
    }, []);

    return {
        history,
        historyIndex,
        currentState,
        canUndo,
        canRedo,
        commitChange,
        undo,
        redo,
        jumpToState,
        resetHistory,
        toolHistory: currentState?.toolHistory || [],
    };
};
