/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import { type PixelCrop } from 'react-image-crop';
// FIX: Import React types directly to resolve namespace errors.
import type { Dispatch, SetStateAction, RefObject, WheelEvent, MouseEvent, TouchEvent } from 'react';

// Centralize AIStudio type declaration to resolve conflicts by declaring it within the global scope.
declare global {
    // FIX: Defined AIStudio interface to resolve type conflict with existing global declarations.
    interface AIStudio {
      hasSelectedApiKey: () => Promise<boolean>;
      openSelectKey: () => Promise<void>;
    }
    
    interface Window {
        aistudio?: AIStudio;
    }
}

export type ToolCategory = 'generation' | 'workflow' | 'editing';

export type ToolId =
  // Generation
  | 'imageGen' | 'videoGen' | 'logoGen' | 'patternGen' | 'model3DGen' | 'stickerCreator' | 'characterDesign' | 'placeholderGen'
  // Workflow
  | 'batchProcessing' | 'magicWorkflow' | 'magicScenery' | 'voiceAssistant' | 'confidentStudio' | 'photoStudio' | 'aiPortraitStudio' | 'funkoPopStudio' | 'tryOn' | 'styledPortrait' | 'superheroFusion' | 'doubleExposure' | 'polaroid'
  // Editing
  | 'crop' | 'adjust' | 'localAdjust' | 'magicMontage' | 'objectRemover' | 'removeBg' | 'faceSwap' | 'generativeEdit' | 'text' | 'textEffects' | 'aiTextEdit' | 'photoRestoration' | 'upscale' | 'superResolution' | 'unblur' | 'sharpen' | 'relight' | 'style' | 'portraits' | 'lowPoly' | 'pixelArt' | 'styleGen' | 'texture' | 'dustAndScratches' | 'extractArt' | 'neuralFilters' | 'trends' | 'history' | 'newAspectRatio' | 'denoise' | 'faceRecovery' | 'imageVariation' | 'outpainting' | 'productPhotography' | 'architecturalViz' | 'interiorDesign' | 'sketchRender' | 'vectorConverter' | 'bananimate' | 'aiPngCreator' | 'clone' | 'imageAnalysis';

export type TabId = ToolId;

export type VideoAspectRatio = '16:9' | '9:16' | '1:1';

export type TransformType = 'rotate-left' | 'rotate-right' | 'flip-h' | 'flip-v';

export interface ToolConfig {
    id: ToolId;
    name: string;
    description: string;
    icon: string;
    category: ToolCategory;
    isEditingTool: boolean;
    tag?: 'new' | 'tip';
}

export type BlendMode =
  | 'normal' | 'multiply' | 'screen' | 'overlay' | 'darken' | 'lighten'
  | 'color-dodge' | 'color-burn' | 'hard-light' | 'soft-light'
  | 'difference' | 'exclusion' | 'hue' | 'saturation' | 'color' | 'luminosity';

export interface BaseLayer {
    id: string;
    name: string;
    type: 'image' | 'adjustment';
    isVisible: boolean;
    opacity: number;
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

export interface ToolHistoryItem {
    toolId: ToolId;
    params?: any;
}

export interface LayerStateSnapshot {
    layers: Layer[];
    activeLayerId: string | null;
    toolHistory: ToolHistoryItem[];
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

export interface FilterState {
    brightness: number;
    contrast: number;
    saturate: number;
    grayscale: number;
    sepia: number;
    hueRotate: number;
    invert: number;
    blur: number;
    curve?: number[];
}

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
    icon: string;
    action: {
        type: 'tool' | 'workflow';
        payload: ToolId | ToolId[];
    };
}

export interface SmartSearchResult {
    tool: ToolConfig;
    args: Record<string, any>;
}

export interface Trend {
    name: string;
    prompt: string;
    bg: string;
    icon: string;
    type?: 'descriptive';
}

export type ToastType = 'error' | 'success' | 'info';

export interface Toast {
    message: string;
    type: ToastType;
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

export interface TextToolState {
    content: string;
    fontFamily: string;
    fontSize: number; // percentage of image width
    color: string;
    align: 'left' | 'center' | 'right';
    bold: boolean;
    italic: boolean;
    position: { x: number, y: number }; // percentage
}

export interface ProactiveSuggestionConfig {
    message: string;
    acceptLabel: string;
    onAccept: () => void;
}

export interface TexturePreviewState {
    url: string;
    opacity: number;
    blendMode: 'overlay' | 'multiply' | 'screen';
}

export interface PreviewState {
    trend: Trend;
    url: string;
    applyToAll: boolean;
}

export { type PixelCrop };


export interface EditorContextType {
  // Core State
  isEditingSessionActive: boolean;
  setIsEditingSessionActive: (active: boolean) => void;
  baseImageFile: File | null;
  setInitialImage: (file: File) => void;
  uploadedFile: File | null;
  isGif: boolean;
  gifFrames: GifFrame[];
  handleGoHome: () => void;
  handleUploadNew: () => void;
  handleExplicitSave: () => void;
  isLeftPanelVisible: boolean;
  setIsLeftPanelVisible: (visible: boolean) => void;
  isRightPanelVisible: boolean;
  setIsRightPanelVisible: (visible: boolean) => void;
  theme: 'dark' | 'light';
  toggleTheme: () => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  setIsDownloadModalOpen: (isOpen: boolean) => void;
  isDownloadModalOpen: boolean;
  handleDownload: (format: 'png' | 'jpeg', quality?: number) => void;
  // FIX: Update toolHistory type for better type safety.
  toolHistory: ToolHistoryItem[];
  zoom: number;
  setZoom: Dispatch<SetStateAction<number>>;
  isPanModeActive: boolean;
  setIsPanModeActive: (isActive: boolean) => void;
  resetZoomAndPan: () => void;
  currentImageUrl: string | null;
  originalImageUrl: string | null;
  jumpToState: (index: number) => void;
  setIsComparisonModalOpen: (isOpen: boolean) => void;
  isComparisonModalOpen: boolean;
  isInlineComparisonActive: boolean;
  setIsInlineComparisonActive: (isActive: boolean) => void;
  setIsSaveWorkflowModalOpen: (isOpen: boolean) => void;
  isSaveWorkflowModalOpen: boolean;
  activeTab: TabId;
  setActiveTab: (tabId: TabId) => void;
  toast: Toast | null;
  setToast: (toast: Toast | null) => void;
  activeTool: ToolId | null;
  setActiveTool: (toolId: ToolId | null) => void;
  handleSmartSearch: (prompt: string) => void;
  isSmartSearching: boolean;
  smartSearchResult: SmartSearchResult | null;
  setSmartSearchResult: (result: SmartSearchResult | null) => void;
  handleFileSelect: (file: File) => void;
  hasRestoredSession: boolean;
  isLoading: boolean;
  error: string | null;
  setError: (error: string | null) => void;
  setIsLoading: (loading: boolean) => void;
  setLoadingMessage: (message: string | null) => void;
  loadingMessage: string | null;
  imgRef: RefObject<HTMLImageElement>;
  canvasRef: RefObject<HTMLCanvasElement>;
  crop: PixelCrop | undefined;
  setCrop: Dispatch<SetStateAction<PixelCrop | undefined>>;
  completedCrop: PixelCrop | undefined;
  setCompletedCrop: Dispatch<SetStateAction<PixelCrop | undefined>>;
  aspect: number | undefined;
  setAspect: Dispatch<SetStateAction<number | undefined>>;
  startDrawing: (e: MouseEvent<HTMLCanvasElement>) => void;
  stopDrawing: () => void;
  draw: (e: MouseEvent<HTMLCanvasElement>) => void;
  generatedVideoUrl: string | null;
  detectedObjects: DetectedObject[] | null;
  setDetectedObjects: Dispatch<SetStateAction<DetectedObject[] | null>>;
  highlightedObject: DetectedObject | null;
  setHighlightedObject: (object: DetectedObject | null) => void;
  handleSelectObject: (object: DetectedObject) => void;
  localFilters: FilterState;
  setLocalFilters: Dispatch<SetStateAction<FilterState>>;
  hasLocalAdjustments: boolean;
  buildFilterString: (filters: Partial<FilterState>) => string;
  textToolState: TextToolState;
  setTextToolState: Dispatch<SetStateAction<TextToolState>>;
  texturePreview: TexturePreviewState | null;
  brushSize: number;
  setBrushSize: Dispatch<SetStateAction<number>>;
  handleSetCloneSource: (source: { x: number; y: number } | null) => void;
  cloneSource: { x: number; y: number } | null;
  cloneStrokeStart: { x: number; y: number } | null;
  isEditCompleted: boolean;
  setIsEditCompleted: (isCompleted: boolean) => void;
  handleApplyCrop: () => void;
  handleTransform: (transformType: TransformType) => void;
  handleRemoveBackground: () => void;
  handleApplyUpscale: (factor: number, preserveFace: boolean) => void;
  handleRelight: (prompt: string) => void;
  handleApplyLowPoly: () => void;
  handleApplyDustAndScratch: () => void;
  handleExtractArt: () => void;
  handleDenoise: () => void;
  handleApplyFaceRecovery: () => void;
  handleUnblurImage: (sharpenLevel: number, denoiseLevel: number, model: string) => void;
  handleApplySharpen: (intensity: number) => void;
  handleApplyStyle: (stylePrompt: string, applyToAll: boolean) => void;
  generateAIPreview: (trend: Trend, applyToAll: boolean) => void;
  isPreviewLoading: boolean;
  previewState: PreviewState | null;
  setPreviewState: Dispatch<SetStateAction<PreviewState | null>>;
  commitAIPreview: () => void;
  handleGenerativeEdit: () => void;
  prompt: string;
  setPrompt: Dispatch<SetStateAction<string>>;
  clearMask: () => void;
  maskDataUrl: string | null;
  handleDetectObjects: (prompt?: string) => void;
  handleDetectFaces: () => Promise<void>;
  layers: Layer[];
  activeLayerId: string | null;
  setActiveLayerId: (id: string | null) => void;
  handleAnalyzeImage: (question: string) => Promise<string | undefined>;
  handleApplyText: () => void;
  resetTextToolState: () => void;
  histogram: { r: number[]; g: number[]; b: number[]; } | null;
  handleApplyCurve: (lut: number[]) => void;
  addPromptToHistory: (prompt: string) => void;
  initialPromptFromMetadata: string;
  handleFaceSwap: (sourceImageFile: File, target: DetectedObject, prompt: string, negativePrompt: string) => Promise<string | undefined>;
  handleGenerateVideo: (prompt: string, aspectRatio: VideoAspectRatio) => void;
  handleMagicPrompt: (prompt: string) => void;
  handleApplyLocalAdjustments: (filters: FilterState) => Promise<void>;
  resetLocalFilters: () => void;
  handleApplyAIAdjustment: (prompt: string, applyToAll: boolean) => void;
  handleApplyNewAspectRatio: () => void;
  handleEditTextWithPrompt: (prompt: string) => void;
  addWorkflow: (workflow: Workflow) => void;
  executeWorkflow: (toolIds: ToolId[]) => void;
  savedWorkflows: Workflow[];
  recentTools: ToolId[];
  handlePredefinedSearchAction: (action: { type: 'tool' | 'workflow'; payload: ToolId | ToolId[]; }) => void;
  handleMagicScenery: (objectFile: File, sceneryPrompt: string) => Promise<void>;
  handleApplyClone: () => void;
  toggleLayerVisibility: (layerId: string) => void;
  deleteLayer: (layerId: string | null) => void;
  updateLayer: (layerId: string, updates: Partial<Layer>) => void;
  mergeDownLayer: (layerId: string | null) => void;
  moveLayerUp: (layerId: string | null) => void;
  moveLayerDown: (layerId: string | null) => void;
  reorderLayer: (dragIndex: number, hoverIndex: number) => void;
  addPlaceholderLayer: (prompt: string) => Promise<void>;
  handleAIPortrait: (style: string, personImages: File[], prompt: string) => void;
  handleConfidentStudio: (imageFile: File, mainPrompt: string, negativePrompt: string) => void;
  handleFunkoPop: (mainImageFile: File, personImage: File | null, bgDescription: string, objectDescription: string, lightingDescription: string, funkoType: string, specialFinish: string) => void;
  handleMagicMontage: (mainImageFile: File, prompt: string, secondImageFile?: File) => Promise<void>;
  handlePolaroid: (personFile: File, celebrityFile: File, negativePrompt: string) => void;
  handleStyledPortrait: (personFile: File, styleFiles: File[], prompt: string, negativePrompt: string) => void;
  handleSuperheroFusion: (person: File, hero: File) => Promise<void>;
  handleVirtualTryOn: (personFile: File, clothingFile: File, shoeFile: File | undefined, scenePrompt: string, posePrompt: string, cameraLens: string, cameraAngle: string, lightingStyle: string, negativePrompt: string) => void;
  handleCreativeFusion: (compositionFile: File, styleFiles: File[]) => void;
  handleDoubleExposure: (portraitFile: File, landscapeFile: File) => Promise<string>;
  handleBatchProcess: (files: File[], toolIds: ToolId[], onProgress: (results: { original: string; processed: string; }[]) => void) => void;
  isBatchProcessing: boolean;
  batchProgress: { current: number; total: number; } | null;
  startVoiceSession: () => void;
  stopVoiceSession: () => void;
  voiceState: 'IDLE' | 'CONNECTING' | 'CONNECTED' | 'DISCONNECTED' | 'ERROR';
  voiceTranscript: { source: 'user' | 'ia' | 'system'; text: string; }[];
  proactiveSuggestion: ProactiveSuggestionConfig | null;
  setProactiveSuggestion: (suggestion: ProactiveSuggestionConfig | null) => void;
  commitChange: (layers: Layer[], activeLayerId: string | null, toolId: ToolId, params?: any) => void;
  handleApplyTexture: () => void;
  setTexturePreview: (texture: TexturePreviewState | null) => void;
  showOnboarding: boolean;
  setShowOnboarding: (show: boolean) => void;
  backgroundColor: string;
  confirmAndStartEditing: () => void;
  cancelPreview: () => void;
  uploadProgress: UploadProgressStatus | null;
  currentFrameIndex: number;
  setCurrentFrameIndex: Dispatch<SetStateAction<number>>;
  isCurrentlyPanning: boolean;
  history: LayerStateSnapshot[];
  historyIndex: number;
  panOffset: { x: number; y: number };
  handleWheel: (e: WheelEvent<HTMLDivElement>) => void;
  handlePanStart: (e: MouseEvent) => void;
  handleTouchStart: (e: TouchEvent<HTMLDivElement>) => void;
  handleTouchMove: (e: TouchEvent<HTMLDivElement>, containerRect: DOMRect) => void;
  handleTouchEnd: (e: TouchEvent<HTMLDivElement>) => void;
  handleEnhanceResolutionAndSharpness: (factor: number, intensity: number, preserveFace: boolean) => void;
  handleObjectRemove: () => void;
  // FIX: Add missing handleRestorePhoto to the context type
  handleRestorePhoto: (colorize: boolean) => void;
  handleApplySepiaFilter: () => void;
  isBrushActive: boolean;
  setIsBrushActive: Dispatch<SetStateAction<boolean>>;
}