/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { lazy } from 'react';
import { type ToolId } from '../types';

// Mapa unificado para todos os componentes de ferramentas, carregados de forma preguiçosa.
// Esta é a fonte de verdade para associar um ToolId ao seu componente React.
export const toolComponentMap: Partial<Record<ToolId, React.LazyExoticComponent<React.FC<{}>>>> = {
    // Painéis de Edição (isEditingTool: true)
    crop: lazy(() => import('../components/tools/CropPanel')),
    adjust: lazy(() => import('../components/tools/AdjustmentPanel')),
    style: lazy(() => import('../components/tools/StylePanel')),
    generativeEdit: lazy(() => import('../components/tools/GenerativeEditPanel')),
    removeBg: lazy(() => import('../components/tools/RemoveBgPanel')),
    upscale: lazy(() => import('../components/tools/UpscalePanel')),
    superResolution: lazy(() => import('../components/tools/SuperResolutionPanel')),
    portraits: lazy(() => import('../components/tools/PortraitsPanel')),
    styleGen: lazy(() => import('../components/tools/StyleGenPanel')),
    relight: lazy(() => import('../components/tools/RelightPanel')),
    extractArt: lazy(() => import('../components/tools/ExtractArtPanel')),
    neuralFilters: lazy(() => import('../components/tools/NeuralFiltersPanel')),
    trends: lazy(() => import('../components/tools/TrendsPanel')),
    unblur: lazy(() => import('../components/tools/UnblurPanel')),
    sharpen: lazy(() => import('../components/tools/SharpenPanel')),
    dustAndScratches: lazy(() => import('../components/tools/DustAndScratchesPanel')),
    history: lazy(() => import('../components/HistoryPanel')),
    objectRemover: lazy(() => import('../components/tools/ObjectRemoverPanel')),
    texture: lazy(() => import('../components/tools/TexturePanel')),
    magicMontage: lazy(() => import('../components/tools/MagicMontagePanel')),
    photoRestoration: lazy(() => import('../components/tools/ImageRestorePanel')),
    text: lazy(() => import('../components/tools/TextPanel')),
    lowPoly: lazy(() => import('../components/tools/LowPolyPanel')),
    pixelArt: lazy(() => import('../components/tools/PixelArtPanel')),
    localAdjust: lazy(() => import('../components/tools/LocalAdjustmentPanel')),
    faceSwap: lazy(() => import('../components/tools/FaceSwapPanel')),
    newAspectRatio: lazy(() => import('../components/tools/NewAspectRatioPanel')),

    // Ferramentas de Geração e Fluxo de Trabalho (isEditingTool: false)
    imageGen: lazy(() => import('../components/tools/ImageGenPanel')),
    sketchRender: lazy(() => import('../components/tools/SketchRenderPanel')),
    characterDesign: lazy(() => import('../components/tools/CharacterDesignPanel')),
    videoGen: lazy(() => import('../components/tools/VideoGenPanel')),
    patternGen: lazy(() => import('../components/tools/PatternGenPanel')),
    textEffects: lazy(() => import('../components/tools/TextEffectsPanel')),
    logoGen: lazy(() => import('../components/tools/LogoGenPanel')),
    stickerCreator: lazy(() => import('../components/tools/StickerCreatorPanel')),
    model3DGen: lazy(() => import('../components/tools/Model3DGenPanel')),
    aiPngCreator: lazy(() => import('../components/tools/AIPngCreatorPanel')),
    photoStudio: lazy(() => import('../components/tools/PhotoStudioPanel')),
    polaroid: lazy(() => import('../components/tools/PolaroidPanel')),
    superheroFusion: lazy(() => import('../components/tools/SuperheroFusionPanel')),
    styledPortrait: lazy(() => import('../components/tools/StyledPortraitPanel')),
    tryOn: lazy(() => import('../components/tools/TryOnPanel')),
    interiorDesign: lazy(() => import('../components/tools/InteriorDesignPanel')),
    architecturalViz: lazy(() => import('../components/tools/ArchitecturalVizPanel')),
    creativeFusion: lazy(() => import('../components/tools/CreativeFusionPanel')),
    doubleExposure: lazy(() => import('../components/tools/DoubleExposurePanel')),
    outpainting: lazy(() => import('../components/tools/OutpaintingPanel')),
    productPhotography: lazy(() => import('../components/tools/ProductPhotographyPanel')),
    aiPortraitStudio: lazy(() => import('../components/tools/AIPortraitStudioPanel')),
    bananimate: lazy(() => import('../components/tools/BananimatePanel')),
    confidentStudio: lazy(() => import('../components/tools/ConfidentStudioPanel')),
    funkoPopStudio: lazy(() => import('../components/tools/FunkoPopStudioPanel')),
    imageVariation: lazy(() => import('../components/tools/ImageVariationPanel')),
    vectorConverter: lazy(() => import('../components/tools/VectorConverterPanel')),
};