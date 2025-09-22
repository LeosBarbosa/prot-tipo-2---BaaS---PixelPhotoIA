/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React from 'react';
import { useEditor } from '../../context/EditorContext';
import { FaceSmileIcon } from '../icons';

const FaceRecoveryPanel: React.FC = () => {
    const { isLoading, handleApplyFaceRecovery } = useEditor();

    return (
        <div className="w-full bg-gray-800/50 rounded-lg p-6 flex flex-col items-center gap-6 animate-fade-in backdrop-blur-sm">
            <div className="text-center">
                <h3 className="text-xl font-bold text-gray-100">Recuperação de Rosto com IA</h3>
                <p className="text-sm text-gray-400 mt-1">Restaure detalhes faciais e melhore a qualidade de retratos.</p>
            </div>
            
            <div className="w-full border-t border-gray-700/50 my-2"></div>

            <p className="text-sm text-gray-300 text-center">
                Ideal para fotos antigas ou de baixa resolução. A IA irá focar em melhorar a nitidez e os detalhes dos rostos na imagem.
            </p>

            <button
                onClick={handleApplyFaceRecovery}
                disabled={isLoading}
                className="w-full mt-4 bg-gradient-to-br from-pink-600 to-rose-500 text-white font-bold py-4 px-6 rounded-lg transition-all duration-300 ease-in-out shadow-lg shadow-rose-500/20 hover:shadow-xl hover:shadow-rose-500/40 hover:-translate-y-px active:scale-95 text-base disabled:from-gray-600 disabled:shadow-none disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
                <FaceSmileIcon className="w-5 h-5" />
                Aplicar Recuperação de Rosto
            </button>
        </div>
    );
};

export default FaceRecoveryPanel;