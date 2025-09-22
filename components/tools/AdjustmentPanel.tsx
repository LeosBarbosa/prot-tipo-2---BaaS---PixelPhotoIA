/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState } from 'react';
import { useEditor } from '../../context/EditorContext';
import ToneCurve from '../ToneCurve';
import { ToneCurveIcon, SparkleIcon } from '../icons';
import ApplyToAllToggle from '../common/ApplyToAllToggle';

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

const cssPresets = [
    { name: 'Retro', settings: { brightness: 95, contrast: 110, saturate: 120, sepia: 60, hueRotate: -10, grayscale: 0, invert: 0, blur: 0 } },
    { name: 'P&B', settings: { brightness: 105, contrast: 120, saturate: 100, sepia: 0, hueRotate: 0, grayscale: 100, invert: 0, blur: 0 } },
    { name: 'Alto Contraste', settings: { brightness: 105, contrast: 140, saturate: 130, sepia: 0, hueRotate: 0, grayscale: 0, invert: 0, blur: 0 } },
];

const aiPresets = [
    { name: 'Lápis', prompt: 'transforme a imagem em um esboço detalhado a lápis preto e branco, com sombreamento realista e hachuras' },
    { name: 'Cartoon', prompt: 'converta a foto em um estilo de desenho animado 2D, com cores vivas, contornos pretos e espessos e sombreamento simplificado' },
    { name: 'Neon', prompt: 'aplique um efeito de luz de neon à imagem, fazendo com que os contornos do assunto principal brilhem com uma luz de neon vibrante contra um fundo escuro' },
];


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
        handleApplyStyle,
        isGif,
    } = useEditor();
    
    const [applyToAll, setApplyToAll] = useState(true);

    const handleFilterChange = (filter: keyof Omit<typeof localFilters, 'curve'>, value: number) => {
        setLocalFilters(prev => ({ ...prev, [filter]: value }));
    };

    return (
        <div className="w-full flex flex-col gap-4">
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

            <div className="border-t border-gray-700/50 my-2"></div>

            <div>
                <h4 className="text-md font-semibold text-gray-300 text-center mb-3">Filtros Rápidos</h4>
                <div className="grid grid-cols-3 gap-2">
                    {cssPresets.map(preset => (
                        <button
                            key={preset.name}
                            onClick={() => setLocalFilters(prev => ({ ...prev, ...preset.settings }))}
                            disabled={isLoading}
                            className="p-2 rounded-md text-sm font-semibold transition-all bg-white/5 hover:bg-white/10 text-gray-200 aspect-square flex items-center justify-center"
                        >
                            {preset.name}
                        </button>
                    ))}
                    {aiPresets.map(preset => (
                        <button
                            key={preset.name}
                            onClick={() => handleApplyStyle(preset.prompt, applyToAll)}
                            disabled={isLoading}
                            className="p-2 rounded-md text-sm font-semibold transition-all bg-blue-600/20 hover:bg-blue-600/40 text-blue-300 flex flex-col items-center justify-center gap-1 aspect-square"
                            title="Usa IA para aplicar este filtro"
                        >
                            <SparkleIcon className="w-5 h-5" />
                            <span>{preset.name}</span>
                        </button>
                    ))}
                </div>
            </div>
            
            <div className="border-t border-gray-700/50 my-2"></div>
            
            <div className="flex flex-col gap-3">
                <h4 className="text-md font-semibold text-gray-300 text-center flex items-center justify-center gap-2">
                    <ToneCurveIcon className="w-5 h-5"/>
                    Curva de Tons
                </h4>
                <ToneCurve 
                    histogram={histogram} 
                    onCurveChange={handleApplyCurve}
                    onReset={() => setLocalFilters(prev => ({...prev, curve: undefined}))}
                    disabled={isLoading}
                />
            </div>
            
            {isGif && <ApplyToAllToggle checked={applyToAll} onChange={setApplyToAll} />}

            <div className="flex gap-2 mt-2">
                <button
                    onClick={resetLocalFilters}
                    disabled={isLoading || !hasLocalAdjustments}
                    className="w-full bg-white/10 hover:bg-white/20 text-white font-semibold py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Resetar
                </button>
                <button
                    onClick={() => handleApplyLocalAdjustments(applyToAll)}
                    disabled={isLoading || !hasLocalAdjustments}
                    className="w-full bg-gradient-to-br from-green-600 to-green-500 text-white font-bold py-3 px-4 rounded-lg transition-all shadow-lg shadow-green-500/20 hover:shadow-xl disabled:from-gray-600 disabled:shadow-none disabled:cursor-not-allowed"
                >
                    Aplicar
                </button>
            </div>
        </div>
    );
};

export default AdjustmentPanel;