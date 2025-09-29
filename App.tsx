/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React from 'react';
import { EditorProvider, useEditor } from './context/EditorContext';
import Header from './components/Header';
import HomePage from './components/HomePage';
import ToolModal from './components/ToolModal';
import StartScreen from './components/StartScreen';
import EditorModalLayout from './components/EditorModalLayout';
import { type ToolId } from './types';
import { optimizeImage } from './utils/imageUtils';
import ComparisonModal from './components/ComparisonModal';
import ToastNotification from './components/ToastNotification';
import ProactiveSuggestion from './components/ProactiveSuggestion';
import LoadingOverlay from './components/LoadingOverlay';
import SaveWorkflowModal from './components/SaveWorkflowModal';

// Import all the tool panels
import SketchRenderPanel from './components/tools/SketchRenderPanel';
import ImageGenPanel from './components/tools/ImageGenPanel';
import CreativeFusionPanel from './components/tools/CreativeFusionPanel';
import OutpaintingPanel from './components/tools/OutpaintingPanel';
import ImageVariationPanel from './components/tools/ImageVariationPanel';
import ProductPhotographyPanel from './components/tools/ProductPhotographyPanel';
import CharacterDesignPanel from './components/tools/CharacterDesignPanel';
import ArchitecturalVizPanel from './components/tools/ArchitecturalVizPanel';
import InteriorDesignPanel from './components/tools/InteriorDesignPanel';
import FaceSwapPanel from './components/tools/FaceSwapPanel';
import VideoGenPanel from './components/tools/VideoGenPanel';
import StyledPortraitPanel from './components/tools/StyledPortraitPanel';
import MagicMontagePanel from './components/tools/MagicMontagePanel';

// Import restored editing panels
import CropPanel from './components/tools/CropPanel';
import StylePanel from './components/tools/StylePanel';
import AdjustmentPanel from './components/tools/AdjustmentPanel';
import GenerativeEditPanel from './components/tools/GenerativeEditPanel';
import RemoveBgPanel from './components/tools/RemoveBgPanel';
import UpscalePanel from './components/tools/UpscalePanel';
import TextPanel from './components/tools/TextPanel';
import RelightPanel from './components/tools/RelightPanel';
import LowPolyPanel from './components/tools/LowPolyPanel';
import PortraitsPanel from './components/tools/PortraitsPanel';
import StyleGenPanel from './components/tools/StyleGenPanel';
import DustAndScratchesPanel from './components/tools/DustAndScratchesPanel';
import ExtractArtPanel from './components/tools/ExtractArtPanel';
import NeuralFiltersPanel from './components/tools/NeuralFiltersPanel';
import TrendsPanel from './components/tools/TrendsPanel';
import LogoGenPanel from './components/tools/LogoGenPanel';
import ObjectRemoverPanel from './components/tools/ObjectRemoverPanel';
import FaceRecoveryPanel from './components/tools/FaceRecoveryPanel';
import DenoisePanel from './components/tools/DenoisePanel';

// Import new tool panels to resolve missing properties on toolMap.
import PatternGenPanel from './components/tools/PatternGenPanel';
import TextEffectsPanel from './components/tools/TextEffectsPanel';
import VectorConverterPanel from './components/tools/VectorConverterPanel';
import StickerCreatorPanel from './components/tools/StickerCreatorPanel';
import Model3DGenPanel from './components/tools/Model3DGenPanel';
import UnblurPanel from './components/tools/UnblurPanel';
import BananimatePanel from './components/tools/BananimatePanel';
import AIPortraitStudioPanel from './components/tools/AIPortraitStudioPanel';
import PhotoStudioPanel from './components/tools/PhotoStudioPanel';
import PolaroidPanel from './components/tools/PolaroidPanel';
import TexturePanel from './components/tools/TexturePanel';
import ImageRestorePanel from './components/tools/ImageRestorePanel';
import PixelArtPanel from './components/tools/PixelArtPanel';


// Map Tool IDs to their corresponding components and modal titles
const toolMap: Record<ToolId, { Component: React.FC; title: string }> = {
    // Generation Tools
    sketchRender: { Component: SketchRenderPanel, title: 'Renderização de Esboço' },
    imageGen: { Component: ImageGenPanel, title: 'Gerador de Imagens AI' },
    creativeFusion: { Component: CreativeFusionPanel, title: 'Fusão Criativa' },
    outpainting: { Component: OutpaintingPanel, title: 'Pintura Expansiva (Outpainting)' },
    imageVariation: { Component: ImageVariationPanel, title: 'Variação de Imagem' },
    productPhotography: { Component: ProductPhotographyPanel, title: 'Fotografia de Produto AI' },
    characterDesign: { Component: CharacterDesignPanel, title: 'Design de Personagem' },
    architecturalViz: { Component: ArchitecturalVizPanel, title: 'Visualização Arquitetônica' },
    interiorDesign: { Component: InteriorDesignPanel, title: 'Reforma de Interiores' },
    faceSwap: { Component: FaceSwapPanel, title: 'Troca de Rosto (Face Swap)' },
    videoGen: { Component: VideoGenPanel, title: 'Gerador de Vídeo AI' },
    logoGen: { Component: LogoGenPanel, title: 'Gerador de Logotipo AI' },
    patternGen: { Component: PatternGenPanel, title: 'Gerador de Padrões' },
    textEffects: { Component: TextEffectsPanel, title: 'Efeitos de Texto' },
    vectorConverter: { Component: VectorConverterPanel, title: 'Conversor de Vetor' },
    stickerCreator: { Component: StickerCreatorPanel, title: 'Criador de Adesivos AI' },
    aiPortraitStudio: { Component: AIPortraitStudioPanel, title: 'Estúdio de Retrato IA' },
    model3DGen: { Component: Model3DGenPanel, title: 'Gerador de Modelo 3D' },
    bananimate: { Component: BananimatePanel, title: 'Bananimate' },
    styledPortrait: { Component: StyledPortraitPanel, title: 'Retrato Estilizado' },
    photoStudio: { Component: PhotoStudioPanel, title: 'Foto Studio IA' },
    polaroid: { Component: PolaroidPanel, title: 'Polaroid com Artista IA' },

    // Editing Tools
    magicMontage: { Component: MagicMontagePanel, title: 'Montagem Mágica' },
    objectRemover: { Component: ObjectRemoverPanel, title: 'Removedor de Objetos' },
    extractArt: { Component: ExtractArtPanel, title: 'Extrair Arte' },
    crop: { Component: CropPanel, title: 'Cortar e Girar' },
    adjust: { Component: AdjustmentPanel, title: 'Ajustes' },
    style: { Component: StylePanel, title: 'Estilos Artísticos' },
    generativeEdit: { Component: GenerativeEditPanel, title: 'Edição Generativa' },
    removeBg: { Component: RemoveBgPanel, title: 'Removedor de Fundo' },
    upscale: { Component: UpscalePanel, title: 'Melhorar Resolução (Upscale)' },
    text: { Component: TextPanel, title: 'Adicionar Texto' },
    relight: { Component: RelightPanel, title: 'Reacender com IA' },
    lowPoly: { Component: LowPolyPanel, title: 'Estilo Low Poly' },
    pixelArt: { Component: PixelArtPanel, title: 'Estilo Pixel Art' },
    portraits: { Component: PortraitsPanel, title: 'Retratos IA' },
    styleGen: { Component: StyleGenPanel, title: 'Estilos Rápidos' },
    photoRestoration: { Component: ImageRestorePanel, title: 'Restauração de Foto' },
    dustAndScratches: { Component: DustAndScratchesPanel, title: 'Poeira e Arranhões' },
    neuralFilters: { Component: NeuralFiltersPanel, title: 'Filtros Neurais' },
    trends: { Component: TrendsPanel, title: 'Tendências' },
    unblur: { Component: UnblurPanel, title: 'Remover Desfoque' },
    texture: { Component: TexturePanel, title: 'Textura' },
    faceRecovery: { Component: FaceRecoveryPanel, title: 'Recuperação de Rosto' },
    denoise: { Component: DenoisePanel, title: 'Remover Ruído' },
};

const editingToolIds: ToolId[] = [
    'objectRemover', 'extractArt', 'crop', 'adjust', 'style', 
    'generativeEdit', 'removeBg', 'upscale', 'text', 'relight', 'lowPoly', 
    'pixelArt', 'portraits', 'styleGen', 'photoRestoration', 'dustAndScratches', 
    'neuralFilters', 'trends', 'unblur', 'texture', 'faceRecovery', 'denoise'
];

const toolsThatNeedImage: ToolId[] = [
    ...editingToolIds, 'imageVariation', 'creativeFusion', 'outpainting',
    'productPhotography', 'faceSwap', 'architecturalViz',
    'interiorDesign', 'sketchRender', 'textEffects', 'vectorConverter', 'aiPortraitStudio',
    'bananimate', 'styledPortrait', 'photoStudio', 'polaroid', 'magicMontage'
];

const AppContent: React.FC = () => {
    const { 
        activeTool, 
        currentImage, 
        setInitialImage,
        isLoading,
        setIsLoading,
        loadingMessage,
        setLoadingMessage,
        setError,
        isComparisonModalOpen,
        setIsComparisonModalOpen,
        originalImageUrl,
        currentImageUrl,
        toast,
        setToast,
        proactiveSuggestion,
        uploadProgress,
        setUploadProgress,
        isSaveWorkflowModalOpen,
    } = useEditor()!;
    
    const currentToolInfo = activeTool ? toolMap[activeTool] : null;
    const requiresImage = activeTool ? toolsThatNeedImage.includes(activeTool) : false;
    const isEditingTool = activeTool ? editingToolIds.includes(activeTool) : false;

    const handleFileSelect = async (file: File) => {
        if (!activeTool) return;
        
        setIsLoading(true);
        setLoadingMessage("Otimizando imagem...");
        setUploadProgress({ progress: 0, stage: 'reading' });
        try {
            const optimizedFile = await optimizeImage(file, setUploadProgress);
            setInitialImage(optimizedFile);
        } catch (error) {
            console.error("Erro ao otimizar:", error);
            setError("Não foi possível processar a imagem. Por favor, tente outra.");
        } finally {
            setIsLoading(false);
            setLoadingMessage(null);
            setUploadProgress(null);
        }
    };
    
    const renderModalContent = () => {
        if (requiresImage && !currentImage) {
            return (
                <div className="flex items-center justify-center h-full p-4">
                    <StartScreen onFileSelect={handleFileSelect} />
                </div>
            );
        }
        
        const Component = currentToolInfo?.Component;
        if (!Component) return null;
        
        if (isEditingTool) {
            return <EditorModalLayout />;
        }
        
        return <Component />;
    };

    const isHomePageVisible = !activeTool;
    
    return (
        <div className="h-screen bg-gray-900 text-gray-100 flex flex-col">
            {isLoading && loadingMessage && (
                <LoadingOverlay message={loadingMessage} progressStatus={uploadProgress} />
            )}
            <Header isEditingTool={isEditingTool} />
            <main className="flex-grow overflow-y-auto">
                {isHomePageVisible ? (
                    <HomePage />
                ) : (
                    currentToolInfo && (
                        <ToolModal title={currentToolInfo.title}>
                            {renderModalContent()}
                        </ToolModal>
                    )
                )}
            </main>
             {originalImageUrl && currentImageUrl && (
                <ComparisonModal
                    isOpen={isComparisonModalOpen}
                    onClose={() => setIsComparisonModalOpen(false)}
                    beforeImage={originalImageUrl}
                    afterImage={currentImageUrl}
                />
            )}
            {isSaveWorkflowModalOpen && <SaveWorkflowModal />}
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
        </div>
    );
};

const App: React.FC = () => {
    return (
        <EditorProvider>
            <AppContent />
        </EditorProvider>
    );
};

export default App;