/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useMemo, useEffect, useRef } from 'react';
import { useEditor } from '../context/EditorContext';
import ImageViewer from './ImageViewer';
import FloatingControls from './FloatingControls';
import GifTimeline from './common/GifTimeline';
import LeftPanel from './LeftPanel';
import RightPanel from './RightPanel';
import { tools } from '../config/tools';
import MobileBottomNav from './MobileBottomNav';
import StudioStartScreen from './StudioStartScreen';
import { panelComponents } from '../config/toolComponentMap';
import { type ToolConfig } from '../types';

const StudioLayout: React.FC = () => {
    const {
        baseImageFile,
        isGif,
        isLeftPanelVisible,
        setIsLeftPanelVisible,
        isRightPanelVisible,
        setIsRightPanelVisible,
        activeTab,
        setToast,
        isPanModeActive, // Added
    } = useEditor();

    useEffect(() => {
        // Mostra uma dica na primeira vez que um usuário móvel abre o editor
        const firstTimeMobile = localStorage.getItem('hasSeenSwipeHint') !== 'true';
        if (baseImageFile && window.innerWidth < 1024 && firstTimeMobile) {
            setToast({ message: 'Use a barra inferior ou deslize para navegar entre ferramentas e opções.', type: 'info' });
            localStorage.setItem('hasSeenSwipeHint', 'true');
        }
    }, [baseImageFile, setToast]);

    const activeToolConfig = useMemo(() => tools.find(tool => tool.id === activeTab), [activeTab]);

    const showBackdrop = isLeftPanelVisible || isRightPanelVisible;

    const touchStartRef = useRef<{ x: number, time: number } | null>(null);

    const handleTouchStart = (e: React.TouchEvent) => {
        if (isPanModeActive) { // Added this block
            touchStartRef.current = null;
            return;
        }
        const target = e.target as HTMLElement;
        if (target.closest('button, a, input, [role="button"], .scrollbar-thin, .ReactCrop__crop-selection, .ReactCrop__drag-handle')) {
            touchStartRef.current = null;
            return;
        }

        if (e.touches.length === 1) {
            touchStartRef.current = { x: e.touches[0].clientX, time: Date.now() };
        }
    };

    const handleTouchEnd = (e: React.TouchEvent) => {
        if (isPanModeActive || !touchStartRef.current) { // Added isPanModeActive check
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
            if (deltaX > 0 && !isLeftPanelVisible) {
                setIsLeftPanelVisible(true);
                setIsRightPanelVisible(false);
            } else if (deltaX < 0 && !isRightPanelVisible) {
                setIsRightPanelVisible(true);
                setIsLeftPanelVisible(false);
            } else if (deltaX < 0 && isLeftPanelVisible) {
                 setIsLeftPanelVisible(false);
            } else if (deltaX > 0 && isRightPanelVisible) {
                setIsRightPanelVisible(false);
            }
        }
        touchStartRef.current = null;
    };

    return (
        <div
            className="w-full h-full flex flex-row overflow-hidden relative bg-black/20"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
        >
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
                <LeftPanel />
            </aside>

            {/* Main Content */}
            <main
                className={`flex-grow flex flex-col relative pb-20 lg:pb-0 transition-all duration-300 ease-in-out origin-center
                    ${(isLeftPanelVisible || isRightPanelVisible) ? 'scale-90 rounded-2xl shadow-2xl overflow-hidden blur-sm lg:scale-100 lg:rounded-none lg:shadow-none lg:overflow-auto lg:blur-0' : 'scale-100'}
                `}
            >
                <div className="flex-grow flex items-center justify-center p-4 relative overflow-hidden">
                    {baseImageFile ? (
                        <>
                            <ImageViewer />
                            <FloatingControls />
                        </>
                    ) : (
                        <StudioStartScreen />
                    )}
                </div>
                {baseImageFile && isGif && <GifTimeline />}
            </main>

            {/* Right Panel */}
            <aside className={`fixed lg:relative right-0 z-40 h-full w-full max-w-xs sm:max-w-sm lg:w-96 flex-shrink-0 transition-transform duration-300 ease-in-out ${isRightPanelVisible ? 'translate-x-0' : 'translate-x-full'} lg:translate-x-0`}>
                <RightPanel activeToolConfig={activeToolConfig} panelComponents={panelComponents} />
            </aside>

            {baseImageFile && <MobileBottomNav />}
        </div>
    );
};
export default StudioLayout;