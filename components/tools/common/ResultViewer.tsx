/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';
import Spinner from '../../Spinner';
import { PhotoIcon } from '../../icons';

interface ResultViewerProps {
    isLoading: boolean;
    error: string | null;
    resultImage: string | null;
    loadingMessage?: string;
}

const ResultViewer: React.FC<ResultViewerProps> = ({ isLoading, error, resultImage, loadingMessage }) => {
    if (isLoading) {
        return (
            <div className="text-center text-gray-300 animate-fade-in">
                <Spinner />
                <p className="mt-4 font-semibold animate-pulse">{loadingMessage || "Processando..."}</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center text-red-400 animate-fade-in bg-red-500/10 border border-red-500/20 p-4 rounded-lg">
                <h3 className="font-bold text-red-300">Ocorreu um Erro</h3>
                <p className="text-sm mt-1">{error}</p>
            </div>
        );
    }

    if (resultImage) {
        return <img src={resultImage} alt="Resultado da Geração" className="max-w-full max-h-full object-contain rounded-lg animate-fade-in" />;
    }

    return (
        <div className="text-center text-gray-500 animate-fade-in">
            <PhotoIcon className="w-16 h-16 mx-auto" />
            <p className="mt-2 font-semibold">O resultado aparecerá aqui</p>
        </div>
    );
};

export default ResultViewer;
