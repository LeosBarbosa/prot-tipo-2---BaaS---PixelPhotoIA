/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import { type ReactNode } from 'react';

export type ToolCategory = 'generation' | 'workflow' | 'editing';
export type WorkflowIconType = 'product' | 'restore' | 'creative' | 'custom';
export type ToastType = 'error' | 'success' | 'info';
export type VideoAspectRatio = "16:9" | "1:1" | "9:16";
export type BlendMode =
    | 'normal' | 'multiply' | 'screen' | 'overlay' | 'darken' | 'lighten'
    | 'color-dodge' | 'color-burn' | 'hard-light' | 'soft-light'
    | 'difference' | 'exclusion' | 'hue' | 'saturation' | 'color' | 'luminosity';


export type ToolId =
  | 'imageGen' | 'sketchRender' | 'characterDesign' | 'videoGen' | 'patternGen'
  | 'textEffects' | 'logoGen' | 'stickerCreator' | 'model3DGen' | 'aiPngCreator'
  | 'photoStudio' | 'polaroid' | 'superheroFusion' | 'styledPortrait' | 'tryOn'
  | 'interiorDesign' | 'architecturalViz' | 'creativeFusion' | 'doubleExposure'
  | 'outpainting' | 'productPhotography' | 'aiPortraitStudio' | 'bananimate'
  | 'confidentStudio' | 'funkoPopStudio' | 'magicMontage' | 'objectRemover'
  | 'faceSwap' | 'generativeEdit' | 'extractArt' | 'crop' | 'adjust'
  | 'style' | 'unblur' | 'sharpen' | 'text' | 'removeBg' | 'upscale'
  | 'superResolution' | 'photoRestoration' | 'relight' | 'lowPoly'
  | 'pixelArt' | 'portraits' | 'styleGen' | 'dustAndScratches'
  | 'neuralFilters' | 'trends' | 'vectorConverter' | 'texture'
  // FIX: Added missing ToolIds
  | 'newAspectRatio' | 'faceRecovery' | 'denoise' | 'localAdjust' | 'history'
  | 'imageVariation';

export type TabId =
  | 'crop' | 'newAspectRatio' | 'adjust' | 'localAdjust' | 'magicMontage' | 'objectRemover'
  | 'removeBg' | 'faceSwap' | 'generativeEdit' | 'text' | 'photoRestoration' | 'upscale'
  | 'superResolution' | 'unblur' | 'sharpen' | 'relight' | 'style' | 'portraits'
  | 'lowPoly' | 'pixelArt' | 'styleGen' | 'texture' | 'dustAndScratches'
  | 'extractArt' | 'neuralFilters' | 'trends' | 'history';


export interface ToolConfig {
    id: ToolId;
    name: string;
    description: string;
    icon: ReactNode;
    category: ToolCategory;
    tag?: 'new' | 'tip';
}

export interface SmartSearchResult {
    tool: ToolConfig;
    args?: any;
}

export interface PredefinedSearch {
    keywords: string[];
    title: string;
    description: string;
    icon: ReactNode;
    action: {
        type: 'tool' | 'workflow';
        payload: ToolId | ToolId[];
    };
}

export interface UploadProgressStatus {
    progress: number;
    stage: 'reading' | 'processing' | 'compressing' | 'done';
}

export interface GifFrame {
    imageData: {
        data: Uint8ClampedArray;
        width: number;
        height: number;
    };
    delay: number;
}

export interface DetectedObject {
    label: string;
    box: {
        x_min: number;
        y_min: number;
        x_max: number;
        y_max: number;
    };
}

export interface Workflow {
    id: string;
    name: string;
    description: string;
    toolIds: ToolId[];
    icon: WorkflowIconType;
    isUserDefined: boolean;
}

export interface Toast {
    message: string;
    type: ToastType;
}

export interface ProactiveSuggestionAction {
    message: string;
    acceptLabel: string;
    toolId: ToolId;
    args?: any;
    onAccept: () => void;
}

export interface FilterState {
    brightness: number;
    contrast: number;
    saturate: number;
    grayscale: number;
    sepia: number;
    invert: number;
    hueRotate: number;
    blur: number;
}


export interface TextToolState {
    content: string;
    fontFamily: string;
    fontSize: number; // as percentage of image width
    color: string;
    position: { x: number; y: number }; // percentage
    bold: boolean;
    italic: boolean;
    align: 'left' | 'center' | 'right';
}

export interface BaseLayer {
    id: string;
    name: string;
    isVisible: boolean;
    opacity: number;
    blendMode: BlendMode;
}


export interface ImageLayer extends BaseLayer {
    type: 'image';
    file: File;
    filters: Partial<FilterState>; // Non-destructive filters
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

export interface Trend {
  name: string;
  prompt: string;
  bg: string;
  icon: React.ReactNode;
  type?: 'descriptive';
}

export interface ProactiveSuggestionState {
    message: string;
    acceptLabel: string;
    toolId: ToolId;
    args?: any;
    onAccept: () => void;
}

export interface PreviewState {
    url: string;
    trend: Trend;
    applyToAll: boolean;
}

export type TransformType = 'rotate-left' | 'rotate-right' | 'flip-h' | 'flip-v';

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
    proactiveSuggestion: ProactiveSuggestionAction | null;
    setProactiveSuggestion: React.Dispatch<React.SetStateAction<ProactiveSuggestionAction | null>>;
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
    layers: Layer[];
    activeLayerId: string | null;
    setActiveLayerId: (id: string | null) => void;
    baseImageFile: File | null;
    currentImageUrl: string | null;
    compositeCssFilter: string;
    originalImageUrl: string | null;
    imgRef: React.RefObject<HTMLImageElement>;
    setInitialImage: (file: File | null) => void;
    hasRestoredSession: boolean;
    isEditingSessionActive: boolean;
    setIsEditingSessionActive: React.Dispatch<React.SetStateAction<boolean>>;
    updateLayer: (layerId: string, updates: Partial<Layer>) => void;
    deleteLayer: (layerId: string) => void;
    toggleLayerVisibility: (layerId: string) => void;
    mergeDownLayer: (layerId: string) => void;
    moveLayerUp: (layerId: string) => void;
    moveLayerDown: (layerId: string) => void;
    history: LayerStateSnapshot[];
    historyIndex: number;
    canUndo: boolean;
    canRedo: boolean;
    undo: () => void;
    redo: () => void;
    jumpToState: (index: number) => void;
    resetHistory: () => void;
    toolHistory: ToolId[];
    commitChange: (newLayers: Layer[], newActiveLayerId: string | null, toolId?: ToolId | undefined) => void;
    isGif: boolean;
    gifFrames: GifFrame[];
    currentFrameIndex: number;
    setCurrentFrameIndex: React.Dispatch<React.SetStateAction<number>>;
    zoom: number;
    setZoom: React.Dispatch<React.SetStateAction<number>>;
    panOffset: { x: number, y: number };
    isPanModeActive: boolean;
    setIsPanModeActive: React.Dispatch<React.SetStateAction<boolean>>;
    isCurrentlyPanning: boolean;
    handleWheel: (e: React.WheelEvent<HTMLDivElement>) => void;
    handlePanStart: (e: React.MouseEvent<Element, MouseEvent>) => void;
    handleTouchStart: (e: React.TouchEvent<Element>) => void;
    handleTouchMove: (e: React.TouchEvent<Element>, containerRect: DOMRect) => void;
    handleTouchEnd: (e: React.TouchEvent<Element>) => void;
    resetZoomAndPan: () => void;
    crop: any;
    setCrop: React.Dispatch<React.SetStateAction<any>>;
    completedCrop: any;
    setCompletedCrop: React.Dispatch<React.SetStateAction<any>>;
    aspect: number | undefined;
    setAspect: React.Dispatch<React.SetStateAction<number | undefined>>;
    canvasRef: React.RefObject<HTMLCanvasElement>;
    maskDataUrl: string | null;
    setMaskDataUrl: React.Dispatch<React.SetStateAction<string | null>>;
    brushSize: number;
    setBrushSize: React.Dispatch<React.SetStateAction<number>>;
    clearMask: () => void;
    startDrawing: (e: React.MouseEvent<HTMLCanvasElement, MouseEvent>) => void;
    stopDrawing: () => void;
    draw: (e: React.MouseEvent<HTMLCanvasElement, MouseEvent>) => void;
    detectedObjects: DetectedObject[] | null;
    setDetectedObjects: React.Dispatch<React.SetStateAction<DetectedObject[] | null>>;
    highlightedObject: DetectedObject | null;
    setHighlightedObject: React.Dispatch<React.SetStateAction<DetectedObject | null>>;
    localFilters: FilterState;
    setLocalFilters: React.Dispatch<React.SetStateAction<FilterState>>;
    hasLocalAdjustments: boolean;
    buildFilterString: (filters: FilterState) => string;
    resetLocalFilters: () => void;
    histogram: { r: number[]; g: number[]; b: number[]; } | null;
    previewState: { url: string; trend: Trend; applyToAll: boolean; } | null;
    setPreviewState: React.Dispatch<React.SetStateAction<{ url: string; trend: Trend; applyToAll: boolean; } | null>>;
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
    addWorkflow: (workflow: Workflow) => Promise<void>;
    recentTools: ToolId[];
    promptHistory: string[];
    addPromptToHistory: (newPrompt: string) => void;
    executeWorkflow: (toolIds: ToolId[]) => void;
    handlePredefinedSearchAction: (action: PredefinedSearch['action']) => void;
    handleSmartSearch: (term: string) => Promise<void>;
    handleFileSelect: (file: File) => Promise<void>;
    handleGoHome: () => void;
    handleTriggerUpload: () => void;
    handleExplicitSave: () => void;
    handleApplyCrop: () => void;
    handleTransform: (transformType: TransformType) => void;
    handleRemoveBackground: () => void;
    handleRelight: (prompt: string) => void;
    handleMagicPrompt: (prompt: string) => Promise<void>;
    handleApplyLowPoly: () => void;
    handleExtractArt: () => void;
    handleApplyDustAndScratch: () => void;
    handleDenoise: () => void;
    handleApplyFaceRecovery: () => void;
    // FIX: Update signature to accept applyToAll boolean for GIF processing
    handleGenerateProfessionalPortrait: (applyToAll: boolean) => void;
    handleRestorePhoto: (colorize: boolean) => void;
    handleApplyUpscale: (factor: number, preserveFace: boolean) => void;
    handleEnhanceResolutionAndSharpness: (factor: number, intensity: number, preserveFace: boolean) => void;
    handleUnblurImage: (sharpenLevel: number, denoiseLevel: number, model: string) => void;
    handleApplySharpen: (intensity: number) => void;
    handleApplyNewAspectRatio: () => void;
    handleGenerativeEdit: () => Promise<void>;
    handleObjectRemove: () => Promise<void>;
    handleDetectObjects: (prompt?: string) => Promise<void>;
    handleDetectFaces: () => Promise<void>;
    handleFaceRetouch: () => Promise<void>;
    handleFaceSwap: (sourceImageFile: File, userPrompt: string) => void;
    handleSelectObject: (object: DetectedObject) => void;
    handleApplyLocalAdjustments: (applyToAll: boolean) => void;
    handleApplyCurve: (lut: number[]) => void;
    // FIX: Update signature to accept applyToAll boolean for GIF processing
    handleApplyStyle: (stylePrompt: string, applyToAll: boolean) => void;
    // FIX: Update signature to accept applyToAll boolean for GIF processing
    handleApplyAIAdjustment: (prompt: string, applyToAll: boolean) => void;
    handleApplyText: () => void;
    handleGenerateVideo: (prompt: string, aspectRatio: VideoAspectRatio) => void;
    handleDownload: () => void;
    handleApplyTexture: () => void;
    handleVirtualTryOn: (personImage: File, clothingImage: File, shoeImage?: File | undefined) => void;
    handleFunkoPop: (mainImage: File, personImage: File | null, bgDescription: string, objectDescription: string, lightingDescription: string, funkoType: string, specialFinish: string) => void;
    handleStyledPortrait: (personImage: File, styleImage: File[], prompt: string, negativePrompt: string) => void;
    handlePolaroid: (personImage: File, celebrityImage: File, negativePrompt: string) => void;
    handleConfidentStudio: (personImage: File, mainPrompt: string, negativePrompt: string) => void;
    handleAIPortrait: (style: 'caricature' | 'pixar' | '3d' | 'yearbook90s', images: File[], prompt: string) => void;
    handleDoubleExposure: (portraitImage: File, landscapeImage: File) => Promise<string>;
    prompt: string;
    setPrompt: React.Dispatch<React.SetStateAction<string>>;
    generateAIPreview: (trend: Trend, applyToAll: boolean) => void;
    commitAIPreview: () => void;
    initialPromptFromMetadata: string | null;
}