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
    SwapIcon,
} from '../components/icons';

export interface TabConfig {
    id: TabId;
    name: string;
    icon: React.ReactNode;
    tag?: 'new' | 'tip';
}

// All available editing tool panels are defined here.
// This list is used to build the left navigation and the right-side options panel.
export const editingTabs: TabConfig[] = [
    { id: 'crop', name: 'Cortar e Girar', icon: React.createElement(CropIcon, { className: "w-6 h-6" }) },
    { id: 'adjust', name: 'Ajustes Globais', icon: React.createElement(AdjustmentsHorizontalIcon, { className: "w-6 h-6" }) },
    { id: 'localAdjust', name: 'Ajustes Locais', icon: React.createElement(BrushIcon, { className: "w-6 h-6" }), tag: 'tip' },
    { id: 'magicMontage', name: 'Montagem Mágica', icon: React.createElement(MagicWandIcon, { className: "w-6 h-6" }), tag: 'new' },
    { id: 'objectRemover', name: 'Removedor de Objetos', icon: React.createElement(EraserIcon, { className: "w-6 h-6" }) },
    { id: 'removeBg', name: 'Remover Fundo', icon: React.createElement(ScissorsIcon, { className: "w-6 h-6" }) },
    { id: 'faceSwap', name: 'Troca de Rosto', icon: React.createElement(SwapIcon, { className: "w-6 h-6" }), tag: 'new' },
    { id: 'generativeEdit', name: 'Edição Generativa', icon: React.createElement(LayersIcon, { className: "w-6 h-6" }), tag: 'new' },
    { id: 'text', name: 'Adicionar Texto', icon: React.createElement(TextToolIcon, { className: "w-6 h-6" }) },
    { id: 'photoRestoration', name: 'Restauração de Foto', icon: React.createElement(SparkleIcon, { className: "w-6 h-6" }) },
    { id: 'upscale', name: 'Melhorar Resolução', icon: React.createElement(ArrowUpOnSquareIcon, { className: "w-6 h-6" }) },
    { id: 'unblur', name: 'Remover Desfoque', icon: React.createElement(UnblurIcon, { className: "w-6 h-6" }) },
    { id: 'relight', name: 'Reacender', icon: React.createElement(SunIcon, { className: "w-6 h-6" }) },
    { id: 'style', name: 'Estilos Artísticos', icon: React.createElement(PaletteIcon, { className: "w-6 h-6" }) },
    { id: 'portraits', name: 'Retratos IA', icon: React.createElement(UserIcon, { className: "w-6 h-6" }) },
    { id: 'lowPoly', name: 'Estilo Low Poly', icon: React.createElement(LowPolyIcon, { className: "w-6 h-6" }) },
    { id: 'pixelArt', name: 'Pixel Art', icon: React.createElement(PixelsIcon, { className: "w-6 h-6" }) },
    { id: 'styleGen', name: 'Estilos Rápidos', icon: React.createElement(BrushIcon, { className: "w-6 h-6" }) },
    { id: 'texture', name: 'Textura', icon: React.createElement(TextureIcon, { className: "w-6 h-6" }) },
    { id: 'dustAndScratches', name: 'Poeira e Arranhões', icon: React.createElement(FilmGrainIcon, { className: "w-6 h-6" }) },
    { id: 'extractArt', name: 'Extrair Arte', icon: React.createElement(BullseyeIcon, { className: "w-6 h-6" }) },
    { id: 'neuralFilters', name: 'Filtros Neurais', icon: React.createElement(SparkleIcon, { className: "w-6 h-6" }) },
    { id: 'trends', name: 'Tendências', icon: React.createElement(LightbulbIcon, { className: "w-6 h-6" }) },
    { id: 'history', name: 'Histórico', icon: React.createElement(ClockIcon, { className: "w-6 h-6" }) },
];