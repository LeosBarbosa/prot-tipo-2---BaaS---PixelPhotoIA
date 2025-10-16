/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useEffect } from 'react';
import { useEditor } from '../../context/EditorContext';
import ImageDropzone from './common/ImageDropzone';
import ResultViewer from './common/ResultViewer';
import { DoubleExposureIcon, DownloadIcon, BrushIcon } from '../icons';
import TipBox from '../common/TipBox';
import { dataURLtoFile } from '../../utils/imageUtils';

const DoubleExposurePanel: React.FC = () => {
    const { 
        isLoading, 
        error, 
        setError,
        setIsLoading,
        setLoadingMessage,
        baseImageFile, 
        setInitialImage,
        handleDoubleExposure,
        setActiveTool,
        setToast,
    } = useEditor();
    
    const [portraitImage, setPortraitImage] = useState<File | null>(null);
    const [landscapeImage, setLandscapeImage] = useState<File | null>(null);
    const [resultImage, setResultImage] = useState<string | null>(null);

    useEffect(() => {
        if (baseImageFile && !portraitImage) {
            setPortraitImage(baseImageFile);
        }
    }, [baseImageFile, portraitImage]);

    const handlePortraitFileSelect = (file: File | null) => {
        setPortraitImage(file);
        if (file) {
            setInitialImage(file);
        }
        setResultImage(null);
    };

    const handleGenerate = async () => {
        if (!portraitImage || !landscapeImage) {
            setError("Por favor, carregue uma imagem de retrato e uma de paisagem.");
            return;
        }
        
        setIsLoading(true);
        setError(null);
        setResultImage(null);
        setLoadingMessage("Criando efeito de dupla exposição...");

        try {
            const resultDataUrl = await handleDoubleExposure(portraitImage, landscapeImage);
            setResultImage(resultDataUrl);
        } catch (err) {
             setError(err instanceof Error ? err.message : "Ocorreu um erro desconhecido.");
        } finally {
            setIsLoading(false);
            setLoadingMessage(null);
        }
    };

    const handleDownload = () => {
        if (!resultImage) return;
        const link = document.createElement('a');
        link.href = resultImage;
        link.download = `dupla-exposicao-${Date.now()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleUseInEditor = () => {
        if (!resultImage) return;
        const file = dataURLtoFile(resultImage, `dupla-exposicao-${Date.now()}.png`);
        setInitialImage(file);
        setActiveTool(null);
        setToast({ message: "Imagem carregada no editor!", type: 'success' });
    };

    return (
        <div className="p-4 md:p-6 flex flex-col md:flex-row gap-6 h-full">
            <aside className="w-full md:w-96 flex-shrink-0 bg-gray-900/30 rounded-lg p-4 flex flex-col gap-4 border border-gray-700/50">
                <div className="text-center">
                    <h3 className="text-lg font-semibold text-gray-200">Dupla Exposição Artística</h3>
                    <p className="text-sm text-gray-400 mt-1">Combine um retrato e uma paisagem para um efeito cinematográfico.</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <ImageDropzone 
                        imageFile={portraitImage}
                        onFileSelect={handlePortraitFileSelect}
                        label="Retrato"
                    />
                    <ImageDropzone 
                        imageFile={landscapeImage}
                        onFileSelect={setLandscapeImage}
                        label="Paisagem"
                    />
                </div>
                
                <TipBox>
                   Para melhores resultados, use um retrato com um fundo simples e uma paisagem com texturas interessantes. A IA irá mesclar a paisagem dentro da silhueta do retrato.
                </TipBox>

                <button
                    onClick={handleGenerate}
                    disabled={isLoading || !portraitImage || !landscapeImage}
                    className="w-full mt-auto bg-gradient-to-br from-purple-600 to-indigo-500 text-white font-bold py-3 px-5 rounded-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                    <DoubleExposureIcon className="w-5 h-5" />
                    Criar Dupla Exposição
                </button>
            </aside>
            <main className="flex-grow bg-black/20 rounded-lg border border-gray-700/50 flex flex-col items-center justify-center p-4">
                <ResultViewer
                    isLoading={isLoading}
                    error={error}
                    resultImage={resultImage}
                    loadingMessage="Criando sua obra de arte..."
                />
                {resultImage && !isLoading && (
                    <div className="mt-4 flex flex-col sm:flex-row gap-3 animate-fade-in">
                        <button onClick={handleDownload} className="flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-gray-200 font-semibold py-2 px-4 rounded-md transition-colors text-sm">
                            <DownloadIcon className="w-5 h-5" /> Salvar Imagem
                        </button>
                        <button onClick={handleUseInEditor} className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-4 rounded-md transition-colors text-sm">
                            <BrushIcon className="w-5 h-5" /> Usar no Editor
                        </button>
                    </div>
                )}
            </main>
        </div>
    );
};

export default DoubleExposurePanel;