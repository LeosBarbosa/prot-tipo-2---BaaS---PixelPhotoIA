/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React from 'react';
import { useEditor } from '../../context/EditorContext';
import { FilmGrainIcon } from '../icons';
import TipBox from '../common/TipBox';

const DustAndScratchesPanel: React.FC = () => {
    const { isLoading, handleApplyDustAndScratch, layers, activeLayerId } = useEditor();
    const activeLayer = layers.find(l => l.id === activeLayerId);
    const isDisabled = isLoading || !activeLayer || activeLayer.type !== 'image';

    return (
        <div className="w-full bg-gray-800/50 rounded-lg p-6 flex flex-col items-center gap-6 animate-fade-in backdrop-blur-sm">
            <div className="text-center">
                <h3 className="text-xl font-bold text-gray-100">Efeito Poeira e Arranhões</h3>
                <p className="text-sm text-gray-400 mt-1">Dê às suas fotos um visual de filme antigo.</p>
            </div>
            
            <div className="w-full border-t border-gray-700/50 my-2"></div>

            <p className="text-sm text-gray-300 text-center">
                A IA adicionará granulação, poeira e arranhões para criar uma estética vintage e autêntica.
            </p>

            <button
                onClick={handleApplyDustAndScratch}
                disabled={isDisabled}
                className="w-full mt-4 bg-gradient-to-br from-stone-600 to-stone-500 text-white font-bold py-4 px-6 rounded-lg transition-all duration-300 ease-in-out shadow-lg shadow-stone-500/20 hover:shadow-xl hover:shadow-stone-500/40 hover:-translate-y-px active:scale-95 text-base disabled:from-gray-600 disabled:shadow-none disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
                <FilmGrainIcon className="w-5 h-5" />
                Aplicar Efeito
            </button>
            <TipBox>
                Este efeito é perfeito para dar um toque nostálgico e analógico às suas fotos digitais.
            </TipBox>
        </div>
    );
};

export default DustAndScratchesPanel;