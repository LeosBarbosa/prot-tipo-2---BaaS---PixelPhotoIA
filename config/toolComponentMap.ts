/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';
import { type ToolId } from '../types';

// Maps a ToolId to a lazily loaded component for its options panel.
export const toolComponentMap: Partial<Record<ToolId, React.LazyExoticComponent<React.FC<{}>>>> = {
    // Generation
    imageGen: React.lazy(() => import('./components/tools/ImageGenPanel')),
    videoGen: React.lazy(() => import('./components/tools/VideoGenPanel')),
    logoGen: React.lazy(() => import('./components/tools/LogoGenPanel')),
    patternGen: React.lazy(() => import('./components/tools/PatternGenPanel')),
    model3DGen: React.lazy(() => import('./components/tools/Model3DGenPanel')),
    stickerCreator: React.lazy(() => import('./components/tools/StickerCreatorPanel')),
    characterDesign: React.lazy(() => import('./components/tools/CharacterDesignPanel')),
    
    // Workflow
    batchProcessing: React.lazy(() => import('./components/tools/BatchProcessingPanel')),
    magicWorkflow: React.lazy(() => import('./components/tools/MagicWorkflowPanel')),
    voiceAssistant: React.lazy(() => import('./components/tools/VoiceAssistantPanel')),
    magicScenery: React.lazy(() => import('./components/tools/MagicSceneryPanel')),
    confidentStudio: React.lazy(() => import('./components/tools/ConfidentStudioPanel')),
    photoStudio: React.lazy(() => import('./components/tools/PhotoStudioPanel')),
    aiPortraitStudio: React.lazy(() => import('./components/tools/AIPortraitStudioPanel')),
    funkoPopStudio: React.lazy(() => import('./components/tools/FunkoPopStudioPanel')),
    tryOn: React.lazy(() => import('./components/tools/TryOnPanel')),
    styledPortrait: React.lazy(() => import('./components/tools/StyledPortraitPanel')),
    superheroFusion: React.lazy(() => import('./components/tools/SuperheroFusionPanel')),
    doubleExposure: React.lazy(() => import('./components/tools/DoubleExposurePanel')),
    polaroid: React.lazy(() => import('./components/tools/PolaroidPanel')),

    // Editing
    crop: React.lazy(() => import('./components/tools/CropPanel')),
    adjust: React.lazy(() => import('./components/tools/AdjustmentPanel')),
    localAdjust: React.lazy(() => import('./components/tools/LocalAdjustmentPanel')),
    magicMontage: React.lazy(() => import('./components/tools/MagicMontagePanel')),
    objectRemover: React.lazy(() => import('./components/tools/ObjectRemoverPanel')),
    // FIX: Corrected casing for RemoveBgPanel import to match the actual filename.
    removeBg: React.lazy(() => import('./components/tools/RemoveBgPanel')),
    clone: React.lazy(() => import('./components/tools/ClonePanel')),
    faceSwap: React.lazy(() => import('./components/tools/FaceSwapPanel')),
    generativeEdit: React.lazy(() => import('./components/tools/GenerativeEditPanel')),
    aiTextEdit: React.lazy(() => import('./components/tools/AITextEditPanel')),
    text: React.lazy(() => import('./components/tools/TextPanel')),
    textEffects: React.lazy(() => import('./components/tools/TextEffectsPanel')),
    photoRestoration: React.lazy(() => import('./components/tools/ImageRestorePanel')),
    // FIX: Corrected casing for UpscalePanel import to match the actual filename.
    upscale: React.lazy(() => import('./components/tools/UpscalePanel')),
    superResolution: React.lazy(() => import('./components/tools/SuperResolutionPanel')),
    unblur: React.lazy(() => import('./components/tools/UnblurPanel')),
    sharpen: React.lazy(() => import('./components/tools/SharpenPanel')),
    relight: React.lazy(() => import('./components/tools/RelightPanel')),
    style: React.lazy(() => import('./components/tools/StylePanel')),
    portraits: React.lazy(() => import('./components/tools/PortraitsPanel')),
    lowPoly: React.lazy(() => import('./components/tools/LowPolyPanel')),
    pixelArt: React.lazy(() => import('./components/tools/PixelArtPanel')),
    styleGen: React.lazy(() => import('./components/tools/StyleGenPanel')),
    texture: React.lazy(() => import('./components/tools/TexturePanel')),
    dustAndScratches: React.lazy(() => import('./components/tools/DustAndScratchesPanel')),
    extractArt: React.lazy(() => import('./components/tools/ExtractArtPanel')),
    neuralFilters: React.lazy(() => import('./components/tools/NeuralFiltersPanel')),
    trends: React.lazy(() => import('./components/tools/TrendsPanel')),
    history: React.lazy(() => import('../components/HistoryPanel')),
    newAspectRatio: React.lazy(() => import('./components/tools/NewAspectRatioPanel')),
    denoise: React.lazy(() => import('./components/tools/DenoisePanel')),
    faceRecovery: React.lazy(() => import('./components/tools/FaceRecoveryPanel')),
    imageAnalysis: React.lazy(() => import('./components/tools/ImageAnalysisPanel')),
    aiPngCreator: React.lazy(() => import('./components/tools/AIPngCreatorPanel')),
    imageVariation: React.lazy(() => import('./components/tools/ImageVariationPanel')),
    outpainting: React.lazy(() => import('./components/tools/OutpaintingPanel')),
    productPhotography: React.lazy(() => import('./components/tools/ProductPhotographyPanel')),
    architecturalViz: React.lazy(() => import('./components/tools/ArchitecturalVizPanel')),
    interiorDesign: React.lazy(() => import('./components/tools/InteriorDesignPanel')),
    sketchRender: React.lazy(() => import('./components/tools/SketchRenderPanel')),
    vectorConverter: React.lazy(() => import('./components/tools/VectorConverterPanel')),
    bananimate: React.lazy(() => import('./components/tools/BananimatePanel')),
};