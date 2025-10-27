

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useEffect } from 'react';
import { useEditor } from '../../../context/EditorContext';
import ImageDropzone from './common/ImageDropzone';
import ResultViewer from './common/ResultViewer';
// FIX: Correct the import path for LazyIcon
import LazyIcon from '../LazyIcon';

const CreativeFusionPanel: React.FC = () => {
    const { 
        isLoading, 
        error, 
        setInitialImage,
        baseImageFile,
        // FIX: Property 'handleCreativeFusion' does not exist on type 'EditorContextType'. This will be added to the context.
        handleCreativeFusion,
        currentImageUrl,
        setActiveTool,
    } = useEditor();

    const [compositionImage, setCompositionImage] = useState<File | null>(null);
    const [styleImages, setStyleImages] = useState<File[]>([]);

    useEffect(() => {
        if (baseImageFile && !compositionImage) {
            setCompositionImage(baseImageFile);
        }
    }, [baseImageFile, compositionImage]);

    const handleCompositionFileSelect = (files: File[]) => {
        const file = files[0] || null;
        setCompositionImage(file);
        if (file) {
            setInitialImage(file);
        }
    };

    const handleGenerate = async () => {
        if (!compositionImage || styleImages.length === 0) {
            return;
        }
        handleCreativeFusion(compositionImage, styleImages);
    };
    
    const handleDownload = () => {
        if (!currentImageUrl) return;
        const link = document.createElement('a');
        link.href = currentImageUrl;
        link.download = `fusao-criativa-${Date.now()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleUseInEditor = () => {
        if (!currentImageUrl) return;
        setActiveTool(null);
    };

    return (
        <div className="p-4 md:p-6 flex flex-col md:flex-row gap-6">
            <aside className="w-full md:w-96 flex-shrink-0 bg-gray-900/30 rounded-lg p-4 flex flex-col gap-4 border border-gray-700/50">
                <div className="text-center">
                    <h3 className="text-lg font-semibold text-gray-200">Fusão Criativa</h3>
                    <p className="text-sm text-gray-400 mt-1">Combine a composição de uma imagem com o estilo de outra.</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <ImageDropzone 
                        files={compositionImage ? [compositionImage] : []}
                        onFilesChange={handleCompositionFileSelect}
                        label="Imagem de Composição"
                    />
                    <ImageDropzone 
                        files={styleImages}
                        onFilesChange={setStyleImages}
                        label="Imagens de Estilo"
                        multiple
                        maxFiles={3}
                    />
                </div>
                <button
                    onClick={handleGenerate}
                    disabled={isLoading || !compositionImage || styleImages.length === 0}
                    className="w-full mt-auto bg-gradient-to-br from-pink-600 to-purple-500 text-white font-bold py-3 px-5 rounded-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                    <LazyIcon name="CombineIcon" className="w-5 h-5" />
                    Criar Fusão
                </button>
            </aside>
            <main className="flex-grow bg-black/20 rounded-lg border border-gray-700/50 flex flex-col items-center justify-center p-4">
                <ResultViewer
                    isLoading={isLoading}
                    error={error}
                    resultImage={currentImageUrl}
                    loadingMessage="Criando fusão artística..."
                />
                {currentImageUrl && !isLoading && (
                    <div className="mt-4 flex flex-col sm:flex-row gap-3 animate-fade-in">
                        <button onClick={handleDownload} className="flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-gray-200 font-semibold py-2 px-4 rounded-md transition-colors text-sm">
                            <LazyIcon name="DownloadIcon" className="w-5 h-5" /> Salvar Imagem
                        </button>
                        <button onClick={handleUseInEditor} className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-4 rounded-md transition-colors text-sm">
                            <LazyIcon name="BrushIcon" className="w-5 h-5" /> Continuar Editando
                        </button>
                    </div>
                )}
            </main>
        </div>
    );
};

export default CreativeFusionPanel;
