/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState } from 'react';
import { useEditor } from '../../context/EditorContext';
import { ArrowUpOnSquareIcon } from '../icons';

const UpscalePanel: React.FC = () => {
    const { isLoading, handleApplyUpscale } = useEditor();
    const [factor, setFactor] = useState(2);
    const [preserveFace, setPreserveFace] = useState(true);

    return (
        <div className="w-full flex flex-col gap-6 animate-fade-in">
            <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-300">Melhorar Resolução (Upscale)</h3>
                <p className="text-sm text-gray-400 -mt-1">Aumente a qualidade da sua imagem com IA.</p>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Fator de Aumento</label>
                <div className="flex w-full bg-gray-800/50 border border-gray-600 rounded-lg p-1">
                    {[2, 4].map(f => (
                        <button key={f} onClick={() => setFactor(f)} disabled={isLoading} className={`w-full text-center font-semibold py-2 rounded-md transition-all text-sm ${factor === f ? 'bg-blue-600 text-white shadow-md' : 'text-gray-300 hover:bg-white/10'}`}>
                            {f}x
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex items-center justify-between bg-gray-800/50 p-3 rounded-lg">
                <label htmlFor="preserve-face" className="text-sm font-medium text-gray-300">Otimizar Faces</label>
                <input
                    id="preserve-face"
                    type="checkbox"
                    checked={preserveFace}
                    onChange={(e) => setPreserveFace(e.target.checked)}
                    disabled={isLoading}
                    className="h-4 w-4 rounded border-gray-500 bg-gray-700 text-blue-600 focus:ring-blue-500"
                />
            </div>

            <button
                onClick={() => handleApplyUpscale(factor, preserveFace)}
                disabled={isLoading}
                className="w-full mt-4 bg-gradient-to-br from-emerald-600 to-green-500 text-white font-bold py-3 px-6 rounded-lg transition-all flex items-center justify-center gap-2 disabled:from-gray-600 disabled:shadow-none disabled:cursor-not-allowed"
            >
                <ArrowUpOnSquareIcon className="w-5 h-5" />
                Aplicar Upscale
            </button>
        </div>
    );
};

export default UpscalePanel;
