/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useEffect } from 'react';
import { useEditor } from '../../context/EditorContext';
import ImageDropzone from './common/ImageDropzone';
import ResultViewer from './common/ResultViewer';
import { dataURLtoFile } from '../../utils/imageUtils';
import LazyIcon from '../LazyIcon';

const FaceSwapPanel: React.FC = () => {
    const {
        isLoading,
        error,
        setError,
        setIsLoading,
        baseImageFile,
        setInitialImage,
        handleFaceSwap,
        setActiveTool,
        setToast,
    } = useEditor();
    
    const [sourceImage, setSourceImage] = useState<File[]>([]);
    const [targetImage, setTargetImage] = useState<File[]>([]);
    const [resultImage, setResultImage] = useState<string | null>(null);

    useEffect(() => {
        if (baseImageFile && targetImage.length === 0) {
            setTargetImage([baseImageFile]);
        }
    }, [baseImageFile, targetImage]);

    const handleTargetFileSelect = (files: File[]) => {
        setTargetImage(files);
        if (files[0]) {
            setInitialImage(files[0]);
        }
        setResultImage(null);
    };

    const handleGenerate = async () => {
        const sourceFile = sourceImage[0];
        const targetFile = targetImage[0];

        if (!sourceFile || !targetFile) {
            setError("Por favor, carregue a imagem original e a imagem com o rosto de destino.");
            return;
        }
        
        setIsLoading(true);
        setError(null);
        setResultImage(null);

        try {
            const resultDataUrl = await handleFaceSwap(sourceFile, 'Swap faces between the images');
            if (resultDataUrl) {
                setResultImage(resultDataUrl);
            }
        } catch (err) {
             // Error is handled in the context/service layer
        } finally {
            setIsLoading(false);
        }
    };

    const handleUseInEditor = () => {
        if (!resultImage) return;
        const file = dataURLtoFile(resultImage, `face-swap-${Date.now()}.png`);
        setInitialImage(file);
        setActiveTool(null);
        setToast({ message: "Imagem carregada no editor!", type: 'success' });
    };

    return (
        <div className="p-4 md:p-6 flex flex-col md:flex-row gap-6 h-full">
            <aside className="w-full md:w-96 flex-shrink-0 bg-gray-900/30 rounded-lg p-4 flex flex-col gap-4 border border-gray-700/50">
                <div className="text-center">
                    <h3 className="text-lg font-semibold text-gray-200">Troca de Rosto (Face Swap)</h3>
                    <p className="text-sm text-gray-400 mt-1">Troque o rosto em uma foto por outro.</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <ImageDropzone 
                        files={targetImage}
                        onFilesChange={handleTargetFileSelect}
                        label="Imagem Alvo"
                    />
                    <ImageDropzone 
                        files={sourceImage}
                        onFilesChange={setSourceImage}
                        label="Rosto Fonte"
                    />
                </div>

                <button
                    onClick={handleGenerate}
                    disabled={isLoading || sourceImage.length === 0 || targetImage.length === 0}
                    className="w-full mt-auto bg-gradient-to-br from-purple-600 to-indigo-500 text-white font-bold py-3 px-5 rounded-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                    <LazyIcon name="SwapIcon" className="w-5 h-5" />
                    Realizar Troca
                </button>
            </aside>
            <main className="flex-grow bg-black/20 rounded-lg border border-gray-700/50 flex flex-col items-center justify-center p-4">
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
