/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { createContext, useState, useContext, ReactNode, useCallback, useRef, useMemo, useEffect } from 'react';
import { type Crop, type PixelCrop } from 'react-image-crop';
import { generateHistogram, applyLUT, applyFiltersToMaskedArea, loadImage } from '../utils/imageProcessing';
import GIFEncoder from 'gif-encoder-2';
import saveAs from 'file-saver';

// Hooks
import { usePanAndZoom } from '../hooks/usePanAndZoom';
import { useMaskCanvas } from '../hooks/useMaskCanvas';

// Utils & Services
import { dataURLtoFile, createMaskFromCrop, frameToFile, dataURLToImageData, frameToDataURL, fileToDataURL, optimizeImage, createMaskFromBoundingBox } from '../utils/imageUtils';
import { parseGif } from '../utils/gifUtils';
import * as geminiService from '../services/geminiService';
import { type ToolId, type TransformType, type DetectedObject, TabId, type ToastType, Workflow, SmartSearchResult, PredefinedSearch, type UploadProgressStatus, type ToolConfig, type VideoAspectRatio, Layer, LayerStateSnapshot, ImageLayer, AdjustmentLayer, FilterState, BlendMode } from '../types';
import { handleOrchestratorCall } from '../services/orchestrator';
import * as db from '../utils/db';
import { tools } from '../config/tools';
import { fileToPart, generateImageFromParts, generateImageWithDescription } from '../services/geminiService';


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
    localFilters: typeof DEFAULT_LOCAL_FILTERS;
    setLocalFilters: React.Dispatch<React.SetStateAction<typeof DEFAULT_LOCAL_FILTERS>>;
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
    handleGenerateProfessionalPortrait: (applyToAll: boolean) => void;
    handleRestorePhoto: (colorize: boolean) => void;
    handleApplyUpscale: (factor: number, preserveFace: boolean) => void;
    handleUnblurImage: (sharpenLevel: number, denoiseLevel: number, model: string) => void;
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
    
    // Modal States
    const [isComparisonModalOpen, setIsComparisonModalOpen] = useState(false);
    const [isInlineComparisonActive, setIsInlineComparisonActive] = useState(false);
    const [isSaveWorkflowModalOpen, setIsSaveWorkflowModalOpen] = useState(false);
    
    // GIF State
    const [gifFrames, setGifFrames] = useState<GifFrame[]>([]);
    const [currentFrameIndex, setCurrentFrameIndex] = useState(0);
    const isGif = gifFrames.length > 1;

    // History & Layer State
    const [history, setHistory] = useState<LayerStateSnapshot[]>([]);
    const [historyIndex, setHistoryIndex] = useState(-1);
    const [toolHistory, setToolHistory] = useState<ToolId[]>([]);
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
    const [localFilters, setLocalFilters] = useState(DEFAULT_LOCAL_FILTERS);

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
    
    // Refs
    const imgRef = useRef<HTMLImageElement>(null);
    const lastAppliedToolRef = useRef<ToolId | null>(null);
    const initRef = useRef(false);

    // --- DERIVED STATE & MEMOS ---

    const baseImageLayer = useMemo(() => {
        // Find the lowest visible image layer to render
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
    }, []); // Empty dependency array ensures this runs only once on mount

    const setActiveLayerId = useCallback((id: string | null) => {
        if (id === activeLayerId) return;
        const newSnapshot: LayerStateSnapshot = { layers, activeLayerId: id };
        // This is a non-history-committing change, just updating pointer
        const newHistory = [...history];
        newHistory[historyIndex] = newSnapshot;
        setHistory(newHistory);
    }, [layers, activeLayerId, history, historyIndex]);


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
            // Update recent tools list
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
        const newSnapshot: LayerStateSnapshot = { layers: newLayers, activeLayerId: newActiveLayerId };
        const newHistory = history.slice(0, historyIndex + 1);
        newHistory.push(newSnapshot);
        setHistory(newHistory);
        setHistoryIndex(newHistory.length - 1);

        if (toolId) {
            const newToolHistory = toolHistory.slice(0, historyIndex + 1);
            newToolHistory.push(toolId);
            setToolHistory(newToolHistory);
        }

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
            setHistoryIndex(0);
            onHistoryChange();
        }
    }, [historyIndex, onHistoryChange]);

    // --- HANDLER FUNCTIONS ---

    const setInitialImage = useCallback(async (file: File | null) => {
        setIsInlineComparisonActive(false); // Reset comparison on new image
        if (file) {
            if (file.type === 'image/gif') {
                // GIF handling remains the same for now
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
            const snapshot: LayerStateSnapshot = { layers: [baseLayer], activeLayerId: baseLayer.id };
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

    const handleFileSelect = useCallback(async (file: File) => {
        setIsLoading(true);
        setLoadingMessage("Otimizando imagem...");
        setUploadProgress({ progress: 0, stage: 'reading' });
        try {
            const optimizedFile = await optimizeImage(file, setUploadProgress);
            setInitialImage(optimizedFile);
            if (!activeTool) {
                setActiveTool('adjust');
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Não foi possível processar a imagem. Por favor, tente outra.";
            setError(errorMessage);
            setToast({ message: errorMessage, type: 'error' });
        } finally {
            setIsLoading(false);
            setLoadingMessage(null);
            setUploadProgress(null);
        }
    }, [activeTool, setInitialImage, setActiveTool, setIsLoading, setLoadingMessage, setUploadProgress, setError, setToast]);

    const handleUploadNew = useCallback(async () => {
        setInitialImage(null);
        setActiveTool(null);
        setHasRestoredSession(false);
        setProactiveSuggestion(null);
        try {
            await db.clearHistoryDB();
            setToast({ message: "Pronto para uma nova imagem.", type: 'info' });
        } catch (e) {
            console.error("Failed to clear DB:", e);
            setToast({ message: "Não foi possível limpar a sessão anterior.", type: 'error' });
        }
    }, [setInitialImage, setActiveTool, setToast]);

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
        serviceFunction: (file: File, ...args: any[]) => Promise<string>,
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
            const newFile = dataURLtoFile(resultDataUrl, `${toolId}-result.png`);

            const newLayers = layers.map((l): Layer => {
                if (l.id === activeLayerId && l.type === 'image') {
                    return { ...l, file: newFile };
                }
                return l;
            });
            commitChange(newLayers, activeLayerId, toolId);
            setIsInlineComparisonActive(true);
            setToast({ message: `${tools.find(t => t.id === toolId)?.name || 'Edit'} applied!`, type: 'success' });

        } catch (e) {
            const errorMessage = e instanceof Error ? e.message : "Ocorreu um erro desconhecido.";
            setError(errorMessage);
            setToast({ message: errorMessage, type: 'error' });
        } finally {
            setIsLoading(false);
            setLoadingMessage(null);
        }
    }, [layers, activeLayer, activeLayerId, commitChange, setError, setIsLoading, setLoadingMessage, setToast]);

    const handleApplyLocalAdjustments = useCallback(async (applyToAll = false) => {
        // NOTE: The applyToAll logic for GIFs is not yet fully implemented across the app.
        // This function currently applies adjustments only to the active layer/frame.
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
            const filterString = buildFilterString(localFilters);
            
            const resultDataUrl = await applyFiltersToMaskedArea(
                URL.createObjectURL(targetLayer.file),
                maskDataUrl,
                filterString
            );
    
            const newFile = dataURLtoFile(resultDataUrl, `local-adjust-${Date.now()}.png`);
            
            const newLayers = layers.map((l): Layer => {
                if (l.id === activeLayerId && l.type === 'image') {
                    return {
                        ...l,
                        file: newFile,
                    };
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
        localFilters, buildFilterString, commitChange, 
        resetLocalFilters, clearMask, setError, setToast, 
        setIsLoading, setLoadingMessage
    ]);


    // Layer actions
    const updateLayer = (layerId: string, updates: Partial<Layer>) => {
        const newLayers = layers.map((l): Layer => {
            if (l.id === layerId) {
                // By discriminating the union, we ensure that spreading `l` and `updates`
                // results in a correctly typed object, removing the need for a type cast.
                if (l.type === 'image') {
                    // FIX: Cast to ImageLayer. Spreading Partial<Layer> can create an object
                    // that TypeScript can't verify as part of the Layer union type.
                    return { ...l, ...updates } as ImageLayer;
                } else { // 'adjustment'
                    // FIX: Cast to AdjustmentLayer. Spreading Partial<Layer> can create an object
                    // that TypeScript can't verify as part of the Layer union type.
                    return { ...l, ...updates } as AdjustmentLayer;
                }
            }
            return l;
        });
        // This is a non-history change for performance (e.g. dragging sliders)
        const newSnapshot: LayerStateSnapshot = { layers: newLayers, activeLayerId };
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
        const newLayers = layers.map((l): Layer => {
            if (l.id === layerId) {
                if (l.type === 'image') {
                    return { ...l, isVisible: !l.isVisible };
                } else { // 'adjustment'
                    return { ...l, isVisible: !l.isVisible };
                }
            }
            return l;
        });
        commitChange(newLayers, activeLayerId);
    };

    const reorderLayers = (sourceIndex: number, destIndex: number) => {
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

        const newLayers = [...layers];
        const temp = newLayers[index];
        newLayers[index] = newLayers[newIndex];
        newLayers[newIndex] = temp;

        commitChange(newLayers, layerId);
    };
    
    const moveLayerUp = (layerId: string) => moveLayer(layerId, 'up');
    const moveLayerDown = (layerId: string) => moveLayer(layerId, 'down');

    const mergeDownLayer = (layerId: string) => {
        // For now, only merging adjustment layers is supported
        // A full implementation would require canvas rendering
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
    
    const handleRemoveBackground = useCallback(() => executeDestructiveEdit(geminiService.removeBackground, 'removeBg', 'Removendo fundo...'), [executeDestructiveEdit]);
    const handleRelight = useCallback((prompt: string) => { addPromptToHistory(prompt); executeDestructiveEdit(geminiService.reacenderImage, 'relight', 'Reacendendo imagem...', prompt); }, [executeDestructiveEdit, addPromptToHistory]);
    const handleApplyLowPoly = useCallback(() => executeDestructiveEdit(geminiService.generateLowPoly, 'lowPoly', 'Aplicando estilo Low Poly...'), [executeDestructiveEdit]);
    const handleExtractArt = useCallback(() => executeDestructiveEdit(geminiService.extractArt, 'extractArt', 'Extraindo arte de linha...'), [executeDestructiveEdit]);
    const handleApplyDustAndScratch = useCallback(() => executeDestructiveEdit(geminiService.applyDustAndScratch, 'dustAndScratches', 'Adicionando efeito de poeira e arranhões...'), [executeDestructiveEdit]);
    const handleDenoise = useCallback(() => executeDestructiveEdit(geminiService.denoiseImage, 'denoise', 'Removendo ruído...'), [executeDestructiveEdit]);
    const handleApplyFaceRecovery = useCallback(() => executeDestructiveEdit(geminiService.applyFaceRecovery, 'faceRecovery', 'Recuperando detalhes faciais...'), [executeDestructiveEdit]);
    const handleGenerateProfessionalPortrait = useCallback(() => executeDestructiveEdit(geminiService.generateProfessionalPortrait, 'portraits', 'Gerando retrato profissional...'), [executeDestructiveEdit]);
    const handleRestorePhoto = useCallback((colorize: boolean) => executeDestructiveEdit(geminiService.restorePhoto, 'photoRestoration', 'Restaurando foto...', colorize), [executeDestructiveEdit]);
    const handleApplyUpscale = useCallback((factor: number, preserveFace: boolean) => executeDestructiveEdit(geminiService.upscaleImage, 'upscale', `Aumentando resolução em ${factor}x...`, factor, preserveFace), [executeDestructiveEdit]);
    const handleUnblurImage = useCallback((sharpenLevel: number, denoiseLevel: number, model: string) => executeDestructiveEdit(geminiService.unblurImage, 'unblur', 'Removendo desfoque...', sharpenLevel, denoiseLevel, model), [executeDestructiveEdit]);
    const handleApplyStyle = useCallback((stylePrompt: string) => { addPromptToHistory(stylePrompt); executeDestructiveEdit(geminiService.applyStyle, 'style', 'Aplicando estilo...', stylePrompt); }, [executeDestructiveEdit, addPromptToHistory]);
    
    const handleGenerativeEdit = useCallback(async () => {
        if (!maskDataUrl) return;
        addPromptToHistory(prompt);
        const maskFile = dataURLtoFile(maskDataUrl, 'mask.png');
        await executeDestructiveEdit( (file, p, opts) => geminiService.generativeEdit(file, p, 'fill', opts), 'generativeEdit', "Aplicando edição generativa...", prompt, { maskImage: maskFile });
    }, [executeDestructiveEdit, maskDataUrl, prompt, addPromptToHistory]);

    const handleObjectRemove = useCallback(async () => {
        if (!maskDataUrl) return;
        const maskFile = dataURLtoFile(maskDataUrl, 'mask.png');
        await executeDestructiveEdit( (file, p, opts) => geminiService.generativeEdit(file, p, 'remove', opts), 'objectRemover', "Removendo objeto...", '', { maskImage: maskFile });
    }, [executeDestructiveEdit, maskDataUrl]);

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
            const { box } = object;
            const mask = createMaskFromBoundingBox(box, naturalWidth, naturalHeight);
            setMaskDataUrl(mask);
            URL.revokeObjectURL(image.src);
        };
        image.onerror = () => {
            setError("Não foi possível carregar a imagem para criar a máscara.");
            URL.revokeObjectURL(image.src);
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
        await executeDestructiveEdit(
            (file, mask) => geminiService.retouchFace(file, mask), 
            'portraits', 
            "Retocando rosto...", 
            maskFile
        );
    }, [executeDestructiveEdit, maskDataUrl, setError]);

    const handleFaceSwap = useCallback(async (sourceImageFile: File, userPrompt: string) => {
        if (!activeLayer || activeLayer.type !== 'image' || !highlightedObject) {
            setError("Selecione uma camada de imagem e um rosto para substituir.");
            return;
        }
    
        const { box } = highlightedObject;
        const boxString = `x_min: ${box.x_min.toFixed(2)}, y_min: ${box.y_min.toFixed(2)}, x_max: ${box.x_max.toFixed(2)}, y_max: ${box.y_max.toFixed(2)}`;
        
        let swapPrompt = `Na imagem principal, substitua o rosto localizado dentro da caixa delimitadora {${boxString}} pelo rosto da imagem secundária. Misture o novo rosto de forma suave, combinando tom de pele, iluminação e ângulo. Preserve o restante da imagem principal, incluindo cabelo e roupas.`;
    
        if (userPrompt.trim()) {
            swapPrompt += ` Instruções adicionais: ${userPrompt}`;
        }
        
        setIsLoading(true);
        setLoadingMessage("Trocando rostos...");
        setError(null);
        try {
            // We use generateMagicMontage for this, which is a powerful multi-image prompter
            const resultDataUrl = await geminiService.generateMagicMontage(activeLayer.file, swapPrompt, sourceImageFile);
    
            const newFile = dataURLtoFile(resultDataUrl, `faceswap-result.png`);
    
            const newLayers = layers.map((l): Layer => {
                if (l.id === activeLayerId && l.type === 'image') {
                    return { ...l, file: newFile };
                }
                return l;
            });
            commitChange(newLayers, activeLayerId, 'faceSwap');
            setIsInlineComparisonActive(true);
            setToast({ message: "Troca de rosto aplicada!", type: 'success' });
            setDetectedObjects(null); // Clear detections after swap
            setHighlightedObject(null);
    
        } catch (e) {
            const errorMessage = e instanceof Error ? e.message : "Ocorreu um erro desconhecido.";
            setError(errorMessage);
            setToast({ message: errorMessage, type: 'error' });
        } finally {
            setIsLoading(false);
            setLoadingMessage(null);
        }
    }, [activeLayer, layers, activeLayerId, highlightedObject, commitChange, setError, setIsLoading, setLoadingMessage, setToast, setIsInlineComparisonActive]);

    const handleGenerateVideo = useCallback(async (prompt: string, aspectRatio: VideoAspectRatio) => {
        setIsLoading(true);
        setError(null);
        setGeneratedVideoUrl(null);
        
        try {
            const resultUrl = await geminiService.generateVideo(prompt, aspectRatio);
            setGeneratedVideoUrl(resultUrl);
        } catch (e) {
            const errorMessage = e instanceof Error ? e.message : "Ocorreu um erro desconhecido.";
            setError(errorMessage);
            setToast({ message: errorMessage, type: 'error' });
        } finally {
            setIsLoading(false);
            setLoadingMessage(null);
        }
    }, [setIsLoading, setError, setGeneratedVideoUrl, setToast, setLoadingMessage]);


    // Placeholder for non-refactored handlers
    const handleMagicPrompt = useCallback(async (prompt: string) => {
        if (!baseImageFile) return;
        setIsLoading(true);
        setLoadingMessage("IA está pensando...");
        try {
            const resultUrl = await handleOrchestratorCall(baseImageFile, prompt);
            const newFile = dataURLtoFile(resultUrl, `magic-result.png`);
            const newLayers = layers.map(l => l.id === activeLayerId ? { ...l, file: newFile } : l);
            commitChange(newLayers, activeLayerId, 'magicMontage');
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
        executeDestructiveEdit(geminiService.generateAdjustedImage, 'adjust', 'Aplicando ajuste de IA...', prompt);
    }, [executeDestructiveEdit]);

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
            const newLayers = layers.map(l => l.id === activeLayerId ? { ...l, file: newFile } : l);
            // This is a special case where we don't want to commit a full history state for every curve drag
            // Instead, we just update the current layer's file blob for preview.
            // A "real" implementation might debounce this and commit on mouse up.
            const newSnapshot: LayerStateSnapshot = { layers: newLayers, activeLayerId };
            const newHistory = [...history];
            newHistory[historyIndex] = newSnapshot;
            setHistory(newHistory);
            
        } catch (e) {
            console.error("Failed to apply curve", e);
        }
    }, [baseImageFile, layers, activeLayerId, history, historyIndex]);

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

    const handleDownload = useCallback(async () => {
        if (!baseImageFile) {
            setToast({ message: "Nenhuma imagem para baixar.", type: 'error' });
            return;
        }
        
        if (isGif) {
            setToast({ message: "A exportação de GIF será implementada em breve. Baixando o frame atual.", type: 'info' });
            saveAs(baseImageFile, `frame-${currentFrameIndex}-${baseImageFile.name}.png`);
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
                saveAs(blob, `edited-${baseImageFile.name}`);
            }
        }, 'image/png');
    
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
            if (result) {
                const toolConfig = tools.find(t => t.id === result.name);
                if (toolConfig) {
                    setSmartSearchResult({ tool: toolConfig, args: result.args });
                    if(result.args?.subject) {
                        setPrompt(result.args.subject);
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
                resultUrl = await generateImageWithDescription(baseImageFile, trend.prompt);
            } else {
                resultUrl = await geminiService.applyStyle(baseImageFile, trend.prompt);
            }
            setPreviewState({ url: resultUrl, trend, applyToAll });
        } catch (e) {
            const errorMessage = e instanceof Error ? e.message : "Falha ao gerar pré-visualização.";
            setError(errorMessage);
            setToast({ message: errorMessage, type: 'error' });
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
        }}>
            {children}
        </EditorContext.Provider>
    );
};
