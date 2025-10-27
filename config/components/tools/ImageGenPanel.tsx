/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useEffect } from 'react';
import { useEditor } from '../../../context/EditorContext';
import { generateImageFromText, validatePromptSpecificity } from '../../../services/geminiService';
import ResultViewer from './common/ResultViewer';
import CollapsiblePromptPanel from './common/CollapsiblePromptPanel';
import PromptPresetPanel from './common/PromptPresetPanel';
import { dataURLtoFile } from '../../../utils/imageUtils';
import LazyIcon from '../LazyIcon';

const ImageGenPanel: React.FC = () => {
    const { isLoading, error, setError, setIsLoading, setLoadingMessage, setToast, addPromptToHistory, initialPromptFromMetadata, setInitialImage, setActiveTool, loadingMessage } = useEditor();
    const [resultImage, setResultImage] = useState<string | null>(null);
    const [prompt, setPrompt] = useState('Uma vasta biblioteca interior com livros que se estendem até um teto abobadado, feixes de luz empoeirados, estilo de fantasia cinematográfica, detalhado.');
    const [negativePrompt, setNegativePrompt] = useState('');
    const [aspectRatio, setAspectRatio] = useState('1:1');

    useEffect(() => {
        if (initialPromptFromMetadata) {
            setPrompt(initialPromptFromMetadata);
        }
    }, [initialPromptFromMetadata]);

    const aspectRatios: { id: string, name: string, icon: string }[] = [
        { id: '1:1', name: 'Quadrado', icon: 'AspectRatioSquareIcon' },
        { id: '16:9', name: 'Paisagem', icon: 'AspectRatioLandscapeIcon' },
        { id: '9:16', name: 'Retrato', icon: 'AspectRatioPortraitIcon' },
    ];

    const handleGenerate = async () => {
        if (!prompt.trim()) {
            setError("Por favor, digite um prompt para gerar a imagem.");
            return;
        }
        setIsLoading(true);
        setLoadingMessage('Analisando o prompt...');
        setError(null);
        setResultImage(null);
        addPromptToHistory(prompt);
        try {
            const { isSpecific, suggestion } = await validatePromptSpecificity(prompt, 'Gerador de Imagens AI');

            if (!isSpecific) {
                setToast({ message: suggestion, type: 'info' });
                setIsLoading(false);
                setLoadingMessage(null);
                return; // Interrompe a execução
            }

            let fullPrompt = prompt;
            if (negativePrompt.trim()) {
                fullPrompt += `. Evite o seguinte: ${negativePrompt}`;
            }
            const result = await generateImageFromText(fullPrompt, aspectRatio, setToast, setLoadingMessage);
            setResultImage(result);
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
        link.download = `gerada-${Date.now()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleUseInEditor = () => {
        if (!resultImage) return;
        const file = dataURLtoFile(resultImage, `gerada-${Date.now()}.png`);
        setInitialImage(file);
        setActiveTool(null);
        setToast({ message: "Imagem carregada no editor!", type: 'success' });
    };

    return (
        <div className="p-4 md:p-6 flex flex-col md:flex-row gap-6">
            <aside className="w-full md:max-w-md flex-shrink-0 bg-gray-900/30 rounded-lg p-6 flex flex-col gap-6 border border-gray-700/50">
                <div className="text-center">
                    <h3 className="text-xl font-bold text-gray-100">Gerador de Imagens AI</h3>
                    <p className="text-sm text-gray-400 mt-1">Crie imagens a partir de descrições de texto.</p>
                </div>
                
                <CollapsiblePromptPanel
                  title="Prompt & Configurações"
                  prompt={prompt}
                  setPrompt={setPrompt}
                  negativePrompt={negativePrompt}
                  onNegativePromptChange={(e) => setNegativePrompt(e.target.value)}
                  isLoading={isLoading}
                  toolId="imageGen"
                  promptPlaceholder="Ex: um astronauta surfando em uma onda cósmica..."
                  promptHelperText="Adicione estilo (ex: 'fotorrealista'), iluminação e detalhes da câmera para melhores resultados."
                  negativePromptHelperText="Ex: texto, desfocado, baixa qualidade."
                />

                <PromptPresetPanel 
                    toolId="imageGen"
                    onSelectPreset={(selectedPrompt) => setPrompt(selectedPrompt)}
                    isLoading={isLoading}
                />

                <div>
                    <label className="block text-sm font-semibold text-gray-200 mb-2">Proporção da Imagem</label>
                    <div className="grid grid-cols-3 gap-3">
                        {aspectRatios.map(({ id, name, icon }) => (
                            <button 
                                key={id} 
                                type="button" 
                                onClick={() => setAspectRatio(id)} 
                                disabled={isLoading} 
                                className={`p-3 rounded-lg text-sm font-semibold transition-all flex flex-col items-center justify-center gap-2 aspect-square ${aspectRatio === id ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'bg-gray-800/70 hover:bg-gray-700/70 text-gray-300'}`}
                                aria-label={name}
                            >
                                <LazyIcon name={icon} className="w-6 h-6" />
                                <span>{name}</span>
                            </button>
                        ))}
                    </div>
                </div>

                <button
                    onClick={handleGenerate}
                    disabled={isLoading || !prompt.trim()}
                    className="w-full mt-auto bg-gradient-to-br from-purple-600 to-indigo-500 text-white font-bold py-3 px-5 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-lg active:scale-95"
                >
                    <LazyIcon name="PhotoIcon" className={`w-6 h-6 ${isLoading ? 'animate-pulse' : ''}`} />
                    {isLoading ? 'Gerando...' : 'Gerar Imagem'}
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

export default ImageGenPanel;