/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';
import { PhotoIcon, DownloadIcon, BrushIcon, LayersIcon } from '../../icons';
import Spinner from '../../Spinner';
import { useEditor } from '../../../context/EditorContext';
import { dataURLtoFile } from '../../../utils/imageUtils';

interface ResultViewerProps {
    isLoading: boolean;
    error: string | null;
    resultImage: string | null;
    loadingMessage?: string;
}

const ResultViewer: React.FC<ResultViewerProps> = ({ 
    isLoading, 
    error, 
    resultImage, 
    loadingMessage,
}) => {

    if (isLoading) {
        return (
            <div className="text-center text-gray-400 animate-fade-in flex flex-col items-center justify-center h-full">
                <Spinner />
                <p 
                  key={loadingMessage}
                  className="mt-4 font-semibold text-lg text-gray-200 animate-fade-in-text"
                >
                  {loadingMessage || 'Processando...'}
                </p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center text-red-400 bg-red-500/10 border border-red-500/20 p-4 rounded-lg animate-fade-in w-full max-w-md">
                <h3 className="font-bold text-red-300">Ocorreu um Erro</h3>
                <p className="text-sm mt-1">{error}</p>
            </div>
        );
    }
    
    if (resultImage) {
        return (
            <div className="w-full h-full flex flex-col items-center justify-center gap-4">
                <div className="flex-grow w-full flex items-center justify-center overflow-hidden min-h-0">
                    <img src={resultImage} alt="Resultado da Geração" className="max-w-full max-h-full object-contain rounded-lg animate-fade-in" />
                </div>
            </div>
        );
    }

    // Default state when not loading, no error, and no image
    return (
        <div className="text-center text-gray-500 animate-fade-in">
            <PhotoIcon className="w-16 h-16 mx-auto" />
            <p className="mt-2 font-semibold">O resultado aparecerá aqui</p>
        </div>
    );
};

export default ResultViewer;