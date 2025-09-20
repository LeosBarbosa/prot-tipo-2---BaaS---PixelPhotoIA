/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState } from 'react';
import { useLoadingError } from '../../context/EditorContext';
import { generateProfessionalPortrait } from '../../services/geminiService';
import ImageDropzone from './common/ImageDropzone';
import ResultViewer from './common/ResultViewer';
import { FaceSmileIcon } from '../icons';

const AIPortraitPanel: React.FC = () => {
    const { isLoading, error, setError, setIsLoading } = useLoadingError();
    const [sourceImage, setSourceImage] = useState<File | null>(null);
    const [resultImage, setResultImage] = useState<string | null>(null);

    const handleGenerate = async () => {
        if (!sourceImage) {
            setError("Por favor, carregue uma imagem para transformar.");
            return;
        }
        setIsLoading(true);
        setError(null);
        setResultImage(null);
        try {
            const result = await generateProfessionalPortrait(sourceImage);
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
                    <h3 className="text-lg font-semibold text-gray-200">Gerador de Retrato IA</h3>
                    <p className="text-sm text-gray-400 mt-1">Transforme sua selfie casual em um retrato de negócios profissional.</p>
                </div>
                <ImageDropzone
                    imageFile={sourceImage}
                    onFileSelect={setSourceImage}
                    label="Sua Foto"
                />
                <p className="text-xs text-gray-500 text-center">A IA manterá suas características faciais, mas irá gerar novas roupas, um novo fundo e iluminação profissional.</p>
                <button
                    onClick={handleGenerate}
                    disabled={isLoading || !sourceImage}
                    className="w-full mt-auto bg-gradient-to-br from-blue-600 to-indigo-500 text-white font-bold py-3 px-5 rounded-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                    <FaceSmileIcon className="w-5 h-5" />
                    Gerar Retrato
                </button>
            </aside>
            <main className="flex-grow bg-black/20 rounded-lg border border-gray-700/50 flex items-center justify-center p-4">
                <ResultViewer
                    isLoading={isLoading}
                    error={error}
                    resultImage={resultImage}
                    loadingMessage="Criando seu retrato profissional..."
                />
            </main>
        </div>
    );
};

export default AIPortraitPanel;
