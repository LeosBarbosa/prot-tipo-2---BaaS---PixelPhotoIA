/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';
import { type TabId } from '../types';

import {
    BullseyeIcon, ScissorsIcon, PaletteIcon, UserIcon, BrushIcon, AdjustmentsHorizontalIcon,
    SunIcon, SparkleIcon, LayersIcon, CropIcon, ArrowUpOnSquareIcon, LightbulbIcon, UnblurIcon, FilmGrainIcon, ClockIcon,
    EraserIcon,
    TextureIcon,
    MagicWandIcon,
    LowPolyIcon,
    TextToolIcon,
    PixelsIcon,
} from '../components/icons';

import CropPanel from '../components/tools/CropPanel';
import StylePanel from '../components/tools/StylePanel';
import AdjustmentPanel from '../components/tools/AdjustmentPanel';
import GenerativeEditPanel from '../components/tools/GenerativeEditPanel';
import RemoveBgPanel from '../components/tools/RemoveBgPanel';
import UpscalePanel from '../components/tools/UpscalePanel';
import PortraitsPanel from '../components/tools/PortraitsPanel';
import StyleGenPanel from '../components/tools/StyleGenPanel';
import RelightPanel from '../components/tools/RelightPanel';
import ExtractArtPanel from '../components/tools/ExtractArtPanel';
import NeuralFiltersPanel from '../components/tools/NeuralFiltersPanel';
import TrendsPanel from '../components/tools/TrendsPanel';
import UnblurPanel from '../components/tools/UnblurPanel';
import DustAndScratchesPanel from '../components/tools/DustAndScratchesPanel';
import HistoryPanel from '../components/HistoryPanel';
import ObjectRemoverPanel from '../components/tools/ObjectRemoverPanel';
import TexturePanel from '../components/tools/TexturePanel';
import MagicMontagePanel from '../components/tools/MagicMontagePanel';
import ImageRestorePanel from '../components/tools/ImageRestorePanel';
import TextPanel from '../components/tools/TextPanel';
import LowPolyPanel from '../components/tools/LowPolyPanel';
import PixelArtPanel from '../components/tools/PixelArtPanel';
import LocalAdjustmentPanel from '../components/tools/LocalAdjustmentPanel';


export interface TabConfig {
    id: TabId;
    name: string;
    icon: React.ReactNode;
    component: React.ReactNode;
}

// All available editing tool panels are defined here.
// This list is used to build the left navigation and the right-side options panel.
export const editingTabs: TabConfig[] = [
    { id: 'crop', name: 'Cortar e Girar', icon: React.createElement(CropIcon, { className: "w-6 h-6" }), component: React.createElement(CropPanel) },
    { id: 'adjust', name: 'Ajustes Globais', icon: React.createElement(AdjustmentsHorizontalIcon, { className: "w-6 h-6" }), component: React.createElement(AdjustmentPanel) },
    { id: 'localAdjust', name: 'Ajustes Locais', icon: React.createElement(BrushIcon, { className: "w-6 h-6" }), component: React.createElement(LocalAdjustmentPanel) },
    { id: 'magicMontage', name: 'Montagem Mágica', icon: React.createElement(MagicWandIcon, { className: "w-6 h-6" }), component: React.createElement(MagicMontagePanel) },
    { id: 'objectRemover', name: 'Removedor de Objetos', icon: React.createElement(EraserIcon, { className: "w-6 h-6" }), component: React.createElement(ObjectRemoverPanel) },
    { id: 'removeBg', name: 'Remover Fundo', icon: React.createElement(ScissorsIcon, { className: "w-6 h-6" }), component: React.createElement(RemoveBgPanel) },
    { id: 'generativeEdit', name: 'Edição Generativa', icon: React.createElement(LayersIcon, { className: "w-6 h-6" }), component: React.createElement(GenerativeEditPanel) },
    { id: 'text', name: 'Adicionar Texto', icon: React.createElement(TextToolIcon, { className: "w-6 h-6" }), component: React.createElement(TextPanel) },
    { id: 'photoRestoration', name: 'Restauração de Foto', icon: React.createElement(SparkleIcon, { className: "w-6 h-6" }), component: React.createElement(ImageRestorePanel) },
    { id: 'upscale', name: 'Melhorar Resolução', icon: React.createElement(ArrowUpOnSquareIcon, { className: "w-6 h-6" }), component: React.createElement(UpscalePanel) },
    { id: 'unblur', name: 'Remover Desfoque', icon: React.createElement(UnblurIcon, { className: "w-6 h-6" }), component: React.createElement(UnblurPanel) },
    { id: 'relight', name: 'Reacender', icon: React.createElement(SunIcon, { className: "w-6 h-6" }), component: React.createElement(RelightPanel) },
    { id: 'style', name: 'Estilos Artísticos', icon: React.createElement(PaletteIcon, { className: "w-6 h-6" }), component: React.createElement(StylePanel) },
    { id: 'portraits', name: 'Retratos IA', icon: React.createElement(UserIcon, { className: "w-6 h-6" }), component: React.createElement(PortraitsPanel) },
    { id: 'lowPoly', name: 'Estilo Low Poly', icon: React.createElement(LowPolyIcon, { className: "w-6 h-6" }), component: React.createElement(LowPolyPanel) },
    { id: 'pixelArt', name: 'Pixel Art', icon: React.createElement(PixelsIcon, { className: "w-6 h-6" }), component: React.createElement(PixelArtPanel) },
    { id: 'styleGen', name: 'Estilos Rápidos', icon: React.createElement(BrushIcon, { className: "w-6 h-6" }), component: React.createElement(StyleGenPanel) },
    { id: 'texture', name: 'Textura', icon: React.createElement(TextureIcon, { className: "w-6 h-6" }), component: React.createElement(TexturePanel) },
    { id: 'dustAndScratches', name: 'Poeira e Arranhões', icon: React.createElement(FilmGrainIcon, { className: "w-6 h-6" }), component: React.createElement(DustAndScratchesPanel) },
    { id: 'extractArt', name: 'Extrair Arte', icon: React.createElement(BullseyeIcon, { className: "w-6 h-6" }), component: React.createElement(ExtractArtPanel) },
    { id: 'neuralFilters', name: 'Filtros Neurais', icon: React.createElement(SparkleIcon, { className: "w-6 h-6" }), component: React.createElement(NeuralFiltersPanel) },
    { id: 'trends', name: 'Tendências', icon: React.createElement(LightbulbIcon, { className: "w-6 h-6" }), component: React.createElement(TrendsPanel) },
    { id: 'history', name: 'Histórico', icon: React.createElement(ClockIcon, { className: "w-6 h-6" }), component: React.createElement(HistoryPanel) },
];