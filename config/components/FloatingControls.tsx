/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useEffect } from 'react';
import { useEditor } from '../../context/EditorContext';
import LazyIcon from './LazyIcon';

const FloatingControls: React.FC = () => {
    const {
        zoom,
        setZoom,
        isPanModeActive,
        setIsPanModeActive,
        resetZoomAndPan,
        isLeftPanelVisible,
        isRightPanelVisible,
    } = useEditor();

    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 1024);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // On mobile, hide controls when a panel is open to avoid clutter
    if (isMobile && (isLeftPanelVisible || isRightPanelVisible)) {
        return null;
    }

    const handleZoomIn = () => setZoom(prev => Math.min(5, prev + 0.2));
    const handleZoomOut = () => setZoom(prev => Math.max(1, prev - 0.2));

    const handleZoomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setZoom(Number(e.target.value));
    };

    const zoomPercentage = Math.round(zoom * 100);

    return (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 bg-gray-900/70 backdrop-blur-sm border border-gray-700/50 p-2 flex items-center justify-center gap-4 rounded-lg shadow-lg">
            <button
                onClick={() => setIsPanModeActive(!isPanModeActive)}
                disabled={zoom <= 1}
                className={`p-2 rounded-md transition-colors ${isPanModeActive ? 'bg-blue-600 text-white' : 'bg-gray-700/50 hover:bg-gray-600/50'} disabled:opacity-50 disabled:cursor-not-allowed`}
                title={isPanModeActive ? "Desativar Modo Mão" : "Ativar Modo Mão (Pan)"}
                aria-pressed={isPanModeActive}
            >
                <LazyIcon name="HandIcon" className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 text-white">
                <button onClick={handleZoomOut} disabled={zoom <= 1} className="p-2 rounded-full transition-colors bg-gray-700/50 hover:bg-gray-600/50 disabled:opacity-50 disabled:cursor-not-allowed" title="Reduzir Zoom">
                  <LazyIcon name="ZoomOutIcon" className="w-5 h-5 text-gray-300" />
                </button>
                <input
                    type="range"
                    min="1"
                    max="5"
                    step="0.1"
                    value={zoom}
                    onChange={handleZoomChange}
                    className="w-24 md:w-32"
                    aria-label="Zoom"
                />
                <button onClick={handleZoomIn} disabled={zoom >= 5} className="p-2 rounded-full transition-colors bg-gray-700/50 hover:bg-gray-600/50 disabled:opacity-50 disabled:cursor-not-allowed" title="Aumentar Zoom">
                  <LazyIcon name="ZoomInIcon" className="w-5 h-5 text-gray-300" />
                </button>
            </div>

            <div className="text-sm font-mono text-white w-16 text-center border-l border-r border-gray-600 px-2">{zoomPercentage}%</div>
            
            <button
                onClick={resetZoomAndPan}
                className="text-sm font-semibold text-gray-300 hover:text-white px-3 py-1.5 rounded-md bg-gray-700/50 hover:bg-gray-600/50 transition-colors"
                title="Ajustar imagem à tela"
            >
                Ajustar
            </button>
        </div>
    );
};

export default FloatingControls;