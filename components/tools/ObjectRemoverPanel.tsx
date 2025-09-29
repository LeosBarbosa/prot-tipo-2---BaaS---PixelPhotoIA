/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React from 'react';
import { useEditor } from '../../context/EditorContext';
import { EraserIcon, BrushIcon } from '../icons';
import TipBox from '../common/TipBox';

const ObjectRemoverPanel: React.FC = () => {
    const {
        isLoading,
        maskDataUrl,
        clearMask,
        handleObjectRemove,
        brushSize,
        setBrushSize,
    } = useEditor();

    const isRemoveDisabled = isLoading || !maskDataUrl;

    return (
        <div className="w-full flex flex-col gap-4 animate-fade-in">
            <div className="text-center">
                <p className="text-sm text-gray-400">
                    Pinte sobre a área que deseja remover. A IA irá preencher o espaço de forma inteligente.
                </p>
            </div>

            <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between text-sm">
                    <label htmlFor="brush-size-remover" className="font-medium text-gray-300 flex items-center gap-2">
                        <BrushIcon className="w-5 h-5"/>
                        Tamanho do Pincel
                    </label>
                    <span className="font-mono text-gray-200">{brushSize}</span>
                </div>
                <input id="brush-size-remover" type="range" min="5" max="150" value={brushSize} onChange={e => setBrushSize(Number(e.target.value))} className="w-full" disabled={isLoading} />
            </div>
            
             <TipBox>
                Para melhores resultados, pinte sobre todo o objeto que deseja remover, incluindo sua sombra.
            </TipBox>
            
            <div className="border-t border-gray-700/50 my-1"></div>

            <div className="flex gap-2">
                 <button
                    type="button"
                    onClick={clearMask}
                    disabled={isLoading || !maskDataUrl}
                    className="w-full bg-white/10 hover:bg-white/20 text-white font-semibold py-3 px-4 rounded-lg transition-colors text-sm disabled:opacity-50"
                >
                    Limpar
                </button>
                <button
                    type="button"
                    onClick={handleObjectRemove}
                    className="w-full bg-gradient-to-br from-red-600 to-orange-500 text-white font-bold py-3 px-4 rounded-lg transition-all flex items-center justify-center gap-2 disabled:from-gray-600 disabled:cursor-not-allowed"
                    disabled={isRemoveDisabled}
                >
                    <EraserIcon className="w-5 h-5" />
                    Remover
                </button>
            </div>
        </div>
    );
};

export default ObjectRemoverPanel;