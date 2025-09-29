/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState } from 'react';
import { useEditor } from '../../context/EditorContext';
import ApplyToAllToggle from '../common/ApplyToAllToggle';
import StylePreview from '../common/StylePreview';
import TipBox from '../common/TipBox';

const styles = [
    { name: 'Anime', prompt: 'Estilo de anime dos anos 90, cores vibrantes, linhas nítidas.', bg: 'bg-gradient-to-br from-pink-400 to-purple-500' },
    { name: 'Van Gogh', prompt: 'Pintura a óleo no estilo de Vincent Van Gogh, com pinceladas espessas e expressivas.', bg: 'bg-gradient-to-br from-yellow-400 to-blue-600' },
    { name: 'Cyberpunk', prompt: 'Estilo cyberpunk, com luzes de neon, atmosfera sombria e chuvosa, detalhes de alta tecnologia.', bg: 'bg-gradient-to-br from-cyan-400 to-indigo-600' },
    { name: 'Aquarela', prompt: 'Pintura em aquarela, com cores suaves e bordas fluidas.', bg: 'bg-gradient-to-br from-green-300 to-sky-400' },
    { name: 'Pixel Art', prompt: 'Pixel art de 16 bits, paleta de cores limitada.', bg: 'bg-gradient-to-br from-gray-500 to-blue-800' },
    { name: 'HQ Clássico', prompt: 'Estilo de história em quadrinhos clássico, com hachuras e cores chapadas.', bg: 'bg-gradient-to-br from-red-500 to-yellow-400' },
    { name: 'Foto Antiga', prompt: 'Fotografia antiga em preto e branco, com grão de filme, leve sépia e cantos suavemente vinhetados.', bg: 'bg-gradient-to-br from-stone-500 to-stone-700' },
    { name: 'Impressionismo', prompt: 'Pintura a óleo no estilo impressionista, capturando a luz e o momento, com pinceladas visíveis.', bg: 'bg-gradient-to-br from-rose-300 to-violet-400' },
    { name: 'Art Déco', prompt: 'Estilo Art Déco, com formas geométricas, cores fortes e detalhes luxuosos.', bg: 'bg-gradient-to-br from-amber-400 to-gray-800' },
    { name: 'Esboço Carvão', prompt: 'Esboço a carvão em preto e branco, com linhas expressivas e sombreamento.', bg: 'bg-gradient-to-br from-gray-300 to-gray-600' },
    { name: 'Modelo 3D', prompt: 'Renderização de modelo 3D, com iluminação de estúdio e texturas suaves.', bg: 'bg-gradient-to-br from-slate-400 to-slate-600' },
    { name: 'Steampunk', prompt: 'Estilo Steampunk, com engrenagens de latão, vapor e estética vitoriana.', bg: 'bg-gradient-to-br from-orange-600 to-amber-800' }
];

const StylePanel: React.FC = () => {
    const { isLoading, isGif, generateAIPreview, isPreviewLoading, previewState } = useEditor();
    const [applyToAll, setApplyToAll] = useState(true);

    const handleStyleClick = (prompt: string) => {
        generateAIPreview(prompt, applyToAll);
    };

    return (
        <div className="w-full flex flex-col gap-4 animate-fade-in">
            <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-300">Estilos Artísticos com IA</h3>
                <p className="text-sm text-gray-400 -mt-1">Transforme sua foto com um clique.</p>
            </div>
            
            <StylePreview />

            <div className={`transition-opacity duration-300 ${isPreviewLoading || previewState ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
                <div className="grid grid-cols-3 gap-3">
                    {styles.map(style => (
                        <button
                            key={style.name}
                            onClick={() => handleStyleClick(style.prompt)}
                            disabled={isLoading || isPreviewLoading}
                            className="aspect-square bg-gray-800 rounded-lg text-center font-semibold text-white hover:scale-105 transition-transform duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex flex-col items-center justify-center p-2 relative overflow-hidden group"
                        >
                            <div className={`absolute inset-0 ${style.bg} opacity-70 group-hover:opacity-90 transition-opacity`}></div>
                            <span className="relative z-10 drop-shadow-md text-sm">{style.name}</span>
                        </button>
                    ))}
                </div>
                 <TipBox>
                    A IA reinterpreta sua imagem no estilo escolhido. Os resultados podem variar drasticamente, então experimente diferentes estilos para obter o visual perfeito!
                </TipBox>
                {isGif && <div className="mt-4"><ApplyToAllToggle checked={applyToAll} onChange={setApplyToAll} /></div>}
            </div>
        </div>
    );
};

export default StylePanel;