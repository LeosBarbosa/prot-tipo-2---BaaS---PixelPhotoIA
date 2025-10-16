/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { lazy, Suspense, useMemo } from 'react';
import { EditorProvider, useEditor } from './context/EditorContext';
import Header from './components/Header';
import { type ToolId, type TabId } from './types';
import ComparisonModal from './components/ComparisonModal';
import ToastNotification from './components/ToastNotification';
import ProactiveSuggestion from './components/ProactiveSuggestion';
import LoadingOverlay from './components/LoadingOverlay';
import SaveWorkflowModal from './components/SaveWorkflowModal';
import Spinner from './components/Spinner';
import StudioLayout from './components/StudioLayout';
import ToolModal from './components/ToolModal';

// FIX: Replaced Vite-specific `import.meta.glob` with a static map of lazy-loaded components.
// This resolves the runtime error as the project uses Babel Standalone, not Vite.
const toolMap: Partial<Record<ToolId, { Component: React.LazyExoticComponent<React.FC<{}>>; title: string }>> = {
    imageGen: { Component: lazy(() => import('./components/tools/ImageGenPanel')), title: 'Gerador de Imagens AI' },
    sketchRender: { Component: lazy(() => import('./components/tools/SketchRenderPanel')), title: 'Renderização de Esboço' },
    characterDesign: { Component: lazy(() => import('./components/tools/CharacterDesignPanel')), title: 'Design de Personagem' },
    videoGen: { Component: lazy(() => import('./components/tools/VideoGenPanel')), title: 'Gerador de Vídeo AI' },
    patternGen: { Component: lazy(() => import('./components/tools/PatternGenPanel')), title: 'Gerador de Padrões' },
    textEffects: { Component: lazy(() => import('./components/tools/TextEffectsPanel')), title: 'Efeitos de Texto' },
    logoGen: { Component: lazy(() => import('./components/tools/LogoGenPanel')), title: 'Gerador de Logotipo AI' },
    stickerCreator: { Component: lazy(() => import('./components/tools/StickerCreatorPanel')), title: 'Criador de Adesivos AI' },
    model3DGen: { Component: lazy(() => import('./components/tools/Model3DGenPanel')), title: 'Gerador de Modelo 3D' },
    aiPngCreator: { Component: lazy(() => import('./components/tools/AIPngCreatorPanel')), title: 'Criador de PNG Transparente' },
    photoStudio: { Component: lazy(() => import('./components/tools/PhotoStudioPanel')), title: 'Ensaio Fotográfico IA' },
    polaroid: { Component: lazy(() => import('./components/tools/PolaroidPanel')), title: 'Polaroid com Artista IA' },
    superheroFusion: { Component: lazy(() => import('./components/tools/SuperheroFusionPanel')), title: 'Fusão de Super-Herói' },
    styledPortrait: { Component: lazy(() => import('./components/tools/StyledPortraitPanel')), title: 'Retrato Estilizado' },
    tryOn: { Component: lazy(() => import('./components/tools/TryOnPanel')), title: 'Provador Virtual' },
    interiorDesign: { Component: lazy(() => import('./components/tools/InteriorDesignPanel')), title: 'Reforma de Interiores' },
    architecturalViz: { Component: lazy(() => import('./components/tools/ArchitecturalVizPanel')), title: 'Visualização Arquitetônica' },
    creativeFusion: { Component: lazy(() => import('./components/tools/CreativeFusionPanel')), title: 'Fusão Criativa' },
    doubleExposure: { Component: lazy(() => import('./components/tools/DoubleExposurePanel')), title: 'Dupla Exposição Artística' },
    outpainting: { Component: lazy(() => import('./components/tools/OutpaintingPanel')), title: 'Pintura Expansiva' },
    productPhotography: { Component: lazy(() => import('./components/tools/ProductPhotographyPanel')), title: 'Fotografia de Produto AI' },
    aiPortraitStudio: { Component: lazy(() => import('./components/tools/AIPortraitStudioPanel')), title: 'Estúdio de Retrato IA' },
    bananimate: { Component: lazy(() => import('./components/tools/BananimatePanel')), title: 'Bananimate' },
    confidentStudio: { Component: lazy(() => import('./components/tools/ConfidentStudioPanel')), title: 'Retrato de Estúdio Confiante' },
    funkoPopStudio: { Component: lazy(() => import('./components/tools/FunkoPopStudioPanel')), title: 'Estúdio Funko Pop' },
    imageVariation: { Component: lazy(() => import('./components/tools/ImageVariationPanel')), title: 'Variação de Imagem' },
    vectorConverter: { Component: lazy(() => import('./components/tools/VectorConverterPanel')), title: 'Conversor de Vetor' },
    history: { Component: lazy(() => import('./components/HistoryPanel')), title: 'Histórico' },
};


function AppContent() {
  const { 
    activeTool,
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
  } = useEditor();

  const ActiveToolComponent = useMemo(() => {
    if (!activeTool || !toolMap[activeTool]) return null;
    return toolMap[activeTool]!.Component;
  }, [activeTool]);
  
  const activeToolTitle = useMemo(() => {
      if (!activeTool || !toolMap[activeTool]) return '';
      return toolMap[activeTool]!.title;
  }, [activeTool]);
  
  return (
    <div className="w-full min-h-screen flex flex-col bg-gray-900 text-gray-200 transition-colors duration-300 lg:overflow-hidden">
      <Header />
      <main className="flex-grow flex flex-col relative">
        <StudioLayout />

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