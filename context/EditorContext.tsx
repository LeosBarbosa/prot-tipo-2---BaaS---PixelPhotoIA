/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { createContext, useContext, useState, useRef, useCallback, useEffect, useMemo, ReactNode } from 'react';
import * as geminiService from '../services/geminiService';
import { usePanAndZoom } from '../hooks/usePanAndZoom';
import { useMaskCanvas } from '../hooks/useMaskCanvas';
import { 
    optimizeImage, 
    dataURLtoFile, 
    fileToDataURL, 
    createMaskFromBoundingBox, 
    frameToDataURL, 
    frameToFile
} from '../utils/imageUtils';
import { handleOrchestratorCall } from '../services/orchestrator';
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
    ProactiveSuggestionState,
    PreviewState,
    Trend,
    AdjustmentLayer,
    BlendMode,
    TexturePreviewState,
} from '../types';
import { type Crop, type PixelCrop } from 'react-image-crop';
import { hashFile, sha256 } from '../utils/cryptoUtils';
import { tools } from '../config/tools';

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
    const [activeTool, setActiveTool] = useState<ToolId | null>(null);
    const [activeTab, setActiveTab] = useState<TabId>('adjust');
    const [isLoading, setIsLoading] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [history, setHistory] = useState<LayerStateSnapshot[]>([]);
    const [historyIndex, setHistoryIndex] = useState(-1);
    const [toolHistory, setToolHistory] = useState<ToolId[]>([]);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
    const [isComparisonModalOpen, setIsComparisonModalOpen] = useState(false);
    const [isInlineComparisonActive, setIsInlineComparisonActive] = useState(false);
    const [proactiveSuggestion, setProactiveSuggestion] = useState<ProactiveSuggestionState | null>(null);
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
    const [crop, setCrop] = useState<Crop>();
    const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
    const [aspect, setAspect] = useState<number | undefined>();
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

    const canUndo = historyIndex > 0;
    const canRedo = historyIndex < history.length - 1;
    const currentSnapshot = history[historyIndex];
    const layers = currentSnapshot?.layers || [];
    const activeLayerId = currentSnapshot?.activeLayerId || null;
    const baseImageLayer = useMemo(() => layers.find(l => l.type === 'image') as ImageLayer | undefined, [layers]);
    const baseImageFile = useMemo(() => baseImageLayer?.file, [baseImageLayer]);
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
    
    const resetLocalFilters = useCallback(() => setLocalFilters(DEFAULT_LOCAL_FILTERS), []);
    const resetTextToolState = useCallback(() => setTextToolState(DEFAULT_TEXT_TOOL_STATE), []);
    
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
        const newHistory = history.slice(0, historyIndex + 1);
        const newSnapshot: LayerStateSnapshot = { layers: newLayers, activeLayerId: newActiveLayerId };
        setHistory([...newHistory, newSnapshot]);
        setHistoryIndex(newHistory.length);
        if (toolId) setToolHistory(prev => [...prev.slice(0, historyIndex), toolId]);
        onHistoryChange();
    }, [history, historyIndex, onHistoryChange]);

    const undo = useCallback(() => { if (canUndo) { setHistoryIndex(prev => prev - 1); onHistoryChange(); } }, [canUndo, onHistoryChange]);
    const redo = useCallback(() => { if (canRedo) { setHistoryIndex(prev => prev + 1); onHistoryChange(); } }, [canRedo, onHistoryChange]);
    const jumpToState = useCallback((index: number) => { if (index >= 0 && index < history.length) { setHistoryIndex(index); onHistoryChange(); } }, [history.length, onHistoryChange]);
    const resetHistory = useCallback(() => { if (historyIndex > 0) { setHistoryIndex(0); onHistoryChange(); } }, [historyIndex, onHistoryChange]);

    const setInitialImage = useCallback(async (file: File | null) => {
        if (!file) {
            setHistory([]); setHistoryIndex(-1); setToolHistory([]); setIsEditingSessionActive(false);
            return;
        }
        setIsLoading(true); 
        setLoadingMessage('Carregando imagem...');
        setError(null);
        setUploadProgress({ progress: 0, stage: 'reading' });

        try {
            const optimizedFile = await optimizeImage(file, setUploadProgress);
            const initialLayer: ImageLayer = { id: `layer_${Date.now()}`, name: 'Background', type: 'image', file: optimizedFile, isVisible: true, opacity: 100, blendMode: 'normal' };
            const snapshot: LayerStateSnapshot = { layers: [initialLayer], activeLayerId: initialLayer.id };
            setHistory([snapshot]); 
            setHistoryIndex(0); 
            setToolHistory([]); 
            setActiveTool(null); 
            setActiveTab('adjust'); 
            setIsEditingSessionActive(true);
            setToast({ message: 'Imagem carregada com sucesso!', type: 'success' });
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Falha ao processar a imagem.';
            setError(errorMessage);
            setToast({ message: errorMessage, type: 'error' });
        } finally {
            setIsLoading(false); 
            setLoadingMessage(null);
        }
    }, [
        setHistory, setHistoryIndex, setToolHistory, setIsEditingSessionActive, 
        setIsLoading, setLoadingMessage, setError, setUploadProgress, 
        setActiveTool, setActiveTab, setToast
    ]);

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
                    await db.clearHistoryDB(); // Limpa a sessão anterior
                } catch (e) {
                    console.error("Failed to clear DB:", e);
                    setToast({ message: "Não foi possível limpar a sessão anterior.", type: 'error' });
                }
                await setInitialImage(file); // Usa a mesma função de seleção de arquivo
                setHasRestoredSession(false);
                setProactiveSuggestion(null); 
            }
        };
    
        input.click();
    }, [setInitialImage, setHasRestoredSession, setProactiveSuggestion, setToast]);

    const executeTool = useCallback(async (toolId: ToolId, serviceCall: (file: File, ...args: any[]) => Promise<string>, loadingMsg: string, ...args: any[]) => {
        const fileToEdit = activeLayerFile;
        if (!fileToEdit) {
            setError("Nenhuma camada de imagem ativa para editar.");
            return;
        }
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
            setError(errorMessage);
            setToast({ message: errorMessage, type: 'error' });
        } finally {
            setIsLoading(false); setLoadingMessage(null);
        }
    }, [activeLayerFile, layers, activeLayerId, commitChange, setToast, setError, setIsLoading, setLoadingMessage]);

    const executeBaseImageReplacement = useCallback(async (
        toolId: ToolId,
        loadingMsg: string,
        serviceCall: () => Promise<string>
    ) => {
        setIsLoading(true);
        setLoadingMessage(loadingMsg);
        setError(null);
        try {
            const resultDataUrl = await serviceCall();
            const newFile = dataURLtoFile(resultDataUrl, `${toolId}-result.png`);
            const newLayers = layers.map(l => 
                l.id === activeLayerId ? { ...l, file: newFile } : l
            ) as Layer[];
            
            commitChange(newLayers, activeLayerId, toolId);
            setToast({ message: 'Edição aplicada!', type: 'success' });
            setIsInlineComparisonActive(true);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "Ocorreu um erro desconhecido.";
            setError(errorMessage);
            setToast({ message: errorMessage, type: 'error' });
        } finally {
            setIsLoading(false);
            setLoadingMessage(null);
        }
    }, [layers, activeLayerId, commitChange, setToast, setError, setIsLoading, setLoadingMessage]);
    
    const setActiveLayerId_callback = useCallback((id: string | null) => {
        if (id === activeLayerId) return;
        const currentSnapshot = history[historyIndex];
        if (!currentSnapshot) return;
        const newSnapshot: LayerStateSnapshot = { ...currentSnapshot, activeLayerId: id };
        const newHistory = [...history];
        newHistory[historyIndex] = newSnapshot;
        setHistory(newHistory);
    }, [activeLayerId, history, historyIndex]);

    const updateLayer = useCallback((layerId: string, updates: Partial<Layer>) => {
        const currentSnapshot = history[historyIndex];
        if (!currentSnapshot) return;
        const newLayers = currentSnapshot.layers.map(l => (l.id === layerId ? { ...l, ...updates } : l)) as Layer[];
        const newSnapshot: LayerStateSnapshot = { ...currentSnapshot, layers: newLayers };
        const newHistory = [...history];
        newHistory[historyIndex] = newSnapshot;
        setHistory(newHistory);
    }, [history, historyIndex]);

    const deleteLayer = useCallback((layerId: string | null) => {
        if (!layerId || layers.length <= 1) return;
        const newLayers = layers.filter(l => l.id !== layerId);
        const newActiveId = (activeLayerId === layerId) ? (newLayers[0]?.id || null) : activeLayerId;
        commitChange(newLayers, newActiveId);
    }, [layers, activeLayerId, commitChange]);

    const toggleLayerVisibility = useCallback((layerId: string) => {
        const newLayers = layers.map(l => l.id === layerId ? { ...l, isVisible: !l.isVisible } : l) as Layer[];
        commitChange(newLayers, activeLayerId);
    }, [layers, activeLayerId, commitChange]);

    const moveLayer = useCallback((layerId: string | null, direction: 'up' | 'down') => {
        if (!layerId) return;
        const index = layers.findIndex(l => l.id === layerId);
        if (index === -1) return;
        const newIndex = direction === 'up' ? index - 1 : index + 1;
        if (newIndex < 0 || newIndex >= layers.length) return;
        const newLayers = [...layers];
        const temp = newLayers[index];
        newLayers[index] = newLayers[newIndex];
        newLayers[newIndex] = temp;
        commitChange(newLayers, layerId);
    }, [layers, commitChange]);
    const moveLayerUp = (layerId: string | null) => moveLayer(layerId, 'up');
    const moveLayerDown = (layerId: string | null) => moveLayer(layerId, 'down');
    
    const handleRemoveBackground = () => executeTool('removeBg', geminiService.removeBackground, "Removendo fundo...");
    const handleRestorePhoto = (colorize: boolean) => executeTool('photoRestoration', (file) => geminiService.restorePhoto(file, colorize), "Restaurando foto...");
    const handleApplyUpscale = (factor: number, preserveFace: boolean) => executeTool('upscale', (file) => geminiService.upscaleImage(file, factor, preserveFace), `Aumentando resolução...`);
    const handleApplySharpen = (intensity: number) => executeTool('sharpen', (file) => geminiService.applyGenerativeSharpening(file, intensity), "Aplicando nitidez...");
    const handleRelight = (prompt: string) => executeTool('relight', (file) => geminiService.reacenderImage(file, prompt), "Reacendendo imagem...");
    const handleApplyStyle = (stylePrompt: string, applyToAll: boolean) => executeTool('style', (file) => geminiService.applyStyle(file, stylePrompt), "Aplicando estilo...");
    const handleUnblurImage = (sharpenLevel: number, denoiseLevel: number, model: string) => executeTool('unblur', (file) => geminiService.unblurImage(file, sharpenLevel, denoiseLevel, model), "Removendo desfoque...");
    const handleMagicPrompt = (prompt: string) => executeTool('magicMontage', (file) => handleOrchestratorCall(file, prompt), "Executando prompt mágico...");
    const handleApplyAIAdjustment = (prompt: string, applyToAll: boolean) => executeTool('adjust', (file) => geminiService.generateAdjustedImage(file, prompt), "Aplicando ajuste...");
    const handleGenerateProfessionalPortrait = (applyToAll: boolean = false) => executeTool('portraits', geminiService.generateProfessionalPortrait, "Gerando retrato...");
    const handleApplyLowPoly = () => executeTool('lowPoly', geminiService.generateLowPoly, "Aplicando Low Poly...");
    const handleExtractArt = () => executeTool('extractArt', geminiService.extractArt, "Extraindo arte...");
    const handleApplyDustAndScratch = () => executeTool('dustAndScratches', geminiService.applyDustAndScratch, "Aplicando poeira e arranhões...");
    const handleDenoise = () => executeTool('denoise', geminiService.denoiseImage, "Removendo ruído...");
    const handleApplyFaceRecovery = () => executeTool('faceRecovery', geminiService.applyFaceRecovery, "Recuperando rosto...");
    const handleApplyNewAspectRatio = () => executeTool('newAspectRatio', (file) => geminiService.outpaintImage(file, "Expandir a imagem criativamente", '16:9'), "Ajustando proporção...");
    const handleEnhanceResolutionAndSharpness = (factor: number, intensity: number, preserveFace: boolean) => executeTool('superResolution', (file) => geminiService.enhanceResolutionAndSharpness(file, factor, intensity, preserveFace), "Aplicando super resolução...");
    const handleMagicMontage = useCallback(async (mainImage: File, prompt: string, secondImage?: File) => {
        setIsLoading(true);
        setLoadingMessage("Realizando a mágica...");
        setError(null);
        try {
            const resultDataUrl = await geminiService.generateMagicMontage(mainImage, prompt, secondImage);
            const newFile = dataURLtoFile(resultDataUrl, `montage-result.png`);
            const newLayers = layers.map(l => (l.id === activeLayerId ? { ...l, file: newFile } : l)) as Layer[];
            commitChange(newLayers, activeLayerId, 'magicMontage');
            setToast({ message: 'Montagem aplicada!', type: 'success' });
            setIsInlineComparisonActive(true);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "Ocorreu um erro desconhecido.";
            setError(errorMessage);
            setToast({ message: errorMessage, type: 'error' });
        } finally {
            setIsLoading(false);
            setLoadingMessage(null);
        }
    }, [layers, activeLayerId, commitChange, setToast, setError, setIsLoading, setLoadingMessage]);

    const handleApplyCrop = useCallback(() => {
        if (!completedCrop || !imgRef.current || !activeLayerFile) return;
        const image = imgRef.current;
        const canvas = document.createElement('canvas');
        const scaleX = image.naturalWidth / image.width;
        const scaleY = image.naturalHeight / image.height;
        canvas.width = completedCrop.width;
        canvas.height = completedCrop.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        const tempImage = new Image();
        tempImage.onload = () => {
            ctx.drawImage(tempImage, completedCrop.x * scaleX, completedCrop.y * scaleY, completedCrop.width * scaleX, completedCrop.height * scaleY, 0, 0, completedCrop.width, completedCrop.height);
            const newFile = dataURLtoFile(canvas.toDataURL(), 'cropped.png');
            const newLayers = layers.map(l => (l.id === activeLayerId && l.type === 'image') ? { ...l, file: newFile } : l);
            commitChange(newLayers, activeLayerId, 'crop');
        }
        tempImage.src = URL.createObjectURL(activeLayerFile);
    }, [completedCrop, imgRef, layers, activeLayerId, commitChange, activeLayerFile]);

    const handleTransform = useCallback(async (transformType: TransformType) => {
        if (!activeLayerFile) return;
        const image = await loadImage(URL.createObjectURL(activeLayerFile));
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        if (transformType === 'rotate-left' || transformType === 'rotate-right') {
            canvas.width = image.height; canvas.height = image.width;
            ctx.translate(canvas.width / 2, canvas.height / 2);
            ctx.rotate(transformType === 'rotate-left' ? -Math.PI / 2 : Math.PI / 2);
            ctx.drawImage(image, -image.width / 2, -image.height / 2);
        } else {
            canvas.width = image.width; canvas.height = image.height;
            if (transformType === 'flip-h') { ctx.translate(image.width, 0); ctx.scale(-1, 1); } 
            else { ctx.translate(0, image.height); ctx.scale(1, -1); }
            ctx.drawImage(image, 0, 0);
        }
        const newFile = dataURLtoFile(canvas.toDataURL(), 'transformed.png');
        const newLayers = layers.map(l => (l.id === activeLayerId && l.type === 'image') ? { ...l, file: newFile } : l);
        commitChange(newLayers, activeLayerId, 'crop');
    }, [activeLayerFile, layers, activeLayerId, commitChange]);

    const handleApplyLocalAdjustments = useCallback(async (applyToAll: boolean) => {
        if (!activeLayerFile || !maskDataUrl || !hasLocalAdjustments) {
            setToast({ message: 'Nenhuma área selecionada ou nenhum ajuste para aplicar.', type: 'info' });
            return;
        }
        setIsLoading(true); setLoadingMessage('Aplicando ajustes locais...'); setError(null);
        try {
            const imageUrl = URL.createObjectURL(activeLayerFile);
            const filterString = buildFilterString(localFilters);
            const resultDataUrl = await applyFiltersToMaskedArea(imageUrl, maskDataUrl, filterString);
            URL.revokeObjectURL(imageUrl);
            const newFile = dataURLtoFile(resultDataUrl, 'local-adjustment.png');
            const newLayers = layers.map(l => (l.id === activeLayerId && l.type === 'image') ? { ...l, file: newFile } : l) as Layer[];
            commitChange(newLayers, activeLayerId, 'localAdjust');
            setToast({ message: "Ajustes locais aplicados!", type: 'success' });
            setIsInlineComparisonActive(true);
            resetLocalFilters(); clearMask();
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "Falha ao aplicar ajustes locais.";
            setError(errorMessage);
            setToast({ message: errorMessage, type: 'error' });
            throw err;
        } finally {
            setIsLoading(false); setLoadingMessage(null);
        }
    }, [activeLayerFile, maskDataUrl, hasLocalAdjustments, buildFilterString, localFilters, layers, activeLayerId, commitChange, resetLocalFilters, clearMask, setToast, setError, setIsLoading, setLoadingMessage]);

    const handleVirtualTryOn = (personImage: File, clothingImage: File, shoeImage: File | undefined, scenePrompt: string, posePrompt: string, cameraLens: string, cameraAngle: string, lightingStyle: string, negativePrompt: string) => {
        executeBaseImageReplacement('tryOn', "Montando o estúdio e vestindo o modelo...", () => geminiService.virtualTryOn(personImage, clothingImage, shoeImage, scenePrompt, posePrompt, cameraLens, cameraAngle, lightingStyle, negativePrompt));
    };

    const handleAIPortrait = async (styleId: string, personImages: File[], prompt: string) => {
        if (personImages.length === 0) return;
        setIsLoading(true); setLoadingMessage("Gerando retrato..."); setError(null);
        try {
            let result;
            const firstImage = personImages[0];
            switch (styleId) {
                case 'caricature': result = await geminiService.generateCaricature(personImages, prompt); break;
                case 'pixar': result = await geminiService.applyDisneyPixarStyle(firstImage, prompt); break;
                case '3d': result = await geminiService.generate3DMiniature(firstImage, prompt); break;
                case 'yearbook90s': result = await geminiService.generate90sYearbookPortrait(firstImage, prompt); break;
                default: throw new Error("Estilo de retrato inválido");
            }
            const newFile = dataURLtoFile(result, 'ai-portrait.png');
            const newLayers = layers.map(l => l.id === activeLayerId ? { ...l, file: newFile } : l) as Layer[];
            commitChange(newLayers, activeLayerId, 'aiPortraitStudio');
        } catch (err) {
            setError(err instanceof Error ? err.message : "Erro desconhecido");
        } finally {
            setIsLoading(false); setLoadingMessage(null);
        }
    };
    
    const handleFunkoPop = (mainImage: File, personImage: File | null, bg: string, obj: string, light: string, type: string, finish: string) => {
        executeBaseImageReplacement('funkoPopStudio', "Criando seu Funko Pop...", () => geminiService.generateMagicMontage(mainImage, `Fundo: ${bg}. Objeto: ${obj}. Iluminação: ${light}. Tipo: ${type}. Acabamento: ${finish}`, personImage ?? undefined));
    };

    const handleDoubleExposure = async (portraitImage: File, landscapeImage: File): Promise<string> => {
        return geminiService.generateDoubleExposure(portraitImage, landscapeImage);
    };
    
    const handleSuperheroFusion = (userImage: File, heroImage: File) => {
        executeBaseImageReplacement('superheroFusion', 'Criando seu alter ego...', () => geminiService.generateSuperheroFusion(userImage, heroImage));
    };
    
    const handleDetectObjects = useCallback(async (objectPrompt?: string) => {
        if (!baseImageFile) { setError("Nenhuma imagem base carregada para detectar objetos."); setToast({ message: 'Carregue uma imagem primeiro.', type: 'error' }); return; }
        setIsLoading(true); setLoadingMessage("Detectando objetos com IA..."); setError(null); setDetectedObjects(null);
        try {
            const detectionPrompt = objectPrompt && objectPrompt.trim() ? `Detect all instances of '${objectPrompt}' in this image. Provide their labels and normalized bounding boxes.` : "Detect up to 5 of the most prominent objects in this image, ranked by visual importance. Provide their labels and normalized bounding boxes.";
            const objects = await geminiService.detectObjects(baseImageFile, detectionPrompt);
            setDetectedObjects(objects);
            if (objects.length === 0) { setToast({ message: `Nenhum objeto encontrado${objectPrompt ? ` para '${objectPrompt}'` : ''}.`, type: 'info' }); } else { setToast({ message: `${objects.length} objeto(s) detectado(s).`, type: 'success' }); }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "Falha ao detectar objetos.";
            setError(errorMessage); setToast({ message: errorMessage, type: 'error' });
        } finally {
            setIsLoading(false); setLoadingMessage(null);
        }
    }, [baseImageFile, setError, setToast, setIsLoading, setLoadingMessage, setDetectedObjects]);

    const handleDetectFaces = useCallback(async () => {
        if (!baseImageFile) { setError("Nenhuma imagem base carregada para detectar rostos."); setToast({ message: 'Carregue uma imagem primeiro.', type: 'error' }); return; }
        setIsLoading(true); setLoadingMessage("Detectando rostos com IA..."); setError(null); setDetectedObjects(null);
        try {
            const faces = await geminiService.detectFaces(baseImageFile);
            setDetectedObjects(faces);
            if (faces.length === 0) { setToast({ message: 'Nenhum rosto foi detectado na imagem.', type: 'info' }); } else { setToast({ message: `${faces.length} rosto(s) detectado(s).`, type: 'success' }); }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "Falha ao detectar rostos.";
            setError(errorMessage); setToast({ message: errorMessage, type: 'error' });
        } finally {
            setIsLoading(false); setLoadingMessage(null);
        }
    }, [baseImageFile, setError, setToast, setIsLoading, setLoadingMessage, setDetectedObjects]);

    const handleSelectObject = useCallback((object: DetectedObject) => {
        if (!imgRef.current) return;
        setHighlightedObject(object);
        const { naturalWidth, naturalHeight } = imgRef.current;
        const mask = createMaskFromBoundingBox(object.box, naturalWidth, naturalHeight);
        setMaskDataUrl(mask);
    }, [imgRef, setMaskDataUrl, setHighlightedObject]);
    
    const handleFaceSwap = useCallback(async (sourceImage: File, userPrompt: string) => {
        if (!baseImageFile || !maskDataUrl) { setError("Selecione um rosto na imagem de destino primeiro."); setToast({ message: 'Selecione o rosto que você deseja substituir.', type: 'error' }); return; }
        setIsLoading(true); setLoadingMessage("Realizando a troca de rosto..."); setError(null);
        try {
            const maskFile = dataURLtoFile(maskDataUrl, 'mask.png');
            const resultDataUrl = await geminiService.faceSwap(baseImageFile, maskFile, sourceImage, userPrompt);
            const newFile = dataURLtoFile(resultDataUrl, 'face-swap-result.png');
            const newLayers = layers.map(l => (l.id === activeLayerId ? { ...l, file: newFile } : l)) as Layer[];
            commitChange(newLayers, activeLayerId, 'faceSwap');
            setToast({ message: "Troca de rosto concluída!", type: 'success' });
            setIsInlineComparisonActive(true);
            setDetectedObjects(null); clearMask();
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "Ocorreu um erro desconhecido durante a troca de rosto.";
            setError(errorMessage); setToast({ message: errorMessage, type: 'error' });
        } finally {
            setIsLoading(false); setLoadingMessage(null);
        }
    }, [baseImageFile, maskDataUrl, layers, activeLayerId, commitChange, clearMask, setToast, setError, setIsLoading, setLoadingMessage, setDetectedObjects, setIsInlineComparisonActive]);


    const generateAIPreview_callback = useCallback(async (trend: Trend, applyToAll: boolean) => {
        if (!activeLayerFile) {
            setToast({ message: "Por favor, selecione uma camada de imagem para gerar a pré-visualização.", type: 'error' });
            return;
        }
        setIsPreviewLoading(true);
        setPreviewState(null);
        setError(null);
        try {
            let resultUrl;
            if (trend.type === 'descriptive') {
                resultUrl = await geminiService.generateImageWithDescription(activeLayerFile, trend.prompt);
            } else {
                resultUrl = await geminiService.applyStyle(activeLayerFile, trend.prompt);
            }
            setPreviewState({ url: resultUrl, trend, applyToAll });
        } catch (e) {
            const errorMessage = e instanceof Error ? e.message : 'Falha ao gerar pré-visualização.';
            setError(errorMessage);
            setToast({ message: errorMessage, type: 'error' });
        } finally {
            setIsPreviewLoading(false);
        }
    }, [activeLayerFile, setToast, setIsPreviewLoading, setPreviewState, setError]);

    const commitAIPreview_callback = useCallback(async () => {
        if (!previewState) return;
        setIsLoading(true); setLoadingMessage('Aplicando estilo...'); setError(null);
        try {
            const newFile = dataURLtoFile(previewState.url, `trend-${Date.now()}.png`);
            const newLayers = layers.map(l => l.id === activeLayerId ? { ...l, file: newFile } : l) as Layer[];
            commitChange(newLayers, activeLayerId, 'trends');
            setToast({ message: 'Estilo aplicado com sucesso!', type: 'success' });
            setPreviewState(null);
            setIsInlineComparisonActive(true);
        } catch (e) {
            const errorMessage = e instanceof Error ? e.message : 'Falha ao aplicar o estilo da pré-visualização.';
            setError(errorMessage);
            setToast({ message: errorMessage, type: 'error' });
        } finally {
            setIsLoading(false); setLoadingMessage(null);
        }
    }, [previewState, layers, activeLayerId, commitChange, setToast, setPreviewState, setIsInlineComparisonActive, setIsLoading, setLoadingMessage, setError]);

    const handleCreativeFusion = useCallback(async (compositionImage: File, styleImages: File[]) => {
        setIsLoading(true); setError(null); setLoadingMessage('Verificando cache...');
        try {
            const compHash = await hashFile(compositionImage);
            const styleHashes = await Promise.all(styleImages.map(f => hashFile(f)));
            const cacheKey = `creativeFusion:${compHash}:${styleHashes.join('-')}`;
            let resultDataUrl: string;
            const cachedBlob = await db.loadImageFromCache(cacheKey);
            if (cachedBlob) {
                resultDataUrl = await fileToDataURL(cachedBlob as File);
                setToast({ message: 'Imagem carregada do cache!', type: 'info' });
            } else {
                setLoadingMessage('Criando fusão artística...');
                resultDataUrl = await geminiService.fuseImages(compositionImage, styleImages);
                try {
                    const fileToCache = dataURLtoFile(resultDataUrl, 'cached.png');
                    await db.saveImageToCache(cacheKey, fileToCache);
                } catch (cacheError) {
                    console.warn("Falha ao salvar a imagem no cache:", cacheError);
                }
            }
            const newFile = dataURLtoFile(resultDataUrl, `fusion-result.png`);
            const newLayers = layers.map(l => (l.id === activeLayerId ? { ...l, file: newFile } : l)) as Layer[];
            commitChange(newLayers, activeLayerId, 'creativeFusion');
            setToast({ message: 'Fusão aplicada!', type: 'success' });
            setIsInlineComparisonActive(true);
            setActiveTool(null);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "Ocorreu um erro desconhecido.";
            setError(errorMessage);
            setToast({ message: errorMessage, type: 'error' });
        } finally {
            setIsLoading(false);
            setLoadingMessage(null);
        }
    }, [layers, activeLayerId, commitChange, setToast, setError, setIsLoading, setLoadingMessage, setActiveTool, setIsInlineComparisonActive]);

    const handleGenerativeEdit = useCallback(async () => {
        executeTool('generativeEdit', (file, p) => geminiService.generativeEdit(file, p, { maskImage: maskDataUrl ? dataURLtoFile(maskDataUrl, 'mask.png') : undefined }), 'Aplicando edição generativa...', prompt);
    }, [executeTool, prompt, maskDataUrl]);

    const handleObjectRemove = useCallback(async () => {
        executeTool('objectRemover', (file) => geminiService.generativeEdit(file, 'Remova o objeto ou pessoa na área mascarada e preencha o fundo de forma realista', { maskImage: maskDataUrl ? dataURLtoFile(maskDataUrl, 'mask.png') : undefined }), 'Removendo objeto...');
    }, [executeTool, maskDataUrl]);

    const handleFaceRetouch = useCallback(async () => {
        executeTool('portraits', (file) => geminiService.retouchFace(file, dataURLtoFile(maskDataUrl!, 'mask.png')), 'Retocando rosto...');
    }, [executeTool, maskDataUrl]);
    
    const handleApplyCurve = useCallback((lut: number[]) => {
        // This is a complex operation that needs to be implemented
    }, []);

    const handleApplyText = useCallback(async () => {
        // This needs implementation
    }, []);
    
    const handleGenerateVideo = useCallback((prompt: string, aspectRatio: VideoAspectRatio) => {
        // This needs implementation
    }, []);
    
    const handleDownload = useCallback(async () => {
        // This needs implementation
    }, []);

    const handleApplyTexture = useCallback(async () => {
        // This needs implementation
    }, []);
    
    const handleConfidentStudio = useCallback((personImage: File, mainPrompt: string, negativePrompt: string) => {
        executeBaseImageReplacement('confidentStudio', "Gerando retrato de estúdio...", () => geminiService.generateStudioPortrait(personImage, mainPrompt, negativePrompt));
    }, [executeBaseImageReplacement]);

    const handlePolaroid = useCallback(async (personImage: File, celebrityImage: File, negativePrompt: string) => {
        await executeBaseImageReplacement('polaroid', "Gerando Polaroid...", () => geminiService.generatePolaroidWithCelebrity(personImage, celebrityImage, negativePrompt));
    }, [executeBaseImageReplacement]);

    const handleStyledPortrait = useCallback(async (personImage: File, styleImages: File[], prompt: string, negativePrompt: string) => {
        await executeBaseImageReplacement('styledPortrait', "Gerando retrato estilizado...", () => geminiService.generateStyledPortrait(personImage, styleImages, prompt, negativePrompt));
    }, [executeBaseImageReplacement]);

    const addWorkflow = useCallback((workflow: Workflow) => {
        setSavedWorkflows(prev => [...prev, workflow]);
        db.addWorkflow(workflow);
    }, []);

    const addPromptToHistory = useCallback((p: string) => {
        setPromptHistory(prev => [p, ...prev.slice(0, 49)]);
    }, []);

    const executeWorkflow = useCallback((toolIds: ToolId[]) => {
        // Placeholder for workflow execution logic
        setToast({ message: `Executando fluxo de trabalho com ${toolIds.length} ferramentas.`, type: 'info' });
    }, [setToast]);

    const handlePredefinedSearchAction = useCallback((action: PredefinedSearch['action']) => {
        if (action.type === 'tool') {
            setActiveTool(action.payload as ToolId);
        } else if (action.type === 'workflow') {
            executeWorkflow(action.payload as ToolId[]);
        }
    }, [setActiveTool, executeWorkflow]);
    
    const handleSmartSearch = useCallback(async (term: string) => {
        setIsSmartSearching(true);
        setSmartSearchResult(null);
        try {
            const result = await geminiService.suggestToolFromPrompt(term);
            if (result) {
                // FIX: Look up the full tool configuration from the tools array to ensure type safety and complete tool data.
                const toolConfig = tools.find(tool => tool.id === result.name);
                if (toolConfig) {
                    setSmartSearchResult({ tool: toolConfig, args: result.args });
                } else {
                    console.warn(`Smart search returned an unknown tool: ${result.name}`);
                    setToast({ message: `A IA sugeriu uma ferramenta desconhecida: '${result.name}'.`, type: 'error' });
                }
            } else {
                setToast({ message: 'A IA não sugeriu uma ferramenta. Tente a busca normal.', type: 'info' });
            }
        } catch (e) {
            setToast({ message: e instanceof Error ? e.message : 'Erro na busca inteligente.', type: 'error' });
        } finally {
            setIsSmartSearching(false);
        }
    }, [setToast]);
    
    const contextValue: EditorContextType = {
        activeTool, setActiveTool, activeTab, setActiveTab, isLoading, setIsLoading, loadingMessage, setLoadingMessage, error, setError, isComparisonModalOpen, setIsComparisonModalOpen, isInlineComparisonActive, setIsInlineComparisonActive, toast, setToast, proactiveSuggestion, setProactiveSuggestion, uploadProgress, setUploadProgress, isSaveWorkflowModalOpen, setIsSaveWorkflowModalOpen, isLeftPanelVisible, setIsLeftPanelVisible, isRightPanelVisible, setIsRightPanelVisible, theme, toggleTheme: () => setTheme(t => t === 'dark' ? 'light' : 'dark'), layers, activeLayerId, setActiveLayerId: setActiveLayerId_callback, baseImageFile, currentImageUrl, compositeCssFilter, originalImageUrl, imgRef, setInitialImage, hasRestoredSession, isEditingSessionActive, setIsEditingSessionActive, updateLayer, deleteLayer, toggleLayerVisibility, mergeDownLayer: () => {}, moveLayerUp, moveLayerDown, history, historyIndex, canUndo, canRedo, undo, redo, jumpToState, resetHistory, toolHistory, commitChange, isGif, gifFrames, currentFrameIndex, setCurrentFrameIndex, zoom, setZoom, panOffset, isPanModeActive, setIsPanModeActive, isCurrentlyPanning, handleWheel, handlePanStart, handleTouchStart, handleTouchMove, handleTouchEnd, resetZoomAndPan, crop, setCrop, completedCrop, setCompletedCrop, aspect, setAspect, canvasRef, maskDataUrl, setMaskDataUrl, brushSize, setBrushSize, clearMask, startDrawing, stopDrawing, draw, detectedObjects, setDetectedObjects, highlightedObject, setHighlightedObject, localFilters, setLocalFilters, hasLocalAdjustments, buildFilterString, resetLocalFilters, histogram, previewState, setPreviewState, isPreviewLoading, textToolState, setTextToolState, resetTextToolState, generatedVideoUrl, setGeneratedVideoUrl, texturePreview, setTexturePreview, isSmartSearching, smartSearchResult, setSmartSearchResult, savedWorkflows, addWorkflow, recentTools, promptHistory, addPromptToHistory, executeWorkflow, handlePredefinedSearchAction, handleSmartSearch, handleFileSelect: setInitialImage, handleGoHome, handleTriggerUpload, handleExplicitSave: async () => {}, handleApplyCrop, handleTransform, handleRemoveBackground, handleRelight, handleMagicPrompt, handleApplyLowPoly, handleExtractArt, handleApplyDustAndScratch, handleDenoise, handleApplyFaceRecovery, handleGenerateProfessionalPortrait, handleRestorePhoto, handleApplyUpscale, handleUnblurImage, handleApplySharpen, handleApplyNewAspectRatio, handleGenerativeEdit, handleObjectRemove, handleDetectObjects, handleDetectFaces, handleFaceRetouch, handleFaceSwap, handleSelectObject, handleApplyLocalAdjustments, handleApplyCurve, handleApplyStyle, handleApplyAIAdjustment, handleApplyText, handleGenerateVideo, handleDownload, handleApplyTexture, handleVirtualTryOn, handleFunkoPop, handleStyledPortrait, handlePolaroid, handleConfidentStudio, handleSuperheroFusion, handleAIPortrait, handleEnhanceResolutionAndSharpness, handleDoubleExposure, handleCreativeFusion, prompt, setPrompt, generateAIPreview: generateAIPreview_callback, commitAIPreview: commitAIPreview_callback, initialPromptFromMetadata,
        handleMagicMontage,
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