/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useMemo } from 'react';
import { useEditor } from '../context/EditorContext';
import ImageViewer from './ImageViewer';
import FooterActions from './FooterActions';
import FloatingControls from './FloatingControls';
import { type TabId, type ToolId } from '../types';
import CollapsibleToolPanel from './CollapsibleToolPanel';
import GifTimeline from './common/GifTimeline';

import {
    BullseyeIcon, ScissorsIcon, PaletteIcon, UserIcon, BrushIcon, AdjustmentsHorizontalIcon,
    SunIcon, SparkleIcon, LayersIcon, CropIcon, ArrowUpOnSquareIcon, LightbulbIcon, DenoiseIcon, FaceSmileIcon, UnblurIcon, FilmGrainIcon, ClockIcon
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
import DenoisePanel from './tools/DenoisePanel';
import FaceRecoveryPanel from './tools/FaceRecoveryPanel';
import UnblurPanel from './tools/UnblurPanel';
import DustAndScratchesPanel from './tools/DustAndScratchesPanel';
import HistoryPanel from './HistoryPanel';

interface PanelConfig {
    id: TabId;
    name: string;
    icon: React.ReactNode;
    component: React.ReactNode;
}

const toolPanels: PanelConfig[] = [
    { id: 'history', name: 'Histórico', icon: <ClockIcon className="w-5 h-5" />, component: <HistoryPanel /> },
    { id: 'crop', name: 'Cortar e Girar', icon: <CropIcon className="w-5 h-5" />, component: <CropPanel /> },
    { id: 'generativeEdit', name: 'Edição Generativa', icon: <LayersIcon className="w-5 h-5" />, component: <GenerativeEditPanel /> },
    { id: 'localAdjust', name: 'Ajustes Manuais', icon: <AdjustmentsHorizontalIcon className="w-5 h-5" />, component: <AdjustmentPanel /> },
    { id: 'upscale', name: 'Melhorar Resolução', icon: <ArrowUpOnSquareIcon className="w-5 h-5" />, component: <UpscalePanel /> },
    { id: 'removeBg', name: 'Remover Fundo', icon: <ScissorsIcon className="w-5 h-5" />, component: <RemoveBgPanel /> },
    { id: 'relight', name: 'Reacender (IA)', icon: <SunIcon className="w-5 h-5" />, component: <RelightPanel /> },
    { id: 'unblur', name: 'Remover Desfoque', icon: <UnblurIcon className="w-5 h-5" />, component: <UnblurPanel /> },
    { id: 'denoise', name: 'Remover Ruído', icon: <DenoiseIcon className="w-5 h-5" />, component: <DenoisePanel /> },
    { id: 'faceRecovery', name: 'Recuperar Rosto', icon: <FaceSmileIcon className="w-5 h-5" />, component: <FaceRecoveryPanel /> },
    { id: 'style', name: 'Estilos Artísticos', icon: <PaletteIcon className="w-5 h-5" />, component: <StylePanel /> },
    { id: 'dustAndScratches', name: 'Poeira e Arranhões', icon: <FilmGrainIcon className="w-5 h-5" />, component: <DustAndScratchesPanel /> },
    { id: 'portraits', name: 'Retratos IA', icon: <UserIcon className="w-5 h-5" />, component: <PortraitsPanel /> },
    { id: 'styleGen', name: 'Estilos Rápidos', icon: <BrushIcon className="w-5 h-5" />, component: <StyleGenPanel /> },
    { id: 'extractArt', name: 'Extrair Arte', icon: <BullseyeIcon className="w-5 h-5" />, component: <ExtractArtPanel /> },
    { id: 'neuralFilters', name: 'Filtros Neurais', icon: <SparkleIcon className="w-5 h-5" />, component: <NeuralFiltersPanel /> },
    { id: 'trends', name: 'Tendências', icon: <LightbulbIcon className="w-5 h-5" />, component: <TrendsPanel /> },
];

const toolToTabMap: Partial<Record<ToolId, TabId>> = {
    extractArt: 'extractArt',
    removeBg: 'removeBg',
    style: 'style',
    portraits: 'portraits',
    styleGen: 'styleGen',
    adjust: 'localAdjust',
    relight: 'relight',
    generativeEdit: 'generativeEdit',
    crop: 'crop',
    upscale: 'upscale',
    neuralFilters: 'neuralFilters',
    trends: 'trends',
    denoise: 'denoise',
    faceRecovery: 'faceRecovery',
    unblur: 'unblur',
    dustAndScratches: 'dustAndScratches',
    wonderModel: 'upscale',
};

const EditorModalLayout: React.FC = () => {
    const { activeTool, isGif, panelsVisible } = useEditor();
    
    const initialPanel = useMemo(() => activeTool ? (toolToTabMap[activeTool] ?? 'crop') : 'crop', [activeTool]);
    const [expandedPanel, setExpandedPanel] = useState<TabId | null>(initialPanel);

    return (
        <div className="w-full h-full flex flex-col lg:flex-row overflow-hidden">
            <main className="flex-grow flex flex-col bg-black/20 relative">
                <div className="flex-grow flex items-center justify-center p-4 relative">
                    <ImageViewer />
                    <FloatingControls />
                </div>
                {isGif && <GifTimeline />}
            </main>
            <aside className={`w-full lg:w-96 lg:flex-shrink-0 bg-gray-900/40 border-l border-gray-700/50 flex flex-col ${!panelsVisible ? 'hidden lg:flex' : ''}`}>
                <div className="flex-grow p-2 overflow-y-auto space-y-2">
                    {toolPanels.map(panel => (
                        <CollapsibleToolPanel
                            key={panel.id}
                            title={panel.name}
                            icon={panel.icon}
                            isExpanded={expandedPanel === panel.id}
                            onExpandToggle={() => setExpandedPanel(expandedPanel === panel.id ? null : panel.id)}
                        >
                            {panel.component}
                        </CollapsibleToolPanel>
                    ))}
                </div>
                <FooterActions />
            </aside>
        </div>
    );
};
export default EditorModalLayout;