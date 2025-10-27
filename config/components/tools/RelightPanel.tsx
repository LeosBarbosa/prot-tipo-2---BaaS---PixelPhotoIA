/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState } from 'react';
import { useEditor } from '../../../context/EditorContext';
import TipBox from '../common/TipBox';
import { validatePromptSpecificity } from '../../../services/geminiService';
import CollapsiblePromptPanel from './common/CollapsiblePromptPanel';
import PromptPresetPanel from './common/PromptPresetPanel';
import LazyIcon from '../LazyIcon';

const lightingPresets = [
    { name: 'Hora Dourada', prompt: 'Reacenda a foto com uma luz quente e dourada de pôr do sol vindo da direita, com sombras longas e suaves.' },
    { name: 'Neon Noir', prompt: 'Ilumine a cena com luzes de neon azuis e roxas como se estivesse em uma rua de cyberpunk, com alto contraste e reflexos em superfícies molhadas.' },
    { name: 'Contraluz Dramático', prompt: 'iluminação de contraluz forte (rim light), criando uma silhueta com bordas iluminadas' },
    { name: 'Estúdio Suave', prompt: 'iluminação de estúdio suave e difusa (softbox), minimizando sombras fortes para um retrato limpo.' },
    { name: 'Estúdio Dramático', prompt: 'Aplique uma iluminação de estúdio dramática (Rembrandt), com uma única fonte de luz lateral forte criando um triângulo de luz na bochecha sombreada e alto contraste.'},
    { name: 'Luz de Janela', prompt: 'Reacenda a foto com uma luz suave e difusa vinda de uma grande janela lateral, criando sombras suaves e uma atmosfera calma e introspectiva.'},
    { name: 'Luz Volumétrica', prompt: 'Adicione raios de luz volumétricos (god rays) atravessando a cena, como se a luz do sol estivesse passando por uma janela empoeirada ou pela copa de árvores.'},
    { name: 'Luz de Fogueira', prompt: 'Reacenda a cena com uma luz de fogueira quente e cintilante vinda de baixo, projetando sombras longas e dançantes para cima.'},
];

const RelightPanel: React.FC = () => {
    const { handleRelight, isLoading, setToast, addPromptToHistory } = useEditor();
    const [customPrompt, setCustomPrompt] = useState('');
    const [negativePrompt, setNegativePrompt] = useState('');

    const handleApply = async (promptToApply: string) => {
        if (!promptToApply.trim()) return;

        addPromptToHistory(promptToApply);
        const { isSpecific, suggestion } = await validatePromptSpecificity(promptToApply, 'Reacender');
        if (!isSpecific) {
            setToast({ message: suggestion, type: 'info' });
            return;
        }
        handleRelight(promptToApply);
    };

    const handleApplyCustom = () => {
        if (customPrompt.trim()) {
            handleApply(customPrompt);
        }
    };
    
    return (
        <div className="w-full flex flex-col gap-4">
            <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-300">Reacender com IA</h3>
                <p className="text-sm text-gray-400 -mt-1">
                   Ajuste a iluminação com descrições.
                </p>
            </div>
            
            <div className="grid grid-cols-2 gap-2">
                {lightingPresets.map(preset => (
                    <button
                        key={preset.name}
                        onClick={() => handleApply(preset.prompt)}
                        disabled={isLoading}
                        className="p-3 rounded-lg text-sm text-center font-semibold transition-all bg-gray-800/50 hover:bg-gray-700/50"
                    >
                        {preset.name}
                    </button>
                ))}
            </div>

            <div className="border-t border-gray-700/50 my-2"></div>
            
            <CollapsiblePromptPanel
                title="Iluminação Personalizada"
                prompt={customPrompt}
                setPrompt={setCustomPrompt}
                negativePrompt={negativePrompt}
                onNegativePromptChange={(e) => setNegativePrompt(e.target.value)}
                isLoading={isLoading}
                toolId="relight"
                promptPlaceholder="Ex: luz de vela vinda de baixo, criando sombras longas..."
                promptHelperText="Seja descritivo sobre a fonte de luz, sua cor, direção e intensidade."
            />

            <PromptPresetPanel 
                toolId="relight"
                onSelectPreset={(selectedPrompt) => setCustomPrompt(selectedPrompt)}
                isLoading={isLoading}
            />

             <TipBox>
                Seja descritivo sobre a fonte de luz (sol, neon, vela), sua cor, direção e intensidade para criar o clima perfeito.
            </TipBox>

            <button
                onClick={handleApplyCustom}
                disabled={isLoading || !customPrompt.trim()}
                className="w-full mt-2 bg-gradient-to-br from-yellow-600 to-orange-500 text-white font-bold py-3 px-6 rounded-lg transition-all flex items-center justify-center gap-2 disabled:from-gray-600 disabled:shadow-none disabled:cursor-not-allowed"
            >
                <LazyIcon name="SunIcon" className="w-5 h-5" />
                Aplicar Iluminação
            </button>
        </div>
    );
};

export default RelightPanel;