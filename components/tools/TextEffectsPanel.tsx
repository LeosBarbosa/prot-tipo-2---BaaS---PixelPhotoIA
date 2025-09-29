/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useEffect } from 'react';
import { useEditor, useLoadingError } from '../../context/EditorContext';
import { applyTextEffect } from '../../services/geminiService';
import ImageDropzone from './common/ImageDropzone';
import ResultViewer from './common/ResultViewer';
import { TextEffectsIcon } from '../icons';
import CollapsiblePromptPanel from './common/CollapsiblePromptPanel';

const TextEffectsPanel: React.FC = () => {
    const { isLoading, error, setError, setIsLoading } = useLoadingError();
    const { currentImage, setInitialImage } = useEditor();
    const [sourceImage, setSourceImage] = useState<File | null>(null);
    const [resultImage, setResultImage] = useState<string | null>(null);
    const [prompt, setPrompt] = useState('');
    const [negativePrompt, setNegativePrompt] = useState('');

    useEffect(() => {
        if (currentImage && !sourceImage) {
            setSourceImage(currentImage);
        }
    }, [currentImage, sourceImage]);

    const handleFileSelect = (file: File | null) => {
        setSourceImage(file);
        if (file) {
            setInitialImage(file);
        }
        setResultImage(null);
    };

    const handleGenerate = async () => {
        if (!sourceImage) {
            setError("Por favor, carregue uma imagem com texto para aplicar o efeito.");
            return;
        }
        if (!prompt.trim()) {
            setError("Por favor, descreva o efeito de texto desejado.");
            return;
        }
        setIsLoading(true);
        setError(null);
        setResultImage(null);
        try {
            let fullPrompt = prompt;
            if (negativePrompt.trim()) {
                fullPrompt += `. Evite o seguinte: ${negativePrompt}`;
            }
            const result = await applyTextEffect(sourceImage, fullPrompt);
            setResultImage(result);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Ocorreu um erro desconhecido.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="p-4 md:p-6 flex flex-col md:flex-row gap-6">
            <aside className="w-full md:w-96 flex-shrink-0 bg-gray-900/30 rounded-lg p-4 flex flex-col gap-4 border border-gray-700/50">
                <div className="text-center">
                    <h3 className="text-lg font-semibold text-gray-200">Efeitos de Texto</h3>
                    <p className="text-sm text-gray-400 mt-1">Aplique efeitos visuais a um texto a partir de uma imagem.</p>
                </div>
                <ImageDropzone
                    imageFile={sourceImage}
                    onFileSelect={handleFileSelect}
                    label="Imagem com Texto"
                />
                <CollapsiblePromptPanel
                  title="Descrição do Efeito"
                  prompt={prompt}
                  setPrompt={setPrompt}
                  negativePrompt={negativePrompt}
                  onNegativePromptChange={(e) => setNegativePrompt(e.target.value)}
                  isLoading={isLoading}
                  toolId="textEffects"
                />
                <button
                    onClick={handleGenerate}
                    disabled={isLoading || !sourceImage || !prompt.trim()}
                    className="w-full mt-auto bg-gradient-to-br from-amber-600 to-yellow-500 text-white font-bold py-3 px-5 rounded-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                    <TextEffectsIcon className="w-5 h-5" />
                    Aplicar Efeito
                </button>
            </aside>
            <main className="flex-grow bg-black/20 rounded-lg border border-gray-700/50 flex items-center justify-center p-4">
                <ResultViewer
                    isLoading={isLoading}
                    error={error}
                    resultImage={resultImage}
                    loadingMessage="Aplicando efeito ao seu texto..."
                />
            </main>
        </div>
    );
};

export default TextEffectsPanel;