/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React from 'react';
// FIX: Correct import path
import { useEditor } from '../../context/EditorContext';
import { ExpandIcon } from '../icons';
import TipBox from '../common/TipBox';

const NewAspectRatioPanel: React.FC = () => {
    const { isLoading, handleApplyNewAspectRatio, activeLayerId, layers } = useEditor();

    const activeLayer = layers.find(l => l.id === activeLayerId);
    const isDisabled = isLoading || !activeLayer || activeLayer.type !== 'image';

    return (
        <div className="w-full bg-gray-800/50 rounded-lg p-6 flex flex-col items-center gap-6 animate-fade-in backdrop-blur-sm">
            <div className="text-center">
                <h3 className="text-xl font-bold text-gray-100">Nova Proporção 16:9</h3>
                <p className="text-sm text-gray-400 mt-1">Expanda sua imagem para a proporção de paisagem (16:9) usando IA.</p>
            </div>
            
            <div className="w-full border-t border-gray-700/50 my-2"></div>

            <p className="text-sm text-gray-300 text-center">
                A IA irá gerar conteúdo adicional para preencher o novo espaço, mantendo o estilo e o contexto da imagem original. Esta ação será aplicada à camada de imagem selecionada.
            </p>

            <button
                onClick={handleApplyNewAspectRatio}
                disabled={isDisabled}
                className="w-full mt-4 bg-gradient-to-br from-indigo-600 to-purple-500 text-white font-bold py-4 px-6 rounded-lg transition-all duration-300 ease-in-out shadow-lg shadow-indigo-500/20 hover:shadow-xl hover:shadow-indigo-500/40 hover:-translate-y-px active:scale-95 text-base disabled:from-gray-600 disabled:shadow-none disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
                <ExpandIcon className="w-5 h-5" />
                Aplicar Proporção 16:9
            </button>
            <TipBox>
                Este processo é semelhante à "Pintura Expansiva (Outpainting)". A IA criará novas partes da imagem para se ajustar à proporção de paisagem.
            </TipBox>
        </div>
    );
};

export default NewAspectRatioPanel;
