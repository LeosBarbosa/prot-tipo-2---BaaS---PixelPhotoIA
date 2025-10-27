/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState } from 'react';
import { useEditor } from '../../../context/EditorContext';
import TipBox from '../common/TipBox';
import LazyIcon from '../LazyIcon';

const PixelArtPanel: React.FC = () => {
    const { isLoading, handleApplyStyle } = useEditor();
    const [pixelSize, setPixelSize] = useState(2); // 1: 8-bit, 2: 16-bit, 3: 32-bit
    const [colorPalette, setColorPalette] = useState(16);

    const pixelSizeMap: { [key: number]: string } = {
        1: '8-bit (pixels grandes)',
        2: '16-bit (pixels médios)',
        3: '32-bit (pixels pequenos)',
    };

    const handleApply = () => {
        const sizeDescription = pixelSizeMap[pixelSize];
        const prompt = `Estilo pixel art de ${sizeDescription}, com uma paleta de cores limitada a aproximadamente ${colorPalette} cores.`;
        handleApplyStyle(prompt, true); 
    };

    return (
        <div className="w-full bg-gray-800/50 rounded-lg flex flex-col items-center gap-6 animate-fade-in backdrop-blur-sm">
            <div className="text-center">
                <h3 className="text-xl font-bold text-gray-100">Estilo Pixel Art</h3>
                <p className="text-sm text-gray-400 mt-1">Transforme sua foto em arte de videogame retrô.</p>
            </div>
            
            <div className="w-full border-t border-gray-700/50 my-2"></div>
            
            <div className="w-full space-y-4">
                <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium text-gray-300 flex justify-between">
                        <span>Tamanho do Pixel</span>
                        <span className="text-white font-mono">{pixelSizeMap[pixelSize]}</span>
                    </label>
                    <input
                        type="range"
                        min="1"
                        max="3"
                        step="1"
                        value={pixelSize}
                        onChange={(e) => setPixelSize(Number(e.target.value))}
                        disabled={isLoading}
                        className="w-full"
                    />
                </div>
                <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium text-gray-300 flex justify-between">
                        <span>Paleta de Cores</span>
                        <span className="text-white font-mono">{colorPalette} cores</span>
                    </label>
                    <input
                        type="range"
                        min="4"
                        max="64"
                        step="4"
                        value={colorPalette}
                        onChange={(e) => setColorPalette(Number(e.target.value))}
                        disabled={isLoading}
                        className="w-full"
                    />
                </div>
            </div>

            <TipBox>
                Ajuste o tamanho do pixel e a paleta de cores para customizar o efeito. Menos cores e pixels maiores criam um visual mais retrô.
            </TipBox>

            <button
                onClick={handleApply}
                disabled={isLoading}
                className="w-full mt-4 bg-gradient-to-br from-gray-500 to-slate-600 text-white font-bold py-4 px-6 rounded-lg transition-all duration-300 ease-in-out shadow-lg shadow-slate-500/20 hover:shadow-xl hover:shadow-slate-500/40 hover:-translate-y-px active:scale-95 text-base disabled:from-gray-600 disabled:shadow-none disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
                <LazyIcon name="PixelsIcon" className="w-5 h-5" />
                Aplicar Estilo Pixel Art
            </button>
        </div>
    );
};

export default PixelArtPanel;