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

interface PanelProps {
    activeTabConfig: TabConfig | undefined;
    editingPanelComponents: Partial<Record<TabId, React.LazyExoticComponent<React.FC<{}>>>>;
}

/**
 * Subcomponente responsável por carregar e renderizar dinamicamente 
 * os controlos da ferramenta ativa (ex: sliders, botões de corte).
 * Equivale ao bloco "RenderizarControles" da especificação.
 */
const ActiveToolPanel: React.FC<PanelProps> = ({ activeTabConfig, editingPanelComponents }) => {
    if (!activeTabConfig) {
        return (
            <div className="flex h-full flex-col items-center justify-center p-4">
                 <p className="text-gray-400">Selecione uma ferramenta</p>
            </div>
        );
    }
    
    const PanelComponent = editingPanelComponents[activeTabConfig.id];

    if (!PanelComponent) {
        return (
            <div className="flex h-full flex-col items-center justify-center p-4 text-center">
                 <p className="text-gray-400">Componente do painel não encontrado para '{activeTabConfig.name}'.</p>
            </div>
        );
    }
    
    return (
        <div className="p-4">
            <Suspense fallback={<div className="flex justify-center p-8"><Spinner /></div>}>
                <PanelComponent />
            </Suspense>
        </div>
    );
};

/**
 * O container principal do painel direito. Atua como a "shell" que organiza 
 * as seções dinâmicas e estáticas do painel.
 * Equivale ao bloco "RightPanelContainer" da especificação.
 */
const RightPanel: React.FC<PanelProps> = React.memo(({ activeTabConfig, editingPanelComponents }) => {
    return (
        <aside className="h-full bg-gray-800/80 backdrop-blur-sm border-l border-gray-700/50 flex flex-col">
            {activeTabConfig && (
                <header className="p-4 border-b border-gray-700/50 flex items-center gap-3 flex-shrink-0">
                    <div className="text-blue-400">{activeTabConfig.icon}</div>
                    <h2 className="text-lg font-bold text-white">{activeTabConfig.name}</h2>
                </header>
            )}
            <div className="flex-grow overflow-y-auto scrollbar-thin">
                <ActiveToolPanel 
                    activeTabConfig={activeTabConfig}
                    editingPanelComponents={editingPanelComponents}
                />
                {activeTabConfig && <GlobalMagicPrompt />}
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
