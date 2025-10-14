/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';
import { type Trend } from '../types';
import { AnimeFaceIcon, BoltIcon, ClockIcon, Model3DIcon } from '../components/icons';

export const quickStyles: Trend[] = [
    {
        name: 'Estilo Anime',
        prompt: 'Transforme a foto em um personagem de anime dos anos 90, com cores vibrantes e linhas nítidas.',
        bg: 'bg-gradient-to-br from-pink-400 to-purple-500',
        icon: React.createElement(AnimeFaceIcon, { className: 'w-8 h-8 text-pink-300' }),
    },
    {
        name: 'Cyberpunk',
        prompt: 'Estilo cyberpunk, com luzes de neon, atmosfera sombria e chuvosa, detalhes de alta tecnologia.',
        bg: 'bg-gradient-to-br from-cyan-400 to-indigo-600',
        icon: React.createElement(BoltIcon, { className: 'w-8 h-8 text-cyan-300' }),
    },
    {
        name: 'Foto Antiga',
        prompt: 'Fotografia antiga em preto e branco, com grão de filme, leve sépia, cantos suavemente vinhetados e iluminação suave de janela.',
        bg: 'bg-gradient-to-br from-stone-500 to-stone-700',
        icon: React.createElement(ClockIcon, { className: 'w-8 h-8 text-stone-300' }),
    },
    {
        name: 'Render 3D',
        prompt: 'Renderização de modelo 3D, com iluminação de estúdio de três pontos e texturas suaves e fotorrealistas.',
        bg: 'bg-gradient-to-br from-slate-400 to-slate-600',
        icon: React.createElement(Model3DIcon, { className: 'w-8 h-8 text-slate-300' }),
    }
];
