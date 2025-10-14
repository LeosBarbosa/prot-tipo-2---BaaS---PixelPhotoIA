/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { createContext, useContext, useState, useRef, useCallback, useEffect, useMemo } from 'react';
import * as geminiService from '../services/geminiService';
import { usePanAndZoom } from '../hooks/usePanAndZoom';
import { useMaskCanvas } from '../hooks/useMaskCanvas';
import { 
    optimizeImage, 
    dataURLtoFile, 
    fileToDataURL, 
    createMaskFromBoundingBox, 
    frameToDataURL, 
    frameToFile,
    createMaskFromCrop
} from '../utils/imageUtils';
import { applyFiltersToMaskedArea, generateHistogram, applyLUT, loadImage } from '../utils/imageProcessing';
import { parseGif } from '../utils/gifUtils';
import * as db from '../utils/db';
import {
    EditorContextType,
    TabId,
    ToolId,
    Layer,
    ImageLayer,
    LayerStateSnapshot,
    GifFrame,
    TransformType,
    FilterState,
    TextToolState,
    VideoAspectRatio,
    Workflow,
    DetectedObject,
    PredefinedSearch,
    SmartSearchResult,
    UploadProgressStatus,
    ProactiveSuggestionAction,
    Trend,
    AdjustmentLayer
} from '../types';

export const DEFAULT_LOCAL_FILTERS: FilterState = {
  brightness: 100,
  contrast: 100,
  saturate: 100,
  sepia: 0,
  invert: 0,
  grayscale: 0,
  hueRotate: 0,
  blur: 0,
};

export const DEFAULT_TEXT_TOOL_STATE: TextToolState = {
    content: 'Seu Texto Aqui',
    fontFamily: 'Impact',
    fontSize: 10,
    color: '#FFFFFF',
    align: 'center',
    bold: false,
    italic: false,
    position: { x: 50, y: 50 },
};

const EditorContext = createContext<EditorContextType | null>(null);

export const EditorProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    // --- STATE DECLARATIONS ---
    const [activeTool, setActiveTool] = useState<ToolId | null>(null);
    // FIX: 'imageGen' is not a valid TabId. Changed to a valid default 'crop'.
    const [activeTab, setActiveTab] = useState<TabId>('crop');
    const [isLoading, setIsLoading] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [layers, setLayers] = useState<Layer[]>([]);
    const [activeLayerId, setActiveLayerIdState] = useState<string | null>(null);
    const [history, setHistory] = useState<LayerStateSnapshot[]>([]);
    const [historyIndex, setHistoryIndex] = useState(-1);
    const [toolHistory, setToolHistory] = useState<ToolId[]>([]);
    const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' | 'info' } | null>(null);
    const [isComparisonModalOpen, setIsComparisonModalOpen] = useState(false);
    const [isInlineComparisonActive, setIsInlineComparisonActive] = useState(false);
    const [proactiveSuggestion, setProactiveSuggestion] = useState<ProactiveSuggestionAction | null>(null);
    const [uploadProgress, setUploadProgress] = useState<UploadProgressStatus | null>(null);
    const [isSaveWorkflowModalOpen, setIsSaveWorkflowModalOpen] = useState(false);
    const [isLeftPanelVisible, setIsLeftPanelVisible] = useState(true);
    const [isRightPanelVisible, setIsRightPanelVisible] = useState(true);
    const [theme, setTheme] = useState<'light' | 'dark'>('dark');
    const imgRef = useRef<HTMLImageElement>(null);
    const [hasRestoredSession, setHasRestoredSession] = useState(false);
    const [isEditingSessionActive, setIsEditingSessionActive] = useState(false);
    const [gifFrames, setGifFrames] = useState<GifFrame[]>([]);
    const [currentFrameIndex, setCurrentFrameIndex] = useState(0);
    const isGif = gifFrames.length > 1;
    const { zoom, setZoom, panOffset, isPanModeActive, setIsPanModeActive, isCurrentlyPanning, handleWheel, handlePanStart, handleTouchStart, handleTouchMove, handleTouchEnd, resetZoomAndPan } = usePanAndZoom();
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [brushSize, setBrushSize] = useState(40);
    const { maskDataUrl, setMaskDataUrl, clearMask, startDrawing, stopDrawing, draw } = useMaskCanvas(canvasRef, brushSize);
    const [crop, setCrop] = useState<any>();
    const [completedCrop, setCompletedCrop] = useState<any>();
    const [aspect, setAspect] = useState<number | undefined>();
    const [detectedObjects, setDetectedObjects] = useState<DetectedObject[] | null>(null);
    const [highlightedObject, setHighlightedObject] = useState<DetectedObject | null>(null);
    const [localFilters, setLocalFilters] = useState<FilterState>(DEFAULT_LOCAL_FILTERS);
    const [histogram, setHistogram] = useState<{ r: number[]; g: number[]; b: number[]; } | null>(null);
    const [previewState, setPreviewState] = useState<{ url: string; trend: Trend; applyToAll: boolean; } | null>(null);
    const [isPreviewLoading, setIsPreviewLoading] = useState(false);
    const [textToolState, setTextToolState] = useState<TextToolState>(DEFAULT_TEXT_TOOL_STATE);
    const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null);
    const [texturePreview, setTexturePreview] = useState<any>(null);
    const [isSmartSearching, setIsSmartSearching] = useState(false);
    const [smartSearchResult, setSmartSearchResult] = useState<SmartSearchResult | null>(null);
    const [savedWorkflows, setSavedWorkflows] = useState<Workflow[]>([]);
    const [recentTools, setRecentTools] = useState<ToolId[]>([]);
    const [promptHistory, setPromptHistory] = useState<string[]>([]);
    const [prompt, setPrompt] = useState('');
    const [initialPromptFromMetadata, setInitialPromptFromMetadata] = useState<string | null>(null);

    // --- DERIVED STATE & MEMOS ---
    const canUndo = historyIndex > 0;
    const canRedo = historyIndex < history.length - 1;
    const baseImageFile = useMemo(() => (layers[0] && layers[0].type === 'image' ? (layers[0] as ImageLayer).file : null), [layers]);
    const activeLayer = useMemo(() => layers.find(l => l.id === activeLayerId), [layers, activeLayerId]);
    const activeLayerFile = useMemo(() => {
        if (isGif && gifFrames[currentFrameIndex]) {
            return frameToFile(gifFrames[currentFrameIndex].imageData, `frame_${currentFrameIndex}.png`);
        }
        return activeLayer?.type === 'image' ? (activeLayer as ImageLayer).file : null;
    }, [activeLayer, isGif, gifFrames, currentFrameIndex]);
    
    const currentImageUrl = useMemo(() => {
        if (isGif && gifFrames.length > 0 && currentFrameIndex < gifFrames.length) {
            return frameToDataURL(gifFrames[currentFrameIndex].imageData);
        }
        const currentLayer = layers.find(l => l.id === activeLayerId);
        if (currentLayer?.type === 'image') {
            return URL.createObjectURL((currentLayer as ImageLayer).file);
        }
        const baseLayer = layers[0];
        if (baseLayer?.type === 'image') {
            return URL.createObjectURL((baseLayer as ImageLayer).file);
        }
        return null;
    }, [layers, activeLayerId, isGif, gifFrames, currentFrameIndex]);
    
    const originalImageUrl = useMemo(() => {
        const historyState = history[0];
        if (historyState && historyState.layers[0]?.type === 'image') {
            return URL.createObjectURL((historyState.layers[0] as ImageLayer).file);
        }
        return null;
    }, [history]);
    
    const buildFilterString = useCallback((filters: FilterState) => {
        return Object.entries(filters)
            .map(([key, value]) => {
                if (key === 'hueRotate') return `hue-rotate(${value}deg)`;
                if (key === 'blur') return `blur(${value}px)`;
                if (typeof value === 'number' && value !== DEFAULT_LOCAL_FILTERS[key as keyof FilterState]) {
                    const unit = ['sepia', 'grayscale', 'invert'].includes(key) ? '%' : '';
                    return `${key}(${value}${unit})`;
                }
                return '';
            })
            .filter(Boolean)
            .join(' ');
    }, []);

    const compositeCssFilter = useMemo(() => buildFilterString(localFilters), [localFilters, buildFilterString]);
    const hasLocalAdjustments = useMemo(() => JSON.stringify(localFilters) !== JSON.stringify(DEFAULT_LOCAL_FILTERS), [localFilters]);

    // --- HISTORY MANAGEMENT ---
    const commitChange = useCallback((newLayers: Layer[], newActiveLayerId: string | null, toolId?: ToolId) => {
        const newSnapshot: LayerStateSnapshot = { layers: newLayers, activeLayerId: newActiveLayerId };
        const newHistory = history.slice(0, historyIndex + 1);
        setHistory([...newHistory, newSnapshot]);
        setHistoryIndex(newHistory.length);
        if (toolId) {
            setToolHistory(prev => [...prev, toolId]);
            const updatedRecents = [toolId, ...recentTools.filter(t => t !== toolId)].slice(0, 5);
            setRecentTools(updatedRecents);
            db.saveRecentTools(updatedRecents);
        }
        clearMask();
        setDetectedObjects(null);
        setHighlightedObject(null);
    }, [history, historyIndex, recentTools, clearMask]);

    const undo = useCallback(() => { if (canUndo) setHistoryIndex(prev => prev - 1); }, [canUndo]);
    const redo = useCallback(() => { if (canRedo) setHistoryIndex(prev => prev + 1); }, [canRedo]);
    const jumpToState = (index: number) => { if (index >= 0 && index < history.length) setHistoryIndex(index); };
    const resetHistory = () => { if (history.length > 0) { setHistory(prev => [prev[0]]); setHistoryIndex(0); setToolHistory([]); } };
    
    useEffect(() => {
        const currentState = history[historyIndex];
        if (currentState) {
            setLayers(currentState.layers);
            setActiveLayerIdState(currentState.activeLayerId);
        }
    }, [history, historyIndex]);

    // --- TOOL EXECUTION HELPERS ---
    const executeTool = useCallback(async (
        toolId: ToolId,
        serviceCall: (file: File, ...args: any[]) => Promise<string>,
        loadingMsg: string,
        ...args: any[]
    ) => {
        if (!activeLayerFile) {
            setError("Nenhuma camada de imagem ativa selecionada."); return;
        }
        setIsLoading(true); setLoadingMessage(loadingMsg); setError(null);
        try {
            const resultDataUrl = await serviceCall(activeLayerFile, ...args);
            const newFile = dataURLtoFile(resultDataUrl, `${toolId}-result.png`);
            const newLayers = layers.map(l => l.id === activeLayerId ? { ...l, file: newFile } as ImageLayer : l);
            commitChange(newLayers, activeLayerId, toolId);
            setToast({ message: 'Edição aplicada!', type: 'success' });
            setIsInlineComparisonActive(true);
        } catch (err) {
            const msg = err instanceof Error ? err.message : "Ocorreu um erro.";
            setError(msg); setToast({ message: msg, type: 'error' });
        } finally {
            setIsLoading(false); setLoadingMessage(null);
        }
    }, [activeLayerFile, layers, activeLayerId, commitChange]);
    
    // --- TOOL HANDLERS ---
    const handleRemoveBackground = () => executeTool('removeBg', geminiService.removeBackground, "Removendo fundo...");
    const handleApplyLowPoly = () => executeTool('lowPoly', geminiService.generateLowPoly, "Aplicando estilo Low Poly...");
    const handleExtractArt = () => executeTool('extractArt', geminiService.extractArt, "Extraindo arte...");
    const handleApplyDustAndScratch = () => executeTool('dustAndScratches', geminiService.applyDustAndScratch, "Aplicando efeito vintage...");
    const handleDenoise = () => executeTool('denoise', geminiService.denoiseImage, "Removendo ruído...");
    const handleApplyFaceRecovery = () => executeTool('faceRecovery', geminiService.applyFaceRecovery, "Recuperando detalhes faciais...");
    const handleRestorePhoto = (colorize: boolean) => executeTool('photoRestoration', (file) => geminiService.restorePhoto(file, colorize), "Restaurando foto...");
    const handleApplyUpscale = (factor: number, preserveFace: boolean) => executeTool('upscale', (file) => geminiService.upscaleImage(file, factor, preserveFace), `Aumentando resolução...`);
    const handleApplySharpen = (intensity: number) => executeTool('sharpen', (file) => geminiService.applyGenerativeSharpening(file, intensity), "Aplicando nitidez...");
    const handleRelight = (prompt: string) => executeTool('relight', (file) => geminiService.reacenderImage(file, prompt), "Reacendendo imagem...");
    // FIX: Update function signature to match type.
    const handleApplyStyle = (stylePrompt: string, applyToAll: boolean) => executeTool('style', (file) => geminiService.applyStyle(file, stylePrompt), "Aplicando estilo...");
    const handleUnblurImage = (sharpenLevel: number, denoiseLevel: number, model: string) => executeTool('unblur', (file) => geminiService.unblurImage(file, sharpenLevel, denoiseLevel, model), "Removendo desfoque...");
    // FIX: Update function signature to match type.
    const handleGenerateProfessionalPortrait = (applyToAll: boolean) => executeTool('portraits', geminiService.generateProfessionalPortrait, "Gerando retrato profissional...");
    const handleApplyNewAspectRatio = () => executeTool('newAspectRatio', (file) => geminiService.outpaintImage(file, 'Expand the image to fit the new aspect ratio, filling the new areas logically.', '16:9'), "Ajustando proporção...");
    
    const handleEnhanceResolutionAndSharpness = (factor: number, intensity: number, preserveFace: boolean) => {
        executeTool('superResolution', (file) => geminiService.enhanceResolutionAndSharpness(file, factor, intensity, preserveFace), "Aplicando Super Resolução...");
    };

    // FIX: Update function signature to match type.
    const handleApplyAIAdjustment = (prompt: string, applyToAll: boolean) => executeTool('adjust', (file) => geminiService.generateAdjustedImage(file, prompt), "Aplicando ajuste com IA...");
    
    const handleGenerativeEdit = async () => {
        if (!maskDataUrl) return;
        const maskFile = dataURLtoFile(maskDataUrl, 'mask.png');
        await executeTool('generativeEdit', (file, p, opts) => geminiService.generativeEdit(file, p, opts), 'Aplicando edição generativa...', prompt, { maskImage: maskFile });
    };

    const handleObjectRemove = async () => {
        if (!maskDataUrl) return;
        const maskFile = dataURLtoFile(maskDataUrl, 'mask.png');
        await executeTool('objectRemover', (file, p, opts) => geminiService.generativeEdit(file, p, opts), 'Removendo objeto...', 'remove object in mask', { maskImage: maskFile });
    };

    const handleDoubleExposure = (portrait: File, landscape: File) => geminiService.generateDoubleExposure(portrait, landscape);

    const handleVirtualTryOn = (person: File, clothing: File, shoe?: File) => {
        executeTool('tryOn', () => geminiService.virtualTryOn(person, clothing, shoe), "Aplicando look...");
    };
    
    // --- Other Handlers ---
    const handleFileSelect = useCallback(async (file: File) => {
        setIsLoading(true); setLoadingMessage("Carregando imagem..."); setUploadProgress({ progress: 0, stage: 'reading' }); setError(null);
        try {
            const optimizedFile = await optimizeImage(file, setUploadProgress);
            const initialLayer: ImageLayer = { id: `layer_${Date.now()}`, name: 'Background', type: 'image', file: optimizedFile, isVisible: true, opacity: 100, blendMode: 'normal', filters: {} };
            const snapshot: LayerStateSnapshot = { layers: [initialLayer], activeLayerId: initialLayer.id };
            setLayers([initialLayer]); setActiveLayerIdState(initialLayer.id); setHistory([snapshot]); setHistoryIndex(0); setToolHistory([]); setActiveTool(null); setActiveTab('adjust'); setIsEditingSessionActive(true);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Falha ao processar a imagem.');
        } finally {
            setIsLoading(false); setLoadingMessage(null); setUploadProgress(null);
        }
    }, []);

    const setInitialImage = (file: File | null) => {
        if (file) handleFileSelect(file);
        else {
            setLayers([]); setActiveLayerIdState(null); setHistory([]); setHistoryIndex(-1); setToolHistory([]); setIsEditingSessionActive(false);
        }
    };

    const handleGoHome = () => {
        setInitialImage(null);
    };

    const handleTriggerUpload = () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (file) handleFileSelect(file);
        };
        input.click();
    };

    const updateLayer = (layerId: string, updates: Partial<Layer>) => {
        const newLayers = layers.map(l => l.id === layerId ? { ...l, ...updates } as Layer : l);
        const newSnapshot = { ...history[historyIndex], layers: newLayers };
        setHistory(h => h.map((snap, i) => i === historyIndex ? newSnapshot : snap));
        setLayers(newLayers);
    };
    
    // Placeholder implementations for missing handlers
    const handleApplyCrop = useCallback(() => {
        if (!completedCrop || !imgRef.current) return;
        const image = imgRef.current;
        const canvas = document.createElement('canvas');
        const scaleX = image.naturalWidth / image.width;
        const scaleY = image.naturalHeight / image.height;
        canvas.width = completedCrop.width;
        canvas.height = completedCrop.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.drawImage(image, completedCrop.x * scaleX, completedCrop.y * scaleY, completedCrop.width * scaleX, completedCrop.height * scaleY, 0, 0, completedCrop.width, completedCrop.height);
        const newFile = dataURLtoFile(canvas.toDataURL(), 'cropped.png');
        const newLayers = layers.map(l => (l.id === activeLayerId ? { ...l, file: newFile } : l) as Layer);
        commitChange(newLayers, activeLayerId, 'crop');
    }, [completedCrop, layers, activeLayerId, commitChange]);
    
    const handleTransform = useCallback(async (transformType: TransformType) => {
        if (!activeLayerFile) return;
        const image = await loadImage(URL.createObjectURL(activeLayerFile));
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        canvas.width = transformType.startsWith('rotate') ? image.height : image.width;
        canvas.height = transformType.startsWith('rotate') ? image.width : image.height;
        if (transformType === 'rotate-right') { ctx.translate(canvas.width, 0); ctx.rotate(Math.PI / 2); }
        else if (transformType === 'rotate-left') { ctx.translate(0, canvas.height); ctx.rotate(-Math.PI / 2); }
        else if (transformType === 'flip-h') { ctx.translate(canvas.width, 0); ctx.scale(-1, 1); }
        else if (transformType === 'flip-v') { ctx.translate(0, canvas.height); ctx.scale(1, -1); }
        ctx.drawImage(image, 0, 0);
        const newFile = dataURLtoFile(canvas.toDataURL(), 'transformed.png');
        const newLayers = layers.map(l => (l.id === activeLayerId ? { ...l, file: newFile } : l) as Layer);
        commitChange(newLayers, activeLayerId, 'crop');
    }, [activeLayerFile, layers, activeLayerId, commitChange]);
    
    const handleAIPortrait = (style: 'caricature' | 'pixar' | '3d' | 'yearbook90s', images: File[], prompt: string) => {
        const serviceMap = {
            caricature: () => geminiService.generateCaricature(images, prompt),
            pixar: () => geminiService.applyDisneyPixarStyle(images[0], prompt),
            '3d': () => geminiService.generate3DMiniature(images[0], prompt),
            yearbook90s: () => geminiService.generate90sYearbookPortrait(images[0], prompt)
        };
        executeTool('aiPortraitStudio', serviceMap[style], `Aplicando estilo ${style}...`);
    };

    const handleFunkoPop = (mainImage: File, personImage: File | null, bgDescription: string, objectDescription: string, lightingDescription: string, funkoType: string, specialFinish: string) => {
        const prompt = `Crie um Funko Pop da pessoa na imagem. Tipo: ${funkoType}. Acabamento: ${specialFinish}. Fundo: ${bgDescription}. Objeto: ${objectDescription}. Iluminação: ${lightingDescription}.`;
        executeTool('funkoPopStudio', (file) => geminiService.generateMagicMontage(file, prompt, personImage ?? undefined), "Criando seu Funko Pop...");
    };

    const contextValue: EditorContextType = {
        activeTool, setActiveTool, activeTab, setActiveTab, isLoading, setIsLoading, loadingMessage, setLoadingMessage, error, setError, isComparisonModalOpen, setIsComparisonModalOpen, isInlineComparisonActive, setIsInlineComparisonActive, toast, setToast, proactiveSuggestion, setProactiveSuggestion, uploadProgress, setUploadProgress, isSaveWorkflowModalOpen, setIsSaveWorkflowModalOpen, isLeftPanelVisible, setIsLeftPanelVisible, isRightPanelVisible, setIsRightPanelVisible, theme, toggleTheme: () => setTheme(t => t === 'dark' ? 'light' : 'dark'), layers, activeLayerId, setActiveLayerId: setActiveLayerIdState, baseImageFile, currentImageUrl, compositeCssFilter, originalImageUrl, imgRef, setInitialImage, hasRestoredSession, isEditingSessionActive, setIsEditingSessionActive, updateLayer, deleteLayer: () => {}, toggleLayerVisibility: () => {}, mergeDownLayer: () => {}, moveLayerUp: () => {}, moveLayerDown: () => {}, history, historyIndex, canUndo, canRedo, undo, redo, jumpToState, resetHistory, toolHistory, commitChange, isGif, gifFrames, currentFrameIndex, setCurrentFrameIndex, zoom, setZoom, panOffset, isPanModeActive, setIsPanModeActive, isCurrentlyPanning, handleWheel, handlePanStart, handleTouchStart, handleTouchMove, handleTouchEnd, resetZoomAndPan, crop, setCrop, completedCrop, setCompletedCrop, aspect, setAspect, canvasRef, maskDataUrl, setMaskDataUrl, brushSize, setBrushSize, clearMask, startDrawing, stopDrawing, draw, detectedObjects, setDetectedObjects, highlightedObject, setHighlightedObject, localFilters, setLocalFilters, hasLocalAdjustments, buildFilterString, resetLocalFilters: () => setLocalFilters(DEFAULT_LOCAL_FILTERS), histogram, previewState, setPreviewState, isPreviewLoading, textToolState, setTextToolState, resetTextToolState: () => setTextToolState(DEFAULT_TEXT_TOOL_STATE), generatedVideoUrl, setGeneratedVideoUrl, texturePreview, setTexturePreview, isSmartSearching, smartSearchResult, setSmartSearchResult, savedWorkflows, 
        // FIX: Make placeholder functions async to match types
        addWorkflow: async () => {}, 
        recentTools, promptHistory, 
        addPromptToHistory: () => {}, 
        executeWorkflow: () => {}, 
        handlePredefinedSearchAction: () => {}, 
        handleSmartSearch: async () => {}, 
        handleFileSelect, handleGoHome, handleTriggerUpload, 
        handleExplicitSave: () => {}, 
        handleApplyCrop, handleTransform, handleRemoveBackground, handleRelight, 
        handleMagicPrompt: async () => {}, 
        handleApplyLowPoly, handleExtractArt, handleApplyDustAndScratch, handleDenoise, handleApplyFaceRecovery, handleGenerateProfessionalPortrait, handleRestorePhoto, handleApplyUpscale, handleUnblurImage, handleApplySharpen, handleApplyNewAspectRatio, 
        handleGenerativeEdit: async () => {}, 
        handleObjectRemove: async () => {}, 
        handleDetectObjects: async () => {}, 
        handleDetectFaces: async () => {}, 
        handleFaceRetouch: async () => {}, 
        handleFaceSwap: () => {}, 
        handleSelectObject: () => {}, 
        handleApplyLocalAdjustments: () => {}, 
        handleApplyCurve: () => {}, 
        handleApplyStyle, handleApplyAIAdjustment, 
        handleApplyText: () => {}, 
        handleGenerateVideo: () => {}, 
        handleDownload: () => {}, 
        handleApplyTexture: () => {}, 
        handleVirtualTryOn, handleFunkoPop, 
        handleStyledPortrait: () => {}, 
        handlePolaroid: () => {}, 
        handleConfidentStudio: () => {}, 
        handleAIPortrait, prompt, setPrompt, 
        generateAIPreview: () => {}, 
        commitAIPreview: () => {}, 
        initialPromptFromMetadata, handleEnhanceResolutionAndSharpness,
        handleDoubleExposure: () => Promise.resolve(""),
    };

    return <EditorContext.Provider value={contextValue}>{children}</EditorContext.Provider>;
};

export const useEditor = (): EditorContextType => {
    const context = useContext(EditorContext);
    if (!context) {
        throw new Error('useEditor must be used within an EditorProvider');
    }
    return context;
};