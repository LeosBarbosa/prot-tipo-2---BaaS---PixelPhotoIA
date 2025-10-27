/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useEffect } from 'react';
import { useEditor } from '../../context/EditorContext';
import { type Layer, type BlendMode } from '../../types';
import LazyIcon from './LazyIcon';

const blendModes: BlendMode[] = [
    'normal', 'multiply', 'screen', 'overlay', 'darken', 'lighten', 
    'color-dodge', 'color-burn', 'hard-light', 'soft-light', 
    'difference', 'exclusion', 'hue', 'saturation', 'color', 'luminosity'
];

const LayersPanel: React.FC = () => {
    const { 
        layers, 
        activeLayerId, 
        setActiveLayerId, 
        toggleLayerVisibility, 
        deleteLayer, 
        updateLayer,
        mergeDownLayer,
        moveLayerUp,
        moveLayerDown,
        reorderLayer,
        addPlaceholderLayer,
        activeTool,
    } = useEditor();

    const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
    const [dropTargetIndex, setDropTargetIndex] = useState<number | null>(null);
    const [showPlaceholderGenerator, setShowPlaceholderGenerator] = useState(false);
    const [placeholderPrompt, setPlaceholderPrompt] = useState('');

    const activeLayer = layers.find(l => l.id === activeLayerId);
    
    const handleDragStart = (e: React.DragEvent<HTMLDivElement>, index: number) => {
        setDraggedIndex(index);
        e.dataTransfer.effectAllowed = 'move';
        // Use a transparent image for the drag ghost to have more control
        const crt = e.currentTarget.cloneNode(true) as HTMLElement;
        crt.style.opacity = '0.5';
        document.body.appendChild(crt);
        e.dataTransfer.setDragImage(crt, 20, 20);
        setTimeout(() => document.body.removeChild(crt), 0);
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>, index: number) => {
        e.preventDefault();
        if (draggedIndex === null || draggedIndex === index) {
            setDropTargetIndex(null);
            return;
        };
        
        const rect = e.currentTarget.getBoundingClientRect();
        const isAfter = e.clientY > rect.top + rect.height / 2;
        
        // In the UI, a higher index means it's visually lower on the list.
        const targetIndex = isAfter ? index + 1 : index;
        
        if (targetIndex !== dropTargetIndex) {
            setDropTargetIndex(targetIndex);
        }
    };

    const handleDrop = () => {
        if (draggedIndex !== null && dropTargetIndex !== null) {
            // Convert UI indices to original array indices
            const originalDraggedIndex = layers.length - 1 - draggedIndex;
            
            // Adjust drop index based on original drag position
            let originalDropIndex = layers.length - dropTargetIndex;
            if(originalDraggedIndex < originalDropIndex) {
                originalDropIndex -= 1;
            }

            reorderLayer(originalDraggedIndex, originalDropIndex);
        }
        setDraggedIndex(null);
        setDropTargetIndex(null);
    };
    
    const handleDragEnd = () => {
        setDraggedIndex(null);
        setDropTargetIndex(null);
    };

    const getDefaultPrompt = () => {
        switch(activeTool) {
            case 'characterDesign': return 'personagem de fantasia';
            case 'productPhotography': return 'um produto em fundo branco';
            case 'logoGen': return 'logotipo abstrato';
            default: return 'um objeto interessante';
        }
    };

    useEffect(() => {
        if (showPlaceholderGenerator) {
            setPlaceholderPrompt(getDefaultPrompt());
        }
    }, [showPlaceholderGenerator, activeTool]);


    const handleGeneratePlaceholder = async () => {
        if (!placeholderPrompt.trim()) return;
        await addPlaceholderLayer(placeholderPrompt);
        setShowPlaceholderGenerator(false);
    };

    return (
        <div className="bg-gray-800/50 p-3">
            <h3 className="text-md font-bold text-white mb-3 px-1 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <LazyIcon name="LayersIcon" className="w-5 h-5" />
                    Camadas
                </div>
            </h3>

            {activeLayer && (
                <div className="bg-gray-900/30 rounded-md p-2 mb-2 space-y-2 border border-gray-700/50">
                    <div>
                        <input
                            type="text"
                            value={activeLayer.name}
                            onChange={(e) => updateLayer(activeLayer.id, { name: e.target.value })}
                            className="w-full bg-gray-700/50 border border-gray-600 rounded p-1 text-xs text-white"
                            aria-label="Nome da Camada"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        <select 
                            value={activeLayer.blendMode}
                            onChange={(e) => updateLayer(activeLayer.id, { blendMode: e.target.value as BlendMode })}
                            className="w-full bg-gray-700/50 border border-gray-600 rounded p-1 text-xs text-white"
                            aria-label="Modo de Mesclagem"
                        >
                            {blendModes.map(mode => (
                                <option key={mode} value={mode}>{mode.charAt(0).toUpperCase() + mode.slice(1)}</option>
                            ))}
                        </select>
                        <div className="relative">
                            <input
                                type="range"
                                min="0"
                                max="100"
                                value={activeLayer.opacity}
                                onChange={(e) => updateLayer(activeLayer.id, { opacity: parseInt(e.target.value, 10) })}
                                className="w-full"
                                aria-label="Opacidade da Camada"
                            />
                            <span className="absolute -bottom-3 right-0 text-xs text-gray-400">{activeLayer.opacity}%</span>
                        </div>
                    </div>
                </div>
            )}
            
            <div className="space-y-1 max-h-48 overflow-y-auto scrollbar-thin pr-1" onDragLeave={() => setDropTargetIndex(null)}>
                {layers.slice().reverse().map((layer, index) => {
                    const isLayerActive = layer.id === activeLayerId;
                    const isBeingDragged = index === draggedIndex;
                    
                    return (
                        <React.Fragment key={layer.id}>
                            {dropTargetIndex === index && <div className="h-1 bg-blue-500 rounded-full" />}
                            <div
                                draggable
                                onDragStart={(e) => handleDragStart(e, index)}
                                onDragOver={(e) => handleDragOver(e, index)}
                                onDrop={handleDrop}
                                onDragEnd={handleDragEnd}
                                onClick={() => setActiveLayerId(layer.id)}
                                className={`flex items-center justify-between gap-2 p-2 rounded-md cursor-pointer transition-all border ${isLayerActive ? 'bg-blue-600/40 border-blue-500' : 'hover:bg-white/10 border-transparent'} ${isBeingDragged ? 'opacity-30' : ''}`}
                            >
                                <div className="flex items-center gap-2">
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); toggleLayerVisibility(layer.id); }}
                                        className="text-gray-300 hover:text-white"
                                        aria-label={layer.isVisible ? "Ocultar camada" : "Mostrar camada"}
                                    >
                                        <LazyIcon name="EyeIcon" className={`w-5 h-5 ${layer.isVisible ? '' : 'opacity-40'}`} />
                                    </button>
                                    <div className={`text-sm font-semibold truncate ${layer.isVisible ? 'text-white' : 'text-gray-500 italic'}`}>
                                        {layer.name}
                                    </div>
                                </div>
                                <div className={`flex items-center gap-3 text-xs font-medium ${layer.isVisible ? 'text-gray-400' : 'text-gray-600'}`}>
                                    <span className="uppercase">{layer.blendMode}</span>
                                    <span>{layer.opacity}%</span>
                                </div>
                            </div>
                        </React.Fragment>
                    );
                })}
                 {dropTargetIndex === layers.length && <div className="h-1 bg-blue-500 rounded-full" />}
            </div>

            <div className="flex items-center justify-between pt-2 mt-2 border-t border-gray-700/50">
                <div className="flex gap-2">
                    <button onClick={() => deleteLayer(activeLayerId)} disabled={!activeLayerId || layers.length <= 1} className="text-xs p-1 px-2 rounded bg-red-800/50 hover:bg-red-700/50 text-red-300 disabled:opacity-50">Excluir</button>
                    <button onClick={() => setShowPlaceholderGenerator(true)} className="text-xs p-1 px-2 rounded bg-purple-800/50 hover:bg-purple-700/50 text-purple-300 flex items-center gap-1">
                        <LazyIcon name="SparkleIcon" className="w-4 h-4"/> Gerar
                    </button>
                </div>
                <div className="flex items-center gap-1">
                    <button onClick={() => mergeDownLayer(activeLayerId)} disabled={!activeLayerId || layers.findIndex(l => l.id === activeLayerId) === 0} className="text-xs p-1 px-2 rounded bg-white/10 hover:bg-white/20 disabled:opacity-50">Mesclar</button>
                    <div className="flex gap-1">
                        <button onClick={() => moveLayerDown(activeLayerId)} disabled={!activeLayerId} className="p-1 rounded bg-white/10 hover:bg-white/20 disabled:opacity-50"><LazyIcon name="UndoIcon" className="w-4 h-4 transform rotate-90"/></button>
                        <button onClick={() => moveLayerUp(activeLayerId)} disabled={!activeLayerId} className="p-1 rounded bg-white/10 hover:bg-white/20 disabled:opacity-50"><LazyIcon name="RedoIcon" className="w-4 h-4 transform -rotate-90" /></button>
                    </div>
                </div>
            </div>

            {showPlaceholderGenerator && (
                <div 
                    className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
                    onClick={() => setShowPlaceholderGenerator(false)}
                >
                    <div 
                        className="w-full max-w-sm bg-gray-800/80 backdrop-blur-lg rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-gray-700 animate-zoom-rise"
                        onClick={e => e.stopPropagation()}
                    >
                        <header className="flex items-center justify-between p-4 border-b border-gray-700">
                            <h2 className="text-lg font-bold text-white flex items-center gap-2">
                                <LazyIcon name="SparkleIcon" className="w-6 h-6 text-purple-400" />
                                Gerar Placeholder
                            </h2>
                            <button onClick={() => setShowPlaceholderGenerator(false)} className="text-gray-400 hover:text-white transition-colors">
                                <LazyIcon name="CloseIcon" className="w-6 h-6" />
                            </button>
                        </header>
                        <div className="p-6 space-y-4">
                            <div>
                                <label htmlFor="placeholder-prompt" className="block text-sm font-medium text-gray-300 mb-2">Descreva o objeto</label>
                                <input
                                    id="placeholder-prompt"
                                    type="text"
                                    value={placeholderPrompt}
                                    onChange={(e) => setPlaceholderPrompt(e.target.value)}
                                    className="w-full bg-gray-900/50 border border-gray-600 rounded-lg p-3 text-base text-white"
                                    placeholder="Ex: um personagem de fantasia"
                                />
                                <p className="mt-1 text-xs text-gray-400">Um fundo transparente será adicionado automaticamente.</p>
                            </div>
                        </div>
                        <footer className="p-4 bg-gray-900/30 border-t border-gray-700/50 flex justify-end gap-3">
                            <button onClick={() => setShowPlaceholderGenerator(false)} className="bg-gray-700/60 hover:bg-gray-600/80 text-white font-semibold py-2 px-4 rounded-md transition-colors text-sm">
                                Cancelar
                            </button>
                            <button onClick={handleGeneratePlaceholder} className="bg-purple-600 hover:bg-purple-500 text-white font-bold py-2 px-4 rounded-md transition-colors text-sm">
                                Gerar
                            </button>
                        </footer>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LayersPanel;