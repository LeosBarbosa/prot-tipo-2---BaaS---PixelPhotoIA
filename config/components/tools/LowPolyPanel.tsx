/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React from 'react';
import { useEditor } from '../../context/EditorContext';
import TipBox from '../common/TipBox';
import LazyIcon from '../LazyIcon';

const LowPolyPanel: React.FC = () => {
    const { isLoading, handleApplyLowPoly, activeLayerId, layers } = useEditor();
    
    const activeLayer = layers.find(l => l.id === activeLayerId);
    const isDisabled = isLoading || !activeLayer || activeLayer.type !== 'image';

    return (
        <div className="w-full bg-gray-800/50 rounded-lg flex flex-col items-center gap-6 animate-fade-in backdrop-blur-sm">
            <div className="text-center">
                <h3 className="text-xl font-bold text-gray-100">Estilo Low Poly com IA</h3>
                <p className="text-sm text-gray-400 mt-1">Transforme sua imagem em uma arte poligonal moderna.</p>
            </div>
            
            <div className="w-full border-t border-gray-700/50 my-2"></div>

            <p className="text-sm text-gray-300 text-center">
                A IA irá reconstruir a sua imagem usando uma malha de polígonos, criando um efeito visual estilizado e geométrico.
            </p>

            <button
                onClick={handleApplyLowPoly}
                disabled={isDisabled}
                className="w-full mt-4 bg-gradient-to-br from-cyan-600 to-teal-500 text-white font-bold py-4 px-6 rounded-lg transition-all duration-300 ease-in-out shadow-lg shadow-cyan-500/20 hover:shadow-xl hover:shadow-cyan-500/40 hover:-translate-y-px active:scale-95 text-base disabled:from-gray-600 disabled:shadow-none disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
                <LazyIcon name="LowPolyIcon" className="w-5 h-5" />
                Aplicar Estilo Low Poly
            </button>
            <TipBox>
                Este efeito transforma sua imagem em uma arte geométrica, ideal para criar papéis de parede e avatares estilizados.
            </TipBox>
        </div>
    );
};

export default LowPolyPanel;