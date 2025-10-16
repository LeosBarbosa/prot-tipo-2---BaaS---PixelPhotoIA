

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React from 'react';
import { Crop, PixelCrop } from 'react-image-crop';

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
  // FIX: Added missing ToolIds
  | 'faceRecovery' | 'denoise' | 'imageVariation';

export type TabId =
  | 'crop' | 'newAspectRatio' | 'adjust' | 'localAdjust' | 'magicMontage' | 'objectRemover'
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

export interface EditorContextType {
    activeTool: ToolId | null;
    setActiveTool: React.Dispatch<React.SetStateAction<ToolId | null>>;
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
    toast: Toast | null;
    setToast: React.Dispatch<React.SetStateAction<Toast | null>>;
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
    theme: Theme;
    toggleTheme: () => void;
    layers: Layer[];
    activeLayerId: string | null;
    setActiveLayerId: (id: string | null) => void;
    baseImageFile: File | undefined;
    currentImageUrl: string | null;
    compositeCssFilter: string;
    originalImageUrl: string | null;
    imgRef: React.RefObject<HTMLImageElement>;
    setInitialImage: (file: File | null) => Promise<void>;
    hasRestoredSession: boolean;
    isEditingSessionActive: boolean;
    setIsEditingSessionActive: React.Dispatch<React.SetStateAction<boolean>>;
    updateLayer: (layerId: string, updates: Partial<Layer>) => void;
    deleteLayer: (layerId: string | null) => void;
    toggleLayerVisibility: (layerId: string) => void;
    mergeDownLayer: (layerId: string | null) => void;
    moveLayerUp: (layerId: string | null) => void;
    moveLayerDown: (layerId: string | null) => void;
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
    isGif: boolean;
    gifFrames: GifFrame[];
    currentFrameIndex: number;
    setCurrentFrameIndex: React.Dispatch<React.SetStateAction<number>>;
    zoom: number;
    setZoom: React.Dispatch<React.SetStateAction<number>>;
    panOffset: { x: number; y: number };
    isPanModeActive: boolean;
    setIsPanModeActive: React.Dispatch<React.SetStateAction<boolean>>;
    isCurrentlyPanning: boolean;
    handleWheel: (e: React.WheelEvent<HTMLDivElement>) => void;
    handlePanStart: (e: React.MouseEvent<Element, MouseEvent>) => void;
    handleTouchStart: (e: React.TouchEvent<Element>) => void;
    handleTouchMove: (e: React.TouchEvent<Element>, containerRect: DOMRect) => void;
    handleTouchEnd: (e: React.TouchEvent<Element>) => void;
    resetZoomAndPan: () => void;
    crop: Crop | undefined;
    setCrop: React.Dispatch<React.SetStateAction<Crop | undefined>>;
    completedCrop: PixelCrop | undefined;
    setCompletedCrop: React.Dispatch<React.SetStateAction<PixelCrop | undefined>>;
    aspect: number | undefined;
    setAspect: React.Dispatch<React.SetStateAction<number | undefined>>;
    canvasRef: React.RefObject<HTMLCanvasElement>;
    maskDataUrl: string | null;
    setMaskDataUrl: React.Dispatch<React.SetStateAction<string | null>>;
    brushSize: number;
    setBrushSize: React.Dispatch<React.SetStateAction<number>>;
    clearMask: () => void;
    startDrawing: (e: React.MouseEvent<HTMLCanvasElement>) => void;
    stopDrawing: () => void;
    draw: (e: React.MouseEvent<HTMLCanvasElement>) => void;
    detectedObjects: DetectedObject[] | null;
    setDetectedObjects: React.Dispatch<React.SetStateAction<DetectedObject[] | null>>;
    highlightedObject: DetectedObject | null;
    setHighlightedObject: React.Dispatch<React.SetStateAction<DetectedObject | null>>;
    localFilters: FilterState;
    setLocalFilters: React.Dispatch<React.SetStateAction<FilterState>>;
    hasLocalAdjustments: boolean;
    buildFilterString: (filters: Partial<FilterState>) => string;
    resetLocalFilters: () => void;
    histogram: { r: number[]; g: number[]; b: number[]; } | null;
    previewState: PreviewState | null;
    setPreviewState: React.Dispatch<React.SetStateAction<PreviewState | null>>;
    isPreviewLoading: boolean;
    textToolState: TextToolState;
    setTextToolState: React.Dispatch<React.SetStateAction<TextToolState>>;
    resetTextToolState: () => void;
    generatedVideoUrl: string | null;
    setGeneratedVideoUrl: React.Dispatch<React.SetStateAction<string | null>>;
    texturePreview: any;
    setTexturePreview: React.Dispatch<React.SetStateAction<any>>;
    isSmartSearching: boolean;
    smartSearchResult: SmartSearchResult | null;
    setSmartSearchResult: React.Dispatch<React.SetStateAction<SmartSearchResult | null>>;
    savedWorkflows: Workflow[];
    addWorkflow: (workflow: Workflow) => void;
    recentTools: ToolId[];
    promptHistory: string[];
    addPromptToHistory: (prompt: string) => void;
    executeWorkflow: (toolIds: ToolId[]) => void;
    handlePredefinedSearchAction: (action: PredefinedSearch['action']) => void;
    handleSmartSearch: (term: string) => Promise<void>;
    handleFileSelect: (file: File | null) => void;
    handleGoHome: () => void;
    handleTriggerUpload: () => void;
    handleExplicitSave: () => void;
    handleApplyCrop: () => void;
    handleTransform: (transformType: TransformType) => Promise<void>;
    handleRemoveBackground: () => void;
    handleRelight: (prompt: string) => void;
    // FIX: Added handleMagicMontage to context type
    handleMagicMontage: (mainImage: File, prompt: string, secondImage?: File) => void;
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
    handleGenerativeEdit: () => void;
    handleObjectRemove: () => void;
    handleDetectObjects: (prompt?: string) => Promise<void>;
    handleDetectFaces: () => Promise<void>;
    handleFaceRetouch: () => Promise<void>;
    handleFaceSwap: (sourceImage: File, userPrompt: string) => void;
    handleSelectObject: (object: DetectedObject) => void;
    handleApplyLocalAdjustments: (applyToAll: boolean) => Promise<void>;
    handleApplyCurve: (lut: number[]) => void;
    handleApplyStyle: (stylePrompt: string, applyToAll: boolean) => void;
    handleApplyAIAdjustment: (adjustmentPrompt: string, applyToAll: boolean) => void;
    handleApplyText: () => void;
    handleGenerateVideo: (prompt: string, aspectRatio: string) => void;
    handleDownload: () => void;
    handleApplyTexture: () => void;
    handleVirtualTryOn: (personImage: File, clothingImage: File, shoeImage: File | undefined, scenePrompt: string, posePrompt: string, cameraLens: string, cameraAngle: string, lightingStyle: string, negativePrompt: string) => void;
    handleFunkoPop: (mainImage: File, personImage: File | null, bg: string, obj: string, light: string, type: string, finish: string) => void;
    handleStyledPortrait: (personImage: File, styleImages: File[], prompt: string, negativePrompt: string) => Promise<void>;
    handlePolaroid: (personImage: File, celebrityImage: File, negativePrompt: string) => Promise<void>;
    handleConfidentStudio: (personImage: File, mainPrompt: string, negativePrompt: string) => Promise<void>;
    handleSuperheroFusion: (userImage: File, heroImage: File) => void;
    handleAIPortrait: (styleId: string, personImages: File[], prompt: string) => Promise<void>;
    handleEnhanceResolutionAndSharpness: (factor: number, intensity: number, preserveFace: boolean) => void;
    handleDoubleExposure: (portraitImage: File, landscapeImage: File) => Promise<string>;
    handleCreativeFusion: (compositionImage: File, styleImages: File[]) => Promise<void>;
    prompt: string;
    setPrompt: React.Dispatch<React.SetStateAction<string>>;
    generateAIPreview: (trend: Trend, applyToAll: boolean) => Promise<void>;
    commitAIPreview: () => Promise<void>;
    initialPromptFromMetadata: string | null;
}
