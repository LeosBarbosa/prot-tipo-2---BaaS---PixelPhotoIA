/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useMemo, useEffect } from 'react';
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
    denoise: 'photoRestoration',
};

const EditorModalLayout: React.FC = () => {
    // FIX: Replaced `panelsVisible` with `isLeftPanelVisible` and `isRightPanelVisible` to align with the EditorContext state.
    const { activeTool, isGif, isLeftPanelVisible, isRightPanelVisible, activeTab, setActiveTab } = useEditor();

    useEffect(() => {
        if(activeTool) {
            const initialTab = toolToTabMap[activeTool] || 'adjust';
            setActiveTab(initialTab);
        }
    }, [activeTool, setActiveTab]);
    
    const activeTabConfig = useMemo(() => editingTabs.find(tab => tab.id === activeTab), [activeTab]);

    return (
        <div className="w-full flex flex-row overflow-hidden">
            {/* Left Panel - Hidden on small screens if panelsVisible is false */}
            {/* FIX: Used `isLeftPanelVisible` to control the visibility of the left panel. */}
            <div className={`absolute top-0 left-0 h-full lg:relative transition-transform duration-300 ease-in-out z-30 ${isLeftPanelVisible ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
                <LeftPanel activeTab={activeTab} setActiveTab={setActiveTab} />
            </div>

            <main className="flex-grow flex flex-col bg-black/20 relative">
                <div className="flex-grow flex items-center justify-center p-4 relative overflow-hidden">
                    <ImageViewer />
                    <FloatingControls />
                </div>
                {isGif && <GifTimeline />}
            </main>

            {/* Right Panel - Hidden on small screens if panelsVisible is false */}
            {/* FIX: Used `isRightPanelVisible` to control the visibility of the right panel. */}
            <div className={`absolute top-0 right-0 h-full lg:relative transition-transform duration-300 ease-in-out z-20 ${isRightPanelVisible ? 'translate-x-0' : 'translate-x-full'} lg:translate-x-0`}>
                 <RightPanel activeTabConfig={activeTabConfig} />
            </div>
        </div>
    );
};
export default EditorModalLayout;