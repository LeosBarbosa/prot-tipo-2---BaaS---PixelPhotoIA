/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React from 'react';
import { type Crop, type PixelCrop } from 'react-image-crop';
import { DEFAULT_LOCAL_FILTERS, DEFAULT_TEXT_TOOL_STATE } from './context/EditorContext';

// Este ficheiro é agora a única fonte de verdade para todas as definições de tipos na aplicação.

export type ToolId =
  // Ferramentas de Geração
  | 'imageGen'
  | 'sketchRender'
  | 'creativeFusion'
  | 'outpainting'
  | 'imageVariation'
  | 'productPhotography'
  | 'characterDesign'
  | 'architecturalViz'
  | 'interiorDesign'
  | 'videoGen'
  | 'patternGen'
  | 'textEffects'
  | 'vectorConverter'
  | 'logoGen'
  | 'stickerCreator'
  | 'aiPortraitStudio'
  | 'model3DGen'
  | 'styledPortrait'
  | 'photoStudio'
  // Ferramentas de Fluxo de Trabalho
  | 'bananimate'
  | 'confidentStudio'
  | 'polaroid'
  | 'funkoPopStudio'
  | 'tryOn'
  | 'aiPngCreator'
  | 'superheroFusion'
  | 'doubleExposure'
  // Ferramentas de Edição
  | 'layers'
  | 'newAspectRatio'
  | 'magicMontage'
  | 'objectRemover'
  | 'faceSwap'
  | 'generativeEdit'
  | 'extractArt'
  | 'crop'
  | 'adjust'
  | 'style'
  | 'unblur'
  | 'sharpen'
  | 'text'
  | 'removeBg'
  | 'upscale'
  | 'superResolution'
  | 'photoRestoration'
  | 'relight'
  | 'lowPoly'
  | 'pixelArt'
  | 'portraits'
  | 'styleGen'
  | 'dustAndScratches'
  | 'neuralFilters'
  | 'trends'
  | 'texture'
  | 'localAdjust'
  | 'history'
  // Fix: Add missing ToolIds 'faceRecovery' and 'denoise'
  | 'faceRecovery'
  | 'denoise';

// Tipos de todo o editor
export type TabId = ToolId;
export type ToastType = 'success' | 'error' | 'info';

// Tipos do Painel de Transformação
export type TransformType = 'rotate-left' | 'rotate-right' | 'flip-h' | 'flip-v';

// Tipos do Painel de Melhoria
export type SharpenMode = 'light' | 'standard' | 'strong';

// Tipos do Painel de Colagem
export type CollageLayout = '2-vertical' | '2-horizontal' | '3-mixed-1' | '3-mixed-2' | '4-grid';

// Tipos do Painel de Vídeo
export type VideoAspectRatio = '16:9' | '1:1' | '9:16';

// Novo: Tipo para a funcionalidade de Deteção de Objetos
export interface DetectedObject {
  label: string;
  box: {
    x_min: number;
    y_min: number;
    x_max: number;
    y_max: number;
  };
}

// Novo: Tipo para Fluxos de Trabalho Salvos
export type WorkflowIconType = 'restore' | 'product' | 'creative' | 'custom';
export interface Workflow {
  id: string; // e.g., timestamp or uuid
  name: string; // e.g., "Restaurar Foto Antiga"
  description: string;
  toolIds: ToolId[];
  icon: WorkflowIconType;
  isUserDefined?: boolean;
}


// Novo: Tipo para a configuração da ferramenta
export type ToolCategory = 'generation' | 'workflow' | 'editing';

export interface ToolConfig {
    id: ToolId;
    name: string;
    description: string;
    icon: React.ReactNode;
    category: ToolCategory;
    tag?: 'new' | 'tip';
}

// Novo: Tipo para os resultados da Busca Inteligente
export interface SmartSearchResult {
    tool: ToolConfig;
    args: any;
}

export interface UploadProgressStatus {
    progress: number;
    stage: 'reading' | 'processing' | 'compressing' | 'done';
}

// Novo: Tipo para buscas pré-definidas
export interface PredefinedSearch {
  keywords: string[];
  title: string;
  description: string;
  icon: React.ReactNode;
  action: {
    type: 'tool' | 'workflow';
    payload: ToolId | ToolId[];
  };
}

// New Layer types
export type LayerType = 'image' | 'adjustment';

export type BlendMode =
  | 'normal'
  | 'multiply'
  | 'screen'
  | 'overlay'
  | 'darken'
  | 'lighten'
  | 'color-dodge'
  | 'color-burn'
  | 'hard-light'
  | 'soft-light'
  | 'difference'
  | 'exclusion'
  | 'hue'
  | 'saturation'
  | 'color'
  | 'luminosity';

export interface BaseLayer {
  id: string;
  name: string;
  isVisible: boolean;
  opacity: number; // 0-100
  blendMode: BlendMode;
}

export interface ImageLayer extends BaseLayer {
  type: 'image';
  file: File;
  isGif?: boolean;
}

// Reusing the existing filter type from EditorContext
export type FilterState = {
  brightness: number;
  contrast: number;
  saturate: number;
  sepia: number;
  invert: number;
  grayscale: number;
  hueRotate: number;
  blur: number;
  curve?: number[];
};

export interface AdjustmentLayer extends BaseLayer {
  type: 'adjustment';
  filters: Partial<FilterState>;
}

export type Layer = ImageLayer | AdjustmentLayer;

// Adicionado para suportar frames de GIF no histórico e estado
export interface GifFrame {
  // O armazenamento de dados brutos como ImageData não é serializável para o IndexedDB
  imageData: {
      data: Uint8ClampedArray;
      width: number;
      height: number;
  };
  delay: number;
}

// History will now store snapshots of the entire layer state
export interface LayerStateSnapshot {
    layers: Layer[];
    activeLayerId: string | null;
    gifFrames?: GifFrame[];
}

export interface ProactiveSuggestionState {
    message: string;
    acceptLabel: string;
    onAccept: () => void;
}

export interface TexturePreviewState {
    url: string;
    opacity: number;
    blendMode: 'overlay' | 'multiply' | 'screen' | 'normal';
}

export interface Trend {
    name: string;
    prompt: string;
    bg: string;
    icon?: React.ReactNode;
    type?: 'descriptive';
}

export interface PreviewState {
    url: string;
    trend: Trend;
    applyToAll: boolean;
}

export interface TextToolState {
    content: string;
    fontFamily: string;
    fontSize: number;
    color: string;
    align: 'left' | 'center' | 'right';
    bold: boolean;
    italic: boolean;
    position: { x: number, y: number };
}

export interface EditorContextType {
    // General State
    activeTool: ToolId | null; // This might be deprecated in favor of activeTab
    setActiveTool: (toolId: ToolId | null) => void;
    activeTab: TabId;
    setActiveTab: React.Dispatch<React.SetStateAction<TabId>>;
    isLoading: boolean;
    setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
    loadingMessage: string | null;
    setLoadingMessage: React.Dispatch<React.SetStateAction<string | null>>;
    error: string | null;
    setError: React.Dispatch<React.SetStateAction<string | null>>;
    isComparisonModalOpen: boolean;
    setIsComparisonModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
    isInlineComparisonActive: boolean;
    setIsInlineComparisonActive: React.Dispatch<React.SetStateAction<boolean>>;
    toast: { message: string, type: ToastType } | null;
    setToast: React.Dispatch<React.SetStateAction<{ message: string, type: ToastType } | null>>;
    proactiveSuggestion: ProactiveSuggestionState | null;
    setProactiveSuggestion: React.Dispatch<React.SetStateAction<ProactiveSuggestionState | null>>;
    uploadProgress: UploadProgressStatus | null;
    setUploadProgress: React.Dispatch<React.SetStateAction<UploadProgressStatus | null>>;
    isSaveWorkflowModalOpen: boolean;
    setIsSaveWorkflowModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
    isLeftPanelVisible: boolean;
    setIsLeftPanelVisible: React.Dispatch<React.SetStateAction<boolean>>;
    isRightPanelVisible: boolean;
    setIsRightPanelVisible: React.Dispatch<React.SetStateAction<boolean>>;
    theme: 'light' | 'dark';
    toggleTheme: () => void;

    // Image & Layer State
    layers: Layer[];
    activeLayerId: string | null;
    setActiveLayerId: (id: string | null) => void;
    baseImageFile: File | null;
    currentImageUrl: string | null;
    compositeCssFilter: string;
    originalImageUrl: string | null; // For comparison
    imgRef: React.RefObject<HTMLImageElement>;
    setInitialImage: (file: File | null) => Promise<void>;
    hasRestoredSession: boolean;
    // Fix: Add missing properties to EditorContextType
    isEditingSessionActive: boolean;
    setIsEditingSessionActive: React.Dispatch<React.SetStateAction<boolean>>;

    // Layer Actions
    updateLayer: (layerId: string, updates: Partial<Layer>) => void;
    deleteLayer: (layerId: string) => void;
    toggleLayerVisibility: (layerId: string) => void;
    mergeDownLayer: (layerId: string) => void;
    moveLayerUp: (layerId: string) => void;
    moveLayerDown: (layerId: string) => void;


    // History State
    history: LayerStateSnapshot[];
    historyIndex: number;
    canUndo: boolean;
    canRedo: boolean;
    undo: () => void;
    redo: () => void;
    jumpToState: (index: number) => void;
    resetHistory: () => void;
    toolHistory: ToolId[];
    commitChange: (newLayers: Layer[], newActiveLayerId: string | null, toolId?: ToolId) => void;

    // GIF State
    isGif: boolean;
    gifFrames: GifFrame[];
    currentFrameIndex: number;
    setCurrentFrameIndex: React.Dispatch<React.SetStateAction<number>>;

    // Pan & Zoom State
    zoom: number;
    setZoom: React.Dispatch<React.SetStateAction<number>>;
    panOffset: { x: number, y: number };
    isPanModeActive: boolean;
    setIsPanModeActive: React.Dispatch<React.SetStateAction<boolean>>;
    isCurrentlyPanning: boolean;
    handleWheel: (e: React.WheelEvent<HTMLDivElement>) => void;
    handlePanStart: (e: React.MouseEvent) => void;
    handleTouchStart: (e: React.TouchEvent) => void;
    handleTouchMove: (e: React.TouchEvent, containerRect: DOMRect) => void;
    handleTouchEnd: (e: React.TouchEvent) => void;
    resetZoomAndPan: () => void;

    // Crop State
    crop: Crop | undefined;
    setCrop: React.Dispatch<React.SetStateAction<Crop | undefined>>;
    completedCrop: PixelCrop | undefined;
    setCompletedCrop: React.Dispatch<React.SetStateAction<PixelCrop | undefined>>;
    aspect: number | undefined;
    setAspect: React.Dispatch<React.SetStateAction<number | undefined>>;

    // Masking State
    canvasRef: React.RefObject<HTMLCanvasElement>;
    maskDataUrl: string | null;
    setMaskDataUrl: React.Dispatch<React.SetStateAction<string | null>>;
    brushSize: number;
    setBrushSize: React.Dispatch<React.SetStateAction<number>>;
    clearMask: () => void;
    startDrawing: (e: React.MouseEvent<HTMLCanvasElement>) => void;
    stopDrawing: () => void;
    draw: (e: React.MouseEvent<HTMLCanvasElement>) => void;

    // Object Detection State
    detectedObjects: DetectedObject[] | null;
    setDetectedObjects: React.Dispatch<React.SetStateAction<DetectedObject[] | null>>;
    highlightedObject: DetectedObject | null;
    setHighlightedObject: React.Dispatch<React.SetStateAction<DetectedObject | null>>;

    // Local Adjustments State
    localFilters: FilterState;
    setLocalFilters: React.Dispatch<React.SetStateAction<FilterState>>;
    hasLocalAdjustments: boolean;
    buildFilterString: (filters: Partial<FilterState>) => string;
    resetLocalFilters: () => void;
    histogram: { r: number[], g: number[], b: number[] } | null;
    
    // AI Preview State
    previewState: PreviewState | null;
    setPreviewState: React.Dispatch<React.SetStateAction<PreviewState | null>>;
    isPreviewLoading: boolean;

    // Text Tool State
    textToolState: TextToolState;
    setTextToolState: React.Dispatch<React.SetStateAction<TextToolState>>;
    resetTextToolState: () => void;

    // Video Generation State
    generatedVideoUrl: string | null;
    setGeneratedVideoUrl: React.Dispatch<React.SetStateAction<string | null>>;

    // Texture State
    texturePreview: TexturePreviewState | null;
    setTexturePreview: React.Dispatch<React.SetStateAction<TexturePreviewState | null>>;

    // Smart Search State
    isSmartSearching: boolean;
    smartSearchResult: SmartSearchResult | null;
    setSmartSearchResult: React.Dispatch<React.SetStateAction<SmartSearchResult | null>>;
    
    // Workflows State
    savedWorkflows: Workflow[];
    addWorkflow: (workflow: Workflow) => void;
    recentTools: ToolId[];

    // Prompt History State
    promptHistory: string[];
    addPromptToHistory: (prompt: string) => void;
    
    // Tool Handlers
    executeWorkflow: (toolIds: ToolId[]) => void;
    handlePredefinedSearchAction: (action: PredefinedSearch['action']) => void;
    handleSmartSearch: (term: string) => void;
    handleFileSelect: (file: File) => Promise<void>;
    handleGoHome: () => void;
    handleTriggerUpload: () => void;
    handleExplicitSave: () => void;
    handleApplyCrop: () => void;
    handleTransform: (transformType: TransformType) => void;
    handleRemoveBackground: () => void;
    handleRelight: (prompt: string) => void;
    handleMagicPrompt: (prompt: string) => void;
    handleApplyLowPoly: () => void;
    handleExtractArt: () => void;
    handleApplyDustAndScratch: () => void;
    handleDenoise: () => void;
    handleApplyFaceRecovery: () => void;
    handleGenerateProfessionalPortrait: (applyToAll: boolean) => void;
    handleRestorePhoto: (colorize: boolean) => void;
    handleApplyUpscale: (factor: number, preserveFace: boolean) => void;
    handleApplySuperResolution: (factor: number, intensity: number, preserveFace: boolean) => void;
    handleUnblurImage: (sharpenLevel: number, denoiseLevel: number, model: string) => void;
    handleApplySharpen: (intensity: number) => void;
    handleApplyNewAspectRatio: () => void;
    handleGenerativeEdit: () => void;
    handleObjectRemove: () => void;
    handleDetectObjects: (prompt?: string) => void;
    handleDetectFaces: () => void;
    handleFaceRetouch: () => void;
    handleFaceSwap: (sourceImageFile: File, userPrompt: string) => void;
    handleSelectObject: (object: DetectedObject) => void;
    handleApplyLocalAdjustments: (applyToAll: boolean) => void;
    handleApplyCurve: (lut: number[]) => void;
    handleApplyStyle: (stylePrompt: string, applyToAll: boolean) => void;
    handleApplyAIAdjustment: (prompt: string, applyToAll: boolean) => void;
    handleApplyText: () => void;
    handleGenerateVideo: (prompt: string, aspectRatio: VideoAspectRatio) => void;
    handleDownload: () => void;
    handleApplyTexture: () => void;
    prompt: string;
    setPrompt: React.Dispatch<React.SetStateAction<string>>;
    generateAIPreview: (trend: Trend, applyToAll: boolean) => void;
    commitAIPreview: () => void;
    initialPromptFromMetadata: string | null;
}