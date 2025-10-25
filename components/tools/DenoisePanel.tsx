/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React from 'react';
import { useEditor } from '../../context/EditorContext';
import TipBox from '../common/TipBox';
import LazyIcon from '../LazyIcon';

const DenoisePanel: React.FC = () => {
    const { isLoading, handleDenoise, activeLayerId, layers } = useEditor();
    const activeLayer = layers.find(l => l.id === activeLayerId);
    const isDisabled = isLoading || !activeLayer || activeLayer.type !== 'image';

    return (
        <div className="w-full bg-gray-800/50 rounded-lg p-6 flex flex-col items-center gap-6 animate-fade-in backdrop-blur-sm">
            <div className="text-center">
                <h3 className="text-xl font-bold text-gray-100">Remover Ruído (Denoise)</h3>
                <p className="text-sm text-gray-400 mt-1">Limpe o ruído e a granulação da sua imagem, preservando os detalhes.</p>
            </div>
            
            <div className="w-full border-t border-gray-700/50 my-2"></div>

            <p className="text-sm text-gray-300 text-center">
                A IA irá analisar e remover o ruído indesejado, preservando os detalhes importantes da sua foto, como texturas finas e bordas nítidas.
            </p>

            <button
                onClick={handleDenoise}
                disabled={isDisabled}
                className="w-full mt-4 bg-gradient-to-br from-blue-600 to-sky-500 text-white font-bold py-4 px-6 rounded-lg transition-all duration-300 ease-in-out shadow-lg shadow-sky-500/20 hover:shadow-xl hover:shadow-sky-500/40 hover:-translate-y-px active:scale-95 text-base disabled:from-gray-600 disabled:shadow-none disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
                <LazyIcon name="DenoiseIcon" className="w-5 h-5" />
                Aplicar Denoise
            </button>
            <TipBox>
                Esta ferramenta é ideal para fotos tiradas em condições de pouca luz que geralmente têm muito ruído ou granulação.
            </TipBox>
        </div>
    );
};

export default DenoisePanel;