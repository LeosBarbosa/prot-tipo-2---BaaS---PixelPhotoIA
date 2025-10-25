/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { createContext, useState, useContext, ReactNode, useCallback, useRef, useMemo, useEffect } from 'react';
import { type Crop, type PixelCrop } from 'react-image-crop';
// FIX: Correct the import path for 'imageProcessing' to be consistent with other utils.
// FIX: Moved createMaskFromBoundingBox to imageProcessing to fix module resolution error.
import { generateHistogram, applyLUT, applyFiltersToMaskedArea, loadImage, createMaskFromBoundingBox } from '../utils/imageProcessing';
import GIFEncoder from 'gif-encoder-2';
import saveAs from 'file-saver';

// Hooks
import { usePanAndZoom } from '../hooks/usePanAndZoom';
import { useMaskCanvas } from '../hooks/useMaskCanvas';

// Utils & Services
// FIX: Changed import path to be relative from the current directory.
import { dataURLtoFile, createMaskFromCrop, frameToFile, dataURLToImageData, frameToDataURL, fileToDataURL, optimizeImage } from '../utils/imageUtils';
import { parseGif } from '../utils/gifUtils';
import * as geminiService from '../services/geminiService';
import { type ToolId, type TransformType, type DetectedObject, TabId, type ToastType, Workflow, SmartSearchResult, PredefinedSearch, type UploadProgressStatus, type ToolConfig, type VideoAspectRatio, Layer, LayerStateSnapshot, ImageLayer, AdjustmentLayer, FilterState, BlendMode, ToolHistoryItem } from '../types';
import * as db from '../utils/db';
import { tools } from '../config/tools';

interface GifFrame {
    imageData: ImageData;
    delay: number;
}

interface ProactiveSuggestionState {
    message: string;
    acceptLabel: string;
    onAccept: () => void;
}

interface TexturePreviewState {
    url: string;
    opacity: number;
    blendMode: 'overlay' | 'multiply' | 'screen' | 'normal';
}

// Define Trend here so it can be used by PreviewState and generateAIPreview
interface Trend {
    name: string;
    prompt: string;
    bg: string;
    icon?: React.ReactNode;
    type?: 'descriptive';
}

interface PreviewState {
    url: string;
    trend: Trend;
    applyToAll: boolean;
}

export const DEFAULT_LOCAL_FILTERS: FilterState = {
    brightness: 100, 
    contrast: 100, 
    saturate: 100, 
    sepia: 0, 
    invert: 0,
    grayscale: 0, 
    hueRotate: 0, 
    blur: 0,
    curve: undefined as number[] | undefined,
};

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

export const DEFAULT_TEXT_TOOL_STATE: TextToolState = {
    content: 'Texto de Exemplo',
    fontFamily: 'Impact',
    fontSize: 8,
    color: '#FFFFFF',
    align: 'center',
    bold: false,
    italic: false,
    position: { x: 50, y: 50 },
};

interface EditorContextType {
    // General State
    activeTool: ToolId | null;
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
    isEditingSessionActive: boolean;
    setIsEditingSessionActive: React.Dispatch<React.SetStateAction<boolean>>;
    uploadedFile: File | null;
    isDownloadModalOpen: boolean;
    setIsDownloadModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
    showOnboarding: boolean;
    setShowOnboarding: React.Dispatch<React.SetStateAction<boolean>>;
    backgroundColor: string;
    setBackgroundColor: React.Dispatch<React.SetStateAction<string>>;
    confirmAndStartEditing: () => void;
    cancelPreview: () => void;
    handleGoHome: () => void;
    isEditCompleted: boolean;
    setIsEditCompleted: React.Dispatch<React.SetStateAction<boolean>>;


    // Image & Layer State
    layers: Layer[];
    activeLayerId: string | null;
    setActiveLayerId: (id: string | null) => void;
    baseImageFile: File | null;
    currentImageUrl: string | null;
    compositeCssFilter: string;
    originalImageUrl: string | null; // For comparison
    imgRef: React.RefObject<HTMLImageElement>;
    setInitialImage: (file: File | null) => void;
    hasRestoredSession: boolean;

    // Layer Actions
    updateLayer: (layerId: string, updates: Partial<Layer>) => void;
    deleteLayer: (layerId: string) => void;
    toggleLayerVisibility: (layerId: string) => void;
    mergeDownLayer: (layerId: string) => void;
    moveLayerUp: (layerId: string) => void;
    moveLayerDown: (layerId: string) => void;
    reorderLayer: (sourceIndex: number, destIndex: number) => void;
    addPlaceholderLayer: (prompt: string) => Promise<void>;


    // History State
    history: LayerStateSnapshot[];
    historyIndex: number;
    canUndo: boolean;
    canRedo: boolean;
    undo: () => void;
    redo: () => void;
    jumpToState: (index: number) => void;
    resetHistory: () => void;
    toolHistory: ToolHistoryItem[];
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

    // Clone State
    cloneSource: { x: number, y: number } | null;
    setCloneSource: React.Dispatch<React.SetStateAction<{ x: number, y: number} | null>>;
    handleSetCloneSource: (source: { x: number, y: number }) => void;
    cloneStrokeStart: { x: number, y: number } | null;

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
    
    isBatchProcessing: boolean;
    batchProgress: { current: number, total: number } | null;

    // Prompt History State
    promptHistory: string[];
    addPromptToHistory: (prompt: string) => void;
    
    // Tool Handlers
    executeWorkflow: (toolIds: ToolId[]) => void;
    handlePredefinedSearchAction: (action: PredefinedSearch['action']) => void;
    handleSmartSearch: (term: string) => void;
    handleFileSelect: (file: File) => Promise<void>;
    handleUploadNew: () => void;
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
    handleGenerateProfessionalPortrait: () => void;
    handleRestorePhoto: (colorize: boolean) => void;
    handleApplyUpscale: (factor: number, preserveFace: boolean) => void;
    handleUnblurImage: (sharpenLevel: number, denoiseLevel: number, model: string) => void;
    handleGenerativeEdit: () => void;
    handleEditTextWithPrompt: (prompt: string) => void;
    handleObjectRemove: () => void;
    handleDetectObjects: (prompt?: string) => void;
    handleDetectFaces: () => void;
    handleFaceRetouch: () => void;
    handleFaceSwap: (sourceImageFile: File, userPrompt: string) => Promise<string | undefined>;
    handleSelectObject: (object: DetectedObject) => void;
    handleApplyLocalAdjustments: (filters: FilterState) => Promise<void>;
    handleApplyCurve: (lut: number[]) => void;
    handleApplyStyle: (stylePrompt: string, applyToAll: boolean) => void;
    handleApplyAIAdjustment: (prompt: string, applyToAll: boolean) => void;
    handleApplyText: () => void;
    handleGenerateVideo: (prompt: string, aspectRatio: VideoAspectRatio) => void;
    handleDownload: (format: 'png' | 'jpeg', quality: number) => void;
    handleApplyTexture: () => void;
    prompt: string;
    setPrompt: React.Dispatch<React.SetStateAction<string>>;
    generateAIPreview: (trend: Trend, applyToAll: boolean) => void;
    commitAIPreview: () => void;
    initialPromptFromMetadata: string | null;

    // New Handlers
    handleSuperheroFusion: (person: File, hero: File) => void;
    handleConfidentStudio: (person: File, prompt: string, negativePrompt: string) => void;
    handleEnhanceResolutionAndSharpness: (factor: number, intensity: number, preserveFace: boolean) => void;
    handleApplyClone: () => void;
    handleStyledPortrait: (personFile: File, styleImages: File[], prompt: string, negativePrompt: string) => void;
    handleFunkoPop: (mainImage: File, personImage: File | null, bg: string, object: string, lighting: string, type: string, finish: string) => void;
    handlePolaroid: (person: File, celebrity: File, negativePrompt: string) => void;
    handleVirtualTryOn: (person: File, clothing: File, shoes: File | undefined, scene: string, pose: string, lens: string, angle: string, lighting: string, negative: string) => void;
    handleBatchProcess: (files: File[], toolIds: ToolId[], onProgress: (results: { original: string, processed: string }[]) => void) => void;
    startVoiceSession: () => void;
    stopVoiceSession: () => void;
    voiceState: 'IDLE' | 'CONNECTING' | 'CONNECTED' | 'DISCONNECTED' | 'ERROR';
    voiceTranscript: { source: string, text: string }[];
    handleApplyNewAspectRatio: () => void;
    handleApplySharpen: (intensity: number) => void;
    handleAnalyzeImage: (question: string) => Promise<string | undefined>;
    handleMagicScenery: (objectFile: File, sceneryPrompt: string) => void;
    handleCreativeFusion: (compositionFile: File, styleFiles: File[]) => void;
    handleAIPortrait: (style: string, personImages: File[], prompt: string) => void;
    handleMagicMontage: (imageFile: File, prompt: string, sourceImageFile: File) => Promise<void>;
    handleDoubleExposure: (portraitFile: File, landscapeFile: File) => Promise<string | undefined>;
}

const EditorContext = createContext<EditorContextType | undefined>(undefined);

export const useEditor = (): EditorContextType => {
    const context = useContext(EditorContext);
    if (!context) {
        throw new Error('useEditor must be used within an EditorProvider');
    }
    return context;
};

export const useLoadingError = () => {
    const { isLoading, error, setError, setIsLoading } = useEditor();
    return { isLoading, error, setError, setIsLoading };
};

export const EditorProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    // --- STATE MANAGEMENT ---
    
    // Core State
    const [activeTool, setActiveTool] = useState<ToolId | null>(null);
    const [activeTab, setActiveTab] = useState<TabId>('crop');
    const [isLoading, setIsLoading] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [toast, setToast] = useState<{ message: string, type: ToastType } | null>(null);
    const [uploadProgress, setUploadProgress] = useState<UploadProgressStatus | null>(null);
    const [isLeftPanelVisible, setIsLeftPanelVisible] = useState(window.innerWidth >= 1024);
    const [isRightPanelVisible, setIsRightPanelVisible] = useState(window.innerWidth >= 1024);
    const [theme, setTheme] = useState<'light' | 'dark'>(() => {
        if (localStorage.getItem('theme') === 'light') {
            return 'light';
        }
        return 'dark';
    });
    const [initialPromptFromMetadata, setInitialPromptFromMetadata] = useState<string | null>(null);
    
    // Session & View State
    const [isEditingSessionActive, setIsEditingSessionActive] = useState(false);
    const [uploadedFile, setUploadedFile] = useState<File | null>(null);
    
    // Modal States
    const [isComparisonModalOpen, setIsComparisonModalOpen] = useState(false);
    const [isInlineComparisonActive, setIsInlineComparisonActive] = useState(false);
    const [isSaveWorkflowModalOpen, setIsSaveWorkflowModalOpen] = useState(false);
    const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);
    const [showOnboarding, setShowOnboarding] = useState(false);
    const [backgroundColor, setBackgroundColor] = useState('#090A0F');
    const [isEditCompleted, setIsEditCompleted] = useState(false);
    
    // GIF State
    const [gifFrames, setGifFrames] = useState<GifFrame[]>([]);
    const [currentFrameIndex, setCurrentFrameIndex] = useState(0);
    const isGif = gifFrames.length > 1;

    // History & Layer State
    const [history, setHistory] = useState<LayerStateSnapshot[]>([]);
    const [historyIndex, setHistoryIndex] = useState(-1);
    const [toolHistory, setToolHistory] = useState<ToolHistoryItem[]>([]);
    const [hasRestoredSession, setHasRestoredSession] = useState<boolean>(false);
    
    const currentLayerState = history[historyIndex];
    const layers = currentLayerState?.layers || [];
    const activeLayerId = currentLayerState?.activeLayerId || null;
    const activeLayer = layers.find(l => l.id === activeLayerId);
    
    // Transient states (cleared on history change)
    const [crop, setCrop] = useState<Crop>();
    const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [brushSize, setBrushSize] = useState(40);
    const { maskDataUrl, setMaskDataUrl, startDrawing, stopDrawing, draw, clearMask } = useMaskCanvas(canvasRef, brushSize);
    const [detectedObjects, setDetectedObjects] = useState<DetectedObject[] | null>(null);
    const [highlightedObject, setHighlightedObject] = useState<DetectedObject | null>(null);
    const [previewState, setPreviewState] = useState<PreviewState | null>(null);
    const [localFilters, setLocalFilters] = useState<FilterState>(DEFAULT_LOCAL_FILTERS);

    const resetLocalFilters = useCallback(() => {
        setLocalFilters(DEFAULT_LOCAL_FILTERS);
    }, []);

    // Pan, Zoom & Crop State
    const { zoom, setZoom, panOffset, isPanModeActive, setIsPanModeActive, isCurrentlyPanning, handleWheel, handlePanStart, resetZoomAndPan, handleTouchStart, handleTouchMove, handleTouchEnd } = usePanAndZoom();
    const [aspect, setAspect] = useState<number | undefined>();
    
    // AI & Preview State
    const [prompt, setPrompt] = useState('');
    const [isPreviewLoading, setIsPreviewLoading] = useState(false);
    const [proactiveSuggestion, setProactiveSuggestion] = useState<ProactiveSuggestionState | null>(null);
    const [smartSearchResult, setSmartSearchResult] = useState<SmartSearchResult | null>(null);
    const [isSmartSearching, setIsSmartSearching] = useState(false);
    const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null);

    // Filter & Adjustment State
    const [histogram, setHistogram] = useState<{ r: number[], g: number[], b: number[] } | null>(null);
    const [texturePreview, setTexturePreview] = useState<any | null>(null);
    
    // Text Tool State
    const [textToolState, setTextToolState] = useState<TextToolState>(DEFAULT_TEXT_TOOL_STATE);

    // Workflow & Recent Tools State
    const [savedWorkflows, setSavedWorkflows] = useState<Workflow[]>([]);
    const [recentTools, setRecentTools] = useState<ToolId[]>([]);
    const [promptHistory, setPromptHistory] = useState<string[]>([]);
    
    // Clone Tool State
    const [cloneSource, setCloneSource] = useState<{ x: number, y: number } | null>(null);
    const [cloneStrokeStart, setCloneStrokeStart] = useState<{ x: number, y: number } | null>(null);

    // Batch Processing & Voice State
    const [isBatchProcessing, setIsBatchProcessing] = useState(false);
    const [batchProgress, setBatchProgress] = useState<{current: number, total: number} | null>(null);
    const [voiceState, setVoiceState] = useState<'IDLE' | 'CONNECTING' | 'CONNECTED' | 'DISCONNECTED' | 'ERROR'>('IDLE');
    const [voiceTranscript, setVoiceTranscript] = useState<{ source: string, text: string }[]>([]);

    // Refs
    const imgRef = useRef<HTMLImageElement>(null);
    const lastAppliedToolRef = useRef<ToolId | null>(null);
    const initRef = useRef(false);

    // --- DERIVED STATE & MEMOS ---

    const baseImageLayer = useMemo(() => {
        for (let i = 0; i < layers.length; i++) {
            const layer = layers[i];
            if (layer.type === 'image' && layer.isVisible) {
                return layer;
            }
        }
        return null;
    }, [layers]);

    const baseImageFile = useMemo(() => baseImageLayer?.file || null, [baseImageLayer]);
    const currentImageUrl = useMemo(() => baseImageFile ? URL.createObjectURL(baseImageFile) : null, [baseImageFile]);

    const originalImageLayer = useMemo(() => history[0]?.layers[0] as ImageLayer | undefined, [history]);
    const originalImageUrl = useMemo(() => originalImageLayer?.file ? URL.createObjectURL(originalImageLayer.file) : null, [originalImageLayer]);
    
    useEffect(() => {
        return () => {
            if (currentImageUrl) URL.revokeObjectURL(currentImageUrl);
            if (originalImageUrl) URL.revokeObjectURL(originalImageUrl);
        };
    }, [currentImageUrl, originalImageUrl]);

    const buildFilterString = useCallback((filters: Partial<FilterState>) => {
        const { brightness=100, contrast=100, saturate=100, sepia=0, invert=0, grayscale=0, hueRotate=0, blur=0 } = filters;
        return `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturate}%) sepia(${sepia}%) invert(${invert}%) grayscale(${grayscale}%) hue-rotate(${hueRotate}deg) blur(${blur}px)`;
    }, []);

    const compositeCssFilter = useMemo(() => {
        if (!baseImageLayer) return 'none';
        
        const baseLayerIndex = layers.findIndex(l => l.id === baseImageLayer.id);
        
        const adjustmentLayers = layers.filter((l, index) => 
            l.type === 'adjustment' && l.isVisible && index > baseLayerIndex
        );

        return adjustmentLayers.map(l => buildFilterString((l as AdjustmentLayer).filters)).join(' ');
    }, [layers, baseImageLayer, buildFilterString]);


    const hasLocalAdjustments = useMemo(() => {
        return Object.keys(localFilters).some(key => {
            if (key === 'curve') return localFilters.curve !== undefined;
            return localFilters[key as keyof typeof localFilters] !== DEFAULT_LOCAL_FILTERS[key as keyof typeof DEFAULT_LOCAL_FILTERS];
        });
    }, [localFilters]);

    // --- EFFECTS ---

    // Theme Management
    const toggleTheme = useCallback(() => {
        setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
    }, []);

    useEffect(() => {
        const root = window.document.documentElement;
        if (theme === 'dark') {
            root.classList.add('dark');
        } else {
            root.classList.remove('dark');
        }
        localStorage.setItem('theme', theme);
    }, [theme]);
    
    // Session Restoration and Metadata on initial load
    useEffect(() => {
        if (initRef.current) return;
        initRef.current = true;
    
        const initializeApp = async () => {
            setIsLoading(true);
            setLoadingMessage("Inicializando...");
            
            try {
                const savedState = await db.loadHistory();
                if (savedState && savedState.history && savedState.history.length > 0) {
                    setHistory(savedState.history);
                    setHistoryIndex(savedState.historyIndex);
                    setToolHistory(savedState.toolHistory || []);
                    setHasRestoredSession(true);
                    setToast({ message: "Sessão anterior restaurada.", type: 'info' });
                }
            } catch (e) {
                console.error("Failed to restore session:", e);
            } finally {
                setIsLoading(false);
                setLoadingMessage(null);
            }
        };
    
        initializeApp();
    }, []);

    const setActiveLayerId = useCallback((id: string | null) => {
        if (id === activeLayerId) return;
        const newSnapshot: LayerStateSnapshot = { layers, activeLayerId: id, toolHistory: toolHistory.slice(0, historyIndex + 1)};
        const newHistory = [...history];
        newHistory[historyIndex] = newSnapshot;
        setHistory(newHistory);
    }, [layers, activeLayerId, history, historyIndex, toolHistory]);


    // Load workflows, recent tools, and prompt history from DB on mount
    useEffect(() => {
        const loadData = async () => {
            const [workflows, recents, prompts] = await Promise.all([
                db.loadWorkflows(), 
                db.loadRecentTools(),
                db.loadPromptHistory()
            ]);
            setSavedWorkflows(workflows || []);
            setRecentTools(recents || []);
            setPromptHistory(prompts || []);
        };
        loadData();
    }, []);

    // Active tool change handler
    useEffect(() => {
        setError(null);
        if (activeTool) {
            const updatedRecents = [activeTool, ...recentTools.filter(t => t !== activeTool)].slice(0, 5);
            setRecentTools(updatedRecents);
            db.saveRecentTools(updatedRecents);
        }
    }, [activeTool, recentTools]);

    // Histogram generation
    useEffect(() => {
        if (currentImageUrl && activeTab === 'adjust') {
            const img = new Image();
            img.crossOrigin = "Anonymous";
            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext('2d', { willReadFrequently: true });
                if (ctx) {
                    ctx.drawImage(img, 0, 0);
                    const imageData = ctx.getImageData(0, 0, img.width, img.height);
                    setHistogram(generateHistogram(imageData));
                }
            };
            img.src = currentImageUrl;
        } else {
            setHistogram(null);
        }
    }, [currentImageUrl, activeTab]);

    // --- HISTORY & LAYER MANAGEMENT ---
    const canUndo = historyIndex > 0;
    const canRedo = historyIndex < history.length - 1;

    const onHistoryChange = useCallback(() => {
        clearMask();
        setCrop(undefined);
        setCompletedCrop(undefined);
        setDetectedObjects(null);
        setHighlightedObject(null);
        setPreviewState(null);
        resetLocalFilters();
        if(isGif) setCurrentFrameIndex(0);
    }, [isGif, clearMask, resetLocalFilters]);
    
    const commitChange = useCallback((newLayers: Layer[], newActiveLayerId: string | null, toolId?: ToolId) => {
        const newToolHistory: ToolHistoryItem[] = toolId ? [...toolHistory.slice(0, historyIndex + 1), { toolId }] : [...toolHistory.slice(0, historyIndex + 1)];
        const newSnapshot: LayerStateSnapshot = { layers: newLayers, activeLayerId: newActiveLayerId, toolHistory: newToolHistory };
        const newHistory = history.slice(0, historyIndex + 1);
        newHistory.push(newSnapshot);
        setHistory(newHistory);
        setHistoryIndex(newHistory.length - 1);
        setToolHistory(newToolHistory);
        onHistoryChange();
    }, [history, historyIndex, toolHistory, onHistoryChange]);

    const undo = useCallback(() => {
        if (canUndo) {
            setHistoryIndex(historyIndex - 1);
            onHistoryChange();
        }
    }, [canUndo, historyIndex, onHistoryChange]);

    const redo = useCallback(() => {
        if (canRedo) {
            setHistoryIndex(historyIndex + 1);
            onHistoryChange();
        }
    }, [canRedo, historyIndex, onHistoryChange]);

    const jumpToState = useCallback((index: number) => {
        if (index >= 0 && index < history.length) {
            setHistoryIndex(index);
            onHistoryChange();
        }
    }, [history.length, onHistoryChange]);

    const resetHistory = useCallback(() => {
        if (historyIndex > 0) {
            jumpToState(0);
        }
    }, [historyIndex, jumpToState]);

    // --- HANDLER FUNCTIONS ---

    const setInitialImage = useCallback(async (file: File | null) => {
        setIsInlineComparisonActive(false); 
        if (file) {
            if (file.type === 'image/gif') {
                // GIF handling
            }
            const baseLayer: ImageLayer = {
                id: `img_${Date.now()}`,
                type: 'image',
                name: 'Fundo',
                file,
                isVisible: true,
                opacity: 100,
                blendMode: 'normal'
            };
            const snapshot: LayerStateSnapshot = { layers: [baseLayer], activeLayerId: baseLayer.id, toolHistory: [] };
            setHistory([snapshot]);
            setHistoryIndex(0);
            setToolHistory([]);
            onHistoryChange();
        } else {
            setHistory([]);
            setHistoryIndex(-1);
            setToolHistory([]);
            onHistoryChange();
        }
    }, [onHistoryChange]);

    const confirmAndStartEditing = useCallback(() => {
        if (uploadedFile) {
            setInitialImage(uploadedFile);
            setUploadedFile(null);
            setIsEditingSessionActive(true);
            setHasRestoredSession(false);
        }
    }, [uploadedFile, setInitialImage]);

    const cancelPreview = useCallback(() => {
        setUploadedFile(null);
    }, []);

    const handleFileSelect = useCallback(async (file: File) => {
        setIsLoading(true);
        setLoadingMessage("Otimizando imagem...");
        setUploadProgress({ progress: 0, stage: 'reading' });
        try {
            const optimizedFile = await optimizeImage(file, setUploadProgress);
            // Use the preview screen flow
            setUploadedFile(optimizedFile);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Não foi possível processar a imagem. Por favor, tente outra.";
            setError(errorMessage);
            setToast({ message: errorMessage, type: 'error' });
        } finally {
            setIsLoading(false);
            setLoadingMessage(null);
            setUploadProgress(null);
        }
    }, [setError, setToast, setUploadProgress, setIsLoading, setLoadingMessage, setUploadedFile]);

    const handleGoHome = useCallback(() => {
        setIsEditingSessionActive(false);
        setInitialImage(null);
        setUploadedFile(null);
        setActiveTool(null);
        setHasRestoredSession(false);
    }, [setInitialImage, setActiveTool]);


    const handleUploadNew = useCallback(async () => {
        handleGoHome();
        try {
            await db.clearHistoryDB();
            setToast({ message: "Pronto para uma nova imagem.", type: 'info' });
        } catch (e) {
            console.error("Failed to clear DB:", e);
            setToast({ message: "Não foi possível limpar a sessão anterior.", type: 'error' });
        }
    }, [handleGoHome]);

    const handleExplicitSave = useCallback(async () => {
        if (history.length > 0) {
            setLoadingMessage("Salvando sessão...");
            setIsLoading(true);
            try {
                await db.saveHistory(history, historyIndex, toolHistory);
                setToast({ message: "Sessão salva com sucesso!", type: 'success' });
            } catch (e) {
                console.error("Failed to save session:", e);
                setToast({ message: "Falha ao salvar a sessão.", type: 'error' });
            } finally {
                setIsLoading(false);
                setLoadingMessage(null);
            }
        } else {
             setToast({ message: "Nada para salvar.", type: 'info' });
        }
    }, [history, historyIndex, toolHistory, setToast, setIsLoading, setLoadingMessage]);
    
    const executeDestructiveEdit = useCallback(async (
        serviceFunction: (...args: any[]) => Promise<string | undefined>,
        toolId: ToolId,
        message: string,
        ...args: any[]
    ) => {
        if (!activeLayer || activeLayer.type !== 'image') {
            setError("Selecione uma camada de imagem para editar.");
            return;
        }
        setIsLoading(true);
        setLoadingMessage(message);
        setError(null);
        try {
            const resultDataUrl = await serviceFunction(activeLayer.file, ...args);
            if (!resultDataUrl) {
                throw new Error("A API não retornou um resultado de imagem.");
            }
            const newFile = dataURLtoFile(resultDataUrl, `${toolId}-result.png`);

            const newLayers = layers.map((l): Layer => {
                if (l.id === activeLayerId && l.type === 'image') {
                    return { ...l, file: newFile };
                }
                return l;
            });
            commitChange(newLayers, activeLayerId, toolId);
            setIsInlineComparisonActive(true);
            setIsEditCompleted(true);
            const toolName = tools.find(t => t.id === toolId)?.name || 'Edição';
            setToast({ message: `${toolName} aplicada!`, type: 'success' });
            return resultDataUrl;
        } catch (e) {
            const errorMessage = e instanceof Error ? e.message : "Ocorreu um erro desconhecido.";
            setError(errorMessage);
            // Do not set toast here, as service layer handles it
            throw e;
        } finally {
            setIsLoading(false);
            setLoadingMessage(null);
        }
    }, [layers, activeLayer, activeLayerId, commitChange, setError, setIsLoading, setLoadingMessage, setToast]);

    const handleApplyLocalAdjustments = useCallback(async (filters: FilterState) => {
        if (!maskDataUrl || !hasLocalAdjustments) return;
    
        const targetLayer = layers.find(l => l.id === activeLayerId);
        if (!targetLayer || targetLayer.type !== 'image') {
            setError("Por favor, selecione uma camada de imagem para aplicar ajustes locais.");
            return;
        }
    
        setIsLoading(true);
        setLoadingMessage("Aplicando ajustes locais...");
        setError(null);
        try {
            const filterString = buildFilterString(filters);
            
            const resultDataUrl = await applyFiltersToMaskedArea(
                URL.createObjectURL(targetLayer.file),
                maskDataUrl,
                filterString
            );
    
            const newFile = dataURLtoFile(resultDataUrl, `local-adjust-${Date.now()}.png`);
            
            const newLayers = layers.map((l): Layer => {
                if (l.id === activeLayerId && l.type === 'image') {
                    return { ...l, file: newFile };
                }
                return l;
            });

            commitChange(newLayers, activeLayerId, 'localAdjust');
            
            resetLocalFilters();
            clearMask();
            setToast({ message: "Ajustes locais aplicados!", type: 'success' });
    
        } catch (e) {
            const errorMessage = e instanceof Error ? e.message : "Ocorreu um erro desconhecido.";
            setError(errorMessage);
            setToast({ message: errorMessage, type: 'error' });
        } finally {
            setIsLoading(false);
            setLoadingMessage(null);
        }
    }, [
        maskDataUrl, hasLocalAdjustments, layers, activeLayerId, 
        buildFilterString, commitChange, 
        resetLocalFilters, clearMask, setError, setToast, 
        setIsLoading, setLoadingMessage
    ]);


    // Layer actions
    const updateLayer = (layerId: string, updates: Partial<Layer>) => {
        const newLayers = layers.map((l): Layer => {
            if (l.id === layerId) {
                if (l.type === 'image') {
                    return { ...l, ...updates } as ImageLayer;
                } else {
                    return { ...l, ...updates } as AdjustmentLayer;
                }
            }
            return l;
        });
        const newSnapshot: LayerStateSnapshot = { ...currentLayerState, layers: newLayers };
        const newHistory = [...history];
        newHistory[historyIndex] = newSnapshot;
        setHistory(newHistory);
    };

    const deleteLayer = (layerId: string) => {
        if (layers.length <= 1) {
            setToast({ message: "Não é possível excluir a camada base.", type: 'error'});
            return;
        }
        const newLayers = layers.filter(l => l.id !== layerId);
        let newActiveId = activeLayerId;
        if (activeLayerId === layerId) {
            const layerIndex = layers.findIndex(l => l.id === layerId);
            newActiveId = newLayers[Math.max(0, layerIndex - 1)]?.id || null;
        }
        commitChange(newLayers, newActiveId);
    };

    const toggleLayerVisibility = (layerId: string) => {
        const newLayers = layers.map((l): Layer => l.id === layerId ? { ...l, isVisible: !l.isVisible } : l);
        commitChange(newLayers, activeLayerId);
    };

    const reorderLayer = (sourceIndex: number, destIndex: number) => {
        const newLayers = [...layers];
        const [removed] = newLayers.splice(sourceIndex, 1);
        newLayers.splice(destIndex, 0, removed);
        commitChange(newLayers, activeLayerId);
    };

    const moveLayer = (layerId: string, direction: 'up' | 'down') => {
        const index = layers.findIndex(l => l.id === layerId);
        if (index === -1) return;
        
        const newIndex = direction === 'up' ? index + 1 : index - 1;
        
        if (newIndex < 0 || newIndex >= layers.length) return;

        reorderLayer(index, newIndex);
    };
    
    const moveLayerUp = (layerId: string) => moveLayer(layerId, 'up');
    const moveLayerDown = (layerId: string) => moveLayer(layerId, 'down');

    const mergeDownLayer = (layerId: string) => {
        setToast({ message: 'A mesclagem de camadas será implementada em breve.', type: 'info' });
    };

    const addWorkflow = useCallback(async (workflow: Workflow) => {
        try {
            await db.addWorkflow(workflow);
            setSavedWorkflows(prev => [...prev, workflow]);
        } catch (e) {
            console.error("Failed to save workflow:", e);
            setToast({ message: "Não foi possível salvar o fluxo de trabalho.", type: 'error' });
        }
    }, [setToast]);
    
    const executeWorkflow = useCallback((toolIds: ToolId[]) => {
        if (!baseImageFile) {
            setToast({ message: 'Carregue uma imagem para iniciar um fluxo de trabalho.', type: 'error' });
            return;
        }
        if (toolIds.length > 0) {
            setActiveTool(toolIds[0]);
        } else {
            setToast({ message: 'Este fluxo de trabalho está vazio.', type: 'info' });
        }
    }, [baseImageFile, setToast, setActiveTool]);
    
    const addPromptToHistory = useCallback((newPrompt: string) => {
        if (!newPrompt || !newPrompt.trim()) return;
        
        setPromptHistory(prevHistory => {
            const filteredHistory = prevHistory.filter(p => p.toLowerCase() !== newPrompt.toLowerCase());
            const updatedHistory = [newPrompt, ...filteredHistory].slice(0, 100);
            db.savePromptHistory(updatedHistory);
            return updatedHistory;
        });
    }, []);

    const addPlaceholderLayer = async (prompt: string) => {
        // Placeholder
    };

    const handleApplyClone = async () => {
        // Placeholder
    };
    
    const handleRemoveBackground = useCallback(() => executeDestructiveEdit(geminiService.removeBackground, 'removeBg', 'Removendo fundo...', {}, setToast), [executeDestructiveEdit]);
    const handleRelight = useCallback((prompt: string) => { addPromptToHistory(prompt); executeDestructiveEdit(geminiService.reacenderImage, 'relight', 'Reacendendo imagem...', prompt, setToast); }, [executeDestructiveEdit, addPromptToHistory]);
    const handleApplyLowPoly = useCallback(() => executeDestructiveEdit(geminiService.generateLowPoly, 'lowPoly', 'Aplicando estilo Low Poly...', setToast), [executeDestructiveEdit]);
    const handleExtractArt = useCallback(() => executeDestructiveEdit(geminiService.extractArt, 'extractArt', 'Extraindo arte de linha...', setToast), [executeDestructiveEdit]);
    const handleApplyDustAndScratch = useCallback(() => executeDestructiveEdit(geminiService.applyDustAndScratches, 'dustAndScratches', 'Adicionando efeito de poeira e arranhões...', setToast), [executeDestructiveEdit]);
    const handleDenoise = useCallback(() => executeDestructiveEdit(geminiService.denoiseImage, 'denoise', 'Removendo ruído...', setToast), [executeDestructiveEdit]);
    const handleApplyFaceRecovery = useCallback(() => executeDestructiveEdit(geminiService.applyFaceRecovery, 'faceRecovery', 'Recuperando detalhes faciais...', setToast), [executeDestructiveEdit]);
    const handleGenerateProfessionalPortrait = useCallback(() => executeDestructiveEdit(geminiService.generateProfessionalPortrait, 'portraits', 'Gerando retrato profissional...', setToast), [executeDestructiveEdit]);
    const handleRestorePhoto = useCallback((colorize: boolean) => executeDestructiveEdit(geminiService.restorePhoto, 'photoRestoration', 'Restaurando foto...', colorize, setToast), [executeDestructiveEdit]);
    const handleApplyUpscale = useCallback((factor: number, preserveFace: boolean) => executeDestructiveEdit(geminiService.upscaleImage, 'upscale', `Aumentando resolução em ${factor}x...`, factor, preserveFace, setToast), [executeDestructiveEdit]);
    const handleUnblurImage = useCallback((sharpenLevel: number, denoiseLevel: number, model: string) => executeDestructiveEdit(geminiService.unblurImage, 'unblur', 'Removendo desfoque...', sharpenLevel, denoiseLevel, model, setToast), [executeDestructiveEdit]);
    const handleApplyStyle = useCallback((stylePrompt: string) => { addPromptToHistory(stylePrompt); executeDestructiveEdit(geminiService.applyStyle, 'style', 'Aplicando estilo...', stylePrompt, setToast); }, [executeDestructiveEdit, addPromptToHistory]);
    const handleApplySharpen = (intensity: number) => { /* Placeholder */ };

    const handleGenerativeEdit = useCallback(async () => {
        if (!maskDataUrl) return;
        addPromptToHistory(prompt);
        const maskFile = dataURLtoFile(maskDataUrl, 'mask.png');
        await executeDestructiveEdit(geminiService.generativeEdit, 'generativeEdit', "Aplicando edição generativa...", prompt, 'fill', { maskImage: maskFile }, setToast);
    }, [executeDestructiveEdit, maskDataUrl, prompt, addPromptToHistory, setToast]);

    const handleEditTextWithPrompt = useCallback((prompt: string) => {
        addPromptToHistory(prompt);
        executeDestructiveEdit(geminiService.applyStyleToImage, 'aiTextEdit', 'Aplicando edição mágica...', prompt, setToast);
    }, [executeDestructiveEdit, addPromptToHistory, setToast]);

    const handleObjectRemove = useCallback(async () => {
        if (!maskDataUrl) return;
        const maskFile = dataURLtoFile(maskDataUrl, 'mask.png');
        await executeDestructiveEdit(geminiService.generativeEdit, 'objectRemover', "Removendo objeto...", '', 'remove', { maskImage: maskFile }, setToast);
    }, [executeDestructiveEdit, maskDataUrl, setToast]);

    const handleDetectObjects = useCallback(async (prompt?: string) => {
        if (!baseImageFile) {
            setError("Carregue uma imagem primeiro.");
            return;
        }
        setIsLoading(true);
        setLoadingMessage("Detectando objetos...");
        setError(null);
        setDetectedObjects(null);
        setHighlightedObject(null);
        try {
            const objects = await geminiService.detectObjects(baseImageFile, prompt || undefined);
            if (objects.length === 0) {
                setToast({ message: "Nenhum objeto foi detectado na imagem.", type: 'info' });
            }
            setDetectedObjects(objects);
        } catch (e) {
            const errorMessage = e instanceof Error ? e.message : "Ocorreu um erro desconhecido durante a detecção de objetos.";
            setError(errorMessage);
            setToast({ message: errorMessage, type: 'error' });
        } finally {
            setIsLoading(false);
            setLoadingMessage(null);
        }
    }, [baseImageFile, setError, setIsLoading, setLoadingMessage, setToast]);

    const handleSelectObject = useCallback((object: DetectedObject) => {
        if (!baseImageFile) return;
        setHighlightedObject(object);
        const image = new Image();
        image.onload = () => {
            const { naturalWidth, naturalHeight } = image;
            const mask = createMaskFromBoundingBox(object.box, naturalWidth, naturalHeight);
            setMaskDataUrl(mask);
            URL.revokeObjectURL(image.src);
        };
        image.onerror = () => {
            setError("Não foi possível carregar a imagem para criar a máscara.");
        }
        image.src = URL.createObjectURL(baseImageFile);
    }, [baseImageFile, setMaskDataUrl, setError]);

    const handleDetectFaces = useCallback(async () => {
        if (!baseImageFile) {
            setError("Carregue uma imagem primeiro.");
            return;
        }
        setIsLoading(true);
        setLoadingMessage("Detectando rostos...");
        setError(null);
        setDetectedObjects(null);
        setHighlightedObject(null);
        try {
            const faces = await geminiService.detectFaces(baseImageFile);
            if (faces.length === 0) {
                setToast({ message: "Nenhum rosto foi detectado na imagem.", type: 'info' });
            }
            setDetectedObjects(faces);
        } catch (e) {
            const errorMessage = e instanceof Error ? e.message : "Ocorreu um erro desconhecido durante a detecção de rostos.";
            setError(errorMessage);
            setToast({ message: errorMessage, type: 'error' });
        } finally {
            setIsLoading(false);
            setLoadingMessage(null);
        }
    }, [baseImageFile, setError, setIsLoading, setLoadingMessage, setToast]);
    
    const handleFaceRetouch = useCallback(async () => {
        if (!maskDataUrl) {
            setError("Por favor, selecione um rosto primeiro.");
            return;
        }
        const maskFile = dataURLtoFile(maskDataUrl, 'face-mask.png');
        await executeDestructiveEdit(geminiService.retouchFace, 'portraits', "Retocando rosto...", maskFile, setToast);
    }, [executeDestructiveEdit, maskDataUrl, setError, setToast]);

    const handleFaceSwap = useCallback(async (sourceImageFile: File, userPrompt: string) => {
        return await executeDestructiveEdit(geminiService.faceSwap, 'faceSwap', "Trocando rostos...", sourceImageFile, userPrompt, setToast);
    }, [executeDestructiveEdit]);

    const handleGenerateVideo = useCallback(async (prompt: string, aspectRatio: VideoAspectRatio) => {
        if (!baseImageFile) return;
        setIsLoading(true);
        setError(null);
        setGeneratedVideoUrl(null);
        try {
            const resultUrl = await geminiService.generateVideo(baseImageFile, prompt, aspectRatio, setToast, setLoadingMessage);
            setGeneratedVideoUrl(resultUrl);
        } catch (e) {
            // Error is handled in the service
        } finally {
            setIsLoading(false);
            setLoadingMessage(null);
        }
    }, [setIsLoading, setError, setGeneratedVideoUrl, setToast, setLoadingMessage, baseImageFile]);


    // Placeholder for non-refactored handlers
    const handleMagicPrompt = useCallback(async (prompt: string) => {
        if (!baseImageFile) return;
        setIsLoading(true);
        setLoadingMessage("IA está pensando...");
        setError(null);
        try {
            const result = await geminiService.suggestToolFromPrompt(prompt);
            if (!result || !result.tool) {
                throw new Error("A IA não conseguiu identificar uma ferramenta para o seu pedido.");
            }
    
            setLoadingMessage(`Usando a ferramenta: ${result.tool.name}...`);
            let resultUrl: string | undefined;
    
            switch (result.tool.id) {
                case 'removeBg': resultUrl = await geminiService.removeBackground(baseImageFile, {}, setToast); break;
                case 'portraits': resultUrl = await geminiService.generateProfessionalPortrait(baseImageFile, setToast); break;
                case 'style': resultUrl = await geminiService.applyStyle(baseImageFile, result.args.stylePrompt as string, setToast); break;
                case 'upscale': resultUrl = await geminiService.upscaleImage(baseImageFile, result.args.factor as number, result.args.preserveFace as boolean, setToast); break;
                default: throw new Error(`A ferramenta '${result.tool.name}' não pode ser executada automaticamente.`);
            }
    
            if (!resultUrl) throw new Error("A ferramenta foi executada, mas não retornou um resultado de imagem.");
    
            const newFile = dataURLtoFile(resultUrl, `magic-result.png`);
            const newLayers = layers.map((l): Layer => (l.id === activeLayerId && l.type === 'image') ? { ...l, file: newFile } : l);
            commitChange(newLayers, activeLayerId, result.tool.id);
            setToast({ message: "Mágica aplicada!", type: 'success' });
        } catch(e) {
            const errorMessage = e instanceof Error ? e.message : "A IA não conseguiu entender o pedido.";
            setError(errorMessage);
            setToast({ message: errorMessage, type: 'error' });
        } finally {
            setIsLoading(false);
            setLoadingMessage(null);
        }
    }, [baseImageFile, layers, activeLayerId, commitChange, setIsLoading, setLoadingMessage, setError, setToast]);

    const handleApplyAIAdjustment = useCallback((prompt: string) => {
        executeDestructiveEdit(geminiService.generateAdjustedImage, 'adjust', 'Aplicando ajuste de IA...', prompt, setToast);
    }, [executeDestructiveEdit, setToast]);

    const handleApplyCurve = useCallback(async (lut: number[]) => {
        if (!baseImageFile) return;
        try {
            const image = await loadImage(URL.createObjectURL(baseImageFile));
            const canvas = document.createElement('canvas');
            canvas.width = image.naturalWidth;
            canvas.height = image.naturalHeight;
            const ctx = canvas.getContext('2d', { willReadFrequently: true });
            if (!ctx) return;
            ctx.drawImage(image, 0, 0);
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            applyLUT(imageData, lut);
            ctx.putImageData(imageData, 0, 0);
            const dataUrl = canvas.toDataURL();
            
            const newFile = dataURLtoFile(dataUrl, `curve-adjusted-${baseImageFile.name}`);
            const newLayers = layers.map(l => l.id === activeLayerId ? { ...l, file: newFile } : l) as Layer[];
            const newSnapshot: LayerStateSnapshot = { ...currentLayerState, layers: newLayers };
            const newHistory = [...history];
            newHistory[historyIndex] = newSnapshot;
            setHistory(newHistory);
        } catch (e) {
            console.error("Failed to apply curve", e);
        }
    }, [baseImageFile, layers, activeLayerId, history, historyIndex, currentLayerState]);

    const handleApplyText = useCallback(async () => {
        if (!baseImageFile || !textToolState.content.trim()) return;
        setIsLoading(true);
        setLoadingMessage('Aplicando texto...');
        try {
            const image = await loadImage(URL.createObjectURL(baseImageFile));
            const canvas = document.createElement('canvas');
            canvas.width = image.naturalWidth;
            canvas.height = image.naturalHeight;
            const ctx = canvas.getContext('2d');
            if (!ctx) throw new Error("Could not get canvas context");
            
            ctx.drawImage(image, 0, 0);
    
            const fontSize = (textToolState.fontSize / 100) * canvas.width;
            ctx.font = `${textToolState.bold ? 'bold ' : ''}${textToolState.italic ? 'italic ' : ''}${fontSize}px ${textToolState.fontFamily}`;
            ctx.fillStyle = textToolState.color;
            ctx.textAlign = textToolState.align;
            ctx.strokeStyle = 'black';
            ctx.lineWidth = Math.max(1, fontSize / 20);
            const x = (textToolState.position.x / 100) * canvas.width;
            const y = (textToolState.position.y / 100) * canvas.height;
            const lines = textToolState.content.split('\n');
            lines.forEach((line, index) => {
                const lineY = y + index * (fontSize * 1.2);
                ctx.strokeText(line, x, lineY);
                ctx.fillText(line, x, lineY);
            });
    
            const dataUrl = canvas.toDataURL('image/png');
            const newFile = dataURLtoFile(dataUrl, `text-added.png`);
            
            const newLayers = layers.map(l => (l.id === activeLayerId ? { ...l, file: newFile } : l) as Layer);
            commitChange(newLayers, activeLayerId, 'text');
            setToast({ message: "Texto aplicado!", type: 'success' });
        } catch(e) {
            setError("Falha ao aplicar texto.");
        } finally {
            setIsLoading(false);
            setLoadingMessage(null);
        }
    }, [baseImageFile, textToolState, layers, activeLayerId, commitChange, setIsLoading, setLoadingMessage, setToast, setError]);

    const handleApplyTexture = useCallback(async () => {
        if (!baseImageFile || !texturePreview) return;
        setIsLoading(true);
        setLoadingMessage('Aplicando textura...');
        try {
            const baseImg = await loadImage(URL.createObjectURL(baseImageFile));
            const textureImg = await loadImage(texturePreview.url);

            const canvas = document.createElement('canvas');
            canvas.width = baseImg.naturalWidth;
            canvas.height = baseImg.naturalHeight;
            const ctx = canvas.getContext('2d');
            if (!ctx) throw new Error("Could not get canvas context");
            
            ctx.drawImage(baseImg, 0, 0);
            ctx.globalCompositeOperation = texturePreview.blendMode;
            ctx.globalAlpha = texturePreview.opacity;
            ctx.drawImage(textureImg, 0, 0, canvas.width, canvas.height);

            const dataUrl = canvas.toDataURL('image/png');
            const newFile = dataURLtoFile(dataUrl, `textured.png`);
            
            const newLayers = layers.map(l => (l.id === activeLayerId ? { ...l, file: newFile } : l) as Layer);
            commitChange(newLayers, activeLayerId, 'texture');
            setToast({ message: "Textura aplicada!", type: 'success' });
            setTexturePreview(null);
        } catch (e) {
            setError("Falha ao aplicar textura.");
        } finally {
            setIsLoading(false);
            setLoadingMessage(null);
        }
    }, [baseImageFile, texturePreview, layers, activeLayerId, commitChange, setIsLoading, setLoadingMessage, setToast, setError, setTexturePreview]);
    
    const handleTransform = useCallback(async (transformType: TransformType) => {
        if (!baseImageFile) return;
        setIsLoading(true);
        setLoadingMessage('Transformando imagem...');
        try {
            const image = await loadImage(URL.createObjectURL(baseImageFile));
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            if (!ctx) throw new Error("Could not get canvas context");
            
            const { width, height } = image;
            if (transformType === 'rotate-left' || transformType === 'rotate-right') {
                canvas.width = height;
                canvas.height = width;
                ctx.translate(canvas.width / 2, canvas.height / 2);
                ctx.rotate(transformType === 'rotate-left' ? -Math.PI / 2 : Math.PI / 2);
                ctx.drawImage(image, -width / 2, -height / 2);
            } else {
                canvas.width = width;
                canvas.height = height;
                ctx.translate(transformType === 'flip-h' ? width : 0, transformType === 'flip-v' ? height : 0);
                ctx.scale(transformType === 'flip-h' ? -1 : 1, transformType === 'flip-v' ? -1 : 1);
                ctx.drawImage(image, 0, 0);
            }

            const dataUrl = canvas.toDataURL('image/png');
            const newFile = dataURLtoFile(dataUrl, `transformed.png`);
            
            const newLayers = layers.map(l => (l.id === activeLayerId ? { ...l, file: newFile } : l) as Layer);
            commitChange(newLayers, activeLayerId, 'crop');
        } catch (e) {
            setError("Falha ao transformar imagem.");
        } finally {
            setIsLoading(false);
            setLoadingMessage(null);
        }
    }, [baseImageFile, layers, activeLayerId, commitChange, setIsLoading, setLoadingMessage, setError]);

    const handleApplyCrop = useCallback(async () => {
        if (!completedCrop || !imgRef.current || !baseImageFile) return;
        setIsLoading(true);
        setLoadingMessage('Aplicando corte...');
        try {
            const image = await loadImage(URL.createObjectURL(baseImageFile));
            const canvas = document.createElement('canvas');
            const scaleX = image.naturalWidth / image.width;
            const scaleY = image.naturalHeight / image.height;
    
            canvas.width = completedCrop.width;
            canvas.height = completedCrop.height;
            const ctx = canvas.getContext('2d');
            if (!ctx) throw new Error("Could not create canvas context");
            
            ctx.drawImage(
                image,
                completedCrop.x * scaleX,
                completedCrop.y * scaleY,
                completedCrop.width * scaleX,
                completedCrop.height * scaleY,
                0, 0,
                completedCrop.width,
                completedCrop.height
            );
    
            const dataUrl = canvas.toDataURL('image/png');
            const newFile = dataURLtoFile(dataUrl, `cropped.png`);
            
            const newLayers = layers.map(l => (l.id === activeLayerId ? { ...l, file: newFile } : l) as Layer);
            commitChange(newLayers, activeLayerId, 'crop');
            setToast({ message: "Imagem cortada!", type: 'success' });
        } catch(e) {
            setError("Falha ao cortar imagem.");
        } finally {
            setIsLoading(false);
            setLoadingMessage(null);
        }
    }, [completedCrop, imgRef, baseImageFile, layers, activeLayerId, commitChange, setIsLoading, setLoadingMessage, setError, setToast]);

    const handleDownload = useCallback(async (format: 'png' | 'jpeg', quality: number) => {
        if (!baseImageFile) {
            setToast({ message: "Nenhuma imagem para baixar.", type: 'error' });
            return;
        }
        
        const image = await loadImage(URL.createObjectURL(baseImageFile));
        const canvas = document.createElement('canvas');
        canvas.width = image.naturalWidth;
        canvas.height = image.naturalHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
    
        ctx.filter = compositeCssFilter;
        ctx.drawImage(image, 0, 0);
    
        canvas.toBlob(blob => {
            if (blob) {
                saveAs(blob, `edited-${baseImageFile.name.split('.')[0]}.${format}`);
            }
        }, `image/${format}`, quality);

        setIsDownloadModalOpen(false);
    
    }, [isGif, baseImageFile, currentFrameIndex, compositeCssFilter, setToast]);
    
    const handlePredefinedSearchAction = useCallback((action: PredefinedSearch['action']) => {
        if (action.type === 'tool') {
            setActiveTool(action.payload as ToolId);
        } else if (action.type === 'workflow') {
            executeWorkflow(action.payload as ToolId[]);
        }
    }, [setActiveTool, executeWorkflow]);
    
    const handleSmartSearch = useCallback(async (term: string) => {
        setIsSmartSearching(true);
        setError(null);
        try {
            const result = await geminiService.suggestToolFromPrompt(term);
            if (result && result.tool) {
                const toolConfig = tools.find(t => t.id === result.tool.id);
                if (toolConfig) {
                    setSmartSearchResult({ tool: toolConfig, args: result.args });
                    if(result.args?.subject) {
                        setPrompt(result.args.subject as string);
                    }
                } else {
                    setToast({ message: 'A IA sugeriu uma ferramenta desconhecida.', type: 'error' });
                }
            } else {
                setToast({ message: 'A IA não encontrou uma ferramenta para sua solicitação. Tente a busca manual.', type: 'info' });
            }
        } catch(e) {
            const msg = e instanceof Error ? e.message : "Erro na busca inteligente.";
            setToast({ message: msg, type: 'error' });
        } finally {
            setIsSmartSearching(false);
        }
    }, [setError, setToast, setSmartSearchResult, setPrompt]);

    const generateAIPreview = useCallback(async (trend: Trend, applyToAll: boolean) => {
        if (!baseImageFile) return;
        setIsPreviewLoading(true);
        setError(null);
        try {
            let resultUrl: string;
            if (trend.type === 'descriptive') {
                resultUrl = await geminiService.generateImageWithDescription(baseImageFile, trend.prompt, setToast);
            } else {
                resultUrl = await geminiService.applyStyle(baseImageFile, trend.prompt, setToast);
            }
            setPreviewState({ url: resultUrl, trend, applyToAll });
        } catch (e) {
            // Error handled in service
        } finally {
            setIsPreviewLoading(false);
        }
    }, [baseImageFile, setError, setToast, setIsPreviewLoading, setPreviewState]);

    const commitAIPreview = useCallback(() => {
        if (!previewState) return;
    
        const newFile = dataURLtoFile(previewState.url, `preview-result-${Date.now()}.png`);
        
        const newLayers = layers.map(l => (l.id === activeLayerId ? { ...l, file: newFile } : l) as Layer);
        commitChange(newLayers, activeLayerId, activeTab as ToolId);
    
        setToast({ message: `${previewState.trend.name} aplicado!`, type: 'success'});
        setPreviewState(null);
    }, [previewState, layers, activeLayerId, activeTab, commitChange, setToast, setPreviewState]);

    const resetTextToolState = useCallback(() => {
        setTextToolState(DEFAULT_TEXT_TOOL_STATE);
    }, [setTextToolState]);

    const handleAnalyzeImage = useCallback(async (question: string) => {
        if (!baseImageFile) return;
        setIsLoading(true);
        setError(null);
        try {
            return await geminiService.analyzeImage(baseImageFile, question, setToast);
        } finally {
            setIsLoading(false);
        }
    }, [baseImageFile, setIsLoading, setError, setToast]);

    const handleMagicScenery = useCallback(async (objectFile: File, sceneryPrompt: string) => {
        if (!objectFile || !sceneryPrompt) return;
        setIsLoading(true);
        setError(null);
        try {
            setLoadingMessage("Obtendo localização...");
            const position = await new Promise<GeolocationPosition>((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000 });
            });
            const location = { latitude: position.coords.latitude, longitude: position.coords.longitude };
            setLoadingMessage("Interpretando o cenário...");
            const detailedPrompt = await geminiService.getSceneryDescription(sceneryPrompt, location, setToast);
            setLoadingMessage("Gerando o cenário mágico...");
            await executeDestructiveEdit(geminiService.generateProductPhoto, 'magicScenery', 'Gerando o cenário mágico...', objectFile, detailedPrompt, setToast, setLoadingMessage);
            setToast({ message: "Cenário mágico criado!", type: 'success' });
        } catch (e) {
            // Error handled in service/execute
        } finally {
            setIsLoading(false);
            setLoadingMessage(null);
        }
    }, [executeDestructiveEdit, setError, setIsLoading, setLoadingMessage, setToast]);
    
    const handleSetCloneSource = useCallback((source: { x: number; y: number; }) => {
        setCloneSource(source);
        setToast({ message: "Origem definida! Agora pinte na área de destino.", type: 'info' });
    }, [setToast]);

    const handleSuperheroFusion = useCallback(async (personFile: File, heroFile: File) => {
        await executeDestructiveEdit(geminiService.generateSuperheroFusion, 'superheroFusion', 'Criando fusão de super-herói...', personFile, heroFile, setToast);
    }, [executeDestructiveEdit, setToast]);

    const handleConfidentStudio = useCallback(async (person: File, prompt: string, negativePrompt: string) => {
        const fullPrompt = `${prompt} Negative prompt: ${negativePrompt}`;
        await executeDestructiveEdit(geminiService.applyStyle, 'confidentStudio', 'Criando retrato de estúdio...', fullPrompt, setToast);
    }, [executeDestructiveEdit]);

    const handleEnhanceResolutionAndSharpness = useCallback((factor: number, intensity: number, preserveFace: boolean) => {
        executeDestructiveEdit(geminiService.upscaleImage, 'superResolution', `Aumentando resolução e nitidez...`, factor, preserveFace, setToast);
    }, [executeDestructiveEdit]);

    const handleStyledPortrait = useCallback(async (personFile: File, styleImages: File[], prompt: string, negativePrompt: string) => {
        const fullPrompt = `Apply style from reference images. Additional instructions: ${prompt}. Negative prompt: ${negativePrompt}.`;
        const imageParts = await Promise.all([
            geminiService.fileToPart(personFile),
            ...styleImages.map(f => geminiService.fileToPart(f)),
        ]);
        const parts = [ ...imageParts, { text: fullPrompt } ];
        await executeDestructiveEdit(geminiService.generateImageFromParts, 'styledPortrait', 'Criando retrato estilizado...', parts, setToast);
    }, [executeDestructiveEdit, setToast]);
    
    const handleFunkoPop = useCallback(async (mainImage: File, personImage: File | null, bg: string, object: string, lighting: string, type: string, finish: string) => {
        const promptParts: string[] = [];
        promptParts.push(`Crie um boneco Funko Pop realista do assunto na imagem principal.`);
        promptParts.push(`Tipo de Funko: ${type}.`);
        if(finish !== 'Nenhum') promptParts.push(`Acabamento especial: ${finish}.`);
        if(bg.trim()) promptParts.push(`Cenário: ${bg}.`);
        if(object.trim()) promptParts.push(`Objeto: ${object}.`);
        if(lighting.trim()) promptParts.push(`Iluminação: ${lighting}.`);

        const mainPart = await geminiService.fileToPart(mainImage);
        const personPart = personImage ? await geminiService.fileToPart(personImage) : null;
        if (personImage) {
            promptParts.push('Incorpore características da segunda pessoa, se fornecida.');
        }
        const parts = [ mainPart, ...(personPart ? [personPart] : []), { text: promptParts.join(' ') } ];
        await executeDestructiveEdit(geminiService.generateImageFromParts, 'funkoPopStudio', 'Criando seu Funko Pop...', parts, setToast);
    }, [executeDestructiveEdit, setToast]);

    const handlePolaroid = useCallback(async (person: File, celebrity: File, negativePrompt: string) => {
        const prompt = `Crie uma foto estilo Polaroid vintage e desbotada da pessoa da primeira imagem ao lado da celebridade da segunda imagem. Eles devem parecer estar interagindo naturalmente em uma festa ou evento casual. Evite: ${negativePrompt}`;
        const imageParts = await Promise.all([geminiService.fileToPart(person), geminiService.fileToPart(celebrity)]);
        const parts = [...imageParts, { text: prompt }];
        await executeDestructiveEdit(geminiService.generateImageFromParts, 'polaroid', 'Revelando sua foto...', parts, setToast);
    }, [executeDestructiveEdit, setToast]);

    const handleVirtualTryOn = useCallback(async (person: File, clothing: File, shoes: File | undefined, scene: string, pose: string, lens: string, angle: string, lighting: string, negative: string) => {
        const prompt = `Gere uma foto de estúdio profissional e fotorrealista da pessoa na imagem principal, vestindo a roupa da segunda imagem e, opcionalmente, o calçado da terceira. Coloque-a na seguinte cena:\n\n**Instrução Crítica:** A identidade facial, cabelo, tom de pele e tipo de corpo da pessoa devem ser preservados com 100% de precisão.\n\n**Detalhes da Cena:**\n- **Cenário:** ${scene || 'manter o fundo original'}\n- **Pose:** ${pose}\n- **Câmera:** ${lens}, ${angle}\n- **Iluminação:** ${lighting}\n- **Evitar:** ${negative}`;
        
        const imagePartPromises = [geminiService.fileToPart(person), geminiService.fileToPart(clothing)];
        if (shoes) imagePartPromises.push(geminiService.fileToPart(shoes));
        const imageParts = await Promise.all(imagePartPromises);
        const parts = [...imageParts, { text: prompt }];

        await executeDestructiveEdit(geminiService.generateImageFromParts, 'tryOn', 'Montando o look...', parts, setToast);
    }, [executeDestructiveEdit, setToast]);

    const handleApplyNewAspectRatio = useCallback(() => {
        executeDestructiveEdit(geminiService.outpaintImage, 'newAspectRatio', 'Expandindo imagem...', prompt, '16:9', setToast);
    }, [executeDestructiveEdit, prompt]);
    
    const handleCreativeFusion = useCallback(async (compositionFile: File, styleFiles: File[]) => {
        await executeDestructiveEdit(geminiService.generateCreativeFusion, 'style', 'Criando fusão criativa...', compositionFile, styleFiles, setToast);
    }, [executeDestructiveEdit, setToast]);

    const handleAIPortrait = useCallback(async (style: string, personImages: File[], prompt: string) => {
        await executeDestructiveEdit(geminiService.generateAIPortrait, 'aiPortraitStudio', "Criando seu retrato IA...", style, personImages, prompt, setToast);
    }, [executeDestructiveEdit, setToast]);
    
    const handleMagicMontage = useCallback(async (imageFile: File, prompt: string, sourceImageFile: File) => {
        await executeDestructiveEdit(geminiService.generateMagicMontage, 'magicMontage', 'Criando montagem mágica...', imageFile, prompt, sourceImageFile, setToast);
    }, [executeDestructiveEdit, setToast]);

    const handleDoubleExposure = useCallback(async (portraitFile: File, landscapeFile: File) => {
        return await executeDestructiveEdit(geminiService.generateDoubleExposure, 'doubleExposure', 'Criando dupla exposição...', portraitFile, landscapeFile, setToast);
    }, [executeDestructiveEdit]);

    const handleBatchProcess = useCallback(async (files: File[], toolIds: ToolId[], onProgress: (results: { original: string, processed: string }[]) => void) => {
        if (files.length === 0 || toolIds.length === 0) return;
        setIsBatchProcessing(true);
        setBatchProgress({ current: 0, total: files.length });
        const results: { original: string, processed: string }[] = [];
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            setBatchProgress({ current: i + 1, total: files.length });
            const originalUrl = URL.createObjectURL(file);
            let processedUrl = originalUrl;
            let currentFile = file;
            try {
                for (const toolId of toolIds) {
                    if (toolId === 'removeBg') {
                        processedUrl = await geminiService.removeBackground(currentFile, {}, setToast);
                    } else if (toolId === 'photoRestoration') {
                        processedUrl = await geminiService.restorePhoto(currentFile, true, setToast);
                    } else if (toolId === 'upscale') {
                        processedUrl = await geminiService.upscaleImage(currentFile, 4, true, setToast);
                    }
                    currentFile = dataURLtoFile(processedUrl, currentFile.name);
                }
                results.push({ original: originalUrl, processed: processedUrl });
            } catch (e) {
                results.push({ original: originalUrl, processed: 'ERROR' });
            } finally {
                onProgress([...results]);
            }
        }
        setIsBatchProcessing(false);
        setBatchProgress(null);
        setToast({ message: 'Processamento em lote concluído!', type: 'success' });
    }, [setToast]);
    
    const startVoiceSession = () => {};
    const stopVoiceSession = () => {};

    return (
        <EditorContext.Provider value={{
            activeTool, setActiveTool, activeTab, setActiveTab, isLoading, setIsLoading, loadingMessage, setLoadingMessage, error, setError,
            isComparisonModalOpen, setIsComparisonModalOpen, isInlineComparisonActive, setIsInlineComparisonActive, toast, setToast, proactiveSuggestion, setProactiveSuggestion,
            uploadProgress, setUploadProgress, isSaveWorkflowModalOpen, setIsSaveWorkflowModalOpen, isLeftPanelVisible, setIsLeftPanelVisible, isRightPanelVisible, setIsRightPanelVisible,
            theme, toggleTheme, imgRef, setInitialImage, canUndo, canRedo, undo, redo,
            toolHistory, hasRestoredSession, isGif, gifFrames, currentFrameIndex, setCurrentFrameIndex, zoom, setZoom, panOffset, isPanModeActive, setIsPanModeActive, handleTouchStart, handleTouchMove, handleTouchEnd,
            isCurrentlyPanning, handleWheel, handlePanStart, resetZoomAndPan, crop, setCrop, completedCrop, setCompletedCrop, aspect, setAspect, canvasRef, maskDataUrl, setMaskDataUrl,
            brushSize, setBrushSize, clearMask, startDrawing, stopDrawing, draw, detectedObjects, setDetectedObjects, highlightedObject, setHighlightedObject, localFilters,
            setLocalFilters, hasLocalAdjustments, buildFilterString, resetLocalFilters, histogram, previewState, setPreviewState,
            isPreviewLoading, textToolState, setTextToolState, resetTextToolState, generatedVideoUrl, setGeneratedVideoUrl, texturePreview, setTexturePreview, isSmartSearching,
            smartSearchResult, setSmartSearchResult, savedWorkflows, addWorkflow, recentTools, executeWorkflow, handlePredefinedSearchAction, handleSmartSearch,
            handleFileSelect, handleUploadNew, handleExplicitSave, handleApplyCrop, handleTransform, handleRemoveBackground, handleRelight, handleMagicPrompt, handleApplyLowPoly, handleExtractArt,
            handleApplyDustAndScratch, handleDenoise, handleApplyFaceRecovery, handleGenerateProfessionalPortrait, handleRestorePhoto, handleApplyUpscale, handleUnblurImage,
            handleGenerativeEdit, handleObjectRemove, handleDetectObjects, handleSelectObject, handleApplyLocalAdjustments, handleApplyCurve, handleApplyStyle,
            handleApplyAIAdjustment, handleApplyText, handleGenerateVideo, handleDownload, handleApplyTexture, prompt, setPrompt, generateAIPreview, commitAIPreview,
            handleDetectFaces,
            handleFaceRetouch,
            handleFaceSwap,
            layers, activeLayerId, setActiveLayerId, baseImageFile, compositeCssFilter, originalImageUrl,
            updateLayer, deleteLayer, toggleLayerVisibility, mergeDownLayer, moveLayerUp, moveLayerDown,
            currentImageUrl,
            jumpToState,
            resetHistory,
            history,
            historyIndex,
            commitChange,
            promptHistory,
            addPromptToHistory,
            initialPromptFromMetadata,
            isEditingSessionActive, setIsEditingSessionActive, uploadedFile, isDownloadModalOpen, setIsDownloadModalOpen,
            showOnboarding, setShowOnboarding, backgroundColor, setBackgroundColor, confirmAndStartEditing, cancelPreview, handleGoHome,
            cloneSource, setCloneSource, handleSetCloneSource, cloneStrokeStart,
            handleSuperheroFusion, handleConfidentStudio, handleEnhanceResolutionAndSharpness, handleApplyClone, handleStyledPortrait,
            handleFunkoPop, handlePolaroid, handleVirtualTryOn, handleBatchProcess, startVoiceSession, stopVoiceSession,
            voiceState, voiceTranscript, addPlaceholderLayer, reorderLayer, handleApplyNewAspectRatio, handleApplySharpen,
            handleCreativeFusion, handleAIPortrait, handleMagicScenery, handleAnalyzeImage,
            handleMagicMontage, handleDoubleExposure, isBatchProcessing, batchProgress,
            isEditCompleted, setIsEditCompleted,
            handleEditTextWithPrompt,
        }}>
            {children}
        </EditorContext.Provider>
    );
};