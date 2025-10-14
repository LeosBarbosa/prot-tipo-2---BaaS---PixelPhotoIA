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
import { EditorContextType, type ToolId, type TransformType, type DetectedObject, TabId, type ToastType, Workflow, SmartSearchResult, PredefinedSearch, type UploadProgressStatus, type ToolConfig, type VideoAspectRatio, Layer, LayerStateSnapshot, ImageLayer, AdjustmentLayer, FilterState, BlendMode, GifFrame, TextToolState, Trend, ProactiveSuggestionState, TexturePreviewState, PreviewState } from '../types';
import * as db from '../utils/db';
import { tools, toolToTabMap } from '../config/tools';
import { fileToPart, generateImageFromParts, generateImageWithDescription } from '../services/geminiService';
import { handleOrchestratorCall } from '../services/orchestrator';

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
    const [isEditingSessionActive, setIsEditingSessionActive] = useState(false);
    
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
    const [localFilters, setLocalFilters] = useState<FilterState>(DEFAULT_LOCAL_FILTERS);

    const resetLocalFilters = useCallback(() => {
        setLocalFilters(DEFAULT_LOCAL_FILTERS);
    }, []);

    // Pan, Zoom & Crop State
    const { zoom, setZoom, panOffset, isPanModeActive, setIsPanModeActive, isCurrentlyPanning, handleWheel, handlePanStart, resetZoomAndPan, handleTouchStart, handleTouchMove, handleTouchEnd } = usePanAndZoom();
    const [aspect, setAspect] = useState<number | undefined>();
    
    // AI & Preview State
    const [prompt, setPrompt] = useState('');
    const [previewState, setPreviewState] = useState<PreviewState | null>(null);
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
    
    const commitChange = useCallback((newLayers: Layer[], newActiveLayerId: string | null, toolId?: ToolId) => {
        const snapshot: LayerStateSnapshot = { layers: newLayers, activeLayerId: newActiveLayerId };
        const newHistory = [...history.slice(0, historyIndex + 1), snapshot];
        setHistory(newHistory);
        setHistoryIndex(newHistory.length - 1);
        
        setCrop(undefined);
        setCompletedCrop(undefined);
        clearMask();
        setDetectedObjects(null);
        setHighlightedObject(null);
        resetLocalFilters();
        setPreviewState(null);
        
        if (toolId) {
            setToolHistory(prev => [...prev, toolId]);
            lastAppliedToolRef.current = toolId;
        }
        
        db.saveHistory(newHistory, newHistory.length - 1, toolId ? [...toolHistory, toolId] : toolHistory);

    }, [history, historyIndex, clearMask, resetLocalFilters, toolHistory]);

    const handleApplyStyle = useCallback(async (stylePrompt: string, applyToAll: boolean) => {
        if (!activeLayerId) {
            setError("Por favor, selecione uma camada para aplicar um estilo.");
            return;
        }
        const layerToEdit = layers.find(l => l.id === activeLayerId);
        if (!layerToEdit || layerToEdit.type !== 'image') {
            setError("Por favor, selecione uma camada de imagem para aplicar um estilo.");
            return;
        }

        setIsLoading(true);
        setLoadingMessage(`Aplicando estilo: ${stylePrompt.substring(0, 20)}...`);
        setError(null);
        setProactiveSuggestion(null);

        try {
            // NOTE: A lógica completa para GIF (applyToAll) foi omitida para simplificar, 
            // já que a maioria dos manipuladores de IA não a suporta totalmente no estado atual do aplicativo.
            // A lógica se concentrará na camada/frame ativo.
            const fileToProcess = (layerToEdit as ImageLayer).file;
            const resultDataUrl = await geminiService.applyStyle(fileToProcess, stylePrompt);
            const newFile = dataURLtoFile(resultDataUrl, `styled-${fileToProcess.name}`);

            const newLayers = layers.map(l => {
                if (l.id === activeLayerId) {
                    return { ...l, file: newFile } as ImageLayer;
                }
                return l;
            });

            commitChange(newLayers, activeLayerId, 'style');
            setToast({ message: 'Estilo aplicado com sucesso!', type: 'success' });
        } catch (e) {
            const errorMessage = e instanceof Error ? e.message : 'Ocorreu um erro desconhecido.';
            setError(`Falha ao aplicar estilo: ${errorMessage}`);
            setToast({ message: `Falha ao aplicar estilo: ${errorMessage}`, type: 'error' });
        } finally {
            setIsLoading(false);
            setLoadingMessage(null);
        }
    }, [activeLayerId, layers, commitChange, setError, setIsLoading, setLoadingMessage, setProactiveSuggestion, setToast]);
    
    const generateAIPreview = useCallback(async (trend: Trend, applyToAll: boolean) => {
        if (!activeLayerId || isLoading) return;
        const layerToEdit = layers.find(l => l.id === activeLayerId);
        if (!layerToEdit || layerToEdit.type !== 'image') {
            setError("Por favor, selecione uma camada de imagem para pré-visualizar o estilo.");
            return;
        }

        setIsPreviewLoading(true);
        setPreviewState(null);
        setError(null);

        try {
            const fileToProcess = (layerToEdit as ImageLayer).file;
            let resultDataUrl;
            if (trend.type === 'descriptive') {
                 resultDataUrl = await geminiService.generateImageWithDescription(fileToProcess, trend.prompt);
            } else {
                 resultDataUrl = await geminiService.applyStyle(fileToProcess, trend.prompt);
            }
            setPreviewState({ url: resultDataUrl, trend, applyToAll });
        } catch (e) {
            const errorMessage = e instanceof Error ? e.message : 'Ocorreu um erro desconhecido.';
            setError(`Falha ao gerar pré-visualização: ${errorMessage}`);
            setToast({ message: `Falha na pré-visualização: ${errorMessage}`, type: 'error' });
        } finally {
            setIsPreviewLoading(false);
        }
    }, [activeLayerId, layers, isLoading, setError, setToast]);

    const commitAIPreview = useCallback(async () => {
        if (!previewState || !activeLayerId) return;

        setIsLoading(true);
        setLoadingMessage(`Aplicando estilo: ${previewState.trend.name}...`);
        
        try {
            const newFile = dataURLtoFile(previewState.url, `styled-${Date.now()}.png`);
            
            const newLayers = layers.map(l => {
                if (l.id === activeLayerId) {
                    return { ...l, file: newFile } as ImageLayer;
                }
                return l;
            });

            commitChange(newLayers, activeLayerId, 'style');
            setToast({ message: 'Estilo aplicado com sucesso!', type: 'success' });
        } catch (e) {
             const errorMessage = e instanceof Error ? e.message : 'Ocorreu um erro desconhecido.';
            setError(`Falha ao aplicar estilo: ${errorMessage}`);
            setToast({ message: `Falha ao aplicar estilo: ${errorMessage}`, type: 'error' });
        } finally {
            setPreviewState(null);
            setIsLoading(false);
            setLoadingMessage(null);
        }

    }, [previewState, activeLayerId, layers, commitChange, setIsLoading, setLoadingMessage, setError, setToast]);

    const handleRelight = useCallback(async (prompt: string) => {
        if (!activeLayerId) {
            setError("Por favor, selecione uma camada para reacender.");
            return;
        }
        const layerToEdit = layers.find(l => l.id === activeLayerId);
        if (!layerToEdit || layerToEdit.type !== 'image') {
            setError("Por favor, selecione uma camada de imagem para reacender.");
            return;
        }

        setIsLoading(true);
        setLoadingMessage(`Reacendendo imagem...`);
        setError(null);
        setProactiveSuggestion(null);

        try {
            const fileToProcess = (layerToEdit as ImageLayer).file;
            const resultDataUrl = await geminiService.reacenderImage(fileToProcess, prompt);
            const newFile = dataURLtoFile(resultDataUrl, `relit-${fileToProcess.name}`);

            const newLayers = layers.map(l => {
                if (l.id === activeLayerId) {
                    return { ...l, file: newFile } as ImageLayer;
                }
                return l;
            });

            commitChange(newLayers, activeLayerId, 'relight');
            setToast({ message: 'Iluminação aplicada com sucesso!', type: 'success' });
        } catch (e) {
            const errorMessage = e instanceof Error ? e.message : 'Ocorreu um erro desconhecido.';
            setError(`Falha ao reacender: ${errorMessage}`);
            setToast({ message: `Falha ao reacender: ${errorMessage}`, type: 'error' });
        } finally {
            setIsLoading(false);
            setLoadingMessage(null);
        }
    }, [activeLayerId, layers, commitChange, setError, setIsLoading, setLoadingMessage, setProactiveSuggestion, setToast]);

    const handleRestorePhoto = useCallback(async (colorize: boolean) => {
        if (!activeLayerId) {
            setError("Por favor, selecione uma camada para restaurar.");
            return;
        }
        const layerToEdit = layers.find(l => l.id === activeLayerId);
        if (!layerToEdit || layerToEdit.type !== 'image') {
            setError("Por favor, selecione uma camada de imagem para restaurar.");
            return;
        }

        setIsLoading(true);
        setLoadingMessage(`Restaurando foto...`);
        setError(null);
        setProactiveSuggestion(null);

        try {
            const fileToProcess = (layerToEdit as ImageLayer).file;
            const resultDataUrl = await geminiService.restorePhoto(fileToProcess, colorize);
            const newFile = dataURLtoFile(resultDataUrl, `restored-${fileToProcess.name}`);

            const newLayers = layers.map(l => {
                if (l.id === activeLayerId) {
                    return { ...l, file: newFile } as ImageLayer;
                }
                return l;
            });

            commitChange(newLayers, activeLayerId, 'photoRestoration');
            setToast({ message: 'Foto restaurada com sucesso!', type: 'success' });
        } catch (e) {
            const errorMessage = e instanceof Error ? e.message : 'Ocorreu um erro desconhecido.';
            setError(`Falha ao restaurar foto: ${errorMessage}`);
            setToast({ message: `Falha ao restaurar foto: ${errorMessage}`, type: 'error' });
        } finally {
            setIsLoading(false);
            setLoadingMessage(null);
        }
    }, [activeLayerId, layers, commitChange, setError, setIsLoading, setLoadingMessage, setProactiveSuggestion, setToast]);

    const handleApplySharpen = useCallback(async (intensity: number) => {
        if (!activeLayerId) {
            setError("Por favor, selecione uma camada para aplicar nitidez.");
            return;
        }
        const layerToEdit = layers.find(l => l.id === activeLayerId);
        if (!layerToEdit || layerToEdit.type !== 'image') {
            setError("Por favor, selecione uma camada de imagem para aplicar nitidez.");
            return;
        }

        setIsLoading(true);
        setLoadingMessage(`Aplicando nitidez...`);
        setError(null);
        setProactiveSuggestion(null);

        try {
            const fileToProcess = (layerToEdit as ImageLayer).file;
            const resultDataUrl = await geminiService.applyGenerativeSharpening(fileToProcess, intensity);
            const newFile = dataURLtoFile(resultDataUrl, `sharpened-${fileToProcess.name}`);

            const newLayers = layers.map(l => {
                if (l.id === activeLayerId) {
                    return { ...l, file: newFile } as ImageLayer;
                }
                return l;
            });

            commitChange(newLayers, activeLayerId, 'sharpen');
            setToast({ message: 'Nitidez aplicada com sucesso!', type: 'success' });
        } catch (e) {
            const errorMessage = e instanceof Error ? e.message : 'Ocorreu um erro desconhecido.';
            setError(`Falha ao aplicar nitidez: ${errorMessage}`);
            setToast({ message: `Falha ao aplicar nitidez: ${errorMessage}`, type: 'error' });
        } finally {
            setIsLoading(false);
            setLoadingMessage(null);
        }
    }, [activeLayerId, layers, commitChange, setError, setIsLoading, setLoadingMessage, setProactiveSuggestion, setToast]);

    const handleApplySuperResolution = useCallback(async (factor: number, intensity: number, preserveFace: boolean) => {
        if (!activeLayerId) {
            setError("Por favor, selecione uma camada para aplicar a super resolução.");
            return;
        }
        const layerToEdit = layers.find(l => l.id === activeLayerId);
        if (!layerToEdit || layerToEdit.type !== 'image') {
            setError("Por favor, selecione uma camada de imagem para aplicar a super resolução.");
            return;
        }

        setIsLoading(true);
        setLoadingMessage(`Aplicando super resolução ${factor}x...`);
        setError(null);
        setProactiveSuggestion(null);

        try {
            const fileToProcess = (layerToEdit as ImageLayer).file;
            const resultDataUrl = await geminiService.enhanceResolutionAndSharpness(fileToProcess, factor, intensity, preserveFace);
            const newFile = dataURLtoFile(resultDataUrl, `superres-${fileToProcess.name}`);

            const newLayers = layers.map(l => {
                if (l.id === activeLayerId) {
                    return { ...l, file: newFile } as ImageLayer;
                }
                return l;
            });

            commitChange(newLayers, activeLayerId, 'superResolution');
            setToast({ message: 'Super resolução aplicada com sucesso!', type: 'success' });
        } catch (e) {
            const errorMessage = e instanceof Error ? e.message : 'Ocorreu um erro desconhecido.';
            setError(`Falha ao aplicar super resolução: ${errorMessage}`);
            setToast({ message: `Falha ao aplicar super resolução: ${errorMessage}`, type: 'error' });
        } finally {
            setIsLoading(false);
            setLoadingMessage(null);
        }
    }, [activeLayerId, layers, commitChange, setError, setIsLoading, setLoadingMessage, setProactiveSuggestion, setToast]);

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
                const onAccept = () => {
                    const { toolId, args } = suggestion;

                    // Close suggestion immediately
                    setProactiveSuggestion(null);
                    
                    const isEditingTool = !!toolToTabMap[toolId];

                    switch (toolId) {
                        case 'style':
                            if (args?.stylePrompt) {
                                handleApplyStyle(args.stylePrompt, true);
                            } else {
                                setActiveTab('style');
                            }
                            break;
                        case 'relight':
                            if (args?.relightPrompt) {
                                handleRelight(args.relightPrompt);
                            } else {
                                setActiveTab('relight');
                            }
                            break;
                        case 'photoRestoration':
                            // The suggestion can be to just restore, or restore and colorize
                            handleRestorePhoto(args?.colorize ?? false);
                            break;
                        // For generativeEdit, it's better to open the tool with the prompt pre-filled
                        // instead of applying it directly without user review of the mask.
                        case 'generativeEdit':
                            if (args?.prompt) {
                                setPrompt(args.prompt);
                            }
                            setActiveTab('generativeEdit');
                            break;
                        default:
                            // For outpainting, unblur, etc., open the corresponding tool.
                            if (isEditingTool) {
                                const tabId = toolToTabMap[toolId];
                                if(tabId) setActiveTab(tabId);
                            } else {
                                setActiveTool(toolId);
                            }
                    }
                };

                setProactiveSuggestion({
                    message: suggestion.message,
                    acceptLabel: suggestion.acceptLabel,
                    onAccept: onAccept,
                });
            }
        } catch (e) {
            // Fail silently, it's just a suggestion
            console.error("Creative suggestion failed:", e);
        }
    }, [isLoading, proactiveSuggestion, handleApplyStyle, handleRelight, handleRestorePhoto, setActiveTool, setProactiveSuggestion, setPrompt, setActiveTab]);
    
    // Session Restoration and Metadata on initial load
    useEffect(() => {
        if (initRef.current) return;
        initRef.current = true;
    
        const initializeApp = async () => {
            setIsLoading(true);
            setLoadingMessage("Inicializando...");
            
            try {
                // 1. Tenta carregar o estado do IndexedDB
                const savedState = await db.loadHistory();
                
                if (savedState && savedState.history && savedState.history.length > 0) {
                    const lastState = savedState.history[savedState.historyIndex];
                    const firstImageLayer = lastState.layers.find(l => l.type === 'image') as ImageLayer | undefined;
                    
                    // 2. Restaura o estado da sessão
                    setHistory(savedState.history);
                    setHistoryIndex(savedState.historyIndex);
                    setToolHistory(savedState.toolHistory || []);
                    setHasRestoredSession(true);
                    setToast({ message: "Sessão anterior restaurada.", type: 'info' });

                    if (firstImageLayer?.file) {
                        // Tenta gerar sugestão criativa após a restauração
                        setTimeout(() => generateAndSetCreativeSuggestion(firstImageLayer.file), 3000);
                    }
                }
                // 3. Se não houver sessão salva, prossegue implicitamente para a HomePage
            } catch (e) {
                // Trata falha na restauração (ex: arquivo corrompido)
                console.error("Failed to restore session:", e);
                setToast({ message: "Falha ao restaurar sessão anterior. Por favor, tente novamente ou comece uma nova.", type: 'error' });
            } finally {
                // 4. Finaliza o estado de carregamento
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

    const resetHistory = useCallback(() => {
        if (!baseImageFile) return;
        const initialLayer: ImageLayer = {
            id: `image-${Date.now()}`,
            type: 'image',
            file: baseImageFile,
            name: baseImageFile.name,
            isVisible: true,
            opacity: 100,
            blendMode: 'normal',
        };
        const initialState: LayerStateSnapshot = {
            layers: [initialLayer],
            activeLayerId: initialLayer.id,
        };
        setHistory([initialState]);
        setHistoryIndex(0);
        setToolHistory([]);
        setCrop(undefined);
        setCompletedCrop(undefined);
        clearMask();
        setDetectedObjects(null);
        setHighlightedObject(null);
        resetLocalFilters();
        setPreviewState(null);
        setToast({ message: 'A imagem foi redefinida para o seu estado original.', type: 'info' });
    }, [baseImageFile, clearMask, resetLocalFilters]);
    
    const undo = useCallback(() => {
        if (canUndo) {
            setHistoryIndex(prev => prev - 1);
        }
    }, [canUndo]);

    const redo = useCallback(() => {
        if (canRedo) {
            setHistoryIndex(prev => prev + 1);
        }
    }, [canRedo]);
    
    const jumpToState = useCallback((index: number) => {
        if (index >= 0 && index < history.length) {
            setHistoryIndex(index);
        }
    }, [history.length]);
    
    // --- TOOL HANDLERS ---
    
    const setInitialImage = useCallback(async (file: File | null) => {
        setProactiveSuggestion(null);
        if (!file) {
            setHistory([]);
            setHistoryIndex(-1);
            setToolHistory([]);
            setIsEditingSessionActive(false);
            return;
        }

        try {
            setIsLoading(true);
            setLoadingMessage('Otimizando imagem...');
            setUploadProgress({ progress: 0, stage: 'reading' });
            
            const optimizedFile = await optimizeImage(file, setUploadProgress);
            
            const initialLayer: ImageLayer = {
                id: `image-${Date.now()}`,
                type: 'image',
                file: optimizedFile,
                name: optimizedFile.name,
                isVisible: true,
                opacity: 100,
                blendMode: 'normal',
            };
            const initialState: LayerStateSnapshot = {
                layers: [initialLayer],
                activeLayerId: initialLayer.id
            };
            
            if (file.type === 'image/gif') {
                setLoadingMessage('Processando GIF...');
                const frames = await parseGif(file);
                initialState.gifFrames = frames;
                setGifFrames(frames);
            } else {
                setGifFrames([]);
            }
            
            setHistory([initialState]);
            setHistoryIndex(0);
            setToolHistory([]);
            setIsEditingSessionActive(true);
            
            db.saveHistory([initialState], 0, []);
            
            setTimeout(() => generateAndSetCreativeSuggestion(optimizedFile), 3000);

        } catch (e) {
            const errorMessage = e instanceof Error ? e.message : 'Ocorreu um erro desconhecido.';
            setError(`Falha ao carregar a imagem: ${errorMessage}`);
            if (errorMessage.includes('DIMENSION_ERROR')) {
                 setToast({ message: errorMessage.replace('DIMENSION_ERROR: ', ''), type: 'error' });
            }
        } finally {
            setIsLoading(false);
            setLoadingMessage(null);
            setUploadProgress(null);
        }
    }, [generateAndSetCreativeSuggestion]);

    const handleFileSelect = useCallback(async (file: File) => {
        await setInitialImage(file);
    }, [setInitialImage]);

    const handleGoHome = () => {
        setInitialImage(null);
        setActiveTool(null);
    };

    const handleTriggerUpload = () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = (e) => {
            const target = e.target as HTMLInputElement;
            if (target.files && target.files[0]) {
                handleFileSelect(target.files[0]);
            }
        };
        input.click();
    };

    const handleExplicitSave = useCallback(() => {
        if (history.length > 0) {
            db.saveHistory(history, historyIndex, toolHistory);
            setToast({ message: 'Sessão salva localmente!', type: 'success' });
        }
    }, [history, historyIndex, toolHistory]);

    const addPromptToHistory = useCallback((newPrompt: string) => {
        if (!newPrompt.trim()) return;
        setPromptHistory(prev => {
            const updatedHistory = [newPrompt, ...prev.filter(p => p !== newPrompt)].slice(0, 20);
            db.savePromptHistory(updatedHistory);
            return updatedHistory;
        });
    }, []);
    
    const value: EditorContextType = {
        activeTool, setActiveTool,
        activeTab, setActiveTab,
        isLoading, setIsLoading,
        loadingMessage, setLoadingMessage,
        error, setError,
        isComparisonModalOpen, setIsComparisonModalOpen,
        isInlineComparisonActive, setIsInlineComparisonActive,
        toast, setToast,
        proactiveSuggestion, setProactiveSuggestion,
        uploadProgress, setUploadProgress,
        isSaveWorkflowModalOpen, setIsSaveWorkflowModalOpen,
        isLeftPanelVisible, setIsLeftPanelVisible,
        isRightPanelVisible, setIsRightPanelVisible,
        theme, toggleTheme,
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
        isEditingSessionActive,
        setIsEditingSessionActive,
        updateLayer: () => {},
        deleteLayer: () => {},
        toggleLayerVisibility: () => {},
        mergeDownLayer: () => {},
        moveLayerUp: () => {},
        moveLayerDown: () => {},
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
        zoom, setZoom,
        panOffset,
        isPanModeActive, setIsPanModeActive,
        isCurrentlyPanning,
        handleWheel,
        handlePanStart,
        handleTouchStart,
        handleTouchMove,
        handleTouchEnd,
        resetZoomAndPan,
        crop, setCrop,
        completedCrop, setCompletedCrop,
        aspect, setAspect,
        canvasRef,
        maskDataUrl, setMaskDataUrl,
        brushSize, setBrushSize,
        clearMask,
        startDrawing,
        stopDrawing,
        draw,
        detectedObjects, setDetectedObjects,
        highlightedObject, setHighlightedObject,
        localFilters, setLocalFilters,
        hasLocalAdjustments,
        buildFilterString,
        resetLocalFilters,
        histogram,
        previewState, setPreviewState,
        isPreviewLoading,
        textToolState, setTextToolState,
        resetTextToolState: () => setTextToolState(DEFAULT_TEXT_TOOL_STATE),
        generatedVideoUrl, setGeneratedVideoUrl,
        texturePreview, setTexturePreview,
        isSmartSearching,
        smartSearchResult, setSmartSearchResult,
        savedWorkflows,
        addWorkflow: (workflow: Workflow) => {
            const newWorkflows = [...savedWorkflows, workflow];
            setSavedWorkflows(newWorkflows);
            db.addWorkflow(workflow);
        },
        recentTools,
        promptHistory,
        addPromptToHistory,
        executeWorkflow: () => {},
        handlePredefinedSearchAction: () => {},
        handleSmartSearch: () => {},
        handleFileSelect,
        handleGoHome,
        handleTriggerUpload,
        handleExplicitSave,
        handleApplyCrop: () => {},
        handleTransform: () => {},
        handleRemoveBackground: () => {},
        handleRelight,
        handleMagicPrompt: () => {},
        handleApplyLowPoly: () => {},
        handleExtractArt: () => {},
        handleApplyDustAndScratch: () => {},
        handleDenoise: () => {},
        handleApplyFaceRecovery: () => {},
        handleGenerateProfessionalPortrait: () => {},
        handleRestorePhoto,
        handleApplyUpscale: () => {},
        handleApplySuperResolution,
        handleUnblurImage: () => {},
        handleApplySharpen,
        handleApplyNewAspectRatio: () => {},
        handleGenerativeEdit: () => {},
        handleObjectRemove: () => {},
        handleDetectObjects: () => {},
        handleDetectFaces: () => {},
        handleFaceRetouch: () => {},
        handleFaceSwap: () => {},
        handleSelectObject: () => {},
        handleApplyLocalAdjustments: () => {},
        handleApplyCurve: () => {},
        handleApplyStyle,
        handleApplyAIAdjustment: () => {},
        handleApplyText: () => {},
        handleGenerateVideo: () => {},
        handleDownload: () => {},
        handleApplyTexture: () => {},
        prompt, setPrompt,
        generateAIPreview,
        commitAIPreview,
        initialPromptFromMetadata
    };

    return (
        <EditorContext.Provider value={value}>
            {children}
        </EditorContext.Provider>
    );
};