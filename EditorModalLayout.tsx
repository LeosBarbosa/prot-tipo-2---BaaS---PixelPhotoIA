/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useMemo, useEffect, useRef } from 'react';
// FIX: Correct import path for useEditor
import { useEditor } from './context/EditorContext';
import ImageViewer from './components/ImageViewer';
import FloatingControls from './components/FloatingControls';
import { type TabId, type ToolConfig } from './types';
import GifTimeline from './components/common/GifTimeline';
import LeftPanel from './components/LeftPanel';
import RightPanel from './components/RightPanel';
import MobileBottomNav from './components/MobileBottomNav';
import { toolToTabMap, tools } from './config/tools';
import { panelComponents } from './config/toolComponentMap';

const EditorModalLayout: React.FC = () => {
    const { activeTool, isGif, isLeftPanelVisible, setIsLeftPanelVisible, isRightPanelVisible, setIsRightPanelVisible, activeTab, setActiveTab, setToast, isPanModeActive } = useEditor();
    
    // When the tool from the homepage changes, update the active tab
    useEffect(() => {
        if (activeTool) {
            const initialTab = toolToTabMap[activeTool] ?? 'adjust'; // Default to 'adjust' if not mapped
            setActiveTab(initialTab);
        }
        
        // Show a hint the first time a mobile user opens the editor
        const firstTimeMobile = localStorage.getItem('hasSeenSwipeHint') !== 'true';
        if (window.innerWidth < 1024 && firstTimeMobile) {
            setToast({ message: 'Use a barra inferior para navegar entre ferramentas e opções.', type: 'info' });
            localStorage.setItem('hasSeenSwipeHint', 'true');
        }
    }, [activeTool, setActiveTab, setToast]);

    const activeToolConfig = useMemo(() => tools.find(tool => tool.id === activeTab), [activeTab]);

    const showBackdrop = isLeftPanelVisible || isRightPanelVisible;

    const touchStartRef = useRef<{ x: number, time: number } | null>(null);

    const handleTouchStart = (e: React.TouchEvent) => {
        if (isPanModeActive) {
            touchStartRef.current = null;
            return;
        }
        const target = e.target as HTMLElement;
        // Ignore swipes if the touch starts on an interactive element or inside a scrollable panel.
        if (target.closest('button, a, input, [role="button"], .scrollbar-thin, .ReactCrop__crop-selection, .ReactCrop__drag-handle')) {
            touchStartRef.current = null;
            return;
        }

        if (e.touches.length === 1) {
            touchStartRef.current = { x: e.touches[0].clientX, time: Date.now() };
        }
    };
    
    const handleTouchEnd = (e: React.TouchEvent) => {
        if (isPanModeActive || !touchStartRef.current) return;
    
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
            <aside className={`fixed lg:relative z-40 h-full w-full max-w-sm lg:w-80 flex-shrink-0 transition-transform duration-300 ease-in-out ${isLeftPanelVisible ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
                <LeftPanel />
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
            <aside className={`fixed lg:relative right-0 z-40 h-full w-full max-w-sm lg:w-96 flex-shrink-0 transition-transform duration-300 ease-in-out ${isRightPanelVisible ? 'translate-x-0' : 'translate-x-full'} lg:translate-x-0`}>
                <RightPanel activeToolConfig={activeToolConfig as ToolConfig | undefined} panelComponents={panelComponents} />
            </aside>

            <MobileBottomNav />
        </div>
    );
};
export default EditorModalLayout;
