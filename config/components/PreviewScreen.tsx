/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useEffect, useMemo } from 'react';
import LazyIcon from './LazyIcon';
import { useEditor } from '../../context/EditorContext';

const formatBytes = (bytes: number, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

const PreviewScreen: React.FC = () => {
    const { uploadedFile, confirmAndStartEditing, cancelPreview } = useEditor();
    const [imageDimensions, setImageDimensions] = useState<{ width: number, height: number } | null>(null);

    const imageUrl = useMemo(() => {
        if (uploadedFile) {
            return URL.createObjectURL(uploadedFile);
        }
        return null;
    }, [uploadedFile]);

    useEffect(() => {
        if (imageUrl) {
            const img = new Image();
            img.onload = () => {
                setImageDimensions({ width: img.naturalWidth, height: img.naturalHeight });
            };
            img.src = imageUrl;
        }

        // Cleanup
        return () => {
            if (imageUrl) {
                URL.revokeObjectURL(imageUrl);
            }
        };
    }, [imageUrl]);

    if (!uploadedFile || !imageUrl) {
        // This shouldn't happen if logic is correct, but it's a good fallback.
        return (
            <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
                <p className="text-gray-400">Nenhum arquivo para pré-visualizar.</p>
                <button
                    onClick={cancelPreview}
                    className="mt-6 text-blue-400 hover:text-blue-300 transition-colors font-semibold"
                >
                    Voltar
                </button>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-4 animate-fade-in bg-gray-900/50">
            <div className="w-full max-w-4xl bg-gray-800/60 backdrop-blur-md rounded-2xl shadow-2xl border border-gray-700/50 p-6 md:p-8 animate-zoom-rise">
                <div className="text-center mb-6">
                    <h2 className="text-3xl font-bold text-white">Pronto para Editar?</h2>
                    <p className="text-gray-400 mt-2">Sua imagem foi carregada e otimizada com sucesso.</p>
                </div>

                <div className="relative mb-6 bg-black/20 rounded-lg h-96 flex items-center justify-center p-2">
                     <img
                        src={imageUrl}
                        alt="Pré-visualização da imagem carregada"
                        className="max-w-full max-h-full object-contain rounded-md"
                    />
                </div>

                <div className="bg-gray-900/40 rounded-lg p-4 border border-gray-700/50 flex flex-col sm:flex-row justify-between items-center text-center sm:text-left gap-4">
                    <div className="truncate">
                        <p className="text-sm font-semibold text-white truncate" title={uploadedFile.name}>{uploadedFile.name}</p>
                        <p className="text-xs text-gray-400">
                            {imageDimensions ? `${imageDimensions.width} x ${imageDimensions.height}` : 'Carregando dimensões...'}
                        </p>
                    </div>
                    <p className="text-sm font-mono text-gray-300 bg-gray-700/50 px-3 py-1 rounded-full">{formatBytes(uploadedFile.size)}</p>
                </div>

                <div className="mt-8 flex flex-col sm:flex-row gap-4">
                    <button
                        onClick={cancelPreview}
                        className="w-full sm:w-auto flex-1 bg-gray-700/60 hover:bg-gray-600/80 text-white font-semibold py-3 px-6 rounded-lg transition-all"
                    >
                        Escolher Outra Imagem
                    </button>
                    <button
                        onClick={confirmAndStartEditing}
                        className="w-full sm:w-auto flex-1 bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-6 rounded-lg transition-all flex items-center justify-center gap-2"
                    >
                        <LazyIcon name="SparkleIcon" className="w-5 h-5" />
                        Começar a Editar
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PreviewScreen;