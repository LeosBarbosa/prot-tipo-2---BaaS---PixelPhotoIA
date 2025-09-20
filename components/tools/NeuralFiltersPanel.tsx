/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';
import { useEditor } from '../../context/EditorContext';

const filters = [
    { name: 'Sonho', prompt: 'aplique um efeito de sonho suave e etéreo com um brilho suave e cores pastel', bg: 'bg-gradient-to-br from-pink-300 to-purple-400' },
    { name: 'Cinemático', prompt: 'aplique uma gradação de cor cinematográfica de teal e laranja, aumentando o contraste para um visual dramático', bg: 'bg-gradient-to-br from-teal-500 to-orange-500' },
    { name: 'Néon Noir', prompt: 'transforme a imagem em uma cena noturna de neon noir, com luzes de neon vibrantes e sombras profundas', bg: 'bg-gradient-to-br from-fuchsia-600 to-indigo-700' },
    { name: 'Surreal', prompt: 'aplique um filtro surreal e psicadélico com cores distorcidas e padrões fluidos', bg: 'bg-gradient-to-br from-lime-400 to-cyan-500' },
    { name: 'Fantasia', prompt: 'dê à imagem um brilho de fantasia mágica, com tons de lavanda, ouro e partículas de luz flutuantes', bg: 'bg-gradient-to-br from-violet-400 to-yellow-300' },
    { name: 'Vaporwave', prompt: 'aplique uma estética vaporwave, com tons de rosa e ciano, falhas e motivos nostálgicos dos anos 80', bg: 'bg-gradient-to-br from-pink-500 to-cyan-400' },
];

const NeuralFiltersPanel: React.FC = () => {
    const { isLoading, handleApplyAIAdjustment } = useEditor();

    return (
        <div className="w-full flex flex-col gap-4 animate-fade-in">
            <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-300">Filtros Neurais</h3>
                <p className="text-sm text-gray-400 -mt-1">Aplique filtros criativos com um clique.</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
                {filters.map(filter => (
                    <button
                        key={filter.name}
                        onClick={() => handleApplyAIAdjustment(filter.prompt)}
                        disabled={isLoading}
                        className="aspect-video bg-gray-800 rounded-lg text-center font-semibold text-white hover:scale-105 transition-transform duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex flex-col items-center justify-center p-2 relative overflow-hidden group"
                    >
                        <div className={`absolute inset-0 ${filter.bg} opacity-70 group-hover:opacity-90 transition-opacity`}></div>
                        <span className="relative z-10 drop-shadow-md text-sm">{filter.name}</span>
                    </button>
                ))}
            </div>
        </div>
    );
};

export default NeuralFiltersPanel;