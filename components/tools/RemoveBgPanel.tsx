/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React from 'react';
import { useEditor } from '../../context/EditorContext';
import { ScissorsIcon } from '../icons';

const RemoveBgPanel: React.FC = () => {
    const { isLoading, handleRemoveBackground } = useEditor();

    return (
        <div className="w-full bg-gray-800/50 rounded-lg p-6 flex flex-col items-center gap-6 animate-fade-in backdrop-blur-sm">
            <div className="text-center">
                <h3 className="text-xl font-bold text-gray-100">Removedor de Fundo com IA</h3>
                <p className="text-sm text-gray-400 mt-1">Isole o objeto principal da sua imagem com um único clique.</p>
            </div>
            
            <div className="w-full border-t border-gray-700/50 my-2"></div>

            <p className="text-sm text-gray-300 text-center">
                A IA irá identificar e recortar o fundo, deixando o objeto principal com um fundo transparente (PNG).
            </p>

            <button
                onClick={handleRemoveBackground}
                disabled={isLoading}
                className="w-full mt-4 bg-gradient-to-br from-sky-600 to-cyan-500 text-white font-bold py-4 px-6 rounded-lg transition-all duration-300 ease-in-out shadow-lg shadow-cyan-500/20 hover:shadow-xl hover:shadow-cyan-500/40 hover:-translate-y-px active:scale-95 text-base disabled:from-gray-600 disabled:shadow-none disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
                <ScissorsIcon className="w-5 h-5" />
                Remover Fundo
            </button>
        </div>
    );
};

export default RemoveBgPanel;
