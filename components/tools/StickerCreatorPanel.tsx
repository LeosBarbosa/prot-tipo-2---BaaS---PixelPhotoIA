/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useEffect } from 'react';
import { useEditor } from '../../context/EditorContext';
import { generateSticker } from '../../services/geminiService';
import ResultViewer from './common/ResultViewer';
import { StickersIcon, DownloadIcon, BrushIcon } from '../icons';
import CollapsiblePromptPanel from './common/CollapsiblePromptPanel';
import ImageDropzone from './common/ImageDropzone';
import { dataURLtoFile } from '../../utils/imageUtils';

const StickerCreatorPanel: React.FC = () => {
    const { isLoading, error, setError, setIsLoading, baseImageFile, setInitialImage, setActiveTool, setToast } = useEditor();
    const [resultImage, setResultImage] = useState<string | null>(null);
    const [prompt, setPrompt] = useState('');
    const [negativePrompt, setNegativePrompt] = useState('');
    const [sourceImage, setSourceImage] = useState<File | null>(null);

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
        if (!prompt.trim() && !sourceImage) {
            setError("Forneça um prompt ou uma imagem de referência para criar um adesivo.");
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
            const result = await generateSticker(fullPrompt, sourceImage ?? undefined);
            setResultImage(result);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Ocorreu um erro desconhecido.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleDownload = () => {
        if (!resultImage) return;
        const link = document.createElement('a');
        link.href = resultImage;
        link.download = `adesivo-${Date.now()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleUseInEditor = () => {
        if (!resultImage) return;
        const file = dataURLtoFile(resultImage, `adesivo-${Date.now()}.png`);
        setInitialImage(file);
        setActiveTool(null);
        setToast({ message: "Imagem carregada no editor!", type: 'success' });
    };

    return (
        <div className="p-4 md:p-6 flex flex-col md:flex-row gap-6">
            <aside className="w-full md:w-96 flex-shrink-0 bg-gray-900/30 rounded-lg p-4 flex flex-col gap-4 border border-gray-700/50">
                <div className="text-center">
                    <h3 className="text-lg font-semibold text-gray-200">Criador de Adesivos AI</h3>
                    <p className="text-sm text-gray-400 mt-1">Gere adesivos a partir de um texto ou imagem.</p>
                </div>
                 <ImageDropzone
                    imageFile={sourceImage}
                    onFileSelect={handleFileSelect}
                    label="Imagem de Referência (Opcional)"
                />
                 <CollapsiblePromptPanel
                  title="Descrição do Adesivo"
                  prompt={prompt}
                  setPrompt={setPrompt}
                  negativePrompt={negativePrompt}
                  onNegativePromptChange={(e) => setNegativePrompt(e.target.value)}
                  isLoading={isLoading}
                  toolId="stickerCreator"
                  promptHelperText="Descreva seu adesivo. Estilos sugeridos: fofo, vintage, neon. A IA adicionará automaticamente uma borda branca espessa."
                  negativePromptHelperText="Ex: fundo, sombras complexas, texto indesejado."
                />
                <button
                    onClick={handleGenerate}
                    disabled={isLoading || (!prompt.trim() && !sourceImage)}
                    className="w-full mt-auto bg-gradient-to-br from-pink-600 to-rose-500 text-white font-bold py-3 px-5 rounded-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                    <StickersIcon className="w-5 h-5" />
                    Gerar Adesivo
                </button>
            </aside>
            <main className="flex-grow bg-black/20 rounded-lg border border-gray-700/50 flex flex-col items-center justify-center p-4">
                <ResultViewer
                    isLoading={isLoading}
                    error={error}
                    resultImage={resultImage}
                    loadingMessage="Criando seu adesivo..."
                />
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

export default StickerCreatorPanel;