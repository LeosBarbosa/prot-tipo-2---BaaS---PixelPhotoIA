/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useMemo, useEffect } from 'react';
// FIX: import from ../types
import { type TabId, type ToolCategory, type ToolConfig } from '../types';
// FIX: import from ../context/EditorContext
import { useEditor } from '../context/EditorContext';
import { tools } from '../config/tools';
// FIX: Remove local config and unused icons, import from config file.
import { ChevronDownIcon, SearchIcon } from './icons';
import { categoryConfig } from '../config/categoryConfig';

const categoryOrder: ToolCategory[] = ['generation', 'workflow', 'editing'];

const LeftPanel: React.FC = React.memo(() => {
    const { 
        activeTab, 
        setActiveTab,
        baseImageFile, 
        setToast,
        setIsLeftPanelVisible, 
        setIsRightPanelVisible 
    } = useEditor();
    
    const [searchTerm, setSearchTerm] = useState('');

    const filteredAndGroupedTools = useMemo(() => {
        const lowerSearchTerm = searchTerm.toLowerCase();
        
        const filtered = tools.filter(tool => 
            tool.name.toLowerCase().includes(lowerSearchTerm) || 
            tool.description.toLowerCase().includes(lowerSearchTerm)
        );

        return filtered.reduce((acc, tool) => {
            const category = tool.category;
            if (!acc[category]) {
                acc[category] = [];
            }
            acc[category].push(tool);
            return acc;
        }, {} as Record<ToolCategory, ToolConfig[]>);

    }, [searchTerm]);
    
    const findCategoryForTab = (tabId: TabId): ToolCategory | null => {
        const tool = tools.find(t => t.id === tabId);
        return tool ? tool.category : null;
    };
    
    const [expandedCategories, setExpandedCategories] = useState<Set<ToolCategory>>(() => {
        const category = findCategoryForTab(activeTab);
        return new Set(category ? [category] : []);
    });

    useEffect(() => {
        const category = findCategoryForTab(activeTab);
        if (category) {
            setExpandedCategories(prev => new Set(prev).add(category));
        }
    }, [activeTab]);

    const handleCategoryToggle = (category: ToolCategory) => {
        setExpandedCategories(prev => {
            const newSet = new Set(prev);
            if (newSet.has(category)) {
                newSet.delete(category);
            } else {
                newSet.add(category);
            }
            return newSet;
        });
    };
    
    const handleSelectTool = (tool: ToolConfig) => {
        if (!baseImageFile && (tool.category === 'editing' || tool.category === 'workflow')) {
            setToast({ message: `Primeiro, carregue uma imagem para usar a ferramenta '${tool.name}'.`, type: 'info' });
            return;
        }
        
        setActiveTab(tool.id as TabId);

        if (window.innerWidth < 1024) {
            setIsLeftPanelVisible(false);
            setIsRightPanelVisible(true);
        }
    };
    
    const isSearching = searchTerm.trim().length > 0;
    
    useEffect(() => {
        if (isSearching) {
            setExpandedCategories(new Set(categoryOrder));
        }
    }, [isSearching]);

    return (
        <aside className="bg-gray-800/80 border-r border-gray-700/50 flex flex-col w-full h-full">
            <div className="p-3 border-b border-gray-700">
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <SearchIcon className="w-5 h-5 text-gray-400" />
                    </div>
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Pesquisar ferramentas..."
                        className="w-full pl-10 pr-4 py-2 bg-gray-900/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
            </div>
            <div className="flex-grow overflow-y-auto scrollbar-thin">
                {categoryOrder.map(category => {
                    const toolsForCategory = filteredAndGroupedTools[category];
                    if (!toolsForCategory || toolsForCategory.length === 0) return null;

                    const categoryInfo = categoryConfig[category];
                    const isExpanded = expandedCategories.has(category);

                    return (
                        <div key={category} className="border-b border-gray-700/50">
                            <button
                                onClick={() => handleCategoryToggle(category)}
                                className="w-full flex items-center justify-between p-4 text-left text-gray-200 hover:bg-gray-700/60 transition-colors"
                                aria-expanded={isExpanded}
                            >
                                <div className="flex items-center gap-3">
                                    {React.cloneElement(categoryInfo.icon, { className: `w-5 h-5 ${categoryInfo.colorClasses.text}` })}
                                    <span className="font-bold">{categoryInfo.title}</span>
                                </div>
                                <ChevronDownIcon className={`w-5 h-5 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                            </button>

                            {isExpanded && (
                                <div className="py-2 px-1 space-y-1 animate-fade-in">
                                    {toolsForCategory.map(tool => {
                                        const isDisabled = !baseImageFile && (tool.category === 'editing' || tool.category === 'workflow');
                                        const activeColorClass = categoryConfig[tool.category].colorClasses.bg;
                                        return (
                                            <button
                                                key={tool.id}
                                                onClick={() => handleSelectTool(tool)}
                                                disabled={isDisabled}
                                                className={`w-full flex items-center gap-3 p-2 rounded-md text-left transition-colors ${activeTab === tool.id ? `${activeColorClass} text-white` : 'text-gray-300 hover:bg-gray-700/80 hover:text-white'} disabled:opacity-50 disabled:cursor-not-allowed`}
                                                title={isDisabled ? `Carregue uma imagem para usar '${tool.name}'` : tool.description}
                                            >
                                                <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center text-gray-400">
                                                    {React.cloneElement(tool.icon as React.ReactElement<any>, { className: 'w-5 h-5' })}
                                                </div>
                                                <div className="flex items-center justify-between flex-grow">
                                                    <span className="text-sm font-semibold">{tool.name}</span>
                                                    {tool.tag === 'new' && (
                                                        <span className="px-2 py-0.5 text-xs font-bold text-white bg-blue-500 rounded-full shadow-[0_0_8px_rgba(59,130,246,0.8)] animate-pulse">
                                                            NOVO
                                                        </span>
                                                    )}
                                                    {tool.tag === 'tip' && (
                                                        <span className="px-2 py-0.5 text-xs font-bold text-gray-900 bg-yellow-400 rounded-full shadow-[0_0_8px_rgba(250,204,21,0.8)] animate-pulse">
                                                            DICA
                                                        </span>
                                                    )}
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </aside>
    );
});

export default LeftPanel;