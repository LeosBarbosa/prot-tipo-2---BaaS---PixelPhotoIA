/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useEditor } from '../context/EditorContext';
import { tools } from '../config/tools';
import { type ToolConfig, type ToolCategory, type PredefinedSearch, type ToolId } from '../types';
import SearchModule from './SearchModule';
import RecentTools from './RecentTools';
import SavedWorkflows from './SavedWorkflows';
import SmartSearchResultCard from './SmartSearchResultCard';
import Spinner from './Spinner';
import { GenerationIcon, WorkflowIcon, EditingIcon } from './icons';
import { predefinedSearches } from '../config/predefinedSearches';
import PredefinedSearchCard from './PredefinedSearchCard';
import RestoredSessionCard from './RestoredSessionCard';
import PromptSuggestions from './PromptSuggestions';
import StartScreen from './StartScreen';

// FIX: Changed icon type to React.ReactElement<{ className?: string }> to be compatible with React.cloneElement and provide specific prop types.
const categoryConfig: Record<ToolCategory, { title: string; description: string; icon: React.ReactElement<{ className?: string }> }> = {
    generation: { 
        title: "Geração", 
        description: "Dê vida às suas ideias. Crie imagens, padrões, logotipos e muito mais a partir de simples descrições de texto.",
        icon: <GenerationIcon className="w-6 h-6" /> 
    },
    workflow: { 
        title: "Fluxos de Trabalho", 
        description: "Automatize tarefas complexas com processos guiados por IA, desde design de interiores a retratos profissionais.",
        icon: <WorkflowIcon className="w-6 h-6" />
    },
    editing: { 
        title: "Edição", 
        description: "Aperfeiçoe suas imagens existentes com um conjunto completo de ferramentas de edição inteligentes e manuais.",
        icon: <EditingIcon className="w-6 h-6" />
    },
};

const ToolCard: React.FC<{ tool: ToolConfig }> = ({ tool }) => {
    const { setActiveTool } = useEditor()!;
    return (
        <button
            onClick={() => setActiveTool(tool.id)}
            className="group relative bg-gray-800/70 border border-gray-700 rounded-xl p-4 sm:p-6 text-center hover:bg-gray-700/70 hover:border-blue-500/50 transition-all duration-300 transform hover:-translate-y-1 active:scale-95 shadow-lg hover:shadow-blue-500/10"
        >
            <div className="flex-shrink-0 w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 flex items-center justify-center bg-gray-900/50 rounded-lg transition-all duration-300 group-hover:scale-110 group-hover:bg-blue-500/20">
                {tool.icon}
            </div>
            <div>
                <h3 className="font-semibold text-lg text-white">{tool.name}</h3>
                <p className="text-sm text-gray-400 mt-1">{tool.description}</p>
            </div>
        </button>
    );
};

const HomePage: React.FC = () => {
    const { handleSmartSearch, isSmartSearching, smartSearchResult, setSmartSearchResult, setActiveTool, hasRestoredSession, handleFileSelect } = useEditor()!;
    const [searchTerm, setSearchTerm] = useState('');
    const [activeCategory, setActiveCategory] = useState<ToolCategory>('generation');
    const [predefinedResult, setPredefinedResult] = useState<PredefinedSearch | null>(null);
    const [suggestions, setSuggestions] = useState<ToolConfig[]>([]);
    const searchContainerRef = useRef<HTMLDivElement>(null);

    const categoryKeys = Object.keys(categoryConfig) as ToolCategory[];

    const handleSearchChange = (term: string) => {
        setSearchTerm(term);
        if (smartSearchResult) {
            setSmartSearchResult(null);
        }

        // Autocomplete logic
        if (term.trim().length > 1) {
            const lowerTerm = term.toLowerCase();
            const matchingTools = tools.filter(tool =>
                tool.name.toLowerCase().includes(lowerTerm) ||
                tool.description.toLowerCase().includes(lowerTerm)
            );
            setSuggestions(matchingTools.slice(0, 5)); // Limit to 5 suggestions
        } else {
            setSuggestions([]);
        }

        // Predefined search logic
        if (term.trim().length > 2) {
            const lowerTerm = term.toLowerCase().trim();
            const match = predefinedSearches.find(search =>
                search.keywords.some(keyword => lowerTerm.includes(keyword))
            );
            setPredefinedResult(match || null);
        } else {
            setPredefinedResult(null);
        }
    };

    const handleCategoryClick = (category: ToolCategory) => {
        setActiveCategory(category);
        if (searchTerm) {
            setSearchTerm('');
            setSuggestions([]);
            setPredefinedResult(null);
        }
    };

    const handleSuggestionClick = (toolId: ToolId) => {
        setActiveTool(toolId);
        setSearchTerm('');
        setSuggestions([]);
    };

    // Effect to handle clicking outside to close suggestions
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
                setSuggestions([]);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const isSearching = searchTerm.trim().length > 0;

    const filteredTools = useMemo(() => {
        if (isSearching && !smartSearchResult) {
            return tools.filter(tool =>
                tool.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                tool.description.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }
        return tools.filter(tool => tool.category === activeCategory);
    }, [isSearching, searchTerm, activeCategory, smartSearchResult]);
    
    const showMainContent = !isSmartSearching && !smartSearchResult;


    return (
        <div className="container mx-auto px-4 py-8 sm:py-12 animate-fade-in">
             {hasRestoredSession ? (
                <>
                    <RestoredSessionCard />
                     <div className="text-center my-12 relative">
                        <hr className="border-t border-gray-700" />
                        <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gray-900 px-4 text-gray-500 font-bold uppercase">OU</span>
                    </div>
                </>
            ) : (
                <div className="mb-12">
                     <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-center bg-gradient-to-r from-blue-400 via-purple-500 to-pink-400 text-transparent bg-clip-text animate-text-gradient-pan">
                        Dê Vida às Suas Imagens
                    </h1>
                    <p className="mt-4 max-w-2xl mx-auto text-lg text-gray-400 text-center mb-8 animate-fade-in-text" style={{ animationDelay: '200ms' }}>
                       Faça upload de uma foto para começar a editar ou use nossas ferramentas de IA para criar algo novo do zero.
                    </p>
                    <StartScreen onFileSelect={handleFileSelect} />
                     <div className="text-center my-12 relative">
                        <hr className="border-t border-gray-700" />
                        <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gray-900 px-4 text-gray-500 font-bold uppercase">OU</span>
                    </div>
                </div>
            )}
            
            <div className="text-center mb-10">
                <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-blue-400 via-purple-500 to-pink-400 text-transparent bg-clip-text animate-text-gradient-pan" style={{ animationDelay: '5s' }}>
                    Crie Algo Novo
                </h2>
                <p className="mt-4 max-w-2xl mx-auto text-lg text-gray-400 animate-fade-in-text" style={{ animationDelay: '400ms' }}>
                    Sua suíte completa de ferramentas de IA para criar e editar imagens.
                </p>
            </div>
            
            <div ref={searchContainerRef}>
                <SearchModule 
                    searchTerm={searchTerm} 
                    onSearchChange={handleSearchChange}
                    onSmartSearch={handleSmartSearch}
                    isSearching={isSmartSearching}
                    suggestions={suggestions}
                    onSuggestionClick={handleSuggestionClick}
                />
            </div>

            {predefinedResult && !isSmartSearching && !smartSearchResult && (
                <PredefinedSearchCard result={predefinedResult} />
            )}
            
            {showMainContent && (
                <>
                    <div className="flex flex-col sm:flex-row justify-center mt-8 border-b border-gray-700">
                        {categoryKeys.map((key) => (
                            <button
                                key={key}
                                onClick={() => handleCategoryClick(key)}
                                className={`flex items-center gap-3 px-4 sm:px-6 py-3 text-sm sm:text-base font-semibold transition-colors duration-200 border-b-2
                                    ${!isSearching && activeCategory === key
                                        ? 'border-blue-500 text-white'
                                        : 'border-transparent text-gray-400 hover:text-white hover:border-gray-500'
                                    }`}
                            >
                                {React.cloneElement(categoryConfig[key].icon, { className: 'w-5 h-5' })}
                                {categoryConfig[key].title}
                            </button>
                        ))}
                    </div>
                    
                    {!isSearching ? (
                        <>
                            <div className="text-center mt-8 max-w-3xl mx-auto px-4">
                                <div className="inline-block p-3 bg-gray-800/50 border border-gray-700 rounded-xl mb-4">
                                    {React.cloneElement(categoryConfig[activeCategory].icon, { className: 'w-8 h-8 text-blue-400' })}
                                </div>
                                <p className="text-gray-400 text-base sm:text-lg">{categoryConfig[activeCategory].description}</p>
                            </div>
                             <div className="mt-8 space-y-12">
                                <RecentTools />
                                <SavedWorkflows />
                                <PromptSuggestions />
                            </div>
                        </>
                    ) : (
                         <div className="text-center mt-8">
                            <h2 className="text-2xl font-bold text-white">Resultados da Busca</h2>
                        </div>
                    )}
                </>
            )}

            <section className="mt-8">
                 {isSmartSearching && (
                    <div className="text-center py-16">
                        <Spinner />
                        <p className="mt-4 text-lg text-gray-300 animate-pulse">A IA está a pensar...</p>
                    </div>
                 )}
                 {smartSearchResult && (
                    <SmartSearchResultCard result={smartSearchResult} />
                 )}
                 {showMainContent && filteredTools.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
                        {filteredTools.map(tool => (
                            <ToolCard key={tool.id} tool={tool} />
                        ))}
                    </div>
                )}
                 {showMainContent && isSearching && filteredTools.length === 0 && (
                    <div className="text-center py-16">
                        <p className="text-gray-400 text-lg">Nenhuma ferramenta encontrada para "{searchTerm}".</p>
                    </div>
                )}
            </section>
        </div>
    );
};

export default HomePage;