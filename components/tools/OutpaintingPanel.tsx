/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useEffect } from 'react';
import { useEditor } from '../../context/EditorContext';
import { outpaintImage } from '../../services/geminiService';
import ImageDropzone from './common/ImageDropzone';
import ResultViewer from './common/ResultViewer';
import { PhotoIcon, ExpandIcon } from '../icons';
import CollapsibleToolPanel from '../CollapsibleToolPanel';
import PromptEnhancer from './common/PromptEnhancer';
import PromptSuggestionsDropdown from '../common/PromptSuggestionsDropdown';
import { usePromptSuggestions } from '../../hooks/usePromptSuggestions';

const OutpaintingPanel: React.FC = () => {
    const { isLoading, error, setError, setIsLoading, addPromptToHistory, baseImageFile, setInitialImage } = useEditor();
    const [sourceImage, setSourceImage] = useState<File | null>(null);
    const [resultImage, setResultImage] = useState<string | null>(null);
    const [prompt, setPrompt] = useState('');
    const [aspectRatio, setAspectRatio] = useState('16:9');
    const [isOptionsExpanded, setIsOptionsExpanded] = useState(true);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const suggestions = usePromptSuggestions(prompt, 'outpainting');

     const aspectRatios: { id: string, name: string }[] = [
        { id: '16:9', name: 'Paisagem' },
        { id: '1:1', name: 'Quadrado' },
        { id: '9:16', name: 'Retrato' },
        { id: '4:3', name: 'Padrão' },
        { id: '3:4', name: 'Padrão (Vert.)' },
    ];

    useEffect(() => {
        setShowSuggestions(suggestions.length > 0);
    }, [suggestions]);

    const handleSelectSuggestion = (suggestion: string) => {
        setPrompt(suggestion);
        setShowSuggestions(false);
    };

    useEffect(() => {
        if (baseImageFile && !sourceImage) {
            setSourceImage(baseImageFile);
        }
    }, [baseImageFile, sourceImage]);

    const handleFileSelect = (file: File | null) => {
        setSourceImage(file);
        if (file) {
            setInitialImage(file);
        }
        setResultImage(null);
    };

    const handleGenerate = async () => {
        if (!sourceImage) {
            setError("Por favor, carregue uma imagem para expandir.");
            return;
        }
        setIsLoading(true);
        setError(null);
        setResultImage(null);
        addPromptToHistory(prompt);
        try {
            const result = await outpaintImage(sourceImage, prompt, aspectRatio);
            setResultImage(result);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Ocorreu um erro desconhecido.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="p-4 md:p-6 flex flex-col md:flex-row gap-6">
            <aside className="w-full md:w-96 flex-shrink-0 bg-gray-900/30 rounded-lg p-4 flex flex-col gap-4 border border-gray-700/50">
                <div className="text-center">
                    <h3 className="text-lg font-semibold text-gray-200">Pintura Expansiva (Outpainting)</h3>
                    <p className="text-sm text-gray-400 mt-1">Amplie o quadro da sua imagem com IA.</p>
                </div>
                <ImageDropzone 
                    imageFile={sourceImage}
                    onFileSelect={handleFileSelect}
                    label="Imagem Original"
                />
                
                <CollapsibleToolPanel
                    title="Opções de Expansão"
                    icon={<ExpandIcon className="w-5 h-5" />}
                    isExpanded={isOptionsExpanded}
                    onExpandToggle={() => setIsOptionsExpanded(!isOptionsExpanded)}
                >
                    <div className="flex flex-col gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">Nova Proporção</label>
                            <select value={aspectRatio} onChange={e => setAspectRatio(e.target.value)} className="w-full bg-gray-800 border border-gray-600 rounded-lg p-3 text-base">
                                {aspectRatios.map(({ id, name }) => <option key={id} value={id}>{name} ({id})</option>)}
                            </select>
                        </div>
                        <div className="relative">
                            <label className="block text-sm font-medium text-gray-300 mb-1">Prompt (Opcional)</label>
                            <div className="relative">
                                <textarea
                                    value={prompt}
                                    onChange={(e) => setPrompt(e.target.value)}
                                    onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                                    onFocus={() => setShowSuggestions(suggestions.length > 0)}
                                    placeholder="Descreva o que adicionar no espaço expandido..."
                                    className="w-full bg-gray-800 border border-gray-600 rounded-lg p-3 pr-12 text-base min-h-[100px]"
                                    disabled={isLoading}
                                    rows={4}
                                />
                                <PromptEnhancer prompt={prompt} setPrompt={setPrompt} toolId="outpainting" />
                            </div>
                            {showSuggestions && (
                                <PromptSuggestionsDropdown
                                    suggestions={suggestions}
                                    onSelect={handleSelectSuggestion}
                                    searchTerm={prompt}
                                />
                            )}
                            <p className="mt-1 text-xs text-gray-500 px-1">Ex: "um céu estrelado com uma lua cheia", "continue a praia com areia e ondas".</p>
                        </div>
                    </div>
                </CollapsibleToolPanel>

                <button
                    onClick={handleGenerate}
                    disabled={isLoading || !sourceImage}
                    className="w-full mt-auto bg-gradient-to-br from-indigo-600 to-purple-500 text-white font-bold py-3 px-5 rounded-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                    <PhotoIcon className="w-5 h-5" />
                    Expandir Imagem
                </button>
            </aside>
            <main className="flex-grow bg-black/20 rounded-lg border border-gray-700/50 flex items-center justify-center p-4">
                <ResultViewer
                    isLoading={isLoading}
                    error={error}
                    resultImage={resultImage}
                    loadingMessage="Expandindo sua imagem..."
                />
            </main>
        </div>
    );
};

export default OutpaintingPanel;