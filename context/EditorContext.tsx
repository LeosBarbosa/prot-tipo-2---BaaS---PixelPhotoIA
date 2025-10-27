/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, {
  createContext,
  useContext,
  useState,
  useRef,
  useCallback,
  useEffect,
  ReactNode,
  // FIX: Add 'useMemo' to the import list.
  useMemo,
} from 'react';
import {
  type FilterState,
  type ToolId,
  type TabId,
  type Toast,
  type Layer,
  type ImageLayer,
  type DetectedObject,
  type TextToolState,
  type ProactiveSuggestionConfig,
  type TexturePreviewState,
  type PreviewState,
  type GifFrame,
  type Workflow,
  type SmartSearchResult,
  type VideoAspectRatio,
  type TransformType,
  type UploadProgressStatus,
  type PixelCrop,
  type Trend,
  type LayerStateSnapshot,
  type ToolHistoryItem,
  type EditorContextType,
} from '../types';
import * as db from '../utils/db';
import { useHistoryState } from '../hooks/useHistoryState';
import { usePanAndZoom } from '../hooks/usePanAndZoom';
import { useMaskCanvas } from '../hooks/useMaskCanvas';
import { buildFilterString, dataURLtoFile, getCroppedImg } from '../utils/imageUtils';
import * as geminiService from '../services/geminiService';
import { createMaskFromBoundingBox } from '../utils/imageProcessing';

export const DEFAULT_LOCAL_FILTERS: FilterState = {
  brightness: 100,
  contrast: 100,
  saturate: 100,
  grayscale: 0,
  sepia: 0,
  hueRotate: 0,
  invert: 0,
  blur: 0,
  curve: undefined,
};

const DEFAULT_TEXT_TOOL_STATE: TextToolState = {
  content: 'Texto de Exemplo',
  fontFamily: 'Impact',
  fontSize: 10,
  color: '#FFFFFF',
  align: 'center',
  bold: false,
  italic: false,
  position: { x: 50, y: 50 },
};


const EditorContext = createContext<EditorContextType | undefined>(undefined);

// FIX: Export useEditor hook for components to consume context.
export const useEditor = () => {
    const context = useContext(EditorContext);
    if (context === undefined) {
      throw new Error('useEditor must be used within an EditorProvider');
    }
    return context;
};

export const EditorProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    // Implement all the states and stub the functions
    const [isEditingSessionActive, setIsEditingSessionActive] = useState(false);
    const [baseImageFile, setBaseImageFile] = useState<File | null>(null);
    const [uploadedFile, setUploadedFile] = useState<File | null>(null);
    const [isGif, setIsGif] = useState(false);
    const [gifFrames, setGifFrames] = useState<GifFrame[]>([]);
    const [isLeftPanelVisible, setIsLeftPanelVisible] = useState(true);
    const [isRightPanelVisible, setIsRightPanelVisible] = useState(true);
    const [theme, setTheme] = useState<'dark' | 'light'>('dark');
    const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);
    const [isComparisonModalOpen, setIsComparisonModalOpen] = useState(false);
    const [isInlineComparisonActive, setIsInlineComparisonActive] = useState(false);
    const [isSaveWorkflowModalOpen, setIsSaveWorkflowModalOpen] = useState(false);
    const [activeTab, setActiveTabInternal] = useState<TabId>('crop');
    const [toast, setToast] = useState<Toast | null>(null);
    const [activeTool, setActiveTool] = useState<ToolId | null>(null);
    const [isSmartSearching, setIsSmartSearching] = useState(false);
    const [smartSearchResult, setSmartSearchResult] = useState<SmartSearchResult | null>(null);
    const [hasRestoredSession, setHasRestoredSession] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [loadingMessage, setLoadingMessage] = useState<string | null>(null);
    const [crop, setCrop] = useState<PixelCrop>();
    const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
    const [aspect, setAspect] = useState<number | undefined>();
    const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null);
    const [detectedObjects, setDetectedObjects] = useState<DetectedObject[] | null>(null);
    const [highlightedObject, setHighlightedObject] = useState<DetectedObject | null>(null);
    const [localFilters, setLocalFilters] = useState<FilterState>(DEFAULT_LOCAL_FILTERS);
    const [textToolState, setTextToolState] = useState<TextToolState>(DEFAULT_TEXT_TOOL_STATE);
    const [texturePreview, setTexturePreview] = useState<TexturePreviewState | null>(null);
    const [brushSize, setBrushSize] = useState(40);
    const [cloneSource, setCloneSource] = useState<{ x: number; y: number } | null>(null);
    const [cloneStrokeStart, setCloneStrokeStart] = useState<{ x: number, y: number } | null>(null);
    const [isEditCompleted, setIsEditCompleted] = useState(false);
    const [prompt, setPrompt] = useState('');
    const [histogram, setHistogram] = useState(null);
    const [initialPromptFromMetadata, setInitialPromptFromMetadata] = useState('');
    const [savedWorkflows, setSavedWorkflows] = useState<Workflow[]>([]);
    const [recentTools, setRecentTools] = useState<ToolId[]>([]);
    const [isBatchProcessing, setIsBatchProcessing] = useState(false);
    const [batchProgress, setBatchProgress] = useState<{ current: number; total: number; } | null>(null);
    const [voiceState, setVoiceState] = useState<'IDLE' | 'CONNECTING' | 'CONNECTED' | 'DISCONNECTED' | 'ERROR'>('IDLE');
    const [voiceTranscript, setVoiceTranscript] = useState<{ source: 'user' | 'ia' | 'system'; text: string; }[]>([]);
    const [proactiveSuggestion, setProactiveSuggestion] = useState<ProactiveSuggestionConfig | null>(null);
    const [showOnboarding, setShowOnboarding] = useState(false);
    const [backgroundColor, setBackgroundColor] = useState('#090A0F');
    const [uploadProgress, setUploadProgress] = useState<UploadProgressStatus | null>(null);
    const [currentFrameIndex, setCurrentFrameIndex] = useState(0);
    const [isBrushActive, setIsBrushActive] = useState(false);
    // FIX: Define missing state variables for preview functionality.
    const [isPreviewLoading, setIsPreviewLoading] = useState(false);
    const [previewState, setPreviewState] = useState<PreviewState | null>(null);

    const imgRef = useRef<HTMLImageElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const { history, historyIndex, currentState, canUndo, canRedo, commitChange, undo, redo, jumpToState, resetHistory, toolHistory } = useHistoryState(baseImageFile);
    const { zoom, setZoom, panOffset, isPanModeActive, setIsPanModeActive, handleWheel, handlePanStart, resetZoomAndPan, isCurrentlyPanning, handleTouchStart, handleTouchMove, handleTouchEnd } = usePanAndZoom();
    const { maskDataUrl, setMaskDataUrl, clearMask, startDrawing, stopDrawing, draw } = useMaskCanvas(canvasRef, brushSize);
    
    const setActiveTab = useCallback((tabId: TabId) => {
        setIsBrushActive(false); // Desativa o pincel ao trocar de ferramenta
        setActiveTabInternal(tabId);
    }, []);

    // FIX: Implement setInitialImage
    const setInitialImage = useCallback((file: File) => {
        setBaseImageFile(file);
        resetHistory(file);
    }, [resetHistory]);

    // Dummy functions
    const handleGoHome = () => setIsEditingSessionActive(false);
    const handleUploadNew = () => { console.log('handleUploadNew'); };
    const handleExplicitSave = () => { console.log('handleExplicitSave'); };
    const toggleTheme = () => setTheme(theme === 'dark' ? 'light' : 'dark');
    const handleDownload = (format: 'png' | 'jpeg', quality?: number) => { console.log('handleDownload', format, quality); };
    const handleSmartSearch = (prompt: string) => { console.log('handleSmartSearch', prompt); };
    const handleFileSelect = (file: File) => { console.log('handleFileSelect', file); setUploadedFile(file)};
    const handleRemoveBackground = () => { console.log('handleRemoveBackground'); };
    const handleApplyUpscale = (factor: number, preserveFace: boolean) => { console.log('handleApplyUpscale', factor, preserveFace); };
    const handleRelight = (prompt: string) => { console.log('handleRelight', prompt); };
    const handleApplyLowPoly = () => { console.log('handleApplyLowPoly'); };
    const handleApplyDustAndScratch = () => { console.log('handleApplyDustAndScratch'); };
    const handleExtractArt = () => { console.log('handleExtractArt'); };
    const handleDenoise = () => { console.log('handleDenoise'); };
    const handleApplyFaceRecovery = () => { console.log('handleApplyFaceRecovery'); };
    const handleUnblurImage = (sharpenLevel: number, denoiseLevel: number, model: string) => { console.log('handleUnblurImage', sharpenLevel, denoiseLevel, model); };
    const handleApplySharpen = (intensity: number) => { console.log('handleApplySharpen', intensity); };
    const handleApplyStyle = (stylePrompt: string, applyToAll: boolean) => { console.log('handleApplyStyle', stylePrompt, applyToAll); };
    const generateAIPreview = (trend: any, applyToAll: boolean) => { console.log('generateAIPreview', trend, applyToAll); };
    const commitAIPreview = () => { console.log('commitAIPreview'); };
    const handleDetectObjects = (prompt?: string) => { console.log('handleDetectObjects', prompt); };
    const handleAnalyzeImage = async (question: string) => { console.log('handleAnalyzeImage', question); return 'Analysis result'; };
    const resetTextToolState = useCallback(() => setTextToolState(DEFAULT_TEXT_TOOL_STATE), []);
    const handleApplyCurve = (lut: number[]) => { console.log('handleApplyCurve', lut); };
    const addPromptToHistory = (prompt: string) => { console.log('addPromptToHistory', prompt); };
    const handleGenerateVideo = (prompt: string, aspectRatio: VideoAspectRatio) => { console.log('handleGenerateVideo', prompt, aspectRatio); };
    const handleMagicPrompt = (prompt: string) => { console.log('handleMagicPrompt', prompt); };
    const handleRestorePhoto = (colorize: boolean) => { console.log('handleRestorePhoto', colorize); };
    const handleApplyLocalAdjustments = async (filters: FilterState) => { console.log('handleApplyLocalAdjustments', filters); };
    const resetLocalFilters = () => setLocalFilters(DEFAULT_LOCAL_FILTERS);
    // FIX: Define missing function handleApplyAIAdjustment.
    const handleApplyAIAdjustment = (prompt: string, applyToAll: boolean) => { console.log('handleApplyAIAdjustment', prompt, applyToAll); };
    const handleApplyNewAspectRatio = () => { console.log('handleApplyNewAspectRatio'); };
    const handleEditTextWithPrompt = (prompt: string) => { console.log('handleEditTextWithPrompt', prompt); };
    const addWorkflow = (workflow: Workflow) => { console.log('addWorkflow', workflow); };
    const executeWorkflow = (toolIds: ToolId[]) => { console.log('executeWorkflow', toolIds); };
    const handlePredefinedSearchAction = (action: { type: 'tool' | 'workflow'; payload: ToolId | ToolId[]; }) => { console.log('handlePredefinedSearchAction', action); };
    const handleMagicScenery = async (objectFile: File, sceneryPrompt: string) => { console.log('handleMagicScenery', objectFile, sceneryPrompt); };
    const handleApplyClone = () => { console.log('handleApplyClone'); };
    const toggleLayerVisibility = (layerId: string) => { console.log('toggleLayerVisibility', layerId); };
    const deleteLayer = (layerId: string | null) => { console.log('deleteLayer', layerId); };
    const updateLayer = (layerId: string, updates: Partial<Layer>) => { console.log('updateLayer', layerId, updates); };
    const mergeDownLayer = (layerId: string | null) => { console.log('mergeDownLayer', layerId); };
    const moveLayerUp = (layerId: string | null) => { console.log('moveLayerUp', layerId); };
    const moveLayerDown = (layerId: string | null) => { console.log('moveLayerDown', layerId); };
    const reorderLayer = (dragIndex: number, hoverIndex: number) => { console.log('reorderLayer', dragIndex, hoverIndex); };
    const addPlaceholderLayer = async (prompt: string) => { console.log('addPlaceholderLayer', prompt); };
    const handleAIPortrait = (style: string, personImages: File[], prompt: string) => { console.log('handleAIPortrait', style, personImages, prompt); };
    const handleConfidentStudio = (imageFile: File, mainPrompt: string, negativePrompt: string) => { console.log('handleConfidentStudio', imageFile, mainPrompt, negativePrompt); };
    const handleFunkoPop = (mainImageFile: File, personImage: File | null, bgDescription: string, objectDescription: string, lightingDescription: string, funkoType: string, specialFinish: string) => { console.log('handleFunkoPop', mainImageFile, personImage, bgDescription, objectDescription, lightingDescription, funkoType, specialFinish); };
    const handleMagicMontage = async (mainImageFile: File, prompt: string, secondImageFile?: File) => { console.log('handleMagicMontage', mainImageFile, prompt, secondImageFile); };
    const handlePolaroid = (personFile: File, celebrityFile: File, negativePrompt: string) => { console.log('handlePolaroid', personFile, celebrityFile, negativePrompt); };
    const handleStyledPortrait = (personFile: File, styleFiles: File[], prompt: string, negativePrompt: string) => { console.log('handleStyledPortrait', personFile, styleFiles, prompt, negativePrompt); };
    const handleSuperheroFusion = async (person: File, hero: File) => { console.log('handleSuperheroFusion', person, hero); };
    const handleVirtualTryOn = (personFile: File, clothingFile: File, shoeFile: File | undefined, scenePrompt: string, posePrompt: string, cameraLens: string, cameraAngle: string, lightingStyle: string, negativePrompt: string) => { console.log('handleVirtualTryOn', personFile, clothingFile, shoeFile, scenePrompt, posePrompt, cameraLens, cameraAngle, lightingStyle, negativePrompt); };
    const handleCreativeFusion = (compositionFile: File, styleFiles: File[]) => { console.log('handleCreativeFusion', compositionFile, styleFiles); };
    const handleDoubleExposure = async (portraitFile: File, landscapeFile: File) => { console.log('handleDoubleExposure', portraitFile, landscapeFile); return ''; };
    const handleBatchProcess = (files: File[], toolIds: ToolId[], onProgress: (results: { original: string; processed: string; }[]) => void) => { console.log('handleBatchProcess', files, toolIds, onProgress); };
    const handleEnhanceResolutionAndSharpness = (factor: number, intensity: number, preserveFace: boolean) => {
        console.log('handleEnhanceResolutionAndSharpness', factor, intensity, preserveFace);
    };
    const startVoiceSession = () => { console.log('startVoiceSession'); };
    const stopVoiceSession = () => { console.log('stopVoiceSession'); };
    const handleApplyTexture = () => { console.log('handleApplyTexture'); };
    // FIX: Correct typo from setInitialImageCb to setInitialImage
    const confirmAndStartEditing = () => { setUploadedFile(null); setInitialImage(uploadedFile!); setIsEditingSessionActive(true); };
    const cancelPreview = () => { setUploadedFile(null); };
    const handleObjectRemove = () => { console.log('handleObjectRemove'); };
    const layers = currentState?.layers || [];
    const activeLayerId = currentState?.activeLayerId || null;
    const setActiveLayerId = (id: string | null) => { console.log('setActiveLayerId not implemented'); };
    const handleSetCloneSource = (source: { x: number; y: number } | null) => { setCloneSource(source); };
    const handleApplyText = () => { console.log('handleApplyText not implemented'); };
    const handleApplySepiaFilter = () => { console.log('handleApplySepiaFilter not implemented'); };
    const handleSelectObject = (object: DetectedObject) => {
        if (!imgRef.current) return;
        const mask = createMaskFromBoundingBox(object.box, imgRef.current.naturalWidth, imgRef.current.naturalHeight);
        setMaskDataUrl(mask);
        setHighlightedObject(object);
    };
    const handleGenerativeEdit = () => { console.log('handleGenerativeEdit not implemented'); };

    const handleDetectFaces = useCallback(async () => {
        const activeLayer = layers.find(l => l.id === activeLayerId);
        if (!activeLayer || activeLayer.type !== 'image') {
            setToast({ message: 'Selecione uma camada de imagem para detectar rostos.', type: 'error' });
            return;
        }
        
        setIsLoading(true);
        setLoadingMessage('Detectando rostos...');
        setError(null);
        setDetectedObjects(null); // Clear previous results

        try {
            const faces = await geminiService.detectFaces((activeLayer as ImageLayer).file);
            if (faces.length === 0) {
                setToast({ message: 'Nenhum rosto foi detectado na imagem.', type: 'info' });
            }
            setDetectedObjects(faces);
        } catch (e) {
            console.error("Falha ao detectar rostos.", e);
            const message = e instanceof Error ? e.message : "Ocorreu um erro desconhecido.";
            setToast({ message: `Erro na detecção: ${message}`, type: 'error' });
        } finally {
            setIsLoading(false);
            setLoadingMessage(null);
        }
    }, [layers, activeLayerId, setToast, setIsLoading, setLoadingMessage, setError]);
    
    const handleFaceSwap = useCallback(async (sourceImageFile: File, target: DetectedObject | File, prompt: string, negativePrompt: string): Promise<string | undefined> => {
        const activeLayer = layers.find(l => l.id === activeLayerId);
        if (!activeLayer || activeLayer.type !== 'image' || !imgRef.current) {
            setToast({ message: 'Selecione uma camada de imagem válida para a troca de rosto.', type: 'error' });
            return undefined;
        }
        const targetImageFile = (activeLayer as ImageLayer).file;

        setIsLoading(true);
        setLoadingMessage('Realizando troca de rosto...');
        setError(null);

        try {
            let maskFile: File;

            if (target instanceof File) {
                maskFile = target;
            } else { // It's a DetectedObject
                const maskDataUrl = createMaskFromBoundingBox(
                    target.box,
                    imgRef.current.naturalWidth,
                    imgRef.current.naturalHeight
                );
                maskFile = dataURLtoFile(maskDataUrl, 'face-mask.png');
            }

            const resultDataUrl = await geminiService.faceSwap(targetImageFile, sourceImageFile, prompt, negativePrompt, setToast, maskFile);
            return resultDataUrl;

        } catch (e) {
            console.error("Falha ao aplicar a troca de rosto.", e);
            const message = e instanceof Error ? e.message : "Ocorreu um erro desconhecido durante a troca de rostos.";
            setToast({ message: `Erro na troca de rostos: ${message}`, type: 'error' });
            return undefined;
        } finally {
            setIsLoading(false);
            setLoadingMessage(null);
        }
    }, [layers, activeLayerId, imgRef, setToast, setIsLoading, setLoadingMessage, setError]);

    const handleApplyCrop = useCallback(async () => {
      if (!completedCrop || !imgRef.current) {
          setToast({ message: 'Por favor, selecione uma área para cortar.', type: 'error' });
          return;
      }
      if (!activeLayerId) {
          setToast({ message: 'Nenhuma camada ativa para aplicar o corte.', type: 'error' });
          return;
      }
  
      setIsLoading(true);
      setLoadingMessage('Cortando imagem...');
  
      try {
          const croppedImageUrl = await getCroppedImg(imgRef.current, completedCrop);
          const newFileName = `cropped-${baseImageFile?.name || 'image'}.png`;
          const newFile = dataURLtoFile(croppedImageUrl, newFileName);
          
          const newLayers = layers.map(layer => {
              if (layer.id === activeLayerId && layer.type === 'image') {
                  return { ...layer, file: newFile };
              }
              return layer;
          });
  
          commitChange(newLayers, activeLayerId, 'crop', { crop: completedCrop });
  
          setCrop(undefined);
          setCompletedCrop(undefined);
          setToast({ message: 'Imagem cortada com sucesso!', type: 'success' });
          setIsEditCompleted(true);
  
      } catch (e) {
          console.error('Falha ao cortar imagem', e);
          setToast({ message: 'Ocorreu um erro ao cortar a imagem.', type: 'error' });
      } finally {
          setIsLoading(false);
          setLoadingMessage(null);
      }
    }, [completedCrop, imgRef, activeLayerId, layers, commitChange, baseImageFile?.name, setToast, setIsLoading, setLoadingMessage, setCrop, setCompletedCrop, setIsEditCompleted]);

    // FIX: Complete truncated function and file
    const handleTransform = useCallback(async (transformType: TransformType) => {
        const activeLayer = layers.find(l => l.id === activeLayerId);
        if (!activeLayer || activeLayer.type !== 'image') {
            setToast({ message: 'Selecione uma camada de imagem para transformar.', type: 'error' });
            return;
        }

        setIsLoading(true);
        setLoadingMessage('Aplicando transformação...');

        try {
            const transformImage = (file: File, transform: TransformType): Promise<string> => {
                return new Promise((resolve, reject) => {
                    const img = new Image();
                    const objectUrl = URL.createObjectURL(file);
                    img.onload = () => {
                        const canvas = document.createElement('canvas');
                        const ctx = canvas.getContext('2d');
                        if (!ctx) {
                            URL.revokeObjectURL(objectUrl);
                            return reject('No canvas context');
                        }

                        if (transform === 'rotate-left' || transform === 'rotate-right') {
                            canvas.width = img.height;
                            canvas.height = img.width;
                        } else {
                            canvas.width = img.width;
                            canvas.height = img.height;
                        }

                        if (transform === 'rotate-left') {
                            ctx.rotate(-90 * Math.PI / 180);
                            ctx.translate(-img.width, 0);
                        } else if (transform === 'rotate-right') {
                            ctx.rotate(90 * Math.PI / 180);
                            ctx.translate(0, -img.height);
                        } else if (transform === 'flip-h') {
                            ctx.translate(img.width, 0);
                            ctx.scale(-1, 1);
                        } else if (transform === 'flip-v') {
                            ctx.translate(0, img.height);
                            ctx.scale(1, -1);
                        }
                        
                        ctx.drawImage(img, 0, 0);
                        resolve(canvas.toDataURL());
                        URL.revokeObjectURL(objectUrl);
                    };
                    img.onerror = (err) => {
                        URL.revokeObjectURL(objectUrl);
                        reject(err);
                    };
                    img.src = objectUrl;
                });
            };

            const transformedDataUrl = await transformImage((activeLayer as ImageLayer).file, transformType);
            const newFileName = `transformed-${(activeLayer as ImageLayer).file.name}`;
            const newFile = dataURLtoFile(transformedDataUrl, newFileName);
            
            const newLayers = layers.map(layer => {
                if (layer.id === activeLayerId) {
                    return { ...layer, file: newFile };
                }
                return layer;
            });

            commitChange(newLayers, activeLayerId, 'crop', { transform: transformType });
            setToast({ message: 'Transformação aplicada!', type: 'success' });

        } catch (e) {
            console.error('Falha ao transformar imagem', e);
            setToast({ message: 'Erro ao aplicar transformação.', type: 'error' });
        } finally {
            setIsLoading(false);
            setLoadingMessage(null);
        }
    }, [layers, activeLayerId, commitChange, setToast, setIsLoading, setLoadingMessage]);
    
    const currentImageUrl = useMemo(() => {
        if (!currentState) return null;
        const activeLayer = currentState.layers.find(l => l.id === currentState.activeLayerId);
        if (activeLayer && activeLayer.type === 'image') {
          return URL.createObjectURL((activeLayer as ImageLayer).file);
        }
        // Find first visible image layer if active is not image
        const firstVisibleImage = currentState.layers.find(l => l.type === 'image' && l.isVisible) as ImageLayer | undefined;
        if(firstVisibleImage) {
            return URL.createObjectURL(firstVisibleImage.file);
        }
        return null;
    }, [currentState]);

    const originalImageUrl = useMemo(() => {
        if (!history[0]) return null;
        const baseLayer = history[0].layers[0] as ImageLayer;
        return URL.createObjectURL(baseLayer.file);
      }, [history]);
    
      const hasLocalAdjustments = useMemo(() => {
        return JSON.stringify(localFilters) !== JSON.stringify(DEFAULT_LOCAL_FILTERS);
      }, [localFilters]);

    const value: EditorContextType = {
        isEditingSessionActive, setIsEditingSessionActive, baseImageFile, setInitialImage, uploadedFile, isGif, gifFrames, handleGoHome, handleUploadNew, handleExplicitSave, isLeftPanelVisible, setIsLeftPanelVisible, isRightPanelVisible, setIsRightPanelVisible, theme, toggleTheme, undo, redo, canUndo, canRedo, setIsDownloadModalOpen, isDownloadModalOpen, handleDownload, toolHistory, zoom, setZoom, isPanModeActive, setIsPanModeActive, resetZoomAndPan, currentImageUrl, originalImageUrl, jumpToState, setIsComparisonModalOpen, isComparisonModalOpen, isInlineComparisonActive, setIsInlineComparisonActive, setIsSaveWorkflowModalOpen, isSaveWorkflowModalOpen, activeTab, setActiveTab, toast, setToast, activeTool, setActiveTool, handleSmartSearch, isSmartSearching, smartSearchResult, setSmartSearchResult, handleFileSelect, hasRestoredSession, isLoading, error, setError, setIsLoading, setLoadingMessage, loadingMessage, imgRef, canvasRef, crop, setCrop, completedCrop, setCompletedCrop, aspect, setAspect, startDrawing, stopDrawing, draw, generatedVideoUrl, detectedObjects, setDetectedObjects, highlightedObject, setHighlightedObject, handleSelectObject, localFilters, setLocalFilters, hasLocalAdjustments, buildFilterString, textToolState, setTextToolState, texturePreview, brushSize, setBrushSize, handleSetCloneSource, cloneSource, cloneStrokeStart, isEditCompleted, setIsEditCompleted, handleApplyCrop, handleTransform, handleRemoveBackground, handleApplyUpscale, handleRelight, handleApplyLowPoly, handleApplyDustAndScratch, handleExtractArt, handleDenoise, handleApplyFaceRecovery, handleUnblurImage, handleApplySharpen, handleApplyStyle, generateAIPreview, isPreviewLoading, previewState, setPreviewState, commitAIPreview, handleGenerativeEdit, prompt, setPrompt, clearMask, maskDataUrl, handleDetectObjects, handleDetectFaces, layers, activeLayerId, setActiveLayerId, handleAnalyzeImage, handleApplyText, resetTextToolState, histogram, handleApplyCurve, addPromptToHistory, initialPromptFromMetadata, handleFaceSwap, handleGenerateVideo, handleMagicPrompt, handleApplyLocalAdjustments, resetLocalFilters, handleApplyAIAdjustment, handleApplyNewAspectRatio, handleEditTextWithPrompt, addWorkflow, executeWorkflow, savedWorkflows, recentTools, handlePredefinedSearchAction, handleMagicScenery, handleApplyClone, toggleLayerVisibility, deleteLayer, updateLayer, mergeDownLayer, moveLayerUp, moveLayerDown, reorderLayer, addPlaceholderLayer, handleAIPortrait, handleConfidentStudio, handleFunkoPop, handleMagicMontage, handlePolaroid, handleStyledPortrait, handleSuperheroFusion, handleVirtualTryOn, handleCreativeFusion, handleDoubleExposure, handleBatchProcess, isBatchProcessing, batchProgress, startVoiceSession, stopVoiceSession, voiceState, voiceTranscript, proactiveSuggestion, setProactiveSuggestion, commitChange, handleApplyTexture, setTexturePreview, showOnboarding, setShowOnboarding, backgroundColor, confirmAndStartEditing, cancelPreview, uploadProgress, currentFrameIndex, setCurrentFrameIndex, isCurrentlyPanning, history, historyIndex, panOffset, handleWheel, handlePanStart, handleTouchStart, handleTouchMove, handleTouchEnd, handleEnhanceResolutionAndSharpness, handleObjectRemove, handleRestorePhoto, handleApplySepiaFilter, isBrushActive, setIsBrushActive
    };

    return <EditorContext.Provider value={value}>{children}</EditorContext.Provider>;
};