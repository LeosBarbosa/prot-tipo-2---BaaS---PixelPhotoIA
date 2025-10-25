/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';
import Spinner from '../Spinner';
import { useEditor } from '../../context/EditorContext';
import { dataURLtoFile } from '../../utils/imageUtils';
import LazyIcon from '../LazyIcon';

interface ResultViewerProps {
    isLoading: boolean;
    error: string | null;
    resultImage: string | null;
    loadingMessage?: string;
}

const ResultViewer: React.FC<ResultViewerProps> = ({ 
    isLoading, 
    error, 
    resultImage, 
    loadingMessage,
}) => {
    const { setInitialImage, setActiveTool, setToast } = useEditor();

    const handleCreateVariation = async () => {
        if (!resultImage) return;
        try {
            let file: File;
            if (resultImage.startsWith('blob:')) {
                const response = await fetch(resultImage);
                const blob = await response.blob();
                file = new File([blob], `variation-base-${Date.now()}.png`, { type: blob.type });
            } else {
                file = dataURLtoFile(resultImage, `variation-base-${Date.now()}.png`);
            }
            setInitialImage(file);
            setActiveTool('imageVariation');
            setToast({ message: "Imagem enviada para o 'Gerador de Variação'.", type: 'info' });
        } catch (e) {
            console.error("Failed to set result as base image:", e);
            setToast({ message: "Não foi possível enviar para o editor: arquivo inválido.", type: 'error' });
        }
    };

    const handleUseInEditor = async () => {
        if (!resultImage) return;
        try {
            let file: File;
            if (resultImage.startsWith('blob:')) {
                const response = await fetch(resultImage);
                const blob = await response.blob();
                file = new File([blob], `edited-from-gen-${Date.now()}.png`, { type: blob.type });
            } else {
                file = dataURLtoFile(resultImage, `edited-from-gen-${Date.now()}.png`);
            }
            setInitialImage(file);
            setActiveTool('adjust'); 
        } catch (e) {
            console.error("Failed to use in editor:", e);
            setToast({ message: "Não foi possível usar no editor: arquivo inválido.", type: 'error' });
        }
    };
    
    const handleDownload = () => {
        if (!resultImage) return;
        const link = document.createElement('a');
        link.href = resultImage;
        link.download = `generated-image-${Date.now()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (isLoading) {
        return (
            <div className="text-center text-gray-400 animate-fade-in flex flex-col items-center justify-center h-full">
                <Spinner />
                <p 
                  key={loadingMessage}
                  className="mt-4 font-semibold text-lg text-gray-200 animate-fade-in-text"
                >
                  {loadingMessage || 'Processando...'}
                </p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center text-red-400 bg-red-500/10 border border-red-500/20 p-4 rounded-lg animate-fade-in w-full max-w-md">
                <h3 className="font-bold text-red-300">Ocorreu um Erro</h3>
                <p className="text-sm mt-1">{error}</p>
            </div>
        );
    }
    
    if (resultImage) {
        return (
            <div className="w-full h-full flex flex-col items-center justify-center gap-4">
                <div className="flex-grow w-full flex items-center justify-center overflow-hidden min-h-0">
                    <img src={resultImage} alt="Resultado da Geração" className="max-w-full max-h-full object-contain rounded-lg animate-fade-in" />
                </div>
                 <div className="flex-shrink-0 flex flex-wrap justify-center gap-3 animate-fade-in mt-2">
                    <button
                        onClick={handleDownload}
                        className="flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-gray-200 font-semibold py-2 px-4 rounded-md transition-colors text-sm"
                    >
                        <LazyIcon name="DownloadIcon" className="w-5 h-5" />
                        Baixar Imagem
                    </button>
                    <button
                        onClick={handleCreateVariation}
                        className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-500 text-white font-bold py-2 px-4 rounded-md transition-colors text-sm"
                    >
                        <LazyIcon name="LayersIcon" className="w-5 h-5" />
                        Gerar Variações
                    </button>
                    <button
                        onClick={handleUseInEditor}
                        className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-4 rounded-md transition-colors text-sm"
                    >
                         <LazyIcon name="BrushIcon" className="w-5 h-5" />
                        Usar no Editor
                    </button>
                </div>
            </div>
        );
    }

    // Default state when not loading, no error, and no image
    return (
        <div className="text-center text-gray-500 animate-fade-in">
            <LazyIcon name="PhotoIcon" className="w-16 h-16 mx-auto" />
            <p className="mt-2 font-semibold">O resultado aparecerá aqui</p>
        </div>
    );
};

export default ResultViewer;