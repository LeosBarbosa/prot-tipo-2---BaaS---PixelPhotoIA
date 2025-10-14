/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { lazy } from 'react';
import { type ToolId } from '../types';

// NOVO: Mapa unificado para todos os componentes que aparecem no painel direito.
export const panelComponents: Partial<Record<ToolId, React.LazyExoticComponent<React.FC<{}>>>> = {
    // Painéis de Edição
    crop: lazy(() => import(/* webpackChunkName: "tool-panel-crop" */ '../components/tools/CropPanel')),
    style: lazy(() => import(/* webpackChunkName: "tool-panel-style" */ '../components/tools/StylePanel')),
    adjust: lazy(() => import(/* webpackChunkName: "tool-panel-adjustment" */ '../components/tools/AdjustmentPanel')),
    generativeEdit: lazy(() => import(/* webpackChunkName: "tool-panel-generative-edit" */ '../components/tools/GenerativeEditPanel')),
    removeBg: lazy(() => import(/* webpackChunkName: "tool-panel-remove-bg" */ '../components/tools/RemoveBgPanel')),
    upscale: lazy(() => import(/* webpackChunkName: "tool-panel-upscale" */ '../components/tools/UpscalePanel')),
    superResolution: lazy(() => import(/* webpackChunkName: "tool-panel-super-resolution" */ '../components/tools/SuperResolutionPanel')),
    portraits: lazy(() => import(/* webpackChunkName: "tool-panel-portraits" */ '../components/tools/PortraitsPanel')),
    styleGen: lazy(() => import(/* webpackChunkName: "tool-panel-style-gen" */ '../components/tools/StyleGenPanel')),
    relight: lazy(() => import(/* webpackChunkName: "tool-panel-relight" */ '../components/tools/RelightPanel')),
    extractArt: lazy(() => import(/* webpackChunkName: "tool-panel-extract-art" */ '../components/tools/ExtractArtPanel')),
    neuralFilters: lazy(() => import(/* webpackChunkName: "tool-panel-neural-filters" */ '../components/tools/NeuralFiltersPanel')),
    trends: lazy(() => import(/* webpackChunkName: "tool-panel-trends" */ '../components/tools/TrendsPanel')),
    unblur: lazy(() => import(/* webpackChunkName: "tool-panel-unblur" */ '../components/tools/UnblurPanel')),
    sharpen: lazy(() => import(/* webpackChunkName: "tool-panel-sharpen" */ '../components/tools/SharpenPanel')),
    dustAndScratches: lazy(() => import(/* webpackChunkName: "tool-panel-dust-scratches" */ '../components/tools/DustAndScratchesPanel')),
    history: lazy(() => import(/* webpackChunkName: "panel-history" */ '../components/HistoryPanel')),
    objectRemover: lazy(() => import(/* webpackChunkName: "tool-panel-object-remover" */ '../components/tools/ObjectRemoverPanel')),
    texture: lazy(() => import(/* webpackChunkName: "tool-panel-texture" */ '../components/tools/TexturePanel')),
    magicMontage: lazy(() => import(/* webpackChunkName: "tool-panel-magic-montage" */ '../components/tools/MagicMontagePanel')),
    photoRestoration: lazy(() => import(/* webpackChunkName: "tool-panel-image-restore" */ '../components/tools/ImageRestorePanel')),
    text: lazy(() => import(/* webpackChunkName: "tool-panel-text" */ '../components/tools/TextPanel')),
    lowPoly: lazy(() => import(/* webpackChunkName: "tool-panel-low-poly" */ '../components/tools/LowPolyPanel')),
    pixelArt: lazy(() => import(/* webpackChunkName: "tool-panel-pixel-art" */ '../components/tools/PixelArtPanel')),
    localAdjust: lazy(() => import(/* webpackChunkName: "tool-panel-local-adjustment" */ '../components/tools/LocalAdjustmentPanel')),
    faceSwap: lazy(() => import(/* webpackChunkName: "tool-panel-face-swap" */ '../components/tools/FaceSwapPanel')),
    newAspectRatio: lazy(() => import(/* webpackChunkName: "tool-panel-new-aspect-ratio" */ '../components/tools/NewAspectRatioPanel')),

    // Ferramentas de Geração (anteriormente em 'toolMap')
    imageGen: lazy(() => import(/* webpackChunkName: "tool-image-gen" */ '../components/tools/ImageGenPanel')),
    sketchRender: lazy(() => import(/* webpackChunkName: "tool-sketch-render" */ '../components/tools/SketchRenderPanel')),
    creativeFusion: lazy(() => import(/* webpackChunkName: "tool-creative-fusion" */ '../components/tools/CreativeFusionPanel')),
    outpainting: lazy(() => import(/* webpackChunkName: "tool-outpainting" */ '../components/tools/OutpaintingPanel')),
    imageVariation: lazy(() => import(/* webpackChunkName: "tool-image-variation" */ '../components/tools/ImageVariationPanel')),
    productPhotography: lazy(() => import(/* webpackChunkName: "tool-product-photography" */ '../components/tools/ProductPhotographyPanel')),
    characterDesign: lazy(() => import(/* webpackChunkName: "tool-character-design" */ '../components/tools/CharacterDesignPanel')),
    architecturalViz: lazy(() => import(/* webpackChunkName: "tool-architectural-viz" */ '../components/tools/ArchitecturalVizPanel')),
    interiorDesign: lazy(() => import(/* webpackChunkName: "tool-interior-design" */ '../components/tools/InteriorDesignPanel')),
    videoGen: lazy(() => import(/* webpackChunkName: "tool-video-gen" */ '../components/tools/VideoGenPanel')),
    logoGen: lazy(() => import(/* webpackChunkName: "tool-logo-gen" */ '../components/tools/LogoGenPanel')),
    patternGen: lazy(() => import(/* webpackChunkName: "tool-panel-pattern-gen" */ '../components/tools/PatternGenPanel')),
    textEffects: lazy(() => import(/* webpackChunkName: "tool-text-effects" */ '../components/tools/TextEffectsPanel')),
    vectorConverter: lazy(() => import(/* webpackChunkName: "tool-vector-converter" */ '../components/tools/VectorConverterPanel')),
    stickerCreator: lazy(() => import(/* webpackChunkName: "tool-sticker-creator" */ '../components/tools/StickerCreatorPanel')),
    aiPortraitStudio: lazy(() => import(/* webpackChunkName: "tool-ai-portrait-studio" */ '../components/tools/AIPortraitStudioPanel')),
    model3DGen: lazy(() => import(/* webpackChunkName: "tool-model-3d-gen" */ '../components/tools/Model3DGenPanel')),
    bananimate: lazy(() => import(/* webpackChunkName: "tool-bananimate" */ '../components/tools/BananimatePanel')),
    confidentStudio: lazy(() => import(/* webpackChunkName: "tool-confident-studio" */ '../components/tools/ConfidentStudioPanel')),
    styledPortrait: lazy(() => import(/* webpackChunkName: "tool-styled-portrait" */ '../components/tools/StyledPortraitPanel')),
    photoStudio: lazy(() => import(/* webpackChunkName: "tool-photo-studio" */ '../components/tools/PhotoStudioPanel')),
    polaroid: lazy(() => import(/* webpackChunkName: "tool-polaroid" */ '../components/tools/PolaroidPanel')),
    funkoPopStudio: lazy(() => import(/* webpackChunkName: "tool-funko-pop" */ '../components/tools/FunkoPopStudioPanel')),
    tryOn: lazy(() => import(/* webpackChunkName: "tool-try-on" */ '../components/tools/TryOnPanel')),
    aiPngCreator: lazy(() => import(/* webpackChunkName: "tool-ai-png-creator" */ '../components/tools/AIPngCreatorPanel')),
    superheroFusion: lazy(() => import(/* webpackChunkName: "tool-superhero-fusion" */ '../components/tools/SuperheroFusionPanel')),
    doubleExposure: lazy(() => import(/* webpackChunkName: "tool-double-exposure" */ '../components/tools/DoubleExposurePanel')),
};