/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useMemo, useCallback, useEffect, useRef } from 'react';
import { useEditor } from '../context/EditorContext';
import { LayerStateSnapshot, ImageLayer } from '../types';

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
            className={`flex-shrink-0 flex flex-col items-center gap-2 w-24 p-2 rounded-lg transition-colors ${isCurrent ? 'bg-blue-600/30' : 'hover:bg-white/5'}`}
            aria-current={isCurrent}
        >
            {thumbnailUrl ? (
                <img src={thumbnailUrl} alt={`History state ${index}`} className={`w-20 h-20 object-contain rounded-md bg-black/20 border-2 ${isCurrent ? 'border-blue-500' : 'border-transparent'}`} />
            ) : (
                <div className={`w-20 h-20 rounded-md bg-black/20 flex-shrink-0 flex items-center justify-center text-gray-500 text-xs border-2 ${isCurrent ? 'border-blue-500' : 'border-transparent'}`}>No Preview</div>
            )}
            <p className={`text-xs font-semibold truncate w-full ${isCurrent ? 'text-white' : 'text-gray-300'}`}>
                {index === 0 ? 'Original' : `Edição ${index}`}
            </p>
        </button>
    );
});


const HistoryPanel: React.FC = () => {
    const { history, historyIndex, jumpToState } = useEditor();
    const activeItemRef = useRef<HTMLDivElement>(null);

    // Scroll the active item into view when history changes
    useEffect(() => {
        activeItemRef.current?.scrollIntoView({
            behavior: 'smooth',
            inline: 'center',
            block: 'nearest'
        });
    }, [historyIndex]);

    if (history.length <= 1) {
        return (
            <div className="text-center text-gray-400 p-4">
                <p>Nenhuma edição foi feita ainda.</p>
            </div>
        );
    }
    
    return (
        <div className="p-2">
            <div className="flex gap-3 overflow-x-auto scrollbar-thin pb-2">
                {history.map((snapshot, index) => {
                    const isCurrent = index === historyIndex;
                    return (
                        <div ref={isCurrent ? activeItemRef : null} key={index}>
                            <HistoryItem
                                snapshot={snapshot}
                                index={index}
                                isCurrent={isCurrent}
                                onSelect={jumpToState}
                            />
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default HistoryPanel;