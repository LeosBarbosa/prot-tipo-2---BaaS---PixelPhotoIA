/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React from 'react';
import { useEditor } from '../context/EditorContext';
import { SparkleIcon } from './icons';

const RestoredSessionCard: React.FC = () => {
    const { handleUploadNew, setActiveTool, currentImage, currentImageUrl } = useEditor();

    const handleContinue = () => {
        // Just open the editor view by selecting a default tool
        setActiveTool('adjust');
    };

    return (
        <div className="max-w-2xl mx-auto mb-8 animate-zoom-rise">
            <div
                className="group relative bg-gray-800/60 border-2 border-blue-500/50 rounded-xl p-6 text-left transition-all duration-300 shadow-lg shadow-blue-500/10"
            >
                <div className="flex flex-col sm:flex-row items-center gap-6">
                    {currentImageUrl && (
                        <img 
                            src={currentImageUrl} 
                            alt="Pré-visualização da sessão restaurada"
                            className="w-24 h-24 rounded-lg object-cover bg-gray-900 flex-shrink-0"
                        />
                    )}
                    <div className="flex-grow text-center sm:text-left">
                        <h3 className="font-semibold text-lg text-white flex items-center justify-center sm:justify-start gap-2">
                            <SparkleIcon className="w-5 h-5 text-blue-400" />
                            Bem-vindo de volta!
                        </h3>
                        <p className="text-sm text-gray-400 mt-1">Sua sessão de edição anterior foi restaurada.</p>
                    </div>
                     <div className="flex flex-col sm:flex-row gap-2 mt-4 sm:mt-0 w-full sm:w-auto">
                        <button
                            onClick={handleUploadNew}
                            className="w-full sm:w-auto bg-white/10 hover:bg-white/20 text-white font-semibold py-2 px-4 rounded-md transition-colors text-sm"
                        >
                            Iniciar Nova
                        </button>
                        <button
                            onClick={handleContinue}
                            className="w-full sm:w-auto bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-4 rounded-md transition-colors text-sm"
                        >
                            Continuar Editando
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RestoredSessionCard;