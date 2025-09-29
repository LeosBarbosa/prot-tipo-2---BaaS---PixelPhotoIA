/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React from 'react';
import { useEditor } from '../../context/EditorContext';
import { PixelsIcon } from '../icons';
import TipBox from '../common/TipBox';

const PixelArtPanel: React.FC = () => {
    const { isLoading, handleApplyStyle } = useEditor();

    const handleApply = () => {
        const prompt = 'Pixel art de 16 bits, paleta de cores limitada.';
        // applyToAll should be true for consistency, even if it only affects GIFs
        handleApplyStyle(prompt, true); 
    };

    return (
        <div className="w-full bg-gray-800/50 rounded-lg p-6 flex flex-col items-center gap-6 animate-fade-in backdrop-blur-sm">
            <div className="text-center">
                <h3 className="text-xl font-bold text-gray-100">Estilo Pixel Art</h3>
                <p className="text-sm text-gray-400 mt-1">Transforme sua foto em arte de videogame retrô.</p>
            </div>
            
            <div className="w-full border-t border-gray-700/50 my-2"></div>

            <p className="text-sm text-gray-300 text-center">
                A IA irá reconstruir sua imagem usando um estilo de pixel art de 16 bits, criando uma estética de videogame clássico.
            </p>

            <button
                onClick={handleApply}
                disabled={isLoading}
                className="w-full mt-4 bg-gradient-to-br from-gray-500 to-slate-600 text-white font-bold py-4 px-6 rounded-lg transition-all duration-300 ease-in-out shadow-lg shadow-slate-500/20 hover:shadow-xl hover:shadow-slate-500/40 hover:-translate-y-px active:scale-95 text-base disabled:from-gray-600 disabled:shadow-none disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
                <PixelsIcon className="w-5 h-5" />
                Aplicar Estilo Pixel Art
            </button>
            <TipBox>
                Crie uma estética de videogame retrô convertendo sua foto para o estilo clássico de pixel art de 16 bits.
            </TipBox>
        </div>
    );
};

export default PixelArtPanel;