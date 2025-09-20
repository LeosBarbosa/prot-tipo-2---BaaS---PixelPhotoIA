/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useEffect, useMemo } from 'react';
import { useEditor } from '../context/EditorContext';
import ImageViewer from './ImageViewer';
import FooterActions from './FooterActions';
import FloatingControls from './FloatingControls';
import { type TabId, type ToolId } from '../types';

import {
    BullseyeIcon, ScissorsIcon, PaletteIcon, UserIcon, BrushIcon, AdjustmentsHorizontalIcon,
    SunIcon, SparkleIcon, LayersIcon, CropIcon, ArrowUpOnSquareIcon, LightbulbIcon
} from './icons';

import CropPanel from './tools/CropPanel';
import StylePanel from './tools/StylePanel';
import AdjustmentPanel from './tools/AdjustmentPanel';
import GenerativeEditPanel from './tools/GenerativeEditPanel';
import RemoveBgPanel from './tools/RemoveBgPanel';
import UpscalePanel from './tools/UpscalePanel';
import PortraitsPanel from './tools/PortraitsPanel';
import StyleGenPanel from './tools/StyleGenPanel';
import RelightPanel from './tools/RelightPanel';
import ExtractArtPanel from './tools/ExtractArtPanel';
import NeuralFiltersPanel from './tools/NeuralFiltersPanel';
import TrendsPanel from './tools/TrendsPanel';


const tabConfig: { id: TabId, name: string, icon: React.ReactNode }[] = [
    { id: 'extract', name: 'Extrair Arte', icon: <BullseyeIcon className="w-6 h-6" /> },
    { id: 'removeBg', name: 'Remover Fundo', icon: <ScissorsIcon className="w-6 h-6" /> },
    { id: 'styles', name: 'Estilos', icon: <PaletteIcon className="w-6 h-6" /> },
    { id: 'portraits', name: 'Retratos', icon: <UserIcon className="w-6 h-6" /> },
    { id: 'styleGen', name: 'Geração', icon: <BrushIcon className="w-6 h-6" /> },
    { id: 'localAdjust', name: 'Ajustes Locais', icon: <AdjustmentsHorizontalIcon className="w-6 h-6" /> },
    { id: 'adjust', name: 'Ajustes (IA)', icon: <SunIcon className="w-6 h-6" /> },
    { id: 'neuralFilters', name: 'Filtros Neurais', icon: <SparkleIcon className="w-6 h-6" /> },
    { id: 'generativeEdit', name: 'Edição Generativa', icon: <LayersIcon className="w-6 h-6" /> },
    { id: 'crop', name: 'Cortar e Girar', icon: <CropIcon className="w-6 h-6" /> },
    { id: 'upscale', name: 'Aumentar Escala', icon: <ArrowUpOnSquareIcon className="w-6 h-6" /> },
    { id: 'trends', name: 'Tendências', icon: <LightbulbIcon className="w-6 h-6" /> },
];

const toolToTabMap: Partial<Record<ToolId, TabId>> = {
    extractArt: 'extract',
    removeBg: 'removeBg',
    style: 'styles',
    portraits: 'portraits',
    styleGen: 'styleGen',
    adjust: 'localAdjust',
    relight: 'adjust',
    generativeEdit: 'generativeEdit',
    crop: 'crop',
    upscale: 'upscale',
    neuralFilters: 'neuralFilters',
    trends: 'trends',
};


const EditorModalLayout: React.FC = () => {
    const { activeTool } = useEditor();
    const initialTab = useMemo(() => activeTool ? (toolToTabMap[activeTool] ?? 'crop') : 'crop', [activeTool]);
    const [activeTab, setActiveTab] = useState<TabId>(initialTab);

    useEffect(() => {
        setActiveTab(initialTab);
    }, [initialTab]);

    const renderPanel = () => {
        switch (activeTab) {
            case 'extract': return <ExtractArtPanel />;
            case 'removeBg': return <RemoveBgPanel />;
            case 'styles': return <StylePanel />;
            case 'portraits': return <PortraitsPanel />;
            case 'styleGen': return <StyleGenPanel />;
            case 'localAdjust': return <AdjustmentPanel />;
            case 'adjust': return <RelightPanel />;
            case 'neuralFilters': return <NeuralFiltersPanel />;
            case 'generativeEdit': return <GenerativeEditPanel />;
            case 'crop': return <CropPanel />;
            case 'upscale': return <UpscalePanel />;
            case 'trends': return <TrendsPanel />;
            default: return null;
        }
    };
    
    return (
        <div className="w-full h-full flex flex-col lg:flex-row overflow-hidden">
            <nav className="w-full lg:w-28 bg-gray-900/30 border-b lg:border-b-0 lg:border-r border-gray-700/50 flex lg:flex-col items-center gap-1 p-2 overflow-x-auto lg:overflow-y-auto">
                {tabConfig.map(tab => (
                    <button 
                        key={tab.id} 
                        onClick={() => setActiveTab(tab.id)}
                        title={tab.name}
                        className={`w-20 h-20 flex flex-col items-center justify-center rounded-lg transition-all duration-200 flex-shrink-0 ${activeTab === tab.id ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-white/10 hover:text-white'}`}
                    >
                        {tab.icon}
                        <span className="text-[11px] font-medium mt-1 text-center">{tab.name}</span>
                    </button>
                ))}
            </nav>
            <main className="flex-grow flex items-center justify-center p-4 bg-black/20 relative">
                <ImageViewer />
                <FloatingControls />
            </main>
            <aside className="w-full lg:w-96 lg:flex-shrink-0 bg-gray-900/40 border-l border-gray-700/50 flex flex-col">
                <div className="flex-grow p-4 overflow-y-auto">
                    {renderPanel()}
                </div>
                <FooterActions />
            </aside>
        </div>
    );
};
export default EditorModalLayout;