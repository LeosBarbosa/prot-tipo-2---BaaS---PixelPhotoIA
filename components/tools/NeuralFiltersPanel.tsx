/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState } from 'react';
import { useEditor } from '../../context/EditorContext';
import ApplyToAllToggle from '../common/ApplyToAllToggle';
import StylePreview from '../common/StylePreview';
import TipBox from '../common/TipBox';
// FIX: Import SparkleIcon to use as a default icon
import { SparkleIcon } from '../icons';
import { Trend } from '../../types';

const filters: Trend[] = [
    { name: 'Sonho', prompt: 'aplique um efeito de sonho suave e etéreo com um brilho suave e cores pastel', bg: 'bg-gradient-to-br from-pink-300 to-purple-400', icon: <SparkleIcon/> },
    { name: 'Cinemático', prompt: 'aplique uma gradação de cor cinematográfica de teal e laranja, aumentando o contraste para um visual dramático', bg: 'bg-gradient-to-br from-teal-500 to-orange-500', icon: <SparkleIcon/> },
    { name: 'Néon Noir', prompt: 'transforme a imagem em uma cena noturna de neon noir, com luzes de neon vibrantes e sombras profundas', bg: 'bg-gradient-to-br from-fuchsia-600 to-indigo-700', icon: <SparkleIcon/> },
    { name: 'Surreal', prompt: 'aplique um filtro surreal e psicadélico com cores distorcidas e padrões fluidos', bg: 'bg-gradient-to-br from-lime-400 to-cyan-500', icon: <SparkleIcon/> },
    { name: 'Fantasia', prompt: 'dê à imagem um brilho de fantasia mágica, com tons de lavanda, ouro e partículas de luz flutuantes', bg: 'bg-gradient-to-br from-violet-400 to-yellow-300', icon: <SparkleIcon/> },
    { name: 'Vaporwave', prompt: 'aplique uma estética vaporwave, com tons de rosa e ciano, falhas e motivos nostálgicos dos anos 80', bg: 'bg-gradient-to-br from-pink-500 to-cyan-400', icon: <SparkleIcon/> },
    { name: 'Vintage', prompt: 'aplique um efeito de foto antiga, com grão de filme, leve dessaturação de cores e um leve tom sépia', bg: 'bg-gradient-to-br from-amber-600 to-stone-700', icon: <SparkleIcon/> },
    { name: 'Impressionismo', prompt: 'Pintura a óleo no estilo impressionista, capturando a luz e o momento, com pinceladas visíveis.', bg: 'bg-gradient-to-br from-rose-300 to-violet-400', icon: <SparkleIcon/> },
    { name: 'Art Déco', prompt: 'Estilo Art Déco, com formas geométricas, cores fortes e detalhes luxuosos.', bg: 'bg-gradient-to-br from-amber-400 to-gray-800', icon: <SparkleIcon/> },
    { name: 'Esboço Carvão', prompt: 'Esboço a carvão em preto e branco, com linhas expressivas e sombreamento.', bg: 'bg-gradient-to-br from-gray-300 to-gray-600', icon: <SparkleIcon/> },
    { name: 'Modelo 3D', prompt: 'Renderização de modelo 3D, com iluminação de estúdio e texturas suaves.', bg: 'bg-gradient-to-br from-slate-400 to-slate-600', icon: <SparkleIcon/> },
    { name: 'Steampunk', prompt: 'Estilo Steampunk, com engrenagens de latão, vapor e estética vitoriana.', bg: 'bg-gradient-to-br from-orange-600 to-amber-800', icon: <SparkleIcon/> }
];

const NeuralFiltersPanel: React.FC = () => {
    const { isLoading, isGif, generateAIPreview, isPreviewLoading, previewState } = useEditor();
    const [applyToAll, setApplyToAll] = useState(true);

    const handleFilterClick = (filter: Trend) => {
        generateAIPreview(filter, applyToAll);
    };

    return (
        <div className="w-full flex flex-col gap-4 animate-fade-in">
            <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-300">Filtros Neurais</h3>
                <p className="text-sm text-gray-400 -mt-1">Aplique filtros criativos e atmosféricos com um clique.</p>
            </div>

            <StylePreview />

            <div className={`transition-opacity duration-300 ${isPreviewLoading || previewState ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
                <div className="grid grid-cols-2 gap-3">
                    {filters.map(filter => (
                        <button
                            key={filter.name}
                            onClick={() => handleFilterClick(filter)}
                            disabled={isLoading || isPreviewLoading}
                            className="aspect-video bg-gray-800 rounded-lg text-center font-semibold text-white hover:scale-105 transition-transform duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex flex-col items-center justify-center p-2 relative overflow-hidden group"
                        >
                            <div className={`absolute inset-0 ${filter.bg} opacity-70 group-hover:opacity-90 transition-opacity`}></div>
                            <span className="relative z-10 drop-shadow-md text-sm">{filter.name}</span>
                        </button>
                    ))}
                </div>
                <TipBox>
                    Filtros neurais usam IA para aplicar efeitos atmosféricos e de iluminação complexos que podem transformar completamente o humor da sua foto.
                </TipBox>
                {isGif && <div className="mt-4"><ApplyToAllToggle checked={applyToAll} onChange={setApplyToAll} /></div>}
            </div>
        </div>
    );
};

export default NeuralFiltersPanel;