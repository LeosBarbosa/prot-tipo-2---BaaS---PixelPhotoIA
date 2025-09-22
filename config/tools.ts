/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';
import {
    BrushIcon, PhotoIcon, LayersIcon, SparkleIcon,
    LandscapeIcon, FaceSmileIcon, VideoCameraIcon,
    AdjustmentsHorizontalIcon, CropIcon, PaletteIcon,
    ScissorsIcon, ArrowUpOnSquareIcon, TextToolIcon, LightbulbIcon,
    MagicWandIcon, LowPolyIcon, UserIcon, FilmGrainIcon, BullseyeIcon, DenoiseIcon, UnblurIcon,
    PatternIcon, TextEffectsIcon, VectorIcon, LogoIcon, StickersIcon, CaricatureIcon, Model3DIcon,
    BananaIcon
} from '../components/icons';
import { type ToolId } from '../types';

export type ToolCategory = 'generation' | 'workflow' | 'editing';

export interface ToolConfig {
    id: ToolId;
    name: string;
    description: string;
    icon: React.ReactNode;
    category: ToolCategory;
}

export const tools: ToolConfig[] = [
    // Generation Tools
    {
        id: 'imageGen',
        name: 'Gerador de Imagens AI',
        description: 'Crie imagens únicas a partir de descrições de texto detalhadas.',
        icon: React.createElement(PhotoIcon, { className: 'w-8 h-8 text-purple-400' }),
        category: 'generation',
    },
    {
        id: 'sketchRender',
        name: 'Renderização de Esboço',
        description: 'Transforme seus desenhos e esboços em imagens realistas com IA.',
        icon: React.createElement(BrushIcon, { className: 'w-8 h-8 text-blue-400' }),
        category: 'generation',
    },
    {
        id: 'characterDesign',
        name: 'Design de Personagem',
        description: 'Desenvolva conceitos de personagens para jogos, histórias e mais.',
        icon: React.createElement(FaceSmileIcon, { className: 'w-8 h-8 text-cyan-400' }),
        category: 'generation',
    },
    {
        id: 'videoGen',
        name: 'Gerador de Vídeo AI',
        description: 'Crie vídeos curtos e clipes animados a partir de texto.',
        icon: React.createElement(VideoCameraIcon, { className: 'w-8 h-8 text-red-400' }),
        category: 'generation',
    },
    {
        id: 'patternGen',
        name: 'Gerador de Padrões',
        description: 'Crie padrões de fundo sem costura para papéis de parede e designs.',
        icon: React.createElement(PatternIcon, { className: 'w-8 h-8 text-teal-400' }),
        category: 'generation',
    },
    {
        id: 'textEffects',
        name: 'Efeitos de Texto',
        description: 'Aplique efeitos visuais incríveis a um texto a partir de uma imagem.',
        icon: React.createElement(TextEffectsIcon, { className: 'w-8 h-8 text-amber-400' }),
        category: 'generation',
    },
    {
        id: 'logoGen',
        name: 'Gerador de Logotipo AI',
        description: 'Crie logotipos únicos e minimalistas a partir de um conceito.',
        icon: React.createElement(LogoIcon, { className: 'w-8 h-8 text-indigo-400' }),
        category: 'generation',
    },
    {
        id: 'stickerCreator',
        name: 'Criador de Adesivos AI',
        description: 'Gere adesivos em estilo de desenho animado a partir de um prompt.',
        icon: React.createElement(StickersIcon, { className: 'w-8 h-8 text-pink-400' }),
        category: 'generation',
    },
    {
        id: 'model3DGen',
        name: 'Gerador de Modelo 3D',
        description: 'Crie renderizações de objetos 3D a partir de uma descrição.',
        icon: React.createElement(Model3DIcon, { className: 'w-8 h-8 text-orange-400' }),
        category: 'generation',
    },


    // Workflows
    {
        id: 'interiorDesign',
        name: 'Reforma de Interiores',
        description: 'Visualize novos estilos de design em suas próprias fotos.',
        icon: React.createElement(LandscapeIcon, { className: 'w-8 h-8 text-teal-400' }),
        category: 'workflow',
    },
    {
        id: 'architecturalViz',
        name: 'Visualização Arquitetônica',
        description: 'Crie renderizações de alta qualidade para projetos arquitetônicos.',
        icon: React.createElement(VideoCameraIcon, { className: 'w-8 h-8 text-orange-400' }),
        category: 'workflow',
    },
    {
        id: 'creativeFusion',
        name: 'Fusão Criativa',
        description: 'Combine a composição de uma imagem com o estilo de outra.',
        icon: React.createElement(AdjustmentsHorizontalIcon, { className: 'w-8 h-8 text-pink-400' }),
        category: 'workflow',
    },
    {
        id: 'outpainting',
        name: 'Pintura Expansiva',
        description: 'Amplie suas imagens expandindo o quadro em qualquer direção.',
        icon: React.createElement(PhotoIcon, { className: 'w-8 h-8 text-indigo-400' }),
        category: 'workflow',
    },
    {
        id: 'faceSwap',
        name: 'Troca de Rosto',
        description: 'Substitua o rosto em uma foto pelo de outra de forma realista.',
        icon: React.createElement(FaceSmileIcon, { className: 'w-8 h-8 text-red-400' }),
        category: 'workflow',
    },
    {
        id: 'aiPortrait',
        name: 'Gerador de Retrato IA',
        description: 'Transforme fotos casuais em retratos profissionais com IA.',
        icon: React.createElement(SparkleIcon, { className: 'w-8 h-8 text-rose-400' }),
        category: 'workflow',
    },
    {
        id: 'productPhotography',
        name: 'Fotografia de Produto AI',
        description: 'Gere fotos de produtos com qualidade de estúdio em qualquer cenário.',
        icon: React.createElement(SparkleIcon, { className: 'w-8 h-8 text-yellow-400' }),
        category: 'workflow',
    },
     {
        id: 'aiPortraitStudio',
        name: 'Estúdio de Retrato IA',
        description: 'Transforme retratos com estilos criativos como Caricatura, Pixar e mais.',
        icon: React.createElement(CaricatureIcon, { className: 'w-8 h-8 text-lime-400' }),
        category: 'workflow',
    },
    {
        id: 'bananimate',
        name: 'Bananimate',
        description: 'Dê vida às suas fotos com animações divertidas e personalizadas.',
        icon: React.createElement(BananaIcon, { className: 'w-8 h-8 text-yellow-400' }),
        category: 'workflow',
    },

    // Editing Tools
    {
        id: 'extractArt',
        name: 'Extrair Arte',
        description: 'Transforme sua foto em um esboço de linhas e contornos.',
        icon: React.createElement(BullseyeIcon, { className: 'w-8 h-8 text-gray-400' }),
        category: 'editing',
    },
    {
        id: 'crop',
        name: 'Cortar e Girar',
        description: 'Ajuste o enquadramento, a proporção e a orientação da sua imagem.',
        icon: React.createElement(CropIcon, { className: 'w-8 h-8 text-lime-400' }),
        category: 'editing',
    },
    {
        id: 'adjust',
        name: 'Ajustes Manuais',
        description: 'Controle fino de brilho, contraste, saturação e outras propriedades.',
        icon: React.createElement(AdjustmentsHorizontalIcon, { className: 'w-8 h-8 text-gray-400' }),
        category: 'editing',
    },
    {
        id: 'style',
        name: 'Estilos Artísticos',
        description: 'Transforme sua foto com estilos de arte famosos usando IA.',
        icon: React.createElement(PaletteIcon, { className: 'w-8 h-8 text-amber-400' }),
        category: 'editing',
    },
     {
        id: 'unblur',
        name: 'Remover Desfoque',
        description: 'Corrija desfoque de movimento e lente com IA para aguçar sua imagem.',
        icon: React.createElement(UnblurIcon, { className: 'w-8 h-8 text-cyan-400' }),
        category: 'editing',
    },
    {
        id: 'generativeEdit',
        name: 'Edição Generativa',
        description: 'Selecione uma área para remover, adicionar ou alterar objetos com texto.',
        icon: React.createElement(BrushIcon, { className: 'w-8 h-8 text-fuchsia-400' }),
        category: 'editing',
    },
    {
        id: 'text',
        name: 'Adicionar Texto',
        description: 'Adicione e estilize texto diretamente na sua imagem.',
        icon: React.createElement(TextToolIcon, { className: 'w-8 h-8 text-orange-400' }),
        category: 'editing',
    },
    {
        id: 'removeBg',
        name: 'Removedor de Fundo',
        description: 'Isole o objeto principal da sua imagem com um clique.',
        icon: React.createElement(ScissorsIcon, { className: 'w-8 h-8 text-sky-400' }),
        category: 'editing',
    },
    {
        id: 'upscale',
        name: 'Melhorar Resolução',
        description: 'Aumente a resolução e a nitidez da imagem sem perder qualidade.',
        icon: React.createElement(ArrowUpOnSquareIcon, { className: 'w-8 h-8 text-emerald-400' }),
        category: 'editing',
    },
     {
        id: 'denoise',
        name: 'Remover Ruído (Denoise)',
        description: 'Limpe o ruído e a granulação de fotos com baixa iluminação.',
        icon: React.createElement(DenoiseIcon, { className: 'w-8 h-8 text-blue-300' }),
        category: 'editing',
    },
    {
        id: 'faceRecovery',
        name: 'Recuperação de Rosto',
        description: 'Restaure detalhes faciais e melhore a qualidade de retratos.',
        icon: React.createElement(FaceSmileIcon, { className: 'w-8 h-8 text-pink-400' }),
        category: 'editing',
    },
    {
        id: 'relight',
        name: 'Reacender',
        description: 'Ajuste a iluminação da sua foto com descrições de texto.',
        icon: React.createElement(LightbulbIcon, { className: 'w-8 h-8 text-yellow-400' }),
        category: 'editing',
    },
    {
        id: 'magicPrompt',
        name: 'Prompt Mágico',
        description: 'Descreva o que você quer fazer e deixe a IA escolher a ferramenta certa.',
        icon: React.createElement(MagicWandIcon, { className: 'w-8 h-8 text-purple-400' }),
        category: 'editing',
    },
    {
        id: 'lowPoly',
        name: 'Estilo Low Poly',
        description: 'Transforme sua foto em uma arte geométrica de polígonos.',
        icon: React.createElement(LowPolyIcon, { className: 'w-8 h-8 text-cyan-400' }),
        category: 'editing',
    },
    {
        id: 'portraits',
        name: 'Retratos IA',
        description: 'Ferramentas com um clique para melhorar retratos e avatares.',
        icon: React.createElement(UserIcon, { className: 'w-8 h-8 text-rose-400' }),
        category: 'editing',
    },
    {
        id: 'styleGen',
        name: 'Estilos Rápidos',
        description: 'Aplique estilos artísticos predefinidos com um clique.',
        icon: React.createElement(PaletteIcon, { className: 'w-8 h-8 text-teal-400' }),
        category: 'editing',
    },
    {
        id: 'wonderModel',
        name: 'Modelo Wonder',
        description: 'Aprimore, aumente a resolução e restaure imagens com qualidade máxima.',
        icon: React.createElement(SparkleIcon, { className: 'w-8 h-8 text-yellow-300' }),
        category: 'editing',
    },
    {
        id: 'dustAndScratches',
        name: 'Poeira e Arranhões',
        description: 'Adicione um efeito de filme antigo com poeira e arranhões.',
        icon: React.createElement(FilmGrainIcon, { className: 'w-8 h-8 text-stone-400' }),
        category: 'editing',
    },
     {
        id: 'neuralFilters',
        name: 'Filtros Neurais',
        description: 'Aplique filtros criativos e atmosféricos com um clique.',
        icon: React.createElement(SparkleIcon, { className: 'w-8 h-8 text-indigo-400' }),
        category: 'editing',
    },
    {
        id: 'trends',
        name: 'Tendências',
        description: 'Experimente estilos e efeitos populares do momento.',
        icon: React.createElement(LightbulbIcon, { className: 'w-8 h-8 text-pink-400' }),
        category: 'editing',
    },
    {
        id: 'vectorConverter',
        name: 'Conversor de Vetor',
        description: 'Converta imagens bitmap para um estilo de arte vetorial.',
        icon: React.createElement(VectorIcon, { className: 'w-8 h-8 text-orange-400' }),
        category: 'editing',
    },
];