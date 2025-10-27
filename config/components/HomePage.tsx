/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useMemo, useRef, useEffect, useCallback, lazy, Suspense } from 'react';
import { useEditor } from '../../context/EditorContext';
import { tools, toolToTabMap } from '../tools';
import { type ToolConfig, type ToolCategory, type PredefinedSearch, type ToolId, type TabId } from '../../types';
import SearchModule from './SearchModule';
import SmartSearchResultCard from './SmartSearchResultCard';
import Spinner from './Spinner';
import { predefinedSearches } from '../predefinedSearches';
import PredefinedSearchCard from './PredefinedSearchCard';
import StartScreen from './StartScreen';
import { quickStyles } from '../trends';
import TrendCard from './TrendCard';
import RestoredSessionCard from './RestoredSessionCard';
import LazyIcon from './LazyIcon';

// Lazy load components that are not immediately visible on page load
const RecentTools = lazy(() => import('./RecentTools'));
const SavedWorkflows = lazy(() => import('./SavedWorkflows'));
const PromptSuggestions = lazy(() => import('./PromptSuggestions'));

const categoryConfig: Record<ToolCategory, { title: string; description: string; icon: string }> = {
    generation: { 
        title: "Geração", 
        description: "Dê vida às suas ideias. Crie imagens, padrões, logotipos e muito mais a partir de simples descrições de texto.",
        icon: 'GenerationIcon' 
    },
    workflow: { 
        title: "Fluxos de Trabalho", 
        description: "Automatize tarefas complexas com processos guiados por IA, desde design de interiores a retratos profissionais.",
        icon: 'WorkflowIcon'
    },
    editing: { 
        title: "Edição", 
        description: "Aperfeiçoe suas imagens existentes com um conjunto completo de ferramentas de edição inteligentes e manuais.",
        icon: 'EditingIcon'
    },
};

const ToolCard = React.forwardRef<HTMLButtonElement, { tool: ToolConfig }>(({ tool }, ref) => {
    const { setActiveTool, baseImageFile, setToast, setActiveTab, setIsEditingSessionActive } = useEditor();
    
    const handleClick = () => {
        if (tool.isEditingTool || tool.category === 'workflow') { // Workflows also need an image
            if (baseImageFile) {
                setIsEditingSessionActive(true);
                // Editing tools have a tab, workflows might open a modal but from the editor view
                const tabId = toolToTabMap[tool.id as ToolId];
                if (tabId) {
                    setActiveTab(tabId);
                } else {
                    setActiveTool(tool.id); 
                }
            } else {
                setToast({ message: `Primeiro, carregue uma imagem para usar a ferramenta '${tool.name}'.`, type: 'info' });
            }
        } else {
            // Generation tools always open a modal
            setActiveTool(tool.id);
        }
    };

    return (
        <button
            ref={ref}
            onClick={handleClick}
            title={tool.description}
            className="group relative flex flex-col h-full bg-gray-800/70 border border-gray-700 rounded-xl p-4 sm:p-6 text-center hover:bg-gray-700/70 hover:border-blue-500/50 transition-all duration-300 transform hover:-translate-y-1 active:scale-95 shadow-lg hover:shadow-blue-500/10"
        >
            <div className="flex-shrink-0 w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 flex items-center justify-center bg-gray-900/50 rounded-lg transition-all duration-300 group-hover:scale-110 group-hover:bg-blue-500/20">
                <LazyIcon name={tool.icon} className="w-8 h-8 text-blue-400" />
            </div>
            <div className="flex flex-col flex-grow">
                <h3 className="font-semibold text-lg text-white">{tool.name}</h3>
                <p className="text-sm text-gray-400 mt-1">{tool.description}</p>
            </div>
        </button>
    );
});


const PAGE_SIZE = 9; // Carregar 9 ferramentas de cada vez

const HomePage: React.FC = () => {
    const { handleSmartSearch, isSmartSearching, smartSearchResult, setSmartSearchResult, setActiveTool, handleFileSelect, hasRestoredSession } = useEditor();
    const [searchTerm, setSearchTerm] = useState('');
    const [activeCategory, setActiveCategory] = useState<ToolCategory>('generation');
    const [predefinedResult, setPredefinedResult] = useState<PredefinedSearch | null>(null);
    const [suggestions, setSuggestions] = useState<ToolConfig[]>([]);
    const searchContainerRef = useRef<HTMLDivElement>(null);
    
    // Estado para paginação
    const [displayedTools, setDisplayedTools] = useState<ToolConfig[]>([]);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const observer = useRef<IntersectionObserver | null>(null);

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
    
    // Efeito para resetar as ferramentas exibidas quando a filtragem muda
    useEffect(() => {
        setDisplayedTools(filteredTools.slice(0, PAGE_SIZE));
    }, [filteredTools]);

    // Função para carregar mais ferramentas
    const loadMoreTools = useCallback(() => {
        setIsLoadingMore(true);
        // Simular um atraso de rede para melhor UX
        setTimeout(() => {
            const currentLength = displayedTools.length;
            const nextTools = filteredTools.slice(currentLength, currentLength + PAGE_SIZE);
            setDisplayedTools(prevTools => [...prevTools, ...nextTools]);
            setIsLoadingMore(false);
        }, 500);
    }, [displayedTools.length, filteredTools]);

    // Callback ref do Intersection Observer para o último elemento
    const lastToolElementRef = useCallback((node: HTMLButtonElement | null) => {
        if (isLoadingMore) return;
        if (observer.current) observer.current.disconnect();
        observer.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && displayedTools.length < filteredTools.length) {
                loadMoreTools();
            }
        });
        if (node) observer.current.observe(node);
    }, [isLoadingMore, loadMoreTools, displayedTools.length, filteredTools.length]);

    const showMainContent = !isSmartSearching && !smartSearchResult;


    return (
        <div className="container mx-auto px-4 py-8 sm:py-12 animate-fade-in">
            <div className="mb-8 md:mb-12">
                 <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-center bg-gradient-to-r from-blue-400 via-purple-500 to-pink-400 text-transparent bg-clip-text animate-text-gradient-pan">
                    Dê Vida às Suas Imagens
                </h1>
                <p className="mt-4 max-w-2xl mx-auto text-lg text-gray-400 text-center mb-8 animate-fade-in-text" style={{ animationDelay: '200ms' }}>
                   Faça upload de uma foto para começar a editar ou use nossas ferramentas de IA para criar algo novo do zero.
                </p>
                {hasRestoredSession ? (
                    <RestoredSessionCard />
                ) : (
                    <>
                        <StartScreen onFileSelect={handleFileSelect} />
                         <div className="text-center my-8 md:my-12 relative">
                            <hr className="border-t border-gray-700" />
                            <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gray-900 px-4 text-gray-500 font-bold uppercase">OU</span>
                        </div>
                    </>
                )}
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
            
            {isSmartSearching && (
                <div className="text-center">
                    <Spinner />
                    <p className="mt-4 text-lg text-gray-300 animate-pulse">A IA está pensando...</p>
                </div>
            )}

            {smartSearchResult && <SmartSearchResultCard result={smartSearchResult} />}
            {predefinedResult && <PredefinedSearchCard result={predefinedResult} />}

            {showMainContent && (
                <div className="animate-fade-in">
                    <Suspense fallback={<div className="flex justify-center"><Spinner /></div>}>
                        <RecentTools />
                        <SavedWorkflows />
                    </Suspense>

                    <div className="text-center my-8 md:my-12">
                         <h2 className="text-2xl font-bold text-white flex items-center justify-center gap-3">
                            <LazyIcon name="LayersIcon" className="w-7 h-7" />
                            Explorar Todas as Ferramentas
                        </h2>
                    </div>

                    <div className="flex flex-wrap justify-center gap-2 mb-8 border-b-2 border-gray-700 pb-4">
                        {categoryKeys.map(category => (
                            <button
                                key={category}
                                onClick={() => handleCategoryClick(category)}
                                className={`px-4 py-2 font-semibold rounded-full transition-colors ${activeCategory === category ? 'bg-blue-600 text-white' : 'bg-gray-800/50 text-gray-300 hover:bg-gray-700/50'}`}
                            >
                                {categoryConfig[category].title}
                            </button>
                        ))}
                    </div>
                    
                     <div className="mb-8 text-center">
                        <h3 className="text-xl font-bold text-white">{categoryConfig[activeCategory].title}</h3>
                        <p className="text-gray-400 mt-1">{categoryConfig[activeCategory].description}</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                       {displayedTools.map((tool, index) => {
                           if (index === displayedTools.length - 1) {
                               return <ToolCard ref={lastToolElementRef} key={tool.id} tool={tool} />;
                           }
                           return <ToolCard key={tool.id} tool={tool} />;
                       })}
                    </div>
                     {isLoadingMore && (
                        <div className="text-center py-8">
                            <Spinner />
                        </div>
                    )}
                    {displayedTools.length === filteredTools.length && filteredTools.length > PAGE_SIZE && (
                        <p className="text-center text-gray-500 mt-8">Você chegou ao fim.</p>
                    )}
                </div>
            )}

             <div className="text-center my-12 md:my-16">
                 <h2 className="text-2xl font-bold text-white mb-6">Estilos Rápidos Populares</h2>
                 <div className="flex justify-center gap-6 overflow-x-auto pb-4 -mx-4 px-4">
                     {quickStyles.map(trend => <TrendCard key={trend.name} trend={trend} />)}
                 </div>
             </div>
        </div>
    );
};

export default HomePage;