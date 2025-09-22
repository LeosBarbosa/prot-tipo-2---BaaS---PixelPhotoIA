/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState } from 'react';
import { useEditor } from '../../context/EditorContext';
import { SparkleIcon } from '../icons';

const UnblurPanel: React.FC = () => {
    const { handleUnblurImage, isLoading } = useEditor();
    const [sharpenLevel, setSharpenLevel] = useState(50);
    const [denoiseLevel, setDenoiseLevel] = useState(50);
    const [selectedModel, setSelectedModel] = useState('motion-blur');

    const models = [
        { name: 'Movimento', value: 'motion-blur', description: 'Corrige manchas ou fantasmas causados pelo movimento.' },
        { name: 'Fora de Foco', value: 'out-of-focus', description: 'Corrige quando a imagem inteira está muito desfocada.' },
        { name: 'Foco Suave', value: 'soft-focus', description: 'Corrige desfoque de lente ou foco ligeiramente perdido.' },
    ];

    const handleApply = () => {
        handleUnblurImage(sharpenLevel, denoiseLevel, selectedModel);
    };

    return (
        <div className="w-full flex flex-col gap-4 animate-fade-in">
            <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-300">Remover Desfoque (Unblur)</h3>
                <p className="text-sm text-gray-400 -mt-1">
                    Corrija desfoques de movimento e lente com IA.
                </p>
            </div>
            
            {/* Controles de Agucar e Ruído */}
            <div className="flex flex-col gap-3 bg-gray-900/30 p-4 rounded-lg border border-gray-700/50">
                <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium text-gray-300 flex justify-between">
                        <span>Aguçar</span>
                        <span className="text-white font-mono">{sharpenLevel}%</span>
                    </label>
                    <input
                        type="range"
                        min="0"
                        max="100"
                        value={sharpenLevel}
                        onChange={e => setSharpenLevel(Number(e.target.value))}
                        disabled={isLoading}
                        className="w-full"
                    />
                </div>
                <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium text-gray-300 flex justify-between">
                        <span>Redução de Ruído</span>
                        <span className="text-white font-mono">{denoiseLevel}%</span>
                    </label>
                    <input
                        type="range"
                        min="0"
                        max="100"
                        value={denoiseLevel}
                        onChange={e => setDenoiseLevel(Number(e.target.value))}
                        disabled={isLoading}
                        className="w-full"
                    />
                </div>
            </div>

            {/* Seleção do Modelo */}
            <div className="flex flex-col gap-2 bg-gray-900/30 p-4 rounded-lg border border-gray-700/50">
                <h4 className="text-md font-semibold text-gray-300 text-center mb-2">Modelo de Correção</h4>
                <div className="grid grid-cols-3 gap-2">
                    {models.map(model => (
                        <button
                            type="button"
                            key={model.value}
                            onClick={() => setSelectedModel(model.value)}
                            disabled={isLoading}
                            className={`p-3 rounded-lg text-sm text-center font-semibold transition-all ${selectedModel === model.value ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-800/50 hover:bg-gray-700/50 text-gray-300'}`}
                        >
                            {model.name}
                        </button>
                    ))}
                </div>
                 <p className="text-xs text-center text-gray-400 mt-2 h-8">
                    {models.find(m => m.value === selectedModel)?.description}
                </p>
            </div>
            
            <button
                onClick={handleApply}
                disabled={isLoading}
                className="w-full mt-4 bg-gradient-to-br from-green-600 to-green-500 text-white font-bold py-3 px-6 rounded-lg transition-all flex items-center justify-center gap-2 disabled:from-gray-600 disabled:shadow-none disabled:cursor-not-allowed"
            >
                <SparkleIcon className="w-5 h-5" />
                Aplicar Correção
            </button>
        </div>
    );
};

export default UnblurPanel;