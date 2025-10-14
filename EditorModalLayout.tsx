/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useMemo, useEffect, useRef } from 'react';
import { useEditor } from './context/EditorContext';
import ImageViewer from './ImageViewer';
import FloatingControls from './FloatingControls';
import { type TabId, type ToolId } from './types';
import GifTimeline from './components/common/GifTimeline';
import LeftPanel from './LeftPanel';
import RightPanel from './RightPanel';
import { editingTabs } from './config/tabs';
import MobileBottomNav from './MobileBottomNav';
import { toolToTabMap } from './config/tools';

interface EditorModalLayoutProps {
    editingPanelComponents: Partial<Record<TabId, React.LazyExoticComponent<React.FC<{}>>>>;
}


const EditorModalLayout: React.FC<EditorModalLayoutProps> = ({ editingPanelComponents }) => {
    const {
        activeTool,
        isGif,
        isLeftPanelVisible,
        setIsLeftPanelVisible,
        isRightPanelVisible,
        setIsRightPanelVisible,
        activeTab,
        setActiveTab,
        setToast,
        isPanModeActive, // Added
        baseImageFile
    } = useEditor();

    // Quando a ferramenta inicial da página inicial muda, atualize a aba ativa
    useEffect(() => {
        if (activeTool) {
            const initialTab = toolToTabMap[activeTool] ?? 'adjust'; // Padrão para 'adjust' se não mapeado
            setActiveTab(initialTab);
        }

        // Mostra uma dica na primeira vez que um usuário móvel abre o editor
        const firstTimeMobile = localStorage.getItem('hasSeenSwipeHint') !== 'true';
        if (window.innerWidth < 1024 && firstTimeMobile) {
            setToast({ message: 'Use a barra inferior ou deslize para navegar entre ferramentas e opções.', type: 'info' });
            localStorage.setItem('hasSeenSwipeHint', 'true');
        }
    }, [activeTool, setActiveTab, setToast]);

    const activeTabConfig = useMemo(() => editingTabs.find(tab => tab.id === activeTab), [activeTab]);

    const showBackdrop = isLeftPanelVisible || isRightPanelVisible;

    const touchStartRef = useRef<{ x: number, time: number } | null>(null);

    const handleTouchStart = (e: React.TouchEvent) => {
        if (isPanModeActive) {
            touchStartRef.current = null;
            return;
        }
        const target = e.target as HTMLElement;
        // Ignore swipes if the touch starts on an interactive element or inside a scrollable panel.
        // This prevents swipe-to-close from interfering with scrolling or button clicks.
        if (target.closest('button, a, input, [role="button"], .scrollbar-thin, .ReactCrop__crop-selection, .ReactCrop__drag-handle')) {
            touchStartRef.current = null;
            return;
        }

        if (e.touches.length === 1) {
            touchStartRef.current = { x: e.touches[0].clientX, time: Date.now() };
        }
    };

    const handleTouchEnd = (e: React.TouchEvent) => {
        if (isPanModeActive || !touchStartRef.current) {
            return;
        }

        const touchEnd = e.changedTouches[0];
        const deltaX = touchEnd.clientX - touchStartRef.current.x;
        const deltaTime = Date.now() - touchStartRef.current.time;
        const velocity = Math.abs(deltaX / deltaTime);

        const SWIPE_THRESHOLD = 80;
        const VELOCITY_THRESHOLD = 0.3;

        const isFastSwipe = velocity > VELOCITY_THRESHOLD;
        const isSignificantSwipe = Math.abs(deltaX) > SWIPE_THRESHOLD;

        if (isFastSwipe || isSignificantSwipe) {
            if (deltaX > 0 && !isLeftPanelVisible) { // Swipe right to open left panel
                setIsLeftPanelVisible(true);
                setIsRightPanelVisible(false);
            } else if (deltaX < 0 && !isRightPanelVisible) { // Swipe left to open right panel
                setIsRightPanelVisible(true);
                setIsLeftPanelVisible(false);
            } else if (deltaX < 0 && isLeftPanelVisible) { // Swipe left to close left panel
                 setIsLeftPanelVisible(false);
            } else if (deltaX > 0 && isRightPanelVisible) { // Swipe right to close right panel
                setIsRightPanelVisible(false);
            }
        }
        touchStartRef.current = null;
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
                    className="fixed inset-0 bg-black/60 backdrop-blur-md z-30 lg:hidden animate-fade-in"
                    onClick={() => {
                        setIsLeftPanelVisible(false);
                        setIsRightPanelVisible(false);
                    }}
                    aria-hidden="true"
                />
            )}

            {/* Left Panel */}
            <aside className={`fixed lg:relative z-40 h-full w-full max-w-xs sm:max-w-sm lg:w-80 flex-shrink-0 transition-transform duration-300 ease-in-out ${isLeftPanelVisible ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
                {/* FIX: Pass required props to LeftPanel to resolve type error. */}
                <LeftPanel activeTab={activeTab} setActiveTab={setActiveTab} />
            </aside>

            {/* Main Content */}
            <main
                className={`flex-grow flex flex-col relative pb-20 lg:pb-0 transition-all duration-300 ease-in-out origin-center
                    ${(isLeftPanelVisible || isRightPanelVisible) ? 'scale-90 rounded-2xl shadow-2xl overflow-hidden blur-sm lg:scale-100 lg:rounded-none lg:shadow-none lg:overflow-auto lg:blur-0' : 'scale-100'}
                `}
            >
                <div className="flex-grow flex items-center justify-center p-4 relative overflow-hidden">
                    <ImageViewer />
                    <FloatingControls />
                </div>
                {isGif && <GifTimeline />}
            </main>

            {/* Right Panel */}
            <aside className={`fixed lg:relative right-0 z-40 h-full w-full max-w-xs sm:max-w-sm lg:w-96 flex-shrink-0 transition-transform duration-300 ease-in-out ${isRightPanelVisible ? 'translate-x-0' : 'translate-x-full'} lg:translate-x-0`}>
                <RightPanel activeTabConfig={activeTabConfig} editingPanelComponents={editingPanelComponents} />
            </aside>

            {baseImageFile && <MobileBottomNav />}
        </div>
    );
};
export default EditorModalLayout;