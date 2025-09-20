/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React from 'react';
import { useEditor } from '../../context/EditorContext';
import { SunIcon, UserIcon } from '../icons';

const PortraitsPanel: React.FC = () => {
    const { isLoading, handleApplyAIAdjustment, handleGenerateProfessionalPortrait } = useEditor();

    return (
        <div className="w-full flex flex-col gap-4 animate-fade-in">
            <div className="text-center mb-2">
                <h3 className="text-lg font-semibold text-gray-300">Retratos com IA</h3>
                <p className="text-sm text-gray-400 -mt-1">Melhore seus retratos com um clique.</p>
            </div>

            <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-700 flex flex-col items-center gap-3">
                <h4 className="font-bold text-white text-md flex items-center gap-2">
                    <SunIcon className="w-5 h-5 text-yellow-400"/>
                    Reacender (Dia Ensolarado)
                </h4>
                <p className="text-sm text-gray-400 text-center -mt-2">Ajusta a iluminação para simular um dia ensolarado.</p>
                <button
                    onClick={() => handleApplyAIAdjustment('Ajuste a iluminação do retrato para parecer um dia ensolarado, com luz quente e sombras suaves.')}
                    disabled={isLoading}
                    className="w-full bg-gradient-to-br from-yellow-500 to-orange-500 text-white font-bold py-3 px-6 rounded-lg transition-all disabled:opacity-50"
                >
                    Aplicar Iluminação
                </button>
            </div>
            
            <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-700 flex flex-col items-center gap-3">
                <h4 className="font-bold text-white text-md flex items-center gap-2">
                    <UserIcon className="w-5 h-5 text-blue-400"/>
                    Retrato Profissional
                </h4>
                <p className="text-sm text-gray-400 text-center -mt-2">Transforma sua foto em um retrato de negócios.</p>
                <button
                    onClick={handleGenerateProfessionalPortrait}
                    disabled={isLoading}
                    className="w-full bg-gradient-to-br from-blue-500 to-indigo-500 text-white font-bold py-3 px-6 rounded-lg transition-all disabled:opacity-50"
                >
                    Gerar Retrato
                </button>
            </div>

        </div>
    );
};

export default PortraitsPanel;
