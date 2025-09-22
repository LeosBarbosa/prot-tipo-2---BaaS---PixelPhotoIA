/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { createContext, useState, useContext, ReactNode, useCallback, useRef, useMemo, useEffect } from 'react';
import { type Crop, type PixelCrop } from 'react-image-crop';
import { generateHistogram, applyLUT } from '../utils/imageProcessing';

// Hooks
import { useHistoryState } from '../hooks/useHistoryState';
import { usePanAndZoom } from '../hooks/usePanAndZoom';
import { useMaskCanvas } from '../hooks/useMaskCanvas';

// Utils & Services
import { dataURLtoFile, createMaskFromCrop, frameToFile, dataURLToImageData, frameToDataURL } from '../utils/imageUtils';
import { parseGif } from '../utils/gifUtils';
import * as geminiService from '../services/geminiService';
import { type ToolId, type TransformType, type DetectedObject, TabId } from '../types';
import { handleOrchestratorCall } from '../services/orchestrator';

interface GifFrame {
    imageData: ImageData;
    delay: number;
}

const DEFAULT_LOCAL_FILTERS = {
    exposure: 0,
    highlights: 100,
    shadows: 100,
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

const DEFAULT_TEXT_TOOL_STATE: TextToolState = {
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
    activeTool: ToolId | null;
    setActiveTool: React.Dispatch<React.SetStateAction<ToolId | null>>;
    currentImage: File | null;
    originalImage: File | null;
    isLoading: boolean;
    setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
    error: string | null;
    setError: (message: string | null) => void;
    loadingMessage: string | null;
    setLoadingMessage: React.Dispatch<React.SetStateAction<string | null>>;
    histogram: { r: number[], g: number[], b: number[] } | null;
    setHistogram: React.Dispatch<React.SetStateAction<{ r: number[], g: number[], b: number[] } | null>>;
    isHistoryLoading: boolean;
    canUndo: boolean;
    canRedo: boolean;
    undo: () => void;
    redo: () => void;
    resetHistory: () => void;
    history: File[];
    historyIndex: number;
    jumpToState: (index: number) => void;
    setInitialImage: (file: File) => void;
    handleUploadNew: () => void;
    imgRef: React.RefObject<HTMLImageElement>;
    canvasRef: React.RefObject<HTMLCanvasElement>;
    currentImageUrl: string | null;
    originalImageUrl: string | null;
    prompt: string;
    setPrompt: React.Dispatch<React.SetStateAction<string>>;
    isComparisonModalOpen: boolean;
    setIsComparisonModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
    toast: { message: string } | null;
    setToast: React.Dispatch<React.SetStateAction<{ message: string } | null>>;
    zoom: number;
    setZoom: React.Dispatch<React.SetStateAction<number>>;
    panOffset: { x: number; y: number; };
    isPanModeActive: boolean;
    setIsPanModeActive: React.Dispatch<React.SetStateAction<boolean>>;
    isCurrentlyPanning: boolean;
    handleWheel: (e: React.WheelEvent<HTMLDivElement>) => void;
    handlePanStart: (e: React.MouseEvent) => void;
    resetZoomAndPan: () => void;
    crop?: Crop;
    setCrop: React.Dispatch<React.SetStateAction<Crop | undefined>>;
    completedCrop?: PixelCrop;
    setCompletedCrop: React.Dispatch<React.SetStateAction<PixelCrop | undefined>>;
    aspect?: number;
    setAspect: React.Dispatch<React.SetStateAction<number | undefined>>;
    handleApplyCrop: () => void;
    maskDataUrl: string | null;
    brushSize: number;
    setBrushSize: React.Dispatch<React.SetStateAction<number>>;
    clearMask: () => void;
    startDrawing: (e: React.MouseEvent<HTMLCanvasElement>) => void;
    stopDrawing: () => void;
    draw: (e: React.MouseEvent<HTMLCanvasElement>) => void;
    handleAutoSelect: () => Promise<void>;
    localFilters: typeof DEFAULT_LOCAL_FILTERS;
    setLocalFilters: React.Dispatch<React.SetStateAction<typeof DEFAULT_LOCAL_FILTERS>>;
    hasLocalAdjustments: boolean;
    buildFilterString: (filters: typeof DEFAULT_LOCAL_FILTERS) => string;
    handleApplyLocalAdjustments: (applyToAll?: boolean) => void;
    resetLocalFilters: () => void;
    handleApplyCurve: (lut: number[]) => void;
    generativeMode: 'fill' | 'remove' | 'compose';
    setGenerativeMode: React.Dispatch<React.SetStateAction<'fill' | 'remove' | 'compose'>>;
    secondImageFile: File | null;
    setSecondImageFile: React.Dispatch<React.SetStateAction<File | null>>;
    generatedVideoUrl: string | null;
    handleGenerateVideo: (prompt: string, aspectRatio: string) => Promise<void>;
    detectedObjects: DetectedObject[] | null;
    setDetectedObjects: React.Dispatch<React.SetStateAction<DetectedObject[] | null>>;
    highlightedObject: DetectedObject | null;
    setHighlightedObject: React.Dispatch<React.SetStateAction<DetectedObject | null>>;
    handleDetectObjects: () => Promise<void>;
    handleSelectObject: (object: DetectedObject) => void;
    textToolState: TextToolState;
    setTextToolState: React.Dispatch<React.SetStateAction<TextToolState>>;
    handleApplyText: () => void;
    handleApplyStyle: (stylePrompt: string, applyToAll?: boolean) => Promise<void>;
    handleRemoveBackground: () => Promise<void>;
    handleApplyAIAdjustment: (adjustmentPrompt: string) => Promise<void>;
    handleGenerativeEdit: () => Promise<void>;
    handleApplyUpscale: (factor: number, preserveFace: boolean) => Promise<void>;
    handleRelight: (prompt: string) => Promise<void>;
    handleTransform: (transformType: TransformType) => Promise<void>;
    handleMagicPrompt: (prompt: string) => Promise<void>;
    handleApplyLowPoly: () => Promise<void>;
    handleGenerateProfessionalPortrait: () => Promise<void>;
    handleWonderModelUpscale: () => Promise<void>;
    handleExtractArt: () => Promise<void>;
    handleApplyDustAndScratch: () => Promise<void>;
    handleDenoise: () => Promise<void>;
    handleApplyFaceRecovery: () => Promise<void>;
    handleUnblurImage: (sharpenLevel: number, denoiseLevel: number, model: string) => Promise<void>;
    isGif: boolean;
    gifFrames: GifFrame[];
    currentFrameIndex: number;
    setCurrentFrameIndex: React.Dispatch<React.SetStateAction<number>>;
    panelsVisible: boolean;
    setPanelsVisible: React.Dispatch<React.SetStateAction<boolean>>;
    handleDownload: (format: 'png' | 'jpeg') => void;
}

const EditorContext = createContext<EditorContextType | null>(null);

export const useEditor = () => {
    const context = useContext(EditorContext);
    if (!context) {
        throw new Error("useEditor must be used within an EditorProvider");
    }
    return context;
};

export const useLoadingError = () => {
    const { isLoading, error, setError, setIsLoading, loadingMessage, setLoadingMessage } = useEditor()!;
    return { isLoading, error, setError, setIsLoading, loadingMessage, setLoadingMessage };
};

export const EditorProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [activeTool, setActiveTool] = useState<ToolId | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setErrorState] = useState<string | null>(null);
    const [toast, setToast] = useState<{ message: string } | null>(null);
    const [loadingMessage, setLoadingMessage] = useState<string | null>(null);
    const [histogram, setHistogram] = useState<{ r: number[], g: number[], b: number[] } | null>(null);
    const [prompt, setPrompt] = useState<string>('');
    const [isComparisonModalOpen, setIsComparisonModalOpen] = useState<boolean>(false);
    const imgRef = useRef<HTMLImageElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [crop, setCrop] = useState<Crop>();
    const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
    const [aspect, setAspect] = useState<number | undefined>();
    const [localFilters, setLocalFilters] = useState(DEFAULT_LOCAL_FILTERS);
    const [generativeMode, setGenerativeMode] = useState<'fill' | 'remove' | 'compose'>('fill');
    const [secondImageFile, setSecondImageFile] = useState<File | null>(null);
    const [brushSize, setBrushSize] = useState<number>(30);
    const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null);
    const [detectedObjects, setDetectedObjects] = useState<DetectedObject[] | null>(null);
    const [highlightedObject, setHighlightedObject] = useState<DetectedObject | null>(null);
    const [textToolState, setTextToolState] = useState<TextToolState>(DEFAULT_TEXT_TOOL_STATE);
    const [panelsVisible, setPanelsVisible] = useState(true);

    // GIF State
    const [isGif, setIsGif] = useState<boolean>(false);
    const [gifFrames, setGifFrames] = useState<GifFrame[]>([]);
    const [currentFrameIndex, setCurrentFrameIndex] = useState<number>(0);

    const { maskDataUrl, setMaskDataUrl, clearMask, startDrawing, stopDrawing, draw } = useMaskCanvas(canvasRef, brushSize);
    const { zoom, setZoom, panOffset, isPanModeActive, setIsPanModeActive, handleWheel, handlePanStart, resetZoomAndPan, isCurrentlyPanning } = usePanAndZoom();

    const setError = useCallback((message: string | null) => {
        setErrorState(message);
        if (message) {
            setToast({ message });
        }
    }, []);

    const onHistoryStateChange = useCallback((newImage?: File) => {
        clearMask();
        setSecondImageFile(null);
        setCrop(undefined);
        setCompletedCrop(undefined);
        setLocalFilters(DEFAULT_LOCAL_FILTERS);
        setError(null);
        setPrompt('');
        setGeneratedVideoUrl(null);
        setDetectedObjects(null);
        setHighlightedObject(null);
        setTextToolState(DEFAULT_TEXT_TOOL_STATE);
        setIsComparisonModalOpen(false);
        setPanelsVisible(true);

        if (isGif && newImage) {
            const updateFrames = async () => {
                const newImageData = await dataURLToImageData(URL.createObjectURL(newImage));
                setGifFrames(prevFrames => {
                    const updatedFrames = [...prevFrames];
                    updatedFrames[currentFrameIndex] = { ...updatedFrames[currentFrameIndex], imageData: newImageData };
                    return updatedFrames;
                });
            };
            updateFrames();
        }
    }, [clearMask, setError, isGif, currentFrameIndex]);

    const {
        currentImage, originalImage, canUndo, canRedo, isHistoryLoading, addImageToHistory,
        setInitialImage: setHistoryInitialImage, clearHistory, undo, redo, resetHistory,
        history, historyIndex, jumpToState,
    } = useHistoryState(onHistoryStateChange);
    
    const setInitialImage = useCallback(async (file: File) => {
        if (file.type === 'image/gif') {
            setIsLoading(true);
            setLoadingMessage("Processando GIF...");
            try {
                const frames = await parseGif(file);
                setGifFrames(frames);
                setIsGif(true);
                setCurrentFrameIndex(0);
                const firstFrameFile = frameToFile(frames[0].imageData, `frame_0.png`);
                setHistoryInitialImage(firstFrameFile);
            } catch(e) {
                setError("Falha ao processar o arquivo GIF.");
                setIsGif(false);
            } finally {
                setIsLoading(false);
                setLoadingMessage(null);
            }
        } else {
            setIsGif(false);
            setGifFrames([]);
            setCurrentFrameIndex(0);
            setHistoryInitialImage(file);
        }
    }, [setHistoryInitialImage, setError]);
    
    useEffect(() => {
        if (activeTool !== 'videoGen') {
            setGeneratedVideoUrl(null);
        }
        setPanelsVisible(true);
    }, [activeTool]);

    const urlCache = useRef(new Map<File | ImageData, string>());
    const getImageUrl = useCallback((data: File | ImageData | null): string | null => {
        if (!data) return null;
        if (urlCache.current.has(data)) return urlCache.current.get(data)!;
        
        let url;
        if (data instanceof File) {
            url = URL.createObjectURL(data);
        } else { // It's ImageData
            url = frameToDataURL(data);
        }
        
        urlCache.current.set(data, url);
        return url;
    }, []);

    useEffect(() => () => {
        for (const url of urlCache.current.values()) {
             if (url.startsWith('blob:')) URL.revokeObjectURL(url);
        }
        urlCache.current.clear();
    }, []);

    const currentImageUrl = useMemo(() => {
        if (isGif && gifFrames[currentFrameIndex]) {
            return getImageUrl(gifFrames[currentFrameIndex].imageData);
        }
        return getImageUrl(currentImage);
    }, [currentImage, getImageUrl, isGif, gifFrames, currentFrameIndex]);

    const originalImageUrl = useMemo(() => getImageUrl(originalImage), [originalImage, getImageUrl]);

    const hasLocalAdjustments = useMemo(() => JSON.stringify(localFilters) !== JSON.stringify(DEFAULT_LOCAL_FILTERS), [localFilters]);

    const handleApiCall = useCallback(async (apiFunc: (image: File) => Promise<string>, context: string, targetImage: File, applyToAll?: boolean) => {
        if (!isGif || !applyToAll) {
            setIsLoading(true);
            setError(null);
            try {
                const resultUrl = await apiFunc(targetImage);
                const newImageFile = dataURLtoFile(resultUrl, `${context}-${Date.now()}.png`);
                addImageToHistory(newImageFile);
            } catch (err) {
                setError(`Falha na operação de ${context}. ${err instanceof Error ? err.message : 'Ocorreu um erro desconhecido.'}`);
            } finally {
                setIsLoading(false);
                setLoadingMessage(null);
            }
            return;
        }

        // Apply to all GIF frames logic
        setIsLoading(true);
        setError(null);
        const newFrames: GifFrame[] = [];
        try {
            for (let i = 0; i < gifFrames.length; i++) {
                setLoadingMessage(`Processando frame ${i + 1} de ${gifFrames.length}...`);
                const frameFile = frameToFile(gifFrames[i].imageData, `frame_${i}.png`);
                const resultUrl = await apiFunc(frameFile);
                const newImageData = await dataURLToImageData(resultUrl);
                newFrames.push({ ...gifFrames[i], imageData: newImageData });
            }
            setGifFrames(newFrames);
            const currentFrameFile = frameToFile(newFrames[currentFrameIndex].imageData, `frame_${currentFrameIndex}_updated.png`);
            addImageToHistory(currentFrameFile);

        } catch (err) {
            setError(`Falha ao aplicar a todos os frames. ${err instanceof Error ? err.message : 'Ocorreu um erro desconhecido.'}`);
        } finally {
            setIsLoading(false);
            setLoadingMessage(null);
        }
    }, [addImageToHistory, setError, isGif, gifFrames, currentFrameIndex]);
    
    const handleApplyStyle = useCallback(async (stylePrompt: string, applyToAll: boolean = false) => {
        if (!currentImage) return;
        setLoadingMessage("A aplicar estilo...");
        await handleApiCall((image) => geminiService.applyStyle(image, stylePrompt), 'aplicar-estilo', currentImage, applyToAll);
    }, [currentImage, handleApiCall]);

    const handleRemoveBackground = useCallback(async () => {
        if (!currentImage) return;
        setLoadingMessage("A remover fundo...");
        await handleApiCall(geminiService.removeBackground, 'remover-fundo', currentImage);
    }, [currentImage, handleApiCall]);

    const handleApplyAIAdjustment = useCallback(async (adjustmentPrompt: string) => {
        if (!currentImage) return;
        setLoadingMessage("A aplicar ajuste...");
        await handleApiCall((image) => geminiService.generateAdjustedImage(image, adjustmentPrompt), 'ajuste-ia', currentImage);
    }, [currentImage, handleApiCall]);
    
    const handleGenerativeEdit = useCallback(async () => {
        if (!currentImage) return;
        setLoadingMessage("A editar com IA...");
        await handleApiCall(async (image) => {
            if (generativeMode === 'compose') {
                if (!prompt.trim()) throw new Error("O prompt é necessário para a composição.");
                return geminiService.generativeEdit(image, prompt, 'compose', { secondImage: secondImageFile ?? undefined });
            }
            if (!maskDataUrl) throw new Error("A máscara é necessária para preencher/remover.");
            if (generativeMode === 'fill' && !prompt.trim()) throw new Error("O prompt é necessário para preencher.");
            const maskFile = dataURLtoFile(maskDataUrl, 'mask.png');
            return geminiService.generativeEdit(image, prompt, generativeMode, { maskImage: maskFile });
        }, 'edicao-generativa', currentImage);
    }, [currentImage, maskDataUrl, generativeMode, prompt, secondImageFile, handleApiCall]);

    const handleApplyUpscale = useCallback(async (factor: number, preserveFace: boolean) => {
        if (!currentImage) return;
        setLoadingMessage(`A aumentar escala em ${factor}x...`);
        await handleApiCall((image) => geminiService.upscaleImage(image, factor, preserveFace), 'upscale', currentImage);
    }, [currentImage, handleApiCall]);
    
    const handleRelight = useCallback(async (prompt: string) => {
        if (!currentImage) return;
        setLoadingMessage("Ajustando iluminação...");
        await handleApiCall((image) => geminiService.reacenderImage(image, prompt), 'reacender-imagem', currentImage);
    }, [currentImage, handleApiCall]);
    
    const handleGenerateVideo = useCallback(async (prompt: string, aspectRatio: string) => {
        setIsLoading(true);
        setError(null);
        setLoadingMessage("A gerar o seu vídeo, isto pode demorar alguns instantes...");
        setGeneratedVideoUrl(null); 
        try {
            const resultUrl = await geminiService.generateVideo(prompt, aspectRatio);
            setGeneratedVideoUrl(resultUrl);
        } catch (err) {
            setError(`Falha na geração de vídeo. ${err instanceof Error ? err.message : 'Ocorreu um erro desconhecido.'}`);
        } finally {
            setIsLoading(false);
            setLoadingMessage(null);
        }
    }, [setError]);

    const handleMagicPrompt = useCallback(async (prompt: string) => {
        if (!currentImage) return;
        setIsLoading(true);
        setError(null);
        setLoadingMessage("A IA está a pensar...");
        try {
            const resultUrl = await handleOrchestratorCall(currentImage, prompt);
            const newImageFile = dataURLtoFile(resultUrl, `prompt-magico-${Date.now()}.png`);
            addImageToHistory(newImageFile);
            setIsComparisonModalOpen(true);
        } catch (err) {
            setError(`Falha na operação de prompt-magico. ${err instanceof Error ? err.message : 'Ocorreu um erro desconhecido.'}`);
        } finally {
            setIsLoading(false);
            setLoadingMessage(null);
        }
    }, [currentImage, addImageToHistory, setIsComparisonModalOpen, setError]);

    const handleAutoSelect = useCallback(async () => {
        if (!currentImage) return;
        setIsLoading(true); setError(null); setLoadingMessage("A analisar imagem...");
        try {
            const generatedMaskDataUrl = await geminiService.generateMask(currentImage);
            setMaskDataUrl(generatedMaskDataUrl);
        } catch (err) {
            setError(`Falha na seleção automática. ${err instanceof Error ? err.message : 'Erro desconhecido.'}`);
        } finally {
            setIsLoading(false); setLoadingMessage(null);
        }
    }, [currentImage, setMaskDataUrl, setError]);
    
    const buildFilterString = useCallback((filters: typeof DEFAULT_LOCAL_FILTERS) => {
        const cssFilters = `
            brightness(${filters.brightness}%) 
            contrast(${filters.contrast}%) 
            saturate(${filters.saturate}%) 
            sepia(${filters.sepia}%) 
            invert(${filters.invert}%) 
            grayscale(${filters.grayscale}%) 
            hue-rotate(${filters.hueRotate}deg) 
            blur(${filters.blur}px)
        `;
        return cssFilters;
    }, []);

    const handleApplyLocalAdjustments = useCallback(async (applyToAll: boolean = false) => {
        if (!currentImageUrl || !imgRef.current) return;
    
        const applyAdjustmentsToFrame = async (imageData: ImageData): Promise<ImageData> => {
            const canvas = document.createElement('canvas');
            canvas.width = imageData.width;
            canvas.height = imageData.height;
            const ctx = canvas.getContext('2d', { willReadFrequently: true });
            if (!ctx) throw new Error("Could not create canvas context.");
            ctx.putImageData(imageData, 0, 0);
            let finalImageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            if (localFilters.curve) {
                finalImageData = applyLUT(finalImageData, localFilters.curve);
            }
            return finalImageData;
        };

        if (isGif && applyToAll) {
            setIsLoading(true);
            setLoadingMessage("Aplicando a todos os frames...");
            try {
                const newFrames: GifFrame[] = [];
                for (let i = 0; i < gifFrames.length; i++) {
                    setLoadingMessage(`Processando frame ${i + 1} de ${gifFrames.length}...`);
                    const adjustedImageData = await applyAdjustmentsToFrame(gifFrames[i].imageData);
                    newFrames.push({ ...gifFrames[i], imageData: adjustedImageData });
                }
                setGifFrames(newFrames);
                const currentFrameFile = frameToFile(newFrames[currentFrameIndex].imageData, `frame_${currentFrameIndex}_adjusted.png`);
                addImageToHistory(currentFrameFile);
            } catch (err) {
                 setError(err instanceof Error ? err.message : 'Erro desconhecido ao aplicar a todos os frames.');
            } finally {
                setIsLoading(false);
                setLoadingMessage(null);
            }
        } else {
             const image = new Image();
             image.crossOrigin = "Anonymous";
             image.onload = async () => {
                 const canvas = document.createElement('canvas');
                 canvas.width = image.naturalWidth;
                 canvas.height = image.naturalHeight;
                 const ctx = canvas.getContext('2d');
                 if (!ctx) return setError("Could not create canvas context.");
                 ctx.drawImage(image, 0, 0);
                 const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                 const adjustedImageData = await applyAdjustmentsToFrame(imageData);
                 ctx.putImageData(adjustedImageData, 0, 0);
                 const newImageFile = dataURLtoFile(canvas.toDataURL('image/png'), 'adjusted.png');
                 addImageToHistory(newImageFile);
             };
             image.src = currentImageUrl;
        }
    }, [currentImageUrl, localFilters, addImageToHistory, setError, isGif, gifFrames, currentFrameIndex]);
    
    const handleApplyCurve = useCallback((lut: number[]) => {
      setLocalFilters(prev => ({...prev, curve: lut}));
    }, []);
    
    const resetLocalFilters = useCallback(() => setLocalFilters(DEFAULT_LOCAL_FILTERS), []);
    
    useEffect(() => {
        const toolTabMap: Partial<Record<ToolId, TabId>> = {
            adjust: 'localAdjust',
            relight: 'adjust'
        };
        const currentTabId = activeTool ? toolTabMap[activeTool] : undefined;

      if (currentImage && currentTabId === 'localAdjust') {
        const image = new Image();
        image.crossOrigin = "Anonymous";
        image.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = image.naturalWidth;
          canvas.height = image.naturalHeight;
          const ctx = canvas.getContext('2d');
          if (!ctx) return;
          ctx.drawImage(image, 0, 0);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          setHistogram(generateHistogram(imageData));
        };
        image.src = currentImageUrl!;
      } else {
        setHistogram(null);
      }
    }, [currentImage, currentImageUrl, activeTool]);


    const handleApplyCrop = useCallback(() => {
        if (!completedCrop || !imgRef.current) return;
        const image = imgRef.current;
        const canvas = document.createElement('canvas');
        const scaleX = image.naturalWidth / image.width; const scaleY = image.naturalHeight / image.height;
        canvas.width = completedCrop.width; canvas.height = completedCrop.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.drawImage(image, completedCrop.x * scaleX, completedCrop.y * scaleY, completedCrop.width * scaleX, completedCrop.height * scaleY, 0, 0, completedCrop.width, completedCrop.height);
        addImageToHistory(dataURLtoFile(canvas.toDataURL('image/png'), 'cropped.png'));
    }, [completedCrop, addImageToHistory]);

    const handleTransform = useCallback(async (transformType: TransformType) => {
        if (!currentImageUrl) return;
        setIsLoading(true);
        const image = new Image();
        image.src = currentImageUrl;
        await new Promise(res => image.onload = res);
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        const { width, height } = image;
        if (transformType === 'rotate-left' || transformType === 'rotate-right') {
            canvas.width = height; canvas.height = width;
            ctx.translate(canvas.width / 2, canvas.height / 2);
            ctx.rotate((transformType === 'rotate-left' ? -90 : 90) * Math.PI / 180);
            ctx.drawImage(image, -width / 2, -height / 2);
        } else {
            canvas.width = width; canvas.height = height;
            if (transformType === 'flip-h') { ctx.translate(width, 0); ctx.scale(-1, 1); }
            if (transformType === 'flip-v') { ctx.translate(0, height); ctx.scale(1, -1); }
            ctx.drawImage(image, 0, 0);
        }
        addImageToHistory(dataURLtoFile(canvas.toDataURL('image/png'), 'transformed.png'));
        setIsLoading(false);
    }, [currentImageUrl, addImageToHistory]);
    
    const handleUploadNew = useCallback(() => {
        clearHistory();
        setIsGif(false);
        setGifFrames([]);
        setActiveTool(null);
    }, [clearHistory]);
    
    const handleDetectObjects = useCallback(async () => {
        if (!currentImage) return;
        setIsLoading(true);
        setLoadingMessage("A detetar objetos...");
        setError(null);
        setDetectedObjects(null);
        clearMask();
        try {
            const objects = await geminiService.detectObjects(currentImage);
            setDetectedObjects(objects);
        } catch (err) {
            setError(`Falha na deteção de objetos. ${err instanceof Error ? err.message : 'Ocorreu um erro desconhecido.'}`);
        } finally {
            setIsLoading(false);
            setLoadingMessage(null);
        }
    }, [currentImage, clearMask, setError]);

    const handleSelectObject = useCallback((object: DetectedObject) => {
        if (!imgRef.current) return;
        const { naturalWidth, naturalHeight } = imgRef.current;
        const { box } = object;
        const crop: PixelCrop = {
            x: box.x_min * naturalWidth,
            y: box.y_min * naturalHeight,
            width: (box.x_max - box.x_min) * naturalWidth,
            height: (box.y_max - box.y_min) * naturalHeight,
            unit: 'px'
        };

        const maskUrl = createMaskFromCrop(crop, naturalWidth, naturalHeight);
        setMaskDataUrl(maskUrl);
        setDetectedObjects(null);
        setHighlightedObject(null);
    }, [imgRef, setMaskDataUrl]);

    const handleApplyText = useCallback(async () => {
        if (!currentImageUrl || !imgRef.current) return;
        setIsLoading(true);
        const image = new Image();
        image.crossOrigin = "Anonymous";
        image.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            if (!ctx) {
                setError("Não foi possível criar o contexto do canvas.");
                setIsLoading(false);
                return;
            }

            const { naturalWidth, naturalHeight } = image;
            canvas.width = naturalWidth;
            canvas.height = naturalHeight;
            ctx.drawImage(image, 0, 0, naturalWidth, naturalHeight);

            const { content, fontFamily, fontSize, color, align, bold, italic, position } = textToolState;
            const scaledFontSize = (fontSize / 100) * naturalWidth;

            let fontStyle = '';
            if (italic) fontStyle += 'italic ';
            if (bold) fontStyle += 'bold ';
            
            ctx.font = `${fontStyle} ${scaledFontSize}px ${fontFamily}`;
            ctx.fillStyle = color;
            ctx.textAlign = align;
            ctx.textBaseline = 'top';

            ctx.strokeStyle = 'black';
            ctx.lineWidth = scaledFontSize / 20;

            const x = (position.x / 100) * naturalWidth;
            const y = (position.y / 100) * naturalHeight;

            const lines = content.split('\n');
            lines.forEach((line, index) => {
                const lineY = y + (index * scaledFontSize * 1.2);
                ctx.strokeText(line, x, lineY);
                ctx.fillText(line, x, lineY);
            });

            const newImageFile = dataURLtoFile(canvas.toDataURL('image/png'), 'text-added.png');
            addImageToHistory(newImageFile);
            setIsLoading(false);
        };
        image.src = currentImageUrl;
    }, [currentImageUrl, addImageToHistory, textToolState, imgRef, setError]);

    const handleApplyLowPoly = useCallback(async () => {
        if (!currentImage) return;
        setLoadingMessage("Aplicando estilo Low Poly...");
        await handleApiCall(geminiService.generateLowPoly, 'aplicar-lowpoly', currentImage);
    }, [currentImage, handleApiCall]);

    const handleGenerateProfessionalPortrait = useCallback(async () => {
        if (!currentImage) return;
        setLoadingMessage("Gerando retrato profissional...");
        await handleApiCall(geminiService.generateProfessionalPortrait, 'gerar-retrato-profissional', currentImage);
    }, [currentImage, handleApiCall]);

    const handleWonderModelUpscale = useCallback(async () => {
        if (!currentImage) return;
        setLoadingMessage("Aprimorando imagem com Modelo Wonder...");
        await handleApiCall(geminiService.wonderModelUpscale, 'wonder-model', currentImage);
    }, [currentImage, handleApiCall]);
    
    const handleExtractArt = useCallback(async () => {
        if (!currentImage) return;
        setLoadingMessage("Extraindo arte da imagem...");
        await handleApiCall(geminiService.extractArt, 'extract-art', currentImage);
    }, [currentImage, handleApiCall]);

    const handleApplyDustAndScratch = useCallback(async () => {
        if (!currentImage) return;
        setLoadingMessage("Aplicando efeito de filme antigo...");
        await handleApiCall(geminiService.applyDustAndScratch, 'apply-dust-scratches', currentImage);
    }, [currentImage, handleApiCall]);
    
    const handleDenoise = useCallback(async () => {
        if (!currentImage) return;
        setLoadingMessage("Removendo ruído da imagem...");
        await handleApiCall(geminiService.denoiseImage, 'denoise', currentImage);
    }, [currentImage, handleApiCall]);

    const handleApplyFaceRecovery = useCallback(async () => {
        if (!currentImage) return;
        setLoadingMessage("Restaurando detalhes do rosto...");
        await handleApiCall(geminiService.applyFaceRecovery, 'face-recovery', currentImage);
    }, [currentImage, handleApiCall]);
    
    const handleUnblurImage = useCallback(async (sharpenLevel: number, denoiseLevel: number, model: string) => {
        if (!currentImage) return;
        setLoadingMessage("Removendo desfoque da imagem...");
        await handleApiCall((image) => geminiService.unblurImage(image, sharpenLevel, denoiseLevel, model), 'unblur', currentImage);
    }, [currentImage, handleApiCall]);
    
    const handleDownload = useCallback((format: 'png' | 'jpeg') => {
        if (!currentImage) return;

        const performDownload = (blob: Blob, extension: string) => {
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `pixshop-edit-${Date.now()}.${extension}`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        };

        if (format === 'png' && currentImage.type === 'image/png') {
            performDownload(currentImage, 'png');
            return;
        }
        
        const imageUrl = URL.createObjectURL(currentImage);
        const image = new Image();
        image.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = image.naturalWidth;
            canvas.height = image.naturalHeight;
            const ctx = canvas.getContext('2d');
            if (!ctx) {
                 URL.revokeObjectURL(imageUrl);
                 return;
            }
            ctx.drawImage(image, 0, 0);
            canvas.toBlob((blob) => {
                if (blob) {
                    performDownload(blob, format === 'jpeg' ? 'jpg' : 'png');
                }
                URL.revokeObjectURL(imageUrl);
            }, `image/${format}`, format === 'jpeg' ? 0.9 : 1.0);
        };
        image.onerror = () => {
            URL.revokeObjectURL(imageUrl);
            setError("Não foi possível carregar a imagem para exportação.");
        }
        image.src = imageUrl;
    }, [currentImage, setError]);

    const value: EditorContextType = {
        activeTool, setActiveTool,
        currentImage, originalImage, isLoading, setIsLoading, error, setError, loadingMessage, setLoadingMessage,
        isHistoryLoading, canUndo, canRedo, undo, redo, resetHistory, setInitialImage, handleUploadNew,
        history, historyIndex, jumpToState,
        imgRef, canvasRef, currentImageUrl, originalImageUrl,
        prompt, setPrompt, isComparisonModalOpen, setIsComparisonModalOpen,
        toast, setToast,
        zoom, setZoom, panOffset, isPanModeActive, setIsPanModeActive, isCurrentlyPanning, handleWheel, handlePanStart, resetZoomAndPan,
        crop, setCrop, completedCrop, setCompletedCrop, aspect, setAspect, handleApplyCrop,
        maskDataUrl, brushSize, setBrushSize, clearMask, startDrawing, stopDrawing, draw, handleAutoSelect,
        localFilters, setLocalFilters, hasLocalAdjustments, buildFilterString, handleApplyLocalAdjustments, resetLocalFilters,
        generativeMode, setGenerativeMode, secondImageFile, setSecondImageFile,
        generatedVideoUrl, handleGenerateVideo,
        detectedObjects, setDetectedObjects, highlightedObject, setHighlightedObject, handleDetectObjects, handleSelectObject,
        textToolState, setTextToolState, handleApplyText,
        handleApplyStyle, handleRemoveBackground, handleApplyAIAdjustment, handleGenerativeEdit, handleApplyUpscale, handleRelight, handleTransform, handleMagicPrompt, handleApplyLowPoly, handleGenerateProfessionalPortrait, handleWonderModelUpscale, handleExtractArt, handleApplyDustAndScratch,
        handleApplyCurve, histogram, setHistogram,
        handleDenoise,
        handleApplyFaceRecovery,
        handleUnblurImage,
        isGif, gifFrames, currentFrameIndex, setCurrentFrameIndex,
        panelsVisible, setPanelsVisible,
        handleDownload,
    };

    return <EditorContext.Provider value={value}>{children}</EditorContext.Provider>;
};