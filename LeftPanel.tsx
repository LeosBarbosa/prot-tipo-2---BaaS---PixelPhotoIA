/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useMemo, useEffect } from 'react';
import { editingTabs } from '../config/tabs';
import { type TabId, type ToolCategory } from '../types';
import { useEditor } from '../context/EditorContext';
import { tools } from '../config/tools';
import { ChevronDownIcon, GenerationIcon, WorkflowIcon, EditingIcon } from './icons';

interface LeftPanelProps {
    activeTab: TabId;
    setActiveTab: (tabId: TabId) => void;
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


const LeftPanel: React.FC<LeftPanelProps> = React.memo(({ activeTab, setActiveTab }) => {
    const { setIsLeftPanelVisible, setIsRightPanelVisible } = useEditor();

    const groupedTabs = useMemo(() => {
        return editingTabs.reduce((acc, tab) => {
            const tool = tools.find(t => t.id === tab.id);
            if (tool) {
                const category = tool.category;
                if (!acc[category]) {
                    acc[category] = [];
                }
                acc[category].push(tab);
            }
            return acc;
        }, {} as Record<ToolCategory, typeof editingTabs>);
    }, []);

    const findCategoryForTab = (tabId: TabId): ToolCategory | null => {
        const tool = tools.find(t => t.id === tabId);
        return tool ? tool.category : null;
    };
    
    const [expandedCategory, setExpandedCategory] = useState<ToolCategory | null>(() => findCategoryForTab(activeTab));

    useEffect(() => {
        const category = findCategoryForTab(activeTab);
        if (category) {
            setExpandedCategory(category);
        }
    }, [activeTab]);
    
    const handleCategoryToggle = (category: ToolCategory) => {
        setExpandedCategory(prev => prev === category ? null : category);
    };

    const categoryOrder: ToolCategory[] = ['editing', 'workflow', 'generation'];

    return (
        <aside className="bg-gray-800/80 backdrop-blur-sm border-r border-gray-700/50 flex flex-col w-full h-full overflow-y-auto scrollbar-thin">
            {categoryOrder.map(category => {
                const tabs = groupedTabs[category as ToolCategory];
                if (!tabs || tabs.length === 0) return null;

                const categoryInfo = categoryConfig[category as ToolCategory];
                const isExpanded = expandedCategory === category;

                return (
                    <div key={category} className="border-b border-gray-700/50">
                        <button
                            onClick={() => handleCategoryToggle(category as ToolCategory)}
                            className="w-full flex items-center justify-between p-4 text-left text-gray-200 hover:bg-gray-700/60 transition-colors"
                            aria-expanded={isExpanded}
                        >
                            <div className="flex items-center gap-3">
                                {React.cloneElement(categoryInfo.icon, { className: 'w-5 h-5 text-blue-400' })}
                                <span className="font-bold">{categoryInfo.title}</span>
                            </div>
                            <ChevronDownIcon className={`w-5 h-5 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                        </button>

                        {isExpanded && (
                            <div className="py-2 px-1 space-y-1 animate-fade-in">
                                {tabs.map(tab => (
                                    <button
                                        key={tab.id}
                                        onClick={() => {
                                            setActiveTab(tab.id);
                                            if (window.innerWidth < 1024) {
                                                setIsLeftPanelVisible(false);
                                                setIsRightPanelVisible(true);
                                            }
                                        }}
                                        className={`w-full flex items-center gap-3 p-2 rounded-md text-left transition-colors ${activeTab === tab.id ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-700/80 hover:text-white'}`}
                                        aria-label={tab.name}
                                        aria-pressed={activeTab === tab.id}
                                    >
                                        <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center text-gray-400">
                                            {React.cloneElement(tab.icon as React.ReactElement<any>, { className: 'w-5 h-5' })}
                                        </div>
                                        <div className="flex items-center justify-between flex-grow">
                                            <span className="text-sm font-semibold">{tab.name}</span>
                                            {tab.tag === 'new' && (
                                                <span className="px-2 py-0.5 text-xs font-bold text-white bg-blue-500 rounded-full shadow-[0_0_8px_rgba(59,130,246,0.8)] animate-pulse">
                                                    NOVO
                                                </span>
                                            )}
                                            {tab.tag === 'tip' && (
                                                <span className="px-2 py-0.5 text-xs font-bold text-gray-900 bg-yellow-400 rounded-full shadow-[0_0_8px_rgba(250,204,21,0.8)] animate-pulse">
                                                    DICA
                                                </span>
                                            )}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                );
            })}
        </aside>
    );
});

export default LeftPanel;
