/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React from 'react';
import { useEditor } from '../../../context/EditorContext';
import TipBox from '../common/TipBox';
import ToggleSwitch from '../common/ToggleSwitch';
import LazyIcon from '../LazyIcon';

const SuperResolutionPanel: React.FC = () => {
    const { 
        isLoading, 
        // FIX: Call the correct upscaling function from the context.
        handleEnhanceResolutionAndSharpness,
        layers, 
        activeLayerId 
    } = useEditor();
    const [preserveFace, setPreserveFace] = React.useState(true);

    const activeLayer = layers.find(l => l.id === activeLayerId);
    const isDisabled = isLoading || !activeLayer || activeLayer.type !== 'image';

    const handleApply = () => {
        // Using a fixed factor of 4x for a powerful one-click effect
        // FIX: Call the correct upscaling function from the context. Using handleEnhanceResolutionAndSharpness
        // to include generative sharpness as described in the component. Using a default intensity of 75.
        handleEnhanceResolutionAndSharpness(4, 75, preserveFace);
    };

    return (
        <div className="w-full bg-gray-800/50 rounded-lg flex flex-col items-center gap-6 animate-fade-in backdrop-blur-sm">
            <div className="text-center">
                <h3 className="text-xl font-bold text-gray-100">Super Resolução IA</h3>
                <p className="text-sm text-gray-400 mt-1">Aumente drasticamente a resolução e nitidez com um clique.</p>
            </div>
            
            <div className="w-full border-t border-gray-700/50 my-2"></div>

            <p className="text-sm text-gray-300 text-center">
                Esta ferramenta combina um aumento de 4x na resolução com nitidez generativa para um aprimoramento de imagem significativo.
            </p>

            <div className="w-full flex items-center justify-between p-3 bg-gray-900/30 rounded-lg border border-gray-700/50">
                <label htmlFor="preserve-face-sr" className="font-semibold text-gray-200 text-sm cursor-pointer">Preservar Rosto</label>
                <ToggleSwitch id="preserve-face-sr" checked={preserveFace} onChange={setPreserveFace} disabled={isLoading} />
            </div>

            <button
                onClick={handleApply}
                disabled={isDisabled}
                className="w-full mt-4 bg-gradient-to-br from-yellow-500 to-orange-500 text-white font-bold py-4 px-6 rounded-lg transition-all duration-300 ease-in-out shadow-lg shadow-yellow-500/20 hover:shadow-xl hover:shadow-yellow-500/40 hover:-translate-y-px active:scale-95 text-base disabled:from-gray-600 disabled:shadow-none disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
                <LazyIcon name="SparkleIcon" className={`w-5 h-5 ${isLoading ? 'animate-pulse' : ''}`} />
                {isLoading ? 'Aprimorando...' : 'Aplicar Super Resolução'}
            </button>
            <TipBox>
                Ative a opção "Preservar Rosto" para garantir que os detalhes faciais sejam aprimorados com realismo, especialmente em retratos.
            </TipBox>
        </div>
    );
};

export default SuperResolutionPanel;