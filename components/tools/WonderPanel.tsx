/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React from 'react';
import { useEditor } from '../../context/EditorContext';
import { SparkleIcon } from '../icons';

const WonderPanel: React.FC = () => {
    const { isLoading, handleWonderModelUpscale } = useEditor();

    return (
        <div className="w-full bg-gray-800/50 rounded-lg p-6 flex flex-col items-center gap-6 animate-fade-in backdrop-blur-sm">
            <div className="text-center">
                <h3 className="text-xl font-bold text-gray-100">Modelo Wonder</h3>
                <p className="text-sm text-gray-400 mt-1">Aprimore sua imagem com a mais alta qualidade de IA.</p>
            </div>
            
            <div className="w-full border-t border-gray-700/50 my-2"></div>

            <p className="text-sm text-gray-300 text-center">
                Esta ferramenta utiliza um modelo avançado para aumentar a resolução, nitidez e remover ruído, restaurando detalhes para um resultado profissional.
            </p>

            <button
                onClick={handleWonderModelUpscale}
                disabled={isLoading}
                className="w-full mt-4 bg-gradient-to-br from-purple-600 to-indigo-500 text-white font-bold py-4 px-6 rounded-lg transition-all duration-300 ease-in-out shadow-lg shadow-indigo-500/20 hover:shadow-xl hover:shadow-indigo-500/40 hover:-translate-y-px active:scale-95 text-base disabled:from-gray-600 disabled:shadow-none disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
                <SparkleIcon className="w-5 h-5" />
                Aprimorar Imagem
            </button>
        </div>
    );
};

export default WonderPanel;