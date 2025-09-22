/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

// Este ficheiro é agora a única fonte de verdade para todas as definições de tipos na aplicação.

// Tipos de todo o editor
// FIX: Add missing 'localAdjust' to TabId type to fix type errors in EditorModalLayout.
export type TabId = 'extractArt' | 'removeBg' | 'style' | 'portraits' | 'faceRecovery' | 'styleGen' | 'adjust' | 'relight' | 'neuralFilters' | 'generativeEdit' | 'crop' | 'upscale' | 'unblur' | 'trends' | 'denoise' | 'localAdjust' | 'dustAndScratches' | 'history';

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
  | 'aiPortrait'
  | 'videoGen'
  | 'patternGen'
  | 'textEffects'
  | 'vectorConverter'
  | 'logoGen'
  | 'stickerCreator'
  | 'aiPortraitStudio' // Replaced caricatureGen
  | 'model3DGen'
  // Ferramentas de Edição
  | 'crop'
  | 'adjust'
  | 'style'
  | 'generativeEdit'
  | 'removeBg'
  | 'upscale'
  | 'text'
  | 'relight'
  | 'magicPrompt'
  | 'lowPoly'
  | 'portraits'
  | 'styleGen'
  | 'wonderModel'
  | 'dustAndScratches'
  | 'extractArt'
  | 'neuralFilters'
  | 'trends'
  | 'denoise'
  | 'faceRecovery'
  | 'unblur'
  // Ferramentas de Fluxo de Trabalho
  | 'bananimate';

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