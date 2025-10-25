/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { type PredefinedSearch } from '../types';

export const predefinedSearches: PredefinedSearch[] = [
  {
    keywords: ['restaurar', 'foto antiga', 'recuperar foto', 'consertar foto', 'velha'],
    title: 'Restaurar Foto Antiga',
    description: 'Use a IA para recuperar rostos e remover ruído de fotos antigas.',
    icon: 'FaceSmileIcon',
    action: {
      type: 'workflow',
      payload: ['faceRecovery', 'denoise'],
    },
  },
  {
    keywords: ['produto', 'e-commerce', 'ecommerce', 'fundo de estúdio'],
    title: 'Criar Foto de Produto',
    description: 'Remova o fundo e coloque seu produto em um cenário profissional.',
    icon: 'SparkleIcon',
    action: {
      type: 'workflow',
      payload: ['removeBg', 'productPhotography'],
    },
  },
  {
    keywords: ['logo', 'logotipo', 'criar marca'],
    title: 'Gerador de Logotipo',
    description: 'Crie um logotipo único e minimalista a partir de uma descrição.',
    icon: 'LogoIcon',
    action: {
      type: 'tool',
      payload: 'logoGen',
    },
  },
  {
    keywords: ['remover fundo', 'recortar imagem', 'fundo transparente'],
    title: 'Removedor de Fundo',
    description: 'Isole o objeto principal da sua imagem com um único clique.',
    icon: 'ScissorsIcon',
    action: {
      type: 'tool',
      payload: 'removeBg',
    },
  },
  {
    keywords: ['desenho', 'cartoon', 'anime', 'estilo artístico'],
    title: 'Aplicar Estilo Artístico',
    description: 'Transforme sua foto com estilos de arte famosos, como anime, Van Gogh, etc.',
    icon: 'PaletteIcon',
    action: {
      type: 'tool',
      payload: 'style',
    },
  },
];
