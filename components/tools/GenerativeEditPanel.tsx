/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useEffect } from 'react';
import { useEditor } from '../../context/EditorContext';
import { BrushIcon, SparkleIcon } from '../icons';
import PromptEnhancer from './common/PromptEnhancer';
import TipBox from '../common/TipBox';
import { validatePromptSpecificity } from '../../services/geminiService';
import PromptSuggestionsDropdown from '../common/PromptSuggestionsDropdown';
import { usePromptSuggestions } from '../../hooks/usePromptSuggestions';

const GenerativeEditPanel: React.FC = () => {
    const {
        isLoading,
        prompt,
        setPrompt,
        maskDataUrl,
        clearMask,
        handleGenerativeEdit,
        brushSize,
        setBrushSize,
        detectedObjects,
        handleDetectObjects,
        highlightedObject,
        setHighlightedObject,
        handleSelectObject,
        activeLayerId,
        layers,
        setToast,
        setLoadingMessage,
        setIsLoading,
        addPromptToHistory,
    } = useEditor();

    type SelectionMode = 'brush' | 'magic';
    const [selectionMode, setSelectionMode] = useState<SelectionMode>('brush');
    const [magicObjectPrompt, setMagicObjectPrompt] = useState('');
    const [showSuggestions, setShowSuggestions] = useState(false);
    const suggestions = usePromptSuggestions(prompt, 'generativeEdit');

    const activeLayer = layers.find(l => l.id === activeLayerId);
    const isImageLayerActive = activeLayer?.type === 'image';
    
    useEffect(() => {
        setShowSuggestions(suggestions.length > 0);
    }, [suggestions]);

    const handleSelectSuggestion = (suggestion: string) => {
        setPrompt(suggestion);
        setShowSuggestions(false);
    };

    const handleValidatedGenerate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isGenerateDisabled) return;

        setIsLoading(true);
        setLoadingMessage('Analisando o prompt...');
        addPromptToHistory(prompt);

        const { isSpecific, suggestion } = await validatePromptSpecificity(prompt, 'Edição Generativa');

        if (!isSpecific) {
            setToast({ message: suggestion, type: 'info' });
            setIsLoading(false);
            setLoadingMessage(null);
            return;
        }

        handleGenerativeEdit();
    };

    const isGenerateDisabled = isLoading || !maskDataUrl || !prompt.trim() || !isImageLayerActive;

    const switchMode = (mode: SelectionMode) => {
        setSelectionMode(mode);
        clearMask();
        if (detectedObjects) {
            setHighlightedObject(null);
        }
    };

    return (
        <form onSubmit={handleValidatedGenerate} className="w-full flex flex-col gap-4 animate-fade-in">
            <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-300">Edição Generativa</h3>
                <p className="text-sm text-gray-400 -mt-1">
                    Selecione uma área para remover, adicionar ou alterar objetos com texto.
                </p>
            </div>

            <div className="flex w-full bg-gray-900/50 border border-gray-600 rounded-lg p-1">
                <button type="button" onClick={() => switchMode('brush')} className={`w-full text-center font-semibold py-2.5 rounded-md transition-all text-sm flex items-center justify-center gap-2 ${selectionMode === 'brush' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-300 hover:bg-gray-700/50'}`}>
                    <BrushIcon className="w-5 h-5" /> Pincel
                </button>
                <button type="button" onClick={() => switchMode('magic')} className={`w-full text-center font-semibold py-2.5 rounded-md transition-all text-sm flex items-center justify-center gap-2 ${selectionMode === 'magic' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-300 hover:bg-gray-700/50'}`}>
                    <SparkleIcon className="w-5 h-5" /> Mágica
                </button>
            </div>

            {selectionMode === 'brush' && (
                <div className="animate-fade-in flex flex-col gap-2">
                    <p className="text-xs text-center text-gray-400">Pinte sobre a área que deseja editar.</p>
                    <div className="flex items-center justify-between text-sm">
                        <label htmlFor="brush-size" className="font-medium text-gray-300">Tamanho do Pincel</label>
                        <span className="font-mono text-gray-200">{brushSize}</span>
                    </div>
                    <input id="brush-size" type="range" min="5" max="150" value={brushSize} onChange={e => setBrushSize(Number(e.target.value))} className="w-full" disabled={isLoading} />
                </div>
            )}

            {selectionMode === 'magic' && (
                <div className="animate-fade-in flex flex-col gap-3">
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={magicObjectPrompt}
                            onChange={(e) => setMagicObjectPrompt(e.target.value)}
                            placeholder="Ex: 'carros', 'árvores'..."
                            className="w-full bg-gray-800 border border-gray-600 rounded-lg p-3 text-base"
                            disabled={isLoading}
                        />
                        <button type="button" onClick={() => handleDetectObjects(magicObjectPrompt)} disabled={isLoading} className="bg-gray-800/50 hover:bg-gray-700/50 text-white font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2">
                            <SparkleIcon className="w-5 h-5" />
                            Detetar
                        </button>
                    </div>

                    {detectedObjects && (
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
                                )) : <p className="text-sm text-gray-500">Nenhum objeto detetado para '{magicObjectPrompt}'.</p>}
                            </ul>
                        </div>
                    )}
                </div>
            )}
            
             <TipBox>
                Use a Seleção Mágica para detetar objetos automaticamente. Se a IA não encontrar o que você quer, mude para o modo Pincel para uma seleção manual precisa.
            </TipBox>
            
            <div className="border-t border-gray-700/50 my-1"></div>

            {maskDataUrl ? (
                 <div className="animate-fade-in flex flex-col gap-4">
                    <div className="relative">
                        <textarea
                            id="gen-fill-prompt"
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                            onFocus={() => setShowSuggestions(suggestions.length > 0)}
                            placeholder="Ex: um chapéu de pirata, remover a pessoa..."
                            className="flex-grow bg-gray-800 border border-gray-600 text-gray-200 rounded-lg p-4 pr-12 focus:ring-2 focus:ring-blue-500 focus:outline-none transition w-full disabled:cursor-not-allowed disabled:opacity-60 text-base min-h-[100px]"
                            disabled={isLoading}
                            rows={4}
                        />
                        <PromptEnhancer prompt={prompt} setPrompt={setPrompt} toolId="generativeEdit" />
                        {showSuggestions && (
                            <PromptSuggestionsDropdown
                                suggestions={suggestions}
                                onSelect={handleSelectSuggestion}
                                searchTerm={prompt}
                            />
                        )}
                    </div>
                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={clearMask}
                            disabled={isLoading}
                            className="w-full bg-gray-800/50 hover:bg-gray-700/50 text-white font-semibold py-3 px-4 rounded-lg transition-colors text-sm"
                        >
                            Limpar Seleção
                        </button>
                        <button
                            type="submit"
                            className="w-full bg-gradient-to-br from-fuchsia-600 to-purple-500 text-white font-bold py-3 px-4 rounded-lg transition-all flex items-center justify-center gap-2 disabled:from-gray-600 disabled:cursor-not-allowed"
                            disabled={isGenerateDisabled}
                        >
                            <BrushIcon className="w-5 h-5" />
                            Gerar
                        </button>
                    </div>
                </div>
            ) : (
                <div className="text-center text-gray-400 text-base p-6 bg-gray-900/30 rounded-lg border-2 border-dashed border-gray-700">
                    {!isImageLayerActive 
                        ? 'Selecione uma camada de imagem para editar.'
                        : selectionMode === 'brush' 
                        ? 'Selecione uma área para começar'
                        : 'Digite um prompt e clique em "Detetar" para começar'
                    }
                </div>
            )}
        </form>
    );
};

export default GenerativeEditPanel;