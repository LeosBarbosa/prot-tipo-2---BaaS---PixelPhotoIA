/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useEffect } from 'react';
import { useEditor } from '../../context/EditorContext';
import { SunIcon } from '../icons';
import PromptEnhancer from './common/PromptEnhancer';
import TipBox from '../common/TipBox';
import { validatePromptSpecificity } from '../../services/geminiService';
import PromptSuggestionsDropdown from '../common/PromptSuggestionsDropdown';
import { usePromptSuggestions } from '../../hooks/usePromptSuggestions';

const lightingPresets = [
    { name: 'Hora Dourada', prompt: 'luz quente e dourada do final da tarde, com sombras longas e suaves' },
    { name: 'Neon', prompt: 'luz de neon vibrante vinda de várias direções, criando reflexos coloridos' },
    { name: 'Contraluz Dramático', prompt: 'iluminação de contraluz forte (rim light), criando uma silhueta com bordas iluminadas' },
    { name: 'Estúdio Suave', prompt: 'iluminação de estúdio suave e difusa, minimizando sombras fortes' },
    { name: 'Cinematográfico', prompt: 'iluminação cinematográfica, com' },
];

const RelightPanel: React.FC = () => {
    const { handleRelight, isLoading, setToast, addPromptToHistory } = useEditor();
    const [customPrompt, setCustomPrompt] = useState('');
    const [showSuggestions, setShowSuggestions] = useState(false);
    const suggestions = usePromptSuggestions(customPrompt, 'relight');
    
    useEffect(() => {
        setShowSuggestions(suggestions.length > 0);
    }, [suggestions]);

    const handleSelectSuggestion = (suggestion: string) => {
        setCustomPrompt(suggestion);
        setShowSuggestions(false);
    };

    const handleApply = async (promptToApply: string) => {
        if (!promptToApply.trim()) return;

        const { isSpecific, suggestion } = await validatePromptSpecificity(promptToApply, 'Reacender');
        if (!isSpecific) {
            setToast({ message: suggestion, type: 'info' });
            return;
        }
        handleRelight(promptToApply);
    };

    const handleApplyCustom = () => {
        if (customPrompt.trim()) {
            addPromptToHistory(customPrompt);
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
            
            <div className="relative">
                <label className="block text-sm font-medium text-gray-300 mb-1">Iluminação Personalizada</label>
                <div className="relative">
                    <textarea
                        value={customPrompt}
                        onChange={(e) => setCustomPrompt(e.target.value)}
                        onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                        onFocus={() => setShowSuggestions(suggestions.length > 0)}
                        placeholder="Ex: luz de vela vinda de baixo, criando sombras longas..."
                        className="w-full bg-gray-800 border border-gray-600 rounded-lg p-3 pr-12 text-base min-h-[100px]"
                        disabled={isLoading}
                        rows={4}
                    />
                     <PromptEnhancer prompt={customPrompt} setPrompt={setCustomPrompt} toolId="relight" />
                </div>
                {showSuggestions && (
                    <PromptSuggestionsDropdown
                        suggestions={suggestions}
                        onSelect={handleSelectSuggestion}
                        searchTerm={customPrompt}
                    />
                )}
            </div>

             <TipBox>
                Seja descritivo sobre a fonte de luz (sol, neon, vela), sua cor, direção e intensidade para criar o clima perfeito.
            </TipBox>

            <button
                onClick={handleApplyCustom}
                disabled={isLoading || !customPrompt.trim()}
                className="w-full mt-2 bg-gradient-to-br from-yellow-600 to-orange-500 text-white font-bold py-3 px-6 rounded-lg transition-all flex items-center justify-center gap-2 disabled:from-gray-600 disabled:shadow-none disabled:cursor-not-allowed"
            >
                <SunIcon className="w-5 h-5" />
                Aplicar Iluminação
            </button>
        </div>
    );
};

export default RelightPanel;
