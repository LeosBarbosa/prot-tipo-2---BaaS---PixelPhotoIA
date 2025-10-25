/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React from 'react';
import { useEditor } from '../../context/EditorContext';
import TipBox from '../common/TipBox';
import LazyIcon from '../LazyIcon';

const ClonePanel: React.FC = () => {
    const {
        isLoading,
        maskDataUrl,
        clearMask,
        handleApplyClone,
        brushSize,
        setBrushSize,
        cloneSource,
        setCloneSource,
    } = useEditor();
    
    const isDisabled = isLoading || !maskDataUrl || !cloneSource;

    return (
        <div className="w-full flex flex-col gap-4 animate-fade-in">
            <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-300">Clone Stamp</h3>
                <p className="text-sm text-gray-400 -mt-1">
                    Copie pixels de uma área para outra.
                </p>
            </div>

            <TipBox>
                <strong>1.</strong> Mantenha pressionada a tecla <kbd className="px-2 py-1.5 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded-lg">Alt</kbd> (ou <kbd className="px-2 py-1.5 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded-lg">Option</kbd> no Mac) e clique na imagem para definir a área de origem.
                <br />
                <strong>2.</strong> Solte a tecla e pinte sobre a área que deseja substituir.
            </TipBox>

            <div className="bg-gray-900/30 p-4 rounded-lg border border-gray-700/50">
                 <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                            <LazyIcon name="BrushIcon" className="w-5 h-5 text-gray-400" />
                            <label htmlFor="brush-size-clone" className="font-medium text-gray-300">Tamanho do Pincel</label>
                        </div>
                        <span className="font-mono text-gray-200">{brushSize}</span>
                    </div>
                    <input id="brush-size-clone" type="range" min="5" max="150" value={brushSize} onChange={e => setBrushSize(Number(e.target.value))} className="w-full" disabled={isLoading} />
                </div>
            </div>
            
            {cloneSource ? (
                <div className="text-center text-green-300 bg-green-900/40 p-2 rounded-md text-sm border border-green-700/50">
                    Origem definida. Pinte a área de destino.
                </div>
            ) : (
                <div className="text-center text-yellow-300 bg-yellow-900/40 p-2 rounded-md text-sm border border-yellow-700/50">
                    Origem não definida. Use Alt/Option + Clique.
                </div>
            )}

            <button
                type="button"
                onClick={() => setCloneSource(null)}
                disabled={isLoading || !cloneSource}
                className="w-full bg-gray-800/50 hover:bg-gray-700/50 text-white font-semibold py-2 px-3 rounded-lg transition-colors text-sm disabled:opacity-50"
            >
                Redefinir Origem
            </button>
             
            <div className="border-t border-gray-700/50 my-1"></div>

            <div className="flex gap-2">
                 <button
                    type="button"
                    onClick={clearMask}
                    disabled={isLoading || !maskDataUrl}
                    className="w-full bg-gray-700/60 hover:bg-gray-600/80 text-white font-semibold py-3 px-4 rounded-lg transition-colors text-sm disabled:opacity-50"
                >
                    Limpar Seleção
                </button>
                <button
                    type="button"
                    onClick={handleApplyClone}
                    disabled={isDisabled}
                    className="w-full bg-gradient-to-br from-green-600 to-teal-500 text-white font-bold py-3 px-4 rounded-lg transition-all flex items-center justify-center gap-2 disabled:from-gray-600 disabled:cursor-not-allowed active:scale-95"
                >
                    <LazyIcon name="CloneIcon" className="w-5 h-5"/>
                    Aplicar Clone
                </button>
            </div>
        </div>
    );
};

export default ClonePanel;