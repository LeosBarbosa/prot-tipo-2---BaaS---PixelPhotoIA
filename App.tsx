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
import AIPortraitPanel from './components/tools/AIPortraitPanel';
import VideoGenPanel from './components/tools/VideoGenPanel';

// Import restored editing panels
import CropPanel from './components/tools/CropPanel';
import StylePanel from './components/tools/StylePanel';
import AdjustmentPanel from './components/tools/AdjustmentPanel';
import GenerativeEditPanel from './components/tools/GenerativeEditPanel';
import RemoveBgPanel from './components/tools/RemoveBgPanel';
import UpscalePanel from './components/tools/UpscalePanel';
import TextPanel from './components/tools/TextPanel';
import RelightPanel from './components/tools/RelightPanel';
import MagicPromptPanel from './components/tools/MagicPromptPanel';
import LowPolyPanel from './components/tools/LowPolyPanel';
import PortraitsPanel from './components/tools/PortraitsPanel';
import StyleGenPanel from './components/tools/StyleGenPanel';
import WonderPanel from './components/tools/WonderPanel';
import DustAndScratchesPanel from './components/tools/DustAndScratchesPanel';
import ExtractArtPanel from './components/tools/ExtractArtPanel';
import NeuralFiltersPanel from './components/tools/NeuralFiltersPanel';
import TrendsPanel from './components/tools/TrendsPanel';
import LogoGenPanel from './components/tools/LogoGenPanel';

// FIX: Import new tool panels to resolve missing properties on toolMap.
import PatternGenPanel from './components/tools/PatternGenPanel';
import TextEffectsPanel from './components/tools/TextEffectsPanel';
import VectorConverterPanel from './components/tools/VectorConverterPanel';
import StickerCreatorPanel from './components/tools/StickerCreatorPanel';
import Model3DGenPanel from './components/tools/Model3DGenPanel';
import DenoisePanel from './components/tools/DenoisePanel';
import FaceRecoveryPanel from './components/tools/FaceRecoveryPanel';
import UnblurPanel from './components/tools/UnblurPanel';
import BananimatePanel from './components/tools/BananimatePanel';
// Replaced by AIPortraitStudioPanel
// import CaricatureGenPanel from './components/tools/CaricatureGenPanel';
import AIPortraitStudioPanel from './components/tools/AIPortraitStudioPanel';


// Map Tool IDs to their corresponding components and modal titles
// FIX: Add missing tool definitions to toolMap to match the ToolId type.
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
    aiPortrait: { Component: AIPortraitPanel, title: 'Gerador de Retrato IA' },
    videoGen: { Component: VideoGenPanel, title: 'Gerador de Vídeo AI' },
    logoGen: { Component: LogoGenPanel, title: 'Gerador de Logotipo AI' },
    patternGen: { Component: PatternGenPanel, title: 'Gerador de Padrões' },
    textEffects: { Component: TextEffectsPanel, title: 'Efeitos de Texto' },
    vectorConverter: { Component: VectorConverterPanel, title: 'Conversor de Vetor' },
    stickerCreator: { Component: StickerCreatorPanel, title: 'Criador de Adesivos AI' },
    // Replaced caricatureGen with the new AIPortraitStudio
    aiPortraitStudio: { Component: AIPortraitStudioPanel, title: 'Estúdio de Retrato IA' },
    model3DGen: { Component: Model3DGenPanel, title: 'Gerador de Modelo 3D' },
    bananimate: { Component: BananimatePanel, title: 'Bananimate' },

    // Editing Tools
    extractArt: { Component: ExtractArtPanel, title: 'Extrair Arte' },
    crop: { Component: CropPanel, title: 'Cortar e Girar' },
    adjust: { Component: AdjustmentPanel, title: 'Ajustes' },
    style: { Component: StylePanel, title: 'Estilos Artísticos' },
    generativeEdit: { Component: GenerativeEditPanel, title: 'Edição Generativa' },
    removeBg: { Component: RemoveBgPanel, title: 'Removedor de Fundo' },
    upscale: { Component: UpscalePanel, title: 'Melhorar Resolução (Upscale)' },
    text: { Component: TextPanel, title: 'Adicionar Texto' },
    relight: { Component: RelightPanel, title: 'Reacender com IA' },
    magicPrompt: { Component: MagicPromptPanel, title: 'Prompt Mágico' },
    lowPoly: { Component: LowPolyPanel, title: 'Estilo Low Poly' },
    portraits: { Component: PortraitsPanel, title: 'Retratos IA' },
    styleGen: { Component: StyleGenPanel, title: 'Estilos Rápidos' },
    wonderModel: { Component: WonderPanel, title: 'Modelo Wonder' },
    dustAndScratches: { Component: DustAndScratchesPanel, title: 'Poeira e Arranhões' },
    neuralFilters: { Component: NeuralFiltersPanel, title: 'Filtros Neurais' },
    trends: { Component: TrendsPanel, title: 'Tendências' },
    denoise: { Component: DenoisePanel, title: 'Remover Ruído (Denoise)' },
    faceRecovery: { Component: FaceRecoveryPanel, title: 'Recuperação de Rosto' },
    unblur: { Component: UnblurPanel, title: 'Remover Desfoque' },
};

// FIX: Add new editing tool IDs and remove `videoGen` which is a generation tool.
const editingToolIds: ToolId[] = ['extractArt', 'crop', 'adjust', 'style', 'generativeEdit', 'removeBg', 'upscale', 'text', 'relight', 'magicPrompt', 'lowPoly', 'portraits', 'styleGen', 'wonderModel', 'dustAndScratches', 'neuralFilters', 'trends', 'denoise', 'faceRecovery', 'unblur'];

// FIX: Add new tools that require an image to start.
const toolsThatNeedImage: ToolId[] = [
    ...editingToolIds, 'imageVariation', 'creativeFusion', 'outpainting',
    'productPhotography', 'faceSwap', 'aiPortrait', 'architecturalViz',
    'interiorDesign', 'sketchRender', 'textEffects', 'vectorConverter', 'aiPortraitStudio',
    'bananimate'
];

const AppContent: React.FC = () => {
    const { 
        activeTool, 
        currentImage, 
        setInitialImage,
        setIsLoading,
        setLoadingMessage,
        setError,
        isComparisonModalOpen,
        setIsComparisonModalOpen,
        originalImageUrl,
        currentImageUrl,
        toast,
        setToast,
    } = useEditor()!;
    
    const currentToolInfo = activeTool ? toolMap[activeTool] : null;
    const requiresImage = activeTool ? toolsThatNeedImage.includes(activeTool) : false;
    const isEditingTool = activeTool ? editingToolIds.includes(activeTool) : false;

    const handleFileSelect = async (file: File) => {
        if (!activeTool) return;
        
        setIsLoading(true);
        setLoadingMessage("Otimizando imagem...");
        try {
            const optimizedFile = await optimizeImage(file);
            setInitialImage(optimizedFile);
        } catch (error) {
            console.error("Erro ao otimizar:", error);
            setError("Não foi possível processar a imagem. Por favor, tente outra.");
        } finally {
            setIsLoading(false);
            setLoadingMessage(null);
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
            {toast && (
                <ToastNotification
                    message={toast.message}
                    onClose={() => setToast(null)}
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