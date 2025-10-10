

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
import { EditorContextType, type ToolId, type TransformType, type DetectedObject, TabId, type ToastType, Workflow, SmartSearchResult, PredefinedSearch, type UploadProgressStatus, type ToolConfig, type VideoAspectRatio, Layer, LayerStateSnapshot, ImageLayer, AdjustmentLayer, FilterState, BlendMode, GifFrame, TextToolState } from '../types';
import * as db from '../utils/db';
import { tools } from '../config/tools';
import { fileToPart, generateImageFromParts, generateImageWithDescription } from '../services/geminiService';

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

const EditorContext = createContext<EditorContextType | undefined>(undefined);

/**
 * Converte uma máscara de branco sobre transparente para branco sobre preto, que é o formato esperado pela API Gemini para inpainting.
 * @param maskDataUrl A URL de dados da máscara de branco sobre transparente.
 * @returns Uma Promise que resolve com a URL de dados da máscara de branco sobre preto.
 */
const convertMaskToBlackAndWhite = (maskDataUrl: string): Promise<string> => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.naturalWidth;
            canvas.height = img.naturalHeight;
            const ctx = canvas.getContext('2d');
            if (!ctx) return reject(new Error("Não foi possível criar o contexto do canvas para o processamento da máscara."));
            
            // Preenche com preto primeiro
            ctx.fillStyle = 'black';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            // Em seguida, desenha a parte branca da máscara original por cima
            ctx.drawImage(img, 0, 0);
            
            resolve(canvas.toDataURL('image/png'));
        };
        img.onerror = (err) => reject(err);
        img.src = maskDataUrl;
    });
};

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
    const [previewState, setPreviewState] = useState<EditorContextType['previewState']>(null);
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
    const [proactiveSuggestion, setProactiveSuggestion] = useState<EditorContextType['proactiveSuggestion']>(null);
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
    const suggestionGenerationRef = useRef<string | null>(null);

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

    const originalImageLayer = useMemo(() => {
        const targetIndex = isInlineComparisonActive && historyIndex > 0 ? historyIndex - 1 : 0;
        const snapshot = history[targetIndex];
        if (!snapshot) return undefined;
        // Find the first image layer in that snapshot
        return snapshot.layers.find(l => l.type === 'image') as ImageLayer | undefined;
    }, [history, historyIndex, isInlineComparisonActive]);
    
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
            return localFilters[key as keyof typeof localFilters] !== DEFAULT_LOCAL_FILTERS[key as keyof typeof localFilters];
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

    const generateAndSetCreativeSuggestion = useCallback(async (file: File) => {
        // Prevent re-generating suggestions for the same image or while loading
        if (isLoading || suggestionGenerationRef.current === file.name) {
            return;
        }
        suggestionGenerationRef.current = file.name;

        // Don't show new suggestions if one is already showing
        if (proactiveSuggestion) {
            return;
        }

        try {
            const suggestion = await geminiService.suggestCreativeEdits(file);
            if (suggestion) {
                setProactiveSuggestion({
                    message: suggestion.message,
                    acceptLabel: suggestion.acceptLabel,
                    onAccept: () => setActiveTool(suggestion.toolId as ToolId),
                });
            }
        } catch (e) {
            // Fail silently, it's just a suggestion
            console.error("Creative suggestion failed:", e);
        }
    }, [isLoading, proactiveSuggestion, setProactiveSuggestion, setActiveTool]);
    
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
                    const lastState = savedState.history[savedState.historyIndex];
                    const firstImageLayer = lastState.layers.find(l => l.type === 'image') as ImageLayer | undefined;
                    
                    setHistory(savedState.history);
                    setHistoryIndex(savedState.historyIndex);
                    setToolHistory(savedState.toolHistory || []);
                    setHasRestoredSession(true);
                    setToast({ message: "Sessão anterior restaurada.", type: 'info' });

                    if (firstImageLayer?.file) {
                        setTimeout(() => generateAndSetCreativeSuggestion(firstImageLayer.file), 3000);
                    }
                }
            } catch (e) {
                console.error("Failed to restore session:", e);
            } finally {
                setIsLoading(false);
                setLoadingMessage(null);
            }
        };
    
        initializeApp();
    }, [generateAndSetCreativeSuggestion]); 

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
        setIsInlineComparisonActive(false);
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
        setDetectedObjects(null);
        setHighlightedObject(null);
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
    }, [onHistoryChange, setDetectedObjects, setHighlightedObject]);

    const triggerProactiveObjectDetection = useCallback(async (file: File) => {
        try {
            if (isLoading || detectedObjects) return;
            const objects = await geminiService.detectObjects(file);
            if (baseImageFile?.name === file.name && objects && objects.length > 0) {
                setDetectedObjects(objects);
                setToast({ message: "Detectamos objetos! Clique em um para começar a editar.", type: 'info' });
            }
        } catch (e) {
            console.error("Proactive object detection failed:", e);
        }
    }, [isLoading, detectedObjects, baseImageFile, setDetectedObjects, setToast]);

    const handleFileSelect = useCallback(async (file: File) => {
        setIsLoading(true);
        setLoadingMessage("Carregando imagem...");
        setUploadProgress({ progress: 0, stage: 'reading' });
        setError(null);

        try {
            const SUPPORTED_FORMATS = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

            if (!SUPPORTED_FORMATS.includes(file.type)) {
                throw new Error(`Formato de arquivo inválido. Use JPG, PNG, WEBP ou GIF.`);
            }

            setLoadingMessage("Otimizando imagem...");
            const optimizedFile = await optimizeImage(file, setUploadProgress);
            
            if (optimizedFile !== file) {
                setToast({ message: "Imagem otimizada (redimensionada para 4096px) para melhor desempenho.", type: 'info' });
            }

            setActiveTool(null);
            await setInitialImage(optimizedFile);
            
            triggerProactiveObjectDetection(optimizedFile);
            setTimeout(() => generateAndSetCreativeSuggestion(optimizedFile), 2500);

        } catch (error) {
            let errorMessage = "Não foi possível carregar a imagem. O arquivo pode estar corrompido ou em um formato não suportado.";
            if (error instanceof Error) {
                if (error.message.startsWith('DIMENSION_ERROR:')) {
                    errorMessage = error.message.replace('DIMENSION_ERROR: ', '');
                } else {
                    errorMessage = error.message;
                }
            }
            setError(errorMessage);
            setToast({ message: errorMessage, type: 'error' });
            setInitialImage(null);
        } finally {
            setIsLoading(false);
            setLoadingMessage(null);
            setUploadProgress(null);
        }
    }, [setInitialImage, setActiveTool, setIsLoading, setLoadingMessage, setUploadProgress, setError, setToast, generateAndSetCreativeSuggestion, triggerProactiveObjectDetection]);


    const handleGoHome = useCallback(async () => {
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
    }, [setInitialImage, setActiveTool, setHasRestoredSession, setProactiveSuggestion, setToast]);

    const handleTriggerUpload = useCallback(() => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
    
        input.onchange = async (event) => {
            const target = event.target as HTMLInputElement;
            const file = target.files?.[0];
    
            if (file) {
                try {
                    await db.clearHistoryDB();
                } catch (e) {
                    console.error("Failed to clear DB:", e);
                    setToast({ message: "Não foi possível limpar a sessão anterior.", type: 'error' });
                }
                await handleFileSelect(file);
                setHasRestoredSession(false);
                setProactiveSuggestion(null); 
            }
        };
    
        input.click();
    }, [handleFileSelect, setHasRestoredSession, setProactiveSuggestion, setToast]);


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
                if (l.type === 'image') {
                    return { ...l, ...updates } as ImageLayer;
                } else { // 'adjustment'
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
    const handleApplySharpen = useCallback((intensity: number) => executeDestructiveEdit(geminiService.applyGenerativeSharpening, 'sharpen', 'Aplicando nitidez...', intensity), [executeDestructiveEdit]);
    const handleApplyStyle = useCallback((stylePrompt: string) => { addPromptToHistory(stylePrompt); executeDestructiveEdit(geminiService.applyStyle, 'style', 'Aplicando estilo...', stylePrompt); }, [executeDestructiveEdit, addPromptToHistory]);
    
    const handleApplyNewAspectRatio = useCallback(() => {
        const prompt = 'Expanda a imagem criativamente para preencher a nova proporção de 16:9, mantendo o estilo e o tema originais, garantindo uma transição perfeita e natural.';
        addPromptToHistory(prompt);
        executeDestructiveEdit(geminiService.outpaintImage, 'newAspectRatio', 'Alterando proporção para 16:9...', prompt, '16:9');
    }, [executeDestructiveEdit, addPromptToHistory]);
    
    const handleGenerativeEdit = useCallback(async () => {
        if (!maskDataUrl) return;
        try {
            addPromptToHistory(prompt);
            const bwMaskDataUrl = await convertMaskToBlackAndWhite(maskDataUrl);
            const maskFile = dataURLtoFile(bwMaskDataUrl, 'mask.png');
            await executeDestructiveEdit( (file, p, opts) => geminiService.generativeEdit(file, p, 'fill', opts), 'generativeEdit', "Aplicando edição generativa...", prompt, { maskImage: maskFile });
        } catch (e) {
            const errorMessage = e instanceof Error ? e.message : "Falha ao processar a máscara de edição.";
            setError(errorMessage);
            setToast({ message: errorMessage, type: 'error' });
        }
    }, [executeDestructiveEdit, maskDataUrl, prompt, addPromptToHistory, setError, setToast]);

    const handleObjectRemove = useCallback(async () => {
        if (!maskDataUrl) return;
        try {
            const bwMaskDataUrl = await convertMaskToBlackAndWhite(maskDataUrl);
            const maskFile = dataURLtoFile(bwMaskDataUrl, 'mask.png');
            await executeDestructiveEdit( (file, p, opts) => geminiService.generativeEdit(file, p, 'remove', opts), 'objectRemover', "Removendo objeto...", '', { maskImage: maskFile });
        } catch (e) {
            const errorMessage = e instanceof Error ? e.message : "Falha ao processar a máscara de remoção.";
            setError(errorMessage);
            setToast({ message: errorMessage, type: 'error' });
        }
    }, [executeDestructiveEdit, maskDataUrl, setError, setToast]);

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
            
            const selectionTabs: TabId[] = ['generativeEdit', 'objectRemover', 'faceSwap', 'localAdjust'];
            // If the user is not already on a tab that uses object selection,
            // switch them to the default generative edit tab.
            if (!selectionTabs.includes(activeTab)) {
                 setActiveTab('generativeEdit');
                 if (window.innerWidth < 1024) {
                    setIsLeftPanelVisible(false);
                    setIsRightPanelVisible(true);
                }
            }
        };
        image.onerror = () => {
            setError("Não foi possível carregar a imagem para criar a máscara.");
            URL.revokeObjectURL(image.src);
        }
        image.src = URL.createObjectURL(baseImageFile);
    }, [baseImageFile, setMaskDataUrl, setError, activeTab, setActiveTab, setIsLeftPanelVisible, setIsRightPanelVisible]);

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


    const handleMagicPrompt = useCallback(async (prompt: string) => {
        if (!baseImageFile) {
            setToast({ message: 'Carregue uma imagem para usar o Prompt Mágico.', type: 'error' });
            return;
        }
        setIsLoading(true);
        setLoadingMessage("IA está pensando...");
        setError(null);
        try {
            const resultUrl = await geminiService.generateMagicMontage(baseImageFile, prompt);
            const newFile = dataURLtoFile(resultUrl, `magic-result.png`);
            
            const newLayers = layers.map(l => (l.id === activeLayerId && l.type === 'image' ? { ...l, file: newFile } : l) as Layer);
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
                ctx.strokeText(line, x, y + (index * fontSize * 1.2));
                ctx.fillText(line, x, y + (index * fontSize * 1.2));
            });

            const newFile = dataURLtoFile(canvas.toDataURL(), 'text-added.png');
            const newLayers = layers.map(l => l.id === activeLayerId ? { ...l, file: newFile } : l);
            commitChange(newLayers, activeLayerId, 'text');
            setToast({ message: 'Texto aplicado!', type: 'success' });

        } catch (e) {
            const errorMessage = e instanceof Error ? e.message : "Ocorreu um erro desconhecido.";
            setError(errorMessage);
            setToast({ message: errorMessage, type: 'error' });
        } finally {
            setIsLoading(false);
            setLoadingMessage(null);
        }
    }, [baseImageFile, textToolState, layers, activeLayerId, commitChange, setIsLoading, setLoadingMessage, setError, setToast]);

    const handleDownload = useCallback(async () => {
        if (!baseImageFile) return;

        setIsLoading(true);
        setLoadingMessage('Preparando para download...');
        try {
            if (!isGif) {
                // FIX: This implementation was incorrect. Replaced with a canvas-based approach
                // to correctly render the image with all visible filters and previews.
                const image = await loadImage(currentImageUrl!);
                const canvas = document.createElement('canvas');
                canvas.width = image.naturalWidth;
                canvas.height = image.naturalHeight;
                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    throw new Error("Não foi possível criar o contexto do canvas para download.");
                }
                
                // Aplicar filtros de camada de ajuste
                ctx.filter = compositeCssFilter;
                ctx.drawImage(image, 0, 0);
                
                // Redefinir filtro antes de desenhar outros elementos
                ctx.filter = 'none'; 

                // Aplicar pré-visualização de textura, se ativa
                if (texturePreview) {
                    const texture = await loadImage(texturePreview.url);
                    ctx.globalAlpha = texturePreview.opacity;
                    ctx.globalCompositeOperation = texturePreview.blendMode;
                    ctx.drawImage(texture, 0, 0, canvas.width, canvas.height);
                    ctx.globalAlpha = 1.0;
                    ctx.globalCompositeOperation = 'source-over';
                }
                
                // Aplicar pré-visualização da ferramenta de texto, se ativa
                if (activeTab === 'text' && textToolState.content.trim()) {
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
                        ctx.strokeText(line, x, y + (index * fontSize * 1.2));
                        ctx.fillText(line, x, y + (index * fontSize * 1.2));
                    });
                }

                const dataUrl = canvas.toDataURL('image/png');
                saveAs(dataUrl, 'edited-image.png');
            } else {
                setLoadingMessage(`Renderizando ${gifFrames.length} frames...`);
                const encoder = new GIFEncoder(gifFrames[0].imageData.width, gifFrames[0].imageData.height);
                encoder.start();
                encoder.setRepeat(0);
                encoder.setDelay(gifFrames[0].delay);
                encoder.setQuality(10); // Adjust quality

                const canvas = document.createElement('canvas');
                canvas.width = gifFrames[0].imageData.width;
                canvas.height = gifFrames[0].imageData.height;
                const ctx = canvas.getContext('2d');
                if (!ctx) throw new Error("Could not get context");

                for (let i = 0; i < gifFrames.length; i++) {
                    const frame = gifFrames[i];
                    encoder.setDelay(frame.delay);
                    const imageData = new ImageData(frame.imageData.data, frame.imageData.width, frame.imageData.height);
                    ctx.putImageData(imageData, 0, 0);
                    encoder.addFrame(ctx);
                }

                encoder.finish();
                const buffer = encoder.out.getData();
                const blob = new Blob([buffer], { type: 'image/gif' });
                saveAs(blob, 'edited-animation.gif');
            }
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Falha ao baixar.');
        } finally {
            setIsLoading(false);
            setLoadingMessage(null);
        }
    }, [baseImageFile, isGif, gifFrames, currentImageUrl, compositeCssFilter, texturePreview, activeTab, textToolState]);
    
    const handleApplyCrop = useCallback(() => {
        if (!completedCrop || !imgRef.current) return;
        const canvas = document.createElement('canvas');
        const image = imgRef.current;
        const scaleX = image.naturalWidth / image.width;
        const scaleY = image.naturalHeight / image.height;
        canvas.width = completedCrop.width;
        canvas.height = completedCrop.height;
        const ctx = canvas.getContext('2d');
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
        const dataUrl = canvas.toDataURL('image/png');
        const newFile = dataURLtoFile(dataUrl, 'cropped.png');
        
        const newLayers = layers.map(l => (l.id === activeLayerId ? { ...l, file: newFile } : l) as Layer);
        commitChange(newLayers, activeLayerId, 'crop');

    }, [completedCrop, imgRef, layers, activeLayerId, commitChange]);
    
    const handleTransform = useCallback(async (transformType: TransformType) => {
        if (!baseImageFile) return;

        const image = await loadImage(URL.createObjectURL(baseImageFile));
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        
        let { width, height } = image;
        
        if (transformType === 'rotate-left' || transformType === 'rotate-right') {
            canvas.width = height;
            canvas.height = width;
            ctx.translate(canvas.width / 2, canvas.height / 2);
            ctx.rotate(transformType === 'rotate-left' ? -Math.PI / 2 : Math.PI / 2);
            ctx.drawImage(image, -width / 2, -height / 2);
        } else {
            canvas.width = width;
            canvas.height = height;
            if (transformType === 'flip-h') {
                ctx.translate(width, 0);
                ctx.scale(-1, 1);
            } else { // flip-v
                ctx.translate(0, height);
                ctx.scale(1, -1);
            }
            ctx.drawImage(image, 0, 0);
        }
        
        const newFile = dataURLtoFile(canvas.toDataURL(), 'transformed.png');
        const newLayers = layers.map(l => (l.id === activeLayerId ? { ...l, file: newFile } : l) as Layer);
        commitChange(newLayers, activeLayerId, 'crop');

    }, [baseImageFile, layers, activeLayerId, commitChange]);

    const handleApplyTexture = useCallback(async () => {
        if (!texturePreview || !baseImageFile) return;

        setIsLoading(true);
        setLoadingMessage('Aplicando textura...');
        setError(null);

        try {
            const image = await loadImage(URL.createObjectURL(baseImageFile));
            const texture = await loadImage(texturePreview.url);
            const canvas = document.createElement('canvas');
            canvas.width = image.naturalWidth;
            canvas.height = image.naturalHeight;
            const ctx = canvas.getContext('2d');
            if (!ctx) throw new Error("Could not get canvas context");

            ctx.drawImage(image, 0, 0);

            ctx.globalAlpha = texturePreview.opacity;
            ctx.globalCompositeOperation = texturePreview.blendMode;

            ctx.drawImage(texture, 0, 0, canvas.width, canvas.height);
            
            const newFile = dataURLtoFile(canvas.toDataURL(), 'textured.png');
            const newLayers = layers.map(l => l.id === activeLayerId ? { ...l, file: newFile } : l) as Layer;
            commitChange(newLayers, activeLayerId, 'texture');

            setToast({ message: "Textura aplicada!", type: 'success' });
            setTexturePreview(null);
        } catch (e) {
            const errorMessage = e instanceof Error ? e.message : "Ocorreu um erro desconhecido.";
            setError(errorMessage);
            setToast({ message: errorMessage, type: 'error' });
        } finally {
            setIsLoading(false);
            setLoadingMessage(null);
        }
    }, [texturePreview, baseImageFile, layers, activeLayerId, commitChange, setIsLoading, setLoadingMessage, setError, setToast, setTexturePreview]);
    
    // --- AI PREVIEW ---
    const generateAIPreview = useCallback(async (trend: any, applyToAll: boolean) => {
        if (!baseImageFile) return;
        setIsPreviewLoading(true);
        setPreviewState(null);
        setError(null);
        try {
            let resultUrl;
            if (trend.type === 'descriptive') {
                resultUrl = await generateImageWithDescription(baseImageFile, trend.prompt);
            } else {
                resultUrl = await geminiService.applyStyle(baseImageFile, trend.prompt);
            }
            setPreviewState({ url: resultUrl, trend, applyToAll });
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Falha ao gerar pré-visualização.');
        } finally {
            setIsPreviewLoading(false);
        }
    }, [baseImageFile, setError]);

    const commitAIPreview = useCallback(async () => {
        if (!previewState) return;
        setIsLoading(true);
        setLoadingMessage('Aplicando estilo...');
        setError(null);
        try {
            const newFile = dataURLtoFile(previewState.url, `styled-${Date.now()}.png`);
            
            const newLayers = layers.map(l => l.id === activeLayerId ? { ...l, file: newFile } : l) as Layer;
            commitChange(newLayers, activeLayerId, 'style');
            setToast({ message: 'Estilo aplicado!', type: 'success' });
            setPreviewState(null);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Falha ao aplicar estilo.');
        } finally {
            setIsLoading(false);
            setLoadingMessage(null);
        }
    }, [previewState, layers, activeLayerId, commitChange, setError, setIsLoading, setLoadingMessage, setToast]);

    const handleSmartSearch = useCallback(async (term: string) => {
        setIsSmartSearching(true);
        setSmartSearchResult(null);
        setError(null);
        addPromptToHistory(term);
        try {
            const result = await geminiService.suggestToolFromPrompt(term);
            if (result) {
                const toolConfig = tools.find(t => t.id === result.name);
                if (toolConfig) {
                    setSmartSearchResult({ tool: toolConfig, args: result.args });
                } else {
                    throw new Error(`A IA sugeriu uma ferramenta desconhecida: ${result.name}`);
                }
            } else {
                // If no tool is suggested, fall back to a standard text search
                setToast({ message: "Nenhuma ferramenta específica encontrada. Mostrando resultados da busca de texto.", type: 'info' });
            }
        } catch (e) {
            setError(e instanceof Error ? e.message : 'A busca inteligente falhou.');
        } finally {
            setIsSmartSearching(false);
        }
    }, [setError, addPromptToHistory, setToast]);

    const handlePredefinedSearchAction = useCallback((action: PredefinedSearch['action']) => {
        if (action.type === 'tool') {
            setActiveTool(action.payload as ToolId);
        } else if (action.type === 'workflow') {
            executeWorkflow(action.payload as ToolId[]);
        }
    }, [setActiveTool, executeWorkflow]);
    
    // Reset transient text tool state
    const resetTextToolState = useCallback(() => {
        setTextToolState(DEFAULT_TEXT_TOOL_STATE);
    }, []);

    const contextValue: EditorContextType = {
        activeTool,
        setActiveTool,
        activeTab,
        setActiveTab,
        isLoading,
        setIsLoading,
        loadingMessage,
        setLoadingMessage,
        error,
        setError,
        isComparisonModalOpen,
        setIsComparisonModalOpen,
        isInlineComparisonActive,
        setIsInlineComparisonActive,
        toast,
        setToast,
        proactiveSuggestion,
        setProactiveSuggestion,
        uploadProgress,
        setUploadProgress,
        isSaveWorkflowModalOpen,
        setIsSaveWorkflowModalOpen,
        isLeftPanelVisible,
        setIsLeftPanelVisible,
        isRightPanelVisible,
        setIsRightPanelVisible,
        theme,
        toggleTheme,
        layers,
        activeLayerId,
        setActiveLayerId,
        baseImageFile,
        currentImageUrl,
        compositeCssFilter,
        originalImageUrl,
        imgRef,
        setInitialImage,
        hasRestoredSession,
        updateLayer,
        deleteLayer,
        toggleLayerVisibility,
        mergeDownLayer,
        moveLayerUp,
        moveLayerDown,
        history,
        historyIndex,
        canUndo,
        canRedo,
        undo,
        redo,
        jumpToState,
        resetHistory,
        toolHistory,
        commitChange,
        isGif,
        gifFrames,
        currentFrameIndex,
        setCurrentFrameIndex,
        zoom,
        setZoom,
        panOffset,
        isPanModeActive,
        setIsPanModeActive,
        isCurrentlyPanning,
        handleWheel,
        handlePanStart,
        handleTouchStart,
        handleTouchMove,
        handleTouchEnd,
        resetZoomAndPan,
        crop,
        setCrop,
        completedCrop,
        setCompletedCrop,
        aspect,
        setAspect,
        canvasRef,
        maskDataUrl,
        setMaskDataUrl,
        brushSize,
        setBrushSize,
        clearMask,
        startDrawing,
        stopDrawing,
        draw,
        detectedObjects,
        setDetectedObjects,
        highlightedObject,
        setHighlightedObject,
        localFilters,
        setLocalFilters,
        hasLocalAdjustments,
        buildFilterString,
        resetLocalFilters,
        histogram,
        previewState,
        setPreviewState,
        isPreviewLoading,
        textToolState,
        setTextToolState,
        resetTextToolState,
        generatedVideoUrl,
        setGeneratedVideoUrl,
        texturePreview,
        setTexturePreview,
        isSmartSearching,
        smartSearchResult,
        setSmartSearchResult,
        savedWorkflows,
        addWorkflow,
        recentTools,
        promptHistory,
        addPromptToHistory,
        executeWorkflow,
        handlePredefinedSearchAction,
        handleSmartSearch,
        handleFileSelect,
        handleGoHome,
        handleTriggerUpload,
        handleExplicitSave,
        handleApplyCrop,
        handleTransform,
        handleRemoveBackground,
        handleRelight,
        handleMagicPrompt,
        handleApplyLowPoly,
        handleExtractArt,
        handleApplyDustAndScratch,
        handleDenoise,
        handleApplyFaceRecovery,
        handleGenerateProfessionalPortrait,
        handleRestorePhoto,
        handleApplyUpscale,
        handleUnblurImage,
        handleApplySharpen,
        handleApplyNewAspectRatio,
        handleGenerativeEdit,
        handleObjectRemove,
        handleDetectObjects,
        handleDetectFaces,
        handleFaceRetouch,
        handleFaceSwap,
        handleSelectObject,
        handleApplyLocalAdjustments,
        handleApplyCurve,
        handleApplyStyle,
        handleApplyAIAdjustment,
        handleApplyText,
        handleGenerateVideo,
        handleDownload,
        handleApplyTexture,
        prompt,
        setPrompt,
        generateAIPreview,
        commitAIPreview,
        initialPromptFromMetadata,
    };

    return (
        <EditorContext.Provider value={contextValue}>
            {children}
        </EditorContext.Provider>
    );
};