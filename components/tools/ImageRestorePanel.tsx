/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React from 'react';
import { useEditor } from '../../context/EditorContext';
import { SparkleIcon } from '../icons';
import TipBox from '../common/TipBox';

const ImageRestorePanel: React.FC = () => {
    const { isLoading, handleRestorePhoto } = useEditor();

    return (
        <div className="w-full bg-gray-800/50 rounded-lg p-6 flex flex-col items-center gap-6 animate-fade-in backdrop-blur-sm">
            <div className="text-center">
                <h3 className="text-xl font-bold text-gray-100">Restauração de Foto</h3>
                <p className="text-sm text-gray-400 mt-1">Motor de Restauração de Nova Geração.</p>
            </div>
            
            <div className="w-full border-t border-gray-700/50 my-2"></div>

            <p className="text-sm text-gray-300 text-center">
                Esta ferramenta unificada utiliza um modelo avançado para aumentar a resolução, nitidez, remover ruído e restaurar detalhes faciais, tudo para um resultado profissional com um único clique.
            </p>

            <button
                onClick={handleRestorePhoto}
                disabled={isLoading}
                className="w-full mt-4 bg-gradient-to-br from-purple-600 to-indigo-500 text-white font-bold py-4 px-6 rounded-lg transition-all duration-300 ease-in-out shadow-lg shadow-indigo-500/20 hover:shadow-xl hover:shadow-indigo-500/40 hover:-translate-y-px active:scale-95 text-base disabled:from-gray-600 disabled:shadow-none disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
                <SparkleIcon className="w-5 h-5" />
                Aprimorar Imagem
            </button>
            <TipBox>
                Este é um poderoso restaurador completo. Ele melhora rostos, remove ruído, arranhões e aumenta a nitidez com um único clique.
            </TipBox>
        </div>
    );
};

export default ImageRestorePanel;