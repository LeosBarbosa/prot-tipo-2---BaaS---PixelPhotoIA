/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useEffect } from 'react';
import { useEditor, DEFAULT_LOCAL_FILTERS } from '../../../context/EditorContext';
import TipBox from '../common/TipBox';
import LazyIcon from '../LazyIcon';

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
        handleApplyLocalAdjustments,
        setIsBrushActive,
    } = useEditor();

    const [localFilters, setLocalFilters] = useState(DEFAULT_LOCAL_FILTERS);
    const [selectionMode, setSelectionMode] = useState<'brush' | 'magic'>('brush');
    const [magicObjectPrompt, setMagicObjectPrompt] = useState('');
    const [isApplied, setIsApplied] = useState(false);

    useEffect(() => {
        setIsBrushActive(selectionMode === 'brush');
    }, [selectionMode, setIsBrushActive]);

    useEffect(() => {
        // Reset filters when mask is cleared
        if (!maskDataUrl) {
            setLocalFilters(DEFAULT_LOCAL_FILTERS);
        }
    }, [maskDataUrl]);
    
    const hasAdjustments = JSON.stringify(localFilters) !== JSON.stringify(DEFAULT_LOCAL_FILTERS);

    const switchMode = (mode: 'brush' | 'magic') => {
        setSelectionMode(mode);
        clearMask(); // Clear mask when switching modes
        if (detectedObjects) {
            setHighlightedObject(null); // Also clear any detected objects
        }
    };
    
    const handleFilterChange = (filter: keyof typeof localFilters, value: number) => {
        setLocalFilters(prev => ({ ...prev, [filter]: value }));
    };

    const handleApplyClick = async () => {
        if (isLoading || !maskDataUrl || !hasAdjustments) return;
        try {
            await handleApplyLocalAdjustments(localFilters);
            setIsApplied(true);
            setTimeout(() => setIsApplied(false), 2000);
        } catch (e) {
            console.error("Failed to apply local adjustments from panel", e);
        }
    };

    const handleReset = () => {
        setLocalFilters(DEFAULT_LOCAL_FILTERS);
    }

    return (
        <div className="w-full flex flex-col gap-4 animate-fade-in">
            <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-300">Ajustes Locais</h3>
                <p className="text-sm text-gray-400 -mt-1">
                    Selecione uma área para aplicar ajustes.
                </p>
            </div>

            <div className="flex w-full bg-gray-900/50 border border-gray-600 rounded-lg p-1">
                <button type="button" onClick={() => switchMode('brush')} className={`w-full text-center font-semibold py-2.5 rounded-md transition-all text-sm flex items-center justify-center gap-2 ${selectionMode === 'brush' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-300 hover:bg-gray-700/50'}`}>
                    <LazyIcon name="BrushIcon" className="w-5 h-5" /> Pincel
                </button>
                <button type="button" onClick={() => switchMode('magic')} className={`w-full text-center font-semibold py-2.5 rounded-md transition-all text-sm flex items-center justify-center gap-2 ${selectionMode === 'magic' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-300 hover:bg-gray-700/50'}`}>
                    <LazyIcon name="SparkleIcon" className="w-5 h-5" /> Mágica
                </button>
            </div>
            
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
                    <div className="flex gap-2">
                         <input
                            type="text"
                            value={magicObjectPrompt}
                            onChange={(e) => setMagicObjectPrompt(e.target.value)}
                            placeholder="Ex: 'céu', 'pessoa'..."
                            className="w-full bg-gray-800 border border-gray-600 rounded-lg p-3 text-base"
                            disabled={isLoading}
                        />
                        <button type="button" onClick={() => handleDetectObjects(magicObjectPrompt)} disabled={isLoading || !magicObjectPrompt.trim()} className="bg-gray-800/50 hover:bg-gray-700/50 text-white font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
                            <LazyIcon name="SparkleIcon" className="w-5 h-5" />
                            Detectar
                        </button>
                    </div>
                    {detectedObjects && (
                        <div className="bg-gray-900/30 p-2 rounded-lg border border-gray-700 max-h-40 overflow-y-auto" onMouseLeave={() => setHighlightedObject(null)}>
                            <p className="text-xs text-center text-gray-400 mb-2">Clique em um objeto para selecionar.</p>
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
                                )) : <p className="text-sm text-gray-500">Nenhum objeto detectado para '{magicObjectPrompt}'.</p>}
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
            
            <div className={`bg-gray-900/30 p-4 rounded-lg border border-gray-700/50 transition-opacity ${!maskDataUrl ? 'opacity-50 pointer-events-none' : ''}`}>
                <h4 className="font-bold text-white text-md mb-3 flex items-center gap-2"><LazyIcon name="AdjustmentsHorizontalIcon" className="w-5 h-5 text-purple-400"/> Ajustes</h4>
                <div className="space-y-4">
                    <div title="Ajusta o brilho da área selecionada. Valores maiores tornam a área mais clara, valores menores a tornam mais escura.">
                        <Slider label="Brilho" value={localFilters.brightness} min={0} max={200} onChange={e => handleFilterChange('brightness', Number(e.target.value))} disabled={isLoading || !maskDataUrl} />
                    </div>
                    <div title="Ajusta o contraste da área selecionada. Valores maiores aumentam a diferença entre claro e escuro, valores menores a diminuem.">
                        <Slider label="Contraste" value={localFilters.contrast} min={0} max={200} onChange={e => handleFilterChange('contrast', Number(e.target.value))} disabled={isLoading || !maskDataUrl} />
                    </div>
                    <div title="Ajusta a intensidade da cor na área selecionada. Valores maiores tornam as cores mais vibrantes, valores menores as tornam mais acinzentadas.">
                        <Slider label="Saturação" value={localFilters.saturate} min={0} max={200} onChange={e => handleFilterChange('saturate', Number(e.target.value))} disabled={isLoading || !maskDataUrl} />
                    </div>
                </div>
            </div>
            
            <TipBox>
                Para ajustes sutis, use o Pincel. Para ajustar um objeto inteiro, como o céu ou uma pessoa, use a Seleção Mágica.
            </TipBox>

            <div className="flex gap-2 mt-2">
                <button
                    onClick={handleReset}
                    disabled={isLoading || !hasAdjustments}
                    className="w-full bg-white/10 hover:bg-white/20 text-white font-semibold py-3 px-4 rounded-lg transition-colors disabled:opacity-50"
                >
                    Resetar
                </button>
                <button
                    onClick={handleApplyClick}
                    disabled={isLoading || !maskDataUrl || !hasAdjustments}
                    className="w-full bg-gradient-to-br from-green-600 to-green-500 text-white font-bold py-3 px-4 rounded-lg transition-all shadow-lg disabled:from-gray-600 disabled:shadow-none disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                    {isLoading ? 'Aplicando...' : isApplied ? 'Aplicado!' : 'Aplicar'}
                </button>
            </div>
        </div>
    );
};

export default LocalAdjustmentPanel;