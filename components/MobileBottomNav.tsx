/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React from 'react';
// FIX: Correct import path
import { useEditor } from '../context/EditorContext';
import { LayersIcon, AdjustmentsHorizontalIcon, EyeIcon } from './icons';

const MobileBottomNav: React.FC = () => {
    const { 
        isLeftPanelVisible, 
        setIsLeftPanelVisible,
        isRightPanelVisible,
        setIsRightPanelVisible,
    } = useEditor();

    const handleLeftPanelToggle = () => {
        const newVisibility = !isLeftPanelVisible;
        setIsLeftPanelVisible(newVisibility);
        if (newVisibility) {
            setIsRightPanelVisible(false);
        }
    };

    const handleRightPanelToggle = () => {
        const newVisibility = !isRightPanelVisible;
        setIsRightPanelVisible(newVisibility);
        if (newVisibility) {
            setIsLeftPanelVisible(false);
        }
    };

    const handleViewToggle = () => {
        // This button simply closes any open panel
        setIsLeftPanelVisible(false);
        setIsRightPanelVisible(false);
    };

    const isViewMode = !isLeftPanelVisible && !isRightPanelVisible;

    return (
        <footer className="fixed bottom-0 left-0 right-0 z-40 bg-gray-900/80 backdrop-blur-sm border-t border-gray-700 p-2 flex items-center justify-around lg:hidden animate-zoom-rise">
            <button 
                onClick={handleLeftPanelToggle}
                className={`flex flex-col items-center justify-center gap-1 p-2 rounded-lg transition-colors w-24 ${isLeftPanelVisible ? 'text-blue-400' : 'text-gray-400 hover:text-white'}`}
                aria-label="Alternar painel de ferramentas"
                aria-pressed={isLeftPanelVisible}
            >
                <LayersIcon className="w-6 h-6" />
                <span className="text-xs font-semibold">Ferramentas</span>
            </button>
            <button
                onClick={handleViewToggle}
                className={`flex flex-col items-center justify-center gap-1 p-2 rounded-lg transition-colors w-24 ${isViewMode ? 'text-blue-400' : 'text-gray-400 hover:text-white'}`}
                aria-label="Modo de visualização"
                aria-pressed={isViewMode}
            >
                <EyeIcon className="w-6 h-6" />
                <span className="text-xs font-semibold">Visualizar</span>
            </button>
            <button
                onClick={handleRightPanelToggle}
                className={`flex flex-col items-center justify-center gap-1 p-2 rounded-lg transition-colors w-24 ${isRightPanelVisible ? 'text-blue-400' : 'text-gray-400 hover:text-white'}`}
                aria-label="Alternar painel de opções"
                aria-pressed={isRightPanelVisible}
            >
                <AdjustmentsHorizontalIcon className="w-6 h-6" />
                <span className="text-xs font-semibold">Opções</span>
            </button>
        </footer>
    );
};

export default MobileBottomNav;