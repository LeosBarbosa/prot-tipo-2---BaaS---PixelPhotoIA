/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React from 'react';
import { TabConfig } from '../config/tabs';
import GlobalMagicPrompt from './common/GlobalMagicPrompt';
import FooterActions from './FooterActions';

interface RightPanelProps {
    activeTabConfig: TabConfig | undefined;
}

const RightPanel: React.FC<RightPanelProps> = React.memo(({ activeTabConfig }) => {
    if (!activeTabConfig) {
        return (
             <aside className="w-full max-w-sm lg:w-96 lg:max-w-none bg-gray-900/60 backdrop-blur-sm border-l border-gray-700/50 flex flex-col items-center justify-center">
                 <p className="text-gray-400">Selecione uma ferramenta</p>
            </aside>
        );
    }

    return (
        <aside className="w-full max-w-sm lg:w-96 lg:max-w-none bg-gray-900/60 backdrop-blur-sm border-l border-gray-700/50 flex flex-col">
            <header className="p-4 border-b border-gray-700/50 flex items-center gap-3 flex-shrink-0">
                <div className="text-blue-400">{activeTabConfig.icon}</div>
                <h2 className="text-lg font-bold text-white">{activeTabConfig.name}</h2>
            </header>
            <div className="flex-grow overflow-y-auto scrollbar-thin">
                <div className="p-4">
                    {activeTabConfig.component}
                </div>
                <GlobalMagicPrompt />
            </div>
            <div className="flex-shrink-0">
                <FooterActions />
            </div>
        </aside>
    );
});

export default RightPanel;