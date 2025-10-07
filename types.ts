/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React from 'react';

// Este ficheiro é agora a única fonte de verdade para todas as definições de tipos na aplicação.

// Tipos de todo o editor
export type TabId = 'layers' | 'extractArt' | 'removeBg' | 'style' | 'portraits' | 'styleGen' | 'adjust' | 'relight' | 'neuralFilters' | 'generativeEdit' | 'crop' | 'upscale' | 'unblur' | 'trends' | 'localAdjust' | 'dustAndScratches' | 'history' | 'objectRemover' | 'texture' | 'magicMontage' | 'photoRestoration' | 'text' | 'lowPoly' | 'pixelArt' | 'faceSwap';
export type ToastType = 'success' | 'error' | 'info';

// Tipos do Painel de Transformação
export type TransformType = 'rotate-left' | 'rotate-right' | 'flip-h' | 'flip-v';

// Tipos do Painel de Melhoria
export type SharpenMode = 'light' | 'standard' | 'strong';

// Tipos do Painel de Colagem
export type CollageLayout = '2-vertical' | '2-horizontal' | '3-mixed-1' | '3-mixed-2' | '4-grid';

// Tipos do Painel de Vídeo
export type VideoAspectRatio = '16:9' | '1:1' | '9:16';

export type ToolId =
  // Ferramentas de Geração
  | 'imageGen'
  | 'sketchRender'
  | 'creativeFusion'
  | 'outpainting'
  | 'imageVariation'
  | 'productPhotography'
  | 'characterDesign'
  | 'architecturalViz'
  | 'interiorDesign'
  | 'videoGen'
  | 'patternGen'
  | 'textEffects'
  | 'vectorConverter'
  | 'logoGen'
  | 'stickerCreator'
  | 'aiPortraitStudio'
  | 'model3DGen'
  | 'styledPortrait'
  | 'photoStudio'
  // Ferramentas de Edição
  | 'crop'
  | 'adjust'
  | 'style'
  | 'generativeEdit'
  | 'removeBg'
  | 'upscale'
  | 'text'
  | 'relight'
  | 'lowPoly'
  | 'pixelArt'
  | 'portraits'
  | 'styleGen'
  | 'photoRestoration'
  | 'dustAndScratches'
  | 'extractArt'
  | 'neuralFilters'
  | 'trends'
  | 'unblur'
  | 'objectRemover'
  | 'texture'
  | 'magicMontage'
  | 'faceRecovery'
  | 'denoise'
  | 'faceSwap'
  | 'localAdjust'
  // Ferramentas de Fluxo de Trabalho
  | 'bananimate'
  | 'polaroid'
  | 'funkoPopStudio'
  | 'tryOn';

// Novo: Tipo para a funcionalidade de Deteção de Objetos
export interface DetectedObject {
  label: string;
  box: {
    x_min: number;
    y_min: number;
    x_max: number;
    y_max: number;
  };
}

// Novo: Tipo para Fluxos de Trabalho Salvos
export type WorkflowIconType = 'restore' | 'product' | 'creative' | 'custom';
export interface Workflow {
  id: string; // e.g., timestamp or uuid
  name: string; // e.g., "Restaurar Foto Antiga"
  description: string;
  toolIds: ToolId[];
  icon: WorkflowIconType;
  isUserDefined?: boolean;
}


// Novo: Tipo para a configuração da ferramenta
export type ToolCategory = 'generation' | 'workflow' | 'editing';

export interface ToolConfig {
    id: ToolId;
    name: string;
    description: string;
    icon: React.ReactNode;
    category: ToolCategory;
}

// Novo: Tipo para os resultados da Busca Inteligente
export interface SmartSearchResult {
    tool: ToolConfig;
    args: any;
}

export interface UploadProgressStatus {
    progress: number;
    stage: 'reading' | 'processing' | 'compressing' | 'done';
}

// Novo: Tipo para buscas pré-definidas
export interface PredefinedSearch {
  keywords: string[];
  title: string;
  description: string;
  icon: React.ReactNode;
  action: {
    type: 'tool' | 'workflow';
    payload: ToolId | ToolId[];
  };
}

// New Layer types
export type LayerType = 'image' | 'adjustment';

export type BlendMode =
  | 'normal'
  | 'multiply'
  | 'screen'
  | 'overlay'
  | 'darken'
  | 'lighten'
  | 'color-dodge'
  | 'color-burn'
  | 'hard-light'
  | 'soft-light'
  | 'difference'
  | 'exclusion'
  | 'hue'
  | 'saturation'
  | 'color'
  | 'luminosity';

export interface BaseLayer {
  id: string;
  name: string;
  isVisible: boolean;
  opacity: number; // 0-100
  blendMode: BlendMode;
}

export interface ImageLayer extends BaseLayer {
  type: 'image';
  file: File;
  isGif?: boolean;
}

// Reusing the existing filter type from EditorContext
export type FilterState = {
  brightness: number;
  contrast: number;
  saturate: number;
  sepia: number;
  invert: number;
  grayscale: number;
  hueRotate: number;
  blur: number;
  curve?: number[];
};

export interface AdjustmentLayer extends BaseLayer {
  type: 'adjustment';
  filters: Partial<FilterState>;
}

export type Layer = ImageLayer | AdjustmentLayer;

// Adicionado para suportar frames de GIF no histórico e estado
export interface GifFrame {
  // O armazenamento de dados brutos como ImageData não é serializável para o IndexedDB
  imageData: {
      data: Uint8ClampedArray;
      width: number;
      height: number;
  };
  delay: number;
}

// History will now store snapshots of the entire layer state
export interface LayerStateSnapshot {
    layers: Layer[];
    activeLayerId: string | null;
    gifFrames?: GifFrame[];
}

export interface EditorContextType {
    initialPromptFromMetadata: string | null;
}