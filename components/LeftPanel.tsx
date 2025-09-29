/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';
import { editingTabs } from '../config/tabs';
import { type TabId } from '../types';
import { useEditor } from '../context/EditorContext';

interface LeftPanelProps {
    activeTab: TabId;
    setActiveTab: (tabId: TabId) => void;
}

const LeftPanel: React.FC<LeftPanelProps> = React.memo(({ activeTab, setActiveTab }) => {
    const { setIsLeftPanelVisible, setIsRightPanelVisible } = useEditor();
    
    return (
        <aside className="w-20 bg-gray-900/60 backdrop-blur-sm border-r border-gray-700/50 flex flex-col items-center py-4 gap-4 h-full overflow-y-auto scrollbar-thin">
            {editingTabs.map(tab => (
                <button
                    key={tab.id}
                    onClick={() => {
                        setActiveTab(tab.id)
                        // On mobile, automatically switch from tool list to tool options
                        if (window.innerWidth < 1024) {
                            setIsLeftPanelVisible(false);
                            setIsRightPanelVisible(true);
                        }
                    }}
                    className={`relative group w-14 h-14 flex items-center justify-center rounded-xl transition-all duration-200 flex-shrink-0 ${activeTab === tab.id ? 'bg-blue-600 text-white scale-110 shadow-lg shadow-blue-500/20' : 'bg-gray-800/50 text-gray-400 hover:bg-blue-500/20 hover:text-white'}`}
                    aria-label={tab.name}
                    aria-pressed={activeTab === tab.id}
                >
                    {tab.icon}
                    <span className="absolute left-full ml-4 px-2 py-1 bg-gray-800 text-white text-xs rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                        {tab.name}
                    </span>
                </button>
            ))}
        </aside>
    );
});

export default LeftPanel;