/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState } from 'react';
// FIX: Correct import path
import { useEditor } from '../../context/EditorContext';
import { BrushIcon, SparkleIcon, AdjustmentsHorizontalIcon, CheckCircleIcon } from '../icons';
import TipBox from '../common/TipBox';

const Slider: React.FC<{
    label: string;
    value: number;
    min: number;
    max: number;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    disabled: boolean;
}> = ({ label, value, min, max, onChange, disabled }) => (
    <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-gray-300 flex justify-between">
            <span>{label}</span>
            <span className="text-white font-mono">{value}</span>
        </label>
        <input
            type="range"
            min={min}
            max={max}
            value={value}
            onChange={onChange}
            disabled={disabled}
            className="w-full"
        />
    </div>
);


const LocalAdjustmentPanel: React.FC = () => {
    const {
        isLoading,
        maskDataUrl,
        clearMask,
        brushSize,
        setBrushSize,
        detectedObjects,
        handleDetectObjects,
        highlightedObject,
        setHighlightedObject,
        handleSelectObject,
        localFilters,
        setLocalFilters,
        handleApplyLocalAdjustments,
        resetLocalFilters,
        hasLocalAdjustments,
    } = useEditor();

    type SelectionMode = 'brush' | 'magic';
    const [selectionMode, setSelectionMode] = useState<SelectionMode>('brush');
    const [isApplied, setIsApplied] = useState(false);

    const switchMode = (mode: SelectionMode) => {
        setSelectionMode(mode);
        clearMask();
        if (detectedObjects) {
            setHighlightedObject(null);
        }
    };
    
    const handleFilterChange = (filter: keyof typeof localFilters, value: number) => {
        setLocalFilters(prev => ({ ...prev, [filter]: value }));
    };

    const handleApplyClick = async () => {
        if (isLoading || !maskDataUrl || !hasLocalAdjustments) return;
        try {
            await handleApplyLocalAdjustments(true);
            setIsApplied(true);
            setTimeout(() => setIsApplied(false), 2000);
        } catch (e) {
            console.error("Failed to apply local adjustments from panel", e);
            // Error toast is handled in context
        }
    };

    return (
        <div className="w-full flex flex-col gap-4 animate-fade-in">
            <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-300">Ajustes Locais</h3>
                <p className="text-sm text-gray-400 -mt-1">
                    Selecione uma área para aplicar ajustes.
                </p>
            </div>

            {/* Seletor de Modo */}
            <div className="flex w-full bg-gray-900/50 border border-gray-600 rounded-lg p-1">
                <button type="button" onClick={() => switchMode('brush')} className={`w-full text-center font-semibold py-2.5 rounded-md transition-all text-sm flex items-center justify-center gap-2 ${selectionMode === 'brush' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-300 hover:bg-gray-700/50'}`}>
                    <BrushIcon className="w-5 h-5" /> Pincel
                </button>
                <button type="button" onClick={() => switchMode('magic')} className={`w-full text-center font-semibold py-2.5 rounded-md transition-all text-sm flex items-center justify-center gap-2 ${selectionMode === 'magic' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-300 hover:bg-gray-700/50'}`}>
                    <SparkleIcon className="w-5 h-5" /> Mágica
                </button>
            </div>
            
            {/* UI de Seleção */}
            {selectionMode === 'brush' && (
                <div className="bg-gray-900/30 p-4 rounded-lg border border-gray-700/50 animate-fade-in flex flex-col gap-2">
                    <p className="text-xs text-center text-gray-400">Pinte sobre a área que deseja editar.</p>
                    <div className="flex items-center justify-between text-sm">
                        <label htmlFor="brush-size-local" className="font-medium text-gray-300">Tamanho do Pincel</label>
                        <span className="font-mono text-gray-200">{brushSize}</span>
                    </div>
                    <input id="brush-size-local" type="range" min="5" max="150" value={brushSize} onChange={e => setBrushSize(Number(e.target.value))} className="w-full" disabled={isLoading} />
                </div>
            )}
            {selectionMode === 'magic' && (
                 <div className="bg-gray-900/30 p-4 rounded-lg border border-gray-700/50 animate-fade-in flex flex-col gap-3">
                    {!detectedObjects ? (
                        <button type="button" onClick={() => handleDetectObjects()} disabled={isLoading} className="w-full bg-gray-800/50 hover:bg-gray-700/50 text-white font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2">
                            <SparkleIcon className="w-5 h-5" />
                            Detetar Objetos
                        </button>
                    ) : (
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
                                )) : <p className="text-sm text-gray-500">Nenhum objeto detetado.</p>}
                            </ul>
                        </div>
                    )}
                </div>
            )}
             
            <button
                type="button"
                onClick={clearMask}
                disabled={isLoading || !maskDataUrl}
                className="w-full bg-gray-800/50 hover:bg-gray-700/50 text-white font-semibold py-2 px-3 rounded-lg transition-colors text-sm disabled:opacity-50"
            >
                Limpar Seleção
            </button>

            {/* Sliders de Ajuste */}
             <div className={`bg-gray-900/30 p-4 rounded-lg border border-gray-700/50 transition-opacity ${!maskDataUrl ? 'opacity-50 pointer-events-none' : ''}`}>
                <h4 className="font-bold text-white text-md mb-3 flex items-center gap-2"><AdjustmentsHorizontalIcon className="w-5 h-5 text-purple-400"/> Ajustes</h4>
                <div className="space-y-4">
                    <Slider label="Brilho" value={localFilters.brightness} min={0} max={200} onChange={e => handleFilterChange('brightness', Number(e.target.value))} disabled={isLoading || !maskDataUrl} />
                    <Slider label="Contraste" value={localFilters.contrast} min={0} max={200} onChange={e => handleFilterChange('contrast', Number(e.target.value))} disabled={isLoading || !maskDataUrl} />
                    <Slider label="Saturação" value={localFilters.saturate} min={0} max={200} onChange={e => handleFilterChange('saturate', Number(e.target.value))} disabled={isLoading || !maskDataUrl} />
                </div>
            </div>
            
            <TipBox>
                Para ajustes sutis, use o pincel. Para ajustar um objeto inteiro, como o céu ou uma pessoa, use a Seleção Mágica.
            </TipBox>

            {/* Botões de Ação */}
            <div className="flex gap-2 mt-2">
                <button
                    onClick={resetLocalFilters}
                    disabled={isLoading || !hasLocalAdjustments}
                    className="w-full bg-white/10 hover:bg-white/20 text-white font-semibold py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Resetar
                </button>
                <button
                    onClick={handleApplyClick}
                    disabled={isLoading || !maskDataUrl || !hasLocalAdjustments}
                    className="w-full bg-gradient-to-br from-green-600 to-green-500 text-white font-bold py-3 px-4 rounded-lg transition-all shadow-lg shadow-green-500/20 hover:shadow-xl disabled:from-gray-600 disabled:shadow-none disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                    {isLoading ? (
                        <span className="animate-pulse">Aplicando...</span>
                    ) : isApplied ? (
                        <>
                            <CheckCircleIcon className="w-5 h-5" />
                            <span>Aplicado!</span>
                        </>
                    ) : (
                        'Aplicar'
                    )}
                </button>
            </div>
        </div>
    );
};

export default LocalAdjustmentPanel;