/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useEffect } from 'react';
import { useEditor } from '../../../context/EditorContext';
import { renderSketch } from '../../../services/geminiService';
import ImageDropzone from './common/ImageDropzone';
import ResultViewer from './common/ResultViewer';
import CollapsiblePromptPanel from './common/CollapsiblePromptPanel';
import * as db from '../../../utils/db';
import { dataURLtoFile } from '../../../utils/imageUtils';
import { hashFile, sha256 } from '../../../utils/cryptoUtils';
import LazyIcon from '../LazyIcon';

const SketchRenderPanel: React.FC = () => {
    const { isLoading, error, setError, setIsLoading, addPromptToHistory, baseImageFile, setInitialImage, setToast, setLoadingMessage, setActiveTool, loadingMessage } = useEditor();
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

    const handleFileSelect = (files: File[]) => {
        const file = files[0] || null;
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
            let fullPrompt = prompt;
            if (negativePrompt.trim()) {
                fullPrompt += `. Evite o seguinte: ${negativePrompt}`;
            }
            const resultDataUrl = await renderSketch(sketchImage, fullPrompt, setToast, setLoadingMessage);
            setResultImage(resultDataUrl);
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
                    <p className="text-sm text-gray-400 mt-1">Transforme desenhos em imagens realistas.</p>
                </div>
                <ImageDropzone
                    files={sketchImage ? [sketchImage] : []}
                    onFilesChange={handleFileSelect}
                    label="Seu Esboço"
                />
                <CollapsiblePromptPanel
                  title="Descrição da Renderização"
                  prompt={prompt}
                  setPrompt={setPrompt}
                  negativePrompt={negativePrompt}
                  onNegativePromptChange={(e) => setNegativePrompt(e.target.value)}
                  isLoading={isLoading}
                  toolId="sketchRender"
                  promptPlaceholder="Ex: renderização fotorrealista de um tênis esportivo..."
                  promptHelperText="Descreva materiais, texturas e iluminação."
                  negativePromptHelperText="Ex: fundo complexo, estilo de desenho animado."
                />
                <button
                    onClick={handleGenerate}
                    disabled={isLoading || !sketchImage || !prompt.trim()}
                    className="w-full mt-auto bg-gradient-to-br from-blue-600 to-indigo-500 text-white font-bold py-3 px-5 rounded-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                    <LazyIcon name="BrushIcon" className="w-5 h-5" />
                    Renderizar Esboço
                </button>
            </aside>
            <main className="flex-grow bg-black/20 rounded-lg border border-gray-700/50 flex flex-col items-center justify-center p-4">
                <ResultViewer
                    isLoading={isLoading}
                    error={error}
                    resultImage={resultImage}
                    loadingMessage={loadingMessage}
                />
            </main>
        </div>
    );
};

export default SketchRenderPanel;