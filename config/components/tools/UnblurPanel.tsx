/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState } from 'react';
import { useEditor } from '../../../context/EditorContext';
import TipBox from '../common/TipBox';
// FIX: Correct import path for LazyIcon
import LazyIcon from '../LazyIcon';

const UnblurPanel: React.FC = () => {
    const { handleUnblurImage, isLoading } = useEditor();
    const [sharpenLevel, setSharpenLevel] = useState(75);
    const [denoiseLevel, setDenoiseLevel] = useState(30);
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
            
            <div className="bg-gray-900/30 p-4 rounded-lg border border-gray-700/50">
                <h4 className="font-bold text-white text-md mb-3 text-center">Ajustes</h4>
                <div className="flex flex-col gap-4">
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
            </div>

            <div className="bg-gray-900/30 p-4 rounded-lg border border-gray-700/50">
                <h4 className="font-bold text-white text-md mb-3 text-center">Modelo de Correção</h4>
                <div className="grid grid-cols-1 gap-2">
                    {models.map(model => (
                        <button
                            type="button"
                            key={model.value}
                            onClick={() => setSelectedModel(model.value)}
                            disabled={isLoading}
                            className={`p-3 rounded-lg text-left transition-all border-2 ${selectedModel === model.value ? 'bg-blue-600/30 border-blue-500' : 'bg-gray-800/50 border-transparent hover:border-gray-600'}`}
                        >
                            <h5 className={`font-bold text-sm ${selectedModel === model.value ? 'text-white' : 'text-gray-200'}`}>{model.name}</h5>
                            <p className={`text-xs mt-1 ${selectedModel === model.value ? 'text-blue-200' : 'text-gray-400'}`}>{model.description}</p>
                        </button>
                    ))}
                </div>
            </div>

             <TipBox>
                Escolha o modelo de correção que melhor corresponde ao tipo de desfoque em sua foto para obter os melhores resultados.
            </TipBox>

            <button
                onClick={handleApply}
                disabled={isLoading}
                className="w-full mt-2 bg-gradient-to-br from-cyan-600 to-sky-500 text-white font-bold py-3 px-6 rounded-lg transition-all flex items-center justify-center gap-2 disabled:from-gray-600 disabled:shadow-none disabled:cursor-not-allowed"
            >
                <LazyIcon name="SparkleIcon" className="w-5 h-5" />
                Aplicar Correção
            </button>
        </div>
    );
};

export default UnblurPanel;
