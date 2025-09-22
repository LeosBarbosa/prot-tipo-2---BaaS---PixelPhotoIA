/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useMemo } from 'react';
import { useEditor } from '../context/EditorContext';

const HistoryItem: React.FC<{ file: File; index: number; isCurrent: boolean; onSelect: (index: number) => void; }> = React.memo(({ file, index, isCurrent, onSelect }) => {
    const thumbnailUrl = useMemo(() => URL.createObjectURL(file), [file]);

    return (
        <button
            onClick={() => onSelect(index)}
            className={`w-full flex items-center gap-3 p-2 rounded-lg transition-colors ${isCurrent ? 'bg-blue-600/30' : 'hover:bg-white/5'}`}
            aria-current={isCurrent}
        >
            <img src={thumbnailUrl} alt={`History state ${index}`} className="w-16 h-16 object-contain rounded-md bg-black/20 flex-shrink-0" />
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

    if (history.length <= 1) {
        return (
            <div className="text-center text-gray-400 p-4">
                Nenhum histórico de edição ainda.
            </div>
        );
    }

    return (
        <div className="w-full flex flex-col gap-2 p-2">
            {history.map((file, index) => (
                 <HistoryItem
                    key={`${file.name}-${file.lastModified}-${index}`}
                    file={file}
                    index={index}
                    isCurrent={index === historyIndex}
                    onSelect={jumpToState}
                />
            )).reverse()}
        </div>
    );
};

export default HistoryPanel;