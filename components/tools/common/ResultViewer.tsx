/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';
import { PhotoIcon } from '../../icons';

interface ResultViewerProps {
    isLoading: boolean;
    error: string | null;
    resultImage: string | null;
    loadingMessage?: string;
}

const ResultViewer: React.FC<ResultViewerProps> = ({ isLoading, error, resultImage, loadingMessage }) => {
    if (resultImage) {
        return <img src={resultImage} alt="Resultado da Geração" className="max-w-full max-h-full object-contain rounded-lg animate-fade-in" />;
    }

    if (!isLoading && !error) {
        return (
            <div className="text-center text-gray-500 animate-fade-in">
                <PhotoIcon className="w-16 h-16 mx-auto" />
                <p className="mt-2 font-semibold">O resultado aparecerá aqui</p>
            </div>
        );
    }

    return null;
};

export default ResultViewer;