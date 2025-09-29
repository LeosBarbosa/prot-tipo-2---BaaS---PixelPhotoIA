/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { createContext, useState, useContext, ReactNode, useCallback, useRef, useMemo, useEffect } from 'react';
import { type Crop, type PixelCrop } from 'react-image-crop';
import { generateHistogram, applyLUT, applyFiltersToMaskedArea } from '../utils/imageProcessing';
import GIFEncoder from 'gif-encoder-2';
import saveAs from 'file-saver';

// Hooks
import { useHistoryState } from '../hooks/useHistoryState';
import { usePanAndZoom } from '../hooks/usePanAndZoom';
import { useMaskCanvas } from '../hooks/useMaskCanvas';

// Utils & Services
import { dataURLtoFile, createMaskFromCrop, frameToFile, dataURLToImageData, frameToDataURL, fileToDataURL } from '../utils/imageUtils';
import { parseGif } from '../utils/gifUtils';
import * as geminiService from '../services/geminiService';
import { type ToolId, type TransformType, type DetectedObject, TabId, type ToastType, Workflow, SmartSearchResult, PredefinedSearch, type UploadProgressStatus, type ToolConfig, type VideoAspectRatio } from '../types';
import { handleOrchestratorCall } from '../services/orchestrator';
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

interface PreviewState {
    url: string;
    prompt: string;
    applyToAll: boolean;
}

export const DEFAULT_LOCAL_FILTERS = {
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

    // Image & History State
    currentImage: File | null;
    currentImageUrl: string | null;
    originalImage: File | null;
    originalImageUrl: string | null;
    imgRef: React.RefObject<HTMLImageElement>;
    setInitialImage: (file: File | null) => void;
    addImageToHistory: (newImageFile: File, toolId: ToolId) => void;
    canUndo: boolean;
    canRedo: boolean;
    undo: () => void;
    redo: () => void;
    resetHistory: () => void;
    history: File[];
    historyIndex: number;
    toolHistory: ToolId[];
    jumpToState: (index: number) => void;
    hasRestoredSession: boolean;

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
    buildFilterString: (filters: typeof DEFAULT_LOCAL_FILTERS) => string;
    resetLocalFilters: () => void;
    histogram: { r: number[], g: number[], b: number[] } | null;
    
    // Local Adjustment Panel Specific Filters
    localAdjustmentFilters: { brightness: number, contrast: number, saturate: number };
    setLocalAdjustmentFilters: React.Dispatch<React.SetStateAction<{ brightness: number, contrast: number, saturate: number }>>;
    
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
    
    // Tool Handlers
    executeWorkflow: (toolIds: ToolId[]) => void;
    handlePredefinedSearchAction: (action: PredefinedSearch['action']) => void;
    handleSmartSearch: (term: string) => void;
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
    handleRestorePhoto: () => void;
    handleApplyUpscale: (factor: number, preserveFace: boolean) => void;
    handleUnblurImage: (sharpenLevel: number, denoiseLevel: number, model: string) => void;
    handleGenerativeEdit: () => void;
    handleObjectRemove: () => void;
    handleDetectObjects: () => void;
    handleSelectObject: (object: DetectedObject) => void;
    // FIX: Update signature to handle optional boolean for applying to all GIF frames.
    handleApplyLocalAdjustments: (applyToAll?: boolean) => void;
    handleApplyCurve: (lut: number[]) => void;
    handleApplyStyle: (stylePrompt: string, applyToAll: boolean) => void;
    handleApplyAIAdjustment: (prompt: string, applyToAll: boolean) => void;
    handleApplyText: () => void;
    handleGenerateVideo: (prompt: string, aspectRatio: VideoAspectRatio) => void;
    handleDownload: () => void;
    handleApplyTexture: () => void;
    // FIX: Add missing properties to the context type.
    prompt: string;
    setPrompt: React.Dispatch<React.SetStateAction<string>>;
    generateAIPreview: (prompt: string, applyToAll: boolean) => void;
    commitAIPreview: () => void;
    resetLocalAdjustmentFilters: () => void;
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
    const [isLeftPanelVisible, setIsLeftPanelVisible] = useState(true);
    const [isRightPanelVisible, setIsRightPanelVisible] = useState(true);
    
    // Modal States
    const [isComparisonModalOpen, setIsComparisonModalOpen] = useState(false);
    const [isInlineComparisonActive, setIsInlineComparisonActive] = useState(false);
    const [isSaveWorkflowModalOpen, setIsSaveWorkflowModalOpen] = useState(false);
    
    // Image, History & GIF State
    const [gifFrames, setGifFrames] = useState<GifFrame[]>([]);
    const [currentFrameIndex, setCurrentFrameIndex] = useState(0);
    const isGif = gifFrames.length > 1;

    const onHistoryStateChange = useCallback((newImage?: File) => {
        // Reset transient states that depend on a specific image version
        clearMask();
        setCrop(undefined);
        setCompletedCrop(undefined);
        setDetectedObjects(null);
        setHighlightedObject(null);
        setPreviewState(null);
        resetLocalFilters();
        if(isGif) setCurrentFrameIndex(0);
    }, [isGif]);

    const { 
        currentImage, originalImage, canUndo, canRedo, isHistoryLoading, 
        history, historyIndex, toolHistory, hasRestoredSession, 
        addImageToHistory: addImageToHistoryFromHook, 
        setInitialImage: setHistoryInitialImage, 
        clearHistory, 
        undo: undoFromHook, 
        redo: redoFromHook, 
        resetHistory: resetHistoryFromHook, 
        jumpToState: jumpToStateFromHook 
    } = useHistoryState(onHistoryStateChange);
    
    // Pan, Zoom & Crop State
    const { zoom, setZoom, panOffset, isPanModeActive, setIsPanModeActive, isCurrentlyPanning, handleWheel, handlePanStart, resetZoomAndPan } = usePanAndZoom();
    const [crop, setCrop] = useState<Crop>();
    const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
    const [aspect, setAspect] = useState<number | undefined>();
    
    // Masking State
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [brushSize, setBrushSize] = useState(40);
    const { maskDataUrl, setMaskDataUrl, startDrawing, stopDrawing, draw, clearMask } = useMaskCanvas(canvasRef, brushSize);
    
    // Object Detection State
    const [detectedObjects, setDetectedObjects] = useState<DetectedObject[] | null>(null);
    const [highlightedObject, setHighlightedObject] = useState<DetectedObject | null>(null);

    // AI & Preview State
    const [prompt, setPrompt] = useState('');
    const [previewState, setPreviewState] = useState<PreviewState | null>(null);
    const [isPreviewLoading, setIsPreviewLoading] = useState(false);
    const [proactiveSuggestion, setProactiveSuggestion] = useState<ProactiveSuggestionState | null>(null);
    const [smartSearchResult, setSmartSearchResult] = useState<SmartSearchResult | null>(null);
    const [isSmartSearching, setIsSmartSearching] = useState(false);
    const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null);

    // Filter & Adjustment State
    const [localFilters, setLocalFilters] = useState(DEFAULT_LOCAL_FILTERS);
    const [localAdjustmentFilters, setLocalAdjustmentFilters] = useState({ brightness: 100, contrast: 100, saturate: 100 });
    const [histogram, setHistogram] = useState<{ r: number[], g: number[], b: number[] } | null>(null);
    const [texturePreview, setTexturePreview] = useState<TexturePreviewState | null>(null);
    
    // Text Tool State
    const [textToolState, setTextToolState] = useState<TextToolState>(DEFAULT_TEXT_TOOL_STATE);

    // Workflow & Recent Tools State
    const [savedWorkflows, setSavedWorkflows] = useState<Workflow[]>([]);
    const [recentTools, setRecentTools] = useState<ToolId[]>([]);
    
    // Refs
    const imgRef = useRef<HTMLImageElement>(null);
    const lastAppliedToolRef = useRef<ToolId | null>(null);

    // --- DERIVED STATE & MEMOS ---

    const currentImageUrl = useMemo(() => currentImage ? URL.createObjectURL(currentImage) : null, [currentImage]);
    const originalImageUrl = useMemo(() => originalImage ? URL.createObjectURL(originalImage) : null, [originalImage]);
    
    useEffect(() => {
        return () => {
            if (currentImageUrl) URL.revokeObjectURL(currentImageUrl);
            if (originalImageUrl) URL.revokeObjectURL(originalImageUrl);
        };
    }, [currentImageUrl, originalImageUrl]);

    const buildFilterString = useCallback((filters: typeof DEFAULT_LOCAL_FILTERS) => {
        const { brightness, contrast, saturate, sepia, invert, grayscale, hueRotate, blur } = filters;
        return `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturate}%) sepia(${sepia}%) invert(${invert}%) grayscale(${grayscale}%) hue-rotate(${hueRotate}deg) blur(${blur}px)`;
    }, []);

    const hasLocalAdjustments = useMemo(() => {
        return Object.keys(localFilters).some(key => {
            if (key === 'curve') return localFilters.curve !== undefined;
            return localFilters[key as keyof typeof DEFAULT_LOCAL_FILTERS] !== DEFAULT_LOCAL_FILTERS[key as keyof typeof DEFAULT_LOCAL_FILTERS];
        });
    }, [localFilters]);

    // --- EFFECTS ---

    // Load workflows and recent tools from DB on mount
    useEffect(() => {
        const loadData = async () => {
            const [workflows, recents] = await Promise.all([db.loadWorkflows(), db.loadRecentTools()]);
            setSavedWorkflows(workflows || []);
            setRecentTools(recents || []);
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

            // Reset specific tool states
            if (!editingToolIds.includes(activeTool)) {
                setInitialImage(null);
                setGeneratedVideoUrl(null);
            }
        }
    }, [activeTool]);

    const editingToolIds: ToolId[] = ['magicMontage', 'objectRemover', 'extractArt', 'crop', 'adjust', 'style', 'generativeEdit', 'removeBg', 'upscale', 'text', 'relight', 'lowPoly', 'pixelArt', 'portraits', 'styleGen', 'photoRestoration', 'dustAndScratches', 'neuralFilters', 'trends', 'unblur', 'texture', 'faceRecovery', 'denoise'];

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

    // Proactive suggestions based on last tool used
    useEffect(() => {
        const lastTool = toolHistory[toolHistory.length - 1];
        if (lastTool && lastTool !== lastAppliedToolRef.current) {
            lastAppliedToolRef.current = lastTool;
            let suggestion: ProactiveSuggestionState | null = null;
            if (lastTool === 'removeBg') {
                suggestion = {
                    message: "Você removeu o fundo. Quer colocar seu produto em um novo cenário?",
                    acceptLabel: "Fotografia de Produto",
                    onAccept: () => setActiveTool('productPhotography')
                };
            } else if (lastTool === 'faceRecovery') {
                 suggestion = {
                    message: "O rosto foi restaurado. Gostaria de melhorar a resolução geral da imagem?",
                    acceptLabel: "Melhorar Resolução",
                    onAccept: () => setActiveTab('upscale')
                };
            }
            if(suggestion) setProactiveSuggestion(suggestion);
        }
    }, [toolHistory]);


    // --- HANDLER FUNCTIONS ---

    const setInitialImage = useCallback(async (file: File | null) => {
        setIsInlineComparisonActive(false); // Reset comparison on new image
        if (file) {
            if (file.type === 'image/gif') {
                setIsLoading(true);
                setLoadingMessage("Processando GIF...");
                try {
                    const frames = await parseGif(file);
                    setGifFrames(frames);
                } catch (e) {
                    setError("Não foi possível processar este GIF.");
                    setGifFrames([]);
                }
                setIsLoading(false);
                setLoadingMessage(null);
            } else {
                setGifFrames([]);
            }
            setHistoryInitialImage(file);
        } else {
            clearHistory();
            setGifFrames([]);
        }
    }, [setHistoryInitialImage, clearHistory]);

    const addImageToHistory = useCallback((newImageFile: File, toolId: ToolId) => {
        addImageToHistoryFromHook(newImageFile, toolId);
        setIsInlineComparisonActive(true);
    }, [addImageToHistoryFromHook]);

    const undo = useCallback(() => {
        undoFromHook();
        setIsInlineComparisonActive(false);
    }, [undoFromHook]);
    
    const redo = useCallback(() => {
        redoFromHook();
        setIsInlineComparisonActive(true);
    }, [redoFromHook]);

    const resetHistory = useCallback(() => {
        resetHistoryFromHook();
        setIsInlineComparisonActive(false);
    }, [resetHistoryFromHook]);
    
    const jumpToState = useCallback((index: number) => {
        jumpToStateFromHook(index);
        setIsInlineComparisonActive(index > 0);
    }, [jumpToStateFromHook]);

    const executeWithLoading = useCallback(async <T,>(
        toolFunction: (image: File, ...args: any[]) => Promise<T>,
        toolId: ToolId,
        message: string,
        ...args: any[]
    ): Promise<T | void> => {
        if (!currentImage) {
            setError("Nenhuma imagem carregada.");
            return;
        }
        setIsLoading(true);
        setLoadingMessage(message);
        setError(null);
        try {
            const result = await toolFunction(currentImage, ...args);
            if (typeof result === 'string' && result.startsWith('data:image')) {
                addImageToHistory(dataURLtoFile(result, `${toolId}-result.png`), toolId);
            }
            return result;
        } catch (e) {
            const errorMessage = e instanceof Error ? e.message : "Ocorreu um erro desconhecido.";
            setError(errorMessage);
            setToast({ message: errorMessage, type: 'error' });
        } finally {
            setIsLoading(false);
            setLoadingMessage(null);
        }
    }, [currentImage, addImageToHistory, setError, setIsLoading, setLoadingMessage]);
    
    // Single function to handle most AI adjustments
    const applyAIGeneratedChange = useCallback(async (
        serviceFunction: (file: File, ...args: any[]) => Promise<string>,
        toolId: ToolId,
        applyToAllFrames: boolean = false,
        ...args: any[]
    ) => {
        if (!currentImage) return;

        setIsLoading(true);
        setLoadingMessage("Aplicando ajuste de IA...");
        setError(null);

        try {
            if (isGif && applyToAllFrames) {
                const newFrames: GifFrame[] = [];
                for (let i = 0; i < gifFrames.length; i++) {
                    setLoadingMessage(`Processando frame ${i + 1}/${gifFrames.length}...`);
                    const frameFile = frameToFile(gifFrames[i].imageData, `frame_${i}.png`);
                    const resultDataUrl = await serviceFunction(frameFile, ...args);
                    const newImageData = await dataURLToImageData(resultDataUrl);
                    newFrames.push({ ...gifFrames[i], imageData: newImageData });
                }
                const newGifFile = await createGifFromFrames(newFrames, 'gif-edit.gif');
                addImageToHistory(newGifFile, toolId);

            } else {
                const imageToProcess = isGif ? frameToFile(gifFrames[currentFrameIndex].imageData, 'current-frame.png') : currentImage;
                const resultDataUrl = await serviceFunction(imageToProcess, ...args);
                
                if (isGif) {
                    const newImageData = await dataURLToImageData(resultDataUrl);
                    const updatedFrames = [...gifFrames];
                    updatedFrames[currentFrameIndex] = { ...updatedFrames[currentFrameIndex], imageData: newImageData };
                    const newGifFile = await createGifFromFrames(updatedFrames, 'gif-edit.gif');
                    addImageToHistory(newGifFile, toolId);
                } else {
                    addImageToHistory(dataURLtoFile(resultDataUrl, `${toolId}-result.png`), toolId);
                }
            }
             setToast({ message: `${toolId} aplicado com sucesso!`, type: 'success' });
        } catch (e) {
            const errorMessage = e instanceof Error ? e.message : "Ocorreu um erro desconhecido.";
            setError(errorMessage);
            setToast({ message: errorMessage, type: 'error' });
        } finally {
            setIsLoading(false);
            setLoadingMessage(null);
        }
    }, [currentImage, isGif, gifFrames, currentFrameIndex, addImageToHistory, setError, setIsLoading, setLoadingMessage]);

    const createGifFromFrames = async (frames: GifFrame[], filename: string): Promise<File> => {
        if (frames.length === 0) throw new Error("Não há frames para criar o GIF.");
        const { width, height } = frames[0].imageData;
        const encoder = new GIFEncoder(width, height, 'octree', true);
        encoder.start();
        encoder.setRepeat(0);
        
        for (const frame of frames) {
            encoder.setDelay(frame.delay);
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx?.putImageData(frame.imageData, 0, 0);
            encoder.addFrame(ctx as any);
        }
        encoder.finish();
        const buffer = encoder.out.getData();
        const blob = new Blob([buffer], { type: 'image/gif' });
        return new File([blob], filename, { type: 'image/gif' });
    };

    const handleApplyCrop = useCallback(async () => {
        if (!completedCrop || !imgRef.current) return;
        const image = imgRef.current;
        const scaleX = image.naturalWidth / image.width;
        const scaleY = image.naturalHeight / image.height;

        const cropCanvas = document.createElement('canvas');
        cropCanvas.width = completedCrop.width;
        cropCanvas.height = completedCrop.height;
        const ctx = cropCanvas.getContext('2d');
        if (!ctx) return;
        
        ctx.drawImage(
            image,
            completedCrop.x * scaleX,
            completedCrop.y * scaleY,
            completedCrop.width * scaleX,
            completedCrop.height * scaleY,
            0,
            0,
            completedCrop.width,
            completedCrop.height
        );
        
        const croppedDataUrl = cropCanvas.toDataURL(currentImage?.type);
        addImageToHistory(dataURLtoFile(croppedDataUrl, 'cropped.png'), 'crop');

    }, [completedCrop, currentImage, addImageToHistory]);

    const handleTransform = useCallback(async (transformType: TransformType) => {
        if (!currentImageUrl) return;

        const img = new Image();
        img.src = currentImageUrl;
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            if (!ctx) return;

            let { width, height } = img;
            if (transformType === 'rotate-left' || transformType === 'rotate-right') {
                canvas.width = height;
                canvas.height = width;
                ctx.translate(canvas.width / 2, canvas.height / 2);
                ctx.rotate(transformType === 'rotate-left' ? -Math.PI / 2 : Math.PI / 2);
                ctx.drawImage(img, -width / 2, -height / 2);
            } else {
                canvas.width = width;
                canvas.height = height;
                ctx.translate(transformType === 'flip-h' ? width : 0, transformType === 'flip-v' ? height : 0);
                ctx.scale(transformType === 'flip-h' ? -1 : 1, transformType === 'flip-v' ? -1 : 1);
                ctx.drawImage(img, 0, 0);
            }
            
            const transformedDataUrl = canvas.toDataURL(currentImage?.type);
            addImageToHistory(dataURLtoFile(transformedDataUrl, 'transformed.png'), 'crop');
        };

    }, [currentImageUrl, currentImage, addImageToHistory]);
    
    // -- Other Tool Handlers --
    const handleRemoveBackground = () => applyAIGeneratedChange(geminiService.removeBackground, 'removeBg');
    const handleApplyLowPoly = () => applyAIGeneratedChange(geminiService.generateLowPoly, 'lowPoly');
    const handleExtractArt = () => applyAIGeneratedChange(geminiService.extractArt, 'extractArt');
    const handleApplyDustAndScratch = () => applyAIGeneratedChange(geminiService.applyDustAndScratch, 'dustAndScratches');
    const handleDenoise = () => applyAIGeneratedChange(geminiService.denoiseImage, 'denoise');
    const handleApplyFaceRecovery = () => applyAIGeneratedChange(geminiService.applyFaceRecovery, 'faceRecovery');
    const handleGenerateProfessionalPortrait = (applyToAll: boolean) => applyAIGeneratedChange(geminiService.generateProfessionalPortrait, 'portraits', applyToAll);
    const handleRestorePhoto = () => applyAIGeneratedChange(geminiService.restorePhoto, 'photoRestoration');
    const handleApplyUpscale = (factor: number, preserveFace: boolean) => applyAIGeneratedChange(geminiService.upscaleImage, 'upscale', false, factor, preserveFace);
    const handleUnblurImage = (sharpenLevel: number, denoiseLevel: number, model: string) => applyAIGeneratedChange(geminiService.unblurImage, 'unblur', false, sharpenLevel, denoiseLevel, model);
    const handleRelight = (prompt: string) => applyAIGeneratedChange(geminiService.reacenderImage, 'relight', false, prompt);
    const handleApplyAIAdjustment = (prompt: string, applyToAll: boolean) => applyAIGeneratedChange(geminiService.generateAdjustedImage, 'adjust', applyToAll, prompt);
    const handleApplyStyle = (prompt: string, applyToAll: boolean) => applyAIGeneratedChange(geminiService.applyStyle, 'style', applyToAll, prompt);
    const handleApplyText = () => executeWithLoading(async (image: File) => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();
        const imgUrl = URL.createObjectURL(image);
        await new Promise<void>((resolve) => {
            img.onload = () => resolve();
            img.src = imgUrl;
        });
        URL.revokeObjectURL(imgUrl);

        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        ctx!.drawImage(img, 0, 0);

        const fontSizePx = (textToolState.fontSize / 100) * canvas.width;
        ctx!.font = `${textToolState.italic ? 'italic ' : ''}${textToolState.bold ? 'bold ' : ''}${fontSizePx}px ${textToolState.fontFamily}`;
        ctx!.fillStyle = textToolState.color;
        ctx!.textAlign = textToolState.align;

        const x = (textToolState.position.x / 100) * canvas.width;
        const y = (textToolState.position.y / 100) * canvas.height;

        const lines = textToolState.content.split('\n');
        lines.forEach((line, index) => {
            ctx!.fillText(line, x, y + (index * fontSizePx * 1.2));
        });

        return canvas.toDataURL(image.type);
    }, 'text', 'Aplicando texto...');

    // FIX: Implement generateAIPreview to handle style previews.
    const generateAIPreview = useCallback(async (prompt: string, applyToAll: boolean) => {
        if (!currentImage) return;
        setIsPreviewLoading(true);
        setPreviewState(null);
        try {
            const imageToProcess = isGif ? frameToFile(gifFrames[currentFrameIndex].imageData, 'frame.png') : currentImage;
            const resultUrl = await geminiService.applyStyle(imageToProcess, prompt);
            setPreviewState({ url: resultUrl, prompt, applyToAll });
        } catch (e) {
            setError(e instanceof Error ? e.message : "Falha ao gerar pré-visualização");
        } finally {
            setIsPreviewLoading(false);
        }
    }, [currentImage, isGif, gifFrames, currentFrameIndex]);

    // FIX: Implement commitAIPreview to apply the generated preview.
    const commitAIPreview = useCallback(() => {
        if (!previewState) return;
        applyAIGeneratedChange(geminiService.applyStyle, 'style', previewState.applyToAll, previewState.prompt);
        setPreviewState(null);
    }, [previewState, applyAIGeneratedChange]);

    const handleGenerativeEdit = () => {
        if (!maskDataUrl) { setError("Por favor, selecione uma área primeiro."); return; }
        const maskFile = dataURLtoFile(maskDataUrl, 'mask.png');
        applyAIGeneratedChange(geminiService.generativeEdit, 'generativeEdit', false, prompt, 'fill', { maskImage: maskFile });
    };
    
    const handleObjectRemove = () => {
        if (!maskDataUrl) { setError("Por favor, pinte sobre o objeto a ser removido."); return; }
        const maskFile = dataURLtoFile(maskDataUrl, 'mask.png');
        applyAIGeneratedChange(geminiService.generativeEdit, 'objectRemover', false, "Remova o objeto na área mascarada e preencha o fundo de forma realista.", 'remove', { maskImage: maskFile });
    };

    const handleDetectObjects = useCallback(async () => {
        if (!currentImage) return;
        setIsLoading(true);
        setLoadingMessage("Detectando objetos...");
        try {
            const objects = await geminiService.detectObjects(currentImage);
            setDetectedObjects(objects);
        } catch(e) {
            setError(e instanceof Error ? e.message : "Falha na detecção de objetos");
        } finally {
            setIsLoading(false);
            setLoadingMessage(null);
        }
    }, [currentImage]);
    
    const handleSelectObject = useCallback(async (object: DetectedObject) => {
        if (!imgRef.current) return;
        setHighlightedObject(object);
        const { naturalWidth, naturalHeight } = imgRef.current;
        const crop: PixelCrop = {
            x: object.box.x_min * naturalWidth,
            y: object.box.y_min * naturalHeight,
            width: (object.box.x_max - object.box.x_min) * naturalWidth,
            height: (object.box.y_max - object.box.y_min) * naturalHeight,
            unit: 'px',
        };
        const mask = createMaskFromCrop(crop, naturalWidth, naturalHeight);
        setMaskDataUrl(mask);
    }, []);
    
    const resetLocalFilters = useCallback(() => setLocalFilters(DEFAULT_LOCAL_FILTERS), []);
    // FIX: Implement function to reset only local adjustment filters.
    const resetLocalAdjustmentFilters = useCallback(() => setLocalAdjustmentFilters({ brightness: 100, contrast: 100, saturate: 100 }), []);

    // FIX: Update handleApplyLocalAdjustments to support GIFs.
    const handleApplyLocalAdjustments = useCallback(async (applyToAllFrames: boolean = false) => {
        if (!currentImage || !maskDataUrl) return;

        const filterString = `brightness(${localAdjustmentFilters.brightness}%) contrast(${localAdjustmentFilters.contrast}%) saturate(${localAdjustmentFilters.saturate}%)`;
        
        setIsLoading(true);
        setLoadingMessage("Aplicando ajustes...");
        setError(null);
        try {
            if (isGif && applyToAllFrames) {
                const newFrames: GifFrame[] = [];
                for (let i = 0; i < gifFrames.length; i++) {
                    setLoadingMessage(`Processando frame ${i + 1}/${gifFrames.length}...`);
                    const frameUrl = frameToDataURL(gifFrames[i].imageData);
                    const resultDataUrl = await applyFiltersToMaskedArea(frameUrl, maskDataUrl, filterString);
                    const newImageData = await dataURLToImageData(resultDataUrl);
                    newFrames.push({ ...gifFrames[i], imageData: newImageData });
                }
                const newGifFile = await createGifFromFrames(newFrames, 'gif-local-adjust.gif');
                addImageToHistory(newGifFile, 'localAdjust');
            } else {
                const imageToProcessUrl = isGif ? frameToDataURL(gifFrames[currentFrameIndex].imageData) : await fileToDataURL(currentImage);
                const resultDataUrl = await applyFiltersToMaskedArea(imageToProcessUrl, maskDataUrl, filterString);
                if (isGif) {
                    const newImageData = await dataURLToImageData(resultDataUrl);
                    const updatedFrames = [...gifFrames];
                    updatedFrames[currentFrameIndex] = { ...updatedFrames[currentFrameIndex], imageData: newImageData };
                    const newGifFile = await createGifFromFrames(updatedFrames, 'gif-edit.gif');
                    addImageToHistory(newGifFile, 'localAdjust');
                } else {
                    addImageToHistory(dataURLtoFile(resultDataUrl, 'local-adjust.png'), 'localAdjust');
                }
            }
            clearMask();
            resetLocalAdjustmentFilters();
        } catch(e) {
            setError(e instanceof Error ? e.message : "Falha ao aplicar ajustes locais");
        } finally {
            setIsLoading(false);
            setLoadingMessage(null);
        }
    }, [currentImage, maskDataUrl, localAdjustmentFilters, addImageToHistory, clearMask, resetLocalAdjustmentFilters, isGif, gifFrames, currentFrameIndex]);

    const handleApplyCurve = useCallback((lut: number[]) => {
        setLocalFilters(prev => ({ ...prev, curve: lut }));
    }, []);

    const handleGenerateVideo = async (prompt: string, aspectRatio: VideoAspectRatio) => {
        setIsLoading(true);
        setError(null);
        setGeneratedVideoUrl(null);
        try {
            const url = await geminiService.generateVideo(prompt, aspectRatio);
            setGeneratedVideoUrl(url);
        } catch(e) {
            setError(e instanceof Error ? e.message : "Falha ao gerar vídeo.");
        } finally {
            setIsLoading(false);
            setLoadingMessage(null);
        }
    };
    
    const handleDownload = useCallback(async () => {
        if (generatedVideoUrl) {
            saveAs(generatedVideoUrl, `video-${Date.now()}.mp4`);
        } else if (currentImage) {
            if (isGif) {
                setIsLoading(true);
                setLoadingMessage("Exportando GIF...");
                const file = await createGifFromFrames(gifFrames, "edited.gif");
                saveAs(file);
                setIsLoading(false);
                setLoadingMessage(null);
            } else {
                saveAs(currentImage, `edited-${currentImage.name}`);
            }
        }
    }, [currentImage, generatedVideoUrl, isGif, gifFrames]);
    
    const handleSmartSearch = async (term: string) => {
        setIsSmartSearching(true);
        setError(null);
        setSmartSearchResult(null);
        try {
            const result = await geminiService.suggestToolFromPrompt(term);
            if (result) {
                const toolConfig = tools.find(t => t.id === result.name);
                if (toolConfig) {
                    setSmartSearchResult({ tool: toolConfig, args: result.args });
                }
            } else {
                setToast({ message: "A IA não conseguiu encontrar uma ferramenta. Tente a busca manual.", type: 'info' });
            }
        } catch (e) {
            setError(e instanceof Error ? e.message : "Erro na busca inteligente");
        } finally {
            setIsSmartSearching(false);
        }
    };

    const handlePredefinedSearchAction = (action: PredefinedSearch['action']) => {
        if (action.type === 'tool') {
            setActiveTool(action.payload as ToolId);
        } else if (action.type === 'workflow') {
            executeWorkflow(action.payload as ToolId[]);
        }
    };

    const executeWorkflow = (toolIds: ToolId[]) => {
        // Simple sequential execution for now
        // A more advanced implementation might pass results between tools
        if (toolIds.length > 0) {
            setActiveTool(toolIds[0]);
            // Logic to chain tools could be added here
            setToast({ message: `Iniciando fluxo de trabalho: ${toolIds.join(' -> ')}`, type: 'info'});
        }
    };
    
    const addWorkflow = (workflow: Workflow) => {
        db.addWorkflow(workflow);
        setSavedWorkflows(prev => [...prev, workflow]);
    };
    
    const handleUploadNew = () => {
        setInitialImage(null);
        setActiveTool(null);
        clearHistory();
    };

    const handleExplicitSave = () => {
        // History is saved automatically via useEffect in useHistoryState
        setToast({ message: "Sessão salva! Pode fechar a aba e voltar mais tarde.", type: 'success' });
    };
    
    const resetTextToolState = useCallback(() => setTextToolState(DEFAULT_TEXT_TOOL_STATE), []);

    const handleApplyTexture = useCallback(async () => {
        if (!currentImageUrl || !texturePreview) return;
        setIsLoading(true);
        setLoadingMessage("Aplicando textura...");
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const baseImage = new Image();
        baseImage.src = currentImageUrl;
        await new Promise(res => baseImage.onload = res);

        canvas.width = baseImage.naturalWidth;
        canvas.height = baseImage.naturalHeight;
        
        ctx!.globalAlpha = 1;
        ctx!.drawImage(baseImage, 0, 0);

        const textureImage = new Image();
        textureImage.src = texturePreview.url;
        await new Promise(res => textureImage.onload = res);

        ctx!.globalCompositeOperation = texturePreview.blendMode;
        ctx!.globalAlpha = texturePreview.opacity;
        ctx!.drawImage(textureImage, 0, 0, canvas.width, canvas.height);
        
        const resultDataUrl = canvas.toDataURL('image/png');
        addImageToHistory(dataURLtoFile(resultDataUrl, 'texture.png'), 'texture');
        setTexturePreview(null);
        setIsLoading(false);
        setLoadingMessage(null);
    }, [currentImageUrl, texturePreview, addImageToHistory, setIsLoading, setLoadingMessage]);

    // FIX: Implement the handleMagicPrompt function.
    const handleMagicPrompt = (prompt: string) => {
        executeWithLoading(handleOrchestratorCall, 'magicMontage', "A IA está a processar o seu pedido...", prompt);
    };

    const value: EditorContextType = {
        activeTool, setActiveTool, activeTab, setActiveTab, isLoading, setIsLoading, loadingMessage, setLoadingMessage,
        error, setError, isComparisonModalOpen, setIsComparisonModalOpen, toast, setToast, proactiveSuggestion, setProactiveSuggestion,
        uploadProgress, setUploadProgress, isSaveWorkflowModalOpen, setIsSaveWorkflowModalOpen, isLeftPanelVisible, setIsLeftPanelVisible, isRightPanelVisible, setIsRightPanelVisible,
        currentImage, currentImageUrl, originalImage, originalImageUrl, imgRef, setInitialImage, addImageToHistory, canUndo,
        canRedo, undo, redo, resetHistory, history, historyIndex, toolHistory, jumpToState, hasRestoredSession, isGif, gifFrames,
        currentFrameIndex, setCurrentFrameIndex, zoom, setZoom, panOffset, isPanModeActive, setIsPanModeActive, isCurrentlyPanning,
        handleWheel, handlePanStart, resetZoomAndPan, crop, setCrop, completedCrop, setCompletedCrop, aspect, setAspect, canvasRef,
        maskDataUrl, setMaskDataUrl, brushSize, setBrushSize, clearMask, startDrawing, stopDrawing, draw, detectedObjects, setDetectedObjects,
        highlightedObject, setHighlightedObject, localFilters, setLocalFilters, hasLocalAdjustments, buildFilterString, resetLocalFilters,
        histogram, localAdjustmentFilters, setLocalAdjustmentFilters, previewState, setPreviewState, isPreviewLoading, textToolState, setTextToolState,
        resetTextToolState, generatedVideoUrl, setGeneratedVideoUrl, texturePreview, setTexturePreview, isSmartSearching, smartSearchResult,
        setSmartSearchResult, savedWorkflows, addWorkflow, recentTools, executeWorkflow, handlePredefinedSearchAction, handleSmartSearch,
        handleUploadNew, handleExplicitSave, handleApplyCrop, handleTransform, handleRemoveBackground, handleRelight, handleMagicPrompt,
        handleApplyLowPoly, handleExtractArt, handleApplyDustAndScratch, handleDenoise, handleApplyFaceRecovery, handleGenerateProfessionalPortrait,
        handleRestorePhoto, handleApplyUpscale, handleUnblurImage, handleGenerativeEdit, handleObjectRemove, handleDetectObjects,
        handleSelectObject, handleApplyLocalAdjustments, handleApplyCurve, handleApplyStyle, handleApplyAIAdjustment, handleApplyText,
        handleGenerateVideo, handleDownload, handleApplyTexture, isInlineComparisonActive, setIsInlineComparisonActive,
        // FIX: Export the new properties and methods from the context provider.
        prompt, setPrompt, generateAIPreview, commitAIPreview, resetLocalAdjustmentFilters,
    };

    return (
        <EditorContext.Provider value={value}>
            {!isHistoryLoading && children}
        </EditorContext.Provider>
    );
};
