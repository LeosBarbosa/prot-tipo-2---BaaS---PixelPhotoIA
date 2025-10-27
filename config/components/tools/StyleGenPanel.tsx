/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React from 'react';
// FIX: Import 'useEditor' from the correct path in 'context/EditorContext'.
import { useEditor } from '../../../context/EditorContext';
import TipBox from '../common/TipBox';
import LazyIcon from '../LazyIcon';

const StyleGenPanel: React.FC = () => {
    const { isLoading, handleApplyLowPoly, handleApplyStyle } = useEditor();

    return (
        <div className="w-full flex flex-col gap-4 animate-fade-in">
            <div className="text-center mb-2">
                <h3 className="text-lg font-semibold text-gray-300">Estilos Rápidos</h3>
                <p className="text-sm text-gray-400 -mt-1">Aplique estilos artísticos com um clique.</p>
            </div>

            <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-700 flex flex-col items-center gap-3">
                <h4 className="font-bold text-white text-md flex items-center gap-2">
                    <LazyIcon name="LowPolyIcon" className="w-5 h-5 text-cyan-400"/>
                    Estilo Low Poly
                </h4>
                <p className="text-sm text-gray-400 text-center -mt-2">Converte a imagem para o estilo de arte poligonal.</p>
                <button
                    onClick={handleApplyLowPoly}
                    disabled={isLoading}
                    className="w-full bg-gradient-to-br from-cyan-500 to-teal-500 text-white font-bold py-3 px-6 rounded-lg transition-all disabled:opacity-50"
                >
                    Aplicar Low Poly
                </button>
            </div>
            
            <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-700 flex flex-col items-center gap-3">
                <h4 className="font-bold text-white text-md flex items-center gap-2">
                    <LazyIcon name="PixelsIcon" className="w-5 h-5 text-green-400"/>
                    Pixel Art
                </h4>
                <p className="text-sm text-gray-400 text-center -mt-2">Transforma a imagem em pixel art de 16-bits.</p>
                <button
                    onClick={() => handleApplyStyle('Pixel art de 16 bits, paleta de cores limitada.', true)}
                    disabled={isLoading}
                    className="w-full bg-gradient-to-br from-gray-500 to-slate-600 text-white font-bold py-3 px-6 rounded-lg transition-all disabled:opacity-50"
                >
                    Aplicar Pixel Art
                </button>
            </div>
            <TipBox>
                Estes são estilos de um clique que aplicam transformações artísticas complexas instantaneamente.
            </TipBox>
        </div>
    );
};

export default StyleGenPanel;