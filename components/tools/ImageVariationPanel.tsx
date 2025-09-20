/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState } from 'react';
import { useLoadingError } from '../../context/EditorContext';
import { generateImageVariation } from '../../services/geminiService';
import ImageDropzone from './common/ImageDropzone';
import ResultViewer from './common/ResultViewer';
import { LayersIcon } from '../icons';

const ImageVariationPanel: React.FC = () => {
    const { isLoading, error, setError, setIsLoading } = useLoadingError();
    const [sourceImage, setSourceImage] = useState<File | null>(null);
    const [resultImage, setResultImage] = useState<string | null>(null);
    const [strength, setStrength] = useState(50);

    const handleGenerate = async () => {
        if (!sourceImage) {
            setError("Por favor, carregue uma imagem para gerar variações.");
            return;
        }
        setIsLoading(true);
        setError(null);
        setResultImage(null);
        try {
            const result = await generateImageVariation(sourceImage, strength);
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
                    <h3 className="text-lg font-semibold text-gray-200">Variação de Imagem</h3>
                    <p className="text-sm text-gray-400 mt-1">Gere novas versões da sua imagem.</p>
                </div>
                <ImageDropzone 
                    imageFile={sourceImage}
                    onFileSelect={setSourceImage}
                    label="Imagem Original"
                />
                <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium text-gray-300 flex justify-between">
                        <span>Força da Variação</span>
                        <span className="text-white font-mono">{strength}%</span>
                    </label>
                    <input
                        type="range"
                        min="10"
                        max="90"
                        value={strength}
                        onChange={(e) => setStrength(Number(e.target.value))}
                        disabled={isLoading}
                        className="w-full"
                    />
                </div>
                <button
                    onClick={handleGenerate}
                    disabled={isLoading || !sourceImage}
                    className="w-full mt-auto bg-gradient-to-br from-green-600 to-teal-500 text-white font-bold py-3 px-5 rounded-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                    <LayersIcon className="w-5 h-5" />
                    Gerar Variação
                </button>
            </aside>
            <main className="flex-grow bg-black/20 rounded-lg border border-gray-700/50 flex items-center justify-center p-4">
                <ResultViewer
                    isLoading={isLoading}
                    error={error}
                    resultImage={resultImage}
                    loadingMessage="Criando uma nova variação..."
                />
            </main>
        </div>
    );
};

export default ImageVariationPanel;
