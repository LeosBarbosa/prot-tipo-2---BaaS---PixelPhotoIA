/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React from 'react';
import { useEditor } from '../../context/EditorContext';

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
    } = useEditor();

    const handleFilterChange = (filter: keyof typeof localFilters, value: number) => {
        setLocalFilters(prev => ({ ...prev, [filter]: value }));
    };

    return (
        <div className="w-full bg-gray-800/50 rounded-lg p-4 flex flex-col gap-4 animate-fade-in">
             <p className="text-sm text-center text-gray-400">
                Ajuste sua imagem em tempo real. Os resultados são aplicados via CSS e podem ser finalizados na imagem.
            </p>
            <div className="space-y-3">
                <Slider label="Brilho" value={localFilters.brightness} min={0} max={200} onChange={e => handleFilterChange('brightness', Number(e.target.value))} disabled={isLoading} />
                <Slider label="Contraste" value={localFilters.contrast} min={0} max={200} onChange={e => handleFilterChange('contrast', Number(e.target.value))} disabled={isLoading} />
                <Slider label="Saturação" value={localFilters.saturate} min={0} max={200} onChange={e => handleFilterChange('saturate', Number(e.target.value))} disabled={isLoading} />
                <Slider label="Girar Matiz" value={localFilters.hueRotate} min={0} max={360} onChange={e => handleFilterChange('hueRotate', Number(e.target.value))} disabled={isLoading} />
                <Slider label="Desfoque" value={localFilters.blur} min={0} max={20} onChange={e => handleFilterChange('blur', Number(e.target.value))} disabled={isLoading} />
                <Slider label="Sépia" value={localFilters.sepia} min={0} max={100} onChange={e => handleFilterChange('sepia', Number(e.target.value))} disabled={isLoading} />
                <Slider label="Escala de Cinza" value={localFilters.grayscale} min={0} max={100} onChange={e => handleFilterChange('grayscale', Number(e.target.value))} disabled={isLoading} />
                <Slider label="Inverter" value={localFilters.invert} min={0} max={100} onChange={e => handleFilterChange('invert', Number(e.target.value))} disabled={isLoading} />
            </div>

            <div className="border-t border-gray-700 my-2"></div>
            
            <div className="flex gap-2 mt-2">
                <button
                    onClick={resetLocalFilters}
                    disabled={isLoading || !hasLocalAdjustments}
                    className="w-full bg-white/10 hover:bg-white/20 text-white font-bold py-3 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Resetar
                </button>
                <button
                    onClick={handleApplyLocalAdjustments}
                    disabled={isLoading || !hasLocalAdjustments}
                    className="w-full bg-gradient-to-br from-green-600 to-green-500 text-white font-bold py-3 px-6 rounded-lg transition-all shadow-lg shadow-green-500/20 hover:shadow-xl disabled:from-gray-600 disabled:shadow-none disabled:cursor-not-allowed"
                >
                    Aplicar
                </button>
            </div>
        </div>
    );
};

export default AdjustmentPanel;