/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useEffect } from 'react';
import { useEditor } from '../../context/EditorContext';
import { renderSketch } from '../../services/geminiService';
import ImageDropzone from './common/ImageDropzone';
import ResultViewer from './common/ResultViewer';
import { BrushIcon } from '../icons';
import CollapsiblePromptPanel from './common/CollapsiblePromptPanel';
import * as db from '../../utils/db';
import { dataURLtoFile } from '../../utils/imageUtils';
import { hashFile, sha256 } from '../../utils/cryptoUtils';

const SketchRenderPanel: React.FC = () => {
    const { isLoading, error, setError, setIsLoading, addPromptToHistory, baseImageFile, setInitialImage, setToast, setLoadingMessage } = useEditor();
    const [sketchImage, setSketchImage] = useState<File | null>(null);
    const [resultImage, setResultImage] = useState<string | null>(null);
    const [prompt, setPrompt] = useState('');
    const [negativePrompt, setNegativePrompt] = useState('');

    useEffect(() => {
        if (baseImageFile && !sketchImage) {
            setSketchImage(baseImageFile);
        }
    }, [baseImageFile, sketchImage]);

    useEffect(() => {
        // Cleanup for object URLs
        return () => {
            if (resultImage && resultImage.startsWith('blob:')) {
                URL.revokeObjectURL(resultImage);
            }
        };
    }, [resultImage]);

    const handleFileSelect = (file: File | null) => {
        setSketchImage(file);
        if (file) {
            setInitialImage(file);
        }
        setResultImage(null);
    };

    const handleGenerate = async () => {
        if (!sketchImage) {
            setError("Por favor, carregue uma imagem de esboço.");
            return;
        }
        if (!prompt.trim()) {
            setError("Por favor, descreva o resultado desejado.");
            return;
        }
        setIsLoading(true);
        setError(null);
        setResultImage(null);
        addPromptToHistory(prompt);
        try {
            const imageHash = await hashFile(sketchImage);
            const promptHash = await sha256(`${prompt}:${negativePrompt}`);
            const cacheKey = `sketchRender:${imageHash}:${promptHash}`;

            setLoadingMessage('Verificando cache...');
            const cachedBlob = await db.loadImageFromCache(cacheKey);
            if (cachedBlob) {
                setResultImage(URL.createObjectURL(cachedBlob));
                setToast({ message: 'Imagem carregada do cache!', type: 'info' });
                setIsLoading(false);
                setLoadingMessage(null);
                return;
            }

            setLoadingMessage('Renderizando seu esboço...');
            let fullPrompt = prompt;
            if (negativePrompt.trim()) {
                fullPrompt += `. Evite o seguinte: ${negativePrompt}`;
            }
            const result = await renderSketch(sketchImage, fullPrompt);
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

    return (
        <div className="p-4 md:p-6 flex flex-col md:flex-row gap-6">
            <aside className="w-full md:w-96 flex-shrink-0 bg-gray-900/30 rounded-lg p-4 flex flex-col gap-4 border border-gray-700/50">
                <div className="text-center">
                    <h3 className="text-lg font-semibold text-gray-200">Renderização de Esboço</h3>
                    <p className="text-sm text-gray-400 mt-1">Transforme seus desenhos em imagens realistas.</p>
                </div>
                <ImageDropzone 
                    imageFile={sketchImage}
                    onFileSelect={handleFileSelect}
                    label="Seu Esboço"
                />
                
                <CollapsiblePromptPanel
                    title="Descrição do Render"
                    prompt={prompt}
                    setPrompt={setPrompt}
                    negativePrompt={negativePrompt}
                    onNegativePromptChange={(e) => setNegativePrompt(e.target.value)}
                    isLoading={isLoading}
                    toolId="sketchRender"
                    promptPlaceholder="Ex: render 3D de um tênis esportivo..."
                    promptHelperText="Especifique materiais (ex: metal escovado), texturas e ambiente para um resultado fotorrealista."
                    negativePromptHelperText="Ex: distorcido, cores erradas, desfocado."
                />
                
                <button
                    onClick={handleGenerate}
                    disabled={isLoading || !sketchImage || !prompt.trim()}
                    className="w-full mt-auto bg-gradient-to-br from-blue-600 to-sky-500 text-white font-bold py-3 px-5 rounded-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                    <BrushIcon className="w-5 h-5" />
                    Renderizar
                </button>
            </aside>
            <main className="flex-grow bg-black/20 rounded-lg border border-gray-700/50 flex items-center justify-center p-4">
                <ResultViewer
                    isLoading={isLoading}
                    error={error}
                    resultImage={resultImage}
                    loadingMessage="Renderizando seu esboço..."
                />
            </main>
        </div>
    );
};

export default SketchRenderPanel;