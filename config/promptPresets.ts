/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { type ToolId } from '../types';

export interface PromptPreset {
    name: string;
    description: string;
    prompt: string;
}

// Central de presets de prompts profissionais, categorizados por ferramenta (ToolId)
export const promptPresets: Partial<Record<ToolId, PromptPreset[]>> = {
    // Presets para a ferramenta "Gerador de Imagens"
    imageGen: [
        {
            name: 'Estilo Cinematográfico',
            description: 'Cores quentes, iluminação dramática e desfoque de fundo suave.',
            prompt: 'Imagem com estética de filme, cores quentes e ricas, iluminação dramática com sombras profundas e realces sutis, desfoque de fundo (bokeh) suave e cremoso, proporção de tela de cinema widescreen, 8k.'
        },
        {
            name: 'Estilo Urbano Noturno',
            description: 'Luzes neon, reflexos em superfícies molhadas e alto contraste.',
            prompt: 'Cena noturna na cidade, iluminação fria e neon pulsante, reflexos em superfícies molhadas após a chuva, alto contraste entre luzes e sombras, cores vibrantes e intensas, estilo cyberpunk distópico, fotorrealista.'
        },
        {
            name: 'Paisagem Natural Vibrante',
            description: 'Cores saturadas, detalhes nítidos e céu dramático.',
            prompt: 'Paisagem natural exuberante com cores vibrantes e saturadas, realce de detalhes nas texturas, céu azul saturado com nuvens dramáticas, vegetação vívida e folhagens densas, contraste acentuado entre luz e sombra, fotografia de alta resolução.'
        }
    ],
    // Presets para a ferramenta "Ensaio Fotográfico IA"
    photoStudio: [
        {
            name: 'Moda High Fashion',
            description: 'Iluminação de estúdio, pele impecável e cores saturadas.',
            prompt: 'Retrato de moda em estúdio com luz suave e profissional, pele impecável e radiante, cores saturadas e vibrantes que destacam as roupas, pose elegante e confiante, câmera full frame, lente 85mm com f/2.8 para um bokeh cremoso, renderização 8k.'
        },
        {
            name: 'Estilo Vintage (Anos 70)',
            description: 'Tons sépia, brilho suave e uma atmosfera nostálgica.',
            prompt: 'Fotografia em estilo vintage dos anos 70, tons sépia suaves e quentes, brilho suave e difuso, com leve desbotamento nas cores, atmosfera nostálgica e aconchegante, grão de filme sutil, como uma foto antiga de família encontrada em um álbum empoeirado.'
        }
    ],
    characterDesign: [
        {
            name: 'Guerreiro da Fantasia',
            description: 'Armadura detalhada, pose heroica e fundo de castelo.',
            prompt: 'Um guerreiro humano em armadura de placas completa, segurando uma espada larga. Fundo de um castelo em ruínas ao pôr do sol. Estilo de arte conceitual de fantasia, realista.'
        },
        {
            name: 'Explorador Espacial',
            description: 'Traje futurista, capacete de vidro e planeta alienígena.',
            prompt: 'Um explorador espacial em um traje branco e laranja, capacete de vidro refletindo um planeta alienígena com duas luas. Em pé em um terreno rochoso vermelho. Estilo de ficção científica, fotorrealista.'
        }
    ],
    magicMontage: [
        {
            name: 'Adicionar Asas de Anjo',
            description: 'Adiciona asas de anjo brancas e brilhantes nas costas da pessoa.',
            prompt: 'Adicione um par de grandes asas de anjo brancas e brilhantes nas costas da pessoa. As asas devem parecer etéreas e feitas de luz.'
        },
        {
            name: 'Transformar em Estátua',
            description: 'Converte a pessoa em uma estátua de mármore clássica.',
            prompt: 'Transforme a pessoa em uma estátua de mármore branco, com textura de pedra realista. Coloque a estátua em um pedestal em um jardim de museu.'
        }
    ],
    relight: [
        {
            name: 'Luz de Fogueira',
            description: 'Iluminação quente e cintilante vinda de baixo.',
            prompt: 'Reacenda a cena com uma luz de fogueira quente e cintilante vinda de baixo, projetando sombras longas e dançantes para cima.'
        },
        {
            name: 'Luz da Lua Cheia',
            description: 'Luz prateada e fria vinda de cima.',
            prompt: 'Reacenda a cena com uma luz de lua cheia fria e prateada vinda de cima, criando um ambiente misterioso com sombras suaves.'
        }
    ]
};
