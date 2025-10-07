/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useEffect } from 'react';
import { useEditor } from '../../context/EditorContext';
import { convertToVector } from '../../services/geminiService';
import ImageDropzone from './common/ImageDropzone';
import ResultViewer from './common/ResultViewer';
import { VectorIcon } from '../icons';
import CollapsibleToolPanel from '../CollapsibleToolPanel';
import PromptEnhancer from './common/PromptEnhancer';

const VectorConverterPanel: React.FC = () => {
    const { isLoading, error, setError, setIsLoading, baseImageFile, setInitialImage } = useEditor();
    const [sourceImage, setSourceImage] = useState<File | null>(null);
    const [resultImage, setResultImage] = useState<string | null>(null);
    const [prompt, setPrompt] = useState('');
    const [isOptionsExpanded, setIsOptionsExpanded] = useState(true);

    useEffect(() => {
        if (baseImageFile && !sourceImage) {
            setSourceImage(baseImageFile);
        }
    }, [baseImageFile, sourceImage]);

    const handleFileSelect = (file: File | null) => {
        setSourceImage(file);
        if (file) {
            setInitialImage(file);
        }
        setResultImage(null);
    };

    const handleGenerate = async () => {
        if (!sourceImage) {
            setError("Por favor, carregue uma imagem para vetorizar.");
            return;
        }
        setIsLoading(true);
        setError(null);
        setResultImage(null);
        try {
            const result = await convertToVector(sourceImage, prompt);
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
                    <h3 className="text-lg font-semibold text-gray-200">Conversor de Vetor</h3>
                    <p className="text-sm text-gray-400 mt-1">Converta imagens para um estilo de arte vetorial.</p>
                </div>
                <ImageDropzone
                    imageFile={sourceImage}
                    onFileSelect={handleFileSelect}
                    label="Imagem Original"
                />
                 <CollapsibleToolPanel
                    title="Estilo do Vetor (Opcional)"
                    icon={<VectorIcon className="w-5 h-5" />}
                    isExpanded={isOptionsExpanded}
                    onExpandToggle={() => setIsOptionsExpanded(!isOptionsExpanded)}
                >
                    <div>
                        <div className="relative">
                            <textarea
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                placeholder="Ex: estilo de adesivo, cores vibrantes, arte de linha minimalista..."
                                className="w-full bg-gray-800 border border-gray-600 rounded-lg p-3 pr-12 text-base min-h-[100px]"
                                disabled={isLoading}
                                rows={4}
                            />
                            <PromptEnhancer prompt={prompt} setPrompt={setPrompt} toolId="vectorConverter" />
                        </div>
                         <p className="mt-1 text-xs text-gray-500 px-1">Dê instruções sobre o peso da linha, paleta de cores (ex: chapada, gradiente) e nível de detalhe.</p>
                    </div>
                </CollapsibleToolPanel>
                <button
                    onClick={handleGenerate}
                    disabled={isLoading || !sourceImage}
                    className="w-full mt-auto bg-gradient-to-br from-orange-600 to-red-500 text-white font-bold py-3 px-5 rounded-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                    <VectorIcon className="w-5 h-5" />
                    Converter para Vetor
                </button>
            </aside>
            <main className="flex-grow bg-black/20 rounded-lg border border-gray-700/50 flex items-center justify-center p-4">
                <ResultViewer
                    isLoading={isLoading}
                    error={error}
                    resultImage={resultImage}
                    loadingMessage="Vetorizando sua imagem..."
                />
            </main>
        </div>
    );
};

export default VectorConverterPanel;