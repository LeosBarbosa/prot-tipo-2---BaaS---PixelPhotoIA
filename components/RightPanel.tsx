/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { Suspense } from 'react';
import FooterActions from './FooterActions';
import LayersPanel from './LayersPanel';
import Spinner from './Spinner';
// FIX: import from ../types
import { type ToolId, type ToolConfig } from '../types';

interface PanelProps {
    activeToolConfig: ToolConfig | undefined;
    panelComponents: Partial<Record<ToolId, React.LazyExoticComponent<React.FC<{}>>>>;
}

const ActiveToolPanel: React.FC<PanelProps> = ({ activeToolConfig, panelComponents }) => {
    if (!activeToolConfig) {
        return (
            <div className="flex h-full flex-col items-center justify-center p-4 text-center">
                 <p className="text-gray-400">Selecione uma ferramenta no painel esquerdo para começar.</p>
            </div>
        );
    }
    
    const PanelComponent = panelComponents[activeToolConfig.id];

    if (!PanelComponent) {
        return (
            <div className="flex h-full flex-col items-center justify-center p-4 text-center">
                 <p className="text-gray-400">Componente do painel não encontrado para '{activeToolConfig.name}'.</p>
            </div>
        );
    }
    
    return (
        <Suspense fallback={<div className="flex justify-center p-8"><Spinner /></div>}>
            <PanelComponent />
        </Suspense>
    );
};

const RightPanel: React.FC<PanelProps> = React.memo(({ activeToolConfig, panelComponents }) => {
    return (
        <aside className="h-full bg-gray-800/80 border-l border-gray-700/50 flex flex-col">
            <header className="p-4 border-b border-gray-700/50 flex items-center gap-3 flex-shrink-0 h-[68px]">
                {activeToolConfig ? (
                    <>
                        {/* FIX: Cast icon to React.ReactElement<any> to allow adding className prop. */}
                        {React.cloneElement(activeToolConfig.icon as React.ReactElement<any>, { className: 'w-6 h-6 text-blue-400' })}
                        <h2 className="text-lg font-bold text-white">{activeToolConfig.name}</h2>
                    </>
                ) : (
                    <h2 className="text-lg font-bold text-white">Opções</h2>
                )}
            </header>
            <div className="flex-grow overflow-y-auto scrollbar-thin p-4">
                <ActiveToolPanel 
                    activeToolConfig={activeToolConfig}
                    panelComponents={panelComponents}
                />
            </div>
            {activeToolConfig?.category === 'editing' && (
                <>
                    <div className="flex-shrink-0 border-t border-gray-700/50">
                        <LayersPanel />
                    </div>
                    <div className="flex-shrink-0">
                        <FooterActions />
                    </div>
                </>
            )}
        </aside>
    );
});

export default RightPanel;