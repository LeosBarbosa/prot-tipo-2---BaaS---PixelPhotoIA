/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useEffect } from 'react';
import { useEditor } from '../../context/EditorContext';
import { generateImageFromText, validatePromptSpecificity } from '../../services/geminiService';
import ResultViewer from './common/ResultViewer';
import { PhotoIcon, MagicWandIcon, AspectRatioSquareIcon, AspectRatioLandscapeIcon, AspectRatioPortraitIcon } from '../icons';
import CollapsibleToolPanel from '../CollapsibleToolPanel';
import PromptEnhancer from './common/PromptEnhancer';
import PromptSuggestionsDropdown from '../common/PromptSuggestionsDropdown';
import { usePromptSuggestions } from '../../hooks/usePromptSuggestions';

const ImageGenPanel: React.FC = () => {
    const { isLoading, error, setError, setIsLoading, setLoadingMessage, setToast, addPromptToHistory, initialPromptFromMetadata } = useEditor();
    const [resultImage, setResultImage] = useState<string | null>(null);
    const [prompt, setPrompt] = useState('Uma vasta biblioteca interior com livros que se estendem até um teto abobadado, feixes de luz empoeirados, estilo de fantasia cinematográfica, detalhado.');
    const [aspectRatio, setAspectRatio] = useState('1:1');
    const [isPromptExpanded, setIsPromptExpanded] = useState(true);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const suggestions = usePromptSuggestions(prompt, 'imageGen');

    useEffect(() => {
        if (initialPromptFromMetadata) {
            setPrompt(initialPromptFromMetadata);
        }
    }, [initialPromptFromMetadata]);

    useEffect(() => {
        setShowSuggestions(suggestions.length > 0);
    }, [suggestions]);

    const handleSelectSuggestion = (suggestion: string) => {
        setPrompt(suggestion);
        setShowSuggestions(false);
    };


    const aspectRatios: { id: string, name: string, icon: React.ReactNode }[] = [
        { id: '1:1', name: 'Quadrado', icon: <AspectRatioSquareIcon className="w-6 h-6" /> },
        { id: '16:9', name: 'Paisagem', icon: <AspectRatioLandscapeIcon className="w-6 h-6" /> },
        { id: '9:16', name: 'Retrato', icon: <AspectRatioPortraitIcon className="w-6 h-6" /> },
    ];

    const handleGenerate = async () => {
        if (!prompt.trim()) {
            setError("Por favor, digite um prompt para gerar a imagem.");
            return;
        }
        setIsLoading(true);
        setLoadingMessage('Analisando o prompt...');
        setError(null);
        setResultImage(null);
        addPromptToHistory(prompt);
        try {
            const { isSpecific, suggestion } = await validatePromptSpecificity(prompt, 'Gerador de Imagens AI');

            if (!isSpecific) {
                setToast({ message: suggestion, type: 'info' });
                setIsLoading(false);
                setLoadingMessage(null);
                return; // Interrompe a execução
            }

            setLoadingMessage('Gerando sua imagem...');
            const result = await generateImageFromText(prompt, aspectRatio);
            setResultImage(result);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Ocorreu um erro desconhecido.");
        } finally {
            setIsLoading(false);
            setLoadingMessage(null);
        }
    };

    return (
        <div className="p-4 md:p-6 flex flex-col md:flex-row gap-6">
            <aside className="w-full md:max-w-md flex-shrink-0 bg-gray-900/30 rounded-lg p-6 flex flex-col gap-6 border border-gray-700/50">
                <div className="text-center">
                    <h3 className="text-xl font-bold text-gray-100">Gerador de Imagens AI</h3>
                    <p className="text-sm text-gray-400 mt-1">Crie imagens a partir de descrições de texto.</p>
                </div>

                <CollapsibleToolPanel
                    title="Prompt & Configurações"
                    icon={<MagicWandIcon className="w-5 h-5" />}
                    isExpanded={isPromptExpanded}
                    onExpandToggle={() => setIsPromptExpanded(!isPromptExpanded)}
                >
                    <div className="flex flex-col gap-4">
                        <div className="relative">
                            <textarea
                                id="image-gen-prompt"
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                                onFocus={() => setShowSuggestions(suggestions.length > 0)}
                                placeholder="Ex: um astronauta surfando em uma onda cósmica, com nebulosas coloridas ao fundo, estilo cinematográfico..."
                                className="w-full bg-gray-800/70 border border-gray-600 rounded-lg p-3 pr-12 text-base min-h-[150px] resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                                disabled={isLoading}
                                rows={6}
                            />
                            <PromptEnhancer prompt={prompt} setPrompt={setPrompt} toolId="imageGen" />
                            {showSuggestions && (
                                <PromptSuggestionsDropdown
                                    suggestions={suggestions}
                                    onSelect={handleSelectSuggestion}
                                    searchTerm={prompt}
                                />
                            )}
                            <p className="mt-1 text-xs text-gray-500 px-1">Dica: Adicione estilo (ex: 'fotorrealista', 'pintura a óleo'), iluminação e detalhes da câmera para melhores resultados.</p>
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-200 mb-2">Proporção da Imagem</label>
                            <div className="grid grid-cols-3 gap-3">
                                {aspectRatios.map(({ id, name, icon }) => (
                                    <button 
                                        key={id} 
                                        type="button" 
                                        onClick={() => setAspectRatio(id)} 
                                        disabled={isLoading} 
                                        className={`p-3 rounded-lg text-sm font-semibold transition-all flex flex-col items-center justify-center gap-2 aspect-square ${aspectRatio === id ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'bg-gray-800/70 hover:bg-gray-700/70 text-gray-300'}`}
                                        aria-label={name}
                                    >
                                        {icon}
                                        <span>{name}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </CollapsibleToolPanel>

                <button
                    onClick={handleGenerate}
                    disabled={isLoading || !prompt.trim()}
                    className="w-full mt-auto bg-gradient-to-br from-purple-600 to-indigo-500 text-white font-bold py-3 px-5 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-lg"
                >
                    <PhotoIcon className="w-6 h-6" />
                    Gerar Imagem
                </button>
            </aside>
            <main className="flex-grow bg-black/20 rounded-lg border border-gray-700/50 flex items-center justify-center p-4">
                <ResultViewer
                    isLoading={isLoading}
                    error={error}
                    resultImage={resultImage}
                    loadingMessage="Gerando sua imagem..."
                />
            </main>
        </div>
    );
};

export default ImageGenPanel;