
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useEffect } from 'react';
// FIX: Correct import path
import { useEditor, DEFAULT_LOCAL_FILTERS } from '../../context/EditorContext';
import ToneCurve from '../ToneCurve';
import { ToneCurveIcon, SunIcon, PaletteIcon, AdjustmentsHorizontalIcon, CheckCircleIcon } from '../icons';
import ApplyToAllToggle from '../common/ApplyToAllToggle';
import TipBox from '../common/TipBox';
// FIX: Correct import path
import { AdjustmentLayer } from '../../types';

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
    } = useEditor();
    
    const [applyToAll, setApplyToAll] = useState(true);
    const [isApplied, setIsApplied] = useState(false);

    const activeLayer = layers.find(l => l.id === activeLayerId);
    const isEditingAdjustmentLayer = activeLayer?.type === 'adjustment';

    useEffect(() => {
        if (isEditingAdjustmentLayer) {
            const fullFilters = { ...DEFAULT_LOCAL_FILTERS, ...(activeLayer as AdjustmentLayer).filters };
            setLocalFilters(fullFilters);
        } else {
            resetLocalFilters();
        }
    }, [activeLayerId, layers, setLocalFilters, resetLocalFilters, isEditingAdjustmentLayer]);


    const handleFilterChange = (filter: keyof Omit<typeof localFilters, 'curve'>, value: number) => {
        setLocalFilters(prev => ({ ...prev, [filter]: value }));
    };

    const handleApplyClick = async () => {
        if (isLoading || !hasLocalAdjustments || isEditingAdjustmentLayer) return;
        
        try {
            await handleApplyLocalAdjustments(applyToAll); 
            setIsApplied(true);
            setTimeout(() => {
                setIsApplied(false);
            }, 2000);
        } catch(e) {
            // Error is handled in context, but we can log it here if needed
            console.error("Failed to apply local adjustments", e);
        }
    };

    return (
        <div className="w-full flex flex-col gap-4">
            <div className="bg-gray-900/30 p-4 rounded-lg border border-gray-700/50">
                <h4 className="font-bold text-white text-md mb-3 flex items-center gap-2"><SunIcon className="w-5 h-5 text-yellow-400"/> Luz & Contraste</h4>
                <div className="space-y-4">
                    <Slider label="Brilho" value={localFilters.brightness} min={0} max={200} onChange={e => handleFilterChange('brightness', Number(e.target.value))} disabled={isLoading || isEditingAdjustmentLayer} />
                    <Slider label="Contraste" value={localFilters.contrast} min={0} max={200} onChange={e => handleFilterChange('contrast', Number(e.target.value))} disabled={isLoading || isEditingAdjustmentLayer} />
                </div>
            </div>

            <div className="bg-gray-900/30 p-4 rounded-lg border border-gray-700/50">
                <h4 className="font-bold text-white text-md mb-3 flex items-center gap-2"><PaletteIcon className="w-5 h-5 text-cyan-400"/> Cor</h4>
                <div className="space-y-4">
                    <Slider label="Saturação" value={localFilters.saturate} min={0} max={200} onChange={e => handleFilterChange('saturate', Number(e.target.value))} disabled={isLoading || isEditingAdjustmentLayer} />
                    <Slider label="Girar Matiz" value={localFilters.hueRotate} min={0} max={360} onChange={e => handleFilterChange('hueRotate', Number(e.target.value))} disabled={isLoading || isEditingAdjustmentLayer} />
                    <Slider label="Sépia" value={localFilters.sepia} min={0} max={100} onChange={e => handleFilterChange('sepia', Number(e.target.value))} disabled={isLoading || isEditingAdjustmentLayer} />
                </div>
            </div>

            <div className="bg-gray-900/30 p-4 rounded-lg border border-gray-700/50">
                <h4 className="font-bold text-white text-md mb-3 flex items-center gap-2"><AdjustmentsHorizontalIcon className="w-5 h-5 text-purple-400"/> Efeitos</h4>
                <div className="space-y-4">
                    <Slider label="Desfoque" value={localFilters.blur} min={0} max={20} onChange={e => handleFilterChange('blur', Number(e.target.value))} disabled={isLoading || isEditingAdjustmentLayer} />
                    <Slider label="Escala de Cinza" value={localFilters.grayscale} min={0} max={100} onChange={e => handleFilterChange('grayscale', Number(e.target.value))} disabled={isLoading || isEditingAdjustmentLayer} />
                    <Slider label="Inverter" value={localFilters.invert} min={0} max={100} onChange={e => handleFilterChange('invert', Number(e.target.value))} disabled={isLoading || isEditingAdjustmentLayer} />
                </div>
            </div>
            
            <div className="bg-gray-900/30 p-4 rounded-lg border border-gray-700/50">
                <h4 className="text-md font-semibold text-gray-300 text-center mb-3 flex items-center justify-center gap-2">
                    <ToneCurveIcon className="w-5 h-5"/>
                    Curva de Tons
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
                    onClick={resetLocalFilters}
                    disabled={isLoading || !hasLocalAdjustments || isEditingAdjustmentLayer}
                    className="w-full bg-white/10 hover:bg-white/20 text-white font-semibold py-3 px-4 rounded-lg transition-transform disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
                >
                    Resetar
                </button>
                <button
                    onClick={handleApplyClick}
                    disabled={isLoading || !hasLocalAdjustments || isEditingAdjustmentLayer}
                    className="w-full bg-gradient-to-br from-green-600 to-green-500 text-white font-bold py-3 px-4 rounded-lg transition-all shadow-lg shadow-green-500/20 hover:shadow-xl disabled:from-gray-600 disabled:shadow-none disabled:cursor-not-allowed active:scale-95 flex items-center justify-center gap-2"
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

export default AdjustmentPanel;
