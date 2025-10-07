/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useMemo, useEffect, useState } from 'react';
import { useEditor } from '../context/EditorContext';
import ImageViewer from './ImageViewer';
import FloatingControls from './FloatingControls';
import { type TabId, type ToolId } from '../types';
import GifTimeline from './common/GifTimeline';
import LeftPanel from './LeftPanel';
import RightPanel from './RightPanel';
import { editingTabs } from '../config/tabs';

const toolToTabMap: Partial<Record<ToolId, TabId>> = {
    extractArt: 'extractArt',
    removeBg: 'removeBg',
    style: 'style',
    portraits: 'portraits',
    faceRecovery: 'photoRestoration',
    styleGen: 'styleGen',
    adjust: 'adjust',
    relight: 'relight',
    generativeEdit: 'generativeEdit',
    crop: 'crop',
    upscale: 'upscale',
    unblur: 'unblur',
    neuralFilters: 'neuralFilters',
    trends: 'trends',
    dustAndScratches: 'dustAndScratches',
    objectRemover: 'objectRemover',
    texture: 'texture',
    magicMontage: 'magicMontage',
    photoRestoration: 'photoRestoration',
    text: 'text',
    lowPoly: 'lowPoly',
    pixelArt: 'pixelArt',
    denoise: 'photoRestoration',
    faceSwap: 'faceSwap',
    localAdjust: 'localAdjust',
};

interface EditorModalLayoutProps {
    editingPanelComponents: Partial<Record<TabId, React.LazyExoticComponent<React.FC<{}>>>>;
}


const EditorModalLayout: React.FC<EditorModalLayoutProps> = ({ editingPanelComponents }) => {
    const { activeTool, isGif, isLeftPanelVisible, setIsLeftPanelVisible, isRightPanelVisible, setIsRightPanelVisible, activeTab, setActiveTab, setToast } = useEditor();
    
    // Estado para o gesto de deslizar
    const [touchStartX, setTouchStartX] = useState<number | null>(null);
    const [touchStartY, setTouchStartY] = useState<number | null>(null);

    // Quando a ferramenta inicial da página inicial muda, atualize a aba ativa
    useEffect(() => {
        if (activeTool) {
            const initialTab = toolToTabMap[activeTool] ?? 'adjust'; // Padrão para 'adjust' se não mapeado
            setActiveTab(initialTab);
        }
        
        // Exibe uma dica na primeira vez que um usuário mobile abre o editor
        const firstTimeMobile = localStorage.getItem('hasSeenSwipeHint') !== 'true';
        if (window.innerWidth < 1024 && firstTimeMobile) {
            setToast({ message: 'Arraste da borda esquerda para ver as ferramentas!', type: 'info' });
            localStorage.setItem('hasSeenSwipeHint', 'true');
        }
    }, [activeTool, setActiveTab, setToast]);

    const activeTabConfig = useMemo(() => editingTabs.find(tab => tab.id === activeTab), [activeTab]);

    const showBackdrop = isLeftPanelVisible || isRightPanelVisible;

    const handleTouchStart = (e: React.TouchEvent) => {
        // Acompanha apenas deslizes de um dedo para navegação do painel
        if (e.touches.length === 1) {
            setTouchStartX(e.touches[0].clientX);
            setTouchStartY(e.touches[0].clientY);
        } else {
            setTouchStartX(null);
            setTouchStartY(null);
        }
    };

    const handleTouchEnd = (e: React.TouchEvent) => {
        // Gestos apenas para viewports de celular
        if (window.innerWidth >= 1024 || !touchStartX || !touchStartY) {
            return;
        }

        const touchEndX = e.changedTouches[0].clientX;
        const touchEndY = e.changedTouches[0].clientY;

        const deltaX = touchEndX - touchStartX;
        const deltaY = touchEndY - touchStartY;
        
        const minSwipeDistance = 50;
        
        // Garante que é um deslize horizontal, não uma tentativa de rolagem vertical
        if (Math.abs(deltaX) > minSwipeDistance && Math.abs(deltaX) > Math.abs(deltaY)) {
            // DESLIZE PARA A DIREITA
            if (deltaX > 0) { 
                if (isRightPanelVisible) {
                    // Fecha o painel direito ao deslizar para a direita
                    setIsRightPanelVisible(false);
                } else if (!isLeftPanelVisible && touchStartX < 50) {
                    // Abre o painel esquerdo se estiver fechado e o deslize começar na borda da tela
                    setIsLeftPanelVisible(true);
                    setIsRightPanelVisible(false); // Garante que o painel direito está fechado
                }
            } 
            // DESLIZE PARA A ESQUERDA
            else { 
                if (isLeftPanelVisible) {
                    // Fecha o painel esquerdo ao deslizar para a esquerda
                    setIsLeftPanelVisible(false);
                }
            }
        }
        
        // Reseta após cada toque finalizado
        setTouchStartX(null);
        setTouchStartY(null);
    };


    return (
        <div 
            className="w-full h-full flex flex-row overflow-hidden relative bg-black/20 animate-fade-in"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
        >
            {/* Backdrop for mobile overlays */}
            {showBackdrop && (
                <div
                    className="fixed inset-0 bg-black/60 z-30 lg:hidden animate-fade-in"
                    onClick={() => {
                        setIsLeftPanelVisible(false);
                        setIsRightPanelVisible(false);
                    }}
                    aria-hidden="true"
                />
            )}

            {/* Left Panel */}
            <aside className={`fixed lg:relative z-40 h-full w-80 flex-shrink-0 transition-transform duration-300 ease-in-out ${isLeftPanelVisible ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
                <LeftPanel activeTab={activeTab} setActiveTab={setActiveTab} />
            </aside>

            {/* Main Content */}
            <main 
                className="flex-grow flex flex-col relative"
            >
                <div className="flex-grow flex items-center justify-center p-4 relative overflow-hidden">
                    <ImageViewer />
                    <FloatingControls />
                </div>
                {isGif && <GifTimeline />}
            </main>

            {/* Right Panel */}
            <aside className={`fixed lg:relative right-0 z-40 h-full w-11/12 max-w-sm lg:w-96 flex-shrink-0 transition-transform duration-300 ease-in-out ${isRightPanelVisible ? 'translate-x-0' : 'translate-x-full'} lg:translate-x-0`}>
                <RightPanel activeTabConfig={activeTabConfig} editingPanelComponents={editingPanelComponents} />
            </aside>
        </div>
    );
};
export default EditorModalLayout;