/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useEffect } from 'react';
import { useEditor, useLoadingError } from '../../context/EditorContext';
import { generateProductPhoto } from '../../services/geminiService';
import ImageDropzone from './common/ImageDropzone';
import ResultViewer from './common/ResultViewer';
import { SparkleIcon } from '../icons';
import CollapsibleToolPanel from '../CollapsibleToolPanel';
import PromptEnhancer from './common/PromptEnhancer';

const ProductPhotographyPanel: React.FC = () => {
    const { isLoading, error, setError, setIsLoading } = useLoadingError();
    const { currentImage, setInitialImage } = useEditor();
    const [sourceImage, setSourceImage] = useState<File | null>(null);
    const [resultImage, setResultImage] = useState<string | null>(null);
    const [prompt, setPrompt] = useState('');
    const [isPromptExpanded, setIsPromptExpanded] = useState(true);

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
        try {
            const result = await generateProductPhoto(sourceImage, prompt);
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
                    <h3 className="text-lg font-semibold text-gray-200">Fotografia de Produto AI</h3>
                    <p className="text-sm text-gray-400 mt-1">Crie fotos de produtos com qualidade de estúdio.</p>
                </div>
                <ImageDropzone 
                    imageFile={sourceImage}
                    onFileSelect={handleFileSelect}
                    label="Imagem do Produto"
                />
                
                <CollapsibleToolPanel
                    title="Descrição do Cenário"
                    icon={<SparkleIcon className="w-5 h-5" />}
                    isExpanded={isPromptExpanded}
                    onExpandToggle={() => setIsPromptExpanded(!isPromptExpanded)}
                >
                    <div className="relative">
                        <textarea
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            placeholder="Ex: em uma mesa de mármore com uma planta desfocada ao fundo, em uma praia com a luz do pôr do sol..."
                            className="w-full bg-gray-800 border border-gray-600 rounded-lg p-3 pr-12 text-base min-h-[120px]"
                            disabled={isLoading}
                            rows={5}
                        />
                        <PromptEnhancer prompt={prompt} setPrompt={setPrompt} toolId="productPhotography" />
                    </div>
                </CollapsibleToolPanel>
                
                <button
                    onClick={handleGenerate}
                    disabled={isLoading || !sourceImage || !prompt.trim()}
                    className="w-full mt-auto bg-gradient-to-br from-yellow-600 to-orange-500 text-white font-bold py-3 px-5 rounded-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                    <SparkleIcon className="w-5 h-5" />
                    Gerar Foto
                </button>
            </aside>
            <main className="flex-grow bg-black/20 rounded-lg border border-gray-700/50 flex items-center justify-center p-4">
                <ResultViewer
                    isLoading={isLoading}
                    error={error}
                    resultImage={resultImage}
                    loadingMessage="Produzindo sua foto..."
                />
            </main>
        </div>
    );
};

export default ProductPhotographyPanel;