/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useEffect } from 'react';
import { useEditor } from '../../context/EditorContext';
import { generateMagicMontage } from '../../services/geminiService';
import ImageDropzone from './common/ImageDropzone';
import ResultViewer from './common/ResultViewer';
import { MagicWandIcon, DownloadIcon, BrushIcon, LayersIcon } from '../icons';
import CollapsiblePromptPanel from './common/CollapsiblePromptPanel';
import { dataURLtoFile } from '../../utils/imageUtils';
import TipBox from '../common/TipBox';

const MagicMontagePanel: React.FC = () => {
    const { 
        isLoading, 
        error, 
        setError, 
        setIsLoading,
        currentImage,
        setInitialImage,
        setActiveTool,
        setToast,
    } = useEditor();
    const [sourceImage, setSourceImage] = useState<File | null>(null);
    const [secondImage, setSecondImage] = useState<File | null>(null);
    const [resultImage, setResultImage] = useState<string | null>(null);
    const [prompt, setPrompt] = useState('');
    const [negativePrompt, setNegativePrompt] = useState('');

    useEffect(() => {
        if (currentImage && !sourceImage) {
            setSourceImage(currentImage);
        }
    }, [currentImage, sourceImage]);

    const handleSourceFileSelect = (file: File | null) => {
        setSourceImage(file);
        if (file) {
            setInitialImage(file);
        }
        setResultImage(null);
    };

    const handleGenerate = async () => {
        if (!sourceImage) {
            setError("Por favor, carregue uma imagem para editar.");
            return;
        }
        if (!prompt.trim()) {
            setError("Por favor, descreva a edição desejada.");
            return;
        }
        setIsLoading(true);
        setError(null);
        setResultImage(null);
        try {
            let fullPrompt = prompt;
            if (secondImage) {
                fullPrompt = `Usando a primeira imagem (principal) como base e a segunda imagem (opcional) como um elemento a ser adicionado/combinado, siga estas instruções: ${prompt}`;
            }
            if (negativePrompt.trim()) {
                fullPrompt += `. Evite o seguinte: ${negativePrompt}`;
            }
            const result = await generateMagicMontage(sourceImage, fullPrompt, secondImage || undefined);
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
        link.download = `montagem-magica-${Date.now()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleUseInEditor = () => {
        if (!resultImage) return;
        const file = dataURLtoFile(resultImage, `montagem-magica-${Date.now()}.png`);
        setInitialImage(file);
        setActiveTool('adjust');
    };

    const handleCreateVariation = () => {
        if (!resultImage) return;

        const newSourceFile = dataURLtoFile(resultImage, `variation-base-${Date.now()}.png`);
        
        setSourceImage(newSourceFile);
        setSecondImage(null);
        setResultImage(null);
        setPrompt('');
        setNegativePrompt('');
        
        if (setToast) {
            setToast({
                message: "Resultado definido como imagem base. Descreva sua próxima edição.",
                type: 'info',
            });
        }
    };

    return (
        <div className="p-4 md:p-6 flex flex-col md:flex-row gap-6">
            <main className="h-3/5 md:h-auto flex-grow bg-black/20 rounded-lg border border-gray-700/50 flex flex-col items-center justify-center p-4 md:order-2">
                <ResultViewer
                    isLoading={isLoading}
                    error={error}
                    resultImage={resultImage}
                    loadingMessage="Realizando a mágica..."
                />
                {resultImage && !isLoading && (
                    <div className="mt-4 flex flex-wrap justify-center gap-3 animate-fade-in">
                        <button
                            onClick={handleDownload}
                            className="flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-gray-200 font-semibold py-2 px-4 rounded-md transition-colors text-sm"
                        >
                            <DownloadIcon className="w-5 h-5" />
                            Baixar Imagem
                        </button>
                        <button
                            onClick={handleCreateVariation}
                            className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-500 text-white font-bold py-2 px-4 rounded-md transition-colors text-sm"
                        >
                            <LayersIcon className="w-5 h-5" />
                            Criar Variação
                        </button>
                        <button
                            onClick={handleUseInEditor}
                            className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-4 rounded-md transition-colors text-sm"
                        >
                             <BrushIcon className="w-5 h-5" />
                            Usar no Editor
                        </button>
                    </div>
                )}
            </main>
            <aside className="h-2/5 md:h-auto w-full md:w-96 flex-shrink-0 bg-gray-900/30 rounded-lg p-4 flex flex-col gap-4 border border-gray-700/50 md:order-1 overflow-y-auto scrollbar-thin">
                <div className="text-center">
                    <h3 className="text-lg font-semibold text-gray-200">Montagem Mágica ✨</h3>
                    <p className="text-sm text-gray-400 mt-1">Descreva qualquer edição e deixe a IA transformar sua foto.</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <ImageDropzone 
                        imageFile={sourceImage}
                        onFileSelect={handleSourceFileSelect}
                        label="Imagem Principal"
                    />
                    <ImageDropzone 
                        imageFile={secondImage}
                        onFileSelect={setSecondImage}
                        label="Imagem Opcional"
                    />
                </div>
                
                <CollapsiblePromptPanel
                  title="Descrição da Edição"
                  prompt={prompt}
                  setPrompt={setPrompt}
                  negativePrompt={negativePrompt}
                  onNegativePromptChange={(e) => setNegativePrompt(e.target.value)}
                  isLoading={isLoading}
                  toolId="magicMontage"
                />

                <TipBox>
                   Seja descritivo! Em vez de "adicione um chapéu", tente "adicione um chapéu de pirata preto com uma caveira branca". Use a imagem opcional para adicionar elementos de outra foto.
                </TipBox>
                
                <button
                    onClick={handleGenerate}
                    disabled={isLoading || !sourceImage || !prompt.trim()}
                    className="w-full mt-auto bg-gradient-to-br from-purple-600 to-indigo-500 text-white font-bold py-3 px-5 rounded-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                    <MagicWandIcon className="w-5 h-5" />
                    Gerar Montagem
                </button>
            </aside>
        </div>
    );
};

export default MagicMontagePanel;