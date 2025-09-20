/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState } from 'react';
import { useLoadingError } from '../../context/EditorContext';
import { fuseImages } from '../../services/geminiService';
import ImageDropzone from './common/ImageDropzone';
import ResultViewer from './common/ResultViewer';
import { AdjustmentsHorizontalIcon } from '../icons';

const CreativeFusionPanel: React.FC = () => {
    const { isLoading, error, setError, setIsLoading } = useLoadingError();
    const [compositionImage, setCompositionImage] = useState<File | null>(null);
    const [styleImage, setStyleImage] = useState<File | null>(null);
    const [resultImage, setResultImage] = useState<string | null>(null);

    const handleGenerate = async () => {
        if (!compositionImage || !styleImage) {
            setError("Por favor, carregue a imagem de Composição e a de Estilo.");
            return;
        }
        setIsLoading(true);
        setError(null);
        setResultImage(null);
        try {
            const result = await fuseImages(compositionImage, styleImage);
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
                    <h3 className="text-lg font-semibold text-gray-200">Fusão Criativa</h3>
                    <p className="text-sm text-gray-400 mt-1">Combine a estrutura de uma imagem com o estilo de outra.</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <ImageDropzone 
                        imageFile={compositionImage}
                        onFileSelect={setCompositionImage}
                        label="Composição"
                    />
                    <ImageDropzone 
                        imageFile={styleImage}
                        onFileSelect={setStyleImage}
                        label="Estilo"
                    />
                </div>
                <button
                    onClick={handleGenerate}
                    disabled={isLoading || !compositionImage || !styleImage}
                    className="w-full mt-auto bg-gradient-to-br from-pink-600 to-purple-500 text-white font-bold py-3 px-5 rounded-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                    <AdjustmentsHorizontalIcon className="w-5 h-5" />
                    Fundir Imagens
                </button>
            </aside>
            <main className="flex-grow bg-black/20 rounded-lg border border-gray-700/50 flex items-center justify-center p-4">
                <ResultViewer
                    isLoading={isLoading}
                    error={error}
                    resultImage={resultImage}
                    loadingMessage="Criando fusão artística..."
                />
            </main>
        </div>
    );
};

export default CreativeFusionPanel;
