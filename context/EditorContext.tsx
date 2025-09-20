/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { createContext, useState, useContext, ReactNode, useCallback, useRef, useMemo, useEffect } from 'react';
import { type Crop, type PixelCrop } from 'react-image-crop';
import html2canvas from 'html2canvas';

// Hooks
import { useHistoryState } from '../hooks/useHistoryState';
import { usePanAndZoom } from '../hooks/usePanAndZoom';
import { useMaskCanvas } from '../hooks/useMaskCanvas';

// Utils & Services
import { dataURLtoFile, createMaskFromCrop } from '../utils/imageUtils';
import * as geminiService from '../services/geminiService';
import { type ToolId, type TransformType, type DetectedObject } from '../types';
import { handleOrchestratorCall } from '../services/orchestrator';

const DEFAULT_LOCAL_FILTERS = {
    brightness: 100, contrast: 100, saturate: 100, sepia: 0, invert: 0,
    grayscale: 0, hueRotate: 0, blur: 0
};

export interface TextToolState {
    content: string;
    fontFamily: string;
    fontSize: number; // As a percentage of image width
    color: string;
    align: 'left' | 'center' | 'right';
    bold: boolean;
    italic: boolean;
    position: { x: number, y: number }; // Percentage based
}

const DEFAULT_TEXT_TOOL_STATE: TextToolState = {
    content: 'Texto de Exemplo',
    fontFamily: 'Impact',
    fontSize: 8,
    color: '#FFFFFF',
    align: 'center',
    bold: false,
    italic: false,
    position: { x: 50, y: 50 }, // Center
};

interface EditorContextType {
    // Estado do Modal e Ferramenta
    activeTool: ToolId | null;
    setActiveTool: React.Dispatch<React.SetStateAction<ToolId | null>>;

    // Estado Global
    currentImage: File | null;
    originalImage: File | null;
    isLoading: boolean;
    setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
    error: string | null;
    setError: React.Dispatch<React.SetStateAction<string | null>>;
    loadingMessage: string | null;
    setLoadingMessage: React.Dispatch<React.SetStateAction<string | null>>;

    // Estado do Histórico
    isHistoryLoading: boolean;
    canUndo: boolean;
    canRedo: boolean;
    undo: () => void;
    redo: () => void;
    resetHistory: () => void;
    setInitialImage: (file: File) => void;
    handleUploadNew: () => void;

    // Refs/URLs de Imagem e Canvas
    imgRef: React.RefObject<HTMLImageElement>;
    canvasRef: React.RefObject<HTMLCanvasElement>;
    currentImageUrl: string | null;
    originalImageUrl: string | null;

    // Estado da UI
    prompt: string;
    setPrompt: React.Dispatch<React.SetStateAction<string>>;
    isComparisonModalOpen: boolean;
    setIsComparisonModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
    isDownloadModalOpen: boolean;
    setIsDownloadModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
    
    // Pan & Zoom
    zoom: number;
    setZoom: React.Dispatch<React.SetStateAction<number>>;
    panOffset: { x: number; y: number; };
    isPanModeActive: boolean;
    setIsPanModeActive: React.Dispatch<React.SetStateAction<boolean>>;
    isCurrentlyPanning: boolean;
    handleWheel: (e: React.WheelEvent<HTMLDivElement>) => void;
    handlePanStart: (e: React.MouseEvent) => void;
    resetZoomAndPan: () => void;
    
    // Estado do Corte
    crop?: Crop;
    setCrop: React.Dispatch<React.SetStateAction<Crop | undefined>>;
    completedCrop?: PixelCrop;
    setCompletedCrop: React.Dispatch<React.SetStateAction<PixelCrop | undefined>>;
    aspect?: number;
    setAspect: React.Dispatch<React.SetStateAction<number | undefined>>;
    handleApplyCrop: () => void;

    // Estado do Canvas de Máscara
    maskDataUrl: string | null;
    brushSize: number;
    setBrushSize: React.Dispatch<React.SetStateAction<number>>;
    clearMask: () => void;
    startDrawing: (e: React.MouseEvent<HTMLCanvasElement>) => void;
    stopDrawing: () => void;
    draw: (e: React.MouseEvent<HTMLCanvasElement>) => void;
    handleAutoSelect: () => Promise<void>;

    // Estado de Ajustes Locais
    localFilters: typeof DEFAULT_LOCAL_FILTERS;
    setLocalFilters: React.Dispatch<React.SetStateAction<typeof DEFAULT_LOCAL_FILTERS>>;
    hasLocalAdjustments: boolean;
    buildFilterString: (filters: typeof DEFAULT_LOCAL_FILTERS) => string;
    handleApplyLocalAdjustments: () => void;
    resetLocalFilters: () => void;

    // Estado de Edição Generativa
    generativeMode: 'fill' | 'remove' | 'compose';
    setGenerativeMode: React.Dispatch<React.SetStateAction<'fill' | 'remove' | 'compose'>>;
    secondImageFile: File | null;
    setSecondImageFile: React.Dispatch<React.SetStateAction<File | null>>;

    // Estado do Vídeo
    generatedVideoUrl: string | null;
    handleGenerateVideo: (prompt: string, aspectRatio: string) => Promise<void>;
    
    // Novo: Estado de Deteção de Objetos
    detectedObjects: DetectedObject[] | null;
    setDetectedObjects: React.Dispatch<React.SetStateAction<DetectedObject[] | null>>;
    highlightedObject: DetectedObject | null;
    setHighlightedObject: React.Dispatch<React.SetStateAction<DetectedObject | null>>;
    handleDetectObjects: () => Promise<void>;
    handleSelectObject: (object: DetectedObject) => void;

    // Novo: Estado da Ferramenta de Texto
    textToolState: TextToolState;
    setTextToolState: React.Dispatch<React.SetStateAction<TextToolState>>;
    handleApplyText: () => void;


    // Manipuladores de Chamadas de API
    handleApplyStyle: (stylePrompt: string) => Promise<void>;
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
}

const EditorContext = createContext<EditorContextType | null>(null);

export const useEditor = () => {
    const context = useContext(EditorContext);
    if (!context) {
        throw new Error("useEditor must be used within an EditorProvider");
    }
    return context;
};

// Um hook especificamente para os painéis para simplificar o acesso aos estados de carregamento/erro
export const useLoadingError = () => {
    const { isLoading, error, setError, setIsLoading, loadingMessage, setLoadingMessage } = useEditor()!;
    return { isLoading, error, setError, setIsLoading, loadingMessage, setLoadingMessage };
};

export const EditorProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    // Estado do Modal
    const [activeTool, setActiveTool] = useState<ToolId | null>(null);
    
    // Estado Global
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [loadingMessage, setLoadingMessage] = useState<string | null>(null);
    
    // Estado da UI
    const [prompt, setPrompt] = useState<string>('');
    const [isComparisonModalOpen, setIsComparisonModalOpen] = useState<boolean>(false);
    const [isDownloadModalOpen, setIsDownloadModalOpen] = useState<boolean>(false);
    
    // Refs
    const imgRef = useRef<HTMLImageElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    // Estado de Edição
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

    // Hooks para estado complexo
    const { maskDataUrl, setMaskDataUrl, clearMask, startDrawing, stopDrawing, draw } = useMaskCanvas(canvasRef, brushSize);
    const { zoom, setZoom, panOffset, isPanModeActive, setIsPanModeActive, handleWheel, handlePanStart, resetZoomAndPan, isCurrentlyPanning } = usePanAndZoom();

    // Callback de limpeza do hook de histórico
    const onHistoryStateChange = useCallback(() => {
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
    }, [clearMask]);

    const {
        currentImage, originalImage, canUndo, canRedo, isHistoryLoading, addImageToHistory,
        setInitialImage, clearHistory, undo, redo, resetHistory
    } = useHistoryState(onHistoryStateChange);
    
    // Limpa o vídeo gerado quando não está na ferramenta de vídeo para evitar que apareça em outros editores
    useEffect(() => {
        if (activeTool !== 'videoGen') {
            setGeneratedVideoUrl(null);
        }
    }, [activeTool]);

    // Gestão de URL de Imagem
    const urlCache = useRef(new Map<File, string>());
    const getImageUrl = useCallback((file: File | null): string | null => {
        if (!file) return null;
        if (urlCache.current.has(file)) return urlCache.current.get(file)!;
        const url = URL.createObjectURL(file);
        urlCache.current.set(file, url);
        return url;
    }, []);
    useEffect(() => () => {
        for (const url of urlCache.current.values()) URL.revokeObjectURL(url);
        urlCache.current.clear();
    }, []);

    const currentImageUrl = useMemo(() => getImageUrl(currentImage), [currentImage, getImageUrl]);
    const originalImageUrl = useMemo(() => getImageUrl(originalImage), [originalImage, getImageUrl]);

    // Estado Derivado
    const hasLocalAdjustments = useMemo(() => JSON.stringify(localFilters) !== JSON.stringify(DEFAULT_LOCAL_FILTERS), [localFilters]);

    // Wrapper de Chamada de API
    const handleApiCall = useCallback(async (apiFunc: () => Promise<string>, context: string) => {
        setIsLoading(true);
        setError(null);
        try {
            const resultUrl = await apiFunc();
            const newImageFile = dataURLtoFile(resultUrl, `${context}-${Date.now()}.png`);
            addImageToHistory(newImageFile);
        } catch (err) {
            setError(`Falha na operação de ${context}. ${err instanceof Error ? err.message : 'Ocorreu um erro desconhecido.'}`);
        } finally {
            setIsLoading(false);
            setLoadingMessage(null);
        }
    }, [addImageToHistory]);

    // Manipuladores de API
    const handleApplyStyle = useCallback(async (stylePrompt: string) => {
        if (!currentImage) return;
        setLoadingMessage("A aplicar estilo...");
        await handleApiCall(() => geminiService.applyStyle(currentImage, stylePrompt), 'aplicar-estilo');
    }, [currentImage, handleApiCall]);

    const handleRemoveBackground = useCallback(async () => {
        if (!currentImage) return;
        setLoadingMessage("A remover fundo...");
        await handleApiCall(() => geminiService.removeBackground(currentImage), 'remover-fundo');
    }, [currentImage, handleApiCall]);

    const handleApplyAIAdjustment = useCallback(async (adjustmentPrompt: string) => {
        if (!currentImage) return;
        setLoadingMessage("A aplicar ajuste...");
        await handleApiCall(() => geminiService.generateAdjustedImage(currentImage, adjustmentPrompt), 'ajuste-ia');
    }, [currentImage, handleApiCall]);
    
    const handleGenerativeEdit = useCallback(async () => {
        if (!currentImage) return;
        setLoadingMessage("A editar com IA...");
        await handleApiCall(async () => {
            if (generativeMode === 'compose') {
                if (!prompt.trim()) throw new Error("O prompt é necessário para a composição.");
                return geminiService.generativeEdit(currentImage, prompt, 'compose', { secondImage: secondImageFile ?? undefined });
            }
            if (!maskDataUrl) throw new Error("A máscara é necessária para preencher/remover.");
            if (generativeMode === 'fill' && !prompt.trim()) throw new Error("O prompt é necessário para preencher.");
            const maskFile = dataURLtoFile(maskDataUrl, 'mask.png');
            return geminiService.generativeEdit(currentImage, prompt, generativeMode, { maskImage: maskFile });
        }, 'edicao-generativa');
    }, [currentImage, maskDataUrl, generativeMode, prompt, secondImageFile, handleApiCall]);

    const handleApplyUpscale = useCallback(async (factor: number, preserveFace: boolean) => {
        if (!currentImage) return;
        setLoadingMessage(`A aumentar escala em ${factor}x...`);
        await handleApiCall(() => geminiService.upscaleImage(currentImage, factor, preserveFace), 'upscale');
    }, [currentImage, handleApiCall]);
    
    const handleRelight = useCallback(async (prompt: string) => {
        if (!currentImage) return;
        setLoadingMessage("Ajustando iluminação...");
        await handleApiCall(() => geminiService.reacenderImage(currentImage, prompt), 'reacender-imagem');
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
    }, []);

    const handleMagicPrompt = useCallback(async (prompt: string) => {
        if (!currentImage) return;
        setIsLoading(true);
        setError(null);
        setLoadingMessage("A IA está a pensar...");
        try {
            const resultUrl = await handleOrchestratorCall(currentImage, prompt);
            const newImageFile = dataURLtoFile(resultUrl, `prompt-magico-${Date.now()}.png`);
            addImageToHistory(newImageFile);
            setIsComparisonModalOpen(true); // Automatically open comparison modal on success
        } catch (err) {
            setError(`Falha na operação de prompt-magico. ${err instanceof Error ? err.message : 'Ocorreu um erro desconhecido.'}`);
        } finally {
            setIsLoading(false);
            setLoadingMessage(null);
        }
    }, [currentImage, addImageToHistory, setIsComparisonModalOpen]);

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
    }, [currentImage, setMaskDataUrl]);

    // Manipuladores de Edição Local
    const buildFilterString = useCallback((filters: typeof DEFAULT_LOCAL_FILTERS) => {
        return `brightness(${filters.brightness}%) contrast(${filters.contrast}%) saturate(${filters.saturate}%) sepia(${filters.sepia}%) invert(${filters.invert}%) grayscale(${filters.grayscale}%) hue-rotate(${filters.hueRotate}deg) blur(${filters.blur}px)`;
    }, []);

    const handleApplyLocalAdjustments = useCallback(() => {
        if (!currentImageUrl) return;
        const image = new Image();
        image.crossOrigin = "Anonymous";
        image.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = image.naturalWidth;
            canvas.height = image.naturalHeight;
            const ctx = canvas.getContext('2d');
            if (!ctx) return;
            ctx.filter = buildFilterString(localFilters);
            ctx.drawImage(image, 0, 0);
            const newImageFile = dataURLtoFile(canvas.toDataURL('image/png'), 'adjusted.png');
            addImageToHistory(newImageFile);
        };
        image.src = currentImageUrl;
    }, [currentImageUrl, buildFilterString, localFilters, addImageToHistory]);
    
    const resetLocalFilters = useCallback(() => setLocalFilters(DEFAULT_LOCAL_FILTERS), []);

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
    }, [currentImage, clearMask]);

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
    }, [currentImageUrl, addImageToHistory, textToolState, imgRef]);

    const handleApplyLowPoly = useCallback(async () => {
        if (!currentImage) return;
        setLoadingMessage("Aplicando estilo Low Poly...");
        await handleApiCall(() => geminiService.generateLowPoly(currentImage), 'aplicar-lowpoly');
    }, [currentImage, handleApiCall]);

    const handleGenerateProfessionalPortrait = useCallback(async () => {
        if (!currentImage) return;
        setLoadingMessage("Gerando retrato profissional...");
        await handleApiCall(() => geminiService.generateProfessionalPortrait(currentImage), 'gerar-retrato-profissional');
    }, [currentImage, handleApiCall]);

    const handleWonderModelUpscale = useCallback(async () => {
        if (!currentImage) return;
        setLoadingMessage("Aprimorando imagem com Modelo Wonder...");
        await handleApiCall(() => geminiService.wonderModelUpscale(currentImage), 'wonder-model');
    }, [currentImage, handleApiCall]);
    
    const handleExtractArt = useCallback(async () => {
        if (!currentImage) return;
        setLoadingMessage("Extraindo arte da imagem...");
        await handleApiCall(() => geminiService.extractArt(currentImage), 'extract-art');
    }, [currentImage, handleApiCall]);

    const handleApplyDustAndScratch = useCallback(async () => {
        if (!currentImage) return;
        setLoadingMessage("Aplicando efeito de filme antigo...");
        await handleApiCall(() => geminiService.applyDustAndScratch(currentImage), 'apply-dust-scratches');
    }, [currentImage, handleApiCall]);

    const value: EditorContextType = {
        activeTool, setActiveTool,
        currentImage, originalImage, isLoading, setIsLoading, error, setError, loadingMessage, setLoadingMessage,
        isHistoryLoading, canUndo, canRedo, undo, redo, resetHistory, setInitialImage, handleUploadNew,
        imgRef, canvasRef, currentImageUrl, originalImageUrl,
        prompt, setPrompt, isComparisonModalOpen, setIsComparisonModalOpen, isDownloadModalOpen, setIsDownloadModalOpen,
        zoom, setZoom, panOffset, isPanModeActive, setIsPanModeActive, isCurrentlyPanning, handleWheel, handlePanStart, resetZoomAndPan,
        crop, setCrop, completedCrop, setCompletedCrop, aspect, setAspect, handleApplyCrop,
        maskDataUrl, brushSize, setBrushSize, clearMask, startDrawing, stopDrawing, draw, handleAutoSelect,
        localFilters, setLocalFilters, hasLocalAdjustments, buildFilterString, handleApplyLocalAdjustments, resetLocalFilters,
        generativeMode, setGenerativeMode, secondImageFile, setSecondImageFile,
        generatedVideoUrl, handleGenerateVideo,
        detectedObjects, setDetectedObjects, highlightedObject, setHighlightedObject, handleDetectObjects, handleSelectObject,
        textToolState, setTextToolState, handleApplyText,
        handleApplyStyle, handleRemoveBackground, handleApplyAIAdjustment, handleGenerativeEdit, handleApplyUpscale, handleRelight, handleTransform, handleMagicPrompt, handleApplyLowPoly, handleGenerateProfessionalPortrait, handleWonderModelUpscale, handleExtractArt, handleApplyDustAndScratch,
    };

    return <EditorContext.Provider value={value}>{children}</EditorContext.Provider>;
};