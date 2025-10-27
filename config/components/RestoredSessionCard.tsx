/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React from 'react';
import { useEditor } from '../../context/EditorContext';
import LazyIcon from './LazyIcon';

const RestoredSessionCard: React.FC = () => {
    const { handleUploadNew, setIsEditingSessionActive, currentImageUrl } = useEditor();

    const handleContinue = () => {
        setIsEditingSessionActive(true);
    };

    return (
        <div className="max-w-2xl mx-auto mb-8 animate-zoom-rise">
            <div className="group relative bg-gray-800/60 border-2 border-blue-500/50 rounded-xl p-6 text-center shadow-lg shadow-blue-500/10">
                <div className="flex items-center justify-center gap-2 mb-3">
                    <LazyIcon name="SparkleIcon" className="w-6 h-6 text-blue-400" />
                    <h2 className="text-xl font-bold text-white">Sessão Anterior Encontrada</h2>
                </div>
                <p className="text-gray-300 mb-4">Deseja continuar de onde parou?</p>
                {currentImageUrl && (
                    <div className="mb-4">
                        <img src={currentImageUrl} alt="Sessão anterior" className="w-32 h-32 object-contain mx-auto rounded-lg bg-black/20" />
                    </div>
                )}
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <button
                        onClick={handleUploadNew}
                        className="w-full sm:w-auto flex-1 bg-gray-700/60 hover:bg-gray-600/80 text-white font-semibold py-3 px-6 rounded-lg transition-all"
                    >
                        Iniciar Nova Sessão
                    </button>
                    <button
                        onClick={handleContinue}
                        className="w-full sm:w-auto flex-1 bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-6 rounded-lg transition-all"
                    >
                        Continuar Sessão
                    </button>
                </div>
            </div>
        </div>
    );
};

export default RestoredSessionCard;