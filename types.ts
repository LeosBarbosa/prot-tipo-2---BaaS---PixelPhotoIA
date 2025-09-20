/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

// Este ficheiro é agora a única fonte de verdade para todas as definições de tipos na aplicação.

// Tipos de todo o editor
export type TabId = 'extract' | 'removeBg' | 'styles' | 'portraits' | 'styleGen' | 'localAdjust' | 'adjust' | 'crop' | 'generativeEdit' | 'neuralFilters' | 'upscale' | 'trends';

// Tipos do Painel de Transformação
export type TransformType = 'rotate-left' | 'rotate-right' | 'flip-h' | 'flip-v';

// Tipos do Painel de Melhoria
export type SharpenMode = 'light' | 'standard' | 'strong';

// Tipos do Painel de Colagem
export type CollageLayout = '2-vertical' | '2-horizontal' | '3-mixed-1' | '3-mixed-2' | '4-grid';

// Tipos do Painel de Vídeo
export type VideoAspectRatio = '16:9' | '1:1' | '9:16';

// FIX: ToolId reduzido para incluir apenas ferramentas que estão realmente implementadas e presentes no toolMap do App.tsx.
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
  | 'trends';

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