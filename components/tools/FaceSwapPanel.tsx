/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useEffect } from 'react';
import { useEditor } from '../../context/EditorContext';
import { faceSwap } from '../../services/geminiService';
import ImageDropzone from './common/ImageDropzone';
import ResultViewer from './common/ResultViewer';
import { FaceSmileIcon, DownloadIcon, BrushIcon } from '../icons';
import { dataURLtoFile } from '../../utils/imageUtils';
import PromptEnhancer from './common/PromptEnhancer';

const FaceSwapPanel: React.FC = () => {
    const { isLoading, error, setError, setIsLoading, setInitialImage, setActiveTool, currentImage } = useEditor();
    const [sourceImage, setSourceImage] = useState<File | null>(null);
    const [targetImage, setTargetImage] = useState<File | null>(null);
    const [resultImage, setResultImage] = useState<string | null>(null);
    const [prompt, setPrompt] = useState<string>('');

    useEffect(() => {
        if (currentImage && !targetImage) {
            setTargetImage(currentImage);
        }
    }, [currentImage, targetImage]);

    const handleTargetFileSelect = (file: File | null) => {
        setTargetImage(file);
        if (file) {
            setInitialImage(file);
        }
        setResultImage(null);
    };

    const handleGenerate = async () => {
        if (!sourceImage || !targetImage) {
            setError("Por favor, carregue a imagem de Origem e a de Alvo.");
            return;
        }
        setIsLoading(true);
        setError(null);
        setResultImage(null);
        try {
            const result = await faceSwap(sourceImage, targetImage, prompt);
            setResultImage(result);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Ocorreu um erro desconhecido.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleDownload = () => {
        if (!resultImage) return;
        const link = document.createElement('a');
        link.href = resultImage;
        link.download = `face-swap-${Date.now()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleUseInEditor = () => {
        if (!resultImage) return;
        const file = dataURLtoFile(resultImage, `face-swap-${Date.now()}.png`);
        setInitialImage(file);
        setActiveTool('adjust');
    };


    return (
        <div className="p-4 md:p-6 flex flex-col md:flex-row gap-6">
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
                        onFileSelect={handleTargetFileSelect}
                        label="Imagem Alvo"
                    />
                </div>

                <div className="relative">
                     <label htmlFor="face-swap-prompt" className="text-sm font-semibold text-gray-300">Instruções Adicionais (Opcional)</label>
                     <textarea
                        id="face-swap-prompt"
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="Ex: 'sorriso leve', 'olhando para a câmera'..."
                        className="mt-1 w-full bg-gray-800/50 border border-gray-600 rounded-lg p-2 pr-12 text-base min-h-[80px] resize-none text-gray-300 placeholder-gray-500"
                        disabled={isLoading}
                        rows={3}
                    />
                    <PromptEnhancer prompt={prompt} setPrompt={setPrompt} toolId="faceSwap" />
                </div>
                
                <button
                    onClick={handleGenerate}
                    disabled={isLoading || !sourceImage || !targetImage}
                    className="w-full mt-auto bg-gradient-to-br from-red-600 to-rose-500 text-white font-bold py-3 px-5 rounded-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                    <FaceSmileIcon className="w-5 h-5" />
                    Trocar Rosto
                </button>
            </aside>
            <main className="flex-grow bg-black/20 rounded-lg border border-gray-700/50 flex flex-col items-center justify-center p-4">
                <ResultViewer
                    isLoading={isLoading}
                    error={error}
                    resultImage={resultImage}
                    loadingMessage="Realizando a troca de rostos..."
                />
                {resultImage && !isLoading && (
                    <div className="mt-4 flex flex-col sm:flex-row gap-3 animate-fade-in">
                        <button
                            onClick={handleDownload}
                            className="flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-gray-200 font-semibold py-2 px-4 rounded-md transition-colors text-sm"
                        >
                            <DownloadIcon className="w-5 h-5" />
                            Baixar Imagem
                        </button>
                        <button
                            onClick={handleUseInEditor}
                            className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-4 rounded-md transition-colors text-sm"
                        >
                             <BrushIcon className="w-5 h-5" />
                            Usar no Editor
                        </button>
                    </div>
                )}
            </main>
        </div>
    );
};

export default FaceSwapPanel;