/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useEffect } from 'react';
// FIX: import from ../../context/EditorContext
import { useEditor } from '../../context/EditorContext';
import { fuseImages } from '../../services/geminiService';
import ImageDropzone from './common/ImageDropzone';
import ResultViewer from './common/ResultViewer';
import { AdjustmentsHorizontalIcon, CloseIcon } from '../icons';
import * as db from '../../utils/db';
import { dataURLtoFile } from '../../utils/imageUtils';
import { hashFile } from '../../utils/cryptoUtils';

const CreativeFusionPanel: React.FC = () => {
    const { isLoading, error, setError, setIsLoading, baseImageFile, setInitialImage, setToast, setLoadingMessage } = useEditor();
    const [compositionImage, setCompositionImage] = useState<File | null>(null);
    const [styleImages, setStyleImages] = useState<(File | null)[]>([null]);
    const [resultImage, setResultImage] = useState<string | null>(null);

    useEffect(() => {
        if (baseImageFile && !compositionImage) {
            setCompositionImage(baseImageFile);
        }
    }, [baseImageFile, compositionImage]);

    useEffect(() => {
        // Cleanup for object URLs
        return () => {
            if (resultImage && resultImage.startsWith('blob:')) {
                URL.revokeObjectURL(resultImage);
            }
        };
    }, [resultImage]);

    const handleCompositionFileSelect = (file: File | null) => {
        setCompositionImage(file);
        if (file) {
            setInitialImage(file);
        }
        setResultImage(null);
    };

    const handleStyleFileSelect = (file: File | null, index: number) => {
        const newImages = [...styleImages];
        newImages[index] = file;
        setStyleImages(newImages);
        setResultImage(null);
    };

    const addStyleImageSlot = () => {
        if (styleImages.length < 3) {
            setStyleImages([...styleImages, null]);
        }
    };

    const removeStyleImageSlot = (index: number) => {
        if (styleImages.length > 1) {
            const newImages = [...styleImages];
            newImages.splice(index, 1);
            setStyleImages(newImages);
        }
    };

    const handleGenerate = async () => {
        const validStyleImages = styleImages.filter((f): f is File => f !== null);
        if (!compositionImage || validStyleImages.length === 0) {
            setError("Por favor, carregue a imagem de Composição e pelo menos uma de Estilo.");
            return;
        }
        setIsLoading(true);
        setError(null);
        setResultImage(null);
        try {
            const compHash = await hashFile(compositionImage);
            const styleHashes = await Promise.all(validStyleImages.map(f => hashFile(f)));
            const cacheKey = `creativeFusion:${compHash}:${styleHashes.join('-')}`;

            setLoadingMessage('Verificando cache...');
            const cachedBlob = await db.loadImageFromCache(cacheKey);
            if (cachedBlob) {
                setResultImage(URL.createObjectURL(cachedBlob));
                setToast({ message: 'Imagem carregada do cache!', type: 'info' });
                setIsLoading(false);
                setLoadingMessage(null);
                return;
            }

            setLoadingMessage('Criando fusão artística...');
            const result = await fuseImages(compositionImage, validStyleImages);
            setResultImage(result);

            try {
                const resultFile = dataURLtoFile(result, `cache-${cacheKey}.png`);
                await db.saveImageToCache(cacheKey, resultFile);
            } catch (cacheError) {
                console.warn("Falha ao salvar a imagem no cache:", cacheError);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "Ocorreu um erro desconhecido.");
        } finally {
            setIsLoading(false);
            setLoadingMessage(null);
        }
    };

    const isGenerateDisabled = isLoading || !compositionImage || styleImages.every(img => img === null);

    return (
        <div className="p-4 md:p-6 flex flex-col md:flex-row gap-6">
            <aside className="w-full md:w-96 flex-shrink-0 bg-gray-900/30 rounded-lg p-4 flex flex-col gap-4 border border-gray-700/50">
                <div className="text-center">
                    <h3 className="text-lg font-semibold text-gray-200">Fusão Criativa</h3>
                    <p className="text-sm text-gray-400 mt-1">Combine a estrutura de uma imagem com o estilo de outra(s).</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <ImageDropzone 
                        imageFile={compositionImage}
                        onFileSelect={handleCompositionFileSelect}
                        label="Composição"
                    />
                    <div className="flex flex-col gap-2">
                        {styleImages.map((img, index) => (
                             <div key={index} className="relative">
                                <ImageDropzone 
                                    imageFile={img}
                                    onFileSelect={(file) => handleStyleFileSelect(file, index)}
                                    label={`Estilo ${index + 1}`}
                                />
                                {styleImages.length > 1 && (
                                    <button 
                                        type="button"
                                        onClick={() => removeStyleImageSlot(index)}
                                        className="absolute -top-1 -right-1 bg-red-600 hover:bg-red-500 text-white p-1 rounded-full text-xs z-10"
                                        title="Remover imagem de estilo"
                                    >
                                        <CloseIcon className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                        ))}
                        {styleImages.length < 3 && (
                             <button 
                                type="button"
                                onClick={addStyleImageSlot}
                                className="text-sm text-blue-400 hover:text-blue-300 w-full text-center py-2 border border-dashed border-blue-400/50 rounded-lg hover:bg-blue-400/10"
                            >
                                + Adicionar Estilo
                            </button>
                        )}
                    </div>
                </div>
                <button
                    onClick={handleGenerate}
                    disabled={isGenerateDisabled}
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