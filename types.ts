/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React from 'react';

// Este ficheiro é agora a única fonte de verdade para todas as definições de tipos na aplicação.

// Tipos de todo o editor
export type TabId = 'extractArt' | 'removeBg' | 'style' | 'portraits' | 'styleGen' | 'adjust' | 'relight' | 'neuralFilters' | 'generativeEdit' | 'crop' | 'upscale' | 'unblur' | 'trends' | 'localAdjust' | 'dustAndScratches' | 'history' | 'objectRemover' | 'texture' | 'magicMontage' | 'photoRestoration' | 'text' | 'lowPoly' | 'pixelArt';
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
  | 'sketchRender'
  | 'imageGen'
  | 'creativeFusion'
  | 'outpainting'
  | 'imageVariation'
  | 'productPhotography'
  | 'characterDesign'
  | 'architecturalViz'
  | 'interiorDesign'
  | 'faceSwap'
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
  // Ferramentas de Fluxo de Trabalho
  | 'bananimate'
  | 'polaroid';

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