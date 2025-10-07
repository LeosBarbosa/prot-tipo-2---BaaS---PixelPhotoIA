/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { Suspense } from 'react';
import { type TabConfig } from '../config/tabs';
import GlobalMagicPrompt from './common/GlobalMagicPrompt';
import FooterActions from './FooterActions';
import LayersPanel from './LayersPanel';
import Spinner from './Spinner';
import { type TabId } from '../types';

interface RightPanelProps {
    activeTabConfig: TabConfig | undefined;
    editingPanelComponents: Partial<Record<TabId, React.LazyExoticComponent<React.FC<{}>>>>;
}

const RightPanel: React.FC<RightPanelProps> = React.memo(({ activeTabConfig, editingPanelComponents }) => {
    if (!activeTabConfig) {
        return (
             <aside className="h-full bg-gray-800/80 backdrop-blur-sm border-l border-gray-700/50 flex flex-col items-center justify-center">
                 <p className="text-gray-400">Selecione uma ferramenta</p>
            </aside>
        );
    }
    
    const PanelComponent = editingPanelComponents[activeTabConfig.id];

    if (!PanelComponent) {
        return (
             <aside className="h-full bg-gray-800/80 backdrop-blur-sm border-l border-gray-700/50 flex flex-col items-center justify-center p-4 text-center">
                 <p className="text-gray-400">Componente do painel não encontrado para '{activeTabConfig.name}'.</p>
            </aside>
        );
    }

    return (
        <aside className="h-full bg-gray-800/80 backdrop-blur-sm border-l border-gray-700/50 flex flex-col">
            <header className="p-4 border-b border-gray-700/50 flex items-center gap-3 flex-shrink-0">
                <div className="text-blue-400">{activeTabConfig.icon}</div>
                <h2 className="text-lg font-bold text-white">{activeTabConfig.name}</h2>
            </header>
            <div className="flex-grow overflow-y-auto scrollbar-thin">
                <div className="p-4">
                    <Suspense fallback={<div className="flex justify-center p-8"><Spinner /></div>}>
                        <PanelComponent />
                    </Suspense>
                </div>
                <GlobalMagicPrompt />
            </div>
            <div className="flex-shrink-0 border-t border-gray-700/50">
                <LayersPanel />
            </div>
            <div className="flex-shrink-0">
                <FooterActions />
            </div>
        </aside>
    );
});

export default RightPanel;