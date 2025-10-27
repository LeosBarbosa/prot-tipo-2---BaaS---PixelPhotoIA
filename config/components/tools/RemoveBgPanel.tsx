/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React from 'react';
import { useEditor } from '../../../context/EditorContext';
import TipBox from '../common/TipBox';
import LazyIcon from '../LazyIcon';

const RemoveBgPanel: React.FC = () => {
    const { isLoading, handleRemoveBackground, activeLayerId, layers } = useEditor();
    const activeLayer = layers.find(l => l.id === activeLayerId);
    const isDisabled = isLoading || !activeLayer || activeLayer.type !== 'image';

    return (
        <div className="w-full flex flex-col items-center gap-4">
            <p className="text-sm text-gray-400 text-center">
                Isole o objeto principal da sua imagem. A IA irá identificar e recortar o fundo, deixando-o com um fundo transparente (PNG). Esta ação será aplicada à camada de imagem selecionada.
            </p>

            <button
                onClick={handleRemoveBackground}
                disabled={isDisabled}
                className="w-full mt-4 bg-gradient-to-br from-sky-600 to-cyan-500 text-white font-bold py-3 px-6 rounded-lg transition-all duration-300 ease-in-out shadow-lg shadow-cyan-500/20 hover:shadow-xl hover:shadow-cyan-500/40 hover:-translate-y-px active:scale-95 text-base disabled:from-gray-600 disabled:shadow-none disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
                <LazyIcon name="ScissorsIcon" className={`w-5 h-5 ${isLoading ? 'animate-pulse' : ''}`} />
                {isLoading ? 'Removendo...' : 'Remover Fundo'}
            </button>
            <TipBox>
                Esta ferramenta gera uma imagem PNG com fundo transparente, perfeita para sobrepor em outros designs.
            </TipBox>
        </div>
    );
};

export default RemoveBgPanel;