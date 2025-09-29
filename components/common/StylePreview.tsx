/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React from 'react';
import { useEditor } from '../../context/EditorContext';
import ComparisonSlider from '../ComparisonSlider';
import { CheckCircleIcon, CloseIcon } from '../icons';
import Spinner from '../Spinner';

const StylePreview: React.FC = () => {
    const { 
        previewState, 
        setPreviewState, 
        isPreviewLoading, 
        currentImageUrl,
        commitAIPreview,
        isLoading,
    } = useEditor();

    if (!previewState && !isPreviewLoading) {
        return null;
    }

    const handleCancel = () => {
        setPreviewState(null);
    };

    const handleApply = () => {
        commitAIPreview();
    };

    return (
        <div className="mt-4 p-4 bg-gray-900/50 border border-gray-700 rounded-lg animate-fade-in">
            <h4 className="text-md font-semibold text-gray-200 text-center mb-3">Pré-visualização</h4>
            
            <div className="aspect-video bg-black/20 rounded-md flex items-center justify-center relative">
                {isPreviewLoading && (
                    <div className="text-center">
                        <Spinner />
                        <p className="text-sm text-gray-400 mt-2">Gerando pré-visualização...</p>
                    </div>
                )}
                {previewState && currentImageUrl && (
                    <ComparisonSlider 
                        originalSrc={currentImageUrl}
                        modifiedSrc={previewState.url}
                    />
                )}
            </div>
            
            {previewState && (
                <div className="flex gap-2 mt-3">
                    <button
                        onClick={handleCancel}
                        disabled={isLoading}
                        className="w-full bg-white/10 hover:bg-white/20 text-white font-semibold py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                        <CloseIcon className="w-5 h-5" />
                        Cancelar
                    </button>
                    <button
                        onClick={handleApply}
                        disabled={isLoading}
                        className="w-full bg-gradient-to-br from-green-600 to-green-500 text-white font-bold py-2 px-4 rounded-lg transition-all flex items-center justify-center gap-2"
                    >
                        <CheckCircleIcon className="w-5 h-5" />
                        Aplicar Estilo
                    </button>
                </div>
            )}
        </div>
    );
};

export default StylePreview;
