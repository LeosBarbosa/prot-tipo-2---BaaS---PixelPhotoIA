/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState } from 'react';
import { useEditor } from '../../context/EditorContext';
import TipBox from '../common/TipBox';
import LazyIcon from '../LazyIcon';

const SharpenPanel: React.FC = () => {
    const { isLoading, handleApplySharpen, layers, activeLayerId } = useEditor();
    const [intensity, setIntensity] = useState(50);
    
    const activeLayer = layers.find(l => l.id === activeLayerId);
    const isDisabled = isLoading || !activeLayer || activeLayer.type !== 'image';

    const handleApply = () => {
        handleApplySharpen(intensity);
    };

    return (
        <div className="w-full bg-gray-800/50 rounded-lg flex flex-col items-center gap-6 animate-fade-in backdrop-blur-sm">
            <div className="text-center">
                <h3 className="text-xl font-bold text-gray-100">Nitidez Generativa</h3>
                <p className="text-sm text-gray-400 mt-1">Realce detalhes e contornos com nitidez inteligente de IA.</p>
            </div>
            
            <div className="w-full border-t border-gray-700/50 my-2"></div>

            <div className="flex flex-col gap-2 w-full">
                <label className="text-sm font-medium text-gray-300 flex justify-between">
                    <span>Intensidade</span>
                    <span className="text-white font-mono">{intensity}%</span>
                </label>
                <input
                    type="range"
                    min="0"
                    max="100"
                    step="1"
                    value={intensity}
                    onChange={(e) => setIntensity(Number(e.target.value))}
                    disabled={isLoading}
                    className="w-full"
                />
            </div>

            <TipBox>
                O motor de nitidez de IA aplica micro-ajustes para realçar texturas sem criar artefatos visuais duros (halos). Use um valor menor para fotos já nítidas.
            </TipBox>

            <button
                onClick={handleApply}
                disabled={isDisabled}
                className="w-full mt-4 bg-gradient-to-br from-cyan-600 to-sky-500 text-white font-bold py-4 px-6 rounded-lg transition-all duration-300 ease-in-out shadow-lg shadow-cyan-500/20 hover:shadow-xl hover:shadow-cyan-500/40 hover:-translate-y-px active:scale-95 text-base disabled:from-gray-600 disabled:shadow-none disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
                <LazyIcon name="SharpenIcon" className={`w-5 h-5 ${isLoading ? 'animate-pulse' : ''}`} />
                {isLoading ? 'Aplicando...' : 'Aplicar Nitidez'}
            </button>
        </div>
    );
};

export default SharpenPanel;