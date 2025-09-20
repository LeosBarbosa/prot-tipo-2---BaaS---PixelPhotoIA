/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState } from 'react';
import { useLoadingError } from '../../context/EditorContext';
import { faceSwap } from '../../services/geminiService';
import ImageDropzone from './common/ImageDropzone';
import ResultViewer from './common/ResultViewer';
import { FaceSmileIcon } from '../icons';

const FaceSwapPanel: React.FC = () => {
    const { isLoading, error, setError, setIsLoading } = useLoadingError();
    const [sourceImage, setSourceImage] = useState<File | null>(null);
    const [targetImage, setTargetImage] = useState<File | null>(null);
    const [resultImage, setResultImage] = useState<string | null>(null);

    const handleGenerate = async () => {
        if (!sourceImage || !targetImage) {
            setError("Por favor, carregue a imagem de Origem e a de Alvo.");
            return;
        }
        setIsLoading(true);
        setError(null);
        setResultImage(null);
        try {
            const result = await faceSwap(sourceImage, targetImage);
            setResultImage(result);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Ocorreu um erro desconhecido.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="p-4 md:p-6 h-full flex flex-col md:flex-row gap-6">
            <aside className="w-full md:w-96 flex-shrink-0 bg-gray-900/30 rounded-lg p-4 flex flex-col gap-4 border border-gray-700/50">
                <div className="text-center">
                    <h3 className="text-lg font-semibold text-gray-200">Troca de Rosto (Face Swap)</h3>
                    <p className="text-sm text-gray-400 mt-1">Substitua um rosto em uma foto por outro.</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <ImageDropzone 
                        imageFile={sourceImage}
                        onFileSelect={setSourceImage}
                        label="Rosto de Origem"
                    />
                    <ImageDropzone 
                        imageFile={targetImage}
                        onFileSelect={setTargetImage}
                        label="Imagem Alvo"
                    />
                </div>
                <button
                    onClick={handleGenerate}
                    disabled={isLoading || !sourceImage || !targetImage}
                    className="w-full mt-auto bg-gradient-to-br from-red-600 to-orange-500 text-white font-bold py-3 px-5 rounded-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                    <FaceSmileIcon className="w-5 h-5" />
                    Trocar Rostos
                </button>
            </aside>
            <main className="flex-grow bg-black/20 rounded-lg border border-gray-700/50 flex items-center justify-center p-4">
                <ResultViewer
                    isLoading={isLoading}
                    error={error}
                    resultImage={resultImage}
                    loadingMessage="Realizando a troca de rostos..."
                />
            </main>
        </div>
    );
};

export default FaceSwapPanel;
