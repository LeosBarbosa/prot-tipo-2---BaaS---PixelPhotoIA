/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useMemo, useEffect } from 'react';
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
};

interface EditorModalLayoutProps {
    editingPanelComponents: Partial<Record<TabId, React.LazyExoticComponent<React.FC<{}>>>>;
}

const EditorModalLayout: React.FC<EditorModalLayoutProps> = ({ editingPanelComponents }) => {
    const { activeTool, isGif, isLeftPanelVisible, setIsLeftPanelVisible, isRightPanelVisible, setIsRightPanelVisible, activeTab, setActiveTab } = useEditor();
    
    // Quando a ferramenta inicial da página inicial muda, atualize a aba ativa
    useEffect(() => {
        if (activeTool) {
            const initialTab = toolToTabMap[activeTool] ?? 'adjust'; // Padrão para 'adjust' se não mapeado
            setActiveTab(initialTab);
        }
    }, [activeTool, setActiveTab]);

    const activeTabConfig = useMemo(() => editingTabs.find(tab => tab.id === activeTab), [activeTab]);

    const showBackdrop = isLeftPanelVisible || isRightPanelVisible;

    return (
        <div className="w-full h-full flex flex-row overflow-hidden relative bg-black/20">
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
            <main className="flex-grow flex flex-col relative">
                <div className="flex-grow flex items-center justify-center p-4 relative overflow-hidden">
                    <ImageViewer />
                    <FloatingControls />
                </div>
                {isGif && <GifTimeline />}
            </main>

            {/* Right Panel */}
            <aside className={`fixed lg:relative right-0 z-40 h-full w-full max-w-sm lg:w-96 flex-shrink-0 transition-transform duration-300 ease-in-out ${isRightPanelVisible ? 'translate-x-0' : 'translate-x-full'} lg:translate-x-0`}>
                <RightPanel activeTabConfig={activeTabConfig} editingPanelComponents={editingPanelComponents} />
            </aside>
        </div>
    );
};
export default EditorModalLayout;