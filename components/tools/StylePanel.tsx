/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState } from 'react';
// FIX: Correct import path
import { useEditor } from '../../context/EditorContext';
import ApplyToAllToggle from '../common/ApplyToAllToggle';
import TipBox from '../common/TipBox';
import StylePreview from '../common/StylePreview';
import { PaletteIcon } from '../icons';
import { Trend } from '../../types';

const styles: Trend[] = [
    // FIX: Added icon to each style to satisfy the Trend type
    { name: 'Desenho Animado', prompt: 'Transforme a imagem em um estilo de desenho animado vibrante. Aplique contornos pretos grossos e definidos para delinear as formas. Use uma paleta de cores primárias saturadas e vibrantes. Exagere levemente as características principais para um efeito expressivo e divertido, semelhante a um desenho animado moderno.', bg: 'bg-gradient-to-br from-yellow-400 to-orange-500', icon: <PaletteIcon className="w-6 h-6" /> },
    { name: 'Anime', prompt: 'Estilo de anime dos anos 90, cores vibrantes, linhas nítidas, iluminação de cena dramática.', bg: 'bg-gradient-to-br from-pink-400 to-purple-500', icon: <PaletteIcon className="w-6 h-6" /> },
    { name: 'Van Gogh', prompt: 'Pintura a óleo no estilo de Vincent Van Gogh, com pinceladas espessas e expressivas, luz do final da tarde, composição dinâmica.', bg: 'bg-gradient-to-br from-yellow-400 to-blue-600', icon: <PaletteIcon className="w-6 h-6" /> },
    { name: 'Cyberpunk', prompt: 'Estilo cyberpunk, com luzes de neon, atmosfera sombria e chuvosa, detalhes de alta tecnologia.', bg: 'bg-gradient-to-br from-cyan-400 to-indigo-600', icon: <PaletteIcon className="w-6 h-6" /> },
    { name: 'Aquarela', prompt: 'Pintura em aquarela, com cores suaves, bordas fluidas e iluminação suave e difusa.', bg: 'bg-gradient-to-br from-green-300 to-sky-400', icon: <PaletteIcon className="w-6 h-6" /> },
    { name: 'Pixel Art', prompt: 'Pixel art de 16 bits, paleta de cores limitada, iluminação frontal simples.', bg: 'bg-gradient-to-br from-gray-500 to-blue-800', icon: <PaletteIcon className="w-6 h-6" /> },
    { name: 'HQ Clássico', prompt: 'Estilo de história em quadrinhos clássico, com hachuras, cores chapadas e sombras fortes e definidas.', bg: 'bg-gradient-to-br from-red-500 to-yellow-400', icon: <PaletteIcon className="w-6 h-6" /> },
    { name: 'Foto Antiga', prompt: 'Fotografia antiga em preto e branco, com grão de filme, leve sépia, cantos suavemente vinhetados e iluminação suave de janela.', bg: 'bg-gradient-to-br from-stone-500 to-stone-700', icon: <PaletteIcon className="w-6 h-6" /> },
    { name: 'Impressionismo', prompt: 'Pintura a óleo no estilo impressionista, capturando a luz dourada do final da tarde, com pinceladas visíveis.', bg: 'bg-gradient-to-br from-rose-300 to-violet-400', icon: <PaletteIcon className="w-6 h-6" /> },
    { name: 'Art Déco', prompt: 'Estilo Art Déco, com formas geométricas, cores fortes, detalhes luxuosos e iluminação dramática de baixo para cima.', bg: 'bg-gradient-to-br from-amber-400 to-gray-800', icon: <PaletteIcon className="w-6 h-6" /> },
    { name: 'Esboço Carvão', prompt: 'Close-up em estilo de esboço a carvão preto e branco, com linhas expressivas e sombreamento dramático de uma única fonte de luz.', bg: 'bg-gradient-to-br from-gray-300 to-gray-600', icon: <PaletteIcon className="w-6 h-6" /> },
    { name: 'Modelo 3D', prompt: 'Renderização de modelo 3D, com iluminação de estúdio de três pontos e texturas suaves e fotorrealistas.', bg: 'bg-gradient-to-br from-slate-400 to-slate-600', icon: <PaletteIcon className="w-6 h-6" /> },
    { name: 'Steampunk', prompt: 'Estilo Steampunk, com engrenagens de latão, vapor, estética vitoriana e iluminação quente de lâmpadas de filamento.', bg: 'bg-gradient-to-br from-orange-600 to-amber-800', icon: <PaletteIcon className="w-6 h-6" /> },
    { name: 'Pintura a Óleo', prompt: 'Pintura a óleo, com pinceladas texturizadas e visíveis, cores ricas e vibrantes e iluminação dramática.', bg: 'bg-gradient-to-br from-amber-500 to-rose-700', icon: <PaletteIcon className="w-6 h-6" /> },
    { name: 'Pop Art', prompt: 'Estilo pop art inspirado em Andy Warhol, com cores ousadas e contrastantes, serigrafia e repetição de padrões.', bg: 'bg-gradient-to-br from-yellow-300 to-pink-500', icon: <PaletteIcon className="w-6 h-6" /> },
    { name: 'Surrealismo', prompt: 'Cena de sonho surrealista no estilo de Salvador Dalí, com objetos derretendo, paisagens ilógicas e uma atmosfera misteriosa.', bg: 'bg-gradient-to-br from-sky-400 to-yellow-600', icon: <PaletteIcon className="w-6 h-6" /> },
    { name: 'Arte de Rua', prompt: 'Estilo de arte de rua (graffiti), usando texturas de tinta spray, estênceis e cores vibrantes, com um fundo de parede de tijolos.', bg: 'bg-gradient-to-br from-red-600 to-gray-700', icon: <PaletteIcon className="w-6 h-6" /> },
    { name: 'Mosaico', prompt: 'Transforme a imagem em um mosaico romano antigo, composto por pequenos ladrilhos de cerâmica coloridos, com linhas de argamassa visíveis.', bg: 'bg-gradient-to-br from-amber-700 to-stone-500', icon: <PaletteIcon className="w-6 h-6" /> },
];

const StylePanel: React.FC = () => {
    const { isLoading, handleApplyStyle, isGif, generateAIPreview, isPreviewLoading, previewState } = useEditor();
    const [applyToAll, setApplyToAll] = useState(true);

    const handleStyleClick = (style: Trend) => {
        // FIX: The style object already conforms to the Trend type, so it can be passed directly.
        generateAIPreview(style, applyToAll);
    };

    return (
        <div className="w-full flex flex-col gap-4 animate-fade-in">
            <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-300">Estilo de Foto com IA</h3>
                <p className="text-sm text-gray-400 -mt-1">Transforme sua foto com um clique.</p>
            </div>
            
            <StylePreview />

            <div className={`transition-opacity duration-300 ${isPreviewLoading || previewState ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {styles.map(style => (
                        <button
                            key={style.name}
                            onClick={() => handleStyleClick(style)}
                            disabled={isLoading || isPreviewLoading}
                            className="group relative aspect-square rounded-lg text-center font-semibold text-white transition-transform duration-200 transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:transform-none flex flex-col items-center justify-center p-2 overflow-hidden shadow-lg"
                        >
                            <div className={`absolute inset-0 ${style.bg} transition-transform duration-300 group-hover:scale-110`}></div>
                            <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent group-hover:from-black/50 transition-colors"></div>
                            <span className="relative z-10 drop-shadow-md text-sm">{style.name}</span>
                        </button>
                    ))}
                </div>
                <TipBox>
                    A IA reinterpreta sua imagem no estilo escolhido. Use a pré-visualização para ver o resultado antes de aplicar!
                </TipBox>
                {isGif && <div className="mt-4"><ApplyToAllToggle checked={applyToAll} onChange={setApplyToAll} /></div>}
            </div>
        </div>
    );
};

export default StylePanel;