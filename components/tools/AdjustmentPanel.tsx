/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useEffect } from 'react';
import { useEditor, DEFAULT_LOCAL_FILTERS } from '../../context/EditorContext';
import ToneCurve from '../ToneCurve';
import ApplyToAllToggle from '../common/ApplyToAllToggle';
import TipBox from '../common/TipBox';
// FIX: Correct import to use AdjustmentLayer
import { type AdjustmentLayer, type FilterState } from '../../types';
import LazyIcon from '../LazyIcon';
import Slider from '../common/Slider';

const AdjustmentPanel: React.FC = () => {
    const { 
        localFilters, 
        setLocalFilters, 
        handleApplyLocalAdjustments, 
        resetLocalFilters, 
        isLoading,
        hasLocalAdjustments,
        histogram,
        handleApplyCurve,
        isGif,
        layers,
        activeLayerId,
        handleApplyAIAdjustment,
    } = useEditor();
    
    const [aiPrompt, setAiPrompt] = useState('');
    const [applyToAll, setApplyToAll] = useState(true);
    const [isApplied, setIsApplied] = useState(false);

    const activeLayer = layers.find(l => l.id === activeLayerId);
    const isEditingAdjustmentLayer = activeLayer?.type === 'adjustment';
    const hasAdjustments = hasLocalAdjustments;

    useEffect(() => {
        if (isEditingAdjustmentLayer) {
            const fullFilters = { ...DEFAULT_LOCAL_FILTERS, ...(activeLayer as AdjustmentLayer).filters };
            setLocalFilters(fullFilters);
        } else {
            resetLocalFilters();
        }
    }, [activeLayerId, layers, setLocalFilters, resetLocalFilters, isEditingAdjustmentLayer]);


    const handleFilterChange = (filter: keyof Omit<FilterState, 'curve'>, value: number) => {
        setLocalFilters(prev => ({ ...prev, [filter]: value }));
    };

    const handleApplyClick = async () => {
        if (isLoading || !hasAdjustments || isEditingAdjustmentLayer) return;
        
        try {
            await handleApplyLocalAdjustments(localFilters); 
            setIsApplied(true);
            setTimeout(() => {
                setIsApplied(false);
            }, 2000);
        } catch(e) {
            console.error("Failed to apply global adjustments", e);
        }
    };

    const handleAiApplyClick = () => {
        if (isLoading || !aiPrompt.trim()) return;
        handleApplyAIAdjustment(aiPrompt, applyToAll);
        setAiPrompt('');
    };

    const handleReset = () => {
        resetLocalFilters();
    };


    return (
        <div className="w-full flex flex-col gap-4">
            <div className="bg-gray-900/30 p-4 rounded-lg border border-gray-700/50">
                <h4 className="font-bold text-white text-md mb-3 flex items-center gap-2">
                    <LazyIcon name="SparkleIcon" className="w-5 h-5 text-purple-400"/> 
                    Ajuste Mágico com IA
                </h4>
                <div className="flex flex-col gap-2">
                    <textarea
                        value={aiPrompt}
                        onChange={(e) => setAiPrompt(e.target.value)}
                        placeholder="Ex: adicione um filtro retrô, deixe o céu mais dramático..."
                        className="w-full bg-gray-800 border border-gray-600 rounded-lg p-2 text-sm min-h-[60px]"
                        disabled={isLoading}
                        rows={3}
                    />
                    <button
                        onClick={handleAiApplyClick}
                        disabled={isLoading || !aiPrompt.trim()}
                        className="w-full bg-gradient-to-br from-purple-600 to-indigo-500 text-white font-bold py-2 px-4 rounded-lg transition-all flex items-center justify-center gap-2 disabled:from-gray-600 disabled:shadow-none disabled:cursor-not-allowed"
                    >
                        <LazyIcon name="MagicWandIcon" className="w-5 h-5" />
                        Aplicar
                    </button>
                </div>
            </div>
            
            <div className="text-center p-3 rounded-lg bg-blue-900/40 border border-blue-700/60">
                <h4 className="font-bold text-sm text-blue-300 flex items-center justify-center gap-2">
                    <LazyIcon name="EyeIcon" className="w-5 h-5"/>
                    Ajustes Manuais (Live)
                </h4>
                <p className="text-xs text-blue-400 mt-1">
                    Mova os controles e veja sua imagem mudar instantaneamente.
                </p>
            </div>
            <div className="bg-gray-900/30 p-4 rounded-lg border border-gray-700/50">
                <h4 className="font-bold text-white text-md mb-3 flex items-center gap-2">
                    <LazyIcon name="SunIcon" className="w-5 h-5 text-yellow-400"/> 
                    Luz & Contraste 
                    <span className="ml-auto text-xs font-bold text-blue-400 bg-blue-900/50 px-2 py-0.5 rounded-full border border-blue-800">LIVE</span>
                </h4>
                <div className="space-y-4">
                    <Slider label="Brilho" value={localFilters.brightness} min={0} max={200} onChange={e => handleFilterChange('brightness', Number(e.target.value))} disabled={isLoading || isEditingAdjustmentLayer} tooltip="Ajusta o brilho geral da imagem. Valores mais altos tornam a imagem mais clara." />
                    <Slider label="Contraste" value={localFilters.contrast} min={0} max={200} onChange={e => handleFilterChange('contrast', Number(e.target.value))} disabled={isLoading || isEditingAdjustmentLayer} tooltip="Ajusta a diferença entre as áreas claras e escuras. Valores mais altos aumentam a diferença." />
                </div>
            </div>

            <div className="bg-gray-900/30 p-4 rounded-lg border border-gray-700/50">
                <h4 className="font-bold text-white text-md mb-3 flex items-center gap-2">
                    <LazyIcon name="PaletteIcon" className="w-5 h-5 text-cyan-400"/> 
                    Cor
                    <span className="ml-auto text-xs font-bold text-blue-400 bg-blue-900/50 px-2 py-0.5 rounded-full border border-blue-800">LIVE</span>
                </h4>
                <div className="space-y-4">
                    <Slider label="Saturação" value={localFilters.saturate} min={0} max={200} onChange={e => handleFilterChange('saturate', Number(e.target.value))} disabled={isLoading || isEditingAdjustmentLayer} tooltip="Ajusta a intensidade das cores. Valores mais altos tornam as cores mais vibrantes." />
                    <Slider label="Girar Matiz" value={localFilters.hueRotate} min={0} max={360} onChange={e => handleFilterChange('hueRotate', Number(e.target.value))} disabled={isLoading || isEditingAdjustmentLayer} tooltip="Muda as cores da imagem (ex: vermelho para verde). Gira as cores no círculo cromático." />
                    <Slider label="Sépia" value={localFilters.sepia} min={0} max={100} onChange={e => handleFilterChange('sepia', Number(e.target.value))} disabled={isLoading || isEditingAdjustmentLayer} tooltip="Aplica um tom amarelado à imagem, semelhante a fotos antigas." />
                </div>
            </div>

            <div className="bg-gray-900/30 p-4 rounded-lg border border-gray-700/50">
                <h4 className="font-bold text-white text-md mb-3 flex items-center gap-2">
                    <LazyIcon name="AdjustmentsHorizontalIcon" className="w-5 h-5 text-purple-400"/> 
                    Efeitos
                    <span className="ml-auto text-xs font-bold text-blue-400 bg-blue-900/50 px-2 py-0.5 rounded-full border border-blue-800">LIVE</span>
                </h4>
                <div className="space-y-4">
                    <Slider label="Desfoque" value={localFilters.blur} min={0} max={20} onChange={e => handleFilterChange('blur', Number(e.target.value))} disabled={isLoading || isEditingAdjustmentLayer} tooltip="Aplica um desfoque gaussiano à imagem, suavizando os detalhes." />
                    <Slider label="Escala de Cinza" value={localFilters.grayscale} min={0} max={100} onChange={e => handleFilterChange('grayscale', Number(e.target.value))} disabled={isLoading || isEditingAdjustmentLayer} tooltip="Remove a cor da imagem, convertendo-a para tons de cinza." />
                    <Slider label="Inverter" value={localFilters.invert} min={0} max={100} onChange={e => handleFilterChange('invert', Number(e.target.value))} disabled={isLoading || isEditingAdjustmentLayer} tooltip="Inverte as cores da imagem, como um negativo de filme." />
                </div>
            </div>
            
            <div className="bg-gray-900/30 p-4 rounded-lg border border-gray-700/50">
                <h4 className="text-md font-semibold text-gray-300 text-center mb-3 flex items-center justify-center gap-2">
                    <LazyIcon name="ToneCurveIcon" className="w-5 h-5"/>
                    Curva de Tons
                    <span className="ml-2 text-xs font-bold text-blue-400 bg-blue-900/50 px-2 py-0.5 rounded-full border border-blue-800">LIVE</span>
                </h4>
                <ToneCurve 
                    histogram={histogram} 
                    onCurveChange={handleApplyCurve}
                    onReset={() => setLocalFilters(prev => ({...prev, curve: undefined}))}
                    disabled={isLoading || isEditingAdjustmentLayer}
                />
            </div>

            {isGif && <ApplyToAllToggle checked={applyToAll} onChange={setApplyToAll} />}
            
            {isEditingAdjustmentLayer && (
                <TipBox>Ajustes não-destrutivos não são suportados para GIFs. Por favor, selecione uma camada de imagem para fazer edições destrutivas.</TipBox>
            )}

            <div className="flex gap-2 mt-2">
                <button
                    onClick={handleReset}
                    disabled={isLoading || !hasAdjustments || isEditingAdjustmentLayer}
                    className="w-full bg-white/10 hover:bg-white/20 text-white font-semibold py-3 px-4 rounded-lg transition-transform disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
                >
                    Resetar
                </button>
                <button
                    onClick={handleApplyClick}
                    disabled={isLoading || !hasAdjustments || isEditingAdjustmentLayer}
                    className="w-full bg-gradient-to-br from-green-600 to-green-500 text-white font-bold py-3 px-4 rounded-lg transition-all shadow-lg shadow-green-500/20 hover:shadow-xl disabled:from-gray-600 disabled:shadow-none disabled:cursor-not-allowed active:scale-95 flex items-center justify-center gap-2"
                >
                    {isLoading ? (
                        <span className="animate-pulse">Aplicando...</span>
                    ) : isApplied ? (
                        <>
                            <LazyIcon name="CheckCircleIcon" className="w-5 h-5" />
                            <span>Aplicado!</span>
                        </>
                    ) : (
                        'Aplicar Ajustes Manuais'
                    )}
                </button>
            </div>
        </div>
    );
};

export default AdjustmentPanel;