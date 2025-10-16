/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { createContext, useContext, useState, useRef, useCallback, useEffect, useMemo, ReactNode, useReducer } from 'react';
import * as geminiService from '../services/geminiService';
import { usePanAndZoom } from '../hooks/usePanAndZoom';
import { useMaskCanvas } from '../hooks/useMaskCanvas';
import { optimizeImage, dataURLtoFile, fileToDataURL, createMaskFromBoundingBox, frameToDataURL, frameToFile } from '../utils/imageUtils';
import { handleOrchestratorCall } from '../services/orchestrator';
import { applyFiltersToMaskedArea, generateHistogram, applyLUT, loadImage } from '../utils/imageProcessing';
import { parseGif } from '../utils/gifUtils';
import * as db from '../utils/db';
import {
    EditorContextType, TabId, ToolId, Layer, ImageLayer, LayerStateSnapshot, GifFrame, TransformType, FilterState, TextToolState,
    VideoAspectRatio, Workflow, DetectedObject, PredefinedSearch, SmartSearchResult, UploadProgressStatus, ProactiveSuggestionState,
    PreviewState, Trend, AdjustmentLayer, BlendMode, TexturePreviewState, HistoryState, HistoryAction, Toast,
} from '../types';
import { type Crop, type PixelCrop } from 'react-image-crop';
import { hashFile, sha256 } from '../utils/cryptoUtils';
import { tools, toolToTabMap } from '../config/tools';
import saveAs from 'file-saver';

// ====================================================================================
// 1. CONSTANTS & DEFAULTS
// ====================================================================================

export const DEFAULT_LOCAL_FILTERS: FilterState = {
  brightness: 100, contrast: 100, saturate: 100, sepia: 0, invert: 0, grayscale: 0, hueRotate: 0, blur: 0,
};

export const DEFAULT_TEXT_TOOL_STATE: TextToolState = {
    content: 'Seu Texto Aqui', fontFamily: 'Impact', fontSize: 10, color: '#FFFFFF', align: 'center', bold: false, italic: false, position: { x: 50, y: 50 },
};

// ====================================================================================
// 2. HISTORY REDUCER (para ImageStateContext)
// ====================================================================================

export const initialHistoryState: HistoryState = {
  history: [], historyIndex: -1, toolHistory: [],
};

export function historyReducer(state: HistoryState, action: HistoryAction): HistoryState {
  switch (action.type) {
    case 'SET_INITIAL':
      return { history: [action.payload.snapshot], historyIndex: 0, toolHistory: [] };
    case 'COMMIT': {
      const newHistory = state.history.slice(0, state.historyIndex + 1);
      const newToolHistory = state.toolHistory.slice(0, state.historyIndex); // Tool is associated with the *change*, not the new state
      return {
        history: [...newHistory, action.payload.snapshot],
        historyIndex: newHistory.length,
        toolHistory: action.payload.toolId ? [...newToolHistory, action.payload.toolId] : newToolHistory,
      };
    }
    case 'UNDO':
      return { ...state, historyIndex: Math.max(0, state.historyIndex - 1) };
    case 'REDO':
      return { ...state, historyIndex: Math.min(state.history.length - 1, state.historyIndex + 1) };
    case 'JUMP':
      if (action.payload.index >= 0 && action.payload.index < state.history.length) {
        return { ...state, historyIndex: action.payload.index };
      }
      return state;
    case 'RESET':
        if(state.history.length > 0) {
            return { ...state, history: [state.history[0]], historyIndex: 0, toolHistory: [] };
        }
        return state;
    case 'UPDATE_LAYER_PROPERTIES': {
      if (state.historyIndex < 0) return state;
      const newHistory = [...state.history];
      const currentSnapshot = { ...newHistory[state.historyIndex] };
      const newLayers = currentSnapshot.layers.map(l => l.id === action.payload.layerId ? { ...l, ...action.payload.updates } : l);
      currentSnapshot.layers = newLayers as Layer[];
      newHistory[state.historyIndex] = currentSnapshot;
      return { ...state, history: newHistory };
    }
    case 'SET_ACTIVE_LAYER': {
      if (state.historyIndex < 0) return state;
       const newHistory = [...state.history];
      const currentSnapshot = { ...newHistory[state.historyIndex] };
      currentSnapshot.activeLayerId = action.payload.activeLayerId;
      newHistory[state.historyIndex] = currentSnapshot;
      return { ...state, history: newHistory };
    }
    case 'RESTORE':
      return action.payload;
    default:
      return state;
  }
}

// ====================================================================================
// 3. SMALLER CONTEXT DEFINITIONS
// ====================================================================================

// --- ImageStateContext ---
interface ImageStateContextType { imageState: HistoryState; dispatch: React.Dispatch<HistoryAction>; }
const ImageStateContext = createContext<ImageStateContextType | null>(null);
const ImageStateProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [imageState, dispatch] = useReducer(historyReducer, initialHistoryState);
  return <ImageStateContext.Provider value={{ imageState, dispatch }}>{children}</ImageStateContext.Provider>;
};
const useImageState = (): ImageStateContextType => {
  const context = useContext(ImageStateContext);
  if (!context) throw new Error('useImageState must be used within an ImageStateProvider');
  return context;
};

// --- UIStateContext ---
interface UIStateContextType {
    activeTool: ToolId | null; setActiveTool: React.Dispatch<React.SetStateAction<ToolId | null>>;
    activeTab: TabId; setActiveTab: React.Dispatch<React.SetStateAction<TabId>>;
    isLoading: boolean; setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
    loadingMessage: string | null; setLoadingMessage: React.Dispatch<React.SetStateAction<string | null>>;
    error: string | null; setError: React.Dispatch<React.SetStateAction<string | null>>;
    isComparisonModalOpen: boolean; setIsComparisonModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
    isInlineComparisonActive: boolean; setIsInlineComparisonActive: React.Dispatch<React.SetStateAction<boolean>>;
    toast: Toast | null; setToast: React.Dispatch<React.SetStateAction<Toast | null>>;
    proactiveSuggestion: ProactiveSuggestionState | null; setProactiveSuggestion: React.Dispatch<React.SetStateAction<ProactiveSuggestionState | null>>;
    uploadProgress: UploadProgressStatus | null; setUploadProgress: React.Dispatch<React.SetStateAction<UploadProgressStatus | null>>;
    isSaveWorkflowModalOpen: boolean; setIsSaveWorkflowModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
    isLeftPanelVisible: boolean; setIsLeftPanelVisible: React.Dispatch<React.SetStateAction<boolean>>;
    isRightPanelVisible: boolean; setIsRightPanelVisible: React.Dispatch<React.SetStateAction<boolean>>;
    theme: 'light' | 'dark'; setTheme: React.Dispatch<React.SetStateAction<'light' | 'dark'>>;
}
const UIStateContext = createContext<UIStateContextType | null>(null);
const UIStateProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [activeTool, setActiveTool] = useState<ToolId | null>(null);
    const [activeTab, setActiveTab] = useState<TabId>('adjust');
    const [isLoading, setIsLoading] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isComparisonModalOpen, setIsComparisonModalOpen] = useState(false);
    const [isInlineComparisonActive, setIsInlineComparisonActive] = useState(false);
    const [toast, setToast] = useState<Toast | null>(null);
    const [proactiveSuggestion, setProactiveSuggestion] = useState<ProactiveSuggestionState | null>(null);
    const [uploadProgress, setUploadProgress] = useState<UploadProgressStatus | null>(null);
    const [isSaveWorkflowModalOpen, setIsSaveWorkflowModalOpen] = useState(false);
    const [isLeftPanelVisible, setIsLeftPanelVisible] = useState(true);
    const [isRightPanelVisible, setIsRightPanelVisible] = useState(true);
    const [theme, setTheme] = useState<'light' | 'dark'>('dark');
    return <UIStateContext.Provider value={{ activeTool, setActiveTool, activeTab, setActiveTab, isLoading, setIsLoading, loadingMessage, setLoadingMessage, error, setError, isComparisonModalOpen, setIsComparisonModalOpen, isInlineComparisonActive, setIsInlineComparisonActive, toast, setToast, proactiveSuggestion, setProactiveSuggestion, uploadProgress, setUploadProgress, isSaveWorkflowModalOpen, setIsSaveWorkflowModalOpen, isLeftPanelVisible, setIsLeftPanelVisible, isRightPanelVisible, setIsRightPanelVisible, theme, setTheme }}>{children}</UIStateContext.Provider>;
};
const useUIState = (): UIStateContextType => {
  const context = useContext(UIStateContext);
  if (!context) throw new Error('useUIState must be used within a UIStateProvider');
  return context;
};

// --- ToolStateContext ---
interface ToolStateContextType {
    crop?: Crop; setCrop: React.Dispatch<React.SetStateAction<Crop | undefined>>;
    completedCrop?: PixelCrop; setCompletedCrop: React.Dispatch<React.SetStateAction<PixelCrop | undefined>>;
    aspect?: number; setAspect: React.Dispatch<React.SetStateAction<number | undefined>>;
    brushSize: number; setBrushSize: React.Dispatch<React.SetStateAction<number>>;
    detectedObjects: DetectedObject[] | null; setDetectedObjects: React.Dispatch<React.SetStateAction<DetectedObject[] | null>>;
    highlightedObject: DetectedObject | null; setHighlightedObject: React.Dispatch<React.SetStateAction<DetectedObject | null>>;
    localFilters: FilterState; setLocalFilters: React.Dispatch<React.SetStateAction<FilterState>>;
    histogram: { r: number[]; g: number[]; b: number[] } | null; setHistogram: React.Dispatch<React.SetStateAction<{ r: number[]; g: number[]; b: number[] } | null>>;
    previewState: PreviewState | null; setPreviewState: React.Dispatch<React.SetStateAction<PreviewState | null>>;
    isPreviewLoading: boolean; setIsPreviewLoading: React.Dispatch<React.SetStateAction<boolean>>;
    textToolState: TextToolState; setTextToolState: React.Dispatch<React.SetStateAction<TextToolState>>;
    generatedVideoUrl: string | null; setGeneratedVideoUrl: React.Dispatch<React.SetStateAction<string | null>>;
    texturePreview: TexturePreviewState | null; setTexturePreview: React.Dispatch<React.SetStateAction<TexturePreviewState | null>>;
    savedWorkflows: Workflow[]; setSavedWorkflows: React.Dispatch<React.SetStateAction<Workflow[]>>;
    recentTools: ToolId[]; setRecentTools: React.Dispatch<React.SetStateAction<ToolId[]>>;
    promptHistory: string[]; setPromptHistory: React.Dispatch<React.SetStateAction<string[]>>;
    prompt: string; setPrompt: React.Dispatch<React.SetStateAction<string>>;
    isSmartSearching: boolean; setIsSmartSearching: React.Dispatch<React.SetStateAction<boolean>>;
    smartSearchResult: SmartSearchResult | null; setSmartSearchResult: React.Dispatch<React.SetStateAction<SmartSearchResult | null>>;
    isEditingSessionActive: boolean; setIsEditingSessionActive: React.Dispatch<React.SetStateAction<boolean>>;
    hasRestoredSession: boolean; setHasRestoredSession: React.Dispatch<React.SetStateAction<boolean>>;
    currentFrameIndex: number; setCurrentFrameIndex: React.Dispatch<React.SetStateAction<number>>;
    initialPromptFromMetadata: string | null; setInitialPromptFromMetadata: React.Dispatch<React.SetStateAction<string | null>>;
    panAndZoom: ReturnType<typeof usePanAndZoom>;
    masking: ReturnType<typeof useMaskCanvas>;
    canvasRef: React.RefObject<HTMLCanvasElement>;
}
const ToolStateContext = createContext<ToolStateContextType | null>(null);
const ToolStateProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [crop, setCrop] = useState<Crop>();
    const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
    const [aspect, setAspect] = useState<number | undefined>();
    const [brushSize, setBrushSize] = useState(40);
    const [detectedObjects, setDetectedObjects] = useState<DetectedObject[] | null>(null);
    const [highlightedObject, setHighlightedObject] = useState<DetectedObject | null>(null);
    const [localFilters, setLocalFilters] = useState<FilterState>(DEFAULT_LOCAL_FILTERS);
    const [histogram, setHistogram] = useState<{ r: number[]; g: number[]; b: number[] } | null>(null);
    const [previewState, setPreviewState] = useState<PreviewState | null>(null);
    const [isPreviewLoading, setIsPreviewLoading] = useState(false);
    const [textToolState, setTextToolState] = useState<TextToolState>(DEFAULT_TEXT_TOOL_STATE);
    const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null);
    const [texturePreview, setTexturePreview] = useState<TexturePreviewState | null>(null);
    const [savedWorkflows, setSavedWorkflows] = useState<Workflow[]>([]);
    const [recentTools, setRecentTools] = useState<ToolId[]>([]);
    const [promptHistory, setPromptHistory] = useState<string[]>([]);
    const [prompt, setPrompt] = useState('');
    const [isSmartSearching, setIsSmartSearching] = useState(false);
    const [smartSearchResult, setSmartSearchResult] = useState<SmartSearchResult | null>(null);
    const [isEditingSessionActive, setIsEditingSessionActive] = useState(false);
    const [hasRestoredSession, setHasRestoredSession] = useState(false);
    const [currentFrameIndex, setCurrentFrameIndex] = useState(0);
    const [initialPromptFromMetadata, setInitialPromptFromMetadata] = useState<string | null>(null);

    const canvasRef = useRef<HTMLCanvasElement>(null);
    const panAndZoom = usePanAndZoom();
    const masking = useMaskCanvas(canvasRef, brushSize);

    return <ToolStateContext.Provider value={{ crop, setCrop, completedCrop, setCompletedCrop, aspect, setAspect, brushSize, setBrushSize, detectedObjects, setDetectedObjects, highlightedObject, setHighlightedObject, localFilters, setLocalFilters, histogram, setHistogram, previewState, setPreviewState, isPreviewLoading, setIsPreviewLoading, textToolState, setTextToolState, generatedVideoUrl, setGeneratedVideoUrl, texturePreview, setTexturePreview, savedWorkflows, setSavedWorkflows, recentTools, setRecentTools, promptHistory, setPromptHistory, prompt, setPrompt, isSmartSearching, setIsSmartSearching, smartSearchResult, setSmartSearchResult, isEditingSessionActive, setIsEditingSessionActive, hasRestoredSession, setHasRestoredSession, currentFrameIndex, setCurrentFrameIndex, initialPromptFromMetadata, setInitialPromptFromMetadata, panAndZoom, masking, canvasRef }}>{children}</ToolStateContext.Provider>;
};
const useToolState = (): ToolStateContextType => {
  const context = useContext(ToolStateContext);
  if (!context) throw new Error('useToolState must be used within a ToolStateProvider');
  return context;
};

// ====================================================================================
// 4. COMBINED EDITOR CONTEXT
// ====================================================================================

const EditorContext = createContext<EditorContextType | null>(null);

const EditorProviderContent: React.FC<{ children: ReactNode }> = ({ children }) => {
    // Consume all smaller contexts
    const uiState = useUIState();
    const { imageState, dispatch } = useImageState();
    const toolState = useToolState();

    const { activeTool, setActiveTool, activeTab, setActiveTab, isLoading, setIsLoading, loadingMessage, setLoadingMessage, error, setError, toast, setToast, isInlineComparisonActive, setIsInlineComparisonActive, proactiveSuggestion, setProactiveSuggestion, uploadProgress, setUploadProgress, isComparisonModalOpen, setIsComparisonModalOpen, isSaveWorkflowModalOpen, setIsSaveWorkflowModalOpen, isLeftPanelVisible, setIsLeftPanelVisible, isRightPanelVisible, setIsRightPanelVisible, theme, setTheme } = uiState;
    const { hasRestoredSession, setHasRestoredSession, isEditingSessionActive, setIsEditingSessionActive, setPrompt, prompt, currentFrameIndex, setCurrentFrameIndex, crop, setCrop, completedCrop, setCompletedCrop, aspect, setAspect, brushSize, setBrushSize, detectedObjects, setDetectedObjects, highlightedObject, setHighlightedObject, localFilters, setLocalFilters, histogram, setHistogram, previewState, setPreviewState, isPreviewLoading, setIsPreviewLoading, textToolState, setTextToolState, generatedVideoUrl, setGeneratedVideoUrl, texturePreview, setTexturePreview, savedWorkflows, setSavedWorkflows, recentTools, setRecentTools, promptHistory, setPromptHistory, isSmartSearching, setIsSmartSearching, smartSearchResult, setSmartSearchResult, initialPromptFromMetadata, setInitialPromptFromMetadata } = toolState;
    const { zoom, setZoom, panOffset, isPanModeActive, setIsPanModeActive, isCurrentlyPanning, handleWheel, handlePanStart, handleTouchStart, handleTouchMove, handleTouchEnd, resetZoomAndPan } = toolState.panAndZoom;
    const { maskDataUrl, setMaskDataUrl, clearMask, startDrawing, stopDrawing, draw } = toolState.masking;
    
    // Refs
    const imgRef = useRef<HTMLImageElement>(null);
    const canvasRef = toolState.canvasRef;

    // Derived state from ImageStateContext
    const { history, historyIndex, toolHistory } = imageState;
    const canUndo = historyIndex > 0;
    const canRedo = historyIndex < history.length - 1;
    const currentSnapshot = history[historyIndex];
    const layers = currentSnapshot?.layers || [];
    const activeLayerId = currentSnapshot?.activeLayerId || null;
    const gifFramesFromHistory = currentSnapshot?.gifFrames || [];

    const [gifFrames, setGifFrames] = useState<GifFrame[]>(gifFramesFromHistory);
    const isGif = useMemo(() => gifFrames.length > 1, [gifFrames]);

    const baseImageFile = useMemo(() => {
        const firstLayer = layers[0];
        return firstLayer?.type === 'image' ? (firstLayer as ImageLayer).file : undefined;
    }, [layers]);

    const activeImageLayer = useMemo(() => layers.find(l => l.id === activeLayerId && l.type === 'image') as ImageLayer | undefined, [layers, activeLayerId]);
    const activeFrameData = useMemo(() => (isGif && gifFrames[currentFrameIndex] ? gifFrames[currentFrameIndex].imageData : null), [isGif, gifFrames, currentFrameIndex]);
    const activeLayerFile = useMemo(() => (activeFrameData ? frameToFile(activeFrameData, `frame_${currentFrameIndex}.png`) : activeImageLayer?.file), [activeImageLayer, activeFrameData, currentFrameIndex]);
    const originalImageLayer = useMemo(() => {
        const targetIndex = isInlineComparisonActive && historyIndex > 0 ? historyIndex - 1 : 0;
        const snapshot = history[targetIndex];
        return snapshot?.layers.find(l => l.type === 'image') as ImageLayer | undefined;
    }, [history, historyIndex, isInlineComparisonActive]);

    const currentImageUrl = useMemo(() => activeLayerFile ? URL.createObjectURL(activeLayerFile) : null, [activeLayerFile]);
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
        const adjustmentLayers = layers.filter(l => l.type === 'adjustment' && l.isVisible) as AdjustmentLayer[];
        return adjustmentLayers.map(l => buildFilterString(l.filters)).join(' ');
    }, [layers, buildFilterString]);

    const hasLocalAdjustments = useMemo(() => JSON.stringify(localFilters) !== JSON.stringify(DEFAULT_LOCAL_FILTERS), [localFilters]);
    
    const resetLocalFilters = useCallback(() => setLocalFilters(DEFAULT_LOCAL_FILTERS), [setLocalFilters]);
    const resetTextToolState = useCallback(() => setTextToolState(DEFAULT_TEXT_TOOL_STATE), [setTextToolState]);
    
    // History Actions
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
    }, [isGif, clearMask, setCrop, setCompletedCrop, setDetectedObjects, setHighlightedObject, setPreviewState, resetLocalFilters, setCurrentFrameIndex, setIsInlineComparisonActive]);

    const commitChange = useCallback((newLayers: Layer[], newActiveLayerId: string | null, toolId?: ToolId) => {
        const newSnapshot: LayerStateSnapshot = { layers: newLayers, activeLayerId: newActiveLayerId, gifFrames: isGif ? gifFrames : undefined };
        dispatch({ type: 'COMMIT', payload: { snapshot: newSnapshot, toolId } });
        onHistoryChange();
    }, [dispatch, onHistoryChange, isGif, gifFrames]);

    const undo = useCallback(() => { dispatch({ type: 'UNDO' }); onHistoryChange(); }, [dispatch, onHistoryChange]);
    const redo = useCallback(() => { dispatch({ type: 'REDO' }); onHistoryChange(); }, [dispatch, onHistoryChange]);
    const jumpToState = useCallback((index: number) => { dispatch({ type: 'JUMP', payload: { index } }); onHistoryChange(); }, [dispatch, onHistoryChange]);
    const resetHistory = useCallback(() => { dispatch({ type: 'RESET' }); onHistoryChange(); }, [dispatch, onHistoryChange]);
    
    const setInitialImage = useCallback(async (file: File | null) => {
        if (!file) {
            dispatch({ type: 'SET_INITIAL', payload: { snapshot: { layers: [], activeLayerId: null } } });
            setIsEditingSessionActive(false);
            setGifFrames([]);
            return;
        }
        setIsLoading(true); setLoadingMessage('Carregando imagem...'); setError(null); setUploadProgress({ progress: 0, stage: 'reading' });
        try {
            const isGifFile = file.type === 'image/gif';
            let initialLayer: ImageLayer;
            let snapshot: LayerStateSnapshot = { layers: [], activeLayerId: null };

            if (isGifFile) {
                const frames = await parseGif(file);
                setGifFrames(frames);
                initialLayer = { id: `layer_${Date.now()}`, name: 'Background', type: 'image', file: file, isVisible: true, opacity: 100, blendMode: 'normal' };
                snapshot = { layers: [initialLayer], activeLayerId: initialLayer.id, gifFrames: frames };
            } else {
                setGifFrames([]);
                const optimizedFile = await optimizeImage(file, setUploadProgress);
                initialLayer = { id: `layer_${Date.now()}`, name: 'Background', type: 'image', file: optimizedFile, isVisible: true, opacity: 100, blendMode: 'normal' };
                snapshot = { layers: [initialLayer], activeLayerId: initialLayer.id };
            }

            dispatch({ type: 'SET_INITIAL', payload: { snapshot } });
            setActiveTool(null); setActiveTab('adjust'); setIsEditingSessionActive(true);
            setToast({ message: 'Imagem carregada com sucesso!', type: 'success' });
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Falha ao processar a imagem.';
            setError(errorMessage); setToast({ message: errorMessage, type: 'error' });
        } finally {
            setIsLoading(false); setLoadingMessage(null);
        }
    }, [dispatch, setIsEditingSessionActive, setIsLoading, setLoadingMessage, setError, setUploadProgress, setActiveTool, setActiveTab, setToast]);

    // Layer Actions (some commit, some don't)
    const setActiveLayerId = useCallback((id: string | null) => dispatch({ type: 'SET_ACTIVE_LAYER', payload: { activeLayerId: id } }), [dispatch]);
    const updateLayer = useCallback((layerId: string, updates: Partial<Layer>) => dispatch({ type: 'UPDATE_LAYER_PROPERTIES', payload: { layerId, updates } }), [dispatch]);
    const deleteLayer = useCallback((layerId: string | null) => { if (!layerId || layers.length <= 1) return; const newLayers = layers.filter(l => l.id !== layerId); const newActiveId = (activeLayerId === layerId) ? (newLayers[0]?.id || null) : activeLayerId; commitChange(newLayers, newActiveId); }, [layers, activeLayerId, commitChange]);
    const toggleLayerVisibility = useCallback((layerId: string) => { const layer = layers.find(l => l.id === layerId); if (layer) updateLayer(layerId, { isVisible: !layer.isVisible }); }, [layers, updateLayer]);
    const moveLayer = useCallback((layerId: string | null, direction: 'up' | 'down') => {
        if (!layerId) return; const index = layers.findIndex(l => l.id === layerId); if (index === -1) return;
        const newIndex = direction === 'up' ? index + 1 : index - 1; // Reversed because we display in reverse
        if (newIndex < 0 || newIndex >= layers.length) return; const newLayers = [...layers];
        const temp = newLayers[index]; newLayers[index] = newLayers[newIndex]; newLayers[newIndex] = temp;
        commitChange(newLayers, layerId);
    }, [layers, commitChange]);

    const executeTool = useCallback(async (toolId: ToolId, serviceCall: (file: File, ...args: any[]) => Promise<string>, loadingMsg: string, ...args: any[]) => {
        const fileToEdit = activeLayerFile;
        if (!fileToEdit) { setError("Nenhuma camada de imagem ativa para editar."); return; }
        setIsLoading(true); setLoadingMessage(loadingMsg); setError(null);
        try {
            const resultDataUrl = await serviceCall(fileToEdit, ...args);
            const newFile = dataURLtoFile(resultDataUrl, `${toolId}-result.png`);
            const newLayers = layers.map(l => l.id === activeLayerId ? { ...l, file: newFile } : l) as Layer[];
            commitChange(newLayers, activeLayerId, toolId);
            setToast({ message: "Edição aplicada!", type: 'success' });
            setIsInlineComparisonActive(true);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "Ocorreu um erro desconhecido.";
            setError(errorMessage); setToast({ message: errorMessage, type: 'error' });
        } finally {
            setIsLoading(false); setLoadingMessage(null);
        }
    }, [activeLayerFile, layers, activeLayerId, commitChange, setToast, setError, setIsLoading, setLoadingMessage, setIsInlineComparisonActive]);

    // HANDLERS (Combine state from contexts and call services/dispatch)
    const handleGoHome = useCallback(async () => { await setInitialImage(null); setActiveTool(null); setHasRestoredSession(false); setProactiveSuggestion(null); try { await db.clearHistoryDB(); setToast({ message: "Pronto para uma nova imagem.", type: 'info' }); } catch (e) { console.error("Failed to clear DB:", e); setToast({ message: "Não foi possível limpar a sessão anterior.", type: 'error' }); } }, [setInitialImage, setActiveTool, setHasRestoredSession, setProactiveSuggestion, setToast]);
    const handleTriggerUpload = useCallback(async () => { const input = document.createElement('input'); input.type = 'file'; input.accept = 'image/*'; input.onchange = async (event) => { const target = event.target as HTMLInputElement; const file = target.files?.[0]; if (file) { await db.clearHistoryDB(); await setInitialImage(file); setHasRestoredSession(false); setProactiveSuggestion(null); } }; input.click(); }, [setInitialImage, setHasRestoredSession, setProactiveSuggestion]);
    const handleExplicitSave = useCallback(async () => { await db.saveHistory(history, historyIndex, toolHistory); setToast({ message: 'Sessão salva localmente!', type: 'success' }); }, [history, historyIndex, toolHistory, setToast]);
    
    const handleApplyCrop = useCallback(() => {
        if (!completedCrop || !imgRef.current || !activeLayerFile) return; const image = imgRef.current; const canvas = document.createElement('canvas'); const scaleX = image.naturalWidth / image.width; const scaleY = image.naturalHeight / image.height;
        canvas.width = completedCrop.width; canvas.height = completedCrop.height; const ctx = canvas.getContext('2d'); if (!ctx) return;
        const tempImage = new Image(); tempImage.onload = () => { ctx.drawImage(tempImage, completedCrop.x * scaleX, completedCrop.y * scaleY, completedCrop.width * scaleX, completedCrop.height * scaleY, 0, 0, completedCrop.width, completedCrop.height); const newFile = dataURLtoFile(canvas.toDataURL(), 'cropped.png'); const newLayers = layers.map(l => (l.id === activeLayerId && l.type === 'image') ? { ...l, file: newFile } : l); commitChange(newLayers, activeLayerId, 'crop'); }; tempImage.src = URL.createObjectURL(activeLayerFile);
    }, [completedCrop, imgRef, layers, activeLayerId, commitChange, activeLayerFile]);

    const handleSmartSearch = useCallback(async (term: string) => { setIsSmartSearching(true); setSmartSearchResult(null); try { const result = await geminiService.suggestToolFromPrompt(term); if (result) { const toolConfig = tools.find(tool => tool.id === result.name); if (toolConfig) { setSmartSearchResult({ tool: toolConfig, args: result.args }); } else { console.warn(`Smart search returned an unknown tool: ${result.name}`); setToast({ message: `A IA sugeriu uma ferramenta desconhecida: '${result.name}'.`, type: 'error' }); } } else { setToast({ message: 'A IA não sugeriu uma ferramenta. Tente a busca normal.', type: 'info' }); } } catch (e) { setToast({ message: e instanceof Error ? e.message : 'Erro na busca inteligente.', type: 'error' }); } finally { setIsSmartSearching(false); } }, [setToast, setIsSmartSearching, setSmartSearchResult]);
    
    // FIX: Add implementations for missing handlers
    const handleRemoveBackground = useCallback(() => executeTool('removeBg', geminiService.removeBackground, "Removendo fundo..."), [executeTool]);
    const handleRelight = useCallback((prompt: string) => executeTool('relight', geminiService.reacenderImage, "Reacendendo imagem...", prompt), [executeTool]);
    const handleMagicPrompt = useCallback(async (prompt: string) => {
        if (!activeLayerFile) { setError("Nenhuma camada de imagem ativa para editar."); return; }
        setIsLoading(true); setLoadingMessage("IA está pensando na melhor ferramenta..."); setError(null);
        try {
            const resultDataUrl = await handleOrchestratorCall(activeLayerFile, prompt);
            const newFile = dataURLtoFile(resultDataUrl, `magic-prompt-result.png`);
            const newLayers = layers.map(l => l.id === activeLayerId ? { ...l, file: newFile } : l) as Layer[];
            commitChange(newLayers, activeLayerId, 'magicMontage'); // using magicMontage as toolId for history
            setToast({ message: "Edição mágica aplicada!", type: 'success' });
            setIsInlineComparisonActive(true);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "Ocorreu um erro desconhecido.";
            setError(errorMessage); setToast({ message: errorMessage, type: 'error' });
        } finally {
            setIsLoading(false); setLoadingMessage(null);
        }
    }, [activeLayerFile, layers, activeLayerId, commitChange, setError, setIsLoading, setLoadingMessage, setToast, setIsInlineComparisonActive]);
    const handleApplyLowPoly = useCallback(() => executeTool('lowPoly', geminiService.generateLowPoly, "Aplicando estilo Low Poly..."), [executeTool]);
    const handleExtractArt = useCallback(() => executeTool('extractArt', geminiService.extractArt, "Extraindo arte..."), [executeTool]);
    const handleApplyDustAndScratch = useCallback(() => executeTool('dustAndScratches', geminiService.applyDustAndScratch, "Aplicando efeito de filme antigo..."), [executeTool]);
    const handleDenoise = useCallback(() => executeTool('denoise', geminiService.denoiseImage, "Removendo ruído..."), [executeTool]);
    const handleApplyFaceRecovery = useCallback(() => executeTool('faceRecovery', geminiService.applyFaceRecovery, "Recuperando detalhes do rosto..."), [executeTool]);
    const handleGenerateProfessionalPortrait = useCallback((applyToAll?: boolean) => executeTool('portraits', geminiService.generateProfessionalPortrait, "Gerando retrato profissional..."), [executeTool]);
    const handleRestorePhoto = useCallback((colorize: boolean) => executeTool('photoRestoration', geminiService.restorePhoto, "Restaurando foto...", colorize), [executeTool]);
    const handleApplyUpscale = useCallback((factor: number, preserveFace: boolean) => executeTool('upscale', geminiService.upscaleImage, "Aumentando resolução...", factor, preserveFace), [executeTool]);
    const handleUnblurImage = useCallback((sharpenLevel: number, denoiseLevel: number, model: string) => executeTool('unblur', geminiService.unblurImage, "Removendo desfoque...", sharpenLevel, denoiseLevel, model), [executeTool]);
    const handleApplySharpen = useCallback((intensity: number) => executeTool('sharpen', geminiService.applyGenerativeSharpening, "Aplicando nitidez...", intensity), [executeTool]);
    const handleApplyNewAspectRatio = useCallback(() => {
        if (!activeLayerFile) {
            setError("Nenhuma camada de imagem ativa para editar.");
            return;
        }
        executeTool('newAspectRatio', geminiService.outpaintImage, "Expandindo para 16:9...", "Expandir para preencher a proporção 16:9, mantendo o conteúdo original centrado e estendendo a cena de forma coerente.", '16:9');
    }, [executeTool, activeLayerFile, setError]);
    const handleGenerativeEdit = useCallback(async () => {
        if (!activeLayerFile || !prompt.trim() || !maskDataUrl) return;
        const maskFile = dataURLtoFile(maskDataUrl, 'mask.png');
        await executeTool('generativeEdit', geminiService.generativeEdit, "Gerando edição...", prompt, { maskImage: maskFile });
    }, [activeLayerFile, prompt, maskDataUrl, executeTool]);
    const handleObjectRemove = useCallback(async () => {
        if (!activeLayerFile || !maskDataUrl) return;
        const removePrompt = "Remova o objeto ou pessoa na área mascarada e preencha o fundo de forma realista.";
        const maskFile = dataURLtoFile(maskDataUrl, 'mask.png');
        await executeTool('objectRemover', geminiService.generativeEdit, "Removendo objeto...", removePrompt, { maskImage: maskFile });
    }, [activeLayerFile, maskDataUrl, executeTool]);
    const handleFaceRetouch = useCallback(async () => {
        if (!activeLayerFile || !maskDataUrl) return;
        const maskFile = dataURLtoFile(maskDataUrl, 'mask.png');
        await executeTool('portraits', geminiService.retouchFace, "Retocando rosto...", maskFile);
    }, [activeLayerFile, maskDataUrl, executeTool]);
    const handleApplyStyle = useCallback((stylePrompt: string, applyToAll: boolean) => {
        executeTool('style', geminiService.applyStyle, "Aplicando estilo...", stylePrompt);
    }, [executeTool]);
    const handleApplyAIAdjustment = useCallback((prompt: string, applyToAll: boolean) => {
        executeTool('adjust', geminiService.generateAdjustedImage, "Aplicando ajuste de IA...", prompt);
    }, [executeTool]);
    const handleEnhanceResolutionAndSharpness = useCallback((factor: number, intensity: number, preserveFace: boolean) => {
        executeTool('superResolution', geminiService.enhanceResolutionAndSharpness, "Aplicando Super Resolução...", factor, intensity, preserveFace);
    }, [executeTool]);

    const handleTransform = useCallback(async (transformType: TransformType) => { if (!activeLayerFile) return; setIsLoading(true); setLoadingMessage('Aplicando transformação...'); try { const image = await loadImage(URL.createObjectURL(activeLayerFile)); const canvas = document.createElement('canvas'); const ctx = canvas.getContext('2d'); if (!ctx) throw new Error('Could not get canvas context'); let { width, height } = image; if (transformType === 'rotate-left' || transformType === 'rotate-right') { canvas.width = height; canvas.height = width; ctx.translate(canvas.width / 2, canvas.height / 2); ctx.rotate(transformType === 'rotate-left' ? -Math.PI / 2 : Math.PI / 2); ctx.drawImage(image, -width / 2, -height / 2); } else { canvas.width = width; canvas.height = height; if (transformType === 'flip-h') { ctx.translate(width, 0); ctx.scale(-1, 1); } else { ctx.translate(0, height); ctx.scale(1, -1); } ctx.drawImage(image, 0, 0); } const newFile = dataURLtoFile(canvas.toDataURL(), 'transformed.png'); const newLayers = layers.map(l => (l.id === activeLayerId ? { ...l, file: newFile } : l)) as Layer[]; commitChange(newLayers, activeLayerId, 'crop'); } catch (e) { const msg = e instanceof Error ? e.message : "Falha ao transformar a imagem."; setToast({ message: msg, type: 'error' }); } finally { setIsLoading(false); setLoadingMessage(null); } }, [activeLayerFile, setIsLoading, setLoadingMessage, layers, activeLayerId, commitChange, setToast]);
    const handleDetectObjects = useCallback(async (objectPrompt?: string) => { if (!activeLayerFile) return; setIsLoading(true); setLoadingMessage('Detectando objetos...'); setDetectedObjects(null); try { const objects = await geminiService.detectObjects(activeLayerFile, objectPrompt); setDetectedObjects(objects); } catch(e) { setToast({ message: e instanceof Error ? e.message : 'Falha ao detectar objetos.', type: 'error' }); } finally { setIsLoading(false); setLoadingMessage(null); } }, [activeLayerFile, setIsLoading, setLoadingMessage, setDetectedObjects, setToast]);
    const handleDetectFaces = useCallback(() => handleDetectObjects("Detecte todos os rostos humanos nesta imagem e forneça suas caixas delimitadoras normalizadas."), [handleDetectObjects]);
    const handleSelectObject = useCallback((object: DetectedObject) => { if (!imgRef.current) return; const { naturalWidth, naturalHeight } = imgRef.current; const mask = createMaskFromBoundingBox(object.box, naturalWidth, naturalHeight); setMaskDataUrl(mask); setHighlightedObject(object); }, [setMaskDataUrl, setHighlightedObject]);
    const handleApplyLocalAdjustments = useCallback(async (applyToAll: boolean) => { if (!activeLayerFile || !maskDataUrl) return; setIsLoading(true); setLoadingMessage('Aplicando ajustes...'); try { const filterString = buildFilterString(localFilters); const result = await applyFiltersToMaskedArea(URL.createObjectURL(activeLayerFile), maskDataUrl, filterString); const newFile = dataURLtoFile(result, 'local-adjustment.png'); const newLayers = layers.map(l => (l.id === activeLayerId ? { ...l, file: newFile } : l)) as Layer[]; commitChange(newLayers, activeLayerId, 'localAdjust'); resetLocalFilters(); clearMask(); } catch(e) { setToast({ message: e instanceof Error ? e.message : 'Falha ao aplicar ajustes.', type: 'error' }); } finally { setIsLoading(false); setLoadingMessage(null); } }, [activeLayerFile, maskDataUrl, setIsLoading, setLoadingMessage, buildFilterString, localFilters, layers, activeLayerId, commitChange, resetLocalFilters, clearMask, setToast]);
    const handleApplyCurve = useCallback(async (lut: number[]) => { if(!activeLayerFile) return; try { const image = await loadImage(URL.createObjectURL(activeLayerFile)); const canvas = document.createElement('canvas'); canvas.width = image.naturalWidth; canvas.height = image.naturalHeight; const ctx = canvas.getContext('2d'); if(!ctx) return; ctx.drawImage(image, 0, 0); let imageData = ctx.getImageData(0, 0, canvas.width, canvas.height); imageData = applyLUT(imageData, lut); ctx.putImageData(imageData, 0, 0); const newFile = dataURLtoFile(canvas.toDataURL(), 'curve-adjustment.png'); const newLayers = layers.map(l => (l.id === activeLayerId ? { ...l, file: newFile } : l)) as Layer[]; commitChange(newLayers, activeLayerId, 'adjust'); } catch(e) { setToast({ message: 'Falha ao aplicar curva de tons.', type: 'error' }); } }, [activeLayerFile, commitChange, activeLayerId, layers, setToast]);
    const handleApplyText = useCallback(async () => { if (!activeLayerFile) return; setIsLoading(true); setLoadingMessage('Aplicando texto...'); try { const image = await loadImage(URL.createObjectURL(activeLayerFile)); const canvas = document.createElement('canvas'); canvas.width = image.naturalWidth; canvas.height = image.naturalHeight; const ctx = canvas.getContext('2d', { alpha: false }); if(!ctx) return; ctx.drawImage(image, 0, 0); const { content, fontFamily, fontSize, color, align, bold, italic, position } = textToolState; const pixelFontSize = (fontSize / 100) * image.naturalWidth; ctx.font = `${italic ? 'italic' : ''} ${bold ? 'bold' : ''} ${pixelFontSize}px ${fontFamily}`; ctx.fillStyle = color; ctx.textAlign = align; const x = (position.x / 100) * canvas.width; const y = (position.y / 100) * canvas.height; const lines = content.split('\n'); lines.forEach((line, index) => { ctx.fillText(line, x, y + (index * (pixelFontSize * 1.2))); }); const newFile = dataURLtoFile(canvas.toDataURL('image/png'), 'text-added.png'); const newLayers = layers.map(l => (l.id === activeLayerId ? { ...l, file: newFile } : l)) as Layer[]; commitChange(newLayers, activeLayerId, 'text'); resetTextToolState(); } catch(e) { setToast({ message: e instanceof Error ? e.message : 'Falha ao aplicar texto.', type: 'error' }); } finally { setIsLoading(false); setLoadingMessage(null); } }, [activeLayerFile, textToolState, layers, activeLayerId, commitChange, resetTextToolState, setIsLoading, setLoadingMessage, setToast]);
    const handleGenerateVideo = useCallback(async (p: string, ar: VideoAspectRatio) => { setIsLoading(true); setError(null); try { const url = await geminiService.generateVideo(p, ar); setGeneratedVideoUrl(url); } catch(e) { setError(e instanceof Error ? e.message : 'Falha ao gerar vídeo.'); } finally { setIsLoading(false); } }, [setIsLoading, setError, setGeneratedVideoUrl]);
    const handleDownload = useCallback(async () => { if (!currentImageUrl) { setToast({ message: 'Nenhuma imagem para baixar.', type: 'error' }); return; } try { saveAs(currentImageUrl, `pixelphoto-ia-${Date.now()}.png`); } catch(e) { setToast({ message: 'Falha no download.', type: 'error' }); } }, [currentImageUrl, setToast]);
    const handleApplyTexture = useCallback(async () => { if (!activeLayerFile || !texturePreview) return; setIsLoading(true); setLoadingMessage('Aplicando textura...'); try { const baseImage = await loadImage(URL.createObjectURL(activeLayerFile)); const textureImage = await loadImage(texturePreview.url); const canvas = document.createElement('canvas'); canvas.width = baseImage.naturalWidth; canvas.height = baseImage.naturalHeight; const ctx = canvas.getContext('2d'); if(!ctx) return; ctx.drawImage(baseImage, 0, 0); 
    // FIX: Map BlendMode to a valid GlobalCompositeOperation value. 'normal' maps to 'source-over'.
    ctx.globalCompositeOperation = (texturePreview.blendMode === 'normal' ? 'source-over' : texturePreview.blendMode) as any;
    ctx.globalAlpha = texturePreview.opacity; ctx.drawImage(textureImage, 0, 0, canvas.width, canvas.height); const newFile = dataURLtoFile(canvas.toDataURL(), 'textured.png'); const newLayers = layers.map(l => (l.id === activeLayerId ? { ...l, file: newFile } : l)) as Layer[]; commitChange(newLayers, activeLayerId, 'texture'); setTexturePreview(null); } catch(e) { setToast({ message: 'Falha ao aplicar textura.', type: 'error' }); } finally { setIsLoading(false); setLoadingMessage(null); } }, [activeLayerFile, texturePreview, setIsLoading, setLoadingMessage, layers, activeLayerId, commitChange, setTexturePreview, setToast]);
    
    // Complex Handlers
    const executeWorkflow = (toolIds: ToolId[]) => { /* ... implementation ... */ };
    const handlePredefinedSearchAction = (action: PredefinedSearch['action']) => { /* ... implementation ... */ };
    const generateAIPreview = async (trend: Trend, applyToAll: boolean) => { if(!activeLayerFile) return; setIsPreviewLoading(true); try { const result = await geminiService.applyStyle(activeLayerFile, trend.prompt); setPreviewState({ url: result, trend, applyToAll }); } catch (e) { setToast({ message: e instanceof Error ? e.message : 'Falha ao gerar pré-visualização.', type: 'error' }); } finally { setIsPreviewLoading(false); } };
    const commitAIPreview = async () => { if(!previewState) return; setIsLoading(true); setLoadingMessage('Aplicando estilo...'); try { const newFile = dataURLtoFile(previewState.url, 'styled.png'); const newLayers = layers.map(l => (l.id === activeLayerId ? { ...l, file: newFile } : l)) as Layer[]; commitChange(newLayers, activeLayerId, 'style'); setPreviewState(null); } catch(e) { setToast({ message: 'Falha ao aplicar estilo.', type: 'error' }); } finally { setIsLoading(false); setLoadingMessage(null); }};

    const runToolInModal = async (serviceCall: (...args: any[]) => Promise<string>, loadingMsg: string, ...args: any[]) => { setIsLoading(true); setLoadingMessage(loadingMsg); setError(null); try { const result = await serviceCall(...args); return result; } catch(e) { const msg = e instanceof Error ? e.message : 'Ocorreu um erro.'; setError(msg); setToast({ message: msg, type: 'error' }); throw e; } finally { setIsLoading(false); setLoadingMessage(null); }};
    const handleMagicMontage = async (mainImage: File, p: string, secondImage?: File) => { const result = await runToolInModal(geminiService.generateMagicMontage, "Realizando a mágica...", mainImage, p, secondImage); const newFile = dataURLtoFile(result, 'montage.png'); commitChange(layers.map(l => (l.id === activeLayerId ? { ...l, file: newFile } : l)) as Layer[], activeLayerId, 'magicMontage'); };
    const handleCreativeFusion = async (compositionImage: File, styleImages: File[]) => { const result = await runToolInModal(geminiService.fuseImages, "Criando fusão...", compositionImage, styleImages); const newFile = dataURLtoFile(result, 'fusion.png'); commitChange(layers.map(l => (l.id === activeLayerId ? { ...l, file: newFile } : l)) as Layer[], activeLayerId, 'creativeFusion'); };
    const handleAIPortrait = async (styleId: string, personImages: File[], p: string) => { const serviceMap = { 'caricature': geminiService.generateCaricature, /* ... etc */ }; const call = serviceMap[styleId as 'caricature']; if(call) { const result = await runToolInModal(call, 'Criando retrato...', personImages, p); const newFile = dataURLtoFile(result, 'portrait.png'); setInitialImage(newFile); setActiveTool(null); }};
    const handleSuperheroFusion = async (userImage: File, heroImage: File) => { const result = await runToolInModal(geminiService.generateSuperheroFusion, "Realizando a fusão heroica...", userImage, heroImage); const newFile = dataURLtoFile(result, 'superhero.png'); commitChange(layers.map(l => (l.id === activeLayerId ? { ...l, file: newFile } : l)) as Layer[], activeLayerId, 'superheroFusion'); };
    const handleConfidentStudio = async (personImage: File, mainPrompt: string, negativePrompt: string) => { const result = await runToolInModal(geminiService.generateStudioPortrait, "Montando o estúdio...", personImage, mainPrompt, negativePrompt); const newFile = dataURLtoFile(result, 'studio.png'); commitChange(layers.map(l => (l.id === activeLayerId ? { ...l, file: newFile } : l)) as Layer[], activeLayerId, 'confidentStudio'); };
    const handlePolaroid = async (personImage: File, celebrityImage: File, negativePrompt: string) => { const result = await runToolInModal(geminiService.generatePolaroidWithCelebrity, "Revelando sua foto...", personImage, celebrityImage, negativePrompt); const newFile = dataURLtoFile(result, 'polaroid.png'); commitChange(layers.map(l => (l.id === activeLayerId ? { ...l, file: newFile } : l)) as Layer[], activeLayerId, 'polaroid'); };
    const handleStyledPortrait = async (personImage: File, styleImages: File[], p: string, negativeP: string) => { const result = await runToolInModal(geminiService.generateStyledPortrait, "Criando seu novo retrato...", personImage, styleImages, p, negativeP); const newFile = dataURLtoFile(result, 'styled.png'); commitChange(layers.map(l => (l.id === activeLayerId ? { ...l, file: newFile } : l)) as Layer[], activeLayerId, 'styledPortrait'); };
    // FIX: Correct the implementation of handleFunkoPop to use the correct service and signature.
    const handleFunkoPop = async (...args: Parameters<typeof geminiService.generateFunkoPop>) => { 
        const result = await runToolInModal(geminiService.generateFunkoPop, "Criando seu colecionável...", ...args);
        const newFile = dataURLtoFile(result, 'funko.png');
        commitChange(layers.map(l => (l.id === activeLayerId ? { ...l, file: newFile } : l)) as Layer[], activeLayerId, 'funkoPopStudio');
    };
    const handleVirtualTryOn = async (...args: Parameters<typeof geminiService.virtualTryOn>) => { const result = await runToolInModal(geminiService.virtualTryOn, "Vestindo o modelo...", ...args); const newFile = dataURLtoFile(result, 'try-on.png'); commitChange(layers.map(l => (l.id === activeLayerId ? { ...l, file: newFile } : l)) as Layer[], activeLayerId, 'tryOn'); };
    const handleDoubleExposure = async (portraitImage: File, landscapeImage: File): Promise<string> => { return runToolInModal(geminiService.generateDoubleExposure, "Criando efeito...", portraitImage, landscapeImage); };
    const handleFaceSwap = async (sourceImage: File, userPrompt: string) => { if(!maskDataUrl || !activeLayerFile) return; setIsLoading(true); setLoadingMessage('Trocando rostos...'); try { const result = await geminiService.faceSwap(activeLayerFile, dataURLtoFile(maskDataUrl, 'mask.png'), sourceImage, userPrompt); const newFile = dataURLtoFile(result, 'faceswap.png'); const newLayers = layers.map(l => (l.id === activeLayerId ? { ...l, file: newFile } : l)) as Layer[]; commitChange(newLayers, activeLayerId, 'faceSwap'); } catch(e) { setToast({message: e instanceof Error ? e.message : 'Falha ao trocar rostos.', type: 'error'})} finally { setIsLoading(false); setLoadingMessage(null); }};

    // Construct the final, unified context value
    const contextValue: EditorContextType = {
        activeTool, setActiveTool, activeTab, setActiveTab, isLoading, setIsLoading, loadingMessage, setLoadingMessage, error, setError, isComparisonModalOpen, setIsComparisonModalOpen, isInlineComparisonActive, setIsInlineComparisonActive, toast, setToast, proactiveSuggestion, setProactiveSuggestion, uploadProgress, setUploadProgress, isSaveWorkflowModalOpen, setIsSaveWorkflowModalOpen, isLeftPanelVisible, setIsLeftPanelVisible, isRightPanelVisible, setIsRightPanelVisible, theme, 
        toggleTheme: () => setTheme(t => t === 'dark' ? 'light' : 'dark'),
        layers, activeLayerId, baseImageFile, currentImageUrl, originalImageUrl, compositeCssFilter, hasRestoredSession, isEditingSessionActive, setIsEditingSessionActive,
        history, historyIndex, canUndo, canRedo, toolHistory,
        isGif, gifFrames, currentFrameIndex, setCurrentFrameIndex,
        zoom, setZoom, panOffset, isPanModeActive, setIsPanModeActive, isCurrentlyPanning,
        crop, setCrop, completedCrop, setCompletedCrop, aspect, setAspect,
        maskDataUrl, setMaskDataUrl, brushSize, setBrushSize, detectedObjects, setDetectedObjects, highlightedObject, setHighlightedObject,
        localFilters, setLocalFilters, hasLocalAdjustments, histogram,
        previewState, setPreviewState, isPreviewLoading,
        textToolState, setTextToolState, generatedVideoUrl, setGeneratedVideoUrl, texturePreview, setTexturePreview,
        // FIX: Remove 'setPromptHistory' from the context value as it is not part of the EditorContextType.
        isSmartSearching, smartSearchResult, setSmartSearchResult, savedWorkflows, recentTools, promptHistory, prompt, setPrompt, initialPromptFromMetadata,
        imgRef, canvasRef,
        setActiveLayerId, setInitialImage,
        updateLayer, deleteLayer, toggleLayerVisibility, 
        mergeDownLayer: () => {}, // Not implemented
        moveLayerUp: (id) => moveLayer(id, 'up'), moveLayerDown: (id) => moveLayer(id, 'down'),
        undo, redo, jumpToState, resetHistory, commitChange,
        resetZoomAndPan, clearMask, startDrawing, stopDrawing, draw,
        resetLocalFilters, resetTextToolState,
        addWorkflow: (workflow: Workflow) => { setSavedWorkflows(prev => [...prev, workflow]); db.addWorkflow(workflow); },
        addPromptToHistory: (p: string) => { const newHistory = [p, ...promptHistory.filter(i => i !== p)].slice(0, 50); setPromptHistory(newHistory); db.savePromptHistory(newHistory); },
        handleWheel, handlePanStart, handleTouchStart, handleTouchMove, handleTouchEnd,
        buildFilterString, executeWorkflow, handlePredefinedSearchAction,
        // FIX: Add all missing handlers to the context value.
        handleSmartSearch, handleFileSelect: setInitialImage, handleGoHome, handleTriggerUpload, handleExplicitSave, handleApplyCrop, handleTransform, handleRemoveBackground, handleRelight, handleMagicPrompt, handleApplyLowPoly, handleExtractArt, handleApplyDustAndScratch, handleDenoise, handleApplyFaceRecovery, handleGenerateProfessionalPortrait, handleRestorePhoto, handleApplyUpscale, handleUnblurImage, handleApplySharpen, handleApplyNewAspectRatio, handleGenerativeEdit, handleObjectRemove, handleDetectObjects, handleDetectFaces, handleFaceRetouch, handleFaceSwap, handleSelectObject, handleApplyLocalAdjustments, handleApplyCurve, handleApplyStyle, handleApplyAIAdjustment, handleApplyText, handleGenerateVideo, handleDownload, handleApplyTexture, handleVirtualTryOn, handleFunkoPop, handleStyledPortrait, handlePolaroid, handleConfidentStudio, handleSuperheroFusion, handleAIPortrait, handleEnhanceResolutionAndSharpness, handleDoubleExposure, handleCreativeFusion, generateAIPreview, commitAIPreview, handleMagicMontage,
    };

    // FIX: Change Editor.Provider to EditorContext.Provider to fix 'Cannot find name' error
    return <EditorContext.Provider value={contextValue}>{children}</EditorContext.Provider>;
}


// The final exported provider that composes everything
export const EditorProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  return (
    <UIStateProvider>
        <ImageStateProvider>
            <ToolStateProvider>
                <EditorProviderContent>{children}</EditorProviderContent>
            </ToolStateProvider>
        </ImageStateProvider>
    </UIStateProvider>
  );
};

export const useEditor = (): EditorContextType => {
    const context = useContext(EditorContext);
    if (!context) {
        throw new Error('useEditor must be used within an EditorProvider');
    }
    return context;
};
