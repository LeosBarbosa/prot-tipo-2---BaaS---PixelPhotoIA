/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React from 'react';
import { type Crop, type PixelCrop } from 'react-image-crop';

// General App State
export type Theme = 'light' | 'dark';
export type ToastType = 'success' | 'error' | 'info';
export interface Toast {
  message: string;
  type: ToastType;
}

// Tool & Tab Configuration
export type ToolCategory = 'generation' | 'workflow' | 'editing';
export type ToolId =
  | 'imageGen' | 'sketchRender' | 'characterDesign' | 'videoGen' | 'patternGen'
  | 'textEffects' | 'logoGen' | 'stickerCreator' | 'model3DGen' | 'aiPngCreator'
  | 'photoStudio' | 'polaroid' | 'superheroFusion' | 'styledPortrait' | 'tryOn'
  | 'interiorDesign' | 'architecturalViz' | 'creativeFusion' | 'doubleExposure'
  | 'outpainting' | 'productPhotography' | 'aiPortraitStudio' | 'bananimate'
  | 'confidentStudio' | 'funkoPopStudio' | 'magicMontage' | 'objectRemover'
  | 'faceSwap' | 'generativeEdit' | 'extractArt' | 'crop' | 'adjust'
  | 'style' | 'unblur' | 'sharpen' | 'text' | 'removeBg' | 'upscale'
  | 'superResolution' | 'photoRestoration' | 'relight' | 'lowPoly' | 'pixelArt'
  | 'portraits' | 'styleGen' | 'dustAndScratches' | 'neuralFilters' | 'trends'
  | 'vectorConverter' | 'texture' | 'newAspectRatio' | 'history' | 'localAdjust'
  | 'faceRecovery' | 'denoise' | 'imageVariation';

export type TabId =
  | 'imageGen' | 'crop' | 'newAspectRatio' | 'adjust' | 'localAdjust' | 'magicMontage' | 'objectRemover'
  | 'removeBg' | 'faceSwap' | 'generativeEdit' | 'text' | 'photoRestoration'
  | 'upscale' | 'superResolution' | 'unblur' | 'sharpen' | 'relight' | 'style'
  | 'portraits' | 'lowPoly' | 'pixelArt' | 'styleGen' | 'texture' | 'dustAndScratches'
  | 'extractArt' | 'neuralFilters' | 'trends' | 'history';

export interface ToolConfig {
    id: ToolId;
    name: string;
    description: string;
    icon: React.ReactNode;
    category: ToolCategory;
    componentPath: string; // Caminho para o componente da ferramenta
    isEditingTool: boolean; // Distingue ferramentas de edição de modais
    tag?: 'new' | 'tip';
}

// Gemini & AI Services
export interface DetectedObject {
  label: string;
  box: {
    x_min: number;
    y_min: number;
    x_max: number;
    y_max: number;
  };
}

export interface SmartSearchResult {
  tool: ToolConfig;
  args?: any;
}

// Editor State
export type BlendMode =
  | 'normal' | 'multiply' | 'screen' | 'overlay' | 'darken' | 'lighten' 
  | 'color-dodge' | 'color-burn' | 'hard-light' | 'soft-light' 
  | 'difference' | 'exclusion' | 'hue' | 'saturation' | 'color' | 'luminosity';

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
}

export interface AdjustmentLayer extends BaseLayer {
  type: 'adjustment';
  filters: Partial<FilterState>;
}

export type Layer = ImageLayer | AdjustmentLayer;

export interface LayerStateSnapshot {
  layers: Layer[];
  activeLayerId: string | null;
  gifFrames?: GifFrame[];
}

export interface FilterState {
  brightness: number;
  contrast: number;
  saturate: number;
  grayscale: number;
  sepia: number;
  hueRotate: number;
  invert: number;
  blur: number; // in pixels
  curve?: number[];
}

export interface TextToolState {
  content: string;
  fontFamily: string;
  fontSize: number; // As a percentage of image width
  color: string;
  align: 'left' | 'center' | 'right';
  bold: boolean;
  italic: boolean;
  position: { x: number; y: number }; // As percentage of canvas
}

// GIF Handling
export interface GifFrame {
    imageData: {
        data: Uint8ClampedArray;
        width: number;
        height: number;
    };
    delay: number;
}

// Workflows & Search
export type WorkflowIconType = 'product' | 'restore' | 'creative' | 'custom';

export interface Workflow {
  id: string;
  name: string;
  description: string;
  toolIds: ToolId[];
  icon: WorkflowIconType;
  isUserDefined?: boolean;
}

export interface PredefinedSearch {
  keywords: string[];
  title: string;
  description: string;
  icon: React.ReactNode;
  action: {
    type: 'workflow' | 'tool';
    payload: ToolId[] | ToolId;
  };
}

export interface Trend {
    name: string;
    prompt: string;
    bg: string;
    icon: React.ReactNode;
    type?: 'descriptive';
}

// Misc
export interface UploadProgressStatus {
    progress: number;
    stage: 'reading' | 'processing' | 'compressing' | 'done';
}

export type VideoAspectRatio = '16:9' | '1:1' | '9:16';

export type TransformType = 'rotate-left' | 'rotate-right' | 'flip-h' | 'flip-v';

export interface ProactiveSuggestionState {
    message: string;
    acceptLabel: string;
    onAccept: () => void;
    toolId: ToolId;
    args?: any;
}


export interface PreviewState {
    url: string;
    trend: Trend;
    applyToAll: boolean;
}

export interface TexturePreviewState {
    url: string;
    opacity: number;
    blendMode: BlendMode;
}

export interface EditorContextType {
    // State
    activeTool: ToolId | null;
    activeTab: TabId;
    isLoading: boolean;
    loadingMessage: string | null;
    error: string | null;
    isComparisonModalOpen: boolean;
    isInlineComparisonActive: boolean;
    toast: Toast | null;
    proactiveSuggestion: ProactiveSuggestionState | null;
    uploadProgress: UploadProgressStatus | null;
    isSaveWorkflowModalOpen: boolean;
    isLeftPanelVisible: boolean;
    isRightPanelVisible: boolean;
    theme: Theme;
    layers: Layer[];
    activeLayerId: string | null;
    baseImageFile: File | undefined;
    currentImageUrl: string | null;
    originalImageUrl: string | null;
    compositeCssFilter: string;
    hasRestoredSession: boolean;
    isEditingSessionActive: boolean;
    history: LayerStateSnapshot[];
    historyIndex: number;
    canUndo: boolean;
    canRedo: boolean;
    toolHistory: ToolId[];
    isGif: boolean;
    gifFrames: GifFrame[];
    currentFrameIndex: number;
    zoom: number;
    panOffset: { x: number; y: number };
    isPanModeActive: boolean;
    isCurrentlyPanning: boolean;
    crop: Crop | undefined;
    completedCrop: PixelCrop | undefined;
    aspect: number | undefined;
    maskDataUrl: string | null;
    brushSize: number;
    detectedObjects: DetectedObject[] | null;
    highlightedObject: DetectedObject | null;
    localFilters: FilterState;
    hasLocalAdjustments: boolean;
    histogram: { r: number[]; g: number[]; b: number[]; } | null;
    previewState: PreviewState | null;
    isPreviewLoading: boolean;
    textToolState: TextToolState;
    generatedVideoUrl: string | null;
    texturePreview: TexturePreviewState | null;
    isSmartSearching: boolean;
    smartSearchResult: SmartSearchResult | null;
    savedWorkflows: Workflow[];
    recentTools: ToolId[];
    promptHistory: string[];
    prompt: string;
    initialPromptFromMetadata: string | null;

    // Refs
    imgRef: React.RefObject<HTMLImageElement>;
    canvasRef: React.RefObject<HTMLCanvasElement>;

    // Setters / Actions
    setActiveTool: React.Dispatch<React.SetStateAction<ToolId | null>>;
    setActiveTab: React.Dispatch<React.SetStateAction<TabId>>;
    setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
    setLoadingMessage: React.Dispatch<React.SetStateAction<string | null>>;
    setError: React.Dispatch<React.SetStateAction<string | null>>;
    setIsComparisonModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
    setIsInlineComparisonActive: React.Dispatch<React.SetStateAction<boolean>>;
    setToast: React.Dispatch<React.SetStateAction<Toast | null>>;
    setProactiveSuggestion: React.Dispatch<React.SetStateAction<ProactiveSuggestionState | null>>;
    setUploadProgress: React.Dispatch<React.SetStateAction<UploadProgressStatus | null>>;
    setIsSaveWorkflowModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
    setIsLeftPanelVisible: React.Dispatch<React.SetStateAction<boolean>>;
    setIsRightPanelVisible: React.Dispatch<React.SetStateAction<boolean>>;
    toggleTheme: () => void;
    setActiveLayerId: (id: string | null) => void;
    setInitialImage: (file: File | null) => Promise<void>;
    setIsEditingSessionActive: React.Dispatch<React.SetStateAction<boolean>>;
    updateLayer: (layerId: string, updates: Partial<Layer>) => void;
    deleteLayer: (layerId: string | null) => void;
    toggleLayerVisibility: (layerId: string) => void;
    mergeDownLayer: (layerId: string | null) => void;
    moveLayerUp: (layerId: string | null) => void;
    moveLayerDown: (layerId: string | null) => void;
    undo: () => void;
    redo: () => void;
    jumpToState: (index: number) => void;
    resetHistory: () => void;
    commitChange: (newLayers: Layer[], newActiveLayerId: string | null, toolId?: ToolId) => void;
    setCurrentFrameIndex: React.Dispatch<React.SetStateAction<number>>;
    setZoom: React.Dispatch<React.SetStateAction<number>>;
    setIsPanModeActive: React.Dispatch<React.SetStateAction<boolean>>;
    resetZoomAndPan: () => void;
    setCrop: React.Dispatch<React.SetStateAction<Crop | undefined>>;
    setCompletedCrop: React.Dispatch<React.SetStateAction<PixelCrop | undefined>>;
    setAspect: React.Dispatch<React.SetStateAction<number | undefined>>;
    setMaskDataUrl: React.Dispatch<React.SetStateAction<string | null>>;
    setBrushSize: React.Dispatch<React.SetStateAction<number>>;
    clearMask: () => void;
    startDrawing: (e: React.MouseEvent<HTMLCanvasElement>) => void;
    stopDrawing: () => void;
    draw: (e: React.MouseEvent<HTMLCanvasElement>) => void;
    setDetectedObjects: React.Dispatch<React.SetStateAction<DetectedObject[] | null>>;
    setHighlightedObject: React.Dispatch<React.SetStateAction<DetectedObject | null>>;
    setLocalFilters: React.Dispatch<React.SetStateAction<FilterState>>;
    resetLocalFilters: () => void;
    setPreviewState: React.Dispatch<React.SetStateAction<PreviewState | null>>;
    setTextToolState: React.Dispatch<React.SetStateAction<TextToolState>>;
    resetTextToolState: () => void;
    setGeneratedVideoUrl: React.Dispatch<React.SetStateAction<string | null>>;
    setTexturePreview: React.Dispatch<React.SetStateAction<TexturePreviewState | null>>;
    setSmartSearchResult: React.Dispatch<React.SetStateAction<SmartSearchResult | null>>;
    addWorkflow: (workflow: Workflow) => void;
    addPromptToHistory: (prompt: string) => void;
    setPrompt: React.Dispatch<React.SetStateAction<string>>;

    // Handlers
    handleWheel: (e: React.WheelEvent<HTMLDivElement>) => void;
    handlePanStart: (e: React.MouseEvent) => void;
    handleTouchStart: (e: React.TouchEvent) => void;
    handleTouchMove: (e: React.TouchEvent, containerRect: DOMRect) => void;
    handleTouchEnd: (e: React.TouchEvent) => void;
    buildFilterString: (filters: Partial<FilterState>) => string;
    executeWorkflow: (toolIds: ToolId[]) => void;
    handlePredefinedSearchAction: (action: PredefinedSearch['action']) => void;
    handleSmartSearch: (term: string) => Promise<void>;
    handleFileSelect: (file: File | null) => Promise<void>;
    handleGoHome: () => void;
    handleTriggerUpload: () => void;
    handleExplicitSave: () => Promise<void>;
    handleApplyCrop: () => void;
    handleTransform: (transformType: TransformType) => Promise<void>;
    handleRemoveBackground: () => void;
    handleRelight: (prompt: string) => void;
    handleMagicPrompt: (prompt: string) => void;
    handleApplyLowPoly: () => void;
    handleExtractArt: () => void;
    handleApplyDustAndScratch: () => void;
    handleDenoise: () => void;
    handleApplyFaceRecovery: () => void;
    handleGenerateProfessionalPortrait: (applyToAll?: boolean) => void;
    handleRestorePhoto: (colorize: boolean) => void;
    handleApplyUpscale: (factor: number, preserveFace: boolean) => void;
    handleUnblurImage: (sharpenLevel: number, denoiseLevel: number, model: string) => void;
    handleApplySharpen: (intensity: number) => void;
    handleApplyNewAspectRatio: () => void;
    handleGenerativeEdit: () => Promise<void>;
    handleObjectRemove: () => Promise<void>;
    handleDetectObjects: (objectPrompt?: string) => Promise<void>;
    handleDetectFaces: () => Promise<void>;
    handleFaceRetouch: () => Promise<void>;
    handleFaceSwap: (sourceImage: File, userPrompt: string) => Promise<void>;
    handleSelectObject: (object: DetectedObject) => void;
    handleApplyLocalAdjustments: (applyToAll: boolean) => Promise<void>;
    handleApplyCurve: (lut: number[]) => void;
    handleApplyStyle: (stylePrompt: string, applyToAll: boolean) => void;
    handleApplyAIAdjustment: (prompt: string, applyToAll: boolean) => void;
    handleApplyText: () => Promise<void>;
    handleGenerateVideo: (prompt: string, aspectRatio: VideoAspectRatio) => void;
    handleDownload: () => Promise<void>;
    handleApplyTexture: () => Promise<void>;
    handleVirtualTryOn: (personImage: File, clothingImage: File, shoeImage: File | undefined, scenePrompt: string, posePrompt: string, cameraLens: string, cameraAngle: string, lightingStyle: string, negativePrompt: string) => void;
    handleFunkoPop: (mainImage: File, personImage: File | null, bg: string, obj: string, light: string, type: string, finish: string) => void;
    handleStyledPortrait: (personImage: File, styleImages: File[], prompt: string, negativePrompt: string) => Promise<void>;
    handlePolaroid: (personImage: File, celebrityImage: File, negativePrompt: string) => Promise<void>;
    handleConfidentStudio: (personImage: File, mainPrompt: string, negativePrompt: string) => void;
    handleSuperheroFusion: (userImage: File, heroImage: File) => void;
    handleAIPortrait: (styleId: string, personImages: File[], prompt: string) => Promise<void>;
    handleEnhanceResolutionAndSharpness: (factor: number, intensity: number, preserveFace: boolean) => void;
    handleDoubleExposure: (portraitImage: File, landscapeImage: File) => Promise<string>;
    handleCreativeFusion: (compositionImage: File, styleImages: File[]) => Promise<void>;
    generateAIPreview: (trend: Trend, applyToAll: boolean) => Promise<void>;
    commitAIPreview: () => Promise<void>;
    handleMagicMontage: (mainImage: File, prompt: string, secondImage?: File) => Promise<void>;
}