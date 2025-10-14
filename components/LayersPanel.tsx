/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React from 'react';
// FIX: Correct import path
import { useEditor } from '../context/EditorContext';
import { EyeIcon, LayersIcon, RedoIcon, UndoIcon } from './icons';
// FIX: Correct import path
import { type Layer, type BlendMode } from '../types';

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
    } = useEditor();

    const activeLayer = layers.find(l => l.id === activeLayerId);

    return (
        <div className="bg-gray-800/50 p-3">
            <h3 className="text-md font-bold text-white mb-3 px-1 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <LayersIcon className="w-5 h-5" />
                    Camadas
                </div>
                <div className="flex items-center gap-2">
                    {/* Placeholder for future add/group buttons */}
                </div>
            </h3>

            {activeLayer && (
                <div className="bg-gray-900/30 rounded-md p-2 mb-2 space-y-2 border border-gray-700/50">
                    <div className="grid grid-cols-2 gap-2">
                        <select 
                            value={activeLayer.blendMode}
                            onChange={(e) => updateLayer(activeLayer.id, { blendMode: e.target.value as BlendMode })}
                            className="w-full bg-gray-700/50 border border-gray-600 rounded p-1 text-xs text-white"
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
                            />
                            <span className="absolute -bottom-3 right-0 text-xs text-gray-400">{activeLayer.opacity}%</span>
                        </div>
                    </div>
                </div>
            )}
            
            <div className="space-y-1 max-h-48 overflow-y-auto scrollbar-thin pr-1">
                {layers.slice().reverse().map((layer, index) => {
                    const isLayerActive = layer.id === activeLayerId;
                    return (
                        <div
                            key={layer.id}
                            onClick={() => setActiveLayerId(layer.id)}
                            className={`flex items-center justify-between gap-2 p-2 rounded-md cursor-pointer transition-colors border ${isLayerActive ? 'bg-blue-600/40 border-blue-500' : 'hover:bg-white/10 border-transparent'}`}
                        >
                            <div className="flex items-center gap-2">
                                <button 
                                    onClick={(e) => { e.stopPropagation(); toggleLayerVisibility(layer.id); }}
                                    className="text-gray-300 hover:text-white"
                                >
                                    <EyeIcon className={`w-5 h-5 ${layer.isVisible ? '' : 'opacity-40'}`} />
                                </button>
                                <div className={`text-sm font-semibold ${layer.isVisible ? 'text-white' : 'text-gray-500 italic'}`}>
                                    {layer.name}
                                </div>
                            </div>
                            <div className={`flex items-center gap-3 text-xs font-medium ${layer.isVisible ? 'text-gray-400' : 'text-gray-600'}`}>
                                <span className="uppercase">
                                    {layer.blendMode.toUpperCase()}
                                </span>
                                <span>{layer.opacity}%</span>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="flex items-center justify-between pt-2 mt-2 border-t border-gray-700/50">
                 <button onClick={() => deleteLayer(activeLayerId!)} disabled={!activeLayerId || layers.length <= 1} className="text-xs p-1 px-2 rounded bg-red-800/50 hover:bg-red-700/50 text-red-300 disabled:opacity-50">Excluir</button>
                 <button onClick={() => mergeDownLayer(activeLayerId!)} disabled={!activeLayerId} className="text-xs p-1 px-2 rounded bg-white/10 hover:bg-white/20 disabled:opacity-50">Mesclar Abaixo</button>
                 <div className="flex gap-1">
                    <button onClick={() => moveLayerDown(activeLayerId!)} disabled={!activeLayerId} className="p-1 rounded bg-white/10 hover:bg-white/20 disabled:opacity-50"><UndoIcon className="w-4 h-4 transform rotate-90"/></button>
                    <button onClick={() => moveLayerUp(activeLayerId!)} disabled={!activeLayerId} className="p-1 rounded bg-white/10 hover:bg-white/20 disabled:opacity-50"><RedoIcon className="w-4 h-4 transform rotate-90" /></button>
                 </div>
            </div>
        </div>
    );
};

export default LayersPanel;
