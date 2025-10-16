/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useMemo, useCallback, useEffect } from 'react';
// FIX: Correct import path
import { useEditor } from '../context/EditorContext';
import VirtualizedList from './VirtualizedList';
// FIX: Correct import path
import { LayerStateSnapshot, ImageLayer } from '../types';

// Set item height to 80px (h-16 is 4rem/64px, p-2 is 0.5rem/8px top and bottom, so 64+16=80)
const ITEM_HEIGHT = 80;
// Add padding to simulate gap between items
const ITEM_PADDING = 8;
// Total item height for virtual list calculation
const TOTAL_ITEM_HEIGHT = ITEM_HEIGHT + ITEM_PADDING;
// Max height for the virtualized container. Adjust as needed.
const CONTAINER_HEIGHT = 400; 

const HistoryItem: React.FC<{ snapshot: LayerStateSnapshot; index: number; isCurrent: boolean; onSelect: (index: number) => void; }> = React.memo(({ snapshot, index, isCurrent, onSelect }) => {
    const file = useMemo(() => {
        // Find the first visible image layer to use as a thumbnail
        return snapshot.layers.find(l => l.type === 'image' && l.isVisible) as ImageLayer | undefined;
    }, [snapshot]);
    
    // Create a memoized URL for the thumbnail. This is important for performance.
    const thumbnailUrl = useMemo(() => {
        if (!file) return '';
        return URL.createObjectURL(file.file);
    }, [file]);

    // Effect to revoke the object URL when the component unmounts, preventing memory leaks.
    useEffect(() => {
        return () => {
            if (thumbnailUrl) URL.revokeObjectURL(thumbnailUrl);
        };
    }, [thumbnailUrl]);

    return (
        <button
            onClick={() => onSelect(index)}
            className={`w-full h-full flex items-center gap-3 p-2 rounded-lg transition-colors ${isCurrent ? 'bg-blue-600/30 border border-blue-500/50' : 'hover:bg-white/5'}`}
            aria-current={isCurrent}
        >
            {thumbnailUrl ? (
                <img src={thumbnailUrl} alt={`History state ${index}`} className="w-16 h-16 object-contain rounded-md bg-black/20 flex-shrink-0" />
            ) : (
                <div className="w-16 h-16 rounded-md bg-black/20 flex-shrink-0 flex items-center justify-center text-gray-500 text-xs">No Preview</div>
            )}
            <div className="text-left">
                <p className={`font-semibold ${isCurrent ? 'text-white' : 'text-gray-300'}`}>
                    {index === 0 ? 'Imagem Original' : `Edição ${index}`}
                </p>
            </div>
        </button>
    );
});


const HistoryPanel: React.FC = () => {
    const { history, historyIndex, jumpToState } = useEditor();

    // Show a message if there are no edits yet.
    if (history.length <= 1) {
        return (
            <div className="text-center text-gray-400 p-4">
                <p>Nenhuma edição foi feita ainda.</p>
            </div>
        );
    }
    
    // The renderItem function passed to VirtualizedList.
    // It's wrapped in useCallback for optimization.
    const renderItem = useCallback(({ index, style }: { index: number; style: React.CSSProperties }) => {
        // History is displayed in reverse order (most recent at the top)
        const reversedIndex = history.length - 1 - index;
        const item = history[reversedIndex];
        
        return (
            <div style={{ ...style, height: `${ITEM_HEIGHT}px`, paddingBottom: `${ITEM_PADDING}px` }} key={reversedIndex}>
                <HistoryItem
                    snapshot={item}
                    index={reversedIndex}
                    isCurrent={reversedIndex === historyIndex}
                    onSelect={jumpToState}
                />
            </div>
        );
    }, [history, historyIndex, jumpToState]);

    const containerHeight = Math.min(CONTAINER_HEIGHT, history.length * TOTAL_ITEM_HEIGHT);

    // The history is displayed in reverse order (most recent at the top)
    return (
        <div className="w-full p-2" style={{ height: `${containerHeight}px` }}>
             <VirtualizedList
                numItems={history.length}
                itemHeight={TOTAL_ITEM_HEIGHT}
                renderItem={renderItem}
                windowHeight={containerHeight}
            />
        </div>
    );
};

export default HistoryPanel;