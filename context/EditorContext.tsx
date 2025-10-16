/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { createContext, useContext, useState, useRef, useCallback, useEffect, useMemo, ReactNode, useReducer } from 'react';
import * as geminiService from '../services/geminiService';
import { usePanAndZoom } from '../hooks/usePanAndZoom';
import { useMaskCanvas } from '../hooks/useMaskCanvas';
import { optimizeImage, dataURLtoFile, fileToDataURL, createMaskFromBoundingBox, frameToDataURL, frameToFile, createMaskFromCrop } from '../utils/imageUtils';
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
import html2canvas from 'html2canvas';

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
// 2. HISTORY REDUCER
// ====================================================================================

const initialHistoryState: HistoryState = {
  history: [],
  historyIndex: -1,
  toolHistory: [],
};

function historyReducer(state: HistoryState, action: HistoryAction): HistoryState {
    switch (action.type) {
        case 'COMMIT': {
            const newHistory = state.history.slice(0, state.historyIndex + 1);
            newHistory.push(action.payload.snapshot);
            
            const newToolHistory = [...state.toolHistory.slice(0, state.historyIndex + 1)];
            if(action.payload.toolId) {
                newToolHistory.push(action.payload.toolId);
            }

            return {
                history: newHistory,
                historyIndex: newHistory.length - 1,
                toolHistory: newToolHistory
            };
        }
        case 'UNDO':
            if (state.historyIndex > 0) {
              return { ...state, historyIndex: state.historyIndex - 1 };
            }
            return state;
        case 'REDO':
            if (state.historyIndex < state.history.length - 1) {
              return { ...state, historyIndex: state.historyIndex + 1 };
            }
            return state;
        case 'JUMP':
            if (action.payload.index >= 0 && action.payload.index < state.history.length) {
                return { ...state, historyIndex: action.payload.index };
            }
            return state;
        case 'RESET':
             if (state.history.length > 0) {
                return { history: [state.history[0]], historyIndex: 0, toolHistory: [] };
             }
             return state;
        case 'SET_INITIAL':
            return { history: [action.payload.snapshot], historyIndex: 0, toolHistory: [] };
        case 'RESTORE':
            return action.payload;
        default:
            return state;
    }
}


const EditorContext = createContext<EditorContextType | null>(null);

export const EditorProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    // --- STATE MANAGEMENT ---
    const [historyState, dispatchHistory] = useReducer(historyReducer, initialHistoryState);
    const { history, historyIndex, toolHistory } = historyState;
    const canUndo = historyIndex > 0;
    const canRedo = historyIndex < history.length - 1;

    const [layers, setLayers] = useState<Layer[]>([]);
    const [activeLayerId, setActiveLayerId] = useState<string | null>(null);
    const [gifFrames, setGifFrames] = useState<GifFrame[]>([]);
    const [activeTool, setActiveTool] = useState<ToolId | null>(null);
    const [activeTab, setActiveTab] = useState<TabId>('imageGen');
    const [isLoading, setIsLoading] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [toast, setToast] = useState<Toast | null>(null);
    const [isComparisonModalOpen, setIsComparisonModalOpen] = useState(false);
    const [isInlineComparisonActive, setIsInlineComparisonActive] = useState(false);
    const [proactiveSuggestion, setProactiveSuggestion] = useState<ProactiveSuggestionState | null>(null);
    const [uploadProgress, setUploadProgress] = useState<UploadProgressStatus | null>(null);
    const [isSaveWorkflowModalOpen, setIsSaveWorkflowModalOpen] = useState(false);
    const [isLeftPanelVisible, setIsLeftPanelVisible] = useState(true);
    const [isRightPanelVisible, setIsRightPanelVisible] = useState(true);
    const [theme, setTheme] = useState<'light' | 'dark'>('dark');
    const [hasRestoredSession, setHasRestoredSession] = useState(false);
    const [isEditingSessionActive, setIsEditingSessionActive] = useState(false);
    const [currentFrameIndex, setCurrentFrameIndex] = useState(0);
    const [crop, setCrop] = useState<Crop | undefined>();
    const [completedCrop, setCompletedCrop] = useState<PixelCrop | undefined>();
    const [aspect, setAspect] = useState<number | undefined>();
    const [brushSize, setBrushSize] = useState(40);
    const [detectedObjects, setDetectedObjects] = useState<DetectedObject[] | null>(null);
    const [highlightedObject, setHighlightedObject] = useState<DetectedObject | null>(null);
    const [localFilters, setLocalFilters] = useState<FilterState>(DEFAULT_LOCAL_FILTERS);
    const [histogram, setHistogram] = useState<{ r: number[]; g: number[]; b: number[]; } | null>(null);
    const [previewState, setPreviewState] = useState<PreviewState | null>(null);
    const [isPreviewLoading, setIsPreviewLoading] = useState(false);
    const [textToolState, setTextToolState] = useState<TextToolState>(DEFAULT_TEXT_TOOL_STATE);
    const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null);
    const [texturePreview, setTexturePreview] = useState<TexturePreviewState | null>(null);
    const [isSmartSearching, setIsSmartSearching] = useState(false);
    const [smartSearchResult, setSmartSearchResult] = useState<SmartSearchResult | null>(null);
    const [savedWorkflows, setSavedWorkflows] = useState<Workflow[]>([]);
    const [recentTools, setRecentTools] = useState<ToolId[]>([]);
    const [promptHistory, setPromptHistory] = useState<string[]>([]);
    const [prompt, setPrompt] = useState('');
    const [initialPromptFromMetadata, setInitialPromptFromMetadata] = useState<string | null>(null);

    const imgRef = useRef<HTMLImageElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const { zoom, setZoom, panOffset, isPanModeActive, setIsPanModeActive, isCurrentlyPanning, handleWheel, handlePanStart, handleTouchStart, handleTouchMove, handleTouchEnd, resetZoomAndPan } = usePanAndZoom();
    const { maskDataUrl, setMaskDataUrl, clearMask, startDrawing, stopDrawing, draw } = useMaskCanvas(canvasRef, brushSize);

    const commitChange = useCallback((newLayers: Layer[], newActiveLayerId: string | null, toolId?: ToolId) => {
        const snapshot: LayerStateSnapshot = { layers: newLayers, activeLayerId: newActiveLayerId, gifFrames: gifFrames.length > 1 ? gifFrames : undefined };
        dispatchHistory({ type: 'COMMIT', payload: { snapshot, toolId } });
        
        if (toolId) {
             const newRecentTools = [toolId, ...recentTools.filter(t => t !== toolId)].slice(0, 5);
             setRecentTools(newRecentTools);
             db.saveRecentTools(newRecentTools);
        }
    }, [gifFrames, recentTools, dispatchHistory]);

    const undo = useCallback(() => dispatchHistory({ type: 'UNDO' }), [dispatchHistory]);
    const redo = useCallback(() => dispatchHistory({ type: 'REDO' }), [dispatchHistory]);
    const jumpToState = useCallback((index: number) => dispatchHistory({ type: 'JUMP', payload: { index } }), [dispatchHistory]);
    const resetHistory = useCallback(() => {
        if (history.length > 0) {
            dispatchHistory({ type: 'RESET' });
        }
    }, [history, dispatchHistory]);

    useEffect(() => {
        const initializeApp = async () => {
            const savedState = await db.loadHistory();
            if (savedState?.history?.length > 0) {
                dispatchHistory({ type: 'RESTORE', payload: savedState });
                setHasRestoredSession(true);
                setIsEditingSessionActive(false);
                setToast({message: "Sessão anterior restaurada!", type: "info"});
            }
        };
        initializeApp();
    }, []);

    useEffect(() => {
        const currentState = history[historyIndex];
        if (currentState) {
            setLayers(currentState.layers);
            setActiveLayerId(currentState.activeLayerId);
            if (currentState.gifFrames) {
                setGifFrames(currentState.gifFrames);
            } else {
                setGifFrames([]);
            }
        }
    }, [history, historyIndex]);

    const setInitialImage = useCallback(async (file: File | null) => {
        await db.clearHistoryDB();
        if (!file) {
             dispatchHistory({ type: 'SET_INITIAL', payload: { snapshot: { layers: [], activeLayerId: null } } });
             setIsEditingSessionActive(false);
             return;
        }
        const layerId = `layer_${Date.now()}`;
        const initialLayer: ImageLayer = {id: layerId, name: 'Fundo', type: 'image', file, isVisible: true, opacity: 100, blendMode: 'normal'};
        const snapshot: LayerStateSnapshot = { layers: [initialLayer], activeLayerId: layerId };
        
        dispatchHistory({ type: 'SET_INITIAL', payload: { snapshot } });
        
        setIsEditingSessionActive(true);
        setActiveTab('adjust');
        setHasRestoredSession(false);
        setProactiveSuggestion(null);

        // Check for GIF
        if(file.type === 'image/gif'){
            try {
                const frames = await parseGif(file);
                const gifSnapshot: LayerStateSnapshot = { ...snapshot, gifFrames: frames };
                dispatchHistory({ type: 'SET_INITIAL', payload: { snapshot: gifSnapshot } });
            } catch (e) {
                setError("Falha ao processar o GIF.");
            }
        }

    }, [dispatchHistory]);
    
    const isGif = useMemo(() => gifFrames.length > 1, [gifFrames]);
    const baseImageFile = useMemo(() => layers[0] && layers[0].type === 'image' ? (layers[0] as ImageLayer).file : undefined, [layers]);
    const activeImageLayer = useMemo(() => layers.find(l => l.id === activeLayerId && l.type === 'image') as ImageLayer | undefined, [layers, activeLayerId]);
    const activeFrameData = useMemo(() => (isGif && gifFrames[currentFrameIndex] ? gifFrames[currentFrameIndex].imageData : null), [isGif, gifFrames, currentFrameIndex]);
    const activeLayerFile = useMemo(() => (activeFrameData ? frameToFile(activeFrameData, `frame_${currentFrameIndex}.png`) : activeImageLayer?.file), [activeImageLayer, activeFrameData, currentFrameIndex]);
    const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(null);
    const [originalImageUrl, setOriginalImageUrl] = useState<string | null>(null);
    
    useEffect(() => {
        let objectUrl: string | null = null;
        if(activeLayerFile) {
            objectUrl = URL.createObjectURL(activeLayerFile);
        }
        setCurrentImageUrl(objectUrl);
        return () => { if(objectUrl) URL.revokeObjectURL(objectUrl); };
    }, [activeLayerFile]);

     useEffect(() => {
        let objectUrl: string | null = null;
        const originalLayer = history[0]?.layers[0] as ImageLayer | undefined;
        if(originalLayer?.file) {
            objectUrl = URL.createObjectURL(originalLayer.file);
        }
        setOriginalImageUrl(objectUrl);
        return () => { if(objectUrl) URL.revokeObjectURL(objectUrl); };
    }, [history]);
    
    const compositeCssFilter = ''; // This will be dynamic based on adjustment layers later
    const hasLocalAdjustments = useMemo(() => JSON.stringify(localFilters) !== JSON.stringify(DEFAULT_LOCAL_FILTERS), [localFilters]);
    const resetLocalFilters = useCallback(() => setLocalFilters(DEFAULT_LOCAL_FILTERS), []);
    const resetTextToolState = useCallback(() => setTextToolState(DEFAULT_TEXT_TOOL_STATE), []);

    const handleFileSelect = useCallback(async (file: File | null) => {
        await setInitialImage(file);
    }, [setInitialImage]);

    const handleTriggerUpload = useCallback(() => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*,.gif';
        input.onchange = (event) => {
            const target = event.target as HTMLInputElement;
            const file = target.files?.[0];
            if (file) {
                handleFileSelect(file);
            }
        };
        input.click();
    }, [handleFileSelect]);
    
    const handleGoHome = () => setIsEditingSessionActive(false);
    
    const handleExplicitSave = async () => {
        try {
            await db.saveHistory(history, historyIndex, toolHistory);
            setToast({ message: "Sessão salva com sucesso!", type: 'success' });
        } catch(e) {
            setToast({ message: "Falha ao salvar a sessão.", type: 'error' });
        }
    };
    
    const contextValue: EditorContextType = {
        history, historyIndex, canUndo, canRedo, undo, redo, jumpToState, resetHistory, commitChange,
        activeTool, setActiveTool, activeTab, setActiveTab, isLoading, setIsLoading, loadingMessage, setLoadingMessage, error, setError, isComparisonModalOpen, setIsComparisonModalOpen, isInlineComparisonActive, setIsInlineComparisonActive, toast, setToast, proactiveSuggestion, setProactiveSuggestion, uploadProgress, setUploadProgress, isSaveWorkflowModalOpen, setIsSaveWorkflowModalOpen, isLeftPanelVisible, setIsLeftPanelVisible, isRightPanelVisible, setIsRightPanelVisible, theme, 
        toggleTheme: () => setTheme(t => t === 'dark' ? 'light' : 'dark'),
        layers, activeLayerId, setActiveLayerId, baseImageFile, currentImageUrl, originalImageUrl, compositeCssFilter, hasRestoredSession, isEditingSessionActive, setIsEditingSessionActive,
        toolHistory, isGif, gifFrames, currentFrameIndex, setCurrentFrameIndex, zoom, setZoom, panOffset, isPanModeActive, setIsPanModeActive, isCurrentlyPanning,
        crop, setCrop, completedCrop, setCompletedCrop, aspect, setAspect,
        maskDataUrl, setMaskDataUrl, brushSize, setBrushSize,
        detectedObjects, setDetectedObjects, highlightedObject, setHighlightedObject,
        localFilters, setLocalFilters, hasLocalAdjustments, histogram,
        previewState, setPreviewState, isPreviewLoading,
        textToolState, setTextToolState,
        generatedVideoUrl, setGeneratedVideoUrl,
        texturePreview, setTexturePreview,
        isSmartSearching, smartSearchResult, setSmartSearchResult,
        savedWorkflows, recentTools, promptHistory,
        prompt, setPrompt, initialPromptFromMetadata,
        imgRef, canvasRef, setInitialImage,
        updateLayer: () => {}, deleteLayer: () => {}, toggleLayerVisibility: () => {}, mergeDownLayer: () => {}, moveLayerUp: () => {}, moveLayerDown: () => {},
        resetZoomAndPan, clearMask, startDrawing, stopDrawing, draw,
        resetLocalFilters, resetTextToolState,
        addWorkflow: () => {}, addPromptToHistory: () => {},
        handleWheel, handlePanStart, handleTouchStart, handleTouchMove, handleTouchEnd,
        buildFilterString: () => '', executeWorkflow: () => {}, handlePredefinedSearchAction: () => {}, handleSmartSearch: async () => {}, handleFileSelect, handleGoHome, handleTriggerUpload, handleExplicitSave, handleApplyCrop: () => {}, handleTransform: async () => {}, handleRemoveBackground: () => {}, handleRelight: () => {}, handleMagicPrompt: () => {}, handleApplyLowPoly: () => {}, handleExtractArt: () => {}, handleApplyDustAndScratch: () => {}, handleDenoise: () => {}, handleApplyFaceRecovery: () => {}, handleGenerateProfessionalPortrait: () => {}, handleRestorePhoto: () => {}, handleApplyUpscale: () => {}, handleUnblurImage: () => {}, handleApplySharpen: () => {}, handleApplyNewAspectRatio: () => {}, handleGenerativeEdit: async () => {}, handleObjectRemove: async () => {}, handleDetectObjects: async () => {}, handleDetectFaces: async () => {}, handleFaceRetouch: async () => {}, handleFaceSwap: async () => {}, handleSelectObject: () => {}, handleApplyLocalAdjustments: async () => {}, handleApplyCurve: () => {}, handleApplyStyle: () => {}, handleApplyAIAdjustment: () => {}, handleApplyText: async () => {}, handleGenerateVideo: () => {}, handleDownload: async () => {}, handleApplyTexture: async () => {}, handleVirtualTryOn: () => {}, handleFunkoPop: () => {}, handleStyledPortrait: async () => {}, handlePolaroid: async () => {}, handleConfidentStudio: () => {}, handleSuperheroFusion: () => {}, handleAIPortrait: async () => {}, handleEnhanceResolutionAndSharpness: () => {}, handleDoubleExposure: async () => '', handleCreativeFusion: async () => {}, generateAIPreview: async () => {}, commitAIPreview: async () => {}, handleMagicMontage: async () => {},
    };

    return <EditorContext.Provider value={contextValue}>{children}</EditorContext.Provider>;
};

export const useEditor = (): EditorContextType => {
    const context = useContext(EditorContext);
    if (!context) throw new Error('useEditor must be used within an EditorProvider');
    return context;
};