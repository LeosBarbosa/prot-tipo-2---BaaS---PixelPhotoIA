/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useEffect } from 'react';
import { useEditor } from '../../context/EditorContext';
import { generateProductPhoto } from '../../services/geminiService';
import ImageDropzone from './common/ImageDropzone';
import ResultViewer from './common/ResultViewer';
import { SparkleIcon, DownloadIcon, BrushIcon } from '../icons'; // Adicione DownloadIcon e BrushIcon
import CollapsiblePromptPanel from './common/CollapsiblePromptPanel';
import * as db from '../../utils/db';
import { dataURLtoFile } from '../../utils/imageUtils'; // Importe a função utilitária
import { hashFile, sha256 } from '../../utils/cryptoUtils';

const ProductPhotographyPanel: React.FC = () => {
    const { isLoading, error, setError, setIsLoading, addPromptToHistory, baseImageFile, setInitialImage, setToast, setLoadingMessage, setActiveTool } = useEditor();
    const [sourceImage, setSourceImage] = useState<File | null>(null);
    const [resultImage, setResultImage] = useState<string | null>(null);
    const [prompt, setPrompt] = useState('');
    const [negativePrompt, setNegativePrompt] = useState('');

    useEffect(() => {
        if (baseImageFile && !sourceImage) {
            setSourceImage(baseImageFile);
        }
    }, [baseImageFile, sourceImage]);

    useEffect(() => {
        // Cleanup for object URLs
        return () => {
            if (resultImage && resultImage.startsWith('blob:')) {
                URL.revokeObjectURL(resultImage);
            }
        };
    }, [resultImage]);

    const handleFileSelect = (file: File | null) => {
        setSourceImage(file);
        if (file) {
            setInitialImage(file);
        }
        setResultImage(null);
    };

    const handleGenerate = async () => {
        if (!sourceImage) {
            setError("Por favor, carregue uma imagem do produto.");
            return;
        }
        if (!prompt.trim()) {
            setError("Por favor, descreva o cenário desejado.");
            return;
        }
        setIsLoading(true);
        setError(null);
        setResultImage(null);
        addPromptToHistory(prompt);
        try {
            const imageHash = await hashFile(sourceImage);
            const promptHash = await sha256(`${prompt}:${negativePrompt}`);
            const cacheKey = `productPhotography:${imageHash}:${promptHash}`;
            
            setLoadingMessage('Verificando cache...');
            const cachedBlob = await db.loadImageFromCache(cacheKey);
            if (cachedBlob) {
                setResultImage(URL.createObjectURL(cachedBlob));
                setToast({ message: 'Imagem carregada do cache!', type: 'info' });
                setIsLoading(false);
                setLoadingMessage(null);
                return;
            }
            
            setLoadingMessage('Produzindo sua foto...');
            let fullPrompt = prompt;
            if (negativePrompt.trim()) {
                fullPrompt += `. Evite o seguinte: ${negativePrompt}`;
            }
            const result = await generateProductPhoto(sourceImage, fullPrompt);
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

    const handleDownload = () => {
        if (!resultImage) return;
        const link = document.createElement('a');
        link.href = resultImage;
        link.download = `produto-${Date.now()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleUseInEditor = () => {
        if (!resultImage) return;
        const file = dataURLtoFile(resultImage, `produto-${Date.now()}.png`);
        setInitialImage(file);
        setActiveTool(null); // Fecha o modal da ferramenta
        setToast({ message: "Imagem carregada no editor!", type: 'success' });
    };

    return (
        <div className="p-4 md:p-6 flex flex-col md:flex-row gap-6 h-full">
            <aside className="w-full md:w-96 flex-shrink-0 bg-gray-900/30 rounded-lg p-4 flex flex-col gap-4 border border-gray-700/50 overflow-y-auto scrollbar-thin">
                <div className="text-center">
                    <h3 className="text-lg font-semibold text-gray-200">Fotografia de Produto AI</h3>
                    <p className="text-sm text-gray-400 mt-1">Gere fotos de produtos com qualidade de estúdio.</p>
                </div>
                <ImageDropzone 
                    imageFile={sourceImage}
                    onFileSelect={handleFileSelect}
                    label="Imagem do Produto (PNG)"
                />
                
                <CollapsiblePromptPanel
                    title="Descrição do Cenário"
                    prompt={prompt}
                    setPrompt={setPrompt}
                    negativePrompt={negativePrompt}
                    onNegativePromptChange={(e) => setNegativePrompt(e.target.value)}
                    isLoading={isLoading}
                    toolId="productPhotography"
                    promptPlaceholder="Ex: em uma mesa de mármore com uma orquídea ao lado..."
                    promptHelperText='Seja descritivo sobre o fundo, iluminação e atmosfera.'
                    negativePromptHelperText="Ex: pessoas, reflexos indesejados."
                />

                <button
                    onClick={handleGenerate}
                    disabled={isLoading || !sourceImage || !prompt.trim()}
                    className="w-full mt-auto bg-gradient-to-br from-yellow-600 to-orange-500 text-white font-bold py-3 px-5 rounded-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                    <SparkleIcon className="w-5 h-5" />
                    Gerar Foto do Produto
                </button>
            </aside>
            <main className="flex-grow bg-black/20 rounded-lg border border-gray-700/50 flex flex-col items-center justify-center p-4">
                <ResultViewer
                    isLoading={isLoading}
                    error={error}
                    resultImage={resultImage}
                    loadingMessage="Produzindo sua foto..."
                />
                {/* BLOCO DE BOTÕES ADICIONADO */}
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

export default ProductPhotographyPanel;