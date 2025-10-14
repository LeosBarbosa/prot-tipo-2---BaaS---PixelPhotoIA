/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useEditor } from '../context/EditorContext';
import { tools, toolToTabMap } from '../config/tools';
import { type ToolConfig, type ToolCategory } from '../types';
import { SearchIcon, GenerationIcon, WorkflowIcon, EditingIcon } from './icons';

interface ToolsMenuProps {
  onClose: () => void;
}

const categoryConfig: Record<ToolCategory, { title: string; icon: React.ReactElement<{ className?: string }> }> = {
    generation: { 
        title: "Geração", 
        icon: <GenerationIcon /> 
    },
    workflow: { 
        title: "Fluxos de Trabalho", 
        icon: <WorkflowIcon />
    },
    editing: { 
        title: "Edição", 
        icon: <EditingIcon />
    },
};

const categoryOrder: ToolCategory[] = ['generation', 'workflow', 'editing'];

const ToolsMenu: React.FC<ToolsMenuProps> = ({ onClose }) => {
    const { setActiveTool, baseImageFile, setToast, setActiveTab } = useEditor();
    const [searchTerm, setSearchTerm] = useState('');
    const menuRef = useRef<HTMLDivElement>(null);

    const handleSelect = (tool: ToolConfig) => {
        if (tool.category === 'editing') {
            if (baseImageFile) {
                const tabId = toolToTabMap[tool.id];
                if (tabId) {
                    setActiveTab(tabId);
                }
            } else {
                setToast({ message: `Primeiro, carregue uma imagem para usar a ferramenta '${tool.name}'.`, type: 'info' });
            }
        } else {
            setActiveTool(tool.id);
        }
        onClose();
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                onClose();
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [onClose]);

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

    const isSearching = searchTerm.trim().length > 0;

    return (
        <div ref={menuRef} className="absolute top-full mt-2 right-4 lg:left-0 lg:right-auto z-50 w-[90vw] max-w-sm bg-gray-800/90 backdrop-blur-lg border border-gray-700 rounded-xl shadow-2xl animate-zoom-rise">
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
                        autoFocus
                    />
                </div>
            </div>
            <div className="max-h-[60vh] overflow-y-auto scrollbar-thin p-2">
                {categoryOrder.map(category => {
                    const toolsForCategory = filteredAndGroupedTools[category];
                    if (!toolsForCategory || toolsForCategory.length === 0) {
                        return null;
                    }
                    const categoryInfo = categoryConfig[category];

                    return (
                        <div key={category} className="mb-2">
                            {(!isSearching || (isSearching && toolsForCategory.length > 0)) && (
                                <h3 className="flex items-center gap-2 px-2 py-1 text-xs font-bold text-blue-400 uppercase tracking-wider">
                                    {React.cloneElement(categoryInfo.icon, { className: 'w-4 h-4' })}
                                    {categoryInfo.title}
                                </h3>
                            )}
                            <div className="space-y-1">
                                {toolsForCategory.map(tool => {
                                    const isDisabled = tool.category === 'editing' && !baseImageFile;
                                    return (
                                        <button
                                            key={tool.id}
                                            onClick={() => handleSelect(tool)}
                                            disabled={isDisabled}
                                            className="w-full flex items-center gap-4 p-2 text-left rounded-md transition-colors hover:bg-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                                            title={isDisabled ? `Carregue uma imagem para usar esta ferramenta` : tool.description}
                                        >
                                            <div className={`flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-lg ${isDisabled ? 'grayscale' : ''}`}>
                                                {/* FIX: Cast icon to React.ReactElement<any> to allow adding className prop. */}
                                                {React.cloneElement(tool.icon as React.ReactElement<any>, { className: 'w-6 h-6' })}
                                            </div>
                                            <div>
                                                <p className="font-semibold text-white">{tool.name}</p>
                                                {isSearching && <p className="text-xs text-gray-400 line-clamp-1">{tool.description}</p>}
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
                {isSearching && Object.keys(filteredAndGroupedTools).length === 0 && (
                    <p className="text-center text-gray-400 py-8">Nenhuma ferramenta encontrada.</p>
                )}
            </div>
        </div>
    );
};

export default ToolsMenu;