/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { lazy, Suspense, useMemo, useEffect } from 'react';
import { EditorProvider, useEditor } from './context/EditorContext';
import Header from './components/Header';
import HomePage from './components/HomePage';
import ToolModal from './components/ToolModal';
import EditorModalLayout from './components/EditorModalLayout';
import { type ToolId, type TabId } from './types';
import ComparisonModal from './components/ComparisonModal';
import ToastNotification from './components/ToastNotification';
import ProactiveSuggestion from './components/ProactiveSuggestion';
import LoadingOverlay from './components/LoadingOverlay';
import SaveWorkflowModal from './components/SaveWorkflowModal';
import Spinner from './components/Spinner';

// Centralized dynamic imports for editing panels
const editingPanelComponents: Partial<Record<TabId, React.LazyExoticComponent<React.FC<{}>>>> = {
    crop: lazy(() => import(/* webpackChunkName: "tool-panel-crop" */ './components/tools/CropPanel')),
    style: lazy(() => import(/* webpackChunkName: "tool-panel-style" */ './components/tools/StylePanel')),
    adjust: lazy(() => import(/* webpackChunkName: "tool-panel-adjustment" */ './components/tools/AdjustmentPanel')),
    generativeEdit: lazy(() => import(/* webpackChunkName: "tool-panel-generative-edit" */ './components/tools/GenerativeEditPanel')),
    removeBg: lazy(() => import(/* webpackChunkName: "tool-panel-remove-bg" */ './components/tools/RemoveBgPanel')),
    upscale: lazy(() => import(/* webpackChunkName: "tool-panel-upscale" */ './components/tools/UpscalePanel')),
    portraits: lazy(() => import(/* webpackChunkName: "tool-panel-portraits" */ './components/tools/PortraitsPanel')),
    styleGen: lazy(() => import(/* webpackChunkName: "tool-panel-style-gen" */ './components/tools/StyleGenPanel')),
    relight: lazy(() => import(/* webpackChunkName: "tool-panel-relight" */ './components/tools/RelightPanel')),
    extractArt: lazy(() => import(/* webpackChunkName: "tool-panel-extract-art" */ './components/tools/ExtractArtPanel')),
    neuralFilters: lazy(() => import(/* webpackChunkName: "tool-panel-neural-filters" */ './components/tools/NeuralFiltersPanel')),
    trends: lazy(() => import(/* webpackChunkName: "tool-panel-trends" */ './components/tools/TrendsPanel')),
    unblur: lazy(() => import(/* webpackChunkName: "tool-panel-unblur" */ './components/tools/UnblurPanel')),
    dustAndScratches: lazy(() => import(/* webpackChunkName: "tool-panel-dust-scratches" */ './components/tools/DustAndScratchesPanel')),
    history: lazy(() => import(/* webpackChunkName: "panel-history" */ './components/HistoryPanel')),
    objectRemover: lazy(() => import(/* webpackChunkName: "tool-panel-object-remover" */ './components/tools/ObjectRemoverPanel')),
    texture: lazy(() => import(/* webpackChunkName: "tool-panel-texture" */ './components/tools/TexturePanel')),
    magicMontage: lazy(() => import(/* webpackChunkName: "tool-panel-magic-montage" */ './components/tools/MagicMontagePanel')),
    photoRestoration: lazy(() => import(/* webpackChunkName: "tool-panel-image-restore" */ './components/tools/ImageRestorePanel')),
    text: lazy(() => import(/* webpackChunkName: "tool-panel-text" */ './components/tools/TextPanel')),
    lowPoly: lazy(() => import(/* webpackChunkName: "tool-panel-low-poly" */ './components/tools/LowPolyPanel')),
    pixelArt: lazy(() => import(/* webpackChunkName: "tool-panel-pixel-art" */ './components/tools/PixelArtPanel')),
    localAdjust: lazy(() => import(/* webpackChunkName: "tool-panel-local-adjustment" */ './components/tools/LocalAdjustmentPanel')),
    faceSwap: lazy(() => import(/* webpackChunkName: "tool-panel-face-swap" */ './components/tools/FaceSwapPanel')),
};

// Map Tool IDs to their corresponding components and modal titles for non-editing tools
const toolMap: Partial<Record<ToolId, { Component: React.LazyExoticComponent<React.FC<{}>>; title: string }>> = {
    // Generation Tools
    imageGen: { Component: lazy(() => import(/* webpackChunkName: "tool-image-gen" */ './components/tools/ImageGenPanel')), title: 'Gerador de Imagens AI' },
    sketchRender: { Component: lazy(() => import(/* webpackChunkName: "tool-sketch-render" */ './components/tools/SketchRenderPanel')), title: 'Renderização de Esboço' },
    creativeFusion: { Component: lazy(() => import(/* webpackChunkName: "tool-creative-fusion" */ './components/tools/CreativeFusionPanel')), title: 'Fusão Criativa' },
    outpainting: { Component: lazy(() => import(/* webpackChunkName: "tool-outpainting" */ './components/tools/OutpaintingPanel')), title: 'Pintura Expansiva (Outpainting)' },
    imageVariation: { Component: lazy(() => import(/* webpackChunkName: "tool-image-variation" */ './components/tools/ImageVariationPanel')), title: 'Variação de Imagem' },
    productPhotography: { Component: lazy(() => import(/* webpackChunkName: "tool-product-photography" */ './components/tools/ProductPhotographyPanel')), title: 'Fotografia de Produto AI' },
    characterDesign: { Component: lazy(() => import(/* webpackChunkName: "tool-character-design" */ './components/tools/CharacterDesignPanel')), title: 'Design de Personagem' },
    architecturalViz: { Component: lazy(() => import(/* webpackChunkName: "tool-architectural-viz" */ './components/tools/ArchitecturalVizPanel')), title: 'Visualização Arquitetônica' },
    interiorDesign: { Component: lazy(() => import(/* webpackChunkName: "tool-interior-design" */ './components/tools/InteriorDesignPanel')), title: 'Reforma de Interiores' },
    videoGen: { Component: lazy(() => import(/* webpackChunkName: "tool-video-gen" */ './components/tools/VideoGenPanel')), title: 'Gerador de Vídeo AI' },
    logoGen: { Component: lazy(() => import(/* webpackChunkName: "tool-logo-gen" */ './components/tools/LogoGenPanel')), title: 'Gerador de Logotipo AI' },
    patternGen: { Component: lazy(() => import(/* webpackChunkName: "tool-panel-pattern-gen" */ './components/tools/PatternGenPanel')), title: 'Gerador de Padrões' },
    textEffects: { Component: lazy(() => import(/* webpackChunkName: "tool-text-effects" */ './components/tools/TextEffectsPanel')), title: 'Efeitos de Texto' },
    vectorConverter: { Component: lazy(() => import(/* webpackChunkName: "tool-vector-converter" */ './components/tools/VectorConverterPanel')), title: 'Conversor de Vetor' },
    stickerCreator: { Component: lazy(() => import(/* webpackChunkName: "tool-sticker-creator" */ './components/tools/StickerCreatorPanel')), title: 'Criador de Adesivos AI' },
    aiPortraitStudio: { Component: lazy(() => import(/* webpackChunkName: "tool-ai-portrait-studio" */ './components/tools/AIPortraitStudioPanel')), title: 'Estúdio de Retrato IA' },
    model3DGen: { Component: lazy(() => import(/* webpackChunkName: "tool-model-3d-gen" */ './components/tools/Model3DGenPanel')), title: 'Gerador de Modelo 3D' },
    bananimate: { Component: lazy(() => import(/* webpackChunkName: "tool-bananimate" */ './components/tools/BananimatePanel')), title: 'Bananimate' },
    styledPortrait: { Component: lazy(() => import(/* webpackChunkName: "tool-styled-portrait" */ './components/tools/StyledPortraitPanel')), title: 'Retrato Estilizado' },
    photoStudio: { Component: lazy(() => import(/* webpackChunkName: "tool-photo-studio" */ './components/tools/PhotoStudioPanel')), title: 'Ensaio Fotográfico IA' },
    polaroid: { Component: lazy(() => import(/* webpackChunkName: "tool-polaroid" */ './components/tools/PolaroidPanel')), title: 'Polaroid com Artista IA' },
    funkoPopStudio: { Component: lazy(() => import(/* webpackChunkName: "tool-funko-pop" */ './components/tools/FunkoPopStudioPanel')), title: 'Estúdio Funko Pop' },
    tryOn: { Component: lazy(() => import(/* webpackChunkName: "tool-try-on" */ './components/tools/TryOnPanel')), title: 'Provador Virtual' },
};

function AppContent() {
  const { 
    baseImageFile,
    activeTool,
    setActiveTool,
    isLoading,
    loadingMessage,
    uploadProgress,
    isComparisonModalOpen,
    setIsComparisonModalOpen,
    originalImageUrl,
    currentImageUrl,
    toast,
    setToast,
    proactiveSuggestion,
    isSaveWorkflowModalOpen,
    isLeftPanelVisible,
    isRightPanelVisible,
    hasRestoredSession,
  } = useEditor();

  const isEditingTool = baseImageFile && !activeTool && !hasRestoredSession;
  const isHomePage = !baseImageFile && !activeTool && !hasRestoredSession;

  const ActiveToolComponent = useMemo(() => {
    if (!activeTool || !toolMap[activeTool]) return null;
    return toolMap[activeTool]!.Component;
  }, [activeTool]);
  
  const activeToolTitle = useMemo(() => {
      if (!activeTool || !toolMap[activeTool]) return '';
      return toolMap[activeTool]!.title;
  }, [activeTool]);
  
  return (
    <div className={`w-full min-h-screen flex flex-col bg-gray-900 text-gray-200 transition-colors duration-300 ${isLeftPanelVisible || isRightPanelVisible ? 'lg:overflow-hidden' : ''}`}>
      <Header isEditingTool={!!isEditingTool} />
      <main className="flex-grow flex flex-col relative">
        {(isHomePage || hasRestoredSession) && <HomePage />}
        {isEditingTool && (
          <EditorModalLayout editingPanelComponents={editingPanelComponents} />
        )}

        {ActiveToolComponent && (
            <ToolModal title={activeToolTitle}>
                <Suspense fallback={<div className="flex justify-center items-center h-full"><Spinner /></div>}>
                    <ActiveToolComponent />
                </Suspense>
            </ToolModal>
        )}
        
        {isLoading && loadingMessage && (
            <LoadingOverlay message={loadingMessage} progressStatus={uploadProgress} />
        )}
        
        {isComparisonModalOpen && originalImageUrl && currentImageUrl && (
            <ComparisonModal
                isOpen={isComparisonModalOpen}
                onClose={() => setIsComparisonModalOpen(false)}
                beforeImage={originalImageUrl}
                afterImage={currentImageUrl}
            />
        )}

        {toast && (
          <ToastNotification
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        )}
        
        {proactiveSuggestion && (
            <ProactiveSuggestion
                message={proactiveSuggestion.message}
                acceptLabel={proactiveSuggestion.acceptLabel}
                onAccept={proactiveSuggestion.onAccept}
            />
        )}

        {isSaveWorkflowModalOpen && <SaveWorkflowModal />}

      </main>
    </div>
  );
}


const App: React.FC = () => {
  return (
    <EditorProvider>
        <AppContent />
    </EditorProvider>
  );
};

export default App;