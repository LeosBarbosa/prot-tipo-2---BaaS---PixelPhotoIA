/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useEffect } from 'react';
import { useEditor } from '../../context/EditorContext';
import { generateCharacter } from '../../services/geminiService';
import ResultViewer from './common/ResultViewer';
import { SparkleIcon, FaceSmileIcon } from '../icons';
import CollapsibleToolPanel from '../CollapsibleToolPanel';
import PromptEnhancer from './common/PromptEnhancer';
import PromptSuggestionsDropdown from '../common/PromptSuggestionsDropdown';
import { usePromptSuggestions } from '../../hooks/usePromptSuggestions';

const CharacterDesignPanel: React.FC = () => {
    const { isLoading, error, setError, setIsLoading, addPromptToHistory } = useEditor();
    const [resultImage, setResultImage] = useState<string | null>(null);
    const [style, setStyle] = useState('Fantasia Realista');
    const [charClass, setCharClass] = useState('Guerreiro');
    const [details, setDetails] = useState('');
    const [isDetailsExpanded, setIsDetailsExpanded] = useState(true);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const suggestions = usePromptSuggestions(details, 'characterDesign');

    useEffect(() => {
        setShowSuggestions(suggestions.length > 0);
    }, [suggestions]);

    const handleSelectSuggestion = (suggestion: string) => {
        setDetails(suggestion);
        setShowSuggestions(false);
    };

    const handleGenerate = async () => {
        if (!details.trim()) {
            setError("Por favor, forneça alguns detalhes sobre o personagem.");
            return;
        }
        setIsLoading(true);
        setError(null);
        setResultImage(null);
        addPromptToHistory(details);
        try {
            const fullPrompt = `Estilo: ${style}. Classe: ${charClass}. Detalhes: ${details}`;
            const result = await generateCharacter(fullPrompt);
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
                    <h3 className="text-lg font-semibold text-gray-200">Design de Personagem</h3>
                    <p className="text-sm text-gray-400 mt-1">Crie personagens únicos com descrições detalhadas.</p>
                </div>

                <CollapsibleToolPanel
                    title="Detalhes do Personagem"
                    icon={<FaceSmileIcon className="w-5 h-5" />}
                    isExpanded={isDetailsExpanded}
                    onExpandToggle={() => setIsDetailsExpanded(!isDetailsExpanded)}
                >
                    <div className="flex flex-col gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">Estilo Artístico</label>
                            <select value={style} onChange={e => setStyle(e.target.value)} className="w-full bg-gray-800 border border-gray-600 rounded-lg p-3 text-base">
                                {['Fantasia Realista', 'Anime Anos 90', 'Cartoon Moderno', 'Cyberpunk', 'Pixel Art'].map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">Classe / Arquétipo</label>
                            <select value={charClass} onChange={e => setCharClass(e.target.value)} className="w-full bg-gray-800 border border-gray-600 rounded-lg p-3 text-base">
                                {['Guerreiro', 'Mago', 'Ladino', 'Cientista', 'Detetive', 'Piloto Espacial'].map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                        <div className="relative">
                            <label className="block text-sm font-medium text-gray-300 mb-1">Detalhes e Aparência</label>
                            <div className="relative">
                                <textarea
                                    value={details}
                                    onChange={(e) => setDetails(e.target.value)}
                                    onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                                    onFocus={() => setShowSuggestions(suggestions.length > 0)}
                                    placeholder="Ex: mulher com cabelo prateado, armadura ornamentada com detalhes em ouro, segurando uma espada de cristal..."
                                    className="w-full bg-gray-800 border border-gray-600 rounded-lg p-3 pr-12 text-base min-h-[120px]"
                                    disabled={isLoading}
                                    rows={5}
                                />
                                 <PromptEnhancer prompt={details} setPrompt={setDetails} toolId="characterDesign" />
                            </div>
                            {showSuggestions && (
                                <PromptSuggestionsDropdown
                                    suggestions={suggestions}
                                    onSelect={handleSelectSuggestion}
                                    searchTerm={details}
                                />
                            )}
                            <p className="mt-1 text-xs text-gray-500 px-1">Exemplo: "mulher com cabelo prateado, armadura ornamentada com detalhes em ouro, segurando uma espada de cristal". Inclua detalhes sobre cabelo, roupas, acessórios e expressão.</p>
                        </div>
                    </div>
                </CollapsibleToolPanel>
                
                <button
                    onClick={handleGenerate}
                    disabled={isLoading || !details.trim()}
                    className="w-full mt-auto bg-gradient-to-br from-cyan-600 to-teal-500 text-white font-bold py-3 px-5 rounded-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                    <SparkleIcon className="w-5 h-5" />
                    Gerar Personagem
                </button>
            </aside>
            <main className="flex-grow bg-black/20 rounded-lg border border-gray-700/50 flex items-center justify-center p-4">
                <ResultViewer
                    isLoading={isLoading}
                    error={error}
                    resultImage={resultImage}
                    loadingMessage="Criando seu personagem..."
                />
            </main>
        </div>
    );
};

export default CharacterDesignPanel;
