/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState } from 'react';
import { useEditor } from '../../context/EditorContext';
import TipBox from '../common/TipBox';
import LazyIcon from '../LazyIcon';

const ObjectRemoverPanel: React.FC = () => {
    const {
        isLoading,
        maskDataUrl,
        clearMask,
        handleObjectRemove,
        brushSize,
        setBrushSize,
        detectedObjects,
        handleDetectObjects,
        highlightedObject,
        setHighlightedObject,
        handleSelectObject,
        layers,
        activeLayerId,
    } = useEditor();
    
    type SelectionMode = 'brush' | 'magic';
    const [selectionMode, setSelectionMode] = useState<SelectionMode>('brush');
    const [magicObjectPrompt, setMagicObjectPrompt] = useState('');

    const activeLayer = layers.find(l => l.id === activeLayerId);
    const isImageLayerActive = activeLayer?.type === 'image';

    const isRemoveDisabled = isLoading || !maskDataUrl || !isImageLayerActive;

    const switchMode = (mode: SelectionMode) => {
        setSelectionMode(mode);
        clearMask();
        if (detectedObjects) {
            setHighlightedObject(null);
        }
    };

    return (
        <div className="w-full flex flex-col gap-4 animate-fade-in">
            <div className="text-center">
                 <p className="text-sm text-gray-400">
                    Selecione um objeto para remover e a IA irá preencher o espaço de forma inteligente.
                </p>
            </div>

            {/* Seletor de Modo */}
            <div className="flex w-full bg-gray-900/50 border border-gray-600 rounded-lg p-1">
                <button type="button" onClick={() => switchMode('brush')} className={`w-full text-center font-semibold py-2.5 rounded-md transition-all text-sm flex items-center justify-center gap-2 ${selectionMode === 'brush' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-300 hover:bg-gray-700/50'}`}>
                    <LazyIcon name="BrushIcon" className="w-5 h-5" /> Pincel
                </button>
                <button type="button" onClick={() => switchMode('magic')} className={`w-full text-center font-semibold py-2.5 rounded-md transition-all text-sm flex items-center justify-center gap-2 ${selectionMode === 'magic' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-300 hover:bg-gray-700/50'}`}>
                    <LazyIcon name="SparkleIcon" className="w-5 h-5" /> Mágica
                </button>
            </div>
            
            {selectionMode === 'brush' && (
                <div className="animate-fade-in flex flex-col gap-2">
                    <p className="text-xs text-center text-gray-400">Pinte sobre a área que deseja remover.</p>
                    <div className="flex items-center justify-between text-sm">
                        <label htmlFor="brush-size-remover" className="font-medium text-gray-300">Tamanho do Pincel</label>
                        <span className="font-mono text-gray-200">{brushSize}</span>
                    </div>
                    <input id="brush-size-remover" type="range" min="5" max="150" value={brushSize} onChange={e => setBrushSize(Number(e.target.value))} className="w-full" disabled={isLoading} />
                </div>
            )}

            {selectionMode === 'magic' && (
                <div className="animate-fade-in flex flex-col gap-3">
                    <div className="flex gap-2">
                         <input
                            type="text"
                            value={magicObjectPrompt}
                            onChange={(e) => setMagicObjectPrompt(e.target.value)}
                            placeholder="Ex: 'pessoas', 'edifícios'..."
                            className="w-full bg-gray-800 border border-gray-600 rounded-lg p-3 text-base"
                            disabled={isLoading}
                        />
                        <button type="button" onClick={() => handleDetectObjects(magicObjectPrompt)} disabled={isLoading} className="bg-gray-800/50 hover:bg-gray-700/50 text-white font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2">
                            <LazyIcon name="SparkleIcon" className="w-5 h-5" />
                            Detetar
                        </button>
                    </div>
                    {detectedObjects && (
                        <div className="bg-gray-900/30 p-2 rounded-lg border border-gray-700 max-h-40 overflow-y-auto" onMouseLeave={() => setHighlightedObject(null)}>
                            <p className="text-xs text-center text-gray-400 mb-2">Clique num objeto para o selecionar.</p>
                            <ul className="flex flex-wrap gap-2 justify-center">
                                {detectedObjects.length > 0 ? detectedObjects.map((obj, i) => (
                                    <li key={`${obj.label}-${i}`}>
                                        <button
                                            type="button"
                                            onClick={() => handleSelectObject(obj)}
                                            onMouseEnter={() => setHighlightedObject(obj)}
                                            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${highlightedObject === obj ? 'bg-blue-500 text-white' : 'bg-gray-700/50 text-gray-300 hover:bg-gray-600/70'}`}
                                        >
                                            {obj.label}
                                        </button>
                                    </li>
                                )) : <p className="text-sm text-gray-500">Nenhum objeto detetado para '{magicObjectPrompt}'.</p>}
                            </ul>
                        </div>
                    )}
                </div>
            )}
             
            <TipBox>
                Para melhores resultados, selecione todo o objeto que deseja remover, incluindo sua sombra. A Seleção Mágica é mais rápida para objetos bem definidos.
            </TipBox>
            
            <div className="border-t border-gray-700/50 my-1"></div>

            <div className="flex gap-2">
                 <button
                    type="button"
                    onClick={clearMask}
                    disabled={isLoading || !maskDataUrl}
                    className="w-full bg-gray-800/50 hover:bg-gray-700/50 text-white font-semibold py-3 px-4 rounded-lg transition-colors text-sm disabled:opacity-50"
                >
                    Limpar
                </button>
                <button
                    type="button"
                    onClick={handleObjectRemove}
                    className="w-full bg-gradient-to-br from-red-600 to-orange-500 text-white font-bold py-3 px-4 rounded-lg transition-all flex items-center justify-center gap-2 disabled:from-gray-600 disabled:cursor-not-allowed"
                    disabled={isRemoveDisabled}
                >
                    <LazyIcon name="EraserIcon" className={`w-5 h-5 ${isLoading ? 'animate-pulse' : ''}`} />
                    {isLoading ? 'Removendo...' : 'Remover'}
                </button>
            </div>
        </div>
    );
};

export default ObjectRemoverPanel;