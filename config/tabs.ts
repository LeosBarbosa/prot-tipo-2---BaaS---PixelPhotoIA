/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { type TabId } from '../types';

export interface TabConfig {
    id: TabId;
    name: string;
    icon: string;
    tag?: 'new' | 'tip';
}

// All available editing tool panels are defined here.
// This list is used to build the left navigation and the right-side options panel.
export const editingTabs: TabConfig[] = [
    { id: 'crop', name: 'Cortar e Girar', icon: 'CropIcon' },
    { id: 'newAspectRatio', name: 'Proporção 16:9', icon: 'ExpandIcon', tag: 'new' },
    { id: 'adjust', name: 'Ajustes Globais', icon: 'AdjustmentsHorizontalIcon' },
    { id: 'localAdjust', name: 'Ajustes Locais', icon: 'BrushIcon', tag: 'new' },
    { id: 'magicMontage', name: 'Montagem Mágica', icon: 'MagicWandIcon', tag: 'new' },
    { id: 'objectRemover', name: 'Removedor de Objetos', icon: 'EraserIcon' },
    { id: 'removeBg', name: 'Remover Fundo', icon: 'ScissorsIcon' },
    { id: 'faceSwap', name: 'Troca de Rosto', icon: 'SwapIcon', tag: 'new' },
    { id: 'generativeEdit', name: 'Edição Generativa', icon: 'LayersIcon', tag: 'new' },
    { id: 'text', name: 'Adicionar Texto', icon: 'TextToolIcon' },
    { id: 'photoRestoration', name: 'Restauração de Foto', icon: 'SparkleIcon' },
    { id: 'upscale', name: 'Melhorar Resolução', icon: 'ArrowUpOnSquareIcon' },
    { id: 'superResolution', name: 'Super Resolução IA', icon: 'SparkleIcon', tag: 'new' },
    { id: 'unblur', name: 'Remover Desfoque', icon: 'UnblurIcon' },
    { id: 'sharpen', name: 'Nitidez', icon: 'SharpenIcon', tag: 'new' },
    { id: 'relight', name: 'Reacender', icon: 'SunIcon' },
    { id: 'style', name: 'Estilo de Foto', icon: 'PaletteIcon' },
    { id: 'portraits', name: 'Retratos IA', icon: 'UserIcon' },
    { id: 'lowPoly', name: 'Estilo Low Poly', icon: 'LowPolyIcon' },
    { id: 'pixelArt', name: 'Pixel Art', icon: 'PixelsIcon' },
    { id: 'styleGen', name: 'Estilos Rápidos', icon: 'BrushIcon' },
    { id: 'texture', name: 'Textura', icon: 'TextureIcon' },
    { id: 'dustAndScratches', name: 'Poeira e Arranhões', icon: 'FilmGrainIcon' },
    { id: 'extractArt', name: 'Extrair Arte', icon: 'BullseyeIcon' },
    { id: 'neuralFilters', name: 'Filtros Neurais', icon: 'SparkleIcon' },
    { id: 'trends', name: 'Tendências', icon: 'LightbulbIcon' },
    { id: 'history', name: 'Histórico', icon: 'ClockIcon' },
];