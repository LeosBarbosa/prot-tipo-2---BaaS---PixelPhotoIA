/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import { type PixelCrop } from 'react-image-crop';

// Centralize AIStudio type declaration to resolve conflicts by declaring it within the global scope.
declare global {
    // FIX: Defined AIStudio interface to resolve type conflict with existing global declarations.
    interface AIStudio {
      hasSelectedApiKey: () => Promise<boolean>;
      openSelectKey: () => Promise<void>;
    }
    
    interface Window {
        aistudio?: AIStudio;
    }
}

export type ToolCategory = 'generation' | 'workflow' | 'editing';

export type ToolId =
  // Generation
  | 'imageGen' | 'videoGen' | 'logoGen' | 'patternGen' | 'model3DGen' | 'stickerCreator' | 'characterDesign' | 'placeholderGen'
  // Workflow
  | 'batchProcessing' | 'magicWorkflow' | 'magicScenery' | 'voiceAssistant' | 'confidentStudio' | 'photoStudio' | 'aiPortraitStudio' | 'funkoPopStudio' | 'tryOn' | 'styledPortrait' | 'superheroFusion' | 'doubleExposure' | 'polaroid'
  // Editing
  | 'crop' | 'adjust' | 'localAdjust' | 'magicMontage' | 'objectRemover' | 'removeBg' | 'faceSwap' | 'generativeEdit' | 'text' | 'textEffects' | 'aiTextEdit' | 'photoRestoration' | 'upscale' | 'superResolution' | 'unblur' | 'sharpen' | 'relight' | 'style' | 'portraits' | 'lowPoly' | 'pixelArt' | 'styleGen' | 'texture' | 'dustAndScratches' | 'extractArt' | 'neuralFilters' | 'trends' | 'history' | 'newAspectRatio' | 'denoise' | 'faceRecovery' | 'imageVariation' | 'outpainting' | 'productPhotography' | 'architecturalViz' | 'interiorDesign' | 'sketchRender' | 'vectorConverter' | 'bananimate' | 'aiPngCreator' | 'clone' | 'imageAnalysis';

export type TabId = ToolId;

export type VideoAspectRatio = '16:9' | '9:16' | '1:1';

export type TransformType = 'rotate-left' | 'rotate-right' | 'flip-h' | 'flip-v';

export interface ToolConfig {
    id: ToolId;
    name: string;
    description: string;
    icon: string;
    category: ToolCategory;
    isEditingTool: boolean;
    tag?: 'new' | 'tip';
}

export type BlendMode =
  | 'normal' | 'multiply' | 'screen' | 'overlay' | 'darken' | 'lighten'
  | 'color-dodge' | 'color-burn' | 'hard-light' | 'soft-light'
  | 'difference' | 'exclusion' | 'hue' | 'saturation' | 'color' | 'luminosity';

export interface BaseLayer {
    id: string;
    name: string;
    type: 'image' | 'adjustment';
    isVisible: boolean;
    opacity: number;
    blendMode: BlendMode;
}

export interface ImageLayer extends BaseLayer {
    type: 'image';
    file: File;
}

export interface AdjustmentLayer extends BaseLayer {
    type: 'adjustment';
    filters: Partial<FilterState>;
}

export type Layer = ImageLayer | AdjustmentLayer;

export interface ToolHistoryItem {
    toolId: ToolId;
    params?: any;
}

export interface LayerStateSnapshot {
    layers: Layer[];
    activeLayerId: string | null;
    toolHistory: ToolHistoryItem[];
}

export interface UploadProgressStatus {
    progress: number;
    stage: 'reading' | 'processing' | 'compressing' | 'done';
}

export interface GifFrame {
    imageData: {
        data: Uint8ClampedArray;
        width: number;
        height: number;
    };
    delay: number;
}

export interface FilterState {
    brightness: number;
    contrast: number;
    saturate: number;
    grayscale: number;
    sepia: number;
    hueRotate: number;
    invert: number;
    blur: number;
    curve?: number[];
}

export type WorkflowIconType = 'product' | 'restore' | 'creative' | 'custom';

export interface Workflow {
    id: string;
    name: string;
    description: string;
    toolIds: ToolId[];
    icon: WorkflowIconType;
    isUserDefined?: boolean;
}

export interface PredefinedSearch {
    keywords: string[];
    title: string;
    description: string;
    icon: string;
    action: {
        type: 'tool' | 'workflow';
        payload: ToolId | ToolId[];
    };
}

export interface SmartSearchResult {
    tool: ToolConfig;
    args: Record<string, any>;
}

export interface Trend {
    name: string;
    prompt: string;
    bg: string;
    icon: string;
    type?: 'descriptive';
}

export type ToastType = 'error' | 'success' | 'info';

export interface Toast {
    message: string;
    type: ToastType;
}

export interface DetectedObject {
    label: string;
    box: {
        x_min: number;
        y_min: number;
        x_max: number;
        y_max: number;
    };
}

export interface TextToolState {
    content: string;
    fontFamily: string;
    fontSize: number; // percentage of image width
    color: string;
    align: 'left' | 'center' | 'right';
    bold: boolean;
    italic: boolean;
    position: { x: number, y: number }; // percentage
}

export interface ProactiveSuggestionConfig {
    message: string;
    acceptLabel: string;
    onAccept: () => void;
}

export interface TexturePreviewState {
    url: string;
    opacity: number;
    blendMode: 'overlay' | 'multiply' | 'screen';
}

export interface PreviewState {
    trend: Trend;
    url: string;
    applyToAll: boolean;
}

export { type PixelCrop };