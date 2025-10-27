/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useEffect } from 'react';
import { useEditor } from '../../../context/EditorContext';
import { generateImageVariation } from '../../../services/geminiService';
import ImageDropzone from './common/ImageDropzone';
import Spinner from '../Spinner';
import { dataURLtoFile } from '../../../utils/imageUtils';
import { type Layer } from '../../../types';
import LazyIcon from '../LazyIcon';


const ImageVariationPanel: React.FC = () => {
    const { 
        isLoading, 
        error, 
        setError, 
        setIsLoading,
        setLoadingMessage,
        baseImageFile, 
        setInitialImage,
        commitChange,
        layers,
        activeLayerId,
        setActiveTool,
        setToast
    } = useEditor();
    
    const [sourceImage, setSourceImage] = useState<File[]>([]);
    const [resultImages, setResultImages] = useState<string[] | null>(null);
    const [strength, setStrength] = useState(50);

    useEffect(() => {
        if (baseImageFile && sourceImage.length === 0) {
            setSourceImage([baseImageFile]);
        }
    }, [baseImageFile, sourceImage]);

    const handleFileSelect = (files: File[]) => {
        setSourceImage(files);
        if (files[0]) {
            setInitialImage(files[0]);
        }
        setResultImages(null);
    };

    const handleGenerate = async () => {
        const imageFile = sourceImage[0];
        if (!imageFile) {
            setError("Por favor, carregue uma imagem para gerar variações.");
            return;
        }
        setIsLoading(true);
        setLoadingMessage("Gerando 3 variações...");
        setError(null);
        setResultImages(null);
        try {
            const variationPromises = [
                generateImageVariation(imageFile, strength, setToast),
                generateImageVariation(imageFile, strength, setToast),
                generateImageVariation(imageFile, strength, setToast),
            ];
            const results = await Promise.all(variationPromises);
            setResultImages(results);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Ocorreu um erro desconhecido.");
        } finally {
            setIsLoading(false);
            setLoadingMessage(null);
        }
    };
    
    const handleAcceptVariation = (imageUrl: string) => {
        if (!activeLayerId) {
             setError("Nenhuma camada ativa encontrada para aplicar a variação.");
             return;
        }
        
        const newFile = dataURLtoFile(imageUrl, `variation-${Date.now()}.png`);
        
        const newLayers = layers.map((l): Layer => {
            if (l.id === activeLayerId && l.type === 'image') {
                return { ...l, file: newFile };
            }
            return l;
        });
        
        commitChange(newLayers, activeLayerId, 'imageVariation');
        setToast({ message: 'Variação aplicada!', type: 'success' });
        setActiveTool(null);
    };

    return (
        <div className="p-4 md:p-6 flex flex-col md:flex-row gap-6 h-full">
            <aside className="w-full md:w-96 flex-shrink-0 bg-gray-900/30 rounded-lg p-4 flex flex-col gap-4 border border-gray-700/50">
                <div className="text-center">
                    <h3 className="text-lg font-semibold text-gray-200">Variação de Imagem</h3>
                    <p className="text-sm text-gray-400 mt-1">Gere novas versões da sua imagem.</p>
                </div>
                <ImageDropzone 
                    files={sourceImage}
                    onFilesChange={handleFileSelect}
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
                    <p className="mt-1 text-xs text-gray-500 px-1">Força baixa (~10%) cria variações sutis. Força alta (~90%) cria resultados muito diferentes.</p>
                </div>
                <button
                    onClick={handleGenerate}
                    disabled={isLoading || sourceImage.length === 0}
                    className="w-full mt-auto bg-gradient-to-br from-green-600 to-teal-500 text-white font-bold py-3 px-5 rounded-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                    <LazyIcon name="LayersIcon" className="w-5 h-5" />
                    {resultImages ? 'Gerar Novamente' : 'Gerar Variações'}
                </button>
            </aside>
            <main className="flex-grow bg-black/20 rounded-lg border border-gray-700/50 flex items-center justify-center p-4">
                 {isLoading && (
                    <div className="text-center text-gray-400 animate-fade-in flex flex-col items-center justify-center h-full">
                        <Spinner />
                        <p className="mt-4 font-semibold text-lg text-gray-200">Gerando 3 variações...</p>
                    </div>
                )}
                {error && !isLoading && (
                    <div className="text-center text-red-400 bg-red-500/10 border border-red-500/20 p-4 rounded-lg animate-fade-in w-full max-w-md">
                        <h3 className="font-bold text-red-300">Ocorreu um Erro</h3>
                        <p className="text-sm mt-1">{error}</p>
                    </div>
                )}
                {resultImages && !isLoading && !error && (
                    <div className="w-full h-full flex flex-col items-center justify-center gap-4">
                        <h3 className="text-lg font-semibold text-gray-200">Escolha sua variação favorita</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            {resultImages.map((src, index) => (
                                <button
                                    key={index}
                                    onClick={() => handleAcceptVariation(src)}
                                    className="group relative aspect-square bg-gray-900/50 rounded-lg overflow-hidden border-2 border-transparent hover:border-blue-500 focus:border-blue-500 focus:outline-none transition-all duration-200 transform hover:scale-105"
                                >
                                    <img src={src} alt={`Variação ${index + 1}`} className="w-full h-full object-contain" />
                                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 group-focus:opacity-100 transition-opacity flex items-center justify-center">
                                        <p className="text-white font-bold">Usar esta</p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                )}
                 {!isLoading && !error && !resultImages && (
                    <div className="text-center text-gray-500 animate-fade-in">
                        <LazyIcon name="SparkleIcon" className="w-16 h-16 mx-auto" />
                        <p className="mt-2 font-semibold">As variações geradas aparecerão aqui</p>
                    </div>
                )}
            </main>
        </div>
    );
};

export default ImageVariationPanel;