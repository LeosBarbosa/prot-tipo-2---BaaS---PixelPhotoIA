/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React from 'react';
import { useEditor } from '../context/EditorContext';
import { HandIcon, ZoomInIcon, ZoomOutIcon } from './icons';

const FloatingControls: React.FC = () => {
    const {
        zoom,
        setZoom,
        isPanModeActive,
        setIsPanModeActive,
        resetZoomAndPan,
    } = useEditor();

    const handleZoomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setZoom(Number(e.target.value));
    };

    const zoomPercentage = Math.round(zoom * 100);

    return (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 bg-gray-900/70 backdrop-blur-sm border border-gray-600 rounded-lg p-2 shadow-2xl animate-fade-in">
            <button
                onClick={() => setIsPanModeActive(!isPanModeActive)}
                disabled={zoom <= 1}
                className={`p-2 rounded-md transition-colors ${isPanModeActive ? 'bg-blue-600 text-white' : 'bg-gray-700/50 hover:bg-gray-600/50'} disabled:opacity-50 disabled:cursor-not-allowed`}
                title={isPanModeActive ? "Desativar Modo Mão" : "Ativar Modo Mão (Pan)"}
                aria-pressed={isPanModeActive}
            >
                <HandIcon className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 text-white px-2">
                <ZoomOutIcon className="w-5 h-5 text-gray-400" />
                <input
                    type="range"
                    min="1"
                    max="5"
                    step="0.1"
                    value={zoom}
                    onChange={handleZoomChange}
                    className="w-32 mx-1"
                    aria-label="Zoom"
                />
                <ZoomInIcon className="w-5 h-5 text-gray-400" />
            </div>

            <div className="text-sm font-mono text-white w-16 text-center border-l border-r border-gray-600 px-2">{zoomPercentage}%</div>
            
            <button
                onClick={resetZoomAndPan}
                className="text-sm font-semibold text-gray-300 hover:text-white px-3 py-1.5 rounded-md bg-gray-700/50 hover:bg-gray-600/50 transition-colors"
            >
                Ajustar
            </button>
        </div>
    );
};

export default FloatingControls;